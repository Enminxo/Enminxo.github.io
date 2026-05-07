// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
	site: 'https://enminxo.github.io',
	i18n: {
		defaultLocale: 'en',
		locales: ['en', 'es'],
		routing: { prefixDefaultLocale: false },
	},
});
