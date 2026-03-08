<script setup lang="ts" generic="T">
import { ref, reactive, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import solidSprite from '@/assets/sprites/solid.svg';

export interface DropdownOption<V> {
	label: string;
	value: V;
	link?: string;
	icon?: string;
}

interface Props<V> {
	options: DropdownOption<V>[];
	placeholder?: string;
	disabled?: boolean;
	validators?: Array<(value: V) => string | null | undefined>;
}

const props = withDefaults(defineProps<Props<T>>(), {
	placeholder: 'Select an option...',
	options: () => [],
	validators: () => [],
	disabled: false,
});

const model = defineModel<T>({ required: true });
const error = defineModel<string | undefined>('error');

const emit = defineEmits<{
	(e: 'blur', event: FocusEvent): void;
	(e: 'focus', event: FocusEvent): void;
	(e: 'change', value: T): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);

const ui = reactive({
	isOpen: false,
	searchQuery: '',
	tooltipAtTop: false,
	tooltipStyle: { left: '0px', top: '0px' },
	listStyle: { left: '0px', top: '0px', width: '0px' },
	isReady: false,
});


const runValidation = (val: T): string | undefined => {
	for (const validator of props.validators) {
		const result = validator(val);
		if (result) return result;
	}

	return undefined;
};

const updatePosition = () => {
	if (!containerRef.value) return;
	const rect = containerRef.value.getBoundingClientRect();

	const footerHeight = 64;
	const threshold = 220;
	const spaceBelow = window.innerHeight - rect.bottom - footerHeight;
	const spaceAbove = rect.top;

	ui.tooltipAtTop = spaceBelow < threshold && spaceAbove > spaceBelow;

	ui.listStyle.width = `${rect.width}px`;
	ui.listStyle.left = `${rect.left}px`;

	if (ui.tooltipAtTop) {
		ui.listStyle.top = `${rect.top - 8}px`;
		ui.tooltipStyle.top = `${rect.top - 10}px`;
	} else {
		ui.listStyle.top = `${rect.bottom + 8}px`;
		ui.tooltipStyle.top = `${rect.bottom + 10}px`;
	}

	ui.tooltipStyle.left = `${rect.left + rect.width / 2}px`;
	ui.isReady = true;
};

const selectedOption = computed(() => props.options.find(o => o.value === model.value));

const filteredOptions = computed(() => {
	if (!ui.searchQuery) return props.options;
	const query = ui.searchQuery.toLowerCase();
	return props.options.filter(opt => opt.label.toLowerCase().includes(query));
});

const getIcon = (name: string): string => `${solidSprite}#${name}`;

const onToggle = async () => {
	if (props.disabled) return;

	if (!ui.isOpen) {
		updatePosition();

		await nextTick();
		ui.isOpen = true;
		ui.searchQuery = '';
		await nextTick();
		searchInput.value?.focus();
	} else {
		ui.isOpen = false;
	}
};

const onSelect = (option: DropdownOption<T>) => {
	model.value = option.value;
	error.value = runValidation(option.value);
	emit('change', option.value);
	ui.isOpen = false;
};

const onOutsideClick = (e: MouseEvent) => {
	if (!ui.isOpen) return;
	const target = e.target as Node;
	const isInsideContainer = containerRef.value?.contains(target);
	const isInsideList = document.querySelector('.floating-list')?.contains(target);

	if (!isInsideContainer && !isInsideList) {
		ui.isOpen = false;
	}
};

watch(error, async (newErr) => {
	if (newErr) {
		await nextTick();
		updatePosition();
	} else {
		ui.isReady = false;
	}
});

onMounted(() => {
	window.addEventListener('mousedown', onOutsideClick);
	window.addEventListener('scroll', updatePosition, true);
	window.addEventListener('resize', updatePosition);
});

onUnmounted(() => {
	window.removeEventListener('mousedown', onOutsideClick);
	window.removeEventListener('scroll', updatePosition, true);
	window.removeEventListener('resize', updatePosition);
});
</script>

<template>
	<div
		ref="containerRef"
		class="input-text dropdown"
		:class="{ disabled, hasError: !!error, isOpen: ui.isOpen }"
	>
		<div class="input-wrapper" @click="onToggle">
			<div class="input-content">
				<input
					v-if="ui.isOpen"
					ref="searchInput"
					v-model="ui.searchQuery"
					class="input search-input"
					:placeholder="selectedOption?.label || placeholder"
					@click.stop
				/>
				<div v-else class="input display-value">
					<span v-if="selectedOption">{{ selectedOption.label }}</span>
					<span v-else class="placeholder">{{ placeholder }}</span>
				</div>
			</div>

			<div class="input-actions">
				<div class="chevron-btn">
					<svg class="fa-icon"><use :href="getIcon('chevron-down')" /></svg>
				</div>
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

		<Teleport to="body">
			<transition name="unroll">
				<div
					v-if="ui.isOpen"
					class="floating-list"
					:class="{ atTop: ui.tooltipAtTop }"
					:style="ui.listStyle"
					@mousedown.stop
				>
					<div v-if="filteredOptions.length === 0" class="no-results">
						No results.
					</div>
					<div class="options-container">
						<div
							v-for="opt in (filteredOptions as DropdownOption<T>[])"
							:key="String(opt.value)"
							class="option"
							:class="{ active: model === opt.value }"
							tabindex="0"
							@click="onSelect(opt)"
							@keydown.enter="onSelect(opt)"
						>
							<div class="option-main">
								<div v-if="opt.icon" class="option-icon">
									<svg class="fa-icon"><use :href="getIcon(opt.icon)" /></svg>
								</div>
								<div class="option-text">
									<span class="label">{{ opt.label }}</span>
									<a
										v-if="opt.link"
										:href="opt.link"
										target="_blank"
										class="link"
										@mousedown.stop
										@click.stop
									>
										View
										<svg class="fa-icon external-icon"><use :href="getIcon('arrow-up-right-from-square')" /></svg>
									</a>
								</div>
							</div>

							<div v-if="model === opt.value" class="option-check">
								<svg class="fa-icon"><use :href="getIcon('check')" /></svg>
							</div>
						</div>
					</div>
				</div>
			</transition>
		</Teleport>
	</div>
</template>

<style scoped>
.dropdown {
	display: flex;
	flex-direction: column;
	width: 100%;
	position: relative;
	min-width: 16rem;
	flex-shrink: 0;
}

.input-wrapper {
	position: relative;
	display: flex;
	align-items: center;
	background-color: var(--surface-1);
	border: 2px solid var(--surface-2);
	border-radius: var(--radius);
	transition: background-color 0.2s ease, border-color 0.2s ease;
	z-index: 2;
	overflow: hidden;
	cursor: pointer;
	height: 2.5rem;
}

.input-wrapper:hover {
	background-color: var(--surface-1);
}

.input-wrapper:focus-within, .isOpen .input-wrapper {
	background-color: var(--surface-2);
}

.input-content {
	flex: 1;
	min-width: 0;
	position: relative;
	height: 100%;
}

.input {
	flex: 1;
	background: transparent;
	border: none;
	padding: 0 1rem;
	color: var(--text-2);
	font-family: var(--font-family-base), serif;
	font-size: 1rem;
	font-weight: 600;
	outline: none;
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	transition: color 0.3s ease;
	user-select: none;
}

.search-input {
	user-select: text;
}

.input:focus, .input-wrapper:hover .input, .isOpen .input {
	color: var(--text-0);
}

.placeholder {
	color: var(--text-3);
}

.hasError .input-wrapper {
	border-color: var(--danger);
}

.input-actions {
	padding-right: 0.75rem;
	display: flex;
	align-items: center;
	pointer-events: none;
}

.chevron-btn {
	color: var(--text-3);
	width: 0.75rem;
	height: 0.75rem;
	transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
	display: flex;
	align-items: center;
	justify-content: center;
}

.isOpen .chevron-btn {
	transform: rotate(180deg);
}

.fa-icon {
	width: 1.25em;
	height: 1.25em;
}

.floating-list {
	position: fixed;
	background-color: var(--surface-2);
	border: 1px solid var(--surface-2);
	border-radius: var(--radius);
	max-height: 22rem;
	overflow-y: auto;
	z-index: 9999;
	box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6);
	padding: 0.4rem;
	box-sizing: border-box;
	backface-visibility: hidden;
	transform: translateZ(0);
	-webkit-font-smoothing: antialiased;
}
.floating-list.atTop {
	transform: translateY(-100%);
}

.options-container {
	display: flex;
	flex-direction: column;
	gap: 0.2rem;
}

.option {
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0.6rem 0.8rem;
	background: none;
	border: 1px solid transparent;
	border-radius: calc(var(--radius) - 0.25rem);
	cursor: pointer;
	color: var(--text-2);
	transition: all 0.15s ease;
	gap: 1.25rem;
	text-align: left;
	font-family: var(--font-family-base), serif;
	outline: none;
}

.option:hover, .option:focus {
	background-color: var(--surface-1);
	color: var(--text-0);
}

.option.active {
	background-color: hsl(0, 0%, 14%);
	color: var(--text-0);
}

.option-main {
	display: flex;
	align-items: center;
	gap: 0.85rem;
	flex: 1;
	min-width: 0;
}

.option-icon {
	width: 1.125rem;
	height: 1.125rem;
	color: var(--text-3);
	flex-shrink: 0;
}

.option:hover .option-icon, .option.active .option-icon {
	color: var(--accent);
}

.option-text {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.label {
	font-weight: 700;
	font-size: 0.9rem;
	line-height: 1.25;
}

.link {
	font-size: 0.725rem;
	color: var(--tosu-blue);
	font-weight: 800;
	text-decoration: none;
	display: flex;
	align-items: center;
	gap: 0.35rem;
	width: max-content;
	margin-top: 0.15rem;
}

.link:hover { text-decoration: underline; }

.external-icon {
	width: 0.65rem;
	height: 0.65rem;
}

.option-check {
	width: 0.875rem;
	height: 0.875rem;
	color: var(--accent);
}

.no-results {
	padding: 1.5rem;
	text-align: center;
	color: var(--text-3);
	font-size: 0.875rem;
}

.disabled { opacity: 0.5; pointer-events: none; }

.unroll-enter-active, .unroll-leave-active {
	transition:
		margin-top 0.2s cubic-bezier(0.22, 1, 0.36, 1),
		opacity 0.15s ease;
}

.unroll-enter-from, .unroll-leave-to {
	opacity: 0;
	margin-top: -8px;
}

.atTop.unroll-enter-from, .atTop.unroll-leave-to {
	margin-top: 8px;
}
</style>
