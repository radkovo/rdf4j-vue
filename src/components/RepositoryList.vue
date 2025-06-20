<template>
	<Card style="width: 50em; margin: 1em;">
		<!-- <template #header>
			<img alt="user header" src="demo/images/usercard.png">
		</template> -->
		<template #title>
			Your Recent Repositories
		</template>
		<template #content>
			<table class="repo-list" v-if="repositoryList && repositoryList.length > 0">
				<tbody>
					<tr v-for="repo in repositoryList" :key="repo.id">
						<td class="repo-id">
							<span v-if="repo.description">{{repo.description}}</span>
							<em v-if="!repo.description">{{repo.id}}</em>
						</td>
						<td class="repo-actions">
							<LinkButton label="Open" icon="pi pi-folder-open" class="p-button-warn"
								:to="{name: 'repo', params: { repoId: repo.id }}" />
							<LinkButton label="Browser" icon="pi pi-globe" style="margin-left: 0.5em"
								:to="{name: 'browser', params: { repoId: repo.id }}" />
							<Button label="Share" icon="pi pi-share-alt" style="margin-left: 0.5em" class="p-button-success"
								@click="(ev) => toggleShare(ev, repo.id)" />
						</td>
					</tr>
				</tbody>
			</table>
			<Popover ref="opsh" appendTo="body" :showCloseIcon="true" id="overlay_sh" style="width: 450px" :breakpoints="{'960px': '75vw'}">
				<div class="p-fluid">
					<div class="field">
						<label for="fieldId">Shareable link</label>
						<InputText id="fieldId" type="text" :value="sharedUrl" readonly="true" />
					</div>
				</div>
			</Popover>
			<p v-if="!(repositoryList && repositoryList.length > 0)">
				You have not used any repositories recently. Please start with creating a new repository.
			</p>
		</template>
		<template #footer>

			<div v-if="createAvailable">
				<Button type="button" icon="pi pi-plus" :label="'New repository'" @click="toggleCreate" aria:haspopup="true" aria-controls="overlay_panel" />

				<Popover ref="op" appendTo="body" :showCloseIcon="true" id="overlay_panel" style="width: 450px" :breakpoints="{'960px': '75vw'}">
					<div class="formgrid grid grid-cols-12 gap-4">
						<div class="field col-span-12">
							<label for="repo-descr">Name</label>
							<InputText id="repo-descr" type="text" class="p-inputtext p-component w-full" placeholder="Enter the repository name" v-model="newDescr" ref="inputDescr" />
						</div>
						<div class="field col-span-12" v-if="anonymous">
							<label for="repo-email">E-mail</label>
							<InputText id="repo-email" type="text" class="p-inputtext p-component w-full" placeholder="Your e-mail" v-model="newEmail" />
							<small id="repo-email-help">Your e-mail is optional. If provided, we will be able to e-mail you the links to your repositories.</small>
						</div>
						<div class="field col-span-12">
							<Button type="button" icon="pi pi-check" label="Create" v-on:click="createRepository" />
							<Message v-if="error" severity="error" v-on:click="error = null">{{error}}</Message>
						</div>
					</div>
				</Popover>
			</div>

			<div class="repo-missing">
				<a href="#" @click="toggleMissing">Missing some repositories?</a>

				<Popover ref="opMissing" appendTo="body" :showCloseIcon="true" id="op_missing" style="width: 500px" :breakpoints="{'960px': '75vw'}">
					<p>If you think there are some repositories missing in the list, we may <a href="#" @click="toggleRemind">e-mail you the links
					to your repositories</a> associated with your e-mail. 
					<!-- If you have created your account previously,
					it may be also a good idea to <a href="/auth/#/login">sign in</a>.--></p>
				</Popover>
				<Popover ref="opRemind" appendTo="body" :showCloseIcon="true" id="op_remind" style="width: 450px" :breakpoints="{'960px': '75vw'}">
					<div class="formgroup-inline">
						<div class="field">
							<label for="remind-email">Your e-mail</label>
							<InputText id="remind-email" type="email" placeholder="Your e-mail" v-model="remindEmail" /><br/>
							<small id="repo-email-help">We will e-mail you the links to all repositories associated with the given e-mail (if any).</small>
						</div>
						<Button type="button" icon="pi pi-check" label="Send reminder" v-on:click="sendReminder" />
						<Message v-if="remindError" :severity="remindSeverity" v-on:click="remindError = null">{{remindError}}</Message>
					</div>
				</Popover>
			</div>

		</template>
	</Card>
</template>

<script>
import Card from 'primevue/card';
import Button from 'primevue/button';
import Popover from 'primevue/popover';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';

import LinkButton from '../components/LinkButton.vue';

export default {
	name: 'RepositoryList',
	components: {
		Card,
		Button,
		Popover,
		InputText,
		Message,
		LinkButton
	},
	props: {
		repositoryList: {
			type: Array
		},
		createAvailable: null,
		anonymous: null
	},
	data() {
		return {
			apiClient: null,

			menuItems: [],
			newDescr: '',
			newEmail: '',
			error: null,
			sharedUrl: '',

			remindEmail: '',
			remindError: null,
			remindSeverity: 'error'
		}
	},
	created () {
		this.apiClient = this.$root.apiClient;
		this.newDescr = "Default repository";
	},
	methods: {
		async createRepository() {
			try {
				const rdata = await this.apiClient.createRepository({description: this.newDescr, email: this.newEmail});
				this.$emit('created', rdata);
				this.error = null;
			} catch (e) {
				this.error = e.message;
			}
		},
		async sendReminder() {
			if (this.remindEmail) {
				try {
					await this.apiClient.sendReminder(this.remindEmail);
					this.remindSeverity = 'success';
					this.remindError = 'Done.';
				} catch (e) {
					this.remindSeverity = 'error';
					this.remindError = e.message;
				}
			}
		},
		toggleCreate(event) {
			this.$refs.op.toggle(event);
			//this.$refs.inputDescr.focus(); //TODO this should be done later
		},
		toggleMissing(event) {
			this.$refs.opMissing.toggle(event);
		},
		toggleRemind(event) {
			this.$refs.opMissing.toggle(event);
			this.$refs.opRemind.toggle(event);
		},
		toggleShare(event, repoId) {
			this.sharedUrl = this.getRepoUrl(repoId);
			this.$refs.opsh.toggle(event);
		},
		openRepo(id) {
			this.$router.push({name: 'repo', params: { repoId: id }});
		},
		browseRepo(id) {
			this.$router.push({name: 'browser', params: { repoId: id }});
		},
		getRepoUrl(id) {
			const res = this.$router.resolve({name: 'repo', params: { repoId: id }});
			const ret = window.location.origin + this.$router.options.history.base + res.fullPath;
			return ret;
		}
	}
}
</script>

<style>
.repo-list td {
	border: 1px solid var(--p-surface-300);
	padding: 1em 1em;
}
.repo-list .repo-id {
	text-align: left;
}
.repo-list .repo-id span {
	font-weight: bold;
}
.repo-list .repo-id em {
	font-weight: normal;
}
.repo-missing {
	margin: 1em 0 0 0;
}
</style>
