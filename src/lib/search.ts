import he from 'he';
import type { WordPressPost } from './wordpress/index';

export interface SearchEntry { title: string; excerpt: string; path: string; date: string; text: string }
export function buildSearchIndex(posts: WordPressPost[]): SearchEntry[] {
  return posts.map(({ title, excerpt, path, date, html }) => ({
    title, excerpt, path, date,
    text: he.decode(html.replace(/<[^>]*>/gu, ' ')).replace(/\s+/gu, ' ').trim(),
  }));
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
