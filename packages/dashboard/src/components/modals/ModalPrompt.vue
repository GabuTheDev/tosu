<script setup lang="ts" generic="T = any">
import { onMounted, onUnmounted } from 'vue';
import Button from '@/components/Button.vue';

interface ModalButton {
	variant?: 'primary' | 'secondary' | 'danger';
	label: string;
	value: T;
	color?: string;
}

interface Props {
	title?: string;
	message?: string;
	buttons?: ModalButton[];
}

const props = withDefaults(defineProps<Props>(), {
	title: 'Prompt',
	message: '',
	buttons: () => [
		{ label: 'Cancel', variant: 'secondary', value: false as any },
		{ label: 'Confirm', variant: 'primary', value: true as any },
	],
});

const emit = defineEmits<{
	(e: 'close', result?: T): void;
}>();

const handleKeydown = (e: KeyboardEvent) => {
	if (e.key === 'Enter') {
		const primaryBtn =
			props.buttons.find((b) => b.variant === 'primary') || props.buttons[props.buttons.length - 1];
		if (primaryBtn) emit('close', primaryBtn.value);
	}
};

onMounted(() => window.addEventListener('keydown', handleKeydown));
onUnmounted(() => window.removeEventListener('keydown', handleKeydown));
</script>

<template>
	<div class="modal-prompt">
		<header class="modal-header">
			<h3>{{ title }}</h3>
		</header>

		<section class="modal-body">
			<p v-if="message">{{ message }}</p>
		</section>

		<footer class="modal-footer">
			<Button
				v-for="(btn, index) in buttons"
				:key="index"
				:variant="btn.variant || 'secondary'"
				:color="btn.color"
				@click="emit('close', btn.value)"
			>
				{{ btn.label }}
			</Button>
		</footer>
	</div>
</template>

<style scoped>
.modal-prompt {
	min-width: min(25rem, 90vw);
	max-width: 35rem;
	padding: 1.5rem;
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}

.modal-header h3 {
	margin: 0;
	font-size: 1.25rem;
	color: var(--text-0);
	font-weight: 800;
}

.modal-body p {
	margin: 0;
	color: var(--text-2);
	line-height: 1.5;
	font-size: 0.9375rem;
}

.modal-footer {
	display: flex;
	justify-content: flex-end;
	gap: 0.75rem;
	margin-top: 0.5rem;
}
</style>
