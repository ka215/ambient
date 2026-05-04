/**
/**
 * Ambient Media Player v2 - TypeScript Frontend Application
 * Ported from ambient.js with full type safety
 */
/// <reference path="./types/index.ts" />

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
    removeStge();
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
          if ('current' === prop) {
            changePlaylistFocus();
          }
          if ('order' === prop) {
            changeToggleRandomly();
          }
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

  // Process global data passed by the system.
  if ((window as any).AmbientData) {
    const ambientData: AmbientData = (window as any).AmbientData;
    if (ambientData.hasOwnProperty('currentPlaylist')) {
      // If there is only one playlist, load immediately.
      const currentPlaylist = ambientData.currentPlaylist as string;
      AMP_STATUS.playlist = currentPlaylist;
      getPlaylistData(currentPlaylist);
    } else if (
      ambientData.hasOwnProperty('playlists') &&
      Object.keys(ambientData.playlists || {}).length > 1
    ) {
      // If there are multiple playlists, do nothing yet.
    }
  }

  /**
   * Fetch data of specific playlist.
   */
  async function getPlaylistData(playlist: string): Promise<void> {
    initStatus();
    const endpointURL = `${BASE_URL}playlist/${playlist}`;
    const response = await fetchData(endpointURL);
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
            // Assign index number of category to media item.
            if (data.media && data.media[category] && data.media[category].length > 0) {
              media = media.concat(
                data.media[category].map((item: MediaItem) => {
                  item.catId = cid; // Index number of category starting at 0
                  return item;
                })
              );
            }
          });
          AMP_STATUS.category = categories;
        }
        if (media.length > 0) {
          // Filters available media only then Assign unique index number to media item.
          let amid = 0;
          media = media
            .filter((item: MediaItem) => item.hasOwnProperty('title') && item.title !== '')
            .map((item: MediaItem) => {
              item.amId = amid; // Index number of media starting at 0
              amid++;
              return item;
            });
        }
        AMP_STATUS.media = media;
        updatePlaylist();
      }
    }
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
  const $BUTTON_PLAY = document.getElementById('btn-play') as HTMLButtonElement;
  const $BUTTON_PAUSE = document.getElementById('btn-pause') as HTMLButtonElement;
  const $BUTTON_SETTINGS = document.getElementById('btn-settings') as HTMLButtonElement;
  const $MODAL_OPTIONS = document.getElementById('modal-options') as HTMLElement;
  const $COLLAPSE_MENU = document.getElementById('collapse-menu') as HTMLElement;

  // Add elements since v1.1.0
  const $MEDIA_CATEGORY_SELECT = document.getElementById('media-category') as HTMLSelectElement;

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
   * Monitors the state of the playlist drawer component and fires
   * an event when it is displayed.
   */
  watcher($DRAWER_PLAYLIST, (mutation: MutationRecord) => {
    if (mutation.attributeName === 'aria-modal' && (mutation.target as HTMLElement).ariaModal === 'true') {
      scrollToFocusItem();
    }
  }, { attributes: true, childList: false, subtree: true, attributeFilter: ['aria-modal'] });

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
    }
  }

  /**
   * Create a playlist from the data of the AMP_STATUS object.
   */
  function updatePlaylist(): void {
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

    // Enable playlist download
    const $BUTTON_DOWNLOAD_PLAYLIST = document.getElementById('btn-download-playlist') as HTMLButtonElement;
    setAtts($BUTTON_DOWNLOAD_PLAYLIST, { disabled: '' }, true);

    if (is_no_media) {
      // no playable media
      $LIST_NO_MEDIA.classList.remove('hidden');
      return;
    } else {
      $LIST_NO_MEDIA.classList.add('hidden');
    }

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
      if (AMP_STATUS.current && AMP_STATUS.current !== null && AMP_STATUS.current === item.amId) {
        itemElm.setAttribute('aria-current', 'true');
        itemElm.setAttribute('class', 'flex items-center gap-2 w-full px-4 py-2 text-white bg-blue-500 border-b border-gray-200 cursor-pointer dark:bg-gray-800 dark:border-gray-600');
      } else {
        itemElm.setAttribute('class', 'flex items-center gap-2 w-full px-4 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-500 dark:focus:text-white');
      }
      itemElm.setAttribute('data-playlist-item', String(item.amId));

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
      imgElm.classList.add('block', 'h-8', 'w-8', 'rounded', 'object-cover');
      imgElm.setAttribute('alt', mb_strimwidth(item.title, 0, 50, '...'));
      itemElm.appendChild(imgElm);

      let labelText = item.title;
      const format = getOption('playlist');
      if (format) {
        labelText = filterText(format, item);
      }
      if (/<.*?[!^<].*?>/gi.test(labelText)) {
        itemElm.insertAdjacentHTML('beforeend', labelText);
      } else {
        itemElm.append(document.createTextNode(labelText));
      }
      $LIST_PLAYLIST.appendChild(itemElm);
    });

    Array.from($LIST_PLAYLIST.querySelectorAll('a')).forEach((elm: HTMLElement) => {
      elm.addEventListener('click', (evt: Event) => {
        const target = evt.target as HTMLElement;
        playItem(target);
        // Toggle player control buttons shown.
        $BUTTON_PLAY.classList.add('hidden');
        $BUTTON_PAUSE.classList.remove('hidden');
      });
    });

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
    }

    // add since v1.1.0
    while ($MEDIA_CATEGORY_SELECT.firstChild) {
      $MEDIA_CATEGORY_SELECT.removeChild($MEDIA_CATEGORY_SELECT.firstChild);
    }
    const $MEDIA_CATEGORY_SELECT_FIRST_CHILD = document.createElement('option');
    $MEDIA_CATEGORY_SELECT_FIRST_CHILD.setAttribute('value', '');
    $MEDIA_CATEGORY_SELECT_FIRST_CHILD.textContent =
      $MEDIA_CATEGORY_SELECT.getAttribute('data-placeholder') || '';
    $MEDIA_CATEGORY_SELECT.appendChild($MEDIA_CATEGORY_SELECT_FIRST_CHILD);
  }

  /**
   * Update the items in the category selection field of the settings menu.
   */
  function updateCategory(): void {
    if (AMP_STATUS.category && AMP_STATUS.category.length > 0) {
      AMP_STATUS.category.forEach((catName: string, catId: number) => {
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
    }
    $SELECT_CATEGORY.firstElementChild?.removeAttribute('disabled');
    $SELECT_CATEGORY.removeAttribute('disabled');
  }

  /**
   * Getter for optional data of the AMP_STATUS object.
   */
  function getOption(key: string): any {
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
    AMP_STATUS.volume = getOption('volume') || 100;
    changeRangeVolume();

    // Applies if a dark mode is specified.
    const isDarkMode = getOption('dark');
    if (isDarkMode !== null) {
      if (AMP_STATUS.options) {
        AMP_STATUS.options.dark = isDarkMode;
      }
    }

    changeToggleDarkmode();
  }

  /**
   * Clear and initialize the carousel display.
   */
  function clearCarousel(): void {
    const $CAROUSEL_NO_MEDIA = document.createElement('div');
    $CAROUSEL_NO_MEDIA.id = 'carousel-item-1';
    $CAROUSEL_NO_MEDIA.classList.add('hidden', 'duration-700', 'ease-in-out');
    $CAROUSEL_NO_MEDIA.setAttribute('data-carousel-item', '');
    const $NO_MEDIA_IMAGE = document.createElement('img');
    $NO_MEDIA_IMAGE.src = './views/images/no-media-placeholder.svg';
    $NO_MEDIA_IMAGE.setAttribute('class', 'absolute block h-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2');
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
        $COROUSEL_ITEM.classList.add('duration-700', 'ease-in-out');
      } else {
        $COROUSEL_ITEM.classList.add('hidden', 'duration-700', 'ease-in-out');
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
        base_aspect = 'w-full';
      }

      $COROUSEL_ITEM_IMAGE.src = mediaImage;
      $COROUSEL_ITEM_IMAGE.classList.add('absolute', 'block', base_aspect, '-translate-x-1/2', '-translate-y-1/2', 'top-1/2', 'left-1/2');
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
      getPlaylistData(newPlaylist);
      clearCategory();
    }
    AMP_STATUS.playlist = newPlaylist;
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
      AMP_STATUS.ctg = newCtgId;
      AMP_STATUS.prev = null;
      AMP_STATUS.current = null;
      AMP_STATUS.next = null;
    }
    updatePlaylist();
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
    if (isObject(AMP_STATUS.options) && AMP_STATUS.options?.hasOwnProperty('seek')) {
      AMP_STATUS.options.seek = (evt.target as HTMLInputElement).checked;
    }
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
    if (isObject(AMP_STATUS.options) && AMP_STATUS.options?.hasOwnProperty('fader')) {
      AMP_STATUS.options.fader = (evt.target as HTMLInputElement).checked;
    }
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
    const currentVolume = Number((evt.target as HTMLInputElement).value);
    const displayVolume = document.getElementById('default-volume-value') as HTMLElement;
    displayVolume.textContent = String(currentVolume);
  });

  /**
   * Fires an input event of range slider when was changed default playback volume.
   */
  function changeRangeVolume(): void {
    $RANGE_VOLUME.value = inRange(Number(AMP_STATUS.volume), 0, 100) ? String(Number(AMP_STATUS.volume)) : '100';
    $RANGE_VOLUME.dispatchEvent(new Event('input'));
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
    changeToggleDarkmode();
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

    AMP_STATUS.prev = prevId || null;
    AMP_STATUS.next = nextId || null;
    updateCarousel();
  }

  /**
   * Commit a media item to play.
   */
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

    setupPlayer(playerType, mediaSrc, mediaData);
  }

  /**
   * Handle the player to prepare depending on the type of media to play.
   */
  function setupPlayer(type: string | null, src: string | null, mediaData: MediaItem): void {
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
          throw new Error('Unsupported file format');
        }
        break;
      default:
        AMP_STATUS.playertype = null;
        emitYouTubeSignal('error', 'unsupported_player_specified');
        if (AMP_STATUS.next !== null) {
          playItem(null, AMP_STATUS.next);
        }
        throw new Error('Unsupported player specified.');
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
        }
      }, 100);
    }

    // Add since v1.2.0
    if (AMP_STATUS.fader && mediaData.hasOwnProperty('fadein') && mediaData.fadein !== '') {
      event.target.setVolume(0);
    } else {
      event.target.setVolume(AMP_STATUS.volume || 100);
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
      abortSeeking();
      abortFader('fadeout');

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
          event.target.setVolume(AMP_STATUS.volume || 100);
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

    abortSeeking();
    abortFader('fadeout');
    abortFader('fadein');
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
      AMP_STATUS.volume = Number(mediaData.volume);
    } else {
      AMP_STATUS.volume = getOption('volume') || 100;
    }

    // aspect: 16:9 = w:h -> h = 9w/16
    const adjustSize = {
      width: currentWindowSize.width >= 640 ? 640 : currentWindowSize.width - 2,
      height: Math.floor(
        (9 * (currentWindowSize.width >= 640 ? 640 : currentWindowSize.width - 2)) / 16
      ),
    };

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
      AMP_STATUS.volume = Number(mediaData.volume);
    } else {
      AMP_STATUS.volume = getOption('volume') || 100;
    }

    if (AMP_STATUS.fader && mediaData.hasOwnProperty('fadein') && mediaData.fadein !== '') {
      playerElm.volume = 0;
    } else {
      playerElm.volume = (AMP_STATUS.volume || 100) / 100;
    }

    if (tagname === 'audio' && isObject(AMP_STATUS.options) && AMP_STATUS.options?.dark) {
      setStyles(playerElm, 'opacity: .7');
    }

    if (getOption('seek') && mediaData.hasOwnProperty('start') && mediaData.start !== '') {
      playerElm.currentTime = Number(mediaData.start);
    }

    sourceElm.src = mediaData.file || '';
    sourceElm.setAttribute('type', `audio/${getExt(mediaData.file || '')}`);
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
          playerElm.volume = (AMP_STATUS.volume || 100) / 100;
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
      logger('error', 'Player Error:', mediaData, evt, 'force');
    });

    playerElm.addEventListener('loadstart', (evt: Event) => {
      // If the readyState does not change 1 second after the start of loading,
      // it is skipped as an unsupported medium.
      setTimeout(() => {
        if ((evt.target as HTMLMediaElement).readyState === 0) {
          logger('warn', `The player will treat this media (${mediaData.file}) as unsupported and will skip it.`, 'force');
          (evt.target as HTMLMediaElement).dispatchEvent(new Event('ended'));
        }
      }, 1500);
    });

    playerElm.addEventListener('loadedmetadata', (evt: Event) => {
      const self = evt.target as HTMLVideoElement;
      if (self.tagName === 'VIDEO') {
        if (!self.videoHeight || !self.videoWidth) {
          self.setAttribute('poster', './views/images/no-media-placeholder.svg');
        }
        if (currentWindowSize.width >= 640) {
          self.width = 640;
          self.height = Math.floor((640 * self.videoHeight) / self.videoWidth);
        } else {
          self.width = currentWindowSize.width - 2;
          self.height = Math.floor(((currentWindowSize.width - 2) * self.videoHeight) / self.videoWidth);
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
    const mediaType = isElement(media) ? 'local' : 'youtube';
    const fadeEnd = (start + period) * 1000; // unit milliseconds
    const steps = period * 10;
    const stepVolume = (AMP_STATUS.volume || 100) / steps;

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
          media.setVolume(AMP_STATUS.volume || 100);
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
    currentWindowSize.width = window.innerWidth;
    currentWindowSize.height = window.innerHeight;

    // aspect: 16:9 = w:h -> h = 9w/16
    const adjustPlayerSize = {
      width: currentWindowSize.width >= 640 ? 640 : currentWindowSize.width - 2,
      height: Math.floor(
        (9 * (currentWindowSize.width >= 640 ? 640 : currentWindowSize.width - 2)) / 16
      ),
    };

    if (player && typeof player === 'object' && typeof player.getIframe === 'function') {
      const YTPlayer = player.getIframe();
      YTPlayer.width = String(adjustPlayerSize.width);
      YTPlayer.height = String(adjustPlayerSize.height);
    }

    const $HTMLPlayer = document.getElementById('html-player') as HTMLVideoElement;
    if (isElement($HTMLPlayer)) {
      $HTMLPlayer.width = adjustPlayerSize.width;
      $HTMLPlayer.height = adjustPlayerSize.height;
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
          updateWindowSize();
        }, delay);
      },
      false
    );
  };

  resize();

  window.dispatchEvent(new Event('resize', { bubbles: true, cancelable: false }));
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
  return path.split('.').pop() || '';
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

/**
 * Removes specific properties from user data stored in client-side storage.
 */
function removeStge(key: string | null = null): boolean {
  const appKey = (window as any).APP_KEY;

  if (!key) {
    (window as any)[(window as any).$ambient.useStorage].removeItem(appKey);
    return true;
  }

  const _data = (window as any)[(window as any).$ambient.useStorage].getItem(appKey);

  try {
    const userData = JSON.parse(_data);
    if (isObject(userData) && userData.hasOwnProperty(key)) {
      delete userData[key];
      (window as any)[(window as any).$ambient.useStorage].setItem(appKey, JSON.stringify(userData));
      return true;
    }
  } catch (error) {
    logger(error, _data);
  }

  return false;
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

/**
 * Update notice/notification display.
 */
function updateNotice(notification: NotificationPayload): void {
  logger('Have notification:', notification);

  const classes = {
    base: 'fixed inset-y-1/4 left-0 right-0 md:inset-y-1/4 h-max max-h-full w-5/6 max-w-xl md:max-w-sm flex items-center p-4 mx-auto z-99 text-sm border rounded-lg shadow-lg transition-opacity ease-out duration-300 ',
    info: 'text-blue-800 border-blue-300 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-900',
    success: 'text-green-800 border-green-300 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-900',
    warning: 'text-yellow-800 border-yellow-300 bg-yellow-50 dark:text-yellow-400 dark:border-yellow-800 dark:bg-yellow-900',
    error: 'text-red-800 border-red-300 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-900',
    btnbase: 'ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 inline-flex items-center justify-center h-8 w-8 ',
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
  toggleClass($BUTTON_ALERT_DISMISS, { hidden: true });

  const $ALERT_MESSAGE = $ALERT.querySelector('#alert-message');
  if ($ALERT_MESSAGE) {
    $ALERT_MESSAGE.innerHTML = notification.message;
  }

  const delay = notification.hasOwnProperty('delay') ? Number(notification.delay) : 0;
  // Show alert (inline implementation to avoid closure dependency)
  toggleClass($ALERT, { 'opacity-0': false });
  if (delay > 0) {
    new Promise<void>((resolve) => {
      setTimeout(() => {
        toggleClass($ALERT, { 'opacity-0': true });
        resolve();
      }, delay);
    }).then(() => {
      setTimeout(() => {
        toggleClass($ALERT, { hidden: true });
      }, 1000);
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
