import type { Page } from '@playwright/test';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export type DemoAssets = {
  youtubeVideoId: string;
  extraYouTubeVideoId: string;
  extraYouTubeTitle: string;
  localVideoPath: string;
  localAudioPath: string;
};

export type DemoMediaTargets = {
  categoryName: string;
  initialYouTubeTitle: string;
  localVideoTitle: string;
};

export const DEMO_PLAYLIST_STORAGE_KEY = 'AmbientMyPlaylist';
export const DEMO_PLAYLIST_NAME = 'ambient-demo-playlist.json';

const DEMO_PLAYLIST_ASSET = path.resolve(process.cwd(), 'assets', DEMO_PLAYLIST_NAME);
const DEMO_PLAYLIST_FIXTURE = path.resolve(process.cwd(), 'tests', 'demo', 'fixtures', 'demo-playlist.json');

export function resolveDemoAssets(): DemoAssets {
  return {
    youtubeVideoId: process.env.AMP_DEMO_YOUTUBE_VIDEO_ID || 'M7lc1UVf-VE',
    extraYouTubeVideoId: process.env.AMP_DEMO_EXTRA_YOUTUBE_VIDEO_ID || 'n8X9_MgEdCg',
    extraYouTubeTitle: process.env.AMP_DEMO_EXTRA_YOUTUBE_TITLE || 'Demo added YouTube scene',
    localVideoPath: normalizeLocalMediaPath(process.env.AMP_DEMO_LOCAL_VIDEO_PATH || 'pexels-18756591.mp4'),
    localAudioPath: normalizeLocalMediaPath(process.env.AMP_DEMO_LOCAL_AUDIO_PATH || '209_BPM80.mp3'),
  };
}

export function buildDemoPlaylist(assets: DemoAssets): Record<string, unknown> {
  const fixturePlaylist = loadDemoPlaylistFixture();
  if (fixturePlaylist) {
    return applyDemoAssetOverrides(fixturePlaylist, assets);
  }

  return {
    'Ambient Demo Mix': [
      {
        title: 'Demo YouTube ambience',
        artist: 'Ambient Demo',
        desc: 'YouTube media fixture',
        videoid: assets.youtubeVideoId,
        start: 5,
        end: 45,
        fadein: 3,
        fadeout: 4,
      },
      {
        title: 'Demo local video',
        artist: 'Ambient Demo',
        desc: 'Local video fixture',
        file: assets.localVideoPath,
        start: 0,
        end: 30,
        fadein: 2,
        fadeout: 3,
      },
      {
        title: 'Demo local audio',
        artist: 'Ambient Demo',
        desc: 'Local audio fixture',
        file: assets.localAudioPath,
        start: 0,
        end: 30,
        fadein: 2,
        fadeout: 3,
      },
    ],
    options: {
      dark: false,
      seek: true,
      shuffle: false,
      fader: true,
      volume: 50,
    },
  };
}

function loadDemoPlaylistFixture(): Record<string, unknown> | null {
  if (!existsSync(DEMO_PLAYLIST_FIXTURE)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(DEMO_PLAYLIST_FIXTURE, 'utf8')) as Record<string, unknown>;
  } catch (error) {
    throw new Error(`Failed to parse demo playlist fixture: ${DEMO_PLAYLIST_FIXTURE}`, { cause: error });
  }
}

function applyDemoAssetOverrides(
  playlist: Record<string, unknown>,
  assets: DemoAssets
): Record<string, unknown> {
  const cloned = structuredClone(playlist) as Record<string, unknown>;
  const firstCategory = Object.entries(cloned).find(([, value]) => Array.isArray(value));
  if (!firstCategory) {
    return cloned;
  }

  const items = firstCategory[1] as Array<Record<string, unknown>>;
  if (items[0]) {
    items[0].videoid = assets.youtubeVideoId;
  }
  if (items[1]) {
    items[1].file = assets.localVideoPath;
  }
  if (items[2]) {
    items[2].file = assets.localAudioPath;
  }

  return cloned;
}

export function resolveDemoMediaTargets(playlist: Record<string, unknown>): DemoMediaTargets {
  const category = Object.entries(playlist).find(([, value]) => Array.isArray(value));
  if (!category) {
    throw new Error('Demo playlist must contain at least one media category.');
  }

  const [categoryName, rawItems] = category;
  const items = rawItems as Array<Record<string, unknown>>;
  const initialYouTube = items.find((item) => typeof item.videoid === 'string' && item.videoid !== '');
  const localVideo = items.find((item) => isVideoFile(item.file));

  if (!initialYouTube) {
    throw new Error(`Demo playlist category "${categoryName}" must contain at least one YouTube media item.`);
  }
  if (!localVideo) {
    throw new Error(`Demo playlist category "${categoryName}" must contain at least one local video media item.`);
  }

  return {
    categoryName,
    initialYouTubeTitle: getMediaTitle(initialYouTube, 'YouTube media'),
    localVideoTitle: getMediaTitle(localVideo, 'Local video media'),
  };
}

function getMediaTitle(item: Record<string, unknown>, fallback: string): string {
  const title = item.title;
  return typeof title === 'string' && title.trim() ? title.trim() : fallback;
}

function isVideoFile(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  return /\.(mp4|webm|mov|m4v|ogv)$/i.test(value);
}

export async function seedDemoPlaylist(page: Page, playlist: Record<string, unknown>): Promise<void> {
  const payload = JSON.stringify(playlist);
  await page.addInitScript(({ storageKey, playlistJson }) => {
    localStorage.clear();
    localStorage.setItem(storageKey, playlistJson);
  }, { storageKey: DEMO_PLAYLIST_STORAGE_KEY, playlistJson: payload });
}

export function installDemoPlaylistAsset(playlist: Record<string, unknown>): void {
  writeFileSync(DEMO_PLAYLIST_ASSET, `${JSON.stringify(playlist, null, 2)}\n`, 'utf8');
}

export function removeDemoPlaylistAsset(): void {
  if (existsSync(DEMO_PLAYLIST_ASSET)) {
    unlinkSync(DEMO_PLAYLIST_ASSET);
  }
}

export async function installDemoStartupGate(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const root = document.documentElement;
    root.classList.add('amp-demo-startup-gate');

    const installStyle = (): void => {
      if (document.getElementById('amp-demo-startup-gate-style')) {
        return;
      }

      const style = document.createElement('style');
      style.id = 'amp-demo-startup-gate-style';
      style.textContent = `
        html.amp-demo-startup-gate #app-root {
          opacity: 0 !important;
          pointer-events: none !important;
          visibility: hidden !important;
        }

        html.amp-demo-startup-ready #app-root {
          opacity: 1 !important;
          transition: opacity 320ms ease-out !important;
          visibility: visible !important;
        }
      `;
      (document.head || document.documentElement).appendChild(style);
    };

    installStyle();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', installStyle, { once: true });
    }
  });
}

export async function waitForDemoInitialUiStable(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const body = document.body;
    const playlistDrawer = document.getElementById('drawer-playlist');
    const settingsDrawer = document.getElementById('drawer-settings');
    const playlistItems = document.querySelectorAll('#playlist-list-group a[data-playlist-item]');
    const activeCarouselImage = document.querySelector<HTMLImageElement>(
      '#carousel-wrapper [data-carousel-item="active"] img, #carousel-wrapper [data-carousel-item] img'
    );

    const playlistOpen = !!playlistDrawer && (
      playlistDrawer.getAttribute('aria-modal') === 'true'
      || !playlistDrawer.classList.contains('-translate-x-full')
    );
    const settingsOpen = !!settingsDrawer && (
      settingsDrawer.getAttribute('aria-modal') === 'true'
      || !settingsDrawer.classList.contains('translate-x-full')
    );
    const carouselReady = !!activeCarouselImage
      && (activeCarouselImage.complete || activeCarouselImage.naturalWidth > 0);

    return body?.getAttribute('data-app-ready') === 'true'
      && body?.getAttribute('data-playlist-ready') === 'true'
      && playlistOpen
      && settingsOpen
      && playlistItems.length > 0
      && carouselReady;
  }, undefined, { timeout: 15_000 });
  await pace(page, 500);
}

export async function releaseDemoStartupGate(page: Page): Promise<void> {
  await page.evaluate(() => {
    const root = document.documentElement;
    root.classList.remove('amp-demo-startup-gate');
    root.classList.add('amp-demo-startup-ready');
    window.setTimeout(() => {
      root.classList.remove('amp-demo-startup-ready');
    }, 500);
  });
  await pace(page, 700);
}

export async function closeDemoDrawers(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.querySelector<HTMLElement>('#btn-close-playlist')?.click();
    document.querySelector<HTMLElement>('#btn-close-settings')?.click();
  });
  await page.waitForFunction(() => {
    const playlistDrawer = document.getElementById('drawer-playlist');
    const settingsDrawer = document.getElementById('drawer-settings');
    const playlistClosed = !playlistDrawer
      || (playlistDrawer.getAttribute('aria-modal') !== 'true' && playlistDrawer.classList.contains('-translate-x-full'));
    const settingsClosed = !settingsDrawer
      || (settingsDrawer.getAttribute('aria-modal') !== 'true' && settingsDrawer.classList.contains('translate-x-full'));
    return playlistClosed && settingsClosed;
  }, undefined, { timeout: 8_000 });
}

export async function closeOptionsModalIfOpen(page: Page): Promise<void> {
  const isOpen = await page.evaluate(() => {
    const modal = document.getElementById('modal-options');
    return !!modal && !modal.classList.contains('hidden');
  });
  if (!isOpen) {
    return;
  }

  await page.evaluate(() => {
    document.querySelector<HTMLElement>('#btn-close-options')?.click();
  });
  await page.waitForFunction(() => {
    const modal = document.getElementById('modal-options');
    return !modal || modal.classList.contains('hidden');
  }, undefined, { timeout: 8_000 });
}

export async function waitForFullWindow(page: Page, enabled: boolean): Promise<void> {
  await page.waitForFunction((expected) => {
    return document.body.classList.contains('amp-full-window') === expected;
  }, enabled, { timeout: 8_000 });
  await pace(page, 900);
}

export async function waitForMenuMinimized(page: Page, minimized: boolean): Promise<void> {
  await page.waitForFunction((expected) => {
    return document.getElementById('menu-container')?.classList.contains('menu-minimized') === expected;
  }, minimized, { timeout: 8_000 });
  await pace(page, 700);
}

export async function openManagementSection(
  page: Page,
  headingButtonSelector: string,
  bodyId: string
): Promise<void> {
  const modalOpen = await page.evaluate(() => {
    const modal = document.getElementById('modal-options');
    return modal ? !modal.classList.contains('hidden') : false;
  });

  if (!modalOpen) {
    await page.evaluate(() => {
      document.querySelector<HTMLElement>('#btn-options')?.click();
    });
    await page.waitForFunction(() => {
      const modal = document.getElementById('modal-options');
      return modal ? !modal.classList.contains('hidden') : false;
    }, { timeout: 8_000 });
  }

  const sectionOpen = await page.evaluate((id: string) => {
    const section = document.getElementById(id);
    return section ? !section.classList.contains('hidden') : false;
  }, bodyId);

  if (!sectionOpen) {
    await page.evaluate((selector: string) => {
      document.querySelector<HTMLElement>(selector)?.click();
    }, headingButtonSelector);
    await page.waitForFunction((id: string) => {
      const section = document.getElementById(id);
      return section ? !section.classList.contains('hidden') : false;
    }, bodyId, { timeout: 8_000 });
  }
}

export async function preloadDemoVisualAssets(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const assetUrls = [
      './views/images/ambient-loading-type1.svg',
      './views/images/ambient-placeholder.svg',
      './views/images/no-media-placeholder.svg',
      './src/assets/icons/ui-playlist.svg',
      './src/assets/icons/ui-refresh.svg',
      './src/assets/icons/ui-settings.svg',
      './src/assets/icons/ui-options-panel.svg',
      './src/assets/icons/ui-youtube.svg',
    ];

    await Promise.all(assetUrls.map(async (url) => {
      try {
        const image = new Image();
        image.src = url;
        if ('decode' in image) {
          await image.decode();
        } else {
          await new Promise<void>((resolve) => {
            image.onload = () => resolve();
            image.onerror = () => resolve();
          });
        }
      } catch (_error) {
        // Demo preloading is best-effort. Missing optional assets must not block recording.
      }
    }));
  });
}

export async function waitForMediaEditPreview(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const preview = document.getElementById('modal-media-edit-preview');
    const error = document.getElementById('modal-media-edit-preview-error');
    const timeline = document.getElementById('modal-media-edit-seek-timeline');
    if (!preview) {
      return false;
    }

    const hasYouTubePreview = !!preview.querySelector('#modal-media-edit-preview-yt-player iframe, iframe');
    const hasHtmlPreview = !!preview.querySelector('video, audio');
    const hasPreviewError = !!error && !error.classList.contains('hidden');
    const timelineResolved = !!timeline && !timeline.classList.contains('is-loading');
    return (hasYouTubePreview || hasHtmlPreview || hasPreviewError) && timelineResolved;
  }, undefined, { timeout: 20_000 });
  await pace(page, 1500);
}

export async function revealAboutQrContent(page: Page): Promise<void> {
  await page.evaluate(() => {
    const aboutBody = document.getElementById('collapse-item-body-about');
    const customContent = document.getElementById('about-custom-content');
    const qrLike = aboutBody?.querySelector<HTMLElement>(
      '#about-custom-content img, #about-custom-content svg, img[src*="qr"], [class*="qr"], [id*="qr"]'
    );
    const target = qrLike || customContent || aboutBody;
    target?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
  });
  await pace(page, 1600);
}

export async function scrollMediaEditModalTopToBottom(page: Page): Promise<void> {
  await page.evaluate(() => {
    const modal = document.getElementById('modal-media-edit');
    const scroller = modal?.querySelector<HTMLElement>('.flex-1.overflow-y-auto');
    if (scroller) {
      scroller.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  await pace(page, 900);

  await page.evaluate(() => {
    const modal = document.getElementById('modal-media-edit');
    const scroller = modal?.querySelector<HTMLElement>('.flex-1.overflow-y-auto');
    if (scroller) {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
    }
  });
  await pace(page, 1800);
}

export async function pace(page: Page, milliseconds: number): Promise<void> {
  const fast = process.env.AMP_DEMO_FAST === '1';
  await page.waitForTimeout(fast ? Math.min(milliseconds, 250) : milliseconds);
}

function normalizeLocalMediaPath(pathValue: string): string {
  return pathValue
    .replace(/\\/g, '/')
    .replace(/^\.?\/?assets\/media\//, '');
}
