import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import glsl from 'vite-plugin-glsl';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
	plugins: [svelte(), glsl()],
	resolve: {
		alias: {
			$lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
			$shaders: fileURLToPath(new URL('./src/lib/shaders', import.meta.url)),
			$components: fileURLToPath(new URL('./src/components', import.meta.url))
		}
	}
});
