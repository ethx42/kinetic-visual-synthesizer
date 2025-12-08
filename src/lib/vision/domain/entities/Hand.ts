/**
 * Hand Entity
 * Represents a detected hand with all its landmarks
 *
 * Domain Layer - Aggregate root for hand-related data
 */

import { HandLandmark, LANDMARK_INDEX } from './HandLandmark';

export interface HandProps {
	landmarks: HandLandmark[];
	confidence: number;
	handedness?: 'left' | 'right';
}

/**
 * Hand - Aggregate entity representing a complete hand detection
 */
export class Hand {
	readonly landmarks: ReadonlyArray<HandLandmark>;
	readonly confidence: number;
	readonly handedness: 'left' | 'right' | 'unknown';

	constructor(props: HandProps) {
		this.landmarks = Object.freeze([...props.landmarks]);
		this.confidence = props.confidence;
		this.handedness = props.handedness ?? 'unknown';
	}

	/**
	 * Get a specific landmark by index
	 */
	getLandmark(index: number): HandLandmark | undefined {
		return this.landmarks[index];
	}

	/**
	 * Get thumb tip landmark
	 */
	get thumbTip(): HandLandmark | undefined {
		return this.getLandmark(LANDMARK_INDEX.THUMB_TIP);
	}

	/**
	 * Get index finger tip landmark
	 */
	get indexTip(): HandLandmark | undefined {
		return this.getLandmark(LANDMARK_INDEX.INDEX_TIP);
	}

	/**
	 * Get wrist landmark
	 */
	get wrist(): HandLandmark | undefined {
		return this.getLandmark(LANDMARK_INDEX.WRIST);
	}

	/**
	 * Get middle finger MCP landmark (used for hand scale reference)
	 */
	get middleMCP(): HandLandmark | undefined {
		return this.getLandmark(LANDMARK_INDEX.MIDDLE_MCP);
	}

	/**
	 * Calculate the pinch distance (thumb to index finger)
	 * Returns normalized distance based on hand scale
	 */
	getPinchDistance(): number {
		const thumb = this.thumbTip;
		const index = this.indexTip;

		if (!thumb || !index) {
			return 0;
		}

		return thumb.distanceTo(index);
	}

	/**
	 * Get hand scale (wrist to middle MCP distance)
	 * Used for normalizing distances across different hand sizes
	 */
	getHandScale(): number {
		const wrist = this.wrist;
		const middleMCP = this.middleMCP;

		if (!wrist || !middleMCP) {
			return 1;
		}

		const scale = wrist.distanceTo(middleMCP);
		return scale > 0.001 ? scale : 1;
	}

	/**
	 * Get normalized pinch distance (0.0 to ~1.5)
	 * Normalized by hand scale for consistent values across hand sizes
	 */
	getNormalizedPinchDistance(): number {
		return this.getPinchDistance() / this.getHandScale();
	}

	/**
	 * Check if hand has valid landmarks
	 */
	isValid(): boolean {
		return this.landmarks.length >= 21 && this.confidence > 0;
	}

	/**
	 * Create Hand from raw landmark data
	 */
	static fromRawLandmarks(
		landmarks: Array<{ x: number; y: number; z: number }>,
		confidence: number,
		handedness?: 'left' | 'right'
	): Hand {
		const handLandmarks = landmarks.map(
			(lm, index) => new HandLandmark({ x: lm.x, y: lm.y, z: lm.z, index })
		);

		return new Hand({
			landmarks: handLandmarks,
			confidence,
			handedness
		});
	}

	/**
	 * Convert to plain object for serialization
	 */
	toJSON(): {
		landmarks: Array<{ x: number; y: number; z: number; index: number }>;
		confidence: number;
		handedness: string;
	} {
		return {
			landmarks: this.landmarks.map((lm) => lm.toJSON()),
			confidence: this.confidence,
			handedness: this.handedness
		};
	}
}
