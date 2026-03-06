// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

const site = process.env.SITE_URL || 'https://example.com';

// https://astro.build/config
export default defineConfig({
	output: 'static',
	site,
	integrations: [mdx(), sitemap()],
});
