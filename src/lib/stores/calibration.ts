/**
 * Calibration store for hand tracking
 * Stores user-calibrated thresholds for better gesture recognition
 */
import { writable } from 'svelte/store';
import { persistent } from './persistent';

export interface CalibrationSettings {
	// Smoothstep thresholds (calibrated per user)
	smoothstepMin: number; // Minimum normalized distance (fully open hand)
	smoothstepMax: number; // Maximum normalized distance (fully closed hand)
	// Smoothing factor (lower = more responsive, higher = more stable)
	smoothingAlpha: number;
	// Enable/disable calibration mode
	calibrationMode: boolean;
}

// Default calibration (will be adjusted per user)
export const calibration = persistent<CalibrationSettings>('kvs_calibration', {
	smoothstepMin: 0.3, // Adjusted from 0.0 for better sensitivity
	smoothstepMax: 1.5, // Adjusted from 1.2 for better range
	smoothingAlpha: 0.2, // Reduced from 0.3 for more responsiveness
	calibrationMode: false
});

// Raw values for debugging (not persistent)
export const rawTension = writable(0.0);
export const normalizedDistance = writable(0.0);
export const thumbIndexDistance = writable(0.0);
export const wristMCPDistance = writable(0.0);
