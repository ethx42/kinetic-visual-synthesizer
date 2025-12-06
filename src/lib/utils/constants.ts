/**
 * Physical constants and configuration values
 */

// WebGL2 capability check
export const REQUIRES_WEBGL2 = true;

// Default particle system settings
export const DEFAULT_PARTICLE_COUNT = 1_000_000;
export const TEXTURE_SIZE_1M = 1024; // 1024x1024 = 1,048,576 particles

// Simulation constants
export const DEFAULT_DELTA_TIME = 1 / 60; // 60 FPS
export const MAX_DELTA_TIME = 1 / 30; // Cap at 30 FPS minimum

// Hand tracking constants
export const TENSION_SMOOTH_STEP_MIN = 0.0;
export const TENSION_SMOOTH_STEP_MAX = 1.2;
