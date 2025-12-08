/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				obsidian: {
					base: 'rgba(5, 5, 8, 0.85)',
					rim: 'rgba(255, 255, 255, 0.15)',
					text: {
						primary: 'rgba(255, 255, 255, 0.9)',
						secondary: 'rgba(255, 255, 255, 0.5)',
						inactive: '#333333'
					}
				},
				signal: {
					cyan: '#00F0FF',
					bio: '#69db7c'
				}
			},
			fontFamily: {
				sans: ['Inter Tight', 'SF Pro Display', 'system-ui', 'sans-serif'],
				mono: ['JetBrains Mono', 'monospace']
			},
			backdropBlur: {
				obsidian: '40px'
			}
		}
	},
	plugins: []
};

