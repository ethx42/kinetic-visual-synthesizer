/**
 * Performance Analyzer Service
 * Analyzes performance metrics and determines performance level
 * Implements degradation/upgrade decision logic
 */

import {
	type PerformanceProfile,
	type PerformanceThresholds,
	PerformanceLevel,
	DEFAULT_THRESHOLDS
} from '../entities/PerformanceProfile';

/**
 * Configuration for the performance analyzer
 */
export interface PerformanceAnalyzerConfig {
	thresholds: PerformanceThresholds;
	degradeThreshold: number; // Number of sustained poor frames before degrading
	upgradeThreshold: number; // Number of sustained good frames before upgrading
}

/**
 * Default analyzer configuration
 * - Degrade after 3+ sustained poor frames
 * - Upgrade after 10+ sustained good frames
 */
export const DEFAULT_ANALYZER_CONFIG: PerformanceAnalyzerConfig = {
	thresholds: DEFAULT_THRESHOLDS,
	degradeThreshold: 3,
	upgradeThreshold: 10
};

/**
 * Performance Analyzer
 * Analyzes metrics and determines when to degrade or upgrade
 */
export class PerformanceAnalyzer {
	private readonly config: PerformanceAnalyzerConfig;
	private consecutivePoorFrames: number = 0;
	private consecutiveGoodFrames: number = 0;

	constructor(config: PerformanceAnalyzerConfig = DEFAULT_ANALYZER_CONFIG) {
		this.config = config;
	}

	/**
	 * Determines the performance level based on current metrics
	 */
	analyzeLevel(profile: PerformanceProfile): PerformanceLevel {
		const { fps, frameTime } = profile;
		const { thresholds } = this.config;

		if (fps >= thresholds.excellent.minFps && frameTime <= thresholds.excellent.maxFrameTime) {
			return PerformanceLevel.EXCELLENT;
		}

		if (fps >= thresholds.good.minFps && frameTime <= thresholds.good.maxFrameTime) {
			return PerformanceLevel.GOOD;
		}

		if (fps >= thresholds.acceptable.minFps && frameTime <= thresholds.acceptable.maxFrameTime) {
			return PerformanceLevel.ACCEPTABLE;
		}

		if (fps >= thresholds.poor.minFps && frameTime <= thresholds.poor.maxFrameTime) {
			return PerformanceLevel.POOR;
		}

		return PerformanceLevel.CRITICAL;
	}

	/**
	 * Updates internal counters based on current performance level
	 * Returns the current level after updating counters
	 */
	updateCounters(level: PerformanceLevel): void {
		const isPoor = level === PerformanceLevel.POOR || level === PerformanceLevel.CRITICAL;
		const isGood =
			level === PerformanceLevel.EXCELLENT ||
			level === PerformanceLevel.GOOD ||
			level === PerformanceLevel.ACCEPTABLE;

		if (isPoor) {
			this.consecutivePoorFrames++;
			this.consecutiveGoodFrames = 0;
		} else if (isGood) {
			this.consecutiveGoodFrames++;
			this.consecutivePoorFrames = 0;
		}
	}

	/**
	 * Determines if degradation should be applied
	 * Returns true if 3+ sustained poor frames
	 */
	shouldDegrade(): boolean {
		return this.consecutivePoorFrames >= this.config.degradeThreshold;
	}

	/**
	 * Determines if upgrade (revert degradation) should be applied
	 * Returns true if 10+ sustained good frames
	 */
	shouldUpgrade(): boolean {
		return this.consecutiveGoodFrames >= this.config.upgradeThreshold;
	}

	/**
	 * Resets the consecutive frame counters
	 * Called after applying or reverting a strategy
	 */
	resetCounters(): void {
		this.consecutivePoorFrames = 0;
		this.consecutiveGoodFrames = 0;
	}

	/**
	 * Gets the current consecutive poor frame count
	 */
	getConsecutivePoorFrames(): number {
		return this.consecutivePoorFrames;
	}

	/**
	 * Gets the current consecutive good frame count
	 */
	getConsecutiveGoodFrames(): number {
		return this.consecutiveGoodFrames;
	}
}
