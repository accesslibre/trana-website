import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const routes = ['/', '/noticies/', '/acerca-de/', '/cerca/'];
const directives = ['noindex', 'nofollow', 'noarchive'];

for (const path of routes) {
  test(`${path}: page, indexing protection and accessibility`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ca');
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    for (const directive of directives) {
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', new RegExp(directive));
      expect(response?.headers()['x-robots-tag']).toContain(directive);
    }
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const violations = await page.evaluate(async () => {
      const axe = (window as any).axe;
      const result = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] } });
      return result.violations.map((v: any) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n: any) => n.target) }));
    });
    expect(violations).toEqual([]);
  });
}

test('robots and missing routes retain indexing protection and custom 404', async ({ request, page }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toMatch(/User-agent:\s*\*[\s\S]*Disallow:\s*\//);
  for (const path of ['/robots.txt', '/__qa_missing_page__/', '/__qa_missing_asset__.png']) {
    const response = await request.get(path);
    for (const directive of directives) expect(response.headers()['x-robots-tag']).toContain(directive);
    if (path !== '/robots.txt') expect(response.status()).toBe(404);
  }
  const response = await page.goto('/__qa_missing_page__/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('main a[href="/"]').first()).toBeVisible();
});

test('skip link moves keyboard focus into main content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.locator('a[href^="#"]').filter({ hasText: /contingut/i }).first();
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => document.activeElement?.closest('main') !== null)).toBe(true);
});

test('mobile menu works with keyboard and updates expanded state', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const toggle = page.locator('header .mobile-nav-toggle');
  const actualitat = page.locator('header button[data-disclosure]', { hasText: 'Actualitat' });
  const news = page.locator('header a[href="/noticies/"]').first();
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await actualitat.click();
  await expect(actualitat).toHaveAttribute('aria-expanded', 'true');
  await expect(news).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(actualitat).toHaveAttribute('aria-expanded', 'false');
  await expect(actualitat).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await actualitat.click();
  await news.click();
  await expect(page).toHaveURL(/\/noticies\/$/);
});

test('published article links resolve and EM-LINE is available', async ({ page, request }) => {
  await page.goto('/noticies/');
  const articleLinks = page.locator('main article a[href]');
  expect(await articleLinks.count()).toBeGreaterThan(0);
  const hrefs = await articleLinks.evaluateAll(links => [...new Set(links.map(link => link.getAttribute('href')!))]);
  for (const href of hrefs.filter(href => href.startsWith('/'))) {
    const response = await request.get(href);
    expect(response.status(), href).toBe(200);
  }
  const emline = await request.get('/2026/06/em-line-ajudeu-nos-a-la-seva-implantancio/');
  expect(emline.status()).toBe(200);
  await page.goto(hrefs.find(href => href.startsWith('/'))!);
  await expect(page.locator('main h1')).toBeVisible();
});

test('search finds published content locally and handles empty results', async ({ page }) => {
  const wordpressRequests: string[] = [];
  page.on('request', request => { if (/wp-json|tranandorra\.org/i.test(request.url())) wordpressRequests.push(request.url()); });
  await page.goto('/cerca/');
  const search = page.getByRole('searchbox');
  await expect(search).toBeVisible();
  await search.fill('EM');
  await search.press('Enter');
  const result = page.locator('main a').filter({ hasText: /EM.LINE/i }).first();
  await expect(result).toBeVisible();
  expect(await result.getAttribute('href')).toMatch(/^\//);
  await search.fill('zzzzqainexistent987654321');
  await search.press('Enter');
  await expect(page.locator('main')).toContainText(/cap|no (?:s.han |hi ha |hem )?trobat|sense resultats/i);
  expect(wordpressRequests.filter(url => /wp-json/.test(url))).toEqual([]);
});

for (const width of [320, 375, 768, 1280]) {
  test(`reflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [...routes, '/2026/06/em-line-ajudeu-nos-a-la-seva-implantancio/']) {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), path).toBe(true);
    }
  });
}
