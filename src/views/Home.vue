<template>
	<div class="view-home">
		<!-- Main menu -->
		<div class="menu-row">
			<Menubar id="mainmenu" :model="menuItems" style="font-size:120%">
				<template #start><router-link to="/"><span class="logo">RDF4J</span></router-link></template>
				<template #end>
				</template>
			</Menubar>
		</div>

		<div class="content">
			<section>
				<h2>Server</h2>
				<p><strong>Server URL:</strong> {{ apiClient.serverUrl }}</p>
				<p><strong>User:</strong> {{ apiClient.serverLogin ? apiClient.serverLogin : '(none)' }}</p>
				<Button icon="pi pi-refresh" label="Change..." @click="changeServer" />
			</section>
			<section v-if="!error">
				<h2>Available repositories</h2> 
				<ul class="repository-list" v-if="!error">
					<li v-for="repo in repositoryList" :key="repo.id">
						<router-link :to="{ name: 'query', params: { repoId: repo.id }}">
							{{ repo.id }}
						</router-link>
					</li>
				</ul>
			</section>

			<div class="error" v-if="error">
				<h3>Error</h3>
				<p>An error occurred while trying to load the repository list.</p>
				<p>Error: {{ error }}</p>
			</div>
		</div>
	</div>
</template>

<script>
import Button from 'primevue/button';
import Menubar from 'primevue/menubar';


export default {
	name: 'home',
	components: {
		Menubar,
		Button
	},
	//inject: ['apiClient'],
	data() {
		return {
			error: null,
			apiClient: null,
			repositoryList: null,

			menuItems: []
		}
	},
	created () {
		this.apiClient = this.$root.apiClient;
		this.loadRepositoryInfo();
		this.$root.onReload = this.loadRepositoryInfo; // update repository list when the server is reconnected
	},
	methods: {
		async loadRepositoryInfo() {
			this.error = null;
			try {
				this.repositoryList = await this.apiClient.listRepositories();
                console.log('repositoryList:', this.repositoryList);
			} catch (e) {
				this.error = e.message;
			}
			if (this.repositoryList === null) {
				this.repositoryList = []; //use an empty list when some fetch failed
			}
		},

		changeServer() {
            this.error = null;
            this.repositoryList = null;
			this.$root.authFailed(); // force changing the credentials
        }
	}
}
</script>

<style>
.logo {
	padding: 0.5em 1em;
	color: var(--p-text-color);
	background: var(--p-surface-300);
	display: inline-block;
	border-radius: 5px;
	font-weight: bold;
}
#mainmenu .selected .p-menubar-item-link {
	background-color: var(--p-primary-color);
}
#mainmenu .selected .p-menubar-item-link .p-menubar-item-label {
	color: var(--p-primary-contrast-color);
}
.view-home .content {
	padding: 2em;
}
.view-home .content section {
	padding: 0.3em 1em;
	background-color: var(--p-surface-200);
	margin-bottom: 1em;
}
.view-home .error {
	background-color: var(--p-form-field-invalid-border-color);
	padding: 0.3em 1em;
}
</style>
