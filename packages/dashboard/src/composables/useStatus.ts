import { reactive } from 'vue';

export type StatusType = 'loading' | 'error' | 'info';

interface StatusState {
	visible: boolean;
	type: StatusType;
	title: string;
	message: string;
	detail?: string | null;
	retryIn?: number;
}

const state = reactive<StatusState>({
	visible: false,
	type: 'loading',
	title: '',
	message: '',
	detail: null,
	retryIn: 0,
});

export function useStatus() {
	const setStatus = (config: Partial<Omit<StatusState, 'visible'>>) => {
		if (config.type !== undefined) state.type = config.type;
		if (config.title !== undefined) state.title = config.title;
		if (config.message !== undefined) state.message = config.message;
		if (config.detail !== undefined) state.detail = config.detail;
		if (config.retryIn !== undefined) state.retryIn = config.retryIn;
		state.visible = true;
	};

	const clearStatus = () => {
		state.visible = false;
	};

	return {
		status: state,
		setStatus,
		clearStatus,
	};
}
