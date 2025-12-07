/**
 * Simplex Noise 3D and Curl Noise Functions
 * Based on Stefan Gustavson's Simplex Noise implementation
 * Curl Noise computes the curl of Simplex Noise for divergence-free vector fields
 */

// Permutation table for Simplex Noise
// Moved inside functions to ensure WebGL1 compatibility

// Permutation polynomial
vec4 mod289(vec4 x) {
	return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 mod289(vec3 x) {
	return x - floor(x * (1.0 / 289.0)) * 289.0;
}

float mod289(float x) {
	return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
	return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r) {
	return 1.79284291400159 - 0.85373472095314 * r;
}

/**
 * 3D Simplex Noise
 * Returns value in range approximately [-1, 1]
 * @param v Input 3D position
 * @return Noise value
 */
float snoise3D(vec3 v) {
	const vec2 C = vec2(1.0/6.0, 1.0/3.0);
	const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

	// First corner
	vec3 i = floor(v + dot(v, C.yyy));
	vec3 x0 = v - i + dot(i, C.xxx);

	// Other corners
	vec3 g = step(x0.yzx, x0.xyz);
	vec3 l = 1.0 - g;
	vec3 i1 = min(g.xyz, l.zxy);
	vec3 i2 = max(g.xyz, l.zxy);

	vec3 x1 = x0 - i1 + C.xxx;
	vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
	vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

	// Permutations
	i = mod289(i);
	vec4 p = permute(permute(permute(
		i.z + vec4(0.0, i1.z, i2.z, 1.0))
		+ i.y + vec4(0.0, i1.y, i2.y, 1.0))
		+ i.x + vec4(0.0, i1.x, i2.x, 1.0));

	// Gradients: 7x7 points over a square, mapped onto an octahedron.
	// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
	float n_ = 0.142857142857; // 1.0/7.0
	vec3 ns = n_ * D.wyz - D.xzx;

	vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  // mod(p,7*7)

	vec4 x_ = floor(j * ns.z);
	vec4 y_ = floor(j - 7.0 * x_);    // mod(j,N)

	vec4 x = x_ *ns.x + ns.yyyy;
	vec4 y = y_ *ns.x + ns.yyyy;
	vec4 h = 1.0 - abs(x) - abs(y);

	vec4 b0 = vec4(x.xy, y.xy);
	vec4 b1 = vec4(x.zw, y.zw);

	vec4 s0 = floor(b0)*2.0 + 1.0;
	vec4 s1 = floor(b1)*2.0 + 1.0;
	vec4 sh = -step(h, vec4(0.0));

	vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
	vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

	vec3 p0 = vec3(a0.xy, h.x);
	vec3 p1 = vec3(a0.zw, h.y);
	vec3 p2 = vec3(a1.xy, h.z);
	vec3 p3 = vec3(a1.zw, h.w);

	// Normalise gradients
	vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
	p0 *= norm.x;
	p1 *= norm.y;
	p2 *= norm.z;
	p3 *= norm.w;

	// Mix final noise value
	vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
	m = m * m;
	return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

/**
 * Compute gradient of Simplex Noise using finite differences
 * Used for Curl Noise computation
 * @param p Input 3D position
 * @param eps Small epsilon for finite differences
 * @return Gradient vector (∇Noise)
 */
vec3 noiseGradient(vec3 p, float eps) {
	float n0 = snoise3D(p);
	float nx = snoise3D(p + vec3(eps, 0.0, 0.0));
	float ny = snoise3D(p + vec3(0.0, eps, 0.0));
	float nz = snoise3D(p + vec3(0.0, 0.0, eps));
	
	return vec3(
		(nx - n0) / eps,
		(ny - n0) / eps,
		(nz - n0) / eps
	);
}

/**
 * Curl Noise
 * Computes the curl of Simplex Noise: curl = ∇ × Noise
 * This creates a divergence-free vector field (fluid-like, no clustering/exploding)
 * Formula: curl = (dF/dy - dF/dz, dF/dz - dF/dx, dF/dx - dF/dy)
 * 
 * @param p Input 3D position
 * @param scale Noise scale factor
 * @param eps Epsilon for finite differences (typically 0.01)
 * @return Curl vector (divergence-free velocity field)
 */
vec3 curlNoise(vec3 p, float scale, float eps) {
	// Scale position for noise sampling
	vec3 scaledP = p * scale;
	
	// Compute partial derivatives using finite differences
	// We sample noise at offset positions to compute gradients
	float eps2 = eps * 2.0;
	
	// Sample noise at 6 points for gradient computation
	float n_xp = snoise3D(scaledP + vec3(eps, 0.0, 0.0));
	float n_xm = snoise3D(scaledP - vec3(eps, 0.0, 0.0));
	float n_yp = snoise3D(scaledP + vec3(0.0, eps, 0.0));
	float n_ym = snoise3D(scaledP - vec3(0.0, -eps, 0.0));
	float n_zp = snoise3D(scaledP + vec3(0.0, 0.0, eps));
	float n_zm = snoise3D(scaledP - vec3(0.0, 0.0, -eps));
	
	// Compute partial derivatives
	float dFdx = (n_xp - n_xm) / eps2;
	float dFdy = (n_yp - n_ym) / eps2;
	float dFdz = (n_zp - n_zm) / eps2;
	
	// Curl: (dF/dy - dF/dz, dF/dz - dF/dx, dF/dx - dF/dy)
	return vec3(
		dFdy - dFdz,
		dFdz - dFdx,
		dFdx - dFdy
	);
}

/**
 * Animated Curl Noise
 * Adds time-based animation to the curl field
 * @param p Input 3D position
 * @param time Time value for animation
 * @param scale Noise scale factor
 * @param speed Animation speed
 * @return Animated curl vector
 */
vec3 curlNoiseAnimated(vec3 p, float time, float scale, float speed) {
	// Offset position by time for animation
	vec3 animatedP = p + vec3(time * speed, time * speed * 0.7, time * speed * 0.3);
	return curlNoise(animatedP, scale, 0.01);
}
