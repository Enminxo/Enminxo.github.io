// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
	site: 'https://enminxo.github.io',
	integrations: [sitemap()],
	i18n: {
		defaultLocale: 'en',
		locales: ['en', 'es'],
		routing: { prefixDefaultLocale: false },
	},
});
