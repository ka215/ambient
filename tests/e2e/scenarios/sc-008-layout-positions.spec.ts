import fs from 'node:fs';
import path from 'node:path';

import { test, expect } from '../fixtures/ambient-page.fixture';
import { E2E_PLAYLIST_NAME, installE2ePlaylistFixture, removeE2ePlaylistFixture } from '../utils/playlist-fixtures';

function ensureSnapshotDir(): string {
  const dir = path.resolve(process.cwd(), 'logs', 'playwright-snapshots');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

test.describe('SC-008 Layout positioning checks', () => {
  test.beforeEach(() => {
    installE2ePlaylistFixture();
  });

  test.afterEach(() => {
    removeE2ePlaylistFixture();
  });

  test('carousel, bottom menu, and drawer toggle keep expected positions', async ({ ambientPage, page }) => {
    const snapshotDir = ensureSnapshotDir();
    const isMobileViewport = (page.viewportSize()?.width ?? 1400) < 1282;

    if (isMobileViewport) {
      test.setTimeout(90_000);
    }

    const captureSnapshot = async (name: string): Promise<void> => {
      // On mobile projects, full-page captures are expensive and can cause flaky timeouts.
      if (isMobileViewport && (name === 'sc-008-toggle-on.png' || name === 'sc-008-accordion-caret.png')) {
        return;
      }
      await page.screenshot({
        path: path.join(snapshotDir, name),
        fullPage: !isMobileViewport,
      });
    };

    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.selectPlaylist(E2E_PLAYLIST_NAME);

    await ambientPage.openPlaylistDrawer();
    await page.locator('#playlist-list-group a[data-playlist-item]').first().click();
    await ambientPage.closePlaylistDrawer();

    await page.waitForTimeout(800);

    const carouselMetrics = await page.evaluate(() => {
      const wrapper = document.querySelector<HTMLElement>('#carousel-wrapper');
      const img = document.querySelector<HTMLElement>('#carousel-wrapper [data-carousel-item]:not(.hidden) img');
      if (!wrapper || !img) return null;
      const w = wrapper.getBoundingClientRect();
      const i = img.getBoundingClientRect();
      return {
        wrapperCx: w.left + w.width / 2,
        wrapperCy: w.top + w.height / 2,
        imageCx: i.left + i.width / 2,
        imageCy: i.top + i.height / 2,
      };
    });

    expect(carouselMetrics).not.toBeNull();
    if (carouselMetrics) {
      expect(Math.abs(carouselMetrics.wrapperCx - carouselMetrics.imageCx)).toBeLessThanOrEqual(6);
      expect(Math.abs(carouselMetrics.wrapperCy - carouselMetrics.imageCy)).toBeLessThanOrEqual(6);
    }

    await captureSnapshot('sc-008-carousel-centered.png');

    const menuMetrics = await page.evaluate(() => {
      const menu = document.getElementById('menu-container');
      if (!menu) return null;
      const rect = menu.getBoundingClientRect();
      const menuCenter = rect.left + rect.width / 2;
      const viewportCenter = window.innerWidth / 2;
      return { menuCenter, viewportCenter, diff: Math.abs(menuCenter - viewportCenter) };
    });

    expect(menuMetrics).not.toBeNull();
    if (menuMetrics) {
      expect(menuMetrics.diff).toBeLessThanOrEqual(4);
    }

    await captureSnapshot('sc-008-menu-centered.png');

    await ambientPage.openSettingsDrawer();
    await page.locator('#toggle-loop').click();

    const toggleMetrics = await page.evaluate(() => {
      const track = document.querySelector<HTMLElement>('#toggle-loop > div');
      if (!track) return null;
      const style = getComputedStyle(track, '::after');
      const width = Number.parseFloat(style.width || '0');
      const left = Number.parseFloat(style.left || '0');
      const transformX = (() => {
        const t = style.transform || 'none';
        if (!t || t === 'none') return 0;
        const m = t.match(/matrix\(([^)]+)\)/);
        if (!m || !m[1]) return 0;
        const p = m[1].split(',').map((v) => Number(v.trim()));
        return Number.isFinite(p[4]) ? p[4] : 0;
      })();
      const knobLeft = left + transformX;
      const knobRight = knobLeft + width;
      const trackWidth = track.getBoundingClientRect().width;
      return { knobLeft, knobRight, trackWidth };
    });

    expect(toggleMetrics).not.toBeNull();
    if (toggleMetrics) {
      expect(toggleMetrics.knobLeft).toBeGreaterThanOrEqual(0);
      expect(toggleMetrics.knobRight).toBeLessThanOrEqual(toggleMetrics.trackWidth + 0.8);
    }

    await captureSnapshot('sc-008-toggle-on.png');

    await ambientPage.closeSettingsDrawer();
    await page.evaluate(() => {
      const btn = document.getElementById('btn-options') as HTMLElement | null;
      if (btn) btn.click();
    });
    await page.waitForFunction(() => {
      const modal = document.getElementById('modal-options');
      return !!modal && !modal.classList.contains('hidden');
    });

    const caretCollapsed = await page.evaluate(() => {
      const button = document.querySelector<HTMLElement>('#collapse-item-heading-media button');
      const caret = button?.querySelector('.accordion-caret');
      if (!button || !caret) return null;
      const caretDown = caret.querySelector<HTMLElement>('.caret-down');
      const caretUp = caret.querySelector<HTMLElement>('.caret-up');
      return {
        expanded: button.getAttribute('aria-expanded'),
        caretDownDisplay: caretDown ? getComputedStyle(caretDown).display : null,
        caretUpDisplay: caretUp ? getComputedStyle(caretUp).display : null,
      };
    });

    expect(caretCollapsed).not.toBeNull();
    if (caretCollapsed) {
      expect(caretCollapsed.expanded).toBe('false');
      expect(caretCollapsed.caretDownDisplay).not.toBe('none');
      expect(caretCollapsed.caretUpDisplay).toBe('none');
    }

    await page.locator('#collapse-item-heading-media button').click();

    const caretExpanded = await page.evaluate(() => {
      const button = document.querySelector<HTMLElement>('#collapse-item-heading-media button');
      const caret = button?.querySelector('.accordion-caret');
      if (!button || !caret) return null;
      const caretDown = caret.querySelector<HTMLElement>('.caret-down');
      const caretUp = caret.querySelector<HTMLElement>('.caret-up');
      return {
        expanded: button.getAttribute('aria-expanded'),
        caretDownDisplay: caretDown ? getComputedStyle(caretDown).display : null,
        caretUpDisplay: caretUp ? getComputedStyle(caretUp).display : null,
      };
    });

    expect(caretExpanded).not.toBeNull();
    if (caretExpanded) {
      expect(caretExpanded.expanded).toBe('true');
      expect(caretExpanded.caretDownDisplay).toBe('none');
      expect(caretExpanded.caretUpDisplay).not.toBe('none');
    }

    await captureSnapshot('sc-008-accordion-caret.png');
  });
});
