<template>
	<div class="explore-view">
		<h2>Explore</h2>
		<div class="subj-selection">
			<Select v-model="selMode" :options="modes" @value-change="changeIri()" /> 
			<InputText type="text" v-model="destIri" @keydown.enter="changeIri()" style="width: 50em" />
			<Button class="ml-2" label="Explore" @click="changeIri()" />
		</div>
		<SubjectInfo v-if="iri && selMode === 'subject'" :iri="iri">
			<template #property="binding">
				<RdfIri :iri="binding.p.value" :active="true" @show-iri="showIri" />
			</template>
			<template #value="binding">
				<RdfValue :data="binding" :activeIris="true" @show-iri="showIri" />
			</template>
			<template #context="binding">
				<RdfIri :iri="binding.g.value" :active="true" @show-iri="showContext" />
			</template>
		</SubjectInfo>
		<SubjectReferences v-if="iri && selMode === 'object'" :iri="iri">
			<template #property="binding">
				<RdfIri :iri="binding.p.value" :active="true" @show-iri="showIri" />
			</template>
			<template #value="binding">
				<RdfValue :data="binding" :activeIris="true" @show-iri="showIri" />
			</template>
			<template #context="binding">
				<RdfIri :iri="binding.g.value" :active="true" @show-iri="showContext" />
			</template>
		</SubjectReferences>
		<SubjectMentions v-if="iri && selMode === 'any'" :iri="iri">
            <template #value="binding">
                <RdfValue :data="getValInfo(binding)" :activeIris="true" @show-iri="showIri" />
            </template>
		</SubjectMentions>
	</div>
</template>

<script>
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Select from 'primevue/select';

import SubjectInfo from '../components/SubjectInfo.vue';
import SubjectReferences from '../components/SubjectReferences.vue';
import SubjectMentions from '../components/SubjectMentions.vue';
import QueryResults from '../components/QueryResults.vue';
import RdfIri from '../components/RdfIri.vue';
import RdfValue from '../components/RdfValue.vue';

import IriDecoder from '../common/iridecoder.js';


export default {
	name: 'ExploreView',
	components: {
		Button,
		InputText,
		Select,
		SubjectInfo,
		SubjectReferences,
		SubjectMentions,
		QueryResults,
		RdfIri,
        RdfValue
	},
	props: {
	},
	inject: ['apiClient'],
	data () {
		return {
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

		update() {
			if (this.iri) {
				let dec = new IriDecoder();
				this.destIri = dec.encodeIri(this.iri);
			} else {
				this.destIri = '';
			}
			this.selMode = (this.mode && this.modes.includes(this.mode)) ? this.mode : 'any';
		},

		showIri(iri) {
			this.$router.push({name: 'explore', params: { repoId: this.repoId, iri: iri, mode: 'any' }});
		},

		showContext(iri) {
        },

		changeIri() {
			let dec = new IriDecoder();
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
