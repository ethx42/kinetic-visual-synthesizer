/**
 * Post-Processing Pipeline
 * Chain of Responsibility pattern implementation for effect composition
 * Manages ping-pong buffers for effect chaining
 */

import {
	WebGLRenderer,
	WebGLRenderTarget,
	RGBAFormat,
	LinearFilter,
	ClampToEdgeWrapping
} from 'three';
import type {
	IPostProcessingEffect,
	EffectUniforms
} from '../domain/entities/PostProcessingEffect';

/**
 * Pipeline configuration options
 */
export interface PipelineConfig {
	width: number;
	height: number;
}

/**
 * PostProcessingPipeline - Manages effect chain and ping-pong buffers
 * Uses Chain of Responsibility pattern for effect composition
 */
export class PostProcessingPipeline {
	private _effects: IPostProcessingEffect[] = [];
	private _renderer: WebGLRenderer | null = null;
	private _initialized: boolean = false;

	private _pingBuffer: WebGLRenderTarget | null = null;
	private _pongBuffer: WebGLRenderTarget | null = null;
	private _width: number = 0;
	private _height: number = 0;

	/**
	 * Get the list of effects in the pipeline
	 */
	get effects(): readonly IPostProcessingEffect[] {
		return this._effects;
	}

	/**
	 * Check if the pipeline is initialized
	 */
	get initialized(): boolean {
		return this._initialized;
	}

	/**
	 * Initialize the pipeline with the renderer
	 * @param renderer - The WebGL renderer
	 * @param config - Pipeline configuration
	 */
	initialize(renderer: WebGLRenderer, config: PipelineConfig): void {
		if (this._initialized) {
			return;
		}

		this._renderer = renderer;
		this._width = config.width;
		this._height = config.height;

		this._createBuffers();

		for (const effect of this._effects) {
			effect.initialize(renderer);
		}

		this._initialized = true;
	}

	/**
	 * Create ping-pong buffers for effect chaining
	 */
	private _createBuffers(): void {
		const options = {
			format: RGBAFormat,
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			wrapS: ClampToEdgeWrapping,
			wrapT: ClampToEdgeWrapping,
			depthBuffer: false,
			stencilBuffer: false
		};

		this._pingBuffer = new WebGLRenderTarget(this._width, this._height, options);
		this._pongBuffer = new WebGLRenderTarget(this._width, this._height, options);
	}

	/**
	 * Resize the pipeline buffers
	 * @param width - New width
	 * @param height - New height
	 */
	resize(width: number, height: number): void {
		if (width === this._width && height === this._height) {
			return;
		}

		this._width = width;
		this._height = height;

		if (this._pingBuffer) {
			this._pingBuffer.setSize(width, height);
		}
		if (this._pongBuffer) {
			this._pongBuffer.setSize(width, height);
		}
	}

	/**
	 * Add an effect to the pipeline
	 * Effects are sorted alphabetically by name for deterministic ordering
	 * @param effect - The effect to add
	 */
	addEffect(effect: IPostProcessingEffect): void {
		this._effects.push(effect);
		this._sortEffects();

		if (this._initialized && this._renderer) {
			effect.initialize(this._renderer);
		}
	}

	/**
	 * Remove an effect from the pipeline
	 * @param effectName - The name of the effect to remove
	 */
	removeEffect(effectName: string): void {
		const index = this._effects.findIndex((e) => e.name === effectName);
		if (index !== -1) {
			const effect = this._effects[index];
			effect.dispose();
			this._effects.splice(index, 1);
		}
	}

	/**
	 * Get an effect by name
	 * @param effectName - The name of the effect
	 * @returns The effect or undefined if not found
	 */
	getEffect(effectName: string): IPostProcessingEffect | undefined {
		return this._effects.find((e) => e.name === effectName);
	}

	/**
	 * Enable or disable an effect
	 * @param effectName - The name of the effect
	 * @param enabled - Whether to enable or disable
	 */
	setEffectEnabled(effectName: string, enabled: boolean): void {
		const effect = this.getEffect(effectName);
		if (effect) {
			effect.enabled = enabled;
		}
	}

	/**
	 * Set effect intensity
	 * @param effectName - The name of the effect
	 * @param intensity - The intensity value (0.0 - 1.0)
	 */
	setEffectIntensity(effectName: string, intensity: number): void {
		const effect = this.getEffect(effectName);
		if (effect) {
			effect.intensity = Math.max(0, Math.min(1, intensity));
		}
	}

	/**
	 * Sort effects alphabetically by name for deterministic ordering
	 */
	private _sortEffects(): void {
		this._effects.sort((a, b) => a.name.localeCompare(b.name));
	}

	/**
	 * Render the post-processing pipeline
	 * @param inputTarget - The input render target (scene render)
	 * @param uniforms - Uniform values to pass to effects
	 */
	render(inputTarget: WebGLRenderTarget, uniforms: EffectUniforms): void {
		if (!this._initialized || !this._renderer || !this._pingBuffer || !this._pongBuffer) {
			return;
		}

		const enabledEffects = this._effects.filter((e) => e.enabled);

		if (enabledEffects.length === 0) {
			this._copyToScreen(inputTarget);
			return;
		}

		let readBuffer = inputTarget;
		let writeBuffer = this._pingBuffer;
		let usePing = true;

		for (let i = 0; i < enabledEffects.length; i++) {
			const effect = enabledEffects[i];
			const isLast = i === enabledEffects.length - 1;

			effect.updateUniforms(uniforms);

			if (isLast) {
				effect.render(this._renderer, readBuffer, null);
			} else {
				effect.render(this._renderer, readBuffer, writeBuffer);

				readBuffer = writeBuffer;
				writeBuffer = usePing ? this._pongBuffer : this._pingBuffer;
				usePing = !usePing;
			}
		}
	}

	/**
	 * Copy input directly to screen (bypass effects)
	 */
	private _copyToScreen(inputTarget: WebGLRenderTarget): void {
		if (!this._renderer) {
			return;
		}

		const currentRenderTarget = this._renderer.getRenderTarget();
		this._renderer.setRenderTarget(null);

		const gl = this._renderer.getContext();
		const width = this._renderer.domElement.width;
		const height = this._renderer.domElement.height;

		this._renderer.setRenderTarget(inputTarget);
		gl.bindFramebuffer(gl.READ_FRAMEBUFFER, gl.getParameter(gl.FRAMEBUFFER_BINDING));
		this._renderer.setRenderTarget(null);
		gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);

		gl.blitFramebuffer(
			0,
			0,
			inputTarget.width,
			inputTarget.height,
			0,
			0,
			width,
			height,
			gl.COLOR_BUFFER_BIT,
			gl.NEAREST
		);

		this._renderer.setRenderTarget(currentRenderTarget);
	}

	/**
	 * Dispose of all pipeline resources
	 */
	dispose(): void {
		for (const effect of this._effects) {
			effect.dispose();
		}
		this._effects = [];

		if (this._pingBuffer) {
			this._pingBuffer.dispose();
			this._pingBuffer = null;
		}

		if (this._pongBuffer) {
			this._pongBuffer.dispose();
			this._pongBuffer = null;
		}

		this._renderer = null;
		this._initialized = false;
	}
}
