/**
 * SignalQuality Value Object
 * Represents the quality of hand tracking signal
 *
 * Domain Layer - Enum-like value object for signal quality states
 */

/**
 * Signal quality levels based on tracking confidence
 */
export type SignalQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'none';

/**
 * Confidence thresholds for signal quality levels
 */
export const SIGNAL_QUALITY_THRESHOLDS = {
	EXCELLENT: 0.9,
	GOOD: 0.7,
	FAIR: 0.5,
	POOR: 0.3
} as const;

/**
 * Determine signal quality from confidence value
 */
export function getSignalQuality(confidence: number, hasHands: boolean): SignalQuality {
	if (!hasHands || confidence <= 0) {
		return 'none';
	}

	if (confidence >= SIGNAL_QUALITY_THRESHOLDS.EXCELLENT) {
		return 'excellent';
	}

	if (confidence >= SIGNAL_QUALITY_THRESHOLDS.GOOD) {
		return 'good';
	}

	if (confidence >= SIGNAL_QUALITY_THRESHOLDS.FAIR) {
		return 'fair';
	}

	return 'poor';
}

/**
 * Check if signal quality is acceptable for tracking
 */
export function isSignalAcceptable(quality: SignalQuality): boolean {
	return quality === 'excellent' || quality === 'good' || quality === 'fair';
}

/**
 * Check if signal is lost (was tracking but now isn't)
 */
export function isSignalLost(
	previousQuality: SignalQuality,
	currentQuality: SignalQuality
): boolean {
	const wasTracking = previousQuality !== 'none';
	const isNotTracking = currentQuality === 'none' || currentQuality === 'poor';
	return wasTracking && isNotTracking;
}

/**
 * Get numeric value for signal quality (for UI display)
 */
export function getSignalQualityValue(quality: SignalQuality): number {
	switch (quality) {
		case 'excellent':
			return 1.0;
		case 'good':
			return 0.75;
		case 'fair':
			return 0.5;
		case 'poor':
			return 0.25;
		case 'none':
			return 0;
	}
}

/**
 * Get display label for signal quality
 */
export function getSignalQualityLabel(quality: SignalQuality): string {
	switch (quality) {
		case 'excellent':
			return 'Excellent';
		case 'good':
			return 'Good';
		case 'fair':
			return 'Fair';
		case 'poor':
			return 'Poor';
		case 'none':
			return 'No Signal';
	}
}
