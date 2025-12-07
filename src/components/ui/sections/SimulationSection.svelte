<script lang="ts">
	/**
	 * SimulationSection Component
	 * Controls for simulation parameters (noise, attractors, entropy)
	 */
	import {
		noiseScale,
		noiseSpeed,
		noiseStrength,
		attractorStrength,
		damping,
		vectorFieldType
	} from '$lib/stores/settings';
	import { tension } from '$lib/stores/tension';

	const fieldTypeOptions = [
		{ value: 0, label: 'Curl Noise' },
		{ value: 1, label: 'Lorenz Attractor' },
		{ value: 2, label: 'Aizawa Attractor' }
	];
</script>

<div class="control-group">
	<label for="field-type">Vector Field Type</label>
	<select id="field-type" bind:value={$vectorFieldType}>
		{#each fieldTypeOptions as option}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
</div>

{#if $vectorFieldType < 0.5}
	<div class="control-group">
		<label for="noise-scale">
			Noise Scale: <span class="value">{$noiseScale.toFixed(2)}</span>
		</label>
		<input id="noise-scale" type="range" min="0.1" max="2.0" step="0.05" bind:value={$noiseScale} />
	</div>

	<div class="control-group">
		<label for="noise-speed">
			Noise Speed: <span class="value">{$noiseSpeed.toFixed(2)}</span>
		</label>
		<input id="noise-speed" type="range" min="0.0" max="1.0" step="0.01" bind:value={$noiseSpeed} />
	</div>

	<div class="control-group">
		<label for="noise-strength">
			Noise Strength: <span class="value">{$noiseStrength.toFixed(1)}</span>
		</label>
		<input
			id="noise-strength"
			type="range"
			min="1.0"
			max="20.0"
			step="0.5"
			bind:value={$noiseStrength}
		/>
	</div>

	<div class="control-group">
		<label for="damping">
			Damping: <span class="value">{$damping.toFixed(3)}</span>
		</label>
		<input id="damping" type="range" min="0.90" max="0.999" step="0.001" bind:value={$damping} />
	</div>
{/if}

{#if $vectorFieldType >= 0.5}
	<div class="control-group">
		<label for="attractor-strength">
			Attractor Strength: <span class="value">{$attractorStrength.toFixed(2)}</span>
		</label>
		<input
			id="attractor-strength"
			type="range"
			min="0.1"
			max="5.0"
			step="0.1"
			bind:value={$attractorStrength}
		/>
	</div>
{/if}

<div class="control-group">
	<label for="entropy">
		Entropy: <span class="value">{$tension.toFixed(2)}</span>
	</label>
	<input id="entropy" type="range" min="0" max="1" step="0.01" bind:value={$tension} />
</div>

<style>
	.control-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.control-group label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 11px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.85);
		letter-spacing: -0.2px;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
	}

	.control-group .value {
		color: rgba(147, 197, 253, 0.95);
		font-weight: 600;
		font-size: 11px;
		font-variant-numeric: tabular-nums;
	}

	input[type='range'] {
		width: 100%;
		height: 6px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
		outline: none;
		appearance: none;
		-webkit-appearance: none;
		cursor: pointer;
		transition: background 0.2s;
	}

	input[type='range']:hover {
		background: rgba(255, 255, 255, 0.15);
	}

	input[type='range']::-webkit-slider-thumb {
		appearance: none;
		-webkit-appearance: none;
		width: 18px;
		height: 18px;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.8));
		border-radius: 50%;
		cursor: pointer;
		border: 2px solid rgba(255, 255, 255, 0.3);
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.3),
			0 0 0 4px rgba(147, 197, 253, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.5);
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	input[type='range']::-webkit-slider-thumb:hover {
		transform: scale(1.15);
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.4),
			0 0 0 6px rgba(147, 197, 253, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.6);
		border-color: rgba(255, 255, 255, 0.4);
	}

	input[type='range']::-moz-range-thumb {
		width: 18px;
		height: 18px;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.8));
		border-radius: 50%;
		cursor: pointer;
		border: 2px solid rgba(255, 255, 255, 0.3);
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.3),
			0 0 0 4px rgba(147, 197, 253, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.5);
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	input[type='range']::-moz-range-track {
		height: 6px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
	}

	select {
		background: rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: rgba(255, 255, 255, 0.95);
		padding: 6px 10px;
		border-radius: 6px;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
		font-size: 11px;
		font-weight: 500;
		cursor: pointer;
		outline: none;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		width: 100%;
	}

	select:hover {
		background: rgba(255, 255, 255, 0.12);
		border-color: rgba(255, 255, 255, 0.2);
	}

	select:focus {
		border-color: rgba(147, 197, 253, 0.5);
		box-shadow: 0 0 0 3px rgba(147, 197, 253, 0.2);
	}

	select option {
		background: rgba(20, 20, 25, 0.95);
		color: rgba(255, 255, 255, 0.95);
		padding: 8px;
	}
</style>
