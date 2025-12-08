<script lang="ts">
	import { onMount } from 'svelte';
	import ObsidianSlider from '$lib/ui/primitives/ObsidianSlider.svelte';
	import { cn } from '$lib/utils';

	interface Props {
		xValue?: number;
		yValue?: number;
		xMin?: number;
		xMax?: number;
		yMin?: number;
		yMax?: number;
		xLabel?: string;
		yLabel?: string;
		className?: string;
	}

	let {
		xValue = $bindable(0.8),
		yValue = $bindable(8.0),
		xMin = 0.1,
		xMax = 2.0,
		yMin = 1.0,
		yMax = 20.0,
		xLabel = 'Noise Scale',
		yLabel = 'Noise Strength',
		className = undefined
	}: Props = $props();

	let canvas: HTMLCanvasElement | null = $state(null);
	let container: HTMLDivElement | null = $state(null);
	let isDragging = $state(false);
	let dpr = 1;

	// Normalized values (0-1) for internal calculations
	let normalizedX = $derived((xValue - xMin) / (xMax - xMin));
	let normalizedY = $derived((yValue - yMin) / (yMax - yMin));

	// Convert normalized to pixel coordinates
	function normalizedToPixel(nx: number, ny: number, width: number, height: number) {
		return {
			x: nx * width,
			y: (1 - ny) * height // Invert Y (0 is top, 1 is bottom)
		};
	}

	// Convert pixel to normalized coordinates
	function pixelToNormalized(x: number, y: number, width: number, height: number) {
		return {
			x: Math.max(0, Math.min(1, x / width)),
			y: Math.max(0, Math.min(1, 1 - y / height)) // Invert Y
		};
	}

	// Update values from normalized coordinates
	function updateFromNormalized(nx: number, ny: number) {
		xValue = xMin + nx * (xMax - xMin);
		yValue = yMin + ny * (yMax - yMin);
	}

	// Draw the canvas
	function draw() {
		if (!canvas || !container) return;

		const rect = container.getBoundingClientRect();
		const width = rect.width;
		const height = rect.height;

		// Set canvas size accounting for DPI
		canvas.width = width * dpr;
		canvas.height = height * dpr;
		canvas.style.width = `${width}px`;
		canvas.style.height = `${height}px`;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		ctx.scale(dpr, dpr);
		ctx.clearRect(0, 0, width, height);

		// Draw grid
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
		ctx.lineWidth = 1;
		const gridSize = 4;
		for (let i = 0; i <= gridSize; i++) {
			const pos = (i / gridSize) * width;
			// Vertical lines
			ctx.beginPath();
			ctx.moveTo(pos, 0);
			ctx.lineTo(pos, height);
			ctx.stroke();
			// Horizontal lines
			ctx.beginPath();
			ctx.moveTo(0, pos);
			ctx.lineTo(width, pos);
			ctx.stroke();
		}

		// Draw center crosshair
		const centerX = width / 2;
		const centerY = height / 2;
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(centerX - 10, centerY);
		ctx.lineTo(centerX + 10, centerY);
		ctx.moveTo(centerX, centerY - 10);
		ctx.lineTo(centerX, centerY + 10);
		ctx.stroke();

		// Draw cursor position
		const cursorPos = normalizedToPixel(normalizedX, normalizedY, width, height);
		ctx.fillStyle = 'rgba(0, 240, 255, 0.8)';
		ctx.beginPath();
		ctx.arc(cursorPos.x, cursorPos.y, 6, 0, Math.PI * 2);
		ctx.fill();

		// Draw cursor ring
		ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.arc(cursorPos.x, cursorPos.y, 10, 0, Math.PI * 2);
		ctx.stroke();

		// Draw crosshair at cursor
		ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(cursorPos.x - 8, cursorPos.y);
		ctx.lineTo(cursorPos.x + 8, cursorPos.y);
		ctx.moveTo(cursorPos.x, cursorPos.y - 8);
		ctx.lineTo(cursorPos.x, cursorPos.y + 8);
		ctx.stroke();
	}

	// Handle pointer events
	function handlePointerDown(e: PointerEvent) {
		if (!container) return;
		e.preventDefault();
		isDragging = true;
		container.setPointerCapture(e.pointerId);
		handlePointerMove(e);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDragging || !container) return;
		e.preventDefault();

		const rect = container.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const normalized = pixelToNormalized(x, y, rect.width, rect.height);
		updateFromNormalized(normalized.x, normalized.y);
		draw();
	}

	function handlePointerUp(e: PointerEvent) {
		if (!container) return;
		isDragging = false;
		container.releasePointerCapture(e.pointerId);
	}

	// Update canvas when values change externally
	$effect(() => {
		normalizedX;
		normalizedY;
		draw();
	});

	onMount(() => {
		dpr = window.devicePixelRatio || 1;
		draw();

		// Redraw on resize
		const resizeObserver = new ResizeObserver(() => {
			draw();
		});
		if (container) {
			resizeObserver.observe(container);
		}

		return () => {
			resizeObserver.disconnect();
		};
	});

	// Slider values (normalized 0-100 for ObsidianSlider)
	// These sync bidirectionally with the normalized values
	let xSliderValue = $state([0]);
	let ySliderValue = $state([0]);

	// Sync sliders when normalized values change (from canvas drag)
	$effect(() => {
		xSliderValue = [normalizedX * 100];
	});

	$effect(() => {
		ySliderValue = [normalizedY * 100];
	});

	// Sync values when sliders change (from keyboard/accessibility)
	$effect(() => {
		const normalizedXFromSlider = xSliderValue[0] / 100;
		const currentNormalizedX = (xValue - xMin) / (xMax - xMin);
		if (Math.abs(normalizedXFromSlider - currentNormalizedX) > 0.01) {
			updateFromNormalized(normalizedXFromSlider, normalizedY);
		}
	});

	$effect(() => {
		const normalizedYFromSlider = ySliderValue[0] / 100;
		const currentNormalizedY = (yValue - yMin) / (yMax - yMin);
		if (Math.abs(normalizedYFromSlider - currentNormalizedY) > 0.01) {
			updateFromNormalized(normalizedX, normalizedYFromSlider);
		}
	});
</script>

<div class={cn('space-y-4', className)}>
	<div class="flex items-center justify-between mb-2">
		<span class="text-xs font-medium uppercase tracking-widest text-obsidian-text-secondary">
			Vector Control
		</span>
		<div class="font-mono text-xs tabular-nums text-signal-cyan">
			X: {xValue.toFixed(2)} | Y: {yValue.toFixed(1)}
		</div>
	</div>

	<!-- Canvas XY Pad -->
	<div
		bind:this={container}
		class="relative w-full bg-black/20 rounded-lg border border-white/10 overflow-hidden touch-none cursor-crosshair"
		style="touch-action: none; aspect-ratio: 1 / 1; width: 100%;"
		role="application"
		aria-label="Vector Control Pad"
		aria-describedby="xy-pad-description"
		tabindex="0"
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		onpointerleave={handlePointerUp}
	>
		<canvas bind:this={canvas} class="absolute inset-0 w-full h-full" aria-hidden="true"></canvas>
		<div id="xy-pad-description" class="sr-only">
			Use mouse or touch to control {xLabel} (horizontal) and {yLabel} (vertical). Use arrow keys or the
			sliders below for keyboard control.
		</div>
	</div>

	<!-- Accessibility: Hidden Sliders for Keyboard/Screen Reader Users -->
	<div class="sr-only" role="group" aria-label="Keyboard controls for Vector Control Pad">
		<ObsidianSlider label={xLabel} bind:value={xSliderValue} min={0} max={100} step={0.1} />
		<ObsidianSlider label={yLabel} bind:value={ySliderValue} min={0} max={100} step={0.1} />
	</div>
</div>

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}

	.touch-none {
		touch-action: none;
		-webkit-touch-callout: none;
		-webkit-user-select: none;
		user-select: none;
	}
</style>
