import { createWebHashHistory, createRouter } from "vue-router";
import Home from "../views/Home.vue";
import RepositoryView from "../views/RepositoryView.vue";
import ExploreView from "../views/ExploreView.vue";
import QueryView from "../views/QueryView.vue";

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
					path: 'explore/:iri?',
					component: ExploreView
				},
				{
					name: 'query',
					path: 'query',
					component: QueryView
				},
			]
		}
	]
});

export default router;
