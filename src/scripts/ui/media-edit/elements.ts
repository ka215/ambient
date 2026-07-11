export interface MediaEditElements {
  modal: HTMLElement | null;
  modalTitle: HTMLElement | null;
  modalItemTitle: HTMLElement | null;
  modalItemSource: HTMLElement | null;
  form: HTMLFormElement | null;
  categoryCombobox: HTMLElement | null;
  categoryInput: HTMLInputElement | null;
  categoryClearButton: HTMLButtonElement | null;
  categoryToggleButton: HTMLButtonElement | null;
  categoryDropdown: HTMLElement | null;
  categoryOptions: HTMLElement | null;
  titleInput: HTMLInputElement | null;
  artistInput: HTMLInputElement | null;
  descriptionInput: HTMLTextAreaElement | null;
  volumeInput: HTMLInputElement | null;
  volumeValue: HTMLElement | null;
  thumbnailPreview: HTMLImageElement | null;
  thumbnailName: HTMLElement | null;
  thumbnailInput: HTMLInputElement | null;
  thumbnailPickButton: HTMLButtonElement | null;
  thumbnailRemoveButton: HTMLButtonElement | null;
  thumbnailClearButton: HTMLButtonElement | null;
  thumbnailSection: HTMLElement | null;
  preview: HTMLElement | null;
  previewError: HTMLElement | null;
  previewErrorMessage: HTMLElement | null;
  previewRetryButton: HTMLButtonElement | null;
  seekStartInput: HTMLInputElement | null;
  seekEndInput: HTMLInputElement | null;
  fadeInEndInput: HTMLInputElement | null;
  fadeOutStartInput: HTMLInputElement | null;
  seekStartHms: HTMLElement | null;
  seekEndHms: HTMLElement | null;
  fadeInEndHms: HTMLElement | null;
  fadeOutStartHms: HTMLElement | null;
  seekTimeline: HTMLElement | null;
  seekTimelineLoading: HTMLElement | null;
  seekMarkerStart: HTMLElement | null;
  seekMarkerFadeInEnd: HTMLElement | null;
  seekMarkerFadeOutStart: HTMLElement | null;
  seekMarkerEnd: HTMLElement | null;
  seekFixedStartTime: HTMLElement | null;
  seekFixedEndTime: HTMLElement | null;
  seekMarkerStartTime: HTMLElement | null;
  seekMarkerFadeInEndTime: HTMLElement | null;
  seekMarkerFadeOutStartTime: HTMLElement | null;
  seekMarkerEndTime: HTMLElement | null;
  syncSeekStartButton: HTMLButtonElement | null;
  syncSeekEndButton: HTMLButtonElement | null;
  syncFadeInEndButton: HTMLButtonElement | null;
  syncFadeOutStartButton: HTMLButtonElement | null;
  closeButton: HTMLButtonElement | null;
  cancelButton: HTMLButtonElement | null;
  saveButton: HTMLButtonElement | null;
}

export function resolveMediaEditElements(root: Document = document): MediaEditElements {
  return {
    modal: root.getElementById('modal-media-edit') as HTMLElement | null,
    modalTitle: root.getElementById('modal-media-edit-title') as HTMLElement | null,
    modalItemTitle: root.getElementById('modal-media-edit-item-title') as HTMLElement | null,
    modalItemSource: root.getElementById('modal-media-edit-item-source') as HTMLElement | null,
    form: root.getElementById('form-media-edit') as HTMLFormElement | null,
    categoryCombobox: root.getElementById('modal-media-edit-category-combobox') as HTMLElement | null,
    categoryInput: root.getElementById('modal-media-edit-category') as HTMLInputElement | null,
    categoryClearButton: root.getElementById('btn-media-edit-category-clear') as HTMLButtonElement | null,
    categoryToggleButton: root.getElementById('btn-media-edit-category-toggle') as HTMLButtonElement | null,
    categoryDropdown: root.getElementById('modal-media-edit-category-dropdown') as HTMLElement | null,
    categoryOptions: root.getElementById('modal-media-edit-category-options') as HTMLElement | null,
    titleInput: root.getElementById('modal-media-edit-title-input') as HTMLInputElement | null,
    artistInput: root.getElementById('modal-media-edit-artist-input') as HTMLInputElement | null,
    descriptionInput: root.getElementById('modal-media-edit-description') as HTMLTextAreaElement | null,
    volumeInput: root.getElementById('modal-media-edit-volume') as HTMLInputElement | null,
    volumeValue: root.getElementById('modal-media-edit-volume-value') as HTMLElement | null,
    thumbnailPreview: root.getElementById('modal-media-edit-thumbnail-preview') as HTMLImageElement | null,
    thumbnailName: root.getElementById('modal-media-edit-thumbnail-name') as HTMLElement | null,
    thumbnailInput: root.getElementById('modal-media-edit-thumbnail-input') as HTMLInputElement | null,
    thumbnailPickButton: root.getElementById('btn-media-edit-thumbnail-pick') as HTMLButtonElement | null,
    thumbnailRemoveButton: root.getElementById('btn-media-edit-thumbnail-remove') as HTMLButtonElement | null,
    thumbnailClearButton: root.getElementById('btn-media-edit-thumbnail-clear') as HTMLButtonElement | null,
    thumbnailSection: root.getElementById('media-edit-thumbnail-section') as HTMLElement | null,
    preview: root.getElementById('modal-media-edit-preview') as HTMLElement | null,
    previewError: root.getElementById('modal-media-edit-preview-error') as HTMLElement | null,
    previewErrorMessage: root.getElementById('modal-media-edit-preview-error-message') as HTMLElement | null,
    previewRetryButton: root.getElementById('btn-media-edit-preview-retry') as HTMLButtonElement | null,
    seekStartInput: root.getElementById('modal-media-edit-seek-start') as HTMLInputElement | null,
    seekEndInput: root.getElementById('modal-media-edit-seek-end') as HTMLInputElement | null,
    fadeInEndInput: root.getElementById('modal-media-edit-fadein-end') as HTMLInputElement | null,
    fadeOutStartInput: root.getElementById('modal-media-edit-fadeout-start') as HTMLInputElement | null,
    seekStartHms: root.getElementById('modal-media-edit-seek-start-hms') as HTMLElement | null,
    seekEndHms: root.getElementById('modal-media-edit-seek-end-hms') as HTMLElement | null,
    fadeInEndHms: root.getElementById('modal-media-edit-fadein-end-hms') as HTMLElement | null,
    fadeOutStartHms: root.getElementById('modal-media-edit-fadeout-start-hms') as HTMLElement | null,
    seekTimeline: root.getElementById('modal-media-edit-seek-timeline') as HTMLElement | null,
    seekTimelineLoading: root.getElementById('modal-media-edit-seek-timeline-loading') as HTMLElement | null,
    seekMarkerStart: root.getElementById('modal-media-edit-seek-marker-start') as HTMLElement | null,
    seekMarkerFadeInEnd: root.getElementById('modal-media-edit-seek-marker-fadein-end') as HTMLElement | null,
    seekMarkerFadeOutStart: root.getElementById('modal-media-edit-seek-marker-fadeout-start') as HTMLElement | null,
    seekMarkerEnd: root.getElementById('modal-media-edit-seek-marker-end') as HTMLElement | null,
    seekFixedStartTime: root.getElementById('modal-media-edit-seek-fixed-start-time') as HTMLElement | null,
    seekFixedEndTime: root.getElementById('modal-media-edit-seek-fixed-end-time') as HTMLElement | null,
    seekMarkerStartTime: root.getElementById('modal-media-edit-seek-marker-start-time') as HTMLElement | null,
    seekMarkerFadeInEndTime: root.getElementById('modal-media-edit-seek-marker-fadein-end-time') as HTMLElement | null,
    seekMarkerFadeOutStartTime: root.getElementById('modal-media-edit-seek-marker-fadeout-start-time') as HTMLElement | null,
    seekMarkerEndTime: root.getElementById('modal-media-edit-seek-marker-end-time') as HTMLElement | null,
    syncSeekStartButton: root.getElementById('btn-media-edit-sync-seek-start') as HTMLButtonElement | null,
    syncSeekEndButton: root.getElementById('btn-media-edit-sync-seek-end') as HTMLButtonElement | null,
    syncFadeInEndButton: root.getElementById('btn-media-edit-sync-fadein-end') as HTMLButtonElement | null,
    syncFadeOutStartButton: root.getElementById('btn-media-edit-sync-fadeout-start') as HTMLButtonElement | null,
    closeButton: root.getElementById('btn-close-media-edit') as HTMLButtonElement | null,
    cancelButton: root.getElementById('btn-cancel-media-edit') as HTMLButtonElement | null,
    saveButton: root.getElementById('btn-save-media-edit') as HTMLButtonElement | null,
  };
}
