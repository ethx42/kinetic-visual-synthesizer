/**
 * Domain Value Objects - Export barrel
 */

export type { SignalQuality } from './SignalQuality';
export {
	SIGNAL_QUALITY_THRESHOLDS,
	getSignalQuality,
	isSignalAcceptable,
	isSignalLost,
	getSignalQualityValue,
	getSignalQualityLabel
} from './SignalQuality';
