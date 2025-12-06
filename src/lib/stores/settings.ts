/**
 * Global settings store
 * Controls particle count, quality settings, etc.
 */
import { writable } from 'svelte/store';

export const particleCount = writable(1_000_000);
export const maxParticles = 1_000_000;
