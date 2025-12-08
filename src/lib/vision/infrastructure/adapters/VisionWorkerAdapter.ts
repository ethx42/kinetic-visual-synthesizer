/**
 * VisionWorkerAdapter
 * Adapter for communicating with the vision worker using message queue pattern
 *
 * Infrastructure Layer - Implements IVisionWorkerAdapter interface
 * Uses transferable objects (ImageBitmap) for zero-copy worker communication
 */

import type {
	IVisionWorkerAdapter,
	WorkerProcessingResult,
	WorkerAdapterCallbacks,
	WorkerAdapterConfig
} from '../../application/interfaces/IVisionWorkerAdapter';
import { MediaPipeMainThreadAdapter } from './MediaPipeMainThreadAdapter';

// WORKAROUND for Vite 7 dev mode Classic Worker issue:
// Even with format: 'iife', Vite injects module code in dev mode that breaks Classic Workers.
//
// Solution: Use ?worker&url to get the processed worker URL, then create Worker explicitly
// as Classic. However, ?worker&url may return ESM URL in dev.
//
// Alternative solution: Import worker as raw string and create Blob URL (bypasses Vite injection)
// But this loses TypeScript processing and dependencies.
//
// Best solution: Use new URL() with explicit type: 'classic' and hope Vite respects format config.
// If this fails, we may need to use a different approach or accept that Classic Workers
// don't work in Vite 7 dev mode and use a fallback.

/**
 * Worker message types
 */
interface WorkerInitMessage {
	type: 'init';
	config: WorkerAdapterConfig;
}

interface WorkerFrameMessage {
	type: 'processFrame';
	imageData: ImageBitmap;
	timestamp: number;
}

interface WorkerResultMessage {
	type: 'result';
	hands: Array<{
		landmarks: Array<{ x: number; y: number; z: number }>;
		confidence: number;
		handedness?: 'left' | 'right';
	}>;
	timestamp: number;
	processingTimeMs: number;
}

interface WorkerErrorMessage {
	type: 'error';
	error: string;
}

interface WorkerInitializedMessage {
	type: 'initialized';
}

type WorkerMessage = WorkerResultMessage | WorkerErrorMessage | WorkerInitializedMessage;

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<WorkerAdapterConfig> = {
	modelAssetPath:
		'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
	numHands: 2,
	minDetectionConfidence: 0.4,
	minTrackingConfidence: 0.4
};

/**
 * VisionWorkerAdapter - Implements message queue pattern for worker communication
 */
export class VisionWorkerAdapter implements IVisionWorkerAdapter {
	private worker: Worker | null = null;
	private fallbackAdapter: MediaPipeMainThreadAdapter | null = null;
	private useFallback = false;
	private callbacks: WorkerAdapterCallbacks = {};
	private ready = false;
	private queueSize = 0;
	private initPromise: Promise<void> | null = null;

	/**
	 * Initialize the worker and MediaPipe model
	 */
	async initialize(config?: WorkerAdapterConfig): Promise<void> {
		if (this.initPromise) {
			return this.initPromise;
		}

		this.initPromise = this.doInitialize(config);
		return this.initPromise;
	}

	private async doInitialize(config?: WorkerAdapterConfig): Promise<void> {
		const mergedConfig = { ...DEFAULT_CONFIG, ...config };

		// Try to create Classic Worker
		// In Vite 7 dev mode, this may fail due to module code injection
		try {
			this.worker = new Worker(new URL('../worker/vision.worker.ts', import.meta.url), {
				type: 'classic'
			});

			// Set up worker message handlers
			return new Promise<void>((resolve, reject) => {
				if (!this.worker) {
					this.fallbackToMainThread(mergedConfig, resolve, reject);
					return;
				}

				const timeoutId = setTimeout(() => {
					// Worker initialization timeout - fallback to main thread
					if (import.meta.env.DEV) {
						console.warn(
							'[VisionWorkerAdapter] Worker initialization timeout, falling back to main thread'
						);
					}
					this.fallbackToMainThread(mergedConfig, resolve, reject);
				}, 5000); // Shorter timeout to detect issues faster

				this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
					const message = event.data;

					switch (message.type) {
						case 'initialized':
							clearTimeout(timeoutId);
							this.ready = true;
							this.callbacks.onInitialized?.();
							resolve();
							break;

						case 'result':
							this.queueSize = Math.max(0, this.queueSize - 1);
							this.handleResult(message);
							break;

						case 'error':
							// Check if it's an importScripts error (Classic Worker failure)
							if (
								message.error.includes('importScripts') ||
								message.error.includes('Module scripts')
							) {
								if (import.meta.env.DEV) {
									console.warn(
										'[VisionWorkerAdapter] Classic Worker failed (importScripts error), falling back to main thread'
									);
								}
								clearTimeout(timeoutId);
								this.fallbackToMainThread(mergedConfig, resolve, reject);
							} else {
								this.callbacks.onError?.(message.error);
								if (!this.ready) {
									clearTimeout(timeoutId);
									reject(new Error(message.error));
								}
							}
							break;
					}
				};

				this.worker.onerror = (error) => {
					// Worker creation/execution error - fallback to main thread
					if (import.meta.env.DEV) {
						console.warn(
							'[VisionWorkerAdapter] Worker error detected, falling back to main thread:',
							error.message
						);
					}
					clearTimeout(timeoutId);
					this.fallbackToMainThread(mergedConfig, resolve, reject);
				};

				const initMessage: WorkerInitMessage = {
					type: 'init',
					config: mergedConfig
				};

				this.worker.postMessage(initMessage);
			});
		} catch (error) {
			// Worker creation failed - fallback to main thread
			if (import.meta.env.DEV) {
				console.warn(
					'[VisionWorkerAdapter] Failed to create worker, falling back to main thread:',
					error
				);
			}
			return this.fallbackToMainThread(mergedConfig);
		}
	}

	/**
	 * Fallback to main thread adapter when Classic Worker fails
	 * This happens in Vite 7 dev mode due to module code injection
	 */
	private async fallbackToMainThread(
		config: WorkerAdapterConfig,
		resolve?: () => void,
		reject?: (error: Error) => void
	): Promise<void> {
		// Clean up worker if it exists
		if (this.worker) {
			this.worker.terminate();
			this.worker = null;
		}

		// Use main thread adapter as fallback
		this.useFallback = true;
		this.fallbackAdapter = new MediaPipeMainThreadAdapter();
		this.fallbackAdapter.setCallbacks(this.callbacks);

		try {
			await this.fallbackAdapter.initialize(config);
			this.ready = true;
			if (import.meta.env.DEV) {
				console.log('[VisionWorkerAdapter] Fallback adapter initialized successfully');
			}
			this.callbacks.onInitialized?.();
			if (resolve) resolve();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.callbacks.onError?.(errorMessage);
			if (reject) reject(new Error(errorMessage));
		}
	}

	/**
	 * Process a frame through the worker
	 * Uses transferable objects for zero-copy communication
	 */
	processFrame(imageData: ImageBitmap, timestamp: number): void {
		if (!this.ready) {
			if (import.meta.env.DEV) {
				console.warn('[VisionWorkerAdapter] Not ready, skipping frame');
			}
			return;
		}

		// Use fallback adapter if Classic Worker failed
		if (this.useFallback && this.fallbackAdapter) {
			if (!this.fallbackAdapter.isReady()) {
				if (import.meta.env.DEV) {
					console.warn('[VisionWorkerAdapter] Fallback adapter not ready');
				}
				return;
			}
			this.fallbackAdapter.processFrame(imageData, timestamp);
			return;
		}

		// Use worker
		if (!this.worker) {
			return;
		}

		if (this.queueSize > 2) {
			return;
		}

		this.queueSize++;

		const message: WorkerFrameMessage = {
			type: 'processFrame',
			imageData,
			timestamp
		};

		this.worker.postMessage(message, [imageData]);
	}

	/**
	 * Set callbacks for worker events
	 */
	setCallbacks(callbacks: WorkerAdapterCallbacks): void {
		this.callbacks = callbacks;

		// If fallback adapter is active, also set callbacks on it
		// This ensures callbacks work correctly when fallback is used
		if (this.useFallback && this.fallbackAdapter) {
			this.fallbackAdapter.setCallbacks(callbacks);
		}
	}

	/**
	 * Check if worker is initialized and ready
	 */
	isReady(): boolean {
		return this.ready;
	}

	/**
	 * Get current queue size (pending frames)
	 */
	getQueueSize(): number {
		return this.queueSize;
	}

	/**
	 * Terminate the worker
	 */
	terminate(): void {
		if (this.worker) {
			this.worker.terminate();
			this.worker = null;
		}
		if (this.fallbackAdapter) {
			this.fallbackAdapter.terminate();
			this.fallbackAdapter = null;
		}
		this.useFallback = false;
		this.ready = false;
		this.queueSize = 0;
		this.initPromise = null;
	}

	/**
	 * Handle worker result message
	 */
	private handleResult(message: WorkerResultMessage): void {
		const result: WorkerProcessingResult = {
			hands: message.hands.map((hand) => ({
				landmarks: hand.landmarks,
				confidence: hand.confidence,
				handedness: hand.handedness
			})),
			timestamp: message.timestamp,
			processingTimeMs: message.processingTimeMs
		};

		this.callbacks.onResult?.(result);
	}
}
