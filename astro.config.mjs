// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
	site: 'https://enminxo.github.io',
	integrations: [sitemap()],
	// Project pages used to also live under /work/ (an Astro template leftover); keep old links working.
	redirects: { '/work/[...slug]': '/projects/[...slug]' },
	i18n: {
		defaultLocale: 'en',
		locales: ['en', 'es'],
		routing: { prefixDefaultLocale: false },
	},
});
