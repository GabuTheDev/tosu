<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, reactive } from 'vue';
import solidSprite from '@/assets/sprites/solid.svg';

interface Props {
	placeholder?: string;
	disabled?: boolean;
	maxKeys?: number;
	validators?: Array<(value: string) => string | null | undefined>;
}

const props = withDefaults(defineProps<Props>(), {
	placeholder: 'Press keys...',
	maxKeys: 5,
	validators: () => [],
	disabled: false,
});

const model = defineModel<string>({ required: true });
const error = defineModel<string | undefined>('error');

const emit = defineEmits<{
	(e: 'blur', event: FocusEvent): void;
	(e: 'focus', event: FocusEvent): void;
}>();

const containerRef = ref<HTMLElement | null>(null);

const ui = reactive({
	isRecording: false,
	recordedKeys: [] as string[],
	currentlyPressed: new Set<string>(),
	tooltipAtTop: false,
	tooltipStyle: { left: '0px', top: '0px' },
	isReady: false,
});

const runValidation = (val: string): string | undefined => {
	for (const validator of props.validators) {
		const result = validator(val);
		if (result) return result;
	}

	return undefined;
};

const formatKey = (code: string) => {
	if (code === 'Space') return 'Space';

	return code
		.replace('Key', '')
		.replace('Digit', '')
		.replace('Arrow', '')
		.replace(/([A-Z])/g, ' $1')
		.trim();
};

const onKeydown = (e: KeyboardEvent) => {
	if (!ui.isRecording) return;
	e.preventDefault();
	e.stopPropagation();

	const code = e.code;
	const formatted = formatKey(code);

	if (!ui.currentlyPressed.has(code)) {
		ui.currentlyPressed.add(code);

		if (ui.recordedKeys.length < props.maxKeys && !ui.recordedKeys.includes(formatted)) {
			ui.recordedKeys.push(formatted);
		}
	}
};

const onKeyup = (e: KeyboardEvent) => {
	if (!ui.isRecording) return;
	e.preventDefault();
	e.stopPropagation();

	ui.currentlyPressed.delete(e.code);

	if (ui.currentlyPressed.size === 0 && ui.recordedKeys.length > 0) {
		const result = ui.recordedKeys.join(' + ');
		error.value = runValidation(result);

		if (!error.value) {
			model.value = result;
		}

		stopRecording();
		(containerRef.value?.querySelector('.input-wrapper') as HTMLElement)?.blur();
	}
};

const startRecording = () => {
	if (props.disabled) return;

	ui.isRecording = true;
	ui.recordedKeys = [];
	ui.currentlyPressed.clear();

	window.addEventListener('keydown', onKeydown, true);
	window.addEventListener('keyup', onKeyup, true);
};

const stopRecording = () => {
	ui.isRecording = false;

	window.removeEventListener('keydown', onKeydown, true);
	window.removeEventListener('keyup', onKeyup, true);
};


const onFocus = (event: FocusEvent) => {
	startRecording();
	emit('focus', event);
};

const onBlur = (event: FocusEvent) => {
	stopRecording();
	emit('blur', event);
};

const checkTooltipPosition = () => {
	if (!error.value || !containerRef.value) {
		ui.isReady = false;
		return;
	}

	const rect = containerRef.value.getBoundingClientRect();
	const threshold = 100;

	ui.tooltipAtTop = rect.top > threshold;
	ui.tooltipStyle.left = `${rect.left + rect.width / 2}px`;
	ui.tooltipStyle.top = ui.tooltipAtTop ? `${rect.top - 10}px` : `${rect.bottom + 10}px`;

	ui.isReady = true;
};

const getIcon = (name: string): string => `${solidSprite}#${name}`;

watch(
	() => error.value,
	async (newErr) => {
		if (newErr) {
			await nextTick();
			checkTooltipPosition();
		} else {
			ui.isReady = false;
		}
	},
);

onMounted(() => {
	checkTooltipPosition();
	window.addEventListener('scroll', checkTooltipPosition, true);
	window.addEventListener('resize', checkTooltipPosition);
});

onUnmounted(() => {
	stopRecording();
	window.removeEventListener('scroll', checkTooltipPosition, true);
	window.removeEventListener('resize', checkTooltipPosition);
});
</script>

<template>
	<div ref="containerRef" class="input-keybind" :class="{ disabled, isRecording: ui.isRecording, hasError: !!error }">
		<div class="input-wrapper" tabindex="0" @focus="onFocus" @blur="onBlur">
			<div class="key-list">
				<template v-if="ui.isRecording">
					<div v-if="ui.recordedKeys.length === 0" class="placeholder">{{ placeholder }}</div>
					<div v-for="key in ui.recordedKeys" :key="key" class="key-badge active">{{ key }}</div>
				</template>
				<template v-else>
					<div v-for="key in model.split(' + ')" :key="key" class="key-badge">{{ key }}</div>
				</template>
			</div>

			<div class="status-icon">
				<svg class="fa-icon"><use :href="getIcon('keyboard')" /></svg>
			</div>
		</div>

		<Teleport to="body">
			<transition name="tooltip-fade">
				<div
					v-if="ui.isReady && error"
					class="tooltip-portal is-error"
					:class="{ 'at-top': ui.tooltipAtTop }"
					:style="ui.tooltipStyle"
				>
					<div class="tooltip-arrow" />
					{{ error }}
				</div>
			</transition>
		</Teleport>
	</div>
</template>

<style scoped>
.input-keybind {
	display: flex;
	flex-direction: column;
	width: 100%;
	position: relative;
}

.input-wrapper {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 2.5rem;
	padding: 0 0.75rem;
	min-width: 14rem;
	background-color: var(--surface-1);
	border: 2px solid var(--surface-2);
	border-radius: var(--radius);
	cursor: pointer;
	transition: all 0.2s ease;
	outline: none;
	position: relative;
	z-index: 2;
}

.input-wrapper:hover:not(.disabled) {
	background-color: var(--surface-2);
}

.input-wrapper:focus {
	background-color: var(--surface-2);
}

.key-list {
	display: flex;
	gap: 0.375rem;
	align-items: center;
	overflow: hidden;
}

.key-badge {
	padding: 0.125rem 0.5rem;
	background-color: var(--surface-0);
	border: 1px solid var(--surface-2);
	border-radius: 4px;
	color: var(--text-2);
	font-size: 0.75rem;
	font-weight: 800;
	text-transform: uppercase;
	white-space: nowrap;
}

.key-badge.active {
	color: var(--text-3);
	border-color: var(--text-0);
	background-color: var(--surface-2);
}

.placeholder {
	color: var(--text-0);
	font-size: 0.9375rem;
	font-weight: 600;
}

.status-icon {
	color: var(--text-0);
	display: flex;
	align-items: center;
	margin-left: 1rem;
}

.fa-icon {
	width: 1rem;
	height: 1rem;
}

.hasError .input-wrapper {
	border-color: var(--danger);
}

.disabled {
	opacity: 0.5;
	pointer-events: none;
}
</style>
