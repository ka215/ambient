import type { MediaItem } from '../../types/ambient';
import { reportPlaybackIssue } from './player-effects';
import { playMediaSelection } from './player-actions';
import { runPlayerFadeIn, runPlayerFadeOut, runPlayerSetup } from './player-controller';
import type { ActivePlayerType, PlayableSetupKind } from './player-setup';

export function reportManagedPlaybackIssue(options: {
  mediaItem: MediaItem;
  reason: string;
  details?: Record<string, unknown>;
  logger: (...args: unknown[]) => void;
  getLocalizedMessage: (key: string, fallback?: string) => string;
  escapeHtml: (value: string) => string;
  updateNotice: (notification: NotificationPayload) => void;
}): void {
  reportPlaybackIssue({
    mediaItem: options.mediaItem,
    reason: options.reason,
    details: options.details ?? {},
    logger: options.logger,
    getLocalizedMessage: options.getLocalizedMessage,
    escapeHtml: options.escapeHtml,
    updateNotice: options.updateNotice,
  });
}

export function playManagedMediaSelection(options: {
  mediaItems: MediaItem[];
  triggerElement: HTMLElement | null;
  targetId: number | null;
  playlistName?: string | null;
  getExtension: (src: string) => string;
  logger: (...args: unknown[]) => void;
  updatePlayStatus: (currentAmId: number) => void;
  closeResponsiveDrawers: () => void;
  reportMissingSource: (mediaData: MediaItem) => void;
  setupPlayer: (setupKind: PlayableSetupKind, src: string | null, mediaData: MediaItem, extension?: string | null) => void;
}): Promise<void> {
  return playMediaSelection(options);
}

export function setupManagedPlayer(options: {
  setupKind: PlayableSetupKind;
  src: string | null;
  extension?: string | null;
  mediaData: MediaItem;
  abortPlaybackTimers: () => void;
  updateMediaCaption: (mediaData: MediaItem) => void;
  getExtension: (src: string) => string;
  onPlayerTypeResolved: (playerType: ActivePlayerType) => void;
  onYouTubeSignal: (phase: string, error?: string) => void;
  onIssue: (reason: string, details?: Record<string, unknown>) => void;
  onCreateYouTubePlayer: (mediaData: MediaItem) => void;
  onCreateHtmlPlayer: (kind: 'audio' | 'video', mediaData: MediaItem) => void;
}): void {
  runPlayerSetup(options);
}

export function runManagedFadeIn(options: {
  media: unknown;
  period: number;
  start: number;
  readTargetVolume: () => number;
  startFader: (callback: () => void, intervalMs: number) => void;
  abortFader: () => void;
  inRange: (value: number, min: number, max: number) => boolean;
  logger: (...args: unknown[]) => void;
}): void {
  runPlayerFadeIn(options);
}

export function runManagedFadeOut(options: {
  media: unknown;
  period: number;
  end: number;
  readTargetVolume: () => number;
  startFader: (callback: () => void, intervalMs: number) => void;
  abortFader: () => void;
  inRange: (value: number, min: number, max: number) => boolean;
  logger: (...args: unknown[]) => void;
}): void {
  runPlayerFadeOut(options);
}
