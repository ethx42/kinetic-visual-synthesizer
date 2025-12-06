<script lang="ts">
	import { Canvas, T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import { onMount } from 'svelte';
	import GPGPUSimulation from './GPGPUSimulation.svelte';
	import ParticleSystem from './ParticleSystem.svelte';
	import DebugPlane from './DebugPlane.svelte';

	let webgl2Supported = false;
	let showDebug = false;

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
		return () => window.removeEventListener('keypress', handleKeyPress);
	});
</script>

<Canvas>
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
	<GPGPUSimulation>
		<ParticleSystem />
		<DebugPlane visible={showDebug} />
	</GPGPUSimulation>
</Canvas>

<style>
	:global(canvas) {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
