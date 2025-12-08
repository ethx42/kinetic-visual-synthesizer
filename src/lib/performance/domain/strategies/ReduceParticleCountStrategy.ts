/**
 * Reduce Particle Count Strategy
 * Priority 1 - First strategy to be applied when performance degrades
 * Reduces particle count by 50%, with a minimum of 100,000 particles
 */

import { BaseDegradationStrategy } from './DegradationStrategy';
import { get, type Writable } from 'svelte/store';

const MIN_PARTICLE_COUNT = 100_000;
const REDUCTION_FACTOR = 0.75;

/**
 * Strategy to reduce particle count for performance improvement
 */
export class ReduceParticleCountStrategy extends BaseDegradationStrategy {
	readonly name = 'ReduceParticleCount';
	readonly priority = 1;

	private readonly particleCountStore: Writable<number>;
	private previousCount: number = 0;

	constructor(particleCountStore: Writable<number>) {
		super();
		this.particleCountStore = particleCountStore;
	}

	apply(): void {
		if (!this.canApply()) {
			return;
		}

		const currentCount = get(this.particleCountStore);
		this.previousCount = currentCount;

		const newCount = Math.max(Math.floor(currentCount * REDUCTION_FACTOR), MIN_PARTICLE_COUNT);
		this.particleCountStore.set(newCount);
		this.applied = true;
	}

	revert(): void {
		if (!this.applied || this.previousCount === 0) {
			return;
		}

		this.particleCountStore.set(this.previousCount);
		this.previousCount = 0;
		this.applied = false;
	}

	canApply(): boolean {
		if (this.applied) {
			return false;
		}

		const currentCount = get(this.particleCountStore);
		return currentCount > MIN_PARTICLE_COUNT;
	}

	/**
	 * Gets the minimum particle count threshold
	 */
	getMinParticleCount(): number {
		return MIN_PARTICLE_COUNT;
	}

	/**
	 * Gets the reduction factor
	 */
	getReductionFactor(): number {
		return REDUCTION_FACTOR;
	}
}
