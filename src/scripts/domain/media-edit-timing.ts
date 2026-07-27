type NormalizeTimingValue = (value: unknown, fallback?: number | null) => number | null;
type ResolveItemIdentity = (mediaItem: MediaItem) => string;

type MediaEditTimingDraft = {
  seekStart: number | null;
  seekEnd: number | null;
  fadeInEnd: number | null;
  fadeOutStart: number | null;
};

type ResolveKnownDurationOptions = {
  mediaItem: MediaItem | null;
  activeItem: MediaItem | null;
  previewDurationSeconds: number | null;
  getItemIdentity: ResolveItemIdentity;
  normalizeTimingValue: NormalizeTimingValue;
};

type StoredDurationsOptions = ResolveKnownDurationOptions & {
  mediaItem: MediaItem;
};

type ComputedFadeDurationsOptions = {
  item: MediaItem;
  draft: MediaEditTimingDraft;
  activeItem: MediaItem | null;
  previewDurationSeconds: number | null;
  getItemIdentity: ResolveItemIdentity;
  normalizeTimingValue: NormalizeTimingValue;
};

export function parseMediaEditItemDurationSeconds(
  mediaItem: MediaItem | null,
  normalizeTimingValue: NormalizeTimingValue
): number | null {
  if (!mediaItem) {
    return null;
  }
  const durationCandidate = (mediaItem as unknown as Record<string, unknown>)['duration'];
  return normalizeTimingValue(durationCandidate, null);
}

export function resolveMediaEditEffectiveEnd(
  seekEnd: number | null,
  duration: number | null,
  seekStart: number | null,
  fallbackFadeoutDuration: number | null = null
): number | null {
  if (seekEnd !== null) {
    return seekEnd;
  }
  if (duration !== null) {
    return duration;
  }
  if (fallbackFadeoutDuration !== null) {
    return (seekStart ?? 0) + fallbackFadeoutDuration;
  }
  return null;
}

export function resolveMediaEditKnownDuration({
  mediaItem,
  activeItem,
  previewDurationSeconds,
  getItemIdentity,
  normalizeTimingValue,
}: ResolveKnownDurationOptions): number | null {
  const itemDuration = parseMediaEditItemDurationSeconds(mediaItem, normalizeTimingValue);
  if (itemDuration !== null) {
    return itemDuration;
  }
  if (mediaItem && activeItem && getItemIdentity(mediaItem) === getItemIdentity(activeItem)) {
    return previewDurationSeconds;
  }
  return null;
}

export function getMediaEditTimingFromStoredDurations({
  mediaItem,
  activeItem,
  previewDurationSeconds,
  getItemIdentity,
  normalizeTimingValue,
}: StoredDurationsOptions): {
  seekStart: number | null;
  seekEnd: number | null;
  fadeInEnd: number | null;
  fadeOutStart: number | null;
} {
  const seekStart = normalizeTimingValue(mediaItem.start, null);
  const seekEnd = normalizeTimingValue(mediaItem.end, null);
  const storedFadein = normalizeTimingValue(mediaItem.fadein, null);
  const storedFadeout = normalizeTimingValue(mediaItem.fadeout, null);
  const duration = resolveMediaEditKnownDuration({
    mediaItem,
    activeItem,
    previewDurationSeconds,
    getItemIdentity,
    normalizeTimingValue,
  });
  const effectiveEnd = resolveMediaEditEffectiveEnd(seekEnd, duration, seekStart, storedFadeout);
  return {
    seekStart,
    seekEnd,
    fadeInEnd: storedFadein !== null ? (seekStart ?? 0) + storedFadein : null,
    fadeOutStart: storedFadeout !== null && effectiveEnd !== null
      ? Math.max(0, effectiveEnd - storedFadeout)
      : null,
  };
}

export function getMediaEditComputedFadeDurations({
  item,
  draft,
  activeItem,
  previewDurationSeconds,
  getItemIdentity,
  normalizeTimingValue,
}: ComputedFadeDurationsOptions): {
  fadein: number | '';
  fadeout: number | '';
} {
  const seekStart = draft.seekStart ?? 0;
  const fadein = draft.fadeInEnd !== null
    ? Math.max(0, draft.fadeInEnd - seekStart)
    : '';

  const currentStoredFadeout = normalizeTimingValue(item.fadeout, null);
  const effectiveEnd = resolveMediaEditEffectiveEnd(
    draft.seekEnd,
    resolveMediaEditKnownDuration({
      mediaItem: item,
      activeItem,
      previewDurationSeconds,
      getItemIdentity,
      normalizeTimingValue,
    }),
    draft.seekStart,
    currentStoredFadeout
  );
  const fadeout = draft.fadeOutStart !== null
    ? (effectiveEnd !== null
      ? Math.max(0, effectiveEnd - draft.fadeOutStart)
      : (currentStoredFadeout ?? ''))
    : '';

  return { fadein, fadeout };
}
