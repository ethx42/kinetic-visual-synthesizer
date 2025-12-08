/**
 * FrameProcessor Domain Service
 * Processes raw landmark data into domain entities
 *
 * Domain Layer - Transforms raw data into domain objects
 */

import { Hand } from '../entities/Hand';
import { VisionFrame } from '../entities/VisionFrame';
import { getSignalQuality } from '../value-objects/SignalQuality';

export interface RawLandmarkData {
	landmarks: Array<{ x: number; y: number; z: number }>;
	confidence: number;
	handedness?: 'left' | 'right';
}

export interface ProcessFrameResult {
	frame: VisionFrame;
	hands: Hand[];
}

/**
 * FrameProcessor - Domain service for processing raw vision data
 */
export class FrameProcessor {
	/**
	 * Process raw landmark data into domain entities
	 */
	processLandmarks(
		rawHands: RawLandmarkData[],
		timestamp: number,
		processingTimeMs: number
	): ProcessFrameResult {
		const hands = rawHands.map((rawHand) =>
			Hand.fromRawLandmarks(rawHand.landmarks, rawHand.confidence, rawHand.handedness)
		);

		const hasHands = hands.length > 0;
		const avgConfidence = hasHands
			? hands.reduce((sum, hand) => sum + hand.confidence, 0) / hands.length
			: 0;

		const signalQuality = getSignalQuality(avgConfidence, hasHands);

		const frame = new VisionFrame({
			hands,
			timestamp,
			signalQuality,
			processingTimeMs
		});

		return { frame, hands };
	}

	/**
	 * Create an empty frame result (no hands detected)
	 */
	createEmptyResult(timestamp: number): ProcessFrameResult {
		return {
			frame: VisionFrame.empty(timestamp),
			hands: []
		};
	}
}
