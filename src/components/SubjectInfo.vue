<template>
	<div class="subject-info" v-if="iri">
		<DataTable :value="subjectModel" class="p-datatable-sm"
			v-model:filters="dFilters" filterDisplay="row"
			:resizableColumns="true" columnResizeMode="expand"
			:scrollable="true" scrollHeight="flex"
			showGridlines>
			<Column header="Property" filterField="p.value">
				<template #body="rowdata">
					<slot name="property" v-bind="rowdata.data">
						{{ rowdata.data.p.value }}
					</slot>
				</template>
				<template #filter="{filterModel,filterCallback}">
					<InputText type="text" v-model="filterModel.value" @keydown.enter="filterCallback()" class="p-column-filter" :placeholder="`Search by name - `" v-tooltip.top.focus="'Hit enter key to filter'"/>
				</template>												
			</Column>
			<Column header="Value" filterField="v.value">
				<template #body="rowdata">
					<slot name="value" v-bind="rowdata.data">
						{{ rowdata.data.v.value }}
					</slot>
				</template>
				<template #filter="{filterModel,filterCallback}">
					<InputText type="text" v-model="filterModel.value" @keydown.enter="filterCallback()" class="p-column-filter" :placeholder="`Search by value - `" v-tooltip.top.focus="'Hit enter key to filter'"/>
				</template>												
			</Column>
			<Column header="Context" filterField="g.value">
				<template #body="rowdata">
					<slot name="context" v-bind="rowdata.data">
						{{ rowdata.data.g.value }}
					</slot>
				</template>
				<template #filter="{filterModel,filterCallback}">
					<InputText type="text" v-model="filterModel.value" @keydown.enter="filterCallback()" class="p-column-filter" :placeholder="`Search by value - `" v-tooltip.top.focus="'Hit enter key to filter'"/>
				</template>												
			</Column>
		</DataTable>
	</div>
</template>

<script>
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';

import {FilterMatchMode} from '@primevue/core/api';

export default {
	name: 'SubjectInfo',
	components: {
		InputText,
		DataTable,
		Column,
	},
	inject: ['apiClient'],
	props: {
		iri: null,
	},
	data () {
		return {
			subjectModel: null,
			dFilters: {
				'p.value': {value: null, matchMode: FilterMatchMode.CONTAINS},
				'v.value': {value: null, matchMode: FilterMatchMode.CONTAINS},
				'g.value': {value: null, matchMode: FilterMatchMode.CONTAINS}
			}			
		}
	},
	created () {
		this.update();
	},
	watch: {
		iri: 'update'
	},
	methods: {
		async update() {
			if (this.iri) {
				const data = await this.apiClient.getSubjectDescription(this.iri);
				this.subjectModel = data.results.bindings;
				// fill missing values
				for (let item of this.subjectModel) {
					if (!item.v) {
						item.v = { type:'literal', value:'' };
					}
				}
			}
		},
	}
}
</script>

<style>
</style>
