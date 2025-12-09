<!--
	Performance Monitor Component
	Presentation Layer - Integrates PerformanceManager with Svelte
	
	This component:
	- Initializes and manages PerformanceManager lifecycle
	- Registers degradation strategies
	- Provides reactive access to performance state
-->

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { PerformanceManager } from '../application/PerformanceManager';
	import { PerformanceAnalyzer } from '../domain/services/PerformanceAnalyzer';
	import {
		ReduceParticleCountStrategy,
		DisablePostProcessingStrategy,
		ReduceQualityStrategy
	} from '../domain/strategies';
	import { particleCount, qualityLevel } from '$lib/stores/settings';
	import { postProcessingEnabled } from '$lib/stores/postProcessing';
	import type { PerformanceThresholds } from '../domain/entities/PerformanceProfile';
	import { createDefaultThresholds } from '../domain/entities/PerformanceProfile';

	/**
	 * Component props
	 */
	interface Props {
		/**
		 * Performance thresholds configuration
		 * @default Standard thresholds
		 */
		thresholds?: PerformanceThresholds;

		/**
		 * Sampling interval in milliseconds
		 * @default 1000
		 */
		samplingInterval?: number;

		/**
		 * Enable debug logging
		 * @default false (uses import.meta.env.DEV)
		 */
		enableDebugLogging?: boolean;

		/**
		 * Auto-start monitoring on mount
		 * @default true
		 */
		autoStart?: boolean;
	}

	let {
		thresholds = createDefaultThresholds(),
		samplingInterval = 1000,
		enableDebugLogging = import.meta.env.DEV,
		autoStart = true
	}: Props = $props();

	let manager: PerformanceManager | null = null;

	onMount(() => {
		// Create performance analyzer with thresholds
		const analyzer = new PerformanceAnalyzer(thresholds);

		// Create performance context with stores
		const context = {
			particleCount,
			postProcessingEnabled,
			qualityLevel,
			settings: new Map()
		};

		// Create performance manager
		manager = new PerformanceManager(analyzer, context, {
			samplingInterval,
			enableDebugLogging
		});

		// Register degradation strategies
		// Strategies use PerformanceContext exclusively (Clean Architecture)
		manager.registerStrategy(new ReduceParticleCountStrategy());
		manager.registerStrategy(new DisablePostProcessingStrategy());
		manager.registerStrategy(new ReduceQualityStrategy());

		// Start monitoring if auto-start is enabled
		if (autoStart) {
			manager.start();
		}
	});

	onDestroy(() => {
		manager?.stop();
		manager = null;
	});
</script>

<!--
	This component doesn't render anything visible.
	It's a service component that manages performance in the background.
	If you want to display performance metrics, create a separate UI component.
-->
