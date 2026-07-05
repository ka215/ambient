import type { MediaItem } from '../types/ambient';

export type PlaylistMode = 'normal' | 'edit' | 'reorder' | 'delete';

export interface PlaylistItemRenderOptions {
  item: MediaItem;
  isCurrent: boolean;
  mode: PlaylistMode;
  isDeleteSelected: boolean;
  isEditSelected: boolean;
  format: string | null;
  imageDir?: string | null;
  fallbackThumbPath: string;
  resolveYoutubeThumbnailUrl: (videoId: string) => string;
  trimTitle: (value: string) => string;
  formatLabel: (format: string, item: MediaItem) => string;
}

export interface PlaylistQuickAddOptions {
  registerText: string;
  onClick: (event: Event) => void;
}

export interface PlaylistModeAdjustmentResult {
  nextMode: PlaylistMode;
  changed: boolean;
}

export interface PlaylistItemsRenderOptions {
  listElement: HTMLElement;
  items: MediaItem[];
  currentId: number | null;
  mode: PlaylistMode;
  deleteSelectedIds: Set<number>;
  editSelectedId: number | null;
  format: string | null;
  imageDir?: string | null;
  fallbackThumbPath: string;
  resolveYoutubeThumbnailUrl: (videoId: string) => string;
  trimTitle: (value: string) => string;
  formatLabel: (format: string, item: MediaItem) => string;
}

export interface PlaylistDescriptionPayload {
  trigger: HTMLElement;
  titleText: string;
  artistText: string;
  descText: string;
}

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

export function getPlaylistDescriptionPayload(target: HTMLElement | null): PlaylistDescriptionPayload | null {
  if (!target) {
    return null;
  }

  const trigger = target.closest('[data-playlist-desc-trigger]') as HTMLElement | null;
  if (!trigger) {
    return null;
  }

  const descText = trigger.dataset['desc'] || '';
  if (descText.trim() === '') {
    return null;
  }

  return {
    trigger,
    descText,
    titleText: trigger.getAttribute('data-playlist-title') || '',
    artistText: trigger.getAttribute('data-playlist-artist') || '',
  };
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

export function syncPlaylistEmptyState(
  noMediaElement: HTMLElement,
  isEmpty: boolean,
  closePlaylistModeMenu: () => void
): void {
  if (isEmpty) {
    noMediaElement.classList.remove('hidden');
    closePlaylistModeMenu();
    return;
  }

  noMediaElement.classList.add('hidden');
}

export function syncPlaylistCurrentFocus(
  listElement: HTMLElement,
  currentId: number | null
): void {
  Array.from(listElement.querySelectorAll('a')).forEach((elm) => {
    const itemElm = elm as HTMLElement;
    if (currentId !== null && itemElm.dataset['playlistItem'] === String(currentId)) {
      itemElm.setAttribute('aria-current', 'true');
      itemElm.setAttribute(
        'class',
        'flex items-center gap-2 w-full px-4 py-2 text-white bg-blue-500 border-b border-gray-200 cursor-pointer dark:bg-gray-800 dark:border-gray-600'
      );
      return;
    }

    itemElm.removeAttribute('aria-current');
    itemElm.setAttribute(
      'class',
      'flex items-center gap-2 w-full px-4 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-500 dark:focus:text-white'
    );
  });
}

export function scrollPlaylistToCurrentFocus(listElement: HTMLElement): void {
  const targetElm = listElement.querySelector('a[aria-current="true"]') as HTMLElement | null;
  if (!targetElm) {
    return;
  }

  const rect = targetElm.getBoundingClientRect();
  const move = targetElm.offsetTop > listElement.clientHeight
    ? Math.abs(listElement.clientHeight - targetElm.offsetTop) + rect.height
    : 0;

  listElement.scrollTo({ top: move, behavior: 'smooth' });
}

export function createPlaylistItemElement(options: PlaylistItemRenderOptions): HTMLAnchorElement {
  const itemElm = document.createElement('a');
  itemElm.href = '#';
  itemElm.draggable = false;
  if (options.isCurrent) {
    itemElm.setAttribute('aria-current', 'true');
    itemElm.setAttribute('class', 'flex items-center gap-2 w-full min-w-0 px-4 py-2 text-white bg-blue-500 border-b border-gray-200 cursor-pointer dark:bg-gray-800 dark:border-gray-600');
  } else {
    itemElm.setAttribute('class', 'flex items-center gap-2 w-full min-w-0 px-4 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-500 dark:focus:text-white');
  }
  if (options.mode === 'reorder') {
    itemElm.classList.remove('cursor-pointer');
    itemElm.classList.add('cursor-grab', 'active:cursor-grabbing', 'select-none');
  }
  itemElm.setAttribute('data-playlist-item', String(options.item.amId));
  itemElm.setAttribute('data-id', String(options.item.amId));

  let imageSrc = options.fallbackThumbPath;
  if ((options.item.image && options.item.image !== '') || (options.item.thumb && options.item.thumb !== '')) {
    if (options.imageDir) {
      imageSrc = options.imageDir + (options.item.thumb && options.item.thumb !== '' ? options.item.thumb : options.item.image);
    }
  } else if (options.item.videoid && options.item.videoid !== '') {
    imageSrc = options.resolveYoutubeThumbnailUrl(options.item.videoid);
  }

  const imgElm = document.createElement('img');
  imgElm.setAttribute('src', imageSrc);
  imgElm.draggable = false;
  imgElm.classList.add('block', 'h-8', 'w-8', 'rounded', 'object-cover');
  imgElm.setAttribute('alt', options.trimTitle(options.item.title));
  itemElm.appendChild(imgElm);

  if (options.mode === 'delete') {
    const chkElm = document.createElement('span');
    chkElm.setAttribute('data-delete-selector', '');
    chkElm.setAttribute('aria-hidden', 'true');
    chkElm.className = options.isDeleteSelected
      ? 'flex-shrink-0 order-first flex items-center justify-center w-5 h-5 rounded border-2 border-red-500 bg-red-500'
      : 'flex-shrink-0 order-first flex items-center justify-center w-5 h-5 rounded border-2 border-gray-400 dark:border-gray-500';
    if (options.isDeleteSelected) {
      chkElm.appendChild(createPlaylistMaskIcon('playlist-icon-mask--check'));
    }
    itemElm.prepend(chkElm);
  } else if (options.mode === 'reorder') {
    const handleElm = document.createElement('span');
    handleElm.setAttribute('aria-hidden', 'true');
    handleElm.className = 'playlist-reorder-handle flex-shrink-0 order-first inline-flex items-center justify-center w-5 h-5 text-gray-400 cursor-grab active:cursor-grabbing dark:text-gray-500';
    handleElm.appendChild(createPlaylistMaskIcon('playlist-icon-mask--reorder'));
    itemElm.prepend(handleElm);
  } else if (options.mode === 'edit') {
    const gutterElm = document.createElement('span');
    gutterElm.setAttribute('aria-hidden', 'true');
    gutterElm.className = options.isEditSelected
      ? 'playlist-edit-gutter is-selected order-first'
      : 'playlist-edit-gutter order-first';
    const iconElm = document.createElement('span');
    iconElm.className = options.isEditSelected
      ? 'ui-icon-mask ui-icon-mask--mode-edit-filled w-4 h-4'
      : 'ui-icon-mask ui-icon-mask--mode-edit w-4 h-4';
    iconElm.setAttribute('aria-hidden', 'true');
    gutterElm.appendChild(iconElm);
    itemElm.prepend(gutterElm);
  }

  if (options.format) {
    const labelText = options.formatLabel(options.format, options.item);
    const labelElm = document.createElement('span');
    labelElm.className = 'playlist-item-label flex-1';
    if (/<.*?[!^<].*?>/gi.test(labelText)) {
      labelElm.innerHTML = labelText;
    } else {
      labelElm.textContent = labelText;
    }
    itemElm.appendChild(labelElm);
  } else {
    itemElm.appendChild(buildDefaultPlaylistLabel(options.item));
  }

  return itemElm;
}

export function createPlaylistQuickAddElement(options: PlaylistQuickAddOptions): HTMLAnchorElement {
  const addItemElm = document.createElement('a');
  addItemElm.href = '#';
  addItemElm.setAttribute('id', 'btn-add-media-from-playlist');
  addItemElm.setAttribute('class', 'flex items-center gap-2 w-full min-w-0 px-4 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-500 dark:focus:text-white text-blue-600 dark:text-blue-400');
  const addIconElm = document.createElement('span');
  addIconElm.setAttribute('class', 'flex items-center justify-center h-8 w-8 rounded bg-gray-100 dark:bg-gray-600 text-blue-600 dark:text-blue-400 flex-shrink-0');
  addIconElm.setAttribute('aria-hidden', 'true');
  addIconElm.appendChild(createPlaylistMaskIcon('playlist-icon-mask--add'));
  addItemElm.appendChild(addIconElm);
  const addLabelElm = document.createElement('span');
  addLabelElm.className = 'playlist-item-label flex-1';
  addLabelElm.textContent = options.registerText;
  addItemElm.appendChild(addLabelElm);
  addItemElm.addEventListener('click', options.onClick);
  return addItemElm;
}

export function filterPlaylistItemsByCategory(
  mediaItems: MediaItem[],
  categoryId: number | null | undefined
): MediaItem[] {
  if (categoryId === null || categoryId === undefined || Number(categoryId) === -1) {
    return mediaItems;
  }

  return mediaItems.filter((item) => item.catId === Number(categoryId));
}

export function createShuffledPlaylist(items: MediaItem[]): MediaItem[] {
  return items
    .map((value: MediaItem) => ({ value, random: Math.random() }))
    .sort((a, b) => a.random - b.random)
    .map(({ value }) => value);
}

export function renderPlaylistItems(options: PlaylistItemsRenderOptions): void {
  options.items.forEach((item: MediaItem) => {
    const itemElement = createPlaylistItemElement({
      item,
      isCurrent: options.currentId !== null && options.currentId === item.amId,
      mode: options.mode,
      isDeleteSelected: options.deleteSelectedIds.has(item.amId),
      isEditSelected: options.editSelectedId === item.amId,
      format: options.format,
      imageDir: options.imageDir || null,
      fallbackThumbPath: options.fallbackThumbPath,
      resolveYoutubeThumbnailUrl: options.resolveYoutubeThumbnailUrl,
      trimTitle: options.trimTitle,
      formatLabel: options.formatLabel,
    });
    options.listElement.appendChild(itemElement);
  });
}

export function resolvePlaylistModeForRendering(options: {
  mode: PlaylistMode;
  canUseReorderMode: boolean;
}): PlaylistModeAdjustmentResult {
  if (options.mode === 'reorder' && !options.canUseReorderMode) {
    return {
      nextMode: 'normal',
      changed: true,
    };
  }

  return {
    nextMode: options.mode,
    changed: false,
  };
}

export function appendPlaylistQuickAddItem(options: {
  listElement: HTMLElement;
  canMutatePlaylist: boolean;
  playlistMode: PlaylistMode;
  registerText: string;
  onClick: (event: Event) => void;
}): void {
  if (!options.canMutatePlaylist || options.playlistMode !== 'normal') {
    return;
  }

  const addItemElement = createPlaylistQuickAddElement({
    registerText: options.registerText,
    onClick: options.onClick,
  });
  options.listElement.appendChild(addItemElement);
}
