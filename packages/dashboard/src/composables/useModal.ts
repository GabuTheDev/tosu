import { ref, computed } from 'vue';

interface ModalState {
	componentName: string | null;
	props: Record<string, any>;
	resolve?: (value: any) => void;
}

const activeModal = ref<ModalState>({
	componentName: null,
	props: {},
});

export function useModal() {
	const isActive = computed(() => !!activeModal.value.componentName);

	const open = <T = any>(componentName: string, props: Record<string, any> = {}) => {
		return new Promise<T>((resolve) => {
			activeModal.value = { componentName, props, resolve };
		});
	};

	const close = (result?: any) => {
		activeModal.value.resolve?.(result);
		activeModal.value = { componentName: null, props: {} };
	};

	return {
		activeModal,
		isActive,
		open,
		close,
	};
}
