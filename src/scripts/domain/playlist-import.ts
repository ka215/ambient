import { writeMyPlaylistJson } from './myplaylist-storage';
import { hasUnsafeScheme, parseJsonWithBom } from '../shared/string';
import { isObject, normalizeBoolish, normalizeNonNegativeNumber } from '../shared/validation';

export interface PlaylistImportSuccess {
  ok: true;
  filename: string;
  message: string;
}

export interface PlaylistImportFailure {
  ok: false;
  message: string;
}

export type PlaylistImportPersistResult = PlaylistImportSuccess | PlaylistImportFailure;

export interface ImportSanitizeResult {
  playlist: Record<string, unknown>;
  rejected: number;
  total: number;
}

export function detectCloudImportDeviceTier(userAgent: string): 'desktop' | 'tablet' | 'mobile' | 'unknown' {
  if (/ipad|tablet|playbook|silk/i.test(userAgent) || (/android/i.test(userAgent) && !/mobile/i.test(userAgent))) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android/i.test(userAgent)) {
    return 'mobile';
  }
  if (/windows|macintosh|linux|x11|cros/i.test(userAgent)) {
    return 'desktop';
  }
  return 'unknown';
}

export function getCloudImportSizeLimitBytes(
  userAgent: string,
  limits: Record<'desktop' | 'tablet' | 'mobile' | 'unknown', number>
): number {
  const tier = detectCloudImportDeviceTier(userAgent);
  return limits[tier] || limits.unknown;
}

export function validatePlaylistSchemaContract(value: unknown): value is Record<string, unknown> {
  if (!isObject(value) || Array.isArray(value)) {
    return false;
  }
  for (const [key, item] of Object.entries(value)) {
    if (key === 'options') {
      if (!isObject(item) || Array.isArray(item)) {
        return false;
      }
      continue;
    }
    if (!Array.isArray(item)) {
      return false;
    }
    for (const media of item) {
      if (!isObject(media) || Array.isArray(media)) {
        return false;
      }
      if (typeof media.title !== 'string' || media.title.trim() === '') {
        return false;
      }
    }
  }
  return true;
}

export function parseImportedPlaylistJson(text: string): unknown {
  return parseJsonWithBom(text);
}

function sanitizeAndNormalizeImportOptions(
  options: Record<string, unknown>,
  stripPlaylistTemplate: boolean,
  sanitizeText: (value: string, maxLength: number) => string
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};

  Object.entries(options).forEach(([key, rawValue]) => {
    if (stripPlaylistTemplate && key === 'playlist') {
      return;
    }
    if (typeof rawValue === 'boolean' || typeof rawValue === 'number' || rawValue === null) {
      normalized[key] = rawValue;
      return;
    }
    if (typeof rawValue === 'string') {
      normalized[key] = sanitizeText(rawValue, 500);
    }
  });

  if (Object.prototype.hasOwnProperty.call(normalized, 'volume')) {
    const volume = normalizeNonNegativeNumber(normalized.volume);
    if (volume === null) {
      delete normalized.volume;
    } else {
      normalized.volume = Math.max(0, Math.min(100, volume));
    }
  }

  ['random', 'shuffle', 'seek', 'fader', 'dark', 'autoplay'].forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(normalized, key)) {
      return;
    }
    const boolValue = normalizeBoolish(normalized[key]);
    if (boolValue === null) {
      delete normalized[key];
    } else {
      normalized[key] = boolValue;
    }
  });

  return normalized;
}

export function sanitizeAndNormalizeImportPlaylist(options: {
  source: Record<string, unknown>;
  stripPlaylistTemplate: boolean;
  sanitizeText: (value: string, maxLength: number) => string;
  sanitizeDesc: (value: string, maxLength: number) => string;
  titleMaxLength: number;
  artistMaxLength: number;
  descMaxLength: number;
}): ImportSanitizeResult | null {
  if (!isObject(options.source) || Array.isArray(options.source)) {
    return null;
  }

  const normalized: Record<string, unknown> = {};
  let total = 0;
  let rejected = 0;

  for (const [category, rawItems] of Object.entries(options.source)) {
    if (category === 'options') {
      if (isObject(rawItems) && !Array.isArray(rawItems)) {
        normalized.options = sanitizeAndNormalizeImportOptions(
          rawItems,
          options.stripPlaylistTemplate,
          options.sanitizeText
        );
      }
      continue;
    }

    const safeCategory = options.sanitizeText(category, 100);
    if (safeCategory === '' || !Array.isArray(rawItems)) {
      continue;
    }

    const normalizedItems: Record<string, unknown>[] = [];
    rawItems.forEach((rawItem) => {
      total += 1;
      if (!isObject(rawItem) || Array.isArray(rawItem)) {
        rejected += 1;
        return;
      }

      const title = options.sanitizeText(String(rawItem.title || ''), options.titleMaxLength);
      if (title === '') {
        rejected += 1;
        return;
      }

      const item: Record<string, unknown> = { title };
      const artist = options.sanitizeText(String(rawItem.artist || ''), options.artistMaxLength);
      if (artist !== '') item.artist = artist;

      const desc = options.sanitizeDesc(String(rawItem.desc || ''), options.descMaxLength);
      if (desc !== '') item.desc = desc;

      let hasUnsafeUrl = false;
      ['file', 'image', 'thumb'].forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(rawItem, key)) return;
        const value = String((rawItem as Record<string, unknown>)[key] || '').trim();
        if (value === '') return;
        if (hasUnsafeScheme(value)) {
          hasUnsafeUrl = true;
          return;
        }
        item[key] = options.sanitizeText(value, 300);
      });
      if (hasUnsafeUrl) {
        rejected += 1;
        return;
      }

      if (Object.prototype.hasOwnProperty.call(rawItem, 'videoid')) {
        const videoid = options.sanitizeText(String(rawItem.videoid || ''), 100);
        if (videoid !== '') {
          item.videoid = videoid;
        }
      }

      ['start', 'end', 'fadein', 'fadeout'].forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(rawItem, key)) return;
        const num = normalizeNonNegativeNumber((rawItem as Record<string, unknown>)[key]);
        if (num !== null) {
          item[key] = num;
        }
      });

      if (Object.prototype.hasOwnProperty.call(rawItem, 'volume')) {
        const volume = normalizeNonNegativeNumber(rawItem.volume);
        if (volume !== null) {
          item.volume = Math.max(0, Math.min(100, volume));
        }
      }

      ['fs', 'cc', 'controls', 'disablekb'].forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(rawItem, key)) return;
        const boolValue = normalizeBoolish((rawItem as Record<string, unknown>)[key]);
        if (boolValue !== null) {
          item[key] = boolValue;
        }
      });

      normalizedItems.push(item);
    });

    normalized[safeCategory] = normalizedItems;
  }

  if (rejected > 10 || (rejected / Math.max(1, total)) > 0.05) {
    return null;
  }
  const categoryCount = Object.keys(normalized).filter((key) => key !== 'options').length;
  if (categoryCount === 0) {
    return null;
  }

  return { playlist: normalized, rejected, total };
}

export async function postImportedPlaylist(options: {
  baseUrl: string;
  filename: string;
  playlist: Record<string, unknown>;
}): Promise<{ state?: string; data?: { message?: string; filename?: string } } | undefined> {
  try {
    const rawResponse = await fetch(`${options.baseUrl}playlist-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: options.filename,
        playlist: options.playlist,
      }),
      credentials: 'same-origin',
    });
    const payload = await rawResponse.json().catch(() => null);
    if (payload && typeof payload === 'object') {
      return payload as { state?: string; data?: { message?: string; filename?: string } };
    }
  } catch (_error) {
    return undefined;
  }

  return undefined;
}

export function persistImportedCloudPlaylist(playlist: Record<string, unknown>): boolean {
  try {
    writeMyPlaylistJson(JSON.stringify(playlist, null, 2));
    return true;
  } catch (_error) {
    return false;
  }
}

export function resolveImportedPlaylistPersistResult(
  response: { state?: string; data?: { message?: string; filename?: string } } | null | undefined,
  fallbackErrorMessage: string,
  fallbackSuccessMessage: string
): PlaylistImportPersistResult {
  if (!response || response.state !== 'ok' || !response.data?.filename) {
    return {
      ok: false,
      message: response?.data?.message || fallbackErrorMessage,
    };
  }

  return {
    ok: true,
    filename: response.data.filename,
    message: response.data.message || fallbackSuccessMessage,
  };
}
