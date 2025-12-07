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
