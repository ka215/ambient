import type { MediaItem } from '../../types/ambient';

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

export function resetMediaEditModalView(options: {
  modalElement: HTMLElement | null;
  titleElement: HTMLElement | null;
  itemTitleElement: HTMLElement | null;
  itemSourceElement: HTMLElement | null;
  defaultTitle: string;
}): void {
  if (!options.modalElement) {
    return;
  }

  options.modalElement.classList.add('hidden');
  options.modalElement.setAttribute('aria-hidden', 'true');

  if (options.titleElement) {
    options.titleElement.textContent = options.defaultTitle;
  }
  if (options.itemTitleElement) {
    options.itemTitleElement.textContent = '';
  }
  if (options.itemSourceElement) {
    options.itemSourceElement.innerHTML = '';
  }
}

export function showMediaEditModalView(options: {
  modalElement: HTMLElement | null;
  titleElement: HTMLElement | null;
  itemTitleElement: HTMLElement | null;
  closeButton: HTMLElement | null;
  defaultTitle: string;
  itemTitle: string;
  afterShow?: () => void;
}): void {
  if (!options.modalElement || !options.titleElement) {
    return;
  }
  const modalElement = options.modalElement;
  const titleElement = options.titleElement;

  if (options.itemTitleElement) {
    options.itemTitleElement.textContent = options.itemTitle;
  }
  titleElement.textContent = options.defaultTitle;
  modalElement.classList.remove('hidden');
  modalElement.removeAttribute('aria-hidden');
  window.requestAnimationFrame(() => {
    options.afterShow?.();
    (options.closeButton || modalElement).focus();
  });
}

export function focusPlaylistItemById(options: {
  listElement: HTMLElement | null;
  amId: number | null;
}): boolean {
  if (!options.listElement || options.amId === null) {
    return false;
  }

  const targetElement = options.listElement.querySelector(`a[data-playlist-item="${options.amId}"]`) as HTMLElement | null;
  if (!targetElement) {
    return false;
  }

  targetElement.focus();
  targetElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  return true;
}

export function restoreMediaEditModalFocus(options: {
  restoreFocus: boolean;
  preferredFocusId: number | null;
  restoreTarget: HTMLElement | null;
  focusPlaylistItemById: (amId: number | null) => boolean;
}): void {
  if (!options.restoreFocus) {
    return;
  }

  if (!options.focusPlaylistItemById(options.preferredFocusId)) {
    options.restoreTarget?.focus();
  }
}

export function finalizeMediaEditModalClose(options: {
  restoreFocus: boolean;
  preferredFocusId: number | null;
  restoreTarget: HTMLElement | null;
  resetModalView: () => void;
  closeCategoryDropdown: () => void;
  focusPlaylistItemById: (amId: number | null) => boolean;
}): void {
  options.resetModalView();
  options.closeCategoryDropdown();
  restoreMediaEditModalFocus({
    restoreFocus: options.restoreFocus,
    preferredFocusId: options.preferredFocusId,
    restoreTarget: options.restoreTarget,
    focusPlaylistItemById: options.focusPlaylistItemById,
  });
}

export function openManagedMediaEditModal(options: {
  mediaItem: MediaItem;
  trigger: HTMLElement;
  playlistMode: string;
  setActiveTrigger: (trigger: HTMLElement) => void;
  closePlaylistModeMenu: () => void;
  buildItemTitle: (mediaItem: MediaItem) => string;
  renderSourceBadges: (mediaItem: MediaItem) => void;
  bindForm: (mediaItem: MediaItem) => void;
  updatePlaylist: () => void;
  createPreview: (mediaItem: MediaItem) => void;
  startDurationSyncWait: () => void;
  modalElement: HTMLElement | null;
  titleElement: HTMLElement | null;
  itemTitleElement: HTMLElement | null;
  closeButton: HTMLElement | null;
  defaultTitle: string;
  afterShow?: () => void;
}): void {
  if (!options.modalElement || !options.titleElement) {
    return;
  }

  options.setActiveTrigger(options.trigger);
  options.closePlaylistModeMenu();
  const itemTitle = options.buildItemTitle(options.mediaItem);
  options.renderSourceBadges(options.mediaItem);
  options.bindForm(options.mediaItem);

  if (options.playlistMode === 'edit') {
    options.updatePlaylist();
  }

  options.createPreview(options.mediaItem);
  options.startDurationSyncWait();
  showMediaEditModalView({
    modalElement: options.modalElement,
    titleElement: options.titleElement,
    itemTitleElement: options.itemTitleElement,
    closeButton: options.closeButton,
    defaultTitle: options.defaultTitle,
    itemTitle,
    afterShow: options.afterShow,
  });
}
