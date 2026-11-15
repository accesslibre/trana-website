import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSearchIndex, normalizeSearch, searchPosts } from '../../src/lib/search';
import type { WordPressPage, WordPressPost } from '../../src/lib/wordpress/index';
const posts: WordPressPost[] = [
  { id: 1, slug: 'em-line', title: 'EM-LINE: Esclerosi múltiple', excerpt: 'Informació i suport', html: '<h2>Participació</h2><p>Famílies &amp; recerca.</p>', date: '2026-06-01', modified: '', path: '/2026/06/em-line/', url: 'https://www.tranandorra.org/2026/06/em-line/' },
  { id: 2, slug: 'activitat', title: 'Trobada de famílies', excerpt: 'Activitat a Andorra', html: '<p>Una trobada</p>', date: '2026-05-01', modified: '', path: '/2026/05/activitat/', url: 'https://www.tranandorra.org/2026/05/activitat/' },
];
test('search index exposes only plain content and local links', () => {
  const index = buildSearchIndex(posts);
  assert.deepEqual(Object.keys(index[0]).sort(), ['title', 'excerpt', 'path', 'date', 'text', 'type'].sort());
  assert.equal(index[0].text, 'Participació Famílies & recerca.');
  assert.ok(!JSON.stringify(index).includes('<h2>'));
  assert.equal(index[0].path, posts[0].path);
  assert.equal(index[0].type, 'post');
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

const page = (overrides: Partial<WordPressPage> = {}): WordPressPage => ({
  ...posts[0], id: 8, slug: 'que-es-lem', title: 'Què és l’EM?', path: '/que-es-lem/',
  url: 'https://www.tranandorra.org/que-es-lem/', html: '<p>Informació sobre esclerosi i memòria [explicació].</p>', ...overrides,
});

test('published informative pages are searchable even when Yoast excludes them from web indexing', () => {
  const source = page({ seo: { robots: { index: 'noindex', follow: 'follow' }, title: 'Original SEO' } });
  const index = buildSearchIndex(posts, [source]);
  assert.equal(index.length, 3);
  assert.deepEqual(searchPosts(index, 'memoria').map((entry) => [entry.path, entry.type]), [['/que-es-lem/', 'page']]);
  assert.ok(index[2].text.includes('[explicació]'));
  assert.equal('seo' in index[2], false);
  assert.equal(JSON.stringify(index).includes('Original SEO'), false);
  assert.equal(buildSearchIndex([], [page({ path: '/', slug: 'inici' })])[0].path, '/');
});

test('search excludes frontend helpers, technical pages, empty galleries and shortcode-only forms', () => {
  const excluded = [
    page({ slug: 'trana-home', path: '/trana-home/' }), page({ slug: 'slide-portada', path: '/slide-portada/' }),
    page({ path: '/disseny/esclerosi-multiple/' }), page({ path: '/%64isseny/guia/' }),
    page({ path: '/cerca/' }), page({ path: '/404/' }), page({ path: '/noticies/2/' }),
    page({ html: '<div><img src="https://example.org/picture.jpg" alt="" /></div>' }),
    page({ html: '[et_pb_section fb_built="1"][/et_pb_section]' }),
    page({ html: '[wpforms_selector form_id="1098" /]' }),
    page({ html: '<form><label>Nom</label><input name="name" /></form>' }),
  ];
  assert.deepEqual(buildSearchIndex([], excluded), []);
});

test('search strips executable scaffolding and preserves only safe local destinations', () => {
  const index = buildSearchIndex([], [page({ html: '<script>secretToken()</script><style>hidden</style><p>Text &amp; dades</p>' })]);
  assert.equal(index[0].text, 'Text & dades');
  for (const path of ['https://example.org/', '//example.org/', '/a/../b/', '/%2e%2e/b/', '/a/%zz/', '/a/?x=y', '/a/#part', '/a/\\b', '/%2fexample.org/']) {
    assert.deepEqual(buildSearchIndex([], [page({ path })]), [], path);
  }
});

test('duplicate decoded paths fail instead of silently hiding published content', () => {
  assert.throws(() => buildSearchIndex(posts, [page({ path: posts[0].path })]), /Duplicate search path/);
  assert.throws(() => buildSearchIndex([], [page({ path: '/not%C3%ADcia/' }), page({ path: '/notícia/' })]), /Duplicate search path/);
});
