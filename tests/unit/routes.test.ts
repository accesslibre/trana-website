import { test } from 'node:test';
import assert from 'node:assert/strict';
import { postRouteEntries, paginatePosts, newsPath } from '../../src/lib/routes';
import type { WordPressPost } from '../../src/lib/wordpress/index';
const post = (path: string): WordPressPost => ({ id: 1, slug: 'article', title: 'Article', excerpt: '', html: '', date: '2026-06-01T12:00:00', modified: '', url: `https://www.tranandorra.org${path}`, path });
test('preserves original WordPress dated paths including known EM-LINE article', () => {
  const path = '/2026/06/em-line-ajudeu-nos-a-la-seva-implantancio/';
  const [route] = postRouteEntries([post(path)]);
  assert.equal(route.params.slug, path.slice(1, -1));
  assert.equal(route.props.post.path, path);
  assert.equal(postRouteEntries([post('/2026/not%C3%ADcia/')])[0].params.slug, '2026/notícia');
});
test('rejects duplicate canonical paths and routes owned by pilot pages', () => {
  assert.throws(() => postRouteEntries([post('/a/'), post('/a/')]), /Duplicate/);
  assert.throws(() => postRouteEntries([post('/not%C3%ADcia/'), post('/notícia/')]), /Duplicate/);
  for (const path of ['/', '/noticies/', '/noticies/2/', '/cerca/search-index.json/', '/acerca-de/', '/404/', '/a/../b/', '/a/%2E%2E/b/', '/a//b/', '/a/?q=b/', '/a/#b/', '/a/\\b/', 'https://bad.example/a/', '/a/%00/', '/a/%zz/']) {
    assert.throws(() => postRouteEntries([post(path)]), /./u, path);
  }
});
test('pagination covers every post exactly once and produces working neighbors', () => {
  const posts = Array.from({ length: 25 }, (_, i) => post(`/2026/${i}/`));
  const pages = paginatePosts(posts);
  assert.deepEqual(pages.map((page) => page.posts.length), [12, 12, 1]);
  assert.deepEqual(pages.flatMap((page) => page.posts), posts);
  assert.equal(pages[0].previous, undefined);
  assert.equal(pages[0].next, '/noticies/2/');
  assert.equal(pages[1].previous, '/noticies/');
  assert.equal(pages[2].next, undefined);
  assert.equal(paginatePosts([]).length, 1);
  assert.equal(paginatePosts([])[0].total, 1);
  assert.equal(paginatePosts(posts.slice(0, 12)).length, 1);
  assert.throws(() => paginatePosts(posts, 0));
  assert.throws(() => newsPath(0));
  assert.throws(() => newsPath(1.5));
});
