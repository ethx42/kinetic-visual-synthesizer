/**
 * Glitch Post-Processing Fragment Shader
 * Chromatic aberration, scanlines, noise overlay
 * Will be implemented in Milestone 5
 */

uniform sampler2D uInputTexture;
uniform float uIntensity;

varying vec2 vUv;

void main() {
	// Placeholder - will implement glitch effects in Milestone 5
	vec4 color = texture2D(uInputTexture, vUv);
	gl_FragColor = color;
}


