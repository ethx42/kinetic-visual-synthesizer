/**
 * Post-Processing State Store
 * Centralized store for all post-processing effect parameters
 *
 * This store enables dynamic, store-driven effect management where users
 * can enable/disable effects and adjust parameters by modifying store values.
 *
 * Design Patterns:
 * - Observer Pattern: Store subscriptions for reactive updates
 * - Single Source of Truth: All user-controllable parameters centralized here
 */

import { derived, type Readable } from 'svelte/store';
import { persistent } from './persistent';
import type { EffectPreset } from '$lib/postprocessing/domain/entities/PostProcessingEffect';

/**
 * Effect type identifiers
 */
export type PostProcessingEffectType =
	| 'glitch'
	| 'bloom'
	| 'chromatic-aberration'
	| 'vignette'
	| 'color-grading'
	| 'film-grain';

/**
 * Glitch effect configuration
 */
export interface GlitchEffectState {
	/** Whether the glitch effect is enabled */
	enabled: boolean;
	/** Base intensity of the effect (0.0 - 1.0) */
	intensity: number;
	/** Chromatic aberration strength */
	chromaticAberration: number;
	/** Scanline density multiplier */
	scanlineDensity: number;
	/** Noise overlay strength */
	noiseStrength: number;
	/** Additional intensity boost when signal is lost (0.0 - 1.0) */
	signalLossBoost: number;
}

/**
 * Bloom effect configuration (placeholder for future implementation)
 */
export interface BloomEffectState {
	/** Whether the bloom effect is enabled */
	enabled: boolean;
	/** Bloom intensity (0.0 - 1.0) */
	intensity: number;
	/** Luminance threshold for bloom */
	threshold: number;
	/** Bloom blur radius */
	radius: number;
}

/**
 * Chromatic aberration effect configuration
 */
export interface ChromaticAberrationEffectState {
	/** Whether the chromatic aberration effect is enabled */
	enabled: boolean;
	/** Effect intensity (0.0 - 1.0) */
	intensity: number;
	/** Color channel offset amount */
	offset: number;
}

/**
 * Vignette effect configuration
 */
export interface VignetteEffectState {
	/** Whether the vignette effect is enabled */
	enabled: boolean;
	/** Effect intensity (0.0 - 1.0) */
	intensity: number;
	/** Vignette radius (0.0 - 1.0) */
	radius: number;
	/** Vignette feather (smoothness) (0.0 - 1.0) */
	feather: number;
}

/**
 * Color grading effect configuration
 */
export interface ColorGradingEffectState {
	/** Whether the color grading effect is enabled */
	enabled: boolean;
	/** Effect intensity (0.0 - 1.0) */
	intensity: number;
	/** Color temperature (-1.0 cool to 1.0 warm) */
	temperature: number;
	/** Contrast adjustment (-1.0 to 1.0) */
	contrast: number;
	/** Saturation adjustment (-1.0 desaturated to 1.0 saturated) */
	saturation: number;
	/** Brightness adjustment (-1.0 to 1.0) */
	brightness: number;
}

/**
 * Film grain effect configuration
 */
export interface FilmGrainEffectState {
	/** Whether the film grain effect is enabled */
	enabled: boolean;
	/** Effect intensity (0.0 - 1.0) */
	intensity: number;
}

/**
 * All effects state container
 */
export interface PostProcessingEffectsState {
	glitch: GlitchEffectState;
	bloom: BloomEffectState;
	chromaticAberration: ChromaticAberrationEffectState;
	vignette: VignetteEffectState;
	colorGrading: ColorGradingEffectState;
	filmGrain: FilmGrainEffectState;
}

/**
 * Quality preset for post-processing
 */
export type PostProcessingQuality = 'low' | 'medium' | 'high';

/**
 * Complete post-processing state
 */
export interface PostProcessingState {
	/** Global on/off for the entire pipeline */
	enabled: boolean;
	/** Active effect preset */
	preset: EffectPreset;
	/** Quality level affecting buffer resolution */
	quality: PostProcessingQuality;
	/** Individual effect configurations */
	effects: PostProcessingEffectsState;
}

/**
 * Default state for post-processing
 * Used when no persisted state exists
 */
export const DEFAULT_POST_PROCESSING_STATE: PostProcessingState = {
	enabled: true,
	preset: 'glitch-only',
	quality: 'high',
	effects: {
		glitch: {
			enabled: true,
			intensity: 0.5,
			chromaticAberration: 1.0,
			scanlineDensity: 1.0,
			noiseStrength: 0.5,
			signalLossBoost: 0.5
		},
		bloom: {
			enabled: false,
			intensity: 1.5,
			threshold: 0.2,
			radius: 4.0
		},
		chromaticAberration: {
			enabled: false,
			intensity: 0.4,
			offset: 0.02
		},
		vignette: {
			enabled: false,
			intensity: 0.5,
			radius: 0.75,
			feather: 0.5
		},
		colorGrading: {
			enabled: false,
			intensity: 1.0,
			temperature: 0.0,
			contrast: 0.0,
			saturation: 0.0,
			brightness: 0.0
		},
		filmGrain: {
			enabled: false,
			intensity: 0.3
		}
	}
};

/**
 * Merge persisted state with defaults to ensure all effects exist
 * Handles migration when new effects are added
 */
function mergeWithDefaults(persisted: unknown): PostProcessingState {
	if (!persisted || typeof persisted !== 'object' || persisted === null) {
		return DEFAULT_POST_PROCESSING_STATE;
	}

	const persistedState = persisted as Partial<PostProcessingState>;
	const persistedEffects = persistedState.effects || {};

	return {
		...DEFAULT_POST_PROCESSING_STATE,
		...persistedState,
		effects: {
			...DEFAULT_POST_PROCESSING_STATE.effects,
			...persistedEffects,
			// Ensure all effect objects exist with their defaults
			glitch: {
				...DEFAULT_POST_PROCESSING_STATE.effects.glitch,
				...(persistedEffects.glitch || {})
			},
			bloom: {
				...DEFAULT_POST_PROCESSING_STATE.effects.bloom,
				...(persistedEffects.bloom || {})
			},
			chromaticAberration: {
				...DEFAULT_POST_PROCESSING_STATE.effects.chromaticAberration,
				...(persistedEffects.chromaticAberration || {})
			},
			vignette: {
				...DEFAULT_POST_PROCESSING_STATE.effects.vignette,
				...(persistedEffects.vignette || {})
			},
			colorGrading: {
				...DEFAULT_POST_PROCESSING_STATE.effects.colorGrading,
				...(persistedEffects.colorGrading || {})
			},
			filmGrain: {
				...DEFAULT_POST_PROCESSING_STATE.effects.filmGrain,
				...(persistedEffects.filmGrain || {})
			}
		}
	};
}

/**
 * Main post-processing state store
 * Persists to localStorage for user preference retention
 * Automatically merges with defaults to handle new effects
 */
// Load initial value from localStorage and merge with defaults
let initialValue: PostProcessingState = DEFAULT_POST_PROCESSING_STATE;
try {
	const stored = localStorage.getItem('kvs_postProcessingState');
	if (stored) {
		const parsed = JSON.parse(stored);
		initialValue = mergeWithDefaults(parsed);
		// Save merged value back to localStorage to update old state
		localStorage.setItem('kvs_postProcessingState', JSON.stringify(initialValue));
	}
} catch (error) {
	console.warn('Failed to load post-processing state from localStorage:', error);
}

const rawStore = persistent<PostProcessingState>('kvs_postProcessingState', initialValue);

// Wrap the store to merge persisted state with defaults on subscription
// This ensures backward compatibility when new effects are added
export const postProcessingState = {
	subscribe: (callback: (value: PostProcessingState) => void) => {
		return rawStore.subscribe((state) => {
			// Merge with defaults to ensure all effects exist
			const merged = mergeWithDefaults(state);
			callback(merged);
		});
	},
	set: (value: PostProcessingState) => {
		rawStore.set(value);
	},
	update: (updater: (value: PostProcessingState) => PostProcessingState) => {
		rawStore.update((current) => {
			const merged = mergeWithDefaults(current);
			const updated = updater(merged);
			return updated;
		});
	}
};

/**
 * Derived store: Global enabled state
 * Lightweight subscription for components that only need to know if PP is on/off
 */
export const postProcessingEnabled: Readable<boolean> = derived(
	postProcessingState,
	(state) => state.enabled
);

/**
 * Derived store: Active effects map
 * Returns which effects are currently enabled
 */
export const activeEffects: Readable<Record<PostProcessingEffectType, boolean>> = derived(
	postProcessingState,
	(state) => ({
		glitch: state.enabled && state.effects.glitch.enabled,
		bloom: state.enabled && state.effects.bloom.enabled,
		'chromatic-aberration': state.enabled && state.effects.chromaticAberration.enabled,
		vignette: state.enabled && state.effects.vignette.enabled,
		'color-grading': state.enabled && state.effects.colorGrading.enabled,
		'film-grain': state.enabled && state.effects.filmGrain.enabled
	})
);

/**
 * Derived store: Glitch effect state
 * For components that only need glitch parameters
 */
export const glitchEffectState: Readable<GlitchEffectState> = derived(
	postProcessingState,
	(state) => state.effects.glitch
);

/**
 * Helper function to update a specific effect's state
 * @param effectType - The effect to update
 * @param updates - Partial state updates
 */
export function updateEffectState<T extends PostProcessingEffectType>(
	effectType: T,
	updates: Partial<
		PostProcessingEffectsState[T extends 'chromatic-aberration'
			? 'chromaticAberration'
			: T extends 'color-grading'
				? 'colorGrading'
				: T extends 'film-grain'
					? 'filmGrain'
					: T]
	>
): void {
	postProcessingState.update((state) => {
		// Map effect type to store key
		const effectKeyMap: Record<PostProcessingEffectType, keyof PostProcessingEffectsState> = {
			glitch: 'glitch',
			bloom: 'bloom',
			'chromatic-aberration': 'chromaticAberration',
			vignette: 'vignette',
			'color-grading': 'colorGrading',
			'film-grain': 'filmGrain'
		};

		const effectKey = effectKeyMap[effectType];
		return {
			...state,
			effects: {
				...state.effects,
				[effectKey]: {
					...state.effects[effectKey],
					...updates
				}
			}
		};
	});
}

/**
 * Helper function to toggle global post-processing
 */
export function togglePostProcessing(): void {
	postProcessingState.update((state) => ({
		...state,
		enabled: !state.enabled
	}));
}

/**
 * Helper function to set global post-processing enabled state
 * @param enabled - Whether post-processing should be enabled
 */
export function setPostProcessingEnabled(enabled: boolean): void {
	postProcessingState.update((state) => ({
		...state,
		enabled
	}));
}

/**
 * Helper function to reset to default state
 */
export function resetPostProcessingState(): void {
	postProcessingState.set(DEFAULT_POST_PROCESSING_STATE);
}
