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
uniform float uFieldType; // 0 = CURL_NOISE, 1 = LORENZ, 2 = AIZAWA
uniform float uAttractorStrength;
uniform float uOutputMode; // 0 = output position, 1 = output velocity

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
		// Curl noise creates organic, fluid-like motion without clustering or exploding
		// Scale down position to make noise features larger relative to particle cloud
		vectorField = curlNoiseAnimated(position * 0.4, uTime, uNoiseScale, uNoiseSpeed) * 5.0; 
		
	} else if (uFieldType < 1.5) {
		// LORENZ Attractor
		// Parameters: σ = 10, ρ = 28, β = 8/3
		float sigma = 10.0;
		float rho = 28.0;
		float beta = 8.0 / 3.0;
		
		// Lorenz equations: dx/dt = σ(y - x), dy/dt = x(ρ - z) - y, dz/dt = xy - βz
		vectorField = vec3(
			sigma * (position.y - position.x),
			position.x * (rho - position.z) - position.y,
			position.x * position.y - beta * position.z
		);
	} else {
		// AIZAWA Attractor
		// Parameters: a = 0.95, b = 0.7, c = 0.6, d = 3.5, e = 0.25, f = 0.1
		float a = 0.95;
		float b = 0.7;
		float c = 0.6;
		float d = 3.5;
		float e = 0.25;
		float f = 0.1;
		
		// Aizawa equations
		vectorField = vec3(
			(position.z - b) * position.x - d * position.y,
			d * position.x + (position.z - b) * position.y,
			c + a * position.z - (position.z * position.z * position.z) / 3.0 - (position.x * position.x + position.y * position.y) * (1.0 + e * position.z) + f * position.z * position.x * position.x * position.x
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
	
	// Apply damping in CURL_NOISE mode (already handled above conditionally)
	if (uFieldType < 0.5) {
		newVelocity *= 0.98; // Reduced friction (was 0.96) to allow more gliding
	}

	// Step 2: Update position using average velocity
	// p_new = p_old + (v_old + v_new) / 2 * dt
	vec3 avgVelocity = (velocity + newVelocity) * 0.5;
	vec3 newPosition = position + avgVelocity * uDeltaTime;
	
	// Output based on mode
	if (uOutputMode < 0.5) {
		// POSITON UPDATE PASS (Step 2)
		// Explicitly calculate new position using the calculated velocity
		// p_new = p_old + v_new * dt
		vec3 finalPosition = position + newVelocity * uDeltaTime;
		
		// Output position (RGBA: x, y, z, lifetime)
		gl_FragColor = vec4(finalPosition, lifetime);
	} else {
		// VELOCITY UPDATE PASS (Step 1)
		// Output velocity (RGBA: vx, vy, vz, unused)
		gl_FragColor = vec4(newVelocity, 0.0);
	}
}
