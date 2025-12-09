/**
 * Application Service: Performance Management
 * Orchestrates performance monitoring and adaptation
 *
 * This is the main orchestrator that:
 * - Monitors performance metrics continuously
 * - Analyzes performance history
 * - Applies/reverts degradation strategies based on performance
 *
 * Clean Architecture: Application Layer
 * Design Patterns: Strategy, Observer, Facade
 */

import { get } from 'svelte/store';
import type { IPerformanceAnalyzer } from '../domain/services/PerformanceAnalyzer';
import type { PerformanceProfile } from '../domain/entities/PerformanceProfile';
import { PerformanceLevel } from '../domain/entities/PerformanceProfile';
import { createPerformanceProfile } from '../domain/entities/PerformanceProfile';
import type {
	IDegradationStrategy,
	PerformanceContext
} from '../domain/strategies/DegradationStrategy';
import { getFps, getRenderCalls } from '$lib/stores/telemetry';
import { particleCount } from '$lib/stores/settings';
import { ErrorHandler } from '$lib/utils/errorHandler';

/**
 * Performance Manager Configuration
 */
export interface PerformanceManagerConfig {
	/**
	 * Sampling interval in milliseconds
	 * @default 1000 (1 second)
	 */
	samplingInterval?: number;

	/**
	 * Maximum history size (number of samples to keep)
	 * @default 60 (1 minute at 1 sample/sec)
	 */
	maxHistorySize?: number;

	/**
	 * Enable debug logging
	 * @default false (uses import.meta.env.DEV)
	 */
	enableDebugLogging?: boolean;
}

/**
 * Performance Manager Interface
 * Defines the contract for performance management
 */
export interface IPerformanceManager {
	start(): void;
	stop(): void;
	registerStrategy(strategy: IDegradationStrategy): void;
	getCurrentLevel(): PerformanceLevel;
	getHistory(): readonly PerformanceProfile[];
	isMonitoring(): boolean;
}

/**
 * Performance Manager
 * Main orchestrator for performance monitoring and adaptation
 */
export class PerformanceManager implements IPerformanceManager {
	private readonly analyzer: IPerformanceAnalyzer;
	private readonly context: PerformanceContext;
	private readonly config: Required<PerformanceManagerConfig>;

	private strategies: IDegradationStrategy[] = [];
	private history: PerformanceProfile[] = [];
	private appliedStrategies: IDegradationStrategy[] = [];
	private _isMonitoring = false;
	private monitoringInterval: number | null = null;
	private _isCollecting = false; // Race condition protection

	/**
	 * Maximum number of strategies that can be applied simultaneously
	 * Safety limit to prevent excessive degradation
	 */
	private static readonly MAX_APPLIED_STRATEGIES = 10;

	constructor(
		analyzer: IPerformanceAnalyzer,
		context: PerformanceContext,
		config: PerformanceManagerConfig = {}
	) {
		this.analyzer = analyzer;
		this.context = context;
		this.config = {
			samplingInterval: config.samplingInterval ?? 1000,
			maxHistorySize: config.maxHistorySize ?? 60,
			enableDebugLogging: config.enableDebugLogging ?? import.meta.env.DEV
		};
	}

	/**
	 * Start performance monitoring
	 */
	start(): void {
		if (this._isMonitoring) {
			if (this.config.enableDebugLogging) {
				console.warn('[PerformanceManager] Already monitoring, ignoring start() call');
			}
			return;
		}

		this._isMonitoring = true;
		this.monitoringInterval = window.setInterval(() => {
			this.collectMetrics();
		}, this.config.samplingInterval);

		if (this.config.enableDebugLogging) {
			console.log(
				`[PerformanceManager] Started monitoring (interval: ${this.config.samplingInterval}ms)`
			);
		}
	}

	/**
	 * Stop performance monitoring
	 */
	stop(): void {
		if (!this._isMonitoring) {
			return;
		}

		this._isMonitoring = false;

		if (this.monitoringInterval !== null) {
			clearInterval(this.monitoringInterval);
			this.monitoringInterval = null;
		}

		// Revert all applied strategies
		this.revertAllStrategies();

		if (this.config.enableDebugLogging) {
			console.log('[PerformanceManager] Stopped monitoring');
		}
	}

	/**
	 * Register a degradation strategy
	 */
	registerStrategy(strategy: IDegradationStrategy): void {
		// Sort strategies by priority (lower priority = applied first)
		this.strategies.push(strategy);
		this.strategies.sort((a, b) => a.priority - b.priority);

		if (this.config.enableDebugLogging) {
			console.log(
				`[PerformanceManager] Registered strategy: ${strategy.name} (priority: ${strategy.priority})`
			);
		}
	}

	/**
	 * Get current performance level
	 */
	getCurrentLevel(): PerformanceLevel {
		if (this.history.length === 0) {
			return PerformanceLevel.GOOD; // Default assumption
		}

		const latest = this.history[this.history.length - 1];
		return this.analyzer.analyze(latest);
	}

	/**
	 * Get performance history
	 */
	getHistory(): readonly PerformanceProfile[] {
		return this.history;
	}

	/**
	 * Check if monitoring is active
	 * @returns True if monitoring is currently active
	 */
	isMonitoring(): boolean {
		return this._isMonitoring;
	}

	/**
	 * Collect performance metrics
	 * Private method called by monitoring interval
	 * Includes race condition protection to prevent overlapping executions
	 */
	private collectMetrics(): void {
		// Race condition protection: prevent overlapping executions
		if (this._isCollecting) {
			if (this.config.enableDebugLogging) {
				console.warn('[PerformanceManager] Metrics collection already in progress, skipping');
			}
			return;
		}

		this._isCollecting = true;

		try {
			const currentFps = getFps();
			const currentRenderCalls = getRenderCalls();
			const currentParticleCount = get(particleCount);

			// Use factory function for consistent profile creation
			const profile = createPerformanceProfile(
				currentFps,
				currentRenderCalls,
				currentParticleCount,
				performance.now()
			);

			this.history.push(profile);

			// Keep only last N samples
			if (this.history.length > this.config.maxHistorySize) {
				this.history.shift();
			}

			// Analyze and adapt
			this.adapt(profile);
		} finally {
			this._isCollecting = false;
		}
	}

	/**
	 * Adapt performance based on current metrics
	 * Private method that applies/reverts strategies
	 */
	private adapt(profile: PerformanceProfile): void {
		const level = this.analyzer.analyze(profile);

		if (this.analyzer.shouldDegrade(profile, this.history)) {
			this.applyDegradation();
		} else if (this.analyzer.shouldUpgrade(profile, this.history)) {
			this.revertDegradation();
		}

		// Log current state in dev mode
		if (this.config.enableDebugLogging && this.history.length % 10 === 0) {
			// Log every 10 samples to avoid spam
			console.log(
				`[PerformanceManager] Status: ${level} | FPS: ${profile.fps.toFixed(1)} | ` +
					`FrameTime: ${profile.frameTime.toFixed(2)}ms | ` +
					`Strategies applied: ${this.appliedStrategies.length}`
			);
		}
	}

	/**
	 * Apply performance degradation
	 * Private method that applies the next available strategy
	 * Includes error handling and safety limits to prevent monitoring from breaking
	 */
	private applyDegradation(): void {
		// Safety check: prevent excessive strategy application
		if (this.appliedStrategies.length >= PerformanceManager.MAX_APPLIED_STRATEGIES) {
			if (this.config.enableDebugLogging) {
				console.warn(
					`[PerformanceManager] Max strategies applied (${PerformanceManager.MAX_APPLIED_STRATEGIES}), skipping`
				);
			}
			return;
		}

		// Find available strategies that haven't been applied
		const availableStrategies = this.strategies
			.filter((s) => !this.appliedStrategies.includes(s))
			.filter((s) => s.canApply(this.context))
			.sort((a, b) => a.priority - b.priority); // Sort by priority

		if (availableStrategies.length === 0) {
			if (this.config.enableDebugLogging) {
				console.warn('[PerformanceManager] No available strategies to apply');
			}
			return;
		}

		// Apply the first available strategy (highest priority)
		const strategy = availableStrategies[0];

		try {
			strategy.apply(this.context);
			this.appliedStrategies.push(strategy);
		} catch (error) {
			ErrorHandler.handleError(
				error,
				`PerformanceManager.applyDegradation (strategy: ${strategy.name})`
			);
			// Continue with next strategy instead of breaking
			// Continue monitoring - don't break the system
			// Try next strategy if available
			if (availableStrategies.length > 1) {
				const nextStrategy = availableStrategies[1];
				try {
					nextStrategy.apply(this.context);
					this.appliedStrategies.push(nextStrategy);
				} catch (nextError) {
					ErrorHandler.handleError(
						nextError,
						`PerformanceManager.applyDegradation (fallback strategy: ${nextStrategy.name})`
					);
					if (this.config.enableDebugLogging) {
						// Additional debug logging if enabled
					}
				}
			}
		}
	}

	/**
	 * Revert performance degradation
	 * Private method that reverts the last applied strategy
	 * Includes error handling to prevent monitoring from breaking
	 */
	private revertDegradation(): void {
		if (this.appliedStrategies.length === 0) {
			return;
		}

		// Revert in reverse order (LIFO - Last In First Out)
		const strategiesToRevert = [...this.appliedStrategies].reverse();

		for (const strategy of strategiesToRevert) {
			try {
				strategy.revert(this.context);
				this.appliedStrategies = this.appliedStrategies.filter((s) => s !== strategy);
				break; // Revert one at a time
			} catch (error) {
				ErrorHandler.handleError(
					error,
					`PerformanceManager.revertDegradation (strategy: ${strategy.name})`
				);
				if (this.config.enableDebugLogging) {
					// Additional debug logging if enabled
				}
				// Remove from applied list even if revert failed
				this.appliedStrategies = this.appliedStrategies.filter((s) => s !== strategy);
				break; // Continue with next strategy
			}
		}
	}

	/**
	 * Revert all applied strategies
	 * Private method called on stop()
	 * Includes error handling to ensure cleanup completes
	 */
	private revertAllStrategies(): void {
		// Revert in reverse order
		const strategiesToRevert = [...this.appliedStrategies].reverse();

		for (const strategy of strategiesToRevert) {
			try {
				strategy.revert(this.context);
			} catch (error) {
				ErrorHandler.handleError(
					error,
					`PerformanceManager.revertAllStrategies (strategy: ${strategy.name})`
				);
				if (this.config.enableDebugLogging) {
					// Additional debug logging if enabled
				}
				// Continue reverting other strategies even if one fails
			}
		}

		this.appliedStrategies = [];
	}
}
