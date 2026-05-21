import { Page, expect } from '@playwright/test';

import { test } from '../fixtures/ambient-page.fixture';

async function openManagementSection(
  page: Page,
  headingBtnSel: string,
  bodyId: string
): Promise<void> {
  const modalOpen = await page.evaluate(() => {
    const el = document.getElementById('modal-options');
    return el ? !el.classList.contains('hidden') : false;
  });
  if (!modalOpen) {
    await page.locator('#btn-options').click();
    await page.waitForFunction(() => {
      const el = document.getElementById('modal-options');
      return el ? !el.classList.contains('hidden') : false;
    }, { timeout: 8_000 });
  }

  const alreadyOpen = await page.evaluate((id: string) => {
    const el = document.getElementById(id);
    return el ? !el.classList.contains('hidden') : false;
  }, bodyId);

  if (!alreadyOpen) {
    await page.locator(headingBtnSel).click();
    await page.waitForFunction((id: string) => {
      const el = document.getElementById(id);
      return el ? !el.classList.contains('hidden') : false;
    }, bodyId, { timeout: 8_000 });
  }
}

test.describe('SC-014 Local playlist import', () => {
  test.beforeEach(async ({ browserName }) => {
    test.skip(browserName !== 'chromium', 'Local playlist import is validated on chromium only.');
  });

  test('imports valid json in local mode and switches to imported playlist', async ({ ambientPage, page }) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.waitForPlaylistReady();

    const isCloud = await page.evaluate(() => !!(window as any).AmbientData?.isCloud);
    test.skip(isCloud, 'This scenario is for local mode only.');

    await openManagementSection(page, '#collapse-item-heading-playlist button', 'collapse-item-body-playlist');

    const validImportJson = JSON.stringify({
      ImportedLocal: [
        {
          title: 'E2E Local Import Title',
          artist: 'E2E Local Artist',
          desc: 'Local import flow',
          file: './assets/media/test/sample.mp4',
        },
      ],
      options: {
        volume: 40,
      },
    }, null, 2);

    await page.setInputFiles('#playlist-import-file', {
      name: 'e2e-local-import.json',
      mimeType: 'application/json',
      buffer: Buffer.from(validImportJson, 'utf8'),
    });

    await expect(page.locator('#btn-import-playlist')).toBeEnabled();
    await page.locator('#btn-import-playlist').click();

    await expect(page.locator('#alert-notification')).toContainClass('bg-green-50');

    await expect.poll(async () => page.evaluate(() => {
      const select = document.getElementById('current-playlist') as HTMLSelectElement | null;
      return select?.value || '';
    })).toMatch(/e2e-local-import(?:-\d+)?\.json/i);

    await ambientPage.openPlaylistDrawer();
    await expect(page.locator('#playlist-list-group')).toContainText('E2E Local Import Title');
  });

  test('rejects invalid schema json in local mode', async ({ ambientPage, page }) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.waitForPlaylistReady();

    const isCloud = await page.evaluate(() => !!(window as any).AmbientData?.isCloud);
    test.skip(isCloud, 'This scenario is for local mode only.');

    await openManagementSection(page, '#collapse-item-heading-playlist button', 'collapse-item-body-playlist');

    const invalidImportJson = JSON.stringify({
      ImportedLocal: [
        {
          videoid: 'dQw4w9WgXcQ',
        },
      ],
    }, null, 2);

    await page.setInputFiles('#playlist-import-file', {
      name: 'e2e-local-invalid-import.json',
      mimeType: 'application/json',
      buffer: Buffer.from(invalidImportJson, 'utf8'),
    });

    await expect(page.locator('#btn-import-playlist')).toBeEnabled();
    await page.locator('#btn-import-playlist').click();

    await expect(page.locator('#alert-notification')).toContainClass('bg-red-50');
  });
});
