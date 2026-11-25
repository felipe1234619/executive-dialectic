import { test, expect, devices } from '@playwright/test';

const cases = [
  { name: 'desktop-1440', viewport: { width: 1440, height: 900 } },
  { name: 'tablet-768', viewport: { width: 768, height: 1024 } },
  { name: 'mobile-390', viewport: { width: 390, height: 844 } },
  { name: 'mobile-320', viewport: { width: 320, height: 700 } },
];

for (const c of cases) {
  test(`home layout ${c.name}`, async ({ page }, testInfo) => {
    await page.setViewportSize(c.viewport);
    await page.goto('http://127.0.0.1:8765/index.html');
    await expect(page).toHaveTitle(/Executive Dialectic/);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('link', { name: /Skip to content/i })).toHaveCount(1);
    await expect(page.locator('.hero-status')).toBeVisible();
    await page.screenshot({ path: `artifacts/${testInfo.project.name}-${c.name}-home.png`, fullPage: true });
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      imagesBroken: Array.from(document.images).filter(i => !i.complete || i.naturalWidth === 0).length
    }));
    expect(metrics.scrollWidth, 'horizontal overflow').toBeLessThanOrEqual(metrics.viewportWidth + 1);
    expect(metrics.imagesBroken).toBe(0);
  });

  test(`workspace remains disabled ${c.name}`, async ({ page }, testInfo) => {
    await page.setViewportSize(c.viewport);
    await page.goto('http://127.0.0.1:8765/app.html');
    await expect(page.getByRole('heading', { name: 'Access has not yet been enabled.' })).toBeVisible();
    await expect(page.locator('input[type=password]')).toHaveCount(0);
    await page.screenshot({ path: `artifacts/${testInfo.project.name}-${c.name}-workspace.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, 'horizontal overflow').toBeLessThanOrEqual(1);
  });
}

test('keyboard skip navigation and internal anchors', async ({ page }) => {
  await page.goto('http://127.0.0.1:8765/index.html');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#content$/);
  await page.getByRole('link', { name: 'Method', exact: true }).click();
  await expect(page).toHaveURL(/#method$/);
});

test('institutional footer supports keyboard navigation', async ({ page }) => {
  await page.goto('http://127.0.0.1:8765/index.html');
  const footer = page.getByRole('contentinfo');
  const method = footer.getByRole('link', { name: 'Decision method' });
  const demo = footer.getByRole('link', { name: 'Interactive demo' });
  const library = footer.getByRole('link', { name: 'The Executive Library' });

  await expect(demo).toHaveAttribute('href', './demo.html');
  await expect(library).toHaveAttribute('href', 'https://theexecutiveinstitute.com/');

  await method.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#method$/);
  await method.focus();
  await page.keyboard.press('Tab');
  await expect(demo).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(library).toBeFocused();
});
