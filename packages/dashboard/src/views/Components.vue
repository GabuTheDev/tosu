<script setup lang="ts">
import { ref, reactive } from 'vue';
import Button from '@/components/Button.vue';
import Input from '@/components/Input.vue';
import SettingItem, { type Action } from '@/components/SettingItem.vue';
import { type DropdownOption } from '@/components/inputs/Dropdown.vue';

const defaults = {
	identifier: 'GabuTheDesigner',
	token: '',
	notes: 'These are some default notes...',
	fixed: '',
	quantity: 42,
	decimalValue: 1.55,
	emailValue: 'tosu@example.com',
	passwordValue: 'secret123',
	limitedValue: 'Limited...',
	keybindValue: 'Control + Shift + Space',
	tags: ['Vue', 'Vite', 'TypeScript'],
	quantityError: undefined as string | undefined,
	theme: 'dark',
	themeError: undefined as string | undefined,
	enabled: true,
	debug: false,
};

const settings = reactive({ ...defaults });

// Interactive Extra buttons for demo
const extraActions = ref<Action[]>([]);

const addAction = () => {
	const icons = ['heart', 'star', 'fire', 'bolt', 'ghost', 'shield', 'trophy'];
	const colors = ['success', 'info', 'reset', 'erase'];
	const id = Math.random().toString(36).substring(2, 9);
	
	const action = {
		id,
		label: `Dummy`,
		icon: icons[Math.floor(Math.random() * icons.length)],
		colorClass: colors[Math.floor(Math.random() * colors.length)],
		handler: () => {
			extraActions.value = extraActions.value.filter(a => a.id !== id);
		}
	};
	
	extraActions.value.push(action);
};

const themeOptions: DropdownOption[] = [
	{ label: 'Dark Mode', value: 'dark' },
	{ label: 'Light Mode', value: 'light' },
	{ label: 'Osu! Blue', value: 'blue' },
];

const advancedOptions: DropdownOption[] = [
	{ label: 'Standard Plan', value: 'std', icon: 'user' },
	{ label: 'Pro Plan (Recommended)', value: 'pro', icon: 'bolt', link: 'https://google.com' },
	{ label: 'Enterprise', value: 'ent', icon: 'building', link: 'https://google.com' },
];

const pollingValidators = [
	(val: number) => (val < 0 ? 'Must be positive' : null),
	(val: number) => (val > 90 ? 'Value too high' : null),
];

const textValidators = {
	email: [
		(val: string) => (!/^\S+@\S+\.\S+$/.test(val) ? 'Invalid email format' : null)
	],
	length: [
		(val: string) => (val.length < 5 ? 'Too short (min 5)' : null),
		(val: string) => (val.length > 15 ? 'Too long (max 15)' : null)
	],
	mustControl: [
		(val: string) => (!val.includes('Control') ? 'Must include Control key' : null)
	]
};

const errorText = ref('');
const toggleError = () => {
	errorText.value = errorText.value ? '' : 'This is an error message';
};
</script>

<template>
	<div class="components-page">
		<header>
			<h1>Component Library</h1>
			<p>Explore and test the custom UI components.</p>
		</header>

		<section class="component-section">
			<h2>Telescoping Toolbar (Extreme)</h2>
			<p class="description">Test the physical "pushing" and "sliding" animations by adding or removing actions. <strong>Click any button in the toolbar to remove it.</strong></p>
			
			<div class="demo-controls" style="margin-bottom: 1.5rem; display: flex; gap: 1rem;">
				<Button variant="secondary" @click="addAction">+ Add Action</Button>
				<Button variant="secondary" @click="extraActions = []">Clear All</Button>
			</div>

			<div class="demo-target">
				<SettingItem
					v-model="settings.identifier"
					name="Mega Toolbar Demo"
					description="Dynamically add buttons to see how they emerge from behind each other."
					:default-value="defaults.identifier"
					:extra-actions="extraActions"
					can-erase
				>
					<Input type="text" v-model="settings.identifier" placeholder="Edit to show Reset/Erase..." />
				</SettingItem>
			</div>
		</section>

		<section class="component-section">
			<h2>Buttons</h2>
			<div class="component-demo">
				<div class="group">
					<h3>Variants</h3>
					<div class="button-row">
						<Button variant="primary">Primary</Button>
						<Button variant="secondary">Secondary</Button>
					</div>
				</div>

				<div class="group">
					<h3>States</h3>
					<div class="button-row">
						<Button disabled>Disabled</Button>
						<Button variant="secondary" disabled>Disabled Secondary</Button>
					</div>
				</div>
			</div>
		</section>

		<section class="component-section">
			<h2>Inputs</h2>
			<div class="component-demo">
				<div class="group input-group">
					<h3>Text Input final final v3</h3>
					<Input
						type="text"
						v-model="settings.identifier"
						placeholder="mrekk"
						:debounce="500"
					/>
					<p class="value-preview">Value: {{ settings.identifier }}</p>
				</div>

				<div class="group input-group">
					<h3>Text Input Scenarios</h3>
					<div class="input-demo-item">
						<span class="label">Standard Text</span>
						<Input type="text" v-model="settings.identifier" placeholder="Username" />
					</div>
					<div class="input-demo-item">
						<span class="label">Password</span>
						<Input type="password" v-model="settings.passwordValue" placeholder="Enter password..." />
					</div>
					<div class="input-demo-item">
						<span class="label">Email (Validated)</span>
						<Input type="email" v-model="settings.emailValue" :validators="textValidators.email" />
					</div>
					<div class="input-demo-item">
						<span class="label">Character Limit (5-15)</span>
						<Input type="text" v-model="settings.limitedValue" :validators="textValidators.length" />
					</div>
					<p class="value-preview">Email: {{ settings.emailValue }} | Pwd: {{ '*'.repeat(settings.passwordValue.length) }}</p>
				</div>

				<div class="group input-group textarea-demo-group">
					<h3>Textarea Scenarios</h3>
					<div class="input-demo-item">
						<span class="label">Default (3 rows)</span>
						<Input type="textarea" v-model="settings.notes" placeholder="Tell us more..." />
					</div>
					<div class="input-demo-item">
						<span class="label">Fixed Height (6 rows, no resize)</span>
						<Input type="textarea" v-model="settings.notes" :rows="6" resize="none" />
					</div>
					<div class="input-demo-item">
						<span class="label">Auto-Resize Vertical (Default)</span>
						<Input type="textarea" v-model="settings.notes" resize="vertical" />
					</div>
					<div class="input-demo-item">
						<span class="label">Horizontal Resize Only</span>
						<Input type="textarea" v-model="settings.notes" resize="horizontal" />
					</div>
					<div class="input-demo-item">
						<span class="label">Resize Both Axis</span>
						<Input type="textarea" v-model="settings.notes" resize="both" />
					</div>
					<div class="input-demo-item">
						<span class="label">With Min/Max Height</span>
						<Input type="textarea" v-model="settings.notes" min-height="100px" max-height="200px" />
					</div>
				</div>

				<div class="group input-group">
					<h3>Number Input</h3>
					<div class="input-demo-item">
						<span class="label">Polling Rate (0-100, Multi-Validated)</span>
						<Input
							type="number"
							v-model="settings.quantity"
							v-model:error="settings.quantityError"
							:min="0"
							:max="100"
							:validators="pollingValidators"
						/>
						<p class="hint">
							Pro Tip: <strong>Shift + Click</strong> for ±10, <strong>Alt + Click</strong> for ±5
						</p>
					</div>
					<p class="value-preview">Value: {{ settings.quantity }}</p>

					<div class="input-demo-item">
						<span class="label">Manual Error Toggle</span>
						<Input 
							type="number"
							v-model="settings.quantity" 
							v-model:error="errorText"
						/>
						<Button variant="secondary" class="error-toggle" @click="toggleError">Toggle Error</Button>
					</div>
				</div>

				<div class="group input-group">
					<h3>Integer vs Decimal</h3>
					<div class="input-demo-item">
						<span class="label">Integer (Precision: 0)</span>
						<Input type="number" v-model="settings.quantity" />
					</div>
					<div class="input-demo-item">
						<span class="label">Decimal (Precision: 2, Step: 0.1)</span>
						<Input type="number" v-model="settings.decimalValue" :precision="2" :step="0.1" />
					</div>
					<p class="value-preview">Int: {{ settings.quantity }} | Float: {{ settings.decimalValue }}</p>
				</div>

				<div class="group input-group">
					<h3>Keybind Scenarios</h3>
					<div class="input-demo-item">
						<span class="label">Standard Recorder</span>
						<Input type="keybind" v-model="settings.keybindValue" />
					</div>
					<div class="input-demo-item">
						<span class="label">Must include 'Control'</span>
						<Input type="keybind" v-model="settings.keybindValue" :validators="textValidators.mustControl" />
					</div>
					<div class="input-demo-item">
						<span class="label">Max 2 Keys</span>
						<Input type="keybind" v-model="settings.keybindValue" :max-keys="2" />
					</div>
				</div>

				<div class="group input-group">
					<h3>Chip Scenarios</h3>
					<div class="input-demo-item">
						<span class="label">Standard Tags</span>
						<Input type="chips" v-model="settings.tags" placeholder="Add tag..." />
					</div>
					<div class="input-demo-item">
						<span class="label">Validated (No small letters)</span>
						<Input 
							type="chips" 
							v-model="settings.tags" 
							:validators="[(v) => /[a-z]/.test(v) ? 'Only uppercase allowed' : null]" 
						/>
					</div>
					<div class="input-demo-item">
						<span class="label">With Static Pinned Item</span>
						<Input type="chips" v-model="settings.tags" :static-chips="['Pinned']" />
					</div>
				</div>

				<div class="group input-group">
					<h3>Dropdown Scenarios</h3>
					<div class="input-demo-item">
						<span class="label">Standard Searchable</span>
						<Input type="dropdown" v-model="settings.theme" :options="themeOptions" />
					</div>
					<div class="input-demo-item">
						<span class="label">With Icons & Links</span>
						<Input type="dropdown" v-model="settings.fixed" :options="advancedOptions" placeholder="Select a plan..." />
					</div>
					<div class="input-demo-item">
						<span class="label">Validation (Must be 'Pro')</span>
						<Input 
							type="dropdown" 
							v-model="settings.fixed" 
							:options="advancedOptions"
							:validators="[(v) => v !== 'pro' ? 'Only Pro Plan is allowed' : null]"
						/>
					</div>
				</div>

				<div class="group">
					<h3>Switches</h3>
					<div class="button-row">
						<div class="switch-demo-item">
							<span class="label">Enable Features</span>
							<Input type="switch" v-model="settings.enabled" />
						</div>
						<div class="switch-demo-item">
							<span class="label">Debug Mode</span>
							<Input type="switch" v-model="settings.debug" />
						</div>
						<div class="switch-demo-item">
							<span class="label">Disabled Toggle</span>
							<Input type="switch" v-model="settings.debug" disabled />
						</div>
					</div>
					<p class="value-preview">Enabled: {{ settings.enabled }} | Debug: {{ settings.debug }}</p>
				</div>
			</div>
		</section>

		<section class="component-section">
			<h2>Settings Layout</h2>
			<div class="settings-list">
				<SettingItem
					v-model="settings.enabled"
					name="Hardware Acceleration"
					description="Use GPU to render the dashboard for better performance."
					:default-value="defaults.enabled"
				>
					<Input type="switch" v-model="settings.enabled" />
				</SettingItem>

				<SettingItem
					v-model="settings.quantity"
					name="Polling Rate"
					description="How often to read memory from the game. Lower values are more responsive but use more CPU."
					:default-value="defaults.quantity"
				>
					<Input type="number" v-model="settings.quantity" :min="1" :max="1000"/>
				</SettingItem>

				<SettingItem
					v-model="settings.identifier"
					name="Overlay Identifier"
					description="A unique name used to identify this overlay in the network."
					:default-value="defaults.identifier"
					can-erase
				>
					<Input type="text" v-model="settings.identifier" placeholder="Enter ID..." />
				</SettingItem>
			</div>
		</section>
	</div>
</template>

<style scoped>
.components-page {
	display: flex;
	flex-direction: column;
	gap: 3rem;
}

header h1 {
	font-size: 2.5rem;
	color: var(--text-3);
	margin-bottom: 0.5rem;
}

header p {
	color: var(--text-1);
	font-size: 1.125rem;
}

.component-section h2 {
	font-size: 1.5rem;
	color: var(--text-3);
	margin-bottom: 1rem;
	padding-bottom: 0.5rem;
	border-bottom: 1px solid var(--surface-2);
}

.description {
	color: var(--text-1);
	margin-bottom: 1.5rem;
	font-size: 0.9375rem;
}

.component-demo {
	display: flex;
	flex-direction: column;
	gap: 2rem;
}

.demo-target {
	max-width: 1000px;
}

.settings-list {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	max-width: 1000px;
}

.group {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.group h3 {
	font-size: 0.875rem;
	text-transform: uppercase;
	letter-spacing: 0.05em;
	color: var(--text-0);
	font-weight: 700;
}

.button-row {
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;
}

.switch-demo-item {
	display: flex;
	align-items: center;
	gap: 1rem;
	background-color: var(--surface-1);
	padding: 0.5rem 1rem;
	border-radius: var(--radius);
	border: 1px solid var(--surface-2);
}

.switch-demo-item .label {
	font-size: 0.875rem;
	font-weight: 700;
	color: var(--text-1);
}

.input-demo-item {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.input-demo-item .label {
	font-size: 0.875rem;
	font-weight: 700;
	color: var(--text-1);
}

.hint {
	font-size: 0.75rem;
	color: var(--text-0);
	margin-top: -0.25rem;
}

.hint strong {
	color: var(--text-1);
}

.size-demo {
	align-items: center;
}

.input-group {
	max-width: 400px;
}

.textarea-demo-group {
	max-width: none;
}

.error-toggle {
	margin-top: 0.5rem;
	align-self: flex-start;
}

.value-preview {
	font-family: var(--font-family-mono);
	font-size: 0.875rem;
	color: var(--tosu-blue);
	margin-top: 0.25rem;
}
</style>
