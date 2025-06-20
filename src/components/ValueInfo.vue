<template>
	<span class="value-info" v-if="valueType">
		<span v-if="valueType==='literal'" v-tooltip.bottom="literalTooltip">{{literalValue}}</span>
		<span v-if="valueType==='color'">{{literalValue}} <span class="color-box" :style="displayStyle">&#x2003;</span></span>
		<span v-if="valueType==='bnode'">
			<a class="iri-link iri font-monospace" v-tooltip.bottom="displayTooltip" @click="() => { showIri(iri); }">{{displayValue}}</a>
		</span>
		<span v-if="valueType==='uri'" class="uri-value" :class='typeInfo.type'>
			<Iri :iri="data.v.value" :active="active" 
				@show-iri="showIri"
				@hover-iri="hoverIri"
				@leave-iri="leaveIri" />
			<span v-if="typeInfo.name" class="badge">{{typeInfo.name}}</span>
			<i v-if="showExt && extIcon" v-tooltip="extTooltip" class="i-action" :class="extIcon" 
				style="cursor: pointer" @click="showExternal" />
		</span>
		<span v-if="valueType==='rectangle'" v-tooltip.bottom="'rectangle[x1, y1, x2, y2]'">{{displayValue}}</span>
		<span v-if="valueType==='attribute'">{{displayValue}}</span>
		<span v-if="valueType==='border'">{{displayValue}} <span class="color-box" :style="displayStyle">&#x2003;</span></span>
		<span v-if="valueType==='tag'">
			<span class="tag badge" :style="displayStyle" v-tooltip.bottom="displayTooltip">{{displayValue}}</span>
			<i v-if="structIcon" class="i-action" :class="structIcon" 
				style="cursor: pointer" @click="showStruct" />
		</span>
		<span v-if="valueType==='relation'" class="uri-value" :class='typeInfo.type'>
			<Iri :iri="displayValue.relIri" :active="false" 
				@show-iri="showIri"
				@hover-iri="hoverIri"
				@leave-iri="leaveIri" />
			<span class="ml-2">&nbsp;</span>
			<Iri :iri="displayValue.targetIri" :active="true" 
				@show-iri="showIri"
				@hover-iri="hoverIri"
				@leave-iri="leaveIri" />
			<span class="ml-2">{{ displayValue.weight }}</span>
			<i v-if="showExt && extIcon" v-tooltip="extTooltip" class="i-action" :class="extIcon" 
				style="cursor: pointer" @click="showExternal" />
		</span>
	</span>
</template>

<script>
import Iri from './Iri.vue';
import IriDecoder from '../common/iridecoder.js';

export default {
	name: 'ValueInfo',
	components: {
		Iri
	},
	inject: ['apiClient'],
	emits: ['show-iri', 'hover-iri', 'leave-iri', 'show-ext', 'show-struct'],
	props: {
		data: null,
		activeIris: null, //force active IRIs
		extIcon: null, //icon for opening a structural browser
		extTooltip: null,
		structIcon: null, //icon for structure values
		extAll: null //show ext icon always
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
				let ret = knownTypes[this.typeIri];
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
					this.apiClient.getTypeByIRI(this.iri).then(typeIri => { 
						this.typeIri = typeIri;
						this.updateType();
						this.showExt = this.active || this.extAll;
						if (this.activeIris) {
							this.active = true; //force active IRIs
						}
					});
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
		updateType() {
			//console.log('TYPE changed: ' + this.typeIri);
			// undefined type - try to guess
			if (this.typeIri === 'unknown') {
				// guess by contents
				this.apiClient.getSubjectDescriptionObj(this.iri).then(descr => {
					// attributes
					if (this.data.p && this.data.p.value === BOX.hasAttribute) {
						this.valueType = 'attribute';
						this.displayValue = descr[RDFS.LABEL][0].value + '="' + descr[RDF.VALUE][0].value + '"';
					}
					// undeclared tags - unknown name
					else if (this.data.p && this.data.p.value === SEGM.hasTag) {
						this.valueType = 'tag';
						let name = inferTagName(this.iri);
						let ttype = inferTagType(this.iri) || 'x';
						//this.displayValue = descr[SEGM.hasName][0].value;
						this.displayValue = ttype + ':' + name;
						this.displayStyle = 'background-color:' + stringColor(name);
						this.displayTooltip = this.iri;
					}
					else if (this.data.p && this.data.p.value === SEGM.tagSupport) {
						this.valueType = 'tag';
						this.displayValue = descr[SEGM.hasTag][0].value + ':' + descr[SEGM.support][0].value;
						this.apiClient.getSubjectDescriptionObj(descr[SEGM.hasTag][0].value).then(tagDescr => {
							if (tagDescr[SEGM.name]) {
								this.displayValue = tagDescr[SEGM.name][0].value + ':' + descr[SEGM.support][0].value;
								this.displayStyle = 'background-color:' + stringColor(tagDescr[SEGM.name][0].value);
							}
						});
					}
					// relation descriptions
					else if (this.data.p && this.data.p.value === SEGM.isInRelation) {
						this.valueType = 'relation';
						this.displayValue = {
							relIri: descr[SEGM.hasRelationType][0].value,
							targetIri: descr[SEGM.hasRelatedRect][0].value,
							weight: descr[SEGM.support][0].value
						};
					}
					// inverse relation descriptions
					else if (this.data.p && this.data.p.value === SEGM.hasRelatedRect) {
						// leave without formatting for now
					}
					// rectangles
					else if (descr[BOX.positionX] && descr[BOX.positionY]
						&& descr[BOX.width] && descr[BOX.height])
					{
						//it is a rectangle
						this.valueType = 'rectangle';
						this.displayValue = '['
							+ descr[BOX.positionX][0].value + ', '
							+ descr[BOX.positionY][0].value + ', '
							+ (parseInt(descr[BOX.positionX][0].value) + parseInt(descr[BOX.width][0].value) - 1) + ', '
							+ (parseInt(descr[BOX.positionY][0].value) + parseInt(descr[BOX.height][0].value) - 1) + ']'
							+ ' (' + descr[BOX.width][0].value + ' x ' + descr[BOX.height][0].value + ')';
					}
					else
					{
						console.log('Unknown type ' + this.iri);
						console.log(descr);
					}
				});
			}
			// borders
			else if (this.typeIri === BOX.Border) {
				this.apiClient.getSubjectDescriptionObj(this.iri).then(descr => {
					this.valueType = 'border';
					this.displayValue = descr[BOX.borderWidth][0].value + 'px '
						+ descr[BOX.borderStyle][0].value.toLowerCase() + ' '
						+ descr[BOX.borderColor][0].value + ' ';
					this.displayStyle = 'background-color:' + descr[BOX.borderColor][0].value;
				});
			}
			// declared tags
			else if (this.typeIri == SEGM.Tag) {
				this.valueType = 'tag';
				// use an inferred name until the declared name is retrieved
				let name = inferTagName(this.iri);
				this.displayValue = 'x:' + name;
				this.displayStyle = 'background-color:' + stringColor(name);
				this.displayTooltip = this.iri;
				// retrieve the declared name
                this.apiClient.getSubjectDescriptionObj(this.iri).then(descr => {
					let type = (descr[SEGM.type][0]) ? descr[SEGM.type][0].value : 'x';
					let name = (descr[SEGM.name][0]) ? descr[SEGM.name][0].value : null;
					if (name) {
						this.displayValue = type + ':' + name;
					}
				});				
			}
			// check known types
			else if (knownTypes[this.typeIri]) {
				this.active = true;
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
		},
		showStruct() {
			this.$emit('show-struct', this.iri);
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
