import sanitizeHtml from 'sanitize-html';
import he from 'he';

export interface WordPressImage { src: string; alt: string; width?: number; height?: number }
export interface WordPressPost {
  id: number; slug: string; title: string; excerpt: string; html: string;
  date: string; modified: string; url: string; path: string; image?: WordPressImage;
  seo?: Record<string, unknown>;
}
export interface WordPressPage extends WordPressPost {}

/** Public read-only client. The factory keeps tests and independent builds isolated. */
export interface WordPressOptions {
  apiUrl?: string; origin?: string; fetch?: typeof globalThis.fetch; timeoutMs?: number;
}
type RecordData = Record<string, any>;
function fail(message: string): never { throw new Error(`WordPress: ${message}`); }
function text(value: unknown, field: string): string {
  if (typeof value !== 'string') fail(`invalid ${field}`);
  return value as string;
}
function positive(value: unknown): value is number { return Number.isSafeInteger(value) && Number(value) > 0; }
export function plainText(html: string): string {
  return he.decode(sanitizeHtml(html.replace(/<\/(?:p|div|li|h[1-6])\s*>|<br\s*\/?\s*>/gi, ' '), {
    allowedTags: [], allowedAttributes: {},
  })).replace(/\s+/gu, ' ').trim();
}
export function sanitizeContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img'],
    allowedAttributes: {
      a: ['href', 'title'], img: ['src', 'alt', 'width', 'height', 'loading', 'decoding'],
      th: ['scope', 'colspan', 'rowspan'], td: ['colspan', 'rowspan'],
      ol: ['start', 'reversed'], time: ['datetime'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['https', 'http'] },
    allowProtocolRelative: false,
    nonTextTags: ['script', 'style', 'textarea', 'option', 'iframe', 'svg', 'math'],
    transformTags: { h1: 'h2' },
  });
}

export function createWordPressClient(options: WordPressOptions = {}) {
  const api = new URL(options.apiUrl ?? process.env.WORDPRESS_API_URL ?? 'https://www.tranandorra.org/wp-json/wp/v2');
  if (!['https:', 'http:'].includes(api.protocol) || api.username || api.password || api.search || api.hash) fail('invalid API URL');
  api.pathname = api.pathname.replace(/\/+$/, '') + '/';
  const origin = new URL(options.origin ?? process.env.WORDPRESS_ORIGIN ?? api.origin);
  if (!['https:', 'http:'].includes(origin.protocol) || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/') fail('invalid original origin');
  const fetcher = options.fetch ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? Number(process.env.WORDPRESS_TIMEOUT_MS ?? 60_000);
  if (!positive(timeoutMs)) fail('invalid timeout');
  let postsPromise: Promise<WordPressPost[]> | undefined;
  let pagesPromise: Promise<WordPressPage[]> | undefined;
  const pages = new Map<string, Promise<WordPressPage>>();

  async function request(endpoint: 'posts' | 'pages', params: Record<string, string>) {
    const url = new URL(endpoint, api);
    url.search = new URLSearchParams({ context: 'view', status: 'publish', _embed: 'wp:featuredmedia', ...params }).toString();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetcher(url, { method: 'GET', headers: { Accept: 'application/json' }, signal: controller.signal, redirect: 'error' });
      if (!response.ok) fail(`${endpoint} HTTP ${response.status}`);
      const data: unknown = await response.json();
      if (!Array.isArray(data)) fail(`${endpoint} response is not an array`);
      return { response, data };
    } catch (error) {
      throw new Error(`WordPress: failed to read published ${endpoint} (${controller.signal.aborted ? 'timeout' : 'request or data error'})`, { cause: error });
    } finally { clearTimeout(timer); }
  }
  function headerCount(response: Response, name: string): number {
    const raw = response.headers.get(name);
    if (raw === null || !/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw))) fail(`missing or invalid ${name}`);
    return Number(raw);
  }
  function normalize(raw: RecordData, endpoint: 'posts' | 'pages'): WordPressPost {
    if (!raw || !positive(raw.id) || raw.status !== 'publish' || raw.content?.protected || raw.excerpt?.protected) fail('unexpected non-public or invalid item');
    const source = new URL(text(raw.link, 'link'));
    const decoded = decodeURIComponent(source.pathname);
    if (source.origin !== origin.origin || source.username || source.password || source.search || source.hash || decoded.includes('\\') || decoded.includes('//') || decoded.split('/').some(s => s === '.' || s === '..') || /[?#\u0000-\u001f]/u.test(decoded) || (endpoint === 'posts' && source.pathname === '/')) fail(`invalid original path for item ${raw.id}`);
    const slug = text(raw.slug, 'slug');
    if (!slug || /[/\\?#\u0000-\u001f]/u.test(slug)) fail('invalid slug');
    const date = text(raw.date, 'date'), modified = text(raw.modified, 'modified');
    for (const value of [date, modified]) if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) fail('invalid date');
    const post: WordPressPost = {
      id: raw.id, slug, title: plainText(text(raw.title?.rendered, 'title')),
      excerpt: plainText(text(raw.excerpt?.rendered, 'excerpt')),
      html: sanitizeContent(text(raw.content?.rendered, 'content')), date, modified,
      url: source.href, path: source.pathname.replace(/\/?$/, '/'),
    };
    if (raw.yoast_head_json && typeof raw.yoast_head_json === 'object' && !Array.isArray(raw.yoast_head_json)) {
      post.seo = raw.yoast_head_json;
    }
    const media = raw._embedded?.['wp:featuredmedia']?.find((m: RecordData) => m?.id === raw.featured_media);
    if (media?.source_url) {
      const imageUrl = new URL(text(media.source_url, 'image URL'));
      if (!['http:', 'https:'].includes(imageUrl.protocol) || imageUrl.username || imageUrl.password) fail('invalid featured image URL');
      post.image = { src: imageUrl.href, alt: plainText(typeof media.alt_text === 'string' ? media.alt_text : '') };
      for (const dimension of ['width', 'height'] as const) if (positive(media.media_details?.[dimension])) post.image[dimension] = media.media_details[dimension];
    }
    return post;
  }
  async function loadCollection(endpoint: 'posts' | 'pages'): Promise<WordPressPost[]> {
    const first = await request(endpoint, { per_page: '100', page: '1', orderby: 'id', order: 'asc' });
    const total = headerCount(first.response, 'X-WP-Total');
    const pageCount = headerCount(first.response, 'X-WP-TotalPages');
    if (pageCount !== Math.ceil(total / 100)) fail('inconsistent pagination totals');
    const result: WordPressPost[] = first.data.map(raw => normalize(raw, endpoint));
    for (let page = 2; page <= pageCount; page++) {
      const next = await request(endpoint, { per_page: '100', page: String(page), orderby: 'id', order: 'asc' });
      if (headerCount(next.response, 'X-WP-Total') !== total || headerCount(next.response, 'X-WP-TotalPages') !== pageCount) fail('published collection changed during pagination; rebuild');
      result.push(...next.data.map(raw => normalize(raw, endpoint)));
    }
    if (result.length !== total || new Set(result.map(p => p.id)).size !== total || new Set(result.map(p => p.path)).size !== total) fail(`incomplete or duplicate published ${endpoint}`);
    return result.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  }
  return {
    getAllPosts(): Promise<WordPressPost[]> { return postsPromise ??= loadCollection('posts'); },
    getAllPages(): Promise<WordPressPage[]> { return pagesPromise ??= loadCollection('pages'); },
    getPageBySlug(slug: string): Promise<WordPressPage> {
      if (!slug || /[/\\?#\u0000-\u0020]/u.test(slug)) return Promise.reject(new Error('WordPress: invalid page slug'));
      if (!pages.has(slug)) pages.set(slug, (async () => {
        const { data } = await request('pages', { slug, per_page: '100' });
        if (data.length !== 1 || data[0].slug !== slug) fail(`expected one published page for slug ${slug}`);
        return normalize(data[0], 'pages');
      })());
      return pages.get(slug)!;
    },
  };
}
let client: ReturnType<typeof createWordPressClient> | undefined;
function defaultClient() { return client ??= createWordPressClient(); }
export function getAllPosts(): Promise<WordPressPost[]> { return defaultClient().getAllPosts(); }
export function getAllPages(): Promise<WordPressPage[]> { return defaultClient().getAllPages(); }
export function getPageBySlug(slug: string): Promise<WordPressPage> { return defaultClient().getPageBySlug(slug); }
