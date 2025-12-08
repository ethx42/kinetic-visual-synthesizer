/**
 * MediaPipeMainThreadAdapter
 * Adapter for running MediaPipe on the main thread
 *
 * Infrastructure Layer - Implements IVisionWorkerAdapter interface
 *
 * Note: MediaPipe Tasks Vision doesn't work well with ES module workers
 * (importScripts conflict). This adapter runs MediaPipe on the main thread
 * but uses requestIdleCallback to minimize impact on rendering performance.
 *
 * The adapter implements the same interface as VisionWorkerAdapter, allowing
 * for easy swapping if MediaPipe ever supports ES module workers.
 */

import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type {
	IVisionWorkerAdapter,
	WorkerProcessingResult,
	WorkerAdapterCallbacks,
	WorkerAdapterConfig
} from '../../application/interfaces/IVisionWorkerAdapter';

const DEFAULT_CONFIG: Required<WorkerAdapterConfig> = {
	modelAssetPath:
		'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
	numHands: 2,
	minDetectionConfidence: 0.4,
	minTrackingConfidence: 0.4
};

export class MediaPipeMainThreadAdapter implements IVisionWorkerAdapter {
	private landmarker: HandLandmarker | null = null;
	private callbacks: WorkerAdapterCallbacks = {};
	private ready = false;
	private queueSize = 0;
	private initPromise: Promise<void> | null = null;

	async initialize(config?: WorkerAdapterConfig): Promise<void> {
		if (this.initPromise) {
			return this.initPromise;
		}

		this.initPromise = this.doInitialize(config);
		return this.initPromise;
	}

	private async doInitialize(config?: WorkerAdapterConfig): Promise<void> {
		const mergedConfig = { ...DEFAULT_CONFIG, ...config };

		try {
			const vision = await FilesetResolver.forVisionTasks(
				'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm'
			);

			this.landmarker = await HandLandmarker.createFromOptions(vision, {
				baseOptions: {
					modelAssetPath: mergedConfig.modelAssetPath,
					delegate: 'GPU'
				},
				runningMode: 'VIDEO',
				numHands: mergedConfig.numHands,
				minHandDetectionConfidence: mergedConfig.minDetectionConfidence,
				minHandPresenceConfidence: mergedConfig.minDetectionConfidence,
				minTrackingConfidence: mergedConfig.minTrackingConfidence
			});

			this.ready = true;
			this.callbacks.onInitialized?.();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.callbacks.onError?.(`Failed to initialize HandLandmarker: ${errorMessage}`);
			throw error;
		}
	}

	processFrame(imageData: ImageBitmap, timestamp: number): void {
		if (!this.landmarker || !this.ready) {
			return;
		}

		if (this.queueSize > 2) {
			imageData.close();
			return;
		}

		this.queueSize++;

		const processAsync = () => {
			if (!this.landmarker || !this.ready) {
				this.queueSize = Math.max(0, this.queueSize - 1);
				imageData.close();
				return;
			}

			const startTime = performance.now();

			try {
				const results = this.landmarker.detectForVideo(imageData, timestamp);

				const hands = results.landmarks.map((hand, handIndex) => {
					const handednessData = results.handednesses?.[handIndex];
					let handedness: 'left' | 'right' | undefined;

					if (handednessData && Array.isArray(handednessData) && handednessData.length > 0) {
						const category = handednessData[0].categoryName?.toLowerCase();
						if (category === 'left' || category === 'right') {
							handedness = category;
						}
					}

					return {
						landmarks: hand.map((landmark) => ({
							x: landmark.x,
							y: landmark.y,
							z: landmark.z ?? 0
						})),
						confidence: (handednessData as Array<{ score?: number }>)?.[0]?.score ?? 0.5,
						handedness
					};
				});

				const processingTimeMs = performance.now() - startTime;

				const result: WorkerProcessingResult = {
					hands,
					timestamp,
					processingTimeMs
				};

				// Debug: Log if we have hands detected (dev mode only)
				// if (import.meta.env.DEV && hands.length > 0) {
				// 	console.log(`[MediaPipeMainThreadAdapter] Detected ${hands.length} hand(s)`);
				// }

				this.callbacks.onResult?.(result);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				this.callbacks.onError?.(`Frame processing failed: ${errorMessage}`);
			} finally {
				this.queueSize = Math.max(0, this.queueSize - 1);
				imageData.close();
			}
		};

		if ('requestIdleCallback' in window) {
			requestIdleCallback(processAsync, { timeout: 16 });
		} else {
			setTimeout(processAsync, 0);
		}
	}

	setCallbacks(callbacks: WorkerAdapterCallbacks): void {
		this.callbacks = callbacks;
	}

	isReady(): boolean {
		return this.ready;
	}

	getQueueSize(): number {
		return this.queueSize;
	}

	terminate(): void {
		this.landmarker = null;
		this.ready = false;
		this.queueSize = 0;
		this.initPromise = null;
	}
}
