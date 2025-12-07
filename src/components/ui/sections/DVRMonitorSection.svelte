<script lang="ts">
	/**
	 * DVRMonitorSection Component
	 * DVR monitor display with lo-fi video processing
	 */
	import { onDestroy } from 'svelte';
	import { useDVRMonitor } from '$lib/ui/composables/useDVRMonitor';
	import { videoStream } from '$lib/stores/videoStream';
	import { handTracking } from '$lib/stores/handTracking';

	let videoElement: HTMLVideoElement | null = $state(null);
	let canvasElement: HTMLCanvasElement | null = $state(null);
	let canvasContext: CanvasRenderingContext2D | null = null;
	let animationFrameId: number | null = null;

	const { processDVRFrame } = useDVRMonitor();

	// Setup DVR monitor when stream is available
	$effect(() => {
		if ($videoStream && videoElement && canvasElement) {
			videoElement.srcObject = $videoStream;
			videoElement.play().catch(console.error);

			const handleLoadedMetadata = () => {
				if (
					canvasElement &&
					videoElement &&
					videoElement &&
					videoElement.videoWidth > 0 &&
					videoElement.videoHeight > 0
				) {
					canvasElement.width = videoElement.videoWidth;
					canvasElement.height = videoElement.videoHeight;
					const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
					const maxWidth = 280;
					const displayWidth = maxWidth;
					const displayHeight = maxWidth / aspectRatio;
					canvasElement.style.width = `${displayWidth}px`;
					canvasElement.style.height = `${displayHeight}px`;

					canvasContext = canvasElement.getContext('2d', { willReadFrequently: true });
					if (canvasContext) {
						canvasContext.imageSmoothingEnabled = false;
						if (!animationFrameId) {
							const frameLoop = () => {
								if (videoElement && canvasElement && canvasContext) {
									// Access reactive store value inside the loop
									processDVRFrame(
										videoElement,
										canvasElement,
										canvasContext,
										$handTracking.isTracking
									);
									animationFrameId = requestAnimationFrame(frameLoop);
								}
							};
							animationFrameId = requestAnimationFrame(frameLoop);
						}
					}
				}
			};

			if (videoElement.readyState >= 2 && videoElement.videoWidth > 0) {
				handleLoadedMetadata();
			} else {
				videoElement.onloadedmetadata = handleLoadedMetadata;
				videoElement.onplaying = handleLoadedMetadata;
			}
		} else if (!$videoStream && animationFrameId) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
			canvasContext = null;
		}
	});

	onDestroy(() => {
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
		}
		if (videoElement) {
			videoElement.srcObject = null;
		}
	});
</script>

<div class="dvr-container">
	<div class="dvr-monitor-frame">
		<div class="monitor-label">01</div>
		<canvas bind:this={canvasElement} class="dvr-canvas"></canvas>
		<video bind:this={videoElement} autoplay playsinline muted style="display: none;"></video>
		<div class="monitor-overlay">
			<div class="scanline"></div>
		</div>
	</div>
</div>

<style>
	.dvr-container {
		width: 100%;
		display: flex;
		justify-content: center;
	}

	.dvr-monitor-frame {
		position: relative;
		background: #1a1a1a;
		border: 2px solid #333;
		border-radius: 2px;
		padding: 4px;
		box-shadow:
			inset 0 0 10px rgba(0, 0, 0, 0.8),
			0 0 5px rgba(0, 0, 0, 0.5);
		display: inline-flex;
		justify-content: center;
		align-items: center;
		overflow: hidden;
		width: 100%;
		max-width: 280px;
	}

	.monitor-label {
		position: absolute;
		top: 6px;
		right: 6px;
		background: rgba(0, 0, 0, 0.7);
		color: #0f0;
		font-size: 8px;
		font-weight: bold;
		padding: 1px 4px;
		border: 1px solid #0f0;
		z-index: 10;
		text-shadow: 0 0 3px #0f0;
		letter-spacing: 0.5px;
		font-family: 'Courier New', monospace;
	}

	.dvr-canvas {
		display: block;
		width: 100%;
		height: auto;
		image-rendering: pixelated;
		image-rendering: crisp-edges;
		filter: contrast(1.2) brightness(0.9);
		object-fit: contain;
	}

	.monitor-overlay {
		position: absolute;
		top: 4px;
		left: 4px;
		right: 4px;
		bottom: 4px;
		pointer-events: none;
		overflow: hidden;
	}

	.scanline {
		position: absolute;
		width: 100%;
		height: 1px;
		background: rgba(0, 255, 0, 0.3);
		animation: scanline 3s linear infinite;
		box-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
	}

	@keyframes scanline {
		0% {
			top: 0;
		}
		100% {
			top: 100%;
		}
	}
</style>
