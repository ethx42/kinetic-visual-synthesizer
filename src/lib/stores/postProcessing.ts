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
export type PostProcessingEffectType = 'glitch' | 'bloom' | 'chromatic-aberration';

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
 * Chromatic aberration effect configuration (placeholder for future implementation)
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
 * All effects state container
 */
export interface PostProcessingEffectsState {
	glitch: GlitchEffectState;
	bloom: BloomEffectState;
	chromaticAberration: ChromaticAberrationEffectState;
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
			intensity: 0.6,
			threshold: 1.0,
			radius: 0.5
		},
		chromaticAberration: {
			enabled: false,
			intensity: 0.4,
			offset: 1.0
		}
	}
};

/**
 * Main post-processing state store
 * Persists to localStorage for user preference retention
 */
export const postProcessingState = persistent<PostProcessingState>(
	'kvs_postProcessingState',
	DEFAULT_POST_PROCESSING_STATE
);

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
		'chromatic-aberration': state.enabled && state.effects.chromaticAberration.enabled
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
	updates: Partial<PostProcessingEffectsState[T extends 'chromatic-aberration' ? 'chromaticAberration' : T]>
): void {
	postProcessingState.update((state) => {
		const effectKey = effectType === 'chromatic-aberration' ? 'chromaticAberration' : effectType;
		return {
			...state,
			effects: {
				...state.effects,
				[effectKey]: {
					...state.effects[effectKey as keyof PostProcessingEffectsState],
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
