<template>
	<div class="subject-info" v-if="iri">
		<QueryResults v-if="queryResult && !loading" :result="queryResult">
			<template #value="slotProps">
				<!--<RdfValue :data="getValInfo(slotProps)" :activeIris="true" @show-iri="showIri" /> -->
				{{ slotProps }}
			</template>
		</QueryResults>
	</div>
</template>

<script>
import QueryResults from './QueryResults.vue';

export default {
	name: 'SubjectReferences',
	components: {
		QueryResults
	},
	inject: ['apiClient'],
	props: {
		iri: null,
	},
	data () {
		return {
			queryResult: null,
            loading: false,
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
				this.queryResult = [ data, [], 'select' ];
			}
		},
	}
}
</script>

<style>
</style>
