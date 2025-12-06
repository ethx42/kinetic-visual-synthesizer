<script lang="ts">
	import { getContext } from 'svelte';
	import { T } from '@threlte/core';
	import { PlaneGeometry, MeshBasicMaterial } from 'three';
	import type { UseGPGPUResult } from '$lib/gpgpu/hooks/useGPGPU';

	interface Props {
		visible?: boolean;
	}

	let { visible = false }: Props = $props();

	// Get GPGPU system from context
	const gpgpu = getContext<UseGPGPUResult>('gpgpu');

	const geometry = new PlaneGeometry(2, 2);
	let material: MeshBasicMaterial | null = null;

	if (gpgpu) {
		const velocityTexture = gpgpu.readVelocity();
		material = new MeshBasicMaterial({
			map: velocityTexture.texture,
			transparent: true,
			opacity: 0.8
		});
	}
</script>

{#if visible && material}
	<T.Mesh geometry={geometry} material={material} position={[0, 0, -4]} />
{/if}

