<template>
    <div class="repository-view">
		<!-- Repository menu -->
		<div class="menu-row">
			<Menubar id="mainmenu" :model="menuItems" style="font-size:120%">
				<template #start><router-link to="/"><span class="logo">RDF4J</span></router-link></template>
				<template #end>
					<span class="repo-info">Repository: <b>{{repoId}}</b></span>
					<Button icon="pi pi-sign-out" 
							class="p-button-rounded p-button-text" 
							v-tooltip.bottom="'Close repository'" 
							@click="quit()" />&nbsp;
				</template>
				<template #item="{ item, props, hasSubmenu }">
					<router-link v-if="item.to" v-slot="{ href, navigate }" :to="item.to" custom>
						<a :href="href" v-bind="props.action" @click="navigate">
							<span :class="item.icon" />
							<span class="ml-2">{{ item.label }}</span>
						</a>
					</router-link>
					<a v-else :href="item.url" :target="item.target" v-bind="props.action">
						<span :class="item.icon" />
						<span class="ml-2">{{ item.label }}</span>
						<span v-if="hasSubmenu" class="pi pi-fw pi-angle-down ml-2" />
					</a>
				</template>
			</Menubar>
		</div>
		<router-view></router-view>
	</div>
</template>

<script>
import Menubar from 'primevue/menubar';
import Button from 'primevue/button';

import { computed } from 'vue';

export default {
	name: 'RepositoryView',
	components: {
		Menubar,
		Button,
	},
	data() {
		return {
			apiClient: this.$root.apiClient,
			repoInfo: null,

			menuItems: [
				//{label: 'Overview', to: {name: 'repo'}},
				{label: 'Query', to: {name: 'query'}},
				{label: 'Explore', to: {name: 'explore'}},
				{label: 'Contexts', to: {name: 'contexts'}},
				{label: 'Namespaces', to: {name: 'namespaces'}},
			]
		}
	},
	provide() {
		return {
			apiClient: this.apiClient,
			repoInfo: computed(() => this.repoInfo),
			repoId: computed(() => this.repoId),
			repoTitle: computed(() =>this.repoTitle),
			repoLink: computed(() => this.repoLink)
		}
	},
	computed: {
		repoId() {
			if (this.repoInfo) {
				return this.repoInfo.id ? this.repoInfo.id : this.repoInfo.id;
			} else {
				return this.$route.params.repoId;
			}
		},
		repoTitle() {
			if (this.repoInfo) {
				return this.repoInfo.title ? this.repoInfo.title : '(no name)';
			} else {
				return '(no name)';
			}
		},
		repoLink() {
			return window.location.href;
		}
	},
	watch: {
	},
	async created () {
		this.apiClient = this.$root.apiClient;
		await this.apiClient.setRepository(this.$route.params.repoId);
		let repos = await this.apiClient.listRepositories();
		this.repoInfo = repos.find(repo => repo.id === this.$route.params.repoId);
	},
	methods: {

		quit() {
			this.$router.push({name: 'home'});
		}

	}
}
</script>

<style>
</style>
