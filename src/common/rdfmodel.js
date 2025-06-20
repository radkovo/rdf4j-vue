import {RdfObjectLoader} from "rdf-object";
import {Parser} from "n3";

export default class RDFModel {

	context = {
		"rdf" : "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
		"rdfs" : "http://www.w3.org/2000/01/rdf-schema#",
		"xsd" : "http://www.w3.org/2001/XMLSchema#",
		"b" : "http://fitlayout.github.io/ontology/render.owl#",
		"a" : "http://fitlayout.github.io/ontology/segmentation.owl#",
		"fl" : "http://fitlayout.github.io/ontology/fitlayout.owl#",
		"r" : "http://fitlayout.github.io/resource/"
	}
	
	creators = null;
	loader = null;
	//inverse properties to watch separately
	invProperties = [];
	//target objects of inverse propeties
	targets = {};
	//a cache of already created objects
	objects = {};

	constructor(creators) {
		this.creators = creators;
		this.loader = new RdfObjectLoader({ context: this.context });
		//scan for inverse properties
		for (const type in this.creators) {
			const creator = this.creators[type];
			for (const key in creator.propertyMap) {
				if (creator.propertyMap[key].inverse) {
					const propIri = creator.propertyMap[key].name;
					this.invProperties[propIri] = type;
				}
			}
		}
	}
	
	parse(text) {
		return new Promise(resolve => {
			const parser = new Parser();
			let quads = [];
			let errors = [];
			this.boxIRIs = [];
			parser.parse(text, (err, quad, prefixes) => {
				if (quad) {
					quads.push(quad);
					//store the sources of inverse properties
					if (this.invProperties[quad.predicate.id] !== undefined)
					{
						this.addTarget(quad.object.id, quad.predicate.id, quad.subject.id);
					}
				} else if (prefixes) {
					this.loader.importArray(quads).then(() => { resolve() });
				} else {
					errors.push(err);
				}
			});
		});
	}

	addTarget(objectIri, propertyIri, subjectIri) {
		let target = this.targets[objectIri];
		if (target === undefined) {
			target = {};
			this.targets[objectIri] = target;
		}
		let property = target[propertyIri];
		if (property === undefined) {
			property = [];
			target[propertyIri] = property;
		}
		property.push(subjectIri);
	}

	async add(quad) {
		await this.loader.importArray([quad]);
	}

	getResources() {
		return this.loader.resources;
	}

	getType(subj) {
		const type = this.loader.resources[subj].property['rdf:type'];
		if (type && type.value) {
			return type.value;
		} else {
			return undefined;
		}
	}

	/**
	 * Infers the concrete type of an object. This is used to concretize
	 * particular subtypes of a generic object. The basic implementation
	 * tries to use the rdf:type property for determining the type. Subclasses
	 * may re-implement this to add other mechanisms such as considering
	 * other properties.
	 * @param {*} iri the object IRI
	 * @param {*} baseType the base type given by the owning property domain/range.
	 */
	inferObjectType(iri, baseType) {
		let type = this.getType(iri); //try to use rdf:type
		if (!type) {
			type = baseType; //no type defined, use the base type
		}
		return type;
	}

	createObject(iri, type) {
		if (this.objects[iri] === undefined) {
			const finalType = this.inferObjectType(iri, type);
			const creator = this.creators[finalType];
			const resource = this.loader.resources[iri];
			if (creator !== undefined && resource !== undefined) {
				let obj = {};
				obj['_iri'] = iri;
				obj['_type'] = finalType;
				this.objects[iri] = obj;
				creator.create(resource, this, obj);
			} 
		}
		return this.objects[iri];
	}

	getObject(iri, type) {
		return this.createObject(iri, type);
	}

	/**
	 * Creates all objects of known types and returns a collection.
	 */
	getAllObjects() {
		let ret = [];
		for (let res in this.getResources()) {
			const rtype = this.getType(res);
			if (rtype) {
				const obj = this.getObject(res, rtype);
				if (obj) {
					ret.push(obj);
				}
			}
		}
		return ret;
	}

	createInverseObjects(target, property) {
		let ret = [];
		const t = this.targets[target];
		if (t !== undefined && t[property] !== undefined) {
			for (const subj of t[property]) {
				const type = this.getType(subj);
				if (type) {
					const obj = this.createObject(subj, type);
					if (obj) {
						ret.push(obj);
					}
				}
			}
		}
		return ret;
	}

}
