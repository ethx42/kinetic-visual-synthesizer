/**
 * Composable: useDraggableTab
 * Handles draggable tab positioning and edge snapping logic
 */

import { persistent } from '$lib/stores/persistent';

export type Edge = 'left' | 'right' | 'top' | 'bottom';

export interface TabPosition {
	x: number;
	y: number;
	edge: Edge;
}

const TAB_WIDTH = 60;
const TAB_HEIGHT = 40;

/**
 * Calculate which edge the tab is closest to and snap to it
 */
export function snapToEdge(x: number, y: number): TabPosition {
	const windowWidth = window.innerWidth;
	const windowHeight = window.innerHeight;

	const distToLeft = x;
	const distToRight = windowWidth - x;
	const distToTop = y;
	const distToBottom = windowHeight - y;

	const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

	if (minDist === distToLeft) {
		return { x: 0, y: Math.max(0, Math.min(windowHeight - TAB_HEIGHT, y)), edge: 'left' };
	}
	if (minDist === distToRight) {
		return {
			x: windowWidth - TAB_WIDTH,
			y: Math.max(0, Math.min(windowHeight - TAB_HEIGHT, y)),
			edge: 'right'
		};
	}
	if (minDist === distToTop) {
		return { x: Math.max(0, Math.min(windowWidth - TAB_WIDTH, x)), y: 0, edge: 'top' };
	}
	return {
		x: Math.max(0, Math.min(windowWidth - TAB_WIDTH, x)),
		y: windowHeight - TAB_HEIGHT,
		edge: 'bottom'
	};
}

/**
 * Composable for draggable tab functionality
 * Returns reactive state and handlers for draggable tab
 */
export function useDraggableTab(storageKey: string, initialPosition: TabPosition) {
	const position = persistent<TabPosition>(storageKey, initialPosition);

	// Return reactive store and utility functions
	// Component will manage its own state using $state
	return {
		position,
		snapToEdge
	};
}
