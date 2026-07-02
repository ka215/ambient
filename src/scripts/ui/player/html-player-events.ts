import type { MediaItem } from '../../types/ambient';
import type { PlaybackTarget } from './player-runtime';

export function bindHtmlSeekOnPlay(options: {
  playerElement: HTMLMediaElement;
  mediaData: MediaItem;
  seekEnabled: boolean;
  isSeekActive: () => boolean;
  startSeek: (callback: () => void, intervalMs: number) => void;
  abortSeeking: () => void;
  abortFadeOut: () => void;
}): void {
  options.playerElement.addEventListener('play', () => {
    if (!(options.seekEnabled && options.mediaData.hasOwnProperty('end') && options.mediaData.end !== '')) {
      return;
    }

    if (!options.isSeekActive()) {
      options.startSeek(() => {
        if (options.playerElement.currentTime >= Number(options.mediaData.end)) {
          options.playerElement.currentTime = options.playerElement.duration;
          options.abortSeeking();
          options.abortFadeOut();
        }
      }, 500);
    }
  });
}

export function bindHtmlPlaybackStateEvents(options: {
  playerElement: HTMLMediaElement;
  onPlaying: () => void;
  onPause: () => void;
  onVolumeChange: () => void;
}): void {
  options.playerElement.addEventListener('playing', options.onPlaying);
  options.playerElement.addEventListener('pause', options.onPause);
  options.playerElement.addEventListener('volumechange', options.onVolumeChange);
}

export function bindHtmlEndedEvent(options: {
  playerElement: HTMLMediaElement;
  onBeforeTransition: () => void;
  resolvePlaybackTarget: () => PlaybackTarget | null;
  onTransition: (target: PlaybackTarget) => void;
}): void {
  options.playerElement.addEventListener('ended', () => {
    options.onBeforeTransition();
    const target = options.resolvePlaybackTarget();
    if (!target) {
      return;
    }
    options.onTransition(target);
  });
}

export function bindHtmlErrorEvents(options: {
  playerElement: HTMLMediaElement;
  sourceElement: HTMLSourceElement;
  reportIssue: (mediaElement: HTMLMediaElement, event: Event, reason: string) => void;
}): void {
  options.playerElement.addEventListener('error', (event) => {
    options.reportIssue(options.playerElement, event, 'player_error');
  });

  options.playerElement.addEventListener('loadstart', (event) => {
    window.setTimeout(() => {
      const target = event.target as HTMLMediaElement;
      if (target.readyState === 0 && (target.networkState === 3 || target.error)) {
        options.reportIssue(target, event, 'load_timeout');
      }
    }, 5000);
  });

  options.sourceElement.addEventListener('error', (event) => {
    options.reportIssue(options.playerElement, event, 'source_error');
  });
}
