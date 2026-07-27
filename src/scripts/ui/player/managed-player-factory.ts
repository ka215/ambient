import type { MediaItem } from '../../types/ambient';
import type { YTPlayerEventHandlers, YTPlayer } from '../../types/youtube';
import {
  applyInitialPlaybackStateToElement,
  buildYouTubePlayerOptions,
  prepareConfiguredPlayback,
  resolveMediaFullscreenEnabled,
  type InitialPlaybackStateResolvers,
  type PlaybackOptionKey,
} from './player-config';
import { createMountedHtmlPlaybackView } from './html-player-view';
import { createMountedYouTubePlayer } from './youtube-player-view';

export interface ManagedPlaybackBaseOptions {
  mediaData: MediaItem;
  getOption: (key: PlaybackOptionKey) => unknown;
  status: { fader?: boolean; volume: number | null };
  resolvers: InitialPlaybackStateResolvers;
}

export function createManagedYouTubePlayback(options: ManagedPlaybackBaseOptions & {
  embedWrapper: HTMLElement;
  playerId: string;
  size: { width: number; height: number };
  events: Required<Pick<YTPlayerEventHandlers, 'onReady' | 'onStateChange' | 'onError'>>;
}): YTPlayer {
  const { playbackConfig } = prepareConfiguredPlayback({
    mediaData: options.mediaData,
    getOption: options.getOption,
    status: options.status,
    resolvers: options.resolvers,
  });
  const playerOptions = buildYouTubePlayerOptions(options.mediaData, playbackConfig);

  return createMountedYouTubePlayer({
    embedWrapper: options.embedWrapper,
    playerId: options.playerId,
    size: options.size,
    videoId: options.mediaData.videoid || '',
    playerVars: playerOptions,
    events: options.events,
  });
}

export function createManagedHtmlPlayback(options: ManagedPlaybackBaseOptions & {
  embedWrapper: HTMLElement;
  watchButton: HTMLAnchorElement;
  optionalContainer: HTMLElement;
  tagName: 'audio' | 'video';
  getPlaceholderPath: () => string;
  isFullWindowMode: () => boolean;
  getFullWindowPlayerSize: () => { width: number; height: number };
  getViewportWidth: () => number;
}): ReturnType<typeof createMountedHtmlPlaybackView> & {
  playbackConfig: ReturnType<typeof prepareConfiguredPlayback>['playbackConfig'];
} {
  const { playbackConfig, initialPlaybackState } = prepareConfiguredPlayback({
    mediaData: options.mediaData,
    getOption: options.getOption,
    status: options.status,
    resolvers: options.resolvers,
  });
  const htmlPlaybackView = createMountedHtmlPlaybackView({
    embedWrapper: options.embedWrapper,
    watchButton: options.watchButton,
    optionalContainer: options.optionalContainer,
    tagName: options.tagName,
    mediaData: options.mediaData,
    controls: String(playbackConfig.controls || ''),
    autoplay: String(playbackConfig.autoplay || ''),
    allowFullScreen: resolveMediaFullscreenEnabled(options.mediaData, playbackConfig.fs),
    getPlaceholderPath: options.getPlaceholderPath,
    isFullWindowMode: options.isFullWindowMode,
    getFullWindowPlayerSize: options.getFullWindowPlayerSize,
    getViewportWidth: options.getViewportWidth,
  });
  applyInitialPlaybackStateToElement(htmlPlaybackView.playerElement, initialPlaybackState);

  return {
    ...htmlPlaybackView,
    playbackConfig,
  };
}
