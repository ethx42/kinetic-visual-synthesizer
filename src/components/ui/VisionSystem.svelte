<script lang="ts">
	/**
	 * Vision System Component
	 * Integrates MediaPipe hand tracking with the particle system
	 * Clean Architecture: Uses VisionFacade for simplified API
	 *
	 * MediaPipe now runs 100% in Web Worker for optimal performance
	 */
	import { onMount, onDestroy } from 'svelte';
	import { VisionFacade } from '$lib/vision/presentation/VisionFacade';
	import { Hand } from '$lib/vision/domain/entities/Hand';
	import { tension } from '$lib/stores/tension';
	import { updateHandTracking, resetHandTracking } from '$lib/stores/handTracking';
	import { calibration } from '$lib/stores/calibration';
	import { videoStream } from '$lib/stores/videoStream';
	import { cameraEnabled } from '$lib/stores/settings';
	import type { HandLandmarks } from '$lib/vision/types';

	let visionFacade: VisionFacade | null = $state(null);
	let isInitialized = $state(false);
	let error: string | null = $state(null);
	let showDebugVideo = $state(false);
	let currentStream: MediaStream | null = $state(null);
	let calibrationUnsubscribe: (() => void) | null = null;

	/**
	 * Convert domain Hand entities to legacy HandLandmarks format
	 * for backward compatibility with existing stores
	 */
	function convertToLegacyFormat(hands: Hand[]): HandLandmarks[] {
		return hands.map((hand) => ({
			landmarks: hand.landmarks.map((lm) => ({
				x: lm.x,
				y: lm.y,
				z: lm.z
			})),
			confidence: hand.confidence
		}));
	}

	// Initialize vision system
	async function initializeVision() {
		if (visionFacade) {
			return;
		}

		try {
			// Create facade with calibration settings
			visionFacade = new VisionFacade({
				smoothstepMin: $calibration.smoothstepMin,
				smoothstepMax: $calibration.smoothstepMax,
				smoothingAlpha: $calibration.smoothingAlpha,
				targetFps: 30
			});

			await visionFacade.initialize();

			// Start processing with callbacks
			visionFacade.start({
				onInitialized: () => {
					isInitialized = true;
					error = null;
					console.log('[VisionSystem] MediaPipe Worker initialized');
				},
				onFrame: (frame) => {
					// Convert domain entities to legacy format for stores
					const legacyHands = convertToLegacyFormat([...frame.hands]);
					updateHandTracking(legacyHands);
				},
				onTension: (calculatedTension) => {
					tension.set(calculatedTension);
				},
				onError: (err) => {
					error = err;
					console.error('[VisionSystem]', err);
				},
				onStreamReady: (stream) => {
					currentStream = stream;
					videoStream.set(stream);
				}
			});
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
			console.error('[VisionSystem] Initialization failed:', err);
		}
	}

	// Stop vision system
	function stopVision() {
		if (visionFacade) {
			visionFacade.dispose();
			visionFacade = null;
			currentStream = null;
			videoStream.set(null);
		}
		resetHandTracking();
		tension.set(0.0);
		isInitialized = false;
		error = null;
	}

	onMount(async () => {
		// Update facade when calibration changes
		calibrationUnsubscribe = calibration.subscribe((cal) => {
			if (visionFacade) {
				visionFacade.updateConfig({
					smoothstepMin: cal.smoothstepMin,
					smoothstepMax: cal.smoothstepMax,
					smoothingAlpha: cal.smoothingAlpha
				});
			}
		});

		// Initialize if camera is enabled
		if ($cameraEnabled) {
			await initializeVision();
		}
	});

	// React to camera enabled/disabled changes
	$effect(() => {
		if ($cameraEnabled) {
			// Camera enabled - initialize if not already initialized
			if (!visionFacade || !isInitialized) {
				initializeVision();
			}
		} else {
			// Camera disabled - stop and cleanup completely
			if (visionFacade) {
				stopVision();
			}
		}
	});

	onDestroy(() => {
		if (visionFacade) {
			visionFacade.dispose();
		}
		resetHandTracking();
		if (calibrationUnsubscribe) {
			calibrationUnsubscribe();
		}
	});

	// Toggle debug video with 'V' key
	function handleKeyPress(e: KeyboardEvent) {
		// Only allow debug video if camera is enabled
		if ($cameraEnabled && (e.key === 'v' || e.key === 'V')) {
			showDebugVideo = !showDebugVideo;
		}
	}

	onMount(() => {
		window.addEventListener('keypress', handleKeyPress);
		return () => window.removeEventListener('keypress', handleKeyPress);
	});
</script>

<!-- Debug Video Overlay (optional) -->
{#if showDebugVideo && currentStream}
	<div class="debug-video">
		<video
			srcObject={currentStream}
			autoplay
			playsinline
			muted
			style="width: 320px; height: 240px; border: 2px solid #00ff00;"
		></video>
	</div>
{/if}

<!-- Error Display -->
{#if error && $cameraEnabled}
	<div class="error-overlay">
		<div class="error-message">
			⚠️ Vision System Error: {error}
		</div>
	</div>
{/if}

<!-- Status Indicator -->
<div
	class="status-indicator"
	class:initialized={isInitialized}
	class:disabled={!$cameraEnabled}
	style:display={$cameraEnabled ? 'flex' : 'none'}
>
	<span class="status-dot"></span> Vision {$cameraEnabled ? '' : '(Disabled)'}
</div>

<style>
	.debug-video {
		position: fixed;
		top: 20px;
		right: 20px;
		z-index: 1000;
		background: rgba(0, 0, 0, 0.8);
		padding: 10px;
		border-radius: 4px;
	}

	.error-overlay {
		position: fixed;
		top: 20px;
		left: 20px;
		z-index: 1001;
		background: rgba(255, 0, 0, 0.9);
		color: white;
		padding: 10px 15px;
		border-radius: 4px;
		font-family: monospace;
		font-size: 12px;
	}

	.status-indicator {
		position: fixed;
		bottom: 20px;
		right: 20px;
		z-index: 1000;
		font-family: monospace;
		font-size: 12px;
		color: rgba(255, 255, 255, 0.9);
		background: rgba(0, 0, 0, 0.7);
		padding: 5px 10px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.status-indicator .status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #ff6b6b;
		transition: background 0.2s;
	}

	.status-indicator.initialized .status-dot {
		background: #51cf66;
	}

	.status-indicator.disabled {
		opacity: 0.5;
	}

	.status-indicator.disabled .status-dot {
		background: #666;
	}
</style>
