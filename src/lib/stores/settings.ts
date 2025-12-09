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
