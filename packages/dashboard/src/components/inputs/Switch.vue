<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue';

interface Props {
	disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	disabled: false,
});

const model = defineModel<boolean>({ required: true });

const trackRef = ref<HTMLElement | null>(null);
const drag = reactive({
	active: false,
	hasMoved: false,
	offset: 0,
	startX: 0,
	travel: 0,
});

const updateMeasurements = () => {
	if (!trackRef.value) return;

	const style = getComputedStyle(trackRef.value);
	const height = trackRef.value.offsetHeight;
	const width = trackRef.value.offsetWidth;
	const padding = parseFloat(style.paddingLeft) || 0;
	const thumbSize = height - padding * 2;

	drag.travel = width - thumbSize - padding * 2;
};

const onPointerMove = (e: PointerEvent) => {
	if (!drag.active) return;

	const delta = e.clientX - drag.startX;
	if (Math.abs(delta) > 3) drag.hasMoved = true;

	const currentBase = model.value ? drag.travel : 0;
	let newOffset = currentBase + delta;

	newOffset = Math.max(0, Math.min(drag.travel, newOffset));
	drag.offset = newOffset;
};

const onPointerUp = () => {
	if (!drag.active) return;

	drag.active = false;
	document.body.style.userSelect = '';

	if (!drag.hasMoved) {
		model.value = !model.value;
	} else {
		model.value = drag.offset > drag.travel / 2;
	}

	window.removeEventListener('pointermove', onPointerMove);
	window.removeEventListener('pointerup', onPointerUp);
};

const onPointerDown = (e: PointerEvent) => {
	if (props.disabled) return;

	updateMeasurements();
	drag.active = true;
	drag.hasMoved = false;
	drag.startX = e.clientX;
	drag.offset = model.value ? drag.travel : 0;

	window.addEventListener('pointermove', onPointerMove);
	window.addEventListener('pointerup', onPointerUp);

	document.body.style.userSelect = 'none';
};

const isVisualActive = computed(() => {
	return drag.active ? drag.offset > drag.travel / 2 : model.value;
});

const thumbStyle = computed(() => {
	if (drag.active) {
		return {
			transform: `translateX(${drag.offset}px) scale(0.9)`,
			transition: 'none',
		};
	}

	return {
		transform: model.value ? `translateX(${drag.travel}px)` : 'translateX(0)',
	};
});

onMounted(() => {
	updateMeasurements();
	window.addEventListener('resize', updateMeasurements);
});

onUnmounted(() => {
	window.removeEventListener('resize', updateMeasurements);
	window.removeEventListener('pointermove', onPointerMove);
	window.removeEventListener('pointerup', onPointerUp);
});
</script>

<template>
	<div
		ref="trackRef"
		class="switch"
		:class="{ active: isVisualActive, disabled, isDragging: drag.active }"
		@pointerdown="onPointerDown"
	>
		<div class="thumb" :style="thumbStyle" />
	</div>
</template>

<style scoped>
.switch {
	--sw-width: 3.25em;
	--sw-height: 1.75em;
	--sw-padding: 0.25em;
	--sw-thumb-size: calc(var(--sw-height) - (var(--sw-padding) * 2));

	width: var(--sw-width);
	height: var(--sw-height);
	background-color: var(--surface-3);
	border-radius: 2em;
	position: relative;
	cursor: pointer;
	user-select: none;
	flex-shrink: 0;
	transition: background-color 0.2s ease;
	touch-action: none;
}

.switch.active {
	background-color: var(--accent);
}

.thumb {
	position: absolute;
	top: var(--sw-padding);
	left: var(--sw-padding);
	width: var(--sw-thumb-size);
	height: var(--sw-thumb-size);
	background-color: var(--text-0);
	border-radius: 50%;
	pointer-events: none;
	transition: transform 0.25s cubic-bezier(0.23, 1, 0.32, 1);
}

.switch:hover:not(.active):not(.disabled) {
	background-color: var(--surface-4);
}

.switch.active:hover:not(.disabled) {
	background-color: var(--accent);
	filter: brightness(1.1);
}

.disabled {
	opacity: 0.5;
	cursor: not-allowed;
}
</style>
