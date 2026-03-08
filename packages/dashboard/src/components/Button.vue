<script setup lang="ts">
import { computed } from 'vue';

interface Props {
	variant?: 'primary' | 'secondary' | 'danger';
	disabled?: boolean;
	color?: string;
}

const props = withDefaults(defineProps<Props>(), {
	variant: 'primary',
	disabled: false,
	color: undefined,
});

defineEmits<{
	(e: 'click', event: MouseEvent): void;
}>();

const getContrastColor = (hexcolor: string) => {
	if (!hexcolor) return undefined;
	if (hexcolor.startsWith('var')) return 'var(--text-0)';

	const hex = hexcolor.replace('#', '');
	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);

	// YIQ equation calculates the relative luminance of a color.
	// 0-255 scale: >= 128 is "light", < 128 is "dark".
	const yiq = (r * 299 + g * 587 + b * 114) / 1000;
	return yiq >= 128 ? 'var(--surface-0)' : 'var(--text-0)';
};

const dynamicStyles = computed(() => {
	if (!props.color) return {};

	return {
		backgroundColor: props.color,
		color: getContrastColor(props.color),
	};
});
</script>

<template>
	<button
		type="button"
		:disabled="disabled"
		class="btn"
		:class="[variant]"
		:style="dynamicStyles"
		@click="$emit('click', $event)"
	>
		<slot />
	</button>
</template>

<style scoped>
.btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-family: var(--font-family-base), serif;
	font-weight: 700;
	border-radius: var(--radius);
	cursor: pointer;
	transition:
		transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
		filter 0.2s ease,
		background-color 0.2s ease;
	border: none;
	gap: 0.5em;
	white-space: nowrap;
	user-select: none;
	height: 2.5em;
	padding: 0 1.25em;
	font-size: 1rem;
}

.btn.primary {
	background-color: var(--accent);
	color: var(--text-0);
}

.btn.secondary {
	background-color: var(--surface-3);
	color: var(--text-1);
}

.btn.danger {
	background-color: var(--danger);
	color: var(--text-0);
}

.btn:hover:not(:disabled) {
	filter: brightness(1.1);
}

.btn:active:not(:disabled) {
	transform: scale(0.96);
	transition-duration: 0.05s;
}

.btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}
</style>
