<template>
    <div v-if="this.result.data[2] != 'clear'">
        <div v-if="result.data[2] != 'ask' && result.data[2] != 'update'">
            <DataTable :value="rawValues" responsiveLayout="scroll" :paginator="true" :rows="10"
                paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                :rowsPerPageOptions="[10, 20, 50]" currentPageReportTemplate="Showing {first} to {last} of {totalRecords}"
                filterDisplay="row" v-model:filters="filters">
                <template #empty>
                    No data found.
                </template>
                <template #loading>
                    Loading data. Please wait.
                </template>

                <Column v-for="(col, i) in columns" :field="col" :header="col" :key="i" :filterField="`${col}f`">
                    <template #body="slotProps">
                        <slot name="value" v-bind="slotProps.data[col]">
                            {{ slotProps.data[col].value }}
                        </slot>
                    </template>
                    <template #filter="{ filterModel, filterCallback }">
                        <InputText type="text" v-model="filterModel.value" @keydown.enter="filterCallback()"
                            class="p-column-filter" :placeholder="`Search by ${filterModel.matchMode}`"
                            v-tooltip.top.focus="'Hit enter key to filter'" />
                    </template>
                </Column>

            </DataTable>
        </div>
        <div v-else-if="result.data[2] == 'ask'">
            <!--Boolean result -->

            <h3>The result of query is: {{ askRes ? "Yes" : "No" }}</h3>
            <i v-if="askRes" class="pi pi-check" style="color:green; font-weight:bold"></i>
            <i v-else class="pi pi-times" style="color:red; font-weight:bold"></i>
        </div>
        <div v-else-if="result.data[2] == 'update'">
            <h3>The update query was successful
                <i class="pi pi-check" style="color:green; font-weight:bold"></i>
            </h3>
        </div>
    </div>
</template>

<script>
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';

import { FilterMatchMode } from '@primevue/core/api';

import { Parser } from "n3";

export default {
    name: 'QueryResults',
    props: {
        result: {
            type: Object,
            required: true
        }
    },
    components: {
        DataTable,
        Column,
        InputText
    },
    data() {
        return {
            // raw values
            rawValues: [],
            // data for the rows in the table
            computedResult: [],
            // name of columns in the table
            columns: [],
            // show the table if data is available
            showUserQueryRes: false,
            // resource clicked by user for further exploration
            resource: null,
            filters: {
                global: { value: null, matchMode: FilterMatchMode.CONTAINS }
            },
            // the query was typ of ASK (boolean result)
            askRes: undefined,
            // parser for N3 construct queries 
            n3Parser: new Parser({ format: 'N-Triples' })
        }
    },
    mounted() {
        this.processResponse();
    },
    methods: {
        // function activating resource exploration component
        exploreResource(resource) {
            this.filters = {};
            // base column filter
            this.filters['global'] = { value: null, matchMode: FilterMatchMode.CONTAINS };

            this.resource = resource;
            // if data exists for the chosen resource
            if (this.resource !== '')
                this.showUserQueryRes = true;
        },

        clearFilter() {
            this.filter = {};
        },

        // set needed variables based on the response for its correct visualization
        processResponse() {
            if (this.result) {
                // hide table and ask result
                this.showUserQueryRes = false;
                this.askRes = undefined;

                if (this.result.data[2] == "ask") {
                    // ASK query 
                    this.askRes = this.result.data[0].boolean;
                } else if (this.result.data[2] == "select") {
                    // SELECT query   
                    this.processSelectResult(this.result.data[0]);
                } else if (this.result.data[2] == "construct") {
                    // CONSTRUCT query
                    this.processConstructResult(this.result.data[0]);
                }
            }
        },

        // parse the content of the construct query response
        processConstructResult(res) {
            // store column headers 
            ['subject', 'predicate', 'object'].forEach((item) => {
                this.columns.push(
                    item
                );
                // store filter options for columns 
                this.filters[item + 'f'] = { value: null, matchMode: FilterMatchMode.CONTAINS };
            })

            // loop processing response and transforming it to row data  
            // parse the n-triples data from the answer
            this.n3Parser.parse(
                res,
                (error, quad, prefixes) => {
                    // one quad represents one triple from teh answer
                    if (quad) {
                        let answers = {};
                        // construct data object for each column in the row
                        ['_subject', '_predicate', '_object'].forEach(item => {
                            // for column data store : value(with prefix), tooltip(with full URI), type(literal/uri/...)
                            let word = { 'val': quad[item].id, 'tol': quad[item].id, 'type': 'uri' };

                            // replace namespace with prefix if present
                            this.result.data[1].forEach((el) => {
                                word.val = word.val.replace(el.namespace, el.prefix + ':');
                            })

                            // store column data
                            answers[item.substring(1,)] = word;
                            answers[item.substring(1,) + 'f'] = word.val;

                        })
                        // store row data
                        this.computedResult.push(answers);
                    }
                });
        },

        // parse the content of the select query response
        processSelectResult(res) {
            // store column headers 
            res.head.vars.forEach((item) => {
                this.columns.push(
                    item
                );
                this.filters[item + 'f'] = { value: null, matchMode: FilterMatchMode.CONTAINS };
            })
            // loop processing response and transforming it to row data  
            res.results.bindings.forEach((element) => {
                let answers = {};
                let rawRow = {};
                // process one row data
                this.columns.forEach((item) => {
                    if (element[item]) {
                        rawRow[item] = element[item];

                        // for column data store : value(with prefix), tooltip(with full URI), type(literal/uri/...)
                        let word = { 'val': element[item].value, 'tol': element[item].value, 'type': element[item].type };

                        // replace namespace with prefix if present
                        this.result.data[1].forEach((el) => {
                            word.val = word.val.replace(el.namespace, el.prefix + ':');
                        })

                        // transform value if literal is the actual item, add datatype to value
                        if (element[item].type !== 'uri' && element[item].datatype) {
                            word.tol = '"' + word.val + '"^^xsd:' + element[item].datatype.substring(element[item].datatype.indexOf("#") + 1);
                        }

                        // store column data
                        answers[item] = word;
                        answers[item + 'f'] = word.val;
                        rawRow[item + 'f'] = word.val;

                    }
                })
                // store row data
                this.rawValues.push(rawRow);
                this.computedResult.push(answers);
            })
        }

    }

}
</script>

<style>
</style>
