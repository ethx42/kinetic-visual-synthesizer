/**
 * Performance Manager
 * Orchestrates performance monitoring and automatic adaptation
 * Implements continuous monitoring with configurable sampling
 */

import {
	type PerformanceProfile,
	PerformanceLevel,
	createPerformanceProfile
} from '../domain/entities/PerformanceProfile';
import {
	PerformanceAnalyzer,
	type PerformanceAnalyzerConfig,
	DEFAULT_ANALYZER_CONFIG
} from '../domain/services/PerformanceAnalyzer';
import type { IDegradationStrategy } from '../domain/strategies/DegradationStrategy';

/**
 * Configuration for the Performance Manager
 */
export interface PerformanceManagerConfig {
	sampleIntervalMs: number; // Sampling interval in milliseconds
	maxSamples: number; // Maximum number of samples to keep
	analyzerConfig: PerformanceAnalyzerConfig;
}

/**
 * Default manager configuration
 * - 1 sample per second (1000ms)
 * - Keep last 60 samples (1 minute of history)
 */
export const DEFAULT_MANAGER_CONFIG: PerformanceManagerConfig = {
	sampleIntervalMs: 1000,
	maxSamples: 60,
	analyzerConfig: DEFAULT_ANALYZER_CONFIG
};

/**
 * Callback types for performance events
 */
export type PerformanceLevelCallback = (level: PerformanceLevel) => void;
export type StrategyAppliedCallback = (strategy: IDegradationStrategy) => void;
export type StrategyRevertedCallback = (strategy: IDegradationStrategy) => void;

/**
 * Performance Manager
 * Manages performance monitoring, analysis, and automatic adaptation
 */
export class PerformanceManager {
	private readonly config: PerformanceManagerConfig;
	private readonly analyzer: PerformanceAnalyzer;
	private readonly strategies: IDegradationStrategy[];
	private readonly appliedStrategies: IDegradationStrategy[] = [];
	private readonly samples: PerformanceProfile[] = [];

	private intervalId: ReturnType<typeof setInterval> | null = null;
	private isRunning: boolean = false;
	private currentLevel: PerformanceLevel = PerformanceLevel.GOOD;

	// Metric getters (injected for dependency inversion)
	private getFps: () => number;
	private getRenderCalls: () => number;
	private getParticleCount: () => number;

	// Event callbacks
	private onLevelChange?: PerformanceLevelCallback;
	private onStrategyApplied?: StrategyAppliedCallback;
	private onStrategyReverted?: StrategyRevertedCallback;

	constructor(
		strategies: IDegradationStrategy[],
		metricGetters: {
			getFps: () => number;
			getRenderCalls: () => number;
			getParticleCount: () => number;
		},
		config: PerformanceManagerConfig = DEFAULT_MANAGER_CONFIG
	) {
		this.config = config;
		this.analyzer = new PerformanceAnalyzer(config.analyzerConfig);
		this.strategies = [...strategies].sort((a, b) => a.priority - b.priority);
		this.getFps = metricGetters.getFps;
		this.getRenderCalls = metricGetters.getRenderCalls;
		this.getParticleCount = metricGetters.getParticleCount;
	}

	/**
	 * Starts continuous performance monitoring
	 */
	start(): void {
		if (this.isRunning) {
			return;
		}

		this.isRunning = true;
		this.intervalId = setInterval(() => {
			this.sample();
		}, this.config.sampleIntervalMs);
	}

	/**
	 * Stops performance monitoring
	 */
	stop(): void {
		if (!this.isRunning || this.intervalId === null) {
			return;
		}

		clearInterval(this.intervalId);
		this.intervalId = null;
		this.isRunning = false;
	}

	/**
	 * Takes a performance sample and processes it
	 */
	sample(): void {
		const fps = this.getFps();
		const frameTime = fps > 0 ? 1000 / fps : 0;
		const renderCalls = this.getRenderCalls();
		const particleCount = this.getParticleCount();

		const profile = createPerformanceProfile(fps, frameTime, renderCalls, particleCount);
		this.addSample(profile);

		const level = this.analyzer.analyzeLevel(profile);
		this.analyzer.updateCounters(level);

		if (level !== this.currentLevel) {
			this.currentLevel = level;
			this.onLevelChange?.(level);
		}

		this.processAdaptation();
	}

	/**
	 * Adds a sample to the history, maintaining max sample limit
	 */
	private addSample(profile: PerformanceProfile): void {
		this.samples.push(profile);

		while (this.samples.length > this.config.maxSamples) {
			this.samples.shift();
		}
	}

	/**
	 * Processes adaptation logic - degrade or upgrade as needed
	 */
	private processAdaptation(): void {
		if (this.analyzer.shouldDegrade()) {
			this.applyNextStrategy();
			this.analyzer.resetCounters();
		} else if (this.analyzer.shouldUpgrade()) {
			this.revertLastStrategy();
			this.analyzer.resetCounters();
		}
	}

	/**
	 * Applies the next available strategy by priority
	 */
	private applyNextStrategy(): void {
		for (const strategy of this.strategies) {
			if (strategy.canApply()) {
				strategy.apply();
				this.appliedStrategies.push(strategy);
				this.onStrategyApplied?.(strategy);
				return;
			}
		}
	}

	/**
	 * Reverts the last applied strategy (LIFO order)
	 */
	private revertLastStrategy(): void {
		const strategy = this.appliedStrategies.pop();
		if (strategy) {
			strategy.revert();
			this.onStrategyReverted?.(strategy);
		}
	}

	/**
	 * Sets the callback for performance level changes
	 */
	setOnLevelChange(callback: PerformanceLevelCallback): void {
		this.onLevelChange = callback;
	}

	/**
	 * Sets the callback for when a strategy is applied
	 */
	setOnStrategyApplied(callback: StrategyAppliedCallback): void {
		this.onStrategyApplied = callback;
	}

	/**
	 * Sets the callback for when a strategy is reverted
	 */
	setOnStrategyReverted(callback: StrategyRevertedCallback): void {
		this.onStrategyReverted = callback;
	}

	/**
	 * Gets the current performance level
	 */
	getCurrentLevel(): PerformanceLevel {
		return this.currentLevel;
	}

	/**
	 * Gets the list of currently applied strategies
	 */
	getAppliedStrategies(): readonly IDegradationStrategy[] {
		return this.appliedStrategies;
	}

	/**
	 * Gets the sample history
	 */
	getSamples(): readonly PerformanceProfile[] {
		return this.samples;
	}

	/**
	 * Gets the latest sample
	 */
	getLatestSample(): PerformanceProfile | undefined {
		return this.samples[this.samples.length - 1];
	}

	/**
	 * Checks if the manager is currently running
	 */
	getIsRunning(): boolean {
		return this.isRunning;
	}

	/**
	 * Manually triggers degradation (for testing)
	 */
	forceDegradation(): void {
		this.applyNextStrategy();
	}

	/**
	 * Manually triggers upgrade (for testing)
	 */
	forceUpgrade(): void {
		this.revertLastStrategy();
	}

	/**
	 * Resets all applied strategies
	 */
	resetAllStrategies(): void {
		while (this.appliedStrategies.length > 0) {
			this.revertLastStrategy();
		}
	}

	/**
	 * Cleans up resources
	 */
	destroy(): void {
		this.stop();
		this.resetAllStrategies();
		this.samples.length = 0;
	}
}
