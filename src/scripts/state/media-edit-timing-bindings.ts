import type { MediaItem } from '../types/ambient';
import type { MediaEditDraft } from './media-edit-draft';
import {
  getMediaEditComputedFadeDurations,
  getMediaEditTimingFromStoredDurations,
  resolveMediaEditEffectiveEnd,
  resolveMediaEditKnownDuration,
} from '../domain/media-edit-timing';
import {
  setMediaEditSeekTimelineLoadingView,
  syncMediaEditSeekTimelineView,
} from '../ui/media-edit-timing-view';
import { createMediaEditDurationSyncController } from './media-edit-duration-sync';

export function createMediaEditTimingBindings(options: {
  timeline: HTMLElement | null;
  timelineLoading: HTMLElement | null;
  fixedStartTime: HTMLElement | null;
  fixedEndTime: HTMLElement | null;
  startMarker: HTMLElement | null;
  startLabel: HTMLElement | null;
  fadeInMarker: HTMLElement | null;
  fadeInLabel: HTMLElement | null;
  fadeOutMarker: HTMLElement | null;
  fadeOutLabel: HTMLElement | null;
  endMarker: HTMLElement | null;
  endLabel: HTMLElement | null;
  seekStartHms: HTMLElement | null;
  seekEndHms: HTMLElement | null;
  fadeInEndHms: HTMLElement | null;
  fadeOutStartHms: HTMLElement | null;
  seekStartField: HTMLInputElement | null;
  seekEndField: HTMLInputElement | null;
  fadeInEndField: HTMLInputElement | null;
  fadeOutStartField: HTMLInputElement | null;
  timeoutMs: number;
  pollMs: number;
  getActiveItem: () => MediaItem | null;
  getPreviewDurationSeconds: () => number | null;
  getItemIdentity: (mediaItem: MediaItem) => string;
  normalizeTimingValue: (value: unknown, fallback?: number | null) => number | null;
  parseMediaTimeToIntegerSeconds: (value: unknown) => number | null;
  formatSecondsToHHMMSS: (value: number | null) => string;
  formatSecondsToTimelineLabel: (value: number | null) => string;
}): {
  resolveMediaEditEffectiveEnd: (
    seekEnd: number | null,
    duration: number | null,
    seekStart: number | null,
    fallbackFadeoutDuration?: number | null
  ) => number | null;
  resolveMediaEditKnownDuration: (mediaItem: MediaItem | null) => number | null;
  getMediaEditTimingFromStoredDurations: (mediaItem: MediaItem) => {
    seekStart: number | null;
    seekEnd: number | null;
    fadeInEnd: number | null;
    fadeOutStart: number | null;
  };
  getMediaEditComputedFadeDurations: (item: MediaItem, draft: MediaEditDraft) => {
    fadein: number | '';
    fadeout: number | '';
  };
  syncMediaEditTimingDisplay: () => void;
  mediaEditDurationSync: ReturnType<typeof createMediaEditDurationSyncController>;
} {
  function resolveKnownDuration(mediaItem: MediaItem | null): number | null {
    return resolveMediaEditKnownDuration({
      mediaItem,
      activeItem: options.getActiveItem(),
      previewDurationSeconds: options.getPreviewDurationSeconds(),
      getItemIdentity: options.getItemIdentity,
      normalizeTimingValue: options.normalizeTimingValue,
    });
  }

  function syncMediaEditSeekTimeline(
    seekStart: number | null,
    seekEnd: number | null,
    fadeInEnd: number | null,
    fadeOutStart: number | null
  ): void {
    syncMediaEditSeekTimelineView({
      timeline: options.timeline,
      timelineLoading: options.timelineLoading,
      fixedStartTime: options.fixedStartTime,
      fixedEndTime: options.fixedEndTime,
      startMarker: options.startMarker,
      startLabel: options.startLabel,
      fadeInMarker: options.fadeInMarker,
      fadeInLabel: options.fadeInLabel,
      fadeOutMarker: options.fadeOutMarker,
      fadeOutLabel: options.fadeOutLabel,
      endMarker: options.endMarker,
      endLabel: options.endLabel,
      seekStart,
      seekEnd,
      fadeInEnd,
      fadeOutStart,
      knownDuration: resolveKnownDuration(options.getActiveItem()),
      formatSecondsToTimelineLabel: options.formatSecondsToTimelineLabel,
    });
  }

  function setMediaEditSeekTimelineLoading(isLoading: boolean): void {
    setMediaEditSeekTimelineLoadingView(options.timeline, options.timelineLoading, isLoading);
  }

  function resolveEffectiveEnd(
    seekEnd: number | null,
    duration: number | null,
    seekStart: number | null,
    fallbackFadeoutDuration: number | null = null
  ): number | null {
    return resolveMediaEditEffectiveEnd(seekEnd, duration, seekStart, fallbackFadeoutDuration);
  }

  function getTimingFromStoredDurations(mediaItem: MediaItem): {
    seekStart: number | null;
    seekEnd: number | null;
    fadeInEnd: number | null;
    fadeOutStart: number | null;
  } {
    return getMediaEditTimingFromStoredDurations({
      mediaItem,
      activeItem: options.getActiveItem(),
      previewDurationSeconds: options.getPreviewDurationSeconds(),
      getItemIdentity: options.getItemIdentity,
      normalizeTimingValue: options.normalizeTimingValue,
    });
  }

  function getComputedFadeDurations(item: MediaItem, draft: MediaEditDraft): {
    fadein: number | '';
    fadeout: number | '';
  } {
    return getMediaEditComputedFadeDurations({
      item,
      draft,
      activeItem: options.getActiveItem(),
      previewDurationSeconds: options.getPreviewDurationSeconds(),
      getItemIdentity: options.getItemIdentity,
      normalizeTimingValue: options.normalizeTimingValue,
    });
  }

  function syncMediaEditTimingDisplay(): void {
    const seekStart = options.parseMediaTimeToIntegerSeconds(options.seekStartField?.value || '');
    const seekEnd = options.parseMediaTimeToIntegerSeconds(options.seekEndField?.value || '');
    const fadeInEnd = options.parseMediaTimeToIntegerSeconds(options.fadeInEndField?.value || '');
    const fadeOutStart = options.parseMediaTimeToIntegerSeconds(options.fadeOutStartField?.value || '');

    if (options.seekStartHms) {
      options.seekStartHms.textContent = options.formatSecondsToHHMMSS(seekStart);
    }
    if (options.seekEndHms) {
      options.seekEndHms.textContent = options.formatSecondsToHHMMSS(seekEnd);
    }
    if (options.fadeInEndHms) {
      options.fadeInEndHms.textContent = options.formatSecondsToHHMMSS(fadeInEnd);
    }
    if (options.fadeOutStartHms) {
      options.fadeOutStartHms.textContent = options.formatSecondsToHHMMSS(fadeOutStart);
    }

    syncMediaEditSeekTimeline(seekStart, seekEnd, fadeInEnd, fadeOutStart);
  }

  const mediaEditDurationSync = createMediaEditDurationSyncController({
    timeoutMs: options.timeoutMs,
    pollMs: options.pollMs,
    onSetLoading: setMediaEditSeekTimelineLoading,
    getActiveItemKey: () => {
      const activeItem = options.getActiveItem();
      return activeItem ? options.getItemIdentity(activeItem) : null;
    },
    hasKnownDuration: () => resolveKnownDuration(options.getActiveItem()) !== null,
    onSyncReady: syncMediaEditTimingDisplay,
  });

  return {
    resolveMediaEditEffectiveEnd: resolveEffectiveEnd,
    resolveMediaEditKnownDuration: resolveKnownDuration,
    getMediaEditTimingFromStoredDurations: getTimingFromStoredDurations,
    getMediaEditComputedFadeDurations: getComputedFadeDurations,
    syncMediaEditTimingDisplay,
    mediaEditDurationSync,
  };
}
