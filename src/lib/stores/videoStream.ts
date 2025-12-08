/**
 * Video stream store
 * Exposes the webcam stream for use in other components (e.g., DVR monitor)
 */
import { writable } from 'svelte/store';

export const videoStream = writable<MediaStream | null>(null);
