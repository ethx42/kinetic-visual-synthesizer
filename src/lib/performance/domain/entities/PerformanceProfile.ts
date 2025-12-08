/**
 * Performance Profile Entity
 * Defines the core performance metrics and thresholds for the fallback system
 */

/**
 * Performance level classification
 * Used to determine when to apply or revert degradation strategies
 */
export enum PerformanceLevel {
	EXCELLENT = 'EXCELLENT',
	GOOD = 'GOOD',
	ACCEPTABLE = 'ACCEPTABLE',
	POOR = 'POOR',
	CRITICAL = 'CRITICAL'
}

/**
 * Performance profile interface
 * Captures a snapshot of current performance metrics
 */
export interface PerformanceProfile {
	fps: number;
	frameTime: number;
	renderCalls: number;
	particleCount: number;
	timestamp: number;
}

/**
 * Performance thresholds value object
 * Defines the boundaries for each performance level
 */
export interface PerformanceThresholds {
	excellent: ThresholdConfig;
	good: ThresholdConfig;
	acceptable: ThresholdConfig;
	poor: ThresholdConfig;
}

/**
 * Individual threshold configuration
 */
export interface ThresholdConfig {
	minFps: number;
	maxFrameTime: number;
}

/**
 * Default performance thresholds
 * Based on requirements:
 * - Excellent: fps >= 58, frameTime <= 17ms
 * - Good: fps >= 45, frameTime <= 22ms
 * - Acceptable: fps >= 30, frameTime <= 33ms
 * - Poor: fps >= 20, frameTime <= 50ms
 * - Critical: below poor thresholds
 */
export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
	excellent: { minFps: 58, maxFrameTime: 17 },
	good: { minFps: 45, maxFrameTime: 22 },
	acceptable: { minFps: 30, maxFrameTime: 33 },
	poor: { minFps: 20, maxFrameTime: 50 }
};

/**
 * Creates a performance profile from current metrics
 */
export function createPerformanceProfile(
	fps: number,
	frameTime: number,
	renderCalls: number,
	particleCount: number
): PerformanceProfile {
	return {
		fps,
		frameTime,
		renderCalls,
		particleCount,
		timestamp: Date.now()
	};
}
