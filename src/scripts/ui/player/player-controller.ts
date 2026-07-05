import type { MediaItem } from '../../types/ambient';
import type { PlayableSetupKind } from './player-setup';
import { fadePlaybackIn, fadePlaybackOut } from './player-effects';
import { runResolvedPlaybackSetup } from './player-setup';

export function runPlayerSetup(options: {
  setupKind: PlayableSetupKind;
  src: string | null;
  extension?: string | null;
  mediaData: MediaItem;
  abortPlaybackTimers: () => void;
  updateMediaCaption: (mediaData: MediaItem) => void;
  getExtension: (src: string) => string;
  onPlayerTypeResolved: (playerType: 'youtube' | 'audio' | 'video' | null) => void;
  onYouTubeSignal: (phase: string, error?: string) => void;
  onIssue: (reason: string, details?: Record<string, unknown>) => void;
  onCreateYouTubePlayer: (mediaData: MediaItem) => void;
  onCreateHtmlPlayer: (kind: 'audio' | 'video', mediaData: MediaItem) => void;
}): boolean {
  options.abortPlaybackTimers();
  options.updateMediaCaption(options.mediaData);

  return runResolvedPlaybackSetup({
    setupKind: options.setupKind,
    src: options.src,
    extension: options.extension ?? null,
    getExtension: options.getExtension,
    onPlayerTypeResolved: options.onPlayerTypeResolved,
    onYouTubeSignal: options.onYouTubeSignal,
    onIssue: (issue) => {
      options.onIssue(issue.reason, issue.details);
    },
    onYouTube: () => {
      options.onCreateYouTubePlayer(options.mediaData);
    },
    onHtml: (kind) => {
      options.onCreateHtmlPlayer(kind, options.mediaData);
    },
  });
}

export function runPlayerFadeIn(options: {
  media: any;
  period: number;
  start: number;
  readTargetVolume: () => number;
  startFader: (callback: () => void, intervalMs: number) => void;
  abortFader: () => void;
  inRange: (value: number, min: number, max: number) => boolean;
  logger: (...args: unknown[]) => void;
}): void {
  fadePlaybackIn(options);
}

export function runPlayerFadeOut(options: {
  media: any;
  period: number;
  end: number;
  readTargetVolume: () => number;
  startFader: (callback: () => void, intervalMs: number) => void;
  abortFader: () => void;
  inRange: (value: number, min: number, max: number) => boolean;
  logger: (...args: unknown[]) => void;
}): void {
  fadePlaybackOut(options);
}
