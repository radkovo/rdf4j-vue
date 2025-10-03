<template>
	<div class="namespaces-view">
		<h2>Namespaces</h2>
		<PrefixConfig />
	</div>
</template>

<script lang="ts">
import PrefixConfig from '@/rdf4j-vue-components/src/components/PrefixConfig.vue';

import { defineComponent } from 'vue';

export default defineComponent({
	name: 'NamespacesView',
	components: {
		PrefixConfig,
	},
	props: {
	},
	data () {
		return {
		}
	},
	created () {
	},
	computed: {
	},
	watch: {
	},
	methods: {
	}
});
</script>

<style>
</style>
