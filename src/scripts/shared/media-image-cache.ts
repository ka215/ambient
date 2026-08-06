const mediaImageCacheVersions = new Map<string, string>();

function normalizeImagePath(imagePath: string | null | undefined): string {
  return String(imagePath || '').trim();
}

export function shouldApplyAmbientImageCacheBust(imagePath: string | null | undefined): boolean {
  const normalized = normalizeImagePath(imagePath);
  return normalized !== ''
    && !/^(?:https?:)?\/\//i.test(normalized)
    && !/^(?:data|blob):/i.test(normalized);
}

export function registerMediaImageCacheBust(
  imagePath: string | null | undefined,
  version: string | number = Date.now()
): void {
  const normalized = normalizeImagePath(imagePath);
  if (!shouldApplyAmbientImageCacheBust(normalized)) {
    return;
  }
  mediaImageCacheVersions.set(normalized, String(version));
}

export function resolveMediaImageDisplayUrl(options: {
  imageDir?: string | null;
  imagePath: string | null | undefined;
  cacheVersion?: string | number | null;
}): string {
  const imagePath = normalizeImagePath(options.imagePath);
  if (imagePath === '') {
    return '';
  }

  const displayUrl = `${options.imageDir ?? ''}${imagePath}`;
  if (!shouldApplyAmbientImageCacheBust(imagePath)) {
    return displayUrl;
  }

  const version = options.cacheVersion !== undefined && options.cacheVersion !== null
    ? String(options.cacheVersion)
    : mediaImageCacheVersions.get(imagePath);
  if (!version) {
    return displayUrl;
  }

  const separator = displayUrl.includes('?') ? '&' : '?';
  return `${displayUrl}${separator}v=${encodeURIComponent(version)}`;
}
