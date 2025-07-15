<template>
	<div class="subject-info" v-if="iri">
		<QueryResults v-if="queryResult && !loading" :result="queryResult">
			<template #value="rdfValue">
				<slot name="value" v-bind="rdfValue">
					{{ rdfValue.value }}
				</slot>
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
				this.loading = true;
				const data = await this.apiClient.getSubjectMentions(this.iri);
				this.queryResult = { data: [ data, [], 'select' ] };
				this.loading = false;
			}
		},
	}
}
</script>

<style>
</style>
