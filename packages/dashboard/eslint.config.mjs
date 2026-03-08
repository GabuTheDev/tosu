import pluginVue from 'eslint-plugin-vue';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import rootConfig from '../../eslint.config.mjs';

export default defineConfigWithVueTs(
	...rootConfig,
	{
		name: 'app/files-to-lint',
		files: ['**/*.{ts,mts,tsx,vue}'],
	},

	{
		name: 'app/files-to-ignore',
		ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
	},

	pluginVue.configs['flat/recommended'],
	vueTsConfigs.recommended,
	skipFormatting,

	{
		rules: {
			'vue/multi-word-component-names': 'off',
		},
	},
);
