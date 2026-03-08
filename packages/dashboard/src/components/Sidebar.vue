<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import solidIcons from '@/assets/sprites/solid.svg';
import { useStorage, storageKeys } from '@/composables/useStorage';

export interface SidebarItem {
	name: string;
	icon: string;
	path?: string;
	action?: () => void;
	notification?: {
		type: 'dot' | 'count';
		value?: number;
	};
}

defineProps<{
	tabs: SidebarItem[];
	footerTabs?: SidebarItem[];
}>();

const { getItem, setItem } = useStorage();
const collapsed = ref(getItem<boolean>(storageKeys.sidebarCollapsed) ?? false);

const getIcon = (name: string): string => {
	return `${solidIcons}#${name}`;
};

const toggleSidebar = (): void => {
	collapsed.value = !collapsed.value;
	setItem(storageKeys.sidebarCollapsed, collapsed.value);
};
</script>

<template>
	<aside class="sidebar" :class="{ collapsed }">
		<header class="sidebar-header">
			<div class="brand-container">
				<RouterLink to="/" class="brand">
					<img src="@/assets/images/logo.png" alt="logo" />
					<span>tosu.app</span>
				</RouterLink>
			</div>

			<button class="toggle-btn" @click="toggleSidebar">
				<svg class="fa-icon">
					<use :href="getIcon('caret-left')" />
				</svg>
			</button>
		</header>

		<nav class="sidebar-nav">
			<component
				:is="tab.path ? RouterLink : 'button'"
				v-for="tab in tabs"
				:key="tab.name"
				class="nav-item"
				v-bind="tab.path ? { to: tab.path } : {}"
				@click="tab.action"
			>
				<div class="icon-container">
					<svg class="fa-icon">
						<use :href="getIcon(tab.icon)" />
					</svg>
				</div>

				<span class="label">{{ tab.name }}</span>

				<div
					v-if="tab.notification"
					class="badge"
					:class="[
						tab.notification.type,
						{ 'hidden-collapsed': tab.notification.type === 'count' && collapsed },
					]"
				>
					<span v-if="tab.notification.type === 'count'">{{ tab.notification.value }}</span>
				</div>
			</component>
		</nav>

		<footer v-if="footerTabs" class="sidebar-footer">
			<component
				:is="tab.path ? RouterLink : 'button'"
				v-for="tab in footerTabs"
				:key="tab.name"
				class="nav-item"
				v-bind="tab.path ? { to: tab.path } : {}"
				@click="tab.action"
			>
				<div class="icon-container">
					<svg class="fa-icon">
						<use :href="getIcon(tab.icon)" />
					</svg>
				</div>
				<span class="label">{{ tab.name }}</span>
			</component>
		</footer>
	</aside>
</template>

<style scoped>
.sidebar {
	--sb-expanded: 16em;
	--sb-collapsed: 4em;
	display: flex;
	flex-direction: column;
	width: var(--sb-expanded);
	height: 100vh;
	background-color: var(--surface-1);
	border-right: 2px solid var(--surface-2);
	padding: 0.5em calc(0.5em - 1px);
	transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	overflow: hidden;
}

.sidebar-header {
	display: flex;
	align-items: center;
	border-bottom: 2px solid var(--surface-2);
	position: relative;
	padding-bottom: 0.5em;
	margin-bottom: 0.5em;
}

.brand-container {
	flex: 1;
	overflow: hidden;
	display: flex;
	height: 3em;
}

.brand {
	display: flex;
	align-items: center;
	height: 100%;
	text-decoration: none;
	gap: 0.75em;
	padding: 0 0.5em;
	white-space: nowrap;
	transition:
		opacity 1s ease,
		transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.brand img {
	width: 2em;
	height: 2em;
	object-fit: contain;
	flex-shrink: 0;
}

.brand span {
	font-family: var(--font-family-base), serif;
	font-weight: 700;
	font-size: 1.25em;
	color: var(--text-0);
}

.toggle-btn {
	width: 3em;
	height: 3em;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	color: var(--text-2);
	border-radius: var(--radius);
	flex-shrink: 0;
	transition: all 0.2s ease;
	background: none;
	border: none;
}

.toggle-btn:hover {
	color: var(--text-0);
	background-color: var(--surface-2);
}

.sidebar-nav,
.sidebar-footer {
	display: flex;
	flex-direction: column;
	gap: 0.25em;
}

.sidebar-footer {
	margin-top: auto;
	border-top: 2px solid var(--surface-2);
	padding-top: 0.5em;
}

.nav-item {
	display: flex;
	align-items: center;
	height: 3em;
	border-radius: var(--radius);
	color: var(--text-2);
	text-decoration: none;
	white-space: nowrap;
	position: relative;
	transition:
		background-color 0.2s ease,
		color 0.2s ease;
	background: none;
	border: none;
	padding: 0;
	cursor: pointer;
	font: inherit;
	text-align: left;
}

.nav-item:hover,
.nav-item.router-link-active {
	background-color: var(--surface-2);
}

.nav-item:hover {
	color: var(--text-0);
}

.nav-item.router-link-active {
	color: var(--text-0);
}

.nav-item .label {
	font-weight: 600;
	padding-right: 4.5em;
	flex: 1;
	min-width: 0;
	transition:
		opacity 0.2s ease,
		transform 0.4s ease;
}

.sidebar.collapsed {
	width: var(--sb-collapsed);
}

.sidebar.collapsed .brand {
	opacity: 0;
	transform: translateX(-150%);
	pointer-events: none;
}

.sidebar.collapsed .toggle-btn .fa-icon {
	transform: rotate(180deg);
}

.sidebar.collapsed .label {
	opacity: 0;
	transform: translateX(-10px);
	pointer-events: none;
}

.sidebar.collapsed .badge.dot {
	right: 0.5rem;
	top: 0.5rem;
	transform: none;
}

.sidebar.collapsed .badge.hidden-collapsed {
	opacity: 0;
}

.icon-container {
	width: 3em;
	height: 3em;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	position: relative;
}

.fa-icon {
	width: 1.5em;
	height: 1.5em;
	transition: transform 0.4s ease;
}

.badge {
	position: absolute;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: var(--accent);
	color: var(--text-0);
	pointer-events: none;
	z-index: 5;
	right: 1rem;
	top: 50%;
	transform: translateY(-50%);
	transition:
		right 0.4s cubic-bezier(0.4, 0, 0.2, 1),
		top 0.4s cubic-bezier(0.4, 0, 0.2, 1),
		transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
		opacity 0.2s ease,
		box-shadow 0.2s ease;
}

.badge.dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
}

.badge.count {
	font-size: 0.75rem;
	font-weight: 700;
	min-width: 2em;
	padding: 0.5em;
	right: 0.75rem;
	height: 2em;
	border-radius: calc(var(--radius) - 0.5em);
	background-color: var(--surface-1);
	color: var(--text-2);
}
</style>
