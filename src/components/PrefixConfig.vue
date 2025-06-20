<template>
	<div class="prefix-config">
		<h2 class="mt-6">Prefixes</h2>
		<DataTable :value="namespaces" tableStyle="min-width: 50rem" class="p-datatable-small"
			scrollable scrollHeight="30em">
			<template #empty> No prefixes defined. </template>
			<Column field="prefix" header="Prefix" sortable></Column>
			<Column field="namespace" header="Namespace" sortable></Column>
		</DataTable>
	</div>
</template>

<script>
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

export default {
	name: 'PrefixConfig',
	inject: ['apiClient'],
	props: {
	},
	components: {
		DataTable,
		Column
	},
	data () {
		return {
			namespaces: [],
		}
	},
	created () {
	},
	mounted () {
		this.fetchNamespaces();
	},
	methods: {
		async fetchNamespaces() {
			let ns = [];
			let data = await this.apiClient.getNamespaces();
			for (let bind of data.results.bindings) {
				ns.push({prefix: bind.prefix.value, namespace: bind.namespace.value});
			}
			this.namespaces = ns;
		},
	}
}
</script>

<style>
</style>
