/**
 * Particle Fragment Shader
 * Procedural coloring based on velocity
 * Will be implemented in Milestone 4
 */

varying vec3 vPosition;
varying float vDepth;

void main() {
	// Calculate distance from center of the point (0.0 to 0.5)
	vec2 coord = gl_PointCoord - vec2(0.5);
	float dist = length(coord);

	// Soft glow with smooth falloff
	// 1.0 at center, 0.0 at edge (radius 0.5)
	float alpha = 1.0 - smoothstep(0.0, 0.5, dist);

	// Discard very low alpha values to improve performance
	if (alpha < 0.01) discard;

	// Base white color with alpha falloff
	gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * 0.8);
}

