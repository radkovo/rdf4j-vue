<template>
	<span class="value-info" v-if="valueType">
		<span v-if="valueType==='literal'" v-tooltip.bottom="literalTooltip">{{literalValue}}</span>
		<span v-if="valueType==='color'">{{literalValue}} <span class="color-box" :style="displayStyle">&#x2003;</span></span>
		<span v-if="valueType==='bnode'">
			<a class="iri-link iri font-monospace" v-tooltip.bottom="displayTooltip" @click="() => { showIri(iri); }">{{displayValue}}</a>
		</span>
		<span v-if="valueType==='uri'" class="uri-value" :class='typeInfo.type'>
			<RdfIri :iri="data.v.value" :active="active" 
				@show-iri="showIri"
				@hover-iri="hoverIri"
				@leave-iri="leaveIri" />
			<span v-if="typeInfo.name" class="badge">{{typeInfo.name}}</span>
			<i v-if="showExt && extIcon" v-tooltip="extTooltip" class="i-action" :class="extIcon" 
				style="cursor: pointer" @click="showExternal" />
		</span>
	</span>
</template>

<script>
import RdfIri from './RdfIri.vue';

import IriDecoder from '../common/iridecoder.js';

export default {
	name: 'RdfValue',
	components: {
		RdfIri
	},
	emits: ['show-iri', 'hover-iri', 'leave-iri', 'show-ext'],
    props: {
        data: {
            type: Object
			// The object should contain at least 'v' (RDF value) property with 'value' and 'type' properties
			// Example: { v: { value: 'http://example.org/resource/123', type: 'uri' } }
			// Optionally the 's' (subject) property and 'p' (predicate) properties can be provided for
			// better visualization in alternative implementations
        },
        activeIris: {
            type: Boolean,
            default: false
        },
        extIcon: {
            type: String,
            default: null
        },
        extTooltip: {
            type: String,
            default: ''
        },
        extAll: {
            type: Boolean,
            default: false
        },
		knownTypes: { // prepared for displaying type badges for known types
			type: Object,
            default: {}
		}
    },
	data () {
		return {
			valueType: null,
			iri: null,
			active: false,
			showExt: false,
			typeIri: null,
			displayValue: null,
			displayStyle: null,
			displayTooltip: null
		}
	},
	computed: {
		typeInfo() {
			if (this.typeIri) {
				let ret = this.knownTypes[this.typeIri];
				if (ret) {
					return ret;
				}
			}
			return { type: 'unknown' };
		},

		literalValue() {
			let val = this.data.v.value.toString();
			//limit the displayed length
			if (val.length > 50) {
				val = val.substring(0, 50) + '...'; 
			}
			return val;
		},

		literalTooltip() {
			let s = '';
			if (this.data.v.datatype) {
				const dec = new IriDecoder();
				s = '(' + dec.encodeIri(this.data.v.datatype) + ') ';
			}
			let val = s + this.data.v.value.toString(); 
			//limit the displayed length
			if (val.length > 500) {
				val = val.substring(0, 500) + '...'; 
			}
			return val;
		}
	},
	created () {
		this.update();
	},
	watch: {
		data: 'update'
	},
	methods: {
		update() {
			if (this.data && this.data.v) {
				this.valueType = this.data.v.type;
				this.showExt = this.active = false;
				if (this.valueType === 'uri') {
					this.iri = this.data.v.value;
					this.active = true;
				} else if (this.valueType === 'bnode') {
					this.iri = this.data.v.value;
					this.displayValue = this.iri;
					this.displayTooltip = 'Blank node';
				} else {
					this.detectLiteralType();
				}
			} else {
				this.valueType = null;
				this.typeIri = null;
                this.displayValue = null;
                this.displayTooltip = null;
            }
		},

		detectLiteralType() {
			let val = this.data.v.value.toString().trim();
			let m = /#[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]/.exec(val);
			if (m !== null) {
				this.valueType = 'color';
				this.displayStyle = 'background-color:' + m[0];
			}
		},

		showIri(iri) {
			this.$emit('show-iri', iri);
		},

		hoverIri(iri) {
			this.$emit('hover-iri', iri);
		},

		leaveIri(iri) {
			this.$emit('leave-iri', iri);
		},

		showExternal() {
			this.$emit('show-ext', this.iri);
		}
	}
}
</script>

<style>
.value-info .uri-value .badge {
	margin-left: 0.5em;
	vertical-align: top;
	cursor: default;
}
.value-info .tag.badge {
	font-size: 0.95em;
	cursor: default;
}
.value-info .color-box {
	border: 1px solid var(--p-text-color);
	font-size: 80%;
	vertical-align: text-top;
	margin-left: 0.3em;
	cursor: default;
}
.value-info .i-action {
	margin-left: 0.5em;
}
</style>
