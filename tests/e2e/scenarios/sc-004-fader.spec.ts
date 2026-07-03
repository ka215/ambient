import { expect } from '@playwright/test';

import { test } from '../fixtures/ambient-page.fixture';

test.describe('SC-004 Volume control (fader)', () => {
  test('updates default volume slider and display value', async ({ ambientPage, page }) => {
    // Arrange
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.openSettingsDrawer();

    const slider = page.locator('#default-volume');
    const displayValue = page.locator('#default-volume-value');

    await expect(displayValue).toHaveText('50');
    await expect(slider).toHaveValue('50');

    // Act
    await page.evaluate(() => {
      const input = document.getElementById('default-volume');
      if (input instanceof HTMLInputElement) {
        input.value = '35';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // Assert
    await expect(displayValue).toHaveText('35');
    await expect(slider).toHaveValue('35');
    await expect(slider).toHaveCSS('--range-progress', '35%');
  });
});
