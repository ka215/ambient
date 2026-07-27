export type MediaEditValidationViewResult = {
  valid: boolean;
  invalidFieldIds: string[];
  fieldMessages?: Record<string, string[]>;
};

type MediaEditValidationViewElements = {
  categoryField: HTMLElement | null;
  titleField: HTMLElement | null;
  seekStartField: HTMLElement | null;
  seekEndField: HTMLElement | null;
  fadeInEndField: HTMLElement | null;
  fadeOutStartField: HTMLElement | null;
  saveButton: HTMLButtonElement | null;
};

function setFieldValidationState(field: HTMLElement | null, validState: boolean | null): void {
  if (!(field instanceof HTMLElement)) {
    return;
  }
  const invalid = validState === false;
  field.setAttribute('aria-invalid', invalid ? 'true' : 'false');
  field.classList.toggle('border-red-500', invalid);
  field.classList.toggle('focus:border-red-500', invalid);
  field.classList.toggle('focus:ring-red-200', invalid);
  field.classList.toggle('dark:focus:ring-red-900', invalid);
  const group = field.closest<HTMLElement>('[data-media-edit-validation-group]');
  if (group) {
    group.classList.toggle('border-red-500', invalid);
    group.classList.toggle('focus-within:border-red-500', invalid);
    group.classList.toggle('focus-within:ring-2', invalid);
    group.classList.toggle('focus-within:ring-red-200', invalid);
    group.classList.toggle('dark:focus-within:border-red-400', invalid);
    group.classList.toggle('dark:focus-within:ring-red-900', invalid);
  }
}

export function setMediaEditFieldValidationMessage(fieldId: string, message: string | null): void {
  const messageElement = document.getElementById(`${fieldId}-error`);
  if (!(messageElement instanceof HTMLElement)) {
    return;
  }
  if (message === null || message.trim() === '') {
    messageElement.textContent = '';
    messageElement.classList.add('hidden');
    return;
  }
  messageElement.textContent = message;
  messageElement.classList.remove('hidden');
}

export function setMediaEditSaveButtonDisabled(
  saveButton: HTMLButtonElement | null,
  disabled: boolean
): void {
  if (!(saveButton instanceof HTMLButtonElement)) {
    return;
  }
  saveButton.disabled = disabled;
  saveButton.setAttribute('aria-disabled', disabled ? 'true' : 'false');
}

export function clearMediaEditValidationView(elements: MediaEditValidationViewElements): void {
  setMediaEditFieldValidationMessage('modal-media-edit-category', null);
  setMediaEditFieldValidationMessage('modal-media-edit-title-input', null);
  setMediaEditFieldValidationMessage('modal-media-edit-seek-start', null);
  setMediaEditFieldValidationMessage('modal-media-edit-seek-end', null);
  setMediaEditFieldValidationMessage('modal-media-edit-fadein-end', null);
  setMediaEditFieldValidationMessage('modal-media-edit-fadeout-start', null);
  [
    elements.categoryField,
    elements.titleField,
    elements.seekStartField,
    elements.seekEndField,
    elements.fadeInEndField,
    elements.fadeOutStartField,
  ].forEach((field) => {
    setFieldValidationState(field, null);
  });
  setMediaEditSaveButtonDisabled(elements.saveButton, false);
}

export function renderMediaEditValidationView(
  elements: MediaEditValidationViewElements,
  result: MediaEditValidationViewResult
): void {
  const invalidIds = new Set(result.invalidFieldIds);
  const fieldMessages = result.fieldMessages || {};
  setFieldValidationState(elements.categoryField, !invalidIds.has('modal-media-edit-category'));
  setFieldValidationState(elements.titleField, !invalidIds.has('modal-media-edit-title-input'));
  setFieldValidationState(elements.seekStartField, !invalidIds.has('modal-media-edit-seek-start'));
  setFieldValidationState(elements.seekEndField, !invalidIds.has('modal-media-edit-seek-end'));
  setFieldValidationState(elements.fadeInEndField, !invalidIds.has('modal-media-edit-fadein-end'));
  setFieldValidationState(elements.fadeOutStartField, !invalidIds.has('modal-media-edit-fadeout-start'));
  setMediaEditFieldValidationMessage('modal-media-edit-category', fieldMessages['modal-media-edit-category']?.[0] || null);
  setMediaEditFieldValidationMessage('modal-media-edit-title-input', fieldMessages['modal-media-edit-title-input']?.[0] || null);
  setMediaEditFieldValidationMessage('modal-media-edit-seek-start', fieldMessages['modal-media-edit-seek-start']?.[0] || null);
  setMediaEditFieldValidationMessage('modal-media-edit-seek-end', fieldMessages['modal-media-edit-seek-end']?.[0] || null);
  setMediaEditFieldValidationMessage('modal-media-edit-fadein-end', fieldMessages['modal-media-edit-fadein-end']?.[0] || null);
  setMediaEditFieldValidationMessage('modal-media-edit-fadeout-start', fieldMessages['modal-media-edit-fadeout-start']?.[0] || null);
  setMediaEditSaveButtonDisabled(elements.saveButton, !result.valid);
}
