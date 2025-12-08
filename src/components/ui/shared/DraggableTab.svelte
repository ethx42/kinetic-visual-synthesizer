<script lang="ts">
	/**
	 * DraggableTab Component
	 * Draggable tab that snaps to screen edges
	 */
	import type { Edge } from '$lib/ui/composables/useDraggableTab';

	let {
		tabStyle,
		currentEdge,
		isDragging,
		onMouseDown,
		onClick,
		icon = '▶',
		label = 'CTRL'
	}: {
		tabStyle: string;
		currentEdge: Edge;
		isDragging: boolean;
		onMouseDown: (e: MouseEvent) => void;
		onClick: () => void;
		icon?: string;
		label?: string;
	} = $props();
</script>

<button
	class="control-tab"
	class:dragging={isDragging}
	class:edge-left={currentEdge === 'left'}
	class:edge-right={currentEdge === 'right'}
	class:edge-top={currentEdge === 'top'}
	class:edge-bottom={currentEdge === 'bottom'}
	style={tabStyle}
	onmousedown={onMouseDown}
	onclick={onClick}
>
	<svg class="tab-shape" viewBox="0 0 60 40" preserveAspectRatio="none">
		<path
			class="tab-path-top"
			d="M 0 0 L 60 0 L 60 40 L 56 40 L 56 36 C 56 33, 53 31, 50 31 C 47 31, 44 33, 44 36 L 44 40 L 16 40 L 16 36 C 16 33, 13 31, 10 31 C 7 31, 4 33, 4 36 L 4 40 L 0 40 Z"
			fill="currentColor"
		/>
		<path
			class="tab-path-bottom"
			d="M 0 0 L 4 0 L 4 4 C 4 7, 7 9, 10 9 C 13 9, 16 7, 16 4 L 16 0 L 44 0 L 44 4 C 44 7, 47 9, 50 9 C 53 9, 56 7, 56 4 L 56 0 L 60 0 L 60 40 L 0 40 Z"
			fill="currentColor"
		/>
		<path
			class="tab-path-left"
			d="M 0 0 L 40 0 L 40 5 L 35 5 C 32 5, 30 8, 30 10 C 30 12, 32 15, 35 15 L 40 15 L 40 25 L 35 25 C 32 25, 30 28, 30 30 C 30 32, 32 35, 35 35 L 40 35 L 40 40 L 0 40 Z"
			fill="currentColor"
		/>
		<path
			class="tab-path-right"
			d="M 0 0 L 40 0 L 40 5 L 35 5 C 32 5, 30 8, 30 10 C 30 12, 32 15, 35 15 L 40 15 L 40 25 L 35 25 C 32 25, 30 28, 30 30 C 30 32, 32 35, 35 35 L 40 35 L 40 40 L 0 40 Z"
			fill="currentColor"
		/>
	</svg>
	<span class="tab-content">
		<span class="tab-icon">{icon}</span>
		<span class="tab-label">{label}</span>
	</span>
</button>

<style>
	.control-tab {
		position: fixed;
		z-index: 1001;
		cursor: move;
		border: none;
		padding: 0;
		background: transparent;
		overflow: visible;
		transition: all 0.2s ease;
		backdrop-filter: blur(30px) saturate(180%);
		-webkit-backdrop-filter: blur(30px) saturate(180%);
	}

	.control-tab.dragging {
		z-index: 1002;
		transition: none;
		cursor: grabbing;
		opacity: 0.9;
	}

	.control-tab:hover {
		transform: scale(1.05);
	}

	.tab-shape {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 0;
	}

	.tab-shape path {
		fill: rgba(255, 255, 255, 0.06);
		stroke: rgba(255, 255, 255, 0.15);
		stroke-width: 1;
		filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2));
		transition: all 0.2s ease;
	}

	.tab-path-top,
	.tab-path-bottom,
	.tab-path-left,
	.tab-path-right {
		display: block;
	}

	.control-tab:hover .tab-shape path {
		fill: rgba(255, 255, 255, 0.09);
		stroke: rgba(255, 255, 255, 0.2);
		filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.25));
	}

	.control-tab.dragging .tab-shape path {
		fill: rgba(255, 255, 255, 0.12);
		stroke: rgba(255, 255, 255, 0.25);
		filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.3));
	}

	.tab-content {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		width: 100%;
		height: 100%;
		font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
		font-weight: 600;
		letter-spacing: 1px;
		color: rgba(255, 255, 255, 0.85);
		pointer-events: none;
	}

	/* Show/hide appropriate tab path based on edge orientation */
	.control-tab.edge-left .tab-path-top,
	.control-tab.edge-left .tab-path-bottom,
	.control-tab.edge-left .tab-path-right {
		display: none;
	}

	.control-tab.edge-right .tab-path-top,
	.control-tab.edge-right .tab-path-bottom,
	.control-tab.edge-right .tab-path-left {
		display: none;
	}

	.control-tab.edge-top .tab-path-bottom,
	.control-tab.edge-top .tab-path-left,
	.control-tab.edge-top .tab-path-right {
		display: none;
	}

	.control-tab.edge-bottom .tab-path-top,
	.control-tab.edge-bottom .tab-path-left,
	.control-tab.edge-bottom .tab-path-right {
		display: none;
	}

	/* Rotate tab shape based on edge */
	.control-tab.edge-left .tab-shape {
		transform: rotate(0deg);
	}

	.control-tab.edge-right .tab-shape {
		transform: rotate(180deg);
	}

	.control-tab.edge-top .tab-shape {
		transform: rotate(0deg);
	}

	.control-tab.edge-bottom .tab-shape {
		transform: rotate(0deg);
	}

	.tab-icon {
		display: block;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		font-size: 12px;
		opacity: 0.8;
		line-height: 1;
	}

	.control-tab.edge-left .tab-icon {
		transform: rotate(0deg);
	}

	.control-tab.edge-right .tab-icon {
		transform: rotate(180deg);
	}

	.control-tab.edge-top .tab-icon {
		transform: rotate(-90deg);
	}

	.control-tab.edge-bottom .tab-icon {
		transform: rotate(90deg);
	}

	.control-tab:hover .tab-icon {
		opacity: 1;
	}

	.tab-label {
		font-size: 9px;
		opacity: 0.9;
		line-height: 1;
	}
</style>
