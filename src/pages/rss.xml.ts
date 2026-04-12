import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedPosts } from '../lib/blog';

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();

  return rss({
    title: 'Yuzhou Wang — Blog',
    description: 'Writing about NLP, computational linguistics, and building things.',
    site: context.site!.toString(),
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `${import.meta.env.BASE_URL}/blog/${post.slug}`,
    })),
  });
}
