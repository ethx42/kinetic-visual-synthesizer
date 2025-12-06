/**
 * Particle Vertex Shader
 * Reads position from texture and renders as points
 * Will be implemented in Milestone 1
 */

attribute float aIndex;

uniform sampler2D uPositionTexture;
uniform float uTextureSize;
uniform float uPointSize;

varying vec3 vPosition;
varying float vDepth;

void main() {
	// Placeholder - will implement particle rendering in Milestone 1
	gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
	gl_PointSize = uPointSize;
}

