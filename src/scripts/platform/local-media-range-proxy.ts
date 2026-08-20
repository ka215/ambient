import type { MediaItem } from '../types/ambient';
import { normalizeExternalMediaUrl } from './external-media-url';
import { resolveCoreLocalMediaUrl } from './local-media-url-resolver';

function normalizeBooleanish(value: unknown): boolean {
  if (value === true || value === 1) {
    return true;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true';
  }
  return false;
}

function resolveLocalMediaProxyEndpoint(): string {
  const currentUrl = new URL(window.location.href);
  return `${currentUrl.origin}${currentUrl.pathname.replace(/\/?$/, '/')}local-media-proxy`;
}

function resolveMediaUrlExtension(url: string): string {
  try {
    const parsed = new URL(url);
    const fileName = parsed.pathname.split('/').pop() || '';
    const dotIndex = fileName.lastIndexOf('.');
    if (dotIndex <= 0 || dotIndex === fileName.length - 1) {
      return '';
    }
    return fileName.slice(dotIndex + 1).toLowerCase().replace(/[^a-z0-9]/g, '');
  } catch (_error) {
    return '';
  }
}

export function shouldUseLocalMediaRangeProxy(mediaItem: MediaItem): boolean {
  const ambientData = (window as any).AmbientData as { isCloud?: boolean } | undefined;
  return !ambientData?.isCloud && normalizeBooleanish(mediaItem.rangeProxy);
}

export function resolveLocalMediaRangeProxyUrl(options: {
  mediaItem: MediaItem;
  sourceUrl: string;
  playlistName?: string | null;
}): string | null {
  if (!shouldUseLocalMediaRangeProxy(options.mediaItem)) {
    return null;
  }
  const normalizedSource = normalizeExternalMediaUrl(options.sourceUrl);
  const normalizedOrigin = normalizeExternalMediaUrl(options.mediaItem.file || '');
  if (!normalizedSource || !normalizedOrigin) {
    return null;
  }
  const coreResolved = resolveCoreLocalMediaUrl(normalizedOrigin);
  if (coreResolved.url !== normalizedSource) {
    return null;
  }
  const playlistName = String(options.playlistName || '').trim();
  if (playlistName === '' || !Number.isInteger(options.mediaItem.amId) || options.mediaItem.amId < 0) {
    return null;
  }

  const extension = resolveMediaUrlExtension(normalizedSource);
  const endpoint = new URL(
    extension
      ? `${resolveLocalMediaProxyEndpoint()}/${options.mediaItem.amId}.${extension}`
      : resolveLocalMediaProxyEndpoint()
  );
  endpoint.searchParams.set('playlist', playlistName);
  endpoint.searchParams.set('media', String(options.mediaItem.amId));
  return endpoint.toString();
}
