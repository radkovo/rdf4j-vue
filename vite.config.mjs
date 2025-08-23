import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const common = {
    plugins: [
      vue(),
      tailwindcss(),
      nodePolyfills({
        exclude: ['fs'], // don’t polyfill fs
        protocolImports: true
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      port: 3000
    },
    base: '/rdf4j-vue/'
  }

  if (command === 'serve') {
    // --- Standalone app / dev mode ---
    return common
  } else {
    // --- Library build mode ---
    return {
      ...common,
      build: {
        lib: {
          entry: path.resolve(__dirname, 'src/index.js'),
          name: 'Rdf4jVue',
          fileName: (format) => `rdf4j-vue.${format}.js`
        },
        rollupOptions: {
          // Don’t bundle Vue/PrimeVue, let the consuming app provide them
          external: ['vue', 'primevue', '@primevue/themes'],
          output: {
            exports: 'named',
            globals: {
              vue: 'Vue',
              primevue: 'PrimeVue',
              '@primevue/themes': 'PrimeVueThemes'
            }
          }
        }
      }
    }
  }
})
