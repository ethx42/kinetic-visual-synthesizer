<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		noiseScale,
		noiseSpeed,
		noiseStrength,
		attractorStrength,
		damping,
		vectorFieldType
	} from '$lib/stores/settings';
	import { tension } from '$lib/stores/tension';

	let visible = $state(true);
	let wrapperElement: HTMLDivElement;
	let panelElement: HTMLDivElement;

	const fieldTypeOptions = [
		{ value: 0, label: 'Curl Noise' },
		{ value: 1, label: 'Lorenz Attractor' },
		{ value: 2, label: 'Aizawa Attractor' }
	];

	function handleClickOutside(event: MouseEvent) {
		if (!visible) return;

		const target = event.target as Node;
		// Check if click is outside both the wrapper and the panel
		if (
			wrapperElement &&
			!wrapperElement.contains(target) &&
			panelElement &&
			!panelElement.contains(target)
		) {
			visible = false;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
	});

	onDestroy(() => {
		document.removeEventListener('click', handleClickOutside);
	});
</script>

<div class="controls-wrapper" bind:this={wrapperElement}>
	<!-- Toggle button - always visible -->
	<button
		class="toggle-btn-float"
		class:panel-open={visible}
		onclick={(e) => {
			e.stopPropagation();
			visible = !visible;
		}}
		title="Toggle Controls"
	>
		<span class="icon">{visible ? '▼' : '▲'}</span>
	</button>

	{#if visible}
		<div class="controls-container" bind:this={panelElement} onclick={(e) => e.stopPropagation()}>
			<div class="controls-header">
				<h3>Simulation Controls</h3>
			</div>

			<div class="controls-content">
				<!-- Field Type Selector -->
				<div class="control-group">
					<label for="field-type">Vector Field Type</label>
					<select id="field-type" bind:value={$vectorFieldType}>
						{#each fieldTypeOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				<!-- Noise Parameters -->
				{#if $vectorFieldType < 0.5}
					<div class="control-group">
						<label for="noise-scale">
							Noise Scale: <span class="value">{$noiseScale.toFixed(2)}</span>
						</label>
						<input
							id="noise-scale"
							type="range"
							min="0.1"
							max="2.0"
							step="0.05"
							bind:value={$noiseScale}
						/>
					</div>

					<div class="control-group">
						<label for="noise-speed">
							Noise Speed: <span class="value">{$noiseSpeed.toFixed(2)}</span>
						</label>
						<input
							id="noise-speed"
							type="range"
							min="0.0"
							max="1.0"
							step="0.01"
							bind:value={$noiseSpeed}
						/>
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
						<input
							id="damping"
							type="range"
							min="0.90"
							max="0.999"
							step="0.001"
							bind:value={$damping}
						/>
					</div>
				{/if}

				<!-- Attractor Parameters -->
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

				<!-- Entropy Control (for testing) -->
				<div class="control-group">
					<label for="entropy">
						Entropy: <span class="value">{$tension.toFixed(2)}</span>
					</label>
					<input id="entropy" type="range" min="0" max="1" step="0.01" bind:value={$tension} />
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.controls-wrapper {
		position: fixed;
		top: 20px;
		right: 20px;
		z-index: 1000;
	}

	.toggle-btn-float {
		position: absolute;
		top: 0;
		right: 0;
		/* Liquid Glass Effect - More transparent when closed */
		background: rgba(255, 255, 255, 0.04);
		backdrop-filter: blur(30px) saturate(180%);
		-webkit-backdrop-filter: blur(30px) saturate(180%);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.6);
		padding: 10px 14px;
		cursor: pointer;
		font-size: 14px;
		border-radius: 12px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
		min-width: 44px;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.toggle-btn-float:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.15);
		color: rgba(255, 255, 255, 0.75);
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
		transform: translateY(-1px);
	}

	/* When panel is open, match panel's glassmorphism */
	.toggle-btn-float.panel-open {
		background: rgba(255, 255, 255, 0.06);
		backdrop-filter: blur(30px) saturate(180%);
		-webkit-backdrop-filter: blur(30px) saturate(180%);
		border: 1px solid rgba(255, 255, 255, 0.15);
		color: rgba(255, 255, 255, 0.85);
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
	}

	.toggle-btn-float.panel-open:hover {
		background: rgba(255, 255, 255, 0.09);
		border-color: rgba(255, 255, 255, 0.2);
		color: rgba(255, 255, 255, 0.95);
		box-shadow:
			0 10px 40px rgba(0, 0, 0, 0.35),
			inset 0 1px 0 rgba(255, 255, 255, 0.12);
	}

	.toggle-btn-float .icon {
		display: block;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		font-size: 12px;
		opacity: 0.7;
	}

	.toggle-btn-float:hover .icon {
		transform: scale(1.15);
		opacity: 0.9;
	}

	.toggle-btn-float.panel-open .icon {
		opacity: 0.85;
	}

	.toggle-btn-float.panel-open:hover .icon {
		opacity: 1;
	}

	.controls-container {
		position: absolute;
		top: 60px;
		right: 0;
		/* Liquid Glass Effect */
		background: rgba(255, 255, 255, 0.06);
		backdrop-filter: blur(30px) saturate(180%);
		-webkit-backdrop-filter: blur(30px) saturate(180%);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 16px;
		padding: 20px;
		min-width: 300px;
		max-width: 340px;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
		font-size: 13px;
		color: rgba(255, 255, 255, 0.95);
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
		animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.controls-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		padding-bottom: 12px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.controls-header h3 {
		margin: 0;
		font-size: 15px;
		font-weight: 600;
		letter-spacing: -0.3px;
		color: rgba(255, 255, 255, 0.95);
	}

	.controls-content {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.control-group label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 12px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.85);
		letter-spacing: -0.2px;
	}

	.value {
		color: rgba(147, 197, 253, 0.95);
		font-weight: 600;
		font-size: 12px;
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
		width: 20px;
		height: 20px;
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

	input[type='range']::-webkit-slider-thumb:active {
		transform: scale(1.1);
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.3),
			0 0 0 5px rgba(147, 197, 253, 0.25),
			inset 0 1px 0 rgba(255, 255, 255, 0.5);
	}

	input[type='range']::-moz-range-thumb {
		width: 20px;
		height: 20px;
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

	input[type='range']::-moz-range-thumb:hover {
		transform: scale(1.15);
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.4),
			0 0 0 6px rgba(147, 197, 253, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.6);
		border-color: rgba(255, 255, 255, 0.4);
	}

	input[type='range']::-moz-range-thumb:active {
		transform: scale(1.1);
		box-shadow:
			0 2px 6px rgba(0, 0, 0, 0.3),
			0 0 0 5px rgba(147, 197, 253, 0.25),
			inset 0 1px 0 rgba(255, 255, 255, 0.5);
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
		padding: 8px 12px;
		border-radius: 8px;
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		outline: none;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.05);
	}

	select:hover {
		background: rgba(255, 255, 255, 0.12);
		border-color: rgba(255, 255, 255, 0.2);
		box-shadow:
			0 4px 12px rgba(0, 0, 0, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
	}

	select:focus {
		border-color: rgba(147, 197, 253, 0.5);
		box-shadow:
			0 0 0 3px rgba(147, 197, 253, 0.2),
			0 4px 12px rgba(0, 0, 0, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.08);
	}

	select option {
		background: rgba(20, 20, 25, 0.95);
		color: rgba(255, 255, 255, 0.95);
		padding: 8px;
	}
</style>
