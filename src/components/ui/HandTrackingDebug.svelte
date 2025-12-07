<script lang="ts">
	/**
	 * Hand Tracking Debug Panel
	 * Collapsible tab that extends from screen edge (like a folder tab)
	 * Draggable tab that snaps to any of the 4 edges
	 */
	import { onDestroy } from 'svelte';
	import { persistent } from '$lib/stores/persistent';
	import { handTracking } from '$lib/stores/handTracking';
	import { tension } from '$lib/stores/tension';
	import { cameraEnabled } from '$lib/stores/settings';
	import { videoStream } from '$lib/stores/videoStream';

	type Edge = 'left' | 'right' | 'top' | 'bottom';

	// Persistent position and edge
	const trackPanelPosition = persistent<{ x: number; y: number; edge: Edge }>(
		'kvs_trackPanelPosition',
		{ x: 0, y: 200, edge: 'left' }
	);

	let visible = $state(false);
	let videoElement: HTMLVideoElement | null = $state(null);
	let canvasElement: HTMLCanvasElement | null = $state(null);
	let canvasContext: CanvasRenderingContext2D | null = null;
	let animationFrameId: number | null = null;

	// Drag state
	let isDragging = $state(false);
	let currentEdge: Edge = $state('left');

	// Toggle with 'H' key
	function handleKeyPress(e: KeyboardEvent) {
		if (e.key === 'h' || e.key === 'H') {
			visible = !visible;
		}
	}

	$effect(() => {
		window.addEventListener('keypress', handleKeyPress);
		return () => window.removeEventListener('keypress', handleKeyPress);
	});

	// Calculate which edge the tab is closest to and snap to it
	function snapToEdge(x: number, y: number): { x: number; y: number; edge: Edge } {
		const windowWidth = window.innerWidth;
		const windowHeight = window.innerHeight;
		const tabWidth = 60;
		const tabHeight = 40;

		const distToLeft = x;
		const distToRight = windowWidth - x;
		const distToTop = y;
		const distToBottom = windowHeight - y;

		const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

		if (minDist === distToLeft) {
			return { x: 0, y: Math.max(0, Math.min(windowHeight - tabHeight, y)), edge: 'left' };
		}
		if (minDist === distToRight) {
			return {
				x: windowWidth - tabWidth,
				y: Math.max(0, Math.min(windowHeight - tabHeight, y)),
				edge: 'right'
			};
		}
		if (minDist === distToTop) {
			return { x: Math.max(0, Math.min(windowWidth - tabWidth, x)), y: 0, edge: 'top' };
		}
		return {
			x: Math.max(0, Math.min(windowWidth - tabWidth, x)),
			y: windowHeight - tabHeight,
			edge: 'bottom'
		};
	}

	// Current drag position (follows cursor)
	let dragX = $state(0);
	let dragY = $state(0);

	// Drag handlers
	function handleMouseDown(e: MouseEvent) {
		isDragging = true;
		dragX = e.clientX;
		dragY = e.clientY;

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
		e.preventDefault();
		e.stopPropagation();
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging) return;

		// Follow cursor
		dragX = e.clientX;
		dragY = e.clientY;

		// Calculate which edge we're closest to (for visual feedback)
		const snapped = snapToEdge(e.clientX, e.clientY);
		currentEdge = snapped.edge;
	}

	function handleMouseUp(e: MouseEvent) {
		if (!isDragging) return;

		// Snap to nearest edge
		const snapped = snapToEdge(e.clientX, e.clientY);
		trackPanelPosition.set(snapped);

		isDragging = false;
		dragX = 0;
		dragY = 0;
		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', handleMouseUp);
	}

	// Get tab position - follows cursor when dragging, otherwise uses stored position
	function getTabStyle(): string {
		const tabWidth = 60;
		const tabHeight = 40;

		// When dragging, follow cursor and use current edge detection
		if (isDragging) {
			const edge = currentEdge;
			switch (edge) {
				case 'left':
					return `left: 0; top: ${dragY - tabHeight / 2}px; width: ${tabWidth}px; height: ${tabHeight}px;`;
				case 'right':
					return `right: 0; top: ${dragY - tabHeight / 2}px; width: ${tabWidth}px; height: ${tabHeight}px;`;
				case 'top':
					return `top: 0; left: ${dragX - tabHeight / 2}px; width: ${tabHeight}px; height: ${tabWidth}px;`;
				case 'bottom':
					return `bottom: 0; left: ${dragX - tabHeight / 2}px; width: ${tabHeight}px; height: ${tabWidth}px;`;
			}
		}

		// When not dragging, use stored position
		const { edge, y, x } = $trackPanelPosition;
		switch (edge) {
			case 'left':
				return `left: 0; top: ${y}px; width: ${tabWidth}px; height: ${tabHeight}px;`;
			case 'right':
				return `right: 0; top: ${y}px; width: ${tabWidth}px; height: ${tabHeight}px;`;
			case 'top':
				return `top: 0; left: ${x}px; width: ${tabHeight}px; height: ${tabWidth}px;`;
			case 'bottom':
				return `bottom: 0; left: ${x}px; width: ${tabHeight}px; height: ${tabWidth}px;`;
		}
	}

	// Get panel position based on edge - panel slides from edge
	function getPanelStyle(): string {
		const { edge, y, x } = $trackPanelPosition;
		const panelWidth = 200;
		const tabHeight = 40;

		switch (edge) {
			case 'left':
				return `left: ${tabHeight}px; top: ${y}px; width: ${panelWidth}px; max-height: calc(100vh - ${y}px);`;
			case 'right':
				return `right: ${tabHeight}px; top: ${y}px; width: ${panelWidth}px; max-height: calc(100vh - ${y}px);`;
			case 'top':
				return `top: ${tabHeight}px; left: ${x}px; width: ${panelWidth}px; max-height: calc(100vh - ${x}px);`;
			case 'bottom':
				return `bottom: ${tabHeight}px; left: ${x}px; width: ${panelWidth}px; max-height: calc(100vh - ${window.innerHeight - y}px);`;
		}
	}

	// DVR Monitor processing
	function processDVRFrame() {
		if (!videoElement || !canvasElement || !canvasContext) {
			return;
		}

		if (videoElement.readyState >= 2) {
			// Draw video frame to canvas
			canvasContext.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

			// Get image data
			const imageData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height);
			const data = imageData.data;

			// Apply lo-fi DVR effect: grayscale + contrast + noise + quantization
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

		animationFrameId = requestAnimationFrame(processDVRFrame);
	}

	// Setup DVR monitor when stream is available
	$effect(() => {
		if (visible && $videoStream) {
			// Wait for video element to be bound
			const setupMonitor = () => {
				if (videoElement && canvasElement) {
					videoElement.srcObject = $videoStream;
					videoElement.play().catch(console.error);

					const handleLoadedMetadata = () => {
						if (
							canvasElement &&
							videoElement &&
							videoElement.videoWidth > 0 &&
							videoElement.videoHeight > 0
						) {
							// Set canvas internal resolution to actual video dimensions
							canvasElement.width = videoElement.videoWidth;
							canvasElement.height = videoElement.videoHeight;

							// Calculate display size maintaining aspect ratio
							const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
							const maxWidth = 180;
							const displayWidth = maxWidth;
							const displayHeight = maxWidth / aspectRatio;

							// Set display size via CSS
							canvasElement.style.width = `${displayWidth}px`;
							canvasElement.style.height = `${displayHeight}px`;

							canvasContext = canvasElement.getContext('2d', { willReadFrequently: true });
							if (canvasContext) {
								canvasContext.imageSmoothingEnabled = false;
								if (!animationFrameId) {
									processDVRFrame();
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
				}
			};

			setupMonitor();
			const timeout = setTimeout(setupMonitor, 100);
			const timeout2 = setTimeout(setupMonitor, 500);
			return () => {
				clearTimeout(timeout);
				clearTimeout(timeout2);
			};
		} else if (!visible && animationFrameId) {
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
		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', handleMouseUp);
	});
</script>

<!-- Tab that extends from edge (like folder tab) -->
<button
	class="track-tab"
	class:dragging={isDragging}
	class:edge-left={(isDragging ? currentEdge : $trackPanelPosition.edge) === 'left'}
	class:edge-right={(isDragging ? currentEdge : $trackPanelPosition.edge) === 'right'}
	class:edge-top={(isDragging ? currentEdge : $trackPanelPosition.edge) === 'top'}
	class:edge-bottom={(isDragging ? currentEdge : $trackPanelPosition.edge) === 'bottom'}
	style={getTabStyle()}
	onmousedown={handleMouseDown}
	onclick={() => {
		if (!isDragging) {
			visible = !visible;
		}
	}}
	title="Hand Tracking Debug (Press H to toggle)"
>
	<!-- Tab shape: flat edge with smooth curved sides (like folder tab) -->
	<!-- The shape adapts based on which edge it's attached to -->
	<svg class="tab-shape" viewBox="0 0 60 40" preserveAspectRatio="none">
		<!-- Tab shape for TOP edge: flat top edge (attached to screen), curved sides slope down -->
		<!-- Shape matches the image: flat top, smooth rounded curves on left/right creating shoulders -->
		<!-- The curves create rounded "shoulders" that slope down smoothly -->
		<path
			class="tab-path-top"
			d="M 0 0 L 60 0 L 60 40 L 56 40 L 56 36 C 56 33, 53 31, 50 31 C 47 31, 44 33, 44 36 L 44 40 L 16 40 L 16 36 C 16 33, 13 31, 10 31 C 7 31, 4 33, 4 36 L 4 40 L 0 40 Z"
			fill="currentColor"
		/>
		<!-- Tab shape for BOTTOM edge: flat bottom edge (attached to screen), curved sides slope up -->
		<!-- Shape: flat bottom, smooth rounded curves on left/right creating shoulders that slope up -->
		<path
			class="tab-path-bottom"
			d="M 0 0 L 4 0 L 4 4 C 4 7, 7 9, 10 9 C 13 9, 16 7, 16 4 L 16 0 L 44 0 L 44 4 C 44 7, 47 9, 50 9 C 53 9, 56 7, 56 4 L 56 0 L 60 0 L 60 40 L 0 40 Z"
			fill="currentColor"
		/>
		<!-- Tab shape for LEFT edge: flat left edge (attached to screen), curved top/bottom slope right -->
		<path
			class="tab-path-left"
			d="M 0 0 L 40 0 L 40 5 L 35 5 C 32 5, 30 8, 30 10 C 30 12, 32 15, 35 15 L 40 15 L 40 25 L 35 25 C 32 25, 30 28, 30 30 C 30 32, 32 35, 35 35 L 40 35 L 40 40 L 0 40 Z"
			fill="currentColor"
		/>
		<!-- Tab shape for RIGHT edge: flat right edge (attached to screen), curved top/bottom slope left -->
		<path
			class="tab-path-right"
			d="M 0 0 L 40 0 L 40 5 L 35 5 C 32 5, 30 8, 30 10 C 30 12, 32 15, 35 15 L 40 15 L 40 25 L 35 25 C 32 25, 30 28, 30 30 C 30 32, 32 35, 35 35 L 40 35 L 40 40 L 0 40 Z"
			fill="currentColor"
		/>
	</svg>
	<span class="tab-content">
		<span class="tab-icon">{visible ? '◀' : '▶'}</span>
		<span class="tab-label">TRACK</span>
	</span>
</button>

<!-- Panel that slides from edge -->
<div
	class="track-panel"
	class:edge-left={$trackPanelPosition.edge === 'left'}
	class:edge-right={$trackPanelPosition.edge === 'right'}
	class:edge-top={$trackPanelPosition.edge === 'top'}
	class:edge-bottom={$trackPanelPosition.edge === 'bottom'}
	class:visible
	style={getPanelStyle()}
>
	<div class="panel-header">
		<span class="panel-title">TRACK</span>
		<button class="close-btn" onclick={() => (visible = false)}>×</button>
	</div>

	<div class="panel-content">
		<!-- Camera Control -->
		<div class="control-row">
			<label class="toggle-label">
				<input
					type="checkbox"
					checked={$cameraEnabled}
					onchange={(e) => cameraEnabled.set(e.currentTarget.checked)}
				/>
				<span>CAM</span>
			</label>
		</div>

		<!-- DVR Monitor (Compact) -->
		{#if $videoStream && $cameraEnabled}
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
		{/if}

		<!-- Status (Minimal) -->
		<div class="status-row">
			<div class="status-indicator" class:active={$handTracking.isTracking}></div>
			<span class="status-text">
				{$handTracking.isTracking ? 'ACTIVE' : 'INACTIVE'}
			</span>
		</div>

		<!-- Tension (Essential) -->
		<div class="tension-display">
			<div class="tension-label">TENSION</div>
			<div class="tension-value">{$tension.toFixed(2)}</div>
			<div class="tension-bar">
				<div class="tension-fill" style="width: {($tension * 100).toFixed(0)}%"></div>
			</div>
		</div>

		<!-- Confidence (Minimal) -->
		<div class="metric-row">
			<span class="metric-label">CONF</span>
			<span class="metric-value">{($handTracking.confidence * 100).toFixed(0)}%</span>
		</div>
	</div>
</div>

<style>
	.track-tab {
		position: fixed;
		z-index: 1001;
		cursor: move;
		border: none;
		padding: 0;
		background: transparent;
		overflow: visible;
		transition: all 0.2s ease;
	}

	.track-tab.dragging {
		z-index: 1002;
		transition: none; /* No transition while dragging for smooth cursor following */
	}

	.tab-shape {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 0;
	}

	.tab-shape path {
		/* Liquid Glass Effect - Note: backdrop-filter doesn't work on SVG paths directly */
		/* We'll use a mask/background approach instead */
		fill: rgba(255, 255, 255, 0.06);
		stroke: rgba(255, 255, 255, 0.15);
		stroke-width: 1;
		filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2));
		transition: all 0.2s ease;
	}

	.tab-path-top,
	.tab-path-bottom,
	.tab-path-left,
	.tab-path-right {
		display: block;
	}

	.track-tab {
		/* Apply backdrop-filter to the button container */
		backdrop-filter: blur(30px) saturate(180%);
		-webkit-backdrop-filter: blur(30px) saturate(180%);
	}

	.track-tab:hover .tab-shape path {
		fill: rgba(255, 255, 255, 0.09);
		stroke: rgba(255, 255, 255, 0.2);
		filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.25));
	}

	.track-tab.dragging .tab-shape path {
		fill: rgba(255, 255, 255, 0.12);
		stroke: rgba(255, 255, 255, 0.25);
		filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.3));
	}

	.tab-content {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		width: 100%;
		height: 100%;
		font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
		font-weight: 600;
		letter-spacing: 1px;
		color: rgba(255, 255, 255, 0.85);
		pointer-events: none;
	}

	/* Show/hide appropriate tab path based on edge orientation */
	.track-tab.edge-left .tab-path-top,
	.track-tab.edge-left .tab-path-bottom,
	.track-tab.edge-left .tab-path-right {
		display: none;
	}

	.track-tab.edge-right .tab-path-top,
	.track-tab.edge-right .tab-path-bottom,
	.track-tab.edge-right .tab-path-left {
		display: none;
	}

	.track-tab.edge-top .tab-path-bottom,
	.track-tab.edge-top .tab-path-left,
	.track-tab.edge-top .tab-path-right {
		display: none;
	}

	.track-tab.edge-bottom .tab-path-top,
	.track-tab.edge-bottom .tab-path-left,
	.track-tab.edge-bottom .tab-path-right {
		display: none;
	}

	/* Rotate tab shape based on edge */
	.track-tab.edge-left .tab-shape {
		transform: rotate(0deg);
	}

	.track-tab.edge-right .tab-shape {
		transform: rotate(180deg);
	}

	.track-tab.edge-top .tab-shape {
		transform: rotate(0deg);
	}

	.track-tab.edge-bottom .tab-shape {
		transform: rotate(0deg);
	}

	.track-tab:hover {
		transform: scale(1.05);
	}

	.track-tab.dragging {
		cursor: grabbing;
		opacity: 0.9;
	}

	.tab-icon {
		display: block;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		font-size: 12px;
		opacity: 0.8;
		line-height: 1;
	}

	.track-tab.edge-left .tab-icon {
		transform: rotate(0deg);
	}

	.track-tab.edge-right .tab-icon {
		transform: rotate(180deg);
	}

	.track-tab.edge-top .tab-icon {
		transform: rotate(-90deg);
	}

	.track-tab.edge-bottom .tab-icon {
		transform: rotate(90deg);
	}

	.track-tab:hover .tab-icon {
		opacity: 1;
	}

	.tab-label {
		font-size: 9px;
		opacity: 0.9;
		line-height: 1;
	}

	.track-panel {
		position: fixed;
		z-index: 1000;
		overflow-y: auto;
		/* Liquid Glass Effect - Same as control panel */
		background: rgba(255, 255, 255, 0.06);
		backdrop-filter: blur(30px) saturate(180%);
		-webkit-backdrop-filter: blur(30px) saturate(180%);
		border: 1px solid rgba(255, 255, 255, 0.15);
		font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
		color: rgba(255, 255, 255, 0.95);
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
		padding: 12px;
		transition:
			transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
			opacity 0.3s ease;
	}

	.track-panel.edge-left:not(.visible) {
		transform: translateX(-100%);
	}

	.track-panel.edge-left.visible {
		transform: translateX(0);
	}

	.track-panel.edge-right:not(.visible) {
		transform: translateX(100%);
	}

	.track-panel.edge-right.visible {
		transform: translateX(0);
	}

	.track-panel.edge-top:not(.visible) {
		transform: translateY(-100%);
	}

	.track-panel.edge-top.visible {
		transform: translateY(0);
	}

	.track-panel.edge-bottom:not(.visible) {
		transform: translateY(100%);
	}

	.track-panel.edge-bottom.visible {
		transform: translateY(0);
	}

	.track-panel:not(.visible) {
		opacity: 0;
		pointer-events: none;
	}

	.track-panel.edge-left {
		border-left: none;
		border-radius: 0 16px 16px 0;
	}

	.track-panel.edge-right {
		border-right: none;
		border-radius: 16px 0 0 16px;
	}

	.track-panel.edge-top {
		border-top: none;
		border-radius: 0 0 16px 16px;
	}

	.track-panel.edge-bottom {
		border-bottom: none;
		border-radius: 16px 16px 0 0;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 8px;
		margin-bottom: 8px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.panel-title {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 2px;
		color: rgba(147, 197, 253, 0.9);
	}

	.close-btn {
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.5);
		font-size: 18px;
		line-height: 1;
		cursor: pointer;
		padding: 0;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}

	.close-btn:hover {
		color: rgba(255, 255, 255, 1);
	}

	.panel-content {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.control-row {
		display: flex;
		align-items: center;
	}

	.toggle-label {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		font-size: 10px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.8);
		letter-spacing: 1px;
	}

	.toggle-label input[type='checkbox'] {
		width: 14px;
		height: 14px;
		cursor: pointer;
		accent-color: rgba(147, 197, 253, 0.9);
	}

	.status-row {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 10px;
	}

	.status-indicator {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: rgba(255, 0, 0, 0.5);
		transition: background 0.2s;
	}

	.status-indicator.active {
		background: #51cf66;
		box-shadow: 0 0 8px rgba(81, 207, 102, 0.6);
	}

	.status-text {
		font-weight: 600;
		letter-spacing: 1px;
		color: rgba(255, 255, 255, 0.8);
	}

	.tension-display {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.tension-label {
		font-size: 9px;
		letter-spacing: 1px;
		color: rgba(255, 255, 255, 0.6);
	}

	.tension-value {
		font-size: 18px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: rgba(147, 197, 253, 0.9);
		line-height: 1;
	}

	.metric-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 10px;
	}

	.metric-label {
		color: rgba(255, 255, 255, 0.6);
		letter-spacing: 1px;
	}

	.metric-value {
		color: rgba(255, 255, 255, 0.9);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.tension-bar {
		width: 100%;
		height: 4px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
		overflow: hidden;
	}

	.tension-fill {
		height: 100%;
		background: linear-gradient(90deg, #51cf66, #ffd43b, #ff6b6b);
		transition: width 0.1s ease-out;
	}

	/* DVR Monitor Styles (Compact) */
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
		max-width: 180px;
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
