<script lang="ts">
	/**
	 * Vision System Component
	 * Integrates MediaPipe hand tracking with the particle system
	 * Phase 3.1-3.3: Complete vision integration
	 */
	import { onMount, onDestroy } from 'svelte';
	import { VisionManager } from '$lib/vision/VisionManager';
	import { TensionCalculator } from '$lib/vision/TensionCalculator';
	import { tension } from '$lib/stores/tension';
	import { updateHandTracking, resetHandTracking } from '$lib/stores/handTracking';
	import { calibration } from '$lib/stores/calibration';
	import { videoStream } from '$lib/stores/videoStream';
	import { cameraEnabled } from '$lib/stores/settings';

	let visionManager: VisionManager | null = $state(null);
	let tensionCalculator: TensionCalculator;
	let isInitialized = $state(false);
	let error: string | null = $state(null);
	let showDebugVideo = $state(false);
	let calibrationUnsubscribe: (() => void) | null = null;

	// Initialize vision system
	async function initializeVision() {
		if (!visionManager) {
			visionManager = new VisionManager();
		}

		try {
			await visionManager.initialize(undefined, {
				onInitialized: () => {
					isInitialized = true;
					error = null;
					console.log('[VisionSystem] MediaPipe initialized');
				},
				onLandmarks: (hands) => {
					// Update hand tracking store
					updateHandTracking(hands);

					// Calculate tension
					const calculatedTension = tensionCalculator.calculate(hands);
					tension.set(calculatedTension);
				},
				onError: (err) => {
					error = err;
					console.error('[VisionSystem]', err);
				}
			});

			// Expose video stream for other components
			const stream = visionManager.getVideoStream();
			if (stream) {
				videoStream.set(stream);
			}

			// Start processing
			visionManager.start();
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
			console.error('[VisionSystem] Initialization failed:', err);
		}
	}

	// Stop vision system
	function stopVision() {
		if (visionManager) {
			visionManager.stop();
			visionManager.dispose();
			visionManager = null;
			videoStream.set(null);
		}
		resetHandTracking();
		tension.set(0.0);
		isInitialized = false;
		error = null;
	}

	onMount(async () => {
		// Initialize tension calculator with calibration settings
		tensionCalculator = new TensionCalculator($calibration);

		// Update calculator when calibration changes
		calibrationUnsubscribe = calibration.subscribe((cal) => {
			if (tensionCalculator) {
				tensionCalculator.updateCalibration(cal);
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
			if (!visionManager || !isInitialized) {
				initializeVision();
			}
		} else {
			// Camera disabled - stop and cleanup completely
			if (visionManager) {
				stopVision();
			}
		}
	});

	onDestroy(() => {
		if (visionManager) {
			visionManager.dispose();
		}
		resetHandTracking();
		if (calibrationUnsubscribe) {
			calibrationUnsubscribe();
		}
	});

	// Toggle debug video with 'V' key
	function handleKeyPress(e: KeyboardEvent) {
		if (e.key === 'v' || e.key === 'V') {
			showDebugVideo = !showDebugVideo;
		}
	}

	onMount(() => {
		window.addEventListener('keypress', handleKeyPress);
		return () => window.removeEventListener('keypress', handleKeyPress);
	});
</script>

<!-- Debug Video Overlay (optional) -->
{#if showDebugVideo && visionManager}
	{@const videoElement = visionManager.getVideoElement()}
	{@const stream = videoElement?.srcObject}
	{#if videoElement && stream && stream instanceof MediaStream}
		<div class="debug-video">
			<video
				srcObject={stream}
				autoplay
				playsinline
				muted
				style="width: 320px; height: 240px; border: 2px solid #00ff00;"
			></video>
		</div>
	{/if}
{/if}

<!-- Error Display -->
{#if error}
	<div class="error-overlay">
		<div class="error-message">
			⚠️ Vision System Error: {error}
		</div>
	</div>
{/if}

<!-- Status Indicator -->
<div class="status-indicator" class:initialized={isInitialized} class:disabled={!$cameraEnabled}>
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
