<template>
    <div id="app" class="">
		<router-view></router-view>
		<Dialog :visible="!authorized" :closable="false" modal header="Server connection" :style="{ width: '50rem' }" ref="loginDialog">
			<form @submit="submitForm">
				<div class="flex flex-col gap-6 w-full">
					<div class="field">
						<label for="serverUrl" class="block font-semibold mb-2">Server URL</label>
						<InputText class="w-full" id="serverUrl" type="text" v-model="serverUrl" :disabled="loading" />
					</div>
					<div class="flex flex-col sm:flex-row sm:items-center gap-6">
						<div class="field flex-1">
							<label for="userId" class="block font-semibold mb-2">Username</label>
							<InputText class="w-full" id="userId" type="text" v-model="userid" :disabled="loading" />
						</div>
						<div class="field flex-1">
							<label for="password" class="block font-semibold mb-2">Password</label>
							<InputText class="w-full" id="password" type="password" v-model="password" :disabled="loading" />
						</div>
					</div>
					<div class="flex flex-col sm:flex-row sm:items-center gap-6">
						<Checkbox v-model="savePassword" inputId="savePassword" binary />
						<label for="savePassword"> Save password </label>
					</div>
					<Button icon="pi pi-check" label="Connect" type="submit" :disabled="loading" />
				</div>
			</form>
			<Message v-if="error" severity="error" :closable="false">{{error}}</Message>
		</Dialog>
    </div>
</template>

<script>
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Checkbox from 'primevue/checkbox';
import Message from 'primevue/message';
import Dialog from 'primevue/dialog';

import { ApiClient } from './common/apiclient';

export default {
    name: 'app',
	data() {
		return {
			apiClient: null,
			authorized: false,
			serverUrl: null,
			userid: null,
			password: null,
			savePassword: false,

			error: null,
            loading: false
		}
	},
	components: {
		Button,
		InputText,
		Checkbox,
		Message,
		Dialog
	},
	created () {
		this.apiClient = new ApiClient();
		this.apiClient.onNotAuthorized = this.authFailed;
		//assume authorized because username and password are optional for some servers
		this.authorized = true;
		// load server URL from localStorage if available
		this.serverUrl = localStorage.getItem('rdf4j-serverUrl');
		if (this.serverUrl) {
			this.apiClient.setServerUrl(this.serverUrl);
		} else {
			this.serverUrl = this.apiClient.serverUrl; // take the api client default server URL
		}
		// load user ID and password from localStorage if available
		this.userid = localStorage.getItem('rdf4j-userId');
        this.password = localStorage.getItem('rdf4j-password');
		this.savePassword = !!this.password; // assume save password is checked if password is available
		if (this.userid && this.password) { // assume user is already logged in when the credentials are available
			this.apiClient.login(this.userid, this.password);
		}
		this.onReload = null;
	},
	methods: {
		authFailed() {
			console.error('Authentication failed');
			this.authorized = false;
		},

        async submitForm(ev) {
            ev.preventDefault();
            try {
				localStorage.setItem('rdf4j-serverUrl', this.serverUrl);
				localStorage.setItem('rdf4j-userId', this.userid);
				localStorage.setItem('rdf4j-password', this.savePassword ? this.password : '');

                this.authorized = false;
                this.loading = true;
				this.apiClient.setServerUrl(this.serverUrl);
                const status = await this.apiClient.login(this.userid, this.password);
				this.authorized = true;
				//this.userid = '';
				//this.password = '';
                this.loading = false;
				this.error = null;
				if (this.onReload) {
                    this.onReload();
                }
            } catch (e) {
                this.loading = false;
                this.error = 'Error: ' + e.message;
            }
        },

	}
}
</script>

<style>
@import '@/assets/base.css';

html {
	font-size: 10pt;
}
body {
	margin: 0;
	padding: 0;
}
.h-100 {
	height: 100%;
}
.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.font-monospace {
	font-family: SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;
}
.backlink {
	margin-bottom: 1.5em;
	font-weight: bold;
}
.backlink i {
	margin-right: 0.5em;
}
.backlink a {
	text-decoration: none;
}

.p-inputtext.ok.p-component {
    border-color: var(--p-green-500);
}

.badge {
	font-size: 75%;
	padding: 0.25em 0.4em;
	border-radius: 3px;
}
.boxtree .badge {
	color: white;
	background-color: var(--p-green-500);
}
.box .badge {
	color: white;
	background-color: var(--p-cyan-500);
}
.areatree .badge {
	color: black;
	background-color: var(--p-yellow-500);
}
.area .badge {
	color: black;
	background-color: var(--p-yellow-700);
}
.chunkset .badge {
	color: black;
	background-color: var(--p-indigo-200);
}
.textchunk .badge {
	color: white;
	background-color: var(--p-indigo-700);
}

/* Very important!!
  Solves flickering and freezing of tooltips in Google Chrome,
  which caused freezing of the whole browser.
*/
.p-tooltip {
	pointer-events: none;
}

#app {
	color: var(--p-text-color);
	background-color: var(--p-surface-50);
}
</style>
