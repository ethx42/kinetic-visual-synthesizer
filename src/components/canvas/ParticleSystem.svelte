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
	import {
		particleCount,
		currentPositionTexture,
		currentVelocityTexture
	} from '$lib/stores/settings';
	import { SHADER } from '$lib/utils/constants';
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
			throw new Error(
				'GPGPU context not found. Make sure ParticleSystem is inside GPGPUSimulation.'
			);
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

		// Create valid bounding sphere and box to prevent null reference errors
		// Use a large sphere to encompass all possible particle positions
		geometry.boundingSphere = new Sphere(new Vector3(0, 0, 0), 100);
		geometry.boundingBox = new Box3(new Vector3(-100, -100, -100), new Vector3(100, 100, 100));

		// Disable automatic bounding sphere computation since positions come from texture
		geometry.computeBoundingSphere = () => {};
		geometry.computeBoundingBox = () => {};

		// Get initial position texture
		const positionTexture = gpgpu.readPosition();
		const velocityTexture = gpgpu.readVelocity();
		currentPositionTexture.set(positionTexture.texture);
		currentVelocityTexture.set(velocityTexture.texture);

		// Create shader material
		material = new ShaderMaterial({
			vertexShader: particleVert,
			fragmentShader: particleFrag,
			uniforms: {
				uPositionTexture: { value: positionTexture.texture },
				uVelocityTexture: { value: velocityTexture.texture },
				uTextureSize: { value: textureSize },
				uPointSize: { value: 0.03 },
				uPointSizeScale: { value: SHADER.POINT_SIZE_SCALE } // Distance attenuation scale
			},
			blending: AdditiveBlending,
			depthTest: true,
			depthWrite: false,
			transparent: true
		});
	});

	// Reactively update position texture reference when store changes (ping-pong)
	$: if (material && $currentPositionTexture && $currentVelocityTexture) {
		material.uniforms.uPositionTexture.value = $currentPositionTexture;
		material.uniforms.uVelocityTexture.value = $currentVelocityTexture;
		material.uniforms.uTextureSize.value = textureSize;
	}
</script>

{#if geometry && material}
	<T.Points {geometry} {material} frustumCulled={false} />
{/if}
