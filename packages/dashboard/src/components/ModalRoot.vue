<script setup lang="ts">
import { defineAsyncComponent, shallowRef, watch, onMounted, onUnmounted, h } from 'vue';
import { useModal } from '@/composables/useModal';

const { activeModal, isActive, close } = useModal();
const currentComponent = shallowRef<any>(null);

watch(
	() => activeModal.value.componentName,
	(name) => {
		if (!name) {
			currentComponent.value = null;
			return;
		}

		currentComponent.value = defineAsyncComponent({
			loader: () => import(`./modals/${name}.vue`),
			loadingComponent: { render: () => h('div', { class: 'modal-loading' }, 'Loading...') },
			errorComponent: { render: () => h('div', { class: 'modal-error' }, 'Error loading modal') },
		});
	},
	{ immediate: true },
);

watch(
	isActive,
	(active) => {
		document.body.style.overflow = active ? 'hidden' : '';
	},
	{ immediate: true },
);

const handleKeydown = (e: KeyboardEvent) => {
	if (e.key === 'Escape' && isActive.value) {
		close();
	}
};

const handleOverlayClick = (e: MouseEvent) => {
	if (e.target === e.currentTarget) {
		close();
	}
};

onMounted(() => window.addEventListener('keydown', handleKeydown));
onUnmounted(() => {
	window.removeEventListener('keydown', handleKeydown);
	document.body.style.overflow = '';
});
</script>

<template>
	<Teleport to="body">
		<transition name="modal-fade">
			<div
				v-if="activeModal.componentName"
				class="modal-overlay"
				role="dialog"
				aria-modal="true"
				@mousedown="handleOverlayClick"
			>
				<div class="modal-container">
					<component :is="currentComponent" v-bind="activeModal.props" @close="close" />
				</div>
			</div>
		</transition>
	</Teleport>
</template>

<style scoped>
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	background-color: rgba(0, 0, 0, 0.7);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
	backdrop-filter: blur(4px);
}

.modal-container {
	background-color: var(--surface-1);
	border: 1px solid var(--surface-2);
	border-radius: var(--radius);
	max-width: 90vw;
	max-height: 90vh;
	overflow-y: auto;
	box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

/* Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
	transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
	opacity: 0;
}

.modal-fade-enter-active .modal-container {
	animation: modal-pop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modal-pop {
	from {
		transform: scale(0.9);
		opacity: 0;
	}
	to {
		transform: scale(1);
		opacity: 1;
	}
}
</style>
