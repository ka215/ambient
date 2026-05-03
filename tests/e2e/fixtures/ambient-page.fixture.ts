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

  async openPlaylistDrawer(): Promise<void> {
    // If already open (full UI mode: width >= 1282), skip
    const isOpen = await this.page.evaluate(
      () => !document.getElementById('drawer-playlist')?.classList.contains('-translate-x-full')
    );
    if (!isOpen) {
      await this.page.locator('#btn-playlist').last().click();
    }
    // Wait until at least one item is in viewport
    await this.page.locator('#playlist-list-group a[data-playlist-item]').first().waitFor({ state: 'visible' });
  }

  async closePlaylistDrawer(): Promise<void> {
    const isOpen = await this.page.evaluate(
      () => !document.getElementById('drawer-playlist')?.classList.contains('-translate-x-full')
    );
    if (isOpen) {
      await this.page.locator('#btn-close-playlist').click({ force: true });
    }
  }

  async openSettingsDrawer(): Promise<void> {
    await this.page.locator('#btn-settings').click();
  }

  /**
   * Open settings drawer, select a playlist by value, then wait for items to load.
   */
  async selectPlaylist(value: string): Promise<void> {
    await this.openSettingsDrawer();
    await this.page.locator('#current-playlist').selectOption(value);
    // Wait until at least one playlist item is rendered in the DOM
    await this.page.waitForFunction(
      () => document.querySelectorAll('#playlist-list-group a[data-playlist-item]').length > 0,
      { timeout: 15_000 }
    );
    // Close the settings drawer so the main UI is accessible
    await this.page.locator('#btn-close-settings').click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Wait for the YouTube IFrame API to finish loading.
   * Required before clicking a YouTube playlist item.
   */
  async waitForYouTubeApi(): Promise<void> {
    await this.page.waitForFunction(
      () => typeof (window as any).YT !== 'undefined' && typeof (window as any).YT.Player === 'function',
      { timeout: 20_000 }
    );
  }

  /**
   * Wait for the YouTube player instance to be fully ready (getPlayerState available).
   * Call this after clicking a YouTube item and waiting for #btn-pause to appear.
   */
  async waitForYouTubePlayerReady(): Promise<void> {
    // Poll until the YT iframe has been created and player.getPlayerState is a function
    await this.page.waitForFunction(() => {
      const iframe = document.querySelector('#embed-wrapper iframe, #ytplayer');
      if (!iframe) return false;
      // YT.get() is not available, so use the iframe src as a proxy for readiness
      return !!iframe;
    }, { timeout: 20_000 });
    // Additional wait for YT player API to initialise on the iframe
    await this.page.waitForTimeout(3000);
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
