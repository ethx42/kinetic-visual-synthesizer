/**
 * Color Grading Post-Processing Fragment Shader
 * High-quality color adjustment (temperature, contrast, saturation, brightness)
 * Creates cinematic color grading
 */

precision highp float;

uniform sampler2D uInputTexture;
uniform float uIntensity;
uniform float uTemperature;
uniform float uContrast;
uniform float uSaturation;
uniform float uBrightness;
uniform vec2 uResolution;

varying vec2 vUv;

// Brightness adjustment
vec3 adjustBrightness(vec3 color, float brightness) {
	return color * (1.0 + brightness);
}

// Temperature adjustment (warm/cool)
vec3 adjustTemperature(vec3 color, float temp) {
	// Warm (positive) adds red, removes blue
	// Cool (negative) adds blue, removes red
	vec3 warm = vec3(1.0, 0.8, 0.6);
	vec3 cool = vec3(0.6, 0.8, 1.0);
	
	if (temp > 0.0) {
		return mix(color, color * warm, temp);
	} else {
		return mix(color, color * cool, -temp);
	}
}

// Contrast adjustment
vec3 adjustContrast(vec3 color, float contrast) {
	// Contrast formula: (color - 0.5) * contrast + 0.5
	return (color - 0.5) * (1.0 + contrast) + 0.5;
}

// Saturation adjustment
vec3 adjustSaturation(vec3 color, float saturation) {
	float gray = dot(color, vec3(0.299, 0.587, 0.114));
	return mix(vec3(gray), color, 1.0 + saturation);
}

void main() {
	vec2 uv = vUv;
	vec3 color = texture2D(uInputTexture, uv).rgb;
	
	// Apply color grading adjustments
	color = adjustBrightness(color, uBrightness);
	color = adjustContrast(color, uContrast);
	color = adjustSaturation(color, uSaturation);
	color = adjustTemperature(color, uTemperature);
	
	// Mix with original based on intensity
	vec3 original = texture2D(uInputTexture, uv).rgb;
	color = mix(original, color, uIntensity);
	
	gl_FragColor = vec4(color, 1.0);
}
