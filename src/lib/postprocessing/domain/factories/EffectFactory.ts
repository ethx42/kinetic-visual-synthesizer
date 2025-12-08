/**
 * Effect Factory
 * Factory Pattern implementation for creating post-processing effects
 * Supports effect presets and individual effect instantiation
 */

import type { IPostProcessingEffect, EffectPreset } from '../entities/PostProcessingEffect';
import { GlitchEffect } from '../effects/GlitchEffect';

/**
 * Available effect types that can be created by the factory
 */
export type EffectType = 'glitch' | 'bloom' | 'chromatic-aberration';

/**
 * Effect configuration for preset creation
 */
interface EffectConfig {
	type: EffectType;
	enabled: boolean;
	intensity: number;
}

/**
 * Preset configurations
 */
const PRESET_CONFIGS: Record<EffectPreset, EffectConfig[]> = {
	none: [],
	'glitch-only': [{ type: 'glitch', enabled: true, intensity: 0.5 }],
	cinematic: [
		{ type: 'glitch', enabled: true, intensity: 0.3 },
		{ type: 'chromatic-aberration', enabled: true, intensity: 0.2 }
	]
};

/**
 * EffectFactory - Creates post-processing effects using Factory Pattern
 */
export class EffectFactory {
	/**
	 * Create a single effect by type
	 * @param type - The type of effect to create
	 * @returns The created effect instance
	 */
	static createEffect(type: EffectType): IPostProcessingEffect {
		switch (type) {
			case 'glitch':
				return new GlitchEffect();
			case 'bloom':
				console.warn('BloomEffect not yet implemented, returning GlitchEffect as fallback');
				return new GlitchEffect();
			case 'chromatic-aberration':
				console.warn(
					'ChromaticAberrationEffect not yet implemented, returning GlitchEffect as fallback'
				);
				return new GlitchEffect();
			default:
				throw new Error(`Unknown effect type: ${type}`);
		}
	}

	/**
	 * Create effects from a preset configuration
	 * @param preset - The preset to use
	 * @returns Array of configured effect instances
	 */
	static createFromPreset(preset: EffectPreset): IPostProcessingEffect[] {
		const configs = PRESET_CONFIGS[preset];
		if (!configs) {
			throw new Error(`Unknown preset: ${preset}`);
		}

		return configs.map((config) => {
			const effect = EffectFactory.createEffect(config.type);
			effect.enabled = config.enabled;
			effect.intensity = config.intensity;
			return effect;
		});
	}

	/**
	 * Get available effect types
	 * @returns Array of available effect type names
	 */
	static getAvailableEffects(): EffectType[] {
		return ['glitch', 'bloom', 'chromatic-aberration'];
	}

	/**
	 * Get available presets
	 * @returns Array of available preset names
	 */
	static getAvailablePresets(): EffectPreset[] {
		return ['none', 'glitch-only', 'cinematic'];
	}
}
