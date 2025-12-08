/**
 * IFrameCapture Interface
 * Defines the contract for frame capture adapters
 *
 * Application Layer - Port for frame capture infrastructure
 */

/**
 * Captured frame data ready for worker processing
 */
export interface CapturedFrame {
	imageData: ImageBitmap;
	timestamp: number;
	width: number;
	height: number;
}

/**
 * Frame capture configuration
 */
export interface FrameCaptureConfig {
	width?: number;
	height?: number;
	frameRate?: number;
	facingMode?: 'user' | 'environment';
}

/**
 * Frame capture callbacks
 */
export interface FrameCaptureCallbacks {
	onFrame?: (frame: CapturedFrame) => void;
	onError?: (error: string) => void;
	onStreamReady?: (stream: MediaStream) => void;
}

/**
 * IFrameCapture - Interface for frame capture adapters
 * Follows Dependency Inversion Principle
 */
export interface IFrameCapture {
	/**
	 * Initialize the frame capture system
	 */
	initialize(config?: FrameCaptureConfig): Promise<void>;

	/**
	 * Start capturing frames
	 */
	start(callbacks: FrameCaptureCallbacks): void;

	/**
	 * Stop capturing frames
	 */
	stop(): void;

	/**
	 * Check if capture is active
	 */
	isCapturing(): boolean;

	/**
	 * Get the video stream (for debug display)
	 */
	getStream(): MediaStream | null;

	/**
	 * Dispose and cleanup resources
	 */
	dispose(): void;
}
