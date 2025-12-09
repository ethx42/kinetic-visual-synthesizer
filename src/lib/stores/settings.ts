/**
 * Global settings store
 * Controls particle count, quality settings, etc.
 * All settings persist to localStorage
 */
import { writable } from 'svelte/store';
import { persistent } from './persistent';

export const particleCount = persistent('kvs_particleCount', 1_000_000);
export const maxParticles = 1_000_000;

// Vector field type: 0 = CURL_NOISE, 1 = LORENZ, 2 = AIZAWA
export const vectorFieldType = persistent('kvs_vectorFieldType', 0.0);

// Simulation parameters (all persistent)
export const noiseScale = persistent('kvs_noiseScale', 0.8);
export const noiseSpeed = persistent('kvs_noiseSpeed', 0.1); // Slower field animation so particle motion is dominant
export const noiseStrength = persistent('kvs_noiseStrength', 8.0); // Intensity multiplier for curl noise field
export const attractorStrength = persistent('kvs_attractorStrength', 1.0);
export const damping = persistent('kvs_damping', 0.99); // Velocity damping factor (0.0 = no damping, 1.0 = full stop)

// Lorenz Attractor parameters (σ, ρ, β)
export const lorenzSigma = persistent('kvs_lorenzSigma', 10.0);
export const lorenzRho = persistent('kvs_lorenzRho', 28.0);
export const lorenzBeta = persistent('kvs_lorenzBeta', 8.0 / 3.0);

// Aizawa Attractor parameters (a, b, c, d, e, f)
export const aizawaA = persistent('kvs_aizawaA', 0.95);
export const aizawaB = persistent('kvs_aizawaB', 0.7);
export const aizawaC = persistent('kvs_aizawaC', 0.6);
export const aizawaD = persistent('kvs_aizawaD', 3.5);
export const aizawaE = persistent('kvs_aizawaE', 0.25);
export const aizawaF = persistent('kvs_aizawaF', 0.1);

// Rössler Attractor parameters (a, b, c)
export const roesslerA = persistent('kvs_roesslerA', 0.2);
export const roesslerB = persistent('kvs_roesslerB', 0.2);
export const roesslerC = persistent('kvs_roesslerC', 5.7);

// Chen Attractor parameters (a, b, c)
export const chenA = persistent('kvs_chenA', 35.0);
export const chenB = persistent('kvs_chenB', 3.0);
export const chenC = persistent('kvs_chenC', 28.0);

// Thomas Attractor parameter (b)
export const thomasB = persistent('kvs_thomasB', 0.19);

// Gravity Grid parameters
export const gravityGridSpacing = persistent('kvs_gravityGridSpacing', 2.0); // Spacing between grid points
export const gravityGridStrength = persistent('kvs_gravityGridStrength', 5.0); // Strength of gravitational attraction
export const gravityGridDecay = persistent('kvs_gravityGridDecay', 2.0); // Distance decay exponent (2.0 = inverse square law)
export const gravityGridOffsetX = persistent('kvs_gravityGridOffsetX', 0.0); // Grid center X offset
export const gravityGridOffsetY = persistent('kvs_gravityGridOffsetY', 0.0); // Grid center Y offset
export const gravityGridOffsetZ = persistent('kvs_gravityGridOffsetZ', 0.0); // Grid center Z offset
export const gravityGridDimensions = persistent('kvs_gravityGridDimensions', 10.0); // Approximate grid dimensions

// Halvorsen Attractor parameter
export const halvorsenAlpha = persistent('kvs_halvorsenAlpha', 1.4); // α parameter (typically 1.4 or 1.89)

// Four-Wing Attractor parameters (a, b, c, d, k)
export const fourWingA = persistent('kvs_fourWingA', 4.0);
export const fourWingB = persistent('kvs_fourWingB', 6.0);
export const fourWingC = persistent('kvs_fourWingC', 10.0);
export const fourWingD = persistent('kvs_fourWingD', 5.0);
export const fourWingK = persistent('kvs_fourWingK', 1.0);

// Current position texture reference (updated by SimulationPass)
// This allows ParticleSystem to reactively update its texture reference
import type { Texture } from 'three';
export const currentPositionTexture = writable<Texture | null>(null);
export const currentVelocityTexture = writable<Texture | null>(null);

// Phase 3.4: Multi-Parameter Mapping (Patch Bay)
// Controls which parameters are controlled by hand tension
export type PatchTarget = 'entropy' | 'timeScale' | 'colorShift' | 'attractorStrength' | 'none';

export interface PatchMapping {
	target: PatchTarget;
	enabled: boolean;
	min: number;
	max: number;
}

// Patch bay configuration (persistent)
export const patchMappings = persistent<Record<string, PatchMapping>>('kvs_patchMappings', {
	entropy: { target: 'entropy', enabled: true, min: 0.0, max: 1.0 },
	timeScale: { target: 'timeScale', enabled: false, min: 0.5, max: 2.0 },
	colorShift: { target: 'colorShift', enabled: false, min: 0.0, max: 6.28318 }, // 2π
	attractorStrength: { target: 'attractorStrength', enabled: false, min: 0.1, max: 2.0 }
});

// Computed values from patch bay (derived from tension)
export const computedTimeScale = writable(1.0);
export const computedColorShift = writable(0.0);

// Camera/Hand tracking enabled (persistent)
// Default to false to prevent immediate camera requests on mobile
export const cameraEnabled = persistent('kvs_cameraEnabled', false);

// Quality level for performance adaptation (0.0 - 1.0)
// Used by performance fallback system
export const qualityLevel = persistent('kvs_qualityLevel', 1.0);
