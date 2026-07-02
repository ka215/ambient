import type { MediaItem } from '../../types/ambient';

export interface PlaybackTarget {
  nextId: number;
  mediaData: MediaItem;
  mediaSrc: string | null;
  playerType: string | null;
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

  let mediaSrc: string | null = null;
  let playerType: string | null = null;

  if (mediaData.hasOwnProperty('file') && mediaData.file !== '') {
    mediaSrc = mediaData.file ?? null;
    playerType = 'html';
  }

  if (mediaData.hasOwnProperty('videoid') && mediaData.videoid !== '') {
    mediaSrc = mediaData.videoid ?? null;
    playerType = 'youtube';
  }

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
