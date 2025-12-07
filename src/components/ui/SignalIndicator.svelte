<script lang="ts">
	/**
	 * Signal Indicator Component
	 * Visual feedback for hand tracking status
	 * Phase 3.3: Hand-to-Physics Bridge
	 */
	import { handTracking } from '$lib/stores/handTracking';

	let pulseAnimation = $state(0);

	// Pulse animation for signal lost
	$effect(() => {
		if ($handTracking.signalLost) {
			const interval = setInterval(() => {
				pulseAnimation = (pulseAnimation + 0.1) % (Math.PI * 2);
			}, 50);
			return () => clearInterval(interval);
		}
	});
</script>

<div
	class="signal-indicator"
	class:tracking={$handTracking.isTracking}
	class:signal-lost={$handTracking.signalLost}
>
	<div
		class="status-dot"
		class:tracking={$handTracking.isTracking}
		class:lost={$handTracking.signalLost}
		style="opacity: {$handTracking.signalLost ? 0.5 + 0.5 * Math.sin(pulseAnimation) : 1}"
	></div>
	<div class="status-text">
		{$handTracking.isTracking ? 'TRACKING' : $handTracking.signalLost ? 'SIGNAL LOST' : 'NO SIGNAL'}
	</div>
	{#if $handTracking.isTracking}
		<div class="confidence-bar">
			<div
				class="confidence-fill"
				style="width: {($handTracking.confidence * 100).toFixed(0)}%"
			></div>
		</div>
	{/if}
</div>

<style>
	.signal-indicator {
		position: fixed;
		bottom: 20px;
		left: 20px;
		z-index: 1000;
		font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
		font-size: 11px;
		color: rgba(255, 255, 255, 0.9);
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(10px);
		padding: 10px 15px;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 150px;
	}

	.signal-indicator.tracking {
		border-color: rgba(81, 207, 102, 0.5);
		background: rgba(0, 0, 0, 0.8);
	}

	.signal-indicator.signal-lost {
		border-color: rgba(255, 107, 107, 0.5);
		background: rgba(0, 0, 0, 0.8);
	}

	.status-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: #ff6b6b;
		transition: background 0.2s;
	}

	.status-dot.tracking {
		background: #51cf66;
	}

	.status-dot.lost {
		background: #ff6b6b;
	}

	.status-text {
		font-weight: 600;
		letter-spacing: 0.5px;
		text-transform: uppercase;
		font-size: 10px;
	}

	.confidence-bar {
		width: 100%;
		height: 3px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
		overflow: hidden;
	}

	.confidence-fill {
		height: 100%;
		background: linear-gradient(90deg, #51cf66, #69db7c);
		transition: width 0.2s ease-out;
	}
</style>
