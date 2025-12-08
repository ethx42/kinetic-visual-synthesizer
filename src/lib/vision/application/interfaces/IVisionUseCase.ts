/**
 * IVisionUseCase Interface
 * Defines the contract for vision use case orchestration
 *
 * Application Layer - Use case interface
 */

import type { VisionFrame } from '../../domain/entities/VisionFrame';
import type { SignalAnalysisResult } from '../../domain/services/SignalAnalyzer';

/**
 * Vision use case callbacks
 */
export interface VisionUseCaseCallbacks {
	onFrame?: (frame: VisionFrame) => void;
	onTension?: (tension: number) => void;
	onSignalAnalysis?: (analysis: SignalAnalysisResult) => void;
	onError?: (error: string) => void;
	onInitialized?: () => void;
	onStreamReady?: (stream: MediaStream) => void;
}

/**
 * Vision use case configuration
 */
export interface VisionUseCaseConfig {
	smoothstepMin?: number;
	smoothstepMax?: number;
	smoothingAlpha?: number;
	targetFps?: number;
}

/**
 * IVisionUseCase - Interface for vision use case
 * Orchestrates: capture -> worker -> domain -> stores
 */
export interface IVisionUseCase {
	/**
	 * Initialize the vision system
	 */
	initialize(config?: VisionUseCaseConfig): Promise<void>;

	/**
	 * Start vision processing
	 */
	start(callbacks: VisionUseCaseCallbacks): void;

	/**
	 * Stop vision processing
	 */
	stop(): void;

	/**
	 * Check if vision system is running
	 */
	isRunning(): boolean;

	/**
	 * Update configuration (e.g., calibration settings)
	 */
	updateConfig(config: Partial<VisionUseCaseConfig>): void;

	/**
	 * Get the video stream for debug display
	 */
	getStream(): MediaStream | null;

	/**
	 * Dispose and cleanup all resources
	 */
	dispose(): void;
}
