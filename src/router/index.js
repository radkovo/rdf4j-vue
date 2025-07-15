import { createWebHashHistory, createRouter } from "vue-router";
import Home from "../views/Home.vue";
import RepositoryView from "../views/RepositoryView.vue";
import ExploreView from "../views/ExploreView.vue";
import QueryView from "../views/QueryView.vue";
import ContextsView from "../views/ContextsView.vue";

const router = createRouter({
	history: createWebHashHistory(),
	routes: [
		{
			name: 'home',
			path: '/',
			component: Home
		},
		{
			path: '/r/:repoId',
			component: RepositoryView,
			children: [
				{
					name: 'explore',
					path: 'explore/:iri?/:mode?',
					component: ExploreView
				},
				{
					name: 'query',
					path: 'query',
					component: QueryView
				},
				{
                    name: 'contexts',
                    path: 'contexts',
                    component: ContextsView
                }
			]
		}
	]
});

export default router;
