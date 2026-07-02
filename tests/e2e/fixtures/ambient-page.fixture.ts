import { expect, Page, test as base } from '@playwright/test';

export class AmbientPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async gotoHome(): Promise<void> {
    await this.page.goto('./');
  }

  async waitForBaseUi(): Promise<void> {
    await expect(this.page.locator('#btn-play')).toBeVisible();
    await expect(this.page.locator('#playlist-list-group')).toBeVisible();
  }

  async waitForPlaylistReady(): Promise<void> {
    await this.page.waitForFunction(() => {
      const list = document.querySelectorAll('#playlist-list-group a[data-playlist-item]').length;
      const noMedia = document.querySelector('#no-media');
      const isNoMediaVisible = !!(noMedia && !noMedia.classList.contains('hidden'));
      return list > 0 || isNoMediaVisible;
    });
  }

  private async isPlaylistDrawerOpen(): Promise<boolean> {
    return this.page.evaluate(() => {
      const drawer = document.getElementById('drawer-playlist');
      if (!drawer) return false;
      const hiddenByClass = drawer.classList.contains('-translate-x-full');
      const ariaModal = drawer.getAttribute('aria-modal') === 'true';
      return ariaModal || !hiddenByClass;
    });
  }

  private async isSettingsDrawerOpen(): Promise<boolean> {
    return this.page.evaluate(() => {
      const drawer = document.getElementById('drawer-settings');
      if (!drawer) return false;
      const hiddenByClass = drawer.classList.contains('translate-x-full');
      const ariaModal = drawer.getAttribute('aria-modal') === 'true';
      return ariaModal || !hiddenByClass;
    });
  }

  async openPlaylistDrawer(): Promise<void> {
    const shouldCloseSettingsDrawer = await this.page.evaluate(() => {
      const isFullUi = window.innerWidth >= 1282;
      const settingsDrawer = document.getElementById('drawer-settings');
      const isSettingsOpen = !settingsDrawer?.classList.contains('translate-x-full');
      return !isFullUi && isSettingsOpen;
    });
    if (shouldCloseSettingsDrawer) {
      await this.closeSettingsDrawer();
    }

    // If already open (full UI mode: width >= 1282), skip
    const isOpen = await this.isPlaylistDrawerOpen();
    if (!isOpen) {
      for (let attempt = 0; attempt < 3; attempt++) {
        await this.page.evaluate(() => {
          const btn = document.getElementById('btn-playlist') as HTMLElement | null;
          if (btn) btn.click();
        });
        try {
          await this.page.waitForFunction(
            () => {
              const drawer = document.getElementById('drawer-playlist');
              if (!drawer) return false;
              const hiddenByClass = drawer.classList.contains('-translate-x-full');
              const ariaModal = drawer.getAttribute('aria-modal') === 'true';
              return ariaModal || !hiddenByClass;
            },
            { timeout: 5_000 }
          );
          break;
        } catch (error) {
          if (attempt === 2) {
            throw error;
          }
        }
      }
    } else {
      await this.page.waitForFunction(
        () => {
          const drawer = document.getElementById('drawer-playlist');
          if (!drawer) return false;
          const hiddenByClass = drawer.classList.contains('-translate-x-full');
          const ariaModal = drawer.getAttribute('aria-modal') === 'true';
          return ariaModal || !hiddenByClass;
        }
      );
    }
    // Wait until playlist items are visible OR the no-media notice is shown (empty playlist).
    await this.page.waitForFunction(() => {
      const items = document.querySelectorAll('#playlist-list-group a[data-playlist-item]').length;
      const noMedia = document.querySelector<HTMLElement>('#no-media');
      const isNoMediaVisible = !!(noMedia && !noMedia.classList.contains('hidden'));
      return items > 0 || isNoMediaVisible;
    });
  }

  async closePlaylistDrawer(): Promise<void> {
    const shouldClose = await this.page.evaluate(() => {
      const drawer = document.getElementById('drawer-playlist');
      const isOpen = !!drawer && (drawer.getAttribute('aria-modal') === 'true' || !drawer.classList.contains('-translate-x-full'));
      const isFullUi = window.innerWidth >= 1282;
      return isOpen && !isFullUi;
    });
    if (shouldClose) {
      await this.page.evaluate(() => {
        const btn = document.getElementById('btn-close-playlist') as HTMLElement | null;
        if (btn) btn.click();
      });
      await this.page.waitForFunction(
        () => {
          const drawer = document.getElementById('drawer-playlist');
          if (!drawer) return true;
          return drawer.getAttribute('aria-modal') !== 'true' && drawer.classList.contains('-translate-x-full');
        }
      );
    }
  }

  async openSettingsDrawer(): Promise<void> {
    const shouldClosePlaylistDrawer = await this.page.evaluate(() => {
      const isFullUi = window.innerWidth >= 1282;
      const playlistDrawer = document.getElementById('drawer-playlist');
      const isPlaylistOpen = !playlistDrawer?.classList.contains('-translate-x-full');
      return !isFullUi && isPlaylistOpen;
    });
    if (shouldClosePlaylistDrawer) {
      await this.closePlaylistDrawer();
    }

    // Check if already open before clicking to avoid toggling a drawer that is already visible.
    const isOpen = await this.isSettingsDrawerOpen();
    if (!isOpen) {
      for (let attempt = 0; attempt < 3; attempt++) {
        await this.page.evaluate(() => {
          const btn = document.getElementById('btn-settings') as HTMLElement | null;
          if (btn) btn.click();
        });
        try {
          await this.page.waitForFunction(
            () => {
              const drawer = document.getElementById('drawer-settings');
              if (!drawer) return false;
              const hiddenByClass = drawer.classList.contains('translate-x-full');
              const ariaModal = drawer.getAttribute('aria-modal') === 'true';
              return ariaModal || !hiddenByClass;
            },
            { timeout: 5_000 }
          );
          break;
        } catch (error) {
          if (attempt === 2) {
            throw error;
          }
        }
      }
    } else {
      await this.page.waitForFunction(
        () => {
          const drawer = document.getElementById('drawer-settings');
          if (!drawer) return false;
          const hiddenByClass = drawer.classList.contains('translate-x-full');
          const ariaModal = drawer.getAttribute('aria-modal') === 'true';
          return ariaModal || !hiddenByClass;
        }
      );
    }
  }

  async closeSettingsDrawer(): Promise<void> {
    const shouldClose = await this.page.evaluate(() => {
      const drawer = document.getElementById('drawer-settings');
      const isOpen = !!drawer && (drawer.getAttribute('aria-modal') === 'true' || !drawer.classList.contains('translate-x-full'));
      const isFullUi = window.innerWidth >= 1282;
      return isOpen && !isFullUi;
    });
    if (!shouldClose) {
      return;
    }

    // Use DOM click to avoid Playwright viewport click failures on mobile projects.
    await this.page.evaluate(() => {
      const closeBtn = document.getElementById('btn-close-settings') as HTMLElement | null;
      if (closeBtn) {
        closeBtn.click();
      }
    });

    const stillOpen = await this.isSettingsDrawerOpen();
    if (stillOpen) {
      await this.page.evaluate(() => {
        const settingsBtn = document.getElementById('btn-settings') as HTMLElement | null;
        if (settingsBtn) {
          settingsBtn.click();
        }
      });
    }

    await this.page.waitForFunction(
      () => {
        const drawer = document.getElementById('drawer-settings');
        if (!drawer) return true;
        return drawer.getAttribute('aria-modal') !== 'true' && drawer.classList.contains('translate-x-full');
      }
    );
  }

  /**
   * Open settings drawer, select a playlist by value, then wait for items to load.
   */
  async selectPlaylist(value: string): Promise<void> {
    await this.openSettingsDrawer();
    await this.page.locator('#current-playlist').selectOption(value);
    // Wait until the playlist is ready, even if it is empty.
    await this.page.waitForFunction(
      () => {
        const itemCount = document.querySelectorAll('#playlist-list-group a[data-playlist-item]').length;
        const noMedia = document.querySelector<HTMLElement>('#no-media');
        const isNoMediaVisible = !!(noMedia && !noMedia.classList.contains('hidden'));
        return itemCount > 0 || isNoMediaVisible;
      },
      { timeout: 30_000 }
    );
    // Close the settings drawer so the main UI is accessible
    await this.closeSettingsDrawer();
  }

  async getYouTubeSignalSeq(): Promise<number> {
    const seq = await this.page.locator('body').getAttribute('data-yt-seq');
    const parsed = Number(seq ?? '0');
    return Number.isFinite(parsed) ? parsed : 0;
  }

  /**
   * Wait until YouTube API script is available and DOM signal attributes are initialised.
   */
  async waitForYouTubeApi(): Promise<void> {
    await this.page.waitForFunction(
      () => typeof (window as any).YT !== 'undefined' && typeof (window as any).YT.Player === 'function',
      { timeout: 20_000 }
    );
    await this.page.waitForFunction(() => {
      const body = document.body;
      if (!body) return false;
      return body.hasAttribute('data-yt-phase') && body.hasAttribute('data-yt-seq') && body.hasAttribute('data-yt-error');
    }, { timeout: 20_000 });
  }

  /**
   * Wait for a specific YouTube phase by DOM signal attributes.
   */
  async waitForYouTubePhase(phases: string | string[], minSeq = 0): Promise<void> {
    const expected = Array.isArray(phases) ? phases : [phases];
    await this.page.waitForFunction(
      ({ expectedPhases, expectedSeq }) => {
        const phase = document.body.getAttribute('data-yt-phase') || '';
        const seq = Number(document.body.getAttribute('data-yt-seq') || '0');
        return expectedPhases.includes(phase) && seq >= expectedSeq;
      },
      { expectedPhases: expected, expectedSeq: minSeq },
      { timeout: 20_000 }
    );
  }

  /**
   * Wait for the YouTube player instance to be fully ready via DOM signal.
   */
  async waitForYouTubePlayerReady(minSeq = 0): Promise<void> {
    await this.waitForYouTubePhase(['player_ready', 'playing', 'paused'], minSeq);
  }
}

type AmbientFixtures = {
  ambientPage: AmbientPage;
};

export const test = base.extend<AmbientFixtures>({
  ambientPage: async ({ page }, use) => {
    await use(new AmbientPage(page));
  },
});

export { expect };
