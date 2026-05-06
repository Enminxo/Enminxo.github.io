// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
	site: 'https://enminzhong.github.io',
	i18n: {
		defaultLocale: 'en',
		locales: ['en', 'es'],
		routing: { prefixDefaultLocale: false },
	},
});
