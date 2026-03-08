<script setup lang="ts">
import { computed, reactive } from 'vue';
import solidSprite from '@/assets/sprites/solid.svg';

export interface Action {
	id: string;
	label: string;
	icon: string;
	handler: () => void;
	colorClass: string;
}

interface Props {
	name: string;
	description?: string;
	modelValue?: unknown;
	defaultValue?: unknown;
	canErase?: boolean;
	disabled?: boolean;
	extraActions?: Action[];
	vertical?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	description: '',
	modelValue: undefined,
	defaultValue: undefined,
	canErase: false,
	disabled: false,
	vertical: false,
	extraActions: () => [],
});

const emit = defineEmits<{
	(e: 'update:modelValue', value: unknown): void;
}>();

const toolbar = reactive({
	showReset: computed(() => {
		if (props.disabled || props.defaultValue === undefined) return false;
		return JSON.stringify(props.modelValue) !== JSON.stringify(props.defaultValue);
	}),
	showErase: computed(() => {
		return !props.disabled && props.canErase && props.modelValue !== '' && props.modelValue !== null && props.modelValue !== undefined;
	}),
	actions: computed(() => {
		const list: Action[] = [];
		if (props.disabled) return list;

		if (props.extraActions.length > 0) {
			list.push(...props.extraActions);
		}

		if (toolbar.showErase) {
			list.push({
				id: 'erase',
				label: 'Erase',
				icon: 'xmark',
				handler: () => emit('update:modelValue', ''),
				colorClass: 'erase'
			});
		}
		if (toolbar.showReset) {
			list.push({
				id: 'reset',
				label: 'Reset',
				icon: 'rotate-left',
				handler: () => emit('update:modelValue', props.defaultValue),
				colorClass: 'reset'
			});
		}
		return list;
	})
});

const getIcon = (name: string): string => `${solidSprite}#${name}`;
</script>

<template>
	<div class="setting-item-wrapper" :class="{ disabled }">
		<div class="setting-card" :class="{ 'is-vertical': vertical }">
			<div class="setting-info">
				<div class="setting-name">{{ name }}</div>
				<div v-if="description" class="setting-description">{{ description }}</div>
			</div>

			<div class="setting-control">
				<slot />
			</div>
		</div>

		<div class="action-toolbar">
			<TransitionGroup name="cascade">
				<div
					v-for="(action, index) in toolbar.actions"
					:key="action.id"
					class="action-item"
					:style="{
						'--z': 40 - index
					}"
				>
					<button
						class="action-btn"
						:class="action.colorClass"
						:title="action.label"
						@click="action.handler"
					>
						<div class="action-inner">
							<svg class="fa-icon"><use :href="getIcon(action.icon)" /></svg>
							<span>{{ action.label }}</span>
						</div>
					</button>
				</div>
			</TransitionGroup>
		</div>
	</div>
</template>

<style scoped>
.setting-item-wrapper {
	display: flex;
	align-items: stretch;
	width: 100%;
	position: relative;
}

.setting-item-wrapper:not(.disabled):focus-within,
.setting-item-wrapper:not(.disabled):hover {
	z-index: 100;
}

.setting-card {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 1.25rem;
	background-color: var(--surface-1);
	border: 1px solid var(--surface-2);
	border-radius: var(--radius);
	gap: 2rem;
	position: relative;
	z-index: 50;
	transition: background-color 0.2s ease, opacity 0.2s ease;
}

.setting-item-wrapper:not(.disabled) .setting-card:hover {
	background-color: hsl(0, 0%, 10%);
}

.setting-card.is-vertical {
	flex-direction: column;
	align-items: flex-start;
	gap: 1.5rem;
}

.setting-card.is-vertical .setting-control {
	width: 100%;
	justify-content: flex-start;
}

.setting-item-wrapper.disabled {
	opacity: 0.5;
	pointer-events: none;
	cursor: not-allowed;
}

.setting-info {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	flex: 1;
}

.setting-name {
	font-size: 1rem;
	font-weight: 700;
	color: var(--text-0);
}

.setting-description {
	font-size: 0.875rem;
	color: var(--text-2);
	line-height: 1.4;
}

.setting-control {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	min-width: 0;
	min-height: 2.5rem;
}

.action-toolbar {
	position: absolute;
	left: 100%;
	top: 0;
	bottom: 0;
	display: flex;
	pointer-events: none;
	z-index: 1;
}

.action-item {
	width: 5rem;
	height: 100%;
	position: relative;
	z-index: var(--z);
	transition: width 0.3s cubic-bezier(0.3, 0, 0, 1), opacity 0.3s ease;
}

.action-btn {
	position: absolute;
	top: 0;
	right: 0;
	width: 15rem;
	height: 100%;
	background-color: var(--surface-1);
	border: 1px solid var(--surface-2);
	border-radius: 0 var(--radius) var(--radius) 0;
	border-left: none;
	display: flex;
	justify-content: flex-end;
	padding: 0;
	cursor: pointer;
	color: var(--text-2);
	pointer-events: auto;
	box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
	transition: background-color 0.2s ease, transform 0.3s cubic-bezier(0.3, 0, 0, 1), color 0.2s ease;
}

.action-inner {
	width: 5rem;
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.25rem;
}

.action-btn:hover {
	background-color: var(--surface-2);
	color: var(--text-0);
}

.action-btn.erase:hover { color: var(--danger); }
.action-btn.reset:hover { color: var(--accent); }

.action-btn .fa-icon {
	width: 1.25rem;
	height: 1.25rem;
}

.action-btn span {
	font-size: 0.65rem;
	font-weight: 800;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.cascade-enter-active,
.cascade-leave-active {
	transition: width 0.3s cubic-bezier(0.2, 0, 0, 1), opacity 0.2s ease;
}

.cascade-enter-from,
.cascade-leave-to {
	width: 0;
	opacity: 0;
}

.cascade-enter-from .action-btn,
.cascade-leave-to .action-btn {
	transform: translateX(-100%);
}

.cascade-leave-active {
	position: absolute;
	pointer-events: none;
	z-index: 0;
}

.cascade-move {
	transition: transform 0.3s cubic-bezier(0.2, 0, 0, 1);
}

:deep(.input-container) {
	width: auto;
}
</style>
