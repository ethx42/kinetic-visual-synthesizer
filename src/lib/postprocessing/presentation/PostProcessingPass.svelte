<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { useThrelte, useTask } from '@threlte/core';
	import { WebGLRenderTarget, RGBAFormat, LinearFilter, ClampToEdgeWrapping } from 'three';
	import { PostProcessingPipeline } from '../application/PostProcessingPipeline';
	import { EffectFactory } from '../domain/factories/EffectFactory';
	import type { EffectPreset } from '../domain/entities/PostProcessingEffect';
	import { handTracking } from '$lib/stores/handTracking';

	interface Props {
		preset?: EffectPreset;
		enabled?: boolean;
	}

	let { preset = 'glitch-only', enabled = true }: Props = $props();

	const { renderer, scene, camera, size } = useThrelte();

	let pipeline: PostProcessingPipeline | null = null;
	let sceneRenderTarget: WebGLRenderTarget | null = null;
	let startTime = performance.now();
	let signalLost = false;

	handTracking.subscribe((state) => {
		signalLost = state.signalLost;
	});

	onMount(() => {
		if (!renderer) {
			console.error('[PostProcessingPass] Renderer not available');
			return;
		}

		const width = size.current.width || window.innerWidth;
		const height = size.current.height || window.innerHeight;

		sceneRenderTarget = new WebGLRenderTarget(width, height, {
			format: RGBAFormat,
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			wrapS: ClampToEdgeWrapping,
			wrapT: ClampToEdgeWrapping,
			depthBuffer: true,
			stencilBuffer: false
		});

		pipeline = new PostProcessingPipeline();

		const effects = EffectFactory.createFromPreset(preset);
		for (const effect of effects) {
			pipeline.addEffect(effect);
		}

		pipeline.initialize(renderer, { width, height });

		startTime = performance.now();
	});

	$effect(() => {
		if (pipeline && size.current) {
			const width = size.current.width || window.innerWidth;
			const height = size.current.height || window.innerHeight;
			pipeline.resize(width, height);

			if (sceneRenderTarget) {
				sceneRenderTarget.setSize(width, height);
			}
		}
	});

	$effect(() => {
		if (pipeline) {
			const glitchEffect = pipeline.getEffect('GlitchEffect');
			if (glitchEffect) {
				glitchEffect.enabled = enabled;
			}
		}
	});

	useTask('post-processing-pass', (_delta) => {
		if (!pipeline || !renderer || !scene || !camera.current || !sceneRenderTarget || !enabled) {
			return;
		}

		const currentRenderTarget = renderer.getRenderTarget();

		renderer.setRenderTarget(sceneRenderTarget);
		renderer.render(scene, camera.current);

		const currentTime = (performance.now() - startTime) / 1000;
		const width = size.current.width || window.innerWidth;
		const height = size.current.height || window.innerHeight;

		pipeline.render(sceneRenderTarget, {
			uTime: currentTime,
			uSignalLost: signalLost,
			uIntensity: 0.5,
			uResolution: [width, height]
		});

		renderer.setRenderTarget(currentRenderTarget);
	});

	onDestroy(() => {
		if (pipeline) {
			pipeline.dispose();
			pipeline = null;
		}

		if (sceneRenderTarget) {
			sceneRenderTarget.dispose();
			sceneRenderTarget = null;
		}
	});
</script>
