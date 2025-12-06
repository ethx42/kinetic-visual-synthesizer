import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
	viteConfig,
	defineConfig({
		test: {
			environment: 'jsdom',
			setupFiles: ['./src/test/setup.ts'],
			include: ['src/**/*.{test,spec}.{js,ts,svelte}'],
			// Exclude node_modules and other standard ignored paths
			exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
			globals: true
		}
	})
);

