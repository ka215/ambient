import type { MediaEditDraft } from '../../domain/media-edit/draft';

export function autoResizeMediaEditTextarea(textarea: HTMLTextAreaElement | null): void {
  if (!textarea) {
    return;
  }
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
}

export function resolveMediaEditThumbnailSrc(options: {
  mediaItem: MediaItem | null;
  draft: MediaEditDraft | null;
  imageDir: string | null | undefined;
  getFallbackThumbnailSrc: () => string;
}): string {
  if (options.draft?.thumbnailMode === 'upload' && options.draft.thumbnailDataUrl !== '') {
    return options.draft.thumbnailDataUrl;
  }
  if (options.draft?.thumbnailMode === 'remove') {
    return options.getFallbackThumbnailSrc();
  }
  const thumbnailName = options.draft?.thumbnailName || options.mediaItem?.image || options.mediaItem?.thumb || '';
  if (thumbnailName !== '' && options.imageDir) {
    return options.imageDir + thumbnailName;
  }
  return options.getFallbackThumbnailSrc();
}

export function applyMediaEditDraftToFormView(options: {
  draft: MediaEditDraft;
  activeItem: MediaItem | null;
  categoryInput: HTMLInputElement | null;
  titleInput: HTMLInputElement | null;
  artistInput: HTMLInputElement | null;
  descriptionInput: HTMLTextAreaElement | null;
  volumeInput: HTMLInputElement | null;
  volumeDisplay: HTMLElement | null;
  youtubeAdvancedSection: HTMLElement | null;
  youtubeAdvancedPanel: HTMLElement | null;
  youtubeCcOverride: HTMLInputElement | null;
  youtubeCcValue: HTMLInputElement | null;
  youtubeFsOverride: HTMLInputElement | null;
  youtubeFsValue: HTMLInputElement | null;
  youtubeControlsOverride: HTMLInputElement | null;
  youtubeControlsValue: HTMLInputElement | null;
  youtubeDisablekbOverride: HTMLInputElement | null;
  youtubeDisablekbValue: HTMLInputElement | null;
  thumbnailName: HTMLElement | null;
  thumbnailPreview: HTMLImageElement | null;
  thumbnailSection: HTMLElement | null;
  thumbnailGenerateButton: HTMLButtonElement | null;
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
  if (options.descriptionInput) {
    options.descriptionInput.value = options.draft.description;
    autoResizeMediaEditTextarea(options.descriptionInput);
  }

  if (options.volumeInput) {
    options.syncVolumeSlider({
      input: options.volumeInput,
      volume: options.draft.volume,
      syncRangeProgress: options.syncRangeProgress,
      display: options.volumeDisplay,
    });
  }

  const isYouTubeItem = !!options.activeItem?.videoid && String(options.activeItem.videoid).trim() !== '';
  options.youtubeAdvancedSection?.classList.toggle('hidden', !isYouTubeItem);
  if (!isYouTubeItem) {
    options.youtubeAdvancedPanel?.classList.add('hidden');
  }

  const syncAdvancedSetting = (
    overrideInput: HTMLInputElement | null,
    valueInput: HTMLInputElement | null,
    overrideValue: boolean,
    settingValue: boolean
  ): void => {
    if (overrideInput) {
      overrideInput.checked = overrideValue;
    }
    if (valueInput) {
      valueInput.checked = settingValue;
      valueInput.disabled = !overrideValue;
      valueInput.setAttribute('aria-disabled', String(!overrideValue));
    }
  };

  syncAdvancedSetting(options.youtubeCcOverride, options.youtubeCcValue, options.draft.youtubeCcOverride, options.draft.youtubeCc);
  syncAdvancedSetting(options.youtubeFsOverride, options.youtubeFsValue, options.draft.youtubeFsOverride, options.draft.youtubeFs);
  syncAdvancedSetting(options.youtubeControlsOverride, options.youtubeControlsValue, options.draft.youtubeControlsOverride, options.draft.youtubeControls);
  syncAdvancedSetting(options.youtubeDisablekbOverride, options.youtubeDisablekbValue, options.draft.youtubeDisablekbOverride, options.draft.youtubeDisablekb);

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
  const thumbnailGenerationEnabled = (window as any).AmbientData?.thumbnailGeneration?.enabled === true;
  const canGenerateThumbnail = options.isLocalMode
    && thumbnailGenerationEnabled
    && !!options.activeItem?.file
    && /\.(mp4|webm|mov|m4v|ogv|avi|mkv)(\?.*)?$/i.test(String(options.activeItem.file));
  options.thumbnailGenerateButton?.classList.toggle('hidden', !canGenerateThumbnail);

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
