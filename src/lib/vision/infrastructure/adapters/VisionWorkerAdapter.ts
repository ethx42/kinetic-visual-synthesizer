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

		// Initialize worker as Classic Worker to support importScripts() used by MediaPipe
		// We use new URL() pattern which Vite recognizes and bundles appropriately
		this.worker = new Worker(new URL('../worker/vision.worker.ts', import.meta.url), {
			type: 'classic'
		});

		return new Promise<void>((resolve, reject) => {
			if (!this.worker) {
				reject(new Error('Worker not created'));
				return;
			}

			const timeoutId = setTimeout(() => {
				reject(new Error('Worker initialization timeout'));
			}, 30000);

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
						this.callbacks.onError?.(message.error);
						if (!this.ready) {
							clearTimeout(timeoutId);
							reject(new Error(message.error));
						}
						break;
				}
			};

			this.worker.onerror = (error) => {
				clearTimeout(timeoutId);
				const errorMessage = error.message || 'Unknown worker error';
				this.callbacks.onError?.(errorMessage);
				reject(new Error(errorMessage));
			};

			const initMessage: WorkerInitMessage = {
				type: 'init',
				config: mergedConfig
			};

			this.worker.postMessage(initMessage);
		});
	}

	/**
	 * Process a frame through the worker
	 * Uses transferable objects for zero-copy communication
	 */
	processFrame(imageData: ImageBitmap, timestamp: number): void {
		if (!this.worker || !this.ready) {
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
