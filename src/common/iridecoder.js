export default class IriDecoder {

	namespaces = {
		rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
		rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
		xsd: 'http://www.w3.org/2001/XMLSchema#',
		owl: 'http://www.w3.org/2002/07/owl#',
		b: 'http://fitlayout.github.io/ontology/render.owl#',
		a: 'http://fitlayout.github.io/ontology/segmentation.owl#',
		fl: 'http://fitlayout.github.io/ontology/fitlayout.owl#',
		r: 'http://fitlayout.github.io/resource/'
	};

	decodeIri(shortForm) {
		const si = shortForm.indexOf(':');
		if (si > 0) {
			const prefix = shortForm.substring(0, si);
			for (let key in this.namespaces) {
				if (prefix === key) {
					const suffix = shortForm.substring(si + 1);
					return this.namespaces[key] + suffix;
				}
			}
		}
		return shortForm;
	}

	encodeIri(longForm) {
		for (let key in this.namespaces) {
			const iprefix = this.namespaces[key];
			if (longForm.indexOf(iprefix) === 0) {
				return key + ':' + longForm.substring(iprefix.length);
			}
		}
		return longForm;
	}

}
