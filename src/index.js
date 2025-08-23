// Components
import PrefixConfig from './components/PrefixConfig.vue'
import QueryList from './components/QueryList.vue'
import QueryResults from './components/QueryResults.vue'
import RdfEditor from './components/RdfEditor.vue'
import RdfIri from './components/RdfIri.vue'
import RdfValue from './components/RdfValue.vue'
import RepositoryList from './components/RepositoryList.vue'

// Views
import ExploreView from './views/ExploreView.vue'
import QueryView from './views/QueryView.vue'

// Common JS classes/utilities
import ApiClient from './common/apiclient.js'

// Export everything individually
export {
    ApiClient,
    ExploreView,
    QueryView,
    PrefixConfig,
    QueryList,
    QueryResults,
    RdfEditor,
    RdfIri,
    RdfValue,
    RepositoryList,
}

// Vue plugin export (for auto component registration only)
export default {
    install(app) {
        app.component('ExploreView', ExploreView);
        app.component('QueryView', QueryView);
        app.component('PrefixConfig', PrefixConfig);
        app.component('QueryList', QueryList);
        app.component('QueryResults', QueryResults);
        app.component('RdfEditor', RdfEditor);
        app.component('RdfIri', RdfIri);
        app.component('RdfValue', RdfValue);
        app.component('RepositoryList', RepositoryList);
    }
}
