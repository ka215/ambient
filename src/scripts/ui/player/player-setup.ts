import type { MediaItem } from '../../types/ambient';

export type PlaybackSourceType = 'youtube' | 'html';
export type HtmlPlayerKind = 'audio' | 'video';
export type PlaybackSetupKind = 'youtube' | 'audio' | 'video' | 'missing' | 'unsupported_html' | 'unsupported_player';

export interface ResolvedPlaybackSource {
  type: PlaybackSourceType | null;
  src: string | null;
}

export interface PlaybackSetupPlan {
  kind: PlaybackSetupKind;
  sourceType: PlaybackSourceType | null;
  src: string | null;
  extension: string | null;
  htmlPlayerKind: HtmlPlayerKind | null;
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

export function resolvePlaybackSetupPlan(options: {
  mediaData: MediaItem;
  getExtension: (src: string) => string;
}): PlaybackSetupPlan {
  const source = resolvePlaybackSource(options.mediaData);

  if (!source.type || !source.src) {
    return {
      kind: 'missing',
      sourceType: source.type,
      src: source.src,
      extension: null,
      htmlPlayerKind: null,
    };
  }

  if (source.type === 'youtube') {
    return {
      kind: 'youtube',
      sourceType: source.type,
      src: source.src,
      extension: null,
      htmlPlayerKind: null,
    };
  }

  if (source.type === 'html') {
    const extension = options.getExtension(source.src);
    const htmlPlayerKind = resolveHtmlPlayerKind(extension);
    if (htmlPlayerKind) {
      return {
        kind: htmlPlayerKind,
        sourceType: source.type,
        src: source.src,
        extension,
        htmlPlayerKind,
      };
    }

    return {
      kind: 'unsupported_html',
      sourceType: source.type,
      src: source.src,
      extension,
      htmlPlayerKind: null,
    };
  }

  return {
    kind: 'unsupported_player',
    sourceType: source.type,
    src: source.src,
    extension: null,
    htmlPlayerKind: null,
  };
}
