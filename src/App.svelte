<script lang="ts">
	import SimulationCanvas from '$components/canvas/SimulationCanvas.svelte';
</script>

<main>
	<SimulationCanvas />
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
		background: #0a0a0a;
	}

	main {
		width: 100vw;
		height: 100vh;
		position: relative;
	}
</style>
