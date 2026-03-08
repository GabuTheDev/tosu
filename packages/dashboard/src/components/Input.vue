<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import InputText from './inputs/InputText.vue';
import InputTextarea from './inputs/InputTextarea.vue';
import InputNumber from './inputs/InputNumber.vue';
import InputChips from './inputs/InputChips.vue';
import InputKeybind from './inputs/InputKeybind.vue';
import Switch from './inputs/Switch.vue';
import Dropdown from './inputs/Dropdown.vue';

interface Props {
	type?: 'text' | 'password' | 'textarea' | 'number' | 'chips' | 'keybind' | 'switch' | 'dropdown';
}

const props = withDefaults(defineProps<Props>(), {
	type: 'text',
});

const componentMap = {
	text: InputText,
	password: InputText,
	textarea: InputTextarea,
	number: InputNumber,
	chips: InputChips,
	keybind: InputKeybind,
	switch: Switch,
	dropdown: Dropdown,
} as const;

const currentComponent = computed(() => componentMap[props.type] || InputText);

const attrs = useAttrs();
</script>

<template>
	<component :is="currentComponent" v-bind="attrs" :type="type" />
</template>

<style scoped></style>
