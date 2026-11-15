import type { APIRoute } from 'astro';
import { getAllPages, getAllPosts } from '../../lib/wordpress/index';
import { buildSearchIndex } from '../../lib/search';
export const GET: APIRoute = async () => {
  const [posts, pages] = await Promise.all([getAllPosts(), getAllPages()]);
  return new Response(JSON.stringify(buildSearchIndex(posts, pages)), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
