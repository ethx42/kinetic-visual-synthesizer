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
		vectorFieldType,
		lorenzSigma,
		lorenzRho,
		lorenzBeta,
		aizawaA,
		aizawaB,
		aizawaC,
		aizawaD,
		aizawaE,
		aizawaF,
		roesslerA,
		roesslerB,
		roesslerC,
		chenA,
		chenB,
		chenC,
		thomasB,
		gravityGridSpacing,
		gravityGridStrength,
		gravityGridDecay,
		gravityGridOffsetX,
		gravityGridOffsetY,
		gravityGridOffsetZ,
		gravityGridDimensions,
		halvorsenAlpha,
		fourWingA,
		fourWingB,
		fourWingC,
		fourWingD,
		fourWingK
	} from '$lib/stores/settings';
	import { tension } from '$lib/stores/tension';

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
</script>

<div class="controls-container">
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

	<!-- Lorenz Attractor Parameters -->
	{#if $vectorFieldType >= 1.0 && $vectorFieldType < 1.5}
		<div class="control-group">
			<label for="lorenz-sigma">
				σ (Sigma): <span class="value">{$lorenzSigma.toFixed(2)}</span>
			</label>
			<input
				id="lorenz-sigma"
				type="range"
				min="5.0"
				max="20.0"
				step="0.1"
				bind:value={$lorenzSigma}
			/>
		</div>
		<div class="control-group">
			<label for="lorenz-rho">
				ρ (Rho): <span class="value">{$lorenzRho.toFixed(2)}</span>
			</label>
			<input
				id="lorenz-rho"
				type="range"
				min="10.0"
				max="50.0"
				step="0.1"
				bind:value={$lorenzRho}
			/>
		</div>
		<div class="control-group">
			<label for="lorenz-beta">
				β (Beta): <span class="value">{$lorenzBeta.toFixed(3)}</span>
			</label>
			<input
				id="lorenz-beta"
				type="range"
				min="1.0"
				max="5.0"
				step="0.01"
				bind:value={$lorenzBeta}
			/>
		</div>
	{/if}

	<!-- Aizawa Attractor Parameters -->
	{#if $vectorFieldType >= 2.0 && $vectorFieldType < 2.5}
		<div class="control-group">
			<label for="aizawa-a">
				a: <span class="value">{$aizawaA.toFixed(2)}</span>
			</label>
			<input id="aizawa-a" type="range" min="0.1" max="2.0" step="0.01" bind:value={$aizawaA} />
		</div>
		<div class="control-group">
			<label for="aizawa-b">
				b: <span class="value">{$aizawaB.toFixed(2)}</span>
			</label>
			<input id="aizawa-b" type="range" min="0.1" max="2.0" step="0.01" bind:value={$aizawaB} />
		</div>
		<div class="control-group">
			<label for="aizawa-c">
				c: <span class="value">{$aizawaC.toFixed(2)}</span>
			</label>
			<input id="aizawa-c" type="range" min="0.1" max="2.0" step="0.01" bind:value={$aizawaC} />
		</div>
		<div class="control-group">
			<label for="aizawa-d">
				d: <span class="value">{$aizawaD.toFixed(2)}</span>
			</label>
			<input id="aizawa-d" type="range" min="1.0" max="10.0" step="0.1" bind:value={$aizawaD} />
		</div>
		<div class="control-group">
			<label for="aizawa-e">
				e: <span class="value">{$aizawaE.toFixed(2)}</span>
			</label>
			<input id="aizawa-e" type="range" min="0.0" max="1.0" step="0.01" bind:value={$aizawaE} />
		</div>
		<div class="control-group">
			<label for="aizawa-f">
				f: <span class="value">{$aizawaF.toFixed(2)}</span>
			</label>
			<input id="aizawa-f" type="range" min="0.0" max="1.0" step="0.01" bind:value={$aizawaF} />
		</div>
	{/if}

	<!-- Rössler Attractor Parameters -->
	{#if $vectorFieldType >= 3.0 && $vectorFieldType < 3.5}
		<div class="control-group">
			<label for="roessler-a">
				a: <span class="value">{$roesslerA.toFixed(2)}</span>
			</label>
			<input id="roessler-a" type="range" min="0.1" max="1.0" step="0.01" bind:value={$roesslerA} />
		</div>
		<div class="control-group">
			<label for="roessler-b">
				b: <span class="value">{$roesslerB.toFixed(2)}</span>
			</label>
			<input id="roessler-b" type="range" min="0.1" max="1.0" step="0.01" bind:value={$roesslerB} />
		</div>
		<div class="control-group">
			<label for="roessler-c">
				c: <span class="value">{$roesslerC.toFixed(2)}</span>
			</label>
			<input id="roessler-c" type="range" min="2.0" max="12.0" step="0.1" bind:value={$roesslerC} />
		</div>
	{/if}

	<!-- Chen Attractor Parameters -->
	{#if $vectorFieldType >= 4.0 && $vectorFieldType < 4.5}
		<div class="control-group">
			<label for="chen-a">
				a: <span class="value">{$chenA.toFixed(1)}</span>
			</label>
			<input id="chen-a" type="range" min="20.0" max="50.0" step="0.5" bind:value={$chenA} />
		</div>
		<div class="control-group">
			<label for="chen-b">
				b: <span class="value">{$chenB.toFixed(1)}</span>
			</label>
			<input id="chen-b" type="range" min="1.0" max="10.0" step="0.1" bind:value={$chenB} />
		</div>
		<div class="control-group">
			<label for="chen-c">
				c: <span class="value">{$chenC.toFixed(1)}</span>
			</label>
			<input id="chen-c" type="range" min="20.0" max="40.0" step="0.5" bind:value={$chenC} />
		</div>
	{/if}

	<!-- Thomas Attractor Parameter -->
	{#if $vectorFieldType >= 5.0 && $vectorFieldType < 5.5}
		<div class="control-group">
			<label for="thomas-b">
				b (Dissipation): <span class="value">{$thomasB.toFixed(3)}</span>
			</label>
			<input id="thomas-b" type="range" min="0.05" max="0.5" step="0.001" bind:value={$thomasB} />
		</div>
	{/if}

	<!-- Gravity Grid Parameters -->
	{#if $vectorFieldType >= 6.0}
		<div class="control-group">
			<label for="gravity-grid-spacing">
				Grid Spacing: <span class="value">{$gravityGridSpacing.toFixed(2)}</span>
			</label>
			<input
				id="gravity-grid-spacing"
				type="range"
				min="0.5"
				max="10.0"
				step="0.1"
				bind:value={$gravityGridSpacing}
			/>
		</div>
		<div class="control-group">
			<label for="gravity-grid-strength">
				Grid Strength: <span class="value">{$gravityGridStrength.toFixed(2)}</span>
			</label>
			<input
				id="gravity-grid-strength"
				type="range"
				min="0.1"
				max="20.0"
				step="0.1"
				bind:value={$gravityGridStrength}
			/>
		</div>
		<div class="control-group">
			<label for="gravity-grid-decay">
				Decay Exponent: <span class="value">{$gravityGridDecay.toFixed(2)}</span>
			</label>
			<input
				id="gravity-grid-decay"
				type="range"
				min="1.0"
				max="4.0"
				step="0.1"
				bind:value={$gravityGridDecay}
			/>
		</div>
		<div class="control-group">
			<label for="gravity-grid-offset-x">
				Offset X: <span class="value">{$gravityGridOffsetX.toFixed(2)}</span>
			</label>
			<input
				id="gravity-grid-offset-x"
				type="range"
				min="-10.0"
				max="10.0"
				step="0.1"
				bind:value={$gravityGridOffsetX}
			/>
		</div>
		<div class="control-group">
			<label for="gravity-grid-offset-y">
				Offset Y: <span class="value">{$gravityGridOffsetY.toFixed(2)}</span>
			</label>
			<input
				id="gravity-grid-offset-y"
				type="range"
				min="-10.0"
				max="10.0"
				step="0.1"
				bind:value={$gravityGridOffsetY}
			/>
		</div>
		<div class="control-group">
			<label for="gravity-grid-offset-z">
				Offset Z: <span class="value">{$gravityGridOffsetZ.toFixed(2)}</span>
			</label>
			<input
				id="gravity-grid-offset-z"
				type="range"
				min="-10.0"
				max="10.0"
				step="0.1"
				bind:value={$gravityGridOffsetZ}
			/>
		</div>
		<div class="control-group">
			<label for="gravity-grid-dimensions">
				Grid Dimensions: <span class="value">{$gravityGridDimensions.toFixed(1)}</span>
			</label>
			<input
				id="gravity-grid-dimensions"
				type="range"
				min="5.0"
				max="20.0"
				step="0.5"
				bind:value={$gravityGridDimensions}
			/>
		</div>
	{/if}

	<!-- Halvorsen Attractor Parameter -->
	{#if $vectorFieldType >= 7.0 && $vectorFieldType < 7.5}
		<div class="control-group">
			<label for="halvorsen-alpha">
				α (Alpha): <span class="value">{$halvorsenAlpha.toFixed(2)}</span>
			</label>
			<input
				id="halvorsen-alpha"
				type="range"
				min="0.5"
				max="3.0"
				step="0.01"
				bind:value={$halvorsenAlpha}
			/>
		</div>
	{/if}

	<!-- Four-Wing Attractor Parameters -->
	{#if $vectorFieldType >= 8.0}
		<div class="control-group">
			<label for="four-wing-a">
				a: <span class="value">{$fourWingA.toFixed(1)}</span>
			</label>
			<input
				id="four-wing-a"
				type="range"
				min="1.0"
				max="10.0"
				step="0.1"
				bind:value={$fourWingA}
			/>
		</div>
		<div class="control-group">
			<label for="four-wing-b">
				b: <span class="value">{$fourWingB.toFixed(1)}</span>
			</label>
			<input
				id="four-wing-b"
				type="range"
				min="1.0"
				max="10.0"
				step="0.1"
				bind:value={$fourWingB}
			/>
		</div>
		<div class="control-group">
			<label for="four-wing-c">
				c: <span class="value">{$fourWingC.toFixed(1)}</span>
			</label>
			<input
				id="four-wing-c"
				type="range"
				min="1.0"
				max="20.0"
				step="0.1"
				bind:value={$fourWingC}
			/>
		</div>
		<div class="control-group">
			<label for="four-wing-d">
				d: <span class="value">{$fourWingD.toFixed(1)}</span>
			</label>
			<input
				id="four-wing-d"
				type="range"
				min="1.0"
				max="10.0"
				step="0.1"
				bind:value={$fourWingD}
			/>
		</div>
		<div class="control-group">
			<label for="four-wing-k">
				k: <span class="value">{$fourWingK.toFixed(1)}</span>
			</label>
			<input
				id="four-wing-k"
				type="range"
				min="-5.0"
				max="5.0"
				step="0.1"
				bind:value={$fourWingK}
			/>
		</div>
	{/if}

	<div class="control-group">
		<label for="entropy">
			Entropy: <span class="value">{$tension.toFixed(2)}</span>
		</label>
		<input id="entropy" type="range" min="0" max="1" step="0.01" bind:value={$tension} />
	</div>
</div>

<style>
	.controls-container {
		display: flex;
		flex-direction: column;
		gap: 4px;
		height: 100%;
		overflow: hidden;
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex-shrink: 0;
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
