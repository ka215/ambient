import type { MediaItem } from '../../types/ambient';
import { createHtmlPlayerView } from './html-player-view';

export interface CreateAudioPlayerViewOptions {
  mediaData: MediaItem;
  controls: string;
  autoplay: string;
  sourcePath: string;
  sourceType: string;
}

export function createAudioPlayerView(options: CreateAudioPlayerViewOptions): {
  playerElement: HTMLMediaElement;
  sourceElement: HTMLSourceElement;
} {
  return createHtmlPlayerView({
    tagName: 'audio',
    mediaData: options.mediaData,
    controls: options.controls,
    autoplay: options.autoplay,
    sourcePath: options.sourcePath,
    sourceType: options.sourceType,
  });
}
