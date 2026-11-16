import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

test('join demo keeps errors current and never claims to send an application', async ({ page }) => {
  const writes: string[] = [];
  page.on('request', (request) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) writes.push(request.url());
  });
  await page.goto('/disseny/fes-te-soci/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-ready]').click();
  await expect(page.locator('[data-summary]')).toBeFocused();
  await expect(page.locator('#jn-name')).toHaveAttribute('aria-invalid', 'true');
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const violations = await page.evaluate(async () => (await (window as any).axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
  })).violations.map((v: any) => ({ id: v.id, nodes: v.nodes.map((n: any) => n.target) })));
  expect(violations).toEqual([]);
  await page.locator('#jn-name').fill('Prova local');
  await expect(page.locator('#jn-name')).toBeFocused();
  await expect(page.locator('[data-summary] a[href="#jn-name"]')).toHaveCount(0);
  await page.locator('#jn-email').fill('demo@example.invalid');
  await page.locator('input[name="what"][value="soci"]').check();
  await page.locator('input[name="how"][value="telefon"]').check();
  await expect(page.locator('#jn-phone')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#jn-phone').fill('+376 821 345');
  await page.locator('#jn-ok').check();
  await expect(page.locator('[data-summary]')).toBeHidden();
  await page.locator('[data-ready]').click();
  await expect(page.locator('[data-done]')).toBeFocused();
  await expect(page.locator('[data-done]')).toContainText('Demostració completada');
  await expect(page.locator('[data-done]')).toContainText('no s’ha enviat cap dada ni cap correu');
  await expect(page.locator('.fm-demo').first()).toBeVisible();
  expect(writes).toEqual([]);
  expect(new URL(page.url()).search).toBe('');
});

test('join demo cannot leak form fields through an implicit GET when JavaScript is off', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto('/disseny/fes-te-soci/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-ready]')).toBeDisabled();
    await expect(page.locator('noscript .fm-demo')).toBeVisible();
    await expect(page.locator('noscript .fm-demo')).toContainText('demostració');
    await page.locator('#jn-name').fill('Prova local');
    await page.locator('#jn-email').fill('demo@example.invalid');
    await page.locator('#jn-email').press('Enter');
    await expect(page).toHaveURL(/\/disseny\/fes-te-soci\/$/);
  } finally { await context.close(); }
});

for (const width of [390, 1440]) {
  test(`anchors and returning header focus remain visible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => document.fonts.ready);
    await page.locator('footer a[href="/#col-laboradors"]').evaluate((el: HTMLAnchorElement) => el.click());
    await expect.poll(() => page.locator('#col-laboradors').evaluate((el) => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(90);
    await page.locator('header .v7-contact-link').first().focus();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.locator('header .v7-contact-link').first()).toBeInViewport();
    await page.locator('footer a[href="/#col-laboradors"]').evaluate((el: HTMLAnchorElement) => el.click());
    await page.locator(width >= 960 ? 'header [data-disclosure]' : '.mobile-nav-toggle').first().focus();
    // Move backwards from the pinned controls through the real keyboard order.
    for (let step = 0; step < 10; step++) {
      await page.keyboard.press('Shift+Tab');
      if (await page.evaluate(() => document.activeElement?.matches('.v7-contact-link'))) break;
    }
    await expect(page.locator('header .v7-contact-link').last()).toBeFocused();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    if (width >= 960) {
      await page.locator('footer a[href="/#col-laboradors"]').evaluate((el: HTMLAnchorElement) => el.click());
      await page.locator('.v7-search-toggle').focus();
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    }
    await page.locator('.skip').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
    await expect.poll(() => page.locator('main').evaluate((el) => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(90);
  });
}

test('floating donation control does not cover focused main content', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const target = [...document.querySelectorAll<HTMLAnchorElement>('main a')].find((el) => {
      const rect = el.getBoundingClientRect();
      return rect.top + window.scrollY > 1200 && rect.left < 240;
    });
    if (!target) throw new Error('Expected a lower-page link in the donation control column');
    target.scrollIntoView({ block: 'end' });
    target.focus({ preventScroll: true });
  });
  const obscured = await page.evaluate(() => {
    const active = document.activeElement?.getBoundingClientRect();
    const donation = document.querySelector<HTMLElement>('.v7-float-donate');
    if (!active || !donation || getComputedStyle(donation).visibility === 'hidden' || getComputedStyle(donation).opacity === '0') return false;
    const floating = donation.getBoundingClientRect();
    return active.left < floating.right && active.right > floating.left && active.top < floating.bottom && active.bottom > floating.top;
  });
  expect(obscured).toBe(false);
});
