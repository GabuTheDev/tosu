import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const deprecatedRoutes: RouteRecordRaw[] = [
	{
		path: '/available',
		redirect: '/discover',
	},
];

const routes: RouteRecordRaw[] = [
	{
		path: '/',
		name: 'Home',
		component: () => import('@/views/Main.vue'),
	},
	{
		path: '/discover',
		name: 'Discover',
		component: () => import('@/views/Discover.vue'),
	},
	{
		path: '/library',
		name: 'Library',
		component: () => import('@/views/Library.vue'),
	},
	{
		path: '/settings',
		name: 'Settings',
		component: () => import('@/views/Settings.vue'),
	},
	{
		path: '/components',
		name: 'Components',
		component: () => import('@/views/Components.vue'),
	},

	...deprecatedRoutes,
];

const history = createWebHistory();
const router = createRouter({ history, routes });

export default router;
