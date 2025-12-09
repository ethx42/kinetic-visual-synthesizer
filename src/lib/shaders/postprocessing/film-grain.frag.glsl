/**
 * Film Grain Post-Processing Fragment Shader
 * High-quality film grain/noise overlay
 * Creates cinematic texture
 */

precision highp float;

uniform sampler2D uInputTexture;
uniform float uIntensity;
uniform float uTime;
uniform vec2 uResolution;

varying vec2 vUv;

// High-quality pseudo-random function
float random(vec2 st) {
	return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Noise function with multiple octaves for film grain texture
float grain(vec2 uv, float time) {
	vec2 grainUV = uv * uResolution * 0.5;
	
	// Multi-octave noise for realistic grain
	float g = 0.0;
	g += random(grainUV + time * 0.1) * 0.5;
	g += random(grainUV * 2.0 + time * 0.15) * 0.25;
	g += random(grainUV * 4.0 + time * 0.2) * 0.125;
	g += random(grainUV * 8.0 + time * 0.25) * 0.0625;
	
	// Normalize to -1 to 1 range
	return (g - 0.5) * 2.0;
}

void main() {
	vec2 uv = vUv;
	vec3 color = texture2D(uInputTexture, uv).rgb;
	
	// Generate film grain
	float grainValue = grain(uv, uTime);
	
	// Apply grain with intensity control
	// Grain is more visible in mid-tones (photographic grain behavior)
	float luminance = dot(color, vec3(0.299, 0.587, 0.114));
	float grainStrength = mix(0.3, 1.0, abs(luminance - 0.5) * 2.0);
	
	color += grainValue * uIntensity * grainStrength * 0.1;
	
	gl_FragColor = vec4(color, 1.0);
}
