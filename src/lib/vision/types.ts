/**
 * Hand landmark type definitions
 * Based on MediaPipe Hands 21-point hand model
 */
export interface HandLandmark {
	x: number;
	y: number;
	z: number;
}

export interface HandLandmarks {
	landmarks: HandLandmark[];
	confidence: number;
}
