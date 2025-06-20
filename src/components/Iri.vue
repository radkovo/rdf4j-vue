<template>
	<a class="iri-link" v-if="active" @click="clicked" @mouseover="hoverIri" @mouseout="leaveIri">
		<span class="iri font-monospace" v-tooltip.bottom="iri">{{ shortForm }}</span>
	</a>
	<span class="iri font-monospace" v-if="!active" v-tooltip.bottom="iri">{{ shortForm }}</span>
</template>

<script>
import IriDecoder from '../common/iridecoder.js';

export default {
	name: 'Iri',
	props: {
		iri: null,
		active: null
	},
	emits: ['show-iri', 'hover-iri', 'leave-iri'],
	data () {
		return {
			shortForm: null
		}
	},
	created () {
		this.update();
	},
	watch: {
		iri: 'update'
	},
	methods: {
		update() {
			let dec = new IriDecoder();
			this.shortForm = dec.encodeIri(this.iri);
		},

		clicked() {
			this.$emit('show-iri', this.iri);
		},

		hoverIri() {
			this.$emit('hover-iri', this.iri);
		},

		leaveIri() {
			this.$emit('leave-iri', this.iri);
		}
	}
}
</script>

<style>
.iri-link {
	color: var(--p-blue-500);
	text-decoration: none;
	cursor: pointer;
}
.iri {
	border-bottom: 1px dotted;
}
.iri-link:hover .iri {
	border-bottom: 1px solid;
}
</style>
