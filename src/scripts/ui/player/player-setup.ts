import type { MediaItem } from '../../types/ambient';

export type PlaybackSourceType = 'youtube' | 'html';
export type HtmlPlayerKind = 'audio' | 'video';
export type PlaybackSetupKind = 'youtube' | 'audio' | 'video' | 'missing' | 'unsupported_html' | 'unsupported_player';
export type PlayableSetupKind = Exclude<PlaybackSetupKind, 'missing'>;
export type ActivePlayerType = HtmlPlayerKind | 'youtube' | null;

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

export interface PlaybackSetupResolution {
  playerType: ActivePlayerType;
  youtubeSignal: {
    phase: 'inactive' | 'error';
    error?: string;
  } | null;
  issue: {
    reason: 'unsupported_file_format' | 'unsupported_player_specified';
    details: Record<string, unknown>;
  } | null;
}

export interface PlaybackSetupDispatch {
  setupKind: PlayableSetupKind;
  onYouTube: () => void;
  onHtml: (kind: HtmlPlayerKind) => void;
}

export interface ResolvedPlaybackSetupWorkflow {
  setupKind: PlayableSetupKind;
  src: string | null;
  extension: string | null;
  getExtension: (src: string) => string;
  onPlayerTypeResolved: (playerType: ActivePlayerType) => void;
  onYouTubeSignal: (phase: 'inactive' | 'error', error?: string) => void;
  onIssue: (issue: NonNullable<PlaybackSetupResolution['issue']>) => void;
  onYouTube: () => void;
  onHtml: (kind: HtmlPlayerKind) => void;
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

function resolveMediaKindHint(mediaData: MediaItem): HtmlPlayerKind | null {
  return mediaData.mediaKind === 'audio' || mediaData.mediaKind === 'video'
    ? mediaData.mediaKind
    : null;
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

    const hintedPlayerKind = resolveMediaKindHint(options.mediaData);
    if (hintedPlayerKind) {
      return {
        kind: hintedPlayerKind,
        sourceType: source.type,
        src: source.src,
        extension,
        htmlPlayerKind: hintedPlayerKind,
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

export function resolvePlaybackSetupResolution(options: {
  setupKind: PlayableSetupKind;
  src: string | null;
  extension: string | null;
  getExtension: (src: string) => string;
}): PlaybackSetupResolution {
  if (options.setupKind === 'youtube') {
    return {
      playerType: 'youtube',
      youtubeSignal: null,
      issue: null,
    };
  }

  if (options.setupKind === 'audio' || options.setupKind === 'video') {
    return {
      playerType: options.setupKind,
      youtubeSignal: {
        phase: 'inactive',
      },
      issue: null,
    };
  }

  if (options.setupKind === 'unsupported_html') {
    return {
      playerType: null,
      youtubeSignal: {
        phase: 'inactive',
      },
      issue: {
        reason: 'unsupported_file_format',
        details: {
          src: options.src,
          extension: options.extension || options.getExtension(options.src || ''),
        },
      },
    };
  }

  return {
    playerType: null,
    youtubeSignal: {
      phase: 'error',
      error: 'unsupported_player_specified',
    },
    issue: {
      reason: 'unsupported_player_specified',
      details: {
        src: options.src,
        type: options.setupKind,
      },
    },
  };
}

export function dispatchPlaybackSetup(options: PlaybackSetupDispatch): void {
  if (options.setupKind === 'youtube') {
    options.onYouTube();
    return;
  }

  if (options.setupKind === 'audio' || options.setupKind === 'video') {
    options.onHtml(options.setupKind);
  }
}

export function runResolvedPlaybackSetup(options: ResolvedPlaybackSetupWorkflow): boolean {
  const setupResolution = resolvePlaybackSetupResolution({
    setupKind: options.setupKind,
    src: options.src,
    extension: options.extension,
    getExtension: options.getExtension,
  });

  options.onPlayerTypeResolved(setupResolution.playerType);

  if (setupResolution.youtubeSignal?.phase === 'inactive') {
    options.onYouTubeSignal('inactive');
  }
  if (setupResolution.youtubeSignal?.phase === 'error') {
    options.onYouTubeSignal('error', setupResolution.youtubeSignal.error || '');
  }
  if (setupResolution.issue) {
    options.onIssue(setupResolution.issue);
    return false;
  }

  dispatchPlaybackSetup({
    setupKind: options.setupKind,
    onYouTube: options.onYouTube,
    onHtml: options.onHtml,
  });
  return true;
}
