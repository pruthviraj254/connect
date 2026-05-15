import { test, expect } from '@playwright/test';

test('placeholder e2e — extend when packaged app is available', async ({ page }) => {
  await page.goto('about:blank');
  await expect(page).toHaveTitle(/.*/);
});
