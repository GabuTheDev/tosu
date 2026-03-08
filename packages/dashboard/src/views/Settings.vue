<script setup lang="ts">
import { ref, reactive } from 'vue';
import SettingItem from '@/components/SettingItem.vue';
import Input from '@/components/Input.vue';
import { type DropdownOption } from '@/components/inputs/Dropdown.vue';
import solidSprite from '@/assets/sprites/solid.svg';

type Tab = 'dashboard' | 'in-game' | 'data' | 'server' | 'advanced';
const currentTab = ref<Tab>('dashboard');

const themeOptions: DropdownOption<string>[] = [
	{ label: 'Dark Mode', value: 'dark' },
	{ label: 'Light Mode', value: 'light' },
	{ label: 'Midnight', value: 'midnight' },
	{ label: 'Osu Blue', value: 'blue' },
];

const ppVersionOptions: DropdownOption<string>[] = [
	{
		label: 'Live',
		value: 'live',
		link: 'https://github.com/Piotrekol/rosu-pp',
		icon: 'floppy-disk',
	},
	{
		label: 'Next',
		value: 'next',
		link: 'https://github.com/Piotrekol/rosu-pp/tree/next',
		icon: 'bolt',
	},
	{
		label: 'Reduce Strain Influence',
		value: 'reduce-strain-influence',
		link: 'https://github.com/Piotrekol/rosu-pp/pull/123',
		icon: 'flask',
	},
];

const defaultSettings = {
	// Dashboard
	theme: 'dark',
	hardwareAcceleration: true,
	overlayIdentifier: 'tosu-overlay',
	autoUpdate: true,
	openOnStartup: true,

	// In-Game
	enableIngameOverlay: false,
	ingameOverlayKeybind: 'Control + Shift + Space',
	ingameOverlayMaxFps: 144,

	// Data
	calculatePP: true,
	ppVersion: 'live',
	enableKeyOverlay: true,

	// Poll Rates
	pollRate: 100,
	precisePollRate: 0,

	// Server
	serverIp: '127.0.0.1',
	serverPort: 24050,
	allowedIps: ['localhost', 'absolute'],

	// Advanced
	debugMode: true,
	showMpCommands: false,
	staticFolderPath: './static',
};

// Use reactive state for settings (no persistence)
const settings = reactive({ ...defaultSettings });

const errors = reactive({
	serverIp: undefined as string | undefined,
	serverPort: undefined as string | undefined,
	pollRate: undefined as string | undefined,
	precisePollRate: undefined as string | undefined,
});

// Grouped Validators
const validators = {
	port: [(val: number) => (val < 1024 || val > 65535 ? 'Port must be between 1024 and 65535' : null)],
	pollRate: [(val: number) => (val < 100 ? 'Minimum poll rate is 100ms' : null)],
	precisePollRate: [(val: number) => (val < 0 ? 'Cannot be negative' : null)],
	ip: [
		(val: string) => {
			// Part of an IP can be 0-255 or a '*'
			const p = '(?:\\*|(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))';
			const ipWildcardRegex = new RegExp(`^(\\*|${p}\\.${p}\\.${p}\\.${p})$`);
			
			// Hostname must be 'localhost', 'absolute', or have at least one dot
			const hostRegex = /^(localhost|absolute|([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,6})$/;
			
			return ipWildcardRegex.test(val) || hostRegex.test(val) ? null : 'Invalid IP, Hostname or Wildcard';
		}
	],
};

const getIcon = (name: string): string => `${solidSprite}#${name}`;

const tabs: { id: Tab; label: string; icon: string }[] = [
	{ id: 'dashboard', label: 'Dashboard', icon: 'gauge-high' },
	{ id: 'in-game', label: 'In-Game', icon: 'gamepad' },
	{ id: 'data', label: 'Data', icon: 'database' },
	{ id: 'server', label: 'Server', icon: 'server' },
	{ id: 'advanced', label: 'Advanced', icon: 'screwdriver-wrench' },
];
</script>

<template>
	<div class="settings-page">
		<header class="page-header">
			<div class="header-info">
				<h1>Settings</h1>
				<p>Configure tosu dashboard and connection preferences.</p>
			</div>

			<nav class="settings-nav">
				<button
					v-for="tab in tabs"
					:key="tab.id"
					class="nav-item"
					:class="{ active: currentTab === tab.id }"
					@click="currentTab = tab.id"
				>
					<svg class="fa-icon"><use :href="getIcon(tab.icon)" /></svg>
					<span>{{ tab.label }}</span>
					<div class="active-indicator" />
				</button>
			</nav>
		</header>

		<main class="settings-main">
			<Transition name="fade" mode="out-in">
				<!-- Dashboard Tab -->
				<div v-if="currentTab === 'dashboard'" key="dashboard" class="settings-list">
					<SettingItem
						v-model="settings.theme"
						name="Theme"
						description="Choose your preferred dashboard visual style."
						:default-value="defaultSettings.theme"
					>
						<Input type="dropdown" v-model="settings.theme" :options="themeOptions" />
					</SettingItem>

					<SettingItem
						v-model="settings.openOnStartup"
						name="Open on Startup"
						description="Automatically launch the dashboard when your computer starts."
						:default-value="defaultSettings.openOnStartup"
					>
						<Input type="switch" v-model="settings.openOnStartup" />
					</SettingItem>
				</div>

				<!-- In-Game Tab -->
				<div v-else-if="currentTab === 'in-game'" key="in-game" class="settings-list">
					<SettingItem
						v-model="settings.enableIngameOverlay"
						name="In-Game Overlay"
						description="Enable the high-performance overlay directly inside osu!."
						:default-value="defaultSettings.enableIngameOverlay"
					>
						<Input type="switch" v-model="settings.enableIngameOverlay" />
					</SettingItem>

					<SettingItem
						v-model="settings.ingameOverlayKeybind"
						name="Overlay Toggle Keybind"
						description="The keyboard shortcut used to show/hide the in-game overlay."
						:default-value="defaultSettings.ingameOverlayKeybind"
						:disabled="!settings.enableIngameOverlay"
					>
						<Input type="keybind" v-model="settings.ingameOverlayKeybind" :disabled="!settings.enableIngameOverlay" />
					</SettingItem>

					<SettingItem
						v-model="settings.ingameOverlayMaxFps"
						name="Max Frame Rate"
						description="The refresh rate cap for the overlay. Recommended to match monitor Hz."
						:default-value="defaultSettings.ingameOverlayMaxFps"
						:disabled="!settings.enableIngameOverlay"
					>
						<Input type="number" v-model="settings.ingameOverlayMaxFps" :min="1" :max="999" :disabled="!settings.enableIngameOverlay" />
					</SettingItem>
				</div>

				<!-- Data Tab -->
				<div v-else-if="currentTab === 'data'" key="data" class="settings-list">
					<SettingItem
						v-model="settings.calculatePP"
						name="RT PP Calculation"
						description="Allow real-time calculation of performance points during gameplay."
						:default-value="defaultSettings.calculatePP"
					>
						<Input type="switch" v-model="settings.calculatePP" />
					</SettingItem>

					<SettingItem
						v-model="settings.ppVersion"
						name="PP Calculation Version"
						description="Select the version of the rosu-pp engine to use."
						:default-value="defaultSettings.ppVersion"
					>
						<Input type="dropdown" v-model="settings.ppVersion" :options="ppVersionOptions" />
					</SettingItem>

					<SettingItem
						v-model="settings.enableKeyOverlay"
						name="Key Overlay Data"
						description="Enable live retrieval of K1/K2/M1/M2 keypresses."
						:default-value="defaultSettings.enableKeyOverlay"
					>
						<Input type="switch" v-model="settings.enableKeyOverlay" />
					</SettingItem>
				</div>

				<!-- Server Tab -->
				<div v-else-if="currentTab === 'server'" key="server" class="settings-list">
					<SettingItem
						v-model="settings.serverIp"
						name="Listen IP"
						description="The local network address tosu will broadcast data on."
						:default-value="defaultSettings.serverIp"
						can-erase
					>
						<Input 
							type="text" 
							v-model="settings.serverIp" 
							v-model:error="errors.serverIp"
							placeholder="127.0.0.1" 
							:validators="validators.ip"
						/>
					</SettingItem>

					<SettingItem
						v-model="settings.serverPort"
						name="Server Port"
						description="The network port for the tosu background service."
						:default-value="defaultSettings.serverPort"
					>
						<Input 
							type="number"
							v-model="settings.serverPort" 
							v-model:error="errors.serverPort"
							:min="1024" 
							:max="65535" 
							:validators="validators.port"
						/>
					</SettingItem>

					<SettingItem
						v-model="settings.pollRate"
						name="Common Poll Rate"
						description="Global interval (ms) between memory reading requests."
						:default-value="defaultSettings.pollRate"
					>
						<Input 
							type="number"
							v-model="settings.pollRate" 
							v-model:error="errors.pollRate"
							:min="100" 
							:validators="validators.pollRate"
						/>
					</SettingItem>

					<SettingItem
						v-model="settings.precisePollRate"
						name="Precise Poll Rate"
						description="Interval (ms) for high-frequency data like KeyOverlay and HitError."
						:default-value="defaultSettings.precisePollRate"
					>
						<Input 
							type="number"
							v-model="settings.precisePollRate" 
							v-model:error="errors.precisePollRate"
							:min="0" 
							:validators="validators.precisePollRate"
						/>
					</SettingItem>

					<SettingItem
						v-model="settings.allowedIps"
						name="Allowed IPs"
						description="IPs permitted to connect. Supports wildcards (*). Press Enter, Space or Comma to add."
						:default-value="defaultSettings.allowedIps"
						vertical
					>
						<Input 
							type="chips"
							v-model="settings.allowedIps" 
							placeholder="e.g. 192.168.1.1" 
							:validators="validators.ip"
							:static-chips="[settings.serverIp]"
						/>
					</SettingItem>
				</div>

				<!-- Advanced Tab -->
				<div v-else-if="currentTab === 'advanced'" key="advanced" class="settings-list">
					<SettingItem
						v-model="settings.autoUpdate"
						name="Auto Update"
						description="Check for and install updates automatically on startup."
						:default-value="defaultSettings.autoUpdate"
					>
						<Input type="switch" v-model="settings.autoUpdate" />
					</SettingItem>

					<SettingItem
						v-model="settings.debugMode"
						name="Debugging Mode"
						description="Verbose logging. May impact performance."
						:default-value="defaultSettings.debugMode"
					>
						<Input type="switch" v-model="settings.debugMode" />
					</SettingItem>

					<SettingItem
						v-model="settings.showMpCommands"
						name="Multiplayer Commands"
						description="Show bancho !mp commands in tournament manager."
						:default-value="defaultSettings.showMpCommands"
					>
						<Input type="switch" v-model="settings.showMpCommands" />
					</SettingItem>

					<SettingItem
						v-model="settings.staticFolderPath"
						name="Counters Directory"
						description="Local path where overlay assets are stored."
						:default-value="defaultSettings.staticFolderPath"
						can-erase
					>
						<Input type="text" v-model="settings.staticFolderPath" />
					</SettingItem>
				</div>
			</Transition>
		</main>
	</div>
</template>

<style scoped>
.settings-page {
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100%;
}

.page-header {
	margin-bottom: 3rem;
	display: flex;
	flex-direction: column;
	gap: 2.5rem;
}

.header-info h1 {
	font-size: 2.25rem;
	color: var(--text-3);
	margin-bottom: 0.5rem;
}

.header-info p {
	color: var(--text-1);
	font-size: 1.125rem;
}

.settings-nav {
	display: flex;
	gap: 1.5rem;
	border-bottom: 2px solid var(--surface-2);
	padding-bottom: 0.75rem;
	width: 100%; /* Spans full available width */
}

.nav-item {
	background: none;
	border: none;
	padding: 0.5rem 1rem;
	color: var(--text-1);
	font-size: 0.9375rem;
	font-weight: 700;
	cursor: pointer;
	border-radius: var(--radius);
	transition: all 0.2s ease;
	user-select: none;
	display: flex;
	align-items: center;
	gap: 0.625rem;
	position: relative;
}

.nav-item .fa-icon {
	width: 1.125rem;
	height: 1.125rem;
	opacity: 0.6;
}

.nav-item:hover {
	color: var(--text-3);
	background-color: var(--surface-1);
}

.nav-item:hover .fa-icon {
	opacity: 1;
}

.nav-item.active {
	color: var(--tosu-blue);
	background-color: hsla(217, 53%, 53%, 0.1);
}

.nav-item.active .fa-icon {
	opacity: 1;
}

.active-indicator {
	position: absolute;
	bottom: -0.875rem;
	left: -0.5rem;
	right: -0.5rem;
	height: 2px;
	background-color: var(--tosu-blue);
	border-radius: 2px 2px 0 0;
	opacity: 0;
	transition: opacity 0.2s ease;
}

.nav-item.active .active-indicator {
	opacity: 1;
}

.settings-main {
	flex: 1;
	overflow-y: auto;
	overflow-x: hidden;
	padding-right: 12rem; /* Buffer zone for telescoping buttons */
}

.settings-list {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	width: 100%;
	max-width: 1000px;
}

.fa-icon {
	width: 1rem;
	height: 1rem;
}

/* Simple Cross-Fade Transition */
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
