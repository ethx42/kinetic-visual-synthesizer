/**
 * Vite Plugin: Classic Worker Support
 *
 * WORKAROUND for Vite 7 dev mode Classic Worker issue.
 *
 * The problem: Even with format: 'iife', Vite injects module code (/@vite/env, etc.)
 * that breaks Classic Workers which require importScripts().
 *
 * This plugin attempts to ensure workers are processed as IIFE bundles,
 * but the real issue is Vite's dev server behavior.
 *
 * NOTE: This is a known limitation of Vite 7. The worker WILL work in production
 * (yarn build + yarn preview) but may fail in dev mode.
 */

import type { Plugin } from 'vite';

export function classicWorker(): Plugin {
	return {
		name: 'classic-worker',
		enforce: 'pre',
		config(config) {
			// Ensure worker format is IIFE
			if (!config.worker) {
				config.worker = {};
			}
			config.worker.format = 'iife';

			// Prevent code-splitting that can break Classic Workers
			if (!config.worker.rollupOptions) {
				config.worker.rollupOptions = {};
			}
			if (!config.worker.rollupOptions.output) {
				config.worker.rollupOptions.output = {};
			}
			config.worker.rollupOptions.output.inlineDynamicImports = true;

			// Try to prevent Vite from injecting module code
			// This may not work in dev mode but helps in production
		}
	};
}
