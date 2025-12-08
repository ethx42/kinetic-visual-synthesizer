/**
 * Degradation Strategy Interface
 * Defines the contract for all performance degradation strategies
 * Implements the Strategy Pattern for flexible performance adaptation
 */

/**
 * Interface for degradation strategies
 * Each strategy can be applied or reverted to adjust performance
 */
export interface IDegradationStrategy {
	/**
	 * Unique name identifying this strategy
	 */
	readonly name: string;

	/**
	 * Priority level (lower = higher priority, applied first)
	 * Priority 1 strategies are applied before priority 2, etc.
	 */
	readonly priority: number;

	/**
	 * Applies the degradation strategy
	 * Should reduce resource usage to improve performance
	 */
	apply(): void;

	/**
	 * Reverts the degradation strategy
	 * Should restore previous settings when performance improves
	 */
	revert(): void;

	/**
	 * Checks if this strategy can be applied
	 * Returns false if already at minimum settings or not applicable
	 */
	canApply(): boolean;

	/**
	 * Checks if this strategy is currently applied
	 */
	isApplied(): boolean;
}

/**
 * Base class for degradation strategies
 * Provides common functionality for tracking applied state
 */
export abstract class BaseDegradationStrategy implements IDegradationStrategy {
	abstract readonly name: string;
	abstract readonly priority: number;

	protected applied: boolean = false;

	abstract apply(): void;
	abstract revert(): void;
	abstract canApply(): boolean;

	isApplied(): boolean {
		return this.applied;
	}
}
