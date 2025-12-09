/**
 * Simulation Fragment Shader
 * Physics computation (Velocity Verlet integration)
 * Phase 2.2: Curl Noise vector field implementation
 * Phase 2.3: Will add Strange Attractors (Lorenz, Aizawa)
 */

uniform sampler2D uPositionTexture;
uniform sampler2D uVelocityTexture;
uniform float uTime;
uniform float uDeltaTime;
uniform float uEntropy;
uniform float uNoiseScale;
uniform float uNoiseSpeed;
uniform float uNoiseStrength; // Intensity multiplier for curl noise
uniform float uPositionScale; // Position scale for curl noise (default: 0.35)
uniform float uFieldType; // 0 = CURL_NOISE, 1 = LORENZ, 2 = AIZAWA, 3 = RÖSSLER, 4 = CHEN, 5 = THOMAS, 6 = GRAVITY_GRID, 7 = HALVORSEN, 8 = FOUR_WING
uniform float uAttractorStrength;
uniform float uDamping; // Velocity damping factor (0.0 = no damping, 1.0 = full stop)
uniform float uBoundarySize; // Size of the boundary box (particles wrap/reset if outside)
uniform float uOutputMode; // 0 = output position, 1 = output velocity

// Lorenz Attractor parameters (σ, ρ, β)
uniform vec3 uLorenzParams; // x = sigma, y = rho, z = beta

// Aizawa Attractor parameters (a, b, c, d, e, f)
uniform vec3 uAizawaParams1; // x = a, y = b, z = c
uniform vec3 uAizawaParams2; // x = d, y = e, z = f

// Rössler Attractor parameters (a, b, c)
uniform vec3 uRoesslerParams; // x = a, y = b, z = c

// Chen Attractor parameters (a, b, c)
uniform vec3 uChenParams; // x = a, y = b, z = c

// Thomas Attractor parameter (b)
uniform float uThomasParam; // b = dissipation

// Gravity Grid parameters
uniform float uGravityGridSpacing; // Spacing between grid points
uniform float uGravityGridStrength; // Strength of gravitational attraction
uniform float uGravityGridDecay; // Distance decay exponent (higher = faster falloff)
uniform vec3 uGravityGridOffset; // Offset/position of the grid center
uniform float uGravityGridDimensions; // Number of grid points per dimension (approximate)

// Halvorsen Attractor parameter
uniform float uHalvorsenAlpha; // α parameter (typically 1.4 or 1.89)

// Four-Wing Attractor parameters (a, b, c, d, k)
uniform vec3 uFourWingParams1; // x = a, y = b, z = c
uniform vec2 uFourWingParams2; // x = d, y = k

varying vec2 vUv;

// Note: Simplex Noise and Curl Noise functions are included via noise.glsl
// which is prepended to this shader in SimulationPass.svelte

void main() {
	// Read current state from textures
	vec4 positionData = texture2D(uPositionTexture, vUv);
	vec4 velocityData = texture2D(uVelocityTexture, vUv);
	
	vec3 position = positionData.xyz;
	vec3 velocity = velocityData.xyz;
	float lifetime = positionData.w;
	
	// Phase 2.2-2.3: Vector Field Computation
	// Compute vector field based on selected type
	vec3 vectorField = vec3(0.0);
	
	if (uFieldType < 0.5) {
		// CURL_NOISE mode: Divergence-free fluid-like flow
		// Multi-layered curl noise creates balanced, organic motion without directional bias
		// Scale position to control noise feature size (smaller = larger features)
		// Use multi-layer curl noise for uniform, non-directional flow
		vectorField = curlNoiseMultiLayer(position * uPositionScale, uTime, uNoiseScale, uNoiseSpeed) * uNoiseStrength; 
		
	} else if (uFieldType < 1.5) {
		// LORENZ Attractor
		// Parameters: σ, ρ, β (configurable via uLorenzParams)
		float sigma = uLorenzParams.x;
		float rho = uLorenzParams.y;
		float beta = uLorenzParams.z;
		
		// Lorenz equations: dx/dt = σ(y - x), dy/dt = x(ρ - z) - y, dz/dt = xy - βz
		vectorField = vec3(
			sigma * (position.y - position.x),
			position.x * (rho - position.z) - position.y,
			position.x * position.y - beta * position.z
		);
	} else if (uFieldType < 2.5) {
		// AIZAWA Attractor
		// Parameters: a, b, c, d, e, f (configurable via uAizawaParams1 and uAizawaParams2)
		float a = uAizawaParams1.x;
		float b = uAizawaParams1.y;
		float c = uAizawaParams1.z;
		float d = uAizawaParams2.x;
		float e = uAizawaParams2.y;
		float f = uAizawaParams2.z;
		
		// Aizawa equations
		vectorField = vec3(
			(position.z - b) * position.x - d * position.y,
			d * position.x + (position.z - b) * position.y,
			c + a * position.z - (position.z * position.z * position.z) / 3.0 - (position.x * position.x + position.y * position.y) * (1.0 + e * position.z) + f * position.z * position.x * position.x * position.x
		);
	} else if (uFieldType < 3.5) {
		// RÖSSLER Attractor
		// Parameters: a, b, c (configurable via uRoesslerParams)
		// Classic chaotic attractor with spiral structure
		float a = uRoesslerParams.x;
		float b = uRoesslerParams.y;
		float c = uRoesslerParams.z;
		
		// Rössler equations: dx/dt = -y - z, dy/dt = x + ay, dz/dt = b + z(x - c)
		vectorField = vec3(
			-position.y - position.z,
			position.x + a * position.y,
			b + position.z * (position.x - c)
		);
	} else if (uFieldType < 4.5) {
		// CHEN Attractor
		// Parameters: a, b, c (configurable via uChenParams)
		// Similar to Lorenz but with different parameter values, produces different topology
		float a = uChenParams.x;
		float b = uChenParams.y;
		float c = uChenParams.z;
		
		// Chen equations: dx/dt = a(y - x), dy/dt = (c - a)x - xz + cy, dz/dt = xy - bz
		vectorField = vec3(
			a * (position.y - position.x),
			(c - a) * position.x - position.x * position.z + c * position.y,
			position.x * position.y - b * position.z
		);
	} else if (uFieldType < 5.5) {
		// THOMAS' Cyclically Symmetric Attractor
		// Parameters: b (configurable via uThomasParam)
		// Creates symmetric, cyclic patterns using sine functions
		float b = uThomasParam;
		
		// Thomas equations: dx/dt = sin(y) - bx, dy/dt = sin(z) - by, dz/dt = sin(x) - bz
		vectorField = vec3(
			sin(position.y) - b * position.x,
			sin(position.z) - b * position.y,
			sin(position.x) - b * position.z
		);
	} else if (uFieldType < 6.5) {
		// GRAVITY GRID
		// A structured lattice of gravitational attractors that deforms under attractive force
		// Particles are attracted to nearby grid points, creating structured patterns
		
		vec3 gridPos = position - uGravityGridOffset;
		
		// Calculate nearest grid point
		// Grid spacing determines the distance between attractor points
		float spacing = uGravityGridSpacing;
		
		// Find the nearest grid point in 3D space
		vec3 gridIndex = floor((gridPos + spacing * 0.5) / spacing);
		vec3 nearestGridPoint = gridIndex * spacing + uGravityGridOffset;
		
		// Calculate distance to nearest grid point
		vec3 toGridPoint = nearestGridPoint - position;
		float dist = length(toGridPoint);
		
		// Avoid division by zero
		float minDist = 0.001;
		dist = max(dist, minDist);
		
		// Calculate gravitational force (inverse square law with configurable decay)
		// F = G * m / r^n where n is the decay exponent
		float forceMagnitude = uGravityGridStrength / pow(dist, uGravityGridDecay);
		
		// Normalize direction and apply force
		vec3 direction = normalize(toGridPoint);
		vectorField = direction * forceMagnitude;
		
		// Add contributions from the 6 nearest neighbors (one per axis direction)
		// This creates smoother transitions between grid cells
		float neighborWeight = 0.2; // Weight for neighbor contributions
		
		// Sample 6 neighbors: +x, -x, +y, -y, +z, -z
		vec3 neighbor1 = (gridIndex + vec3(1.0, 0.0, 0.0)) * spacing + uGravityGridOffset;
		vec3 neighbor2 = (gridIndex + vec3(-1.0, 0.0, 0.0)) * spacing + uGravityGridOffset;
		vec3 neighbor3 = (gridIndex + vec3(0.0, 1.0, 0.0)) * spacing + uGravityGridOffset;
		vec3 neighbor4 = (gridIndex + vec3(0.0, -1.0, 0.0)) * spacing + uGravityGridOffset;
		vec3 neighbor5 = (gridIndex + vec3(0.0, 0.0, 1.0)) * spacing + uGravityGridOffset;
		vec3 neighbor6 = (gridIndex + vec3(0.0, 0.0, -1.0)) * spacing + uGravityGridOffset;
		
		// Calculate forces from each neighbor
		vec3 toNeighbor1 = neighbor1 - position;
		float dist1 = max(length(toNeighbor1), minDist);
		vectorField += normalize(toNeighbor1) * (uGravityGridStrength / pow(dist1, uGravityGridDecay)) * neighborWeight;
		
		vec3 toNeighbor2 = neighbor2 - position;
		float dist2 = max(length(toNeighbor2), minDist);
		vectorField += normalize(toNeighbor2) * (uGravityGridStrength / pow(dist2, uGravityGridDecay)) * neighborWeight;
		
		vec3 toNeighbor3 = neighbor3 - position;
		float dist3 = max(length(toNeighbor3), minDist);
		vectorField += normalize(toNeighbor3) * (uGravityGridStrength / pow(dist3, uGravityGridDecay)) * neighborWeight;
		
		vec3 toNeighbor4 = neighbor4 - position;
		float dist4 = max(length(toNeighbor4), minDist);
		vectorField += normalize(toNeighbor4) * (uGravityGridStrength / pow(dist4, uGravityGridDecay)) * neighborWeight;
		
		vec3 toNeighbor5 = neighbor5 - position;
		float dist5 = max(length(toNeighbor5), minDist);
		vectorField += normalize(toNeighbor5) * (uGravityGridStrength / pow(dist5, uGravityGridDecay)) * neighborWeight;
		
		vec3 toNeighbor6 = neighbor6 - position;
		float dist6 = max(length(toNeighbor6), minDist);
		vectorField += normalize(toNeighbor6) * (uGravityGridStrength / pow(dist6, uGravityGridDecay)) * neighborWeight;
	} else if (uFieldType < 7.5) {
		// HALVORSEN Attractor
		// Parameters: α (alpha) - configurable via uHalvorsenAlpha
		// Creates symmetric, cyclic patterns with quadratic terms
		float alpha = uHalvorsenAlpha;
		
		// Halvorsen equations:
		// dx/dt = -αx - 4y - 4z - y²
		// dy/dt = -αy - 4z - 4x - z²
		// dz/dt = -αz - 4x - 4y - x²
		vectorField = vec3(
			-alpha * position.x - 4.0 * position.y - 4.0 * position.z - position.y * position.y,
			-alpha * position.y - 4.0 * position.z - 4.0 * position.x - position.z * position.z,
			-alpha * position.z - 4.0 * position.x - 4.0 * position.y - position.x * position.x
		);
	} else {
		// FOUR-WING Attractor
		// Parameters: a, b, c, d, k (configurable via uFourWingParams1 and uFourWingParams2)
		// Creates a four-wing butterfly-like structure
		float a = uFourWingParams1.x;
		float b = uFourWingParams1.y;
		float c = uFourWingParams1.z;
		float d = uFourWingParams2.x;
		float k = uFourWingParams2.y;
		
		// Four-Wing equations:
		// dx/dt = ax + yz
		// dy/dt = by - xz
		// dz/dt = cz + dxy + k
		vectorField = vec3(
			a * position.x + position.y * position.z,
			b * position.y - position.x * position.z,
			c * position.z + d * position.x * position.y + k
		);
	}
	
	// Phase 2.4: Entropy Injection
	// Mix organized vector field with random noise based on entropy
	// Low entropy: pure vector field (organized flow)
	// High entropy: mix with high-frequency random noise (chaotic)
	vec3 randomNoise = vec3(
		fract(sin(dot(position.xyz, vec3(12.9898, 78.233, 54.53)) + uTime) * 43758.5453),
		fract(sin(dot(position.yzx, vec3(12.9898, 78.233, 54.53)) + uTime) * 43758.5453),
		fract(sin(dot(position.zxy, vec3(12.9898, 78.233, 54.53)) + uTime) * 43758.5453)
	) * 2.0 - 1.0; // Map from [0,1] to [-1,1]
	
	// Mix vector field with random noise based on entropy
	vec3 finalField = mix(vectorField, randomNoise, uEntropy);
	
	// Velocity Verlet Integration
	// Step 1: Update velocity using force field
	// v_new = v_old + a * dt (where a = force field)
	vec3 acceleration = finalField * uAttractorStrength;
	vec3 newVelocity = velocity + acceleration * uDeltaTime;
	
	// Apply damping (configurable per field type)
	// uDamping is the retention factor: 1.0 = no damping, 0.0 = full stop
	// Typical values: 0.98-0.99 for smooth fluid motion, 0.95-0.97 for more friction
	newVelocity *= uDamping;

	// Step 2: Update position using average velocity (Velocity Verlet)
	// p_new = p_old + (v_old + v_new) / 2 * dt
	// This uses the average of old and new velocity for better stability
	vec3 avgVelocity = (velocity + newVelocity) * 0.5;
	
	// Output based on mode
	if (uOutputMode < 0.5) {
		// POSITION UPDATE PASS (Step 2)
		// Use average velocity for position update (standard Velocity Verlet)
		// p_new = p_old + (v_old + v_new) / 2 * dt
		vec3 finalPosition = position + avgVelocity * uDeltaTime;
		
		// Boundary checking: wrap particles that go outside the boundary
		// This prevents particles from disappearing forever
		// Using modulo wrapping for seamless boundaries (toroidal space)
		float boundary = uBoundarySize;
		float boundary2 = boundary * 2.0;
		
		// Wrap each axis: shift to [0, 2*boundary], apply mod, shift back to [-boundary, boundary]
		finalPosition.x = mod(finalPosition.x + boundary, boundary2) - boundary;
		finalPosition.y = mod(finalPosition.y + boundary, boundary2) - boundary;
		finalPosition.z = mod(finalPosition.z + boundary, boundary2) - boundary;
		
		// Output position (RGBA: x, y, z, lifetime)
		gl_FragColor = vec4(finalPosition, lifetime);
	} else {
		// VELOCITY UPDATE PASS (Step 1)
		// Output velocity (RGBA: vx, vy, vz, unused)
		gl_FragColor = vec4(newVelocity, 0.0);
	}
}
