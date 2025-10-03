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
					<RouterLink class="iri-link" :to="{name: 'explore', params: {iri: rowdata.data.iri}}">
						<RdfIri :iri="rowdata.data.iri" :active="false" />
					</RouterLink>
				</template>
				<template #filter="{filterModel,filterCallback}">
					<InputText type="text" v-model="filterModel.value" @keydown.enter="filterCallback()" class="p-column-filter" :placeholder="`Search by IRI - `" v-tooltip.top.focus="'Hit enter key to filter'"/>
				</template>												
			</Column>
		</DataTable>
	</div>
</template>

<script lang="ts">
import DataTable, { type DataTableFilterMeta } from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import RdfIri from '@/rdf4j-vue-components/src/components/RdfIri.vue';

import {FilterMatchMode} from '@primevue/core/api';
import type { ApiClient } from '@/rdf4j-vue-components/src/common/apiclient';

import { defineComponent, inject } from 'vue';
import type { ContextDescription } from '@/rdf4j-vue-components/src/common/types';

export default defineComponent({
	name: 'ContextsView',
	components: {
		DataTable,
        Column,
        InputText,
		RdfIri
	},
	props: {
	},
	setup() {
		return {
			apiClient: inject('apiClient') as ApiClient
		}
	},
	data(): {
		loading: boolean,
        contexts: ContextDescription[],
        dFilters: DataTableFilterMeta
	} {
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
        }
	}
});
</script>

<style>
.contexts-view {
    margin: 0 2em;
}
</style>
