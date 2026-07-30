import type { MediaItem } from '../../types/ambient';
import type { YouTubeMetadataPayload } from '../../types/ambient';
import type { MediaManagementBindings } from './media-management';
import type { PlaylistManagementBindings } from './playlist-management';

export interface MediaManagementBindingBuilderOptions {
  form: HTMLFormElement | null;
  elements: HTMLElement[];
  mediaCategorySelect: HTMLSelectElement | null;
  mediaTitleMaxLength: number;
  mediaArtistMaxLength: number;
  mediaDescMaxLength: number;
  getDefaultVolume(): number;
  normalizeVolume(value: unknown, fallback?: number): number;
  resetMediaManagementForm(): void;
  canMutateCurrentPlaylist(): boolean;
  applyCloudEditRestrictions(): void;
  updateNotice(notification: { type: 'info' | 'success' | 'warning' | 'error'; message: string; delay?: number }): void;
  addMediaData(payload: [string, string][], preferredCategoryId?: number | null): boolean;
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
  getRelativeFilepath(basefile: string): Promise<boolean>;
  syncRangeProgress(range: HTMLInputElement | null): void;
  logger(...args: unknown[]): void;
  getMediaItems(): MediaItem[];
  getAddType(): string | null | undefined;
  setAddType(nextType: string): void;
  isYouTubeMetadataEnabled(): boolean;
  fetchYouTubeMetadata(videoId: string): Promise<{ ok: boolean; data?: YouTubeMetadataPayload; message?: string; reason?: string }>;
  getLocalizedMessage(key: string, fallback?: string): string;
}

export interface PlaylistManagementBindingBuilderOptions {
  form: HTMLFormElement | null;
  elements: HTMLElement[];
  canMutateCurrentPlaylist(): boolean;
  applyCloudEditRestrictions(): void;
  setValidated(targetElement: HTMLElement, result?: boolean | null): void;
  updateNotice(notification: { type: 'info' | 'success' | 'warning' | 'error'; message: string; delay?: number }): void;
  resetPlaylistManagementForm(): void;
  fetchData(endpointURL: string, method?: string, payload?: Record<string, string>): Promise<unknown>;
  inArray(contains: unknown | unknown[], targetArray: unknown[], atLeastOne?: boolean): boolean;
  snakeToCapital(value: string): string;
  logger(...args: unknown[]): void;
  isLikelyJsonFile(file: File): boolean;
  getBaseUrl(): string;
  getPlaylistManageFormData(oneData?: string | null): FormDataEntryValue | [string, FormDataEntryValue][] | null;
  getCategories(): string[];
  getMediaItems(): MediaItem[];
  createCategory(): { ok: boolean; message: string };
  renameCategory(categoryIndex: number, categoryName: string): { ok: boolean; message: string };
  deleteCategory(categoryIndex: number): { ok: boolean; message: string };
  downloadPlaylist(): { ok: boolean; message: string };
  importPlaylist(): Promise<{ ok: boolean; message: string }>;
}

export function buildMediaManagementBindings(
  options: MediaManagementBindingBuilderOptions
): MediaManagementBindings {
  return {
    form: options.form,
    elements: options.elements,
    mediaCategorySelect: options.mediaCategorySelect,
    mediaTitleMaxLength: options.mediaTitleMaxLength,
    mediaArtistMaxLength: options.mediaArtistMaxLength,
    mediaDescMaxLength: options.mediaDescMaxLength,
    getDefaultVolume: options.getDefaultVolume,
    normalizeVolume: options.normalizeVolume,
    resetMediaManagementForm: options.resetMediaManagementForm,
    canMutateCurrentPlaylist: options.canMutateCurrentPlaylist,
    applyCloudEditRestrictions: options.applyCloudEditRestrictions,
    updateNotice: options.updateNotice,
    addMediaData: options.addMediaData,
    updatePlaylist: options.updatePlaylist,
    clearCategory: options.clearCategory,
    updateCategory: options.updateCategory,
    getActiveCategoryId: options.getActiveCategoryId,
    syncMediaCategoryField: options.syncMediaCategoryField,
    syncPlaybackAfterMediaAdd: options.syncPlaybackAfterMediaAdd,
    persistMediaEditForCurrentPlaylist: async (workingMedia: unknown[]) => {
      return options.persistMediaEditForCurrentPlaylist(workingMedia as MediaItem[]);
    },
    hideOptionsModal: options.hideOptionsModal,
    setValidated: options.setValidated,
    sanitizeMediaText: options.sanitizeMediaText,
    sanitizeMediaTextInput: options.sanitizeMediaTextInput,
    sanitizeMediaDescInput: options.sanitizeMediaDescInput,
    sanitizeMediaDescInputLive: options.sanitizeMediaDescInputLive,
    basename: options.basename,
    isLikelyMediaFile: options.isLikelyMediaFile,
    getRelativeFilepath: options.getRelativeFilepath,
    syncRangeProgress: options.syncRangeProgress,
    logger: options.logger,
    getMediaItems: options.getMediaItems,
    getAddType: options.getAddType,
    setAddType: options.setAddType,
    isYouTubeMetadataEnabled: options.isYouTubeMetadataEnabled,
    fetchYouTubeMetadata: options.fetchYouTubeMetadata,
    getLocalizedMessage: options.getLocalizedMessage,
  };
}

export function buildPlaylistManagementBindings(
  options: PlaylistManagementBindingBuilderOptions
): PlaylistManagementBindings {
  return {
    form: options.form,
    elements: options.elements,
    canMutateCurrentPlaylist: options.canMutateCurrentPlaylist,
    applyCloudEditRestrictions: options.applyCloudEditRestrictions,
    setValidated: options.setValidated,
    updateNotice: options.updateNotice,
    resetPlaylistManagementForm: options.resetPlaylistManagementForm,
    fetchData: options.fetchData,
    inArray: options.inArray,
    snakeToCapital: options.snakeToCapital,
    logger: options.logger,
    isLikelyJsonFile: options.isLikelyJsonFile,
    getBaseUrl: options.getBaseUrl,
    getPlaylistManageFormData: options.getPlaylistManageFormData,
    getCategories: options.getCategories,
    getMediaItems: options.getMediaItems,
    createCategory: options.createCategory,
    renameCategory: options.renameCategory,
    deleteCategory: options.deleteCategory,
    downloadPlaylist: options.downloadPlaylist,
    importPlaylist: options.importPlaylist,
  };
}
