/**
 * PostProcessingFacade
 * Simplified API for post-processing pipeline integration with Svelte components
 *
 * Presentation Layer - Facade pattern for simplified component integration
 *
 * Design Patterns:
 * - Facade Pattern: Simplifies complex pipeline operations
 * - Strategy Pattern: Switches between pipeline and passthrough rendering
 * - Observer Pattern: Subscribes to store for reactive updates
 * - Factory Pattern: Uses EffectFactory for effect creation
 *
 * Performance Considerations:
 * - Lazy initialization: Pipeline only created when first enabled
 * - Zero overhead when disabled: Early returns, no allocations
 * - Efficient store subscriptions: Only reacts to relevant state changes
 * - Zero-garbage render loop: Reuses objects, no allocations per frame
 */

import type { WebGLRenderer, Scene, Camera } from 'three';
import { WebGLRenderTarget, RGBAFormat, LinearFilter, ClampToEdgeWrapping } from 'three';
import type { Readable, Unsubscriber } from 'svelte/store';
import { get } from 'svelte/store';
import { PostProcessingPipeline } from '../application/PostProcessingPipeline';
import { EffectFactory } from '../domain/factories/EffectFactory';
import type { EffectUniforms } from '../domain/entities/PostProcessingEffect';
import type { IPostProcessingEffect } from '../domain/entities/PostProcessingEffect';
import type { PostProcessingState, GlitchEffectState } from '$lib/stores/postProcessing';
import { POST_PROCESSING } from '$lib/utils/constants';

/**
 * Configuration for creating a PostProcessingFacade
 */
export interface PostProcessingFacadeConfig {
	/** The WebGL renderer instance */
	renderer: WebGLRenderer;
	/** The post-processing state store */
	state: Readable<PostProcessingState>;
	/** Initial viewport width */
	width: number;
	/** Initial viewport height */
	height: number;
}

/**
 * Context passed to render method each frame
 * Contains all data needed for a single render pass
 */
export interface PostProcessingRenderContext {
	/** The Three.js scene to render */
	scene: Scene;
	/** The camera to render from */
	camera: Camera;
	/** Current time in seconds since start */
	timeSeconds: number;
	/** Viewport resolution [width, height] */
	resolution: [number, number];
	/** Whether hand tracking signal is lost */
	signalLost: boolean;
}

/**
 * Render strategy function type
 * Strategy Pattern: Different strategies for pipeline vs passthrough rendering
 */
type RenderStrategy = (ctx: PostProcessingRenderContext) => void;

/**
 * PostProcessingFacade - Simplified API for post-processing pipeline
 *
 * Handles:
 * - Lazy initialization (only when enabled)
 * - Graceful fallback on errors
 * - Store subscription for reactive updates
 * - Resource lifecycle management
 */
export class PostProcessingFacade {
	private pipeline: PostProcessingPipeline | null = null;
	private sceneRenderTarget: WebGLRenderTarget | null = null;
	private renderer: WebGLRenderer;
	private stateStore: Readable<PostProcessingState>;
	private unsubscribe: Unsubscriber | null = null;
	private state: PostProcessingState;
	private initialized = false;
	private hasError = false;
	private width: number;
	private height: number;

	/** Current render strategy (pipeline or passthrough) */
	private currentRenderStrategy: RenderStrategy;

	/** Pre-allocated uniforms object to avoid per-frame allocations */
	private readonly uniformsCache: EffectUniforms = {
		uTime: 0,
		uSignalLost: false,
		uIntensity: 0.5,
		uResolution: [0, 0]
	};

	/**
	 * Create a new PostProcessingFacade
	 * @param config - Configuration options
	 */
	constructor(config: PostProcessingFacadeConfig) {
		this.renderer = config.renderer;
		this.stateStore = config.state;
		this.width = config.width;
		this.height = config.height;

		// Get initial state synchronously
		let initialState: PostProcessingState | undefined;
		const tmpUnsub = this.stateStore.subscribe((s) => {
			initialState = s;
		});
		tmpUnsub();

		if (!initialState) {
			throw new Error('[PostProcessingFacade] Failed to read initial state from store');
		}
		this.state = initialState;

		// Start with passthrough strategy (zero overhead when disabled)
		this.currentRenderStrategy = this.createPassthroughStrategy();

		// Subscribe for ongoing state updates
		this.unsubscribe = this.stateStore.subscribe((newState) => {
			this.state = newState;
			this.handleStateChange();
		});

		// Initialize if already enabled
		if (this.state.enabled) {
			this.handleStateChange();
		}
	}

	/**
	 * Handle state changes from store subscription
	 * Manages lazy initialization and strategy switching
	 */
	private handleStateChange(): void {
		// Global disable: free resources, fall back to passthrough
		if (!this.state.enabled) {
			if (this.initialized) {
				this.disposePipeline();
			}
			this.currentRenderStrategy = this.createPassthroughStrategy();
			this.hasError = false;
			return;
		}

		// Check if any effect is enabled
		const hasEnabledEffect = this.hasAnyEffectEnabled();
		if (!hasEnabledEffect) {
			// No effects enabled, use passthrough
			if (this.initialized) {
				this.disposePipeline();
			}
			this.currentRenderStrategy = this.createPassthroughStrategy();
			return;
		}

		// Lazily initialize on first enable
		if (!this.initialized && !this.hasError) {
			try {
				this.initializePipeline();
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				console.error('[PostProcessingFacade] Pipeline initialization failed:', errorMessage);
				this.hasError = true;
				this.disposePipeline();
				this.currentRenderStrategy = this.createPassthroughStrategy();
				return;
			}
		}

		// Sync effect states if pipeline is up
		if (this.pipeline && this.initialized && !this.hasError) {
			this.syncEffects();
		}
	}

	/**
	 * Check if any effect is enabled in the current state
	 */
	private hasAnyEffectEnabled(): boolean {
		const { effects } = this.state;
		return effects.glitch.enabled || effects.bloom.enabled || effects.chromaticAberration.enabled;
	}

	/**
	 * Initialize the post-processing pipeline
	 * Creates render targets and effects based on current state
	 */
	private initializePipeline(): void {
		// Apply quality preset scaling to render target resolution
		const qualityScale = POST_PROCESSING.PERFORMANCE.QUALITY_SCALE[this.state.quality];
		const effectiveWidth = Math.floor(this.width * qualityScale);
		const effectiveHeight = Math.floor(this.height * qualityScale);

		// Create scene render target with quality-scaled resolution
		this.sceneRenderTarget = this.createSceneRenderTarget(effectiveWidth, effectiveHeight);

		// Create pipeline
		this.pipeline = new PostProcessingPipeline();

		// Add effects based on current state
		const effectsToAdd = this.createEffectsFromState();
		for (const effect of effectsToAdd) {
			this.pipeline.addEffect(effect);
		}

		// Initialize pipeline with quality-scaled resolution (reuse calculated values)
		this.pipeline.initialize(this.renderer, {
			width: effectiveWidth,
			height: effectiveHeight
		});

		this.initialized = true;
		this.currentRenderStrategy = this.createPipelineStrategy();
	}

	/**
	 * Synchronize effect states with store values
	 * Called when store updates while pipeline is active
	 */
	private syncEffects(): void {
		if (!this.pipeline) return;

		const { glitch } = this.state.effects;
		const glitchEffect = this.pipeline.getEffect('GlitchEffect');

		if (glitchEffect) {
			glitchEffect.enabled = glitch.enabled && this.state.enabled;
			glitchEffect.intensity = glitch.intensity;
		}

		// Future: sync bloom and chromatic aberration effects when implemented
	}

	/**
	 * Create effects based on current store state
	 * Uses EffectFactory for effect instantiation
	 * @returns Array of initialized post-processing effects
	 */
	private createEffectsFromState(): IPostProcessingEffect[] {
		const effects = [];
		const { glitch, bloom, chromaticAberration } = this.state.effects;

		if (glitch.enabled) {
			const glitchEffect = EffectFactory.createEffect('glitch');
			if (glitchEffect) {
				glitchEffect.intensity = glitch.intensity;
				effects.push(glitchEffect);
			}
		}

		// Future: Add bloom and chromatic aberration when implemented
		if (bloom.enabled) {
			const bloomEffect = EffectFactory.createEffect('bloom');
			if (bloomEffect) {
				bloomEffect.intensity = bloom.intensity;
				effects.push(bloomEffect);
			}
		}

		if (chromaticAberration.enabled) {
			const caEffect = EffectFactory.createEffect('chromatic-aberration');
			if (caEffect) {
				caEffect.intensity = chromaticAberration.intensity;
				effects.push(caEffect);
			}
		}

		return effects;
	}

	/**
	 * Create the scene render target
	 * @param width - Target width
	 * @param height - Target height
	 */
	private createSceneRenderTarget(width: number, height: number): WebGLRenderTarget {
		return new WebGLRenderTarget(width, height, {
			format: RGBAFormat,
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			wrapS: ClampToEdgeWrapping,
			wrapT: ClampToEdgeWrapping,
			depthBuffer: true,
			stencilBuffer: false
		});
	}

	/**
	 * Create passthrough render strategy
	 * Used when post-processing is disabled or on error
	 * Strategy Pattern: Passthrough strategy
	 */
	private createPassthroughStrategy(): RenderStrategy {
		return ({ scene, camera }: PostProcessingRenderContext) => {
			// Simply render scene directly to screen
			this.renderer.setRenderTarget(null);
			this.renderer.render(scene, camera);
		};
	}

	/**
	 * Create pipeline render strategy
	 * Used when post-processing is enabled and working
	 * Strategy Pattern: Pipeline strategy
	 */
	private createPipelineStrategy(): RenderStrategy {
		return (ctx: PostProcessingRenderContext) => {
			const { scene, camera, timeSeconds, resolution, signalLost } = ctx;

			if (!this.pipeline || !this.sceneRenderTarget) {
				// Safety fallback: if something got disposed unexpectedly
				this.createPassthroughStrategy()(ctx);
				return;
			}

			// Store current render target to restore later
			const currentRenderTarget = this.renderer.getRenderTarget();

			// CRITICAL: When using stage: 'after', Threlte already rendered to screen
			// We need to render the scene again to our render target, then apply effects
			// Note: This means we render twice, but it's necessary for post-processing
			// Render scene to our render target (this captures what we want to process)
			this.renderer.setRenderTarget(this.sceneRenderTarget);
			this.renderer.clear(); // Clear the render target
			this.renderer.render(scene, camera);

			// Update uniforms cache (reuse object to avoid allocations)
			this.updateUniformsCache(timeSeconds, signalLost, resolution);

			try {
				// Apply post-processing effects (this will render to screen via pipeline.render)
				// The pipeline's last effect renders to null (screen)
				this.pipeline.render(this.sceneRenderTarget, this.uniformsCache);
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				console.error('[PostProcessingFacade] Pipeline render failed, falling back:', errorMessage);
				this.hasError = true;
				this.disposePipeline();
				this.currentRenderStrategy = this.createPassthroughStrategy();

				// Render scene directly as fallback
				this.renderer.setRenderTarget(null);
				this.renderer.render(scene, camera);
				return;
			}

			// CRITICAL: Don't restore the previous render target if it was null (screen)
			// If we restore null, Threlte might clear the screen on the next frame
			// Instead, leave it as null so our post-processed result stays visible
			// Only restore if there was a non-null render target
			if (currentRenderTarget !== null) {
				this.renderer.setRenderTarget(currentRenderTarget);
			}
		};
	}

	/**
	 * Update the uniforms cache without allocating new objects
	 * Zero-garbage optimization
	 */
	private updateUniformsCache(
		timeSeconds: number,
		signalLost: boolean,
		resolution: [number, number]
	): void {
		const glitchState = this.state.effects.glitch;

		this.uniformsCache.uTime = timeSeconds;
		this.uniformsCache.uSignalLost = signalLost;
		this.uniformsCache.uIntensity = this.calculateEffectiveIntensity(glitchState, signalLost);
		this.uniformsCache.uResolution[0] = resolution[0];
		this.uniformsCache.uResolution[1] = resolution[1];
	}

	/**
	 * Calculate effective intensity including signal loss boost
	 * @param glitchState - Current glitch effect state
	 * @param signalLost - Whether signal is lost
	 * @returns Clamped intensity value within valid range
	 */
	private calculateEffectiveIntensity(glitchState: GlitchEffectState, signalLost: boolean): number {
		const baseIntensity = glitchState.intensity;
		const boost = signalLost ? glitchState.signalLossBoost : 0;
		const totalIntensity = baseIntensity + boost;

		// Clamp to valid range using constants
		return Math.max(
			POST_PROCESSING.MIN_INTENSITY,
			Math.min(totalIntensity, POST_PROCESSING.MAX_INTENSITY)
		);
	}

	/**
	 * Render post-processing effects
	 * Main entry point called each frame
	 * @param context - Render context with scene, camera, and uniforms
	 */
	render(context: PostProcessingRenderContext): void {
		// Zero overhead when globally disabled and not initialized
		if (!this.state.enabled && !this.initialized) {
			// Don't render anything - let Threlte's default render handle it
			return;
		}

		this.currentRenderStrategy(context);
	}

	/**
	 * Resize the pipeline buffers
	 * Applies quality preset scaling to the resolution
	 * @param width - New width
	 * @param height - New height
	 */
	resize(width: number, height: number): void {
		this.width = width;
		this.height = height;

		// Apply quality preset scaling
		const qualityScale = POST_PROCESSING.PERFORMANCE.QUALITY_SCALE[this.state.quality];
		const effectiveWidth = Math.floor(width * qualityScale);
		const effectiveHeight = Math.floor(height * qualityScale);

		if (this.sceneRenderTarget) {
			this.sceneRenderTarget.setSize(effectiveWidth, effectiveHeight);
		}

		if (this.pipeline) {
			this.pipeline.resize(effectiveWidth, effectiveHeight);
		}
	}

	/**
	 * Check if the facade is initialized
	 */
	isInitialized(): boolean {
		return this.initialized;
	}

	/**
	 * Check if the facade has encountered an error
	 */
	hasEncounteredError(): boolean {
		return this.hasError;
	}

	/**
	 * Dispose of all resources
	 * Call this when the component unmounts
	 */
	dispose(): void {
		this.disposePipeline();

		if (this.unsubscribe) {
			this.unsubscribe();
			this.unsubscribe = null;
		}
	}

	/**
	 * Dispose pipeline resources only
	 * Used when disabling or on error
	 */
	private disposePipeline(): void {
		if (this.pipeline) {
			this.pipeline.dispose();
			this.pipeline = null;
		}

		if (this.sceneRenderTarget) {
			this.sceneRenderTarget.dispose();
			this.sceneRenderTarget = null;
		}

		this.initialized = false;
	}
}

/**
 * Factory function to create a PostProcessingFacade
 * @param config - Configuration options
 * @returns A new PostProcessingFacade instance
 */
export function createPostProcessingFacade(
	config: PostProcessingFacadeConfig
): PostProcessingFacade {
	return new PostProcessingFacade(config);
}
