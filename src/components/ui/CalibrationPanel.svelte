<script lang="ts">
	/**
	 * Calibration Panel
	 * Allows users to calibrate hand tracking thresholds for better accuracy
	 */
	import { calibration, rawTension, normalizedDistance } from '$lib/stores/calibration';
	import { tension } from '$lib/stores/tension';

	let visible = $state(false);
	let isCalibrating = $state(false);
	let openHandValue = $state(0.0);
	let closedHandValue = $state(0.0);

	// Toggle with 'C' key
	function handleKeyPress(e: KeyboardEvent) {
		if (e.key === 'c' || e.key === 'C') {
			visible = !visible;
		}
	}

	$effect(() => {
		window.addEventListener('keypress', handleKeyPress);
		return () => window.removeEventListener('keypress', handleKeyPress);
	});

	function startCalibration() {
		isCalibrating = true;
		openHandValue = 0.0;
		closedHandValue = 0.0;
	}

	function captureOpenHand() {
		openHandValue = $normalizedDistance;
	}

	function captureClosedHand() {
		closedHandValue = $normalizedDistance;
	}

	function applyCalibration() {
		if (openHandValue > 0 && closedHandValue > 0 && closedHandValue > openHandValue) {
			// Add 20% margin on each side for better range
			const margin = (closedHandValue - openHandValue) * 0.2;
			calibration.set({
				...$calibration,
				smoothstepMin: Math.max(0, openHandValue - margin),
				smoothstepMax: closedHandValue + margin
			});
			isCalibrating = false;
			alert('Calibration applied! Press C to reopen if needed.');
		} else {
			alert('Please capture both open and closed hand positions first.');
		}
	}

	function resetCalibration() {
		calibration.set({
			smoothstepMin: 0.3,
			smoothstepMax: 1.5,
			smoothingAlpha: 0.2,
			calibrationMode: false
		});
		isCalibrating = false;
	}
</script>

{#if visible}
	<div class="calibration-panel">
		<div class="panel-header">
			<h3>Hand Tracking Calibration</h3>
			<button class="close-btn" onclick={() => (visible = false)}>X</button>
		</div>

		<div class="panel-content">
			<!-- Current Values -->
			<section class="section">
				<h4>Current Values</h4>
				<div class="metric">
					<span class="label">Normalized Distance:</span>
					<span class="value">{$normalizedDistance.toFixed(3)}</span>
				</div>
				<div class="metric">
					<span class="label">Raw Tension:</span>
					<span class="value">{$rawTension.toFixed(3)}</span>
				</div>
				<div class="metric">
					<span class="label">Smoothed Tension:</span>
					<span class="value highlight">{$tension.toFixed(3)}</span>
				</div>
			</section>

			<!-- Calibration Settings -->
			<section class="section">
				<h4>Calibration Settings</h4>
				<div class="metric">
					<span class="label">Smoothstep Min:</span>
					<span class="value">{$calibration.smoothstepMin.toFixed(3)}</span>
				</div>
				<div class="metric">
					<span class="label">Smoothstep Max:</span>
					<span class="value">{$calibration.smoothstepMax.toFixed(3)}</span>
				</div>
				<div class="metric">
					<span class="label">Smoothing Alpha:</span>
					<span class="value">{$calibration.smoothingAlpha.toFixed(2)}</span>
				</div>

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
					<div class="help-text">Lower = more responsive, Higher = more stable (default: 0.2)</div>
				</div>
			</section>

			<!-- Auto Calibration -->
			{#if !isCalibrating}
				<section class="section">
					<h4>Auto Calibration</h4>
					<p class="help-text">
						Automatically calibrate by capturing your open and closed hand positions.
					</p>
					<button class="calibrate-btn" onclick={startCalibration}>Start Calibration</button>
				</section>
			{:else}
				<section class="section calibrating">
					<h4>Calibrating...</h4>
					<div class="calibration-steps">
						<div class="step">
							<button class="step-btn" onclick={captureOpenHand}>1. Capture Open Hand</button>
							{#if openHandValue > 0}
								<span class="step-value">Captured: {openHandValue.toFixed(3)}</span>
							{/if}
						</div>
						<div class="step">
							<button class="step-btn" onclick={captureClosedHand}>2. Capture Closed Hand</button>
							{#if closedHandValue > 0}
								<span class="step-value">Captured: {closedHandValue.toFixed(3)}</span>
							{/if}
						</div>
						<div class="step">
							<button
								class="step-btn primary"
								onclick={applyCalibration}
								disabled={openHandValue === 0 || closedHandValue === 0}
							>
								3. Apply Calibration
							</button>
						</div>
					</div>
					<button class="cancel-btn" onclick={() => (isCalibrating = false)}>Cancel</button>
				</section>
			{/if}

			<!-- Reset -->
			<section class="section">
				<button class="reset-btn" onclick={resetCalibration}>Reset to Defaults</button>
			</section>

			<!-- Instructions -->
			<section class="section instructions">
				<h4>Instructions</h4>
				<ul>
					<li>Press 'C' to show/hide this panel</li>
					<li>Adjust sliders manually or use Auto Calibration</li>
					<li>Lower Smoothstep Min = more sensitive to open hand</li>
					<li>Higher Smoothstep Max = more sensitive to closed hand</li>
					<li>Lower Smoothing Alpha = more responsive (may be jittery)</li>
				</ul>
			</section>
		</div>
	</div>
{/if}

<style>
	.calibration-panel {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 90%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
		z-index: 2000;
		background: rgba(10, 10, 10, 0.95);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 16px;
		font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
		color: rgba(255, 255, 255, 0.9);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.panel-header h3 {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
	}

	.close-btn {
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.7);
		font-size: 20px;
		cursor: pointer;
		padding: 5px 10px;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.close-btn:hover {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 1);
	}

	.panel-content {
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.section {
		padding: 15px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	.section h4 {
		margin: 0 0 15px 0;
		font-size: 14px;
		font-weight: 600;
		color: rgba(147, 197, 253, 0.9);
	}

	.metric {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
		font-size: 12px;
	}

	.metric .label {
		color: rgba(255, 255, 255, 0.7);
	}

	.metric .value {
		color: rgba(255, 255, 255, 0.9);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.metric .value.highlight {
		color: #69db7c;
		font-size: 14px;
	}

	.control-group {
		margin-top: 15px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.control-group label {
		font-size: 11px;
		color: rgba(255, 255, 255, 0.8);
	}

	.control-group input[type='range'] {
		width: 100%;
		height: 6px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
		outline: none;
		appearance: none;
		cursor: pointer;
	}

	.control-group input[type='range']::-webkit-slider-thumb {
		appearance: none;
		width: 16px;
		height: 16px;
		background: rgba(147, 197, 253, 0.9);
		border-radius: 50%;
		cursor: pointer;
	}

	.help-text {
		font-size: 10px;
		color: rgba(255, 255, 255, 0.5);
		margin-top: 5px;
	}

	.calibrate-btn,
	.reset-btn {
		width: 100%;
		padding: 10px;
		background: rgba(147, 197, 253, 0.2);
		border: 1px solid rgba(147, 197, 253, 0.4);
		color: rgba(255, 255, 255, 0.9);
		border-radius: 6px;
		cursor: pointer;
		font-family: inherit;
		font-size: 12px;
		font-weight: 600;
		transition: all 0.2s;
	}

	.calibrate-btn:hover,
	.reset-btn:hover {
		background: rgba(147, 197, 253, 0.3);
		border-color: rgba(147, 197, 253, 0.6);
	}

	.calibrating {
		background: rgba(147, 197, 253, 0.05);
		border-color: rgba(147, 197, 253, 0.2);
	}

	.calibration-steps {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-bottom: 15px;
	}

	.step {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.step-btn {
		padding: 8px 12px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.9);
		border-radius: 6px;
		cursor: pointer;
		font-family: inherit;
		font-size: 11px;
		transition: all 0.2s;
	}

	.step-btn:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.2);
	}

	.step-btn.primary {
		background: rgba(147, 197, 253, 0.2);
		border-color: rgba(147, 197, 253, 0.4);
	}

	.step-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.step-value {
		font-size: 10px;
		color: rgba(147, 197, 253, 0.8);
		margin-left: 10px;
	}

	.cancel-btn {
		width: 100%;
		padding: 8px;
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: rgba(255, 255, 255, 0.7);
		border-radius: 6px;
		cursor: pointer;
		font-family: inherit;
		font-size: 11px;
	}

	.cancel-btn:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.instructions {
		background: rgba(147, 197, 253, 0.05);
		border-color: rgba(147, 197, 253, 0.2);
	}

	.instructions ul {
		margin: 0;
		padding-left: 20px;
		font-size: 11px;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.7);
	}

	.instructions li {
		margin-bottom: 8px;
	}
</style>
