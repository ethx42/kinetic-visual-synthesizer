<script lang="ts">
	/**
	 * CollapsibleSection Component
	 * Reusable collapsible section wrapper
	 */
	let { title, expanded = $bindable(false) } = $props();
</script>

<div class="section">
	<button class="section-header" onclick={() => (expanded = !expanded)}>
		<h4>{title}</h4>
		<span class="section-toggle">{expanded ? '▼' : '▶'}</span>
	</button>
	{#if expanded}
		<div class="section-content">
			<slot />
		</div>
	{/if}
</div>

<style>
	.section {
		padding: 12px;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	.section-header {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
		background: transparent;
		border: none;
		padding: 0;
		margin-bottom: 8px;
	}

	.section-header h4 {
		margin: 0;
		font-size: 12px;
		font-weight: 600;
		color: rgba(147, 197, 253, 0.9);
		letter-spacing: 1px;
		font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
	}

	.section-toggle {
		color: rgba(255, 255, 255, 0.6);
		font-size: 10px;
		transition: transform 0.2s;
	}

	.section-content {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
</style>
