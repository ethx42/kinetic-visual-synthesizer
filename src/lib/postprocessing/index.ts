/**
 * Post-Processing Module
 * Exports all post-processing related types, classes, and components
 */

// Domain Layer - Entities
export type {
	IPostProcessingEffect,
	EffectUniforms,
	EffectPreset
} from './domain/entities/PostProcessingEffect';

export { BasePostProcessingEffect } from './domain/entities/PostProcessingEffect';

// Domain Layer - Effects
export { GlitchEffect } from './domain/effects/GlitchEffect';

// Domain Layer - Factories
export { EffectFactory, type EffectType } from './domain/factories/EffectFactory';

// Application Layer - Pipeline
export { PostProcessingPipeline, type PipelineConfig } from './application/PostProcessingPipeline';

// Presentation Layer - Facade
export {
	PostProcessingFacade,
	createPostProcessingFacade,
	type PostProcessingFacadeConfig,
	type PostProcessingRenderContext
} from './presentation/PostProcessingFacade';
