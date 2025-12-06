/**
 * Glitch Post-Processing Vertex Shader
 * Fullscreen quad pass-through
 * Will be implemented in Milestone 5
 */

attribute vec2 aPosition;
varying vec2 vUv;

void main() {
	vUv = aPosition * 0.5 + 0.5;
	gl_Position = vec4(aPosition, 0.0, 1.0);
}

