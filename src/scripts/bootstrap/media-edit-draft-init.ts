import { applyMediaEditDirtyState } from '../state/media-edit-state';
import {
  sanitizeMediaEditDraft as sanitizeMediaEditDraftState,
  type MediaEditDraft,
  type MediaEditDraftInput,
} from '../state/media-edit-draft';
import {
  applyMediaEditDraftToFormView,
  resolveMediaEditThumbnailSrc,
} from '../ui/media-edit-form-view';
import type { MediaItem } from '../types/ambient';

export function createMediaEditDraftSanitizer(options: {
  getDefaultVolume: () => number;
  titleMaxLength: number;
  artistMaxLength: number;
  descriptionMaxLength: number;
  sanitizeText: (value: string, maxLength: number) => string;
  sanitizeDescription: (value: string, maxLength?: number) => string;
  normalizeVolume: (value: unknown, fallback?: number) => number;
  normalizeTimingValue: (value: unknown, fallback?: number | null) => number | null;
}): (draft: MediaEditDraftInput, fallback?: MediaEditDraft | null) => MediaEditDraft {
  return (draft: MediaEditDraftInput, fallback: MediaEditDraft | null = null): MediaEditDraft => {
    const defaultVolume = options.getDefaultVolume();
    return sanitizeMediaEditDraftState({
      draft,
      fallback,
      defaultVolume,
      titleMaxLength: options.titleMaxLength,
      artistMaxLength: options.artistMaxLength,
      descriptionMaxLength: options.descriptionMaxLength,
      sanitizeText: options.sanitizeText,
      sanitizeDescription: options.sanitizeDescription,
      normalizeVolume: (value, volumeFallback = defaultVolume) => options.normalizeVolume(value, volumeFallback),
      normalizeTimingValue: options.normalizeTimingValue,
    });
  };
}

export function createMediaEditDirtyStateHandler(options: {
  modalElement: HTMLElement | null;
  onDirtyChange: (isDirty: boolean) => void;
}): (isDirty: boolean) => void {
  return (isDirty: boolean): void => {
    applyMediaEditDirtyState({
      isDirty,
      modalElement: options.modalElement,
      onDirtyChange: options.onDirtyChange,
    });
  };
}

export function createMediaEditItemIdentityResolver(options: {
  sanitizeTitle: (value: string) => string;
}): (mediaItem: MediaItem) => string {
  return (mediaItem: MediaItem): string => {
    if (Number.isInteger(mediaItem.amId) && mediaItem.amId >= 0) {
      return `amId:${mediaItem.amId}`;
    }
    if (typeof mediaItem.file === 'string' && mediaItem.file.trim() !== '') {
      return `file:${mediaItem.file.trim()}`;
    }
    if (typeof mediaItem.videoid === 'string' && mediaItem.videoid.trim() !== '') {
      return `videoid:${mediaItem.videoid.trim()}`;
    }
    return `title:${options.sanitizeTitle(mediaItem.title || '')}`;
  };
}

export function createMediaEditThumbnailResolver(options: {
  getImageDir: () => string | null | undefined;
  getFallbackThumbnailSrc: () => string;
}): (mediaItem: MediaItem | null, draft?: MediaEditDraft | null) => string {
  return (mediaItem: MediaItem | null, draft: MediaEditDraft | null = null): string => {
    return resolveMediaEditThumbnailSrc({
      mediaItem,
      draft,
      imageDir: options.getImageDir(),
      getFallbackThumbnailSrc: options.getFallbackThumbnailSrc,
    });
  };
}

export function createMediaEditDraftFormApplier(options: {
  getActiveItem: () => MediaItem | null;
  categoryInput: HTMLInputElement | null;
  titleInput: HTMLInputElement | null;
  artistInput: HTMLInputElement | null;
  descriptionInput: HTMLTextAreaElement | null;
  volumeInput: HTMLInputElement | null;
  volumeDisplay: HTMLElement | null;
  thumbnailName: HTMLElement | null;
  thumbnailPreview: HTMLImageElement | null;
  thumbnailSection: HTMLElement | null;
  thumbnailClearButton: HTMLButtonElement | null;
  thumbnailRemoveButton: HTMLButtonElement | null;
  seekStartInput: HTMLInputElement | null;
  seekEndInput: HTMLInputElement | null;
  fadeinEndInput: HTMLInputElement | null;
  fadeoutStartInput: HTMLInputElement | null;
  isLocalMode: () => boolean;
  syncCategoryClearButton: () => void;
  renderCategoryOptions: () => void;
  syncVolumeSlider: (options: {
    input: HTMLInputElement;
    volume: number;
    syncRangeProgress: (input: HTMLInputElement) => void;
    display: HTMLElement | null;
  }) => void;
  syncRangeProgress: (input: HTMLInputElement) => void;
  getLocalizedMessage: (key: string, fallback: string) => string;
  getThumbnailSrc: (mediaItem: MediaItem | null, draft: MediaEditDraft) => string;
  toTimingInputValue: (value: number | null) => string;
  syncTimingDisplay: () => void;
}): (draft: MediaEditDraft) => void {
  return (draft: MediaEditDraft): void => {
    applyMediaEditDraftToFormView({
      draft,
      activeItem: options.getActiveItem(),
      categoryInput: options.categoryInput,
      titleInput: options.titleInput,
      artistInput: options.artistInput,
      descriptionInput: options.descriptionInput,
      volumeInput: options.volumeInput,
      volumeDisplay: options.volumeDisplay,
      thumbnailName: options.thumbnailName,
      thumbnailPreview: options.thumbnailPreview,
      thumbnailSection: options.thumbnailSection,
      thumbnailClearButton: options.thumbnailClearButton,
      thumbnailRemoveButton: options.thumbnailRemoveButton,
      seekStartInput: options.seekStartInput,
      seekEndInput: options.seekEndInput,
      fadeinEndInput: options.fadeinEndInput,
      fadeoutStartInput: options.fadeoutStartInput,
      isLocalMode: options.isLocalMode(),
      syncCategoryClearButton: options.syncCategoryClearButton,
      renderCategoryOptions: options.renderCategoryOptions,
      syncVolumeSlider: options.syncVolumeSlider,
      syncRangeProgress: options.syncRangeProgress,
      getLocalizedMessage: options.getLocalizedMessage,
      getThumbnailSrc: options.getThumbnailSrc,
      toTimingInputValue: options.toTimingInputValue,
      syncTimingDisplay: options.syncTimingDisplay,
    });
  };
}
