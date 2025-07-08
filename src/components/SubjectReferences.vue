<template>
	<div class="subject-info" v-if="iri">
		<DataTable :value="subjectModel" class="p-datatable-sm"
			v-model:filters="dFilters" filterDisplay="row"
			:resizableColumns="true" columnResizeMode="expand"
			:scrollable="true" scrollHeight="flex"
			showGridlines>
			<Column header="Subject" filterField="v.value">
				<template #body="rowdata">
					<RdfValue :data="rowdata.data" :activeIris="activeIris" 
						@show-iri="showIri"	@show-ext="showExt" />
				</template>
				<template #filter="{filterModel,filterCallback}">
					<InputText type="text" v-model="filterModel.value" @keydown.enter="filterCallback()" class="p-column-filter" :placeholder="`Search by value - `" v-tooltip.top.focus="'Hit enter key to filter'"/>
				</template>												
			</Column>
			<Column header="Property" filterField="p.value">
				<template #body="rowdata">
					<RdfIri :iri="rowdata.data.p.value" :active="activeIris" />
				</template>
				<template #filter="{filterModel,filterCallback}">
					<InputText type="text" v-model="filterModel.value" @keydown.enter="filterCallback()" class="p-column-filter" :placeholder="`Search by name - `" v-tooltip.top.focus="'Hit enter key to filter'"/>
				</template>												
			</Column>
		</DataTable>
	</div>
</template>

<script>
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';

import RdfIri from './RdfIri.vue';
import RdfValue from './RdfValue.vue';

import {FilterMatchMode} from '@primevue/core/api';

export default {
	name: 'SubjectReferences',
	components: {
		InputText,
		DataTable,
		Column,
		RdfIri,
		RdfValue,
	},
	emits: ['show-iri', 'show-ext'],
	inject: ['apiClient'],
	props: {
		iri: null,
		activeIris: null
	},
	data () {
		return {
			subjectModel: null,
			dFilters: {
				'p.value': {value: null, matchMode: FilterMatchMode.CONTAINS},
				'v.value': {value: null, matchMode: FilterMatchMode.CONTAINS}
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
				const data = await this.apiClient.getSubjectReferences(this.iri);
				this.subjectModel = data.results.bindings;
				// fill missing values
				for (let item of this.subjectModel) {
					if (!item.v) {
						item.v = { type:'literal', value:'' };
					}
				}
			}
		},

		showIri(iri) {
			this.$emit('show-iri', iri);
		},

		showExt(iri) {
			this.$emit('show-ext', iri);
		}
	}
}
</script>

<style>
</style>
