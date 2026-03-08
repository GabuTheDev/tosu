<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted, reactive } from 'vue';
import solidSprite from '@/assets/sprites/solid.svg';

interface Props {
	placeholder?: string;
	disabled?: boolean;
	validators?: Array<(value: string) => string | null | undefined>;
	staticChips?: string[];
}

const props = withDefaults(defineProps<Props>(), {
	placeholder: '',
	validators: () => [],
	staticChips: () => [],
	disabled: false,
});

const model = defineModel<string[]>({ required: true });
const inputValue = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

const ui = reactive({
	internalChips: [...model.value],
	activeError: undefined as string | undefined,
	tooltipAtTop: false,
	hoveredChipRef: null as HTMLElement | null,
	tooltipStyle: { left: '0px', top: '0px' },
	isReady: false,
});

const runValidation = (val: string): string | undefined => {
	for (const validator of props.validators) {
		const error = validator(val);
		if (error) return error;
	}

	return undefined;
};

const updateParentModel = () => {
	const validOnes = ui.internalChips.filter((c) => !runValidation(c));

	if (JSON.stringify(validOnes) !== JSON.stringify(model.value)) {
		model.value = validOnes;
	}
};

const addChip = () => {
	const val = inputValue.value.trim().replace(/,$/, '');
	if (val && !ui.internalChips.includes(val)) {
		ui.internalChips = [...ui.internalChips, val];
		updateParentModel();
	}

	inputValue.value = '';
};

const removeChip = (index: number) => {
	ui.internalChips = ui.internalChips.filter((_, i) => i !== index);
	updateParentModel();
};

const focusInput = () => {
	inputRef.value?.focus();
};

const onKeydown = (e: KeyboardEvent) => {
	if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
		e.preventDefault();
		addChip();
	} else if (e.key === 'Backspace' && !inputValue.value && ui.internalChips.length > 0) {
		removeChip(ui.internalChips.length - 1);
	}
};

const checkTooltipPosition = () => {
	if (!ui.activeError || !ui.hoveredChipRef) {
		ui.isReady = false;
		return;
	}

	const rect = ui.hoveredChipRef.getBoundingClientRect();
	const threshold = 100;

	ui.tooltipAtTop = rect.top > threshold;
	ui.tooltipStyle.left = `${rect.left + rect.width / 2}px`;
	ui.tooltipStyle.top = ui.tooltipAtTop ? `${rect.top - 10}px` : `${rect.bottom + 10}px`;

	ui.isReady = true;
};

const showTooltip = (val: string, e: MouseEvent, isStatic = false) => {
	if (isStatic) {
		ui.activeError = 'This IP is always allowed (Listen IP)';
	} else {
		const error = runValidation(val);
		if (!error) return;
		ui.activeError = error;
	}

	ui.hoveredChipRef = e.currentTarget as HTMLElement;
	checkTooltipPosition();
};

const hideTooltip = () => {
	ui.activeError = undefined;
	ui.hoveredChipRef = null;
};

const getIcon = (name: string): string => `${solidSprite}#${name}`;

watch(
	model,
	(newVal) => {
		const validInternal = ui.internalChips.filter((c) => !runValidation(c));
		if (JSON.stringify(validInternal) !== JSON.stringify(newVal)) {
			ui.internalChips = [...newVal];
		}
	},
	{ deep: true },
);

watch(
	() => ui.activeError,
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
	<div class="input-chips" :class="{ disabled }">
		<div class="chips-wrapper" @click="focusInput">
			<div
				v-for="chip in staticChips"
				:key="'static-' + chip"
				class="chip is-static"
				@mouseenter="showTooltip(chip, $event, true)"
				@mouseleave="hideTooltip"
			>
				<span class="chip-text">{{ chip }}</span>
				<svg class="fa-icon lock-icon"><use :href="getIcon('lock')" /></svg>
			</div>

			<TransitionGroup name="chip-fade">
				<div
					v-for="(chip, index) in ui.internalChips"
					:key="chip"
					class="chip"
					:class="{ 'is-invalid': !!runValidation(chip) }"
					@mouseenter="showTooltip(chip, $event)"
					@mouseleave="hideTooltip"
				>
					<span class="chip-text">{{ chip }}</span>
					<button type="button" class="remove-btn" @click.stop="removeChip(index)">
						<svg class="fa-icon"><use :href="getIcon('xmark')" /></svg>
					</button>
				</div>
			</TransitionGroup>

			<input
				ref="inputRef"
				v-model="inputValue"
				type="text"
				:placeholder="ui.internalChips.length === 0 ? placeholder : ''"
				:disabled="disabled"
				class="chip-input"
				@keydown="onKeydown"
				@blur="addChip"
			/>
		</div>

		<Teleport to="body">
			<transition name="tooltip-fade">
				<div
					v-if="ui.isReady && ui.activeError"
					class="tooltip-portal"
					:class="{
						'is-error': ui.activeError !== 'This IP is always allowed (Listen IP)',
						'at-top': ui.tooltipAtTop,
					}"
					:style="ui.tooltipStyle"
				>
					<div class="tooltip-arrow" />
					{{ ui.activeError }}
				</div>
			</transition>
		</Teleport>
	</div>
</template>

<style scoped>
.input-chips {
	display: flex;
	width: 100%;
	min-height: 2.5rem;
}

.chips-wrapper {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	padding: 0.5rem;
	background-color: var(--surface-1);
	border: 2px solid var(--surface-2);
	border-radius: var(--radius);
	width: 100%;
	cursor: text;
	transition:
		border-color 0.2s ease,
		background-color 0.2s ease;
}

.chips-wrapper:focus-within {
	background-color: var(--surface-2);
}

.chip {
	display: flex;
	align-items: center;
	gap: 0.375rem;
	padding: 0.25rem 0.5rem 0.25rem 0.75rem;
	background-color: var(--surface-0);
	border: 1px solid var(--surface-2);
	border-radius: calc(var(--radius) / 2);
	color: var(--text-1);
	font-size: 0.875rem;
	font-weight: 700;
	user-select: none;
	transition: all 0.2s ease;
	cursor: default;
}

.chip:hover {
	color: var(--text-0);
	background-color: var(--surface-2);
}

.chips-wrapper:focus-within .chip:hover {
	background-color: var(--surface-1);
}

.chip.is-static {
	padding: 0.25rem 0.75rem;
}

.chip.is-static .lock-icon {
	opacity: 0.5;
	width: 0.625rem;
	height: 0.625rem;
}

.chip.is-invalid {
	border-color: var(--danger);
	color: var(--danger);
	background-color: hsla(0, 84%, 60%, 0.1);
}

.chip.is-invalid .remove-btn {
	color: var(--danger);
}

.chip.is-invalid .remove-btn:hover {
	color: var(--text-0);
}

.remove-btn {
	background: none;
	border: none;
	padding: 2px;
	color: var(--text-3);
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	transition: color 0.2s ease;
}

.remove-btn:hover {
	color: white;
}

.chip-input {
	flex: 1;
	min-width: 120px;
	background: transparent;
	border: none;
	outline: none;
	color: var(--text-0);
	font-family: var(--font-family-base), serif;
	font-size: 0.9375rem;
	padding: 0.25rem;
}

.chip-input::placeholder {
	color: var(--text-3);
}

.fa-icon {
	width: 0.75rem;
	height: 0.75rem;
}

.disabled {
	opacity: 0.5;
	pointer-events: none;
}

/* Animations */
.chip-fade-enter-active,
.chip-fade-leave-active {
	transition: all 0.2s ease;
}

.chip-fade-leave-active {
	position: absolute;
	pointer-events: none;
}

.chip-fade-enter-from,
.chip-fade-leave-to {
	opacity: 0;
	transform: scale(0.8);
}

.chip-fade-move {
	transition: transform 0.2s ease;
}
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
	color: var(--text-2);
	border: 1px solid var(--surface-2);
}

.tooltip-portal.is-error {
	background-color: var(--danger);
	color: white;
	border: none;
}

.tooltip-portal strong {
	color: var(--text-0);
}

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

.tooltip-portal.is-error .tooltip-arrow {
	border-bottom-color: var(--danger);
}

.tooltip-portal.at-top {
	transform: translateX(-50%) translateY(-100%);
}
.tooltip-portal.at-top .tooltip-arrow {
	top: auto;
	bottom: -5px;
	border-bottom: none;
	border-top: 6px solid var(--surface-2);
}

.tooltip-portal.at-top.is-error .tooltip-arrow {
	border-top-color: var(--danger);
}

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
