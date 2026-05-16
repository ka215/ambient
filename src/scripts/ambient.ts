/**
/**
 * Ambient Media Player v2 - TypeScript Frontend Application
 * Ported from ambient.js with full type safety
 */
/// <reference path="./types/index.ts" />
import 'flowbite';
import Sortable from 'sortablejs';
import '../styles/app.css';

// ============================================================================
// INITIALIZATION
// ============================================================================

const init = function (): void {
  const selfURL = new URL(window.location.href);
  const BASE_URL = selfURL.origin + selfURL.pathname;

  if (!window.hasOwnProperty('APP_KEY')) {
    (window as any).APP_KEY = 'AmbientUserData';
  }

  useStge();
  const AMP_STATUS = initStatus();

  /**
   * Initialize AMP_STATUS object.
   */
  function initStatus(): AMP_STATUS {
    const baseObj = (window as any).$ambient || {};
    return Object.assign(baseObj, {
      prev: null,
      current: null,
      next: null,
      ctg: -1,
      category: null,
      playlist: null,
      media: null,
      order: 'normal' as const,
      playertype: null,
      volume: null,
      options: null,
      addtype: null,
      notice: null,
      loop: null,
      yt_phase: 'idle',
      yt_seq: 0,
      yt_error: '',
    } as AMP_STATUS);
  }

  // Window sizes container
  const currentWindowSize: WindowSize = {
    width: window.innerWidth,
    height: window.innerHeight,
    minFullUIWidth: 1282, // = 320 + 1 + 640 + 1 + 320
  };
  let viewportMetricsTimer: number | null = null;

  // Advance preparation for using YouTube players.
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/player_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];

  let player: YTPlayer | undefined;

  /**
   * Reflect YouTube signal states to body data attributes for DOM-driven waits.
   */
  function syncYouTubeSignalAttrs(): void {
    const body = document.body;
    if (!body) {
      return;
    }
    body.setAttribute('data-yt-phase', String(AMP_STATUS.yt_phase || 'idle'));
    body.setAttribute('data-yt-seq', String(AMP_STATUS.yt_seq || 0));
    body.setAttribute('data-yt-error', String(AMP_STATUS.yt_error || ''));
  }

  /**
   * Update YouTube signal states and emit attribute updates.
   */
  function emitYouTubeSignal(phase: string, error = ''): void {
    AMP_STATUS.yt_phase = phase;
    AMP_STATUS.yt_error = error;
    AMP_STATUS.yt_seq = Number(AMP_STATUS.yt_seq || 0) + 1;
    syncYouTubeSignalAttrs();
  }

  emitYouTubeSignal('api_loading');
  tag.addEventListener('load', () => {
    emitYouTubeSignal('api_loaded');
  });
  tag.addEventListener('error', () => {
    emitYouTubeSignal('api_error', 'player_api_load_failed');
  });
  if (firstScriptTag?.parentNode) {
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }

  // seek container
  let seekId: ReturnType<typeof setInterval> | null = null;

  /**
   * Abort seek for playback media.
   */
  function abortSeeking(): void {
    if (seekId) {
      clearInterval(seekId);
      seekId = null;
    }
  }

  // fader container
  let fadeinId: ReturnType<typeof setInterval> | null = null;
  let fadeoutId: ReturnType<typeof setInterval> | null = null;

  /**
   * Abort fader for playback media.
   * @param type Either `fadein` or `fadeout`
   */
  function abortFader(type: 'fadein' | 'fadeout'): void {
    if (type === 'fadein') {
      if (fadeinId) {
        clearInterval(fadeinId);
        fadeinId = null;
      }
    } else {
      if (fadeoutId) {
        clearInterval(fadeoutId);
        fadeoutId = null;
      }
    }
  }

  /**
   * Watcher for AMP_STATUS object.
   */
  function watchState(): void {
    const callback = function (
      prop: string,
      _oldValue: any,
      newValue: any
    ): void {
      switch (true) {
        case /^(prev|current|next|ctg|order|loop)$/i.test(prop):
          // Synchronize to the saved data of web storage when specific properties of AMP_STATUS object are changed.
          saveStge(prop, newValue);
          if (/^ctg$/i.test(prop)) {
            savePlaylistContext();
          }
          if ('current' === prop) {
            changePlaylistFocus();
          }
          if ('order' === prop) {
            changeToggleRandomly();
          }
          break;
        case /^playlist$/i.test(prop):
          savePlaylistContext();
          break;
        case /^media$/i.test(prop):
          togglePlayerControllButtons();
          break;
        case /^category$/i.test(prop):
          updateCategory();
          break;
        case /^shuffle$/i.test(prop):
          changeToggleShuffle();
          break;
        case /^volume$/i.test(prop):
          changeRangeVolume();
          break;
        case /^notice$/i.test(prop):
          if (newValue) {
            updateNotice(newValue);
          }
          break;
        case /^options$/i.test(prop):
          applyOptions();
          break;
        case /^yt_(phase|seq|error)$/i.test(prop):
          syncYouTubeSignalAttrs();
          break;
      }
    };

    Object.keys(AMP_STATUS).forEach((propName: string) => {
      let value: any = (AMP_STATUS as any)[propName];
      Object.defineProperty(AMP_STATUS, propName, {
        get: () => value,
        set: (newValue: any) => {
          const oldValue = value;
          value = newValue;
          if (oldValue !== newValue) {
            callback(propName, oldValue, value);
          }
        },
        enumerable: true,
        configurable: true,
      });
    });
  }

  watchState();

  // ============================================================================
  // CLOUD: MyPlaylist – localStorage persistence
  // ============================================================================
  const MYPLAYLIST_KEY = 'AmbientMyPlaylist';
  const MYPLAYLIST_NAME = 'MyPlaylist.json';
  const PLAYLIST_CONTEXT_KEY = 'playlistContext';
  const MEDIA_TITLE_MAX_LENGTH = 100;
  const MEDIA_ARTIST_MAX_LENGTH = 100;
  const MEDIA_DESC_MAX_LENGTH = 500;
  const DISALLOWED_CONTROL_CHARS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
  const DEFAULT_VOLUME = 50;
  let playlistLoadSeq = 0;
  let activePlaylistLoadSeq = 0;
  let pendingResumeCategoryName: string | null = null;

  function isPlaylistLoadActive(seq: number): boolean {
    return activePlaylistLoadSeq === seq;
  }

  function beginPlaylistLoad(playlist: string): number {
    const nextSeq = ++playlistLoadSeq;
    activePlaylistLoadSeq = nextSeq;
    AMP_STATUS.playlist = playlist;
    applyCloudEditRestrictions();
    return nextSeq;
  }

  function finishPlaylistLoad(seq: number): void {
    if (isPlaylistLoadActive(seq)) {
      activePlaylistLoadSeq = 0;
    }
  }

  function resetPlaylistRuntimeState(): void {
    AMP_STATUS.prev = null;
    AMP_STATUS.current = null;
    AMP_STATUS.next = null;
    AMP_STATUS.ctg = -1;
    AMP_STATUS.category = null;
    AMP_STATUS.media = [];
    AMP_STATUS.options = null;
    clearCategory();
    updatePlaylist();
  }

  /**
   * Save the current in-memory state of MyPlaylist to localStorage.
   * Only called in cloud mode when the active playlist is MyPlaylist.
   */
  function saveMyPlaylistToStorage(): boolean {
    try {
      const jsonStr = generatePlaylistJson(false);
      localStorage.setItem(MYPLAYLIST_KEY, jsonStr);
      logger('saveMyPlaylistToStorage: saved', jsonStr.length, 'bytes');
      return true;
    } catch (e) {
      logger('saveMyPlaylistToStorage: error', e);
      return false;
    }
  }

  function abortPlaybackTimers(): void {
    abortSeeking();
    abortFader('fadein');
    abortFader('fadeout');
  }

  /**
   * Persist MyPlaylist only when cloud mode + MyPlaylist is currently active.
   */
  function persistMyPlaylistIfNeeded(): boolean {
    const ambientData = (window as any).AmbientData as AmbientData | undefined;
    if (activePlaylistLoadSeq !== 0) {
      logger('persistMyPlaylistIfNeeded: skipped while playlist load is active');
      return false;
    }
    if (ambientData?.isCloud && AMP_STATUS.playlist === MYPLAYLIST_NAME) {
      return saveMyPlaylistToStorage();
    }
    return true;
  }

  function getAmbientData(): AmbientData | undefined {
    return (window as any).AmbientData as AmbientData | undefined;
  }

  function sanitizeMyPlaylistOptions(
    options: PlaylistOptions | null | undefined
  ): PlaylistOptions | null {
    if (!isObject(options)) {
      return null;
    }
    const nextOptions = { ...options } as PlaylistOptions;
    if (Object.prototype.hasOwnProperty.call(nextOptions, 'playlist')) {
      delete nextOptions.playlist;
    }
    return nextOptions;
  }

  function getCurrentCategoryName(): string {
    const catId = Number(AMP_STATUS.ctg);
    if (Number.isInteger(catId) && catId >= 0 && Array.isArray(AMP_STATUS.category)) {
      return AMP_STATUS.category[catId] || '';
    }
    return '';
  }

  function savePlaylistContext(): void {
    if (!AMP_STATUS.playlist) {
      return;
    }
    saveStge(PLAYLIST_CONTEXT_KEY, {
      playlist: AMP_STATUS.playlist,
      category: getCurrentCategoryName(),
    });
  }

  function getSavedPlaylistContext(): { playlist: string; category: string } | null {
    const context = getStge(PLAYLIST_CONTEXT_KEY);
    if (!isObject(context)) {
      return null;
    }
    const playlist = typeof context['playlist'] === 'string' ? context['playlist'].trim() : '';
    const category = typeof context['category'] === 'string' ? context['category'].trim() : '';
    if (playlist === '') {
      return null;
    }
    return { playlist, category };
  }

  function isPlaylistAvailableForResume(playlist: string): boolean {
    const ambientData = getAmbientData();
    if (playlist === MYPLAYLIST_NAME) {
      return ambientData?.isCloud === true && localStorage.getItem(MYPLAYLIST_KEY) !== null;
    }
    return !!(ambientData?.playlists && Object.prototype.hasOwnProperty.call(ambientData.playlists, playlist));
  }

  function selectPlaylistOption(playlist: string): void {
    if (!isElement($SELECT_PLAYLIST)) {
      return;
    }
    const targetOption = Array.from($SELECT_PLAYLIST.options).find((opt) => opt.value === playlist);
    if (targetOption) {
      $SELECT_PLAYLIST.value = playlist;
    }
  }

  function requestCategoryResume(categoryName: string | null | undefined): void {
    pendingResumeCategoryName = categoryName && categoryName.trim() !== '' ? categoryName.trim() : null;
  }

  function applyPendingCategoryResume(): void {
    if (pendingResumeCategoryName === null) {
      AMP_STATUS.ctg = -1;
      syncTargetCategorySelection();
      return;
    }
    const nextCategoryId = Array.isArray(AMP_STATUS.category)
      ? AMP_STATUS.category.indexOf(pendingResumeCategoryName)
      : -1;
    AMP_STATUS.ctg = nextCategoryId >= 0 ? nextCategoryId : -1;
    pendingResumeCategoryName = null;
    syncTargetCategorySelection();
  }

  function stripHtmlTags(value: string): string {
    const parser = document.createElement('div');
    parser.innerHTML = value;
    return parser.textContent || parser.innerText || '';
  }

  function clampStringLength(value: string, maxLength: number): string {
    return value.length > maxLength ? value.slice(0, maxLength) : value;
  }

  function sanitizeMediaText(value: string, maxLength: number): string {
    const normalized = stripHtmlTags(String(value || ''))
      .replace(/\r\n?/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(DISALLOWED_CONTROL_CHARS_RE, '')
      .trim();
    return clampStringLength(normalized, maxLength);
  }

  function sanitizeMediaDescInput(value: string, maxLength: number = MEDIA_DESC_MAX_LENGTH): string {
    const normalized = stripHtmlTags(String(value || ''))
      .replace(/\r\n?/g, ' ')
      .replace(/\t/g, ' ')
      .replace(DISALLOWED_CONTROL_CHARS_RE, '')
      .replace(/ {2,}/g, ' ')
      .trim();
    return clampStringLength(normalized, maxLength);
  }

  function sanitizeMediaDesc(value: string, maxLength: number = MEDIA_DESC_MAX_LENGTH): string {
    const normalized = sanitizeMediaDescInput(value, maxLength)
      .replace(/\\n/g, '\n')
      .split('\n')
      .map((line) => line.replace(/[^\S\n]+/g, ' ').trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return clampStringLength(normalized, maxLength);
  }

  function sanitizeMediaItemTextFields<T extends Partial<MediaItem>>(item: T): T {
    return {
      ...item,
      title: sanitizeMediaText(String(item.title || ''), MEDIA_TITLE_MAX_LENGTH),
      artist: sanitizeMediaText(String(item.artist || ''), MEDIA_ARTIST_MAX_LENGTH),
      desc: sanitizeMediaDesc(String(item.desc || ''), MEDIA_DESC_MAX_LENGTH),
    };
  }

  function canMutateCurrentPlaylist(): boolean {
    const ambientData = getAmbientData();
    if (ambientData?.isCloud === true) {
      return AMP_STATUS.playlist === MYPLAYLIST_NAME || !AMP_STATUS.playlist;
    }
    // Local JSON playlist write-back is intentionally left for a later release.
    return false;
  }

  /**
   * Load MyPlaylist from localStorage and populate AMP_STATUS as if a
   * normal JSON playlist was loaded from the server.
   */
  function loadMyPlaylistFromStorage(): boolean {
    const raw = localStorage.getItem(MYPLAYLIST_KEY);
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        logger('loadMyPlaylistFromStorage: invalid schema', data);
        return false;
      }

      const nextOptions = Object.prototype.hasOwnProperty.call(data, 'options')
        ? sanitizeMyPlaylistOptions((data as PlaylistData).options || null)
        : null;
      let media: MediaItem[] = [];
      const categoryData = Object.fromEntries(
        Object.entries(data).filter(([k]) => k !== 'options')
      ) as Record<string, MediaItem[]>;
      const categories = Object.keys(categoryData);

      categories.forEach((category: string, cid: number) => {
        const items = categoryData[category];
        if (!Array.isArray(items) || items.length === 0) {
          return;
        }
        media = media.concat(
          items.map((item: MediaItem) => ({
            ...sanitizeMediaItemTextFields(item),
            catId: cid,
          }))
        );
      });

      if (media.length > 0) {
        let amid = 0;
        media = media
          .filter((item: MediaItem) => item.hasOwnProperty('title') && item.title !== '')
          .map((item: MediaItem) => ({
            ...item,
            amId: amid++,
          }));
      }

      AMP_STATUS.options = nextOptions;
      AMP_STATUS.category = categories;
      AMP_STATUS.media = media;
      AMP_STATUS.playlist = MYPLAYLIST_NAME;
      applyPendingCategoryResume();
      updatePlaylist();
      if (AMP_STATUS.current !== null) {
        updatePlayStatus(AMP_STATUS.current);
      } else if (media.length > 0) {
        updatePlayStatus(media[0]?.amId ?? 0);
      }
      logger('loadMyPlaylistFromStorage: loaded', media.length, 'items');
      return true;
    } catch (e) {
      logger('loadMyPlaylistFromStorage: parse error', e);
      return false;
    }
  }

  // In cloud mode: if MyPlaylist exists in localStorage, inject it into the
  // playlist dropdown and load it automatically.
  // NOTE: This block runs after DOM element constants are declared.
  function ensureMyPlaylistOptionFromStorage(): boolean {
    const ambientData = (window as any).AmbientData as AmbientData | undefined;
    if (!ambientData?.isCloud || localStorage.getItem(MYPLAYLIST_KEY) === null) return false;
    const $sel = document.getElementById('current-playlist') as HTMLSelectElement | null;
    if ($sel) {
      const alreadyExists = Array.from($sel.options).some(
        (opt) => opt.value === MYPLAYLIST_NAME
      );
      if (!alreadyExists) {
        const opt = document.createElement('option');
        opt.value = MYPLAYLIST_NAME;
        opt.textContent = MYPLAYLIST_NAME.replace('.json', '');
        $sel.appendChild(opt);
      }
    }
    return true;
  }

  function initMyPlaylistFromStorage(): void {
    if (!ensureMyPlaylistOptionFromStorage()) return;
    resetPlaylistRuntimeState();
    if (loadMyPlaylistFromStorage()) {
      selectPlaylistOption(MYPLAYLIST_NAME);
      applyCloudEditRestrictions();
      return;
    }
    const $sel = document.getElementById('current-playlist') as HTMLSelectElement | null;
    if ($sel) {
      Array.from($sel.options).find((opt) => opt.value === MYPLAYLIST_NAME)?.remove();
      if ($sel.value === MYPLAYLIST_NAME) {
        $sel.selectedIndex = 0;
      }
    }
    AMP_STATUS.playlist = null;
    applyCloudEditRestrictions();
  }

  // Process global data passed by the system.
  // NOTE: initMyPlaylistFromStorage() and AmbientData processing have been moved
  // to AFTER DOM element constants to avoid temporal dead zone issues.

  /**
   * Fetch data of specific playlist.
   */
  async function getPlaylistData(playlist: string): Promise<void> {
    const loadSeq = beginPlaylistLoad(playlist);
    resetPlaylistRuntimeState();
    try {
      if (playlist === MYPLAYLIST_NAME) {
        const loaded = loadMyPlaylistFromStorage();
        if (!isPlaylistLoadActive(loadSeq)) {
          return;
        }
        if (!loaded) {
          AMP_STATUS.playlist = null;
        }
        applyCloudEditRestrictions();
        return;
      }

      const endpointURL = `${BASE_URL}playlist/${playlist}`;
      const response = await fetchData(endpointURL);
      if (!isPlaylistLoadActive(loadSeq)) {
        return;
      }
      if (response && typeof response === 'object' && 'data' in response) {
        const data = (response as any).data as PlaylistData;
        if (data && data.hasOwnProperty('options')) {
          AMP_STATUS.options = data.options || null;
        }
        if (data && data.hasOwnProperty('media')) {
          let media: MediaItem[] = [];
          if (data.media && Object.keys(data.media).length > 0) {
            const categories = Object.keys(data.media);
            categories.forEach((category: string, cid: number) => {
              if (data.media && data.media[category] && data.media[category].length > 0) {
                media = media.concat(
                  data.media[category].map((item: MediaItem) => ({
                    ...item,
                    catId: cid,
                  }))
                );
              }
            });
            AMP_STATUS.category = categories;
          }
          applyPendingCategoryResume();
          if (media.length > 0) {
            let amid = 0;
            media = media
              .filter((item: MediaItem) => item.hasOwnProperty('title') && item.title !== '')
              .map((item: MediaItem) => ({
                ...item,
                amId: amid++,
              }));
          }
          AMP_STATUS.media = media;
          AMP_STATUS.playlist = playlist;
          updatePlaylist();
          if (AMP_STATUS.current !== null) {
            updatePlayStatus(AMP_STATUS.current);
          } else if (media.length > 0) {
            updatePlayStatus(media[0]?.amId ?? 0);
          }
        }
      }
      applyCloudEditRestrictions();
    } finally {
      finishPlaylistLoad(loadSeq);
    }
  }

  /**
   * In cloud mode, disable media-add and category-add controls when the
   * currently loaded playlist is an existing JSON file (not MyPlaylist).
   * MyPlaylist (localStorage-only virtual playlist) is always editable.
   */
  function applyCloudEditRestrictions(): void {
    const ambientData = getAmbientData();
    if (!ambientData?.isCloud) return;
    const canMutatePlaylist = canMutateCurrentPlaylist();
    const $BTN_ADD_MEDIA = document.getElementById('btn-add-media');
    const $BTN_CREATE_CATEGORY = document.getElementById('btn-create-category');
    const $MEDIA_MANAGE_FORM_EL = document.querySelector('form[name="mediaManagement"]') as HTMLFormElement | null;
    const $PLAYLIST_MANAGE_NOTICE = document.getElementById('cloud-readonly-notice');
    if (!canMutatePlaylist) {
      // Disable add-media button
      if ($BTN_ADD_MEDIA) {
        ($BTN_ADD_MEDIA as HTMLButtonElement).disabled = true;
        $BTN_ADD_MEDIA.setAttribute('title', 'Editing existing playlists is not available in cloud mode.');
      }
      // Disable category creation button
      if ($BTN_CREATE_CATEGORY) {
        ($BTN_CREATE_CATEGORY as HTMLButtonElement).disabled = true;
        $BTN_CREATE_CATEGORY.setAttribute('title', 'Editing existing playlists is not available in cloud mode.');
      }
      // Visual hint on the media management form
      if ($MEDIA_MANAGE_FORM_EL) {
        $MEDIA_MANAGE_FORM_EL.classList.add('opacity-50');
      }
    } else {
      if ($BTN_ADD_MEDIA) {
        ($BTN_ADD_MEDIA as HTMLButtonElement).disabled = false;
        $BTN_ADD_MEDIA.removeAttribute('title');
      }
      if ($BTN_CREATE_CATEGORY) {
        ($BTN_CREATE_CATEGORY as HTMLButtonElement).disabled = false;
        $BTN_CREATE_CATEGORY.removeAttribute('title');
      }
      if ($MEDIA_MANAGE_FORM_EL) {
        $MEDIA_MANAGE_FORM_EL.classList.remove('opacity-50');
      }
    }
    void $PLAYLIST_MANAGE_NOTICE;
  }

  // DOM Elements
  const $BODY = document.body;
  const $ALERT = document.getElementById('alert-notification') as HTMLElement;
  const $SELECT_PLAYLIST = document.getElementById('current-playlist') as HTMLSelectElement;
  const $SELECT_CATEGORY = document.getElementById('target-category') as HTMLSelectElement;
  const $TOGGLE_LOOP = document.getElementById('toggle-loop') as HTMLElement;
  const $TOGGLE_RANDOMLY = document.getElementById('toggle-randomly') as HTMLElement;
  const $TOGGLE_SHUFFLE = document.getElementById('toggle-shuffle') as HTMLElement;
  const $TOGGLE_SEEKPLAY = document.getElementById('toggle-seekplay') as HTMLElement;
  const $TOGGLE_WINDOW_FULL = document.getElementById('toggle-window-full') as HTMLElement;
  const $TOGGLE_FADER = document.getElementById('toggle-fader') as HTMLElement;
  const $RANGE_VOLUME = document.getElementById('default-volume') as HTMLInputElement;
  const $TOGGLE_DARKMODE = document.getElementById('toggle-darkmode') as HTMLElement;
  const $SELECT_LANGUAGE = document.getElementById('language') as HTMLSelectElement;
  const $DRAWER_PLAYLIST = document.getElementById('drawer-playlist') as HTMLElement;
  const $DRAWER_SETTINGS = document.getElementById('drawer-settings') as HTMLElement;
  const $LIST_PLAYLIST = document.getElementById('playlist-list-group') as HTMLElement;
  const $CAROUSEL_WRAPPER = document.getElementById('carousel-wrapper') as HTMLElement;
  const $CAROUSEL_PREV = document.getElementById('data-carousel-prev') as HTMLButtonElement;
  const $CAROUSEL_NEXT = document.getElementById('data-carousel-next') as HTMLButtonElement;
  const $MEDIA_CAPTION = document.getElementById('media-caption') as HTMLElement;
  const $EMBED_WRAPPER = document.getElementById('embed-wrapper') as HTMLElement;
  const $OPTIONAL_CONTAINER = document.getElementById('optional-container') as HTMLElement;
  const $BUTTON_WATCH_TY = document.getElementById('btn-watch-origin') as HTMLAnchorElement;
  const $MENU = document.getElementById('menu-container') as HTMLElement;
  const $BUTTON_PLAYLIST = document.getElementById('btn-playlist') as HTMLButtonElement;
  const $BUTTON_REFRESH = document.getElementById('btn-refresh') as HTMLButtonElement;
  const $BUTTON_WINDOW_FULL = document.getElementById('btn-window-full') as HTMLButtonElement;
  const $BUTTON_PLAY = document.getElementById('btn-play') as HTMLButtonElement;
  const $BUTTON_PAUSE = document.getElementById('btn-pause') as HTMLButtonElement;
  const $BUTTON_MENU_COLLAPSE = document.getElementById('btn-menu-collapse') as HTMLButtonElement;
  const $BUTTON_SETTINGS = document.getElementById('btn-settings') as HTMLButtonElement;
  const $BUTTON_OPTIONS = document.getElementById('btn-options') as HTMLButtonElement;
  const $BUTTON_CLOSE_OPTIONS = document.getElementById('btn-close-options') as HTMLButtonElement;
  const $MODAL_OPTIONS = document.getElementById('modal-options') as HTMLElement;
  const $MODAL_OPTIONS_PANEL = $MODAL_OPTIONS?.querySelector('.modal-dialog-shell') as HTMLElement | null;
  const $MODAL_PLAYLIST_DESC = document.getElementById('modal-playlist-desc') as HTMLElement | null;
  const $MODAL_PLAYLIST_DESC_BACKDROP = document.getElementById('modal-playlist-desc-backdrop') as HTMLElement | null;
  const $MODAL_PLAYLIST_DESC_TITLE = document.getElementById('modal-playlist-desc-title') as HTMLElement | null;
  const $MODAL_PLAYLIST_DESC_ARTIST = document.getElementById('modal-playlist-desc-artist') as HTMLElement | null;
  const $MODAL_PLAYLIST_DESC_CONTENT = document.getElementById('modal-playlist-desc-content') as HTMLElement | null;
  const $BUTTON_CLOSE_PLAYLIST_DESC = document.getElementById('btn-close-playlist-desc') as HTMLButtonElement | null;
  const $COLLAPSE_MENU = document.getElementById('collapse-menu') as HTMLElement;

  // Add elements since v1.1.0
  const $MEDIA_CATEGORY_SELECT = document.getElementById('media-category') as HTMLSelectElement;
  const $MEDIA_VOLUME = document.getElementById('media-volume') as HTMLInputElement | null;
  let optionsModalHideTimer: number | null = null;
  let optionsBackdropPointerStarted = false;
  let activePlaylistDescButton: HTMLElement | null = null;
  if (isElement($MODAL_OPTIONS) && $MODAL_OPTIONS.parentElement !== document.body) {
    document.body.appendChild($MODAL_OPTIONS);
  }
  if (isElement($MODAL_PLAYLIST_DESC) && $MODAL_PLAYLIST_DESC.parentElement !== document.body) {
    document.body.appendChild($MODAL_PLAYLIST_DESC);
  }

  function closePlaylistDescModal(restoreFocus = false): void {
    if (!isElement($MODAL_PLAYLIST_DESC) || !isElement($MODAL_PLAYLIST_DESC_CONTENT)) {
      return;
    }
    $MODAL_PLAYLIST_DESC.classList.add('hidden');
    if (isElement($MODAL_PLAYLIST_DESC_TITLE)) {
      $MODAL_PLAYLIST_DESC_TITLE.textContent = '';
    }
    if (isElement($MODAL_PLAYLIST_DESC_ARTIST)) {
      $MODAL_PLAYLIST_DESC_ARTIST.textContent = '';
      $MODAL_PLAYLIST_DESC_ARTIST.classList.add('hidden');
    }
    $MODAL_PLAYLIST_DESC_CONTENT.textContent = '';
    if (isElement(activePlaylistDescButton)) {
      activePlaylistDescButton.classList.remove('is-active');
      if (restoreFocus) {
        activePlaylistDescButton.focus();
      }
    }
    activePlaylistDescButton = null;
  }

  function openPlaylistDescModal(titleText: string, artistText: string, descText: string, button: HTMLElement): void {
    if (!isElement($MODAL_PLAYLIST_DESC) || !isElement($MODAL_PLAYLIST_DESC_CONTENT)) {
      return;
    }
    if (activePlaylistDescButton === button && !$MODAL_PLAYLIST_DESC.classList.contains('hidden')) {
      closePlaylistDescModal(true);
      return;
    }
    if (isElement(activePlaylistDescButton)) {
      activePlaylistDescButton.classList.remove('is-active');
    }
    activePlaylistDescButton = button;
    activePlaylistDescButton.classList.add('is-active');
    if (isElement($MODAL_PLAYLIST_DESC_TITLE)) {
      $MODAL_PLAYLIST_DESC_TITLE.textContent = sanitizeMediaText(titleText, MEDIA_TITLE_MAX_LENGTH);
    }
    if (isElement($MODAL_PLAYLIST_DESC_ARTIST)) {
      const normalizedArtistText = sanitizeMediaText(artistText, MEDIA_ARTIST_MAX_LENGTH);
      if (normalizedArtistText.trim() !== '') {
        $MODAL_PLAYLIST_DESC_ARTIST.textContent = normalizedArtistText;
        $MODAL_PLAYLIST_DESC_ARTIST.classList.remove('hidden');
      } else {
        $MODAL_PLAYLIST_DESC_ARTIST.textContent = '';
        $MODAL_PLAYLIST_DESC_ARTIST.classList.add('hidden');
      }
    }
    $MODAL_PLAYLIST_DESC_CONTENT.textContent = sanitizeMediaDesc(descText, MEDIA_DESC_MAX_LENGTH);
    $MODAL_PLAYLIST_DESC.classList.remove('hidden');
  }

  function getViewportWidth(): number {
    return Math.round(window.visualViewport?.width || window.innerWidth);
  }

  function getViewportHeight(): number {
    return Math.round(window.visualViewport?.height || window.innerHeight);
  }

  function getBottomMenuHeight(): number {
    if (!isElement($MENU)) {
      return 0;
    }
    const rect = $MENU.getBoundingClientRect();
    return Math.max(0, Math.ceil(getViewportHeight() - rect.top));
  }

  function getFullWindowPlayerSize(): { width: number; height: number } {
    const aspectRatio = 16 / 9;
    const width = Math.max(1, currentWindowSize.width);
    const bottomReserve = getBottomMenuHeight();
    const height = Math.max(1, currentWindowSize.height - bottomReserve);
    const availableRatio = width / height;

    if (availableRatio > aspectRatio) {
      return {
        width: Math.floor(height * aspectRatio),
        height,
      };
    }

    return {
      width,
      height: Math.floor(width / aspectRatio),
    };
  }

  function getStandardPlayerSize(): { width: number; height: number } {
    const width = currentWindowSize.width >= 640 ? 640 : currentWindowSize.width - 2;
    return {
      width,
      height: Math.floor((9 * width) / 16),
    };
  }

  function getPlayerSizeForCurrentMode(): { width: number; height: number } {
    return isFullWindowMode() ? getFullWindowPlayerSize() : getStandardPlayerSize();
  }

  function applyHtmlPlayerSize(
    playerElement: HTMLVideoElement,
    size: { width: number; height: number }
  ): void {
    playerElement.width = size.width;
    playerElement.height = size.height;
    playerElement.style.width = `${size.width}px`;
    playerElement.style.height = `${size.height}px`;
    playerElement.style.maxWidth = '100%';
    playerElement.style.maxHeight = isFullWindowMode()
      ? 'calc(100vh - var(--amp-bottom-menu-height, 0px))'
      : '100%';
    playerElement.style.objectFit = 'contain';
    playerElement.style.display = 'block';
  }

  function syncViewportMetrics(): void {
    const visualViewport = window.visualViewport;
    const width = getViewportWidth();
    const height = getViewportHeight();
    const offsetTop = Math.max(0, Math.round(visualViewport?.offsetTop || 0));
    const visualBottomInset = Math.max(0, Math.round(window.innerHeight - height - offsetTop));
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--amp-viewport-width', `${width}px`);
    rootStyle.setProperty('--amp-viewport-height', `${height}px`);
    rootStyle.setProperty('--amp-visual-offset-top', `${offsetTop}px`);
    rootStyle.setProperty('--amp-visual-bottom-inset', `${visualBottomInset}px`);
    rootStyle.setProperty('--amp-bottom-menu-height', `${getBottomMenuHeight()}px`);
    document.body.style.minHeight = `${height}px`;
    document.body.style.height = `${height}px`;
    currentWindowSize.width = width;
    currentWindowSize.height = height;
  }

  function scheduleViewportMetricsSync(delay = 0): void {
    if (viewportMetricsTimer !== null) {
      window.clearTimeout(viewportMetricsTimer);
    }
    viewportMetricsTimer = window.setTimeout(() => {
      viewportMetricsTimer = null;
      syncViewportMetrics();
      updateWindowSize();
    }, delay);
  }

  function refreshViewportMetricsAfter(delay: number): void {
    window.setTimeout(() => {
      syncViewportMetrics();
      updateWindowSize();
    }, delay);
  }

  // Playlist operation mode UI (v2.2.0 Slice A)
  const $BUTTON_PLAYLIST_MODE = document.getElementById('btn-playlist-mode') as HTMLButtonElement | null;
  const $PLAYLIST_MODE_MENU = document.getElementById('playlist-mode-menu') as HTMLElement | null;
  const $PLAYLIST_MODE_BUTTON_ICON = document.getElementById('playlist-mode-button-icon') as HTMLElement | null;
  const $PLAYLIST_MODE_BUTTON_LABEL = document.getElementById('playlist-mode-button-label') as HTMLElement | null;
  type PlaylistMode = 'normal' | 'reorder' | 'delete';
  let playlistMode: PlaylistMode = 'normal';
  const defaultPlaylistModeButtonIcon = $PLAYLIST_MODE_BUTTON_ICON ? $PLAYLIST_MODE_BUTTON_ICON.innerHTML : '';
  const defaultPlaylistModeButtonLabel =
    $PLAYLIST_MODE_BUTTON_LABEL?.textContent || $BUTTON_PLAYLIST_MODE?.dataset['labelModeChange'] || 'Mode Change';

  function syncPlaylistModeButton(mode: PlaylistMode): void {
    if (!$BUTTON_PLAYLIST_MODE || !$PLAYLIST_MODE_BUTTON_ICON || !$PLAYLIST_MODE_BUTTON_LABEL) return;

    if (mode === 'normal') {
      $PLAYLIST_MODE_BUTTON_ICON.innerHTML = defaultPlaylistModeButtonIcon;
      $PLAYLIST_MODE_BUTTON_LABEL.textContent = defaultPlaylistModeButtonLabel;
      return;
    }

    const option = $PLAYLIST_MODE_MENU?.querySelector(
      `.playlist-mode-option[data-mode="${mode}"]`
    ) as HTMLButtonElement | null;
    const optionIcon = option?.querySelector('.playlist-mode-option-icon') as HTMLElement | null;
    const optionLabel = option?.querySelector('.playlist-mode-option-label') as HTMLElement | null;
    if (optionIcon && optionLabel) {
      $PLAYLIST_MODE_BUTTON_ICON.innerHTML = optionIcon.outerHTML;
      $PLAYLIST_MODE_BUTTON_LABEL.textContent = optionLabel.textContent || getPlaylistModeLabel(mode);
    }
  }

  function getPlaylistModeLabel(mode: PlaylistMode): string {
    if (!$BUTTON_PLAYLIST_MODE) return mode;
    switch (mode) {
      case 'reorder':
        return $BUTTON_PLAYLIST_MODE.dataset['labelReorder'] || 'Reorder';
      case 'delete':
        return $BUTTON_PLAYLIST_MODE.dataset['labelDelete'] || 'Delete';
      default:
        return $BUTTON_PLAYLIST_MODE.dataset['labelNormal'] || 'Normal';
    }
  }

  function isPlaylistInteractionLocked(): boolean {
    return playlistMode !== 'normal';
  }

  function getPlaylistItemsForCurrentView(): MediaItem[] {
    if (!AMP_STATUS.media) return [];
    if (!AMP_STATUS.hasOwnProperty('ctg') || AMP_STATUS.ctg === null || Number(AMP_STATUS.ctg) === -1) {
      return AMP_STATUS.media || [];
    }
    return (AMP_STATUS.media || []).filter((item: MediaItem) => item.catId === AMP_STATUS.ctg);
  }

  function isSortableAvailable(): boolean {
    return typeof Sortable !== 'undefined' && typeof Sortable.create === 'function';
  }

  function canUseReorderMode(): boolean {
    if (!canMutateCurrentPlaylist()) {
      return false;
    }
    if (!isSortableAvailable()) {
      return false;
    }
    if (Number(AMP_STATUS.ctg) === -1) {
      return false;
    }
    return getPlaylistItemsForCurrentView().length > 1;
  }

  function closePlaylistModeMenu(): void {
    if (!$PLAYLIST_MODE_MENU || !$BUTTON_PLAYLIST_MODE) return;
    $PLAYLIST_MODE_MENU.classList.add('hidden');
    $BUTTON_PLAYLIST_MODE.setAttribute('aria-expanded', 'false');
  }

  function togglePlaylistModeMenu(forceOpen = false): void {
    if (!$PLAYLIST_MODE_MENU || !$BUTTON_PLAYLIST_MODE) return;
    const shouldOpen = forceOpen || $PLAYLIST_MODE_MENU.classList.contains('hidden');
    if (shouldOpen) {
      $PLAYLIST_MODE_MENU.classList.remove('hidden');
      $BUTTON_PLAYLIST_MODE.setAttribute('aria-expanded', 'true');
    } else {
      closePlaylistModeMenu();
    }
  }

  function updatePlaylistModeUI(): void {
    syncPlaylistModeButton(playlistMode);

    if ($PLAYLIST_MODE_MENU) {
      Array.from($PLAYLIST_MODE_MENU.querySelectorAll('.playlist-mode-option')).forEach((elm) => {
        const optElm = elm as HTMLButtonElement;
        const mode = (optElm.dataset['mode'] || '') as PlaylistMode | 'edit';
        if (mode === 'reorder') {
          const canReorder = canUseReorderMode();
          optElm.disabled = !canReorder;
          optElm.setAttribute('aria-disabled', String(!canReorder));
          optElm.classList.toggle('text-gray-400', !canReorder);
          optElm.classList.toggle('dark:text-gray-500', !canReorder);
          optElm.classList.toggle('cursor-not-allowed', !canReorder);
          optElm.classList.toggle('hover:bg-gray-100', canReorder);
          optElm.classList.toggle('dark:hover:bg-gray-600', canReorder);
        }
        if (mode === playlistMode) {
          optElm.classList.add('text-blue-700', 'dark:text-blue-300');
          optElm.setAttribute('aria-current', 'true');
        } else {
          optElm.classList.remove('text-blue-700', 'dark:text-blue-300');
          optElm.removeAttribute('aria-current');
        }
      });
    }
  }

  function resetPlaylistOperationMode(): void {
    deleteSelectedIds.clear();
    resetReorderState();
    playlistMode = 'normal';
    updatePlaylistModeUI();
  }

  function syncPlaylistModeAvailability(visibleItemCount: number): void {
    if (!$BUTTON_PLAYLIST_MODE) return;
    const canUsePlaylistModes = canMutateCurrentPlaylist() && visibleItemCount > 0;
    if (!canUsePlaylistModes) {
      closePlaylistModeMenu();
      if (playlistMode !== 'normal') {
        resetPlaylistOperationMode();
      }
    }
    $BUTTON_PLAYLIST_MODE.disabled = !canUsePlaylistModes;
    $BUTTON_PLAYLIST_MODE.classList.toggle('opacity-50', !canUsePlaylistModes);
    $BUTTON_PLAYLIST_MODE.classList.toggle('cursor-not-allowed', !canUsePlaylistModes);
    $BUTTON_PLAYLIST_MODE.setAttribute('aria-disabled', String(!canUsePlaylistModes));
    updatePlaylistModeUI();
  }

  function setPlaylistMode(nextMode: PlaylistMode): void {
    if (nextMode !== 'normal' && !canMutateCurrentPlaylist()) {
      closePlaylistModeMenu();
      syncPlaylistModeAvailability(getPlaylistItemsForCurrentView().length);
      return;
    }
    if (playlistMode === nextMode) {
      closePlaylistModeMenu();
      return;
    }
    if (nextMode === 'reorder' && !canUseReorderMode()) {
      closePlaylistModeMenu();
      updatePlaylistModeUI();
      return;
    }
    // If leaving delete mode without selections, clear just in case
    if (playlistMode === 'delete') {
      deleteSelectedIds.clear();
    }
    if (playlistMode === 'reorder' && nextMode !== 'reorder') {
      resetReorderState();
    }
    if (nextMode === 'reorder') {
      captureReorderSnapshot();
    }
    playlistMode = nextMode;
    closePlaylistModeMenu();
    updatePlaylistModeUI();
    updatePlaylist();
  }

  if ($BUTTON_PLAYLIST_MODE && $PLAYLIST_MODE_MENU) {
    $BUTTON_PLAYLIST_MODE.addEventListener('click', (evt: Event) => {
      evt.preventDefault();
      evt.stopPropagation();

      // In delete mode, pressing the mode button should trigger commit flow first.
      if (playlistMode === 'delete') {
        closePlaylistModeMenu();
        if (deleteSelectedIds.size > 0) {
          const title = $BUTTON_PLAYLIST_MODE.dataset['confirmDeleteTitle'] || 'Delete selected items?';
          const body = $BUTTON_PLAYLIST_MODE.dataset['confirmDeleteBody'] || 'Selected items will be removed from your playlist.';
          openPlaylistConfirmModal(title, body, () => {
            applyDeleteSelections();
            playlistMode = 'normal';
            updatePlaylistModeUI();
            updatePlaylist();
          });
          return;
        }

        // Nothing selected: just exit delete mode and return to normal.
        deleteSelectedIds.clear();
        playlistMode = 'normal';
        updatePlaylistModeUI();
        updatePlaylist();
        return;
      }

      if (playlistMode === 'reorder') {
        closePlaylistModeMenu();
        syncReorderWorkingIdsFromDom();
        if (isReorderDirty()) {
          const title = $BUTTON_PLAYLIST_MODE.dataset['confirmReorderTitle'] || 'Apply reordered sequence?';
          const body = $BUTTON_PLAYLIST_MODE.dataset['confirmReorderBody'] || 'Apply the current item order to your playlist.';
          openPlaylistConfirmModal(title, body, () => {
            applyReorderChanges();
            playlistMode = 'normal';
            updatePlaylistModeUI();
            updatePlaylist();
          });
          return;
        }
        resetReorderState();
        playlistMode = 'normal';
        updatePlaylistModeUI();
        updatePlaylist();
        return;
      }

      togglePlaylistModeMenu();
    });

    Array.from($PLAYLIST_MODE_MENU.querySelectorAll('.playlist-mode-option')).forEach((elm) => {
      elm.addEventListener('click', (evt: Event) => {
        evt.preventDefault();
        evt.stopPropagation();
        const optionElm = evt.currentTarget as HTMLButtonElement;
        if (optionElm.disabled || optionElm.getAttribute('aria-disabled') === 'true') {
          return;
        }
        const nextMode = optionElm.dataset['mode'];
        if (nextMode === 'normal' || nextMode === 'reorder' || nextMode === 'delete') {
          setPlaylistMode(nextMode);
        }
      });
    });

    document.addEventListener('click', (evt: MouseEvent) => {
      const target = evt.target as Node;
      if (!$PLAYLIST_MODE_MENU.contains(target) && !$BUTTON_PLAYLIST_MODE.contains(target)) {
        closePlaylistModeMenu();
      }
    });

    document.addEventListener('keydown', (evt: KeyboardEvent) => {
      if (evt.key === 'Escape') {
        closePlaylistModeMenu();
      }
    });

    updatePlaylistModeUI();
  }

  // Playlist delete mode state (v2.2.0 Slice B)
  const $MODAL_PLAYLIST_CONFIRM = document.getElementById('modal-playlist-confirm') as HTMLElement | null;
  const $MODAL_PLAYLIST_CONFIRM_TITLE = document.getElementById('modal-playlist-confirm-title') as HTMLElement | null;
  const $MODAL_PLAYLIST_CONFIRM_BODY = document.getElementById('modal-playlist-confirm-body') as HTMLElement | null;
  const $BTN_PLAYLIST_CONFIRM_APPLY = document.getElementById('btn-playlist-confirm-apply') as HTMLButtonElement | null;
  const $BTN_PLAYLIST_CONFIRM_CANCEL = document.getElementById('btn-playlist-confirm-cancel') as HTMLButtonElement | null;

  let deleteSelectedIds = new Set<number>();
  let reorderInitialIds: number[] = [];
  let reorderWorkingIds: number[] = [];
  let reorderCategoryId: number | null = null;
  let playlistSortable: { destroy(): void } | null = null;
  let _playlistConfirmApplyCallback: (() => void) | null = null;

  function openPlaylistConfirmModal(title: string, body: string, onApply: () => void): void {
    if (!$MODAL_PLAYLIST_CONFIRM) return;
    if ($MODAL_PLAYLIST_CONFIRM_TITLE) $MODAL_PLAYLIST_CONFIRM_TITLE.textContent = title;
    if ($MODAL_PLAYLIST_CONFIRM_BODY) $MODAL_PLAYLIST_CONFIRM_BODY.textContent = body;
    _playlistConfirmApplyCallback = onApply;
    $MODAL_PLAYLIST_CONFIRM.classList.remove('hidden');
  }

  function closePlaylistConfirmModal(): void {
    if (!$MODAL_PLAYLIST_CONFIRM) return;
    $MODAL_PLAYLIST_CONFIRM.classList.add('hidden');
    _playlistConfirmApplyCallback = null;
  }

  function cancelPlaylistConfirmModal(): void {
    if (playlistMode === 'reorder') {
      reorderWorkingIds = [...reorderInitialIds];
      updatePlaylist();
    }
    closePlaylistConfirmModal();
  }

  function applyDeleteSelections(): void {
    if (!canMutateCurrentPlaylist()) {
      deleteSelectedIds.clear();
      return;
    }
    if (!AMP_STATUS.media || deleteSelectedIds.size === 0) return;
    AMP_STATUS.media = (AMP_STATUS.media as MediaItem[]).filter(
      (item: MediaItem) => !deleteSelectedIds.has(item.amId)
    );
    deleteSelectedIds.clear();
    persistMyPlaylistIfNeeded();
  }

  function syncDeleteSelectionIndicator(itemElm: HTMLElement, isSelected: boolean): void {
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

  function destroyPlaylistSortable(): void {
    if (playlistSortable) {
      playlistSortable.destroy();
      playlistSortable = null;
    }
  }

  function resetReorderState(): void {
    destroyPlaylistSortable();
    reorderInitialIds = [];
    reorderWorkingIds = [];
    reorderCategoryId = null;
  }

  function isReorderDirty(): boolean {
    return reorderInitialIds.length > 0 &&
      reorderInitialIds.length === reorderWorkingIds.length &&
      reorderInitialIds.some((amId, index) => amId !== reorderWorkingIds[index]);
  }

  function captureReorderSnapshot(): void {
    reorderCategoryId = Number(AMP_STATUS.ctg);
    reorderInitialIds = getPlaylistItemsForCurrentView().map((item: MediaItem) => item.amId);
    reorderWorkingIds = [...reorderInitialIds];
  }

  function syncReorderWorkingIdsFromDom(): void {
    reorderWorkingIds = Array.from($LIST_PLAYLIST.querySelectorAll('a[data-playlist-item]')).map((elm) => {
      return Number((elm as HTMLElement).dataset['playlistItem'] || (elm as HTMLElement).getAttribute('data-playlist-item') || -1);
    }).filter((amId) => amId >= 0);
  }

  function applyReorderChanges(): void {
    if (!canMutateCurrentPlaylist()) {
      resetReorderState();
      return;
    }
    if (!AMP_STATUS.media || reorderCategoryId === null || reorderWorkingIds.length === 0) {
      resetReorderState();
      return;
    }

    const mediaById = new Map((AMP_STATUS.media || []).map((item: MediaItem) => [item.amId, item]));
    const reorderedItems = reorderWorkingIds
      .map((amId) => mediaById.get(amId))
      .filter((item): item is MediaItem => !!item);
    let reorderIndex = 0;
    AMP_STATUS.media = (AMP_STATUS.media || []).map((item: MediaItem) => {
      if (item.catId !== reorderCategoryId) {
        return item;
      }
      const nextItem = reorderedItems[reorderIndex];
      reorderIndex++;
      return nextItem || item;
    });
    persistMyPlaylistIfNeeded();
    resetReorderState();
  }

  function ensurePlaylistSortable(): void {
    if (playlistMode !== 'reorder' || !canUseReorderMode()) {
      destroyPlaylistSortable();
      return;
    }
    if (playlistSortable) {
      return;
    }
    const sortableLibrary = Sortable;
    if (!sortableLibrary) {
      return;
    }
    playlistSortable = sortableLibrary.create($LIST_PLAYLIST, {
      animation: 150,
      draggable: 'a[data-playlist-item]',
      forceFallback: true,
      fallbackOnBody: true,
      ghostClass: 'playlist-reorder-ghost',
      chosenClass: 'playlist-reorder-chosen',
      dragClass: 'playlist-reorder-drag',
      onEnd: () => {
        syncReorderWorkingIdsFromDom();
      },
    });
  }

  if ($BTN_PLAYLIST_CONFIRM_APPLY) {
    $BTN_PLAYLIST_CONFIRM_APPLY.addEventListener('click', () => {
      if (_playlistConfirmApplyCallback) _playlistConfirmApplyCallback();
      closePlaylistConfirmModal();
    });
  }

  if ($BTN_PLAYLIST_CONFIRM_CANCEL) {
    $BTN_PLAYLIST_CONFIRM_CANCEL.addEventListener('click', () => {
      cancelPlaylistConfirmModal();
    });
  }

  if ($MODAL_PLAYLIST_CONFIRM) {
    $MODAL_PLAYLIST_CONFIRM.addEventListener('click', (evt: MouseEvent) => {
      const target = evt.target;
      const isBackdrop = target instanceof HTMLElement &&
        target.parentElement === $MODAL_PLAYLIST_CONFIRM &&
        target.getAttribute('aria-hidden') === 'true';
      if (target === $MODAL_PLAYLIST_CONFIRM || isBackdrop) {
        cancelPlaylistConfirmModal();
      }
    });
  }

  // Process global data passed by the system.
  // In cloud mode: load MyPlaylist from localStorage before processing server data.
  // (Placed here, AFTER DOM constants, to avoid const temporal dead zone issues.)
  const savedPlaylistContext = getSavedPlaylistContext();
  ensureMyPlaylistOptionFromStorage();
  if ((window as any).AmbientData) {
    const ambientData: AmbientData = (window as any).AmbientData;
    if (savedPlaylistContext && isPlaylistAvailableForResume(savedPlaylistContext.playlist)) {
      requestCategoryResume(savedPlaylistContext.category);
      selectPlaylistOption(savedPlaylistContext.playlist);
      void getPlaylistData(savedPlaylistContext.playlist);
    } else {
      // Keep the historical cloud behavior: MyPlaylist is auto-loaded when no saved
      // playlist context is available.
      const shouldAutoloadMyPlaylist = ambientData?.isCloud === true &&
        localStorage.getItem(MYPLAYLIST_KEY) !== null;
      if (shouldAutoloadMyPlaylist) {
        initMyPlaylistFromStorage();
      } else if (ambientData.hasOwnProperty('currentPlaylist')) {
        // If there is only one playlist, load immediately.
        const currentPlaylist = ambientData.currentPlaylist as string;
        void getPlaylistData(currentPlaylist);
      } else if (
        ambientData.hasOwnProperty('playlists') &&
        Object.keys(ambientData.playlists || {}).length > 1
      ) {
        // If there are multiple playlists, do nothing yet.
      }
    }
  }

  /**
   * Method for switching display of alert component.
   */
  function toggleAlert(state: string | null = null, auto_close: number | null = null): void {
    let shown: boolean;
    switch (true) {
      case /^show(|n)$/i.test(state || ''):
        shown = true;
        break;
      case /^hid(e|den)$/i.test(state || ''):
        shown = false;
        break;
      default:
        shown = $ALERT.classList.contains('opacity-0');
        break;
    }
    toggleClass($ALERT, { 'opacity-0': !shown });
    // auto dismiss
    if (shown && auto_close && auto_close > 0) {
      new Promise<void>((resolve) => {
        setTimeout(() => {
          // start fadeout after delay time
          toggleClass($ALERT, { 'opacity-0': true });
          resolve();
        }, auto_close);
      }).then(() => {
        setTimeout(() => {
          // finally hiding after has been fadeout duration
          toggleClass($ALERT, { hidden: true });
        }, 1000);
      });
    }
  }

  if (isElement($ALERT)) {
    toggleAlert('hide');
  }

  /**
   * Return focus to the options trigger when the modal is being hidden.
   */
  function restoreOptionsTriggerFocus(): void {
    if (isElement($BUTTON_OPTIONS)) {
      $BUTTON_OPTIONS.focus();
    }
  }

  if (isElement($BUTTON_CLOSE_OPTIONS)) {
    $BUTTON_CLOSE_OPTIONS.addEventListener('click', () => {
      restoreOptionsTriggerFocus();
    }, true);
  }

  function isOptionsModalVisible(): boolean {
    return !$MODAL_OPTIONS.classList.contains('hidden') &&
      $MODAL_OPTIONS.getAttribute('aria-hidden') !== 'true';
  }

  /**
   * Sync active styles of bottom menu drawer toggle buttons.
   */
  function syncDrawerToggleButtonState(button: HTMLButtonElement, active: boolean): void {
    if (!isElement(button)) {
      return;
    }
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    button.classList.toggle('bg-blue-50', active);
    button.classList.toggle('dark:bg-gray-800', active);

    const labelNodes = Array.from(button.querySelectorAll('span:not(.sr-only)')) as HTMLElement[];
    labelNodes.forEach((node: HTMLElement) => {
      node.classList.toggle('text-blue-600', active);
      node.classList.toggle('dark:text-blue-500', active);
      node.classList.toggle('text-gray-500', !active);
      node.classList.toggle('dark:text-gray-400', !active);
    });

    const iconNodes = Array.from(button.querySelectorAll('svg')) as SVGElement[];
    iconNodes.forEach((node: SVGElement) => {
      node.classList.toggle('text-blue-600', active);
      node.classList.toggle('dark:text-blue-500', active);
      node.classList.toggle('text-gray-500', !active);
      node.classList.toggle('dark:text-gray-400', !active);
    });
  }

  function isDrawerOpen(drawer: HTMLElement, hiddenClass: string): boolean {
    const ariaModal = drawer.getAttribute('aria-modal') === 'true';
    const hiddenByClass = drawer.classList.contains(hiddenClass);
    return ariaModal || !hiddenByClass;
  }

  function syncDrawerToggleButtons(): void {
    syncDrawerToggleButtonState($BUTTON_PLAYLIST, isDrawerOpen($DRAWER_PLAYLIST, '-translate-x-full'));
    syncDrawerToggleButtonState($BUTTON_SETTINGS, isDrawerOpen($DRAWER_SETTINGS, 'translate-x-full'));
  }

  watcher($MODAL_OPTIONS, (mutation: MutationRecord) => {
    if (mutation.type !== 'attributes') {
      return;
    }

    const modalElm = mutation.target as HTMLElement;
    const activeElm = document.activeElement;
    const isModalHidden = modalElm.getAttribute('aria-hidden') === 'true' || modalElm.classList.contains('hidden');
    const isFocusInsideModal = activeElm instanceof HTMLElement && modalElm.contains(activeElm);

    if (isModalHidden && isFocusInsideModal) {
      restoreOptionsTriggerFocus();
    }

    if (isModalHidden) {
      cleanupOptionsModalBackdrops();
    }
  }, { attributes: true, childList: false, subtree: false, attributeFilter: ['aria-hidden', 'class'] });

  /**
   * Monitors the state of the playlist drawer component and fires
   * an event when it is displayed.
   */
  watcher($DRAWER_PLAYLIST, (mutation: MutationRecord) => {
    if (mutation.type !== 'attributes') {
      return;
    }
    syncDrawerToggleButtons();
    if (mutation.attributeName === 'aria-modal' && (mutation.target as HTMLElement).ariaModal === 'true') {
      scrollToFocusItem();
    }
  }, { attributes: true, childList: false, subtree: true, attributeFilter: ['aria-modal', 'class'] });

  watcher($DRAWER_SETTINGS, (_mutation: MutationRecord) => {
    syncDrawerToggleButtons();
  }, { attributes: true, childList: false, subtree: true, attributeFilter: ['aria-modal', 'class'] });

  syncDrawerToggleButtons();

  // Wire up "Register media" link in the no-media area of the left drawer
  {
    const $ADD_FROM_DRAWER = document.getElementById('btn-add-media-from-drawer');
    if ($ADD_FROM_DRAWER) {
      bindAddMediaFromDrawer($ADD_FROM_DRAWER);
    }
  }

  /**
   * Monitors the state of the collapse menu component and fires
   * an event when it is opened.
   */
  watcher($COLLAPSE_MENU, (mutation: MutationRecord) => {
    if (mutation.attributeName === 'aria-expanded' && (mutation.target as HTMLElement).ariaExpanded === 'true') {
      const is_collapse_open = (mutation.target as HTMLElement).ariaExpanded === 'true';
      const collapse_item_id = (mutation.target as HTMLElement).getAttribute('aria-controls');
      if (is_collapse_open && collapse_item_id) {
        const $COLLAPSE_ITEM = document.getElementById(collapse_item_id);
        if ($COLLAPSE_ITEM?.firstElementChild) {
          ($COLLAPSE_ITEM.firstElementChild as HTMLElement).setAttribute('style', 'max-height: calc(100vh - 420px)');
          // Reset scroll position to top when any accordion panel opens
          ($COLLAPSE_ITEM.firstElementChild as HTMLElement).scrollTop = 0;
        }
      }
    }
  }, { attributes: true, childList: false, subtree: true, attributeFilter: ['aria-expanded'] });

  /**
   * Empty the playlist.
   */
  function clearPlaylist(): void {
    // Clear all items of playlist
    const $NO_MEDIA = document.getElementById('no-media');
    const clone = $NO_MEDIA?.cloneNode(true) as HTMLElement | null;
    while ($LIST_PLAYLIST.firstChild) {
      $LIST_PLAYLIST.removeChild($LIST_PLAYLIST.firstChild);
    }
    if (clone) {
      $LIST_PLAYLIST.appendChild(clone);
      // Re-attach click handler on the cloned "Register media" button
      const addBtn = clone.querySelector('#btn-add-media-from-drawer');
      if (addBtn) {
        bindAddMediaFromDrawer(addBtn);
      }
    }
  }

  function bindAddMediaFromDrawer(addBtn: Element): void {
    const btn = addBtn as HTMLElement & { __ambientBound?: boolean };
    if (btn.__ambientBound) return;
    btn.__ambientBound = true;
    btn.addEventListener('click', (evt: Event) => {
      evt.preventDefault();
      evt.stopPropagation();
      const activeCatId = (AMP_STATUS.ctg !== undefined && AMP_STATUS.ctg !== null && Number(AMP_STATUS.ctg) >= 0)
        ? Number(AMP_STATUS.ctg)
        : null;
      openMediaManagement(activeCatId);
    });
  }

  function cleanupOptionsModalBackdrops(): void {
    const isOptionsHidden = !isOptionsModalVisible();
    if (!isOptionsHidden) return;

    document.querySelectorAll('div[modal-backdrop]').forEach((backdrop) => {
      backdrop.remove();
    });

    const hasVisibleModal = Array.from(document.querySelectorAll('[aria-modal="true"]')).some((elm) => {
      return elm instanceof HTMLElement && !elm.classList.contains('hidden');
    });
    if (!hasVisibleModal) {
      document.body.classList.remove('overflow-hidden');
    }
  }

  function closePlaylistDrawerForModalIfNeeded(): void {
    if (currentWindowSize.width >= currentWindowSize.minFullUIWidth) {
      return;
    }
    if (!isDrawerOpen($DRAWER_PLAYLIST, '-translate-x-full')) {
      return;
    }
    (document.getElementById('btn-close-playlist') as HTMLButtonElement | null)?.click();
  }

  function closeSettingsDrawerForModalIfNeeded(): void {
    if (currentWindowSize.width >= currentWindowSize.minFullUIWidth) {
      return;
    }
    if (!isDrawerOpen($DRAWER_SETTINGS, 'translate-x-full')) {
      return;
    }
    (document.getElementById('btn-close-settings') as HTMLButtonElement | null)?.click();
  }

  function getActiveCategoryId(): number | null {
    return (AMP_STATUS.ctg !== undefined && AMP_STATUS.ctg !== null && Number(AMP_STATUS.ctg) >= 0)
      ? Number(AMP_STATUS.ctg)
      : null;
  }

  function syncTargetCategorySelection(): void {
    if (!isElement($SELECT_CATEGORY)) return;
    const preferredValue = getActiveCategoryId();
    const nextValue = preferredValue !== null ? String(preferredValue) : '-1';
    const hasOption = Array.from($SELECT_CATEGORY.options).some((opt) => opt.value === nextValue);
    $SELECT_CATEGORY.value = hasOption ? nextValue : '-1';
  }

  function syncMediaCategoryField(preferredCategoryId: number | null = getActiveCategoryId()): void {
    const $catInput = document.getElementById('media-category-new') as HTMLInputElement | null;
    const hasVisibleSelect = isElement($MEDIA_CATEGORY_SELECT) && !$MEDIA_CATEGORY_SELECT.classList.contains('hidden');
    if (hasVisibleSelect) {
      const hasPreferredOption = preferredCategoryId !== null &&
        Array.from($MEDIA_CATEGORY_SELECT.options).some((opt) => opt.value === String(preferredCategoryId));
      if (hasPreferredOption) {
        $MEDIA_CATEGORY_SELECT.value = String(preferredCategoryId);
      } else if (AMP_STATUS.category && AMP_STATUS.category.length === 1) {
        $MEDIA_CATEGORY_SELECT.value = '0';
      } else {
        $MEDIA_CATEGORY_SELECT.value = '';
      }
      $MEDIA_CATEGORY_SELECT.dispatchEvent(new Event('change'));
      return;
    }

    if ($catInput && !$catInput.classList.contains('hidden')) {
      const nextValue = $catInput.value.trim() || $catInput.dataset['defaultValue'] || 'New Category';
      $catInput.value = nextValue;
      $catInput.dispatchEvent(new Event('input'));
      $catInput.dispatchEvent(new Event('change'));
    }
  }

  function normalizeVolume(value: any, fallback: number = DEFAULT_VOLUME): number {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && inRange(numericValue, 0, 100)
      ? numericValue
      : fallback;
  }

  function getDefaultVolume(): number {
    return normalizeVolume(getOption('volume'), DEFAULT_VOLUME);
  }

  function getPlaybackVolume(mediaData: MediaItem | null = null): number {
    const mediaVolume = mediaData?.volume;
    if (
      mediaData &&
      mediaVolume !== undefined &&
      inRange(Number(mediaVolume), 0, 100)
    ) {
      return Number(mediaVolume);
    }
    return getDefaultVolume();
  }

  function syncRangeProgress(range: HTMLInputElement | null): void {
    if (!range) return;
    const min = Number(range.min || 0);
    const max = Number(range.max || 100);
    const value = normalizeVolume(range.value, DEFAULT_VOLUME);
    const progress = max > min ? ((value - min) / (max - min)) * 100 : 0;
    range.style.setProperty('--range-progress', `${Math.min(100, Math.max(0, progress))}%`);
  }

  function syncMediaVolumeField(volume: number = getDefaultVolume()): void {
    if (!$MEDIA_VOLUME) return;
    const normalizedVolume = normalizeVolume(volume, getDefaultVolume());
    $MEDIA_VOLUME.value = String(normalizedVolume);
    syncRangeProgress($MEDIA_VOLUME);
    const displayVolume = document.getElementById('default-media-volume');
    if (displayVolume) {
      displayVolume.textContent = String(normalizedVolume);
    }
  }

  function openPlaylistManagementCategoryCreate(): void {
    ensureAccordionPanel('collapse-item-body-playlist');
    window.setTimeout(() => {
      const categoryNameInput = document.getElementById('category-name') as HTMLInputElement | null;
      categoryNameInput?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      categoryNameInput?.focus();
    }, 120);
  }

  function ensureAccordionPanel(panelId: string): void {
    const accordionBtn = document.querySelector(`[data-accordion-target="#${panelId}"]`) as HTMLElement | null;
    const panel = document.getElementById(panelId);
    if (!panel) return;
    if (accordionBtn && panel.classList.contains('hidden')) {
      accordionBtn.click();
    }
    window.setTimeout(() => {
      if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        accordionBtn?.setAttribute('aria-expanded', 'true');
      }
    }, 80);
  }

  function showOptionsModal(): void {
    if (isOptionsModalVisible()) return;
    if (optionsModalHideTimer !== null) {
      window.clearTimeout(optionsModalHideTimer);
      optionsModalHideTimer = null;
    }

    closePlaylistDrawerForModalIfNeeded();
    closeSettingsDrawerForModalIfNeeded();
    cleanupOptionsModalBackdrops();

    $MODAL_OPTIONS.classList.add('flex');
    $MODAL_OPTIONS.classList.remove('hidden');
    $MODAL_OPTIONS.style.zIndex = '9999';
    $MODAL_OPTIONS.style.opacity = '0';
    $MODAL_OPTIONS.style.pointerEvents = 'none';
    $MODAL_OPTIONS.style.transition = 'opacity 180ms ease';
    $MODAL_OPTIONS.setAttribute('aria-modal', 'true');
    $MODAL_OPTIONS.setAttribute('role', 'dialog');
    $MODAL_OPTIONS.removeAttribute('aria-hidden');
    if ($MODAL_OPTIONS_PANEL) {
      $MODAL_OPTIONS_PANEL.style.opacity = '0';
      $MODAL_OPTIONS_PANEL.style.transform = 'translateY(0.5rem) scale(0.98)';
      $MODAL_OPTIONS_PANEL.style.transition = 'opacity 180ms ease, transform 180ms ease';
    }

    const backdrop = document.createElement('div');
    backdrop.setAttribute('modal-backdrop', '');
    backdrop.className = currentWindowSize.width >= currentWindowSize.minFullUIWidth
      ? 'modal-backdrop-layer fixed inset-0 z-[59]'
      : 'modal-backdrop-layer fixed inset-0 z-40';
    backdrop.style.zIndex = '9998';
    backdrop.style.pointerEvents = 'none';
    backdrop.style.opacity = '0';
    backdrop.style.transition = 'opacity 180ms ease';
    if ($MODAL_OPTIONS.parentNode) {
      $MODAL_OPTIONS.parentNode.insertBefore(backdrop, $MODAL_OPTIONS);
    } else {
      document.body.appendChild(backdrop);
    }
    document.body.classList.add('overflow-hidden');
    window.requestAnimationFrame(() => {
      $MODAL_OPTIONS.style.opacity = '1';
      $MODAL_OPTIONS.style.pointerEvents = 'auto';
      if ($MODAL_OPTIONS_PANEL) {
        $MODAL_OPTIONS_PANEL.style.opacity = '1';
        $MODAL_OPTIONS_PANEL.style.transform = 'translateY(0) scale(1)';
      }
      backdrop.style.opacity = '1';
    });
  }

  function hideOptionsModal(): void {
    if (optionsModalHideTimer !== null) {
      window.clearTimeout(optionsModalHideTimer);
      optionsModalHideTimer = null;
    }
    $MODAL_OPTIONS.style.opacity = '0';
    $MODAL_OPTIONS.style.pointerEvents = 'none';
    $MODAL_OPTIONS.setAttribute('aria-hidden', 'true');
    $MODAL_OPTIONS.removeAttribute('aria-modal');
    $MODAL_OPTIONS.removeAttribute('role');
    if ($MODAL_OPTIONS_PANEL) {
      $MODAL_OPTIONS_PANEL.style.opacity = '0';
      $MODAL_OPTIONS_PANEL.style.transform = 'translateY(0.5rem) scale(0.98)';
    }
    document.querySelectorAll('div[modal-backdrop]').forEach((backdrop) => {
      (backdrop as HTMLElement).style.opacity = '0';
    });
    optionsModalHideTimer = window.setTimeout(() => {
      if (!isOptionsModalVisible()) {
        $MODAL_OPTIONS.classList.add('hidden');
        $MODAL_OPTIONS.classList.remove('flex');
        cleanupOptionsModalBackdrops();
      }
      optionsModalHideTimer = null;
    }, 180);
  }

  if (isElement($BUTTON_OPTIONS)) {
    $BUTTON_OPTIONS.addEventListener('click', (evt: Event) => {
      evt.preventDefault();
      if (isOptionsModalVisible()) {
        hideOptionsModal();
      } else {
        clearCategory();
        updateCategory();
        syncMediaCategoryField();
        showOptionsModal();
      }
    });
  }

  if (isElement($BUTTON_CLOSE_OPTIONS)) {
    $BUTTON_CLOSE_OPTIONS.addEventListener('click', (evt: Event) => {
      evt.preventDefault();
      hideOptionsModal();
    });
  }

  if (isElement($MODAL_OPTIONS)) {
    $MODAL_OPTIONS.addEventListener('pointerdown', (evt: PointerEvent) => {
      optionsBackdropPointerStarted = evt.target === $MODAL_OPTIONS;
    });

    $MODAL_OPTIONS.addEventListener('click', (evt: Event) => {
      if (evt.target === $MODAL_OPTIONS && optionsBackdropPointerStarted) {
        hideOptionsModal();
        restoreOptionsTriggerFocus();
      }
      optionsBackdropPointerStarted = false;
    });
  }

  (document.getElementById('link-open-playlist-management-category') as HTMLAnchorElement | null)
    ?.addEventListener('click', (evt: Event) => {
      evt.preventDefault();
      openPlaylistManagementCategoryCreate();
    });

  document.addEventListener('keydown', (evt: KeyboardEvent) => {
    if (evt.key === 'Escape' && isOptionsModalVisible()) {
      hideOptionsModal();
      restoreOptionsTriggerFocus();
    } else if (evt.key === 'Escape' && isElement($MODAL_PLAYLIST_DESC) && !$MODAL_PLAYLIST_DESC.classList.contains('hidden')) {
      closePlaylistDescModal(true);
    }
  });

  if (isElement($BUTTON_CLOSE_PLAYLIST_DESC)) {
    $BUTTON_CLOSE_PLAYLIST_DESC.addEventListener('click', (evt: Event) => {
      evt.preventDefault();
      closePlaylistDescModal(true);
    });
  }

  if (isElement($MODAL_PLAYLIST_DESC_BACKDROP)) {
    $MODAL_PLAYLIST_DESC_BACKDROP.addEventListener('click', (evt: Event) => {
      evt.preventDefault();
      closePlaylistDescModal(false);
    });
  }

  /**
   * Open the Options modal with the Media Management accordion expanded.
   * Optionally pre-selects the category matching the current filter.
   */
  function openMediaManagement(presetCategoryId: number | null = null): void {
    // Refresh category UI before opening modal so undefined-category playlists
    // switch to text-input mode reliably.
    clearCategory();
    updateCategory();
    syncMediaCategoryField(presetCategoryId);

    showOptionsModal();

    // After the modal becomes visible, expand the Media Management accordion
    const expandMediaAccordion = (): void => {
      const $ACCORDION_BTN = document.querySelector(
        '[data-accordion-target="#collapse-item-body-media"]'
      ) as HTMLElement | null;
      const $panel = document.getElementById('collapse-item-body-media');
      ensureAccordionPanel('collapse-item-body-media');
      if (!$ACCORDION_BTN || $ACCORDION_BTN.getAttribute('aria-expanded') === 'true') {
        if ($panel?.firstElementChild) {
          ($panel.firstElementChild as HTMLElement).scrollTop = 0;
        }
      }
      // Pre-select category if coming from a category-filtered view
      if (presetCategoryId !== null && presetCategoryId >= 0) {
        syncMediaCategoryField(presetCategoryId);
      }
      syncMediaVolumeField();
    };

    // Wait for modal to open (aria-hidden becomes false), then expand accordion
    const $MODAL = document.getElementById('modal-options');
    if (!$MODAL) return;
    const isAlreadyOpen = $MODAL.getAttribute('aria-hidden') !== 'true' && !$MODAL.classList.contains('hidden');
    if (isAlreadyOpen) {
      setTimeout(expandMediaAccordion, 50);
    } else {
      const observer = new MutationObserver(() => {
        const nowOpen = $MODAL.getAttribute('aria-hidden') !== 'true' && !$MODAL.classList.contains('hidden');
        if (nowOpen) {
          observer.disconnect();
          setTimeout(expandMediaAccordion, 50);
        }
      });
      observer.observe($MODAL, { attributes: true, attributeFilter: ['aria-hidden', 'class'] });
    }
  }

  function createPlaylistMaskIcon(...classNames: string[]): HTMLSpanElement {
    const iconElm = document.createElement('span');
    iconElm.setAttribute('aria-hidden', 'true');
    iconElm.className = ['playlist-icon-mask', ...classNames].join(' ');
    return iconElm;
  }

  function buildDefaultPlaylistLabel(item: MediaItem): HTMLElement {
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

  /**
   * Create a playlist from the data of the AMP_STATUS object.
   */
  function updatePlaylist(): void {
    destroyPlaylistSortable();
    closePlaylistDescModal(false);
    clearPlaylist();
    const $LIST_NO_MEDIA = document.getElementById('no-media') as HTMLElement;
    let is_no_media =
      AMP_STATUS.media && AMP_STATUS.media.length === 0;
    let items: MediaItem[] = [];
    if (!AMP_STATUS.hasOwnProperty('ctg') || AMP_STATUS.ctg === null || Number(AMP_STATUS.ctg) === -1) {
      items = AMP_STATUS.media || [];
    } else {
      items = (AMP_STATUS.media || []).filter((item: MediaItem) => item.catId === AMP_STATUS.ctg);
    }
    is_no_media = items.length === 0;
    syncPlaylistModeAvailability(items.length);

    // Enable playlist download
    const $BUTTON_DOWNLOAD_PLAYLIST = document.getElementById('btn-download-playlist') as HTMLButtonElement;
    setAtts($BUTTON_DOWNLOAD_PLAYLIST, { disabled: '' }, true);

    if (is_no_media) {
      // no playable media
      $LIST_NO_MEDIA.classList.remove('hidden');
      // close mode menu so it doesn't overlap the "Register media" button
      closePlaylistModeMenu();
      return;
    } else {
      $LIST_NO_MEDIA.classList.add('hidden');
    }

    if (playlistMode === 'reorder' && !canUseReorderMode()) {
      resetReorderState();
      playlistMode = 'normal';
    }
    updatePlaylistModeUI();

    const isShuffle = getOption('shuffle') || false;
    if (isShuffle) {
      // Shuffle (evenly mix) the items array
      AMP_STATUS.shuffle = items
        .map((value: MediaItem) => ({ value, random: Math.random() }))
        .sort((a, b) => a.random - b.random)
        .map(({ value }) => value);
      logger('updatePlaylist::createShufflePlaylist:', AMP_STATUS.shuffle);
    }

    items.forEach((item: MediaItem) => {
      const itemElm = document.createElement('a');
      itemElm.href = '#';
      itemElm.draggable = false;
      if (AMP_STATUS.current && AMP_STATUS.current !== null && AMP_STATUS.current === item.amId) {
        itemElm.setAttribute('aria-current', 'true');
        itemElm.setAttribute('class', 'flex items-center gap-2 w-full min-w-0 px-4 py-2 text-white bg-blue-500 border-b border-gray-200 cursor-pointer dark:bg-gray-800 dark:border-gray-600');
      } else {
        itemElm.setAttribute('class', 'flex items-center gap-2 w-full min-w-0 px-4 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-500 dark:focus:text-white');
      }
      if (playlistMode === 'reorder') {
        itemElm.classList.remove('cursor-pointer');
        itemElm.classList.add('cursor-grab', 'active:cursor-grabbing', 'select-none');
      }
      itemElm.setAttribute('data-playlist-item', String(item.amId));
      itemElm.setAttribute('data-id', String(item.amId));

      let imageSrc = './views/images/no-media-thumb.svg';
      if ((item.image && item.image !== '') || (item.thumb && item.thumb !== '')) {
        const ambientData = (window as any).AmbientData as AmbientData;
        if (ambientData && ambientData.imageDir) {
          imageSrc = ambientData.imageDir + (item.thumb && item.thumb !== '' ? item.thumb : item.image);
        }
      } else if (item.videoid && item.videoid !== '') {
        imageSrc = getYoutubeThumbnailURL(item.videoid);
      }

      // Set thumbnail image.
      const imgElm = document.createElement('img');
      imgElm.setAttribute('src', imageSrc);
      imgElm.draggable = false;
      imgElm.classList.add('block', 'h-8', 'w-8', 'rounded', 'object-cover');
      imgElm.setAttribute('alt', mb_strimwidth(item.title, 0, 50, '...'));
      itemElm.appendChild(imgElm);

      // Delete mode: prepend checkbox indicator
      if (playlistMode === 'delete') {
        const isSelected = deleteSelectedIds.has(item.amId);
        const chkElm = document.createElement('span');
        chkElm.setAttribute('data-delete-selector', '');
        chkElm.setAttribute('aria-hidden', 'true');
        chkElm.className = isSelected
          ? 'flex-shrink-0 order-first flex items-center justify-center w-5 h-5 rounded border-2 border-red-500 bg-red-500'
          : 'flex-shrink-0 order-first flex items-center justify-center w-5 h-5 rounded border-2 border-gray-400 dark:border-gray-500';
        if (isSelected) {
          chkElm.appendChild(createPlaylistMaskIcon('playlist-icon-mask--check'));
        }
        itemElm.prepend(chkElm);
      } else if (playlistMode === 'reorder') {
        const handleElm = document.createElement('span');
        handleElm.setAttribute('aria-hidden', 'true');
        handleElm.className = 'playlist-reorder-handle flex-shrink-0 order-first inline-flex items-center justify-center w-5 h-5 text-gray-400 cursor-grab active:cursor-grabbing dark:text-gray-500';
        handleElm.appendChild(createPlaylistMaskIcon('playlist-icon-mask--reorder'));
        itemElm.prepend(handleElm);
      }

      const format = getOption('playlist');
      if (format) {
        const labelText = filterText(format, item);
        const labelElm = document.createElement('span');
        labelElm.className = 'playlist-item-label flex-1';
        if (/<.*?[!^<].*?>/gi.test(labelText)) {
          labelElm.innerHTML = labelText;
        } else {
          labelElm.textContent = labelText;
        }
        itemElm.appendChild(labelElm);
      } else {
        itemElm.appendChild(buildDefaultPlaylistLabel(item));
      }
      $LIST_PLAYLIST.appendChild(itemElm);
    });

    ensurePlaylistSortable();

    // Append "[+] Add media" item at the bottom of the playlist
    // Hidden in cloud mode for existing JSON playlists (read-only)
    // and hidden when playlist operation mode is not normal.
    if (canMutateCurrentPlaylist() && playlistMode === 'normal') {
      const addItemElm = document.createElement('a');
      addItemElm.href = '#';
      addItemElm.setAttribute('id', 'btn-add-media-from-playlist');
      addItemElm.setAttribute('class', 'flex items-center gap-2 w-full min-w-0 px-4 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-500 dark:focus:text-white text-blue-600 dark:text-blue-400');
      // Thumbnail-sized icon block (centered SVG)
      const addIconElm = document.createElement('span');
      addIconElm.setAttribute('class', 'flex items-center justify-center h-8 w-8 rounded bg-gray-100 dark:bg-gray-600 text-blue-600 dark:text-blue-400 flex-shrink-0');
      addIconElm.setAttribute('aria-hidden', 'true');
      addIconElm.appendChild(createPlaylistMaskIcon('playlist-icon-mask--add'));
      addItemElm.appendChild(addIconElm);
      const registerBtn = document.getElementById('btn-add-media-from-drawer');
      const registerText = (registerBtn?.dataset['label'] || registerBtn?.innerText || 'Register media').trim();
      const addLabelElm = document.createElement('span');
      addLabelElm.className = 'playlist-item-label flex-1';
      addLabelElm.textContent = registerText;
      addItemElm.appendChild(addLabelElm);
      addItemElm.addEventListener('click', (evt: Event) => {
        evt.preventDefault();
        const activeCatId = (AMP_STATUS.ctg !== undefined && AMP_STATUS.ctg !== null && Number(AMP_STATUS.ctg) >= 0)
          ? Number(AMP_STATUS.ctg)
          : null;
        openMediaManagement(activeCatId);
      });
      $LIST_PLAYLIST.appendChild(addItemElm);
    }

    // For debugging code
    const ambientData = (window as any).AmbientData as AmbientData;
    if (ambientData.hasOwnProperty('debug') && ambientData.debug) {
      execDebug();
    }
  }

  /**
   * Get the URL of the thumbnail image of YouTube media.
   */
  function getYoutubeThumbnailURL(videoid: string): string {
    return 'https://img.youtube.com/vi/' + videoid + '/hqdefault.jpg';
  }

  /**
   * Clears items in the category selection field in the settings menu.
   */
  function clearCategory(): void {
    const $ALL_CATEGORY = document.getElementById('all-category');
    const clone = $ALL_CATEGORY?.cloneNode(true) as HTMLElement | null;
    while ($SELECT_CATEGORY.firstChild) {
      $SELECT_CATEGORY.removeChild($SELECT_CATEGORY.firstChild);
    }
    if (clone) {
      $SELECT_CATEGORY.appendChild(clone);
      $SELECT_CATEGORY.firstElementChild?.setAttribute('disabled', '');
      $SELECT_CATEGORY.setAttribute('disabled', '');
      $SELECT_CATEGORY.value = '-1';
    }

    // add since v1.1.0 – reset category select and hide text input
    while ($MEDIA_CATEGORY_SELECT.firstChild) {
      $MEDIA_CATEGORY_SELECT.removeChild($MEDIA_CATEGORY_SELECT.firstChild);
    }
    const $MEDIA_CATEGORY_SELECT_FIRST_CHILD = document.createElement('option');
    $MEDIA_CATEGORY_SELECT_FIRST_CHILD.setAttribute('value', '');
    $MEDIA_CATEGORY_SELECT_FIRST_CHILD.textContent =
      $MEDIA_CATEGORY_SELECT.getAttribute('data-placeholder') || '';
    $MEDIA_CATEGORY_SELECT.appendChild($MEDIA_CATEGORY_SELECT_FIRST_CHILD);
    // Restore select visibility, hide text input
    $MEDIA_CATEGORY_SELECT.classList.remove('hidden');
    $MEDIA_CATEGORY_SELECT.disabled = false;
    const $catInput = document.getElementById('media-category-new') as HTMLInputElement | null;
    if ($catInput) {
      $catInput.classList.add('hidden');
      $catInput.disabled = true;
    }
    const $catLabel = document.getElementById('media-category-label') as HTMLLabelElement | null;
    const $catNote = document.getElementById('note-media-category-create-from-playlist-management') as HTMLParagraphElement | null;
    if ($catLabel) $catLabel.setAttribute('for', 'media-category');
    if ($catNote) {
      $catNote.classList.add('hidden');
    }
  }

  /**
   * Update the items in the category selection field of the settings menu.
   */
  function updateCategory(): void {
    const $catInput = document.getElementById('media-category-new') as HTMLInputElement | null;
    const $catLabel = document.getElementById('media-category-label') as HTMLLabelElement | null;
    const $catNote = document.getElementById('note-media-category-create-from-playlist-management') as HTMLParagraphElement | null;
    const hasCategories = !!(AMP_STATUS.category && AMP_STATUS.category.length > 0);

    if (!hasCategories) {
      // No categories yet – show text input, hide select so user can define first category
      $MEDIA_CATEGORY_SELECT.classList.add('hidden');
      $MEDIA_CATEGORY_SELECT.disabled = true;
      if ($catInput) {
        $catInput.classList.remove('hidden');
        $catInput.disabled = false;
        // Reset to default value when revealed
        $catInput.value = $catInput.dataset['defaultValue'] || 'New Category';
      }
      if ($catLabel) $catLabel.setAttribute('for', 'media-category-new');
      if ($catNote) {
        $catNote.classList.add('hidden');
      }
      $SELECT_CATEGORY.firstElementChild?.removeAttribute('disabled');
      $SELECT_CATEGORY.removeAttribute('disabled');
      syncTargetCategorySelection();
      return;
    }

    // Has categories – show select, hide text input
    $MEDIA_CATEGORY_SELECT.classList.remove('hidden');
    $MEDIA_CATEGORY_SELECT.disabled = false;
    if ($catInput) {
      $catInput.classList.add('hidden');
      $catInput.disabled = true;
    }
    if ($catLabel) $catLabel.setAttribute('for', 'media-category');
    if ($catNote) {
      $catNote.classList.remove('hidden');
    }

    AMP_STATUS.category!.forEach((catName: string, catId: number) => {
      const optElm = document.createElement('option');
      optElm.value = String(catId);
      optElm.textContent = catName;
      if (AMP_STATUS.category && AMP_STATUS.category.length === 1) {
        optElm.setAttribute('selected', 'selected');
      }
      $SELECT_CATEGORY.appendChild(optElm);

      // add since v1.1.0
      const cloneOpt = optElm.cloneNode(true) as HTMLOptionElement;
      $MEDIA_CATEGORY_SELECT.appendChild(cloneOpt);
    });
    $SELECT_CATEGORY.firstElementChild?.removeAttribute('disabled');
    $SELECT_CATEGORY.removeAttribute('disabled');
    syncTargetCategorySelection();
    syncMediaCategoryField();
  }

  /**
   * Getter for optional data of the AMP_STATUS object.
   */
  function getOption(key: string): any {
    if (AMP_STATUS.playlist === MYPLAYLIST_NAME && key === 'playlist') {
      return null;
    }
    if (AMP_STATUS.hasOwnProperty('options') && AMP_STATUS.options !== null) {
      if (!AMP_STATUS.options.hasOwnProperty(key) || AMP_STATUS.options[key] === null || AMP_STATUS.options[key] === '') {
        return null;
      } else {
        return AMP_STATUS.options[key];
      }
    } else {
      return null;
    }
  }

  /**
   * Causes the application to apply specific option contents of the AMP_STATUS object.
   */
  function applyOptions(): void {
    // Applies if a background image is specified.
    const bgImage = getOption('background');
    const ambientData = (window as any).AmbientData as AmbientData;
    if (bgImage && ambientData && ambientData.hasOwnProperty('imageDir')) {
      const bgSrc = ambientData.imageDir + bgImage;
      $BODY.setAttribute('style', `background-image: url('${bgSrc}');`);
      $BODY.classList.add('bg-no-repeat', 'bg-bottom', 'bg-cover');
      $MENU.setAttribute('style', 'background: linear-gradient(to bottom, rgba(255,255,255,.3), 50%, rgba(255,255,255,1));');
    } else {
      $BODY.removeAttribute('style');
      $BODY.classList.remove('bg-no-repeat', 'bg-bottom', 'bg-cover');
      $MENU.removeAttribute('style');
    }

    // Applies if a randomly playback is specified.
    const isRandom = getOption('random');
    if (isRandom !== null) {
      AMP_STATUS.order = isRandom ? 'random' : 'normal';
    }

    // Applies if a shuffle playback is specified.
    const isShuffle = getOption('shuffle');
    if (isShuffle !== null && isShuffle) {
      AMP_STATUS.shuffle = [];
      changeToggleShuffle();
    }

    // Applies if a seeking playback is specified.
    const isSeekplay = getOption('seek');
    if (isSeekplay !== null) {
      changeToggleSeekplay();
    }

    // Applies if a pseudo fader is specified, since v1.2.0
    const isFader = getOption('fader');
    if (isFader !== null) {
      changeToggleFader();
    }

    // Applies if a default volume is specified.
    AMP_STATUS.volume = getDefaultVolume();
    changeRangeVolume();
    syncMediaVolumeField();

    // Applies if a dark mode is specified.
    const isDarkMode = getOption('dark');
    if (isDarkMode !== null) {
      if (AMP_STATUS.options) {
        AMP_STATUS.options.dark = isDarkMode;
      }
    }

    changeToggleDarkmode();

    const isFullWindow = getOption('fullwindow');
    setFullWindowMode(!!isFullWindow, false);
  }

  /**
   * Clear and initialize the carousel display.
   */
  function clearCarousel(): void {
    const $CAROUSEL_NO_MEDIA = document.createElement('div');
    $CAROUSEL_NO_MEDIA.id = 'carousel-item-1';
    $CAROUSEL_NO_MEDIA.classList.add('hidden', 'h-full', 'items-center', 'justify-center', 'duration-700', 'ease-in-out');
    $CAROUSEL_NO_MEDIA.setAttribute('data-carousel-item', '');
    const $NO_MEDIA_IMAGE = document.createElement('img');
    $NO_MEDIA_IMAGE.src = './views/images/no-media-placeholder.svg';
    $NO_MEDIA_IMAGE.setAttribute('class', 'block h-full max-w-full object-contain');
    $NO_MEDIA_IMAGE.setAttribute('alt', 'No media available');
    $CAROUSEL_NO_MEDIA.appendChild($NO_MEDIA_IMAGE);
    const clone = $CAROUSEL_NO_MEDIA.cloneNode(true) as HTMLElement;
    clone.id = 'carousel-item-2';
    while ($CAROUSEL_WRAPPER.firstChild) {
      $CAROUSEL_WRAPPER.removeChild($CAROUSEL_WRAPPER.firstChild);
    }
    $CAROUSEL_WRAPPER.appendChild($CAROUSEL_NO_MEDIA);
    $CAROUSEL_WRAPPER.appendChild(clone);
    $CAROUSEL_PREV.setAttribute('disabled', '');
    $CAROUSEL_NEXT.setAttribute('disabled', '');
  }

  /**
   * Update the carousel display.
   */
  function updateCarousel(): void {
    const items: number[] = [];
    let is_show = false;

    if (AMP_STATUS.hasOwnProperty('prev') && AMP_STATUS.prev !== null) {
      items.push(AMP_STATUS.prev);
    }
    if (AMP_STATUS.hasOwnProperty('current') && AMP_STATUS.current !== null) {
      items.push(AMP_STATUS.current);
      is_show = true;
    }
    if (AMP_STATUS.hasOwnProperty('next') && AMP_STATUS.next !== null) {
      items.push(AMP_STATUS.next);
    }

    if (!is_show) {
      clearCarousel();
      return;
    }

    while ($CAROUSEL_WRAPPER.firstChild) {
      $CAROUSEL_WRAPPER.removeChild($CAROUSEL_WRAPPER.firstChild);
    }

    items.forEach((amId: number, index: number) => {
      const $COROUSEL_ITEM = document.createElement('div');
      $COROUSEL_ITEM.id = 'carousel-item-' + (index + 1);
      if (amId === AMP_STATUS.current) {
        $COROUSEL_ITEM.classList.add('h-full', 'items-center', 'justify-center', 'duration-700', 'ease-in-out');
      } else {
        $COROUSEL_ITEM.classList.add('hidden', 'h-full', 'items-center', 'justify-center', 'duration-700', 'ease-in-out');
      }
      $COROUSEL_ITEM.setAttribute('data-carousel-item', amId === AMP_STATUS.current ? 'active' : '');

      const $COROUSEL_ITEM_IMAGE = document.createElement('img');
      let mediaImage = './views/images/no-media-placeholder.svg';
      const mediaData = (AMP_STATUS.media || []).filter((item: MediaItem) => item.amId === amId).shift();

      if (!mediaData) return;

      let base_aspect = 'h-full';
      if (mediaData.hasOwnProperty('image') && mediaData.image !== null && mediaData.image !== '') {
        const ambientData = (window as any).AmbientData as AmbientData;
        mediaImage = (ambientData.imageDir ?? '') + (mediaData.image ?? '');
      } else if (mediaData.hasOwnProperty('videoid') && mediaData.videoid !== null && mediaData.videoid !== '') {
        mediaImage = getYoutubeThumbnailURL(mediaData.videoid ?? '');
        base_aspect = 'max-h-full';
      }

      $COROUSEL_ITEM_IMAGE.src = mediaImage;
      $COROUSEL_ITEM_IMAGE.classList.add('block', base_aspect, 'max-w-full', 'object-contain');
      $COROUSEL_ITEM_IMAGE.setAttribute('alt', mediaData.title);

      if (basename(mediaImage) === 'no-media-placeholder' && isObject(AMP_STATUS.options) && AMP_STATUS.options?.dark) {
        $COROUSEL_ITEM_IMAGE.setAttribute('style', 'opacity: .7');
      }

      $COROUSEL_ITEM.appendChild($COROUSEL_ITEM_IMAGE);
      $CAROUSEL_WRAPPER.appendChild($COROUSEL_ITEM);
    });

    $CAROUSEL_PREV.removeAttribute('disabled');
    $CAROUSEL_NEXT.removeAttribute('disabled');
  }

  /**
   * Update the media caption display.
   */
  function updateMediaCaption(mediaData: MediaItem): void {
    const format = getOption('caption') || '%artist% - %title%';
    const labelText = filterText(format, mediaData);
    while ($MEDIA_CAPTION.firstChild) {
      $MEDIA_CAPTION.removeChild($MEDIA_CAPTION.firstChild);
    }
    const $textWrap = document.createElement('div');
    $textWrap.classList.add('marquee-inner');
    if (/<.*?[!^<].*?>/gi.test(labelText)) {
      $textWrap.innerHTML = labelText;
    } else {
      $textWrap.appendChild(document.createTextNode(labelText));
    }
    $MEDIA_CAPTION.appendChild($textWrap);
    toggleMarqueeCaption();
  }

  /**
   * Toggle caption marqueeing depending on window size.
   */
  function toggleMarqueeCaption(): void {
    if ($BODY.classList.contains('amp-full-window')) {
      return;
    }
    const $MARQUEE_NODE = $MEDIA_CAPTION.querySelector('.marquee-inner') as HTMLElement | null;
    if (!isElement($MARQUEE_NODE)) {
      return;
    }
    const $MARQUEE_CLONE = $MARQUEE_NODE.cloneNode(true) as HTMLElement;
    const marqueeDuration = Math.floor(($MARQUEE_NODE.clientWidth || 0) / 32); // 16px = 1rem
    if (($MARQUEE_NODE.clientWidth || 0) > currentWindowSize.width || ($MARQUEE_NODE.clientWidth || 0) > 640) {
      // Turn overflow text into a marquee.
      $MARQUEE_CLONE.setAttribute('aria-hidden', 'true');
      $MEDIA_CAPTION.appendChild($MARQUEE_CLONE);
      ($MEDIA_CAPTION.querySelectorAll('.marquee-inner') as NodeListOf<HTMLElement>).forEach((elm: HTMLElement) => {
        elm.animate(
          {
            // .gap-2 = 0.5rem = 8px
            translate: ['0px', 'calc(-100% - 8px)'],
          },
          {
            duration: marqueeDuration * 1000,
            iterations: Infinity,
          }
        );
      });
    } else {
      while ($MEDIA_CAPTION.firstChild) {
        $MEDIA_CAPTION.removeChild($MEDIA_CAPTION.firstChild);
      }
      $MEDIA_CAPTION.appendChild($MARQUEE_CLONE);
    }
  }

  /**
   * Returns true when player is shown as full-window.
   */
  function isFullWindowMode(): boolean {
    return $BODY.classList.contains('amp-full-window');
  }

  /**
   * Sync icon pair of full-window toggle button.
   */
  function syncWindowFullButtonIcons(enabled: boolean): void {
    if (!isElement($BUTTON_WINDOW_FULL)) {
      return;
    }
    const $ICON_EXPAND = $BUTTON_WINDOW_FULL.querySelector('.icon-window-expand') as HTMLElement | null;
    const $ICON_MINIMIZE = $BUTTON_WINDOW_FULL.querySelector('.icon-window-minimize') as HTMLElement | null;
    if (isElement($ICON_EXPAND)) {
      $ICON_EXPAND.classList.toggle('hidden', enabled);
    }
    if (isElement($ICON_MINIMIZE)) {
      $ICON_MINIMIZE.classList.toggle('hidden', !enabled);
    }
    $BUTTON_WINDOW_FULL.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    $BUTTON_WINDOW_FULL.classList.toggle('bg-blue-50', enabled);
    $BUTTON_WINDOW_FULL.classList.toggle('dark:bg-gray-800', enabled);

    const labelNodes = Array.from($BUTTON_WINDOW_FULL.querySelectorAll('span:not(.sr-only)')) as HTMLElement[];
    labelNodes.forEach((node: HTMLElement) => {
      node.classList.toggle('text-blue-600', enabled);
      node.classList.toggle('dark:text-blue-500', enabled);
      node.classList.toggle('text-gray-500', !enabled);
      node.classList.toggle('dark:text-gray-400', !enabled);
    });

    const inactiveIcons = [$ICON_EXPAND];
    inactiveIcons.forEach((node) => {
      if (!isElement(node)) {
        return;
      }
      node.classList.toggle('text-blue-600', enabled);
      node.classList.toggle('dark:text-blue-500', enabled);
      node.classList.toggle('text-gray-500', !enabled);
      node.classList.toggle('dark:text-gray-400', !enabled);
    });
  }

  /**
   * Toggle full-window mode and synchronize controls from drawer and bottom menu.
   * @param closeDrawers When true, auto-close any open drawers (only for bottom-menu trigger).
   */
  function setFullWindowMode(enabled: boolean, syncOption = true, closeDrawers = false): void {
    $BODY.classList.toggle('amp-full-window', enabled);

    const $TOGGLE = $TOGGLE_WINDOW_FULL?.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
    if (isElement($TOGGLE)) {
      $TOGGLE.checked = enabled;
    }

    if (syncOption) {
      if (!isObject(AMP_STATUS.options)) {
        AMP_STATUS.options = { fullwindow: enabled };
      } else {
        AMP_STATUS.options.fullwindow = enabled;
      }
      persistMyPlaylistIfNeeded();
    }

    if (enabled && closeDrawers) {
      const shownLeft  = !$DRAWER_PLAYLIST.classList.contains('-translate-x-full');
      const shownRight = !$DRAWER_SETTINGS.classList.contains('translate-x-full');
      if (shownLeft) {
        (document.getElementById('btn-close-playlist') as HTMLElement | null)?.click();
      }
      if (shownRight) {
        (document.getElementById('btn-close-settings') as HTMLElement | null)?.click();
      }
    }

    syncWindowFullButtonIcons(enabled);
    updateWindowSize();
    refreshViewportMetricsAfter(240);
  }

  /**
   * Synchronize the bottom menu minimize button icon and state.
   */
  function syncMenuCollapseButton(minimized: boolean): void {
    if (!isElement($BUTTON_MENU_COLLAPSE)) {
      return;
    }
    const $ICON_COMPRESS = $BUTTON_MENU_COLLAPSE.querySelector('.icon-menu-compress') as HTMLElement | null;
    const $ICON_EXPAND = $BUTTON_MENU_COLLAPSE.querySelector('.icon-menu-expand') as HTMLElement | null;
    if (isElement($ICON_COMPRESS)) {
      $ICON_COMPRESS.classList.toggle('hidden', minimized);
    }
    if (isElement($ICON_EXPAND)) {
      $ICON_EXPAND.classList.toggle('hidden', !minimized);
    }
    $BUTTON_MENU_COLLAPSE.setAttribute('aria-pressed', minimized ? 'true' : 'false');
  }

  /**
   * Toggle bottom menu minimized state.
   */
  function setMenuMinimized(minimized: boolean): void {
    if (!isElement($MENU)) {
      return;
    }
    $MENU.classList.toggle('menu-minimized', minimized);
    syncMenuCollapseButton(minimized);
  }

  /**
   * Filters text to the specified format.
   */
  function filterText(format: string, mediaData: MediaItem): string {
    const patterns = format.match(/%(.+?)%/gi);
    let text = format;
    if (patterns && patterns.length > 0) {
      patterns.forEach((pattern: string) => {
        const property = pattern.replaceAll('%', '');
        const replacer = (mediaData.hasOwnProperty(property) && (mediaData as any)[property])
          ? (mediaData as any)[property]
          : '';
        text = text.replaceAll(`%${property}%`, replacer);
      });
      text = text
        .trim()
        .replace(/^[-_‐–−—ー]?(.*)[-_‐–−—ー]?$/, '$1')
        .trim();
    }
    return text;
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Event listener when the playlist selection field in the settings menu is changed.
   */
  $SELECT_PLAYLIST.addEventListener('change', (evt: Event) => {
    const newPlaylist = (evt.target as HTMLSelectElement).value;
    let oldPlaylist: string | null = null;
    if (AMP_STATUS.hasOwnProperty('playlist')) {
      oldPlaylist = AMP_STATUS.playlist;
    }
    if (oldPlaylist !== newPlaylist) {
      if (playlistMode !== 'normal') {
        deleteSelectedIds.clear();
        resetReorderState();
        playlistMode = 'normal';
        updatePlaylistModeUI();
      }
      void getPlaylistData(newPlaylist);
    }
  });

  /**
   * Event listener when the category selection field in the settings menu is changed.
   */
  $SELECT_CATEGORY.addEventListener('change', (evt: Event) => {
    let oldCtgId: number | null = null;
    if (AMP_STATUS.hasOwnProperty('ctg') && AMP_STATUS.ctg !== null) {
      oldCtgId = AMP_STATUS.ctg;
    }
    const newCtgId = Number((evt.target as HTMLSelectElement).value);
    if (oldCtgId !== newCtgId) {
      if (playlistMode !== 'normal') {
        deleteSelectedIds.clear();
        resetReorderState();
        playlistMode = 'normal';
        updatePlaylistModeUI();
      }
      AMP_STATUS.ctg = newCtgId;
      AMP_STATUS.prev = null;
      AMP_STATUS.current = null;
      AMP_STATUS.next = null;
    }
    updatePlaylist();
  });

  $LIST_PLAYLIST.addEventListener('click', (evt: Event) => {
    const target = evt.target as HTMLElement | null;
    if (!target) {
      return;
    }

    const descTrigger = target.closest('[data-playlist-desc-trigger]') as HTMLElement | null;
    if (descTrigger) {
      evt.preventDefault();
      evt.stopPropagation();
      const descText = descTrigger.dataset['desc'] || '';
      const titleText = descTrigger.getAttribute('data-playlist-title') || '';
      const artistText = descTrigger.getAttribute('data-playlist-artist') || '';
      if (descText.trim() !== '') {
        openPlaylistDescModal(titleText, artistText, descText, descTrigger);
      }
      return;
    }

    const itemElm = target.closest('a[data-playlist-item]') as HTMLElement | null;
    if (!itemElm) {
      return;
    }

    evt.preventDefault();
    if (playlistMode === 'delete') {
      const amId = Number(itemElm.getAttribute('data-playlist-item'));
      if (deleteSelectedIds.has(amId)) {
        deleteSelectedIds.delete(amId);
      } else {
        deleteSelectedIds.add(amId);
      }
      syncDeleteSelectionIndicator(itemElm, deleteSelectedIds.has(amId));
      return;
    }
    if (isPlaylistInteractionLocked()) {
      return;
    }
    playItem(itemElm);
    $BUTTON_PLAY.classList.add('hidden');
    $BUTTON_PAUSE.classList.remove('hidden');
  });

  $LIST_PLAYLIST.addEventListener('keydown', (evt: KeyboardEvent) => {
    const target = evt.target as HTMLElement | null;
    if (!target) {
      return;
    }
    const descTrigger = target.closest('[data-playlist-desc-trigger]') as HTMLElement | null;
    if (!descTrigger) {
      return;
    }
    if (evt.key === 'Enter' || evt.key === ' ') {
      evt.preventDefault();
      const descText = descTrigger.dataset['desc'] || '';
      const titleText = descTrigger.getAttribute('data-playlist-title') || '';
      const artistText = descTrigger.getAttribute('data-playlist-artist') || '';
      if (descText.trim() !== '') {
        openPlaylistDescModal(titleText, artistText, descText, descTrigger);
      }
    }
  });

  /**
   * Event listener when the button of "previous" for carousel has been clicked.
   */
  $CAROUSEL_PREV.addEventListener('click', (_evt: Event) => {
    if (AMP_STATUS.prev !== null) {
      playItem(null, AMP_STATUS.prev);
    }
  });

  /**
   * Event listener when the button of "next" for carousel has been clicked.
   */
  $CAROUSEL_NEXT.addEventListener('click', (_evt: Event) => {
    if (AMP_STATUS.next !== null) {
      playItem(null, AMP_STATUS.next);
    }
  });

  /**
   * Event listener when the button of "refresh" in bottom menu has been clicked.
   */
  $BUTTON_REFRESH.addEventListener('click', (_evt: Event) => {
    reloadPage();
  });

  if (isElement($BUTTON_WINDOW_FULL)) {
    $BUTTON_WINDOW_FULL.addEventListener('click', (_evt: Event) => {
      setFullWindowMode(!isFullWindowMode(), true, true);
    });
  }

  if (isElement($TOGGLE_WINDOW_FULL)) {
    ($TOGGLE_WINDOW_FULL.querySelector('input[type="checkbox"]') as HTMLInputElement).addEventListener('change', (evt: Event) => {
      setFullWindowMode((evt.target as HTMLInputElement).checked);
    });
  }

  if (isElement($BUTTON_MENU_COLLAPSE)) {
    $BUTTON_MENU_COLLAPSE.addEventListener('click', (_evt: Event) => {
      setMenuMinimized(!$MENU.classList.contains('menu-minimized'));
    });
  }

  /**
   * Toggle the display of player controls button after media loaded.
   */
  function togglePlayerControllButtons(): void {
    if (AMP_STATUS.media !== null && AMP_STATUS.media.length > 0) {
      // There are activated when available media are set.
      $BUTTON_PLAY.removeAttribute('disabled');
      $BUTTON_PAUSE.removeAttribute('disabled');
    } else {
      // There are deactivated when no available media.
      $BUTTON_PLAY.setAttribute('disabled', '');
      $BUTTON_PLAY.classList.remove('hidden');
      $BUTTON_PAUSE.setAttribute('disabled', '');
      $BUTTON_PAUSE.classList.add('hidden');
    }
  }

  /**
   * Event listener when the "play" button in bottom menu has been clicked.
   */
  $BUTTON_PLAY.addEventListener('click', (_evt: Event) => {
    let playableIds = (AMP_STATUS.media || []).map((item: MediaItem) => item.amId);
    if (AMP_STATUS.ctg > -1) {
      playableIds = (AMP_STATUS.media || [])
        .filter((item: MediaItem) => item.catId === AMP_STATUS.ctg)
        .map((item: MediaItem) => item.amId);
    }
    const isShuffle = getOption('shuffle') || false;
    if (isShuffle && AMP_STATUS.hasOwnProperty('shuffle') && (AMP_STATUS.shuffle || []).length > 0) {
      playableIds = (AMP_STATUS.shuffle || []).map((item: MediaItem) => item.amId);
    }
    let playId: number;
    if (AMP_STATUS.current !== null) {
      playId = AMP_STATUS.current;
    } else {
      if (AMP_STATUS.order === 'random') {
        playId = playableIds[Math.floor(Math.random() * playableIds.length)] ?? 0;
      } else {
        playId = playableIds.shift() || 0;
      }
    }

    if (AMP_STATUS.playertype === 'youtube' && player) {
      const YTPstate = player.getPlayerState();
      logger('"Play" the YouTube Player:', YTPstate);
      if (YTPstate !== -1) {
        player.playVideo();
      }
    } else if (/^(audio|video)$/i.test(AMP_STATUS.playertype || '')) {
      const _elms = document.getElementsByTagName(AMP_STATUS.playertype as any);
      const playerElm = _elms[0] as HTMLMediaElement;
      playerElm.play();
    } else {
      playItem(null, playId);
    }

    // Toggle this button shown.
    $BUTTON_PLAY.classList.add('hidden');
    $BUTTON_PAUSE.classList.remove('hidden');
  });

  /**
   * Event listener when the "pause" button in bottom menu has been clicked.
   */
  $BUTTON_PAUSE.addEventListener('click', (_evt: Event) => {
    if (!AMP_STATUS.hasOwnProperty('playertype') || AMP_STATUS.playertype === null) {
      return;
    }
    if (AMP_STATUS.playertype === 'youtube' && player) {
      if (player.getPlayerState() === 1) {
        player.pauseVideo();
      } else {
        player.stopVideo();
      }
    } else if (/^(audio|video)$/i.test(AMP_STATUS.playertype)) {
      const _elms = document.getElementsByTagName(AMP_STATUS.playertype as any);
      const playerElm = _elms[0] as HTMLMediaElement;
      playerElm.pause();
    } else {
      // Deactivate their player control buttons.
      $BUTTON_PLAY.setAttribute('disabled', '');
      $BUTTON_PLAY.classList.remove('hidden');
      $BUTTON_PAUSE.setAttribute('disabled', '');
      $BUTTON_PAUSE.classList.add('hidden');
    }

    // Toggle this button shown.
    $BUTTON_PAUSE.classList.add('hidden');
    $BUTTON_PLAY.classList.remove('hidden');
  });

  /**
   * Toggle style to focus the active item in a playlist.
   */
  function changePlaylistFocus(): void {
    // Change the focus of playlist.
    Array.from($LIST_PLAYLIST.querySelectorAll('a')).forEach((elm: HTMLElement) => {
      if (AMP_STATUS.current !== null && (elm as any).dataset.playlistItem === String(AMP_STATUS.current)) {
        elm.setAttribute('aria-current', 'true');
        elm.setAttribute('class', 'flex items-center gap-2 w-full px-4 py-2 text-white bg-blue-500 border-b border-gray-200 cursor-pointer dark:bg-gray-800 dark:border-gray-600');
      } else {
        elm.removeAttribute('aria-current');
        elm.setAttribute('class', 'flex items-center gap-2 w-full px-4 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-500 dark:focus:text-white');
      }
    });
    scrollToFocusItem();
  }

  /**
   * Auto-scroll to active item in playlist.
   */
  function scrollToFocusItem(): void {
    const targetElm = $LIST_PLAYLIST.querySelector('a[aria-current="true"]') as HTMLElement | null;
    if (!targetElm) return;

    const elmRect = getRect(targetElm);
    if (elmRect) {
      const move =
        targetElm.offsetTop > $LIST_PLAYLIST.clientHeight
          ? Math.abs($LIST_PLAYLIST.clientHeight - targetElm.offsetTop) + elmRect.height
          : 0;
      $LIST_PLAYLIST.scrollTo({ top: move, behavior: 'smooth' });
    }
  }

  /**
   * Event listener when changing the loop play of settings menu toggle button.
   */
  ($TOGGLE_LOOP.querySelector('input[type="checkbox"]') as HTMLInputElement).addEventListener('change', (evt: Event) => {
    AMP_STATUS.loop = (evt.target as HTMLInputElement).checked;
  });

  /**
   * Event listener when changing the randomly of settings menu toggle button.
   */
  ($TOGGLE_RANDOMLY.querySelector('input[type="checkbox"]') as HTMLInputElement).addEventListener('change', (evt: Event) => {
    AMP_STATUS.order = (evt.target as HTMLInputElement).checked ? 'random' : 'normal';
  });

  /**
   * Toggle the randomly of settings menu toggle button.
   */
  function changeToggleRandomly(): void {
    const toggleElm = $TOGGLE_RANDOMLY.querySelector('input[type="checkbox"]') as HTMLInputElement;
    toggleElm.checked = AMP_STATUS.order === 'random';
  }

  /**
   * Event listener when changing the shuffle play of settings menu toggle button.
   */
  ($TOGGLE_SHUFFLE.querySelector('input[type="checkbox"]') as HTMLInputElement).addEventListener('change', (evt: Event) => {
    if (isObject(AMP_STATUS.options)) {
      if (AMP_STATUS.options.hasOwnProperty('shuffle')) {
        AMP_STATUS.options.shuffle = (evt.target as HTMLInputElement).checked;
      } else {
        AMP_STATUS.options['shuffle'] = (evt.target as HTMLInputElement).checked;
      }
    } else {
      AMP_STATUS.options = { shuffle: (evt.target as HTMLInputElement).checked };
    }
    AMP_STATUS.shuffle = shufflePlaylist();
    persistMyPlaylistIfNeeded();
  });

  /**
   * Toggle the shuffle play of settings menu toggle button.
   */
  function changeToggleShuffle(): void {
    const toggleElm = $TOGGLE_SHUFFLE.querySelector('input[type="checkbox"]') as HTMLInputElement;
    toggleElm.checked = !!(AMP_STATUS.options && AMP_STATUS.options.shuffle);
    AMP_STATUS.shuffle = shufflePlaylist();
  }

  /**
   * Shuffle playlist.
   */
  function shufflePlaylist(): MediaItem[] {
    const newList: MediaItem[] = [];
    if (isObject(AMP_STATUS.options) && AMP_STATUS.options?.shuffle) {
      let items = AMP_STATUS.media || [];
      if (AMP_STATUS.hasOwnProperty('ctg') && AMP_STATUS.ctg !== null && Number(AMP_STATUS.ctg) !== -1) {
        items = (AMP_STATUS.media || []).filter((item: MediaItem) => item.catId === AMP_STATUS.ctg);
      }
      if (items.length > 0) {
        // Shuffle (evenly mix) the items array
        const shuffled = items
          .map((value: MediaItem) => ({ value, random: Math.random() }))
          .sort((a, b) => a.random - b.random)
          .map(({ value }) => value);
        logger('shufflePlaylist:', shuffled);
        return shuffled;
      }
    }
    return newList;
  }

  /**
   * Event listener when changing the seekplay of settings menu toggle button.
   */
  ($TOGGLE_SEEKPLAY.querySelector('input[type="checkbox"]') as HTMLInputElement).addEventListener('change', (evt: Event) => {
    if (!isObject(AMP_STATUS.options)) {
      AMP_STATUS.options = { seek: (evt.target as HTMLInputElement).checked };
    } else {
      AMP_STATUS.options.seek = (evt.target as HTMLInputElement).checked;
    }
    persistMyPlaylistIfNeeded();
  });

  /**
   * Toggle the seekplay of settings menu toggle button.
   */
  function changeToggleSeekplay(): void {
    const toggleElm = $TOGGLE_SEEKPLAY.querySelector('input[type="checkbox"]') as HTMLInputElement;
    toggleElm.checked = !!(AMP_STATUS.options && AMP_STATUS.options.seek);
  }

  /**
   * Event listener when changing the pseudo fader of settings menu toggle button.
   */
  ($TOGGLE_FADER.querySelector('input[type="checkbox"]') as HTMLInputElement).addEventListener('change', (evt: Event) => {
    if (!isObject(AMP_STATUS.options)) {
      AMP_STATUS.options = { fader: (evt.target as HTMLInputElement).checked };
    } else {
      AMP_STATUS.options.fader = (evt.target as HTMLInputElement).checked;
    }
    persistMyPlaylistIfNeeded();
  });

  /**
   * Toggle the pseudo fader of settings menu toggle button.
   */
  function changeToggleFader(): void {
    const toggleElm = $TOGGLE_FADER.querySelector('input[type="checkbox"]') as HTMLInputElement;
    toggleElm.checked = !!(AMP_STATUS.options && AMP_STATUS.options.fader);
  }

  /**
   * Event listener when inputting the volume of settings menu range slider.
   */
  $RANGE_VOLUME.addEventListener('input', (evt: Event) => {
    const currentVolume = normalizeVolume((evt.target as HTMLInputElement).value);
    (evt.target as HTMLInputElement).value = String(currentVolume);
    syncRangeProgress(evt.target as HTMLInputElement);
    const displayVolume = document.getElementById('default-volume-value') as HTMLElement;
    displayVolume.textContent = String(currentVolume);
  });

  $RANGE_VOLUME.addEventListener('change', (evt: Event) => {
    const currentVolume = normalizeVolume((evt.target as HTMLInputElement).value);
    (evt.target as HTMLInputElement).value = String(currentVolume);
    syncRangeProgress(evt.target as HTMLInputElement);
    AMP_STATUS.volume = currentVolume;
    if (!isObject(AMP_STATUS.options)) {
      AMP_STATUS.options = { volume: currentVolume };
    } else {
      AMP_STATUS.options.volume = currentVolume;
    }
    persistMyPlaylistIfNeeded();
  });

  /**
   * Fires an input event of range slider when was changed default playback volume.
   */
  function changeRangeVolume(): void {
    const currentVolume = normalizeVolume(AMP_STATUS.volume, getDefaultVolume());
    $RANGE_VOLUME.value = String(currentVolume);
    syncRangeProgress($RANGE_VOLUME);
    const displayVolume = document.getElementById('default-volume-value') as HTMLElement | null;
    if (displayVolume) {
      displayVolume.textContent = String(currentVolume);
    }
  }

  /**
   * Event listener when changing the darkmode of settings menu toggle button.
   */
  ($TOGGLE_DARKMODE.querySelector('input[type="checkbox"]') as HTMLInputElement).addEventListener('change', (evt: Event) => {
    if (!isObject(AMP_STATUS.options)) {
      AMP_STATUS.options = { dark: (evt.target as HTMLInputElement).checked };
    } else {
      if (AMP_STATUS.options?.hasOwnProperty('dark')) {
        AMP_STATUS.options.dark = (evt.target as HTMLInputElement).checked;
      } else {
        AMP_STATUS.options = Object.assign(AMP_STATUS.options, { dark: (evt.target as HTMLInputElement).checked });
      }
    }
    // Delay dark class toggle to let the knob slide animation complete (~150ms)
    setTimeout(() => changeToggleDarkmode(), 200);
    persistMyPlaylistIfNeeded();
  });

  /**
   * Toggle the darkmode of settings menu toggle button.
   */
  function changeToggleDarkmode(): void {
    const toggleElm = $TOGGLE_DARKMODE.querySelector('input[type="checkbox"]') as HTMLInputElement;
    const isDarkmode = isObject(AMP_STATUS.options) && AMP_STATUS.options?.dark ? !!AMP_STATUS.options.dark : false;
    toggleElm.checked = isDarkmode;
    if (isDarkmode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    const $CAROUSEL_ITEMS = Array.from(document.querySelectorAll('[id^="carousel-item-"]')) as HTMLElement[];
    $CAROUSEL_ITEMS.forEach((item: HTMLElement) => {
      if (isDarkmode) {
        setStyles(item, 'opacity: .7');
      } else {
        setStyles(item);
      }
    });

    const $AUDIO_PLAYER = document.getElementsByTagName('audio');
    if ($AUDIO_PLAYER.length === 1 && isElement($AUDIO_PLAYER[0])) {
      if (isDarkmode) {
        setStyles($AUDIO_PLAYER[0], 'opacity: .7');
      } else {
        setStyles($AUDIO_PLAYER[0]);
      }
    }
  }

  $SELECT_LANGUAGE.addEventListener('change', (evt: Event) => {
    const currentLanguage = getCookie('lang');
    const newLanguage = (evt.target as HTMLSelectElement).value;
    logger('changeLanguage::', currentLanguage, newLanguage);
    if (currentLanguage !== newLanguage) {
      updateCookie('lang', newLanguage);
      reloadPage();
    }
  });

  /**
   * Updates the user's media playback state.
   */
  function updatePlayStatus(currentAmId: number): void {
    // Set looking ahead to the next index.
    const targetData =
      AMP_STATUS.ctg !== null && AMP_STATUS.ctg !== -1
        ? (AMP_STATUS.media || []).filter((item: MediaItem) => item.catId === AMP_STATUS.ctg)
        : AMP_STATUS.media || [];

    const isShuffle = getOption('shuffle') || false;
    let idCandidates: number[] = [];
    if (isShuffle && AMP_STATUS.hasOwnProperty('shuffle') && (AMP_STATUS.shuffle || []).length > 0) {
      idCandidates = (AMP_STATUS.shuffle || []).map((item: MediaItem) => item.amId);
    } else {
      idCandidates = targetData.map((item: MediaItem) => item.amId);
    }

    AMP_STATUS.current = currentAmId;
    let prevId: number | null = null;
    let nextId: number | null = null;

    if (AMP_STATUS.order === 'random') {
      if (idCandidates.length > 1) {
        idCandidates = idCandidates.filter((v: number) => v !== currentAmId);
      }
      prevId = idCandidates[Math.floor(Math.random() * idCandidates.length)] ?? null;
      nextId = idCandidates[Math.floor(Math.random() * idCandidates.length)] ?? null;
    } else {
      idCandidates.forEach((_v: number, _i: number) => {
        if (_v === currentAmId) {
          prevId = (_i === 0 ? idCandidates[idCandidates.length - 1] : idCandidates[_i - 1]) ?? null;
          nextId = (idCandidates.length === _i + 1 ? idCandidates[0] : idCandidates[_i + 1]) ?? null;
        }
      });
    }

    AMP_STATUS.prev = prevId;
    AMP_STATUS.next = nextId;
    updateCarousel();
  }

  /**
   * Commit a media item to play.
   */
  function reportMediaPlaybackIssue(
    mediaItem: MediaItem,
    reason: string,
    details: Record<string, unknown> = {}
  ): void {
    const title = mediaItem.title || mediaItem.file || mediaItem.videoid || 'Unknown media';
    logger('error', 'Media playback issue:', {
      reason,
      title,
      file: mediaItem.file || '',
      videoid: mediaItem.videoid || '',
      media: mediaItem,
      ...details,
    }, 'force');

    updateNotice({
      type: 'error',
      message: `Media could not be loaded: ${escapeHTML(title)}`,
      delay: 6000,
    });
  }

  function playItem(object: HTMLElement | null = null, id: number | null = null): void {
    const thisElm = isElement(object) ? (object as HTMLElement) : null;
    const amId = id !== null ? id : Number((thisElm as any)?.dataset?.playlistItem || 0);
    const mediaData = (AMP_STATUS.media || []).filter((item: MediaItem) => item.amId === amId).shift();

    if (!mediaData) return;

    let mediaSrc: string | null = null;
    let playerType: string | null = null;

    if (mediaData.hasOwnProperty('file') && mediaData.file !== '') {
      mediaSrc = mediaData.file ?? null;
      playerType = 'html';
    }

    if (mediaData.hasOwnProperty('videoid') && mediaData.videoid !== '') {
      mediaSrc = mediaData.videoid ?? null;
      playerType = 'youtube';
    }

    logger('playItem:', amId, mediaSrc, playerType);
    updatePlayStatus(amId);

    if (currentWindowSize.width < currentWindowSize.minFullUIWidth) {
      // Hide drawers
      (document.getElementById('btn-close-playlist') as HTMLButtonElement)?.click();
      (document.getElementById('btn-close-settings') as HTMLButtonElement)?.click();
    }

    if (!playerType || !mediaSrc) {
      reportMediaPlaybackIssue(mediaData, 'media_source_missing', {
        currentPlaylist: AMP_STATUS.playlist || '',
        currentCategory: AMP_STATUS.ctg,
      });
      return;
    }

    setupPlayer(playerType, mediaSrc, mediaData);
  }

  /**
   * Handle the player to prepare depending on the type of media to play.
   */
  function setupPlayer(type: string | null, src: string | null, mediaData: MediaItem): void {
    abortPlaybackTimers();
    // update media caption.
    updateMediaCaption(mediaData);

    switch (true) {
      case /^YouTube$/i.test(type || ''):
        AMP_STATUS.playertype = 'youtube';
        AMP_STATUS.yt_error = '';
        createYTPlayer(mediaData);
        break;
      case /^HTML$/i.test(type || ''):
        emitYouTubeSignal('inactive');
        const extension = getExt(src || '');
        if (/^(aac|midi?|mp3|m4a|ogg|opus|wav|weba|wma)$/i.test(extension)) {
          AMP_STATUS.playertype = 'audio';
          createPlayerTag('audio', mediaData);
        } else if (/^(avi|mpe?g|mp4|ogv|ts|webm|3g(p|2))$/i.test(extension)) {
          AMP_STATUS.playertype = 'video';
          createPlayerTag('video', mediaData);
        } else {
          AMP_STATUS.playertype = null;
          reportMediaPlaybackIssue(mediaData, 'unsupported_file_format', {
            src,
            extension,
          });
        }
        break;
      default:
        AMP_STATUS.playertype = null;
        emitYouTubeSignal('error', 'unsupported_player_specified');
        reportMediaPlaybackIssue(mediaData, 'unsupported_player_specified', {
          src,
          type,
        });
    }
  }

  /**
   * Event handler that is called when the YouTube player is ready to play.
   */
  function onPlayerReady(event: any): void {
    emitYouTubeSignal('player_ready');
    $EMBED_WRAPPER.classList.add('w-max', 'h-max');
    $EMBED_WRAPPER.classList.remove('w-full', 'h-0', 'opacity-0');

    const mediaData = (AMP_STATUS.media || [])
      .filter((item: MediaItem) => item.amId === AMP_STATUS.current)
      .shift();

    if (!mediaData) return;

    const youtubeURL = event.target.getVideoUrl();
    if (youtubeURL) {
      $BUTTON_WATCH_TY.href = youtubeURL;
    } else {
      $BUTTON_WATCH_TY.href = 'https://www.youtube.com/watch?v=' + mediaData.videoid;
    }

    setTimeout(() => {
      $BUTTON_WATCH_TY.removeAttribute('disabled');
      $OPTIONAL_CONTAINER.classList.remove('hidden', 'opacity-0');
    }, 500);

    if (getOption('autoplay')) {
      // Force play if playback does not start after (wait * 100) milliseconds.
      const wait = 15;
      let elapsed = 0;
      const intervalID = setInterval(() => {
        elapsed++;
        if (event.target.getPlayerState() === (window as any).YT.PlayerState.PLAYING) {
          clearInterval(intervalID);
          logger(`onPlayerReady::elapsed ${elapsed * 100}ms:`, 'Playback has started!');
        } else if (elapsed > wait) {
          (document.getElementById('btn-play') as HTMLButtonElement).dispatchEvent(new Event('click'));
          clearInterval(intervalID);
        }
      }, 100);
    }

    // Add since v1.2.0
    if (AMP_STATUS.fader && mediaData.hasOwnProperty('fadein') && mediaData.fadein !== '') {
      event.target.setVolume(0);
    } else {
      event.target.setVolume(normalizeVolume(AMP_STATUS.volume, getDefaultVolume()));
    }
    event.target.playVideo();
  }

  /**
   * Event handler called when the state of the YouTube player changes.
   */
  function onPlayerStateChange(event: any): void {
    const YT_ENDED = 0;
    const YT_PLAYING = 1;
    const YT_PAUSED = 2;

    if (event.data === YT_ENDED) {
      emitYouTubeSignal('ended');
      abortPlaybackTimers();

      $EMBED_WRAPPER.classList.add('w-full', 'h-0', 'opacity-0');
      $EMBED_WRAPPER.classList.remove('w-max', 'h-max');

      $BUTTON_WATCH_TY.href = '#';
      $BUTTON_WATCH_TY.setAttribute('disabled', '');
      $OPTIONAL_CONTAINER.classList.add('hidden', 'opacity-0');

      let nextId = 0;
      if (AMP_STATUS.loop) {
        nextId = AMP_STATUS.current || 0;
      } else {
        nextId = AMP_STATUS.next || 0;
      }

      const mediaData = (AMP_STATUS.media || [])
        .filter((item: MediaItem) => item.amId === nextId)
        .shift();

      if (!mediaData) return;

      let mediaSrc: string | null = null;
      let playerType: string | null = null;

      if (mediaData.hasOwnProperty('file') && mediaData.file !== '') {
        mediaSrc = mediaData.file ?? null;
        playerType = 'html';
        event.target.destroy?.();
      }

      if (mediaData.hasOwnProperty('videoid') && mediaData.videoid !== '') {
        mediaSrc = mediaData.videoid ?? null;
        playerType = 'youtube';
        event.target.g?.remove();
      }

      updatePlayStatus(nextId);
      setupPlayer(playerType, mediaSrc, mediaData);
    }

    if (event.data === YT_PAUSED) {
      emitYouTubeSignal('paused');
      // Toggle this button shown (Pause -> Play).
      $BUTTON_PAUSE.classList.add('hidden');
      $BUTTON_PLAY.classList.remove('hidden');
    }

    if (event.data === YT_PLAYING) {
      emitYouTubeSignal('playing');
      // Toggle this button shown (Play -> Pause).
      $BUTTON_PLAY.classList.add('hidden');
      $BUTTON_PAUSE.classList.remove('hidden');

      // Add since v1.2.0, fade-in by the fader option.
      if (AMP_STATUS.fader) {
        const currentMedia = (AMP_STATUS.media || [])
          .filter((item: MediaItem) => item.amId === AMP_STATUS.current)
          .shift();
        if (!currentMedia) return;

        if (currentMedia.hasOwnProperty('fadeout') && currentMedia.fadeout !== '') {
          const seekEnd =
            currentMedia.hasOwnProperty('end') && currentMedia.end !== ''
              ? parseFloat(String(currentMedia.end))
              : event.target.getDuration();
          event.target.setVolume(normalizeVolume(AMP_STATUS.volume, getDefaultVolume()));
          fadeOut(event.target, parseFloat(String(currentMedia.fadeout)), seekEnd);
        }

        if (currentMedia.hasOwnProperty('fadein') && currentMedia.fadein !== '') {
          const seekStart =
            currentMedia.hasOwnProperty('start') && currentMedia.start !== ''
              ? parseFloat(String(currentMedia.start))
              : 0;
          event.target.setVolume(0);
          fadeIn(event.target, parseFloat(String(currentMedia.fadein)), seekStart);
        }
      }
    }

    if (event.data === -1 && getOption('autoplay')) {
      emitYouTubeSignal('unstarted');
      // When playback unstarted.
      logger('onPlayerStateChange::unstarted.');
    }
  }

  /**
   * Event handler called when the YouTube player encounters an error.
   */
  function onPlayerError(event: any): void {
    emitYouTubeSignal('error', `yt_error_${event && event.data !== undefined ? event.data : 'unknown'}`);
    // Skip if media playback fails.
    $EMBED_WRAPPER.classList.add('w-full', 'h-0', 'opacity-0');
    $EMBED_WRAPPER.classList.remove('w-max', 'h-max');

    $BUTTON_WATCH_TY.href = '#';
    $BUTTON_WATCH_TY.setAttribute('disabled', '');
    $OPTIONAL_CONTAINER.classList.add('hidden', 'opacity-0');

    const nextId = AMP_STATUS.next;
    if (nextId === null) return;

    const mediaData = (AMP_STATUS.media || [])
      .filter((item: MediaItem) => item.amId === nextId)
      .shift();

    if (!mediaData) return;

    let mediaSrc: string | null = null;
    let playerType: string | null = null;

    if (mediaData.hasOwnProperty('file') && mediaData.file !== '') {
      mediaSrc = mediaData.file ?? null;
      playerType = 'html';
      event.target.destroy?.();
    }

    if (mediaData.hasOwnProperty('videoid') && mediaData.videoid !== '') {
      mediaSrc = mediaData.videoid ?? null;
      playerType = 'youtube';
      event.target.g?.remove();
      logger('error', 'onYTPlayerError:', event, 'force');
    }

    abortPlaybackTimers();
    updatePlayStatus(nextId);
    setupPlayer(playerType, mediaSrc, mediaData);
  }

  /**
   * Create a YouTube player.
   */
  function createYTPlayer(mediaData: MediaItem): void {
    emitYouTubeSignal('player_creating');
    const playerElm = document.createElement('div');
    playerElm.id = 'ytplayer';
    while ($EMBED_WRAPPER.firstChild) {
      $EMBED_WRAPPER.removeChild($EMBED_WRAPPER.firstChild);
    }
    $EMBED_WRAPPER.appendChild(playerElm);

    const playerOptions: any = {
      autoplay: 1,
      controls: 1,
      fs: 0,
      cc_load_policy: 0,
      rel: 0,
    };

    if (getOption('autoplay')) {
      playerOptions.autoplay = Number(getOption('autoplay'));
    }
    if (getOption('controls')) {
      playerOptions.controls = Number(getOption('controls'));
    }
    if (mediaData.hasOwnProperty('controls') && mediaData.controls !== '') {
      // Add since v1.2.0
      playerOptions.controls = Number(Boolean(mediaData.controls));
    }
    if (getOption('fs')) {
      playerOptions.fs = Number(getOption('fs'));
    }
    if (mediaData.hasOwnProperty('fs') && mediaData.fs !== '') {
      // Add since v1.2.0
      playerOptions.fs = Number(Boolean(mediaData.fs));
    }
    if (getOption('cc_load_policy')) {
      playerOptions.cc_load_policy = Number(getOption('cc_load_policy'));
    }
    if (mediaData.hasOwnProperty('cc') && mediaData.cc !== '') {
      // Add since v1.2.0
      playerOptions.cc_load_policy = Number(Boolean(mediaData.cc));
    }
    if (getOption('rel')) {
      playerOptions.rel = Number(getOption('rel'));
    }
    if (getOption('seek') && mediaData.hasOwnProperty('start') && mediaData.start !== '') {
      playerOptions.start = mediaData.start;
    }
    if (getOption('seek') && mediaData.hasOwnProperty('end') && mediaData.end !== '') {
      playerOptions.end = mediaData.end;
    }

    // Add since v1.2.0, the following fader option:
    if (getOption('fader')) {
      AMP_STATUS.fader = Boolean(getOption('fader'));
    } else {
      AMP_STATUS.fader = false;
    }

    if (
      mediaData.hasOwnProperty('volume') &&
      mediaData.volume !== undefined &&
      inRange(Number(mediaData.volume), 0, 100)
    ) {
      AMP_STATUS.volume = getPlaybackVolume(mediaData);
    } else {
      AMP_STATUS.volume = getDefaultVolume();
    }

    const adjustSize = getPlayerSizeForCurrentMode();

    player = new (window as any).YT.Player('ytplayer', {
      height: adjustSize.height,
      width: adjustSize.width,
      videoId: mediaData.videoid,
      playerVars: playerOptions,
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: onPlayerError,
      },
    });
    emitYouTubeSignal('player_created');
  }

  /**
   * Create a media playback player using HTML.
   */
  function createPlayerTag(tagname: 'audio' | 'video', mediaData: MediaItem): void {
    const playerElm = document.createElement(tagname) as HTMLMediaElement;
    const sourceElm = document.createElement('source');
    let hasReportedLoadIssue = false;
    playerElm.id = 'html-player';
    playerElm.setAttribute('controls', String(getOption('controls') || ''));
    playerElm.setAttribute('controlslist', 'nodownload');
    playerElm.setAttribute('autoplay', String(getOption('autoplay') || ''));

    // Add since v1.2.0, the following fader option:
    if (getOption('fader')) {
      AMP_STATUS.fader = Boolean(getOption('fader'));
    } else {
      AMP_STATUS.fader = false;
    }

    if (
      mediaData.hasOwnProperty('volume') &&
      mediaData.volume !== undefined &&
      inRange(Number(mediaData.volume), 0, 100)
    ) {
      AMP_STATUS.volume = getPlaybackVolume(mediaData);
    } else {
      AMP_STATUS.volume = getDefaultVolume();
    }

    if (AMP_STATUS.fader && mediaData.hasOwnProperty('fadein') && mediaData.fadein !== '') {
      playerElm.volume = 0;
    } else {
      playerElm.volume = normalizeVolume(AMP_STATUS.volume, getDefaultVolume()) / 100;
    }

    if (tagname === 'audio' && isObject(AMP_STATUS.options) && AMP_STATUS.options?.dark) {
      setStyles(playerElm, 'opacity: .7');
    }

    if (getOption('seek') && mediaData.hasOwnProperty('start') && mediaData.start !== '') {
      playerElm.currentTime = Number(mediaData.start);
    }

    const reportHtmlMediaLoadIssue = (
      mediaElement: HTMLMediaElement,
      mediaItem: MediaItem,
      evt: Event,
      reason: string
    ): void => {
      if (hasReportedLoadIssue) return;
      hasReportedLoadIssue = true;
      reportMediaPlaybackIssue(mediaItem, reason, {
        src: mediaElement.currentSrc || mediaItem.file || '',
        networkState: mediaElement.networkState,
        readyState: mediaElement.readyState,
        errorCode: mediaElement.error?.code ?? null,
        errorMessage: mediaElement.error?.message ?? '',
        eventType: evt.type,
      });
    };

    playerElm.addEventListener('play', (_evt: Event) => {
      if (
        getOption('seek') &&
        mediaData.hasOwnProperty('end') &&
        mediaData.end !== ''
      ) {
        // When the seek end time is reached, forcibly seeks to the end of the media and ends playback.
        if (!seekId) {
          seekId = setInterval(() => {
            if (playerElm.currentTime >= Number(mediaData.end)) {
              playerElm.currentTime = playerElm.duration;
              abortSeeking();
              abortFader('fadeout');
            }
          }, 500);
        }
      }
    });

    playerElm.addEventListener('playing', (_evt: Event) => {
      // Toggle this button shown (Play -> Pause).
      $BUTTON_PLAY.classList.add('hidden');
      $BUTTON_PAUSE.classList.remove('hidden');

      if (AMP_STATUS.fader) {
        if (mediaData.hasOwnProperty('fadeout') && mediaData.fadeout !== '') {
          const seekEnd =
            mediaData.hasOwnProperty('end') && mediaData.end !== ''
              ? parseFloat(String(mediaData.end))
              : playerElm.duration;
          playerElm.volume = normalizeVolume(AMP_STATUS.volume, getDefaultVolume()) / 100;
          fadeOut(playerElm, parseFloat(String(mediaData.fadeout)), seekEnd);
        }

        if (mediaData.hasOwnProperty('fadein') && mediaData.fadein !== '') {
          const seekStart =
            mediaData.hasOwnProperty('start') && mediaData.start !== ''
              ? parseFloat(String(mediaData.start))
              : 0;
          playerElm.volume = 0;
          fadeIn(playerElm, parseFloat(String(mediaData.fadein)), seekStart);
        }
      }
    });

    playerElm.addEventListener('pause', (_evt: Event) => {
      // Toggle this button shown (Pause -> Play).
      $BUTTON_PAUSE.classList.add('hidden');
      $BUTTON_PLAY.classList.remove('hidden');
    });

    playerElm.addEventListener('volumechange', (_evt: Event) => {
      logger('playerVolumeChange:', playerElm.volume, AMP_STATUS.volume);
    });

    playerElm.addEventListener('ended', (_evt: Event) => {
      abortPlaybackTimers();
      $EMBED_WRAPPER.classList.remove('max-w-2xl', 'w-max', 'h-max', 'border-0');

      // add since v1.2.2
      let nextId = 0;
      if (AMP_STATUS.loop) {
        nextId = AMP_STATUS.current || 0;
      } else {
        nextId = AMP_STATUS.next || 0;
        logger('ended:', AMP_STATUS, nextId);
      }

      const mediaData = (AMP_STATUS.media || [])
        .filter((item: MediaItem) => item.amId === nextId)
        .shift();

      if (!mediaData) return;

      let mediaSrc: string | null = null;
      let playerType: string | null = null;

      if (mediaData.hasOwnProperty('file') && mediaData.file !== '') {
        mediaSrc = mediaData.file ?? null;
        playerType = 'html';
      }

      if (mediaData.hasOwnProperty('videoid') && mediaData.videoid !== '') {
        mediaSrc = mediaData.videoid ?? null;
        playerType = 'youtube';
        playerElm.remove();
      }

      updatePlayStatus(nextId);
      setupPlayer(playerType, mediaSrc, mediaData);
    });

    playerElm.addEventListener('error', (evt: Event) => {
      reportHtmlMediaLoadIssue(playerElm, mediaData, evt, 'player_error');
    });

    playerElm.addEventListener('loadstart', (evt: Event) => {
      setTimeout(() => {
        const target = evt.target as HTMLMediaElement;
        if (target.readyState === 0 && (target.networkState === 3 || target.error)) {
          reportHtmlMediaLoadIssue(target, mediaData, evt, 'load_timeout');
        }
      }, 5000);
    });

    const sourcePath = resolveLocalMediaSrc(mediaData.file || '');
    sourceElm.src = sourcePath;
    sourceElm.setAttribute('type', getMediaMimeType(sourcePath, tagname));
    sourceElm.addEventListener('error', (evt: Event) => {
      reportHtmlMediaLoadIssue(playerElm, mediaData, evt, 'source_error');
    });
    playerElm.appendChild(sourceElm);

    while ($EMBED_WRAPPER.firstChild) {
      $EMBED_WRAPPER.removeChild($EMBED_WRAPPER.firstChild);
    }
    $EMBED_WRAPPER.appendChild(playerElm);

    $EMBED_WRAPPER.classList.add('max-w-2xl', 'w-max', 'h-max', 'border-0');
    $EMBED_WRAPPER.classList.remove('border', 'w-full', 'h-0', 'opacity-0');

    $BUTTON_WATCH_TY.href = '#';
    $BUTTON_WATCH_TY.setAttribute('disabled', '');
    $OPTIONAL_CONTAINER.classList.add('hidden', 'opacity-0');

    playerElm.addEventListener('loadedmetadata', (evt: Event) => {
      const self = evt.target as HTMLVideoElement;
      if (self.tagName === 'VIDEO') {
        if (!self.videoHeight || !self.videoWidth) {
          self.setAttribute('poster', './views/images/no-media-placeholder.svg');
        }
        if (isFullWindowMode()) {
          const adjustSize = getFullWindowPlayerSize();
          applyHtmlPlayerSize(self, adjustSize);
        } else if (currentWindowSize.width >= 640) {
          applyHtmlPlayerSize(self, {
            width: 640,
            height: Math.floor((640 * self.videoHeight) / self.videoWidth),
          });
        } else {
          applyHtmlPlayerSize(self, {
            width: currentWindowSize.width - 2,
            height: Math.floor(((currentWindowSize.width - 2) * self.videoHeight) / self.videoWidth),
          });
        }
      }
    });

    // Add since v1.2.2
    let allowFullScreen = Boolean(getOption('fs'));
    if (mediaData.hasOwnProperty('fs') && mediaData.fs !== '') {
      allowFullScreen = Boolean(mediaData.fs);
    }

    if (allowFullScreen) {
      playerElm.addEventListener('click', (evt: Event) => {
        const target = evt.target as HTMLMediaElement;
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          target.requestFullscreen?.();
        }
        setTimeout(() => {
          if (playerElm.paused) {
            playerElm.play();
          }
        }, 10);
      });
    }
  }

  /**
   * Fade in the volume of the specified media.
   */
  function fadeIn(media: any, period: number, start: number): void {
    abortFader('fadein');
    const mediaType = isElement(media) ? 'local' : 'youtube';
    const fadeEnd = (start + period) * 1000; // unit milliseconds
    const steps = period * 10;
    const stepVolume = normalizeVolume(AMP_STATUS.volume, getDefaultVolume()) / steps;

    logger(
      'fadeIn::',
      mediaType === 'youtube' ? media.getDuration() : media.duration,
      mediaType === 'youtube' ? media.getVolume() : media.volume,
      period,
      start,
      fadeEnd,
      steps,
      stepVolume,
      AMP_STATUS.volume
    );

    let elapsed = 0;
    let incrementVolume = 0;

    fadeinId = setInterval(() => {
      const currentTime = (mediaType === 'youtube' ? media.getCurrentTime() : media.currentTime) * 1000; // unit milliseconds

      if (inRange(currentTime, start * 1000, fadeEnd)) {
        elapsed = Math.floor((currentTime - start * 1000) / 100);
        incrementVolume = elapsed > 0 ? (stepVolume * elapsed * elapsed) / steps : 0;

        if (mediaType === 'youtube') {
          media.setVolume(incrementVolume);
        } else {
          media.volume = incrementVolume / 100;
        }
      } else if (currentTime >= fadeEnd) {
        if (mediaType === 'youtube') {
          media.setVolume(normalizeVolume(AMP_STATUS.volume, getDefaultVolume()));
        }
        abortFader('fadein');
      } else {
        if (mediaType === 'youtube') {
          media.setVolume(0);
        } else {
          media.volume = 0;
        }
      }

      logger(
        `fadeIn:: ${currentTime}ms from ${start}; elapsed: ${elapsed}`,
        incrementVolume,
        mediaType === 'youtube' ? media.getVolume() : media.volume
      );
    }, 100);
  }

  /**
   * Fade out the volume of the specified media.
   */
  function fadeOut(media: any, period: number, end: number): void {
    abortFader('fadeout');
    const mediaType = isElement(media) ? 'local' : 'youtube';
    const fadeStart = (end - period) * 1000; // unit milliseconds
    const steps = period * 10;
    const stepVolume = ((mediaType === 'youtube' ? AMP_STATUS.volume : media.volume * 100) || 100) / steps;

    logger(
      'fadeOut::',
      mediaType === 'youtube' ? media.getDuration() : media.duration,
      mediaType === 'youtube' ? media.getVolume() : media.volume,
      period,
      end,
      fadeStart,
      steps,
      stepVolume,
      AMP_STATUS.volume
    );

    let elapsed = 0;
    let decrementVolume = 0;

    fadeoutId = setInterval(() => {
      const currentTime = (mediaType === 'youtube' ? media.getCurrentTime() : media.currentTime) * 1000; // unit milliseconds

      if (inRange(currentTime, fadeStart, end * 1000)) {
        elapsed = Math.floor((end * 1000 - currentTime) / 100);
        decrementVolume = elapsed > 0 ? stepVolume * elapsed : 0;

        if (mediaType === 'youtube') {
          media.setVolume(decrementVolume);
        } else {
          media.volume = decrementVolume / 100;
        }

        logger(
          `fadeOut:: ${currentTime}ms until ${end * 1000}ms; elapsed: ${elapsed}`,
          decrementVolume,
          mediaType === 'youtube' ? media.getVolume() : media.volume
        );
      } else if (currentTime < fadeStart) {
        // continue
      } else {
        if (mediaType === 'youtube') {
          media.setVolume(0);
          abortFader('fadeout');
          logger([media]);
        } else {
          media.volume = 0;
          abortFader('fadeout');
          media.dispatchEvent(new Event('ended'));
        }
      }
    }, 100);
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Restart this application.
   */
  function reloadPage(): void {
    window.location.reload();
  }

  /**
   * Toggle the display of backdrop for drawer or modal.
   */
  watcher([$DRAWER_PLAYLIST, $DRAWER_SETTINGS, $MODAL_OPTIONS], (mutation: MutationRecord) => {
    if (mutation.attributeName === 'aria-modal' && (mutation.target as HTMLElement).ariaModal === 'true') {
      const $DRAWER_BACKDROP = Array.from(document.querySelectorAll('div[drawer-backdrop]'));
      const $MODAL_BACKDROP = document.querySelector('div[modal-backdrop]');

      if ($DRAWER_BACKDROP.length > 0) {
        $DRAWER_BACKDROP.forEach((elm: Element) => {
          if (currentWindowSize.width >= currentWindowSize.minFullUIWidth) {
            (elm as HTMLElement).classList.add('hidden');
          } else {
            (elm as HTMLElement).classList.remove('hidden');
          }
        });
      }

      if (isElement($MODAL_BACKDROP)) {
        if (currentWindowSize.width >= currentWindowSize.minFullUIWidth) {
          ($MODAL_BACKDROP as HTMLElement).classList.remove('z-40');
          ($MODAL_BACKDROP as HTMLElement).classList.add('z-[59]');
        } else {
          ($MODAL_BACKDROP as HTMLElement).classList.remove('z-[59]');
          ($MODAL_BACKDROP as HTMLElement).classList.add('z-40');
        }
      }
    }
  });

  /**
   * Event handler when the window size is resized.
   */
  function updateWindowSize(): void {
    currentWindowSize.width = getViewportWidth();
    currentWindowSize.height = getViewportHeight();
    document.documentElement.style.setProperty('--amp-bottom-menu-height', `${getBottomMenuHeight()}px`);
    const isFullWindow = isFullWindowMode();

    const adjustPlayerSize = getPlayerSizeForCurrentMode();

    if (player && typeof player === 'object' && typeof player.getIframe === 'function') {
      const YTPlayer = player.getIframe();
      YTPlayer.width = String(adjustPlayerSize.width);
      YTPlayer.height = String(adjustPlayerSize.height);
    }

    const $HTMLPlayer = document.getElementById('html-player') as HTMLVideoElement;
    if (isElement($HTMLPlayer)) {
      if ($HTMLPlayer.tagName === 'VIDEO') {
        applyHtmlPlayerSize($HTMLPlayer, adjustPlayerSize);
      }
    }

    if (isFullWindow) {
      return;
    }

    const shownLeftDrawer = getAtts($DRAWER_PLAYLIST, 'aria-modal') || false;
    const shownRightDrawer = getAtts($DRAWER_SETTINGS, 'aria-modal') || false;

    if (currentWindowSize.width < currentWindowSize.minFullUIWidth) {
      if (shownLeftDrawer) {
        (document.getElementById('btn-close-playlist') as HTMLButtonElement)?.click();
        $BUTTON_PLAYLIST.setAttribute('data-drawer-backdrop', 'true');
      }
      if (shownRightDrawer) {
        (document.getElementById('btn-close-settings') as HTMLButtonElement)?.click();
        $BUTTON_SETTINGS.setAttribute('data-drawer-backdrop', 'true');
      }
    } else {
      if (!shownLeftDrawer) {
        $BUTTON_PLAYLIST.setAttribute('data-drawer-backdrop', 'false');
        $BUTTON_PLAYLIST.click();
      }
      if (!shownRightDrawer) {
        $BUTTON_SETTINGS.setAttribute('data-drawer-backdrop', 'false');
        $BUTTON_SETTINGS.click();
      }
    }

    toggleMarqueeCaption();
  }

  /**
   * Window resize event listener with throttling.
   */
  const resize = (): void => {
    let timeoutID = 0;
    const delay = 300;
    window.addEventListener(
      'resize',
      () => {
        clearTimeout(timeoutID);
        timeoutID = window.setTimeout(() => {
          syncViewportMetrics();
          updateWindowSize();
        }, delay);
      },
      false
    );
    window.addEventListener('orientationchange', () => {
      refreshViewportMetricsAfter(80);
      refreshViewportMetricsAfter(420);
    });
    window.visualViewport?.addEventListener('resize', () => {
      scheduleViewportMetricsSync(60);
    });
    window.visualViewport?.addEventListener('scroll', () => {
      scheduleViewportMetricsSync(60);
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        scheduleViewportMetricsSync(80);
      }
    });
  };

  setMenuMinimized(false);

  syncViewportMetrics();
  resize();

  window.dispatchEvent(new Event('resize', { bubbles: true, cancelable: false }));

  // ============================================================================
  // MANAGEMENT FORMS (Media Management & Playlist Management)
  // ============================================================================

  const $MEDIA_MANAGE_FORM = document.querySelector('form[name="mediaManagement"]') as HTMLFormElement | null;
  const $MEDIA_MANAGE_ELMS: HTMLElement[] = $MEDIA_MANAGE_FORM
    ? (Array.from($MEDIA_MANAGE_FORM.elements) as HTMLElement[])
    : [];
  const $PLAYLIST_MANAGE_FORM = document.querySelector('form[name="playlistManagement"]') as HTMLFormElement | null;
  const $PLAYLIST_MANAGE_ELMS: HTMLElement[] = $PLAYLIST_MANAGE_FORM
    ? (Array.from($PLAYLIST_MANAGE_FORM.elements) as HTMLElement[])
    : [];

  async function getRelativeFilepath(basefile: string): Promise<boolean> {
    const endpointURL = `${BASE_URL}filepath/${encodeURIComponent(basefile)}`;
    const $LABEL_MEDIA_FILE = document.getElementById('note-error-local-media-file');
    const $HIDDEN_FILEPATH = document.getElementById('local-media-filepath') as HTMLInputElement | null;
    const response = await fetchData(endpointURL) as any;
    if (response && response.code == 200) {
      if ($HIDDEN_FILEPATH) $HIDDEN_FILEPATH.value = decodeURIComponent(response.data);
      if ($LABEL_MEDIA_FILE) $LABEL_MEDIA_FILE.textContent = getAtts($LABEL_MEDIA_FILE as HTMLElement, 'data-default-message');
    } else {
      if ($HIDDEN_FILEPATH) $HIDDEN_FILEPATH.value = '';
      if ($LABEL_MEDIA_FILE) $LABEL_MEDIA_FILE.textContent = response?.data || '';
    }
    logger('getRelativeFilepath:', endpointURL, response);
    return response && response.code == 200;
  }

  function resetMediaManageForm(): void {
    if (!$MEDIA_MANAGE_FORM) return;
    $MEDIA_MANAGE_FORM.reset();
    $MEDIA_MANAGE_ELMS.forEach((child: HTMLElement) => {
      let event: string | null = null;
      if (/^input$/i.test(child.nodeName)) {
        const input = child as HTMLInputElement;
        switch (input.type) {
          case 'text':
            event = 'input';
            break;
          case 'radio':
            input.checked = input.value === (AMP_STATUS.addtype || 'youtube');
            break;
          case 'file':
            event = 'change';
            break;
          default:
            break;
        }
      } else if (/^textarea$/i.test(child.nodeName)) {
        event = 'input';
      } else if (/^select$/i.test(child.nodeName)) {
        (child as HTMLSelectElement).selectedIndex = 0;
        event = 'change';
      }
      if (event) {
        child.dispatchEvent(new Event(event));
      }
    });
    syncMediaVolumeField();
  }

  function addMediaData(payload: [string, string][]): boolean {
    logger('addMediaData::before:', payload, AMP_STATUS.media?.length);

    // --- Auto-playlist: if no playlist is currently selected, use/create MyPlaylist ---
    if (!AMP_STATUS.playlist) {
      AMP_STATUS.playlist = MYPLAYLIST_NAME;
      // Add MyPlaylist option to the dropdown if not present
      if ($SELECT_PLAYLIST) {
        const alreadyExists = Array.from($SELECT_PLAYLIST.options).some(
          (opt) => opt.value === MYPLAYLIST_NAME
        );
        if (!alreadyExists) {
          const opt = document.createElement('option');
          opt.value = MYPLAYLIST_NAME;
          opt.textContent = MYPLAYLIST_NAME.replace('.json', '');
          $SELECT_PLAYLIST.appendChild(opt);
        }
        // Switch the dropdown to MyPlaylist
        for (let i = 0; i < $SELECT_PLAYLIST.options.length; i++) {
          if ($SELECT_PLAYLIST.options[i]?.value === MYPLAYLIST_NAME) {
            $SELECT_PLAYLIST.selectedIndex = i;
            break;
          }
        }
      }
    }

    const mediaData: MediaItem = {
      amId: 0,
      catId: 0,
      title: '',
      artist: '',
      desc: '',
      file: '',
      videoid: '',
      volume: 50,
      start: '',
      end: '',
    };
    let categoryValue = '';
    for (const [key, val] of payload) {
      switch (key) {
        case 'youtube_videoid':
          mediaData.videoid = val;
          break;
        case 'media_filepath':
          mediaData.file = val;
          break;
        case 'category':
          categoryValue = val;
          if (val === '') {
            // Auto-create 'New Category' if no category selected
            const AUTO_CATEGORY = 'New Category';
            if (!Array.isArray(AMP_STATUS.category)) AMP_STATUS.category = [];
            let autoIdx = AMP_STATUS.category.indexOf(AUTO_CATEGORY);
            if (autoIdx === -1) {
              AMP_STATUS.category.push(AUTO_CATEGORY);
              autoIdx = AMP_STATUS.category.length - 1;
            }
            mediaData.catId = autoIdx;
          } else {
            mediaData.catId = Number(val);
          }
          break;
        case 'category_new_name': {
          // Text input is shown when no categories exist; value is a new category name
          const newCatName = sanitizeMediaText(val || '', MEDIA_TITLE_MAX_LENGTH) || 'New Category';
          if (!Array.isArray(AMP_STATUS.category)) AMP_STATUS.category = [];
          let newCatIdx = AMP_STATUS.category.indexOf(newCatName);
          if (newCatIdx === -1) {
            AMP_STATUS.category.push(newCatName);
            newCatIdx = AMP_STATUS.category.length - 1;
          }
          mediaData.catId = newCatIdx;
          categoryValue = String(newCatIdx); // mark as handled
          break;
        }
        case 'title':
          mediaData.title = sanitizeMediaText(val, MEDIA_TITLE_MAX_LENGTH);
          break;
        case 'artist':
          mediaData.artist = sanitizeMediaText(val, MEDIA_ARTIST_MAX_LENGTH);
          break;
        case 'desc':
          mediaData.desc = sanitizeMediaDesc(val, MEDIA_DESC_MAX_LENGTH);
          break;
        case 'volume': {
          const numVolume = Number(val);
          if (Number.isInteger(numVolume) && inRange(numVolume, 0, 100)) {
            mediaData.volume = numVolume;
          }
          break;
        }
        case 'start':
        case 'end':
          if (val.indexOf(':') !== -1) {
            const times = val.split(':');
            let hours = 0, minutes = 0, seconds = 0;
            if (times.length === 3) {
              hours   = parseInt(times[0] ?? '0', 10);
              minutes = parseInt(times[1] ?? '0', 10);
              seconds = parseInt(times[2] ?? '0', 10);
            } else if (times.length === 2) {
              minutes = parseInt(times[0] ?? '0', 10);
              seconds = parseInt(times[1] ?? '0', 10);
            } else {
              seconds = parseInt(times[times.length - 1] ?? '0', 10);
            }
            (mediaData as any)[key] = (hours * 60 * 60) + (minutes * 60) + seconds;
          } else if (!Number.isInteger(Number(val))) {
            (mediaData as any)[key] = '';
          } else {
            (mediaData as any)[key] = val;
          }
          break;
        default:
          break;
      }
    }
    // If category was empty and still not set (payload had no 'category' key), auto-create
    if (categoryValue === '' && !payload.some(([k]) => k === 'category')) {
      const AUTO_CATEGORY = 'New Category';
      if (!Array.isArray(AMP_STATUS.category)) AMP_STATUS.category = [];
      let autoIdx = AMP_STATUS.category.indexOf(AUTO_CATEGORY);
      if (autoIdx === -1) {
        AMP_STATUS.category.push(AUTO_CATEGORY);
        autoIdx = AMP_STATUS.category.length - 1;
      }
      mediaData.catId = autoIdx;
    }
    if (!Array.isArray(AMP_STATUS.media)) {
      AMP_STATUS.media = [mediaData];
    } else {
      const lastAmId = Math.max(...AMP_STATUS.media.map((item: MediaItem) => item.amId));
      mediaData.amId = lastAmId + 1;
      AMP_STATUS.media.push(mediaData);
    }
    logger('addMediaData::after:', AMP_STATUS.media.length);
    return true;
  }

  function generatePlaylistJson(seekFormat: boolean): string {
    const convertHMS = (value: string | number | undefined): string => {
      if (value === '' || value === undefined || Number(value) === 0) return '';
      const totalSeconds = Number(value);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const remainingSeconds = totalSeconds % 60;
      if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
      } else if (minutes > 0) {
        return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
      } else if (remainingSeconds > 0) {
        return String(remainingSeconds);
      }
      return '';
    };
    const newPlaylist: Record<string, any> = {};
    (AMP_STATUS.media || []).forEach((item: MediaItem) => {
      const belongCategory = (AMP_STATUS.category || [])[item.catId] || '';
      const oneData = {
        file:    (item.file || '').replace('./assets/media/', ''),
        title:   item.title,
        desc:    item.desc,
        artist:  item.artist,
        videoid: item.videoid,
        image:   item.image,
        start:   seekFormat ? convertHMS(item.start) : item.start,
        end:     seekFormat ? convertHMS(item.end) : item.end,
      };
      if (!Object.prototype.hasOwnProperty.call(newPlaylist, belongCategory)) {
        newPlaylist[belongCategory] = [];
      }
      newPlaylist[belongCategory].push(oneData);
    });
    newPlaylist['options'] = sanitizeMyPlaylistOptions(AMP_STATUS.options);
    logger('generatePlaylistJson::after:', newPlaylist);
    return JSON.stringify(newPlaylist, null, 2);
  }

  function resetPlaylistManageForm(): void {
    if (!$PLAYLIST_MANAGE_FORM) return;
    $PLAYLIST_MANAGE_FORM.reset();
    $PLAYLIST_MANAGE_ELMS.forEach((child: HTMLElement) => {
      let event: string | null = null;
      if (/^input$/i.test(child.nodeName)) {
        const input = child as HTMLInputElement;
        switch (input.type) {
          case 'text':
            event = 'input';
            break;
          case 'checkbox':
            input.checked = false;
            break;
          default:
            break;
        }
      }
      if (event) {
        logger('resetPlaylistManageForm:', child, event);
        child.dispatchEvent(new Event(event));
      }
    });
  }

  if ($MEDIA_MANAGE_FORM) {
    $MEDIA_MANAGE_ELMS.forEach((elm: HTMLElement) => {
      const $MEDIA_URL_FIELD   = document.getElementById('media-management-field-media-url');
      const $MEDIA_FILES_FIELD = document.getElementById('media-management-field-media-files');
      const $INPUT_VIDEOID     = document.getElementById('youtube-videoid') as HTMLInputElement | null;
      const $INPUT_FILEPATH    = document.getElementById('local-media-filepath') as HTMLInputElement | null;
      const $INPUT_MEDIA_TITLE = document.getElementById('media-title') as HTMLInputElement | null;
      const elmName = (elm as HTMLInputElement).name;

      switch (elmName) {
        case 'media_type':
          elm.addEventListener('click', (evt: Event) => {
            const target = evt.target as HTMLInputElement;
            const prevType = AMP_STATUS.addtype ?? null;
            if (target.value === 'youtube') {
              if ($MEDIA_URL_FIELD)   toggleClass($MEDIA_URL_FIELD,   { hidden: false });
              if ($MEDIA_FILES_FIELD) toggleClass($MEDIA_FILES_FIELD, { hidden: true  });
            } else {
              if ($MEDIA_URL_FIELD)   toggleClass($MEDIA_URL_FIELD,   { hidden: true  });
              if ($MEDIA_FILES_FIELD) toggleClass($MEDIA_FILES_FIELD, { hidden: false });
            }
            AMP_STATUS.addtype = target.value;
            if (prevType !== target.value) {
              resetMediaManageForm();
            }
          });
          break;
        case 'youtube_url':
          elm.addEventListener('input', (evt: Event) => {
            const target = evt.target as HTMLInputElement;
            const value = target.value;
            const minLength = 'youtube.com/watch?v=.'.length;
            if (value.length < minLength) {
              setValidated(elm, null);
              if ($INPUT_VIDEOID) $INPUT_VIDEOID.value = '';
              return;
            }
            try {
              // Accept URLs with or without subdomain (www, music, etc.)
              // and with or without https:// prefix.
              if (!/^(https?:\/\/|)([a-z0-9-]+\.)?youtube\.com/.test(value)) {
                throw new Error('Invalid URL.');
              }
              // Normalize to absolute URL for URL parsing
              const normalizedValue = /^https?:\/\//.test(value)
                ? value
                : 'https://' + value;
              const url = new URL(normalizedValue);
              const params = url.searchParams;
              const videoid = params.get('v');
              if (!url.hostname.endsWith('youtube.com') || videoid === null || videoid === '') {
                throw new Error('Invalid URL.');
              } else {
                if (/^https?:\/\//.test(value)) {
                  target.value = url.hostname + url.pathname + '?v=' + videoid;
                }
                setValidated(elm, true);
                if ($INPUT_VIDEOID) $INPUT_VIDEOID.value = videoid;
              }
            } catch (err) {
              logger('error', err, 'force');
              setValidated(elm, false);
            }
          });
          break;
        case 'local_media_file':
          elm.addEventListener('change', async (evt: Event) => {
            const target = evt.target as HTMLInputElement;
            const filelist = target.files;
            logger('local_file:', filelist, [target]);
            if (filelist && filelist.length > 0 && (filelist[0]?.size ?? 0) > 0) {
              const filename = filelist[0]?.name ?? '';
              setValidated(elm, await getRelativeFilepath(filename));
              if ($INPUT_MEDIA_TITLE) {
                $INPUT_MEDIA_TITLE.value = basename(filename);
                target.blur();
                $INPUT_MEDIA_TITLE.dispatchEvent(new Event('change'));
              }
            } else {
              if ($INPUT_FILEPATH) $INPUT_FILEPATH.value = '';
              if ($INPUT_MEDIA_TITLE) $INPUT_MEDIA_TITLE.value = '';
              setValidated(elm, null);
              if ($INPUT_MEDIA_TITLE) setValidated($INPUT_MEDIA_TITLE, null);
            }
          });
          break;
        case 'media_filepath':
          elm.addEventListener('change', (evt: Event) => {
            (evt.target as HTMLElement).focus();
          });
          break;
        case 'category':
          elm.addEventListener('change', (evt: Event) => {
            const target = evt.target as HTMLSelectElement;
            setValidated(elm, target.value !== '');
          });
          break;
        case 'category_new_name':
          elm.addEventListener('input', (evt: Event) => {
            const target = evt.target as HTMLInputElement;
            target.value = sanitizeMediaText(target.value, MEDIA_TITLE_MAX_LENGTH);
            const isEmpty = target.value.trim() === '';
            if (isEmpty) {
              setValidated(elm, null);
            } else {
              setValidated(elm, true);
            }
          });
          elm.addEventListener('change', (evt: Event) => {
            const target = evt.target as HTMLInputElement;
            target.value = sanitizeMediaText(target.value, MEDIA_TITLE_MAX_LENGTH);
            setValidated(elm, target.value.trim() !== '');
          });
          break;
        case 'title':
          elm.addEventListener('input', (evt: Event) => {
            const target = evt.target as HTMLInputElement;
            target.value = sanitizeMediaText(target.value, MEDIA_TITLE_MAX_LENGTH);
            const value = target.value.trim();
            setValidated(elm, value === '' ? null : true);
          });
          elm.addEventListener('change', (evt: Event) => {
            const target = evt.target as HTMLInputElement;
            target.value = sanitizeMediaText(target.value, MEDIA_TITLE_MAX_LENGTH);
            setValidated(elm, target.value.trim() !== '');
          });
          break;
        case 'artist':
          elm.addEventListener('input', (evt: Event) => {
            const target = evt.target as HTMLInputElement;
            target.value = sanitizeMediaText(target.value, MEDIA_ARTIST_MAX_LENGTH);
          });
          elm.addEventListener('change', (evt: Event) => {
            const target = evt.target as HTMLInputElement;
            target.value = sanitizeMediaText(target.value, MEDIA_ARTIST_MAX_LENGTH);
          });
          break;
        case 'desc':
          elm.addEventListener('input', (evt: Event) => {
            const target = evt.target as HTMLInputElement;
            target.value = sanitizeMediaDescInput(target.value, MEDIA_DESC_MAX_LENGTH);
          });
          elm.addEventListener('change', (evt: Event) => {
            const target = evt.target as HTMLInputElement;
            target.value = sanitizeMediaDescInput(target.value, MEDIA_DESC_MAX_LENGTH);
          });
          break;
        case 'volume':
          elm.addEventListener('input', (evt: Event) => {
            const target = evt.target as HTMLInputElement;
            const currentVolume = normalizeVolume(target.value, getDefaultVolume());
            target.value = String(currentVolume);
            syncRangeProgress(target);
            const $VOLUME_VALUE = document.getElementById('default-media-volume');
            if ($VOLUME_VALUE) $VOLUME_VALUE.textContent = String(currentVolume);
          });
          break;
        case 'start':
        case 'end':
          elm.addEventListener('input', (evt: Event) => {
            if ((evt.target as HTMLInputElement).value === '') {
              setValidated(elm, null);
            }
          });
          elm.addEventListener('change', (evt: Event) => {
            const value = (evt.target as HTMLInputElement).value;
            if (value === '') {
              setValidated(elm, null);
            } else {
              const isValid = /^\d+$/.test(value) ||
                (value.indexOf(':') > 0 && /^(\d+:)?([0-5]?[0-9]:)?[0-5]?[0-9]$/.test(value));
              logger(value, isValid);
              setValidated(elm, isValid);
            }
          });
          break;
        case 'fadein':
        case 'fadeout':
          break;
        case 'add_media':
          elm.addEventListener('click', (_evt: Event) => {
            if (!$MEDIA_MANAGE_FORM) return;
            const formData = new FormData($MEDIA_MANAGE_FORM);
            const categoryField = $MEDIA_CATEGORY_SELECT.classList.contains('hidden')
              ? 'media-category-new'
              : 'media-category';
            const preferredCategoryValue = String(formData.get(categoryField) || '').trim();
            const result = addMediaData(Array.from(formData.entries()) as [string, string][]);
            logger(result, AMP_STATUS.media);
            let persisted = true;
            updatePlaylist();
            resetMediaManageForm();
            // Refresh category select/input after adding media (new categories may have been created)
            clearCategory();
            updateCategory();
            if (preferredCategoryValue !== '') {
              const numericPreferredCategory = Number(preferredCategoryValue);
              syncMediaCategoryField(Number.isNaN(numericPreferredCategory) ? null : numericPreferredCategory);
            }
            // Recalculate carousel sequence so next/prev works after additional items are added.
            if (AMP_STATUS.current !== null) {
              updatePlayStatus(AMP_STATUS.current);
            } else if ((AMP_STATUS.media || []).length > 0) {
              updatePlayStatus((AMP_STATUS.media || [])[0]?.amId ?? 0);
            }
            if (result) {
              // Persist cloud MyPlaylist changes immediately and close modal.
              persisted = persistMyPlaylistIfNeeded();
              if (persisted) {
                hideOptionsModal();
              }
            }
            updateNotice({
              type: result && persisted ? 'success' : 'error',
              message: result && persisted
                ? (elm as HTMLElement).dataset['messageSuccess'] || ''
                : (elm as HTMLElement).dataset['messageFailure'] || '',
              delay: 2400,
            });
          });
          break;
        default:
          logger('Event undefined element:', elmName, elm);
          break;
      }
    });

    watcher($MEDIA_MANAGE_FORM, (mutation: MutationRecord) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-validate') {
        if (!$MEDIA_MANAGE_FORM) return;
        const formData = new FormData($MEDIA_MANAGE_FORM);
        const mediaType = formData.get('media_type') as string;
        const valid_items: string[] = [];
        if (getAtts(mutation.target as HTMLElement, 'data-validate')) {
          $MEDIA_MANAGE_ELMS.forEach((elm: HTMLElement) => {
            if (getAtts(elm, 'data-validate')) valid_items.push(elm.id);
          });
        }
        const $BUTTON_ADD_MEDIA = document.getElementById('btn-add-media');
        const categoryField = $MEDIA_CATEGORY_SELECT.classList.contains('hidden')
          ? 'media-category-new'
          : 'media-category';
        const contains = [mediaType === 'youtube' ? 'youtube-url' : 'local-media-file', categoryField, 'media-title'];
        const isContainAll = inArray(contains, valid_items, false);
        logger(`Check valid items for "${mediaType}":`, valid_items, contains, isContainAll);
        if ($BUTTON_ADD_MEDIA) setAtts($BUTTON_ADD_MEDIA, { disabled: '' }, isContainAll);
      }
    }, { childList: true, attributes: true, subtree: true });
  }

  if ($PLAYLIST_MANAGE_FORM) {
    $PLAYLIST_MANAGE_ELMS.forEach((elm: HTMLElement) => {
      const elmName = (elm as HTMLInputElement).name;

      switch (elmName) {
        case 'local_media_dir':
        case 'symlink_name':
        case 'category_name':
          elm.addEventListener('input', (evt: Event) => {
            if ((evt.target as HTMLInputElement).value === '') {
              setValidated(elm, null);
            }
          });
          elm.addEventListener('change', (evt: Event) => {
            setValidated(elm, (evt.target as HTMLInputElement).value !== '');
          });
          break;
        case 'create_symlink':
        case 'create_category':
        case 'download_playlist': {
          const callback = {
            getFormData(oneData: string | null = null): any {
              if (!$PLAYLIST_MANAGE_FORM) return null;
              const formData = new FormData($PLAYLIST_MANAGE_FORM);
              return oneData ? formData.get(oneData) : Array.from(formData.entries());
            },
            async createSymlink(): Promise<void> {
              const endpointURL = `${BASE_URL}symlink`;
              const payload: Record<string, string> = {};
              for (const pair of this.getFormData()) {
                if (inArray(pair[0], ['local_media_dir', 'symlink_name'])) {
                  payload[pair[0]] = pair[1];
                }
              }
              const response = await fetchData(endpointURL, 'post', payload) as any;
              logger('createSymlink:', endpointURL, payload, response);
              updateNotice({
                type: response?.state === 'ok' ? 'success' : 'error',
                message: response?.data || '',
                delay: 2000,
              });
            },
            createCategory(): void {
              const selfElm = document.getElementById('btn-create-category');
              try {
              const categoryName = this.getFormData('category_name') as string;
              if (!Array.isArray(AMP_STATUS.category)) AMP_STATUS.category = [];
              if (!inArray(categoryName, AMP_STATUS.category)) {
                AMP_STATUS.category.push(categoryName);
              } else {
                const uniqueSet = new Set(AMP_STATUS.category);
                let newValue = categoryName;
                let count = 1;
                while (uniqueSet.has(newValue)) {
                  newValue = `${categoryName}_${count}`;
                  count++;
                }
                AMP_STATUS.category.push(newValue);
              }
              logger('createCategory:', categoryName, AMP_STATUS);
              const persisted = persistMyPlaylistIfNeeded();
              updateNotice({
                type: persisted ? 'success' : 'error',
                message: persisted
                  ? selfElm?.dataset['messageSuccess'] || ''
                  : selfElm?.dataset['messageFailure'] || '',
                delay: 2400,
              });
              clearCategory();
              updateCategory();
              } catch (err) {
                logger('createCategory: error', err);
                updateNotice({
                  type: 'error',
                  message: selfElm?.dataset['messageFailure'] || '',
                  delay: 2400,
                });
              }
            },
            async downloadPlaylist(): Promise<void> {
              const seek_format = Number(this.getFormData('seek_format')) === 1;
              const jsonContent = generatePlaylistJson(seek_format);
              const blob = new Blob([jsonContent], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = AMP_STATUS.playlist || 'playlist.json';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              const selfElm = document.getElementById('btn-download-playlist');
              updateNotice({
                type: 'success',
                message: selfElm?.dataset['messageSuccess'] || '',
                delay: 2000,
              });
            },
          };
          elm.addEventListener('click', (evt: Event) => {
            const target = evt.target as HTMLInputElement;
            (callback as any)[snakeToCapital(target.name)]();
            logger('onClickButton::', target.name);
            resetPlaylistManageForm();
          });
          break;
        }
        default:
          logger('Event undefined element:', elmName, elm);
          break;
      }
    });

    watcher($PLAYLIST_MANAGE_FORM, (mutation: MutationRecord) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-validate') {
        const valid_items: string[] = [];
        if (getAtts(mutation.target as HTMLElement, 'data-validate')) {
          $PLAYLIST_MANAGE_ELMS.forEach((elm: HTMLElement) => {
            if (getAtts(elm, 'data-validate')) valid_items.push(elm.id);
          });
        }
        const $BUTTON_CREATE_SYMLINK = document.getElementById('btn-create-symlink');
        const symlink_contains = ['local-media-directory', 'symlink-name'];
        const isSymlinkContainAll = inArray(symlink_contains, valid_items, false);
        logger('Check valid items for "Create Symlink":', valid_items, symlink_contains, isSymlinkContainAll);
        if ($BUTTON_CREATE_SYMLINK) setAtts($BUTTON_CREATE_SYMLINK, { disabled: '' }, isSymlinkContainAll);

        const $BUTTON_CREATE_CATEGORY = document.getElementById('btn-create-category');
        const category_contains = ['category-name'];
        const isCategoryContainAll = inArray(category_contains, valid_items, false);
        logger('Check valid items for "Create Category":', valid_items, category_contains, isCategoryContainAll);
        if ($BUTTON_CREATE_CATEGORY) setAtts($BUTTON_CREATE_CATEGORY, { disabled: '' }, isCategoryContainAll);
      }
    }, { childList: true, attributes: true, subtree: true });
  }

  const $INITIAL_ALERT = document.getElementById('alert-notification') as HTMLElement | null;
  if ($INITIAL_ALERT) {
    const initialMessage = ($INITIAL_ALERT.dataset['noticeMessage'] || '').trim();
    const initialType = (($INITIAL_ALERT.dataset['noticeType'] || 'info') as NotificationPayload['type']);
    if (initialMessage !== '') {
      updateNotice({
        type: initialType,
        message: initialMessage,
        delay: 2800,
      });
    }
  }
};

// for debugging code
function execDebug(): void {
  /*
  const f1 = document.getElementById('youtube-url'),
        f2 = document.getElementById('media-category'),
        f3 = document.getElementById('media-title'),
        f4 = document.getElementById('media-artist'),
        f5 = document.getElementById('media-desc'),
        f6 = document.getElementById('media-volume'),
        f7 = document.getElementById('seek-start'),
        f8 = document.getElementById('seek-end')
  f1.value  = 'www.youtube.com/watch?v=gu7T0D50wFk'
  if (f2.length > 1 && f2.value === '') {
    f2.selectedIndex = 3
  }
  f3.value = 'Allure of the Dark'
  f4.value = 'MementMori'
  f5.value = "Illya (God's Curse)"
  f6.value = 85
  f8.value = '4:11'
  // fire!
  f1.dispatchEvent(new Event('input'))
  f2.dispatchEvent(new Event('change'))
  f3.dispatchEvent(new Event('change'))
  */
}

// ============================================================================
// UTILITY FUNCTIONS (SHARED LIBRARY)
// ============================================================================

/**
 * Finds whether the given variable is an object.
 */
function isObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object';
}

/**
 * Finds whether the given variable is an element of HTML.
 */
function isElement(node: any): node is HTMLElement {
  return !(!node || !(node.nodeName || (node.prop && node.attr && node.find)));
}

/**
 * Determines if the given variable is a numeric string.
 */
function isNumberString(numstr: any): numstr is string {
  return typeof numstr === 'string' && numstr !== '' && !isNaN(Number(numstr));
}

/**
 * Determines if the given variable is a boolean string.
 */
function isBooleanString(boolstr: any): boolstr is string {
  return typeof boolstr === 'string' && boolstr !== '' && /^(true|false)$/i.test(boolstr);
}

/**
 * Given a string containing the path to a file or directory,
 * this function will return the trailing name component.
 */
function basename(path: string): string {
  return path.split(/[\/\\]/).pop()?.split('.').shift() || '';
}

/**
 * Gets the extension from the given file path.
 */
function getExt(path: string): string {
  const cleanPath = path.split(/[?#]/).shift() || '';
  return cleanPath.split('.').pop()?.toLowerCase() || '';
}

function getMediaMimeType(path: string, tagname: 'audio' | 'video'): string {
  const ext = getExt(path);
  const mimeTypes: Record<string, string> = {
    aac: 'audio/aac',
    mid: 'audio/midi',
    midi: 'audio/midi',
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    ogg: 'audio/ogg',
    opus: 'audio/opus',
    wav: 'audio/wav',
    weba: 'audio/webm',
    wma: 'audio/x-ms-wma',
    avi: 'video/x-msvideo',
    mpeg: 'video/mpeg',
    mpg: 'video/mpeg',
    mp4: 'video/mp4',
    ogv: 'video/ogg',
    ts: 'video/mp2t',
    webm: 'video/webm',
    '3gp': 'video/3gpp',
    '3g2': 'video/3gpp2',
  };
  return mimeTypes[ext] || `${tagname}/${ext || 'mpeg'}`;
}

function resolveLocalMediaSrc(path: string): string {
  const normalizedPath = String(path || '').replace(/\\/g, '/');
  if (!normalizedPath) {
    return '';
  }
  if (/^(https?:)?\/\//i.test(normalizedPath) || /^(blob|data):/i.test(normalizedPath)) {
    return normalizedPath;
  }

  const ambientData = (window as any).AmbientData as AmbientData | undefined;
  const mediaDir = (ambientData?.mediaDir || './assets/media/').replace(/\\/g, '/').replace(/\/?$/, '/');
  const mediaDirWithoutDot = mediaDir.replace(/^\.\//, '');
  const pathWithoutDot = normalizedPath.replace(/^\.\//, '');

  if (pathWithoutDot.startsWith(mediaDirWithoutDot)) {
    return `${mediaDir}${pathWithoutDot.slice(mediaDirWithoutDot.length)}`;
  }
  if (pathWithoutDot.startsWith('assets/media/')) {
    return `${mediaDir}${pathWithoutDot.slice('assets/media/'.length)}`;
  }

  return `${mediaDir}${pathWithoutDot.replace(/^\/+/, '')}`;
}

function escapeHTML(value: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(value).replace(/[&<>"']/g, (char) => map[char] || char);
}

/**
 * Return true if a number is in range, otherwise false.
 */
function inRange(num: any, min: number, max: number): boolean {
  if (isNaN(Number(num))) {
    return false;
  } else {
    num = Number(num);
    return (num - min) * (num - max) <= 0;
  }
}

function inArray(contains: any | any[], targetArray: any[], at_least_one: boolean = false): boolean {
  if (!Array.isArray(targetArray)) return false;
  const items = Array.isArray(contains) ? contains : [contains];
  return at_least_one
    ? items.some((item: any) => targetArray.includes(item))
    : items.every((item: any) => targetArray.includes(item));
}

function snakeToCapital(str: string): string {
  return str.replace(/_./g, (match: string) => match.charAt(1).toUpperCase());
}

function setValidated(targetElement: HTMLElement, result: boolean | null = null): void {
  const elm = isElement(targetElement) ? targetElement : null;
  if (!elm) return;
  const baseId        = elm.id;
  const $FIELD_LABEL  = document.getElementById(baseId + '-label');
  const $FIELD_PREFIX = document.getElementById(baseId + '-prefix');
  const $NOTE_ERROR   = document.getElementById('note-error-' + baseId);
  const $NOTE_SUCCESS = document.getElementById('note-success-' + baseId);
  if (result === null) {
    toggleClass(elm, { 'normal-input': true, 'error-input': false, 'success-input': false });
    if (isElement($FIELD_LABEL))  toggleClass($FIELD_LABEL  as HTMLElement, { 'normal-text':   true, 'error-text':   false, 'success-text':   false });
    if (isElement($FIELD_PREFIX)) toggleClass($FIELD_PREFIX as HTMLElement, { 'normal-prefix': true, 'error-prefix': false, 'success-prefix': false });
    if (isElement($NOTE_ERROR))   toggleClass($NOTE_ERROR   as HTMLElement, { hidden: true  });
    if (isElement($NOTE_SUCCESS)) toggleClass($NOTE_SUCCESS as HTMLElement, { hidden: true  });
    elm.setAttribute('data-validate', 'false');
  } else {
    toggleClass(elm, { 'normal-input': !result, 'error-input': !result, 'success-input': result });
    if (isElement($FIELD_LABEL))  toggleClass($FIELD_LABEL  as HTMLElement, { 'normal-text':   !result, 'error-text':   !result, 'success-text':   result });
    if (isElement($FIELD_PREFIX)) toggleClass($FIELD_PREFIX as HTMLElement, { 'normal-prefix': !result, 'error-prefix': !result, 'success-prefix': result });
    if (isElement($NOTE_ERROR))   toggleClass($NOTE_ERROR   as HTMLElement, { hidden: result  });
    if (isElement($NOTE_SUCCESS)) toggleClass($NOTE_SUCCESS as HTMLElement, { hidden: !result });
    elm.setAttribute('data-validate', String(result));
  }
}

/**
 * Get cookie with specified name.
 */
function getCookie(name: string): string | null {
  const getCookiePath = (cookie: string): string => {
    const pathMatch = cookie.match(/(?:^|;\s*)path=([^;]*)/);
    return pathMatch?.[1] ?? '/';
  };

  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = (cookies[i] ?? '').trim();
    const keyValue = cookie.split('=');
    const cookieName = keyValue[0];
    const cookieValue = keyValue[1];

    if (cookieName === name) {
      const cookiePath = getCookiePath(cookie);
      const currentPath = window.location.pathname;

      if (currentPath.startsWith(cookiePath)) {
        return cookieValue || null;
      } else {
        return null;
      }
    }
  }
  return null;
}

/**
 * Update the value of the cookie with the specified name.
 */
function updateCookie(name: string, value: string, daysToExpire: number | null = null): void {
  const expirationDate = new Date();
  if (!daysToExpire) {
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
  } else {
    expirationDate.setDate(expirationDate.getDate() + daysToExpire);
  }

  const secureAttribute = window.location.protocol === 'https:' ? 'Secure; ' : '';
  const cookieString = `${name}=${value}; expires=${expirationDate.toUTCString()}; path=${window.location.pathname}; ${secureAttribute}SameSite=Lax`;
  document.cookie = cookieString;
}

/**
 * Retrieves a DOMRect object providing information about the size
 * of given an element and its position relative to the viewport.
 */
function getRect(targetElement: any, property: string = ''): any {
  if (isElement(targetElement)) {
    const _RECT_OBJ: DOMRect = targetElement.getBoundingClientRect();
    if (property === '') {
      return _RECT_OBJ;
    }
    if (property in _RECT_OBJ) {
      return (_RECT_OBJ as any)[property];
    }
  }
  return false;
}

/**
 * Toggle classes on element.
 */
function toggleClass(
  targetElement: HTMLElement,
  classes: Record<string, boolean> | string[] | string,
  force?: boolean
): boolean {
  if (!isElement(targetElement)) return false;

  const classArray = Array.isArray(classes) ? classes : [classes];
  classArray.forEach((oneClass: string | Record<string, boolean>) => {
    if (typeof oneClass === 'object') {
      for (const property in oneClass) {
        if (typeof oneClass[property] === 'boolean') {
          targetElement.classList.toggle(property, oneClass[property]);
        }
      }
    } else if (typeof oneClass === 'string') {
      if (force === undefined) {
        targetElement.classList.toggle(oneClass);
      } else {
        targetElement.classList.toggle(oneClass, force);
      }
    }
  });

  return false;
}

/**
 * Set styles on element.
 */
function setStyles(targetElements: HTMLElement | HTMLElement[], styles: string | Record<string, string> = ''): void {
  const _ELMS = targetElements instanceof Array ? targetElements : [targetElements];
  _ELMS.forEach((elm: HTMLElement) => {
    if (styles instanceof Object) {
      for (const _prop in styles) {
        (elm.style as any)[_prop] = styles[_prop];
      }
    } else {
      elm.style.cssText = String(styles);
    }
  });
}

/**
 * Get attributes from element.
 */
function getAtts(targetElement: HTMLElement, attribute: string = ''): any {
  const _ATTS = targetElement.getAttributeNames();

  if (_ATTS.length !== 0) {
    if (attribute === '') {
      const _obj: Record<string, any> = {};
      _ATTS.forEach((item: string) => {
        const _val = targetElement.getAttribute(item);
        _obj[item] = isNumberString(_val) ? Number(_val) : isBooleanString(_val) ? /^true$/i.test(_val) : _val;
      });
      return _obj;
    }

    if (_ATTS.includes(attribute)) {
      const _val = targetElement.getAttribute(attribute);
      return isNumberString(_val) ? Number(_val) : isBooleanString(_val) ? /^true$/i.test(_val) : _val;
    }
  }
}

/**
 * Set or remove attributes on the specified element.
 */
function setAtts(
  targetElements: HTMLElement | HTMLElement[],
  attributes: Record<string, string> = {},
  remove: boolean = false
): void {
  const _ELMS = targetElements instanceof Array ? targetElements : [targetElements];
  _ELMS.forEach((elm: HTMLElement) => {
    for (const _key in attributes) {
      const val = attributes[_key];
      if (val === undefined) continue;
      if (!remove) {
        elm.setAttribute(_key, val);
      } else {
        elm.removeAttribute(_key);
      }
    }
  });
}

/**
 * Returns the width of string, where halfwidth characters count as 1,
 * and fullwidth characters count as 2.
 */
function mb_strwidth(str: string): number {
  let i = 0;
  const l = str.length;
  let length = 0;

  for (; i < l; i++) {
    const c = str.charCodeAt(i);
    if (0x0000 <= c && c <= 0x0019) {
      length += 0;
    } else if (0x0020 <= c && c <= 0x1fff) {
      length += 1;
    } else if (0x2000 <= c && c <= 0xff60) {
      length += 2;
    } else if (0xff61 <= c && c <= 0xff9f) {
      length += 1;
    } else if (0xffa0 <= c) {
      length += 2;
    }
  }
  return length;
}

/**
 * Truncates string to specified width.
 */
function mb_strimwidth(str: string, start: number, width: number, trimmarker: string = ''): string {
  const trimmakerWidth = mb_strwidth(trimmarker);
  let i = start;
  const l = str.length;
  let trimmedLength = 0;
  let trimmedStr = '';

  for (; i < l; i++) {
    const c = str.charAt(i);
    const charWidth = mb_strwidth(c);
    const next = str.charAt(i + 1);
    const nextWidth = mb_strwidth(next);

    trimmedLength += charWidth;
    trimmedStr += c;

    if (trimmedLength + trimmakerWidth + nextWidth > width) {
      trimmedStr += trimmarker;
      break;
    }
  }
  return trimmedStr;
}

/**
 * Watches the specified element.
 * This function as a wrapper for MutationObserver.
 */
function watcher(
  targetElements: HTMLElement | HTMLElement[],
  callback: (mutation: MutationRecord) => void,
  config: MutationObserverInit = {}
): void {
  const _ELMS = targetElements instanceof Array ? targetElements : [targetElements];

  if (!callback || typeof callback !== 'function') {
    return;
  }

  const _CONF: MutationObserverInit = Object.assign(
    {
      childList: true,
      attributes: true,
      characterData: true,
      subtree: true,
    },
    config
  );

  _ELMS.forEach((elm: HTMLElement) => {
    if (!isElement(elm)) {
      logger('error', 'Watching target is not an HTML element.', 'force');
      return;
    }

    new MutationObserver((mutations: MutationRecord[]) => {
      mutations.forEach((mutation: MutationRecord) => {
        callback(mutation);
      });
    }).observe(elm, _CONF);
  });
}

/**
 * Fetch data using the specified URL and method.
 * This function as a wrapper for Fetch API.
 */
async function fetchData(
  url: string = '',
  method: string = 'get',
  data: Record<string, any> = {},
  datatype: string = 'json',
  timeout: number = 15000
): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  if (!url || !/^(get|post|put|delete|patch)$/i.test(method)) {
    return Promise.reject({
      type: 'bad_request',
      status: 400,
      message: 'Invalid argument(s) given.',
    });
  }

  let params = new URLSearchParams();
  const sendData: any = {
    method: method.toUpperCase(),
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'omit',
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    signal: controller.signal,
  };

  if (data) {
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        params.append(key, data[key]);
      }
    }
  }

  if ('GET' !== sendData.method) {
    sendData.body = params;
  } else {
    if (params.size > 0) {
      url += '?' + params;
    }
  }

  try {
    const response = await fetch(url, sendData);
    logger('fetchData::after:', response);

    if (response.ok) {
      const retval = datatype === 'json' ? await response.json() : await response.text();
      logger('fetchData::after:2:', retval);
      return Promise.resolve(retval);
    } else {
      const errObj = await response.json();
      return Promise.reject({
        code: errObj.code,
        status: errObj.data.status,
        message: errObj.message,
      });
    }
  } catch (err) {
    logger('error', 'fetchData::error:', err, 'force');
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Set the storage for saving user data on the client side to be used.
 */
function useStge(stge: string = 'localStorage'): void {
  const ambientObj = (window as any).$ambient;
  if (ambientObj) {
    ambientObj.useStorage = stge;
  } else {
    (window as any).$ambient = { useStorage: stge };
  }
}

/**
 * Store user data in client-side storage.
 */
function saveStge(key: string, data: any): boolean {
  const appKey = (window as any).APP_KEY;
  const _data = (window as any)[(window as any).$ambient.useStorage].getItem(appKey);

  if (!_data) {
    const newData: Record<string, any> = {};
    newData[key] = data;
    (window as any)[(window as any).$ambient.useStorage].setItem(appKey, JSON.stringify(newData));
    return true;
  }

  try {
    const userData = JSON.parse(_data);
    if (isObject(userData)) {
      userData[key] = data;
      (window as any)[(window as any).$ambient.useStorage].setItem(appKey, JSON.stringify(userData));
      return true;
    }
  } catch (error) {
    logger(error, _data);
  }

  return false;
}

function getStge(key: string | null = null): any {
  const appKey = (window as any).APP_KEY;
  const _data = (window as any)[(window as any).$ambient.useStorage].getItem(appKey);
  if (!_data) {
    return null;
  }

  try {
    const userData = JSON.parse(_data);
    if (!isObject(userData)) {
      return null;
    }
    return key ? userData[key] ?? null : userData;
  } catch (error) {
    logger(error, _data);
  }

  return null;
}

/**
 * Logger for frontend of Ambient Media Player.
 */
function logger(...args: any[]): any {
  const ambientData = (window as any).AmbientData as AmbientData;
  let isForce = ambientData?.debug || false;

  if (args.length > 0 && typeof args[args.length - 1] === 'string' && args[args.length - 1] === 'force') {
    isForce = args.pop() === 'force';
  }

  if (!isForce) {
    return;
  }

  const now = new Date();
  const dateStr = `[${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
  const type = /^(error|warn|info|debug|log)$/i.test(args[0]) ? args.shift() : 'log';

  return (console as any)[type](dateStr, ...args);
}

let noticeHideTimerGlobal: number | null = null;
let noticeCleanupTimerGlobal: number | null = null;

/**
 * Update notice/notification display.
 */
function updateNotice(notification: NotificationPayload): void {
  logger('Have notification:', notification);

  const classes = {
    base: 'fixed top-2 right-2 w-full max-w-sm flex items-start gap-3 p-4 z-[10050] text-sm border rounded-lg shadow-xl transition-all duration-200 ease-out ',
    info: 'text-blue-800 border-blue-300 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-900',
    success: 'text-green-800 border-green-300 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-900',
    warning: 'text-yellow-800 border-yellow-300 bg-yellow-50 dark:text-yellow-400 dark:border-yellow-800 dark:bg-yellow-900',
    error: 'text-red-800 border-red-300 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-900',
    btnbase: 'ml-auto -mr-1 -mt-1 rounded-lg focus:ring-2 p-1.5 inline-flex items-center justify-center h-8 w-8 ',
    btninfo: 'bg-blue-50 text-blue-500 focus:ring-blue-400 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-400 dark:hover:bg-blue-700',
    btnsuccess: 'bg-green-50 text-green-500 focus:ring-green-400 hover:bg-green-200 dark:bg-green-800 dark:text-green-400 dark:hover:bg-green-700',
    btnwarning: 'bg-yellow-50 text-yellow-500 focus:ring-yellow-400 hover:bg-yellow-200 dark:bg-yellow-800 dark:text-yellow-400 dark:hover:bg-yellow-700',
    btnerror: 'bg-red-50 text-red-500 focus:ring-red-400 hover:bg-red-200 dark:bg-red-800 dark:text-red-400 dark:hover:bg-red-700',
  };

  const $ALERT = document.getElementById('alert-notification') as HTMLElement;
  const $BUTTON_ALERT_DISMISS = document.getElementById('btn-alert-dismiss') as HTMLElement;

  const classKey = notification.type as keyof typeof classes;
  const btnClassKey = `btn${notification.type}` as keyof typeof classes;

  setAtts($ALERT, { class: classes.base + classes[classKey] });
  setAtts($BUTTON_ALERT_DISMISS, { class: classes.btnbase + classes[btnClassKey] });
  $ALERT.style.zIndex = '10050';
  $ALERT.style.width = 'min(22rem, calc(100vw - 1rem))';

  const $ALERT_MESSAGE = $ALERT.querySelector('#alert-message');
  if ($ALERT_MESSAGE) {
    $ALERT_MESSAGE.innerHTML = notification.message;
  }

  if (noticeHideTimerGlobal !== null) {
    window.clearTimeout(noticeHideTimerGlobal);
    noticeHideTimerGlobal = null;
  }
  if (noticeCleanupTimerGlobal !== null) {
    window.clearTimeout(noticeCleanupTimerGlobal);
    noticeCleanupTimerGlobal = null;
  }

  const delay = notification.hasOwnProperty('delay') ? Number(notification.delay) : 0;
  toggleClass($ALERT, {
    hidden: false,
    'opacity-0': true,
    '-translate-y-4': true,
    'pointer-events-none': true,
  });
  window.requestAnimationFrame(() => {
    toggleClass($ALERT, {
      'opacity-0': false,
      '-translate-y-4': false,
      'pointer-events-none': false,
    });
  });

  const hideNotice = (): void => {
    toggleClass($ALERT, {
      'opacity-0': true,
      '-translate-y-4': true,
      'pointer-events-none': true,
    });
    noticeCleanupTimerGlobal = window.setTimeout(() => {
      toggleClass($ALERT, { hidden: true });
      noticeCleanupTimerGlobal = null;
    }, 220);
  };

  if (delay > 0) {
    noticeHideTimerGlobal = window.setTimeout(() => {
      hideNotice();
      noticeHideTimerGlobal = null;
    }, delay);
  }

  if (!$BUTTON_ALERT_DISMISS.dataset['ambientBound']) {
    $BUTTON_ALERT_DISMISS.dataset['ambientBound'] = 'true';
    $BUTTON_ALERT_DISMISS.addEventListener('click', (evt: Event) => {
      evt.preventDefault();
      if (noticeHideTimerGlobal !== null) {
        window.clearTimeout(noticeHideTimerGlobal);
        noticeHideTimerGlobal = null;
      }
      if (noticeCleanupTimerGlobal !== null) {
        window.clearTimeout(noticeCleanupTimerGlobal);
        noticeCleanupTimerGlobal = null;
      }
      hideNotice();
    });
  }
}

// Do dispatcher
if ('complete' === document.readyState || 'loading' !== document.readyState) {
  init();
} else if (document.addEventListener) {
  document.addEventListener('DOMContentLoaded', init, false);
} else {
  (window as any).onload = init;
}
