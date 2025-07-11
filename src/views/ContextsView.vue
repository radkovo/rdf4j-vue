<template>
	<div class="contexts-view">
		<h2>Contexts</h2>
		<DataTable :value="contexts" class="p-datatable-sm"
			v-model:filters="dFilters" filterDisplay="row"
			:resizableColumns="true" columnResizeMode="expand"
			:scrollable="true" scrollHeight="flex"
			showGridlines>
			<Column header="Context" filterField="iri" field="iri">
				<template #body="rowdata">
					<RdfIri :iri="rowdata.data.iri" :active="true" @show-iri="showContext" />
				</template>
				<template #filter="{filterModel,filterCallback}">
					<InputText type="text" v-model="filterModel.value" @keydown.enter="filterCallback()" class="p-column-filter" :placeholder="`Search by IRI - `" v-tooltip.top.focus="'Hit enter key to filter'"/>
				</template>												
			</Column>
		</DataTable>
	</div>
</template>

<script>
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import RdfIri from '../components/RdfIri.vue';

import {FilterMatchMode} from '@primevue/core/api';

export default {
	name: 'ContextsView',
	components: {
		DataTable,
        Column,
        InputText,
		RdfIri
	},
	props: {
	},
	inject: ['apiClient'],
	data () {
		return {
			loading: false,
			contexts: [],
			dFilters: {
				'iri': {value: null, matchMode: FilterMatchMode.CONTAINS},
			}			
		}
	},
	created () {
		this.update();
	},
	computed: {
		repoId() {
			return this.$route.params.repoId;
		}
	},
	watch: {
	},
	methods: {
		async update() {
            this.loading = true;
			this.contexts = await this.apiClient.getContexts();
			console.log('Contexts:', this.contexts);
        },

		showContext(iri) {
        },

	}
}
</script>

<style>
.contexts-view {
    margin: 0 2em;
}
</style>
