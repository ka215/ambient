import type { MediaItem } from '../types/ambient';

export function createPlaylistMaskIcon(...classNames: string[]): HTMLSpanElement {
  const iconElm = document.createElement('span');
  iconElm.setAttribute('aria-hidden', 'true');
  iconElm.className = ['playlist-icon-mask', ...classNames].join(' ');
  return iconElm;
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
