import type { MediaItem } from '../types/ambient';

type MediaBindings =
  NonNullable<
    NonNullable<Parameters<typeof import('./management-runtime-init').initializeManagementRuntime>[0]['initOptions']>['mediaBindings']
  >;

export interface CreateManagementMediaBindingsFacadeOptions {
  mediaCategorySelect: HTMLSelectElement | null;
  mediaTitleMaxLength: number;
  mediaArtistMaxLength: number;
  mediaDescMaxLength: number;
  getDefaultVolume(): number;
  normalizeVolume(value: unknown, fallback?: number): number;
  canMutateCurrentPlaylist(): boolean;
  applyCloudEditRestrictions(): void;
  updateNotice(notification: { type: 'info' | 'success' | 'warning' | 'error'; message: string; delay?: number }): void;
  updatePlaylist(): void;
  clearCategory(): void;
  updateCategory(): void;
  getActiveCategoryId(): number | null;
  syncMediaCategoryField(preferredCategoryId?: number | null): void;
  syncPlaybackAfterMediaAdd(): void;
  persistMediaEditForCurrentPlaylist(workingMedia: MediaItem[]): Promise<{ ok: boolean; message: string }>;
  hideOptionsModal(): void;
  setValidated(targetElement: HTMLElement, result?: boolean | null): void;
  sanitizeMediaText(value: string, maxLength: number): string;
  sanitizeMediaTextInput(value: string, maxLength: number): string;
  sanitizeMediaDescInput(value: string, maxLength?: number): string;
  sanitizeMediaDescInputLive(value: string, maxLength?: number): string;
  basename(path: string): string;
  isLikelyMediaFile(file: File): boolean;
  syncRangeProgress(range: HTMLInputElement | null): void;
  logger(...args: unknown[]): void;
  getMediaItems(): MediaItem[];
  getAddType(): string | null | undefined;
  setAddType(nextType: string): void;
}

export function createManagementMediaBindingsFacade(
  options: CreateManagementMediaBindingsFacadeOptions
): MediaBindings {
  return {
    mediaCategorySelect: options.mediaCategorySelect,
    mediaTitleMaxLength: options.mediaTitleMaxLength,
    mediaArtistMaxLength: options.mediaArtistMaxLength,
    mediaDescMaxLength: options.mediaDescMaxLength,
    getDefaultVolume: options.getDefaultVolume,
    normalizeVolume: options.normalizeVolume,
    canMutateCurrentPlaylist: options.canMutateCurrentPlaylist,
    applyCloudEditRestrictions: options.applyCloudEditRestrictions,
    updateNotice: options.updateNotice,
    updatePlaylist: options.updatePlaylist,
    clearCategory: options.clearCategory,
    updateCategory: options.updateCategory,
    getActiveCategoryId: options.getActiveCategoryId,
    syncMediaCategoryField: options.syncMediaCategoryField,
    syncPlaybackAfterMediaAdd: options.syncPlaybackAfterMediaAdd,
    persistMediaEditForCurrentPlaylist: options.persistMediaEditForCurrentPlaylist,
    hideOptionsModal: options.hideOptionsModal,
    setValidated: options.setValidated,
    sanitizeMediaText: options.sanitizeMediaText,
    sanitizeMediaTextInput: options.sanitizeMediaTextInput,
    sanitizeMediaDescInput: options.sanitizeMediaDescInput,
    sanitizeMediaDescInputLive: options.sanitizeMediaDescInputLive,
    basename: options.basename,
    isLikelyMediaFile: options.isLikelyMediaFile,
    syncRangeProgress: options.syncRangeProgress,
    logger: options.logger,
    getMediaItems: options.getMediaItems,
    getAddType: options.getAddType,
    setAddType: options.setAddType,
  } as MediaBindings;
}
