import type { MediaItem } from '../../types/ambient';
import {
  resolveHtmlMediaMimeType,
  resolveHtmlMediaSourcePath,
  resolveHtmlMediaTagName,
} from './html-player-source';

export type MediaEditPreviewSource =
  | {
    kind: 'youtube';
    videoId: string;
  }
  | {
    kind: 'html';
    sourcePath: string;
    tagName: 'audio' | 'video';
    sourceType: string;
  }
  | {
    kind: 'missing';
  };

export function resolveMediaEditPreviewSource(mediaItem: MediaItem): MediaEditPreviewSource {
  if (mediaItem.videoid && mediaItem.videoid.trim() !== '') {
    return {
      kind: 'youtube',
      videoId: mediaItem.videoid.trim(),
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
    };
  }

  return { kind: 'missing' };
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
