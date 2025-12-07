/**
 * Vision Manager - Main Thread Bridge
 * Handles webcam capture and MediaPipe processing
 * Phase 3.1: Vision Worker Infrastructure
 *
 * Note: MediaPipe Tasks Vision doesn't work well with ES module workers
 * (importScripts conflict). We process on main thread but use async/requestIdleCallback
 * to minimize impact on rendering performance.
 */

import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { HandLandmarks } from './types';
import { ErrorHandler } from '$lib/utils/errorHandler';
import { VISION } from '$lib/utils/constants';

export interface VisionManagerCallbacks {
	onLandmarks?: (hands: HandLandmarks[]) => void;
	onError?: (error: string) => void;
	onInitialized?: () => void;
}

/**
 * VisionManager coordinates webcam capture and MediaPipe processing
 * Processes frames asynchronously to minimize main thread blocking
 */
export class VisionManager {
	private landmarker: HandLandmarker | null = null;
	private videoElement: HTMLVideoElement | null = null;
	private stream: MediaStream | null = null;
	private isProcessing = false;
	private frameId: number | null = null;
	private callbacks: VisionManagerCallbacks = {};
	private lastTimestamp = 0;
	private isInitialized = false;

	/**
	 * Initialize vision system with webcam
	 */
	async initialize(
		modelAssetPath: string = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
		callbacks: VisionManagerCallbacks = {}
	): Promise<void> {
		this.callbacks = callbacks;

		// Initialize MediaPipe on main thread
		// Using FULL model for better occlusion handling (hand crossing face)
		// The model path can be changed to a "full" variant if available
		try {
			const vision = await FilesetResolver.forVisionTasks(
				'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm'
			);

			this.landmarker = await HandLandmarker.createFromOptions(vision, {
				baseOptions: {
					modelAssetPath: modelAssetPath,
					delegate: 'GPU' // Use GPU acceleration if available
				},
				runningMode: 'VIDEO', // Process video frames
				numHands: 2, // Detect both hands
				// Lower thresholds for better occlusion handling (hand crossing face)
				// The FULL model handles occlusion better, but we also lower thresholds
				minHandDetectionConfidence: VISION.MIN_CONFIDENCE, // Lowered from 0.5 for better occlusion detection
				minHandPresenceConfidence: VISION.MIN_CONFIDENCE, // Lowered from 0.5
				minTrackingConfidence: VISION.MIN_CONFIDENCE // Lowered from 0.5 - helps maintain tracking during occlusion
			});

			this.isInitialized = true;
			this.callbacks.onInitialized?.();
		} catch (error) {
			const errorMessage = ErrorHandler.getErrorMessage(error);
			this.handleError(`Failed to initialize HandLandmarker: ${errorMessage}`);
			throw error;
		}

		// Request webcam access
		try {
			this.stream = await navigator.mediaDevices.getUserMedia({
				video: {
					width: { ideal: 640 },
					height: { ideal: 480 },
					facingMode: 'user'
				}
			});

			// Create video element for capture
			this.videoElement = document.createElement('video');
			this.videoElement.srcObject = this.stream;
			this.videoElement.autoplay = true;
			this.videoElement.playsInline = true;
			this.videoElement.muted = true; // No audio needed

			// Wait for video to be ready
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
		} catch (error) {
			const errorMessage = ErrorHandler.getErrorMessage(error);
			this.handleError(`Webcam access failed: ${errorMessage}`);
			throw error;
		}
	}

	/**
	 * Start processing video frames
	 */
	start(): void {
		if (this.isProcessing) {
			return;
		}

		if (!this.videoElement || !this.landmarker) {
			this.handleError('Vision system not initialized');
			return;
		}

		this.isProcessing = true;
		this.lastTimestamp = performance.now();
		this.processFrame();
	}

	/**
	 * Stop processing video frames
	 */
	stop(): void {
		this.isProcessing = false;
		if (this.frameId !== null) {
			cancelAnimationFrame(this.frameId);
			this.frameId = null;
		}
	}

	/**
	 * Process a single video frame
	 * Uses requestIdleCallback when available to minimize impact on rendering
	 */
	private processFrame = (): void => {
		if (!this.isProcessing || !this.videoElement || !this.landmarker) {
			return;
		}

		// Capture frame at target FPS (VISION.TARGET_FPS)
		const currentTime = performance.now();
		const elapsed = currentTime - this.lastTimestamp;

		if (elapsed >= VISION.FRAME_INTERVAL_MS && this.videoElement.readyState >= 2) {
			// Process frame asynchronously to avoid blocking render
			// Use requestIdleCallback if available, otherwise use setTimeout
			const processAsync = () => {
				try {
					const results = this.landmarker!.detectForVideo(this.videoElement!, currentTime);

					// Extract landmark data
					const hands: HandLandmarks[] = results.landmarks.map((hand, handIndex) => ({
						landmarks: hand.map((landmark) => ({
							x: landmark.x,
							y: landmark.y,
							z: landmark.z ?? 0
						})),
						confidence:
							results.handednesses?.[handIndex]?.[0]?.score ??
							results.handednesses?.[handIndex]?.score ??
							0.5
					}));

					this.callbacks.onLandmarks?.(hands);
				} catch (error) {
					const errorMessage = ErrorHandler.getErrorMessage(error);
					this.handleError(`Frame processing failed: ${errorMessage}`);
				}
			};

			// Use requestIdleCallback if available (runs during idle time)
			// Otherwise use setTimeout with 0 delay (next event loop tick)
			if ('requestIdleCallback' in window) {
				requestIdleCallback(processAsync, { timeout: 16 }); // Max 16ms wait
			} else {
				setTimeout(processAsync, 0);
			}

			this.lastTimestamp = currentTime;
		}

		// Continue processing
		this.frameId = requestAnimationFrame(this.processFrame);
	};

	/**
	 * Handle errors
	 */
	private handleError(error: string): void {
		console.error('[VisionManager]', error);
		this.callbacks.onError?.(error);
	}

	/**
	 * Cleanup resources
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

		if (this.landmarker) {
			// MediaPipe doesn't have explicit dispose, but we can null it
			this.landmarker = null;
		}
	}

	/**
	 * Get video element for debug overlay (optional)
	 */
	getVideoElement(): HTMLVideoElement | null {
		return this.videoElement;
	}

	/**
	 * Get video stream for external use (e.g., DVR monitor)
	 */
	getVideoStream(): MediaStream | null {
		return this.stream;
	}
}
