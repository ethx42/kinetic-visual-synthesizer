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
				// Global controls
				enable: () => {
					setPostProcessingEnabled(true);
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
					console.log(newState ? '✅ Post-processing ENABLED' : '❌ Post-processing DISABLED');
				},
				// Enable/disable all effects at once
				enableAll: () => {
					setPostProcessingEnabled(true);
					updateEffectState('glitch', { enabled: true });
					updateEffectState('bloom', { enabled: true });
					updateEffectState('chromatic-aberration', { enabled: true });
					updateEffectState('vignette', { enabled: true });
					updateEffectState('color-grading', { enabled: true });
					updateEffectState('film-grain', { enabled: true });
					console.log('✅ All effects ENABLED');
				},
				disableAll: () => {
					updateEffectState('glitch', { enabled: false });
					updateEffectState('bloom', { enabled: false });
					updateEffectState('chromatic-aberration', { enabled: false });
					updateEffectState('vignette', { enabled: false });
					updateEffectState('color-grading', { enabled: false });
					updateEffectState('film-grain', { enabled: false });
					console.log('❌ All effects DISABLED');
				},
				// Effect controls - each effect can be enabled/disabled independently
				enableEffect: (effectType: string) => {
					updateEffectState(effectType as any, { enabled: true });
					console.log(`✅ ${effectType} ENABLED`);
				},
				disableEffect: (effectType: string) => {
					updateEffectState(effectType as any, { enabled: false });
					console.log(`❌ ${effectType} DISABLED`);
				},
				toggleEffect: (effectType: string) => {
					const current = getCurrentState();
					if (!current) return;
					const effectKeyMap: Record<string, keyof typeof current.effects> = {
						glitch: 'glitch',
						bloom: 'bloom',
						'chromatic-aberration': 'chromaticAberration',
						vignette: 'vignette',
						'color-grading': 'colorGrading',
						'film-grain': 'filmGrain'
					};
					const key = effectKeyMap[effectType];
					if (key && current.effects[key]) {
						const newState = !current.effects[key].enabled;
						updateEffectState(effectType as any, { enabled: newState });
						console.log(newState ? `✅ ${effectType} ENABLED` : `❌ ${effectType} DISABLED`);
					}
				},
				// Intensity controls
				setIntensity: (effectType: string, intensity: number) => {
					updateEffectState(effectType as any, {
						intensity: Math.max(0, Math.min(1, intensity))
					});
					console.log(`🎚️ ${effectType} intensity set to: ${intensity}`);
				},
				// Glitch-specific (legacy support)
				setGlitchIntensity: (intensity: number) => {
					updateEffectState('glitch', { intensity: Math.max(0, Math.min(1, intensity)) });
					console.log(`🎚️ Glitch intensity set to: ${intensity}`);
				},
				// Bloom controls
				setBloomThreshold: (threshold: number) => {
					updateEffectState('bloom', { threshold: Math.max(0, Math.min(2, threshold)) });
					console.log(`🎚️ Bloom threshold set to: ${threshold}`);
				},
				setBloomRadius: (radius: number) => {
					updateEffectState('bloom', { radius: Math.max(0.1, Math.min(5, radius)) });
					console.log(`🎚️ Bloom radius set to: ${radius}`);
				},
				// Color Grading controls
				setTemperature: (temp: number) => {
					updateEffectState('color-grading', {
						temperature: Math.max(-1, Math.min(1, temp))
					});
					console.log(`🌡️ Color temperature set to: ${temp}`);
				},
				setContrast: (contrast: number) => {
					updateEffectState('color-grading', {
						contrast: Math.max(-1, Math.min(1, contrast))
					});
					console.log(`📊 Contrast set to: ${contrast}`);
				},
				setSaturation: (saturation: number) => {
					updateEffectState('color-grading', {
						saturation: Math.max(-1, Math.min(1, saturation))
					});
					console.log(`🎨 Saturation set to: ${saturation}`);
				},
				setBrightness: (brightness: number) => {
					updateEffectState('color-grading', {
						brightness: Math.max(-1, Math.min(1, brightness))
					});
					console.log(`💡 Brightness set to: ${brightness}`);
				},
				// Status
				status: () => {
					const state = getCurrentState();
					const pipeline = (facade as any)?._pipeline || null;
					const effects = pipeline ? Array.from(pipeline.effects || []) : [];

					console.log('📊 Post-Processing Status:', {
						enabled: state?.enabled,
						facadeInitialized: facade?.isInitialized(),
						facadeHasError: facade?.hasEncounteredError(),
						pipelineEffects: effects.map((e: any) => ({
							name: e.name,
							enabled: e.enabled,
							intensity: e.intensity
						})),
						storeEffects: {
							glitch: {
								enabled: state?.effects?.glitch?.enabled,
								intensity: state?.effects?.glitch?.intensity
							},
							bloom: {
								enabled: state?.effects?.bloom?.enabled,
								intensity: state?.effects?.bloom?.intensity,
								threshold: state?.effects?.bloom?.threshold,
								radius: state?.effects?.bloom?.radius
							},
							chromaticAberration: {
								enabled: state?.effects?.chromaticAberration?.enabled,
								intensity: state?.effects?.chromaticAberration?.intensity
							},
							vignette: {
								enabled: state?.effects?.vignette?.enabled,
								intensity: state?.effects?.vignette?.intensity
							},
							colorGrading: {
								enabled: state?.effects?.colorGrading?.enabled,
								intensity: state?.effects?.colorGrading?.intensity
							},
							filmGrain: {
								enabled: state?.effects?.filmGrain?.enabled,
								intensity: state?.effects?.filmGrain?.intensity
							}
						}
					});
				},
				// Quick test presets
				testBloom: () => {
					setPostProcessingEnabled(true);
					updateEffectState('bloom', {
						enabled: true,
						intensity: 2.0,
						threshold: 0.1,
						radius: 5.0
					});
					console.log('✨ Bloom test activated with VERY aggressive settings');
					console.log('   Threshold: 0.1 (muy bajo - debería bloom casi todo)');
					console.log('   Intensity: 2.0 (muy alto)');
					console.log('   Radius: 5.0 (muy difuso)');
					setTimeout(() => {
						const debug = (window as any).__postProcessingDebug;
						if (debug && debug.status) {
							debug.status();
						}
					}, 500);
				},
				testVignette: () => {
					setPostProcessingEnabled(true);
					updateEffectState('vignette', {
						enabled: true,
						intensity: 1.0,
						radius: 0.4,
						feather: 0.2
					});
					console.log('✨ Vignette test activated with VERY aggressive settings');
					console.log('   Intensity: 1.0 (máximo - bordes muy oscuros)');
					console.log('   Radius: 0.4 (bajo - efecto más cercano al centro)');
					console.log('   Feather: 0.2 (bajo - transición más abrupta)');
					setTimeout(() => {
						const debug = (window as any).__postProcessingDebug;
						if (debug && debug.status) {
							debug.status();
						}
					}, 500);
				},
				testChromaticAberration: () => {
					setPostProcessingEnabled(true);
					updateEffectState('chromatic-aberration', {
						enabled: true,
						intensity: 1.0,
						offset: 0.1
					});
					console.log('✨ Chromatic Aberration test activated with VERY aggressive settings');
					console.log('   Intensity: 1.0 (máximo - separación de color muy visible)');
					console.log('   Offset: 0.1 (muy alto - efecto muy pronunciado)');
					setTimeout(() => {
						const debug = (window as any).__postProcessingDebug;
						if (debug && debug.status) {
							debug.status();
						}
					}, 500);
				},
				testColorGrading: () => {
					setPostProcessingEnabled(true);
					updateEffectState('color-grading', {
						enabled: true,
						intensity: 1.0,
						temperature: 0.8,
						contrast: 0.8,
						saturation: 0.6,
						brightness: 0.3
					});
					console.log('✨ Color Grading test activated with VERY aggressive settings');
					console.log('   Temperature: 0.8 (muy cálido/naranja)');
					console.log('   Contrast: 0.8 (muy alto - colores muy contrastados)');
					console.log('   Saturation: 0.6 (muy saturado - colores vibrantes)');
					console.log('   Brightness: 0.3 (más brillante)');
					setTimeout(() => {
						const debug = (window as any).__postProcessingDebug;
						if (debug && debug.status) {
							debug.status();
						}
					}, 500);
				},
				testFilmGrain: () => {
					setPostProcessingEnabled(true);
					updateEffectState('film-grain', { enabled: true, intensity: 1.0 });
					console.log('✨ Film Grain test activated with VERY aggressive settings');
					console.log('   Intensity: 1.0 (máximo - grano muy visible)');
					setTimeout(() => {
						const debug = (window as any).__postProcessingDebug;
						if (debug && debug.status) {
							debug.status();
						}
					}, 500);
				},
				testGlitch: () => {
					setPostProcessingEnabled(true);
					updateEffectState('glitch', { enabled: true, intensity: 1.0 });
					console.log('✨ Glitch test activated with VERY aggressive settings');
					console.log('   Intensity: 1.0 (máximo - efecto glitch muy pronunciado)');
					setTimeout(() => {
						const debug = (window as any).__postProcessingDebug;
						if (debug && debug.status) {
							debug.status();
						}
					}, 500);
				},
				testAll: () => {
					setPostProcessingEnabled(true);
					updateEffectState('bloom', { enabled: true, intensity: 1.2, threshold: 0.3 });
					updateEffectState('vignette', { enabled: true, intensity: 0.6 });
					updateEffectState('color-grading', { enabled: true, temperature: 0.2, contrast: 0.15 });
					updateEffectState('film-grain', { enabled: true, intensity: 0.25 });
					console.log('🎬 Cinematic preset activated!');
				},
				// Help
				help: () => {
					console.log('🔧 Post-processing debug functions:');
					console.log('');
					console.log('Global controls:');
					console.log('  .enable()                    - Enable all post-processing');
					console.log(
						'  .disable()                   - Disable all post-processing (completely off)'
					);
					console.log('  .toggle()                    - Toggle global on/off');
					console.log('  .enableAll()                 - Enable all effects at once');
					console.log(
						'  .disableAll()                 - Disable all effects (but keep post-processing on)'
					);
					console.log('');
					console.log('Effect controls:');
					console.log('  .enableEffect("bloom")       - Enable specific effect');
					console.log('  .disableEffect("bloom")      - Disable specific effect');
					console.log('  .toggleEffect("bloom")       - Toggle specific effect');
					console.log('  .setIntensity("bloom", 0.8)  - Set effect intensity (0-1)');
					console.log('');
					console.log('Available effects:');
					console.log('  - "glitch"');
					console.log('  - "bloom"');
					console.log('  - "chromatic-aberration"');
					console.log('  - "vignette"');
					console.log('  - "color-grading"');
					console.log('  - "film-grain"');
					console.log('');
					console.log('Special controls:');
					console.log('  .setBloomThreshold(0.2)     - Set bloom threshold (lower = more bloom)');
					console.log('  .setBloomRadius(4.0)        - Set bloom blur radius');
					console.log('  .setTemperature(0.3)        - Set color temperature (-1 cool to 1 warm)');
					console.log('  .setContrast(0.2)            - Set contrast (-1 to 1)');
					console.log('  .setSaturation(0.1)         - Set saturation (-1 to 1)');
					console.log('  .setBrightness(0.05)        - Set brightness (-1 to 1)');
					console.log('');
					console.log('Quick presets (all with aggressive settings):');
					console.log('  .testBloom()                 - Test bloom with VERY aggressive settings');
					console.log(
						'  .testVignette()              - Test vignette with VERY aggressive settings'
					);
					console.log(
						'  .testChromaticAberration()   - Test chromatic aberration with VERY aggressive settings'
					);
					console.log(
						'  .testColorGrading()          - Test color grading with VERY aggressive settings'
					);
					console.log(
						'  .testFilmGrain()             - Test film grain with VERY aggressive settings'
					);
					console.log('  .testGlitch()                - Test glitch with VERY aggressive settings');
					console.log(
						'  .testAll()                   - Activate cinematic preset (moderate settings)'
					);
					console.log('');
					console.log('Info:');
					console.log('  .status()                    - Show current status');
					console.log('  .help()                      - Show this help');
					console.log('');
					console.log('📖 Full documentation: See docs/POST_PROCESSING_TESTING.md');
				}
			};
			console.log('🔧 Post-processing debug functions available!');
			console.log('  Type: window.__postProcessingDebug.help() for full documentation');
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
