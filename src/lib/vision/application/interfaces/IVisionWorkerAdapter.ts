/**
 * IVisionWorkerAdapter Interface
 * Defines the contract for worker communication adapters
 *
 * Application Layer - Port for worker infrastructure
 */

import type { RawLandmarkData } from '../../domain/services/FrameProcessor';

/**
 * Worker processing result
 */
export interface WorkerProcessingResult {
	hands: RawLandmarkData[];
	timestamp: number;
	processingTimeMs: number;
}

/**
 * Worker adapter callbacks
 */
export interface WorkerAdapterCallbacks {
	onResult?: (result: WorkerProcessingResult) => void;
	onError?: (error: string) => void;
	onInitialized?: () => void;
}

/**
 * Worker adapter configuration
 */
export interface WorkerAdapterConfig {
	modelAssetPath?: string;
	numHands?: number;
	minDetectionConfidence?: number;
	minTrackingConfidence?: number;
}

/**
 * IVisionWorkerAdapter - Interface for worker communication adapters
 * Follows Dependency Inversion Principle
 */
export interface IVisionWorkerAdapter {
	/**
	 * Initialize the worker and MediaPipe model
	 */
	initialize(config?: WorkerAdapterConfig): Promise<void>;

	/**
	 * Process a frame through the worker
	 * Uses transferable objects for zero-copy communication
	 */
	processFrame(imageData: ImageBitmap, timestamp: number): void;

	/**
	 * Set callbacks for worker events
	 */
	setCallbacks(callbacks: WorkerAdapterCallbacks): void;

	/**
	 * Check if worker is initialized and ready
	 */
	isReady(): boolean;

	/**
	 * Get current queue size (pending frames)
	 */
	getQueueSize(): number;

	/**
	 * Terminate the worker
	 */
	terminate(): void;
}
