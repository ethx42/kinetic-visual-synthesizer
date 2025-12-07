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
		width: 100vw;
		height: 100vh;
	}

	:global(html) {
		margin: 0;
		padding: 0;
		overflow: hidden;
		width: 100%;
		height: 100%;
	}

	:global(#app) {
		margin: 0;
		padding: 0;
		width: 100vw;
		height: 100vh;
		max-width: none;
	}

	main {
		width: 100vw;
		height: 100vh;
		position: relative;
		margin: 0;
		padding: 0;
		overflow: hidden;
	}
</style>
