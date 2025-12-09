/**
 * Film Grain Post-Processing Vertex Shader
 * Fullscreen quad pass-through for post-processing effects
 */

attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;

void main() {
	vUv = uv;
	gl_Position = vec4(position, 0.0, 1.0);
}
