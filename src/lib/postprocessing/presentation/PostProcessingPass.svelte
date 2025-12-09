<script lang="ts">
	/**
	 * PostProcessingPass Component
	 * Thin integration layer for post-processing pipeline with Threlte
	 *
	 * This component:
	 * - Creates and manages the PostProcessingFacade
	 * - Connects to the postProcessingState store for reactive control
	 * - Handles resize events
	 * - Integrates with Threlte's render loop via useTask
	 *
	 * All effect management is delegated to the facade, which subscribes
	 * to the store for dynamic, user-controlled effect parameters.
	 */
	import { onMount, onDestroy } from 'svelte';
	import { useThrelte, useTask } from '@threlte/core';
	import { postProcessingState } from '$lib/stores/postProcessing';
	import {
		createPostProcessingFacade,
		type PostProcessingFacade
	} from './PostProcessingFacade';
	import { handTracking } from '$lib/stores/handTracking';

	const { renderer, scene, camera, size } = useThrelte();

	let facade: PostProcessingFacade | null = null;
	let startTime = performance.now();
	let signalLost = false;

	// Subscribe to hand tracking for signal loss detection
	// This is kept separate from the facade to maintain single responsibility
	const unsubscribeHandTracking = handTracking.subscribe((state) => {
		signalLost = state.signalLost;
	});

	onMount(() => {
		if (!renderer) {
			console.error('[PostProcessingPass] Renderer not available');
			return;
		}

		const width = size.current.width || window.innerWidth;
		const height = size.current.height || window.innerHeight;

		try {
			facade = createPostProcessingFacade({
				renderer,
				state: postProcessingState,
				width,
				height
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error('[PostProcessingPass] Failed to create facade:', errorMessage);
			// Facade creation failed - scene will render normally without post-processing
		}

		startTime = performance.now();
	});

	// Handle resize events
	$effect(() => {
		if (!facade || !size.current) return;

		const width = size.current.width || window.innerWidth;
		const height = size.current.height || window.innerHeight;
		facade.resize(width, height);
	});

	// Render loop integration via Threlte's useTask
	useTask('post-processing-pass', () => {
		if (!facade || !renderer || !scene || !camera.current) {
			return;
		}

		const currentTime = (performance.now() - startTime) / 1000;
		const width = size.current.width || window.innerWidth;
		const height = size.current.height || window.innerHeight;

		facade.render({
			scene,
			camera: camera.current,
			timeSeconds: currentTime,
			resolution: [width, height],
			signalLost
		});
	});

	onDestroy(() => {
		unsubscribeHandTracking();

		if (facade) {
			facade.dispose();
			facade = null;
		}
	});
</script>
