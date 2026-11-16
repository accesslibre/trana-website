import { test, expect } from '@playwright/test';
import { PAGE_PRESENTATIONS } from '../../src/lib/page-presentations';

for (const [family, slugs] of Object.entries(PAGE_PRESENTATIONS)) {
  for (const slug of slugs) {
    test(`${slug}: preserves the published URL with its dedicated page family`, async ({ page }) => {
      const response = await page.goto(`/${slug}/`, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBe(200);
      await expect(page.locator('main h1')).toHaveCount(1);
      await expect(page.locator('[data-page-presentation]')).toHaveAttribute('data-page-presentation', family);
      await expect(page.locator('main article.ar')).toHaveCount(0);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
      await expect(page.locator('main a[href^="/disseny/"]')).toHaveCount(0);
      await page.setViewportSize({ width: 320, height: 900 });
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    });
  }
}

test('the home and news retain their approved templates', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main #top')).toHaveCount(1);
  await expect(page.locator('[data-page-presentation]')).toHaveCount(0);
  await page.goto('/2026/06/em-line-ajudeu-nos-a-la-seva-implantancio/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main article.ar')).toHaveCount(1);
  await expect(page.locator('[data-page-presentation]')).toHaveAttribute('data-page-presentation', 'article');
});
