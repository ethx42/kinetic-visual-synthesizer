/**
 * Performance metrics store
 * Tracks FPS, render calls, hand tracking confidence, etc.
 */
import { writable } from 'svelte/store';

export const fps = writable(0);
export const renderCalls = writable(0);
export const handTrackingConfidence = writable(0.0);
