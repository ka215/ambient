import { expect, Page } from '@playwright/test';

import { test } from '../fixtures/ambient-page.fixture';
import { getPlaylistItemCount } from '../utils/data-helpers';

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

test.describe('SC-007 Playlist/Media management flow', () => {
  test('adds category and YouTube media from management forms', async ({ ambientPage, page }) => {
    // Arrange
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.selectPlaylist('mememori-youtube.json');

    const initialItemCount = await getPlaylistItemCount(page);
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

    // Assert: playlist item count increased by 1
    await expect.poll(async () => getPlaylistItemCount(page), { timeout: 10_000 }).toBe(initialItemCount + 1);
  });

  test('opens media management from no-media button when a filtered category has no items', async ({ ambientPage, page }) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.selectPlaylist('mememori-youtube.json');

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

    await page.locator('#btn-close-options').click();
    await expect(page.locator('#modal-options')).toBeHidden();

    await ambientPage.openSettingsDrawer();
    await page.locator('#target-category').selectOption({ label: categoryName });
    await page.locator('#target-category').dispatchEvent('change');
    await ambientPage.closeSettingsDrawer();

    await ambientPage.openPlaylistDrawer();
    await expect(page.locator('#no-media')).toBeVisible();
    await expect(page.locator('#btn-add-media-from-drawer')).toBeVisible();

    await page.locator('#btn-add-media-from-drawer').click();
    await expect(page.locator('#modal-options')).toBeVisible();
    await expect(page.locator('#collapse-item-body-media')).toBeVisible();
    await expect(page.locator('#media-category')).toHaveValue(/\d+/);

    await page.locator('#btn-close-options').click();
    await expect(page.locator('#modal-options')).toBeHidden();

    await ambientPage.openSettingsDrawer();
    await expect(page.locator('#target-category')).toHaveValue(/\d+/);
    await page.evaluate(() => {
      const btn = document.querySelector<HTMLElement>('#btn-options');
      if (btn) btn.click();
    });
    await expect(page.locator('#modal-options')).toBeVisible();
    await openManagementSection(page, '#collapse-item-heading-media button', 'collapse-item-body-media');
    await expect(page.locator('#media-category')).toHaveValue(/\d+/);
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
    await expect(page.locator('#modal-options')).toBeHidden();

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
