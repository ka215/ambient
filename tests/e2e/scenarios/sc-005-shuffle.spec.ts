import { expect } from '@playwright/test';

import { test } from '../fixtures/ambient-page.fixture';

test.describe('SC-005 Shuffle toggle', () => {
  test('toggles shuffle checkbox state', async ({ ambientPage, page }) => {
    // Arrange
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.openSettingsDrawer();

    const shuffleLabel = page.locator('#toggle-shuffle');
    const shuffleInput = page.locator('#toggle-shuffle input[type="checkbox"]');
    const before = await shuffleInput.isChecked();

    // Act
    await shuffleLabel.click({ force: true });

    // Assert
    await expect(shuffleInput).toHaveJSProperty('checked', !before);
  });
});
