import type { MediaItem } from '../../types/ambient';
import type { PlayableSetupKind } from './player-setup';
import { resolvePlaybackInvocation, resolvePlaybackStatusUpdate } from './player-runtime';

export function updatePlaybackStatus(options: {
  mediaItems: MediaItem[];
  categoryId: number | null;
  shuffleEnabled: boolean;
  shuffleItems?: MediaItem[] | null;
  currentId: number;
  order: 'normal' | 'random';
  applyPlaybackStatus: (status: {
    currentId: number;
    prevId: number | null;
    nextId: number | null;
  }) => void;
}): void {
  const playbackStatus = resolvePlaybackStatusUpdate({
    mediaItems: options.mediaItems,
    categoryId: options.categoryId,
    shuffleEnabled: options.shuffleEnabled,
    shuffleItems: options.shuffleItems,
    currentId: options.currentId,
    order: options.order,
  });
  options.applyPlaybackStatus(playbackStatus);
}

export function playMediaSelection(options: {
  mediaItems: MediaItem[];
  triggerElement?: HTMLElement | null;
  targetId?: number | null;
  getExtension: (src: string) => string;
  logger: (...args: unknown[]) => void;
  updatePlayStatus: (targetId: number) => void;
  closeResponsiveDrawers: () => void;
  reportMissingSource: (mediaData: MediaItem) => void;
  setupPlayer: (
    setupKind: PlayableSetupKind,
    src: string | null,
    mediaData: MediaItem,
    extension?: string | null
  ) => void;
}): void {
  const invocation = resolvePlaybackInvocation({
    mediaItems: options.mediaItems,
    triggerElement: options.triggerElement,
    targetId: options.targetId,
    getExtension: options.getExtension,
  });
  if (!invocation) {
    return;
  }

  const { targetId, mediaData, playbackPlan } = invocation;
  options.logger('playItem:', targetId, playbackPlan.src, playbackPlan.kind);
  options.updatePlayStatus(targetId);
  options.closeResponsiveDrawers();

  if (playbackPlan.kind === 'missing') {
    options.reportMissingSource(mediaData);
    return;
  }

  options.setupPlayer(playbackPlan.kind, playbackPlan.src, mediaData, playbackPlan.extension);
}
