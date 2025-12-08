/**
 * VisionFrame Entity
 * Represents a single frame of vision processing results
 *
 * Domain Layer - Contains processed hand data for a single frame
 */

import { Hand } from './Hand';
import type { SignalQuality } from '../value-objects/SignalQuality';

export interface VisionFrameProps {
	hands: Hand[];
	timestamp: number;
	signalQuality: SignalQuality;
	processingTimeMs: number;
}

/**
 * VisionFrame - Immutable entity representing a processed vision frame
 */
export class VisionFrame {
	readonly hands: ReadonlyArray<Hand>;
	readonly timestamp: number;
	readonly signalQuality: SignalQuality;
	readonly processingTimeMs: number;

	constructor(props: VisionFrameProps) {
		this.hands = Object.freeze([...props.hands]);
		this.timestamp = props.timestamp;
		this.signalQuality = props.signalQuality;
		this.processingTimeMs = props.processingTimeMs;
	}

	/**
	 * Get the number of detected hands
	 */
	get handCount(): number {
		return this.hands.length;
	}

	/**
	 * Check if any hands are detected
	 */
	get hasHands(): boolean {
		return this.hands.length > 0;
	}

	/**
	 * Get the primary hand (highest confidence)
	 */
	get primaryHand(): Hand | undefined {
		if (this.hands.length === 0) {
			return undefined;
		}

		return this.hands.reduce((best, current) =>
			current.confidence > best.confidence ? current : best
		);
	}

	/**
	 * Get average confidence across all hands
	 */
	get averageConfidence(): number {
		if (this.hands.length === 0) {
			return 0;
		}

		const sum = this.hands.reduce((acc, hand) => acc + hand.confidence, 0);
		return sum / this.hands.length;
	}

	/**
	 * Get the maximum tension value from all hands
	 * Tension is calculated from normalized pinch distance
	 */
	getMaxTension(smoothstepMin: number, smoothstepMax: number): number {
		if (this.hands.length === 0) {
			return 0;
		}

		const tensions = this.hands.map((hand) => {
			const normalizedDist = hand.getNormalizedPinchDistance();
			return 1.0 - smoothstep(smoothstepMin, smoothstepMax, normalizedDist);
		});

		return Math.max(...tensions);
	}

	/**
	 * Create an empty frame (no hands detected)
	 */
	static empty(timestamp: number): VisionFrame {
		return new VisionFrame({
			hands: [],
			timestamp,
			signalQuality: 'none',
			processingTimeMs: 0
		});
	}

	/**
	 * Convert to plain object for serialization
	 */
	toJSON(): {
		hands: ReturnType<Hand['toJSON']>[];
		timestamp: number;
		signalQuality: SignalQuality;
		processingTimeMs: number;
	} {
		return {
			hands: this.hands.map((hand) => hand.toJSON()),
			timestamp: this.timestamp,
			signalQuality: this.signalQuality,
			processingTimeMs: this.processingTimeMs
		};
	}
}

/**
 * Smoothstep function (GLSL smoothstep equivalent)
 * Returns smooth interpolation between edge0 and edge1
 */
function smoothstep(edge0: number, edge1: number, x: number): number {
	const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
	return t * t * (3 - 2 * t);
}
