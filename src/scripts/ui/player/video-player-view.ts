import type { MediaItem } from '../../types/ambient';
import { createHtmlPlayerView } from './html-player-view';

export interface CreateVideoPlayerViewOptions {
  mediaData: MediaItem;
  controls: string;
  autoplay: string;
  sourcePath: string;
  sourceType: string;
}

export function createVideoPlayerView(options: CreateVideoPlayerViewOptions): {
  playerElement: HTMLMediaElement;
  sourceElement: HTMLSourceElement;
} {
  return createHtmlPlayerView({
    tagName: 'video',
    mediaData: options.mediaData,
    controls: options.controls,
    autoplay: options.autoplay,
    sourcePath: options.sourcePath,
    sourceType: options.sourceType,
  });
}
