import type { MediaItem } from '../../types/ambient';
import type { YTPlayer } from '../../types/youtube';
import { normalizeExternalMediaUrl } from '../../platform/external-media-url';
import { resolveLocalMediaRangeProxyUrl } from '../../platform/local-media-range-proxy';
import { resolveLocalMediaUrl } from '../../platform/local-media-url-resolver';
import type { PlayerViewKind, PlayerViewSource } from './player-view-types';
import {
  buildYouTubePreviewPlayerConfig,
  createYouTubePreviewHost,
} from './youtube-player-view';
import {
  bindHtmlPreviewLoadEvents,
} from './html-player-events';
import {
  createHtmlPreviewPlayerView,
} from './html-player-view';
import {
  resolveHtmlMediaMimeType,
  resolveHtmlMediaSourcePath,
  resolveHtmlMediaTagName,
} from './html-player-source';

export type MediaEditPreviewSource =
  | {
    kind: 'youtube';
    videoId: string;
    viewSource: PlayerViewSource;
  }
  | {
    kind: 'html';
    sourcePath: string;
    tagName: 'audio' | 'video';
    sourceType: string;
    viewKind: Extract<PlayerViewKind, 'audio' | 'video'>;
    viewSource: PlayerViewSource;
  }
  | {
    kind: 'missing';
  };

export function resolveMediaEditPreviewSource(mediaItem: MediaItem): MediaEditPreviewSource {
  if (mediaItem.videoid && mediaItem.videoid.trim() !== '') {
    const videoId = mediaItem.videoid.trim();
    return {
      kind: 'youtube',
      videoId,
      viewSource: {
        videoId,
        controls: true,
        fullscreen: false,
        rel: 0,
      },
    };
  }

  if (mediaItem.file && mediaItem.file.trim() !== '') {
    const sourcePath = resolveHtmlMediaSourcePath(mediaItem.file);
    const tagName = resolveHtmlMediaTagName(sourcePath);

    return {
      kind: 'html',
      sourcePath,
      tagName,
      sourceType: resolveHtmlMediaMimeType(sourcePath, tagName),
      viewKind: tagName,
      viewSource: {
        filePath: sourcePath,
        sourceType: resolveHtmlMediaMimeType(sourcePath, tagName),
        controls: true,
        fullscreen: false,
      },
    };
  }

  return { kind: 'missing' };
}

export async function resolveMediaEditPreviewSourceAsync(
  mediaItem: MediaItem,
  playlistName?: string | null
): Promise<MediaEditPreviewSource> {
  if (!mediaItem.file || !normalizeExternalMediaUrl(mediaItem.file)) {
    return resolveMediaEditPreviewSource(mediaItem);
  }

  const resolved = await resolveLocalMediaUrl({
    url: mediaItem.file,
    source: 'media-edit-preview',
    phase: 'preview',
  });
  const previewSource = resolveMediaEditPreviewSource({
    ...mediaItem,
    file: resolveLocalMediaRangeProxyUrl({
      mediaItem,
      sourceUrl: resolved.url,
      playlistName,
    }) || resolved.url,
  });

  if (previewSource.kind !== 'html') {
    return previewSource;
  }

  return previewSource;
}

export function resolveMediaEditPreviewCurrentTime(options: {
  previewType: 'youtube' | 'audio' | 'video' | null;
  youtubePlayer: { getCurrentTime: () => number } | null;
  htmlPlayer: HTMLMediaElement | null;
}): number | null {
  try {
    if (options.previewType === 'youtube' && options.youtubePlayer) {
      const currentTime = options.youtubePlayer.getCurrentTime();
      if (Number.isFinite(currentTime) && currentTime >= 0) {
        return Math.trunc(currentTime);
      }
    }

    if (
      (options.previewType === 'audio' || options.previewType === 'video')
      && options.htmlPlayer
    ) {
      const currentTime = options.htmlPlayer.currentTime;
      if (Number.isFinite(currentTime) && currentTime >= 0) {
        return Math.trunc(currentTime);
      }
    }
  } catch (_error) {
    return null;
  }

  return null;
}

export function hideMediaEditPreviewErrorView(options: {
  errorElement: HTMLElement | null;
  errorMessageElement: HTMLElement | null;
}): void {
  options.errorElement?.classList.add('hidden');
  if (options.errorMessageElement) {
    options.errorMessageElement.textContent = '';
  }
}

export function showMediaEditPreviewErrorView(options: {
  errorElement: HTMLElement | null;
  errorMessageElement: HTMLElement | null;
  message: string;
}): void {
  if (options.errorMessageElement) {
    options.errorMessageElement.textContent = options.message;
  }
  options.errorElement?.classList.remove('hidden');
}

export function clearMediaEditPreviewContainerView(containerElement: HTMLElement | null): void {
  if (!containerElement) {
    return;
  }
  containerElement.innerHTML = '';
}

export async function createManagedMediaEditPreview(options: {
  mediaItem: MediaItem;
  previewElement: HTMLElement | null;
  previewPlayerId: string;
  normalizeTimingValue: (value: unknown, fallback: number | null) => number | null;
  syncYouTubePreviewDuration: (options: {
    readDuration: () => number | null;
    onDurationResolved: (duration: number | null) => void;
    onDurationAvailable?: () => void;
    hidePreviewError: () => void;
  }) => void;
  onDurationResolved: (duration: number | null) => void;
  onDurationAvailable: () => void;
  hidePreviewError: () => void;
  showPreviewError: (message: string) => void;
  getLocalizedMessage: (key: string, fallback: string) => string;
}): Promise<{
  previewType: 'youtube' | 'audio' | 'video' | null;
  youtubePlayer: YTPlayer | null;
  htmlPlayer: HTMLMediaElement | null;
}> {
  if (!options.previewElement) {
    return {
      previewType: null,
      youtubePlayer: null,
      htmlPlayer: null,
    };
  }

  const previewSource = await resolveMediaEditPreviewSourceAsync(
    options.mediaItem,
    ((window as any).$ambient?.playlist || (window as any).AmbientData?.currentPlaylist || '') as string
  );

  if (previewSource.kind === 'youtube') {
    createYouTubePreviewHost({
      embedWrapper: options.previewElement,
      playerId: options.previewPlayerId,
    });

    const ytApi = (window as any).YT;
    if (!ytApi || typeof ytApi.Player !== 'function') {
      options.showPreviewError(
        options.getLocalizedMessage('mediaEditPreviewUnavailable', 'Preview is not available. Please retry after the player API loads.')
      );
      return {
        previewType: null,
        youtubePlayer: null,
        htmlPlayer: null,
      };
    }

    try {
      let youtubePlayer: YTPlayer | null = null;
      youtubePlayer = new ytApi.Player(options.previewPlayerId, {
        ...buildYouTubePreviewPlayerConfig(previewSource.videoId),
        events: {
          onReady: () => {
            options.syncYouTubePreviewDuration({
              readDuration: () => options.normalizeTimingValue(youtubePlayer?.getDuration(), null),
              onDurationResolved: options.onDurationResolved,
              onDurationAvailable: options.onDurationAvailable,
              hidePreviewError: options.hidePreviewError,
            });
          },
          onStateChange: () => {
            options.syncYouTubePreviewDuration({
              readDuration: () => options.normalizeTimingValue(youtubePlayer?.getDuration(), null),
              onDurationResolved: (duration) => {
                if (duration === null) {
                  return;
                }
                options.onDurationResolved(duration);
              },
              onDurationAvailable: options.onDurationAvailable,
              hidePreviewError: options.hidePreviewError,
            });
          },
          onError: () => {
            options.showPreviewError(
              options.getLocalizedMessage('mediaEditPreviewLoadFailed', 'Failed to load media preview. Please try again.')
            );
          },
        },
      });

      return {
        previewType: 'youtube',
        youtubePlayer,
        htmlPlayer: null,
      };
    } catch (_error) {
      options.showPreviewError(
        options.getLocalizedMessage('mediaEditPreviewLoadFailed', 'Failed to load media preview. Please try again.')
      );
      return {
        previewType: null,
        youtubePlayer: null,
        htmlPlayer: null,
      };
    }
  }

  if (previewSource.kind === 'html') {
    const { playerElement: htmlPlayer, sourceElement: sourceElement } = createHtmlPreviewPlayerView({
      tagName: previewSource.tagName,
      sourcePath: previewSource.sourcePath,
      sourceType: previewSource.sourceType,
    });

    bindHtmlPreviewLoadEvents({
      playerElement: htmlPlayer,
      sourceElement,
      onLoadedMetadata: () => {
        options.onDurationResolved(options.normalizeTimingValue(htmlPlayer.duration, null));
        options.onDurationAvailable();
        options.hidePreviewError();
      },
      onLoadError: () => {
        options.showPreviewError(
          options.getLocalizedMessage('mediaEditPreviewLoadFailed', 'Failed to load media preview. Please try again.')
        );
      },
    });

    options.previewElement.appendChild(htmlPlayer);
    htmlPlayer.load();

    return {
      previewType: previewSource.tagName,
      youtubePlayer: null,
      htmlPlayer,
    };
  }

  options.showPreviewError(
    options.getLocalizedMessage('mediaEditPreviewNoSource', 'Preview is not available because the media source is missing.')
  );
  return {
    previewType: null,
    youtubePlayer: null,
    htmlPlayer: null,
  };
}
