<script setup lang="ts">
interface Props {
	variant?: 'primary' | 'secondary';
	disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
	variant: 'primary',
	disabled: false,
});

defineEmits<{
	(e: 'click', event: MouseEvent): void;
}>();
</script>

<template>
	<button type="button" :disabled="disabled" class="btn" :class="[variant]" @click="$emit('click', $event)">
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
	color: var(--text-3);
}

.btn.secondary {
	background-color: var(--surface-2);
	color: var(--text-2);
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
