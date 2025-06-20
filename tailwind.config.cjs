/** @type {import('tailwindcss').Config} */
const primeui = require('tailwindcss-primeui');

module.exports = {
    content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
    plugins: [primeui],
	corePlugins: {
	    preflight: false
	},
    theme: {
        extend: {
            colors: {
                "primary-50": "rgb(var(--primary-50))",
                "primary-100": "rgb(var(--primary-100))",
                "primary-200": "rgb(var(--primary-200))",
                "primary-300": "rgb(var(--primary-300))",
                "primary-400": "rgb(var(--primary-400))",
                "primary-500": "rgb(var(--primary-500))",
                "primary-600": "rgb(var(--primary-600))",
                "primary-700": "rgb(var(--primary-700))",
                "primary-800": "rgb(var(--primary-800))",
                "primary-900": "rgb(var(--primary-900))",
                "primary-950": "rgb(var(--primary-950))",
                "bg-surface-0 dark:bg-surface-900": "rgb(var(--surface-0))",
                "bg-surface-50 dark:bg-surface-800": "rgb(var(--surface-50))",
                "bg-surface-100 dark:bg-surface-700": "rgb(var(--surface-100))",
                "bg-surface-200 dark:bg-surface-600": "rgb(var(--surface-200))",
                "bg-surface-300 dark:bg-surface-500": "rgb(var(--surface-300))",
                "bg-surface-400 dark:bg-surface-400": "rgb(var(--surface-400))",
                "bg-surface-500 dark:bg-surface-300": "rgb(var(--surface-500))",
                "bg-surface-600 dark:bg-surface-200": "rgb(var(--surface-600))",
                "bg-surface-700 dark:bg-surface-100": "rgb(var(--surface-700))",
                "bg-surface-800 dark:bg-surface-50": "rgb(var(--surface-800))",
                "bg-surface-900 dark:bg-surface-0": "rgb(var(--surface-900))",
                "surface-950": "rgb(var(--surface-950))",
            },
        },
    },
};
