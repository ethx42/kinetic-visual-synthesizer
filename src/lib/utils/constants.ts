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

/**
 * Post-Processing Constants
 * Default values and configuration for post-processing effects
 */
export const POST_PROCESSING = {
	/** localStorage key for persisting state */
	STORAGE_KEY: 'kvs_postProcessingState',

	/** Default effect intensities */
	DEFAULT_INTENSITY: 0.5,
	MAX_INTENSITY: 2.0,
	MIN_INTENSITY: 0.0,

	/** Glitch effect defaults */
	GLITCH: {
		CHROMATIC_ABERRATION: 1.0,
		SCANLINE_DENSITY: 1.0,
		NOISE_STRENGTH: 0.5,
		SIGNAL_LOSS_BOOST: 0.5
	},

	/** Bloom effect defaults (for future implementation) */
	BLOOM: {
		THRESHOLD: 1.0,
		RADIUS: 0.5
	},

	/** Chromatic aberration effect defaults (for future implementation) */
	CHROMATIC_ABERRATION: {
		OFFSET: 1.0
	},

	/** Performance thresholds */
	PERFORMANCE: {
		/** Maximum time budget per effect in milliseconds */
		MAX_EFFECT_TIME_MS: 2.0,
		/** Quality scale factors for different quality levels */
		QUALITY_SCALE: {
			low: 0.5,
			medium: 0.75,
			high: 1.0
		}
	}
} as const;
