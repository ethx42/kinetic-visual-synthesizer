<script lang="ts">
	import { onDestroy, setContext } from 'svelte';
	import { get } from 'svelte/store';
	import { useGPGPU } from '$lib/gpgpu/hooks/useGPGPU';
	import { particleCount } from '$lib/stores/settings';

	// Get initial particle count value from store
	// Note: For now we use initial value. Dynamic resizing can be added later.
	const initialParticleCount = get(particleCount);

	// Initialize GPGPU system (called once during component mount)
	const gpgpu = useGPGPU({
		width: 1024,
		height: 1024,
		particleCount: initialParticleCount
	});

	// Expose GPGPU system via context for child components
	setContext('gpgpu', gpgpu);

	onDestroy(() => {
		gpgpu.dispose();
	});
</script>

<!-- This component manages GPGPU state and exposes it via context -->
<slot />

