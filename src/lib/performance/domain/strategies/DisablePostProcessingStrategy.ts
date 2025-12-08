/**
 * Disable Post Processing Strategy
 * Priority 2 - Second strategy to be applied when performance degrades
 * Disables post-processing effects to improve performance
 */

import { BaseDegradationStrategy } from './DegradationStrategy';
import { get, type Writable } from 'svelte/store';

/**
 * Strategy to disable post-processing for performance improvement
 */
export class DisablePostProcessingStrategy extends BaseDegradationStrategy {
	readonly name = 'DisablePostProcessing';
	readonly priority = 2;

	private readonly postProcessingEnabledStore: Writable<boolean>;
	private previousState: boolean = true;

	constructor(postProcessingEnabledStore: Writable<boolean>) {
		super();
		this.postProcessingEnabledStore = postProcessingEnabledStore;
	}

	apply(): void {
		if (!this.canApply()) {
			return;
		}

		const currentState = get(this.postProcessingEnabledStore);
		this.previousState = currentState;

		this.postProcessingEnabledStore.set(false);
		this.applied = true;
	}

	revert(): void {
		if (!this.applied) {
			return;
		}

		this.postProcessingEnabledStore.set(this.previousState);
		this.previousState = true;
		this.applied = false;
	}

	canApply(): boolean {
		if (this.applied) {
			return false;
		}

		const currentState = get(this.postProcessingEnabledStore);
		return currentState === true;
	}
}
