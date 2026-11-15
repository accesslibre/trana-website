import he from 'he';
import type { WordPressPage, WordPressPost } from './wordpress/index';

// Optional for compatibility with an index cached before pages were searchable.
export interface SearchEntry { title: string; excerpt: string; path: string; date: string; text: string; type?: 'post' | 'page' }
const auxiliaryPages = new Set(['trana-home', 'slide-portada']);
const frontendPaths = /^\/(?:disseny|cerca|404)(?:\/|$)|^\/noticies(?:\/|$)/u;

function plainText(html: string): string {
  return he.decode(html
    .replace(/<(script|style|form|iframe)\b[^>]*>[\s\S]*?<\/\1\s*>/giu, ' ')
    .replace(/<[^>]*>/gu, ' ')
    .replace(/\[\/?(?:et_pb_[a-z_]+|wpforms(?:_selector)?|contact-form-7|gallery|rev_slider|metaslider)\b[^\]]*\]/giu, ' '))
    .replace(/\s+/gu, ' ').trim();
}
function localPath(path: string): boolean {
  if (!path.startsWith('/') || path.startsWith('//') || /[\\?#\u0000-\u001f]/u.test(path)) return false;
  try {
    const decoded = decodeURIComponent(path);
    return !decoded.includes('//') && !/[\\?#\u0000-\u001f]/u.test(decoded)
      && !decoded.split('/').some((segment) => segment === '.' || segment === '..')
      && !frontendPaths.test(decoded);
  } catch { return false; }
}

/** Build-time public content only; browser consumers receive no HTML or Yoast data. */
export function buildSearchIndex(posts: WordPressPost[], pages: WordPressPage[] = []): SearchEntry[] {
  const index: SearchEntry[] = [];
  const paths = new Set<string>();
  for (const [type, entries] of [['post', posts], ['page', pages]] as const) {
    for (const entry of entries) {
      if (!localPath(entry.path) || (type === 'page' && auxiliaryPages.has(entry.slug))) continue;
      const text = plainText(entry.html);
      // Empty galleries, Divi scaffolding and shortcode-only forms are not informative pages.
      if (type === 'page' && !text) continue;
      const key = decodeURIComponent(entry.path);
      if (paths.has(key)) throw new Error(`Duplicate search path: ${entry.path}`);
      paths.add(key);
      index.push({ title: entry.title, excerpt: entry.excerpt, path: entry.path, date: entry.date, text, type });
    }
  }
  return index;
}
export function normalizeSearch(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('ca').replace(/\s+/gu, ' ').trim();
}
export function searchPosts(index: SearchEntry[], query: string): SearchEntry[] {
  const words = normalizeSearch(query).split(' ').filter(Boolean);
  if (!words.length) return [];
  return index.filter((entry) => {
    const text = normalizeSearch(`${entry.title} ${entry.excerpt} ${entry.text}`);
    return words.every((word) => text.includes(word));
  });
}
