import type { MediaItem } from '../types/ambient';

export interface MediaEditDraft {
  category: string;
  title: string;
  artist: string;
  description: string;
  volume: number;
  seekStart: number | null;
  seekEnd: number | null;
  fadeInEnd: number | null;
  fadeOutStart: number | null;
  thumbnailMode: 'keep' | 'upload' | 'remove';
  thumbnailName: string;
  thumbnailMime: string;
  thumbnailDataUrl: string;
}

export interface MediaEditDraftInput {
  category?: unknown;
  title?: unknown;
  artist?: unknown;
  description?: unknown;
  volume?: unknown;
  seekStart?: unknown;
  seekEnd?: unknown;
  fadeInEnd?: unknown;
  fadeOutStart?: unknown;
  thumbnailMode?: unknown;
  thumbnailName?: unknown;
  thumbnailMime?: unknown;
  thumbnailDataUrl?: unknown;
}

type SanitizeDraftOptions = {
  draft: MediaEditDraftInput;
  fallback: MediaEditDraft | null;
  defaultVolume: number;
  titleMaxLength: number;
  artistMaxLength: number;
  descriptionMaxLength: number;
  sanitizeText: (value: string, maxLength: number) => string;
  sanitizeDescription: (value: string, maxLength: number) => string;
  normalizeVolume: (value: unknown, fallback: number) => number;
  normalizeTimingValue: (value: unknown, fallback?: number | null) => number | null;
};

export function sanitizeMediaEditDraft(options: SanitizeDraftOptions): MediaEditDraft {
  const fallbackVolume = options.fallback?.volume ?? options.defaultVolume;
  return {
    category: options.sanitizeText(String(options.draft.category ?? options.fallback?.category ?? ''), options.titleMaxLength),
    title: options.sanitizeText(String(options.draft.title ?? options.fallback?.title ?? ''), options.titleMaxLength),
    artist: options.sanitizeText(String(options.draft.artist ?? options.fallback?.artist ?? ''), options.artistMaxLength),
    description: options.sanitizeDescription(
      String(options.draft.description ?? options.fallback?.description ?? ''),
      options.descriptionMaxLength
    ),
    volume: options.normalizeVolume(options.draft.volume ?? fallbackVolume, fallbackVolume),
    seekStart: options.normalizeTimingValue(options.draft.seekStart, options.fallback?.seekStart ?? null),
    seekEnd: options.normalizeTimingValue(options.draft.seekEnd, options.fallback?.seekEnd ?? null),
    fadeInEnd: options.normalizeTimingValue(options.draft.fadeInEnd, options.fallback?.fadeInEnd ?? null),
    fadeOutStart: options.normalizeTimingValue(options.draft.fadeOutStart, options.fallback?.fadeOutStart ?? null),
    thumbnailMode: (options.draft.thumbnailMode as MediaEditDraft['thumbnailMode'] | undefined)
      ?? options.fallback?.thumbnailMode
      ?? 'keep',
    thumbnailName: options.sanitizeText(String(options.draft.thumbnailName ?? options.fallback?.thumbnailName ?? ''), 255),
    thumbnailMime: options.sanitizeText(String(options.draft.thumbnailMime ?? options.fallback?.thumbnailMime ?? ''), 100),
    thumbnailDataUrl: String(options.draft.thumbnailDataUrl ?? options.fallback?.thumbnailDataUrl ?? ''),
  };
}

export function cloneMediaEditDraft(draft: MediaEditDraft): MediaEditDraft {
  return {
    category: draft.category,
    title: draft.title,
    artist: draft.artist,
    description: draft.description,
    volume: draft.volume,
    seekStart: draft.seekStart,
    seekEnd: draft.seekEnd,
    fadeInEnd: draft.fadeInEnd,
    fadeOutStart: draft.fadeOutStart,
    thumbnailMode: draft.thumbnailMode,
    thumbnailName: draft.thumbnailName,
    thumbnailMime: draft.thumbnailMime,
    thumbnailDataUrl: draft.thumbnailDataUrl,
  };
}

export function isSameMediaEditDraft(a: MediaEditDraft, b: MediaEditDraft): boolean {
  return a.category === b.category
    && a.title === b.title
    && a.artist === b.artist
    && a.description === b.description
    && a.volume === b.volume
    && a.seekStart === b.seekStart
    && a.seekEnd === b.seekEnd
    && a.fadeInEnd === b.fadeInEnd
    && a.fadeOutStart === b.fadeOutStart
    && a.thumbnailMode === b.thumbnailMode
    && a.thumbnailName === b.thumbnailName
    && a.thumbnailMime === b.thumbnailMime
    && a.thumbnailDataUrl === b.thumbnailDataUrl;
}

export function createEmptyMediaEditDraft(defaultVolume: number): MediaEditDraft {
  return {
    category: '',
    title: '',
    artist: '',
    description: '',
    volume: defaultVolume,
    seekStart: null,
    seekEnd: null,
    fadeInEnd: null,
    fadeOutStart: null,
    thumbnailMode: 'keep',
    thumbnailName: '',
    thumbnailMime: '',
    thumbnailDataUrl: '',
  };
}

export function createMediaEditDraftKey(playlistKey: string, itemIdentity: string): string {
  return `${playlistKey}::${itemIdentity}`;
}

export function findMediaEditCategoryIndex(
  categories: string[] | null | undefined,
  categoryName: string
): number | null {
  const target = categoryName.trim();
  if (target === '' || !Array.isArray(categories)) {
    return null;
  }
  const index = categories.findIndex((name) => String(name).trim() === target);
  return index >= 0 ? index : null;
}

export function ensureMediaEditCategory(
  categories: string[] | null | undefined,
  categoryName: string
): string[] {
  const nextCategories = Array.isArray(categories) ? [...categories] : [];
  if (findMediaEditCategoryIndex(nextCategories, categoryName) === null) {
    nextCategories.push(categoryName.trim());
  }
  return nextCategories;
}

export function cloneMediaItemsForEdit(mediaItems: MediaItem[] | null | undefined): MediaItem[] | null {
  if (!Array.isArray(mediaItems)) {
    return null;
  }
  return mediaItems.map((item) => ({ ...item }));
}

export function updateMediaEditWorkingCopy(options: {
  mediaItems: MediaItem[] | null | undefined;
  activeMediaId: number | null | undefined;
  applyUpdate: (item: MediaItem) => MediaItem;
}): {
  workingMedia: MediaItem[];
  targetIndex: number;
  updatedItem: MediaItem;
} | null {
  if (!Array.isArray(options.mediaItems) || !Number.isInteger(options.activeMediaId)) {
    return null;
  }
  const workingMedia = cloneMediaItemsForEdit(options.mediaItems);
  if (!workingMedia) {
    return null;
  }
  const targetIndex = workingMedia.findIndex((item) => item.amId === options.activeMediaId);
  if (targetIndex < 0) {
    return null;
  }
  const targetItem = workingMedia[targetIndex];
  if (!targetItem) {
    return null;
  }
  const updatedItem = options.applyUpdate(targetItem);
  workingMedia[targetIndex] = updatedItem;
  return {
    workingMedia,
    targetIndex,
    updatedItem,
  };
}

export function applyMediaEditDraftToItem(options: {
  item: MediaItem;
  draft: MediaEditDraft;
  findCategoryIndexByName: (categoryName: string) => number | null;
  sanitizeDescriptionForStorage: (value: string) => string;
  getComputedFadeDurations: (item: MediaItem, draft: MediaEditDraft) => { fadein: number | ''; fadeout: number | '' };
}): MediaItem {
  const nextItem: MediaItem = { ...options.item };
  const fadeDurations = options.getComputedFadeDurations(options.item, options.draft);
  const categoryIndex = options.findCategoryIndexByName(options.draft.category);
  if (categoryIndex !== null) {
    nextItem.catId = categoryIndex;
  }
  nextItem.title = options.draft.title;
  nextItem.artist = options.draft.artist || '';
  nextItem.desc = options.sanitizeDescriptionForStorage(options.draft.description || '');
  nextItem.volume = options.draft.volume;
  nextItem.start = options.draft.seekStart ?? '';
  nextItem.end = options.draft.seekEnd ?? '';
  nextItem.fadein = fadeDurations.fadein;
  nextItem.fadeout = fadeDurations.fadeout;

  if (options.draft.thumbnailMode === 'remove') {
    nextItem.image = '';
    nextItem.thumb = '';
  } else if (options.draft.thumbnailMode === 'upload' && options.draft.thumbnailName !== '') {
    nextItem.image = options.draft.thumbnailName;
    nextItem.thumb = '';
  }

  return nextItem;
}
