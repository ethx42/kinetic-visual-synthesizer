/**
 * Domain Service: Performance Analysis
 * Analyzes performance metrics and determines level
 *
 * Clean Architecture: Domain Layer
 * Service Pattern: Encapsulates business logic for performance analysis
 */

import type { PerformanceProfile, PerformanceThresholds } from '../entities/PerformanceProfile';
import { PerformanceLevel } from '../entities/PerformanceProfile';

/**
 * Interface for performance analysis
 * Dependency Inversion Principle: Depend on abstractions, not concretions
 */
export interface IPerformanceAnalyzer {
	/**
	 * Analyze a performance profile and determine its level
	 * @param profile - The performance profile to analyze
	 * @returns The performance level classification
	 */
	analyze(profile: PerformanceProfile): PerformanceLevel;

	/**
	 * Determine if performance degradation should be applied
	 * @param current - Current performance profile
	 * @param history - Historical performance profiles
	 * @returns True if degradation should be applied
	 */
	shouldDegrade(current: PerformanceProfile, history: PerformanceProfile[]): boolean;

	/**
	 * Determine if performance upgrade should be applied
	 * @param current - Current performance profile
	 * @param history - Historical performance profiles
	 * @returns True if upgrade should be applied
	 */
	shouldUpgrade(current: PerformanceProfile, history: PerformanceProfile[]): boolean;
}

/**
 * Performance Analyzer
 * Analyzes performance profiles and determines when to degrade/upgrade
 *
 * Single Responsibility Principle: Only responsible for performance analysis
 * Open/Closed Principle: Extensible via interface, closed for modification
 */
export class PerformanceAnalyzer implements IPerformanceAnalyzer {
	/**
	 * Performance thresholds for classification
	 * Immutable after construction (readonly)
	 */
	private readonly thresholds: PerformanceThresholds;

	/**
	 * Constructor with dependency injection
	 * @param thresholds - Performance thresholds configuration
	 */
	constructor(thresholds: PerformanceThresholds) {
		// Validate thresholds - ensure descending order for FPS
		if (
			thresholds.excellent.fps < thresholds.good.fps ||
			thresholds.good.fps < thresholds.acceptable.fps ||
			thresholds.acceptable.fps < thresholds.poor.fps
		) {
			throw new Error(
				'Invalid thresholds: Performance levels must be in descending order (excellent >= good >= acceptable >= poor)'
			);
		}

		// Validate thresholds - ensure ascending order for frameTime
		if (
			thresholds.excellent.frameTime > thresholds.good.frameTime ||
			thresholds.good.frameTime > thresholds.acceptable.frameTime ||
			thresholds.acceptable.frameTime > thresholds.poor.frameTime
		) {
			throw new Error(
				'Invalid thresholds: Frame times must be in ascending order (excellent <= good <= acceptable <= poor)'
			);
		}

		// Defensive copy to ensure immutability
		this.thresholds = {
			excellent: { ...thresholds.excellent },
			good: { ...thresholds.good },
			acceptable: { ...thresholds.acceptable },
			poor: { ...thresholds.poor }
		};
	}

	/**
	 * Analyze a performance profile and determine its level
	 * Uses threshold-based classification for all levels
	 *
	 * @param profile - The performance profile to analyze
	 * @returns The performance level classification
	 */
	analyze(profile: PerformanceProfile): PerformanceLevel {
		// Guard clause: Validate input
		if (!profile || profile.fps < 0 || profile.frameTime < 0) {
			return PerformanceLevel.CRITICAL;
		}

		// Check excellent threshold
		if (
			profile.fps >= this.thresholds.excellent.fps &&
			profile.frameTime <= this.thresholds.excellent.frameTime
		) {
			return PerformanceLevel.EXCELLENT;
		}

		// Check good threshold
		if (
			profile.fps >= this.thresholds.good.fps &&
			profile.frameTime <= this.thresholds.good.frameTime
		) {
			return PerformanceLevel.GOOD;
		}

		// Check acceptable threshold
		if (
			profile.fps >= this.thresholds.acceptable.fps &&
			profile.frameTime <= this.thresholds.acceptable.frameTime
		) {
			return PerformanceLevel.ACCEPTABLE;
		}

		// Check poor threshold
		if (
			profile.fps >= this.thresholds.poor.fps &&
			profile.frameTime <= this.thresholds.poor.frameTime
		) {
			return PerformanceLevel.POOR;
		}

		// Default to critical (below all thresholds)
		return PerformanceLevel.CRITICAL;
	}

	/**
	 * Determine if performance degradation should be applied
	 * Requires sustained poor performance (3+ consecutive frames)
	 *
	 * Strategy: Conservative approach - require multiple poor frames to avoid false positives
	 * Optimized: Caches analysis results to avoid redundant calculations
	 *
	 * @param current - Current performance profile
	 * @param history - Historical performance profiles (most recent last)
	 * @returns True if degradation should be applied
	 */
	shouldDegrade(current: PerformanceProfile, history: PerformanceProfile[]): boolean {
		// Guard clause: Need at least 3 samples
		if (history.length < 3) {
			return false;
		}

		// Get last 3 profiles (most recent)
		const recentProfiles = history.slice(-3);

		// Analyze once and cache results (optimization)
		const levels = recentProfiles.map((profile) => this.analyze(profile));

		// Count how many are poor or critical
		const poorCount = levels.filter(
			(level) => level === PerformanceLevel.POOR || level === PerformanceLevel.CRITICAL
		).length;

		// Require all 3 to be poor/critical (conservative approach)
		return poorCount >= 3;
	}

	/**
	 * Determine if performance upgrade should be applied
	 * Requires sustained good performance (10+ consecutive frames)
	 *
	 * Strategy: More conservative for upgrade - want to ensure stability before reverting
	 * Optimized: Caches analysis results to avoid redundant calculations
	 *
	 * @param current - Current performance profile
	 * @param history - Historical performance profiles (most recent last)
	 * @returns True if upgrade should be applied
	 */
	shouldUpgrade(current: PerformanceProfile, history: PerformanceProfile[]): boolean {
		// Guard clause: Need at least 10 samples and current FPS must be good
		if (history.length < 10 || current.fps < 55) {
			return false;
		}

		// Get last 10 profiles (most recent)
		const recentProfiles = history.slice(-10);

		// Analyze once and cache results (optimization)
		const levels = recentProfiles.map((profile) => this.analyze(profile));

		// Count how many are excellent or good
		const goodCount = levels.filter(
			(level) => level === PerformanceLevel.EXCELLENT || level === PerformanceLevel.GOOD
		).length;

		// Require all 10 to be excellent/good (very conservative)
		return goodCount >= 10;
	}
}
