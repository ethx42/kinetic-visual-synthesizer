<script lang="ts">
	/**
	 * ControlPanel Component
	 * Panel container with edge-based positioning and animations
	 */
	import type { Edge } from '$lib/ui/composables/useDraggableTab';

	let {
		panelStyle,
		edge,
		visible,
		onClose,
		title = 'CONTROL',
		children
	}: {
		panelStyle: string;
		edge: Edge;
		visible: boolean;
		onClose: () => void;
		title?: string;
		children?: import('svelte').Snippet;
	} = $props();
</script>

<div
	class="control-panel"
	class:edge-left={edge === 'left'}
	class:edge-right={edge === 'right'}
	class:edge-top={edge === 'top'}
	class:edge-bottom={edge === 'bottom'}
	class:visible
	style={panelStyle}
>
	<div class="panel-header">
		<span class="panel-title">{title}</span>
		<button class="close-btn" onclick={onClose}>×</button>
	</div>

	<div class="panel-content">
		{@render children?.()}
	</div>
</div>

<style>
	.control-panel {
		position: fixed;
		z-index: 1000;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		background: rgba(255, 255, 255, 0.06);
		backdrop-filter: blur(30px) saturate(180%);
		-webkit-backdrop-filter: blur(30px) saturate(180%);
		border: 1px solid rgba(255, 255, 255, 0.15);
		font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
		color: rgba(255, 255, 255, 0.95);
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
		padding: 8px;
		transition:
			transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
			opacity 0.3s ease;
	}

	.control-panel.edge-left:not(.visible) {
		transform: translateX(-100%);
	}

	.control-panel.edge-left.visible {
		transform: translateX(0);
	}

	.control-panel.edge-right:not(.visible) {
		transform: translateX(100%);
	}

	.control-panel.edge-right.visible {
		transform: translateX(0);
	}

	.control-panel.edge-top:not(.visible) {
		transform: translateY(-100%);
	}

	.control-panel.edge-top.visible {
		transform: translateY(0);
	}

	.control-panel.edge-bottom:not(.visible) {
		transform: translateY(100%);
	}

	.control-panel.edge-bottom.visible {
		transform: translateY(0);
	}

	.control-panel:not(.visible) {
		opacity: 0;
		pointer-events: none;
	}

	.control-panel.edge-left {
		border-left: none;
		border-radius: 0 16px 16px 0;
	}

	.control-panel.edge-right {
		border-right: none;
		border-radius: 16px 0 0 16px;
	}

	.control-panel.edge-top {
		border-top: none;
		border-radius: 0 0 16px 16px;
	}

	.control-panel.edge-bottom {
		border-bottom: none;
		border-radius: 16px 16px 0 0;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 4px 0;
		margin-bottom: 6px;
		flex-shrink: 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.panel-title {
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 1.5px;
		color: rgba(147, 197, 253, 0.9);
	}

	.close-btn {
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.5);
		font-size: 16px;
		line-height: 1;
		cursor: pointer;
		padding: 0;
		width: 18px;
		height: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}

	.close-btn:hover {
		color: rgba(255, 255, 255, 1);
	}

	.panel-content {
		display: flex;
		flex-direction: row;
		gap: 8px;
		overflow-x: auto;
		overflow-y: hidden;
		flex: 1;
		min-height: 0;
		/* Custom scrollbar styling */
		scrollbar-width: thin;
		scrollbar-color: rgba(147, 197, 253, 0.3) transparent;
	}

	.panel-content::-webkit-scrollbar {
		height: 6px;
	}

	.panel-content::-webkit-scrollbar-track {
		background: transparent;
	}

	.panel-content::-webkit-scrollbar-thumb {
		background: rgba(147, 197, 253, 0.3);
		border-radius: 3px;
	}

	.panel-content::-webkit-scrollbar-thumb:hover {
		background: rgba(147, 197, 253, 0.5);
	}
</style>
