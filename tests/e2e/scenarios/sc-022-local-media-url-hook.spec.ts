import { type APIRequestContext, type Page } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';

import { expect, test } from '../fixtures/ambient-page.fixture';
import {
  E2E_PLAYLIST_ASSET_PATH,
  E2E_PLAYLIST_NAME,
  installE2ePlaylistFixture,
  removeE2ePlaylistFixture,
} from '../utils/playlist-fixtures';

const HTML_PAGE_URL = 'https://ambient-e2e.invalid/page-with-extensionless-media';
const RESOLVED_MEDIA_URL = 'https://media.example.test/stream/e2e-local-media?asset=video';
const RANGE_PROXY_DROPBOX_SHARED_VIDEO_URL = 'https://www.dropbox.com/scl/fi/e2e/v01.mp4?rlkey=e2e&dl=1';
const RANGE_PROXY_GOOGLE_DRIVE_SHARED_VIDEO_URL = 'https://drive.google.com/file/d/1E2eRangeProxyVideoId/view?usp=sharing';
const RANGE_PROXY_GOOGLE_DRIVE_DIRECT_VIDEO_URL = 'https://drive.google.com/uc?export=download&id=1E2eRangeProxyVideoId';

function baseURL(): string {
  return process.env.E2E_BASE_URL || 'https://dev-amp.ka2.org/';
}

function resolverURL(): string {
  return new URL('tests/e2e/fixtures/custom-media-url-resolver.php', baseURL()).toString();
}

async function skipUnlessResolverFixtureAvailable(request: APIRequestContext): Promise<void> {
  const response = await request.get(resolverURL(), {
    params: {
      url: HTML_PAGE_URL,
    },
  });
  const contentType = response.headers()['content-type'] || '';
  test.skip(
    !response.ok() || !contentType.includes('application/json'),
    'SC-022 requires the PHP E2E resolver fixture to be served by the local test server.'
  );
  const payload = await response.json() as { mediaUrl?: string };
  expect(payload.mediaUrl).toBe(RESOLVED_MEDIA_URL);
}

async function openManagementSection(
  page: Page,
  headingButtonSelector: string,
  bodyId: string
): Promise<void> {
  const modalOpen = await page.evaluate(() => {
    const el = document.getElementById('modal-options');
    return el ? !el.classList.contains('hidden') : false;
  });
  if (!modalOpen) {
    await page.evaluate(() => {
      document.querySelector<HTMLElement>('#btn-options')?.click();
    });
    await page.waitForFunction(() => {
      const el = document.getElementById('modal-options');
      return el ? !el.classList.contains('hidden') : false;
    }, { timeout: 8_000 });
  }

  const alreadyOpen = await page.evaluate((targetBodyId: string) => {
    const el = document.getElementById(targetBodyId);
    return el ? !el.classList.contains('hidden') : false;
  }, bodyId);
  if (alreadyOpen) {
    return;
  }

  await page.evaluate((selector: string) => {
    document.querySelector<HTMLElement>(selector)?.click();
  }, headingButtonSelector);
  await page.waitForFunction((targetBodyId: string) => {
    const el = document.getElementById(targetBodyId);
    return el ? !el.classList.contains('hidden') : false;
  }, bodyId, { timeout: 8_000 });
}

async function installMediaElementSuccessStub(page: Page): Promise<void> {
  await page.addInitScript((targetUrl) => {
    const originalLoad = HTMLMediaElement.prototype.load;
    Object.defineProperty(HTMLMediaElement.prototype, 'load', {
      configurable: true,
      value: function load() {
        const media = this as HTMLMediaElement;
        const src = media.currentSrc || media.getAttribute('src') || '';
        if (src === targetUrl) {
          window.setTimeout(() => {
            media.dispatchEvent(new Event('canplay'));
          }, 0);
          return;
        }
        originalLoad.call(media);
      },
    });
  }, RESOLVED_MEDIA_URL);
}

async function installServerMediaCheckStub(page: Page): Promise<void> {
  await page.route('**/local-media-check', async (route) => {
    const request = route.request();
    const formData = request.postData() || '';
    const params = new URLSearchParams(formData);
    const url = params.get('url') || '';
    if (url !== RESOLVED_MEDIA_URL) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          state: 'error',
          code: 200,
          data: {
            ok: false,
            url,
            kind: null,
            mime: null,
            reason: 'unsupported-mime',
            message: 'Unsupported media URL format.',
            source: 'server',
          },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        state: 'ok',
        code: 200,
        data: {
          ok: true,
          url,
          kind: 'video',
          mime: 'video/mp4',
          reason: null,
          message: 'Media URL is playable.',
          source: 'server',
        },
      }),
    });
  });
}

function installRangeProxyPlaylistFixture(): void {
  writeFileSync(E2E_PLAYLIST_ASSET_PATH, JSON.stringify({
    'range-proxy-e2e': [
      {
        file: RANGE_PROXY_DROPBOX_SHARED_VIDEO_URL,
        title: 'e2e-local-range-proxy-media',
        artist: 'E2E Artist',
        desc: '',
        rangeProxy: true,
      },
    ],
    options: {},
  }, null, 2));
}

async function installLocalMediaProxyRouteStub(page: Page): Promise<void> {
  await page.route('**/local-media-proxy/**?**', async (route) => {
    await route.fulfill({
      status: 206,
      contentType: 'video/mp4',
      headers: {
        'accept-ranges': 'bytes',
        'content-range': 'bytes 0-3/4',
        'content-length': '4',
      },
      body: 'ID3\u0000',
    });
  });
}

async function installGoogleDriveNonRangeMediaCheckStub(page: Page): Promise<void> {
  await installGoogleDriveMediaCheckStub(page, '');
}

async function installGoogleDriveRangeCapableMediaCheckStub(page: Page): Promise<void> {
  await installGoogleDriveMediaCheckStub(page, 'bytes');
}

async function installGoogleDriveMediaCheckStub(page: Page, acceptRanges: string): Promise<void> {
  await page.route('**/local-media-check', async (route) => {
    const request = route.request();
    const formData = request.postData() || '';
    const params = new URLSearchParams(formData);
    const url = params.get('url') || '';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        state: 'ok',
        code: 200,
        data: {
          ok: true,
          url,
          kind: 'video',
          mime: 'video/mp4',
          reason: null,
          message: 'Media URL is playable.',
          source: 'server',
          meta: {
            httpStatus: 200,
            contentType: 'video/mp4',
            contentLength: 4_194_304,
            acceptRanges,
            detection: 'content-type',
            originUrl: RANGE_PROXY_GOOGLE_DRIVE_SHARED_VIDEO_URL,
            resolved: true,
            resolvedBy: 'ambient-google-drive-shared-url',
          },
        },
      }),
    });
  });
}

async function installForbiddenMediaCheckStub(page: Page): Promise<void> {
  await page.route('**/local-media-check', async (route) => {
    const request = route.request();
    const formData = request.postData() || '';
    const params = new URLSearchParams(formData);
    const url = params.get('url') || '';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        state: 'error',
        code: 200,
        data: {
          ok: false,
          url,
          kind: null,
          mime: null,
          reason: 'upstream-forbidden',
          message: 'Media URL access is forbidden.',
          source: 'server',
          meta: {
            httpStatus: 403,
            originUrl: RANGE_PROXY_GOOGLE_DRIVE_SHARED_VIDEO_URL,
            resolved: true,
            resolvedBy: 'ambient-google-drive-shared-url',
          },
        },
      }),
    });
  });
}

test.describe('SC-022 Local media URL hook and resolver', () => {
  test.beforeEach(() => {
    installE2ePlaylistFixture();
  });

  test.afterEach(() => {
    removeE2ePlaylistFixture();
  });

  test('resolves an HTML page URL through localMediaUrl.beforeCheck before checking playback', async ({ ambientPage, page, request }) => {
    await skipUnlessResolverFixtureAvailable(request);
    await installMediaElementSuccessStub(page);
    await installServerMediaCheckStub(page);
    await page.context().addCookies([
      {
        name: 'lang',
        value: 'ja',
        url: baseURL(),
      },
    ]);

    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.selectPlaylist(E2E_PLAYLIST_NAME);

    await page.evaluate((endpointUrl) => {
      (window as any).__ambientE2ELocalMediaHookCalls = [];
      window.AmbientHooks?.addFilter('localMediaUrl.beforeCheck', async (url, context) => {
        const endpoint = new URL(endpointUrl);
        endpoint.searchParams.set('url', url);
        const response = await fetch(endpoint.toString(), { credentials: 'same-origin' });
        if (!response.ok) {
          (window as any).__ambientE2ELocalMediaHookCalls.push({ url, context, resolvedUrl: url });
          return url;
        }
        const payload = await response.json() as { mediaUrl?: unknown };
        const resolvedUrl = typeof payload.mediaUrl === 'string' && payload.mediaUrl !== ''
          ? payload.mediaUrl
          : url;
        (window as any).__ambientE2ELocalMediaHookCalls.push({ url, context, resolvedUrl });
        return resolvedUrl;
      }, 10);
    }, resolverURL());

    await openManagementSection(page, '#collapse-item-heading-media button', 'collapse-item-body-media');
    await page.evaluate(() => {
      const localType = document.getElementById('media-type-local') as HTMLInputElement | null;
      if (!localType) {
        throw new Error('media-type-local not found');
      }
      localType.click();
    });

    await expect(page.locator('#media-management-field-media-files')).toBeVisible();
    await expect(page.locator('label[for="media-type-local"]')).toHaveText('その他のメディア');
    await expect(page.locator('#local-media-tab-upload')).toContainText('ホストコンピュータ内のメディア');
    await expect(page.locator('#local-media-tab-url')).toContainText('メディアのURL');
    await expect(page.locator('#local-media-tab-upload .ui-icon-mask--upload')).toBeVisible();
    await expect(page.locator('#local-media-tab-url .ui-icon-mask--link')).toBeVisible();
    await expect(page.locator('#local-media-tab-upload').locator('..')).toHaveClass(/w-full/);
    await expect(page.locator('#local-media-tab-url').locator('..')).toHaveClass(/w-full/);

    await page.locator('#local-media-tab-url').click();
    await expect(page.locator('#local-media-tab-url')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#local-media-tab-url')).toHaveClass(/bg-blue-100/);
    await expect(page.locator('#local-media-url-panel')).toBeVisible();
    await expect(page.locator('#local-media-url-label .required')).toHaveText('メディアのURL');
    await expect(page.locator('#btn-check-local-media-url')).toHaveText('確認');
    await expect.poll(async () => {
      return page.locator('#btn-check-local-media-url').evaluate((button) => {
        const style = window.getComputedStyle(button);
        return style.whiteSpace === 'nowrap' && button.scrollWidth <= button.clientWidth + 1;
      });
    }).toBe(true);

    await page.locator('#local-media-url').fill(HTML_PAGE_URL);
    await page.locator('#local-media-url').dispatchEvent('input');
    await expect(page.locator('#btn-check-local-media-url')).toBeEnabled();

    await page.locator('#btn-check-local-media-url').click();
    await expect(page.locator('#local-media-url')).toHaveValue(HTML_PAGE_URL);
    await expect(page.locator('#local-media-filepath')).toHaveValue(HTML_PAGE_URL);
    await expect(page.locator('#note-success-local-media-url')).toBeVisible();

    await expect.poll(async () => {
      return page.evaluate(() => (window as any).__ambientE2ELocalMediaHookCalls);
    }).toEqual([
      {
        url: HTML_PAGE_URL,
        resolvedUrl: RESOLVED_MEDIA_URL,
        context: {
          source: 'media-management',
          phase: 'check',
          rawUrl: HTML_PAGE_URL,
          currentUrl: HTML_PAGE_URL,
          defaultResolved: false,
        },
      },
    ]);

    const mediaTitle = `e2e-local-url-hook-${Date.now()}`;
    await page.evaluate((title) => {
      const category = document.getElementById('media-category') as HTMLSelectElement | null;
      const titleInput = document.getElementById('media-title') as HTMLInputElement | null;
      if (category && category.options.length > 0) {
        const option = Array.from(category.options).find((item) => item.value !== '');
        if (!option) {
          throw new Error('media-category option not found');
        }
        category.value = option.value;
        category.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (titleInput) {
        titleInput.value = title;
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
        titleInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, mediaTitle);

    await expect(page.locator('#local-media-url')).toHaveAttribute('data-validate', 'true');
    await expect(page.locator('#media-category')).toHaveAttribute('data-validate', 'true');
    await expect(page.locator('#media-title')).toHaveAttribute('data-validate', 'true');
    await expect(page.locator('#btn-add-media')).toBeEnabled();
    await page.locator('#btn-add-media').click();
    await expect(page.locator('#modal-options')).toHaveClass(/pointer-events-none/);

    await expect.poll(async () => {
      return page.evaluate((title) => {
        return Array.from(document.querySelectorAll('#playlist-list-group a[data-playlist-item]'))
          .some((item) => (item.textContent || '').includes(title));
      }, mediaTitle);
    }, { timeout: 10_000 }).toBe(true);

    await page.evaluate((title) => {
      const item = Array.from(document.querySelectorAll<HTMLElement>('#playlist-list-group a[data-playlist-item]'))
        .find((candidate) => (candidate.textContent || '').includes(title));
      item?.click();
    }, mediaTitle);
    await expect.poll(async () => {
      return page.evaluate(() => {
        const source = document.querySelector<HTMLSourceElement>('#html-player source');
        return source?.getAttribute('src') || '';
      });
    }, { timeout: 10_000 }).toBe(RESOLVED_MEDIA_URL);

    await page.evaluate(() => {
      document.querySelector<HTMLElement>('#btn-playlist-mode')?.click();
    });
    await page.evaluate(() => {
      document.querySelector<HTMLElement>('.playlist-mode-option[data-mode="edit"]')?.click();
    });
    await page.evaluate((title) => {
      const item = Array.from(document.querySelectorAll<HTMLElement>('#playlist-list-group a[data-playlist-item]'))
        .find((candidate) => (candidate.textContent || '').includes(title));
      item?.click();
    }, mediaTitle);
    await expect(page.locator('#modal-media-edit')).toBeVisible();
    await expect.poll(async () => {
      return page.locator('#modal-media-edit-preview source').evaluate((source) => source.getAttribute('src'));
    }, { timeout: 10_000 }).toBe(RESOLVED_MEDIA_URL);

    await expect.poll(async () => {
      return page.evaluate(() => (window as any).__ambientE2ELocalMediaHookCalls);
    }).toEqual([
      {
        url: HTML_PAGE_URL,
        resolvedUrl: RESOLVED_MEDIA_URL,
        context: {
          source: 'media-management',
          phase: 'check',
          rawUrl: HTML_PAGE_URL,
          currentUrl: HTML_PAGE_URL,
          defaultResolved: false,
        },
      },
      {
        url: HTML_PAGE_URL,
        resolvedUrl: RESOLVED_MEDIA_URL,
        context: {
          source: 'html-playback',
          phase: 'playback',
          rawUrl: HTML_PAGE_URL,
          currentUrl: HTML_PAGE_URL,
          defaultResolved: false,
        },
      },
      {
        url: HTML_PAGE_URL,
        resolvedUrl: RESOLVED_MEDIA_URL,
        context: {
          source: 'media-edit-preview',
          phase: 'preview',
          rawUrl: HTML_PAGE_URL,
          currentUrl: HTML_PAGE_URL,
          defaultResolved: false,
        },
      },
    ]);
  });

  test('uses the local Range Proxy URL for opt-in external media playback', async ({ ambientPage, page }) => {
    installRangeProxyPlaylistFixture();
    await installLocalMediaProxyRouteStub(page);

    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.selectPlaylist(E2E_PLAYLIST_NAME);

    await page.evaluate(() => {
      const item = Array.from(document.querySelectorAll<HTMLElement>('#playlist-list-group a[data-playlist-item]'))
        .find((candidate) => (candidate.textContent || '').includes('e2e-local-range-proxy-media'));
      item?.click();
    });

    await expect.poll(async () => {
      return page.evaluate(() => {
        const source = document.querySelector<HTMLSourceElement>('#html-player source');
        return source?.getAttribute('src') || '';
      });
    }, { timeout: 10_000 }).toContain('/local-media-proxy/0.mp4?');

    await expect.poll(async () => {
      return page.evaluate(() => {
        const player = document.querySelector<HTMLMediaElement>('#html-player');
        const source = document.querySelector<HTMLSourceElement>('#html-player source');
        return {
          tagName: player?.tagName || '',
          sourceType: source?.getAttribute('type') || '',
        };
      });
    }).toEqual({
      tagName: 'VIDEO',
      sourceType: 'video/mp4',
    });

    const proxyParams = await page.evaluate(() => {
      const source = document.querySelector<HTMLSourceElement>('#html-player source');
      const src = source?.getAttribute('src') || '';
      const url = new URL(src, window.location.href);
      return {
        pathname: url.pathname,
        playlist: url.searchParams.get('playlist'),
        media: url.searchParams.get('media'),
      };
    });

    expect(proxyParams.pathname).toMatch(/\/local-media-proxy\/0\.mp4$/);
    expect(proxyParams.playlist).toBe(E2E_PLAYLIST_NAME);
    expect(proxyParams.media).toBe('0');
  });

  test('defaults Range Proxy on for eligible Google Drive URL registration', async ({ ambientPage, page }) => {
    await installGoogleDriveNonRangeMediaCheckStub(page);

    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.selectPlaylist(E2E_PLAYLIST_NAME);

    await openManagementSection(page, '#collapse-item-heading-media button', 'collapse-item-body-media');
    await page.evaluate(() => {
      const localType = document.getElementById('media-type-local') as HTMLInputElement | null;
      localType?.click();
    });
    await page.locator('#local-media-tab-url').click();
    await page.locator('#local-media-url').fill(RANGE_PROXY_GOOGLE_DRIVE_SHARED_VIDEO_URL);
    await page.locator('#local-media-url').dispatchEvent('input');
    await page.locator('#btn-check-local-media-url').click();

    await expect(page.locator('#local-media-range-proxy-option')).toBeVisible();
    await expect(page.locator('#local-media-range-proxy')).toBeChecked();
    await expect(page.locator('#local-media-filepath')).toHaveValue(RANGE_PROXY_GOOGLE_DRIVE_SHARED_VIDEO_URL);

    const mediaTitle = `e2e-google-drive-range-proxy-${Date.now()}`;
    await page.evaluate((title) => {
      const category = document.getElementById('media-category') as HTMLSelectElement | null;
      const titleInput = document.getElementById('media-title') as HTMLInputElement | null;
      if (category && category.options.length > 0) {
        const option = Array.from(category.options).find((item) => item.value !== '');
        if (!option) {
          throw new Error('media-category option not found');
        }
        category.value = option.value;
        category.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (titleInput) {
        titleInput.value = title;
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
        titleInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, mediaTitle);

    await expect(page.locator('#btn-add-media')).toBeEnabled();
    await page.locator('#btn-add-media').click();

    await expect.poll(() => {
      const playlist = JSON.parse(readFileSync(E2E_PLAYLIST_ASSET_PATH, 'utf8')) as Record<string, unknown>;
      const items = Object.entries(playlist)
        .filter(([key]) => key !== 'options')
        .flatMap(([, value]) => Array.isArray(value) ? value : []);
      return items.find((item) => {
        return typeof item === 'object' && item !== null && (item as { title?: string }).title === mediaTitle;
      }) as { file?: string; mediaKind?: string; mediaMime?: string; rangeProxy?: boolean } | undefined;
    }, { timeout: 10_000 }).toMatchObject({
      file: RANGE_PROXY_GOOGLE_DRIVE_SHARED_VIDEO_URL,
      mediaKind: 'video',
      mediaMime: 'video/mp4',
      rangeProxy: true,
    });

    await expect(page.locator('#modal-options')).toHaveClass(/pointer-events-none/);
    await page.evaluate(() => {
      const modal = document.getElementById('modal-options');
      modal?.classList.remove('opacity-0', 'pointer-events-none');
      modal?.classList.add('modal-visible');
      modal?.setAttribute('aria-hidden', 'false');
    });
    await expect(page.locator('#modal-options')).not.toHaveClass(/pointer-events-none/);
    await expect(page.locator('#local-media-url')).toHaveValue('');
    await expect(page.locator('#local-media-filepath')).toHaveValue('');
    await expect(page.locator('#local-media-range-proxy-option')).toBeHidden();
    await expect(page.locator('#local-media-range-proxy')).not.toBeChecked();

    await expect.poll(async () => {
      return page.evaluate(() => {
        const calls = performance.getEntriesByType('resource')
          .map((entry) => entry.name)
          .filter((name) => name.includes('local-media-check'));
        return calls.length;
      });
    }).toBeGreaterThan(0);
    expect(RANGE_PROXY_GOOGLE_DRIVE_DIRECT_VIDEO_URL).toContain('/uc?export=download&id=');
  });

  test('defaults Range Proxy on for Google Drive URL even when range capable', async ({ ambientPage, page }) => {
    await installGoogleDriveRangeCapableMediaCheckStub(page);

    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.selectPlaylist(E2E_PLAYLIST_NAME);

    await openManagementSection(page, '#collapse-item-heading-media button', 'collapse-item-body-media');
    await page.evaluate(() => {
      const localType = document.getElementById('media-type-local') as HTMLInputElement | null;
      localType?.click();
    });
    await page.locator('#local-media-tab-url').click();
    await page.locator('#local-media-url').fill(RANGE_PROXY_GOOGLE_DRIVE_SHARED_VIDEO_URL);
    await page.locator('#local-media-url').dispatchEvent('input');
    await page.locator('#btn-check-local-media-url').click();

    await expect(page.locator('#local-media-range-proxy-option')).toBeVisible();
    await expect(page.locator('#local-media-range-proxy')).toBeChecked();

    const mediaTitle = `e2e-google-drive-range-capable-proxy-${Date.now()}`;
    await page.evaluate((title) => {
      const category = document.getElementById('media-category') as HTMLSelectElement | null;
      const titleInput = document.getElementById('media-title') as HTMLInputElement | null;
      const option = category ? Array.from(category.options).find((item) => item.value !== '') : null;
      if (!category || !option || !titleInput) {
        throw new Error('media form fields not found');
      }
      category.value = option.value;
      category.dispatchEvent(new Event('change', { bubbles: true }));
      titleInput.value = title;
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      titleInput.dispatchEvent(new Event('change', { bubbles: true }));
    }, mediaTitle);

    await page.locator('#btn-add-media').click();

    await expect.poll(() => {
      const playlist = JSON.parse(readFileSync(E2E_PLAYLIST_ASSET_PATH, 'utf8')) as Record<string, unknown>;
      const items = Object.entries(playlist)
        .filter(([key]) => key !== 'options')
        .flatMap(([, value]) => Array.isArray(value) ? value : []);
      return items.find((item) => {
        return typeof item === 'object' && item !== null && (item as { title?: string }).title === mediaTitle;
      }) as { rangeProxy?: boolean } | undefined;
    }, { timeout: 10_000 }).toMatchObject({
      rangeProxy: true,
    });
  });

  test('uses saved mediaKind for extensionless Google Drive playback', async ({ ambientPage, page }) => {
    writeFileSync(E2E_PLAYLIST_ASSET_PATH, JSON.stringify({
      'google-drive-e2e': [
        {
          file: RANGE_PROXY_GOOGLE_DRIVE_SHARED_VIDEO_URL,
          title: 'e2e-google-drive-extensionless-video',
          artist: 'E2E Artist',
          desc: '',
          mediaKind: 'video',
          mediaMime: 'video/mp4',
        },
      ],
      options: {},
    }, null, 2));

    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.selectPlaylist(E2E_PLAYLIST_NAME);

    await page.evaluate(() => {
      const item = Array.from(document.querySelectorAll<HTMLElement>('#playlist-list-group a[data-playlist-item]'))
        .find((candidate) => (candidate.textContent || '').includes('e2e-google-drive-extensionless-video'));
      item?.click();
    });

    await expect.poll(async () => {
      return page.evaluate(() => {
        const player = document.querySelector<HTMLMediaElement>('#html-player');
        const source = document.querySelector<HTMLSourceElement>('#html-player source');
        return {
          tagName: player?.tagName || '',
          src: source?.getAttribute('src') || '',
          sourceType: source?.getAttribute('type') || '',
        };
      });
    }, { timeout: 10_000 }).toEqual({
      tagName: 'VIDEO',
      src: RANGE_PROXY_GOOGLE_DRIVE_DIRECT_VIDEO_URL,
      sourceType: 'video/mp4',
    });
  });

  test('shows server status-specific error for restricted Google Drive URL checks', async ({ ambientPage, page }) => {
    await installForbiddenMediaCheckStub(page);

    await ambientPage.gotoHome();
    await ambientPage.waitForBaseUi();
    await ambientPage.selectPlaylist(E2E_PLAYLIST_NAME);

    await openManagementSection(page, '#collapse-item-heading-media button', 'collapse-item-body-media');
    await page.evaluate(() => {
      const localType = document.getElementById('media-type-local') as HTMLInputElement | null;
      localType?.click();
    });
    await page.locator('#local-media-tab-url').click();
    await page.locator('#local-media-url').fill(RANGE_PROXY_GOOGLE_DRIVE_SHARED_VIDEO_URL);
    await page.locator('#local-media-url').dispatchEvent('input');
    await page.locator('#btn-check-local-media-url').click();

    await expect(page.locator('#local-media-url-status')).toHaveText('Media URL access is forbidden.');
    await expect(page.locator('#local-media-url')).toHaveAttribute('data-validate', 'false');
    await expect(page.locator('#local-media-filepath')).toHaveValue('');
    await expect(page.locator('#local-media-range-proxy-option')).toBeHidden();
    await expect(page.locator('#btn-add-media')).toBeDisabled();
  });
});
