<script setup lang="ts">
import Sidebar, { type SidebarItem } from '@/components/Sidebar.vue';
import Breadcrumbs from '@/components/Breadcrumbs.vue';
import solidSprite from '@/assets/sprites/solid.svg';
import brandsSprite from '@/assets/sprites/brands.svg';

const tabs: SidebarItem[] = [
	{ name: 'Home', path: '/', icon: 'house' },
	{ name: 'Library', path: '/library', icon: 'book', notification: { type: 'count', value: 25 } },
	{ name: 'Discover', path: '/discover', icon: 'compass', notification: { type: 'dot' } },
	{ name: 'Components', path: '/components', icon: 'layer-group' },
];

const footerTabs: SidebarItem[] = [
	{ name: 'Keybinds', action: () => {}, icon: 'keyboard' },
	{ name: 'Settings', path: '/settings', icon: 'gear' },
];
</script>

<template>
	<div class="layout">
		<Sidebar :tabs="tabs" :footer-tabs="footerTabs" />
		<main>
			<header>
				<Breadcrumbs />

				<div class="header-actions">
					<a href="https://google.com/" target="_blank" rel="noopener" title="GitHub" class="github">
						<svg class="fa-icon">
							<use :href="`${brandsSprite}#github`" />
						</svg>
					</a>
					<a href="https://google.com/" target="_blank" rel="noopener" title="Website" class="website">
						<svg class="fa-icon">
							<use :href="`${solidSprite}#globe`" />
						</svg>
					</a>
					<a href="https://google.com/" target="_blank" rel="noopener" title="Discord" class="discord">
						<svg class="fa-icon">
							<use :href="`${brandsSprite}#discord`" />
						</svg>
					</a>
					<a href="https://google.com/" target="_blank" rel="noopener" title="Donate" class="donate">
						<svg class="fa-icon">
							<use :href="`${solidSprite}#heart`" />
						</svg>
					</a>
					<button class="credits-btn" title="Show Credits">
						<svg class="fa-icon">
							<use :href="`${solidSprite}#circle-info`" />
						</svg>
					</button>
				</div>
			</header>
			<section class="content">
				<RouterView />
			</section>
			<footer>
				<div class="status-item">
					<span class="label">tosu version:</span>
					<span class="value">v2.0.0-beta</span>
				</div>
				<div class="spacer"></div>
				<div class="status-item">
					<span class="label">Status:</span>
					<span class="value success">Connected</span>
				</div>
			</footer>
		</main>
	</div>
</template>

<style scoped>
.layout {
	display: flex;
	height: 100vh;
	width: 100vw;
	overflow: hidden;
}

main {
	flex: 1;
	display: flex;
	flex-direction: column;
	min-width: 0;
	background-color: var(--surface-0);
}

header {
	display: flex;
	align-items: center;
	padding: 0.5em 0.5em 0.5em 1lh;
	border-bottom: 2px solid var(--surface-2);
	flex-shrink: 0;
	gap: 1em;
}

.header-actions {
	height: 3em;
	display: flex;
	align-items: center;
	margin-left: auto;
	gap: 0.25em;

	a,
	button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5em;
		height: 2.5em;
		border-radius: var(--radius);
		color: var(--text-1);
		transition: all 0.2s ease;
		text-decoration: none;

		&:hover {
			background-color: var(--surface-2);
			color: var(--text-3);
		}

		.fa-icon {
			width: 1.25em;
			height: 1.25em;
		}

		&.github:hover {
			color: #fff;
			background-color: #24292e;
		}
		&.website:hover {
			color: #fff;
			background-color: var(--tosu-blue);
		}
		&.discord:hover {
			color: #fff;
			background-color: #5865f2;
		}
		&.donate:hover {
			color: #fff;
			background-color: #ff5e5b;
		}
		&.credits-btn:hover {
			color: #fff;
			background-color: var(--surface-2);
		}
	}
}

.content {
	flex: 1;
	overflow-y: auto;
	padding: 2.5rem;
}

footer {
	height: 3em;
	display: flex;
	align-items: center;
	padding: 0 0.5em;
	border-top: 2px solid var(--surface-2);
	flex-shrink: 0;
	background-color: var(--surface-1);
	font-size: 0.875em;
	gap: 1.5em;
}

.status-item {
	display: flex;
	align-items: center;
	gap: 0.5em;

	.label {
		color: var(--text-0);
		font-weight: 500;
	}

	.value {
		color: var(--text-2);
		font-weight: 600;

		&.success {
			color: var(--success);
		}
	}
}

.spacer {
	flex: 1;
}
</style>
