import {
  formatSecondsToHHMMSS as sharedFormatSecondsToHHMMSS,
  formatSecondsToTimelineLabel as sharedFormatSecondsToTimelineLabel,
  normalizeMediaEditTimingValue as sharedNormalizeMediaEditTimingValue,
  parseMediaTimeToIntegerSeconds as sharedParseMediaTimeToIntegerSeconds,
  sanitizeMediaEditTimingInputField as sharedSanitizeMediaEditTimingInputField,
  stepMediaEditTimingField as sharedStepMediaEditTimingField,
  toMediaEditTimingInputValue as sharedToMediaEditTimingInputValue,
} from '../shared/media-edit-timing-input';
import {
  sanitizeMediaEditDescForStorage as sharedSanitizeMediaEditDescForStorage,
  sanitizeMediaEditDescInput as sharedSanitizeMediaEditDescInput,
} from '../shared/media-sanitize';
import { getRuntimeAmbientData, isRuntimeLocalMode } from '../platform/runtime-support';
import { normalizeAmbientVolume, resolveAmbientDefaultVolume, syncAmbientRangeProgress } from '../ui/forms/category-volume-bindings';
import { syncVolumeSlider } from '../ui/settings-view';
import { syncYouTubePreviewDuration } from '../ui/player/youtube-player-events';
import { getAmbientNoMediaImagePath } from './display-runtime';
import { initializeMediaEditRuntime } from './media-edit-runtime-init';
import type { MediaEditElements } from '../ui/media-edit/elements';
import type { MediaItem } from '../types/ambient';

export interface InitializeMediaEditRuntimeWiringOptions {
  elements: MediaEditElements;
  status: {
    media: MediaItem[] | null;
    category: string[] | null;
    playlist: string | null;
    current: number | null;
    playertype: string | null;
    options: Record<string, unknown> | null;
  };
  baseUrl: string;
  playlistListElement: HTMLElement;
  playButton: HTMLButtonElement;
  pauseButton: HTMLButtonElement;
  youtubePlayer: { getPlayerState?: () => number } | null;
  playlistMode(): string;
  closePlaylistModeMenu(): void;
  defaultVolume: number;
  mediaTitleMaxLength: number;
  mediaArtistMaxLength: number;
  mediaDescMaxLength: number;
  disallowedControlChars: RegExp;
  draftStorageKey: string;
  previewPlayerId: string;
  durationSyncTimeoutMs: number;
  durationSyncPollMs: number;
  saveEndpoint: string;
  thumbnailEndpoint: string;
  thumbnailGenerateEndpoint: string;
  getLocalizedMessage(key: string, fallback?: string): string;
  updateNotice(notification: NotificationPayload): void;
  getOption(key: string): unknown;
  sanitizeMediaText(value: string, maxLength: number): string;
  persistCloudPlaylist(): boolean;
  generatePlaylistJson(pretty?: boolean): string;
  updatePlayStatus(amId: number): void;
  getMediaCategoryName(mediaItem: MediaItem): string;
  clearCategory(): void;
  updateCategory(): void;
  syncMediaCategoryField(preferredCategoryId?: number | null): void;
  getActiveCategoryId(): number | null;
  updatePlaylist(): void;
  canMutateCurrentPlaylist(): boolean;
  applyEditRestrictions(): void;
  confirm(message: string): boolean;
}

export function initializeMediaEditRuntimeWiring(options: InitializeMediaEditRuntimeWiringOptions) {
  return initializeMediaEditRuntime({
    elements: options.elements,
    status: options.status,
    baseUrl: options.baseUrl,
    playlistListElement: options.playlistListElement,
    playButton: options.playButton,
    pauseButton: options.pauseButton,
    youtubePlayer: options.youtubePlayer,
    playlistMode: options.playlistMode,
    closePlaylistModeMenu: options.closePlaylistModeMenu,
    defaultVolume: options.defaultVolume,
    mediaTitleMaxLength: options.mediaTitleMaxLength,
    mediaArtistMaxLength: options.mediaArtistMaxLength,
    mediaDescMaxLength: options.mediaDescMaxLength,
    disallowedControlChars: options.disallowedControlChars,
    draftStorageKey: options.draftStorageKey,
    previewPlayerId: options.previewPlayerId,
    durationSyncTimeoutMs: options.durationSyncTimeoutMs,
    durationSyncPollMs: options.durationSyncPollMs,
    saveEndpoint: options.saveEndpoint,
    thumbnailEndpoint: options.thumbnailEndpoint,
    thumbnailGenerateEndpoint: options.thumbnailGenerateEndpoint,
    getLocalizedMessage: options.getLocalizedMessage,
    updateNotice: options.updateNotice,
    getDefaultVolume: () => resolveAmbientDefaultVolume(options.getOption('volume'), options.defaultVolume),
    sanitizeMediaText: options.sanitizeMediaText,
    sanitizeMediaEditDescInput: (value, maxLength) => sharedSanitizeMediaEditDescInput(
      value,
      maxLength,
      options.disallowedControlChars
    ),
    sanitizeMediaEditDescForStorage: (value, maxLength) => sharedSanitizeMediaEditDescForStorage(
      value,
      maxLength,
      options.disallowedControlChars
    ),
    normalizeVolume: (value, fallback = options.defaultVolume) => normalizeAmbientVolume(value, fallback),
    normalizeTimingValue: sharedNormalizeMediaEditTimingValue,
    parseMediaTimeToIntegerSeconds: sharedParseMediaTimeToIntegerSeconds,
    formatSecondsToHHMMSS: sharedFormatSecondsToHHMMSS,
    formatSecondsToTimelineLabel: sharedFormatSecondsToTimelineLabel,
    toTimingInputValue: sharedToMediaEditTimingInputValue,
    sanitizeTimingInputField: sharedSanitizeMediaEditTimingInputField,
    stepTimingField: sharedStepMediaEditTimingField,
    syncYouTubePreviewDuration,
    syncVolumeSlider,
    syncRangeProgress: (range) => syncAmbientRangeProgress(range, options.defaultVolume),
    getImageDir: () => getRuntimeAmbientData()?.imageDir,
    getFallbackThumbnailSrc: () => getAmbientNoMediaImagePath(options.status.options, 'thumb'),
    isLocalMode: isRuntimeLocalMode,
    isCloudMode: () => !!getRuntimeAmbientData()?.isCloud,
    persistCloudPlaylist: options.persistCloudPlaylist,
    generatePlaylistJson: options.generatePlaylistJson,
    updatePlayStatus: options.updatePlayStatus,
    getMediaCategoryName: options.getMediaCategoryName,
    clearCategory: options.clearCategory,
    updateCategory: options.updateCategory,
    syncMediaCategoryField: options.syncMediaCategoryField,
    getActiveCategoryId: options.getActiveCategoryId,
    updatePlaylist: options.updatePlaylist,
    canMutateCurrentPlaylist: options.canMutateCurrentPlaylist,
    applyEditRestrictions: options.applyEditRestrictions,
    confirm: options.confirm,
  });
}
