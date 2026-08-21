import { resolveHtmlMediaMimeType } from '../ui/player/html-player-source';
import { resolveHtmlPlayerKind, type HtmlPlayerKind } from '../ui/player/player-setup';
import { resolveLocalMediaCheckEndpoint } from './local-media-check-endpoint';

export interface ExternalMediaUrlCheckResult {
  ok: boolean;
  url: string;
  kind: HtmlPlayerKind | null;
  reason?:
    | 'invalid-url'
    | 'unsupported-extension'
    | 'unsupported-mime'
    | 'load-timeout'
    | 'load-error'
    | 'server-check-failed'
    | 'probe-failed'
    | 'curl-unavailable'
    | 'stream-unavailable'
    | 'blocked-url'
    | 'invalid-redirect'
    | 'too-many-redirects'
    | 'upstream-error'
    | 'upstream-status'
    | 'upstream-unauthorized'
    | 'upstream-forbidden'
    | 'upstream-not-found'
    | 'upstream-server-error'
    | 'timeout';
  message: string;
  mime?: string | null;
  source?: 'server' | 'media-element';
  meta?: {
    httpStatus?: number | null;
    contentType?: string;
    contentLength?: number | null;
    acceptRanges?: string;
    detection?: string;
    originUrl?: string;
    resolved?: boolean;
    resolvedBy?: string | null;
    curlErrno?: number | null;
    curlError?: string | null;
    streamError?: string | null;
    transport?: string | null;
    redirects?: Array<{ from?: string; to?: string; status?: number }>;
  };
}

type ExternalMediaUrlCheckLogger = (...args: unknown[]) => void;

interface ServerMediaUrlCheckResponse {
  state?: string;
  data?: {
    ok?: boolean;
    url?: string;
    kind?: HtmlPlayerKind | null;
    mime?: string | null;
    reason?: ExternalMediaUrlCheckResult['reason'];
    message?: string;
    source?: string;
    meta?: ExternalMediaUrlCheckResult['meta'];
  };
}

function logLocalMediaCheck(
  logger: ExternalMediaUrlCheckLogger | undefined,
  event: string,
  payload?: Record<string, unknown>
): void {
  logger?.('[local-media-url-check]', event, payload || {}, 'force');
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

async function checkExternalMediaUrlByServer(
  url: string,
  timeoutMs: number,
  logger?: ExternalMediaUrlCheckLogger
): Promise<ExternalMediaUrlCheckResult | null> {
  const controller = new AbortController();
  const endpoint = resolveLocalMediaCheckEndpoint();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, Math.max(1000, Math.min(timeoutMs, 8000)));

  try {
    const body = new URLSearchParams();
    body.set('url', url);
    logLocalMediaCheck(logger, 'server-check:request', { endpoint, url });
    const response = await fetch(endpoint, {
      method: 'POST',
      cache: 'no-cache',
      credentials: 'same-origin',
      body,
      signal: controller.signal,
    });
    const contentType = response.headers.get('content-type') || '';
    logLocalMediaCheck(logger, 'server-check:response', {
      endpoint,
      ok: response.ok,
      status: response.status,
      contentType,
    });
    if (!response.ok) {
      return null;
    }

    const responseText = await response.text();
    let payload: ServerMediaUrlCheckResponse;
    try {
      payload = JSON.parse(responseText) as ServerMediaUrlCheckResponse;
    } catch (error) {
      logLocalMediaCheck(logger, 'server-check:json-parse-failed', {
        endpoint,
        error: error instanceof Error ? error.message : String(error),
        responseStart: responseText.slice(0, 160),
      });
      return null;
    }
    const data = payload.data;
    if (!data) {
      logLocalMediaCheck(logger, 'server-check:missing-data', { endpoint, payload });
      return null;
    }
    logLocalMediaCheck(logger, 'server-check:payload', { endpoint, data });
    if (data.ok === true && (data.kind === 'audio' || data.kind === 'video')) {
      return {
        ok: true,
        url: data.url || url,
        kind: data.kind,
        mime: data.mime || null,
        message: data.message || 'Media URL is playable.',
        source: 'server',
        meta: data.meta,
      };
    }
    if (data.ok === false && data.reason) {
      return {
        ok: false,
        url: data.url || url,
        kind: null,
        mime: data.mime || null,
        reason: data.reason,
        message: data.message || 'Unsupported media URL format.',
        source: 'server',
        meta: data.meta,
      };
    }
  } catch (_error) {
    logLocalMediaCheck(logger, 'server-check:fetch-failed', {
      endpoint,
      error: _error instanceof Error ? _error.message : String(_error),
    });
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
  logger?: ExternalMediaUrlCheckLogger;
}): Promise<ExternalMediaUrlCheckResult> {
  const mediaElement = document.createElement(options.kind);
  if (options.checkMime) {
    const mimeType = resolveHtmlMediaMimeType(options.url, options.kind);
    if (mimeType && mediaElement.canPlayType(mimeType) === '') {
      logLocalMediaCheck(options.logger, 'media-element:unsupported-mime', {
        url: options.url,
        kind: options.kind,
        mimeType,
      });
      return Promise.resolve({
        ok: false,
        url: options.url,
        kind: options.kind,
        reason: 'unsupported-mime',
        message: 'This media type cannot be played by your browser.',
      });
    }
  }

  logLocalMediaCheck(options.logger, 'media-element:request', {
    url: options.url,
    kind: options.kind,
    checkMime: options.checkMime,
  });
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
      logLocalMediaCheck(options.logger, 'media-element:result', result as unknown as Record<string, unknown>);
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
  timeoutMs: number,
  logger?: ExternalMediaUrlCheckLogger
): Promise<ExternalMediaUrlCheckResult> {
  logLocalMediaCheck(logger, 'media-element:extensionless-fallback', { url });
  const results = await Promise.all([
    checkMediaElementPlayable({ url, kind: 'video', timeoutMs, checkMime: false, logger }),
    checkMediaElementPlayable({ url, kind: 'audio', timeoutMs, checkMime: false, logger }),
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
  timeoutMs = 8000,
  logger?: ExternalMediaUrlCheckLogger
): Promise<ExternalMediaUrlCheckResult> {
  const normalizedUrl = normalizeExternalMediaUrl(value);
  logLocalMediaCheck(logger, 'start', { rawUrl: value, normalizedUrl });
  if (!normalizedUrl) {
    return Promise.resolve({
      ok: false,
      url: '',
      kind: null,
      reason: 'invalid-url',
      message: 'Invalid media URL.',
    });
  }

  const serverResult = await checkExternalMediaUrlByServer(normalizedUrl, timeoutMs, logger);
  if (serverResult) {
    logLocalMediaCheck(logger, 'server-check:accepted', serverResult as unknown as Record<string, unknown>);
    return serverResult;
  }

  const extension = getExtension(normalizedUrl);
  if (extension === '') {
    return checkExtensionlessMediaUrlPlayable(normalizedUrl, timeoutMs, logger);
  }

  const kind = resolveHtmlPlayerKind(extension);
  if (!kind) {
    logLocalMediaCheck(logger, 'unsupported-extension', { url: normalizedUrl, extension });
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
    logger,
  });
}
