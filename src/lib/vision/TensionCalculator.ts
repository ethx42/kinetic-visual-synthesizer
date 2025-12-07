/**
 * Tension Calculator
 * Computes hand tension from MediaPipe landmarks
 * Phase 3.2: Tension Calculation Algorithm (Calibrated)
 *
 * Algorithm:
 * 1. Extract thumb tip (landmark 4) and index tip (landmark 8)
 * 2. Calculate Euclidean distance: dist(thumb, index)
 * 3. Extract wrist (landmark 0) and middle MCP (landmark 9)
 * 4. Calculate reference distance: dist(wrist, middleMCP)
 * 5. Normalize: normalizedDist = dist(thumb, index) / dist(wrist, middleMCP)
 * 6. Apply smoothstep with calibrated thresholds: tension = 1.0 - smoothstep(min, max, normalizedDist)
 */

import type { HandLandmarks } from './types';
import type { CalibrationSettings } from '../stores/calibration';
import {
	rawTension,
	normalizedDistance,
	thumbIndexDistance,
	wristMCPDistance
} from '../stores/calibration';

/**
 * Smoothstep function (GLSL smoothstep equivalent)
 * Returns smooth interpolation between edge0 and edge1
 */
function smoothstep(edge0: number, edge1: number, x: number): number {
	const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
	return t * t * (3 - 2 * t);
}

/**
 * Calculate Euclidean distance between two landmarks
 */
function distance(
	a: { x: number; y: number; z: number },
	b: { x: number; y: number; z: number }
): number {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const dz = b.z - a.z;
	return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Exponential moving average filter to reduce jitter
 */
class SmoothingFilter {
	private alpha: number;
	private value: number;
	private initialized = false;

	constructor(alpha: number = 0.2) {
		this.alpha = alpha;
		this.value = 0;
	}

	update(newValue: number): number {
		if (!this.initialized) {
			this.value = newValue;
			this.initialized = true;
			return newValue;
		}

		// EMA: value = alpha * newValue + (1 - alpha) * oldValue
		this.value = this.alpha * newValue + (1 - this.alpha) * this.value;
		return this.value;
	}

	reset(): void {
		this.initialized = false;
		this.value = 0;
	}
}

/**
 * Calculate tension from a single hand's landmarks
 */
function calculateHandTension(
	hand: HandLandmarks,
	calibration: CalibrationSettings
): { tension: number; normalizedDist: number; thumbIndexDist: number; wristMCPDist: number } {
	const landmarks = hand.landmarks;

	// Validate we have enough landmarks (MediaPipe Hands has 21 landmarks)
	if (landmarks.length < 10) {
		return { tension: 0.0, normalizedDist: 0.0, thumbIndexDist: 0.0, wristMCPDist: 0.0 };
	}

	// Extract key landmarks
	const thumbTip = landmarks[4]; // Thumb tip
	const indexTip = landmarks[8]; // Index tip
	const wrist = landmarks[0]; // Wrist
	const middleMCP = landmarks[9]; // Middle finger MCP (Metacarpophalangeal joint)

	// Calculate thumb-index distance
	const thumbIndexDist = distance(thumbTip, indexTip);

	// Calculate reference distance (wrist to middle MCP)
	const wristMCPDist = distance(wrist, middleMCP);

	// Avoid division by zero
	if (wristMCPDist < 0.001) {
		return { tension: 0.0, normalizedDist: 0.0, thumbIndexDist, wristMCPDist };
	}

	// Normalize distance
	const normalizedDist = thumbIndexDist / wristMCPDist;

	// Apply smoothstep with calibrated thresholds
	// When hand is open (large distance), normalizedDist > max, smoothstep returns 1.0, tension = 0.0
	// When hand is closed (small distance), normalizedDist < min, smoothstep returns 0.0, tension = 1.0
	const tension =
		1.0 - smoothstep(calibration.smoothstepMin, calibration.smoothstepMax, normalizedDist);

	// Clamp to [0, 1]
	const clampedTension = Math.max(0, Math.min(1, tension));

	return {
		tension: clampedTension,
		normalizedDist,
		thumbIndexDist,
		wristMCPDist
	};
}

/**
 * TensionCalculator processes hand landmarks and computes tension values
 * Now supports calibration for better accuracy
 */
export class TensionCalculator {
	private smoothingFilter: SmoothingFilter;
	private smoothingAlpha: number;
	private calibration: CalibrationSettings;

	constructor(calibration: CalibrationSettings) {
		this.calibration = calibration;
		this.smoothingAlpha = calibration.smoothingAlpha;
		this.smoothingFilter = new SmoothingFilter(calibration.smoothingAlpha);
	}

	/**
	 * Update calibration settings
	 */
	updateCalibration(calibration: CalibrationSettings): void {
		this.calibration = calibration;
		this.smoothingAlpha = calibration.smoothingAlpha;
		this.smoothingFilter = new SmoothingFilter(calibration.smoothingAlpha);
	}

	/**
	 * Calculate tension from hand landmarks
	 * Handles both hands (uses maximum tension from most closed hand)
	 */
	calculate(hands: HandLandmarks[]): number {
		if (hands.length === 0) {
			// No hands detected - reset filter and return 0
			this.smoothingFilter.reset();
			rawTension.set(0.0);
			normalizedDistance.set(0.0);
			thumbIndexDistance.set(0.0);
			wristMCPDistance.set(0.0);
			return 0.0;
		}

		// Calculate tension for each hand
		const results = hands.map((hand) => calculateHandTension(hand, this.calibration));

		// Find the hand with maximum tension (most closed)
		const maxResult = results.reduce((max, current) =>
			current.tension > max.tension ? current : max
		);

		// Update debug values (use the hand with max tension)
		rawTension.set(maxResult.tension);
		normalizedDistance.set(maxResult.normalizedDist);
		thumbIndexDistance.set(maxResult.thumbIndexDist);
		wristMCPDistance.set(maxResult.wristMCPDist);

		// Apply smoothing filter to reduce jitter
		const smoothedTension = this.smoothingFilter.update(maxResult.tension);

		return smoothedTension;
	}

	/**
	 * Reset the smoothing filter
	 */
	reset(): void {
		this.smoothingFilter.reset();
	}

	/**
	 * Update smoothing alpha (0.0 = no smoothing, 1.0 = maximum smoothing)
	 */
	setSmoothingAlpha(alpha: number): void {
		this.smoothingAlpha = Math.max(0, Math.min(1, alpha));
		this.smoothingFilter = new SmoothingFilter(this.smoothingAlpha);
	}
}
