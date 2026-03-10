<script setup lang="ts">
import { computed, type Component } from 'vue';
import { useRoute } from 'vue-router';
import ModalRoot from '@/components/ModalRoot.vue';

const layoutModules = import.meta.glob<Component>('./layouts/*.vue', {
	eager: true,
	import: 'default',
});

const layouts = Object.entries(layoutModules).reduce<Record<string, Component>>((acc, [path, component]) => {
	const name = path.split('/').pop()?.replace('.vue', '') + 'Layout';
	acc[name] = component;
	return acc;
}, {});

const route = useRoute();

const layout = computed(() => {
	const layoutName = route.meta?.layout as string;
	return layouts[layoutName] || layouts.DefaultLayout;
});
</script>

<template>
	<component :is="layout" />
	<ModalRoot />
</template>
