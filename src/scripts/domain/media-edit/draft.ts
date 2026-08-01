import type { MediaItem } from '../../types/ambient';

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
  youtubeCcOverride: boolean;
  youtubeCc: boolean;
  youtubeFsOverride: boolean;
  youtubeFs: boolean;
  youtubeControlsOverride: boolean;
  youtubeControls: boolean;
  youtubeDisablekbOverride: boolean;
  youtubeDisablekb: boolean;
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
  youtubeCcOverride?: unknown;
  youtubeCc?: unknown;
  youtubeFsOverride?: unknown;
  youtubeFs?: unknown;
  youtubeControlsOverride?: unknown;
  youtubeControls?: unknown;
  youtubeDisablekbOverride?: unknown;
  youtubeDisablekb?: unknown;
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

function normalizeDraftBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'on', 'yes'].includes(normalized)) {
      return true;
    }
    if (['0', 'false', 'off', 'no', ''].includes(normalized)) {
      return false;
    }
  }
  return fallback;
}

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
    youtubeCcOverride: normalizeDraftBoolean(options.draft.youtubeCcOverride, options.fallback?.youtubeCcOverride ?? false),
    youtubeCc: normalizeDraftBoolean(options.draft.youtubeCc, options.fallback?.youtubeCc ?? false),
    youtubeFsOverride: normalizeDraftBoolean(options.draft.youtubeFsOverride, options.fallback?.youtubeFsOverride ?? false),
    youtubeFs: normalizeDraftBoolean(options.draft.youtubeFs, options.fallback?.youtubeFs ?? false),
    youtubeControlsOverride: normalizeDraftBoolean(options.draft.youtubeControlsOverride, options.fallback?.youtubeControlsOverride ?? false),
    youtubeControls: normalizeDraftBoolean(options.draft.youtubeControls, options.fallback?.youtubeControls ?? true),
    youtubeDisablekbOverride: normalizeDraftBoolean(options.draft.youtubeDisablekbOverride, options.fallback?.youtubeDisablekbOverride ?? false),
    youtubeDisablekb: normalizeDraftBoolean(options.draft.youtubeDisablekb, options.fallback?.youtubeDisablekb ?? false),
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
    youtubeCcOverride: draft.youtubeCcOverride,
    youtubeCc: draft.youtubeCc,
    youtubeFsOverride: draft.youtubeFsOverride,
    youtubeFs: draft.youtubeFs,
    youtubeControlsOverride: draft.youtubeControlsOverride,
    youtubeControls: draft.youtubeControls,
    youtubeDisablekbOverride: draft.youtubeDisablekbOverride,
    youtubeDisablekb: draft.youtubeDisablekb,
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
    && a.thumbnailDataUrl === b.thumbnailDataUrl
    && a.youtubeCcOverride === b.youtubeCcOverride
    && a.youtubeCc === b.youtubeCc
    && a.youtubeFsOverride === b.youtubeFsOverride
    && a.youtubeFs === b.youtubeFs
    && a.youtubeControlsOverride === b.youtubeControlsOverride
    && a.youtubeControls === b.youtubeControls
    && a.youtubeDisablekbOverride === b.youtubeDisablekbOverride
    && a.youtubeDisablekb === b.youtubeDisablekb;
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
    youtubeCcOverride: false,
    youtubeCc: false,
    youtubeFsOverride: false,
    youtubeFs: false,
    youtubeControlsOverride: false,
    youtubeControls: true,
    youtubeDisablekbOverride: false,
    youtubeDisablekb: false,
  };
}

export function createMediaEditBaseDraft(options: {
  mediaItem: MediaItem;
  categoryName: string;
  description: string;
  timing: {
    seekStart: number | null;
    seekEnd: number | null;
    fadeInEnd: number | null;
    fadeOutStart: number | null;
  };
  defaultVolume: number;
  sanitizeDraft: (draft: MediaEditDraftInput, fallback: MediaEditDraft | null) => MediaEditDraft;
}): MediaEditDraft {
  return options.sanitizeDraft({
    category: options.categoryName,
    title: options.mediaItem.title || '',
    artist: options.mediaItem.artist || '',
    description: options.description,
    volume: options.mediaItem.volume,
    seekStart: options.timing.seekStart,
    seekEnd: options.timing.seekEnd,
    fadeInEnd: options.timing.fadeInEnd,
    fadeOutStart: options.timing.fadeOutStart,
    thumbnailMode: 'keep',
    thumbnailName: options.mediaItem.image || options.mediaItem.thumb || '',
    thumbnailMime: '',
    thumbnailDataUrl: '',
    youtubeCcOverride: Object.prototype.hasOwnProperty.call(options.mediaItem, 'cc'),
    youtubeCc: normalizeDraftBoolean(options.mediaItem.cc, false),
    youtubeFsOverride: Object.prototype.hasOwnProperty.call(options.mediaItem, 'fs'),
    youtubeFs: normalizeDraftBoolean(options.mediaItem.fs, false),
    youtubeControlsOverride: Object.prototype.hasOwnProperty.call(options.mediaItem, 'controls'),
    youtubeControls: normalizeDraftBoolean(options.mediaItem.controls, true),
    youtubeDisablekbOverride: Object.prototype.hasOwnProperty.call(options.mediaItem, 'disablekb'),
    youtubeDisablekb: normalizeDraftBoolean(options.mediaItem.disablekb, false),
  }, createEmptyMediaEditDraft(options.defaultVolume));
}

export function readMediaEditDraftFromForm(options: {
  fallback: MediaEditDraft;
  activeDraft: MediaEditDraft | null;
  category?: string | null;
  title?: string | null;
  artist?: string | null;
  description?: string | null;
  volume?: number | undefined;
  seekStart?: string | null;
  seekEnd?: string | null;
  fadeInEnd?: string | null;
  fadeOutStart?: string | null;
  youtubeCcOverride?: boolean;
  youtubeCc?: boolean;
  youtubeFsOverride?: boolean;
  youtubeFs?: boolean;
  youtubeControlsOverride?: boolean;
  youtubeControls?: boolean;
  youtubeDisablekbOverride?: boolean;
  youtubeDisablekb?: boolean;
  sanitizeDraft: (draft: MediaEditDraftInput, fallback: MediaEditDraft | null) => MediaEditDraft;
}): MediaEditDraft {
  return options.sanitizeDraft({
    category: options.category,
    title: options.title,
    artist: options.artist,
    description: options.description,
    volume: options.volume,
    seekStart: options.seekStart,
    seekEnd: options.seekEnd,
    fadeInEnd: options.fadeInEnd,
    fadeOutStart: options.fadeOutStart,
    thumbnailMode: options.activeDraft?.thumbnailMode,
    thumbnailName: options.activeDraft?.thumbnailName,
    thumbnailMime: options.activeDraft?.thumbnailMime,
    thumbnailDataUrl: options.activeDraft?.thumbnailDataUrl,
    youtubeCcOverride: options.youtubeCcOverride,
    youtubeCc: options.youtubeCc,
    youtubeFsOverride: options.youtubeFsOverride,
    youtubeFs: options.youtubeFs,
    youtubeControlsOverride: options.youtubeControlsOverride,
    youtubeControls: options.youtubeControls,
    youtubeDisablekbOverride: options.youtubeDisablekbOverride,
    youtubeDisablekb: options.youtubeDisablekb,
  }, options.fallback);
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

  if (options.draft.youtubeCcOverride) {
    nextItem.cc = options.draft.youtubeCc;
  } else {
    delete nextItem.cc;
  }
  if (options.draft.youtubeFsOverride) {
    nextItem.fs = options.draft.youtubeFs;
  } else {
    delete nextItem.fs;
  }
  if (options.draft.youtubeControlsOverride) {
    nextItem.controls = options.draft.youtubeControls;
  } else {
    delete nextItem.controls;
  }
  if (options.draft.youtubeDisablekbOverride) {
    nextItem.disablekb = options.draft.youtubeDisablekb;
  } else {
    delete nextItem.disablekb;
  }

  return nextItem;
}
