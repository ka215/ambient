import { expect, Page } from '@playwright/test';

import { test } from '../fixtures/ambient-page.fixture';

function buildMyPlaylistForMediaEdit() {
  return {
    Focus: [
      {
        title: 'media-edit-focus-1',
        videoid: 'dQw4w9WgXcQ',
        artist: 'E2E Artist',
        desc: 'focus item',
        start: '',
        end: '',
      },
    ],
    Calm: [
      {
        title: 'media-edit-calm-1',
        videoid: 'gu7T0D50wFk',
        artist: 'E2E Artist',
        desc: 'calm item',
        start: '',
        end: '',
      },
    ],
    Work: [
      {
        title: 'media-edit-work-1',
        videoid: '3JZ_D3ELwOQ',
        artist: 'E2E Artist',
        desc: 'work item',
        start: '',
        end: '',
      },
    ],
    options: {
      dark: false,
      seek: false,
      shuffle: false,
      fader: false,
      volume: 50,
    },
  };
}

async function seedMyPlaylist(page: Page): Promise<void> {
  const payload = JSON.stringify(buildMyPlaylistForMediaEdit());
  await page.addInitScript((playlistJson) => {
    localStorage.clear();
    localStorage.setItem('AmbientMyPlaylist', playlistJson);
  }, payload);
}

async function openMediaEditFromFirstPlaylistItem(page: Page): Promise<void> {
  await page.locator('#btn-playlist-mode').click();
  const editOption = page.locator('#playlist-mode-menu .playlist-mode-option[data-mode="edit"]');
  await expect(editOption).toBeEnabled();
  await editOption.click();
  await expect(page.locator('#playlist-mode-button-label')).toContainText(/編集|Edit/);

  const firstItem = page.locator('#playlist-list-group a[data-playlist-item]').first();
  await expect(firstItem).toBeVisible();
  await firstItem.click();
  await expect(page.locator('#modal-media-edit')).toBeVisible();
}

async function assertJapaneseValidationMessagesInjected(page: Page): Promise<void> {
  await expect.poll(async () => {
    return page.evaluate(() => {
      return (window as any).AmbientData?.messages?.['Category is required.'] || null;
    });
  }, { timeout: 20_000 }).toBe('カテゴリーは必須です。');

  await expect.poll(async () => {
    return page.evaluate(() => {
      return (window as any).AmbientData?.messages?.['Please fix the validation errors before saving.'] || null;
    });
  }, { timeout: 20_000 }).toBe('保存前に入力エラーを修正してください。');
}

async function assertJapaneseValidationUiIfPlayable(ambientPage: any, page: Page): Promise<void> {
  await ambientPage.openPlaylistDrawer();
  const hasPlaylistItems = await page.evaluate(() => {
    return document.querySelectorAll('#playlist-list-group a[data-playlist-item]').length > 0;
  });

  if (!hasPlaylistItems) {
    return;
  }

  await openMediaEditFromFirstPlaylistItem(page);

  await page.locator('#modal-media-edit-category').fill('');
  await page.locator('#modal-media-edit-title-input').fill('');
  await expect(page.locator('#btn-save-media-edit')).toBeDisabled();

  await expect(page.locator('#modal-media-edit-category-error')).toHaveText('カテゴリーは必須です。');
  await expect(page.locator('#modal-media-edit-title-input-error')).toHaveText('タイトルは必須です。');
  await expect(page.locator('#modal-media-edit-category-error')).not.toContainText('Category is required.');
}

test.describe('SC-015 Media edit modal refinements', () => {
  test('supports refined category combobox UX, timing pseudo spinner, and save category propagation', async ({ ambientPage, page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Media edit E2E is validated on chromium only.');

    const newCategory = `e2e-media-edit-${Date.now()}`;

    await seedMyPlaylist(page);
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();

    const hasPlaylistItems = await page.evaluate(() => {
      return document.querySelectorAll('#playlist-list-group a[data-playlist-item]').length > 0;
    });
    test.skip(!hasPlaylistItems, 'No playlist items available for media edit in this environment.');
    await ambientPage.openPlaylistDrawer();

    await openMediaEditFromFirstPlaylistItem(page);

    const categoryInput = page.locator('#modal-media-edit-category');
    await expect(categoryInput).toHaveValue('Focus');

    await page.locator('#btn-media-edit-category-toggle').click();
    await expect(page.locator('#modal-media-edit-category-dropdown')).toBeVisible();

    const optionLocator = page.locator('#modal-media-edit-category-options .media-edit-category-option');
    await expect(optionLocator).toHaveCount(3);
    const optionTexts = (await optionLocator.allTextContents()).map((text) => text.trim());
    expect(optionTexts).toEqual(expect.arrayContaining(['Focus', 'Calm', 'Work']));

    const activeOption = page.locator('#modal-media-edit-category-options .media-edit-category-option[aria-selected="true"]');
    await expect(activeOption).toHaveText('Focus');

    await categoryInput.fill('zzzzzz');
    await expect(optionLocator).toHaveCount(3);

    const clearButton = page.locator('#btn-media-edit-category-clear');
    await expect(clearButton).toBeVisible();
    await clearButton.click();
    await expect(categoryInput).toHaveValue('');
    await expect(categoryInput).toBeFocused();

    await page.evaluate(() => {
      const input = document.getElementById('modal-media-edit-seek-start') as HTMLInputElement | null;
      if (!input) {
        return;
      }
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await page.locator('.media-edit-timing-stepper-btn[data-target="modal-media-edit-seek-start"][data-step-dir="up"]').click();
    await expect(page.locator('#modal-media-edit-seek-start')).toHaveValue('1');

    await categoryInput.fill(newCategory);
    await page.locator('#btn-save-media-edit').click();
    await expect(page.locator('#modal-media-edit')).toBeHidden();

    await ambientPage.openSettingsDrawer();
    const targetCategoryOptions = (await page.locator('#target-category option').allTextContents()).map((text) => text.trim());
    expect(targetCategoryOptions).toContain(newCategory);
    await ambientPage.closeSettingsDrawer();
  });

  test('shows JA validation messages in cloud mode when lang cookie is ja', async ({ ambientPage, page }) => {

    const baseUrl = process.env.E2E_BASE_URL || 'https://dev-amp.ka2.org/';
    await page.context().addCookies([
      {
        name: 'lang',
        value: 'ja',
        url: baseUrl,
      },
    ]);

    await seedMyPlaylist(page);
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();

    const isCloudMode = await page.evaluate(() => {
      return Boolean((window as any).AmbientData?.isCloud === true);
    });
    test.skip(!isCloudMode, 'Cloud-mode scenario only.');

    await assertJapaneseValidationMessagesInjected(page);
    await assertJapaneseValidationUiIfPlayable(ambientPage, page);
  });

  test('shows JA validation messages in local mode when lang cookie is ja', async ({ ambientPage, page }) => {
    const baseUrl = process.env.E2E_BASE_URL || 'https://dev-amp.ka2.org/';
    await page.context().addCookies([
      {
        name: 'lang',
        value: 'ja',
        url: baseUrl,
      },
    ]);

    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();

    const isCloudMode = await page.evaluate(() => {
      return Boolean((window as any).AmbientData?.isCloud === true);
    });
    test.skip(isCloudMode, 'Local-mode scenario only.');

    await assertJapaneseValidationMessagesInjected(page);
    await assertJapaneseValidationUiIfPlayable(ambientPage, page);
  });

  test('persists thumbnail image field on media edit save in local mode', async ({ ambientPage, page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Media edit E2E is validated on chromium only.');

    const baseUrl = process.env.E2E_BASE_URL || 'https://dev-amp.ka2.org/';
    await page.context().addCookies([
      {
        name: 'lang',
        value: 'ja',
        url: baseUrl,
      },
    ]);

    await seedMyPlaylist(page);
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();

    const isCloudMode = await page.evaluate(() => {
      return Boolean((window as any).AmbientData?.isCloud === true);
    });
    test.skip(isCloudMode, 'Local-mode scenario only.');

    let capturedPlaylistSavePayload: Record<string, unknown> | null = null;
    page.on('request', (request) => {
      if (request.method() !== 'POST') {
        return;
      }
      if (!request.url().includes('/playlist-save/')) {
        return;
      }
      try {
        capturedPlaylistSavePayload = request.postDataJSON() as Record<string, unknown>;
      } catch (_error) {
        capturedPlaylistSavePayload = null;
      }
    });

    await ambientPage.openPlaylistDrawer();
    const hasPlaylistItems = await page.evaluate(() => {
      return document.querySelectorAll('#playlist-list-group a[data-playlist-item]').length > 0;
    });
    test.skip(!hasPlaylistItems, 'No playlist items available for media edit in this environment.');

    await openMediaEditFromFirstPlaylistItem(page);

    await page.setInputFiles('#modal-media-edit-thumbnail-input', {
      name: 'e2e-thumb.png',
      mimeType: 'image/png',
      buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]),
    });

    await page.locator('#btn-save-media-edit').click();
    await expect(page.locator('#modal-media-edit')).toBeHidden();
    await expect(page.locator('#alert-message')).toContainText('プレイリストを保存しました。');

    expect(capturedPlaylistSavePayload).not.toBeNull();
    const payloadValues = Object.values(capturedPlaylistSavePayload || {});
    const hasImageField = payloadValues.some((value) => {
      if (!Array.isArray(value)) {
        return false;
      }
      return value.some((item) => {
        if (!item || typeof item !== 'object') {
          return false;
        }
        const media = item as Record<string, unknown>;
        return media['title'] === 'media-edit-focus-1' && media['image'] === 'e2e-thumb.png';
      });
    });
    expect(hasImageField).toBe(true);
  });
});
