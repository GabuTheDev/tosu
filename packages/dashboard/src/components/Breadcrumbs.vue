<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import solidSprite from '@/assets/sprites/solid.svg';

const route = useRoute();

const breadcrumbs = computed(() => {
	const matched = route.matched.filter((r) => r.path !== '');

	const crumbs = matched.map((r) => {
		let name = (r.name as string) || r.path.split('/').pop() || '';

		if (r.path === '/') name = 'Home';

		return {
			name,
			path: r.path || '/',
		};
	});

	if (crumbs.length === 0 || crumbs[0]?.path !== '/') {
		crumbs.unshift({ name: 'Home', path: '/' });
	}

	return crumbs;
});

const getIcon = (name: string): string => `${solidSprite}#${name}`;
</script>

<template>
	<nav class="breadcrumbs">
		<template v-for="(crumb, index) in breadcrumbs" :key="crumb.path">
			<RouterLink :to="crumb.path" class="crumb-link" :class="{ active: index === breadcrumbs.length - 1 }">
				<svg v-if="crumb.name === 'Home'" class="fa-icon home-icon">
					<use :href="getIcon('house')" />
				</svg>
				<span v-else>{{ crumb.name }}</span>
			</RouterLink>

			<div v-if="index < breadcrumbs.length - 1" class="separator">/</div>
		</template>
	</nav>
</template>

<style scoped>
.breadcrumbs {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.25rem 0;
}

.crumb-link {
	text-decoration: none;
	color: var(--text-2);
	font-weight: 700;
	font-size: 0.875rem;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	border-radius: 4px;
}

.crumb-link:hover {
	color: var(--text-0);
}

.crumb-link.active {
	color: var(--text-0);
	pointer-events: none;
}

.home-icon {
	width: 1rem;
	height: 1rem;
}

.separator {
	color: var(--text-3);
	font-family: var(--font-family-mono), monospace;
	font-size: 0.75rem;
	opacity: 0.4;
	user-select: none;
}
</style>
