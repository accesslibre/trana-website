import type { APIRoute } from 'astro';
import { getAllPosts } from '../../lib/wordpress/index';
import { buildSearchIndex } from '../../lib/search';
export const GET: APIRoute = async () => new Response(JSON.stringify(buildSearchIndex(await getAllPosts())), {
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
});
