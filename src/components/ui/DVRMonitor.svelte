<script lang="ts">
	/**
	 * DVR Monitor Component
	 * Displays webcam feed with lo-fi black and white DVR camera aesthetic
	 */
	import { onDestroy } from 'svelte';
	import { handTracking } from '$lib/stores/handTracking';

	let videoElement: HTMLVideoElement | null = $state(null);
	let canvasElement: HTMLCanvasElement | null = $state(null);
	let canvasContext: CanvasRenderingContext2D | null = null;
	let animationFrameId: number | null = null;
	let visible = $state(false);

	// Toggle with 'M' key
	function handleKeyPress(e: KeyboardEvent) {
		if (e.key === 'm' || e.key === 'M') {
			visible = !visible;
		}
	}

	$effect(() => {
		window.addEventListener('keypress', handleKeyPress);
		return () => window.removeEventListener('keypress', handleKeyPress);
	});

	function getVideoStream(): MediaStream | null {
		// Try to get video stream from any video element on the page
		// VisionSystem creates a video element that we can access
		const videos = document.querySelectorAll('video');
		for (const video of videos) {
			if (video.srcObject instanceof MediaStream) {
				return video.srcObject;
			}
		}
		return null;
	}

	// Watch for video stream availability and setup
	$effect(() => {
		if (visible) {
			const setupStream = () => {
				const stream = getVideoStream();
				if (stream && videoElement) {
					videoElement.srcObject = stream;
					videoElement.play().catch(console.error);

					videoElement.onloadedmetadata = () => {
						if (canvasElement && videoElement && !canvasContext) {
							canvasElement.width = videoElement.videoWidth;
							canvasElement.height = videoElement.videoHeight;
							canvasContext = canvasElement.getContext('2d', { willReadFrequently: true });
							if (canvasContext) {
								canvasContext.imageSmoothingEnabled = false; // Pixelated lo-fi look
								if (!animationFrameId) {
									processFrame();
								}
							}
						}
					};
				}
			};

			// Try immediately
			setupStream();

			// Retry after a delay if stream not found
			const timeout = setTimeout(setupStream, 500);
			return () => clearTimeout(timeout);
		} else {
			// Cleanup when hidden
			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
				animationFrameId = null;
			}
		}
	});

	function processFrame() {
		if (!videoElement || !canvasElement || !canvasContext) {
			return;
		}

		if (videoElement.readyState >= 2) {
			// Draw video frame to canvas
			canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

			// Get image data
			const imageData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
			const data = imageData.data;

			// Apply lo-fi DVR effect: grayscale + contrast + noise + scanlines
			for (let i = 0; i < data.length; i += 4) {
				// Convert to grayscale using luminance formula
				const r = data[i];
				const g = data[i + 1];
				const b = data[i + 2];
				const gray = 0.299 * r + 0.587 * g + 0.114 * b;

				// High contrast (DVR style)
				let contrast = (gray - 128) * 1.5 + 128;
				contrast = Math.max(0, Math.min(255, contrast));

				// Add slight noise (lo-fi effect)
				const noise = (Math.random() - 0.5) * 15;
				contrast = Math.max(0, Math.min(255, contrast + noise));

				// Quantize to fewer levels (lo-fi effect)
				const levels = 8;
				const quantized = Math.floor((contrast / 255) * levels) * (255 / levels);

				data[i] = quantized; // R
				data[i + 1] = quantized; // G
				data[i + 2] = quantized; // B
				// Alpha stays the same
			}

			// Put processed image data back
			canvasContext.putImageData(imageData, 0, 0);

			// Draw scanlines (every other line darker)
			canvasContext.fillStyle = 'rgba(0, 0, 0, 0.15)';
			for (let y = 0; y < canvasElement.height; y += 2) {
				canvasContext.fillRect(0, y, canvasElement.width, 1);
			}

			// Draw timestamp overlay
			const now = new Date();
			const timestamp = now.toLocaleTimeString('en-US', {
				hour12: false,
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit'
			});
			canvasContext.fillStyle = 'rgba(255, 255, 255, 0.8)';
			canvasContext.font = '12px monospace';
			canvasContext.fillText(timestamp, 10, canvasElement.height - 10);

			// Draw tracking status
			if ($handTracking.isTracking) {
				canvasContext.fillStyle = 'rgba(0, 255, 0, 0.8)';
				canvasContext.fillText('TRACKING', 10, 20);
			} else {
				canvasContext.fillStyle = 'rgba(255, 0, 0, 0.8)';
				canvasContext.fillText('NO SIGNAL', 10, 20);
			}
		}

		animationFrameId = requestAnimationFrame(processFrame);
	}

	// Process frame is already handled in $effect

	onDestroy(() => {
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
		}
		if (videoElement) {
			videoElement.srcObject = null;
		}
	});
</script>

{#if visible}
	<div class="dvr-monitor">
		<div class="monitor-frame">
			<div class="monitor-label">MONITOR 01</div>
			<canvas bind:this={canvasElement} class="monitor-canvas"></canvas>
			<video bind:this={videoElement} autoplay playsinline muted style="display: none;"></video>
			<div class="monitor-overlay">
				<div class="scanline"></div>
			</div>
		</div>
		<div class="monitor-info">
			<div class="info-item">
				<span class="label">STATUS:</span>
				<span class="value" class:tracking={$handTracking.isTracking}>
					{$handTracking.isTracking ? 'ACTIVE' : 'STANDBY'}
				</span>
			</div>
			<div class="info-item">
				<span class="label">CONF:</span>
				<span class="value">{($handTracking.confidence * 100).toFixed(0)}%</span>
			</div>
		</div>
	</div>
{/if}

<style>
	.dvr-monitor {
		position: fixed;
		top: 20px;
		left: 20px;
		z-index: 1500;
		font-family: 'Courier New', monospace;
	}

	.monitor-frame {
		position: relative;
		background: #1a1a1a;
		border: 3px solid #333;
		border-radius: 4px;
		padding: 8px;
		box-shadow:
			inset 0 0 20px rgba(0, 0, 0, 0.8),
			0 0 10px rgba(0, 0, 0, 0.5),
			0 0 0 2px #000;
	}

	.monitor-label {
		position: absolute;
		top: 12px;
		right: 12px;
		background: rgba(0, 0, 0, 0.7);
		color: #0f0;
		font-size: 10px;
		font-weight: bold;
		padding: 2px 6px;
		border: 1px solid #0f0;
		z-index: 10;
		text-shadow: 0 0 5px #0f0;
		letter-spacing: 1px;
	}

	.monitor-canvas {
		display: block;
		width: 320px;
		height: 240px;
		image-rendering: pixelated;
		image-rendering: crisp-edges;
		filter: contrast(1.2) brightness(0.9);
	}

	.monitor-overlay {
		position: absolute;
		top: 8px;
		left: 8px;
		right: 8px;
		bottom: 8px;
		pointer-events: none;
		overflow: hidden;
	}

	.scanline {
		position: absolute;
		width: 100%;
		height: 2px;
		background: rgba(0, 255, 0, 0.3);
		animation: scanline 3s linear infinite;
		box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
	}

	@keyframes scanline {
		0% {
			top: 0;
		}
		100% {
			top: 100%;
		}
	}

	.monitor-info {
		margin-top: 8px;
		background: rgba(0, 0, 0, 0.8);
		border: 1px solid #333;
		padding: 8px;
		font-size: 10px;
		color: #0f0;
		text-shadow: 0 0 5px #0f0;
	}

	.info-item {
		display: flex;
		justify-content: space-between;
		margin-bottom: 4px;
	}

	.info-item:last-child {
		margin-bottom: 0;
	}

	.info-item .label {
		color: #0f0;
		font-weight: bold;
	}

	.info-item .value {
		color: #fff;
		font-weight: bold;
	}

	.info-item .value.tracking {
		color: #0f0;
		text-shadow: 0 0 5px #0f0;
	}
</style>
