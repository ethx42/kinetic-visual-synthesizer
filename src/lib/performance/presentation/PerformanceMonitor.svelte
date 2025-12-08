<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import { PerformanceManager } from '../application/PerformanceManager';
	import { PerformanceLevel } from '../domain/entities/PerformanceProfile';
	import { ReduceParticleCountStrategy } from '../domain/strategies/ReduceParticleCountStrategy';
	import { DisablePostProcessingStrategy } from '../domain/strategies/DisablePostProcessingStrategy';
	import { ReduceQualityStrategy } from '../domain/strategies/ReduceQualityStrategy';
	import {
		particleCount,
		postProcessingEnabled,
		qualityLevel
	} from '$lib/stores/settings';
	import { fps, renderCalls } from '$lib/stores/telemetry';

	let manager: PerformanceManager | null = null;
	let currentLevel = $state<PerformanceLevel>(PerformanceLevel.GOOD);
	let appliedStrategiesCount = $state(0);
	let isMonitoring = $state(false);

	onMount(() => {
		const strategies = [
			new ReduceParticleCountStrategy(particleCount),
			new DisablePostProcessingStrategy(postProcessingEnabled),
			new ReduceQualityStrategy(qualityLevel)
		];

		manager = new PerformanceManager(
			strategies,
			{
				getFps: () => get(fps),
				getRenderCalls: () => get(renderCalls),
				getParticleCount: () => get(particleCount)
			}
		);

		manager.setOnLevelChange((level) => {
			currentLevel = level;
		});

		manager.setOnStrategyApplied(() => {
			appliedStrategiesCount = manager?.getAppliedStrategies().length ?? 0;
		});

		manager.setOnStrategyReverted(() => {
			appliedStrategiesCount = manager?.getAppliedStrategies().length ?? 0;
		});

		manager.start();
		isMonitoring = true;
	});

	onDestroy(() => {
		if (manager) {
			manager.destroy();
			manager = null;
		}
		isMonitoring = false;
	});
</script>

<!-- Performance Monitor is a headless component that runs in the background -->
<!-- It can optionally render debug information when needed -->

{#if isMonitoring}
	<div class="performance-monitor hidden" data-level={currentLevel} data-strategies={appliedStrategiesCount}>
		<!-- Hidden element for testing/debugging purposes -->
	</div>
{/if}
