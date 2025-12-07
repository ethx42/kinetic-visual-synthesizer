/**
 * Composable: useCalibration
 * Handles hand tracking calibration logic
 *
 * Note: Returns functions that work with component state
 */

import { calibration, normalizedDistance } from '$lib/stores/calibration';

export interface CalibrationState {
	isCalibrating: boolean;
	openHandValue: number;
	closedHandValue: number;
}

export function useCalibration() {
	function startCalibration(state: CalibrationState) {
		state.isCalibrating = true;
		state.openHandValue = 0.0;
		state.closedHandValue = 0.0;
	}

	function captureOpenHand(state: CalibrationState) {
		state.openHandValue = $normalizedDistance;
	}

	function captureClosedHand(state: CalibrationState) {
		state.closedHandValue = $normalizedDistance;
	}

	function applyCalibration(state: CalibrationState) {
		if (
			state.openHandValue > 0 &&
			state.closedHandValue > 0 &&
			state.closedHandValue > state.openHandValue
		) {
			// Add 20% margin on each side for better range
			const margin = (state.closedHandValue - state.openHandValue) * 0.2;
			calibration.set({
				...$calibration,
				smoothstepMin: Math.max(0, state.openHandValue - margin),
				smoothstepMax: state.closedHandValue + margin
			});
			state.isCalibrating = false;
		}
	}

	function resetCalibration(state: CalibrationState) {
		calibration.set({
			smoothstepMin: 0.3,
			smoothstepMax: 1.5,
			smoothingAlpha: 0.2,
			calibrationMode: false
		});
		state.isCalibrating = false;
	}

	function cancelCalibration(state: CalibrationState) {
		state.isCalibrating = false;
	}

	return {
		startCalibration,
		captureOpenHand,
		captureClosedHand,
		applyCalibration,
		resetCalibration,
		cancelCalibration
	};
}
