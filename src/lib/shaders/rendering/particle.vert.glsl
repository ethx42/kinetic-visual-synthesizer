/**
 * Particle Vertex Shader
 * Reads position from texture and renders as points
 * Implements distance attenuation for point size
 */

attribute float aIndex;

uniform sampler2D uPositionTexture;
uniform sampler2D uVelocityTexture;
uniform float uTextureSize;
uniform float uPointSize;

varying vec3 vPosition;
varying vec3 vVelocity;
varying float vDepth;

void main() {
	// Calculate UV coordinates from particle index
	// Texture is uTextureSize x uTextureSize
	float u = mod(aIndex, uTextureSize) / uTextureSize;
	float v = floor(aIndex / uTextureSize) / uTextureSize;
	vec2 uv = vec2(u, v);

	// Read position from texture (RGBA: x, y, z, lifetime)
	vec4 positionData = texture2D(uPositionTexture, uv);
	vPosition = positionData.xyz;
	
	// Read velocity from texture (RGBA: vx, vy, vz, unused)
	vec4 velocityData = texture2D(uVelocityTexture, uv);
	vVelocity = velocityData.xyz;

	// Transform to clip space
	vec4 mvPosition = modelViewMatrix * vec4(vPosition, 1.0);
	vDepth = -mvPosition.z;
	gl_Position = projectionMatrix * mvPosition;

	// Distance attenuation: point size scales with distance
	// Formula: size * (scale / -mvPosition.z)
	float scale = 300.0; // Adjust for desired size scaling
	gl_PointSize = uPointSize * (scale / max(-mvPosition.z, 0.1));
}
