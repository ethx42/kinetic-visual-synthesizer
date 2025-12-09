/**
 * Glitch Post-Processing Fragment Shader
 * Chromatic aberration, scanlines, noise overlay
 * Triggered by signal loss events
 */

precision highp float;

uniform sampler2D uInputTexture;
uniform float uIntensity;
uniform float uTime;
uniform bool uSignalLost;
uniform vec2 uResolution;

varying vec2 vUv;

// Pseudo-random noise function
float random(vec2 st) {
	return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Noise function for glitch displacement
float noise(vec2 st) {
	vec2 i = floor(st);
	vec2 f = fract(st);
	
	float a = random(i);
	float b = random(i + vec2(1.0, 0.0));
	float c = random(i + vec2(0.0, 1.0));
	float d = random(i + vec2(1.0, 1.0));
	
	vec2 u = f * f * (3.0 - 2.0 * f);
	
	return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Chromatic aberration effect
vec3 chromaticAberration(sampler2D tex, vec2 uv, float amount) {
	float aberrationAmount = amount * 0.02;
	
	// Sample RGB channels with offset
	float r = texture2D(tex, uv + vec2(aberrationAmount, 0.0)).r;
	float g = texture2D(tex, uv).g;
	float b = texture2D(tex, uv - vec2(aberrationAmount, 0.0)).b;
	
	return vec3(r, g, b);
}

// Scanline effect
float scanlines(vec2 uv, float time, float intensity) {
	float scanlineFrequency = 800.0;
	float scanlineSpeed = 10.0;
	float scanline = sin((uv.y * scanlineFrequency) + (time * scanlineSpeed)) * 0.5 + 0.5;
	return 1.0 - (scanline * intensity * 0.3);
}

// Horizontal glitch displacement
vec2 glitchDisplacement(vec2 uv, float time, float intensity) {
	float glitchStrength = intensity * 0.1;
	
	// Create glitch bands
	float bandNoise = step(0.8, random(vec2(floor(uv.y * 20.0), floor(time * 10.0))));
	float displacement = (random(vec2(floor(time * 30.0), floor(uv.y * 10.0))) - 0.5) * 2.0;
	
	return vec2(displacement * glitchStrength * bandNoise, 0.0);
}

// VHS-style noise overlay
float vhsNoise(vec2 uv, float time) {
	float noiseVal = random(uv + vec2(time * 0.1, time * 0.2));
	return noiseVal;
}

void main() {
	vec2 uv = vUv;
	float effectIntensity = uIntensity;
	
	// Boost intensity when signal is lost
	if (uSignalLost) {
		effectIntensity = min(effectIntensity + 0.5, 1.0);
	}
	
	// Skip processing if intensity is zero
	if (effectIntensity < 0.001) {
		gl_FragColor = texture2D(uInputTexture, uv);
		return;
	}
	
	// Apply glitch displacement
	vec2 glitchUv = uv + glitchDisplacement(uv, uTime, effectIntensity);
	
	// Apply chromatic aberration
	vec3 color = chromaticAberration(uInputTexture, glitchUv, effectIntensity);
	
	// Apply scanlines
	float scanlineEffect = scanlines(uv, uTime, effectIntensity);
	color *= scanlineEffect;
	
	// Apply VHS noise overlay
	float noiseOverlay = vhsNoise(uv, uTime);
	color = mix(color, vec3(noiseOverlay), effectIntensity * 0.1);
	
	// Add occasional white noise flashes when signal is lost
	if (uSignalLost) {
		float flashNoise = step(0.95, random(vec2(uTime * 100.0, 0.0)));
		color = mix(color, vec3(1.0), flashNoise * 0.3);
	}
	
	// Slight color shift for CRT feel
	color.r *= 1.0 + effectIntensity * 0.1;
	color.b *= 1.0 - effectIntensity * 0.05;
	
	gl_FragColor = vec4(color, 1.0);
}


