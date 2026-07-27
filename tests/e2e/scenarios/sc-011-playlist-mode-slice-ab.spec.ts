import { Page, expect } from '@playwright/test';

import { AmbientPage, test } from '../fixtures/ambient-page.fixture';

const MYPLAYLIST_NAME = 'MyPlaylist.json';

type SeedItem = {
  title: string;
  videoid: string;
  artist?: string;
  desc?: string;
};

function buildMyPlaylist(items: SeedItem[]) {
  return {
    E2E: items.map((item) => ({
      title: item.title,
      videoid: item.videoid,
      artist: item.artist || 'E2E Artist',
      desc: item.desc || '',
      start: '',
      end: '',
    })),
    options: {
      dark: false,
      seek: false,
      shuffle: false,
      fader: false,
      volume: 50,
    },
  };
}

function buildMultiCategoryMyPlaylist(categories: Record<string, SeedItem[]>) {
  const playlist: Record<string, unknown> = {};
  Object.entries(categories).forEach(([categoryName, items]) => {
    playlist[categoryName] = items.map((item) => ({
      title: item.title,
      videoid: item.videoid,
      artist: 'E2E Artist',
      desc: '',
      start: '',
      end: '',
    }));
  });
  playlist.options = {
    dark: false,
    seek: false,
    shuffle: false,
    fader: false,
    volume: 50,
  };
  return playlist;
}

async function seedMyPlaylist(page: Page, items: SeedItem[]): Promise<void> {
  const payload = JSON.stringify(buildMyPlaylist(items));
  await page.addInitScript((playlistJson) => {
    localStorage.clear();
    localStorage.setItem('AmbientMyPlaylist', playlistJson);
  }, payload);
}

async function seedEmptyMyPlaylist(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('AmbientMyPlaylist', JSON.stringify({ E2E: [], options: { dark: false, seek: false, shuffle: false, fader: false, volume: 50 } }));
  });
}

async function seedNamedMyPlaylist(page: Page, payload: Record<string, unknown>): Promise<void> {
  await page.addInitScript((playlistJson) => {
    localStorage.clear();
    localStorage.setItem('AmbientMyPlaylist', playlistJson);
  }, JSON.stringify(payload));
}

async function openModeMenu(page: Page): Promise<void> {
  await page.locator('#btn-playlist-mode').click();
  await expect(page.locator('#playlist-mode-menu')).toBeVisible();
}

async function selectMode(page: Page, mode: 'normal' | 'reorder' | 'delete'): Promise<void> {
  await openModeMenu(page);
  await page.locator(`#playlist-mode-menu .playlist-mode-option[data-mode="${mode}"]`).click();
}

async function selectTargetCategory(page: Page, ambientPage: AmbientPage, label: string): Promise<void> {
  await ambientPage.openSettingsDrawer();
  await page.locator('#target-category').selectOption({ label });
  await page.locator('#target-category').dispatchEvent('change');
  await ambientPage.closeSettingsDrawer();
  await ambientPage.openPlaylistDrawer();
}

async function dragPlaylistItem(page: Page, fromIndex: number, toIndex: number): Promise<void> {
  await page.evaluate(({ sourceIndex, targetIndex }) => {
    const list = document.getElementById('playlist-list-group') as HTMLElement | null;
    if (!list) return;
    const items = Array.from(list.querySelectorAll('a[data-playlist-item]'));
    const source = items[sourceIndex] as HTMLElement | undefined;
    const target = items[targetIndex] as HTMLElement | undefined;
    if (!source || !target || source === target) return;
    if (targetIndex > sourceIndex) {
      list.insertBefore(source, target.nextSibling);
    } else {
      list.insertBefore(source, target);
    }
  }, { sourceIndex: fromIndex, targetIndex: toIndex });
}

async function loadSeededMyPlaylist(page: Page, ambientPage: AmbientPage): Promise<void> {
  await ambientPage.gotoHome();
  await ambientPage.waitForBaseUi();
  await ambientPage.selectPlaylist(MYPLAYLIST_NAME);
  await ambientPage.openPlaylistDrawer();
}

test.describe('SC-011 Playlist mode Slice A/B', () => {
  test.beforeEach(async ({ browserName, page, ambientPage }) => {
    test.skip(browserName !== 'chromium', 'Slice A/B E2E is validated on chromium only.');

    await seedMyPlaylist(page, [
      { title: 'slice-ab-1', videoid: 'dQw4w9WgXcQ', artist: 'E2E Artist Alpha', desc: 'First item description' },
      { title: 'slice-ab-2', videoid: 'gu7T0D50wFk', artist: 'E2E Artist Beta' },
      { title: 'slice-ab-3', videoid: '3JZ_D3ELwOQ', artist: 'E2E Artist Gamma' },
    ]);

    await loadSeededMyPlaylist(page, ambientPage);
    await expect(page.locator('#playlist-list-group a[data-playlist-item]')).toHaveCount(3);
    await expect.poll(async () => page.evaluate(() => {
      const raw = localStorage.getItem('AmbientMyPlaylist');
      return !!raw && raw.includes('slice-ab-1');
    })).toBe(true);
  });

  test('places mode button between label and close button, and keeps dropdown width sufficient', async ({ page }) => {
    const labelBox = await page.locator('#drawer-playlist-label').boundingBox();
    const modeBox = await page.locator('#btn-playlist-mode').boundingBox();
    const closeBox = await page.locator('#btn-close-playlist').boundingBox();

    expect(labelBox).not.toBeNull();
    expect(modeBox).not.toBeNull();
    expect(closeBox).not.toBeNull();

    if (!labelBox || !modeBox || !closeBox) {
      return;
    }

    const labelRight = labelBox.x + labelBox.width;
    const modeCenter = modeBox.x + modeBox.width / 2;
    const closeCenter = closeBox.x + closeBox.width / 2;

    expect(modeCenter).toBeGreaterThan(labelRight);
    expect(modeCenter).toBeLessThan(closeCenter);

    await openModeMenu(page);
    const menuBox = await page.locator('#playlist-mode-menu').boundingBox();
    expect(menuBox).not.toBeNull();
    if (!menuBox) {
      return;
    }

    // 11rem ~= 176px; keep a safety lower-bound for font/rendering variance.
    // 8rem ~= 128px; keep a safety lower-bound for font/rendering variance.
    expect(menuBox.width).toBeGreaterThanOrEqual(110);
  });

  test('renders default playlist template with artist row and opens desc modal without starting playback', async ({ page }) => {
    const firstItem = page.locator('#playlist-list-group a[data-playlist-item]').first();
    await expect(firstItem.locator('.text--playlist-title')).toContainText('slice-ab-1');
    await expect(firstItem.locator('.text--playlist-artist')).toContainText('E2E Artist Alpha');
    await expect(firstItem.locator('[data-playlist-desc-trigger]')).toHaveCount(1);

    await firstItem.locator('[data-playlist-desc-trigger]').click();

    await expect(page.locator('#modal-playlist-desc')).toBeVisible();
    await expect(page.locator('#modal-playlist-desc-title')).toContainText('slice-ab-1');
    await expect(page.locator('#modal-playlist-desc-artist')).toContainText('E2E Artist Alpha');
    await expect(page.locator('#modal-playlist-desc-content')).toContainText('First item description');
    await expect(page.locator('#btn-play')).toBeVisible();
    await expect(page.locator('#btn-pause')).toBeHidden();
    await expect(firstItem.locator('[data-playlist-desc-trigger]')).toHaveClass(/is-active/);

    await page.locator('#btn-close-playlist-desc').click();
    await expect(page.locator('#modal-playlist-desc')).toBeHidden();
  });

  test('locks playback and hides quick add in non-normal mode (Slice A)', async ({ page }) => {
    await expect(page.locator('#btn-add-media-from-playlist')).toBeVisible();
    await expect(page.locator('#btn-play')).toBeVisible();
    await expect(page.locator('#btn-pause')).toBeHidden();

    await selectMode(page, 'delete');
    await expect(page.locator('#playlist-mode-button-label')).toContainText(/削除|Delete/);
    await expect(page.locator('#btn-add-media-from-playlist')).toHaveCount(0);

    await page.locator('#playlist-list-group a[data-playlist-item]').nth(1).click();
    await expect(page.locator('#btn-play')).toBeVisible();
    await expect(page.locator('#btn-pause')).toBeHidden();
  });

  test('disables reorder when All categories is selected', async ({ page }) => {
    await openModeMenu(page);
    await expect(page.locator('#playlist-mode-menu .playlist-mode-option[data-mode="reorder"]')).toBeDisabled();
  });

  test('matches JSON playlist operation availability for the current environment', async ({ page, ambientPage }) => {
    await ambientPage.selectPlaylist('mememori-yt.json');
    await ambientPage.openPlaylistDrawer();

    const isCloud = await page.evaluate(() => Boolean((window as any).AmbientData?.isCloud));
    await expect(page.locator('#playlist-list-group a[data-playlist-item]').first()).toBeVisible();
    if (isCloud) {
      await expect(page.locator('#btn-playlist-mode')).toBeDisabled();
      await expect(page.locator('#btn-add-media-from-playlist')).toHaveCount(0);
    } else {
      await expect(page.locator('#btn-playlist-mode')).toBeEnabled();
      await expect(page.locator('#btn-add-media-from-playlist')).toHaveCount(1);
      await openModeMenu(page);
      await expect(page.locator('#playlist-mode-menu .playlist-mode-option[data-mode="reorder"]')).toBeDisabled();
      await page.locator('#btn-playlist-mode').click();
      await expect(page.locator('#playlist-mode-menu')).toBeHidden();
    }

    await page.locator('#playlist-list-group a[data-playlist-item]').first().click();
    await expect(page.locator('#btn-play')).toBeHidden();
    await expect(page.locator('#btn-pause')).toBeVisible();
  });

  test('disables reorder when the filtered category has one item or fewer', async ({ page, ambientPage, browserName }) => {
    test.skip(browserName !== 'chromium');
    await seedNamedMyPlaylist(page, buildMultiCategoryMyPlaylist({
      Solo: [{ title: 'solo-1', videoid: 'dQw4w9WgXcQ' }],
      Duo: [
        { title: 'duo-1', videoid: 'gu7T0D50wFk' },
        { title: 'duo-2', videoid: '3JZ_D3ELwOQ' },
      ],
    }));
    await loadSeededMyPlaylist(page, ambientPage);
    await selectTargetCategory(page, ambientPage, 'Solo');

    await openModeMenu(page);
    await expect(page.locator('#playlist-mode-menu .playlist-mode-option[data-mode="reorder"]')).toBeDisabled();
  });

  test('reorder mode applies new order and persists to localStorage (Slice C)', async ({ page, ambientPage }) => {
    await selectTargetCategory(page, ambientPage, 'E2E');
    await expect(page.locator('#playlist-list-group a[data-playlist-item]')).toHaveCount(3);

    await selectMode(page, 'reorder');
    await expect(page.locator('#playlist-mode-button-label')).toContainText(/並び替え|Reorder/);
    await expect(page.locator('#btn-add-media-from-playlist')).toHaveCount(0);
    await expect(page.locator('.playlist-reorder-handle')).toHaveCount(3);

    await dragPlaylistItem(page, 0, 2);
    await page.locator('#btn-playlist-mode').click();
    await expect(page.locator('#modal-playlist-confirm')).toBeVisible();
    await page.locator('#btn-playlist-confirm-apply').click();

    await expect(page.locator('#playlist-mode-button-label')).toContainText(/モード変更|Mode Change/);
    await expect.poll(async () => page.locator('#playlist-list-group a[data-playlist-item]').allTextContents()).toEqual([
      expect.stringContaining('slice-ab-2'),
      expect.stringContaining('slice-ab-3'),
      expect.stringContaining('slice-ab-1'),
    ]);
    await expect.poll(async () => page.evaluate(() => {
      const raw = localStorage.getItem('AmbientMyPlaylist');
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Record<string, Array<{ title: string }>>;
      return (parsed.E2E || []).map((item) => item.title);
    })).toEqual(['slice-ab-2', 'slice-ab-3', 'slice-ab-1']);

  });

  test('reorder mode discards working order on cancel (Slice C)', async ({ page, ambientPage }) => {
    await selectTargetCategory(page, ambientPage, 'E2E');
    await selectMode(page, 'reorder');

    await dragPlaylistItem(page, 0, 2);
    await page.locator('#btn-playlist-mode').click();
    await expect(page.locator('#modal-playlist-confirm')).toBeVisible();
    await page.locator('#btn-playlist-confirm-cancel').click();

    await expect(page.locator('#playlist-mode-button-label')).toContainText(/並び替え|Reorder/);
    await page.locator('#btn-playlist-mode').click();
    await expect(page.locator('#playlist-mode-button-label')).toContainText(/モード変更|Mode Change/);
    await expect.poll(async () => page.locator('#playlist-list-group a[data-playlist-item]').allTextContents()).toEqual([
      expect.stringContaining('slice-ab-1'),
      expect.stringContaining('slice-ab-2'),
      expect.stringContaining('slice-ab-3'),
    ]);
  });

  test('shows delete confirm modal and keeps selection on outside-click cancel (Slice B)', async ({ page }) => {
    await selectMode(page, 'delete');

    const firstItem = page.locator('#playlist-list-group a[data-playlist-item]').first();
    await firstItem.locator('img').evaluate((img) => {
      img.setAttribute('data-e2e-stable-thumb', '1');
    });
    await firstItem.click();

    await expect(firstItem.locator('span[data-delete-selector]')).toHaveClass(/bg-red-500/);
    await expect(firstItem.locator('img')).toHaveAttribute('data-e2e-stable-thumb', '1');

    await firstItem.click();
    await expect(firstItem.locator('span[data-delete-selector]')).not.toHaveClass(/bg-red-500/);
    await expect(firstItem.locator('img')).toHaveAttribute('data-e2e-stable-thumb', '1');

    await firstItem.click();
    await expect(firstItem.locator('span[data-delete-selector]')).toHaveClass(/bg-red-500/);

    // In delete mode with selections, clicking the mode button shows the confirm modal directly.
    await page.locator('#btn-playlist-mode').click();
    await expect(page.locator('#modal-playlist-confirm')).toBeVisible();
    await expect(page.locator('#modal-playlist-confirm-title')).toContainText(/選択したアイテムを削除しますか\?|Delete selected items\?/);

    await page.mouse.click(8, 8);

    await expect(page.locator('#modal-playlist-confirm')).toBeHidden();
    await expect(page.locator('#playlist-mode-button-label')).toContainText(/削除|Delete/);
    await expect(page.locator('#playlist-list-group a[data-playlist-item]')).toHaveCount(3);
    await expect(firstItem.locator('span[data-delete-selector]')).toHaveClass(/bg-red-500/);
  });

  test('applies delete selection and saves the reduced playlist view (Slice B)', async ({ page }) => {
    await selectMode(page, 'delete');

    const items = page.locator('#playlist-list-group a[data-playlist-item]');
    await items.nth(0).click();
    await items.nth(1).click();

    // In delete mode with selections, clicking the mode button shows the confirm modal directly.
    await page.locator('#btn-playlist-mode').click();
    await expect(page.locator('#modal-playlist-confirm')).toBeVisible();

    await page.locator('#btn-playlist-confirm-apply').click();

    await expect(page.locator('#modal-playlist-confirm')).toBeHidden();
    // After applying, mode returns to normal; button label shows "Mode Change".
    await expect(page.locator('#playlist-mode-button-label')).toContainText(/モード変更|Mode Change/);
    await expect(page.locator('#playlist-list-group a[data-playlist-item]')).toHaveCount(1);
    await expect(page.locator('#playlist-list-group')).toContainText('slice-ab-3');
    await expect(page.locator('#alert-notification')).toContainText(/saved successfully|保存/i);
  });

  test('opens and closes media management from playlist quick add without leaving modal backdrop', async ({ page }) => {
    await page.locator('#btn-add-media-from-playlist').click();

    await expect(page.locator('#modal-options')).toBeVisible();
    await page.waitForFunction(() => {
      const panel = document.getElementById('collapse-item-body-media');
      return panel ? !panel.classList.contains('hidden') : false;
    }, { timeout: 8_000 });
    await expect(page.locator('#collapse-item-body-media')).toBeVisible();

    await page.locator('#btn-close-options').click();
    await expect(page.locator('#modal-options')).toBeHidden();
    await expect(page.locator('div[modal-backdrop]')).toHaveCount(0);
    await expect(page.locator('#btn-playlist-mode')).toBeEnabled();
  });

  test('playlist quick add inherits the active category filter', async ({ page, ambientPage }) => {
    await seedNamedMyPlaylist(page, buildMultiCategoryMyPlaylist({
      Alpha: [{ title: 'alpha-1', videoid: 'dQw4w9WgXcQ' }],
      Beta: [
        { title: 'beta-1', videoid: 'gu7T0D50wFk' },
        { title: 'beta-2', videoid: '3JZ_D3ELwOQ' },
      ],
    }));

    await loadSeededMyPlaylist(page, ambientPage);
    await selectTargetCategory(page, ambientPage, 'Beta');

    await expect(page.locator('#btn-add-media-from-playlist')).toBeVisible();
    await page.locator('#btn-add-media-from-playlist').click();

    await expect(page.locator('#modal-options')).toBeVisible();
    await expect(page.locator('#collapse-item-body-media')).toBeVisible();
    await expect.poll(async () => {
      return page.evaluate(() => {
        const select = document.getElementById('media-category') as HTMLSelectElement | null;
        return select?.selectedOptions[0]?.textContent?.trim() || '';
      });
    }, { timeout: 10_000 }).toBe('Beta');
  });

  test('reopens options from bottom menu after backdrop close', async ({ page }) => {
    await page.locator('#btn-add-media-from-playlist').click();
    await expect(page.locator('#modal-options')).toBeVisible();

    await page.locator('#modal-options').click({ position: { x: 8, y: 8 } });
    await expect(page.locator('#modal-options')).toBeHidden();

    await page.locator('#btn-options').click();
    await expect(page.locator('#modal-options')).toBeVisible();

    await page.locator('#btn-close-options').click();
    await expect(page.locator('#modal-options')).toBeHidden();
    await expect(page.locator('div[modal-backdrop]')).toHaveCount(0);
  });
});

test.describe('SC-011 No-media register button', () => {
  test.beforeEach(async ({ browserName, page, ambientPage }) => {
    test.skip(browserName !== 'chromium', 'Register-media E2E is validated on chromium only.');

    await seedEmptyMyPlaylist(page);

    await loadSeededMyPlaylist(page, ambientPage);
  });

  test('clicking Register media button opens Options modal with Media Management expanded', async ({ page, ambientPage }) => {
    // Verify no-media state
    await expect(page.locator('#no-media')).toBeVisible();
    await expect(page.locator('#btn-add-media-from-drawer')).toBeVisible();
    // Mode button should be disabled when playlist is empty
    await expect(page.locator('#btn-playlist-mode')).toBeDisabled();

    // Click the register button
    await page.evaluate(() => {
      const btn = document.getElementById('btn-add-media-from-drawer') as HTMLElement | null;
      if (btn) btn.click();
    });

    // Options modal should open
    await page.waitForFunction(() => {
      const modal = document.getElementById('modal-options');
      return modal ? !modal.classList.contains('hidden') : false;
    }, { timeout: 8_000 });
    await expect(page.locator('#modal-options')).toBeVisible();

    // Media Management accordion should be expanded
    await page.waitForFunction(() => {
      const panel = document.getElementById('collapse-item-body-media');
      return panel ? !panel.classList.contains('hidden') : false;
    }, { timeout: 8_000 });
    await expect(page.locator('#collapse-item-body-media')).toBeVisible();

    await page.locator('#btn-close-options').click();
    await expect(page.locator('#modal-options')).toBeHidden();
    await expect(page.locator('div[modal-backdrop]')).toHaveCount(0);
    await expect(page.locator('#btn-playlist-mode')).toBeDisabled();
  });

  test('reopens options after backdrop close from no-media register button', async ({ page, ambientPage }) => {
    await page.locator('#btn-add-media-from-drawer').click();
    await expect(page.locator('#modal-options')).toBeVisible();

    await page.locator('#modal-options').click({ position: { x: 8, y: 8 } });
    await expect(page.locator('#modal-options')).toBeHidden();

    await page.locator('#btn-options').click();
    await expect(page.locator('#modal-options')).toBeVisible();

    await page.locator('#btn-close-options').click();
    await expect(page.locator('#modal-options')).toBeHidden();

    await ambientPage.openPlaylistDrawer();
    await page.locator('#btn-add-media-from-drawer').click();
    await expect(page.locator('#modal-options')).toBeVisible();
  });
});
