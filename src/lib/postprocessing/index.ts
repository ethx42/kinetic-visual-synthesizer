/**
 * Post-Processing Module
 * Exports all post-processing related types, classes, and components
 */

export type {
	IPostProcessingEffect,
	EffectUniforms,
	EffectPreset
} from './domain/entities/PostProcessingEffect';

export { BasePostProcessingEffect } from './domain/entities/PostProcessingEffect';

export { GlitchEffect } from './domain/effects/GlitchEffect';

export { EffectFactory, type EffectType } from './domain/factories/EffectFactory';

export { PostProcessingPipeline, type PipelineConfig } from './application/PostProcessingPipeline';
