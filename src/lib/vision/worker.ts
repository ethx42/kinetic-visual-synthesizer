/**
 * Vision Worker - MediaPipe Hands Processing
 * Runs in Web Worker to avoid blocking main thread
 * Phase 3.1: Vision Worker Infrastructure
 */

import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// Worker message types
export interface WorkerInitMessage {
	type: 'init';
	modelAssetPath: string;
}

export interface WorkerFrameMessage {
	type: 'processFrame';
	imageData: ImageBitmap | VideoFrame;
	timestamp: number;
}

export interface WorkerResponseMessage {
	type: 'landmarks';
	hands: Array<{
		landmarks: Array<{ x: number; y: number; z: number }>;
		confidence: number;
	}>;
	timestamp: number;
}

export interface WorkerErrorMessage {
	type: 'error';
	error: string;
}

let landmarker: HandLandmarker | null = null;
let isInitialized = false;

/**
 * Initialize MediaPipe HandLandmarker in worker context
 */
async function initializeLandmarker(modelAssetPath: string): Promise<void> {
	try {
		const vision = await FilesetResolver.forVisionTasks(
			'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm'
		);

		landmarker = await HandLandmarker.createFromOptions(vision, {
			baseOptions: {
				modelAssetPath: modelAssetPath,
				delegate: 'GPU' // Use GPU acceleration if available
			},
			runningMode: 'VIDEO', // Process video frames
			numHands: 2, // Detect both hands
			minHandDetectionConfidence: 0.5,
			minHandPresenceConfidence: 0.5,
			minTrackingConfidence: 0.5
		});

		isInitialized = true;
		self.postMessage({ type: 'initialized' });
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		self.postMessage({
			type: 'error',
			error: `Failed to initialize HandLandmarker: ${errorMessage}`
		} satisfies WorkerErrorMessage);
	}
}

/**
 * Process a video frame through MediaPipe
 */
async function processFrame(imageData: ImageBitmap | VideoFrame, timestamp: number): Promise<void> {
	if (!isInitialized || !landmarker) {
		self.postMessage({
			type: 'error',
			error: 'HandLandmarker not initialized'
		} satisfies WorkerErrorMessage);
		return;
	}

	try {
		// MediaPipe in VIDEO mode requires detectForVideo with timestamp
		// ImageBitmap and VideoFrame are supported
		const results = landmarker.detectForVideo(imageData as any, timestamp);

		// Extract landmark data
		// results.landmarks is an array of hands, each hand has 21 landmarks
		const hands = results.landmarks.map((hand, handIndex) => ({
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

		// Send results back to main thread
		self.postMessage({
			type: 'landmarks',
			hands,
			timestamp
		} satisfies WorkerResponseMessage);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		self.postMessage({
			type: 'error',
			error: `Frame processing failed: ${errorMessage}`
		} satisfies WorkerErrorMessage);
	}
}

// Worker message handler
self.addEventListener('message', async (event: MessageEvent) => {
	const message = event.data;

	switch (message.type) {
		case 'init':
			await initializeLandmarker(message.modelAssetPath);
			break;

		case 'processFrame':
			await processFrame(message.imageData, message.timestamp);
			break;

		default:
			self.postMessage({
				type: 'error',
				error: `Unknown message type: ${message.type}`
			} satisfies WorkerErrorMessage);
	}
});
