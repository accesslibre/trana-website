import { test, expect } from '@playwright/test';
import { assertContentRoutes, contentRoutes, pageMigration } from '../../src/pages/_migration';
import type { WordPressPage, WordPressPost } from '../../src/lib/wordpress/index';

const record = (id: number, path: string, html = '<p>Contingut publicat.</p>'): WordPressPost => ({
  id, path, slug: path.slice(1, -1) || 'trana-esclerosis-multiple-andorra', title: `Títol ${id}`,
  html, excerpt: 'Contingut publicat.', date: '2026-11-01T12:00:00', modified: '2026-11-01T12:00:00',
  url: `https://www.tranandorra.org${path}`,
});
const explicitPages = (): WordPressPage[] => [record(543, '/'), record(8, '/acerca-de/')];

test('route plan preserves original paths and rejects collisions instead of merging content', () => {
  const posts = [record(100, '/2026/06/article/')];
  const pages = [...explicitPages(), record(10, '/hist%C3%B2ria/')];
  const routes = contentRoutes(posts, pages);
  expect(routes.map((route) => route.params.slug)).toEqual(['2026/06/article', 'història']);
  expect(routes[0].props.post.path).toBe(posts[0].path);
  expect(routes[1].props.kind).toBe('page');
  for (const path of ['/noticies/', '/cerca/', '/disseny/fes-te-soci/', '/brand/logo/', '/a/../b/', '/a/%2e%2e/b/']) {
    expect(() => assertContentRoutes(posts, [...pages, record(11, path)])).toThrow();
  }
  expect(() => assertContentRoutes(posts, [...pages, record(11, posts[0].path)])).toThrow(/Duplicate/);
  expect(() => assertContentRoutes(posts, [...pages, record(11, '/història/')])).toThrow(/Duplicate/);
  expect(() => assertContentRoutes(posts, [...pages, record(11, '/HIST%C3%92RIA/')])).toThrow(/Duplicate/);
  expect(() => assertContentRoutes(posts, [record(8, '/acerca-de/')])).toThrow(/explicit route/);
});

test('unrecoverable pages are explicit fallbacks with no shortcode or simulated form body', () => {
  const pages = [...explicitPages(), record(1206, '/alta-al-butlleti-de-noticies/', '[wpforms_selector id="1098"]')];
  const [route] = contentRoutes([], pages);
  expect(route.props.post.path).toBe('/alta-al-butlleti-de-noticies/');
  expect(route.props.post.html).toBe('');
  expect(route.props.migration?.status).toBe('pendent');
  expect(pageMigration(record(20, '/nova/', '[et_pb_section]')).status).toBe('pendent');
  expect(pageMigration(record(21, '/buida/', '<div> </div>')).status).toBe('pendent');
  expect(pageMigration(record(213, '/que-es-lem/')).status).toBe('parcial');
  expect(pageMigration(record(213, '/que-es-lem/')).resources?.[0].url).toMatch(/^https:\/\/www\.youtube\.com\//);
});

test('real news uses the approved list, original article links and real pagination', async ({ page }) => {
  await page.goto('/noticies/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.nw-feature')).toHaveCount(1);
  const links = page.locator('.nw-feature h2 a, .nw-item h3 a');
  await expect(links).toHaveCount(12);
  const hrefs = await links.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')!));
  expect(new Set(hrefs).size).toBe(12);
  expect(hrefs.every((href) => href.startsWith('/') && !href.startsWith('/disseny/'))).toBe(true);
  await expect(page.locator('.nw-search')).toHaveAttribute('action', '/cerca/');
  await expect(page.locator('.nl form')).toHaveCount(0);
  await expect(page.locator('.nl a')).toHaveAttribute('href', /^mailto:/);
  await page.locator('a[rel="next"]').click();
  await expect(page).toHaveURL(/\/noticies\/2\/$/);
  await expect(page.locator('.nw-feature')).toHaveCount(0);
  await expect(page.locator('.nw-item')).toHaveCount(12);
  await expect(page.locator('a[rel="prev"]')).toHaveAttribute('href', '/noticies/');
  await page.locator('.nw-item h3 a').first().click();
  await expect(page.locator('article.ar h1')).toBeVisible();
  await expect(page.locator('main a[href^="/disseny/"]')).toHaveCount(0);
  await expect(page.locator('.pg-crumbs a[href="/noticies/"]')).toBeVisible();
});

test('EM-LINE uses ArticlePage at its original permalink and preserves related links', async ({ page }) => {
  await page.goto('/2026/06/em-line-ajudeu-nos-a-la-seva-implantancio/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main h1')).toHaveCount(1);
  await expect(page.locator('article.ar')).toHaveCount(1);
  await expect(page.locator('article.ar h1')).toContainText(/EM.LINE/i);
  await expect(page.locator('.wp-prose')).toContainText('tallers neurocognitius telemàtics');
  await expect(page.locator('.ar-more h3 a')).toHaveCount(3);
  await expect(page.locator('.ar-more-head a')).toHaveAttribute('href', '/noticies/');
  await expect(page.locator('main a[href^="/disseny/"]')).toHaveCount(0);
});

test('published page paths use real content and pending form routes stay honest', async ({ page }) => {
  await page.goto('/avis-legal-i-politica-de-privacitat/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('main article')).toContainText(/TRANA/i);
  await expect(page.locator('[data-page-presentation]')).toHaveAttribute('data-page-presentation', 'association');
  await expect(page.locator('.ar-meta')).toHaveCount(0);
  await page.goto('/que-es-lem/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main aside').filter({ hasText: /vídeo/i })).toContainText(/encara no/i);
  await expect(page.locator('main aside a[href^="https://www.youtube.com/"]')).toHaveCount(1);
  for (const path of ['/alta-soci/', '/alta-al-butlleti-de-noticies/', '/trana-home/', '/imatges/', '/borrador-automatico-2/']) {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(response?.status(), path).toBe(200);
    await expect(page.locator('main form')).toHaveCount(0);
    await expect(page.locator('main')).toContainText(/encara|pendent|no té contingut/i);
    expect(await page.locator('main a[href="/contactans/"], main a[href^="tel:"], main a[href^="mailto:"]').count()).toBeGreaterThan(0);
    await expect(page.locator('main')).not.toContainText(/\[\/?(?:et_pb_|wpforms)/);
  }
  await page.goto('/alta-soci/', { waitUntil: 'domcontentloaded' });
  await page.getByText('Protecció de dades: text original del formulari', { exact: true }).click();
  await expect(page.locator('main a[href="/avis-legal-i-politica-de-privacitat/"]')).toBeVisible();
});

test('newsletter demo clearly confirms that it sends no data or email', async ({ page }) => {
  const writes: string[] = [];
  page.on('request', (request) => { if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) writes.push(request.url()); });
  await page.goto('/disseny/noticies/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-nl]')).toContainText('Demostració');
  await page.locator('[data-nl-submit]').click();
  await expect(page.locator('#nl-email')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#nl-email').fill('demo@example.invalid');
  await page.locator('#nl-ok').check();
  await page.locator('[data-nl-submit]').click();
  await expect(page.locator('[data-nl-done]')).toBeVisible();
  await expect(page.locator('[data-nl-done]')).toContainText('No s’ha enviat cap dada ni cap correu');
  expect(writes).toEqual([]);
});

test('real search and 404 use approved components with usable real destinations', async ({ page }) => {
  await page.goto('/cerca/?q=EM-LINE', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.sr-results h2 a').first()).toBeVisible();
  await expect(page.locator('main a[href^="/disseny/"]')).toHaveCount(0);
  const response = await page.goto('/__content_route_missing__/', { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(404);
  await expect(page.locator('.nf h1')).toHaveText('No trobem aquesta pàgina');
  await expect(page.locator('.nf-search')).toHaveAttribute('action', '/cerca/');
  await expect(page.locator('main a[href^="/disseny/"]')).toHaveCount(0);
});

test('shared navigation and 404 exits resolve to existing local routes', async ({ page, request }) => {
  await page.goto('/__navigation_check_missing__/', { waitUntil: 'domcontentloaded' });
  const links = await page.locator('header.site-header a[href^="/"], footer.site-footer a[href^="/"], .nf-links a[href^="/"]').evaluateAll((nodes) => [
    ...new Set(nodes.map((node) => node.getAttribute('href')!.split('#')[0] || '/')),
  ]);
  expect(links.length).toBeGreaterThan(20);
  for (const path of links) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }
  await expect(page.locator('header.site-header a[href^="https://www.tranandorra.org/"], footer.site-footer a[href^="https://www.tranandorra.org/"]')).toHaveCount(0);
  await expect(page.locator('.nf')).not.toContainText('segurament encara existeix');
});
