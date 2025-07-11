<template>
	<div class="query-view">
		<div class="query-editor">
			<RdfEditor @resultReturn="resultsHandler" @loadingResult="loadingStart" />
		</div>
		<div class="loading-spinner" v-if="loading">
			Loading...
        </div>
		<div class="query-results" v-if="!loading">
			<QueryResults v-if="queryResult && !loading" :result="queryResult" @show-iri="showIri">
				<template #value="slotProps">
					<RdfValue :data="getValInfo(slotProps)" :activeIris="true" @show-iri="showIri" />
				</template>
			</QueryResults>
		</div>
	</div>
</template>

<script>
import RdfEditor from '../components/RdfEditor.vue';
import QueryResults from "../components/QueryResults.vue"
import RdfValue from '../components/RdfValue.vue';

export default {
	name: 'QueryView',
	components: {
		RdfEditor,
		QueryResults,
		RdfValue
	},
	props: {
	},
	inject: ['apiClient'],
	data () {
		return {
			loading: false,
			queryResult: null
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
        getValInfo(data) {
			// transforms data to the form expected by RdfValue component (v: value, p: property, c: context)
			// property and value are not available in query view but can be provided e.g. by the explore view and are
			// potentially useful for displaying the value details
            return { v: data }; 
        },

		update() {
		},

		loadingStart(start) {
			this.loading = start;
		},

		resultsHandler(r) {
			this.queryResult = r;
			console.log(r);
		},

		showIri(iri) {
            let route = this.$router.resolve({ name: 'explore', params: { repoId: this.$route.params.repoId, iri: iri } });
            window.open(route.href, '_blank');
        },

	}
}
</script>

<style>
.query-view .query-editor {
	margin: 0 2em;
}
</style>
