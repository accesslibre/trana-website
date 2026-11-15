import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSearchIndex, normalizeSearch, searchPosts } from '../../src/lib/search';
import type { WordPressPost } from '../../src/lib/wordpress/index';
const posts: WordPressPost[] = [
  { id: 1, slug: 'em-line', title: 'EM-LINE: Esclerosi múltiple', excerpt: 'Informació i suport', html: '<h2>Participació</h2><p>Famílies &amp; recerca.</p>', date: '2026-06-01', modified: '', path: '/2026/06/em-line/', url: 'https://www.tranandorra.org/2026/06/em-line/' },
  { id: 2, slug: 'activitat', title: 'Trobada de famílies', excerpt: 'Activitat a Andorra', html: '<p>Una trobada</p>', date: '2026-05-01', modified: '', path: '/2026/05/activitat/', url: 'https://www.tranandorra.org/2026/05/activitat/' },
];
test('search index exposes only plain content and local links', () => {
  const index = buildSearchIndex(posts);
  assert.deepEqual(Object.keys(index[0]).sort(), ['title', 'excerpt', 'path', 'date', 'text'].sort());
  assert.equal(index[0].text, 'Participació Famílies & recerca.');
  assert.ok(!JSON.stringify(index).includes('<h2>'));
  assert.equal(index[0].path, posts[0].path);
});
test('search ignores case, accents and extra whitespace across title and body', () => {
  const index = buildSearchIndex(posts);
  assert.equal(normalizeSearch('  ESCLEROSI   MÚLTIPLE '), 'esclerosi multiple');
  assert.deepEqual(searchPosts(index, 'esclerosi MULTIPLE').map((entry) => entry.path), [posts[0].path]);
  assert.deepEqual(searchPosts(index, 'participacio recerca').map((entry) => entry.path), [posts[0].path]);
  assert.equal(searchPosts(index, 'families').length, 2);
  assert.equal(searchPosts(index, '  ').length, 0);
  assert.equal(searchPosts(index, 'unexistent').length, 0);
  assert.equal(searchPosts(index, '<img onerror=alert(1)>').length, 0);
});
