import { resolveHtmlMediaMimeType } from '../ui/player/html-player-source';
import { resolveHtmlPlayerKind, type HtmlPlayerKind } from '../ui/player/player-setup';

export interface ExternalMediaUrlCheckResult {
  ok: boolean;
  url: string;
  kind: HtmlPlayerKind | null;
  reason?: 'invalid-url' | 'unsupported-extension' | 'unsupported-mime' | 'load-timeout' | 'load-error' | 'server-check-failed';
  message: string;
  mime?: string | null;
  source?: 'server' | 'media-element';
}

interface ServerMediaUrlCheckResponse {
  state?: string;
  data?: {
    ok?: boolean;
    url?: string;
    kind?: HtmlPlayerKind | null;
    mime?: string | null;
    reason?: ExternalMediaUrlCheckResult['reason'] | 'probe-failed' | 'curl-unavailable' | 'blocked-url' | 'upstream-status' | 'timeout';
    message?: string;
    source?: string;
  };
}

function getExtension(path: string): string {
  const normalizedPath = String(path || '').split(/[?#]/, 1)[0] || '';
  const lastSlashIndex = Math.max(normalizedPath.lastIndexOf('/'), normalizedPath.lastIndexOf('\\'));
  const fileName = lastSlashIndex >= 0 ? normalizedPath.slice(lastSlashIndex + 1) : normalizedPath;
  const dotIndex = fileName.lastIndexOf('.');

  if (dotIndex < 0 || dotIndex === fileName.length - 1) {
    return '';
  }

  return fileName.slice(dotIndex + 1).toLowerCase();
}

export function normalizeExternalMediaUrl(value: string): string | null {
  const normalized = String(value || '').trim();
  if (normalized === '' || /^\/\//.test(normalized)) {
    return null;
  }
  try {
    const url = new URL(normalized);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    return url.toString();
  } catch (_error) {
    return null;
  }
}

export function isValidExternalMediaUrlFormat(value: string): boolean {
  const normalizedUrl = normalizeExternalMediaUrl(value);
  return normalizedUrl !== null;
}

function resolveLocalMediaCheckEndpoint(): string {
  const currentUrl = new URL(window.location.href);
  return `${currentUrl.origin}${currentUrl.pathname.replace(/\/?$/, '/')}local-media-check`;
}

async function checkExternalMediaUrlByServer(
  url: string,
  timeoutMs: number
): Promise<ExternalMediaUrlCheckResult | null> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, Math.max(1000, Math.min(timeoutMs, 8000)));

  try {
    const body = new URLSearchParams();
    body.set('url', url);
    const response = await fetch(resolveLocalMediaCheckEndpoint(), {
      method: 'POST',
      cache: 'no-cache',
      credentials: 'same-origin',
      body,
      signal: controller.signal,
    });
    if (!response.ok) {
      return null;
    }

    const payload = await response.json() as ServerMediaUrlCheckResponse;
    const data = payload.data;
    if (!data) {
      return null;
    }
    if (data.ok === true && (data.kind === 'audio' || data.kind === 'video')) {
      return {
        ok: true,
        url: data.url || url,
        kind: data.kind,
        mime: data.mime || null,
        message: data.message || 'Media URL is playable.',
        source: 'server',
      };
    }
    if (data.reason === 'invalid-url' || data.reason === 'unsupported-mime') {
      return {
        ok: false,
        url: data.url || url,
        kind: null,
        mime: data.mime || null,
        reason: data.reason,
        message: data.message || 'Unsupported media URL format.',
        source: 'server',
      };
    }
  } catch (_error) {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }

  return null;
}

function checkMediaElementPlayable(options: {
  url: string;
  kind: HtmlPlayerKind;
  timeoutMs: number;
  checkMime: boolean;
}): Promise<ExternalMediaUrlCheckResult> {
  const mediaElement = document.createElement(options.kind);
  if (options.checkMime) {
    const mimeType = resolveHtmlMediaMimeType(options.url, options.kind);
    if (mimeType && mediaElement.canPlayType(mimeType) === '') {
      return Promise.resolve({
        ok: false,
        url: options.url,
        kind: options.kind,
        reason: 'unsupported-mime',
        message: 'This media type cannot be played by your browser.',
      });
    }
  }

  return new Promise((resolve) => {
    let settled = false;
    const cleanup = (): void => {
      mediaElement.removeEventListener('loadedmetadata', onSuccess);
      mediaElement.removeEventListener('canplay', onSuccess);
      mediaElement.removeEventListener('error', onError);
      mediaElement.removeAttribute('src');
      mediaElement.load();
    };
    const settle = (result: ExternalMediaUrlCheckResult): void => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timeoutId);
      cleanup();
      resolve(result);
    };
    const onSuccess = (): void => settle({
      ok: true,
      url: options.url,
      kind: options.kind,
      message: 'Media URL is playable.',
      source: 'media-element',
    });
    const onError = (): void => settle({
      ok: false,
      url: options.url,
      kind: options.kind,
      reason: 'load-error',
      message: 'Failed to load media URL.',
      source: 'media-element',
    });
    const timeoutId = window.setTimeout(() => {
      settle({
        ok: false,
        url: options.url,
        kind: options.kind,
        reason: 'load-timeout',
        message: 'Media URL check timed out.',
        source: 'media-element',
      });
    }, options.timeoutMs);

    mediaElement.preload = 'metadata';
    mediaElement.addEventListener('loadedmetadata', onSuccess, { once: true });
    mediaElement.addEventListener('canplay', onSuccess, { once: true });
    mediaElement.addEventListener('error', onError, { once: true });
    mediaElement.src = options.url;
    mediaElement.load();
  });
}

async function checkExtensionlessMediaUrlPlayable(
  url: string,
  timeoutMs: number
): Promise<ExternalMediaUrlCheckResult> {
  const results = await Promise.all([
    checkMediaElementPlayable({ url, kind: 'video', timeoutMs, checkMime: false }),
    checkMediaElementPlayable({ url, kind: 'audio', timeoutMs, checkMime: false }),
  ]);
  return results.find((result) => result.ok) || {
    ok: false,
    url,
    kind: null,
    reason: results.some((result) => result.reason === 'load-timeout') ? 'load-timeout' : 'load-error',
    message: 'Failed to load media URL.',
  };
}

export async function checkExternalMediaUrlPlayable(
  value: string,
  timeoutMs = 8000
): Promise<ExternalMediaUrlCheckResult> {
  const normalizedUrl = normalizeExternalMediaUrl(value);
  if (!normalizedUrl) {
    return Promise.resolve({
      ok: false,
      url: '',
      kind: null,
      reason: 'invalid-url',
      message: 'Invalid media URL.',
    });
  }

  const serverResult = await checkExternalMediaUrlByServer(normalizedUrl, timeoutMs);
  if (serverResult) {
    return serverResult;
  }

  const extension = getExtension(normalizedUrl);
  if (extension === '') {
    return checkExtensionlessMediaUrlPlayable(normalizedUrl, timeoutMs);
  }

  const kind = resolveHtmlPlayerKind(extension);
  if (!kind) {
    return Promise.resolve({
      ok: false,
      url: normalizedUrl,
      kind: null,
      reason: 'unsupported-extension',
      message: 'Unsupported media URL format.',
    });
  }

  return checkMediaElementPlayable({
    url: normalizedUrl,
    kind,
    timeoutMs,
    checkMime: true,
  });
}
