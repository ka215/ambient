import { test, expect } from '../fixtures/ambient-page.fixture';

test.describe('SC-009 Full-window and menu-collapse controls', () => {
  test('keeps full-window controls synchronized and preserves drawer operability', async ({ ambientPage, page, browserName }) => {
    test.skip(browserName !== 'chromium', 'This scenario targets desktop bottom-menu and drawer synchronization.');

    // Arrange
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.selectPlaylist('mememori-yt.json');
    await ambientPage.waitForYouTubeApi();

    const seqBeforePlay = await ambientPage.getYouTubeSignalSeq();
    await ambientPage.openPlaylistDrawer();
    await page.locator('#playlist-list-group a[data-playlist-item]').first().click();
    await ambientPage.closePlaylistDrawer();
    await ambientPage.waitForYouTubePhase(['player_ready', 'playing'], seqBeforePlay + 1);

    // Wait for caption render before asserting hidden behavior.
    await page.locator('#media-caption .marquee-inner').first().waitFor({ state: 'visible' });

    // Act: toggle full-window from bottom menu.
    await page.locator('#btn-window-full').click();

    // Assert: full-window ON and controls synchronized.
    await expect(page.locator('body')).toHaveClass(/amp-full-window/);
    await expect(page.locator('#btn-window-full')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#toggle-window-full input[type="checkbox"]')).toBeChecked();
    await expect(page.locator('#carousel-container')).toBeHidden();
    await expect(page.locator('#media-caption')).toBeHidden();

    await page.locator('#btn-menu-collapse').click();
    await expect(page.locator('#menu-container')).toHaveClass(/menu-minimized/);
    await expect(page.locator('#media-caption')).toBeVisible();
    await expect(page.locator('#media-caption .media-caption-title')).toBeVisible();
    await page.locator('#btn-menu-collapse').click();
    await expect(page.locator('#menu-container')).not.toHaveClass(/menu-minimized/);
    await expect(page.locator('#media-caption')).toBeHidden();

    await expect.poll(async () => {
      return page.evaluate(() => {
        const iframe = document.querySelector<HTMLIFrameElement>('#embed-wrapper iframe');
        const menu = document.getElementById('menu-container');
        if (!iframe || !menu) return false;
        const viewportHeight = Math.round(window.visualViewport?.height || window.innerHeight);
        const menuHeight = Math.ceil(menu.getBoundingClientRect().height);
        const iframeRect = iframe.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();
        const expectedMaxHeight = menuRect.top;
        const aspect = iframeRect.width / iframeRect.height;
        return iframeRect.height <= expectedMaxHeight + 1 &&
          Math.abs(menuRect.bottom - viewportHeight) <= 1 &&
          iframeRect.bottom <= menuRect.top + 1 &&
          Math.abs(aspect - (16 / 9)) < 0.02;
      });
    }).toBe(true);

    // Drawers must remain overlay-capable and operable in full-window mode.
    await page.locator('#btn-playlist').click();
    await expect(page.locator('#drawer-playlist')).not.toHaveClass(/-translate-x-full/);
    await page.locator('#btn-close-playlist').click();
    await expect(page.locator('#drawer-playlist')).toHaveClass(/-translate-x-full/);

    await ambientPage.openSettingsDrawer();
    await expect(page.locator('#drawer-settings')).not.toHaveClass(/-translate-x-full/);

    // Act: toggle OFF from right drawer.
    await page.locator('#toggle-window-full').click();

    // Assert: controls synchronized to OFF.
    await expect(page.locator('body')).not.toHaveClass(/amp-full-window/);
    await expect(page.locator('#btn-window-full')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#toggle-window-full input[type="checkbox"]')).not.toBeChecked();

    // Act + Assert: toggle ON again from right drawer and sync back.
    await page.locator('#toggle-window-full').click();
    await expect(page.locator('body')).toHaveClass(/amp-full-window/);
    await expect(page.locator('#btn-window-full')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#toggle-window-full input[type="checkbox"]')).toBeChecked();
  });

  test('minimizes and restores bottom menu with menu-collapse control', async ({ ambientPage, page }) => {
    // Arrange
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();

    // Act: collapse bottom menu.
    await page.evaluate(() => {
      const btn = document.getElementById('btn-menu-collapse') as HTMLElement | null;
      if (btn) btn.click();
    });

    // Assert: minimized state and icon/button state.
    await expect(page.locator('#menu-container')).toHaveClass(/menu-minimized/);
    await expect(page.locator('#btn-menu-collapse')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#btn-settings')).toBeHidden();

    // Act: restore bottom menu.
    await page.evaluate(() => {
      const btn = document.getElementById('btn-menu-collapse') as HTMLElement | null;
      if (btn) btn.click();
    });

    // Assert: restored state.
    await expect(page.locator('#menu-container')).not.toHaveClass(/menu-minimized/);
    await expect(page.locator('#btn-menu-collapse')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#btn-settings')).toBeVisible();
  });
});

test.describe('SC-009-mobile Full-window on mobile viewports', () => {
  test.beforeEach(async ({ page }) => {
    const vw = page.viewportSize()?.width ?? 1400;
    test.skip(vw >= 1282, 'Desktop viewport – skipping mobile full-window test.');
  });

  test('full-window ON from bottom menu auto-closes open left drawer', async ({ ambientPage, page }) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();

    // Open left drawer on mobile.
    await page.locator('#btn-playlist').click();
    await expect(page.locator('#drawer-playlist')).not.toHaveClass(/-translate-x-full/);

    // Act: toggle full-window ON from bottom menu button.
    await page.evaluate(() => {
      const btn = document.getElementById('btn-window-full') as HTMLElement | null;
      if (btn) btn.click();
    });

    // Assert: full-window ON and left drawer auto-closed.
    await expect(page.locator('body')).toHaveClass(/amp-full-window/);
    await expect(page.locator('#drawer-playlist')).toHaveClass(/-translate-x-full/);
    await expect(page.locator('#carousel-container')).toBeHidden();
    await expect(page.locator('#btn-window-full')).toHaveAttribute('aria-pressed', 'true');

    // Act: toggle OFF.
    await page.evaluate(() => {
      const btn = document.getElementById('btn-window-full') as HTMLElement | null;
      if (btn) btn.click();
    });
    await expect(page.locator('body')).not.toHaveClass(/amp-full-window/);
  });

  test('full-window ON from bottom menu auto-closes open right drawer', async ({ ambientPage, page }) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();

    // Open right drawer on mobile.
    await ambientPage.closePlaylistDrawer();
    for (let attempt = 0; attempt < 3; attempt++) {
      await page.evaluate(() => {
        const playlistClose = document.getElementById('btn-close-playlist') as HTMLElement | null;
        if (playlistClose) {
          playlistClose.click();
        }
        const btn = document.getElementById('btn-settings') as HTMLElement | null;
        if (btn) btn.click();
      });
      try {
        await page.waitForFunction(() => {
          const drawer = document.getElementById('drawer-settings');
          if (!drawer) return false;
          return drawer.getAttribute('aria-modal') === 'true' || !drawer.classList.contains('translate-x-full');
        }, { timeout: 5_000 });
        break;
      } catch (error) {
        if (attempt === 2) {
          throw error;
        }
      }
    }
    await expect(page.locator('#drawer-settings')).not.toHaveClass(/translate-x-full/);

    // Act: toggle full-window ON from bottom menu button (NOT from the drawer toggle).
    await page.evaluate(() => {
      const btn = document.getElementById('btn-window-full') as HTMLElement | null;
      if (btn) btn.click();
    });

    // Assert: full-window ON and right drawer auto-closed.
    await expect(page.locator('body')).toHaveClass(/amp-full-window/);
    await expect(page.locator('#drawer-settings')).toHaveClass(/translate-x-full/);
    await expect(page.locator('#btn-window-full')).toHaveAttribute('aria-pressed', 'true');

    // Cleanup.
    await page.evaluate(() => {
      const btn = document.getElementById('btn-window-full') as HTMLElement | null;
      if (btn) btn.click();
    });
    await expect(page.locator('body')).not.toHaveClass(/amp-full-window/);
  });

  test('full-window ON from right drawer toggle does NOT auto-close drawer', async ({ ambientPage, page }) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();

    // Open right drawer.
    await ambientPage.openSettingsDrawer();

    // Act: toggle full-window from inside the right drawer (not the bottom menu button).
    await page.locator('#toggle-window-full').click();

    // Assert: full-window ON and controls synchronized.
    await expect(page.locator('body')).toHaveClass(/amp-full-window/);
    await expect(page.locator('#btn-window-full')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#toggle-window-full input[type="checkbox"]')).toBeChecked();

    // Cleanup: toggle OFF.
    await page.locator('#toggle-window-full').click();
    await expect(page.locator('body')).not.toHaveClass(/amp-full-window/);
  });

  test('carousel and caption are hidden in full-window mode on mobile', async ({ ambientPage, page }) => {
    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();

    // Toggle full-window ON.
    await page.locator('#btn-window-full').click();
    await expect(page.locator('body')).toHaveClass(/amp-full-window/);
    await expect(page.locator('#carousel-container')).toBeHidden();
    await expect(page.locator('#media-caption')).toBeHidden();

    // Toggle OFF – elements should be visible again.
    await page.locator('#btn-window-full').click();
    await expect(page.locator('body')).not.toHaveClass(/amp-full-window/);
    await expect(page.locator('#carousel-container')).toBeVisible();
  });
});
