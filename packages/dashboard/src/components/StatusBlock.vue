<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useStatus } from '@/composables/useStatus';
import solidSprite from '@/assets/sprites/solid.svg';

const { status } = useStatus();
const showLoading = ref(false);
let loadingTimeout: ReturnType<typeof setTimeout> | null = null;

watch(() => status.visible, (visible) => {
	if (loadingTimeout) clearTimeout(loadingTimeout);
	if (visible && status.type === 'loading') {
		showLoading.value = false;
		loadingTimeout = setTimeout(() => {
			showLoading.value = true;
		}, 200);
	} else {
		showLoading.value = true;
	}
}, { immediate: true });

onUnmounted(() => {
	if (loadingTimeout) clearTimeout(loadingTimeout);
});

const getIcon = (name: string): string => `${solidSprite}#${name}`;
</script>

<template>
	<Transition name="fade" mode="out-in">
		<div v-if="status.visible && showLoading" key="status" class="settings-status-container">
			<div class="status-block" :class="status.type">
				<div class="status-icon">
					<svg class="fa-icon">
						<use :href="getIcon(status.type === 'error' ? 'circle-exclamation' : 'spinner')" />
					</svg>
				</div>
				<div class="status-content">
					<h2>{{ status.title || (status.type === 'error' ? 'Error' : 'Loading') }}</h2>
					<p v-if="status.message">{{ status.message }}</p>
					<div v-if="status.detail" class="error-detail">{{ status.detail }}</div>
					<div v-if="status.retryIn && status.retryIn > 0" class="retry-timer">
						<span>Retrying in {{ status.retryIn }}s</span>
					</div>
				</div>
			</div>
		</div>
	</Transition>
</template>

<style scoped>
.settings-status-container {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 2rem;
	background-color: hsla(0, 0%, 6%, 0.7);
	backdrop-filter: blur(8px);
	z-index: 1000;
	user-select: none;
}

.status-block {
	background-color: var(--surface-1);
	border: 1px solid var(--surface-2);
	border-radius: var(--radius);
	padding: 2.5rem;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1.25rem;
	max-width: 500px;
	width: 100%;
	text-align: center;
	position: relative;
	overflow: hidden;
	user-select: text;
}

.status-block::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 3px;
	background: var(--tosu-blue);
}

.status-block.error::before {
	background: var(--danger);
}

.status-block.loading {
	padding: 2rem;
}

.status-block.loading span {
	font-size: 1rem;
	font-weight: 700;
	color: var(--text-2);
}

.status-icon {
	width: 3.5rem;
	height: 3.5rem;
	background-color: hsla(0, 0%, 100%, 0.03);
	border: 1px solid var(--surface-2);
	border-radius: 1rem;
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--danger);
	margin-bottom: 0.25rem;
}

.status-icon .fa-icon {
	width: 1.75rem;
	height: 1.75rem;
}

.status-content h2 {
	font-size: 1.5rem;
	font-weight: 800;
	margin-bottom: 0.5rem;
	color: var(--text-0);
}

.status-content p {
	color: var(--text-2);
	margin-bottom: 1.25rem;
	font-size: 0.9375rem;
	line-height: 1.5;
}

.error-detail {
	background-color: var(--surface-0);
	padding: 0.875rem;
	border-radius: var(--radius);
	font-family: var(--font-family-mono);
	font-size: 0.75rem;
	color: var(--danger);
	margin-bottom: 1.5rem;
	word-break: break-all;
	border: 1px solid var(--surface-2);
	text-align: center;
}

.retry-timer {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: var(--text-3);
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	font-size: 0.75rem;
}

.spin {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
