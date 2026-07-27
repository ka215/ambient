import type { MediaItem } from '../types/ambient';
import { syncAmbientResolvedMediaVolumeField } from '../ui/forms/category-volume-bindings';

type BindingOptions =
  NonNullable<Parameters<typeof import('./management-runtime-init').initializeManagementRuntime>[0]['bindingOptions']>;

export interface CreateManagementBindingOptionsFacadeOptions {
  document: Document;
  mediaVolumeInput: HTMLInputElement | null;
  getVolumeOption(): number | null;
  defaultVolume: number;
  getAddType(): string | null | undefined;
  setValidated(target: HTMLElement, valid?: boolean | null): void;
  logger(...args: unknown[]): void;
  ensureTargetPlaylist(): void;
  getMediaItems(): MediaItem[];
  getCategories(): string[];
  setCategories(categories: string[]): void;
  setMediaItems(mediaItems: MediaItem[]): void;
  titleMaxLength: number;
  artistMaxLength: number;
  descMaxLength: number;
  sanitizeMediaText(value: string, maxLength: number): string;
  sanitizeMediaDesc(value: string, maxLength: number): string;
  isVolumeInRange(value: number): boolean;
  generatePlaylistJson(seekFormat: boolean): string;
}

export function createManagementBindingOptionsFacade(
  options: CreateManagementBindingOptionsFacadeOptions
): Omit<BindingOptions, 'mediaForm' | 'mediaElements' | 'playlistForm' | 'playlistElements'> {
  return {
    getAddType: options.getAddType,
    syncMediaVolumeField: () => {
      syncAmbientResolvedMediaVolumeField({
        input: options.mediaVolumeInput,
        display: options.document.getElementById('default-media-volume'),
        volume: options.getVolumeOption(),
        defaultVolume: options.getVolumeOption(),
        fallbackVolume: options.defaultVolume,
      });
    },
    setValidated: (field, valid) => {
      if (field instanceof HTMLElement) {
        options.setValidated(field, valid);
      }
    },
    logger: options.logger,
    ensureTargetPlaylist: options.ensureTargetPlaylist,
    getMediaItems: options.getMediaItems,
    getCategories: options.getCategories,
    setCategories: options.setCategories,
    setMediaItems: options.setMediaItems,
    titleMaxLength: options.titleMaxLength,
    artistMaxLength: options.artistMaxLength,
    descMaxLength: options.descMaxLength,
    sanitizeMediaText: options.sanitizeMediaText,
    sanitizeMediaDesc: options.sanitizeMediaDesc,
    isVolumeInRange: options.isVolumeInRange,
    generatePlaylistJson: options.generatePlaylistJson,
  };
}
