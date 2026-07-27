import type { MediaItem } from '../../types/ambient';
import {
  type PlaybackSetupPlan,
  resolvePlaybackSetupPlan,
  resolvePlaybackSource,
  type PlaybackSourceType,
  type PlayableSetupKind,
} from './player-setup';

export interface PlaybackTarget {
  nextId: number;
  mediaData: MediaItem;
  mediaSrc: string | null;
  playerType: PlaybackSourceType | null;
}

export interface PlaybackSelection {
  mediaData: MediaItem;
  playbackPlan: PlaybackSetupPlan;
}

export interface PlaybackInvocation extends PlaybackSelection {
  targetId: number;
}

export interface PlayableTransitionTarget extends PlaybackTarget {
  setupKind: PlayableSetupKind;
}

export type YouTubeTransitionCleanupMode = 'destroy' | 'remove_host' | 'none';

export function resolveNextPlaybackTarget(
  mediaItems: MediaItem[],
  nextId: number | null
): PlaybackTarget | null {
  if (nextId === null) {
    return null;
  }

  const mediaData = mediaItems.find((item) => item.amId === nextId);
  if (!mediaData) {
    return null;
  }

  const { src: mediaSrc, type: playerType } = resolvePlaybackSource(mediaData);

  return {
    nextId,
    mediaData,
    mediaSrc,
    playerType,
  };
}

export function resolveLoopAwareNextId(currentId: number | null, nextId: number | null, loop: boolean): number | null {
  if (loop) {
    return currentId;
  }
  return nextId;
}

export function resolveEndedPlaybackTarget(
  mediaItems: MediaItem[],
  currentId: number | null,
  nextId: number | null,
  loop: boolean
): PlaybackTarget | null {
  return resolveNextPlaybackTarget(mediaItems, resolveLoopAwareNextId(currentId, nextId, loop));
}

export function resolveYouTubeTransitionCleanupMode(
  playbackTarget: PlaybackTarget | null
): YouTubeTransitionCleanupMode {
  if (!playbackTarget) {
    return 'none';
  }
  if (playbackTarget.playerType === 'html') {
    return 'destroy';
  }
  if (playbackTarget.playerType === 'youtube') {
    return 'remove_host';
  }
  return 'none';
}

export function applyYouTubeTransitionCleanup(
  eventTarget: { destroy?: () => void; g?: { remove?: () => void } } | null | undefined,
  cleanupMode: YouTubeTransitionCleanupMode
): void {
  if (!eventTarget) {
    return;
  }
  if (cleanupMode === 'destroy') {
    eventTarget.destroy?.();
    return;
  }
  if (cleanupMode === 'remove_host') {
    eventTarget.g?.remove?.();
  }
}

export function resolvePlaybackTargetSetupKind(
  playbackTarget: PlaybackTarget | null,
  getExtension: (src: string) => string
): PlayableSetupKind | null {
  if (!playbackTarget) {
    return null;
  }
  if (playbackTarget.playerType === 'youtube') {
    return 'youtube';
  }

  const setupKind = resolvePlaybackSetupPlan({
    mediaData: playbackTarget.mediaData,
    getExtension,
  }).kind;

  if (setupKind === 'missing') {
    return null;
  }

  return setupKind;
}

export function resolvePlayableTransitionTarget(
  playbackTarget: PlaybackTarget | null,
  getExtension: (src: string) => string
): PlayableTransitionTarget | null {
  if (!playbackTarget) {
    return null;
  }

  const setupKind = resolvePlaybackTargetSetupKind(playbackTarget, getExtension);
  if (!setupKind) {
    return null;
  }

  return {
    ...playbackTarget,
    setupKind,
  };
}

export function runPlaybackTransition(options: {
  playbackTarget: PlaybackTarget | null;
  getExtension: (src: string) => string;
  updatePlayStatus: (nextId: number) => void;
  setupPlayer: (setupKind: PlayableSetupKind, mediaSrc: string | null, mediaData: MediaItem) => void;
}): void {
  const playableTarget = resolvePlayableTransitionTarget(options.playbackTarget, options.getExtension);
  if (!playableTarget) {
    return;
  }

  options.updatePlayStatus(playableTarget.nextId);
  options.setupPlayer(playableTarget.setupKind, playableTarget.mediaSrc, playableTarget.mediaData);
}

export function findMediaById(mediaItems: MediaItem[], targetId: number | null): MediaItem | null {
  if (targetId === null) {
    return null;
  }
  return mediaItems.find((item) => item.amId === targetId) || null;
}

export function resolvePlaybackSelectionById(options: {
  mediaItems: MediaItem[];
  targetId: number | null;
  getExtension: (src: string) => string;
}): PlaybackSelection | null {
  const mediaData = findMediaById(options.mediaItems, options.targetId);
  if (!mediaData) {
    return null;
  }

  return {
    mediaData,
    playbackPlan: resolvePlaybackSetupPlan({
      mediaData,
      getExtension: options.getExtension,
    }),
  };
}

export function resolvePlaybackInvocation(options: {
  mediaItems: MediaItem[];
  triggerElement?: HTMLElement | null;
  targetId?: number | null;
  getExtension: (src: string) => string;
}): PlaybackInvocation | null {
  const resolvedTargetId = options.targetId !== undefined && options.targetId !== null
    ? options.targetId
    : Number(options.triggerElement?.dataset?.playlistItem || 0);

  const selection = resolvePlaybackSelectionById({
    mediaItems: options.mediaItems,
    targetId: resolvedTargetId,
    getExtension: options.getExtension,
  });
  if (!selection) {
    return null;
  }

  return {
    targetId: resolvedTargetId,
    ...selection,
  };
}

export function resolveSeekRange(mediaData: MediaItem, fallbackEnd: number): {
  seekStart: number;
  seekEnd: number;
} {
  const seekStart = mediaData.hasOwnProperty('start') && mediaData.start !== ''
    ? parseFloat(String(mediaData.start))
    : 0;
  const seekEnd = mediaData.hasOwnProperty('end') && mediaData.end !== ''
    ? parseFloat(String(mediaData.end))
    : fallbackEnd;

  return { seekStart, seekEnd };
}

export function resolvePlaybackNeighborIds(options: {
  currentId: number;
  candidateIds: number[];
  order: 'normal' | 'random';
}): {
  prevId: number | null;
  nextId: number | null;
} {
  let candidateIds = [...options.candidateIds];

  if (options.order === 'random') {
    if (candidateIds.length > 1) {
      candidateIds = candidateIds.filter((id) => id !== options.currentId);
    }
    return {
      prevId: candidateIds[Math.floor(Math.random() * candidateIds.length)] ?? null,
      nextId: candidateIds[Math.floor(Math.random() * candidateIds.length)] ?? null,
    };
  }

  let prevId: number | null = null;
  let nextId: number | null = null;
  candidateIds.forEach((id, index) => {
    if (id === options.currentId) {
      prevId = (index === 0 ? candidateIds[candidateIds.length - 1] : candidateIds[index - 1]) ?? null;
      nextId = (candidateIds.length === index + 1 ? candidateIds[0] : candidateIds[index + 1]) ?? null;
    }
  });

  return { prevId, nextId };
}

export function resolvePlaybackCandidateIds(options: {
  mediaItems: MediaItem[];
  categoryId: number | null;
  shuffleEnabled: boolean;
  shuffleItems?: MediaItem[] | null;
}): number[] {
  if (options.shuffleEnabled && (options.shuffleItems || []).length > 0) {
    return (options.shuffleItems || []).map((item) => item.amId);
  }

  const scopedItems = options.categoryId !== null && options.categoryId !== -1
    ? options.mediaItems.filter((item) => item.catId === options.categoryId)
    : options.mediaItems;

  return scopedItems.map((item) => item.amId);
}

export function resolvePlaybackStatusUpdate(options: {
  mediaItems: MediaItem[];
  categoryId: number | null;
  shuffleEnabled: boolean;
  shuffleItems?: MediaItem[] | null;
  currentId: number;
  order: 'normal' | 'random';
}): {
  currentId: number;
  prevId: number | null;
  nextId: number | null;
} {
  const candidateIds = resolvePlaybackCandidateIds({
    mediaItems: options.mediaItems,
    categoryId: options.categoryId,
    shuffleEnabled: options.shuffleEnabled,
    shuffleItems: options.shuffleItems,
  });
  const { prevId, nextId } = resolvePlaybackNeighborIds({
    currentId: options.currentId,
    candidateIds,
    order: options.order,
  });

  return {
    currentId: options.currentId,
    prevId,
    nextId,
  };
}

export function resolveRequestedPlayId(options: {
  currentId: number | null;
  candidateIds: number[];
  order: 'normal' | 'random';
}): number {
  if (options.currentId !== null) {
    return options.currentId;
  }

  if (options.order === 'random') {
    return options.candidateIds[Math.floor(Math.random() * options.candidateIds.length)] ?? 0;
  }

  return options.candidateIds[0] ?? 0;
}
