import type { MediaItem } from '../types/ambient';

export function isMediaEditModalVisible(modalElement: HTMLElement | null): boolean {
  return !!modalElement && !modalElement.classList.contains('hidden');
}

export function getMediaEditFocusableElements(modalElement: HTMLElement | null): HTMLElement[] {
  if (!modalElement) {
    return [];
  }

  return Array.from(
    modalElement.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((elm) => !elm.hasAttribute('disabled'));
}

export function trapMediaEditModalFocus(options: {
  modalElement: HTMLElement | null;
  event: KeyboardEvent;
}): void {
  if (!isMediaEditModalVisible(options.modalElement)) {
    return;
  }

  const focusableElements = getMediaEditFocusableElements(options.modalElement);
  if (focusableElements.length === 0) {
    options.event.preventDefault();
    options.modalElement?.focus();
    return;
  }

  const activeElement = document.activeElement as HTMLElement | null;
  const firstElement = focusableElements[0] || null;
  const lastElement = focusableElements[focusableElements.length - 1] || null;
  if (!firstElement || !lastElement) {
    options.event.preventDefault();
    options.modalElement?.focus();
    return;
  }

  if (options.event.shiftKey && activeElement === firstElement) {
    options.event.preventDefault();
    lastElement.focus();
  } else if (!options.event.shiftKey && activeElement === lastElement) {
    options.event.preventDefault();
    firstElement.focus();
  }
}

export function renderMediaEditSourceBadges(options: {
  container: HTMLElement | null;
  mediaItem: MediaItem;
  getLocalizedMessage: (key: string, fallback: string) => string;
  getCategoryName: (mediaItem: MediaItem) => string;
}): void {
  if (!options.container) {
    return;
  }

  options.container.innerHTML = '';

  const typeBadge = document.createElement('span');
  typeBadge.className = 'media-edit-source-badge media-edit-source-badge--type';

  if (options.mediaItem.videoid && options.mediaItem.videoid.trim() !== '') {
    typeBadge.textContent = options.getLocalizedMessage('mediaEditTypeYoutube', 'YouTube');
    const sourceBadge = document.createElement('span');
    sourceBadge.className = 'media-edit-source-badge';
    sourceBadge.textContent = options.mediaItem.videoid.trim();
    options.container.appendChild(typeBadge);
    options.container.appendChild(sourceBadge);
  } else if (options.mediaItem.file && options.mediaItem.file.trim() !== '') {
    const isAudio = /\.(mp3|aac|ogg|flac|wav|m4a|opus)(\?.*)?$/i.test(options.mediaItem.file);
    typeBadge.textContent = isAudio
      ? options.getLocalizedMessage('mediaEditTypeLocalAudio', 'Local audio')
      : options.getLocalizedMessage('mediaEditTypeLocalVideo', 'Local video');
    const sourceBadge = document.createElement('span');
    sourceBadge.className = 'media-edit-source-badge';
    sourceBadge.textContent = options.mediaItem.file.trim();
    options.container.appendChild(typeBadge);
    options.container.appendChild(sourceBadge);
  } else {
    typeBadge.textContent = options.getLocalizedMessage('mediaEditTypeUnknown', 'Unknown');
    options.container.appendChild(typeBadge);
  }

  const categoryName = options.getCategoryName(options.mediaItem);
  if (categoryName !== '') {
    const categoryBadge = document.createElement('span');
    categoryBadge.className = 'media-edit-source-badge';
    categoryBadge.textContent = categoryName;
    options.container.appendChild(categoryBadge);
  }
}
