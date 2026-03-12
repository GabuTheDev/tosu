<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import SettingItem from '@/components/SettingItem.vue';
import Input from '@/components/Input.vue';
import { type DropdownOption } from '@/components/inputs/Dropdown.vue';
import { useSettings } from '@/composables/useSettings';
import { useStorage } from '@/composables/useStorage';
import solidSprite from '@/assets/sprites/solid.svg';

const tabs = [
	{ name: 'Dashboard', icon: 'gauge-high' },
	{ name: 'In-Game', icon: 'gamepad' },
	{ name: 'Data', icon: 'database' },
	{ name: 'Server', icon: 'server' },
	{ name: 'Advanced', icon: 'screwdriver-wrench' },
] as const;

type Tab = (typeof tabs)[number]['name'];
const currentTab = ref<Tab>(tabs[0].name);

const { settings, isSaving, fetchSettings } = useSettings();
const { localSettings, localDefaults } = useStorage();

const errors = reactive({} as Record<string, string | undefined>);

const themeOptions: DropdownOption<string>[] = [
	{ label: 'Dark Mode', value: 'dark' },
	{ label: 'Light Mode', value: 'light' },
	{ label: 'Midnight', value: 'midnight' },
	{ label: 'Osu Blue', value: 'blue' },
];

const portValidators = [(val: number) => (val < 1024 || val > 65535 ? 'Port must be between 1024 and 65535' : null)];
const pollRateValidators = [(val: number) => (val < 100 ? 'Minimum poll rate is 100ms' : null)];
const ipValidators = [
	(val: string) => {
		const p = '(?:\\*|(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))';
		const ipWildcardRegex = new RegExp(`^(\\*|${p}\\.${p}\\.${p}\\.${p})$`);
		const hostRegex = /^(localhost|absolute|([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,6})$/;
		return ipWildcardRegex.test(val) || hostRegex.test(val) ? null : 'Invalid IP, Hostname or Wildcard';
	},
];

const getIcon = (name: string): string => `${solidSprite}#${name}`;
</script>

<template>
	<div class="settings-page">
		<div class="settings-container">
			<header class="page-header">
				<div class="header-info">
					<div class="header-top">
						<h1>Settings</h1>
						<Transition name="fade">
							<div v-if="isSaving" class="save-status">
								<svg class="fa-icon spin"><use :href="getIcon('spinner')" /></svg>
								<span>Saving...</span>
							</div>
						</Transition>
					</div>
					<p>Configure tosu dashboard and connection preferences.</p>
				</div>

				<nav class="settings-nav">
					<button
						v-for="tab in tabs"
						:key="tab.name"
						class="nav-item"
						:class="{ active: currentTab === tab.name }"
						@click="currentTab = tab.name"
					>
						<svg class="fa-icon"><use :href="getIcon(tab.icon)" /></svg>
						<span>{{ tab.name }}</span>
						<div class="active-indicator" />
					</button>
				</nav>
			</header>

			<main class="settings-main">
				<Transition name="fade" mode="out-in">
					<div v-if="currentTab === 'Dashboard'" key="dashboard" class="settings-list">
						<SettingItem
							v-model="localSettings.theme"
							name="Theme"
							description="Choose your preferred dashboard visual style."
							:default-value="localDefaults.theme"
						>
							<Input v-model="localSettings.theme" type="dropdown" :options="themeOptions" />
						</SettingItem>

						<SettingItem
							v-model="settings.openDashboardOnStartup"
							name="Open on Startup"
							description="Automatically launch the dashboard when your computer starts."
						>
							<Input v-model="settings.openDashboardOnStartup" type="switch" />
						</SettingItem>
					</div>

					<div v-else-if="currentTab === 'In-Game'" key="in-game" class="settings-list">
						<SettingItem
							v-model="settings.enableIngameOverlay"
							name="In-Game Overlay"
							description="Enable the high-performance overlay directly inside osu!."
						>
							<Input v-model="settings.enableIngameOverlay" type="switch" />
						</SettingItem>

						<SettingItem
							v-model="settings.ingameOverlayKeybind"
							name="Overlay Toggle Keybind"
							description="The keyboard shortcut used to show/hide the in-game overlay."
							:disabled="!settings.enableIngameOverlay"
						>
							<Input
								v-model="settings.ingameOverlayKeybind"
								type="keybind"
								:disabled="!settings.enableIngameOverlay"
							/>
						</SettingItem>

						<SettingItem
							v-model="settings.ingameOverlayMaxFps"
							name="Max Frame Rate"
							description="The refresh rate cap for the overlay. Recommended to match monitor Hz."
							:disabled="!settings.enableIngameOverlay"
						>
							<Input
								v-model="settings.ingameOverlayMaxFps"
								type="number"
								:min="1"
								:max="999"
								:disabled="!settings.enableIngameOverlay"
							/>
						</SettingItem>
					</div>

					<div v-else-if="currentTab === 'Data'" key="data" class="settings-list">
						<SettingItem
							v-model="settings.calculatePP"
							name="RT PP Calculation"
							description="Allow real-time calculation of performance points during gameplay."
						>
							<Input v-model="settings.calculatePP" type="switch" />
						</SettingItem>

						<SettingItem
							v-model="settings.enableKeyOverlay"
							name="Key Overlay Data"
							description="Enable live retrieval of K1/K2/M1/M2 keypresses."
						>
							<Input v-model="settings.enableKeyOverlay" type="switch" />
						</SettingItem>
					</div>

					<div v-else-if="currentTab === 'Server'" key="server" class="settings-list">
						<SettingItem
							v-model="settings.serverIP"
							name="Listen IP"
							description="The local network address tosu will broadcast data on."
							can-erase
						>
							<Input
								v-model="settings.serverIP"
								v-model:error="errors.serverIP"
								type="text"
								placeholder="127.0.0.1"
								:validators="ipValidators"
							/>
						</SettingItem>

						<SettingItem
							v-model="settings.serverPort"
							name="Server Port"
							description="The network port for the tosu background service."
						>
							<Input
								v-model="settings.serverPort"
								v-model:error="errors.serverPort"
								type="number"
								:min="1024"
								:max="65535"
								:validators="portValidators"
							/>
						</SettingItem>

						<SettingItem
							v-model="settings.pollRate"
							name="Common Poll Rate"
							description="Global interval (ms) between memory reading requests."
						>
							<Input
								v-model="settings.pollRate"
								v-model:error="errors.pollRate"
								type="number"
								:min="100"
								:validators="pollRateValidators"
							/>
						</SettingItem>

						<SettingItem
							v-model="settings.preciseDataPollRate"
							name="Precise Poll Rate"
							description="Interval (ms) for high-frequency data like KeyOverlay and HitError."
						>
							<Input
								v-model="settings.preciseDataPollRate"
								v-model:error="errors.preciseDataPollRate"
								type="number"
								:min="0"
							/>
						</SettingItem>

						<SettingItem
							v-model="settings.allowedIPs"
							name="Allowed IPs"
							description="IPs permitted to connect. Supports wildcards (*). Press Enter, Space or Comma to add."
							vertical
						>
							<Input
								v-model="settings.allowedIPs"
								type="chips"
								placeholder="e.g. 192.168.1.1"
								:validators="ipValidators"
								:static-chips="[settings.serverIP]"
							/>
						</SettingItem>
					</div>

					<div v-else-if="currentTab === 'Advanced'" key="advanced" class="settings-list">
						<SettingItem
							v-model="settings.enableAutoUpdate"
							name="Auto Update"
							description="Check for and install updates automatically on startup."
						>
							<Input v-model="settings.enableAutoUpdate" type="switch" />
						</SettingItem>

						<SettingItem
							v-model="settings.debugLog"
							name="Debugging Mode"
							description="Verbose logging. May impact performance."
						>
							<Input v-model="settings.debugLog" type="switch" />
						</SettingItem>

						<SettingItem
							v-model="settings.showMpCommands"
							name="Multiplayer Commands"
							description="Show bancho !mp commands in tournament manager."
						>
							<Input v-model="settings.showMpCommands" type="switch" />
						</SettingItem>

						<SettingItem
							v-model="settings.staticFolderPath"
							name="Overlays Directory"
							description="Local path where overlay assets are stored."
							can-erase
						>
							<Input v-model="settings.staticFolderPath" type="text" />
						</SettingItem>
					</div>
				</Transition>
			</main>
		</div>
	</div>
</template>

<style scoped>
.settings-page {
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100%;
	position: relative;
}

.settings-status-container {
	position: fixed;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 2rem;
	background-color: hsla(0, 0%, 6%, 0.8);
	backdrop-filter: blur(8px);
	z-index: 1000;
}

.status-block {
	background-color: var(--surface-1);
	border: 1px solid var(--surface-2);
	border-radius: var(--radius);
	padding: 3rem;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 1.5rem;
	max-width: 550px;
	width: 100%;
	text-align: center;
	box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.status-block.error {
	border-top: 4px solid var(--danger);
}

.status-block.loading {
	color: var(--text-2);
	font-size: 1.25rem;
	font-weight: 700;
	padding: 2.5rem;
}

.status-icon {
	width: 4.5rem;
	height: 4.5rem;
	background-color: hsla(0, 60%, 65%, 0.1);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--danger);
	margin-bottom: 0.5rem;
}

.status-icon .fa-icon {
	width: 2.25rem;
	height: 2.25rem;
}

.status-content h2 {
	font-size: 1.875rem;
	font-weight: 800;
	margin-bottom: 0.75rem;
	color: var(--text-0);
}

.status-content p {
	color: var(--text-2);
	margin-bottom: 1.5rem;
	font-size: 1.0625rem;
	line-height: 1.6;
}

.error-detail {
	background-color: rgba(0, 0, 0, 0.3);
	padding: 1rem;
	border-radius: calc(var(--radius) / 2);
	font-family: var(--font-family-mono);
	font-size: 0.875rem;
	color: #ff8080;
	margin-bottom: 2rem;
	word-break: break-all;
	border: 1px solid rgba(255, 255, 255, 0.05);
}

.retry-timer {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.75rem;
	color: var(--tosu-blue);
	font-weight: 800;
	text-transform: uppercase;
	letter-spacing: 0.15em;
	font-size: 0.875rem;
}

.retry-timer .fa-icon {
	width: 1.125rem;
	height: 1.125rem;
}

.settings-container {
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

.header-info {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	flex: 1;
}

.header-top {
	display: flex;
	align-items: baseline;
	gap: 1.5rem;
}

.header-top h1 {
	font-size: 2.25rem;
	color: var(--text-0);
}

.save-status {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: var(--tosu-blue);
	font-size: 0.875rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.spin {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

.header-info p {
	color: var(--text-2);
	font-size: 1.125rem;
}

.settings-nav {
	display: flex;
	gap: 1.5rem;
	border-bottom: 2px solid var(--surface-2);
	padding-bottom: 0.75rem;
	width: 100%;
}

.nav-item {
	background: none;
	border: none;
	padding: 0.5rem 1rem;
	color: var(--text-2);
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
	color: var(--text-0);
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
	padding-right: 12rem;
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

.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
