/**
 * Hand tension state store (0.0-1.0)
 * Maps to entropy uniform in simulation shader
 */
import { writable } from 'svelte/store';

export const tension = writable(0.0);
