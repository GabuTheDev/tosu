<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted, reactive } from 'vue';
import solidSprite from '@/assets/sprites/solid.svg';

interface Props {
	min?: number;
	max?: number;
	step?: number;
	precision?: number;
	disabled?: boolean;
	id?: string;
	validators?: Array<(value: number) => string | null | undefined>;
}

const props = withDefaults(defineProps<Props>(), {
	step: 1,
	precision: 0,
	validators: () => [],
	min: undefined,
	max: undefined,
	id: undefined,
	disabled: false,
});

const model = defineModel<number>({ required: true });
const error = defineModel<string | undefined>('error');

const emit = defineEmits<{
	(e: 'blur', event: FocusEvent): void;
	(e: 'focus', event: FocusEvent): void;
}>();

const containerRef = ref<HTMLElement | null>(null);

const ui = reactive({
	display: model.value,
	lastValid: model.value,
	isFocused: false,
	showHelp: false,
	tooltipAtTop: false,
	tooltipStyle: { left: '0px', top: '0px' },
	isReady: false,
});

/**
 * 1. Sanitization & Validation
 */
const sanitizeValue = (val: number): number => {
	if (!isFinite(val)) {
		if (val > 0) return props.max ?? Number.MAX_SAFE_INTEGER;
		else return props.min ?? Number.MIN_SAFE_INTEGER;
	}

	const precision = Math.max(0, Math.floor(props.precision));
	const multiplier = Math.pow(10, precision);
	const sanitized = Math.round(val * multiplier) / multiplier;

	return sanitized === 0 ? 0 : sanitized;
};

const runValidation = (val: number): string | undefined => {
	if (!isFinite(val)) return 'Invalid number';

	for (const validator of props.validators) {
		const result = validator(val);
		if (result) return result;
	}

	if (props.min !== undefined && val < props.min) return `Minimum value is ${props.min}`;
	if (props.max !== undefined && val > props.max) return `Maximum value is ${props.max}`;

	return undefined;
};

/**
 * 2. Interaction Handlers
 */
const onKeydown = (e: KeyboardEvent) => {
	const key = e.key.toLowerCase();
	const target = e.target as HTMLInputElement;

	const isScientific = key === 'e' || key === '+';
	const isInvalidMinus = key === '-' && ((props.min !== undefined && props.min >= 0) || target.value.includes('-'));
	const isInvalidDot = key === '.' && (props.precision === 0 || target.value.includes('.'));

	if (isScientific || isInvalidMinus || isInvalidDot) {
		e.preventDefault();
	}
};

const onInput = (event: Event) => {
	const target = event.target as HTMLInputElement;
	let rawValue = target.value;

	if (rawValue === '') {
		target.value = '0';
		rawValue = '0';
	}

	if (props.precision > 0 && rawValue.includes('.')) {
		const parts = rawValue.split('.');
		const int = parts[0];
		const dec = parts[1] || '';
		if (dec.length > props.precision) {
			const truncated = int + '.' + dec.substring(0, props.precision);
			target.value = truncated;
			rawValue = truncated;
		}
	}

	let val = parseFloat(rawValue);

	if (isNaN(val)) {
		target.value = ui.display.toString();
		return;
	}

	val = sanitizeValue(val);
	ui.display = val;
	error.value = runValidation(val);
};

const onFocus = (event: FocusEvent) => {
	ui.isFocused = true;
	ui.lastValid = model.value;
	emit('focus', event);
};

const onBlur = (event: FocusEvent) => {
	const isStepBtn = (event.relatedTarget as HTMLElement)?.closest('.step-btn');
	if (isStepBtn) return;

	ui.isFocused = false;

	if (error.value) {
		ui.display = ui.lastValid;
		error.value = undefined;
	} else {
		ui.display = sanitizeValue(ui.display);
		ui.lastValid = ui.display;
		model.value = ui.display;
	}
	emit('blur', event);
};

/**
 * 3. Step Logic
 */
const stepValue = (amount: number) => {
	let nextVal = sanitizeValue(ui.display + amount);

	if (!ui.isFocused) {
		if (props.min !== undefined && nextVal < props.min) nextVal = props.min;
		if (props.max !== undefined && nextVal > props.max) nextVal = props.max;
		if (runValidation(nextVal)) return;
	}

	ui.display = nextVal;
	error.value = runValidation(nextVal);

	if (!error.value) {
		ui.lastValid = nextVal;
		model.value = nextVal;
	}
};

const increment = (e: MouseEvent) => {
	if (props.disabled) return;
	let multiplier = 1;
	if (e.shiftKey) multiplier = 10;
	else if (e.altKey) multiplier = 5;
	stepValue(props.step * multiplier);
};

const decrement = (e: MouseEvent) => {
	if (props.disabled) return;
	let multiplier = 1;
	if (e.shiftKey) multiplier = 10;
	else if (e.altKey) multiplier = 5;
	stepValue(-props.step * multiplier);
};

/**
 * 4. UI Helpers
 */
const checkTooltipPosition = () => {
	if ((!error.value && !ui.showHelp) || !containerRef.value) {
		ui.isReady = false;
		return;
	}

	const rect = containerRef.value.getBoundingClientRect();
	const threshold = 100;

	const newAtTop = rect.top > threshold;
	const newLeft = `${rect.left + rect.width / 2}px`;
	const newTop = newAtTop ? `${rect.top - 10}px` : `${rect.bottom + 10}px`;

	ui.tooltipAtTop = newAtTop;
	ui.tooltipStyle.left = newLeft;
	ui.tooltipStyle.top = newTop;
	ui.isReady = true;
};

const toggleHelp = (visible: boolean) => {
	if (props.disabled) return;
	ui.showHelp = visible;
};

const getIcon = (name: string): string => `${solidSprite}#${name}`;

// Sync
watch(model, (newVal) => {
	ui.display = sanitizeValue(newVal);
	ui.lastValid = ui.display;
});

watch([() => error.value, () => ui.showHelp], async ([newErr, newHelp]) => {
	if (newErr || newHelp) {
		await nextTick();
		checkTooltipPosition();
	} else {
		ui.isReady = false;
	}
});

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
	<div 
		ref="containerRef" 
		class="input-number" 
		:class="{ disabled, hasError: !!error }"
	>
		<div class="input-wrapper">
			<div
				class="step-btn-wrapper"
				@mousedown.prevent
				@mouseenter="toggleHelp(true)"
				@mouseleave="toggleHelp(false)"
			>
				<button
					type="button"
					class="step-btn decrement"
					:class="{ 'is-disabled': disabled || (min !== undefined && ui.display <= min) }"
					@click="decrement"
				>
					<svg class="fa-icon"><use :href="getIcon('minus')" /></svg>
				</button>
			</div>

			<input
				:id="id"
				type="number"
				:value="ui.display"
				:min="min"
				:max="max"
				:step="step"
				:disabled="disabled"
				class="input"
				@keydown="onKeydown"
				@input="onInput"
				@blur="onBlur"
				@focus="onFocus"
			/>

			<div
				class="step-btn-wrapper"
				@mousedown.prevent
				@mouseenter="toggleHelp(true)"
				@mouseleave="toggleHelp(false)"
			>
				<button
					type="button"
					class="step-btn increment"
					:class="{ 'is-disabled': disabled || (max !== undefined && ui.display >= max) }"
					@click="increment"
				>
					<svg class="fa-icon"><use :href="getIcon('plus')" /></svg>
				</button>
			</div>
		</div>

		<!-- Teleported Tooltips -->
		<Teleport to="body">
			<transition name="tooltip-fade">
				<div
					v-if="ui.isReady && (error || ui.showHelp)"
					class="tooltip-portal"
					:class="{ 
						'is-error': !!error, 
						'at-top': ui.tooltipAtTop 
					}"
					:style="ui.tooltipStyle"
				>
					<div class="tooltip-arrow" />
					<template v-if="error">{{ error }}</template>
					<template v-else>
						<strong>Shift</strong> ±{{ sanitizeValue(props.step * 10) }} &nbsp; 
						<strong>Alt</strong> ±{{ sanitizeValue(props.step * 5) }}
					</template>
				</div>
			</transition>
		</Teleport>
	</div>
</template>

<style scoped>
.input-number {
	display: flex;
	flex-direction: column;
	width: fit-content;
	position: relative;
}

.input-wrapper {
	display: flex;
	height: 2.5rem;
	background-color: var(--surface-1);
	border: 2px solid var(--surface-2);
	border-radius: var(--radius);
	overflow: hidden;
	transition: background-color 0.2s ease, border-color 0.2s ease;
	position: relative;
	z-index: 2;
}

.input {
	width: 5rem;
	background: transparent;
	border: none;
	padding: 0 0.5rem;
	color: var(--text-1);
	font-family: var(--font-family-mono), monospace;
	font-size: 1rem;
	font-weight: 700;
	text-align: center;
	outline: none;
	-moz-appearance: textfield;
	transition: color 0.3s ease;
}

.input:focus,
.input-wrapper:hover .input {
	color: var(--text-3);
}

.input::-webkit-outer-spin-button,
.input::-webkit-inner-spin-button {
	-webkit-appearance: none;
	margin: 0;
}

.step-btn-wrapper {
	height: 100%;
	display: flex;
	align-items: center;
}

.step-btn {
	width: 2.25rem;
	height: 100%;
	background-color: var(--surface-2);
	color: var(--text-1);
	border: none;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	user-select: none;
	outline: none;
	transition: color 0.2s ease, background-color 0.2s ease;
}

.step-btn:hover:not(:disabled) {
	background-color: hsl(0, 0%, 15%);
	color: var(--text-3);
}

.step-btn:active:not(.is-disabled) .fa-icon {
	transform: scale(0.9);
}

.step-btn.is-disabled {
	opacity: 0.3;
	cursor: not-allowed;
	pointer-events: none;
}

.fa-icon {
	width: 1em;
	height: 1em;
	transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.hasError .input-wrapper { border-color: var(--danger); }
.disabled { opacity: 0.5; }
</style>

<style>
.tooltip-portal {
	position: fixed;
	transform: translateX(-50%);
	padding: 0.5rem 0.75rem;
	border-radius: 4px;
	font-size: 0.75rem;
	font-weight: 700;
	white-space: nowrap;
	pointer-events: none;
	z-index: 9999;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	background-color: var(--surface-2);
	color: var(--text-1);
	border: 1px solid var(--surface-2);
}

.tooltip-portal.is-error {
	background-color: var(--danger);
	color: white;
	border: none;
}

.tooltip-portal strong { color: var(--text-3); }

.tooltip-portal .tooltip-arrow {
	position: absolute;
	left: 50%;
	transform: translateX(-50%);
	width: 0;
	height: 0;
	border-left: 6px solid transparent;
	border-right: 6px solid transparent;
	top: -5px;
	border-bottom: 6px solid var(--surface-2);
}

.tooltip-portal.is-error .tooltip-arrow { border-bottom-color: var(--danger); }

.tooltip-portal.at-top { transform: translateX(-50%) translateY(-100%); }
.tooltip-portal.at-top .tooltip-arrow {
	top: auto;
	bottom: -5px;
	border-bottom: none;
	border-top: 6px solid var(--surface-2);
}

.tooltip-portal.at-top.is-error .tooltip-arrow { border-top-color: var(--danger); }

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
	opacity: 0;
	transform: translateX(-50%) translateY(5px);
}

.tooltip-portal.at-top.tooltip-fade-enter-from,
.tooltip-portal.at-top.tooltip-fade-leave-to {
	transform: translateX(-50%) translateY(-5px);
}
</style>
