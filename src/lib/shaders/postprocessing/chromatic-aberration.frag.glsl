/**
 * Chromatic Aberration Post-Processing Fragment Shader
 * High-quality RGB channel separation effect
 * Creates cinematic color fringing
 */

precision highp float;

uniform sampler2D uInputTexture;
uniform float uIntensity;
uniform float uOffset;
uniform vec2 uResolution;

varying vec2 vUv;

void main() {
	vec2 uv = vUv;
	vec2 center = vec2(0.5, 0.5);
	vec2 offset = (uv - center) * uOffset * uIntensity;
	
	// Sample RGB channels with different offsets
	// Red channel shifts outward
	float r = texture2D(uInputTexture, uv + offset * 1.2).r;
	// Green channel stays centered
	float g = texture2D(uInputTexture, uv).g;
	// Blue channel shifts inward
	float b = texture2D(uInputTexture, uv - offset * 0.8).b;
	
	// Smooth falloff from center
	float dist = distance(uv, center);
	float falloff = smoothstep(0.0, 0.7, dist);
	
	vec3 color = vec3(r, g, b);
	
	// Mix with original for subtle effect
	vec3 original = texture2D(uInputTexture, uv).rgb;
	color = mix(original, color, falloff * uIntensity);
	
	gl_FragColor = vec4(color, 1.0);
}
