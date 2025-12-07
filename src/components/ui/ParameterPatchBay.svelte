<script lang="ts">
	/**
	 * Parameter Patch Bay Component
	 * Allows mapping hand tension to multiple physics parameters
	 * Phase 3.4: Multi-Parameter Mapping
	 */
	import { patchMappings } from '$lib/stores/settings';
	import { tension } from '$lib/stores/tension';
	import { computedTimeScale, computedColorShift } from '$lib/stores/settings';
	import { noiseSpeed, attractorStrength } from '$lib/stores/settings';

	// Update computed values based on patch mappings
	$effect(() => {
		const mappings = $patchMappings;
		const currentTension = $tension;

		// Time Scale: timeScale = 0.5 + tension * 1.5
		if (mappings.timeScale.enabled) {
			const timeScaleValue =
				mappings.timeScale.min + currentTension * (mappings.timeScale.max - mappings.timeScale.min);
			computedTimeScale.set(timeScaleValue);
			noiseSpeed.set(timeScaleValue * 0.1); // Scale noise speed proportionally
		} else {
			computedTimeScale.set(1.0);
		}

		// Color Shift: hueOffset = tension * 2π
		if (mappings.colorShift.enabled) {
			const colorShiftValue =
				mappings.colorShift.min +
				currentTension * (mappings.colorShift.max - mappings.colorShift.min);
			computedColorShift.set(colorShiftValue);
		} else {
			computedColorShift.set(0.0);
		}

		// Attractor Strength: strength = 0.1 + tension * 0.9
		if (mappings.attractorStrength.enabled) {
			const strengthValue =
				mappings.attractorStrength.min +
				currentTension * (mappings.attractorStrength.max - mappings.attractorStrength.min);
			attractorStrength.set(strengthValue);
		}

		// Entropy is directly mapped (handled in SimulationPass)
	});

	function togglePatch(key: string) {
		patchMappings.update((mappings) => ({
			...mappings,
			[key]: {
				...mappings[key],
				enabled: !mappings[key].enabled
			}
		}));
	}

	function updatePatchRange(key: string, field: 'min' | 'max', value: number) {
		patchMappings.update((mappings) => ({
			...mappings,
			[key]: {
				...mappings[key],
				[field]: value
			}
		}));
	}

	let visible = $state(false);
</script>

<div class="patch-bay-wrapper">
	<!-- Toggle button -->
	<button
		class="toggle-btn"
		class:active={visible}
		onclick={() => (visible = !visible)}
		title="Parameter Patch Bay"
	>
		🔌
	</button>

	{#if visible}
		<div class="patch-bay-panel">
			<div class="panel-header">
				<h3>Parameter Patch Bay</h3>
				<div class="tension-display">Tension: {$tension.toFixed(2)}</div>
			</div>

			<div class="patch-list">
				{#each Object.entries($patchMappings) as [key, mapping]}
					<div class="patch-item" class:enabled={mapping.enabled}>
						<div class="patch-header">
							<label class="patch-label" for="patch-{key}">
								<input
									id="patch-{key}"
									type="checkbox"
									checked={mapping.enabled}
									onchange={() => togglePatch(key)}
								/>
								<span>{key}</span>
							</label>
						</div>

						{#if mapping.enabled && mapping.target !== 'none'}
							<div class="patch-controls">
								<div class="range-control">
									<label for="min-{key}">Min: {mapping.min.toFixed(2)}</label>
									<input
										id="min-{key}"
										type="range"
										min="0"
										max={mapping.target === 'colorShift' ? '6.28' : '2'}
										step="0.01"
										value={mapping.min}
										oninput={(e) => updatePatchRange(key, 'min', parseFloat(e.currentTarget.value))}
									/>
								</div>
								<div class="range-control">
									<label for="max-{key}">Max: {mapping.max.toFixed(2)}</label>
									<input
										id="max-{key}"
										type="range"
										min="0"
										max={mapping.target === 'colorShift' ? '6.28' : '5'}
										step="0.01"
										value={mapping.max}
										oninput={(e) => updatePatchRange(key, 'max', parseFloat(e.currentTarget.value))}
									/>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.patch-bay-wrapper {
		position: fixed;
		bottom: 20px;
		right: 20px;
		z-index: 1000;
	}

	.toggle-btn {
		background: rgba(255, 255, 255, 0.06);
		backdrop-filter: blur(30px);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: rgba(255, 255, 255, 0.8);
		padding: 10px 14px;
		border-radius: 12px;
		cursor: pointer;
		font-size: 18px;
		transition: all 0.3s;
	}

	.toggle-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.25);
	}

	.toggle-btn.active {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(147, 197, 253, 0.5);
	}

	.patch-bay-panel {
		position: absolute;
		bottom: 60px;
		right: 0;
		background: rgba(255, 255, 255, 0.06);
		backdrop-filter: blur(30px);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 16px;
		padding: 20px;
		min-width: 320px;
		max-width: 400px;
		font-family: monospace;
		font-size: 12px;
		color: rgba(255, 255, 255, 0.95);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		padding-bottom: 12px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.panel-header h3 {
		margin: 0;
		font-size: 14px;
		font-weight: 600;
	}

	.tension-display {
		font-size: 11px;
		color: rgba(147, 197, 253, 0.95);
		font-weight: 600;
	}

	.patch-list {
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.patch-item {
		padding: 12px;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		transition: all 0.2s;
	}

	.patch-item.enabled {
		background: rgba(147, 197, 253, 0.1);
		border-color: rgba(147, 197, 253, 0.3);
	}

	.patch-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}

	.patch-label {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		font-weight: 500;
		text-transform: capitalize;
	}

	.patch-label input[type='checkbox'] {
		cursor: pointer;
	}

	.patch-controls {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 10px;
	}

	.range-control {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.range-control label {
		font-size: 10px;
		color: rgba(255, 255, 255, 0.7);
	}

	.range-control input[type='range'] {
		width: 100%;
		height: 4px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
		outline: none;
		appearance: none;
		cursor: pointer;
	}

	.range-control input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 16px;
		height: 16px;
		background: rgba(147, 197, 253, 0.9);
		border-radius: 50%;
		cursor: pointer;
	}

	.range-control input[type='range']::-moz-range-thumb {
		width: 16px;
		height: 16px;
		background: rgba(147, 197, 253, 0.9);
		border-radius: 50%;
		cursor: pointer;
		border: none;
	}
</style>
