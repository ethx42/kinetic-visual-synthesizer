<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { T } from '@threlte/core';
	import {
		BufferGeometry,
		BufferAttribute,
		ShaderMaterial,
		AdditiveBlending,
		Sphere,
		Box3,
		Vector3
	} from 'three';
	import { particleCount } from '$lib/stores/settings';
	import particleVert from '$shaders/rendering/particle.vert.glsl?raw';
	import particleFrag from '$shaders/rendering/particle.frag.glsl?raw';
	import type { UseGPGPUResult } from '$lib/gpgpu/hooks/useGPGPU';

	// Get GPGPU system from context
	const gpgpu = getContext<UseGPGPUResult>('gpgpu');

	// Get particle count value from store
	$: currentParticleCount = $particleCount;

	// Calculate texture size
	$: textureSize = Math.ceil(Math.sqrt(currentParticleCount));
	$: actualParticleCount = textureSize * textureSize;

	// Create geometry with particle indices
	let geometry: BufferGeometry | null = null;
	let material: ShaderMaterial | null = null;

	onMount(() => {
		if (!gpgpu) {
			console.error('GPGPU context not found. Make sure ParticleSystem is inside GPGPUSimulation.');
			return;
		}

		// Create buffer geometry with indices
		geometry = new BufferGeometry();
		const indices = new Float32Array(actualParticleCount);
		for (let i = 0; i < actualParticleCount; i++) {
			indices[i] = i;
		}
		geometry.setAttribute('aIndex', new BufferAttribute(indices, 1));
		
		// Add dummy position attribute (Three.js requires it, but shader reads from texture)
		// This prevents NaN errors in bounding sphere computation
		const dummyPositions = new Float32Array(actualParticleCount * 3);
		geometry.setAttribute('position', new BufferAttribute(dummyPositions, 3));
		
		// Manually set bounding sphere to avoid null errors and prevent culling issues
		// since positions are determined in vertex shader
		geometry.boundingSphere = new Sphere(new Vector3(), Infinity);
		geometry.boundingBox = new Box3(
			new Vector3(-Infinity, -Infinity, -Infinity),
			new Vector3(Infinity, Infinity, Infinity)
		);
		geometry.computeBoundingSphere = () => {};
		geometry.computeBoundingBox = () => {};

		// Get current position texture
		const positionTexture = gpgpu.readPosition();

		// Create shader material
		material = new ShaderMaterial({
			vertexShader: particleVert,
			fragmentShader: particleFrag,
			uniforms: {
				uPositionTexture: { value: positionTexture.texture },
				uTextureSize: { value: textureSize },
				uPointSize: { value: 2.0 }
			},
			blending: AdditiveBlending,
			depthTest: true,
			depthWrite: false,
			transparent: true
		});
	});
</script>

{#if geometry && material}
	<T.Points geometry={geometry} material={material} frustumCulled={false} />
{/if}

