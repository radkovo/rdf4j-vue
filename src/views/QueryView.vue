<template>
	<div class="query-view">
		<div class="query-editor">
			<RdfEditor stateKey="rdf4j-last-query" @resultReturn="resultsHandler" @loadingResult="loadingStart" />
		</div>
		<div class="loading-spinner" v-if="loading">
			Loading...
        </div>
		<div class="query-results" v-if="!loading">
			<div class="total-count" v-if="totalResults >= 0">Total {{ totalResults }} results</div>
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

<script lang="ts">
import RdfEditor from '@/rdf4j-vue-components/src/components/RdfEditor.vue';
import QueryResults from "@/rdf4j-vue-components/src/components/QueryResults.vue"
import RdfValue from '@/rdf4j-vue-components/src/components/RdfValue.vue';
import RdfIri from '@/rdf4j-vue-components/src/components/RdfIri.vue';

import { defineComponent, inject } from 'vue';
import type { ApiClient } from '@/rdf4j-vue-components/src/common/apiclient';
import type { DisplayValue, QueryResult, RdfValueSpec } from '@/rdf4j-vue-components/src/common/types';

export default defineComponent({
	name: 'QueryView',
	components: {
		RdfEditor,
		QueryResults,
		RdfValue,
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
		queryResult: QueryResult | null,
		totalResults: number,
	} {
		return {
			loading: false,
			queryResult: null,
			totalResults: -1
		}
	},
	created () {
		this.update();
	},
	computed: {
		repoId(): string {
			return this.$route.params.repoId?.toString();
		}
	},
	watch: {
	},
	methods: {
        getValInfo(data: RdfValueSpec): DisplayValue {
			// transforms data to the form expected by RdfValue component (v: value, p: property, c: context)
			// property and value are not available in query view but can be provided e.g. by the explore view and are
			// potentially useful for displaying the value details
            return { v: data }; 
        },

		update() {
		},

		loadingStart(start: boolean) {
			this.loading = start;
		},

		resultsHandler(r: QueryResult | null) {
			this.queryResult = r;
			console.log(r);
			if (r && r.type === 'select' && r.total) {
                this.totalResults = r.total;
            } else {
                this.totalResults = -1;
            }
		},

	}
});
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
