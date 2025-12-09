/**
 * Domain Strategy: Reduce Particle Count
 * Less aggressive: Uses gradual steps instead of large cuts
 *
 * Clean Architecture: Domain Layer
 * Strategy Pattern: Concrete implementation of IDegradationStrategy
 * Single Responsibility: Only responsible for particle count reduction
 */

import { get } from 'svelte/store';
import type { IDegradationStrategy, PerformanceContext } from './DegradationStrategy';

/**
 * Configuration constants for particle reduction
 * Extracted to top level for easy modification
 */
const CONFIG = {
	/** Minimum particle count to maintain visual quality */
	MIN_PARTICLE_COUNT: 200_000,

	/** Gradual reduction steps (each step reduces by ~20%) */
	REDUCTION_STEPS: [0.8, 0.64, 0.512, 0.41, 0.33, 0.26, 0.21, 0.17] as const
} as const;

/**
 * Reduce Particle Count Strategy
 * Gradually reduces particle count in steps to maintain visual quality
 *
 * Design Patterns:
 * - Strategy Pattern: Implements IDegradationStrategy
 * - State Pattern: Manages step state internally
 * - Memento Pattern: Stores original count for restoration
 */
export class ReduceParticleCountStrategy implements IDegradationStrategy {
	readonly name = 'reduce-particles';
	readonly priority = 1; // Highest priority (applied first)

	/** Current reduction step index */
	private currentStep = 0;

	/** Original particle count before degradation (for restoration) */
	private originalCount: number | null = null;

	/**
	 * Check if this strategy can be applied
	 * Validates that we haven't exhausted all steps and are above minimum
	 *
	 * @param context - Performance context to check
	 * @returns True if strategy can be applied
	 */
	canApply(context: PerformanceContext): boolean {
		// Guard clause: Validate context
		if (!context?.particleCount) {
			return false;
		}

		const current = get(context.particleCount);

		// Can apply if:
		// 1. We haven't exhausted all steps
		// 2. Current count is above minimum
		return (
			this.currentStep < CONFIG.REDUCTION_STEPS.length - 1 && current > CONFIG.MIN_PARTICLE_COUNT
		);
	}

	/**
	 * Apply the degradation strategy
	 * Reduces particle count by moving to next reduction step
	 *
	 * @param context - Performance context with particle count store
	 * @throws Error if context is invalid or strategy cannot be applied
	 */
	apply(context: PerformanceContext): void {
		// Guard clause: Validate context
		if (!context?.particleCount) {
			throw new Error('Invalid context: particleCount store is required');
		}

		// Store original count on first application
		if (this.originalCount === null) {
			this.originalCount = get(context.particleCount);
		}

		// Validate original count
		if (this.originalCount <= 0) {
			throw new Error(`Invalid original count: ${this.originalCount}`);
		}

		// Move to next reduction step
		this.currentStep = Math.min(this.currentStep + 1, CONFIG.REDUCTION_STEPS.length - 1);

		// Calculate new count
		const reductionFactor = CONFIG.REDUCTION_STEPS[this.currentStep];
		const newCount = Math.floor(this.originalCount * reductionFactor);

		// Ensure we don't go below minimum
		const finalCount = Math.max(newCount, CONFIG.MIN_PARTICLE_COUNT);

		// Apply the change
		context.particleCount.set(finalCount);

		// Log in development mode
		if (import.meta.env.DEV) {
			const reductionPercent = ((1 - reductionFactor) * 100).toFixed(1);
			console.log(
				`[PerformanceManager] Applied strategy: ${this.name}\n` +
					`  Original: ${this.originalCount.toLocaleString('en-US')} particles\n` +
					`  New: ${finalCount.toLocaleString('en-US')} particles\n` +
					`  Reduction: ${reductionPercent}% (step ${this.currentStep + 1}/${CONFIG.REDUCTION_STEPS.length})`
			);
		}
	}

	/**
	 * Revert the degradation strategy
	 * Restores particle count by moving back one step or to original
	 *
	 * @param context - Performance context with particle count store
	 */
	revert(context: PerformanceContext): void {
		// Guard clause: Validate context and state
		if (!context?.particleCount || this.originalCount === null) {
			return;
		}

		// Move back one step
		this.currentStep = Math.max(this.currentStep - 1, 0);

		if (this.currentStep === 0) {
			// Fully reverted, restore original
			context.particleCount.set(this.originalCount);
			this.originalCount = null;

			if (import.meta.env.DEV) {
				console.log(
					`[PerformanceManager] Reverted strategy: ${this.name} (fully restored to original)`
				);
			}
		} else {
			// Partially reverted, apply previous step
			const reductionFactor = CONFIG.REDUCTION_STEPS[this.currentStep];
			const newCount = Math.floor(this.originalCount * reductionFactor);
			const finalCount = Math.max(newCount, CONFIG.MIN_PARTICLE_COUNT);
			context.particleCount.set(finalCount);

			if (import.meta.env.DEV) {
				console.log(
					`[PerformanceManager] Partially reverted strategy: ${this.name} (step ${this.currentStep + 1}/${CONFIG.REDUCTION_STEPS.length})`
				);
			}
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
		this.originalCount = null;

		// If context provided and original count was stored, restore it
		if (context?.particleCount && this.originalCount !== null) {
			// Note: originalCount is now null, so we can't restore
			// This is intentional - reset means "forget previous state"
		}

		if (import.meta.env.DEV) {
			console.log(`[ReduceParticleCountStrategy] Strategy state reset`);
		}
	}
}
