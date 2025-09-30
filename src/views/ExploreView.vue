<template>
	<div class="explore-view">
		<h2>Explore</h2>
		<div class="subj-selection">
			<Select v-model="selMode" :options="modes" @value-change="changeIri()" /> 
			<InputText type="text" v-model="destIri" @keydown.enter="changeIri()" style="width: 50em" />
			<Button class="ml-2" label="Explore" @click="changeIri()" />
		</div>
		<QueryResults v-if="queryResult && !loading" :result="queryResult">
			<template #value="rdfValue">
				<RdfValue :data="getValInfo(rdfValue)" :activeIris="false">
					<template #iri="data">
						<RouterLink class="iri-link" :to="{name: 'explore', params: {iri: data.v.value}}">
							<RdfIri :iri="data.v.value" :active="false" />
						</RouterLink>
					</template>
				</RdfValue>
			</template>
		</QueryResults>
		
	</div>
</template>

<script lang="ts">
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Select from 'primevue/select';

import { QueryResults, RdfIri, RdfValue } from '@burgetr/rdf4j-vue-components';
import type { ApiClient, DisplayValue, QueryResult, RdfValueSpec } from '@burgetr/rdf4j-vue-components';

import { defineComponent, inject } from 'vue';

export default defineComponent({
	name: 'ExploreView',
	components: {
		Button,
		InputText,
		Select,
		QueryResults,
		RdfIri,
        RdfValue
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
		destIri: string | null,
		selMode: string,
        modes: string[]
	} {
		return {
			loading: false,
			queryResult: null,
			destIri: null,
			selMode: 'any',
			modes: [ 'any', 'subject', 'object' ]
			//modes: [ { label: 'Subject', value: 'subject' }, { label: 'Object', value: 'object' } ]
		}
	},
	created () {
		this.update();
	},
	computed: {
		iri(): string {
			return this.$route.params.iri?.toString();
		},
		mode(): string {
			return this.$route.params.mode?.toString();
		},
		repoId(): string {
			return this.$route.params.repoId?.toString();
		}
	},
	watch: {
		'$route.params.iri': 'update',
		'$route.params.mode': 'update',
	},
	methods: {
        getValInfo(data: RdfValueSpec): DisplayValue {
			// transforms data to the form expected by RdfValue component (v: value, p: property, c: context)
			// property and value are not available in query view but can be provided e.g. by the explore view and are
			// potentially useful for displaying the value details
			if (!data.value) {
				data.value = '';
			}
            return { v: data }; 
        },

		async update() {
			if (this.iri) {
				let dec = await this.apiClient.getIriDecoder();
				this.destIri = dec.encodeIri(this.iri);
			} else {
				this.destIri = '';
			}
			this.selMode = (this.mode && this.modes.includes(this.mode)) ? this.mode : 'any';

			if (this.destIri) {
				this.loading = true;
				let iri = this.iri;
				let data;
				if (this.selMode === 'subject') {
					data = await this.apiClient.getSubjectDescription(iri);
                } else if (this.selMode === 'object') {
					data = await this.apiClient.getSubjectReferences(iri);
				} else {
					data = await this.apiClient.getSubjectMentions(iri);
				}
				this.queryResult = {
					data: data,
					total: data.results.bindings.length,
					prefixes: [],
					type: 'select'
				};
				//console.log(this.queryResult);
				this.loading = false;
			}

		},

		async changeIri() {
			if (this.destIri) {
				let dec = await this.apiClient.getIriDecoder();
				let iri = dec.decodeIri(this.destIri);
				this.$router.push({name: 'explore', params: { repoId: this.repoId, iri: iri, mode: this.selMode }});
			}
		}
	}
});
</script>

<style>
.explore-view {
    margin: 0 2em;
}
.explore-view .subj-selection {
	padding: 1em;
}
</style>
