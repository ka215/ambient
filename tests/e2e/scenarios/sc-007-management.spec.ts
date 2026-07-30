import { expect, Page } from '@playwright/test';

import { test } from '../fixtures/ambient-page.fixture';
import { getPlaylistItemCount } from '../utils/data-helpers';
import { E2E_PLAYLIST_NAME, installE2ePlaylistFixture, removeE2ePlaylistFixture } from '../utils/playlist-fixtures';

/**
 * Open #modal-options and expand the specified accordion section.
 * The management UI (collapse.php) is hosted inside #modal-options, NOT #drawer-settings.
 * Modal visibility: Flowbite removes the `hidden` CSS class when toggled — standard
 * Playwright locator clicks work once the modal is in view.
 *
 * @param page           - Playwright Page
 * @param headingBtnSel  - querySelector-compatible selector for the accordion heading button
 * @param bodyId         - element id of the accordion body panel
 */
async function openManagementSection(
  page: Page,
  headingBtnSel: string,
  bodyId: string
): Promise<void> {
  // Step 1: Open modal-options if not already open (Flowbite removes `hidden` class)
  const modalOpen = await page.evaluate(() => {
    const el = document.getElementById('modal-options');
    return el ? !el.classList.contains('hidden') : false;
  });
  if (!modalOpen) {
    // Click #btn-options via JS to avoid actionability issues in narrow viewports
    await page.evaluate(() => {
      const btn = document.querySelector<HTMLElement>('#btn-options');
      if (btn) btn.click();
    });
    await page.waitForFunction(() => {
      const el = document.getElementById('modal-options');
      return el ? !el.classList.contains('hidden') : false;
    }, { timeout: 8_000 });
  }

  // Step 2: Expand target accordion section via JS click if currently collapsed
  const alreadyOpen = await page.evaluate((bId: string) => {
    const el = document.getElementById(bId);
    return el ? !el.classList.contains('hidden') : false;
  }, bodyId);

  if (!alreadyOpen) {
    await page.evaluate((sel: string) => {
      const btn = document.querySelector<HTMLElement>(sel);
      if (btn) btn.click();
    }, headingBtnSel);

    await page.waitForFunction((bId: string) => {
      const el = document.getElementById(bId);
      return el ? !el.classList.contains('hidden') : false;
    }, bodyId, { timeout: 8_000 });
  }
}

async function resetTargetCategoryFilter(page: Page, ambientPage: { openSettingsDrawer(): Promise<void>; closeSettingsDrawer(): Promise<void>; }): Promise<void> {
  await ambientPage.openSettingsDrawer();
  await page.evaluate(() => {
    const select = document.getElementById('target-category') as HTMLSelectElement | null;
    if (!select) return;
    select.value = '-1';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForFunction(() => {
    const select = document.getElementById('target-category') as HTMLSelectElement | null;
    const itemCount = document.querySelectorAll('#playlist-list-group a[data-playlist-item]').length;
    const noMedia = document.querySelector<HTMLElement>('#no-media');
    const isNoMediaVisible = !!(noMedia && !noMedia.classList.contains('hidden'));
    return (select?.value === '-1') && (itemCount > 0 || isNoMediaVisible);
  }, { timeout: 10_000 });
  await ambientPage.closeSettingsDrawer();
}

test.describe('SC-007 Playlist/Media management flow', () => {
  test.beforeEach(() => {
    installE2ePlaylistFixture();
  });

  test.afterEach(() => {
    removeE2ePlaylistFixture();
  });

  test('adds category and YouTube media from management forms', async ({ ambientPage, page }) => {
    // Arrange
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await expect(page.locator(`#current-playlist option[value="${E2E_PLAYLIST_NAME}"]`)).toHaveText('playlist-for-e2e');
    await ambientPage.selectPlaylist(E2E_PLAYLIST_NAME);
    await resetTargetCategoryFilter(page, ambientPage);

    const uniqueSuffix = Date.now();
    const categoryName = `e2e-category-${uniqueSuffix}`;
    const mediaTitle = `e2e-media-${uniqueSuffix}`;

    // Act - open options modal and expand playlist management section
    await openManagementSection(page, '#collapse-item-heading-playlist button', 'collapse-item-body-playlist');

    // Fill category name field via JS to bypass Flowbite form validation hooks
    await page.evaluate((name) => {
      const input = document.getElementById('category-name') as HTMLInputElement | null;
      if (!input) return;
      input.value = name;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, categoryName);
    await expect(page.locator('#category-name')).toHaveValue(categoryName);

    // Remove disabled attribute and click "Add Category"
    // Note: capture current option count before click for waitForFunction
    const optCountBefore = await page.evaluate(() =>
      document.querySelectorAll('#media-category option').length
    );
    await page.evaluate(() => {
      const btn = document.getElementById('btn-create-category') as HTMLButtonElement | null;
      if (!btn) return;
      btn.removeAttribute('disabled');
      btn.click();
    });

    // Wait until #media-category option count increases (clearCategory + updateCategory cycle)
    await page.waitForFunction((prev: number) => {
      return document.querySelectorAll('#media-category option').length > prev;
    }, optCountBefore, { timeout: 8_000 });

    // Assert: new category appears in #media-category options
    await expect.poll(async () => {
      return page.evaluate((name) => {
        const options = Array.from(document.querySelectorAll('#media-category option'))
          .map((opt) => (opt.textContent || '').trim());
        return options.some((text) => text === name || text.startsWith(`${name}_`));
      }, categoryName);
    }, { timeout: 10_000 }).toBe(true);

    // Optional check: symlink button should be disabled on non-local hosts
    const localMediaDirectory = page.locator('#local-media-directory');
    if (await localMediaDirectory.count() > 0 && await localMediaDirectory.isDisabled()) {
      await expect(page.locator('#btn-create-symlink')).toBeDisabled();
    }

    // Act - expand media management section (modal stays open)
    await openManagementSection(page, '#collapse-item-heading-media button', 'collapse-item-body-media');

    // Fill YouTube URL (video ID extracted by ambient.ts input handler)
    await page.evaluate(() => {
      const input = document.getElementById('youtube-url') as HTMLInputElement | null;
      if (!input) return;
      input.value = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(page.locator('#youtube-videoid')).toHaveValue('dQw4w9WgXcQ');

    // Select newly created category
    await page.locator('#media-category').selectOption({ label: categoryName });
    await page.locator('#media-category').dispatchEvent('change');
    await expect(page.locator('#media-category')).toHaveValue(/\d+/);

    // Fill media title
    await page.evaluate((title) => {
      const input = document.getElementById('media-title') as HTMLInputElement | null;
      if (!input) return;
      input.value = title;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, mediaTitle);
    await expect(page.locator('#media-title')).toHaveValue(mediaTitle);

    // Remove disabled and click "Add Media"
    await page.evaluate(() => {
      const btn = document.getElementById('btn-add-media') as HTMLButtonElement | null;
      if (!btn) return;
      btn.removeAttribute('disabled');
      btn.click();
    });

    // Assert: newly added media appears in the playlist
    await expect.poll(async () => {
      return page.evaluate((title) => {
        return Array.from(document.querySelectorAll('#playlist-list-group a[data-playlist-item]'))
          .some((elm) => (elm.textContent || '').includes(title));
      }, mediaTitle);
    }, { timeout: 10_000 }).toBe(true);
  });

  test('opens media management from no-media button when a filtered category has no items', async ({ ambientPage, page }) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.selectPlaylist(E2E_PLAYLIST_NAME);
    await resetTargetCategoryFilter(page, ambientPage);

    const uniqueSuffix = Date.now();
    const categoryName = `e2e-empty-category-${uniqueSuffix}`;

    await openManagementSection(page, '#collapse-item-heading-playlist button', 'collapse-item-body-playlist');

    await page.evaluate((name) => {
      const input = document.getElementById('category-name') as HTMLInputElement | null;
      if (!input) return;
      input.value = name;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, categoryName);

    const optCountBefore = await page.evaluate(() =>
      document.querySelectorAll('#media-category option').length
    );
    await page.evaluate(() => {
      const btn = document.getElementById('btn-create-category') as HTMLButtonElement | null;
      if (!btn) return;
      btn.removeAttribute('disabled');
      btn.click();
    });

    await page.waitForFunction((prev: number) => {
      return document.querySelectorAll('#media-category option').length > prev;
    }, optCountBefore, { timeout: 8_000 });

    await page.waitForFunction((name: string) => {
      const select = document.getElementById('target-category') as HTMLSelectElement | null;
      if (!select) return false;
      return Array.from(select.options).some((opt) => (opt.textContent || '').trim() === name);
    }, categoryName, { timeout: 8_000 });

    await page.locator('#btn-close-options').click();
    await expect(page.locator('#modal-options')).toBeHidden();

    await ambientPage.openSettingsDrawer();
    await page.evaluate((name) => {
      const select = document.getElementById('target-category') as HTMLSelectElement | null;
      if (!select) return;
      const option = Array.from(select.options).find((opt) => (opt.textContent || '').trim() === name);
      if (!option) return;
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }, categoryName);
    await expect.poll(async () => {
      return page.evaluate(() => {
        const select = document.getElementById('target-category') as HTMLSelectElement | null;
        return select?.selectedOptions[0]?.textContent?.trim() || '';
      });
    }, { timeout: 10_000 }).toBe(categoryName);
    await ambientPage.closeSettingsDrawer();

    await ambientPage.openPlaylistDrawer();
    const clickedAddButtonId = await page.evaluate(() => {
      const drawerButton = document.getElementById('btn-add-media-from-drawer') as HTMLElement | null;
      if (drawerButton && !drawerButton.classList.contains('hidden')) {
        drawerButton.click();
        return 'btn-add-media-from-drawer';
      }
      const playlistButton = document.getElementById('btn-add-media-from-playlist') as HTMLElement | null;
      if (playlistButton && !playlistButton.classList.contains('hidden')) {
        playlistButton.click();
        return 'btn-add-media-from-playlist';
      }
      return null;
    });
    expect(clickedAddButtonId).not.toBeNull();
    await expect(page.locator('#modal-options')).toBeVisible();
    await expect(page.locator('#collapse-item-body-media')).toBeVisible();
    await expect(page.locator('#media-category')).toHaveValue(/\d+/);

    await page.locator('#btn-close-options').click();
    await expect(page.locator('#modal-options')).toBeHidden();

    await ambientPage.openSettingsDrawer();
    await expect(page.locator('#target-category')).toHaveValue(/\d+/);
    await ambientPage.closeSettingsDrawer();
    await page.evaluate(() => {
      const btn = document.querySelector<HTMLElement>('#btn-options');
      if (btn) btn.click();
    });
    await expect(page.locator('#modal-options')).toBeVisible();
    await openManagementSection(page, '#collapse-item-heading-media button', 'collapse-item-body-media');
    await expect(page.locator('#media-category')).toHaveValue(/\d+/);
  });

  test('category note link opens playlist management category field', async ({ ambientPage, page }) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.selectPlaylist(E2E_PLAYLIST_NAME);

    await openManagementSection(page, '#collapse-item-heading-media button', 'collapse-item-body-media');

    const noteLink = page.locator('#link-open-playlist-management-category');
    await expect(noteLink).toBeVisible();
    await noteLink.click();

    await expect(page.locator('#collapse-item-body-playlist')).toBeVisible();
    await expect(page.locator('#category-name')).toBeFocused();
  });

  test('validates media title immediately while typing', async ({ ambientPage, page }) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();

    await openManagementSection(page, '#collapse-item-heading-media button', 'collapse-item-body-media');

    await page.evaluate(() => {
      const input = document.getElementById('media-title') as HTMLInputElement | null;
      if (!input) return;
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(page.locator('#media-title')).not.toHaveAttribute('data-validate', 'true');

    await page.evaluate(() => {
      const input = document.getElementById('media-title') as HTMLInputElement | null;
      if (!input) return;
      input.value = 'typed title';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(page.locator('#media-title')).toHaveAttribute('data-validate', 'true');
    await expect(page.locator('#media-title')).toHaveClass(/success-input/);
  });

  test('keeps YouTube metadata assistance hidden when API key is not configured', async ({ ambientPage, page }) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();

    await openManagementSection(page, '#collapse-item-heading-media button', 'collapse-item-body-media');
    await expect(page.locator('#youtube-metadata-assist')).toBeHidden();

    await page.evaluate(() => {
      const input = document.getElementById('youtube-url') as HTMLInputElement | null;
      if (!input) return;
      input.value = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await expect(page.locator('#youtube-videoid')).toHaveValue('dQw4w9WgXcQ');
    await expect(page.locator('#youtube-metadata-assist')).toBeHidden();
  });

  test('fetches YouTube metadata suggestions and applies them without overwriting manual title', async ({ ambientPage, page }) => {
    await page.route('**/youtube-metadata/dQw4w9WgXcQ', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          state: 'ok',
          code: 200,
          data: {
            videoId: 'dQw4w9WgXcQ',
            title: 'Mock YouTube Title',
            artist: 'Mock Channel',
            desc: 'Mock description from YouTube Data API',
            source: 'youtube-data-api',
            usage: {
              month: '2026-07',
              count: 1,
              limit: 10000,
              limited: false,
            },
          },
        }),
      });
    });

    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await page.evaluate(() => {
      (window as any).AmbientData = {
        ...(window as any).AmbientData,
        youtubeMetadata: {
          enabled: true,
          monthlyLimit: 10000,
          allowOverLimit: false,
        },
      };
    });

    await openManagementSection(page, '#collapse-item-heading-media button', 'collapse-item-body-media');
    await page.evaluate(() => {
      const title = document.getElementById('media-title') as HTMLInputElement | null;
      const input = document.getElementById('youtube-url') as HTMLInputElement | null;
      if (title) {
        title.value = 'Manual Title';
        title.dispatchEvent(new Event('input', { bubbles: true }));
        title.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (input) {
        input.value = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await expect(page.locator('#youtube-videoid')).toHaveValue('dQw4w9WgXcQ');
    await expect(page.locator('#youtube-metadata-status')).toContainText(/metadata|メタデータ|Metadaten|metadatos|metadonnees|metadati/i);
    await expect(page.locator('#media-title')).toHaveValue('Manual Title');
    await expect(page.locator('#youtube-metadata-title-suggestion')).toHaveText('Mock YouTube Title');
    await expect(page.locator('#youtube-metadata-artist-suggestion')).toHaveText('Mock Channel');

    await page.locator('#btn-apply-youtube-metadata-artist').click();
    await page.locator('#btn-apply-youtube-metadata-desc').click();
    await expect(page.locator('#media-artist')).toHaveValue('Mock Channel');
    await expect(page.locator('#media-desc')).toHaveValue('Mock description from YouTube Data API');
  });

  test('shows non-blocking YouTube metadata monthly limit errors', async ({ ambientPage, page }) => {
    await page.route('**/youtube-metadata/dQw4w9WgXcQ', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          state: 'error',
          code: 429,
          data: {
            message: 'YouTube metadata monthly limit has been reached.',
            reason: 'quota-exceeded',
            usage: {
              month: '2026-07',
              count: 2,
              limit: 2,
              limited: true,
            },
          },
        }),
      });
    });

    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await page.evaluate(() => {
      (window as any).AmbientData = {
        ...(window as any).AmbientData,
        youtubeMetadata: {
          enabled: true,
          monthlyLimit: 2,
          allowOverLimit: false,
        },
      };
    });

    await openManagementSection(page, '#collapse-item-heading-media button', 'collapse-item-body-media');
    await page.evaluate(() => {
      const input = document.getElementById('youtube-url') as HTMLInputElement | null;
      const title = document.getElementById('media-title') as HTMLInputElement | null;
      if (input) {
        input.value = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (title) {
        title.value = 'Manual fallback title';
        title.dispatchEvent(new Event('input', { bubbles: true }));
        title.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await expect(page.locator('#youtube-metadata-status')).toContainText('YouTube metadata monthly limit has been reached.');
    await expect(page.locator('#youtube-metadata-suggestions')).toBeHidden();
    await expect(page.locator('#media-title')).toHaveValue('Manual fallback title');
    await expect(page.locator('#media-title')).toHaveAttribute('data-validate', 'true');
  });

  test('shows non-blocking YouTube metadata fetch errors', async ({ ambientPage, page }) => {
    await page.route('**/youtube-metadata/dQw4w9WgXcQ', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          state: 'error',
          code: 502,
          data: {
            message: 'YouTube metadata could not be fetched.',
            reason: 'upstream-error',
          },
        }),
      });
    });

    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await page.evaluate(() => {
      (window as any).AmbientData = {
        ...(window as any).AmbientData,
        youtubeMetadata: {
          enabled: true,
          monthlyLimit: 10000,
          allowOverLimit: false,
        },
      };
    });

    await openManagementSection(page, '#collapse-item-heading-media button', 'collapse-item-body-media');
    await page.evaluate(() => {
      const input = document.getElementById('youtube-url') as HTMLInputElement | null;
      const title = document.getElementById('media-title') as HTMLInputElement | null;
      if (input) {
        input.value = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (title) {
        title.value = 'Manual fallback title';
        title.dispatchEvent(new Event('input', { bubbles: true }));
        title.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await expect(page.locator('#youtube-metadata-status')).toContainText('YouTube metadata could not be fetched.');
    await expect(page.locator('#youtube-metadata-suggestions')).toBeHidden();
    await expect(page.locator('#media-title')).toHaveValue('Manual fallback title');
    await expect(page.locator('#media-title')).toHaveAttribute('data-validate', 'true');
  });

  test('does not close options modal when dragging from inside to backdrop', async ({ ambientPage, page }) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();

    await openManagementSection(page, '#collapse-item-heading-media button', 'collapse-item-body-media');
    await expect(page.locator('#modal-options')).toBeVisible();

    const titleBox = await page.locator('#media-title').boundingBox();
    if (!titleBox) throw new Error('media-title bounding box is unavailable');
    await page.mouse.move(titleBox.x + 10, titleBox.y + titleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(8, 8);
    await page.mouse.up();

    await expect(page.locator('#modal-options')).toBeVisible();
  });

  test('keeps category field valid when first category auto-selects after initial media registration', async ({ ambientPage, page }) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.waitForPlaylistReady();

    await ambientPage.openPlaylistDrawer();
    await page.locator('#btn-add-media-from-drawer').click();
    await openManagementSection(page, '#collapse-item-heading-media button', 'collapse-item-body-media');

    await page.evaluate(() => {
      const url = document.getElementById('youtube-url') as HTMLInputElement | null;
      const category = document.getElementById('media-category-new') as HTMLInputElement | null;
      const title = document.getElementById('media-title') as HTMLInputElement | null;
      if (url) {
        url.value = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        url.dispatchEvent(new Event('input', { bubbles: true }));
        url.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (category) {
        category.dispatchEvent(new Event('input', { bubbles: true }));
        category.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (title) {
        title.value = `e2e-first-category-${Date.now()}`;
        title.dispatchEvent(new Event('input', { bubbles: true }));
        title.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await expect(page.locator('#btn-add-media')).toBeEnabled();
    await page.locator('#btn-add-media').click();
    await expect(page.locator('#modal-options')).toHaveClass(/pointer-events-none/);

    await page.evaluate(() => {
      const btn = document.querySelector<HTMLElement>('#btn-options');
      if (btn) btn.click();
    });
    await expect(page.locator('#modal-options')).toBeVisible();
    await openManagementSection(page, '#collapse-item-heading-media button', 'collapse-item-body-media');

    await expect(page.locator('#media-category')).toHaveValue('0');
    await expect(page.locator('#media-category')).toHaveAttribute('data-validate', 'true');
    await expect(page.locator('#btn-add-media')).toBeDisabled();
  });
});
