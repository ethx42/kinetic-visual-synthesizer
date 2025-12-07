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
		title = 'CONTROL'
	}: {
		panelStyle: string;
		edge: Edge;
		visible: boolean;
		onClose: () => void;
		title?: string;
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
		<slot />
	</div>
</div>

<style>
	.control-panel {
		position: fixed;
		z-index: 1000;
		overflow-y: auto;
		background: rgba(255, 255, 255, 0.06);
		backdrop-filter: blur(30px) saturate(180%);
		-webkit-backdrop-filter: blur(30px) saturate(180%);
		border: 1px solid rgba(255, 255, 255, 0.15);
		font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
		color: rgba(255, 255, 255, 0.95);
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.3),
			inset 0 1px 0 rgba(255, 255, 255, 0.1);
		padding: 12px;
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
		padding-bottom: 8px;
		margin-bottom: 8px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.panel-title {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 2px;
		color: rgba(147, 197, 253, 0.9);
	}

	.close-btn {
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.5);
		font-size: 18px;
		line-height: 1;
		cursor: pointer;
		padding: 0;
		width: 20px;
		height: 20px;
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
		flex-direction: column;
		gap: 12px;
	}
</style>
