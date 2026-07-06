import type { MediaEditDraft } from '../state/media-edit-draft';

export function applyMediaEditDraftToFormView(options: {
  draft: MediaEditDraft;
  activeItem: MediaItem | null;
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
  isLocalMode: boolean;
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
  getThumbnailSrc: (activeItem: MediaItem | null, draft: MediaEditDraft) => string;
  toTimingInputValue: (value: number | null) => string;
  syncTimingDisplay: () => void;
}): void {
  options.categoryInput && (options.categoryInput.value = options.draft.category);
  options.syncCategoryClearButton();
  options.renderCategoryOptions();

  options.titleInput && (options.titleInput.value = options.draft.title);
  options.artistInput && (options.artistInput.value = options.draft.artist);
  options.descriptionInput && (options.descriptionInput.value = options.draft.description);

  if (options.volumeInput) {
    options.syncVolumeSlider({
      input: options.volumeInput,
      volume: options.draft.volume,
      syncRangeProgress: options.syncRangeProgress,
      display: options.volumeDisplay,
    });
  }

  if (options.thumbnailName) {
    options.thumbnailName.textContent = options.draft.thumbnailMode === 'upload'
      ? options.draft.thumbnailName
      : options.draft.thumbnailMode === 'remove'
        ? options.getLocalizedMessage('mediaEditThumbnailRemovalPending', 'Thumbnail removal pending')
        : options.draft.thumbnailName || '';
  }

  if (options.thumbnailPreview) {
    options.thumbnailPreview.src = options.draft.thumbnailMode === 'upload' && options.draft.thumbnailDataUrl
      ? options.draft.thumbnailDataUrl
      : options.getThumbnailSrc(options.activeItem, options.draft);
  }

  if (options.thumbnailSection) {
    options.thumbnailSection.classList.toggle('hidden', !options.isLocalMode);
  }

  const hasThumbnail = options.draft.thumbnailMode === 'upload'
    || (options.draft.thumbnailMode !== 'remove' && (
      options.draft.thumbnailName !== ''
      || !!options.activeItem?.image
      || !!options.activeItem?.thumb
    ));

  options.thumbnailClearButton?.classList.toggle('hidden', !hasThumbnail);
  if (options.thumbnailRemoveButton) {
    options.thumbnailRemoveButton.disabled = !hasThumbnail;
  }

  options.seekStartInput && (options.seekStartInput.value = options.toTimingInputValue(options.draft.seekStart));
  options.seekEndInput && (options.seekEndInput.value = options.toTimingInputValue(options.draft.seekEnd));
  options.fadeinEndInput && (options.fadeinEndInput.value = options.toTimingInputValue(options.draft.fadeInEnd));
  options.fadeoutStartInput && (options.fadeoutStartInput.value = options.toTimingInputValue(options.draft.fadeOutStart));
  options.syncTimingDisplay();
}
