/**
 * Performance metrics store
 * Tracks FPS, render calls, hand tracking confidence, etc.
 *
 * Uses Svelte writable stores for reactive state management
 * Compatible with both Svelte 4 and Svelte 5
 */

import { writable, get, type Writable } from 'svelte/store';

/**
 * FPS store
 * Tracks frames per second
 *
 * Note: Validation and clamping (0-120 FPS) is handled by FPSTracker component
 * to prevent Infinity, negative numbers, or unrealistic values
 */
export const fps: Writable<number> = writable(0);

/**
 * Render calls store
 * Tracks number of WebGL render calls per frame
 */
export const renderCalls: Writable<number> = writable(0);

/**
 * Hand tracking confidence store
 * Tracks confidence level of hand tracking (0.0 - 1.0)
 */
export const handTrackingConfidence: Writable<number> = writable(0.0);

/**
 * Helper functions for compatibility
 * These functions allow accessing store values without subscriptions
 * Uses get() from svelte/store for synchronous access
 */

/**
 * Get current FPS value
 * @returns Current FPS value
 */
export function getFps(): number {
	return get(fps);
}

/**
 * Get current render calls value
 * @returns Current render calls value
 */
export function getRenderCalls(): number {
	return get(renderCalls);
}

/**
 * Get current hand tracking confidence value
 * @returns Current confidence value (0.0 - 1.0)
 */
export function getHandTrackingConfidence(): number {
	return get(handTrackingConfidence);
}
