/**
 * VisionUseCase
 * Orchestrates the vision processing pipeline: capture -> worker -> domain -> stores
 *
 * Application Layer - Use case implementation
 */

import type {
	IVisionUseCase,
	VisionUseCaseCallbacks,
	VisionUseCaseConfig
} from '../interfaces/IVisionUseCase';
import type { IFrameCapture, CapturedFrame } from '../interfaces/IFrameCapture';
import type { IVisionWorkerAdapter, WorkerProcessingResult } from '../interfaces/IVisionWorkerAdapter';
import { FrameProcessor } from '../../domain/services/FrameProcessor';
import { SignalAnalyzer } from '../../domain/services/SignalAnalyzer';

/**
 * Exponential moving average filter for tension smoothing
 */
class TensionSmoother {
	private alpha: number;
	private value = 0;
	private initialized = false;

	constructor(alpha: number = 0.2) {
		this.alpha = alpha;
	}

	update(newValue: number): number {
		if (!this.initialized) {
			this.value = newValue;
			this.initialized = true;
			return newValue;
		}

		this.value = this.alpha * newValue + (1 - this.alpha) * this.value;
		return this.value;
	}

	reset(): void {
		this.initialized = false;
		this.value = 0;
	}

	setAlpha(alpha: number): void {
		this.alpha = Math.max(0, Math.min(1, alpha));
	}
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<VisionUseCaseConfig> = {
	smoothstepMin: 0.3,
	smoothstepMax: 1.5,
	smoothingAlpha: 0.2,
	targetFps: 30
};

/**
 * VisionUseCase - Orchestrates vision processing pipeline
 * Implements Dependency Injection for testability
 */
export class VisionUseCase implements IVisionUseCase {
	private frameCapture: IFrameCapture;
	private workerAdapter: IVisionWorkerAdapter;
	private frameProcessor: FrameProcessor;
	private signalAnalyzer: SignalAnalyzer;
	private tensionSmoother: TensionSmoother;

	private config: Required<VisionUseCaseConfig>;
	private callbacks: VisionUseCaseCallbacks = {};
	private running = false;

	constructor(frameCapture: IFrameCapture, workerAdapter: IVisionWorkerAdapter) {
		this.frameCapture = frameCapture;
		this.workerAdapter = workerAdapter;
		this.frameProcessor = new FrameProcessor();
		this.signalAnalyzer = new SignalAnalyzer();
		this.config = { ...DEFAULT_CONFIG };
		this.tensionSmoother = new TensionSmoother(this.config.smoothingAlpha);
	}

	/**
	 * Initialize the vision system
	 */
	async initialize(config?: VisionUseCaseConfig): Promise<void> {
		if (config) {
			this.updateConfig(config);
		}

		await this.workerAdapter.initialize({
			minDetectionConfidence: 0.4,
			minTrackingConfidence: 0.4,
			numHands: 2
		});

		await this.frameCapture.initialize({
			width: 640,
			height: 480,
			frameRate: this.config.targetFps,
			facingMode: 'user'
		});

		this.callbacks.onInitialized?.();
	}

	/**
	 * Start vision processing
	 */
	start(callbacks: VisionUseCaseCallbacks): void {
		if (this.running) {
			return;
		}

		this.callbacks = callbacks;
		this.running = true;

		this.workerAdapter.setCallbacks({
			onResult: (result) => this.handleWorkerResult(result),
			onError: (error) => this.callbacks.onError?.(error),
			onInitialized: () => this.callbacks.onInitialized?.()
		});

		this.frameCapture.start({
			onFrame: (frame) => this.handleCapturedFrame(frame),
			onError: (error) => this.callbacks.onError?.(error),
			onStreamReady: (stream) => this.callbacks.onStreamReady?.(stream)
		});
	}

	/**
	 * Stop vision processing
	 */
	stop(): void {
		this.running = false;
		this.frameCapture.stop();
		this.signalAnalyzer.reset();
		this.tensionSmoother.reset();
	}

	/**
	 * Check if vision system is running
	 */
	isRunning(): boolean {
		return this.running;
	}

	/**
	 * Update configuration
	 */
	updateConfig(config: Partial<VisionUseCaseConfig>): void {
		this.config = { ...this.config, ...config };

		if (config.smoothingAlpha !== undefined) {
			this.tensionSmoother.setAlpha(config.smoothingAlpha);
		}
	}

	/**
	 * Get the video stream for debug display
	 */
	getStream(): MediaStream | null {
		return this.frameCapture.getStream();
	}

	/**
	 * Dispose and cleanup all resources
	 */
	dispose(): void {
		this.stop();
		this.frameCapture.dispose();
		this.workerAdapter.terminate();
	}

	/**
	 * Handle captured frame - send to worker for processing
	 */
	private handleCapturedFrame(frame: CapturedFrame): void {
		if (!this.running || !this.workerAdapter.isReady()) {
			return;
		}

		this.workerAdapter.processFrame(frame.imageData, frame.timestamp);
	}

	/**
	 * Handle worker processing result
	 */
	private handleWorkerResult(result: WorkerProcessingResult): void {
		if (!this.running) {
			return;
		}

		const { frame, hands } = this.frameProcessor.processLandmarks(
			result.hands,
			result.timestamp,
			result.processingTimeMs
		);

		this.callbacks.onFrame?.(frame);

		const signalAnalysis = this.signalAnalyzer.analyze(hands);
		this.callbacks.onSignalAnalysis?.(signalAnalysis);

		const rawTension = frame.getMaxTension(this.config.smoothstepMin, this.config.smoothstepMax);
		const smoothedTension = hands.length > 0 ? this.tensionSmoother.update(rawTension) : 0;

		if (hands.length === 0) {
			this.tensionSmoother.reset();
		}

		this.callbacks.onTension?.(smoothedTension);
	}
}
