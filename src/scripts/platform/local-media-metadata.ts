import type { IAudioMetadata, ITag } from 'music-metadata';
import type { YouTubeMetadataPayload } from '../types/ambient';

interface LocalMediaMetadataOptions {
  fallbackTitle?: string;
}

type LocalMediaMetadataReason = 'unsupported-format' | 'not-found' | 'parse-error';

const TITLE_NATIVE_TAGS = ['TIT2', 'TT2', 'TIT3', 'TT3'];
const ARTIST_NATIVE_TAGS = ['TPE1', 'TP1', 'TPE2', 'TP2', 'TPE3', 'TP3', 'TPE4', 'TP4', 'TOPE', 'TOA'];
const DESCRIPTION_NATIVE_TAGS = ['COMM', 'COM', 'TIT1', 'TT1'];

function normalizeTextValue(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function firstTextValue(...values: Array<unknown>): string {
  for (const value of values) {
    if (Array.isArray(value)) {
      const normalizedValues = value
        .map((entry) => normalizeTagValue(entry))
        .filter((entry) => entry !== '');
      if (normalizedValues.length > 0) {
        return normalizedValues.join(', ');
      }
      continue;
    }

    const normalizedValue = normalizeTagValue(value);
    if (normalizedValue !== '') {
      return normalizedValue;
    }
  }
  return '';
}

function normalizeTagValue(value: unknown): string {
  if (typeof value === 'string') {
    return normalizeTextValue(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return normalizeTextValue(String(value));
  }
  if (value && typeof value === 'object') {
    if ('text' in value) {
      return normalizeTagValue((value as { text?: unknown }).text);
    }
    if ('description' in value) {
      return normalizeTagValue((value as { description?: unknown }).description);
    }
    if ('value' in value) {
      return normalizeTagValue((value as { value?: unknown }).value);
    }
  }
  return '';
}

function findNativeText(metadata: IAudioMetadata, tagIds: string[]): string {
  for (const tagId of tagIds) {
    for (const tagList of Object.values(metadata.native)) {
      const matchedTag = tagList.find((tag: ITag) => tag.id === tagId);
      const normalizedValue = normalizeTagValue(matchedTag?.value);
      if (normalizedValue !== '') {
        return normalizedValue;
      }
    }
  }
  return '';
}

function getDescription(metadata: IAudioMetadata): string {
  return firstTextValue(
    metadata.common.comment,
    metadata.common.grouping,
    findNativeText(metadata, DESCRIPTION_NATIVE_TAGS)
  );
}

function getArtist(metadata: IAudioMetadata): string {
  return firstTextValue(
    metadata.common.artists,
    metadata.common.artist,
    metadata.common.albumartists,
    metadata.common.albumartist,
    findNativeText(metadata, ARTIST_NATIVE_TAGS)
  );
}

function getTitle(metadata: IAudioMetadata, fallbackTitle: string): string {
  return firstTextValue(
    metadata.common.title,
    metadata.common.subtitle,
    findNativeText(metadata, TITLE_NATIVE_TAGS),
    fallbackTitle
  );
}

export async function extractLocalMediaMetadata(file: File, options: LocalMediaMetadataOptions = {}): Promise<{
  ok: boolean;
  data?: YouTubeMetadataPayload;
  reason?: LocalMediaMetadataReason;
}> {
  try {
    const { parseBlob } = await import('music-metadata');
    const metadata = await parseBlob(file, { duration: false });
    console.log('[Ambient] local media metadata', {
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
      metadata,
    });
    const fallbackTitle = normalizeTextValue(options.fallbackTitle || '');
    const result = {
      title: getTitle(metadata, fallbackTitle),
      artist: getArtist(metadata),
      desc: getDescription(metadata),
    };

    if (result.title === '' && result.artist === '' && result.desc === '') {
      return { ok: false, reason: 'not-found' };
    }

    return {
      ok: true,
      data: {
        videoId: '',
        title: result.title,
        artist: result.artist,
        desc: result.desc,
        source: 'local-file-metadata',
      },
    };
  } catch (_error) {
    return { ok: false, reason: 'parse-error' };
  }
}
