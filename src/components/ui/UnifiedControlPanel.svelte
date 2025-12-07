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
	let hasDragged = $state(false); // Track if user actually dragged
	let currentEdge = $state<Edge>('left');
	let dragX = $state(0);
	let dragY = $state(0);
	let startX = $state(0);
	let startY = $state(0);
	let mouseDownTime = $state(0);

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
		isDragging = false;
		hasDragged = false;
		startX = e.clientX;
		startY = e.clientY;
		dragX = e.clientX;
		dragY = e.clientY;
		mouseDownTime = Date.now();
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
		e.preventDefault();
		e.stopPropagation();
	}

	function handleMouseMove(e: MouseEvent) {
		const deltaX = Math.abs(e.clientX - startX);
		const deltaY = Math.abs(e.clientY - startY);
		const threshold = 5; // Minimum pixels to consider it a drag

		if (deltaX > threshold || deltaY > threshold) {
			isDragging = true;
			hasDragged = true;
		}

		if (isDragging) {
			dragX = e.clientX;
			dragY = e.clientY;
			const snapped = snapToEdge(e.clientX, e.clientY);
			currentEdge = snapped.edge;
		}
	}

	function handleMouseUp(e: MouseEvent) {
		if (isDragging && hasDragged) {
			const snapped = snapToEdge(e.clientX, e.clientY);
			position.set(snapped);
		}
		// Don't reset hasDragged here - let onClick check it first
		// Reset after a short delay to ensure onClick can check it
		setTimeout(() => {
			isDragging = false;
			hasDragged = false;
		}, 100);
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
		const tabHeight = UI_CONSTANTS.TAB.HEIGHT; // 40px - altura cuando está horizontal
		const tabWidth = UI_CONSTANTS.TAB.WIDTH; // 60px - ancho cuando está horizontal

		switch (edge) {
			case 'left':
				// Tab: left: 0, top: y, width: 60px, height: 40px (horizontal)
				// Panel: aparece a la derecha del tab, empieza en tabHeight (40px) desde left
				// Max height: desde top del tab hasta bottom del viewport
				return `left: ${tabHeight}px; top: ${y}px; width: ${panelWidth}px; max-height: calc(100vh - ${y}px);`;

			case 'right':
				// Tab: right: 0, top: y, width: 60px, height: 40px (horizontal)
				// Panel: aparece a la izquierda del tab, empieza en tabHeight (40px) desde right
				// Max height: desde top del tab hasta bottom del viewport
				return `right: ${tabHeight}px; top: ${y}px; width: ${panelWidth}px; max-height: calc(100vh - ${y}px);`;

			case 'top':
				// Tab: top: 0, left: x, width: 40px (rotated), height: 60px (rotated)
				// Panel: aparece debajo del tab, empieza en tabWidth (60px) desde top
				// Max height: desde bottom del tab hasta bottom del viewport = 100vh - 60px
				return `top: ${tabWidth}px; left: ${x}px; width: ${panelWidth}px; max-height: calc(100vh - ${tabWidth}px);`;

			case 'bottom': {
				// Tab: bottom: 0, left: x, width: 40px (rotated), height: 60px (rotated)
				// Panel: aparece arriba del tab, empieza en tabWidth (60px) desde bottom
				// Max height: espacio disponible desde top del viewport hasta top del tab
				// Panel está en bottom: 60px, puede usar hasta 100vh - 60px
				// Construir la expresión de manera explícita para evitar problemas de interpretación
				const bottomOffset = tabWidth;
				return `bottom: ${bottomOffset}px; left: ${x}px; width: ${panelWidth}px; max-height: calc(100vh - ${bottomOffset}px);`;
			}
		}
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
		// Only toggle if it wasn't a drag operation
		// Check hasDragged flag - it will be true if user moved mouse more than threshold
		// Also check time - if mouse was down for too long, it was likely a drag attempt
		const clickDuration = Date.now() - mouseDownTime;
		if (!hasDragged && !isDragging && clickDuration < 300) {
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
