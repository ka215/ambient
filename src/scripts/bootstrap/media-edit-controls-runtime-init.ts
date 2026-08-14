import type { MediaEditDraft, MediaEditDraftInput } from '../domain/media-edit/draft';
import { initializeMediaEditControls } from './media-edit-controls-init';
import { autoResizeMediaEditTextarea } from '../ui/media-edit/form-view';
import { generateMediaThumbnailFromPreview } from '../platform/thumbnail-generation-api';
import { shouldUseLocalMediaRangeProxy } from '../platform/local-media-range-proxy';
import type { MediaItem } from '../types/ambient';
import type { MediaEditElements } from '../ui/media-edit/elements';

export interface InitializeMediaEditControlsRuntimeOptions {
  elements: MediaEditElements;
  baseUrl: string;
  thumbnailGenerateEndpoint: string;
  defaultVolume: number;
  getLocalizedMessage: (key: string, fallback: string) => string;
  updateNotice: (notification: NotificationPayload) => void;
  getPlaylistName: () => string | null;
  getActiveItem: () => MediaItem | null;
  getBaseDraft: () => MediaEditDraft | null;
  readDraftFromForm: () => MediaEditDraft;
  sanitizeDraft: (draft: MediaEditDraftInput, fallback?: MediaEditDraft | null) => MediaEditDraft;
  applyDraftToForm: (draft: MediaEditDraft) => void;
  applyDraftState: (draft: MediaEditDraft) => void;
  syncDraftStateFromForm: () => void;
  validateAndRenderDraftFromForm: () => { valid: boolean };
  syncTimingDisplay: () => void;
  syncTimingFieldFromPreview: (field: HTMLInputElement | null, label: string) => void;
  mediaEditPreview: {
    getPreviewSourceItem: () => MediaItem | null;
    getMediaEditPreviewCurrentTime: () => number | null;
  };
  createMediaEditPreview: (mediaItem: MediaItem) => Promise<void>;
  closeMediaEditModal: (restoreFocus?: boolean) => void;
  cancelMediaEditModal: (restoreFocus?: boolean) => void;
  saveMediaEdit: () => Promise<void>;
  isMediaEditCategoryDropdownVisible: () => boolean;
  openMediaEditCategoryDropdown: () => void;
  closeMediaEditCategoryDropdown: (restoreFocus?: boolean) => void;
  syncMediaEditCategoryClearButton: () => void;
  renderMediaEditCategoryOptions: () => void;
  syncVolumeSlider: (options: {
    input: HTMLInputElement;
    volume: number;
    syncRangeProgress: (input: HTMLInputElement) => void;
    display: HTMLElement | null;
  }) => void;
  syncRangeProgress: (input: HTMLInputElement) => void;
  sanitizeTimingInputField: (field: HTMLInputElement) => void;
  toTimingInputValue: (value: number | null) => string;
  parseMediaTimeToIntegerSeconds: (value: unknown) => number | null;
  stepTimingField: (field: HTMLInputElement, direction: 1 | -1) => void;
}

export function initializeMediaEditControlsRuntime(options: InitializeMediaEditControlsRuntimeOptions): void {
  const syncYouTubeAdvancedSettingAvailability = (): void => {
    const pairs = [
      [options.elements.youtubeCcOverride, options.elements.youtubeCcValue],
      [options.elements.youtubeFsOverride, options.elements.youtubeFsValue],
      [options.elements.youtubeControlsOverride, options.elements.youtubeControlsValue],
      [options.elements.youtubeDisablekbOverride, options.elements.youtubeDisablekbValue],
    ] as Array<[HTMLInputElement | null, HTMLInputElement | null]>;
    pairs.forEach(([overrideInput, valueInput]) => {
      if (!valueInput) {
        return;
      }
      const enabled = overrideInput?.checked === true;
      valueInput.disabled = !enabled;
      valueInput.setAttribute('aria-disabled', String(!enabled));
    });
  };

  options.elements.youtubeAdvancedToggle?.addEventListener('click', () => {
    const panel = options.elements.youtubeAdvancedPanel;
    const button = options.elements.youtubeAdvancedToggle;
    if (!panel || !button) {
      return;
    }
    const nextExpanded = panel.classList.contains('hidden');
    panel.classList.toggle('hidden', !nextExpanded);
    button.setAttribute('aria-expanded', String(nextExpanded));
  });

  const applyThumbnailFile = (file: File | null): void => {
    if (!file) {
      return;
    }
    const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      options.updateNotice({
        type: 'error',
        message: options.getLocalizedMessage(
          'mediaEditThumbnailTypeError',
          'Only PNG, JPEG, GIF, and WebP images are accepted.'
        ),
        delay: 2500,
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (!options.getActiveItem()) {
        return;
      }
      const current = options.readDraftFromForm();
      const next = options.sanitizeDraft({
        ...current,
        thumbnailMode: 'upload',
        thumbnailName: file.name,
        thumbnailMime: file.type,
        thumbnailDataUrl: typeof reader.result === 'string' ? reader.result : '',
      }, current);
      options.applyDraftToForm(next);
      options.applyDraftState(next);
    };
    reader.readAsDataURL(file);
  };

  initializeMediaEditControls({
    primary: {
      closeButton: options.elements.closeButton,
      cancelButton: options.elements.cancelButton,
      saveButton: options.elements.saveButton,
      form: options.elements.form,
      onClose: () => {
        options.closeMediaEditModal(true);
      },
      onCancel: () => {
        options.cancelMediaEditModal(true);
      },
      onSave: async () => {
        await options.saveMediaEdit();
      },
    },
    category: {
      toggleButton: options.elements.categoryToggleButton,
      clearButton: options.elements.categoryClearButton,
      categoryInput: options.elements.categoryInput,
      categoryCombobox: options.elements.categoryCombobox,
      isDropdownVisible: options.isMediaEditCategoryDropdownVisible,
      openDropdown: options.openMediaEditCategoryDropdown,
      closeDropdown: options.closeMediaEditCategoryDropdown,
      syncClearButton: options.syncMediaEditCategoryClearButton,
      renderOptions: options.renderMediaEditCategoryOptions,
    },
    field: {
      draftFields: [
        options.elements.categoryInput,
        options.elements.titleInput,
        options.elements.artistInput,
        options.elements.descriptionInput,
        options.elements.youtubeCcOverride,
        options.elements.youtubeCcValue,
        options.elements.youtubeFsOverride,
        options.elements.youtubeFsValue,
        options.elements.youtubeControlsOverride,
        options.elements.youtubeControlsValue,
        options.elements.youtubeDisablekbOverride,
        options.elements.youtubeDisablekbValue,
      ],
      volumeInput: options.elements.volumeInput,
      timingFields: [
        options.elements.seekStartInput,
        options.elements.seekEndInput,
        options.elements.fadeInEndInput,
        options.elements.fadeOutStartInput,
      ],
      timingStepperButtons: document.querySelectorAll('.media-edit-timing-stepper-btn'),
      onDraftFieldInput: () => {
        autoResizeMediaEditTextarea(options.elements.descriptionInput);
        syncYouTubeAdvancedSettingAvailability();
        options.syncDraftStateFromForm();
        options.validateAndRenderDraftFromForm();
      },
      onDraftFieldChange: () => {
        autoResizeMediaEditTextarea(options.elements.descriptionInput);
        syncYouTubeAdvancedSettingAvailability();
        options.syncDraftStateFromForm();
        options.validateAndRenderDraftFromForm();
      },
      onVolumeInput: () => {
        const volumeInput = options.elements.volumeInput;
        if (!volumeInput) {
          return;
        }
        const normalized = options.readDraftFromForm();
        options.syncVolumeSlider({
          input: volumeInput,
          volume: normalized.volume,
          syncRangeProgress: options.syncRangeProgress,
          display: options.elements.volumeValue,
        });
        options.syncDraftStateFromForm();
        options.validateAndRenderDraftFromForm();
      },
      onVolumeBlur: () => {
        const volumeInput = options.elements.volumeInput;
        if (!volumeInput) {
          return;
        }
        const normalized = options.readDraftFromForm();
        options.syncVolumeSlider({
          input: volumeInput,
          volume: normalized.volume,
          syncRangeProgress: options.syncRangeProgress,
          display: options.elements.volumeValue,
        });
        options.syncDraftStateFromForm();
        options.validateAndRenderDraftFromForm();
      },
      onTimingInput: (field: HTMLInputElement) => {
        options.sanitizeTimingInputField(field);
        options.syncTimingDisplay();
        options.syncDraftStateFromForm();
        options.validateAndRenderDraftFromForm();
      },
      onTimingChange: (field: HTMLInputElement) => {
        options.sanitizeTimingInputField(field);
        options.syncTimingDisplay();
        options.syncDraftStateFromForm();
        options.validateAndRenderDraftFromForm();
      },
      onTimingBlur: (field: HTMLInputElement) => {
        field.value = options.toTimingInputValue(options.parseMediaTimeToIntegerSeconds(field.value));
        options.syncTimingDisplay();
        options.syncDraftStateFromForm();
        options.validateAndRenderDraftFromForm();
      },
      onTimingStep: (field: HTMLInputElement, direction: 1 | -1) => {
        options.stepTimingField(field, direction);
      },
    },
    preview: {
      syncSeekStartButton: options.elements.syncSeekStartButton,
      syncSeekEndButton: options.elements.syncSeekEndButton,
      syncFadeinEndButton: options.elements.syncFadeInEndButton,
      syncFadeoutStartButton: options.elements.syncFadeOutStartButton,
      previewRetryButton: options.elements.previewRetryButton,
      onSyncSeekStart: () => {
        options.syncTimingFieldFromPreview(options.elements.seekStartInput, 'seek start');
      },
      onSyncSeekEnd: () => {
        options.syncTimingFieldFromPreview(options.elements.seekEndInput, 'seek end');
      },
      onSyncFadeinEnd: () => {
        options.syncTimingFieldFromPreview(options.elements.fadeInEndInput, 'fade-in end');
      },
      onSyncFadeoutStart: () => {
        options.syncTimingFieldFromPreview(options.elements.fadeOutStartInput, 'fade-out start');
      },
      onPreviewRetry: () => {
        const previewSourceItem = options.mediaEditPreview.getPreviewSourceItem();
        if (!previewSourceItem) {
          return;
        }
        void options.createMediaEditPreview(previewSourceItem);
      },
    },
    thumbnail: {
      pickButton: options.elements.thumbnailPickButton,
      input: options.elements.thumbnailInput,
      dropzone: options.elements.thumbnailSection,
      generateButton: options.elements.thumbnailGenerateButton,
      removeButton: options.elements.thumbnailRemoveButton,
      clearButton: options.elements.thumbnailClearButton,
      onPick: () => {
        options.elements.thumbnailInput?.click();
      },
      onInputChange: () => {
        const thumbnailInput = options.elements.thumbnailInput;
        if (!thumbnailInput) {
          return;
        }
        const file = thumbnailInput.files?.[0] || null;
        applyThumbnailFile(file);
        thumbnailInput.value = '';
      },
      onDropFile: applyThumbnailFile,
      onGenerate: async () => {
        const activeItem = options.getActiveItem();
        const seekTime = options.mediaEditPreview.getMediaEditPreviewCurrentTime();
        if (!activeItem?.file || seekTime === null) {
          options.updateNotice({
            type: 'error',
            message: options.getLocalizedMessage('mediaEditPreviewSyncFailed', 'Preview is not ready.'),
            delay: 2500,
          });
          return;
        }
        const useRangeProxy = shouldUseLocalMediaRangeProxy(activeItem);
        const playlistName = String(options.getPlaylistName() || '');
        const result = await generateMediaThumbnailFromPreview({
          baseUrl: options.baseUrl,
          endpoint: options.thumbnailGenerateEndpoint,
          file: activeItem.file,
          seekTime,
          rangeProxy: useRangeProxy,
          playlistName,
          mediaId: Number.isInteger(activeItem.amId) ? activeItem.amId : null,
          getLocalizedMessage: options.getLocalizedMessage,
        });
        if (!result.ok || !result.filename || !result.dataUrl) {
          options.updateNotice({ type: 'error', message: result.message, delay: 2600 });
          return;
        }
        const current = options.readDraftFromForm();
        const next = options.sanitizeDraft({
          ...current,
          thumbnailMode: 'upload',
          thumbnailName: result.filename,
          thumbnailMime: result.mime || 'image/webp',
          thumbnailDataUrl: result.dataUrl,
        }, current);
        options.applyDraftToForm(next);
        options.applyDraftState(next);
        options.updateNotice({ type: 'success', message: result.message, delay: 2200 });
      },
      onRemove: () => {
        if (!options.getActiveItem()) {
          return;
        }
        const current = options.readDraftFromForm();
        const currentName = current.thumbnailName || options.getBaseDraft()?.thumbnailName || '';
        if (currentName === '') {
          return;
        }
        const confirmed = window.confirm(
          options.getLocalizedMessage('mediaEditThumbnailRemoveConfirm', 'Remove the current thumbnail image?')
        );
        if (!confirmed) {
          return;
        }
        const next = options.sanitizeDraft({
          ...current,
          thumbnailMode: 'remove',
          thumbnailName: currentName,
          thumbnailMime: '',
          thumbnailDataUrl: '',
        }, current);
        options.applyDraftToForm(next);
        options.applyDraftState(next);
      },
    },
  });
}
