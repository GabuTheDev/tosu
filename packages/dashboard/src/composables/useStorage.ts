import { watch, reactive } from 'vue';

export const localDefaults = {
	theme: 'dark',
	sidebarCollapsed: false,
} as const;

export type LocalSettings = typeof localDefaults;

export const storageKeys = {
	theme: 'theme',
	sidebarCollapsed: 'sidebar_collapsed',
} as const;

const STORAGE_PREFIX = 'tosu_';

const getStoredValue = <T>(key: string, fallback: T): T => {
	try {
		const item = localStorage.getItem(STORAGE_PREFIX + key);
		return item !== null ? JSON.parse(item) : fallback;
	} catch (e) {
		console.error(`Error reading from storage [${key}]:`, e);
		return fallback;
	}
};

const setStoredValue = (key: string, value: unknown): void => {
	try {
		localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
	} catch (e) {
		console.error(`Error saving to storage [${key}]:`, e);
	}
};

const localSettings = reactive({
	theme: getStoredValue('theme', localDefaults.theme),
	sidebarCollapsed: getStoredValue('sidebarCollapsed', localDefaults.sidebarCollapsed),
});

watch(
	localSettings,
	(newVal) => {
		Object.entries(newVal).forEach(([key, value]) => {
			setStoredValue(key, value);
		});
	},
	{ deep: true },
);

export function useStorage() {
	const setItem = setStoredValue;
	const getItem = <T>(key: string): T | null => {
		const item = localStorage.getItem(STORAGE_PREFIX + key);
		return item !== null ? JSON.parse(item) : null;
	};

	return {
		localSettings,
		localDefaults,
		setItem,
		getItem,
	};
}
