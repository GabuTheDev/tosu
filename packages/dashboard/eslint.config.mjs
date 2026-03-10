import pluginVue from 'eslint-plugin-vue';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import rootConfig from '../../eslint.config.mjs';

const filteredRootConfig = rootConfig.map((config) => {
	const newConfig = { ...config };

	newConfig.ignores = [...(config.ignores || []), '**/*.vue'];

	if (newConfig.plugins && newConfig.plugins['@typescript-eslint']) {
		const { '@typescript-eslint': _, ...restPlugins } = newConfig.plugins;
		newConfig.plugins = Object.keys(restPlugins).length > 0 ? restPlugins : undefined;
		if (newConfig.plugins === undefined) delete newConfig.plugins;
	}

	if (newConfig.languageOptions && newConfig.languageOptions.parser) {
		const { parser: _, ...restLangOptions } = newConfig.languageOptions;
		newConfig.languageOptions = Object.keys(restLangOptions).length > 0 ? restLangOptions : undefined;
		if (newConfig.languageOptions === undefined) delete newConfig.languageOptions;
	}

	return newConfig;
});

export default defineConfigWithVueTs(
	...filteredRootConfig,

	{
		name: 'app/files-to-lint',
		files: ['**/*.{ts,mts,tsx,vue}'],
	},

	pluginVue.configs['flat/recommended'],
	vueTsConfigs.recommended,

	{
		files: ['**/*.vue'],
		rules: {
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
		},
	},

	skipFormatting,

	{
		rules: {
			'vue/multi-word-component-names': 'off',
		},
	},
);
