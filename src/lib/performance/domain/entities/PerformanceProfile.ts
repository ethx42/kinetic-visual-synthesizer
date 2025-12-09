/**
 * Domain Entity: Performance Profile
 * Represents current system performance state
 *
 * Clean Architecture: Domain Layer
 * This file contains pure domain entities with no dependencies on infrastructure
 */

/**
 * Performance Profile
 * Immutable snapshot of system performance at a point in time
 *
 * Value Object Pattern: Immutable data structure representing a performance state
 */
export interface PerformanceProfile {
	readonly fps: number;
	readonly frameTime: number; // ms
	readonly renderCalls: number;
	readonly particleCount: number;
	readonly timestamp: number;
}

/**
 * Performance Thresholds
 * Defines boundaries for different performance levels
 *
 * Value Object Pattern: Configuration data structure
 * All performance levels are configurable for consistency and maintainability
 */
export interface PerformanceThresholds {
	excellent: { fps: number; frameTime: number };
	good: { fps: number; frameTime: number };
	acceptable: { fps: number; frameTime: number };
	poor: { fps: number; frameTime: number };
}

/**
 * Performance Level
 * Categorizes current performance state
 *
 * Enum Pattern: Type-safe performance level classification
 */
export enum PerformanceLevel {
	EXCELLENT = 'excellent',
	GOOD = 'good',
	ACCEPTABLE = 'acceptable',
	POOR = 'poor',
	CRITICAL = 'critical'
}

/**
 * Default performance thresholds
 * Factory function for creating standard thresholds
 *
 * Factory Pattern: Centralized creation of threshold configurations
 * All thresholds are explicitly defined for consistency and maintainability
 */
export function createDefaultThresholds(): PerformanceThresholds {
	return {
		excellent: { fps: 58, frameTime: 17 },
		good: { fps: 45, frameTime: 22 },
		acceptable: { fps: 30, frameTime: 33 },
		poor: { fps: 20, frameTime: 50 }
	};
}

/**
 * Create a performance profile from metrics
 * Factory function for creating performance profiles
 *
 * Factory Pattern: Encapsulates profile creation logic
 */
export function createPerformanceProfile(
	fps: number,
	renderCalls: number,
	particleCount: number,
	timestamp: number = performance.now()
): PerformanceProfile {
	return {
		fps: Math.max(0, fps),
		frameTime: fps > 0 ? 1000 / fps : 16.67,
		renderCalls: Math.max(0, renderCalls),
		particleCount: Math.max(0, particleCount),
		timestamp
	};
}
