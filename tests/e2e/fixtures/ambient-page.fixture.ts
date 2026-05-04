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
      { timeout: 30_000 }
    );
    // Close the settings drawer so the main UI is accessible
    await this.page.locator('#btn-close-settings').click();
    await this.page.waitForTimeout(300);
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
