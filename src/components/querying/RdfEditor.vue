<template>
    <Toast />

    <div class="col text_left">
        <h2>SPARQL Query</h2>
    </div>
    <table class="common_bgc editor_table">
        <tbody>
            <tr class="minimal">
                <th class="text_left padding_set" v-if="htmlCode.length">
                    Namespaces:
                </th>
            </tr>
            <tr v-for="(n, j) in htmlCode" :key="j" class="minimal">
                <!-- tds representing namespaces with prefixes -->
                <td class="text_left width_95 padding_set font_style" :id="`td-${j}`"></td>
            </tr>

            <tr>
                <td class="width_95">
                    <prism-editor class="my-editor" v-model="code" :highlight="highlighter" line-numbers></prism-editor>
                </td>
            </tr>
        </tbody>
    </table>
    <div class="grid grid-cols-12 gap-4 under_editor_space">
        <div class="col-start-4 col-span-3">
            <Button @click="queryData" label="Execute" class="w-full" v-tooltip.bottom="'Execute the query'" />
        </div>
        <div class="col-start-8 col-span-5">
            <InputText id="name" v-model="queryName" type="text" placeholder="Save query as ..." />
            <Button label="Save" @click="saveQuery" class="p-button-secondary save_button_margin"
                v-tooltip.bottom="'Save new or edited query'" />
            <Button label="Saved queries" @click="savedQueriesShown = true" class="p-button-success ml-2"
                v-tooltip.bottom="'Show saved queries'" />
        </div>
    </div>

    <Popover ref="errorPopover">
        <div class="syntax-error-message">
            {{ errorText }}
        </div>
    </Popover>

    <Dialog v-model:visible="savedQueriesShown" modal header="Saved queries" :style="{ width: '50vw' }">
        <QueryList @select-query="selectQuery" @use-query="useQuery" />
        <template #footer>
            <Button label="Cancel" icon="pi pi-times" @click="savedQueriesShown = false" text />
            <Button label="Select" icon="pi pi-check" @click="loadQuery" :disabled="!selectedQuery" autofocus />
        </template>
    </Dialog>

</template>

<script>
// import Prism Editor
import { PrismEditor } from 'vue-prism-editor';
// import the styles for vue-prism-editor 
import 'vue-prism-editor/dist/prismeditor.min.css';

// import highlighting library (you can use any library you want just return html string)
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
// turtle was needed as dependency
import 'prismjs/components/prism-turtle';
import 'prismjs/components/prism-sparql';

// theme for the editor
// import syntax highlighting styles
import 'prismjs/themes/prism.css';

// PrimeVue components
import Button from 'primevue/button';
import Tooltip from 'primevue/tooltip';
import Toast from 'primevue/toast';
import InputText from 'primevue/inputtext';
import Dialog from 'primevue/dialog';

import QueryList from './QueryList.vue';

// Sparql parser to validate query
import Sparqljs from 'sparqljs';
import { Popover } from 'primevue';

export default {
    name: 'RdfEditor',
    components: {
        PrismEditor,
        Button,
        Toast,
        InputText,
        Popover,
        Dialog,
        QueryList
    },
    inject: ['apiClient'],
    emits: ['resultReturn', 'loadingResult'],
    directives: {
        'tooltip': Tooltip
    },
    data: () => ({
        // syntax highlighted html code representing prefixes in editor 
        htmlCode: [],
        // query entered by user
        code: "",
        // if the syntax is valid
        valid: false,
        // error message when query is not valid
        errorText: "",
        // array containing all prefix and namespace tuples
        prefixNsTuples: [],
        // parser used for query validation
        parser: new Sparqljs.Parser(),
        // already added prefixes
        alreadyAddedPrefs: [],
        // prefix declarations to prepend to the query
        prefixTextDeclarations: [],
        // type of the query (select, ask, construct, update-insert,delete,...)
        queryType: "select",
        // name of the query to be saved
        queryName: "",

        savedQueriesShown: false,
        selectedQuery: null
    }),
    mounted() {
        // initial query off all namespaces from the repository
        this.queryAllNamespaces();
    },
    methods: {
        // creating syntax highlighted version of the query
        highlighter(code) {
            // creation of prefix declarations 
            this.searchPrefixesToComplete(code);
            // visualize prefix declarations in the editor by setting the HTML content
            this.setPrefixDeclarationsTdInnerHtml();
            // 
            // languages.<insert language> to return html with markup 
            let highlightedCode = highlight(code, languages.sparql);
            return highlightedCode;
        },

        showError(lineNo, errorText) {
            let lines = document.querySelectorAll('.prism-editor-wrapper .prism-editor__line-number'); // list of line numbers
            for (let i = 0; i < lines.length; i++) {
                if (i === lineNo - 1) {
                    lines[i].classList.add('error-line'); // adding error line class
                    lines[i].addEventListener('mouseover', this.showErrorPopover);
                    lines[i].addEventListener('mouseout', this.hideErrorPopover);
                } else {
                    lines[i].classList.remove('error-line'); // removing error line class
                    lines[i].removeEventListener('mouseover', this.showErrorPopover);
                    lines[i].removeEventListener('mouseout', this.hideErrorPopover);
                }
            }
            this.errorText = errorText; // showing error message
        },

        showErrorPopover(event) {
            this.$refs.errorPopover.show(event);
        },

        hideErrorPopover() {
            this.$refs.errorPopover.hide();
        },

        // fetching all namespaces present in the repository
        async queryAllNamespaces() {
            try {
                const data = await this.apiClient.getNamespaces();
                console.log("NS");
                console.log(data);

                // storing namespaces with corresponding prefixes as tuples
                for (let index = 0; index < data.results.bindings.length; index++) {
                    this.prefixNsTuples.push({
                        'prefix': data.results.bindings[index].prefix.value,
                        'namespace': data.results.bindings[index].namespace.value
                    })
                }
                
                return data;

            } catch (e) {
                    this.$toast.add({ severity: 'error', summary: 'Error', detail: "Error happened during fetch of all namespaces!" });
            }
        },

        // executing user given query
        async queryData() {

            // connect prefixes with query body
            let queryText = this.code;
            //console.log('code ' + this.code);

            this.prefixTextDeclarations.forEach(element => {
                queryText = element.code + queryText;
                //console.log('add ' + element.code);
            });

            // syntax validation
            let queryDescr = this.validateQuery(queryText, this.parser);

            // get the type of query
            this.queryType = queryDescr.queryType ? queryDescr.queryType.toLowerCase() : "empty";
            console.log(queryDescr);
            console.log('query type ' + this.queryType);

            let queryResponse;
            if (this.valid && this.queryType !== "empty") {
                // emit that the fetching of data started, so show spinner
                this.$emit('loadingResult', true);

                try {
                    if (this.queryType == "update") {
                        queryResponse = await this.apiClient.updateQuery(queryText);
                    } else {
                        queryResponse = await this.apiClient.selectQuery(queryText);
                    }
                } catch (e) {
                    console.error(e);
                    this.$toast.add({ severity: 'error', summary: 'Error', detail: e.getMessage() });
                }

                // emit that the fetching of data ended, so hide spinner
                this.$emit('loadingResult', false);

                // emit answer if everything was OK and data was found
                if ((this.queryType == "ask" && 'boolean' in queryResponse) ||
                    (this.queryType == "select" && queryResponse.results.bindings.length > 0) ||
                    (this.queryType == "construct" && queryResponse.length > 0) ||
                    (this.queryType == "update" && 'status' in queryResponse)) {
                    let data = [queryResponse, this.prefixNsTuples, this.queryType];
                    this.$emit('resultReturn', { data });
                } else {
                    // no data found for the query
                    let data = ['', '', 'clear'];
                    this.$emit('resultReturn', { data });
                    this.$toast.add({ severity: 'warn', summary: 'Warn Message', detail: 'Query was successful but no data found!', life: 5000 });
                }
            }

        },

        // validation of the query typed in by the user 
        validateQuery(code, parser) {
            try {
                // syntax validation by parser
                let ret = parser.parse(code);
                this.valid = true;
                this.showError(-1, '');
                return ret;
            } catch (error) {
                // parsing the number of the line on which the error is
                // from the error.message 
                let errorText = error.message;
                const nthIndxOfSpace = this.nthIndex(errorText, ' ', 4) + 1;
                const indxOfColon = errorText.indexOf(':');
                const rowNumWithError = errorText.substring(nthIndxOfSpace, indxOfColon);
                console.log('rowNumWithError' + rowNumWithError + " [[" + errorText);
                // handling if in the error.message the line number is not specified
                if (!isNaN(rowNumWithError)) {
                    // line number is present
                    this.showError(parseInt(rowNumWithError), errorText);
                    this.$toast.add({ severity: 'error', summary: 'Error Message', detail: 'Query contains error!', life: 3000 });
                } else {
                    this.$toast.add({ severity: 'error', summary: 'Error Message', detail: 'Query contains error: ' + errorText });
                }
            }
        },

        // searching for the nth occurrence of pattern in string
        // returns index of the occurrence
        nthIndex(str, pat, n) {
            var L = str.length, i = -1;
            while (n-- && i++ < L) {
                i = str.indexOf(pat, i);
                if (i < 0) break;
            }
            return i;
        },

        // checking if server response contains error
        async errorHandler(res) {
            if (!res.ok) {
                // something went wrong on server (status like: 4xx or 5xx, ...)
                this.$toast.add({ severity: 'error', summary: 'Error', detail: "Error occurred during execution", life: 3000 });
                return null;
            } else {

                this.$toast.add({ severity: 'success', summary: 'Success Message', detail: 'Query was successfully executed', life: 3000 });
                if (this.queryType != "construct") {
                    return await res.json();
                } else {
                    return await res.text();
                }

            }
        },

        // automatic completion of prefixes
        searchPrefixesToComplete(code) {
            let newlyFoundPrefs = [];
            if (code.length > 0 && code.match(/([a-z][A-Z][0-9])*\w+/g)) {
                // search for possible prefixes in the user given query
                const matched = code.match(/([a-z][A-Z])*\w*:([a-z][A-Z][0-9])*\w+/g);
                if (matched) {
                    // control if the matched words are correct prefixes
                    matched.forEach(element => {
                        const prefix = element.substring(0, element.indexOf(":"));
                        const nameSpacePrefixTuple = this.prefixNsTuples.filter(i => i.prefix == prefix)[0];

                        // prepare proper html code to visualize prefix in the editor for the user
                        if (nameSpacePrefixTuple && !newlyFoundPrefs.includes(prefix)) {
                            // this.alreadyAddedPrefs.push(prefix);
                            newlyFoundPrefs.push(prefix);
                            if (!this.alreadyAddedPrefs.includes(prefix)) {
                                // store text representation of prefix (declaration)
                                this.prefixTextDeclarations.push({
                                    "prefix": prefix,
                                    "code": "PREFIX " + prefix + ": <" + nameSpacePrefixTuple.namespace + ">"
                                })
                                // highlight the html code
                                let highlightedCode = highlight("PREFIX " + prefix + ": <" + nameSpacePrefixTuple.namespace
                                    + ">", languages.sparql);
                                this.htmlCode.push({
                                    "prefix": prefix,
                                    "code": highlightedCode
                                });
                            }
                        }

                    })

                    // control which previous prefixes are not present in the query
                    this.alreadyAddedPrefs.forEach(e => {
                        if (!newlyFoundPrefs.includes(e)) {
                            this.htmlCode = this.htmlCode.filter(i => i.prefix !== e);
                            this.prefixTextDeclarations = this.prefixTextDeclarations.filter(i => i.prefix !== e);
                        }
                    });

                    // save all present prefixes
                    this.alreadyAddedPrefs = newlyFoundPrefs;
                } else {
                    // clear html code after user deleting all prefixes from editor
                    this.htmlCode = [];
                    this.alreadyAddedPrefs = [];
                }
            } else {
                // no prefix found in the query
                this.alreadyAddedPrefs = [];
                this.htmlCode = [];
                this.prefixTextDeclarations = [];
            }
        },

        setPrefixDeclarationsTdInnerHtml() {
            // wait until DOM is re-rendered
            this.$nextTick(() => {
                if (this.htmlCode.length > 0) {
                    // set the inner HTML of the td = show the namespace with prefix to the user
                    this.htmlCode.forEach((e, i) => {
                        document.getElementById('td-' + (i)).innerHTML = e.code;
                    });
                }
            })
        },

        // save user specified query to local storage
        async saveQuery() {
            if (this.queryName.length > 0 && this.code.length > 0) {
                try {
                    await this.apiClient.saveQuery({ title: this.queryName, queryString: this.code });
                    this.$toast.add({ severity: 'success', summary: 'Success', detail: `Query "${this.queryName}" was successfully saved!`, life: 3000 });
                } catch (e) {
                    this.$toast.add({ severity: 'error', summary: 'Error', detail: e.message, life: 5000 });
                }
            } else {
                if (this.queryName.length == 0) {
                    // no name for the query was given
                    this.$toast.add({ severity: 'error', summary: 'Error', detail: 'Pleas specify name for the query!', life: 5000 });
                }

                if (this.code.length == 0) {
                    // no name for the query was given
                    this.$toast.add({ severity: 'error', summary: 'Error', detail: 'Pleas specify the query!', life: 5000 });
                }

            }
        },

        selectQuery(q) {
            this.selectedQuery = q;
        },

        useQuery(q) {
            this.selectedQuery = q;
            this.loadQuery();
        },

        loadQuery() {
            if (this.selectedQuery) {
                this.code = this.selectedQuery.queryString;
                this.queryName = this.selectedQuery.title;
            }
            this.savedQueriesShown = false;
        }


    },
};
</script>

<style>
/* required class for vue-prism-editor*/
.my-editor {
    background: #f5f2f0;
    font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
    font-size: 14px;
    line-height: 1.5;
    padding: 5px;
    position: absolute;
    left: 0;
    top: 0;
}

.common_bgc {
    background: #f5f2f0;
}

.error_td_size {
    font-size: 14px;
    padding: 5px;
    line-height: 1.5;
    height: 100%;
}

/* optional class for removing the outline */
.prism-editor__textarea:focus {
    outline: none;
}

.text_left {
    text-align: left;
}

.width_95 {
    width: 95%;
    position: relative;
}

.padding_set {
    padding: 0 25px;
    padding-top: 5px;
}

.font_style {
    font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
    font-size: 14px;
    line-height: 1.5;
}

.editor_table {
    width: 100%;
    border: 2px solid black;
    min-height: 20vh;
}

.hidden_tr {
    visibility: hidden;
}

.red_text {
    color: red;
}

.error-line {
    background-color: var(--p-button-danger-background);
    color: var(--p-button-danger-color) !important;
    font-weight: bold;
}

.syntax-error-message {
    white-space: pre-wrap;
    font-family: monospace;
    max-width: 50em;
}

.under_editor_space {
    text-align: center;
    padding: 1.5em 0;
}

.editor_table,
.under_editor_space {
    max-width: 80em;
    /* make space for error tooltips */
}

.save_button_margin {
    margin-right: 10px;
}

.editor_table tr.minimal {
    height: 0;
}
</style>
