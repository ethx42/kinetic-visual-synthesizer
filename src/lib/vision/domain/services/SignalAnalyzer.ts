/**
 * SignalAnalyzer Domain Service
 * Analyzes hand tracking signal quality and detects signal loss events
 *
 * Domain Layer - Pure domain logic with no external dependencies
 */

import type { Hand } from '../entities/Hand';
import type { SignalQuality } from '../value-objects/SignalQuality';
import { getSignalQuality, isSignalLost } from '../value-objects/SignalQuality';

export interface SignalAnalysisResult {
	quality: SignalQuality;
	confidence: number;
	isTracking: boolean;
	signalLost: boolean;
	handCount: number;
}

/**
 * SignalAnalyzer - Domain service for analyzing tracking signal quality
 */
export class SignalAnalyzer {
	private previousQuality: SignalQuality = 'none';
	private previousConfidence = 0;

	/**
	 * Analyze signal quality from detected hands
	 */
	analyze(hands: Hand[]): SignalAnalysisResult {
		const handCount = hands.length;
		const hasHands = handCount > 0;

		const confidence = hasHands
			? hands.reduce((sum, hand) => sum + hand.confidence, 0) / handCount
			: 0;

		const quality = getSignalQuality(confidence, hasHands);
		const isTracking = hasHands && confidence > 0.3;
		const signalLost = isSignalLost(this.previousQuality, quality);

		this.previousQuality = quality;
		this.previousConfidence = confidence;

		return {
			quality,
			confidence,
			isTracking,
			signalLost,
			handCount
		};
	}

	/**
	 * Get the previous signal quality
	 */
	getPreviousQuality(): SignalQuality {
		return this.previousQuality;
	}

	/**
	 * Get the previous confidence value
	 */
	getPreviousConfidence(): number {
		return this.previousConfidence;
	}

	/**
	 * Reset the analyzer state
	 */
	reset(): void {
		this.previousQuality = 'none';
		this.previousConfidence = 0;
	}
}
