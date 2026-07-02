import type { MediaItem } from '../../types/ambient';
import { resolvePlaybackSource, type PlaybackSourceType } from './player-setup';

export interface PlaybackTarget {
  nextId: number;
  mediaData: MediaItem;
  mediaSrc: string | null;
  playerType: PlaybackSourceType | null;
}

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

export function findMediaById(mediaItems: MediaItem[], targetId: number | null): MediaItem | null {
  if (targetId === null) {
    return null;
  }
  return mediaItems.find((item) => item.amId === targetId) || null;
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
