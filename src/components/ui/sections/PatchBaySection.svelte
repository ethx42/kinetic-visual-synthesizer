<script lang="ts">
	/**
	 * PatchBaySection Component
	 * Parameter patch bay for mapping tension to multiple parameters
	 */
	import { patchMappings } from '$lib/stores/settings';
	import { tension } from '$lib/stores/tension';
	import { usePatchBay, updatePatchBayValues } from '$lib/ui/composables/usePatchBay';

	const { togglePatch, updatePatchRange } = usePatchBay();

	// Update patch bay values reactively
	$effect(() => {
		updatePatchBayValues();
	});
</script>

<div class="tension-display-small">
	Tension: <span class="value">{$tension.toFixed(2)}</span>
</div>

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

<style>
	.tension-display-small {
		font-size: 10px;
		color: rgba(255, 255, 255, 0.7);
		margin-bottom: 8px;
		font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
	}

	.tension-display-small .value {
		color: rgba(147, 197, 253, 0.95);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.patch-item {
		padding: 10px;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 6px;
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
		margin-bottom: 8px;
	}

	.patch-label {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		font-weight: 500;
		text-transform: capitalize;
		font-size: 10px;
		font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
		color: rgba(255, 255, 255, 0.85);
	}

	.patch-label input[type='checkbox'] {
		cursor: pointer;
		accent-color: rgba(147, 197, 253, 0.9);
	}

	.patch-controls {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 8px;
	}

	.range-control {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.range-control label {
		font-size: 9px;
		color: rgba(255, 255, 255, 0.7);
		font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
	}

	.range-control input[type='range'] {
		height: 4px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
	}

	.range-control input[type='range']::-webkit-slider-thumb {
		width: 14px;
		height: 14px;
		background: rgba(147, 197, 253, 0.9);
		border: none;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.range-control input[type='range']::-moz-range-thumb {
		width: 14px;
		height: 14px;
		background: rgba(147, 197, 253, 0.9);
		border: none;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}
</style>
