/**
 * Simulation Fragment Shader
 * Physics computation (Velocity Verlet integration)
 * Will be implemented in Milestone 2
 */

uniform sampler2D uPositionTexture;
uniform sampler2D uVelocityTexture;
uniform float uTime;
uniform float uDeltaTime;

varying vec2 vUv;

void main() {
	// Placeholder - will implement physics in Milestone 2
	vec4 position = texture2D(uPositionTexture, vUv);
	vec4 velocity = texture2D(uVelocityTexture, vUv);
	
	gl_FragColor = position;
}

