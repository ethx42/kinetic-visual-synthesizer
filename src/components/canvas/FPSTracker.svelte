<!--
	FPS Tracker Component
	Tracks FPS using Threlte's useTask hook and updates telemetry store
-->

<script lang="ts">
	import { useTask, useThrelte } from '@threlte/core';
	import { fps, renderCalls } from '$lib/stores/telemetry';

	const { renderer } = useThrelte();

	let fpsSamples: number[] = [];
	const SAMPLE_WINDOW = 60; // Average over 60 frames

	// Track FPS using useTask
	useTask('fps-tracker', (delta) => {
		const deltaMs = delta * 1000; // Convert to milliseconds

		// Calculate FPS from delta with validation
		// Clamp delta to reasonable range (0.1ms - 1000ms) to prevent invalid FPS
		const clampedDeltaMs = Math.max(0.1, Math.min(1000, deltaMs));

		if (clampedDeltaMs > 0) {
			const frameFps = 1000 / clampedDeltaMs;

			// Clamp FPS to reasonable range (0-120 FPS)
			// Prevents Infinity, NaN, or unrealistic values
			const clampedFps = Math.max(0, Math.min(120, frameFps));

			fpsSamples.push(clampedFps);

			// Keep only last N samples
			if (fpsSamples.length > SAMPLE_WINDOW) {
				fpsSamples.shift();
			}

			// Calculate average FPS
			const avgFps = fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length;

			// Final clamp to ensure valid value
			const finalFps = Math.max(0, Math.min(120, avgFps));

			// Update store using set method
			fps.set(finalFps);
		}

		// Update render calls if renderer is available
		if (renderer) {
			renderCalls.set(renderer.info.render.calls);
		}
	});
</script>

<!-- This component doesn't render anything, it just tracks FPS in the background -->
