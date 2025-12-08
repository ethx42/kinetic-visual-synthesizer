/**
 * Reduce Quality Strategy
 * Priority 3 - Third strategy to be applied when performance degrades
 * Reduces rendering quality in steps: 1.0 -> 0.75 -> 0.5 -> 0.25
 */

import { BaseDegradationStrategy } from './DegradationStrategy';
import { get, type Writable } from 'svelte/store';

const QUALITY_STEPS = [1.0, 0.75, 0.5];
const MIN_QUALITY = 0.5;

/**
 * Strategy to reduce rendering quality for performance improvement
 */
export class ReduceQualityStrategy extends BaseDegradationStrategy {
	readonly name = 'ReduceQuality';
	readonly priority = 3;

	private readonly qualityLevelStore: Writable<number>;
	private previousQuality: number = 1.0;
	private currentStepIndex: number = 0;

	constructor(qualityLevelStore: Writable<number>) {
		super();
		this.qualityLevelStore = qualityLevelStore;
	}

	apply(): void {
		if (!this.canApply()) {
			return;
		}

		const currentQuality = get(this.qualityLevelStore);

		if (!this.applied) {
			this.previousQuality = currentQuality;
		}

		const currentIndex = this.findQualityStepIndex(currentQuality);
		const nextIndex = Math.min(currentIndex + 1, QUALITY_STEPS.length - 1);

		if (nextIndex > currentIndex) {
			this.currentStepIndex = nextIndex;
			this.qualityLevelStore.set(QUALITY_STEPS[nextIndex]);
			this.applied = true;
		}
	}

	revert(): void {
		if (!this.applied) {
			return;
		}

		const currentQuality = get(this.qualityLevelStore);
		const currentIndex = this.findQualityStepIndex(currentQuality);

		if (currentIndex > 0) {
			const prevIndex = currentIndex - 1;
			this.currentStepIndex = prevIndex;
			this.qualityLevelStore.set(QUALITY_STEPS[prevIndex]);

			if (prevIndex === 0) {
				this.applied = false;
			}
		} else {
			this.qualityLevelStore.set(this.previousQuality);
			this.applied = false;
		}
	}

	canApply(): boolean {
		const currentQuality = get(this.qualityLevelStore);
		return currentQuality > MIN_QUALITY;
	}

	/**
	 * Finds the index of the current quality level in the steps array
	 */
	private findQualityStepIndex(quality: number): number {
		for (let i = 0; i < QUALITY_STEPS.length; i++) {
			if (Math.abs(QUALITY_STEPS[i] - quality) < 0.01) {
				return i;
			}
		}
		return quality >= 1.0 ? 0 : QUALITY_STEPS.length - 1;
	}

	/**
	 * Gets the available quality steps
	 */
	getQualitySteps(): readonly number[] {
		return QUALITY_STEPS;
	}

	/**
	 * Gets the minimum quality level
	 */
	getMinQuality(): number {
		return MIN_QUALITY;
	}

	/**
	 * Gets the current quality step index
	 */
	getCurrentStepIndex(): number {
		return this.currentStepIndex;
	}
}
