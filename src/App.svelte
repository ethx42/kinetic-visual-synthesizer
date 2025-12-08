<script lang="ts">
	import SimulationCanvas from '$components/canvas/SimulationCanvas.svelte';
	import Shell from '$components/ui/shell/Shell.svelte';
	import KitchenSink from '$components/ui/KitchenSink.svelte';
	import UnifiedControlPanel from '$components/ui/UnifiedControlPanel.svelte';
</script>

<main>
	<SimulationCanvas />
	<UnifiedControlPanel />
	<Shell>
		<KitchenSink />
	</Shell>
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
