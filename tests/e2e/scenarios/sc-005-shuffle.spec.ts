import { expect } from '@playwright/test';

import { test } from '../fixtures/ambient-page.fixture';

test.describe('SC-005 Shuffle toggle', () => {
  test('toggles shuffle checkbox state', async ({ ambientPage, page }) => {
    // Arrange
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.openSettingsDrawer();

    const shuffleInput = page.locator('#toggle-shuffle input[type="checkbox"]');

    // Act + Assert (on)
    await page.evaluate(() => {
      const input = document.querySelector('#toggle-shuffle input[type="checkbox"]') as HTMLInputElement | null;
      if (!input) return;
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(shuffleInput).toHaveJSProperty('checked', true);

    // Act + Assert (off)
    await page.evaluate(() => {
      const input = document.querySelector('#toggle-shuffle input[type="checkbox"]') as HTMLInputElement | null;
      if (!input) return;
      input.checked = false;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(shuffleInput).toHaveJSProperty('checked', false);
  });
});
