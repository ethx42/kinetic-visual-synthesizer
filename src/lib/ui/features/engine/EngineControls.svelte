<script lang="ts">
	import {
		noiseScale,
		noiseSpeed,
		noiseStrength,
		attractorStrength,
		damping,
		vectorFieldType
	} from '$lib/stores/settings';
	import { tension } from '$lib/stores/tension';
	import ObsidianSlider from '$lib/ui/primitives/ObsidianSlider.svelte';
	import ObsidianCard from '$lib/ui/primitives/ObsidianCard.svelte';
	import SectionHeader from '$lib/ui/primitives/SectionHeader.svelte';
	import XYPad from './XYPad.svelte';

	const fieldTypeOptions = [
		{ value: 0, label: 'Curl Noise' },
		{ value: 1, label: 'Lorenz Attractor' },
		{ value: 2, label: 'Aizawa Attractor' },
		{ value: 3, label: 'Rössler Attractor' },
		{ value: 4, label: 'Chen Attractor' },
		{ value: 5, label: "Thomas' Cyclically Symmetric" },
		{ value: 6, label: 'Gravity Grid' },
		{ value: 7, label: 'Halvorsen Attractor' },
		{ value: 8, label: 'Four-Wing Attractor' }
	];

	// Convert store values to slider arrays (0-100 normalized)
	let noiseSpeedSlider = $state([$noiseSpeed * 100]);
	let dampingSlider = $state([(($damping - 0.9) / 0.099) * 100]);
	let attractorStrengthSlider = $state([($attractorStrength / 5.0) * 100]);
	let tensionSlider = $state([$tension * 100]);

	// Sync sliders when stores change externally
	$effect(() => {
		noiseSpeedSlider = [$noiseSpeed * 100];
	});

	$effect(() => {
		dampingSlider = [(($damping - 0.9) / 0.099) * 100];
	});

	$effect(() => {
		attractorStrengthSlider = [($attractorStrength / 5.0) * 100];
	});

	$effect(() => {
		tensionSlider = [$tension * 100];
	});

	// Update stores when sliders change
	$effect(() => {
		$noiseSpeed = (noiseSpeedSlider[0] / 100) * 1.0;
	});

	$effect(() => {
		$damping = 0.9 + (dampingSlider[0] / 100) * 0.099;
	});

	$effect(() => {
		$attractorStrength = 0.1 + (attractorStrengthSlider[0] / 100) * 4.9;
	});

	$effect(() => {
		$tension = tensionSlider[0] / 100;
	});
</script>

<div class="space-y-6">
	<SectionHeader title="Flux Engine" />

	<!-- Vector Field Type Selector -->
	<ObsidianCard title="Field Type">
		<select
			bind:value={$vectorFieldType}
			class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white/90 font-medium outline-none transition-all focus:border-signal-cyan/50 focus:ring-2 focus:ring-signal-cyan/20"
		>
			{#each fieldTypeOptions as option}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	</ObsidianCard>

	<!-- Curl Noise Controls -->
	{#if $vectorFieldType < 0.5}
		<ObsidianCard title="Vector Control">
			<XYPad
				bind:xValue={$noiseScale}
				bind:yValue={$noiseStrength}
				xMin={0.1}
				xMax={2.0}
				yMin={1.0}
				yMax={20.0}
				xLabel="Noise Scale"
				yLabel="Noise Strength"
			/>
		</ObsidianCard>

		<ObsidianCard title="Noise Parameters">
			<ObsidianSlider
				label="Noise Speed"
				bind:value={noiseSpeedSlider}
				min={0}
				max={100}
				step={0.1}
			/>
		</ObsidianCard>

		<ObsidianCard title="Dynamics">
			<ObsidianSlider label="Damping" bind:value={dampingSlider} min={0} max={100} step={0.1} />
		</ObsidianCard>
	{/if}

	<!-- Attractor Controls -->
	{#if $vectorFieldType >= 0.5}
		<ObsidianCard title="Attractor Parameters">
			<ObsidianSlider
				label="Attractor Strength"
				bind:value={attractorStrengthSlider}
				min={0}
				max={100}
				step={0.1}
			/>
		</ObsidianCard>
	{/if}

	<!-- Entropy Control -->
	<ObsidianCard title="Entropy">
		<ObsidianSlider label="Tension" bind:value={tensionSlider} min={0} max={100} step={0.1} />
	</ObsidianCard>
</div>

<style>
	select option {
		background: rgba(10, 10, 12, 0.95);
		color: rgba(255, 255, 255, 0.95);
	}
</style>
