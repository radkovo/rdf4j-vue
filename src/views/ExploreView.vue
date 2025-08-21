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
				<RdfValue :data="getValInfo(rdfValue)" :activeIris="true" @show-iri="showIri" />
			</template>
		</QueryResults>
		
	</div>
</template>

<script>
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Select from 'primevue/select';

import QueryResults from '../components/QueryResults.vue';
import RdfIri from '../components/RdfIri.vue';
import RdfValue from '../components/RdfValue.vue';


export default {
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
	inject: ['apiClient'],
	data () {
		return {
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
		iri() {
			return this.$route.params.iri;
		},
		mode() {
			return this.$route.params.mode;
		},
		repoId() {
			return this.$route.params.repoId;
		}
	},
	watch: {
		'$route.params.iri': 'update',
		'$route.params.mode': 'update',
	},
	methods: {
        getValInfo(data) {
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
				let data;
				if (this.selMode === 'subject') {
					data = await this.apiClient.getSubjectDescription(this.destIri);
                } else if (this.selMode === 'object') {
					data = await this.apiClient.getSubjectReferences(this.destIri);
				} else {
					data = await this.apiClient.getSubjectMentions(this.destIri);
				}
				this.queryResult = {
					data: data, 
					prefixes: [],
					type: 'select'
				};
				console.log(this.queryResult);
				this.loading = false;
			}

		},

		showIri(iri) {
			this.$router.push({name: 'explore', params: { repoId: this.repoId, iri: iri, mode: 'any' }});
		},

		async changeIri() {
			let dec = this.apiClient.getIriDecoder();
			let iri = dec.decodeIri(this.destIri);
			this.$router.push({name: 'explore', params: { repoId: this.repoId, iri: iri, mode: this.selMode }});
		}
	}
}
</script>

<style>
.explore-view {
    margin: 0 2em;
}
.explore-view .subj-selection {
	padding: 1em;
}
</style>
