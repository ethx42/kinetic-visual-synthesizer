/**
 * Vision Worker - MediaPipe Hands Processing
 * Runs MediaPipe 100% in Web Worker to avoid blocking main thread
 *
 * Infrastructure Layer - Worker implementation
 * Receives ImageBitmap via transferable objects for zero-copy communication
 */

import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

/**
 * Worker configuration from main thread
 */
interface WorkerConfig {
	modelAssetPath?: string;
	numHands?: number;
	minDetectionConfidence?: number;
	minTrackingConfidence?: number;
}

/**
 * Worker message types
 */
interface InitMessage {
	type: 'init';
	config: WorkerConfig;
}

interface ProcessFrameMessage {
	type: 'processFrame';
	imageData: ImageBitmap;
	timestamp: number;
}

type IncomingMessage = InitMessage | ProcessFrameMessage;

/**
 * Result message sent back to main thread
 */
interface ResultMessage {
	type: 'result';
	hands: Array<{
		landmarks: Array<{ x: number; y: number; z: number }>;
		confidence: number;
		handedness?: 'left' | 'right';
	}>;
	timestamp: number;
	processingTimeMs: number;
}

interface ErrorMessage {
	type: 'error';
	error: string;
}

interface InitializedMessage {
	type: 'initialized';
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<WorkerConfig> = {
	modelAssetPath:
		'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
	numHands: 2,
	minDetectionConfidence: 0.4,
	minTrackingConfidence: 0.4
};

let landmarker: HandLandmarker | null = null;
let isInitialized = false;

/**
 * Initialize MediaPipe HandLandmarker in worker context
 */
async function initializeLandmarker(config: WorkerConfig): Promise<void> {
	const mergedConfig = { ...DEFAULT_CONFIG, ...config };

	try {
		const vision = await FilesetResolver.forVisionTasks(
			'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm'
		);

		landmarker = await HandLandmarker.createFromOptions(vision, {
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

		isInitialized = true;

		const message: InitializedMessage = { type: 'initialized' };
		self.postMessage(message);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		const message: ErrorMessage = {
			type: 'error',
			error: `Failed to initialize HandLandmarker: ${errorMessage}`
		};
		self.postMessage(message);
	}
}

/**
 * Process a video frame through MediaPipe
 * Receives ImageBitmap via transferable objects for zero-copy
 */
function processFrame(imageData: ImageBitmap, timestamp: number): void {
	if (!isInitialized || !landmarker) {
		const message: ErrorMessage = {
			type: 'error',
			error: 'HandLandmarker not initialized'
		};
		self.postMessage(message);
		return;
	}

	const startTime = performance.now();

	try {
		const results = landmarker.detectForVideo(imageData, timestamp);

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
				confidence:
					(handednessData as Array<{ score?: number }>)?.[0]?.score ?? 0.5,
				handedness
			};
		});

		const processingTimeMs = performance.now() - startTime;

		const message: ResultMessage = {
			type: 'result',
			hands,
			timestamp,
			processingTimeMs
		};

		self.postMessage(message);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		const message: ErrorMessage = {
			type: 'error',
			error: `Frame processing failed: ${errorMessage}`
		};
		self.postMessage(message);
	} finally {
		imageData.close();
	}
}

/**
 * Worker message handler
 */
self.addEventListener('message', (event: MessageEvent<IncomingMessage>) => {
	const message = event.data;

	switch (message.type) {
		case 'init':
			initializeLandmarker(message.config);
			break;

		case 'processFrame':
			processFrame(message.imageData, message.timestamp);
			break;

		default: {
			const errorMsg: ErrorMessage = {
				type: 'error',
				error: `Unknown message type: ${(message as { type: string }).type}`
			};
			self.postMessage(errorMsg);
		}
	}
});
