import type { MediaItem } from '../types/ambient';

export type PlaylistMode = 'normal' | 'edit' | 'reorder' | 'delete';

export interface PlaylistModeUiElements {
  button: HTMLButtonElement | null;
  menu: HTMLElement | null;
  buttonIcon: HTMLElement | null;
  buttonLabel: HTMLElement | null;
}

export function createPlaylistMaskIcon(...classNames: string[]): HTMLSpanElement {
  const iconElm = document.createElement('span');
  iconElm.setAttribute('aria-hidden', 'true');
  iconElm.className = ['playlist-icon-mask', ...classNames].join(' ');
  return iconElm;
}

export function getPlaylistModeLabel(elements: PlaylistModeUiElements, mode: PlaylistMode): string {
  if (!elements.button) return mode;
  switch (mode) {
    case 'edit':
      return elements.button.dataset['labelEdit'] || 'Edit';
    case 'reorder':
      return elements.button.dataset['labelReorder'] || 'Reorder';
    case 'delete':
      return elements.button.dataset['labelDelete'] || 'Delete';
    default:
      return elements.button.dataset['labelNormal'] || 'Normal';
  }
}

export function syncPlaylistModeButton(
  elements: PlaylistModeUiElements,
  mode: PlaylistMode,
  defaultIconHtml: string,
  defaultLabel: string
): void {
  if (!elements.button || !elements.buttonIcon || !elements.buttonLabel) return;

  if (mode === 'normal') {
    elements.buttonIcon.innerHTML = defaultIconHtml;
    elements.buttonLabel.textContent = defaultLabel;
    return;
  }

  const option = elements.menu?.querySelector(
    `.playlist-mode-option[data-mode="${mode}"]`
  ) as HTMLButtonElement | null;
  const optionIcon = option?.querySelector('.playlist-mode-option-icon') as HTMLElement | null;
  const optionLabel = option?.querySelector('.playlist-mode-option-label') as HTMLElement | null;
  if (optionIcon && optionLabel) {
    elements.buttonIcon.innerHTML = optionIcon.outerHTML;
    elements.buttonLabel.textContent = optionLabel.textContent || getPlaylistModeLabel(elements, mode);
  }
}

export function closePlaylistModeMenu(elements: PlaylistModeUiElements): void {
  if (!elements.menu || !elements.button) return;
  elements.menu.classList.add('hidden');
  elements.button.setAttribute('aria-expanded', 'false');
}

export function togglePlaylistModeMenu(elements: PlaylistModeUiElements, forceOpen = false): void {
  if (!elements.menu || !elements.button) return;
  const shouldOpen = forceOpen || elements.menu.classList.contains('hidden');
  if (shouldOpen) {
    elements.menu.classList.remove('hidden');
    elements.button.setAttribute('aria-expanded', 'true');
  } else {
    closePlaylistModeMenu(elements);
  }
}

export function updatePlaylistModeMenuState(
  elements: PlaylistModeUiElements,
  activeMode: PlaylistMode,
  canEdit: boolean,
  canReorder: boolean
): void {
  if (!elements.menu) return;
  Array.from(elements.menu.querySelectorAll('.playlist-mode-option')).forEach((elm) => {
    const optElm = elm as HTMLButtonElement;
    const mode = (optElm.dataset['mode'] || '') as PlaylistMode;
    if (mode === 'edit') {
      optElm.disabled = !canEdit;
      optElm.setAttribute('aria-disabled', String(!canEdit));
      optElm.classList.toggle('text-gray-400', !canEdit);
      optElm.classList.toggle('dark:text-gray-500', !canEdit);
      optElm.classList.toggle('cursor-not-allowed', !canEdit);
      optElm.classList.toggle('hover:bg-gray-100', canEdit);
      optElm.classList.toggle('dark:hover:bg-gray-600', canEdit);
    }
    if (mode === 'reorder') {
      optElm.disabled = !canReorder;
      optElm.setAttribute('aria-disabled', String(!canReorder));
      optElm.classList.toggle('text-gray-400', !canReorder);
      optElm.classList.toggle('dark:text-gray-500', !canReorder);
      optElm.classList.toggle('cursor-not-allowed', !canReorder);
      optElm.classList.toggle('hover:bg-gray-100', canReorder);
      optElm.classList.toggle('dark:hover:bg-gray-600', canReorder);
    }
    if (mode === activeMode) {
      optElm.classList.add('text-blue-700', 'dark:text-blue-300');
      optElm.setAttribute('aria-current', 'true');
    } else {
      optElm.classList.remove('text-blue-700', 'dark:text-blue-300');
      optElm.removeAttribute('aria-current');
    }
  });
}

export function syncPlaylistModeAvailabilityButton(button: HTMLButtonElement | null, enabled: boolean): void {
  if (!button) return;
  button.disabled = !enabled;
  button.classList.toggle('opacity-50', !enabled);
  button.classList.toggle('cursor-not-allowed', !enabled);
  button.setAttribute('aria-disabled', String(!enabled));
}

export function syncDeleteSelectionIndicator(itemElm: HTMLElement, isSelected: boolean): void {
  const chkElm = itemElm.querySelector('span[data-delete-selector]') as HTMLElement | null;
  if (!chkElm) return;
  chkElm.className = isSelected
    ? 'flex-shrink-0 order-first flex items-center justify-center w-5 h-5 rounded border-2 border-red-500 bg-red-500'
    : 'flex-shrink-0 order-first flex items-center justify-center w-5 h-5 rounded border-2 border-gray-400 dark:border-gray-500';
  while (chkElm.firstChild) {
    chkElm.removeChild(chkElm.firstChild);
  }
  if (isSelected) {
    chkElm.appendChild(createPlaylistMaskIcon('playlist-icon-mask--check'));
  }
}

export function readPlaylistItemIdsFromDom(listElement: HTMLElement): number[] {
  return Array.from(listElement.querySelectorAll('a[data-playlist-item]')).map((elm) => {
    return Number(
      (elm as HTMLElement).dataset['playlistItem'] ||
      (elm as HTMLElement).getAttribute('data-playlist-item') ||
      -1
    );
  }).filter((amId) => amId >= 0);
}

export function buildDefaultPlaylistLabel(item: MediaItem): HTMLElement {
  const wrapperElm = document.createElement('span');
  wrapperElm.className = 'playlist-item-label playlist-item-label--default flex-1';

  const mainElm = document.createElement('span');
  mainElm.className = 'playlist-item-main';

  const titleElm = document.createElement('span');
  titleElm.className = 'text--playlist-title';
  titleElm.textContent = item.title;
  mainElm.appendChild(titleElm);

  if (item.artist && item.artist.trim() !== '') {
    const artistElm = document.createElement('span');
    artistElm.className = 'text--playlist-artist';
    artistElm.textContent = item.artist;
    mainElm.appendChild(artistElm);
  }

  wrapperElm.appendChild(mainElm);

  if (item.desc && item.desc.trim() !== '') {
    const descButtonElm = document.createElement('span');
    descButtonElm.className = 'icon--playlist-desc';
    descButtonElm.setAttribute('data-playlist-desc-trigger', '');
    descButtonElm.setAttribute('data-desc', item.desc);
    descButtonElm.setAttribute('data-playlist-title', item.title);
    descButtonElm.setAttribute('data-playlist-artist', item.artist || '');
    descButtonElm.setAttribute('aria-label', item.title);
    descButtonElm.setAttribute('role', 'button');
    descButtonElm.setAttribute('tabindex', '0');
    descButtonElm.appendChild(createPlaylistMaskIcon('playlist-icon-mask--desc'));
    wrapperElm.appendChild(descButtonElm);
  }

  return wrapperElm;
}
