import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import glsl from 'vite-plugin-glsl';
import { fileURLToPath, URL } from 'node:url';
import { classicWorker } from './vite-plugin-classic-worker';

// https://vite.dev/config/
export default defineConfig({
	plugins: [svelte(), glsl(), classicWorker()],
	worker: {
		// Build worker bundles as classic scripts (IIFE) instead of ES modules
		// Required for MediaPipe which uses importScripts() internally
		format: 'iife',
		rollupOptions: {
			output: {
				// Prevent code-splitting that can break Classic Workers
				// This ensures all worker code is inlined into a single IIFE bundle
				inlineDynamicImports: true
			}
		}
	},
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
			$shaders: fileURLToPath(new URL('./src/lib/shaders', import.meta.url)),
			$components: fileURLToPath(new URL('./src/components', import.meta.url))
		}
	},
	build: {
		sourcemap: true
	},
	css: {
		devSourcemap: true
	},
	optimizeDeps: {
		esbuildOptions: {
			sourcemap: 'inline'
		}
	}
});
