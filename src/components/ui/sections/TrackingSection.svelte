<script lang="ts">
	/**
	 * TrackingSection Component
	 * Displays hand tracking status and controls
	 */
	import { handTracking } from '$lib/stores/handTracking';
	import { tension } from '$lib/stores/tension';
	import { cameraEnabled } from '$lib/stores/settings';
</script>

<div class="control-row">
	<label class="toggle-label">
		<input
			type="checkbox"
			checked={$cameraEnabled}
			onchange={(e) => cameraEnabled.set(e.currentTarget.checked)}
		/>
		<span>CAMERA</span>
	</label>
</div>

<div class="status-row">
	<div class="status-indicator" class:active={$handTracking.isTracking}></div>
	<span class="status-text">{$handTracking.isTracking ? 'ACTIVE' : 'INACTIVE'}</span>
</div>

<div class="tension-display">
	<div class="tension-label">TENSION</div>
	<div class="tension-value">{$tension.toFixed(2)}</div>
	<div class="tension-bar">
		<div class="tension-fill" style="width: {($tension * 100).toFixed(0)}%"></div>
	</div>
</div>

<div class="metric-row">
	<span class="metric-label">CONF</span>
	<span class="metric-value">{($handTracking.confidence * 100).toFixed(0)}%</span>
</div>

<style>
	.control-row {
		display: flex;
		align-items: center;
	}

	.toggle-label {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		font-size: 10px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.8);
		letter-spacing: 1px;
		font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
	}

	.toggle-label input[type='checkbox'] {
		width: 14px;
		height: 14px;
		cursor: pointer;
		accent-color: rgba(147, 197, 253, 0.9);
	}

	.status-row {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 10px;
	}

	.status-indicator {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: rgba(255, 0, 0, 0.5);
		transition: background 0.2s;
	}

	.status-indicator.active {
		background: #51cf66;
		box-shadow: 0 0 8px rgba(81, 207, 102, 0.6);
	}

	.status-text {
		font-weight: 600;
		letter-spacing: 1px;
		color: rgba(255, 255, 255, 0.8);
		font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
	}

	.tension-display {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.tension-label {
		font-size: 9px;
		letter-spacing: 1px;
		color: rgba(255, 255, 255, 0.6);
		font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
	}

	.tension-value {
		font-size: 16px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: rgba(147, 197, 253, 0.9);
		line-height: 1;
		font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
	}

	.tension-bar {
		width: 100%;
		height: 4px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
		overflow: hidden;
	}

	.tension-fill {
		height: 100%;
		background: linear-gradient(90deg, #51cf66, #ffd43b, #ff6b6b);
		transition: width 0.1s ease-out;
	}

	.metric-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 10px;
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
</style>
