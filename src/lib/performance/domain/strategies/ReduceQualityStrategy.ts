/**
 * Domain Strategy: Reduce Quality Level
 * Reduces overall quality settings to improve performance
 *
 * Clean Architecture: Domain Layer
 * Strategy Pattern: Concrete implementation of IDegradationStrategy
 * Single Responsibility: Only responsible for quality level reduction
 */

import type { IDegradationStrategy, PerformanceContext } from './DegradationStrategy';

/**
 * Configuration constants for quality reduction
 * Extracted to top level for easy modification
 */
const CONFIG = {
	/** Quality reduction steps (100% → 75% → 50% → 25%) */
	QUALITY_STEPS: [1.0, 0.75, 0.5, 0.25] as const
} as const;

/**
 * Reduce Quality Strategy
 * Reduces quality level in steps
 *
 * Design Patterns:
 * - Strategy Pattern: Implements IDegradationStrategy
 * - State Pattern: Manages step state internally
 */
export class ReduceQualityStrategy implements IDegradationStrategy {
	readonly name = 'reduce-quality';
	readonly priority = 3; // Lowest priority (applied last)

	/** Current quality step index */
	private currentStep = 0;

	/**
	 * Check if this strategy can be applied
	 * Validates that qualityLevel exists and we haven't exhausted all steps
	 *
	 * @param context - Performance context to check
	 * @returns True if strategy can be applied
	 */
	canApply(context: PerformanceContext): boolean {
		// Guard clause: Validate context
		if (!context?.qualityLevel) {
			return false;
		}

		// Can apply if we haven't exhausted all steps
		return this.currentStep < CONFIG.QUALITY_STEPS.length - 1;
	}

	/**
	 * Apply the degradation strategy
	 * Reduces quality level by moving to next step
	 *
	 * @param context - Performance context with quality level store
	 * @throws Error if context is invalid
	 */
	apply(context: PerformanceContext): void {
		// Guard clause: Validate context
		if (!context?.qualityLevel) {
			throw new Error('Invalid context: qualityLevel store is required');
		}

		// Move to next quality step
		this.currentStep = Math.min(this.currentStep + 1, CONFIG.QUALITY_STEPS.length - 1);

		// Get new quality value
		const newQuality = CONFIG.QUALITY_STEPS[this.currentStep];

		// Validate quality value
		if (newQuality < 0 || newQuality > 1) {
			throw new Error(`Invalid quality value: ${newQuality}`);
		}

		// Apply the change
		context.qualityLevel.set(newQuality);

		if (import.meta.env.DEV) {
			console.log(
				`[PerformanceManager] Applied strategy: ${this.name}\n` +
					`  Quality level: ${(newQuality * 100).toFixed(0)}% (step ${this.currentStep + 1}/${CONFIG.QUALITY_STEPS.length})`
			);
		}
	}

	/**
	 * Revert the degradation strategy
	 * Restores quality level by moving back one step
	 *
	 * @param context - Performance context with quality level store
	 */
	revert(context: PerformanceContext): void {
		// Guard clause: Validate context
		if (!context?.qualityLevel) {
			return;
		}

		// Move back one step
		this.currentStep = Math.max(this.currentStep - 1, 0);

		// Get new quality value
		const newQuality = CONFIG.QUALITY_STEPS[this.currentStep];

		// Apply the change
		context.qualityLevel.set(newQuality);

		if (import.meta.env.DEV) {
			console.log(
				`[PerformanceManager] Reverted strategy: ${this.name}\n` +
					`  Quality level: ${(newQuality * 100).toFixed(0)}% (step ${this.currentStep + 1}/${CONFIG.QUALITY_STEPS.length})`
			);
		}
	}

	/**
	 * Reset strategy state to initial values
	 * Useful for testing, debugging, or manual reset scenarios
	 *
	 * @param context - Performance context (optional, for full reset)
	 */
	reset(context?: PerformanceContext): void {
		// Reset internal state
		this.currentStep = 0;

		// If context provided, restore quality to maximum (1.0)
		if (context?.qualityLevel) {
			context.qualityLevel.set(1.0);
		}

		if (import.meta.env.DEV) {
			console.log(`[ReduceQualityStrategy] Strategy state reset`);
		}
	}
}
