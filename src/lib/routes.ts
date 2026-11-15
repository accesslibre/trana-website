import type { WordPressPost } from './wordpress/index';

export const NEWS_PAGE_SIZE = 12;
export function newsPath(page: number): string {
  if (!Number.isInteger(page) || page < 1) throw new Error('Invalid news page');
  return page === 1 ? '/noticies/' : `/noticies/${page}/`;
}
export function paginatePosts(posts: WordPressPost[], size = NEWS_PAGE_SIZE) {
  if (!Number.isInteger(size) || size < 1) throw new Error('Invalid page size');
  const total = Math.max(1, Math.ceil(posts.length / size));
  return Array.from({ length: total }, (_, i) => ({
    page: i + 1, total, posts: posts.slice(i * size, (i + 1) * size),
    previous: i ? newsPath(i) : undefined,
    next: i + 1 < total ? newsPath(i + 2) : undefined,
  }));
}
export function postRouteEntries(posts: WordPressPost[]) {
  const seen = new Set<string>();
  return posts.map((post) => {
    let path: string;
    try { path = decodeURIComponent(post.path); }
    catch { throw new Error(`Malformed article path: ${post.path}`); }
    const segments = path.slice(1, -1).split('/');
    if (!path.startsWith('/') || !path.endsWith('/') || /[?#\\\u0000-\u001f\u007f]/u.test(path)
      || segments.some((part) => !part || part === '.' || part === '..')
      || /^(noticies|cerca|acerca-de|404)(\/|$)/u.test(segments.join('/'))) {
      throw new Error(`Invalid or reserved article path: ${post.path}`);
    }
    if (seen.has(path)) throw new Error(`Duplicate article path: ${post.path}`);
    seen.add(path);
    return { params: { slug: segments.join('/') }, props: { post } };
  });
}
export function formatDate(value: string) {
  const date = new Date(value.slice(0, 10) + 'T12:00:00Z');
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('ca-AD', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(date);
}
