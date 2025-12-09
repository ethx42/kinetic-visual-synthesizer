/**
 * Bloom Post-Processing Fragment Shader
 * High-quality bloom effect for particle systems
 * Uses Gaussian blur with luminance thresholding
 * Optimized for WebGL1 compatibility
 */

precision highp float;

uniform sampler2D uInputTexture;
uniform float uIntensity;
uniform float uThreshold;
uniform float uRadius;
uniform vec2 uResolution;

varying vec2 vUv;

// Gaussian blur weights (9-tap)
// WebGL1 compatible: individual constants
const float weight0 = 0.227027;
const float weight1 = 0.1945946;
const float weight2 = 0.1216216;
const float weight3 = 0.054054;
const float weight4 = 0.016216;

// Calculate luminance
float luminance(vec3 color) {
	return dot(color, vec3(0.299, 0.587, 0.114));
}

// Sample with offset
vec3 sampleOffset(sampler2D tex, vec2 uv, vec2 offset) {
	return texture2D(tex, uv + offset / uResolution).rgb;
}

// Extract bright areas for bloom
// For particles, we want to bloom based on both luminance and color intensity
vec3 extractBloom(vec3 color, float threshold) {
	float lum = luminance(color);
	// Use a softer threshold curve for particles
	// Lower threshold = more areas bloom (better for colorful particles)
	float bloomMask = smoothstep(threshold * 0.5, threshold * 1.5, lum);
	// Also boost based on color intensity (max channel)
	float maxChannel = max(max(color.r, color.g), color.b);
	float colorBoost = smoothstep(0.3, 0.8, maxChannel);
	bloomMask = max(bloomMask, colorBoost * 0.5);
	return color * bloomMask;
}

void main() {
	vec2 uv = vUv;
	vec3 color = texture2D(uInputTexture, uv).rgb;
	
	// Extract bright areas for bloom
	vec3 bloomBase = extractBloom(color, uThreshold);
	
	// Calculate offsets
	float offset1 = 1.0 * uRadius;
	float offset2 = 2.0 * uRadius;
	float offset3 = 3.0 * uRadius;
	float offset4 = 4.0 * uRadius;
	
	// Horizontal blur pass
	vec3 blurH = bloomBase * weight0;
	
	// Sample and blur horizontally
	vec3 s1a = sampleOffset(uInputTexture, uv, vec2(offset1, 0.0));
	vec3 s1b = sampleOffset(uInputTexture, uv, vec2(-offset1, 0.0));
	blurH += extractBloom(s1a, uThreshold) * weight1;
	blurH += extractBloom(s1b, uThreshold) * weight1;
	
	vec3 s2a = sampleOffset(uInputTexture, uv, vec2(offset2, 0.0));
	vec3 s2b = sampleOffset(uInputTexture, uv, vec2(-offset2, 0.0));
	blurH += extractBloom(s2a, uThreshold) * weight2;
	blurH += extractBloom(s2b, uThreshold) * weight2;
	
	vec3 s3a = sampleOffset(uInputTexture, uv, vec2(offset3, 0.0));
	vec3 s3b = sampleOffset(uInputTexture, uv, vec2(-offset3, 0.0));
	blurH += extractBloom(s3a, uThreshold) * weight3;
	blurH += extractBloom(s3b, uThreshold) * weight3;
	
	vec3 s4a = sampleOffset(uInputTexture, uv, vec2(offset4, 0.0));
	vec3 s4b = sampleOffset(uInputTexture, uv, vec2(-offset4, 0.0));
	blurH += extractBloom(s4a, uThreshold) * weight4;
	blurH += extractBloom(s4b, uThreshold) * weight4;
	
	// Vertical blur pass (approximation - blurring input again)
	// In a full multi-pass implementation, this would blur blurH
	vec3 blurV = blurH * weight0;
	
	vec3 vs1a = sampleOffset(uInputTexture, uv, vec2(0.0, offset1));
	vec3 vs1b = sampleOffset(uInputTexture, uv, vec2(0.0, -offset1));
	blurV += extractBloom(vs1a, uThreshold) * weight1;
	blurV += extractBloom(vs1b, uThreshold) * weight1;
	
	vec3 vs2a = sampleOffset(uInputTexture, uv, vec2(0.0, offset2));
	vec3 vs2b = sampleOffset(uInputTexture, uv, vec2(0.0, -offset2));
	blurV += extractBloom(vs2a, uThreshold) * weight2;
	blurV += extractBloom(vs2b, uThreshold) * weight2;
	
	vec3 vs3a = sampleOffset(uInputTexture, uv, vec2(0.0, offset3));
	vec3 vs3b = sampleOffset(uInputTexture, uv, vec2(0.0, -offset3));
	blurV += extractBloom(vs3a, uThreshold) * weight3;
	blurV += extractBloom(vs3b, uThreshold) * weight3;
	
	vec3 vs4a = sampleOffset(uInputTexture, uv, vec2(0.0, offset4));
	vec3 vs4b = sampleOffset(uInputTexture, uv, vec2(0.0, -offset4));
	blurV += extractBloom(vs4a, uThreshold) * weight4;
	blurV += extractBloom(vs4b, uThreshold) * weight4;
	
	// Combine original with bloom (additive for glow)
	vec3 result = color + blurV * uIntensity;
	
	gl_FragColor = vec4(result, 1.0);
}
