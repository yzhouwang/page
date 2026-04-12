import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { remarkReadingTime } from './src/lib/remark-reading-time';

export default defineConfig({
  output: 'static',
  site: 'https://yzhouwang.github.io',
  base: '/page',
  integrations: [mdx()],
  markdown: {
    remarkPlugins: [remarkReadingTime],
    shikiConfig: {
      theme: 'github-light',
    },
  },
});
