<script lang="ts">
	/**
	 * Unified Control Panel
	 * Integrates all UI panels into a single draggable tab with collapsible sections
	 * Refactored to use extracted components and composables
	 */
	import { onDestroy } from 'svelte';
	import { persistent } from '$lib/stores/persistent';
	import { useDraggableTab, type Edge } from '$lib/ui/composables/useDraggableTab';
	import { cameraEnabled } from '$lib/stores/settings';
	import { videoStream } from '$lib/stores/videoStream';
	import CollapsibleSection from './shared/CollapsibleSection.svelte';
	import DraggableTab from './shared/DraggableTab.svelte';
	import ControlPanel from './shared/ControlPanel.svelte';
	import TrackingSection from './sections/TrackingSection.svelte';
	import SimulationSection from './sections/SimulationSection.svelte';
	import PatchBaySection from './sections/PatchBaySection.svelte';
	import CalibrationSection from './sections/CalibrationSection.svelte';
	import DVRMonitorSection from './sections/DVRMonitorSection.svelte';
	import { UI_CONSTANTS } from '$lib/ui/constants';

	// Persistent section states (which sections are expanded)
	const sectionStates = persistent<Record<string, boolean>>('kvs_panelSections', {
		tracking: true,
		simulation: false,
		patchBay: false,
		calibration: false,
		dvr: false
	});

	// Draggable tab composable
	const { position, snapToEdge } = useDraggableTab('kvs_unifiedPanelPosition', {
		x: 0,
		y: 200,
		edge: 'left'
	});

	let visible = $state(false);
	let isDragging = $state(false);
	let currentEdge = $state<Edge>('left');
	let dragX = $state(0);
	let dragY = $state(0);

	// Toggle with 'H' key
	function handleKeyPress(e: KeyboardEvent) {
		if (e.key === 'h' || e.key === 'H') {
			visible = !visible;
		}
	}

	$effect(() => {
		window.addEventListener('keypress', handleKeyPress);
		return () => window.removeEventListener('keypress', handleKeyPress);
	});

	// Drag handlers
	function handleMouseDown(e: MouseEvent) {
		isDragging = true;
		dragX = e.clientX;
		dragY = e.clientY;
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
		e.preventDefault();
		e.stopPropagation();
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging) return;
		dragX = e.clientX;
		dragY = e.clientY;
		const snapped = snapToEdge(e.clientX, e.clientY);
		currentEdge = snapped.edge;
	}

	function handleMouseUp(e: MouseEvent) {
		if (!isDragging) return;
		const snapped = snapToEdge(e.clientX, e.clientY);
		position.set(snapped);
		isDragging = false;
		dragX = 0;
		dragY = 0;
		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', handleMouseUp);
	}

	function getTabStyle(): string {
		if (isDragging) {
			const edge = currentEdge;
			switch (edge) {
				case 'left':
					return `left: 0; top: ${dragY - UI_CONSTANTS.TAB.HEIGHT / 2}px; width: ${UI_CONSTANTS.TAB.WIDTH}px; height: ${UI_CONSTANTS.TAB.HEIGHT}px;`;
				case 'right':
					return `right: 0; top: ${dragY - UI_CONSTANTS.TAB.HEIGHT / 2}px; width: ${UI_CONSTANTS.TAB.WIDTH}px; height: ${UI_CONSTANTS.TAB.HEIGHT}px;`;
				case 'top':
					return `top: 0; left: ${dragX - UI_CONSTANTS.TAB.HEIGHT / 2}px; width: ${UI_CONSTANTS.TAB.HEIGHT}px; height: ${UI_CONSTANTS.TAB.WIDTH}px;`;
				case 'bottom':
					return `bottom: 0; left: ${dragX - UI_CONSTANTS.TAB.HEIGHT / 2}px; width: ${UI_CONSTANTS.TAB.HEIGHT}px; height: ${UI_CONSTANTS.TAB.WIDTH}px;`;
			}
		}

		const { edge, y, x } = $position;
		switch (edge) {
			case 'left':
				return `left: 0; top: ${y}px; width: ${UI_CONSTANTS.TAB.WIDTH}px; height: ${UI_CONSTANTS.TAB.HEIGHT}px;`;
			case 'right':
				return `right: 0; top: ${y}px; width: ${UI_CONSTANTS.TAB.WIDTH}px; height: ${UI_CONSTANTS.TAB.HEIGHT}px;`;
			case 'top':
				return `top: 0; left: ${x}px; width: ${UI_CONSTANTS.TAB.HEIGHT}px; height: ${UI_CONSTANTS.TAB.WIDTH}px;`;
			case 'bottom':
				return `bottom: 0; left: ${x}px; width: ${UI_CONSTANTS.TAB.HEIGHT}px; height: ${UI_CONSTANTS.TAB.WIDTH}px;`;
		}
	}

	function getPanelStyle(): string {
		const { edge, y, x } = $position;
		const panelWidth = UI_CONSTANTS.PANEL.WIDTH;
		const tabHeight = UI_CONSTANTS.TAB.HEIGHT;

		switch (edge) {
			case 'left':
				return `left: ${tabHeight}px; top: ${y}px; width: ${panelWidth}px; max-height: calc(100vh - ${y}px);`;
			case 'right':
				return `right: ${tabHeight}px; top: ${y}px; width: ${panelWidth}px; max-height: calc(100vh - ${y}px);`;
			case 'top':
				return `top: ${tabHeight}px; left: ${x}px; width: ${panelWidth}px; max-height: calc(100vh - ${x}px);`;
			case 'bottom':
				return `bottom: ${tabHeight}px; left: ${x}px; width: ${panelWidth}px; max-height: calc(100vh - ${window.innerHeight - y}px);`;
		}
	}

	function toggleSection(section: string) {
		sectionStates.update((states) => ({
			...states,
			[section]: !states[section]
		}));
	}

	onDestroy(() => {
		document.removeEventListener('mousemove', handleMouseMove);
		document.removeEventListener('mouseup', handleMouseUp);
	});
</script>

<!-- Draggable Tab -->
<DraggableTab
	tabStyle={getTabStyle()}
	currentEdge={isDragging ? currentEdge : $position.edge}
	{isDragging}
	onMouseDown={handleMouseDown}
	onClick={() => {
		if (!isDragging) {
			visible = !visible;
		}
	}}
	icon={visible ? '◀' : '▶'}
	label="CTRL"
/>

<!-- Control Panel -->
<ControlPanel
	panelStyle={getPanelStyle()}
	edge={$position.edge}
	{visible}
	onClose={() => (visible = false)}
	title="CONTROL"
>
	<!-- Tracking Section -->
	<CollapsibleSection title="TRACKING" bind:expanded={$sectionStates.tracking}>
		<TrackingSection />
	</CollapsibleSection>

	<!-- Simulation Section -->
	<CollapsibleSection title="SIMULATION" bind:expanded={$sectionStates.simulation}>
		<SimulationSection />
	</CollapsibleSection>

	<!-- Patch Bay Section -->
	<CollapsibleSection title="PATCH BAY" bind:expanded={$sectionStates.patchBay}>
		<PatchBaySection />
	</CollapsibleSection>

	<!-- Calibration Section -->
	<CollapsibleSection title="CALIBRATION" bind:expanded={$sectionStates.calibration}>
		<CalibrationSection />
	</CollapsibleSection>

	<!-- DVR Monitor Section -->
	{#if $videoStream && $cameraEnabled}
		<CollapsibleSection title="DVR MONITOR" bind:expanded={$sectionStates.dvr}>
			<DVRMonitorSection />
		</CollapsibleSection>
	{/if}
</ControlPanel>
