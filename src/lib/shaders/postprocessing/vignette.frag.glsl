/**
 * Vignette Post-Processing Fragment Shader
 * High-quality edge darkening effect
 * Creates cinematic focus on center
 */

precision highp float;

uniform sampler2D uInputTexture;
uniform float uIntensity;
uniform float uRadius;
uniform float uFeather;
uniform vec2 uResolution;

varying vec2 vUv;

void main() {
	vec2 uv = vUv;
	vec2 center = vec2(0.5, 0.5);
	
	// Calculate distance from center
	float dist = distance(uv, center);
	
	// Create smooth vignette mask
	// Radius controls where vignette starts
	// Feather controls smoothness of transition
	float vignette = smoothstep(uRadius, uRadius - uFeather, dist);
	
	// Apply vignette (darken edges)
	vec3 color = texture2D(uInputTexture, uv).rgb;
	color *= mix(1.0, vignette, uIntensity);
	
	gl_FragColor = vec4(color, 1.0);
}
