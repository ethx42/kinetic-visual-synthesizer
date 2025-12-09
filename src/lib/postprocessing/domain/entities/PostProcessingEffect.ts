/**
 * Post-Processing Effect Interface
 * Defines the contract for all post-processing effects
 * Uses Strategy Pattern for effect implementations
 */

import type { WebGLRenderer, WebGLRenderTarget, ShaderMaterial } from 'three';

/**
 * Effect preset types for quick configuration
 */
export type EffectPreset = 'none' | 'glitch-only' | 'cinematic';

/**
 * Uniform update parameters passed to effects each frame
 */
export interface EffectUniforms {
	uTime: number;
	uSignalLost: boolean;
	uIntensity: number;
	uResolution: [number, number];
}

/**
 * Interface for post-processing effects
 * All effects must implement this interface to be used in the pipeline
 */
export interface IPostProcessingEffect {
	/** Unique name identifier for the effect (used for ordering) */
	readonly name: string;

	/** Whether the effect is currently enabled */
	enabled: boolean;

	/** Effect intensity (0.0 - 1.0) */
	intensity: number;

	/** The shader material used for rendering */
	readonly material: ShaderMaterial | null;

	/**
	 * Initialize the effect with the renderer
	 * Called once when the effect is added to the pipeline
	 * @param renderer - The WebGL renderer
	 */
	initialize(renderer: WebGLRenderer): void;

	/**
	 * Render the effect
	 * @param renderer - The WebGL renderer
	 * @param inputTarget - The input render target (previous effect's output)
	 * @param outputTarget - The output render target (or null for screen)
	 */
	render(
		renderer: WebGLRenderer,
		inputTarget: WebGLRenderTarget,
		outputTarget: WebGLRenderTarget | null
	): void;

	/**
	 * Update effect uniforms
	 * Called each frame before rendering
	 * @param uniforms - The uniform values to update
	 */
	updateUniforms(uniforms: EffectUniforms): void;

	/**
	 * Dispose of effect resources
	 * Called when the effect is removed from the pipeline
	 */
	dispose(): void;
}

/**
 * Base class for post-processing effects
 * Provides common functionality for all effects
 */
export abstract class BasePostProcessingEffect implements IPostProcessingEffect {
	abstract readonly name: string;
	enabled: boolean = true;
	intensity: number = 1.0;
	material: ShaderMaterial | null = null;

	protected _initialized: boolean = false;

	abstract initialize(renderer: WebGLRenderer): void;

	abstract render(
		renderer: WebGLRenderer,
		inputTarget: WebGLRenderTarget,
		outputTarget: WebGLRenderTarget | null
	): void;

	abstract updateUniforms(uniforms: EffectUniforms): void;

	dispose(): void {
		if (this.material) {
			this.material.dispose();
			this.material = null;
		}
		this._initialized = false;
	}
}
