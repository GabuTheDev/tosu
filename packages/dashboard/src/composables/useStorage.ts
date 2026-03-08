import { ref, watch, type Ref } from 'vue';

export const storageKeys = {
	sidebarCollapsed: 'sidebar_collapsed',
} as const;

export function useStorage() {
	const STORAGE_PREFIX = 'tosu_';

	const setItem = (key: string, value: unknown): void => {
		try {
			localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
		} catch (e) {
			console.error(`Error saving to storage [${key}]:`, e);
		}
	};

	const getItem = <T>(key: string): T | null => {
		try {
			const item = localStorage.getItem(STORAGE_PREFIX + key);
			if (item === null) return null;
			return JSON.parse(item) as T;
		} catch (e) {
			console.error(`Error reading from storage [${key}]:`, e);
			return null;
		}
	};

	const removeItem = (key: string): void => {
		localStorage.removeItem(STORAGE_PREFIX + key);
	};

	const useStoredRef = <T>(key: string, defaultValue: T): Ref<T> => {
		const storedValue = getItem<T>(key);
		const data = ref(storedValue !== null ? storedValue : defaultValue) as Ref<T>;

		watch(
			data,
			(newValue) => {
				if (newValue === null || newValue === undefined) {
					removeItem(key);
				} else {
					setItem(key, newValue);
				}
			},
			{ deep: true },
		);

		return data;
	};

	return {
		setItem,
		getItem,
		removeItem,
		useStoredRef,
	};
}
