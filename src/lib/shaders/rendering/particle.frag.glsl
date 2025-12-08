/**
 * Particle Fragment Shader
 * Procedural coloring based on velocity (IQ Style Cosine Palettes)
 * Implements depth-based alpha fade and hue shift modulation
 */

varying vec3 vPosition;
varying vec3 vVelocity;
varying float vDepth;

// Uniforms for color control
uniform vec3 uColorPaletteA; // Bias (RGB)
uniform vec3 uColorPaletteB; // Amplitude (RGB)
uniform vec3 uColorPaletteC; // Frequency (RGB)
uniform vec3 uColorPaletteD; // Phase (RGB)
uniform float uColorIntensity; // Brightness multiplier
uniform float uHueShift; // Hue rotation in radians (0-2π)
uniform float uDepthFadeNear; // Near plane for depth fade
uniform float uDepthFadeFar; // Far plane for depth fade

// Cosine gradient function for procedural palettes
// col = a + b * cos( 6.28318 * (c * t + d) )
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}

// HSV to RGB conversion (standard implementation)
// h: hue (0-1 normalized), s: saturation (0-1), v: value (0-1)
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// RGB to HSV conversion (standard implementation)
vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

void main() {
	// Calculate distance from center of the point (0.0 to 0.5)
	vec2 coord = gl_PointCoord - vec2(0.5);
	float dist = length(coord);

	// Soft glow with smooth falloff
	// 1.0 at center, 0.0 at edge (radius 0.5)
	float pointAlpha = 1.0 - smoothstep(0.0, 0.5, dist);

	// Discard very low alpha values to improve performance
	if (pointAlpha < 0.01) discard;

    // Calculate speed for coloring
    float speed = length(vVelocity);
    float normalizedSpeed = smoothstep(0.0, 2.0, speed); // Map speed 0-2 to 0-1

    // Generate base color using cosine palette
    vec3 baseColor = palette(normalizedSpeed + 0.1, uColorPaletteA, uColorPaletteB, uColorPaletteC, uColorPaletteD);
    
    // Apply hue shift (Phase 4.3: Color Modulation)
    // Convert RGB to HSV, rotate hue, convert back to RGB
    vec3 hsv = rgb2hsv(baseColor);
    // Rotate hue: uHueShift is in radians (0-2π), normalize to 0-1
    hsv.x = mod(hsv.x + uHueShift / 6.28318, 1.0);
    // Convert back to RGB
    baseColor = hsv2rgb(hsv);
    
    // Apply color intensity multiplier
    vec3 color = baseColor * uColorIntensity;

	// Depth-based alpha fade (Phase 4.2)
	// Fade particles based on distance from camera
	float depthAlpha = 1.0;
	if (uDepthFadeFar > uDepthFadeNear) {
		// Smooth fade from near to far plane
		depthAlpha = 1.0 - smoothstep(uDepthFadeNear, uDepthFadeFar, vDepth);
	}

	// Combine point alpha and depth alpha
	float finalAlpha = pointAlpha * depthAlpha * 0.8;

	// Output final color with combined alpha falloff
	gl_FragColor = vec4(color, finalAlpha);
}
