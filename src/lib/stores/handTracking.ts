/**
 * Hand tracking state store
 * Stores MediaPipe landmark data and tracking status
 * Phase 3.1: Vision Worker Infrastructure
 */

import { writable } from 'svelte/store';
import type { HandLandmarks } from '$lib/vision/types';

export interface HandTrackingState {
	hands: HandLandmarks[];
	confidence: number; // Average confidence across all hands
	isTracking: boolean;
	signalLost: boolean; // True when tracking was active but is now lost (occlusion/face crossing)
	lastUpdate: number; // Timestamp of last update
	wasTracking: boolean; // Previous frame tracking state (for signal loss detection)
}

const initialState: HandTrackingState = {
	hands: [],
	confidence: 0,
	isTracking: false,
	signalLost: false,
	lastUpdate: 0,
	wasTracking: false
};

export const handTracking = writable<HandTrackingState>(initialState);

// Track previous state for signal loss detection
let previousWasTracking = false;

/**
 * Update hand tracking state
 * Improved occlusion detection: signal is "lost" when we had tracking but lost it
 * (e.g., hand crossing face causes occlusion ambiguity)
 */
export function updateHandTracking(hands: HandLandmarks[]): void {
	const confidence =
		hands.length > 0 ? hands.reduce((sum, hand) => sum + hand.confidence, 0) / hands.length : 0;

	const isTracking = hands.length > 0 && confidence > 0.4; // Lower threshold for better occlusion handling

	// Signal is "lost" if we had tracking in previous frame but lost it now
	// This detects occlusion events (hand crossing face)
	const signalLost = previousWasTracking && !isTracking;

	// Update previous state for next frame
	previousWasTracking = isTracking;

	handTracking.set({
		hands,
		confidence,
		isTracking,
		signalLost,
		lastUpdate: performance.now(),
		wasTracking: isTracking
	});
}

/**
 * Reset hand tracking state
 */
export function resetHandTracking(): void {
	previousWasTracking = false;
	handTracking.set(initialState);
}
