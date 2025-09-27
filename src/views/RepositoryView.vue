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

<script lang="ts">
import Menubar from 'primevue/menubar';
import Button from 'primevue/button';
import type { MenuItem } from 'primevue/menuitem';
import type ApiClient from '@/common/apiclient';

import { computed } from 'vue';
import type { RepositoryInfo } from '@/common/types';

import { defineComponent, inject } from 'vue';

export default defineComponent({
    name: 'RepositoryView',
    components: {
        Menubar,
        Button,
    },
	setup() {
		return {
			apiClient: inject('apiClient') as ApiClient
		}
	},
    data(): {
        repoInfo: RepositoryInfo | null,
        menuItems: MenuItem[]
    } {
        return {
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
		if (!this.apiClient) {
            throw new Error('API client not found. It should be provided in the root Vue instance.');
        }
		let repoId = this.$route.params.repoId?.toString();
		if (repoId) {
			this.apiClient.setRepository(repoId);
			let repos = await this.apiClient.listRepositories();
			let repoInfo = repos.find(repo => repo.id === repoId);
			if (repoInfo) {
				this.repoInfo = repoInfo;
			} else {
				this.$router.push({name: 'home'}); // no such repository found, redirect to home page
			}
		}
	},
	methods: {
		quit() {
			this.$router.push({name: 'home'});
		}
	}
});
</script>

<style>
</style>
