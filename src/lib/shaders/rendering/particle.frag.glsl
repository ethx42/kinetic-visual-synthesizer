/**
 * Particle Fragment Shader
 * Procedural coloring based on velocity (IQ Style Cosine Palettes)
 */

varying vec3 vPosition;
varying vec3 vVelocity;
varying float vDepth;

// Cosine gradient function for procedural palettes
// col = a + b * cos( 6.28318 * (c * t + d) )
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}

void main() {
	// Calculate distance from center of the point (0.0 to 0.5)
	vec2 coord = gl_PointCoord - vec2(0.5);
	float dist = length(coord);

	// Soft glow with smooth falloff
	// 1.0 at center, 0.0 at edge (radius 0.5)
	float alpha = 1.0 - smoothstep(0.0, 0.5, dist);

	// Discard very low alpha values to improve performance
	if (alpha < 0.01) discard;

    // Calculate speed for coloring
    float speed = length(vVelocity);
    float normalizedSpeed = smoothstep(0.0, 2.0, speed); // Map speed 0-2 to 0-1

    // Cyberpunk / Neon Palette
    // A: Bias, B: Amplitude, C: Frequency, D: Phase
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.263, 0.416, 0.557); // Cool cyan/purple offset
    
    // Shift hue based on speed
    vec3 color = palette(normalizedSpeed + 0.1, a, b, c, d);

	// Output final color with alpha falloff
	gl_FragColor = vec4(color, alpha * 0.8);
}
