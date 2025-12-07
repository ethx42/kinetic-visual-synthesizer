/**
 * Simulation Constants
 * Centralized constants for simulation and rendering
 */

export const SIMULATION = {
	TARGET_FPS: 60,
	MAX_DELTA_TIME: 1.0 / 30.0, // Cap to 30 FPS minimum
	MIN_DELTA_TIME: 0.001
} as const;

export const VISION = {
	TARGET_FPS: 30,
	FRAME_INTERVAL_MS: 1000 / 30,
	MIN_CONFIDENCE: 0.4
} as const;

export const SHADER = {
	POINT_SIZE_SCALE: 300.0, // Distance attenuation scale for point size
	NOISE_EPSILON: 0.01, // Epsilon for curl noise finite differences
	BOUNDARY_DEFAULT: 5.0, // Default boundary size for particle wrapping
	POSITION_SCALE_DEFAULT: 0.35 // Default position scale for curl noise
} as const;

export const TEXTURE = {
	DEFAULT_SIZE: 1024, // Default texture size for GPGPU
	PARTICLE_COUNT_MAX: 1_000_000
} as const;
