/**
 * HandLandmark Entity
 * Represents a single landmark point on a hand
 * Based on MediaPipe Hands 21-point hand model
 *
 * Domain Layer - Pure entity with no external dependencies
 */

export interface HandLandmarkProps {
	x: number;
	y: number;
	z: number;
	index: number;
}

/**
 * MediaPipe Hand Landmark indices
 * Reference: https://developers.google.com/mediapipe/solutions/vision/hand_landmarker
 */
export const LANDMARK_INDEX = {
	WRIST: 0,
	THUMB_CMC: 1,
	THUMB_MCP: 2,
	THUMB_IP: 3,
	THUMB_TIP: 4,
	INDEX_MCP: 5,
	INDEX_PIP: 6,
	INDEX_DIP: 7,
	INDEX_TIP: 8,
	MIDDLE_MCP: 9,
	MIDDLE_PIP: 10,
	MIDDLE_DIP: 11,
	MIDDLE_TIP: 12,
	RING_MCP: 13,
	RING_PIP: 14,
	RING_DIP: 15,
	RING_TIP: 16,
	PINKY_MCP: 17,
	PINKY_PIP: 18,
	PINKY_DIP: 19,
	PINKY_TIP: 20
} as const;

export type LandmarkIndex = (typeof LANDMARK_INDEX)[keyof typeof LANDMARK_INDEX];

/**
 * HandLandmark - Immutable value object representing a single landmark
 */
export class HandLandmark {
	readonly x: number;
	readonly y: number;
	readonly z: number;
	readonly index: number;

	constructor(props: HandLandmarkProps) {
		this.x = props.x;
		this.y = props.y;
		this.z = props.z;
		this.index = props.index;
	}

	/**
	 * Calculate Euclidean distance to another landmark
	 */
	distanceTo(other: HandLandmark): number {
		const dx = other.x - this.x;
		const dy = other.y - this.y;
		const dz = other.z - this.z;
		return Math.sqrt(dx * dx + dy * dy + dz * dz);
	}

	/**
	 * Create a new landmark from raw coordinates
	 */
	static fromCoordinates(x: number, y: number, z: number, index: number): HandLandmark {
		return new HandLandmark({ x, y, z, index });
	}

	/**
	 * Convert to plain object for serialization
	 */
	toJSON(): HandLandmarkProps {
		return {
			x: this.x,
			y: this.y,
			z: this.z,
			index: this.index
		};
	}
}
