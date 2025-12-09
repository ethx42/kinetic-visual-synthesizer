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
	import { useThrelte, useTask, useStage } from '@threlte/core';
	import {
		postProcessingState,
		updateEffectState,
		setPostProcessingEnabled,
		type PostProcessingState
	} from '$lib/stores/postProcessing';
	import { createPostProcessingFacade, type PostProcessingFacade } from './PostProcessingFacade';
	import { handTracking } from '$lib/stores/handTracking';

	const { renderer, scene, camera, size, renderStage } = useThrelte();

	let facade: PostProcessingFacade | null = null;
	let startTime = performance.now();
	let signalLost = false;

	// Generate unique task key per component instance to avoid conflicts
	// Using Symbol ensures uniqueness even during hot reload
	const taskKey = Symbol('post-processing-pass');

	// Create a custom stage that runs AFTER the default render stage
	// This ensures post-processing happens after Threlte renders the scene
	const postProcessingStage = useStage('post-processing', {
		after: renderStage
	});

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

		// Expose debug functions to window in dev mode for easy testing
		if (import.meta.env.DEV && typeof window !== 'undefined') {
			// Helper to get current state from store (not localStorage)
			const getCurrentState = () => {
				let current: PostProcessingState | undefined;
				const unsub = postProcessingState.subscribe((s) => {
					current = s;
				});
				unsub();
				return current;
			};

			(window as any).__postProcessingDebug = {
				enable: () => {
					setPostProcessingEnabled(true);
					updateEffectState('glitch', { enabled: true });
					console.log('✅ Post-processing ENABLED');
				},
				disable: () => {
					setPostProcessingEnabled(false);
					console.log('❌ Post-processing DISABLED');
				},
				toggle: () => {
					const current = getCurrentState();
					const newState = !current?.enabled;
					setPostProcessingEnabled(newState);
					if (newState) {
						updateEffectState('glitch', { enabled: true });
					}
					console.log(newState ? '✅ Post-processing ENABLED' : '❌ Post-processing DISABLED');
				},
				setIntensity: (intensity: number) => {
					updateEffectState('glitch', { intensity: Math.max(0, Math.min(1, intensity)) });
					console.log(`🎚️ Glitch intensity set to: ${intensity}`);
				},
				status: () => {
					const state = getCurrentState();
					console.log('📊 Post-Processing Status:', {
						enabled: state?.enabled,
						glitchEnabled: state?.effects?.glitch?.enabled,
						glitchIntensity: state?.effects?.glitch?.intensity,
						facadeInitialized: facade?.isInitialized(),
						facadeHasError: facade?.hasEncounteredError(),
						fullState: state
					});
					// Also show localStorage for comparison
					const stored = localStorage.getItem('kvs_postProcessingState');
					console.log('💾 localStorage:', stored ? JSON.parse(stored) : 'null');
				}
			};
			console.log('🔧 Post-processing debug functions available:');
			console.log('  window.__postProcessingDebug.enable()   - Enable post-processing');
			console.log('  window.__postProcessingDebug.disable()  - Disable post-processing');
			console.log('  window.__postProcessingDebug.toggle()   - Toggle on/off');
			console.log('  window.__postProcessingDebug.setIntensity(0.8) - Set glitch intensity (0-1)');
			console.log('  window.__postProcessingDebug.status()    - Show current status');
		}
	});

	// Handle resize events
	$effect(() => {
		if (!facade || !size.current) return;

		const width = size.current.width || window.innerWidth;
		const height = size.current.height || window.innerHeight;
		facade.resize(width, height);
	});

	// Render loop integration via Threlte's useTask
	// CRITICAL: Run in custom stage AFTER Threlte's render stage
	// This ensures post-processing happens after the scene is rendered to screen
	useTask(
		taskKey,
		() => {
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
		},
		{
			stage: postProcessingStage,
			autoInvalidate: false // Don't trigger re-render, we handle it ourselves
		}
	);

	onDestroy(() => {
		unsubscribeHandTracking();

		if (facade) {
			facade.dispose();
			facade = null;
		}

		// Clean up debug functions
		if (import.meta.env.DEV && typeof window !== 'undefined') {
			delete (window as any).__postProcessingDebug;
		}
	});
</script>
