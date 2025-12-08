/**
 * Persistent Store Helper
 * Creates a writable store that persists to localStorage
 */

import { writable, type Writable } from 'svelte/store';

/**
 * Creates a persistent writable store that syncs with localStorage
 * @param key - localStorage key
 * @param defaultValue - Default value if nothing is stored
 * @returns Writable store that persists to localStorage
 */
export function persistent<T>(key: string, defaultValue: T): Writable<T> {
	// Try to load from localStorage
	const stored = localStorage.getItem(key);
	let initialValue: T;

	if (stored !== null) {
		try {
			initialValue = JSON.parse(stored);
		} catch {
			// If parsing fails, use default
			initialValue = defaultValue;
		}
	} else {
		initialValue = defaultValue;
	}

	// Create writable store
	const store = writable<T>(initialValue);

	// Subscribe to changes and save to localStorage
	store.subscribe((value) => {
		try {
			localStorage.setItem(key, JSON.stringify(value));
		} catch (error) {
			console.warn(`Failed to save ${key} to localStorage:`, error);
		}
	});

	return store;
}
