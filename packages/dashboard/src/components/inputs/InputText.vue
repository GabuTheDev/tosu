<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted, onUnmounted, reactive } from 'vue';
import solidSprite from '@/assets/sprites/solid.svg';

interface Props {
	type?: 'text' | 'password';
	placeholder?: string;
	disabled?: boolean;
	autocomplete?: string;
	validators?: Array<(value: string) => string | null | undefined>;
}

const props = withDefaults(defineProps<Props>(), {
	type: 'text',
	placeholder: '',
	autocomplete: undefined,
	validators: () => [],
	disabled: false,
});

const computedAutocomplete = computed(() => {
	if (props.autocomplete) return props.autocomplete;
	if (props.type === 'password') return 'new-password';
	return 'off';
});

const model = defineModel<string>({ required: true });
const error = defineModel<string | undefined>('error');

const emit = defineEmits<{
	(e: 'blur', event: FocusEvent): void;
	(e: 'focus', event: FocusEvent): void;
}>();

const containerRef = ref<HTMLElement | null>(null);

const ui = reactive({
	display: model.value,
	lastValid: model.value,
	showPassword: false,
	tooltipAtTop: false,
	tooltipStyle: { left: '0px', top: '0px' },
	isReady: false,
	isReadonly: true,
});

const runValidation = (val: string): string | undefined => {
	for (const validator of props.validators) {
		const result = validator(val);
		if (result) return result;
	}
	return undefined;
};

const onInput = (event: Event) => {
	const target = event.target as HTMLInputElement;
	ui.display = target.value;
	error.value = runValidation(target.value);
};

const onFocus = (event: FocusEvent) => {
	ui.isReadonly = false;
	ui.lastValid = model.value;
	emit('focus', event);
};

const onBlur = (event: FocusEvent) => {
	ui.isReadonly = true;
	if (error.value) {
		ui.display = ui.lastValid;
		error.value = undefined;
	} else {
		lastValidValue.value = ui.display;
		model.value = ui.display;
	}
	emit('blur', event);
};

const togglePassword = () => {
	ui.showPassword = !ui.showPassword;
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

const inputType = computed(() => {
	if (props.type === 'password') {
		return ui.showPassword ? 'text' : 'password';
	}
	return props.type;
});

const getIcon = (name: string): string => `${solidSprite}#${name}`;

watch(model, (newVal) => {
	ui.display = newVal;
	ui.lastValid = newVal;
});

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
	window.removeEventListener('scroll', checkTooltipPosition, true);
	window.removeEventListener('resize', checkTooltipPosition);
});
</script>

<template>
	<div ref="containerRef" class="input-text" :class="{ disabled, hasError: !!error }">
		<div class="input-wrapper">
			<input
				:type="inputType"
				:value="ui.display"
				:placeholder="placeholder"
				:disabled="disabled"
				:readonly="ui.isReadonly"
				:autocomplete="computedAutocomplete"
				data-protonpass-ignore="true"
				data-lpignore="true"
				spellcheck="false"
				class="input"
				@input="onInput"
				@blur="onBlur"
				@focus="onFocus"
			/>

			<div v-if="type === 'password'" class="input-actions">
				<button type="button" class="toggle-btn" @mousedown.prevent @click="togglePassword">
					<svg class="fa-icon">
						<use :href="getIcon(ui.showPassword ? 'eye-slash' : 'eye')" />
					</svg>
				</button>
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
.input-text {
	display: flex;
	flex-direction: column;
	width: 100%;
	position: relative;
}

.input-wrapper {
	position: relative;
	display: flex;
	align-items: center;
	background-color: var(--surface-1);
	border: 2px solid var(--surface-2);
	border-radius: var(--radius);
	transition:
		background-color 0.2s ease,
		border-color 0.2s ease;
	z-index: 2;
	overflow: hidden;
}

.input {
	flex: 1;
	background: transparent;
	border: none;
	padding: 0 1em;
	color: var(--text-2);
	font-family: var(--font-family-base), serif;
	font-size: 1rem;
	font-weight: 600;
	outline: none;
	width: 100%;
	height: 2.5rem;
	transition: color 0.3s ease;
}

.input:focus,
.input-wrapper:hover .input {
	color: var(--text-0);
}

.input-wrapper:focus-within {
	background-color: var(--surface-2);
}

.input::placeholder {
	color: var(--text-3);
}

.hasError .input-wrapper {
	border-color: var(--danger);
}

.hasError .input {
	color: var(--danger);
}

.disabled {
	opacity: 0.5;
}

.input-actions {
	position: absolute;
	right: 0.75em;
	display: flex;
	align-items: center;
}

.toggle-btn {
	background: none;
	border: none;
	color: var(--text-3);
	cursor: pointer;
	padding: 4px;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: color 0.2s ease;
	outline: none;
}

.toggle-btn:hover {
	color: var(--text-1);
}

.fa-icon {
	width: 1.25em;
	height: 1.25em;
}
</style>
