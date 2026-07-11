import type { MediaItem } from '../../types/ambient';
import {
  createMediaEditCategoryOptionButton,
} from './controls';
import {
  getMediaEditCategoryOptions,
  isMediaEditCategoryDropdownVisible,
  renderMediaEditCategoryOptionsView,
  setMediaEditCategoryDropdownExpandedView,
  syncMediaEditCategoryClearButtonView,
} from './category-view';
import {
  clearMediaEditValidationView,
  renderMediaEditValidationView,
  setMediaEditSaveButtonDisabled,
} from './validation-view';
import type { MediaEditDraft } from '../../domain/media-edit/draft';

export interface MediaEditValidationResult {
  valid: boolean;
  messages: string[];
  invalidFieldIds: string[];
  fieldMessages: Record<string, string[]>;
}

export function createMediaEditUiBindings(options: {
  categoryField: HTMLInputElement | null;
  titleField: HTMLInputElement | null;
  seekStartField: HTMLInputElement | null;
  seekEndField: HTMLInputElement | null;
  fadeInEndField: HTMLInputElement | null;
  fadeOutStartField: HTMLInputElement | null;
  saveButton: HTMLButtonElement | null;
  categoryDropdown: HTMLElement | null;
  categoryCombobox: HTMLElement | null;
  categoryToggleButton: HTMLButtonElement | null;
  categoryOptionsContainer: HTMLElement | null;
  categoryClearButton: HTMLButtonElement | null;
  getCategories: () => string[] | null;
  getLocalizedMessage: (key: string, fallback?: string) => string;
  createValidationDraft: () => MediaEditDraft;
  getActiveItem: () => MediaItem | null;
  resolveKnownDuration: (mediaItem: MediaItem | null) => number | null;
  resolveEffectiveEnd: (
    seekEnd: number | null,
    duration: number | null,
    seekStart: number | null,
    fallbackFadeoutDuration?: number | null
  ) => number | null;
  normalizeTimingValue: (value: unknown, fallback?: number | null) => number | null;
}): {
  getMediaEditCategoryOptions: () => string[];
  isMediaEditCategoryDropdownVisible: () => boolean;
  renderMediaEditCategoryOptions: () => void;
  syncMediaEditCategoryClearButton: () => void;
  setMediaEditCategoryDropdownExpanded: (expanded: boolean) => void;
  closeMediaEditCategoryDropdown: (restoreFocus?: boolean) => void;
  openMediaEditCategoryDropdown: () => void;
  setMediaEditSaveButtonDisabled: (disabled: boolean) => void;
  clearMediaEditValidationView: () => void;
  renderMediaEditValidation: (result: MediaEditValidationResult) => void;
  validateMediaEditDraft: (draft: MediaEditDraft) => MediaEditValidationResult;
  validateAndRenderMediaEditDraftFromForm: () => MediaEditValidationResult;
} {
  function getCategoryOptions(): string[] {
    return getMediaEditCategoryOptions(options.getCategories());
  }

  function isDropdownVisible(): boolean {
    return isMediaEditCategoryDropdownVisible(options.categoryDropdown);
  }

  function setDropdownExpanded(expanded: boolean): void {
    setMediaEditCategoryDropdownExpandedView({
      dropdownElement: options.categoryDropdown,
      comboboxElement: options.categoryCombobox,
      toggleButton: options.categoryToggleButton,
      expanded,
    });
  }

  function closeDropdown(restoreFocus: boolean = false): void {
    setDropdownExpanded(false);
    if (restoreFocus) {
      options.categoryField?.focus();
    }
  }

  function renderCategoryOptions(): void {
    renderMediaEditCategoryOptionsView({
      optionsContainer: options.categoryOptionsContainer,
      selectedCategory: options.categoryField?.value.trim() || '',
      categories: getCategoryOptions(),
      getLocalizedMessage: options.getLocalizedMessage,
      createOptionButton: (categoryName, isSelected) => createMediaEditCategoryOptionButton({
        categoryInput: options.categoryField,
        categoryName,
        isSelected,
        onCloseDropdown: closeDropdown,
      }),
    });
  }

  function openDropdown(): void {
    renderCategoryOptions();
    setDropdownExpanded(true);
  }

  function syncCategoryClearButton(): void {
    syncMediaEditCategoryClearButtonView({
      clearButton: options.categoryClearButton,
      categoryValue: options.categoryField?.value || '',
    });
  }

  function setSaveButtonDisabled(disabled: boolean): void {
    setMediaEditSaveButtonDisabled(options.saveButton, disabled);
  }

  function clearValidation(): void {
    clearMediaEditValidationView({
      categoryField: options.categoryField,
      titleField: options.titleField,
      seekStartField: options.seekStartField,
      seekEndField: options.seekEndField,
      fadeInEndField: options.fadeInEndField,
      fadeOutStartField: options.fadeOutStartField,
      saveButton: options.saveButton,
    });
  }

  function renderValidation(result: MediaEditValidationResult): void {
    renderMediaEditValidationView({
      categoryField: options.categoryField,
      titleField: options.titleField,
      seekStartField: options.seekStartField,
      seekEndField: options.seekEndField,
      fadeInEndField: options.fadeInEndField,
      fadeOutStartField: options.fadeOutStartField,
      saveButton: options.saveButton,
    }, result);
  }

  function validateDraft(draft: MediaEditDraft): MediaEditValidationResult {
    const messages: string[] = [];
    const invalidFieldIds = new Set<string>();
    const fieldMessages: Record<string, string[]> = {};
    const addFieldMessage = (fieldId: string, message: string): void => {
      if (!fieldMessages[fieldId]) {
        fieldMessages[fieldId] = [];
      }
      fieldMessages[fieldId].push(message);
    };

    const activeItem = options.getActiveItem();
    const knownDuration = options.resolveKnownDuration(activeItem);
    const effectiveEnd = options.resolveEffectiveEnd(
      draft.seekEnd,
      knownDuration,
      draft.seekStart,
      activeItem ? options.normalizeTimingValue(activeItem.fadeout, null) : null
    );

    if (draft.category.trim() === '') {
      const message = options.getLocalizedMessage('Category is required.');
      messages.push(message);
      addFieldMessage('modal-media-edit-category', message);
      invalidFieldIds.add('modal-media-edit-category');
    }

    if (draft.title.trim() === '') {
      const message = options.getLocalizedMessage('Title is required.');
      messages.push(message);
      addFieldMessage('modal-media-edit-title-input', message);
      invalidFieldIds.add('modal-media-edit-title-input');
    }

    if (draft.seekStart !== null && draft.seekEnd !== null && draft.seekStart > draft.seekEnd) {
      const message = options.getLocalizedMessage('Seek start must be less than or equal to seek end.');
      messages.push(message);
      addFieldMessage('modal-media-edit-seek-start', message);
      addFieldMessage('modal-media-edit-seek-end', message);
      invalidFieldIds.add('modal-media-edit-seek-start');
      invalidFieldIds.add('modal-media-edit-seek-end');
    }

    if (draft.seekStart !== null && draft.fadeInEnd !== null && draft.seekStart > draft.fadeInEnd) {
      const message = options.getLocalizedMessage('Seek start must be less than or equal to fade-in end.');
      messages.push(message);
      addFieldMessage('modal-media-edit-seek-start', message);
      addFieldMessage('modal-media-edit-fadein-end', message);
      invalidFieldIds.add('modal-media-edit-seek-start');
      invalidFieldIds.add('modal-media-edit-fadein-end');
    }

    if (draft.seekStart !== null && draft.fadeOutStart !== null && draft.seekStart > draft.fadeOutStart) {
      const message = options.getLocalizedMessage('Seek start must be less than or equal to fade-out start.');
      messages.push(message);
      addFieldMessage('modal-media-edit-seek-start', message);
      addFieldMessage('modal-media-edit-fadeout-start', message);
      invalidFieldIds.add('modal-media-edit-seek-start');
      invalidFieldIds.add('modal-media-edit-fadeout-start');
    }

    if (draft.fadeInEnd !== null && draft.seekEnd !== null && draft.fadeInEnd > draft.seekEnd) {
      const message = options.getLocalizedMessage('Fade-in end must be less than or equal to seek end.');
      messages.push(message);
      addFieldMessage('modal-media-edit-fadein-end', message);
      addFieldMessage('modal-media-edit-seek-end', message);
      invalidFieldIds.add('modal-media-edit-fadein-end');
      invalidFieldIds.add('modal-media-edit-seek-end');
    }

    if (draft.fadeOutStart !== null && draft.seekEnd !== null && draft.fadeOutStart >= draft.seekEnd) {
      const message = options.getLocalizedMessage('Fade-out start must be less than seek end.');
      messages.push(message);
      addFieldMessage('modal-media-edit-fadeout-start', message);
      addFieldMessage('modal-media-edit-seek-end', message);
      invalidFieldIds.add('modal-media-edit-fadeout-start');
      invalidFieldIds.add('modal-media-edit-seek-end');
    }

    if (draft.fadeInEnd !== null && draft.fadeOutStart !== null && draft.fadeInEnd > draft.fadeOutStart) {
      const message = options.getLocalizedMessage('Fade-in end must be less than or equal to fade-out start.');
      messages.push(message);
      addFieldMessage('modal-media-edit-fadein-end', message);
      addFieldMessage('modal-media-edit-fadeout-start', message);
      invalidFieldIds.add('modal-media-edit-fadein-end');
      invalidFieldIds.add('modal-media-edit-fadeout-start');
    }

    if (draft.seekEnd !== null && knownDuration !== null && draft.seekEnd > knownDuration) {
      const message = options.getLocalizedMessage('Seek end must be less than or equal to media duration.');
      messages.push(message);
      addFieldMessage('modal-media-edit-seek-end', message);
      invalidFieldIds.add('modal-media-edit-seek-end');
    }

    if (draft.seekEnd === null && draft.fadeOutStart !== null && effectiveEnd !== null && draft.fadeOutStart > effectiveEnd) {
      const message = options.getLocalizedMessage('Fade-out start must be less than or equal to seek end.');
      messages.push(message);
      addFieldMessage('modal-media-edit-fadeout-start', message);
      addFieldMessage('modal-media-edit-seek-end', message);
      invalidFieldIds.add('modal-media-edit-fadeout-start');
      invalidFieldIds.add('modal-media-edit-seek-end');
    }

    return {
      valid: messages.length === 0,
      messages,
      invalidFieldIds: Array.from(invalidFieldIds),
      fieldMessages,
    };
  }

  function validateAndRenderFromForm(): MediaEditValidationResult {
    const result = validateDraft(options.createValidationDraft());
    renderValidation(result);
    return result;
  }

  return {
    getMediaEditCategoryOptions: getCategoryOptions,
    isMediaEditCategoryDropdownVisible: isDropdownVisible,
    renderMediaEditCategoryOptions: renderCategoryOptions,
    syncMediaEditCategoryClearButton: syncCategoryClearButton,
    setMediaEditCategoryDropdownExpanded: setDropdownExpanded,
    closeMediaEditCategoryDropdown: closeDropdown,
    openMediaEditCategoryDropdown: openDropdown,
    setMediaEditSaveButtonDisabled: setSaveButtonDisabled,
    clearMediaEditValidationView: clearValidation,
    renderMediaEditValidation: renderValidation,
    validateMediaEditDraft: validateDraft,
    validateAndRenderMediaEditDraftFromForm: validateAndRenderFromForm,
  };
}
