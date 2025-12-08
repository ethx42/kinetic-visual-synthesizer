/**
 * VisionFacade
 * Simplified API for vision system integration with Svelte components
 *
 * Presentation Layer - Facade pattern for simplified component integration
 */

import { VisionUseCase } from '../application/use-cases/VisionUseCase';
import { VisionWorkerAdapter } from '../infrastructure/adapters/VisionWorkerAdapter';
import { FrameCaptureAdapter } from '../infrastructure/adapters/FrameCaptureAdapter';
import type { VisionFrame } from '../domain/entities/VisionFrame';
import type { SignalAnalysisResult } from '../domain/services/SignalAnalyzer';
import type { VisionUseCaseConfig } from '../application/interfaces/IVisionUseCase';

/**
 * Vision facade callbacks for Svelte component integration
 */
export interface VisionFacadeCallbacks {
	onFrame?: (frame: VisionFrame) => void;
	onTension?: (tension: number) => void;
	onSignalAnalysis?: (analysis: SignalAnalysisResult) => void;
	onError?: (error: string) => void;
	onInitialized?: () => void;
	onStreamReady?: (stream: MediaStream) => void;
}

/**
 * Vision facade configuration
 */
export interface VisionFacadeConfig extends VisionUseCaseConfig {
	autoStart?: boolean;
}

/**
 * VisionFacade - Simplified API for vision system
 * Handles dependency injection and lifecycle management
 */
export class VisionFacade {
	private useCase: VisionUseCase | null = null;
	private workerAdapter: VisionWorkerAdapter | null = null;
	private frameCaptureAdapter: FrameCaptureAdapter | null = null;
	private initialized = false;
	private config: VisionFacadeConfig;

	constructor(config?: VisionFacadeConfig) {
		this.config = {
			smoothstepMin: 0.3,
			smoothstepMax: 1.5,
			smoothingAlpha: 0.2,
			targetFps: 30,
			autoStart: false,
			...config
		};
	}

	/**
	 * Initialize the vision system
	 */
	async initialize(): Promise<void> {
		if (this.initialized) {
			return;
		}

		this.workerAdapter = new VisionWorkerAdapter();
		this.frameCaptureAdapter = new FrameCaptureAdapter();

		this.useCase = new VisionUseCase(this.frameCaptureAdapter, this.workerAdapter);

		await this.useCase.initialize({
			smoothstepMin: this.config.smoothstepMin,
			smoothstepMax: this.config.smoothstepMax,
			smoothingAlpha: this.config.smoothingAlpha,
			targetFps: this.config.targetFps
		});

		this.initialized = true;
	}

	/**
	 * Start vision processing with callbacks
	 */
	start(callbacks: VisionFacadeCallbacks): void {
		if (!this.useCase) {
			callbacks.onError?.('Vision system not initialized');
			return;
		}

		this.useCase.start({
			onFrame: callbacks.onFrame,
			onTension: callbacks.onTension,
			onSignalAnalysis: callbacks.onSignalAnalysis,
			onError: callbacks.onError,
			onInitialized: callbacks.onInitialized,
			onStreamReady: callbacks.onStreamReady
		});
	}

	/**
	 * Stop vision processing
	 */
	stop(): void {
		this.useCase?.stop();
	}

	/**
	 * Check if vision system is running
	 */
	isRunning(): boolean {
		return this.useCase?.isRunning() ?? false;
	}

	/**
	 * Check if vision system is initialized
	 */
	isInitialized(): boolean {
		return this.initialized;
	}

	/**
	 * Update configuration (e.g., calibration settings)
	 */
	updateConfig(config: Partial<VisionUseCaseConfig>): void {
		this.config = { ...this.config, ...config };
		this.useCase?.updateConfig(config);
	}

	/**
	 * Get the video stream for debug display
	 */
	getStream(): MediaStream | null {
		return this.useCase?.getStream() ?? null;
	}

	/**
	 * Dispose and cleanup all resources
	 */
	dispose(): void {
		this.useCase?.dispose();
		this.useCase = null;
		this.workerAdapter = null;
		this.frameCaptureAdapter = null;
		this.initialized = false;
	}
}

/**
 * Create a new VisionFacade instance
 * Factory function for easier instantiation
 */
export function createVisionFacade(config?: VisionFacadeConfig): VisionFacade {
	return new VisionFacade(config);
}
