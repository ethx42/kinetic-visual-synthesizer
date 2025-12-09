/**
 * Domain Strategy: Disable Post-Processing
 * Disables post-processing effects to improve performance
 *
 * Clean Architecture: Domain Layer
 * Strategy Pattern: Concrete implementation of IDegradationStrategy
 * Single Responsibility: Only responsible for disabling post-processing
 * Dependency Inversion: Uses PerformanceContext exclusively (no direct store imports)
 */

import { get } from 'svelte/store';
import type { IDegradationStrategy, PerformanceContext } from './DegradationStrategy';
import { ErrorHandler } from '$lib/utils/errorHandler';

/**
 * Disable Post-Processing Strategy
 * Disables post-processing when performance is poor
 *
 * Design Patterns:
 * - Strategy Pattern: Implements IDegradationStrategy
 * - Memento Pattern: Stores previous state for restoration
 * - Dependency Inversion: Uses PerformanceContext (abstraction) instead of concrete stores
 */
export class DisablePostProcessingStrategy implements IDegradationStrategy {
	readonly name = 'disable-postprocessing';
	readonly priority = 2; // Second priority (after particle reduction)

	/** Previous state before disabling (for restoration) */
	private wasEnabled: boolean = false;

	/** Flag to track if strategy has been applied */
	private hasApplied = false;

	/**
	 * Check if this strategy can be applied
	 * Validates that post-processing is currently enabled
	 *
	 * @param context - Performance context to check
	 * @returns True if post-processing is enabled and can be disabled
	 */
	canApply(context: PerformanceContext): boolean {
		// Guard clause: Validate context
		if (!context?.postProcessingEnabled) {
			return false;
		}

		// Can apply if post-processing is enabled
		try {
			return get(context.postProcessingEnabled) === true;
		} catch (error) {
			// If we can't read the store, assume we can't apply
			ErrorHandler.handleError(error, 'DisablePostProcessingStrategy.canApply');
			return false;
		}
	}

	/**
	 * Apply the degradation strategy
	 * Disables post-processing effects
	 *
	 * @param context - Performance context with post-processing store
	 * @throws Error if context.postProcessingEnabled is not available
	 */
	apply(context: PerformanceContext): void {
		// Guard clause: Validate context and state
		if (!context?.postProcessingEnabled) {
			throw new Error(
				'DisablePostProcessingStrategy.apply: postProcessingEnabled store not available in context'
			);
		}

		if (this.hasApplied) {
			return;
		}

		// Store current state before disabling
		try {
			this.wasEnabled = get(context.postProcessingEnabled);
		} catch (error) {
			// If we can't read it, assume it was enabled (since canApply returned true)
			this.wasEnabled = true;
			ErrorHandler.handleError(error, 'DisablePostProcessingStrategy.apply');
		}

		// Disable post-processing using context store directly
		// This maintains Clean Architecture by using the abstraction (context) instead of concrete stores
		context.postProcessingEnabled.set(false);
		this.hasApplied = true;
	}

	/**
	 * Revert the degradation strategy
	 * Restores post-processing to previous state
	 *
	 * @param context - Performance context with post-processing store
	 * @throws Error if context.postProcessingEnabled is not available
	 */
	revert(context: PerformanceContext): void {
		// Guard clause: Validate state
		if (!this.hasApplied) {
			return;
		}

		// Guard clause: Validate context
		if (!context?.postProcessingEnabled) {
			throw new Error(
				'DisablePostProcessingStrategy.revert: postProcessingEnabled store not available in context'
			);
		}

		// Restore previous state using context store directly
		if (this.wasEnabled) {
			context.postProcessingEnabled.set(true);
		}

		this.hasApplied = false;
	}

	/**
	 * Reset strategy state to initial values
	 * Useful for testing, debugging, or manual reset scenarios
	 *
	 * @param _context - Performance context (optional, for full reset) - currently unused
	 */
	reset(_context?: PerformanceContext): void {
		// Reset internal state
		this.wasEnabled = false;
		this.hasApplied = false;

		// Note: If context provided and was enabled, we could restore it
		// However, wasEnabled is now false, so we can't restore
		// This is intentional - reset means "forget previous state"
	}
}
