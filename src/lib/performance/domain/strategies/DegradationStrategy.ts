/**
 * Domain Strategy: Performance Degradation
 * Defines how to reduce quality when performance is poor
 *
 * Clean Architecture: Domain Layer
 * Strategy Pattern: Interface for interchangeable degradation strategies
 * Dependency Inversion: Depend on abstractions, not concretions
 */

import type { Writable } from 'svelte/store';

/**
 * Performance Context
 * Contains writable stores that strategies can modify
 *
 * Value Object Pattern: Immutable context passed to strategies
 * Facade Pattern: Simplifies access to multiple stores
 */
export interface PerformanceContext {
	/** Particle count store - primary target for degradation */
	particleCount: Writable<number>;

	/** Post-processing enabled store - optional */
	postProcessingEnabled?: Writable<boolean>;

	/** Quality level store - optional (0.0 - 1.0) */
	qualityLevel?: Writable<number>;

	/** Additional settings map for extensibility */
	settings?: Map<string, Writable<any>>;
}

/**
 * Degradation Strategy Interface
 * Defines the contract for all degradation strategies
 *
 * Strategy Pattern: Interchangeable algorithms for performance degradation
 * Interface Segregation: Small, focused interface
 * Open/Closed Principle: Open for extension, closed for modification
 */
export interface IDegradationStrategy {
	/**
	 * Unique name identifier for the strategy
	 * Used for logging and debugging
	 */
	readonly name: string;

	/**
	 * Priority level (lower = applied first)
	 * Strategies are applied in priority order
	 */
	readonly priority: number;

	/**
	 * Apply the degradation strategy
	 * Modifies the performance context to reduce quality
	 *
	 * @param context - Performance context with writable stores
	 * @throws Error if strategy cannot be applied or context is invalid
	 */
	apply(context: PerformanceContext): void;

	/**
	 * Revert the degradation strategy
	 * Restores previous state before degradation was applied
	 *
	 * @param context - Performance context with writable stores
	 */
	revert(context: PerformanceContext): void;

	/**
	 * Check if this strategy can be applied
	 * Used to determine if strategy is available for current state
	 *
	 * @param context - Performance context to check
	 * @returns True if strategy can be applied, false otherwise
	 */
	canApply(context: PerformanceContext): boolean;

	/**
	 * Reset strategy state to initial values
	 * Useful for testing, debugging, or manual reset scenarios
	 *
	 * @param context - Performance context (optional, for full reset)
	 */
	reset?(context?: PerformanceContext): void;
}
