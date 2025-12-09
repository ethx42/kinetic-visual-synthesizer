/**
 * VisionFacade
 * Simplified API for vision system integration with Svelte components
 *
 * Presentation Layer - Facade pattern for simplified component integration
 */

import { VisionUseCase } from '../application/use-cases/VisionUseCase';
import { VisionWorkerAdapter } from '../infrastructure/adapters/VisionWorkerAdapter';
import { MediaPipeMainThreadAdapter } from '../infrastructure/adapters/MediaPipeMainThreadAdapter';
import { FrameCaptureAdapter } from '../infrastructure/adapters/FrameCaptureAdapter';
import type { VisionFrame } from '../domain/entities/VisionFrame';
import type { SignalAnalysisResult } from '../domain/services/SignalAnalyzer';
import type { VisionUseCaseConfig } from '../application/interfaces/IVisionUseCase';
import type { IVisionWorkerAdapter } from '../application/interfaces/IVisionWorkerAdapter';

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
	private mediaPipeAdapter: IVisionWorkerAdapter | null = null;
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
	 * Attempts to use VisionWorkerAdapter first, falls back to MediaPipeMainThreadAdapter
	 * if worker initialization fails (e.g., importScripts error in dev mode)
	 */
	async initialize(): Promise<void> {
		if (this.initialized) {
			return;
		}

		this.frameCaptureAdapter = new FrameCaptureAdapter();

		// Try worker adapter first (optimal performance)
		try {
			this.mediaPipeAdapter = new VisionWorkerAdapter();
			this.useCase = new VisionUseCase(this.frameCaptureAdapter, this.mediaPipeAdapter);

			await this.useCase.initialize({
				smoothstepMin: this.config.smoothstepMin,
				smoothstepMax: this.config.smoothstepMax,
				smoothingAlpha: this.config.smoothingAlpha,
				targetFps: this.config.targetFps
			});

			console.log('[VisionFacade] Worker adapter initialized successfully');
			this.initialized = true;
		} catch (error) {
			// Check if error is related to importScripts (worker module issue)
			const errorMessage = error instanceof Error ? error.message : String(error);
			const isWorkerError =
				errorMessage.includes('importScripts') ||
				errorMessage.includes('Module scripts') ||
				errorMessage.includes('Worker initialization');

			if (isWorkerError) {
				console.warn(
					'[VisionFacade] Worker adapter failed, falling back to main thread adapter:',
					errorMessage
				);

				// Clean up failed worker adapter
				if (this.mediaPipeAdapter) {
					this.mediaPipeAdapter.terminate();
					this.mediaPipeAdapter = null;
				}
				if (this.useCase) {
					this.useCase.dispose();
					this.useCase = null;
				}

				// Fallback to main thread adapter
				try {
					this.mediaPipeAdapter = new MediaPipeMainThreadAdapter();
					this.useCase = new VisionUseCase(this.frameCaptureAdapter, this.mediaPipeAdapter);

					await this.useCase.initialize({
						smoothstepMin: this.config.smoothstepMin,
						smoothstepMax: this.config.smoothstepMax,
						smoothingAlpha: this.config.smoothingAlpha,
						targetFps: this.config.targetFps
					});

					console.log('[VisionFacade] Main thread adapter initialized (fallback mode)');
					this.initialized = true;
				} catch (fallbackError) {
					const fallbackMessage =
						fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
					console.error('[VisionFacade] Fallback adapter also failed:', fallbackMessage);
					throw new Error(
						`Both worker and main thread adapters failed. Worker: ${errorMessage}, Fallback: ${fallbackMessage}`
					);
				}
			} else {
				// Non-worker error, rethrow
				throw error;
			}
		}
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
		this.mediaPipeAdapter = null;
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
