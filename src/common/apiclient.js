const develMode = (window.location.port === '3000'); //development server detection
const localMode = (window.location.hostname === 'localhost'); //local mode (http allowed)
const protocol = localMode ? location.protocol : 'https:'; //force https for non-local mode
//const flhost = develMode ? 'http://localhost:8080' : (protocol + '//' + window.location.host);

// SELECT response size limit (in rows) sent to the endpoint. 
// Note that the server also has a maximal allowed limit that cannot be exceeded.
const QUERY_LIMIT = 2048; 

// Local storage key for saved queries.
const QUERIES_STORAGE_KEY = 'rdf4j-queries';

// RDF4J NIL IRI
const NIL_IRI = 'http://rdf4j.org/schema/rdf4j#nil';

import IriDecoder from './iridecoder.js';

/**
 * A default API client implementation that uses fetch() for connecting the RDF4J server REST API.
 * Saved queries are stored in local storage.
 */
export default class ApiClient {

	serverUrl = 'http://localhost/rdf4j-server';
	serverLogin = null;
	serverPassword = null;

	currentRepo = 'default';
	onNotAuthorized = null;

	cachedNamespaces = null;
	iriDecoder = null;

	repositoryEndpoint() {
		return this.serverUrl + '/repositories/' + this.currentRepo;
	}

	setServerUrl(url) {
		this.serverUrl = url;
    }

	async setRepository(repo) {
		this.currentRepo = repo;
		this.cachedNamespaces = null;
		this.iriDecoder = null;
		await this.getIriDecoder(); // update IriDecoder with current namespaces
	}

	async login(username, password) {
		this.serverLogin = username;
		this.serverPassword = password;
		this.iriDecoder = null;
		await this.getIriDecoder(); // update IriDecoder with current namespaces
	}

    async getSubjectDescription(iri) {
		const query = `
			SELECT (?s as ?subject) (?p as ?predicate) (?o as ?object) (?g as ?context) WHERE {
				{
					GRAPH <${NIL_IRI}> {
						<${iri}> ?p ?o .
						BIND(<${iri}> AS ?s)
					}
				}
				UNION
				{
					GRAPH ?g {
						<${iri}> ?p ?o .
						BIND(<${iri}> AS ?s)
					}
				}
			}		
		`;
		return await this.selectQuery(query);
	}

    async getSubjectReferences(iri) {
		const query = `
			SELECT (?s as ?subject) (?p as ?predicate) (?o as ?object) (?g as ?context) WHERE {
				{
					GRAPH <${NIL_IRI}> {
						?s ?p <${iri}> .
						BIND(<${iri}> AS ?o)
					}
				}
				UNION
				{
					GRAPH ?g {
						?s ?p <${iri}> .
						BIND(<${iri}> AS ?o)
					}
				}
			}		
		`;
        return await this.selectQuery(query);
	}

	async getSubjectMentions(iri) {
		const query = `
			SELECT (?s as ?subject) (?p as ?predicate) (?o as ?object) (?g as ?context) WHERE {
				{
					GRAPH <${NIL_IRI}> {
						<${iri}> ?p ?o .
						BIND(<${iri}> AS ?s)
					}
				}
				UNION
				{
					GRAPH <${NIL_IRI}> {
						?s <${iri}> ?o .
						BIND(<${iri}> AS ?p)
					}
				}
				UNION
				{
					GRAPH <${NIL_IRI}> {
						?s ?p <${iri}> .
						BIND(<${iri}> AS ?o)
					}
				}
				UNION
				{
					GRAPH ?g {
						<${iri}> ?p ?o .
						BIND(<${iri}> AS ?s)
					}
				}
				UNION
				{
					GRAPH ?g {
						?s <${iri}> ?o .
						BIND(<${iri}> AS ?p)
					}
				}
				UNION
				{
					GRAPH ?g {
						?s ?p <${iri}> .
						BIND(<${iri}> AS ?o)
					}
				}
				UNION
				{
					GRAPH <${iri}> {
						?s ?p ?o .
						BIND(<${iri}> AS ?g)
					}
				}
			}		
		`;
        return await this.selectQuery(query);
	}

    async getSubjectValue(subjectIri, propertyIri) {
		const url = this.repositoryEndpoint() + '/subject/' + encodeURIComponent(subjectIri) + '/' + encodeURIComponent(propertyIri);
		let response = await fetch(url, {
			method: 'GET',
			headers: this.headers()
		});
		this.checkAuth(response);
		const data = await response.json();
		return data;
	}

	async selectQuery(query, limit) {
		const qlimit = (limit === undefined) ? QUERY_LIMIT : limit
		const url = this.repositoryEndpoint() + '?limit=' + qlimit;
		let response = await fetch(url, {
			method: 'POST',
			headers: this.headers({
				'Content-Type': 'application/sparql-query',
				'Accept': 'application/json'
			}),
			body: query
		});
		this.checkAuth(response);
		if (!response.ok) {
			let error = response.status;
			throw new Error(error);
		}
		const data = await response.json();
		return data;
	}

	async updateQuery(query) {
		const url = this.repositoryEndpoint() + '/statements';
		let response = await fetch(url, {
			method: 'POST',
			headers: this.headers({
				'Content-Type': 'application/sparql-update'
			}),
			body: query
		});
		this.checkAuth(response);
		if (!response.ok) {
			let error = response.status;
			throw new Error(error);
		}
		return true;
	}

	async getContexts() {
		const url = this.repositoryEndpoint() + '/contexts';
		let response = await fetch(url, {
			method: 'GET',
			headers: this.headers({
				'Accept': 'application/json'
			})
		});
		this.checkAuth(response);
		if (!response.ok) {
			let error = response.status;
			throw new Error(error);
		}
		const resp = await response.json();
		let ret = [];
		for (let bind of resp.results.bindings) {
			ret.push({ iri: bind.contextID.value });
		}
		return ret;
	}

	async exportContext(contextIri, mime, thenFunction) {
		const url = this.repositoryEndpoint() + '/statements?context=' + encodeURIComponent('<' + contextIri + '>');
		let response = await fetch(url, {
			method: 'GET',
			headers: this.headers({
				'Accept': mime
			})
		})
		this.checkAuth(response);
		if (!response.ok) {
			let error = response.status;
			throw new Error(error);
		}
		response.blob().then(thenFunction);
	}

	async replaceContext(contextIri, mime, data) {
		const url = this.repositoryEndpoint() + '/statements?context=' + encodeURIComponent('<' + contextIri + '>');
		let response = await fetch(url, {
			method: 'PUT',
			headers: this.headers({
				'Content-Type': mime
			}),
			body: data
		})
		this.checkAuth(response);
		if (!response.ok) {
			let data = await response.json();
			throw new Error(data.message);
		}
	}

	async deleteContext(contextIri) {
		const url = this.repositoryEndpoint() + '/statements?context=' + encodeURIComponent('<' + contextIri + '>');
		let response = await fetch(url, {
			method: 'DELETE',
			headers: this.headers()
		})
		this.checkAuth(response);
		if (!response.ok) {
			let error = response.status;
			throw new Error(error);
		}
		const data = await response.json();
		return data.status == 'ok';
	}

	async listRepositories() {
		const url = this.serverUrl + '/repositories';
		try {
			let response = await fetch(url, {
				method: 'GET',
				headers: this.headers({
					'Accept': 'application/json'
				})
			});

			this.checkAuth(response);
			if (!response.ok) {
				let data = await response.json();
				throw new Error(data.message);
			}

			const data = await response.json();
			return this.toObjectArray(data.results.bindings);
		} catch (e) {
			throw new Error(e);
		}		
	}

	async createRepository(data) {
		const url = this.repositoryEndpoint();
		try {
			let response = await fetch(url, {
				method: 'PUT',
				headers: this.headers({
					'Content-Type': 'application/json'
				}),
				body: JSON.stringify(data)
			});

			this.checkAuth(response);
			const rdata = await response.json();
			if (!response.ok) {
				throw new Error(rdata.message);
			}

			return rdata;

		} catch (e) {
			throw new Error(e);
		}
	}

	async getNamespaces() {
		const url = this.repositoryEndpoint() + '/namespaces';
		try {
			let response = await fetch(url, {
				method: 'GET',
				headers: this.headers({
					'Accept': 'application/json'
				})
			});

			this.checkAuth(response);
			if (!response.ok) {
				let data = await response.json();
				throw new Error(data.message);
			}

			const data = await response.json();
			return data;
		} catch (e) {
			throw new Error(e);
		}		
	}

	async getNamespacesCached() {
		if (!this.cachedNamespaces) {
			this.cachedNamespaces = await this.getNamespaces();
		}
		return this.cachedNamespaces;
	}

	async getIriDecoder() {
		if (!this.iriDecoder) {
			let ns = null;
			try {
                let data = await this.getNamespaces();
				ns = {};
				for (let bind of data.results.bindings) {
					ns[bind.prefix.value] = bind.namespace.value;
				}
            } catch (e) {
                //throw new Error('Error fetching namespaces:'+ e);
            }
            this.iriDecoder = new IriDecoder(ns);
        }
		return this.iriDecoder;
	}

	//================================================================================

	checkAuth(response) {
		if (response.status == 401 || response.status == 403) {
			if (this.onNotAuthorized) {
				this.onNotAuthorized();
			}
			return false;
		} else {
			return true;
		}
	}

	headers(headers) {
		const src = headers ? headers : {};
		const basicAuth = btoa(this.serverLogin + ':' + this.serverPassword);
		if (basicAuth) {
			return {
				...src,
				'Authorization': 'Basic ' + basicAuth,
			};
		} else {
			return src;
		}
	}

	//================================================================================

	async getSavedQueries() {
		let json = localStorage.getItem(QUERIES_STORAGE_KEY);
		if (json) {
            let queries = JSON.parse(json);
			// assign id to each query
			queries.forEach((q, i) => {
                q.id = i + 1;
            });
            return queries;
        } else {
            return [];
        }
	}

	async saveQuery(data) {
		let queries = await this.getSavedQueries();
        queries.push(data);
        localStorage.setItem(QUERIES_STORAGE_KEY, JSON.stringify(queries));
	}

	async deleteQuery(queryId) {
		let queries = await this.getSavedQueries();
        queries = queries.filter(q => q.id !== queryId);
        localStorage.setItem(QUERIES_STORAGE_KEY, JSON.stringify(queries));
	}

	//================================================================================

	/**
	 * Transforms an RDF Binding into a JavaScript object.
	 * @param {*} binding 
	 * @returns 
	 */
	toObject(binding) {
		const obj = {};
        for (let prop in binding) {
			let bind = binding[prop];
			let val;
			if (bind.datatype && bind.datatype === 'http://www.w3.org/2001/XMLSchema#boolean') {
				val = (bind.value === 'true');
			} else if (bind.datatype && bind.datatype === 'http://www.w3.org/2001/XMLSchema#integer') {
				val = parseInt(bind.value);
			} else if (bind.datatype && bind.datatype === 'http://www.w3.org/2001/XMLSchema#decimal') {
				val = parseFloat(bind.value);
			} else {
                val = bind.value;
            }
            obj[prop] = val;
        }
        return obj;
	}

	/**
	 * Transforms an array of RDF Bindings into an array of JavaScript objects.
	 * @param {*} bindings 
	 * @returns 
	 */
	toObjectArray(bindings) {
		return bindings.map(binding => this.toObject(binding));
    }

}
