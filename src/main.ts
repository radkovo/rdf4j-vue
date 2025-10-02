import { createApp } from 'vue';
import { definePreset } from '@primeuix/themes';

import App from './App.vue';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import Tooltip from 'primevue/tooltip';
import ToastService from "primevue/toastservice";
import router from './router';

import Aura from '@primeuix/themes/aura';

import 'primeicons/primeicons.css';
import '@burgetr/rdf4j-vue-components/style.css';

const app = createApp(App);
const MyPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{sky.50}',
            100: '{sky.100}',
            200: '{sky.200}',
            300: '{sky.300}',
            400: '{sky.400}',
            500: '{sky.500}',
            600: '{sky.600}',
            700: '{sky.700}',
            800: '{sky.800}',
            900: '{sky.900}',
            950: '{sky.950}'
        }
    }
});

app.use(PrimeVue, {
    theme: {
        preset: MyPreset,
        unstyled: false,
        options: {
            darkModeSelector: '.rdf4j-vue-dark', /* not used yet, prepared for theme switch */
            cssLayer: {
                name: 'primevue',
                order: 'theme, base, primevue'
            }
        },
    }
});
app.use(ConfirmationService);
app.use(ToastService);
app.use(router);
app.directive('tooltip', Tooltip);

app.mount('#app');
