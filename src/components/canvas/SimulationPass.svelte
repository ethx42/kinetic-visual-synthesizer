<script lang="ts">
	import { getContext, onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import { useThrelte, useTask } from '@threlte/core';
	import {
		BufferGeometry,
		BufferAttribute,
		RawShaderMaterial,
		Scene,
		OrthographicCamera,
		Mesh,
		Sphere,
		Box3,
		Vector3
	} from 'three';
	import { tension } from '$lib/stores/tension';
	import { handTracking } from '$lib/stores/handTracking';
	import {
		vectorFieldType,
		noiseScale,
		noiseSpeed,
		noiseStrength,
		attractorStrength,
		damping,
		currentPositionTexture,
		currentVelocityTexture
	} from '$lib/stores/settings';
	import { SIMULATION, SHADER } from '$lib/utils/constants';
	import simVert from '$shaders/simulation/sim.vert.glsl?raw';
	import simFrag from '$shaders/simulation/sim.frag.glsl?raw';
	import noiseFrag from '$shaders/simulation/noise.glsl?raw';
	import type { UseGPGPUResult } from '$lib/gpgpu/hooks/useGPGPU';

	// Get GPGPU system from context
	const gpgpu = getContext<UseGPGPUResult>('gpgpu');
	const { renderer } = useThrelte();

	// Pre-allocated resources (Zero-Garbage principle)
	let scene: Scene | null = null;
	let camera: OrthographicCamera | null = null;
	let mesh: Mesh | null = null;
	let material: RawShaderMaterial | null = null;
	let geometry: BufferGeometry | null = null;

	// Time tracking (pre-allocated)
	let currentTime = 0;
	let isInitialized = false;

	// Pre-allocated debug buffer (Zero-Garbage principle)
	let debugBuffer: Float32Array | null = null;

	onMount(() => {
		if (!gpgpu) {
			throw new Error(
				'GPGPU context not found. Make sure SimulationPass is inside GPGPUSimulation.'
			);
		}

		// Pre-allocate debug buffer (Zero-Garbage principle)
		debugBuffer = new Float32Array(4);

		// Create fullscreen quad geometry
		geometry = new BufferGeometry();
		const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
		const uvs = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
		geometry.setAttribute('position', new BufferAttribute(vertices, 2));
		geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
		geometry.setIndex([0, 1, 2, 2, 1, 3]);

		// Create valid bounding sphere and box
		geometry.boundingSphere = new Sphere(new Vector3(0, 0, 0), Math.SQRT2);
		geometry.boundingBox = new Box3(new Vector3(-1, -1, 0), new Vector3(1, 1, 0));
		geometry.computeBoundingSphere = () => {};
		geometry.computeBoundingBox = () => {};

		// Create orthographic camera for fullscreen quad
		camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

		// Get initial textures
		const positionTexture = gpgpu.readPosition();
		const velocityTexture = gpgpu.readVelocity();

		// Create simulation shader material
		material = new RawShaderMaterial({
			vertexShader: 'precision highp float;\n' + simVert,
			fragmentShader: 'precision highp float;\n' + noiseFrag + '\n' + simFrag,
			uniforms: {
				uPositionTexture: { value: positionTexture.texture },
				uVelocityTexture: { value: velocityTexture.texture },
				uTime: { value: 0.0 },
				uDeltaTime: { value: 1.0 / SIMULATION.TARGET_FPS },
				uEntropy: { value: 0.0 },
				uNoiseScale: { value: 1.0 },
				uNoiseSpeed: { value: 0.5 },
				uNoiseStrength: { value: 8.0 },
				uPositionScale: { value: SHADER.POSITION_SCALE_DEFAULT }, // Position scale for curl noise
				uFieldType: { value: 0.0 }, // 0 = CURL_NOISE, 1 = LORENZ, 2 = AIZAWA
				uAttractorStrength: { value: 0.5 },
				uDamping: { value: 0.01 }, // 0.01 = 1% damping per frame (very smooth)
				uBoundarySize: { value: SHADER.BOUNDARY_DEFAULT }, // Boundary size for particle wrapping
				uOutputMode: { value: 0.0 } // 0 = position, 1 = velocity
			}
		});

		// Create mesh
		mesh = new Mesh(geometry, material);
		mesh.frustumCulled = false;
		scene = new Scene();
		scene.add(mesh);

		// Mark as initialized
		isInitialized = true;
		currentTime = performance.now() / 1000.0;

		// Debug: Press 'P' to log particle velocity (dev mode only)
		if (import.meta.env.DEV) {
			const handleKeyPress = (e: KeyboardEvent) => {
				if (e.key === 'p' || e.key === 'P') {
					if (!debugBuffer) return; // Guard clause

					const gl = renderer.getContext();
					const width = 1024; // Texture size
					const height = 1024;

					// Read from current velocity texture
					const velocityTexture = gpgpu.readVelocity();

					renderer.setRenderTarget(velocityTexture);
					gl.readPixels(width / 2, height / 2, 1, 1, gl.RGBA, gl.FLOAT, debugBuffer);
					renderer.setRenderTarget(null);

					console.log('🔍 PARTICLE DIAGNOSTIC (Center Pixel):');
					console.log(
						`Velocity: [x: ${debugBuffer[0].toFixed(5)}, y: ${debugBuffer[1].toFixed(5)}, z: ${debugBuffer[2].toFixed(5)}]`
					);
					console.log(
						`Magnitude: ${Math.sqrt(debugBuffer[0] * debugBuffer[0] + debugBuffer[1] * debugBuffer[1] + debugBuffer[2] * debugBuffer[2]).toFixed(5)}`
					);
				}
			};
			window.addEventListener('keypress', handleKeyPress);

			// Cleanup debug handler
			return () => {
				window.removeEventListener('keypress', handleKeyPress);
			};
		}
	});

	// Use Threlte's useTask hook for reactive frame updates
	// This replaces requestAnimationFrame and integrates with Threlte's lifecycle
	// The task runs every frame before rendering (simulation updates happen first)
	useTask('simulation-update', (delta) => {
		// Skip if not initialized
		if (!isInitialized || !scene || !camera || !material || !gpgpu) {
			return;
		}

		// Check if signal is lost (occlusion/face crossing)
		const trackingState = get(handTracking);
		const signalLost = trackingState.signalLost;

		// Update time (Threlte provides delta in seconds)
		// Freeze time when signal is lost (occlusion/face crossing)
		// This turns a technical bug into a narrative feature: "Connection interrupted"
		if (!signalLost) {
			currentTime += delta;
		}
		// else: time is frozen, particles maintain last state

		// Cap delta time to prevent large jumps (max ~30 FPS equivalent)
		// When signal is lost, set delta to 0 to freeze physics
		const cappedDelta = signalLost
			? 0.0
			: Math.min(Math.max(delta, SIMULATION.MIN_DELTA_TIME), SIMULATION.MAX_DELTA_TIME);

		// Get current read and write textures (ping-pong)
		const positionRead = gpgpu.readPosition();
		const velocityRead = gpgpu.readVelocity();
		const positionWrite = gpgpu.writePosition();
		const velocityWrite = gpgpu.writeVelocity();

		// Save current render target and WebGL state
		const previousRenderTarget = renderer.getRenderTarget();

		// Update uniforms (reactive to stores)
		material.uniforms.uTime.value = currentTime;
		material.uniforms.uDeltaTime.value = cappedDelta;
		material.uniforms.uEntropy.value = $tension;
		material.uniforms.uFieldType.value = $vectorFieldType;
		material.uniforms.uNoiseScale.value = $noiseScale;
		material.uniforms.uNoiseSpeed.value = $noiseSpeed;
		material.uniforms.uNoiseStrength.value = $noiseStrength;
		material.uniforms.uAttractorStrength.value = $attractorStrength;
		material.uniforms.uDamping.value = $damping;
		material.uniforms.uPositionTexture.value = positionRead.texture;
		material.uniforms.uVelocityTexture.value = velocityRead.texture;

		// Phase 2.2: Update position and velocity
		// Pass 1: Update position
		material.uniforms.uOutputMode.value = 0.0; // Output position
		renderer.setRenderTarget(positionWrite);
		renderer.render(scene, camera);

		// Pass 2: Update velocity
		material.uniforms.uOutputMode.value = 1.0; // Output velocity
		renderer.setRenderTarget(velocityWrite);
		renderer.render(scene, camera);

		// Swap ping-pong buffers after both passes
		gpgpu.swap();

		// Update position texture reference in store (for ParticleSystem)
		const updatedPositionTexture = gpgpu.readPosition();
		const updatedVelocityTexture = gpgpu.readVelocity();
		currentPositionTexture.set(updatedPositionTexture.texture);
		currentVelocityTexture.set(updatedVelocityTexture.texture);

		// Restore previous render target
		renderer.setRenderTarget(previousRenderTarget);

		// Debug: Log framebuffer status (dev mode only, throttled)
		if (import.meta.env.DEV && Math.floor(currentTime * 60) % 60 === 0) {
			const gl = renderer.getContext();
			const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
			if (status !== gl.FRAMEBUFFER_COMPLETE) {
				console.error('Framebuffer incomplete:', status);
			}
		}
	});

	onDestroy(() => {
		// Cleanup resources
		if (geometry) geometry.dispose();
		if (material) material.dispose();
		// Note: useTask automatically unsubscribes when component unmounts
	});
</script>

/** * SimulationPass Component * Executes the GPGPU simulation shader each frame * Updates Position
and Velocity textures via FBO Ping-Pong * Follows "Zero-Garbage" principle: pre-allocates all
resources */

<!-- This component runs invisibly - no visual output -->
