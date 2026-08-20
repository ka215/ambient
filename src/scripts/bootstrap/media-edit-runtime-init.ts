import { createMediaEditDraftBindings } from '../domain/media-edit/draft-bindings';
import {
  cloneMediaEditDraft as cloneMediaEditDraftState,
  createEmptyMediaEditDraft,
  ensureMediaEditCategory,
  findMediaEditCategoryIndex,
  isSameMediaEditDraft as isSameMediaEditDraftState,
  type MediaEditDraft,
} from '../domain/media-edit/draft';
import { createMediaEditPreviewBindings } from '../ui/media-edit/preview-bindings';
import { createMediaEditTimingBindings } from '../ui/media-edit/timing-bindings';
import { createMediaEditUiBindings } from '../ui/media-edit/ui-bindings';
import { autoResizeMediaEditTextarea } from '../ui/media-edit/form-view';
import type { MediaEditElements } from '../ui/media-edit/elements';
import type { MediaItem } from '../types/ambient';
import {
  createMediaEditDirtyStateHandler,
  createMediaEditDraftFormApplier,
  createMediaEditDraftItemApplier,
  createMediaEditDraftSanitizer,
  createMediaEditItemIdentityResolver,
  createMediaEditThumbnailResolver,
} from './media-edit-draft-init';
import { initializeMediaEditModalBindings } from './media-edit-modal-init';
import { initializeMediaEditSaveRuntime } from './media-edit-save-init';
import { initializeMediaEditControlsRuntime } from './media-edit-controls-runtime-init';

export interface InitializeMediaEditRuntimeOptions {
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
  playlistListElement: HTMLElement | null;
  playButton: HTMLButtonElement | null;
  pauseButton: HTMLButtonElement | null;
  youtubePlayer: { getPlayerState?: () => number } | null;
  playlistMode: () => string;
  closePlaylistModeMenu: () => void;
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
  getLocalizedMessage: (key: string, fallback?: string) => string;
  updateNotice: (notification: NotificationPayload) => void;
  getDefaultVolume: () => number;
  sanitizeMediaText: (value: string, maxLength: number) => string;
  sanitizeMediaEditDescInput: (value: string, maxLength: number) => string;
  sanitizeMediaEditDescForStorage: (value: string, maxLength: number) => string;
  normalizeVolume: (value: unknown, fallback?: number) => number;
  normalizeTimingValue: (value: unknown, fallback?: number | null) => number | null;
  parseMediaTimeToIntegerSeconds: (value: unknown) => number | null;
  formatSecondsToHHMMSS: (value: number | null) => string;
  formatSecondsToTimelineLabel: (value: number | null) => string;
  toTimingInputValue: (value: number | null) => string;
  sanitizeTimingInputField: (field: HTMLInputElement) => void;
  stepTimingField: (field: HTMLInputElement, direction: 1 | -1) => void;
  syncYouTubePreviewDuration: (options: {
    readDuration: () => number | null;
    onDurationResolved: (duration: number | null) => void;
    onDurationAvailable?: () => void;
    hidePreviewError: () => void;
  }) => void;
  syncVolumeSlider: (options: {
    input: HTMLInputElement;
    volume: number;
    syncRangeProgress: (input: HTMLInputElement) => void;
    display: HTMLElement | null;
  }) => void;
  syncRangeProgress: (input: HTMLInputElement) => void;
  getImageDir: () => string | null | undefined;
  getFallbackThumbnailSrc: () => string;
  isLocalMode: () => boolean;
  isCloudMode: () => boolean;
  persistCloudPlaylist: () => boolean;
  generatePlaylistJson: (pretty?: boolean) => string;
  updatePlayStatus: (amId: number) => void;
  getMediaCategoryName: (mediaItem: MediaItem) => string;
  clearCategory: () => void;
  updateCategory: () => void;
  syncMediaCategoryField: (preferredCategoryId?: number | null) => void;
  getActiveCategoryId: () => number | null;
  updatePlaylist: () => void;
  canMutateCurrentPlaylist: () => boolean;
  applyEditRestrictions: () => void;
  confirm: (message: string) => boolean;
}

export interface MediaEditRuntime {
  getActiveItem: () => MediaItem | null;
  isMediaEditCategoryDropdownVisible: () => boolean;
  closeMediaEditCategoryDropdown: (restoreFocus?: boolean) => void;
  closeMediaEditModal: (restoreFocus?: boolean) => void;
  hideMediaEditModal: (restoreFocus?: boolean) => void;
  openMediaEditModal: (mediaItem: MediaItem, trigger: HTMLElement) => void;
  confirmDiscardActiveMediaEditIfNeeded: (fallbackMessage?: string) => boolean;
  clearMediaEditContext: () => void;
  discardActiveMediaEditDraft: () => void;
  persistMediaEditForCurrentPlaylist: (workingMedia: MediaItem[]) => Promise<{ ok: boolean; message: string }>;
}

export function initializeMediaEditRuntime(options: InitializeMediaEditRuntimeOptions): MediaEditRuntime {
  const defaultModalTitle = options.elements.modalTitle?.textContent?.trim() || 'Media Edit';
  const mediaEditDraftStore = new Map<string, MediaEditDraft>();
  let mediaEditActiveItem: MediaItem | null = null;
  let mediaEditBaseDraft: MediaEditDraft | null = null;
  let mediaEditIsDirty = false;

  const getMediaEditItemIdentity = createMediaEditItemIdentityResolver({
    sanitizeTitle: (value) => options.sanitizeMediaText(value, options.mediaTitleMaxLength),
  });

  let mediaEditPreview!: ReturnType<typeof createMediaEditPreviewBindings>;

  const {
    resolveMediaEditEffectiveEnd,
    resolveMediaEditKnownDuration,
    getMediaEditTimingFromStoredDurations,
    getMediaEditComputedFadeDurations,
    syncMediaEditTimingDisplay,
    mediaEditDurationSync,
  } = createMediaEditTimingBindings({
    timeline: options.elements.seekTimeline,
    timelineLoading: options.elements.seekTimelineLoading,
    fixedStartTime: options.elements.seekFixedStartTime,
    fixedEndTime: options.elements.seekFixedEndTime,
    startMarker: options.elements.seekMarkerStart,
    startLabel: options.elements.seekMarkerStartTime,
    fadeInMarker: options.elements.seekMarkerFadeInEnd,
    fadeInLabel: options.elements.seekMarkerFadeInEndTime,
    fadeOutMarker: options.elements.seekMarkerFadeOutStart,
    fadeOutLabel: options.elements.seekMarkerFadeOutStartTime,
    endMarker: options.elements.seekMarkerEnd,
    endLabel: options.elements.seekMarkerEndTime,
    seekStartHms: options.elements.seekStartHms,
    seekEndHms: options.elements.seekEndHms,
    fadeInEndHms: options.elements.fadeInEndHms,
    fadeOutStartHms: options.elements.fadeOutStartHms,
    seekStartField: options.elements.seekStartInput,
    seekEndField: options.elements.seekEndInput,
    fadeInEndField: options.elements.fadeInEndInput,
    fadeOutStartField: options.elements.fadeOutStartInput,
    timeoutMs: options.durationSyncTimeoutMs,
    pollMs: options.durationSyncPollMs,
    getActiveItem: () => mediaEditActiveItem,
    getPreviewDurationSeconds: () => mediaEditPreview.getPreviewDurationSeconds(),
    getItemIdentity: getMediaEditItemIdentity,
    normalizeTimingValue: options.normalizeTimingValue,
    parseMediaTimeToIntegerSeconds: options.parseMediaTimeToIntegerSeconds,
    formatSecondsToHHMMSS: options.formatSecondsToHHMMSS,
    formatSecondsToTimelineLabel: options.formatSecondsToTimelineLabel,
  });

  const sanitizeMediaEditDraft = createMediaEditDraftSanitizer({
    getDefaultVolume: options.getDefaultVolume,
    titleMaxLength: options.mediaTitleMaxLength,
    artistMaxLength: options.mediaArtistMaxLength,
    descriptionMaxLength: options.mediaDescMaxLength,
    sanitizeText: options.sanitizeMediaText,
    sanitizeDescription: (value, maxLength = options.mediaDescMaxLength) => (
      options.sanitizeMediaEditDescInput(value, maxLength)
    ),
    normalizeVolume: (value, fallback = options.defaultVolume) => options.normalizeVolume(value, fallback),
    normalizeTimingValue: options.normalizeTimingValue,
  });

  let readMediaEditDraftFromForm: () => MediaEditDraft;
  const uiBindings = createMediaEditUiBindings({
    categoryField: options.elements.categoryInput,
    titleField: options.elements.titleInput,
    seekStartField: options.elements.seekStartInput,
    seekEndField: options.elements.seekEndInput,
    fadeInEndField: options.elements.fadeInEndInput,
    fadeOutStartField: options.elements.fadeOutStartInput,
    saveButton: options.elements.saveButton,
    categoryDropdown: options.elements.categoryDropdown,
    categoryCombobox: options.elements.categoryCombobox,
    categoryToggleButton: options.elements.categoryToggleButton,
    categoryOptionsContainer: options.elements.categoryOptions,
    categoryClearButton: options.elements.categoryClearButton,
    getCategories: () => options.status.category,
    getLocalizedMessage: options.getLocalizedMessage,
    createValidationDraft: () => readMediaEditDraftFromForm(),
    getActiveItem: () => mediaEditActiveItem,
    resolveKnownDuration: resolveMediaEditKnownDuration,
    resolveEffectiveEnd: resolveMediaEditEffectiveEnd,
    normalizeTimingValue: options.normalizeTimingValue,
  });

  mediaEditPreview = createMediaEditPreviewBindings({
    previewElement: options.elements.preview,
    errorElement: options.elements.previewError,
    errorMessageElement: options.elements.previewErrorMessage,
    previewPlayerId: options.previewPlayerId,
    normalizeTimingValue: options.normalizeTimingValue,
    syncYouTubePreviewDuration: options.syncYouTubePreviewDuration,
    getLocalizedMessage: options.getLocalizedMessage,
    mediaEditDurationSync,
    syncMediaEditTimingDisplay,
    syncMediaEditDraftStateFromForm: () => draftBindings.syncMediaEditDraftStateFromForm(),
    validateAndRenderMediaEditDraftFromForm: uiBindings.validateAndRenderMediaEditDraftFromForm,
  });

  const setMediaEditDirtyState = createMediaEditDirtyStateHandler({
    modalElement: options.elements.modal,
    onDirtyChange: (nextDirty) => {
      mediaEditIsDirty = nextDirty;
    },
  });

  const getMediaEditThumbnailSrc = createMediaEditThumbnailResolver({
    getImageDir: options.getImageDir,
    getFallbackThumbnailSrc: options.getFallbackThumbnailSrc,
  });

  const applyMediaEditDraftToForm = createMediaEditDraftFormApplier({
    getActiveItem: () => mediaEditActiveItem,
    categoryInput: options.elements.categoryInput,
    titleInput: options.elements.titleInput,
    artistInput: options.elements.artistInput,
    descriptionInput: options.elements.descriptionInput,
    volumeInput: options.elements.volumeInput,
    volumeDisplay: options.elements.volumeValue,
    youtubeAdvancedSection: options.elements.youtubeAdvancedSection,
    youtubeAdvancedPanel: options.elements.youtubeAdvancedPanel,
    youtubeCcOverride: options.elements.youtubeCcOverride,
    youtubeCcValue: options.elements.youtubeCcValue,
    youtubeFsOverride: options.elements.youtubeFsOverride,
    youtubeFsValue: options.elements.youtubeFsValue,
    youtubeControlsOverride: options.elements.youtubeControlsOverride,
    youtubeControlsValue: options.elements.youtubeControlsValue,
    youtubeDisablekbOverride: options.elements.youtubeDisablekbOverride,
    youtubeDisablekbValue: options.elements.youtubeDisablekbValue,
    thumbnailName: options.elements.thumbnailName,
    thumbnailPreview: options.elements.thumbnailPreview,
    thumbnailSection: options.elements.thumbnailSection,
    thumbnailGenerateButton: options.elements.thumbnailGenerateButton,
    thumbnailClearButton: options.elements.thumbnailClearButton,
    thumbnailRemoveButton: options.elements.thumbnailRemoveButton,
    seekStartInput: options.elements.seekStartInput,
    seekEndInput: options.elements.seekEndInput,
    fadeinEndInput: options.elements.fadeInEndInput,
    fadeoutStartInput: options.elements.fadeOutStartInput,
    isLocalMode: options.isLocalMode,
    syncCategoryClearButton: uiBindings.syncMediaEditCategoryClearButton,
    renderCategoryOptions: uiBindings.renderMediaEditCategoryOptions,
    syncVolumeSlider: options.syncVolumeSlider,
    syncRangeProgress: options.syncRangeProgress,
    getLocalizedMessage: (key, fallback) => options.getLocalizedMessage(key, fallback),
    getThumbnailSrc: (mediaItem, draft) => getMediaEditThumbnailSrc(mediaItem, draft),
    toTimingInputValue: options.toTimingInputValue,
    syncTimingDisplay: syncMediaEditTimingDisplay,
  });

  const draftBindings = createMediaEditDraftBindings({
    storageKey: options.draftStorageKey,
    status: options.status,
    draftStore: mediaEditDraftStore,
    getActiveItem: () => mediaEditActiveItem,
    setActiveItem: (mediaItem) => {
      mediaEditActiveItem = mediaItem;
    },
    getBaseDraft: () => mediaEditBaseDraft,
    setBaseDraft: (draft) => {
      mediaEditBaseDraft = draft;
    },
    setPreviewSourceItem: (mediaItem) => {
      mediaEditPreview.setPreviewSourceItem(mediaItem);
    },
    setDirtyState: setMediaEditDirtyState,
    isSameDraft: isSameMediaEditDraftState,
    cloneDraft: cloneMediaEditDraftState,
    sanitizeDraft: sanitizeMediaEditDraft,
    createEmptyDraft: () => createEmptyMediaEditDraft(options.getDefaultVolume()),
    getItemIdentity: getMediaEditItemIdentity,
    getMediaCategoryName: options.getMediaCategoryName,
    sanitizeDescription: (value) => options.sanitizeMediaEditDescInput(value, options.mediaDescMaxLength),
    getTiming: getMediaEditTimingFromStoredDurations,
    getDefaultVolume: options.getDefaultVolume,
    applyDraftToForm: applyMediaEditDraftToForm,
    validateDraft: () => {
      uiBindings.validateAndRenderMediaEditDraftFromForm();
    },
    readFormValues: () => ({
      category: options.elements.categoryInput?.value,
      title: options.elements.titleInput?.value,
      artist: options.elements.artistInput?.value,
      description: options.elements.descriptionInput?.value,
      volume: options.elements.volumeInput ? Number(options.elements.volumeInput.value) : undefined,
      seekStart: options.elements.seekStartInput?.value,
      seekEnd: options.elements.seekEndInput?.value,
      fadeInEnd: options.elements.fadeInEndInput?.value,
      fadeOutStart: options.elements.fadeOutStartInput?.value,
      youtubeCcOverride: options.elements.youtubeCcOverride?.checked,
      youtubeCc: options.elements.youtubeCcValue?.checked,
      youtubeFsOverride: options.elements.youtubeFsOverride?.checked,
      youtubeFs: options.elements.youtubeFsValue?.checked,
      youtubeControlsOverride: options.elements.youtubeControlsOverride?.checked,
      youtubeControls: options.elements.youtubeControlsValue?.checked,
      youtubeDisablekbOverride: options.elements.youtubeDisablekbOverride?.checked,
      youtubeDisablekb: options.elements.youtubeDisablekbValue?.checked,
    }),
  });
  readMediaEditDraftFromForm = draftBindings.readMediaEditDraftFromForm;

  const applyDraftToMediaItem = createMediaEditDraftItemApplier({
    findCategoryIndexByName: (categoryName) => findMediaEditCategoryIndex(options.status.category, categoryName),
    sanitizeDescriptionForStorage: (value) => options.sanitizeMediaEditDescForStorage(value, options.mediaDescMaxLength),
    getComputedFadeDurations: getMediaEditComputedFadeDurations,
  });

  let mediaEditModalBindings: ReturnType<typeof initializeMediaEditModalBindings> | null = null;
  const saveRuntime = initializeMediaEditSaveRuntime({
    baseUrl: options.baseUrl,
    saveEndpoint: options.saveEndpoint,
    thumbnailEndpoint: options.thumbnailEndpoint,
    status: options.status,
    saveButton: options.elements.saveButton,
    getActiveItem: () => mediaEditActiveItem,
    getBaseDraft: () => mediaEditBaseDraft,
    setBaseDraft: (draft) => {
      mediaEditBaseDraft = draft;
      uiBindings.syncMediaEditCategoryClearButton();
      uiBindings.renderMediaEditCategoryOptions();
    },
    getDraftKey: draftBindings.getMediaEditDraftKey,
    deleteDraftByKey: draftBindings.deleteMediaEditDraftByKey,
    createBaseDraft: draftBindings.createMediaEditBaseDraft,
    setDirtyState: setMediaEditDirtyState,
    clearCategory: options.clearCategory,
    updateCategory: options.updateCategory,
    syncMediaCategoryField: (preferredCategoryId?: number | null) => {
      options.syncMediaCategoryField(preferredCategoryId ?? null);
      uiBindings.syncMediaEditCategoryClearButton();
      uiBindings.renderMediaEditCategoryOptions();
    },
    getActiveCategoryId: options.getActiveCategoryId,
    updatePlaylist: options.updatePlaylist,
    updatePlayStatus: options.updatePlayStatus,
    hideMediaEditModal: (restoreFocus = false) => {
      mediaEditModalBindings?.hideMediaEditModal(restoreFocus);
    },
    getLocalizedMessage: options.getLocalizedMessage,
    updateNotice: options.updateNotice,
    isLocalMode: options.isLocalMode,
    isCloudMode: options.isCloudMode,
    persistCloudPlaylist: options.persistCloudPlaylist,
    generatePlaylistJson: options.generatePlaylistJson,
    ensureCategory: ensureMediaEditCategory,
    readDraftFromForm: draftBindings.readMediaEditDraftFromForm,
    validateDraft: uiBindings.validateAndRenderMediaEditDraftFromForm,
    setSaveButtonDisabled: uiBindings.setMediaEditSaveButtonDisabled,
    canMutateCurrentPlaylist: options.canMutateCurrentPlaylist,
    applyEditRestrictions: options.applyEditRestrictions,
    applyDraftToMediaItem,
  });

  draftBindings.hydrateMediaEditDraftStore();

  mediaEditModalBindings = initializeMediaEditModalBindings({
    status: options.status,
    modalElement: options.elements.modal,
    modalTitleElement: options.elements.modalTitle,
    modalItemTitleElement: options.elements.modalItemTitle,
    modalItemSourceElement: options.elements.modalItemSource,
    modalCloseButton: options.elements.closeButton,
    playlistListElement: options.playlistListElement,
    playButton: options.playButton,
    pauseButton: options.pauseButton,
    youtubePlayer: options.youtubePlayer,
    defaultModalTitle: defaultModalTitle,
    playlistMode: options.playlistMode,
    closePlaylistModeMenu: options.closePlaylistModeMenu,
    getLocalizedMessage: options.getLocalizedMessage,
    getMediaCategoryName: options.getMediaCategoryName,
    sanitizeMediaTitle: (value) => options.sanitizeMediaText(value, options.mediaTitleMaxLength),
    resetMediaEditPreviewState: mediaEditPreview.resetMediaEditPreviewState,
    clearMediaEditValidationView: uiBindings.clearMediaEditValidationView,
    closeCategoryDropdown: uiBindings.closeMediaEditCategoryDropdown,
    bindForm: draftBindings.bindMediaEditForm,
    updatePlaylist: options.updatePlaylist,
    createPreview: mediaEditPreview.createMediaEditPreview,
    startDurationSyncWait: mediaEditDurationSync.startIfNeeded,
    afterShow: () => {
      autoResizeMediaEditTextarea(options.elements.descriptionInput);
    },
    getActiveItem: () => mediaEditActiveItem,
    getDraftKey: draftBindings.getMediaEditDraftKey,
    canMutateCurrentPlaylist: options.canMutateCurrentPlaylist,
    applyEditRestrictions: options.applyEditRestrictions,
    updateNotice: options.updateNotice,
    hasUnsavedDraft: draftBindings.isActiveMediaEditUnsaved,
    isDirty: () => mediaEditIsDirty,
    discardDraft: draftBindings.discardActiveMediaEditDraft,
    confirm: options.confirm,
  });

  initializeMediaEditControlsRuntime({
    elements: options.elements,
    baseUrl: options.baseUrl,
    thumbnailGenerateEndpoint: options.thumbnailGenerateEndpoint,
    defaultVolume: options.defaultVolume,
    getLocalizedMessage: (key, fallback) => options.getLocalizedMessage(key, fallback),
    updateNotice: options.updateNotice,
    getPlaylistName: () => options.status.playlist || null,
    getActiveItem: () => mediaEditActiveItem,
    getBaseDraft: () => mediaEditBaseDraft,
    readDraftFromForm: draftBindings.readMediaEditDraftFromForm,
    sanitizeDraft: sanitizeMediaEditDraft,
    applyDraftToForm: applyMediaEditDraftToForm,
    applyDraftState: draftBindings.applyMediaEditDraftState,
    syncDraftStateFromForm: draftBindings.syncMediaEditDraftStateFromForm,
    validateAndRenderDraftFromForm: uiBindings.validateAndRenderMediaEditDraftFromForm,
    syncTimingDisplay: syncMediaEditTimingDisplay,
    syncTimingFieldFromPreview: mediaEditPreview.syncMediaEditTimingFieldFromPreview,
    mediaEditPreview,
    createMediaEditPreview: mediaEditPreview.createMediaEditPreview,
    closeMediaEditModal: mediaEditModalBindings.closeMediaEditModal,
    cancelMediaEditModal: mediaEditModalBindings.cancelMediaEditModal,
    saveMediaEdit: saveRuntime.saveMediaEdit,
    isMediaEditCategoryDropdownVisible: uiBindings.isMediaEditCategoryDropdownVisible,
    openMediaEditCategoryDropdown: uiBindings.openMediaEditCategoryDropdown,
    closeMediaEditCategoryDropdown: uiBindings.closeMediaEditCategoryDropdown,
    syncMediaEditCategoryClearButton: uiBindings.syncMediaEditCategoryClearButton,
    renderMediaEditCategoryOptions: uiBindings.renderMediaEditCategoryOptions,
    syncVolumeSlider: options.syncVolumeSlider,
    syncRangeProgress: options.syncRangeProgress,
    sanitizeTimingInputField: options.sanitizeTimingInputField,
    toTimingInputValue: options.toTimingInputValue,
    parseMediaTimeToIntegerSeconds: options.parseMediaTimeToIntegerSeconds,
    stepTimingField: options.stepTimingField,
  });

  return {
    getActiveItem: () => mediaEditActiveItem,
    isMediaEditCategoryDropdownVisible: uiBindings.isMediaEditCategoryDropdownVisible,
    closeMediaEditCategoryDropdown: uiBindings.closeMediaEditCategoryDropdown,
    closeMediaEditModal: mediaEditModalBindings.closeMediaEditModal,
    hideMediaEditModal: mediaEditModalBindings.hideMediaEditModal,
    openMediaEditModal: mediaEditModalBindings.openMediaEditModal,
    confirmDiscardActiveMediaEditIfNeeded: mediaEditModalBindings.confirmDiscardActiveMediaEditIfNeeded,
    clearMediaEditContext: draftBindings.clearMediaEditContext,
    discardActiveMediaEditDraft: draftBindings.discardActiveMediaEditDraft,
    persistMediaEditForCurrentPlaylist: saveRuntime.persistMediaEditForCurrentPlaylist,
  };
}
