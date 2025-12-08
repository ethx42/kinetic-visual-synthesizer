<script lang="ts">
	/**
	 * CalibrationSection Component
	 * Hand tracking calibration controls
	 */
	import { calibration, rawTension, normalizedDistance } from '$lib/stores/calibration';
	import { tension } from '$lib/stores/tension';
	import { useCalibration, type CalibrationState } from '$lib/ui/composables/useCalibration';

	let calibrationState: CalibrationState = $state({
		isCalibrating: false,
		openHandValue: 0.0,
		closedHandValue: 0.0
	});

	const calibrationLogic = useCalibration();
</script>

<div class="calibration-container">
	<div class="metrics-group">
		<div class="metric-row">
			<span class="metric-label">Norm Dist:</span>
			<span class="metric-value">{$normalizedDistance.toFixed(3)}</span>
		</div>
		<div class="metric-row">
			<span class="metric-label">Raw:</span>
			<span class="metric-value">{$rawTension.toFixed(3)}</span>
		</div>
		<div class="metric-row">
			<span class="metric-label">Smooth:</span>
			<span class="metric-value highlight">{$tension.toFixed(3)}</span>
		</div>
	</div>

	<div class="controls-group">
		<div class="control-group">
			<label for="smoothstep-min">
				Smoothstep Min: <span class="value">{$calibration.smoothstepMin.toFixed(3)}</span>
			</label>
			<input
				id="smoothstep-min"
				type="range"
				min="0"
				max="2"
				step="0.01"
				value={$calibration.smoothstepMin}
				oninput={(e) => {
					const newValue = parseFloat(e.currentTarget.value);
					calibration.set({
						smoothstepMin: newValue,
						smoothstepMax: $calibration.smoothstepMax,
						smoothingAlpha: $calibration.smoothingAlpha,
						calibrationMode: $calibration.calibrationMode
					});
				}}
			/>
		</div>

		<div class="control-group">
			<label for="smoothstep-max">
				Smoothstep Max: <span class="value">{$calibration.smoothstepMax.toFixed(3)}</span>
			</label>
			<input
				id="smoothstep-max"
				type="range"
				min="0"
				max="3"
				step="0.01"
				value={$calibration.smoothstepMax}
				oninput={(e) => {
					const newValue = parseFloat(e.currentTarget.value);
					calibration.set({
						smoothstepMin: $calibration.smoothstepMin,
						smoothstepMax: newValue,
						smoothingAlpha: $calibration.smoothingAlpha,
						calibrationMode: $calibration.calibrationMode
					});
				}}
			/>
		</div>

		<div class="control-group">
			<label for="smoothing-alpha">
				Smoothing Alpha: <span class="value">{$calibration.smoothingAlpha.toFixed(2)}</span>
			</label>
			<input
				id="smoothing-alpha"
				type="range"
				min="0"
				max="1"
				step="0.01"
				value={$calibration.smoothingAlpha}
				oninput={(e) => {
					const newValue = parseFloat(e.currentTarget.value);
					calibration.set({
						smoothstepMin: $calibration.smoothstepMin,
						smoothstepMax: $calibration.smoothstepMax,
						smoothingAlpha: newValue,
						calibrationMode: $calibration.calibrationMode
					});
				}}
			/>
		</div>
	</div>

	<div class="buttons-group">
		{#if !calibrationState.isCalibrating}
			<button
				class="btn-primary"
				onclick={() => calibrationLogic.startCalibration(calibrationState)}
			>
				Start Auto Calibration
			</button>
		{:else}
			<div class="calibration-steps">
				<button
					class="btn-secondary"
					onclick={() => calibrationLogic.captureOpenHand(calibrationState)}
				>
					1. Capture Open Hand
				</button>
				{#if calibrationState.openHandValue > 0}
					<span class="step-value">Captured: {calibrationState.openHandValue.toFixed(3)}</span>
				{/if}
				<button
					class="btn-secondary"
					onclick={() => calibrationLogic.captureClosedHand(calibrationState)}
				>
					2. Capture Closed Hand
				</button>
				{#if calibrationState.closedHandValue > 0}
					<span class="step-value">Captured: {calibrationState.closedHandValue.toFixed(3)}</span>
				{/if}
				<button
					class="btn-primary"
					onclick={() => calibrationLogic.applyCalibration(calibrationState)}
					disabled={calibrationState.openHandValue === 0 || calibrationState.closedHandValue === 0}
				>
					3. Apply
				</button>
				<button
					class="btn-secondary"
					onclick={() => calibrationLogic.cancelCalibration(calibrationState)}
				>
					Cancel
				</button>
			</div>
		{/if}

		<button
			class="btn-secondary"
			onclick={() => calibrationLogic.resetCalibration(calibrationState)}
		>
			Reset to Defaults
		</button>
	</div>
</div>

<style>
	.calibration-container {
		display: flex;
		flex-direction: column;
		gap: 4px;
		height: 100%;
		overflow: hidden;
	}

	.metrics-group {
		display: flex;
		flex-direction: column;
		gap: 3px;
		flex-shrink: 0;
	}

	.metric-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 9px;
		font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
	}

	.metric-label {
		color: rgba(255, 255, 255, 0.6);
		letter-spacing: 0.5px;
	}

	.metric-value {
		color: rgba(255, 255, 255, 0.9);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.metric-value.highlight {
		color: #69db7c;
		font-size: 12px;
	}

	.controls-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		overflow-x: hidden;
		scrollbar-width: thin;
		scrollbar-color: rgba(147, 197, 253, 0.2) transparent;
	}

	.buttons-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex-shrink: 0;
		margin-top: 4px;
	}

	.controls-group::-webkit-scrollbar {
		width: 4px;
	}

	.controls-group::-webkit-scrollbar-track {
		background: transparent;
	}

	.controls-group::-webkit-scrollbar-thumb {
		background: rgba(147, 197, 253, 0.2);
		border-radius: 2px;
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

	.btn-primary {
		padding: 5px 8px;
		background: rgba(147, 197, 253, 0.2);
		border: 1px solid rgba(147, 197, 253, 0.4);
		color: rgba(255, 255, 255, 0.9);
		border-radius: 6px;
		cursor: pointer;
		font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
		font-size: 9px;
		font-weight: 600;
		transition: all 0.2s;
		width: 100%;
		margin-bottom: 4px;
	}

	.btn-primary:hover:not(:disabled) {
		background: rgba(147, 197, 253, 0.3);
		border-color: rgba(147, 197, 253, 0.6);
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-secondary {
		padding: 4px 6px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.9);
		border-radius: 6px;
		cursor: pointer;
		font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
		font-size: 8px;
		transition: all 0.2s;
		width: 100%;
		margin-bottom: 4px;
	}

	.btn-secondary:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.2);
	}

	.calibration-steps {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-bottom: 4px;
	}

	.step-value {
		font-size: 9px;
		color: rgba(147, 197, 253, 0.8);
		margin-left: 8px;
		font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
	}
</style>
