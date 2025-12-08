import { writable } from 'svelte/store';

export type UISection = 'link' | 'engine' | 'patch' | 'system';

export const isPanelOpen = writable(false);
export const portalMode = writable(false);
export const activeSection = writable<UISection>('link');

// Helper to toggle panel
export function togglePanel() {
	isPanelOpen.update((v) => !v);
}

// Helper to set portal mode
export function setPortalMode(active: boolean) {
	portalMode.set(active);
	if (active && typeof navigator !== 'undefined' && navigator.vibrate) {
		navigator.vibrate(50);
	}
}

