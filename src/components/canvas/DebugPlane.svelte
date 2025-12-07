<script lang="ts">
	import { getContext } from 'svelte';
	import { T } from '@threlte/core';
	import { PlaneGeometry, MeshBasicMaterial } from 'three';
	import { currentVelocityTexture } from '$lib/stores/settings';
	import type { UseGPGPUResult } from '$lib/gpgpu/hooks/useGPGPU';

	interface Props {
		visible?: boolean;
	}

	let { visible = false }: Props = $props();

	// Get GPGPU system from context
	const gpgpu = getContext<UseGPGPUResult>('gpgpu');

	const geometry = new PlaneGeometry(2, 2);
	// Use Svelte 5 state for reactivity
	let material: MeshBasicMaterial | null = $state(null);

	// Reactively update material when velocity texture changes (ping-pong)
	$effect(() => {
		if (gpgpu && visible) {
			// Use reactive store that updates on each ping-pong swap
			const velocityTexture = $currentVelocityTexture || gpgpu.readVelocity().texture;

			if (material) {
				material.map = velocityTexture;
				material.needsUpdate = true;
			} else {
				material = new MeshBasicMaterial({
					map: velocityTexture,
					transparent: true,
					opacity: 1.0 // Make it fully visible to detect faint values
				});
			}
		}
	});
</script>

{#if visible && material}
	<!-- 
		Position it in front of camera but behind particles? 
		Actually just put it in front so it obscures everything for debugging.
		z = 0 is where particles are. Camera is at z = 5.
		Put DebugPlane at z = 2 so it floats in front.
	-->
	<T.Mesh {geometry} {material} position={[0, 0, 2]} />
{/if}
