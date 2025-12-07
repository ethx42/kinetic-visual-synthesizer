/**
 * Composable: usePatchBay
 * Handles patch bay parameter mapping calculations
 */

import {
	patchMappings,
	computedTimeScale,
	computedColorShift,
	noiseSpeed,
	attractorStrength
} from '$lib/stores/settings';
import { tension } from '$lib/stores/tension';
import { get } from 'svelte/store';

/**
 * Update computed values from patch mappings
 * This function should be called from a component's $effect
 */
export function updatePatchBayValues() {
	const mappings = get(patchMappings);
	const currentTension = get(tension);

	// Time Scale: timeScale = 0.5 + tension * 1.5
	if (mappings.timeScale.enabled) {
		const timeScaleValue =
			mappings.timeScale.min + currentTension * (mappings.timeScale.max - mappings.timeScale.min);
		computedTimeScale.set(timeScaleValue);
		noiseSpeed.set(timeScaleValue * 0.1); // Scale noise speed proportionally
	} else {
		computedTimeScale.set(1.0);
	}

	// Color Shift: hueOffset = tension * 2π
	if (mappings.colorShift.enabled) {
		const colorShiftValue =
			mappings.colorShift.min +
			currentTension * (mappings.colorShift.max - mappings.colorShift.min);
		computedColorShift.set(colorShiftValue);
	} else {
		computedColorShift.set(0.0);
	}

	// Attractor Strength: strength = 0.1 + tension * 0.9
	if (mappings.attractorStrength.enabled) {
		const strengthValue =
			mappings.attractorStrength.min +
			currentTension * (mappings.attractorStrength.max - mappings.attractorStrength.min);
		attractorStrength.set(strengthValue);
	}
	// Entropy is directly mapped (handled in SimulationPass)
}

export function usePatchBay() {
	function togglePatch(key: string) {
		patchMappings.update((mappings) => ({
			...mappings,
			[key]: {
				...mappings[key],
				enabled: !mappings[key].enabled
			}
		}));
	}

	function updatePatchRange(key: string, field: 'min' | 'max', value: number) {
		patchMappings.update((mappings) => ({
			...mappings,
			[key]: {
				...mappings[key],
				[field]: value
			}
		}));
	}

	return {
		togglePatch,
		updatePatchRange
	};
}
