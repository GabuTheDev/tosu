import { reactive, ref, watch } from 'vue';
import type { GlobalConfig, ConfigKey } from '@tosu/common/utils/config.types';
import { debounce } from '@/utils/debounce';
import { useStatus } from '@/composables/useStatus';

const settings = reactive({} as GlobalConfig);
const isSaving = ref(false);
const isLoaded = ref(false);
const error = ref<string | null>(null);
const retryIn = ref(0);
let retryTimeout: ReturnType<typeof setTimeout> | null = null;
let retryInterval: ReturnType<typeof setInterval> | null = null;

export function useSettings() {
	const { setStatus, clearStatus } = useStatus();

	const fetchSettings = async () => {
		if (isLoaded.value) return;

		setStatus({
			type: 'loading',
			title: 'Fetching Settings...',
		});

		try {
			const response = await fetch('/api/settings');
			if (response.ok) {
				const data = await response.json();
				Object.assign(settings, data);
				isLoaded.value = true;
				error.value = null;
				retryIn.value = 0;
				clearStatus();

				if (retryTimeout) {
					clearTimeout(retryTimeout);
					retryTimeout = null;
				}
				if (retryInterval) {
					clearInterval(retryInterval);
					retryInterval = null;
				}
			} else {
				throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
			}
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			error.value = msg;
			console.error(`[Settings] Failed to fetch server settings (retrying in 15s): ${msg}`);

			if (!retryTimeout) {
				retryIn.value = 15;

				setStatus({
					type: 'error',
					title: 'Connection Failed',
					message: 'Unable to reach the tosu server.',
					detail: msg,
					retryIn: 15,
				});

				retryInterval = setInterval(() => {
					if (retryIn.value > 0) {
						retryIn.value--;
						setStatus({ retryIn: retryIn.value });
					}
				}, 1000);

				retryTimeout = setTimeout(() => {
					retryTimeout = null;
					if (retryInterval) {
						clearInterval(retryInterval);
						retryInterval = null;
					}
					fetchSettings();
				}, 15000);
			}
		}
	};

	const saveToServer = debounce(async (key: string, value: unknown) => {
		isSaving.value = true;
		try {
			await fetch('/api/settings', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ [key]: value }),
			});
		} catch (e) {
			console.error(`Failed to save ${key} to server:`, e);
		} finally {
			isSaving.value = false;
		}
	}, 500);

	watch(
		settings,
		(newVal, oldVal) => {
			if (!isLoaded.value) return;

			for (const key in newVal) {
				const k = key as ConfigKey;
				if (JSON.stringify(newVal[k]) !== JSON.stringify(oldVal[k])) {
					saveToServer(key, newVal[k]);
				}
			}
		},
		{ deep: true },
	);

	const triggerManualError = () => {
		setStatus({
			type: 'error',
			title: 'Manual Error',
			message: 'This is a modular custom message triggered manually.',
			detail: 'Anime girls are not real, but this error is.',
			retryIn: -1,
		});
	};

	const triggerManualLoading = () => {
		setStatus({
			type: 'loading',
			title: 'Custom Loading...',
			message: 'Tis is something very modular right now.',
		});
	};

	return {
		settings,
		isSaving,
		isLoaded,
		error,
		retryIn,
		fetchSettings,
		triggerManualError,
		triggerManualLoading,
	};
}
