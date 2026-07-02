import type { MediaItem } from '../../types/ambient';

export type PlaybackSourceType = 'youtube' | 'html';
export type HtmlPlayerKind = 'audio' | 'video';

export interface ResolvedPlaybackSource {
  type: PlaybackSourceType | null;
  src: string | null;
}

export function resolvePlaybackSource(mediaData: MediaItem): ResolvedPlaybackSource {
  if (mediaData.hasOwnProperty('videoid') && mediaData.videoid !== '') {
    return {
      type: 'youtube',
      src: mediaData.videoid ?? null,
    };
  }

  if (mediaData.hasOwnProperty('file') && mediaData.file !== '') {
    return {
      type: 'html',
      src: mediaData.file ?? null,
    };
  }

  return {
    type: null,
    src: null,
  };
}

export function resolveHtmlPlayerKind(extension: string): HtmlPlayerKind | null {
  if (/^(aac|midi?|mp3|m4a|ogg|opus|wav|weba|wma)$/i.test(extension)) {
    return 'audio';
  }
  if (/^(avi|mpe?g|mp4|ogv|ts|webm|3g(p|2))$/i.test(extension)) {
    return 'video';
  }
  return null;
}
