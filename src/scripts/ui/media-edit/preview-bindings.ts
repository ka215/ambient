import type { MediaItem } from '../../types/ambient';
import type { YTPlayer } from '../../types/youtube';
import { destroyHtmlPreviewPlayer } from '../player/html-player-view';
import {
  clearMediaEditPreviewContainerView,
  createManagedMediaEditPreview,
  hideMediaEditPreviewErrorView,
  resolveMediaEditPreviewCurrentTime,
  showMediaEditPreviewErrorView,
} from '../player/media-edit-preview';
import { destroyYouTubePreviewPlayer } from '../player/youtube-player-view';

export function createMediaEditPreviewBindings(options: {
  previewElement: HTMLElement | null;
  errorElement: HTMLElement | null;
  errorMessageElement: HTMLElement | null;
  previewPlayerId: string;
  normalizeTimingValue: (value: unknown, fallback?: number | null) => number | null;
  syncYouTubePreviewDuration: (options: {
    readDuration: () => number | null;
    onDurationResolved: (duration: number | null) => void;
    onDurationAvailable?: () => void;
    hidePreviewError: () => void;
  }) => void;
  getLocalizedMessage: (key: string, fallback?: string) => string;
  mediaEditDurationSync: { clear: () => void; maybeComplete: () => void };
  syncMediaEditTimingDisplay: () => void;
  syncMediaEditDraftStateFromForm: () => void;
  validateAndRenderMediaEditDraftFromForm: () => { valid: boolean };
}): {
  getPreviewDurationSeconds: () => number | null;
  getPreviewSourceItem: () => MediaItem | null;
  setPreviewSourceItem: (mediaItem: MediaItem | null) => void;
  hideMediaEditPreviewError: () => void;
  showMediaEditPreviewError: (message: string) => void;
  destroyMediaEditPreviewPlayer: () => void;
  clearMediaEditPreviewContainer: () => void;
  resetMediaEditPreviewState: () => void;
  getMediaEditPreviewCurrentTime: () => number | null;
  syncMediaEditTimingFieldFromPreview: (field: HTMLInputElement | null, label: string) => void;
  createMediaEditPreview: (mediaItem: MediaItem) => Promise<void>;
} {
  let mediaEditPreviewYouTubePlayer: YTPlayer | null = null;
  let mediaEditPreviewHtmlPlayer: HTMLMediaElement | null = null;
  let mediaEditPreviewSourceItem: MediaItem | null = null;
  let mediaEditPreviewType: 'youtube' | 'audio' | 'video' | null = null;
  let mediaEditPreviewDurationSeconds: number | null = null;

  function hideMediaEditPreviewError(): void {
    hideMediaEditPreviewErrorView({
      errorElement: options.errorElement,
      errorMessageElement: options.errorMessageElement,
    });
  }

  function showMediaEditPreviewError(message: string): void {
    showMediaEditPreviewErrorView({
      errorElement: options.errorElement,
      errorMessageElement: options.errorMessageElement,
      message,
    });
  }

  function destroyMediaEditPreviewPlayer(): void {
    if (mediaEditPreviewYouTubePlayer) {
      destroyYouTubePreviewPlayer(mediaEditPreviewYouTubePlayer);
      mediaEditPreviewYouTubePlayer = null;
    }
    if (mediaEditPreviewHtmlPlayer) {
      destroyHtmlPreviewPlayer(mediaEditPreviewHtmlPlayer);
      mediaEditPreviewHtmlPlayer = null;
    }
    mediaEditPreviewType = null;
  }

  function clearMediaEditPreviewContainer(): void {
    clearMediaEditPreviewContainerView(options.previewElement);
  }

  function resetMediaEditPreviewState(): void {
    options.mediaEditDurationSync.clear();
    destroyMediaEditPreviewPlayer();
    clearMediaEditPreviewContainer();
    mediaEditPreviewSourceItem = null;
    mediaEditPreviewDurationSeconds = null;
    hideMediaEditPreviewError();
  }

  function getMediaEditPreviewCurrentTime(): number | null {
    return resolveMediaEditPreviewCurrentTime({
      previewType: mediaEditPreviewType,
      youtubePlayer: mediaEditPreviewYouTubePlayer,
      htmlPlayer: mediaEditPreviewHtmlPlayer,
    });
  }

  function syncMediaEditTimingFieldFromPreview(field: HTMLInputElement | null, label: string): void {
    if (!field) {
      return;
    }
    const currentTime = getMediaEditPreviewCurrentTime();
    if (currentTime === null) {
      showMediaEditPreviewError(
        options.getLocalizedMessage('mediaEditPreviewSyncFailed', `Unable to sync ${label}. Preview is not ready.`)
      );
      return;
    }
    hideMediaEditPreviewError();
    field.value = String(currentTime);
    options.syncMediaEditTimingDisplay();
    options.syncMediaEditDraftStateFromForm();
    options.validateAndRenderMediaEditDraftFromForm();
  }

  async function createMediaEditPreview(mediaItem: MediaItem): Promise<void> {
    resetMediaEditPreviewState();
    mediaEditPreviewSourceItem = mediaItem;
    const previewState = await createManagedMediaEditPreview({
      mediaItem,
      previewElement: options.previewElement,
      previewPlayerId: options.previewPlayerId,
      normalizeTimingValue: options.normalizeTimingValue,
      syncYouTubePreviewDuration: options.syncYouTubePreviewDuration,
      onDurationResolved: (duration) => {
        mediaEditPreviewDurationSeconds = duration;
        options.validateAndRenderMediaEditDraftFromForm();
      },
      onDurationAvailable: () => {
        options.mediaEditDurationSync.maybeComplete();
      },
      hidePreviewError: hideMediaEditPreviewError,
      showPreviewError: showMediaEditPreviewError,
      getLocalizedMessage: options.getLocalizedMessage,
    });
    mediaEditPreviewType = previewState.previewType;
    mediaEditPreviewYouTubePlayer = previewState.youtubePlayer;
    mediaEditPreviewHtmlPlayer = previewState.htmlPlayer;
  }

  return {
    getPreviewDurationSeconds: () => mediaEditPreviewDurationSeconds,
    getPreviewSourceItem: () => mediaEditPreviewSourceItem,
    setPreviewSourceItem: (mediaItem) => {
      mediaEditPreviewSourceItem = mediaItem;
    },
    hideMediaEditPreviewError,
    showMediaEditPreviewError,
    destroyMediaEditPreviewPlayer,
    clearMediaEditPreviewContainer,
    resetMediaEditPreviewState,
    getMediaEditPreviewCurrentTime,
    syncMediaEditTimingFieldFromPreview,
    createMediaEditPreview,
  };
}
