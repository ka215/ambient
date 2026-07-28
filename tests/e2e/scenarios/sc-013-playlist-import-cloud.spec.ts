import { Page, expect } from '@playwright/test';

import { test } from '../fixtures/ambient-page.fixture';

const MYPLAYLIST_NAME = 'MyPlaylist';

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

test.describe('SC-013 Cloud playlist import', () => {
  test.beforeEach(async ({ browserName, page }) => {
    test.skip(browserName !== 'chromium', 'Cloud playlist import is validated on chromium only.');
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('imports valid json into MyPlaylist and refreshes playlist UI', async ({ ambientPage, page }) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.waitForPlaylistReady();

    await expect.poll(async () => page.evaluate(() => !!(window as any).AmbientData?.isCloud)).toBe(true);

    await openManagementSection(page, '#collapse-item-heading-playlist button', 'collapse-item-body-playlist');

    const validImportJson = JSON.stringify({
      Imported: [
        {
          title: 'E2E Import Title',
          videoid: 'dQw4w9WgXcQ',
          artist: 'E2E Artist',
          desc: '<b>safe desc</b>',
          volume: '70',
        },
      ],
      options: {
        volume: '35',
      },
    }, null, 2);

    await page.setInputFiles('#playlist-import-file', {
      name: 'e2e-import.json',
      mimeType: 'application/json',
      buffer: Buffer.from(validImportJson, 'utf8'),
    });

    await expect(page.locator('#btn-import-playlist')).toBeEnabled();
    await page.locator('#btn-import-playlist').click();

    await expect(page.locator('#alert-notification')).toContainClass('bg-green-50');
    await expect(page.locator('#current-playlist')).toHaveValue(MYPLAYLIST_NAME);

    await ambientPage.openPlaylistDrawer();
    await expect(page.locator('#playlist-list-group a[data-playlist-item]')).toHaveCount(1);
    await expect(page.locator('#playlist-list-group')).toContainText('E2E Import Title');

    await expect.poll(async () => page.evaluate(() => {
      const raw = localStorage.getItem('AmbientMyPlaylist');
      if (!raw) return null;
      return JSON.parse(raw).Imported?.[0]?.desc || null;
    })).toBe('safe desc');
  });

  test('rejects invalid schema json and keeps current playlist state', async ({ ambientPage, page }) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.waitForPlaylistReady();

    await openManagementSection(page, '#collapse-item-heading-playlist button', 'collapse-item-body-playlist');

    const invalidImportJson = JSON.stringify({
      Imported: [
        {
          videoid: 'dQw4w9WgXcQ',
        },
      ],
    }, null, 2);

    await page.setInputFiles('#playlist-import-file', {
      name: 'e2e-invalid-import.json',
      mimeType: 'application/json',
      buffer: Buffer.from(invalidImportJson, 'utf8'),
    });

    await expect(page.locator('#btn-import-playlist')).toBeEnabled();
    await page.locator('#btn-import-playlist').click();

    await expect(page.locator('#alert-notification')).toContainClass('bg-red-50');
    await expect.poll(async () => page.evaluate(() => localStorage.getItem('AmbientMyPlaylist'))).toBe(
      JSON.stringify({ options: {} }, null, 2)
    );
  });
});
