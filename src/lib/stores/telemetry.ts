/**
 * Performance metrics store
 * Tracks FPS, render calls, hand tracking confidence, etc.
 */
export const fps = $state(0);
export const renderCalls = $state(0);
export const handTrackingConfidence = $state(0.0);
