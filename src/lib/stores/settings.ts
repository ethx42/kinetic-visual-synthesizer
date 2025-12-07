/**
 * Global settings store
 * Controls particle count, quality settings, etc.
 */
import { writable } from 'svelte/store';

export const particleCount = writable(1_000_000);
export const maxParticles = 1_000_000;

// Vector field type: 0 = CURL_NOISE, 1 = LORENZ, 2 = AIZAWA
export const vectorFieldType = writable(0.0);

// Simulation parameters
export const noiseScale = writable(0.8);
export const noiseSpeed = writable(0.1); // Slower field animation so particle motion is dominant
export const attractorStrength = writable(1.0);

// Current position texture reference (updated by SimulationPass)
// This allows ParticleSystem to reactively update its texture reference
import type { Texture } from 'three';
export const currentPositionTexture = writable<Texture | null>(null);
export const currentVelocityTexture = writable<Texture | null>(null);
