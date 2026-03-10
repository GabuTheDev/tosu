import { URL, fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vite.dev/config/
export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
			'@tosu/common': fileURLToPath(new URL('../common', import.meta.url)),
		},
	},
	server: {
		proxy: {
			'/api': {
				target: 'http://127.0.0.1:24050',
				changeOrigin: true,
			},
			'/ws': {
				target: 'ws://127.0.0.1:24050',
				ws: true,
			},
		},
	},
});
