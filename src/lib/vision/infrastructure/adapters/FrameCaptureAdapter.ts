/**
 * FrameCaptureAdapter
 * Adapter for capturing video frames using VideoFrame API and MediaStreamTrackProcessor
 *
 * Infrastructure Layer - Implements IFrameCapture interface
 * Uses transferable objects (ImageBitmap) for zero-copy worker communication
 */

import type {
	IFrameCapture,
	CapturedFrame,
	FrameCaptureConfig,
	FrameCaptureCallbacks
} from '../../application/interfaces/IFrameCapture';

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<FrameCaptureConfig> = {
	width: 640,
	height: 480,
	frameRate: 30,
	facingMode: 'user'
};

/**
 * FrameCaptureAdapter - Captures video frames for worker processing
 * Uses createImageBitmap for efficient frame capture with transferable objects
 */
export class FrameCaptureAdapter implements IFrameCapture {
	private stream: MediaStream | null = null;
	private videoElement: HTMLVideoElement | null = null;
	private canvas: OffscreenCanvas | null = null;
	private canvasContext: OffscreenCanvasRenderingContext2D | null = null;
	private callbacks: FrameCaptureCallbacks = {};
	private capturing = false;
	private frameId: number | null = null;
	private lastFrameTime = 0;
	private frameInterval = 1000 / 30;
	private config: Required<FrameCaptureConfig> = { ...DEFAULT_CONFIG };

	/**
	 * Initialize the frame capture system
	 */
	async initialize(config?: FrameCaptureConfig): Promise<void> {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.frameInterval = 1000 / this.config.frameRate;

		try {
			this.stream = await navigator.mediaDevices.getUserMedia({
				video: {
					width: { ideal: this.config.width },
					height: { ideal: this.config.height },
					facingMode: this.config.facingMode
				}
			});
		} catch {
			console.warn('[FrameCaptureAdapter] Preferred constraints failed, falling back to default');
			this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
		}

		this.videoElement = document.createElement('video');
		this.videoElement.srcObject = this.stream;
		this.videoElement.autoplay = true;
		this.videoElement.playsInline = true;
		this.videoElement.muted = true;

		await new Promise<void>((resolve, reject) => {
			if (!this.videoElement) {
				reject(new Error('Video element not created'));
				return;
			}

			this.videoElement.onloadedmetadata = () => {
				this.videoElement?.play().then(resolve).catch(reject);
			};

			this.videoElement.onerror = () => {
				reject(new Error('Video element failed to load'));
			};
		});

		const videoWidth = this.videoElement.videoWidth || this.config.width;
		const videoHeight = this.videoElement.videoHeight || this.config.height;

		this.canvas = new OffscreenCanvas(videoWidth, videoHeight);
		this.canvasContext = this.canvas.getContext('2d');
	}

	/**
	 * Start capturing frames
	 */
	start(callbacks: FrameCaptureCallbacks): void {
		if (this.capturing) {
			return;
		}

		this.callbacks = callbacks;
		this.capturing = true;
		this.lastFrameTime = performance.now();

		if (this.stream) {
			this.callbacks.onStreamReady?.(this.stream);
		}

		this.captureLoop();
	}

	/**
	 * Stop capturing frames
	 */
	stop(): void {
		this.capturing = false;

		if (this.frameId !== null) {
			cancelAnimationFrame(this.frameId);
			this.frameId = null;
		}
	}

	/**
	 * Check if capture is active
	 */
	isCapturing(): boolean {
		return this.capturing;
	}

	/**
	 * Get the video stream (for debug display)
	 */
	getStream(): MediaStream | null {
		return this.stream;
	}

	/**
	 * Dispose and cleanup resources
	 */
	dispose(): void {
		this.stop();

		if (this.stream) {
			this.stream.getTracks().forEach((track) => track.stop());
			this.stream = null;
		}

		if (this.videoElement) {
			this.videoElement.srcObject = null;
			this.videoElement = null;
		}

		this.canvas = null;
		this.canvasContext = null;
	}

	/**
	 * Main capture loop - captures frames at target FPS
	 */
	private captureLoop = (): void => {
		if (!this.capturing) {
			return;
		}

		const currentTime = performance.now();
		const elapsed = currentTime - this.lastFrameTime;

		if (elapsed >= this.frameInterval && this.videoElement && this.videoElement.readyState >= 2) {
			this.captureFrame(currentTime);
			this.lastFrameTime = currentTime;
		}

		this.frameId = requestAnimationFrame(this.captureLoop);
	};

	/**
	 * Capture a single frame as ImageBitmap
	 * Uses createImageBitmap for efficient, transferable frame capture
	 */
	private async captureFrame(timestamp: number): Promise<void> {
		if (!this.videoElement || !this.canvas || !this.canvasContext) {
			return;
		}

		try {
			this.canvasContext.drawImage(this.videoElement, 0, 0);

			const imageBitmap = await createImageBitmap(this.canvas);

			const frame: CapturedFrame = {
				imageData: imageBitmap,
				timestamp,
				width: this.canvas.width,
				height: this.canvas.height
			};

			this.callbacks.onFrame?.(frame);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			this.callbacks.onError?.(`Frame capture failed: ${errorMessage}`);
		}
	}
}
