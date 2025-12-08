<script lang="ts">
	import ObsidianSlider from '$lib/ui/primitives/ObsidianSlider.svelte';
	import ObsidianSwitch from '$lib/ui/primitives/ObsidianSwitch.svelte';
	import ObsidianCard from '$lib/ui/primitives/ObsidianCard.svelte';
	import SectionHeader from '$lib/ui/primitives/SectionHeader.svelte';
	import EngineControls from '$lib/ui/features/engine/EngineControls.svelte';

	let volume = [50];
	let opacity = [80];
	let isEnabled = false;
	let isTurbo = true;
</script>

<!-- Mobile Portrait: Vertical layout (default) -->
<!-- Desktop & Mobile Landscape: Horizontal layout -->
<div class="kitchen-sink-container flex flex-col gap-6 p-6 md:flex-row md:h-full">
	<style>
		/* Desktop: Horizontal layout */
		@media (min-width: 768px) {
			:global(.kitchen-sink-container) {
				flex-direction: row !important;
				overflow-x: auto !important;
				overflow-y: hidden !important;
			}
			:global(.kitchen-section) {
				width: 20rem !important; /* 320px */
				flex-shrink: 0 !important;
			}
		}

		/* Mobile Landscape: Horizontal layout */
		@media (max-width: 768px) and (orientation: landscape) {
			:global(.kitchen-sink-container) {
				flex-direction: row !important;
				overflow-x: auto !important;
				overflow-y: hidden !important;
				height: 100% !important;
			}
			:global(.kitchen-section) {
				width: 20rem !important; /* 320px */
				flex-shrink: 0 !important;
			}
		}
	</style>

	<!-- Core Controls Section -->
	<div
		class="kitchen-section space-y-6 flex-shrink-0
		/* Mobile Portrait: Full width */
		w-full
		/* Desktop: Fixed width */
		md:w-80"
	>
		<SectionHeader title="Core Controls" />

		<ObsidianCard title="System Parameters">
			<div class="space-y-6">
				<ObsidianSlider label="System Volume" bind:value={volume} max={100} step={1} />
				<ObsidianSlider label="Opacity" bind:value={opacity} max={100} step={1} />
			</div>
		</ObsidianCard>

		<ObsidianCard title="Toggles">
			<div class="space-y-4">
				<ObsidianSwitch label="Enable Engine" bind:checked={isEnabled} />
				<ObsidianSwitch label="Turbo Mode" bind:checked={isTurbo} />
			</div>
		</ObsidianCard>

		<ObsidianCard title="Flux Engine">
			<EngineControls />
		</ObsidianCard>
	</div>

	<!-- Diagnostics Section -->
	<div
		class="kitchen-section space-y-6 flex-shrink-0
		/* Mobile Portrait: Full width */
		w-full
		/* Desktop: Fixed width */
		md:w-80"
	>
		<SectionHeader title="Diagnostics" />
		<ObsidianCard>
			<div class="space-y-2 font-mono text-xs text-obsidian-text-secondary">
				<p>Volume: <span class="text-signal-cyan">{volume[0]}%</span></p>
				<p>Opacity: <span class="text-signal-cyan">{opacity[0]}%</span></p>
				<p>
					Engine: <span class={isEnabled ? 'text-signal-bio' : 'text-red-500'}
						>{isEnabled ? 'ONLINE' : 'OFFLINE'}</span
					>
				</p>
				<p>
					Mode: <span class={isTurbo ? 'text-signal-cyan' : 'text-obsidian-text-secondary'}
						>{isTurbo ? 'TURBO' : 'NORMAL'}</span
					>
				</p>
			</div>
		</ObsidianCard>
	</div>
</div>
