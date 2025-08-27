<template>
	<div class="query-view">
		<div class="query-editor">
			<RdfEditor stateKey="rdf4j-last-query" @resultReturn="resultsHandler" @loadingResult="loadingStart" />
		</div>
		<div class="loading-spinner" v-if="loading">
			Loading...
        </div>
		<div class="query-results" v-if="!loading">
			<div class="total-count" v-if="queryResult && queryResult.total">Total {{ queryResult.total }} results</div>
			<QueryResults v-if="queryResult && !loading" :result="queryResult">
				<template #value="rdfValue">
					<RdfValue :data="getValInfo(rdfValue)" :activeIris="false">
						<template #iri="data">
							<RouterLink class="iri-link" :to="{name: 'explore', params: {iri: data.v.value}}" target="_blank">
								<RdfIri :iri="data.v.value" :active="false" />
							</RouterLink>
						</template>
					</RdfValue>
				</template>
			</QueryResults>
		</div>
	</div>
</template>

<script>
import RdfEditor from '../components/RdfEditor.vue';
import QueryResults from "../components/QueryResults.vue"
import RdfValue from '../components/RdfValue.vue';
import RdfIri from '../components/RdfIri.vue';

export default {
	name: 'QueryView',
	components: {
		RdfEditor,
		QueryResults,
		RdfValue,
		RdfIri
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

	}
}
</script>

<style>
.query-view .query-editor {
	margin: 0 2em;
}
.query-view .total-count {
	margin: 1em;
	font-weight: bold;
}
</style>
