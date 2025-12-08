<script lang="ts">
	import { Canvas, T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import { onMount } from 'svelte';
	import GPGPUSimulation from './GPGPUSimulation.svelte';
	import ParticleSystem from './ParticleSystem.svelte';
	import SimulationPass from './SimulationPass.svelte';
	import DebugPlane from './DebugPlane.svelte';
	import VisionSystem from '../ui/VisionSystem.svelte';
	import { getRotationCursor } from '$lib/ui/cursors/RotationCursor';
	import { particleCount, qualityLevel } from '$lib/stores/settings';

	let webgl2Supported = $state(false);
	let showDebug = $state(false);
	let isHoveringCanvas = $state(false);
	let isDragging = $state(false);
	let canvasContainer: HTMLDivElement | null = $state(null);

	// Get rotation cursor once
	const rotationCursor = getRotationCursor();

	onMount(() => {
		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl2');
		webgl2Supported = gl !== null;

		if (!webgl2Supported) {
			console.warn('WebGL2 not supported. Falling back to WebGL1 with reduced precision.');
		}

		// Toggle debug view with 'D' key
		const handleKeyPress = (e: KeyboardEvent) => {
			if (e.key === 'd' || e.key === 'D') {
				showDebug = !showDebug;
			}
		};
		window.addEventListener('keypress', handleKeyPress);

		// Handle mouse move to detect if hovering over canvas (not control panel)
		const handleMouseMove = (e: MouseEvent) => {
			if (!canvasContainer) return;

			const target = e.target as HTMLElement;
			// Check if the target is the canvas or within the canvas container
			// and not within the control panel
			const isCanvas = target.tagName === 'CANVAS' || canvasContainer.contains(target);
			const isControlPanel = target.closest('.control-panel, .control-tab') !== null;

			// Also check if mouse is over control panel by position
			const controlPanel = document.querySelector('.control-panel');
			const controlTab = document.querySelector('.control-tab');
			let isOverPanel = false;

			if (controlPanel) {
				const rect = controlPanel.getBoundingClientRect();
				isOverPanel =
					e.clientX >= rect.left &&
					e.clientX <= rect.right &&
					e.clientY >= rect.top &&
					e.clientY <= rect.bottom;
			}

			if (controlTab && !isOverPanel) {
				const rect = controlTab.getBoundingClientRect();
				isOverPanel =
					e.clientX >= rect.left &&
					e.clientX <= rect.right &&
					e.clientY >= rect.top &&
					e.clientY <= rect.bottom;
			}

			isHoveringCanvas = isCanvas && !isControlPanel && !isOverPanel;
		};

		// Handle mouse down/up to track dragging state
		// We need to track if the drag started on the canvas
		const handleMouseDown = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			const isCanvas =
				target.tagName === 'CANVAS' || (canvasContainer && canvasContainer.contains(target));
			const isControlPanel = target.closest('.control-panel, .control-tab') !== null;

			// Check if mouse is over control panel by position
			const controlPanel = document.querySelector('.control-panel');
			const controlTab = document.querySelector('.control-tab');
			let isOverPanel = false;

			if (controlPanel) {
				const rect = controlPanel.getBoundingClientRect();
				isOverPanel =
					e.clientX >= rect.left &&
					e.clientX <= rect.right &&
					e.clientY >= rect.top &&
					e.clientY <= rect.bottom;
			}

			if (controlTab && !isOverPanel) {
				const rect = controlTab.getBoundingClientRect();
				isOverPanel =
					e.clientX >= rect.left &&
					e.clientX <= rect.right &&
					e.clientY >= rect.top &&
					e.clientY <= rect.bottom;
			}

			if (isCanvas && !isControlPanel && !isOverPanel) {
				isDragging = true;
				// Force cursor immediately via JavaScript to override OrbitControls
				if (canvasContainer) {
					const canvas = canvasContainer.querySelector('canvas');
					if (canvas) {
						canvas.style.cursor = `url('${rotationCursor}') 16 16, grab`;
					}
				}
			}
		};

		const handleMouseUp = () => {
			isDragging = false;
		};

		// Also track mouse leave to reset dragging if mouse leaves window
		const handleMouseLeave = () => {
			isDragging = false;
		};

		// Force cursor during drag move to override OrbitControls
		// This runs on every mousemove to ensure cursor stays during drag
		const handleDragMove = () => {
			if (isDragging && canvasContainer) {
				const canvas = canvasContainer.querySelector('canvas');
				if (canvas) {
					canvas.style.cursor = `url('${rotationCursor}') 16 16, grab`;
				}
			}
		};

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mousemove', handleDragMove);
		window.addEventListener('mousedown', handleMouseDown);
		window.addEventListener('mouseup', handleMouseUp);
		window.addEventListener('mouseleave', handleMouseLeave);

		return () => {
			window.removeEventListener('keypress', handleKeyPress);
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mousemove', handleDragMove);
			window.removeEventListener('mousedown', handleMouseDown);
			window.removeEventListener('mouseup', handleMouseUp);
			window.removeEventListener('mouseleave', handleMouseLeave);
		};
	});
</script>

<div
	bind:this={canvasContainer}
	class="canvas-wrapper"
	class:show-rotation-cursor={isHoveringCanvas || isDragging}
	class:dragging={isDragging}
	style="--rotation-cursor: url('{rotationCursor}') 16 16, grab;"
>
	<Canvas dpr={$qualityLevel}>
		{#if !webgl2Supported}
			<div
				style="position: absolute; top: 20px; left: 20px; color: #ff6b6b; font-family: monospace; z-index: 1000;"
			>
				⚠️ WebGL2 not supported. Using WebGL1 fallback.
			</div>
		{/if}

		<T.PerspectiveCamera makeDefault position={[0, 0, 5]} fov={75}>
			<OrbitControls />
		</T.PerspectiveCamera>
		<T.AmbientLight intensity={0.5} />

		<!-- GPGPU Simulation System -->
		{#key $particleCount}
			<GPGPUSimulation>
				<SimulationPass />
				<ParticleSystem />
				<DebugPlane visible={showDebug} />
			</GPGPUSimulation>
		{/key}
	</Canvas>
</div>

<!-- Vision System (hand tracking) -->
<VisionSystem />

<style>
	.canvas-wrapper {
		width: 100%;
		height: 100%;
		position: relative;
	}

	/* Apply rotation cursor when hovering or dragging */
	.canvas-wrapper.show-rotation-cursor :global(canvas),
	.canvas-wrapper.show-rotation-cursor {
		cursor: var(--rotation-cursor, grab) !important;
	}

	/* Keep rotation cursor even when dragging - use !important to override OrbitControls */
	.canvas-wrapper.show-rotation-cursor :global(canvas):active,
	.canvas-wrapper.dragging :global(canvas),
	.canvas-wrapper.dragging {
		cursor: var(--rotation-cursor, grab) !important;
	}

	/* Override any cursor changes from OrbitControls during drag */
	.canvas-wrapper.dragging :global(canvas) {
		cursor: var(--rotation-cursor, grab) !important;
		pointer-events: auto;
	}

	:global(canvas) {
		display: block;
		width: 100%;
		height: 100%;
		margin: 0;
		padding: 0;
		cursor: default;
	}

	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
	}

	:global(html) {
		margin: 0;
		padding: 0;
		overflow: hidden;
	}
</style>
