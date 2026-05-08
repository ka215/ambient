"use strict";
/// <reference path="./types/index.ts" />
// ============================================================================
// INITIALIZATION
// ============================================================================
const init = function () {
    const selfURL = new URL(window.location.href);
    const BASE_URL = selfURL.origin + selfURL.pathname;
    if (!window.hasOwnProperty('APP_KEY')) {
        window.APP_KEY = 'AmbientUserData';
    }
    useStge();
    const AMP_STATUS = initStatus();
    /**
     * Initialize AMP_STATUS object.
     */
    function initStatus() {
        // In cloud mode, preserve MyPlaylist data in localStorage across page loads.
        const ambientData = window.AmbientData;
        const isCloud = ambientData?.isCloud === true;
        const MYPLAYLIST_KEY = 'AmbientMyPlaylist';
        const hasMyPlaylist = isCloud && localStorage.getItem(MYPLAYLIST_KEY) !== null;
        if (!hasMyPlaylist) {
            removeStge();
        }
        const baseObj = window.$ambient || {};
        return Object.assign(baseObj, {
            prev: null,
            current: null,
            next: null,
            ctg: -1,
            category: null,
            playlist: null,
            media: null,
            order: 'normal',
            playertype: null,
            volume: null,
            options: null,
            addtype: null,
            notice: null,
            loop: null,
            yt_phase: 'idle',
            yt_seq: 0,
            yt_error: '',
        });
    }
    // Window sizes container
    const currentWindowSize = {
        width: window.innerWidth,
        height: window.innerHeight,
        minFullUIWidth: 1282, // = 320 + 1 + 640 + 1 + 320
    };
    let viewportMetricsTimer = null;
    // Advance preparation for using YouTube players.
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/player_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    let player;
    /**
     * Reflect YouTube signal states to body data attributes for DOM-driven waits.
     */
    function syncYouTubeSignalAttrs() {
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
    function emitYouTubeSignal(phase, error = '') {
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
    let seekId = null;
    /**
     * Abort seek for playback media.
     */
    function abortSeeking() {
        if (seekId) {
            clearInterval(seekId);
            seekId = null;
        }
    }
    // fader container
    let fadeinId = null;
    let fadeoutId = null;
    /**
     * Abort fader for playback media.
     * @param type Either `fadein` or `fadeout`
     */
    function abortFader(type) {
        if (type === 'fadein') {
            if (fadeinId) {
                clearInterval(fadeinId);
                fadeinId = null;
            }
        }
        else {
            if (fadeoutId) {
                clearInterval(fadeoutId);
                fadeoutId = null;
            }
        }
    }
    /**
     * Watcher for AMP_STATUS object.
     */
    function watchState() {
        const callback = function (prop, _oldValue, newValue) {
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
        Object.keys(AMP_STATUS).forEach((propName) => {
            let value = AMP_STATUS[propName];
            Object.defineProperty(AMP_STATUS, propName, {
                get: () => value,
                set: (newValue) => {
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
    const DEFAULT_VOLUME = 50;
    /**
     * Save the current in-memory state of MyPlaylist to localStorage.
     * Only called in cloud mode when the active playlist is MyPlaylist.
     */
    function saveMyPlaylistToStorage() {
        try {
            const jsonStr = generatePlaylistJson(false);
            localStorage.setItem(MYPLAYLIST_KEY, jsonStr);
            logger('saveMyPlaylistToStorage: saved', jsonStr.length, 'bytes');
            return true;
        }
        catch (e) {
            logger('saveMyPlaylistToStorage: error', e);
            return false;
        }
    }
    function abortPlaybackTimers() {
        abortSeeking();
        abortFader('fadein');
        abortFader('fadeout');
    }
    /**
     * Persist MyPlaylist only when cloud mode + MyPlaylist is currently active.
     */
    function persistMyPlaylistIfNeeded() {
        const ambientData = window.AmbientData;
        if (ambientData?.isCloud && AMP_STATUS.playlist === MYPLAYLIST_NAME) {
            return saveMyPlaylistToStorage();
        }
        return true;
    }
    function getAmbientData() {
        return window.AmbientData;
    }
    function canMutateCurrentPlaylist() {
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
    function loadMyPlaylistFromStorage() {
        const raw = localStorage.getItem(MYPLAYLIST_KEY);
        if (!raw)
            return;
        try {
            const data = JSON.parse(raw);
            if (data && typeof data === 'object') {
                clearCategory();
                if (data.hasOwnProperty('options')) {
                    AMP_STATUS.options = data.options || null;
                }
                let media = [];
                const categoryData = Object.fromEntries(Object.entries(data).filter(([k]) => k !== 'options'));
                const categories = Object.keys(categoryData);
                categories.forEach((category, cid) => {
                    if (categoryData[category] && categoryData[category].length > 0) {
                        media = media.concat(categoryData[category].map((item) => {
                            item.catId = cid;
                            return item;
                        }));
                    }
                });
                AMP_STATUS.category = categories;
                if (media.length > 0) {
                    let amid = 0;
                    media = media
                        .filter((item) => item.hasOwnProperty('title') && item.title !== '')
                        .map((item) => {
                        item.amId = amid++;
                        return item;
                    });
                }
                AMP_STATUS.media = media;
                AMP_STATUS.playlist = MYPLAYLIST_NAME;
                updatePlaylist();
                if (AMP_STATUS.current !== null) {
                    updatePlayStatus(AMP_STATUS.current);
                }
                else if (media.length > 0) {
                    updatePlayStatus(media[0]?.amId ?? 0);
                }
                logger('loadMyPlaylistFromStorage: loaded', media.length, 'items');
            }
        }
        catch (e) {
            logger('loadMyPlaylistFromStorage: parse error', e);
        }
    }
    // In cloud mode: if MyPlaylist exists in localStorage, inject it into the
    // playlist dropdown and load it automatically.
    // NOTE: This block runs after DOM element constants are declared.
    function initMyPlaylistFromStorage() {
        const ambientData = window.AmbientData;
        if (!ambientData?.isCloud || localStorage.getItem(MYPLAYLIST_KEY) === null)
            return;
        const $sel = document.getElementById('current-playlist');
        if ($sel) {
            const alreadyExists = Array.from($sel.options).some((opt) => opt.value === MYPLAYLIST_NAME);
            if (!alreadyExists) {
                const opt = document.createElement('option');
                opt.value = MYPLAYLIST_NAME;
                opt.textContent = MYPLAYLIST_NAME.replace('.json', '');
                $sel.appendChild(opt);
            }
            for (let i = 0; i < $sel.options.length; i++) {
                if ($sel.options[i]?.value === MYPLAYLIST_NAME) {
                    $sel.selectedIndex = i;
                    break;
                }
            }
        }
        AMP_STATUS.playlist = MYPLAYLIST_NAME;
        loadMyPlaylistFromStorage();
        applyCloudEditRestrictions();
    }
    // Process global data passed by the system.
    // NOTE: initMyPlaylistFromStorage() and AmbientData processing have been moved
    // to AFTER DOM element constants to avoid temporal dead zone issues.
    /**
     * Fetch data of specific playlist.
     */
    async function getPlaylistData(playlist) {
        initStatus();
        if (playlist === MYPLAYLIST_NAME) {
            loadMyPlaylistFromStorage();
            applyCloudEditRestrictions();
            return;
        }
        const endpointURL = `${BASE_URL}playlist/${playlist}`;
        const response = await fetchData(endpointURL);
        if (response && typeof response === 'object' && 'data' in response) {
            const data = response.data;
            if (data && data.hasOwnProperty('options')) {
                AMP_STATUS.options = data.options || null;
            }
            if (data && data.hasOwnProperty('media')) {
                let media = [];
                if (data.media && Object.keys(data.media).length > 0) {
                    const categories = Object.keys(data.media);
                    categories.forEach((category, cid) => {
                        // Assign index number of category to media item.
                        if (data.media && data.media[category] && data.media[category].length > 0) {
                            media = media.concat(data.media[category].map((item) => {
                                item.catId = cid; // Index number of category starting at 0
                                return item;
                            }));
                        }
                    });
                    AMP_STATUS.category = categories;
                }
                if (media.length > 0) {
                    // Filters available media only then Assign unique index number to media item.
                    let amid = 0;
                    media = media
                        .filter((item) => item.hasOwnProperty('title') && item.title !== '')
                        .map((item) => {
                        item.amId = amid; // Index number of media starting at 0
                        amid++;
                        return item;
                    });
                }
                AMP_STATUS.media = media;
                updatePlaylist();
                if (AMP_STATUS.current !== null) {
                    updatePlayStatus(AMP_STATUS.current);
                }
                else if (media.length > 0) {
                    updatePlayStatus(media[0]?.amId ?? 0);
                }
                applyCloudEditRestrictions();
            }
        }
    }
    /**
     * In cloud mode, disable media-add and category-add controls when the
     * currently loaded playlist is an existing JSON file (not MyPlaylist).
     * MyPlaylist (localStorage-only virtual playlist) is always editable.
     */
    function applyCloudEditRestrictions() {
        const ambientData = getAmbientData();
        if (!ambientData?.isCloud)
            return;
        const canMutatePlaylist = canMutateCurrentPlaylist();
        const $BTN_ADD_MEDIA = document.getElementById('btn-add-media');
        const $BTN_CREATE_CATEGORY = document.getElementById('btn-create-category');
        const $MEDIA_MANAGE_FORM_EL = document.querySelector('form[name="mediaManagement"]');
        const $PLAYLIST_MANAGE_NOTICE = document.getElementById('cloud-readonly-notice');
        if (!canMutatePlaylist) {
            // Disable add-media button
            if ($BTN_ADD_MEDIA) {
                $BTN_ADD_MEDIA.disabled = true;
                $BTN_ADD_MEDIA.setAttribute('title', 'Editing existing playlists is not available in cloud mode.');
            }
            // Disable category creation button
            if ($BTN_CREATE_CATEGORY) {
                $BTN_CREATE_CATEGORY.disabled = true;
                $BTN_CREATE_CATEGORY.setAttribute('title', 'Editing existing playlists is not available in cloud mode.');
            }
            // Visual hint on the media management form
            if ($MEDIA_MANAGE_FORM_EL) {
                $MEDIA_MANAGE_FORM_EL.classList.add('opacity-50');
            }
        }
        else {
            if ($BTN_ADD_MEDIA) {
                $BTN_ADD_MEDIA.disabled = false;
                $BTN_ADD_MEDIA.removeAttribute('title');
            }
            if ($BTN_CREATE_CATEGORY) {
                $BTN_CREATE_CATEGORY.disabled = false;
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
    const $ALERT = document.getElementById('alert-notification');
    const $SELECT_PLAYLIST = document.getElementById('current-playlist');
    const $SELECT_CATEGORY = document.getElementById('target-category');
    const $TOGGLE_LOOP = document.getElementById('toggle-loop');
    const $TOGGLE_RANDOMLY = document.getElementById('toggle-randomly');
    const $TOGGLE_SHUFFLE = document.getElementById('toggle-shuffle');
    const $TOGGLE_SEEKPLAY = document.getElementById('toggle-seekplay');
    const $TOGGLE_WINDOW_FULL = document.getElementById('toggle-window-full');
    const $TOGGLE_FADER = document.getElementById('toggle-fader');
    const $RANGE_VOLUME = document.getElementById('default-volume');
    const $TOGGLE_DARKMODE = document.getElementById('toggle-darkmode');
    const $SELECT_LANGUAGE = document.getElementById('language');
    const $DRAWER_PLAYLIST = document.getElementById('drawer-playlist');
    const $DRAWER_SETTINGS = document.getElementById('drawer-settings');
    const $LIST_PLAYLIST = document.getElementById('playlist-list-group');
    const $CAROUSEL_WRAPPER = document.getElementById('carousel-wrapper');
    const $CAROUSEL_PREV = document.getElementById('data-carousel-prev');
    const $CAROUSEL_NEXT = document.getElementById('data-carousel-next');
    const $MEDIA_CAPTION = document.getElementById('media-caption');
    const $EMBED_WRAPPER = document.getElementById('embed-wrapper');
    const $OPTIONAL_CONTAINER = document.getElementById('optional-container');
    const $BUTTON_WATCH_TY = document.getElementById('btn-watch-origin');
    const $MENU = document.getElementById('menu-container');
    const $BUTTON_PLAYLIST = document.getElementById('btn-playlist');
    const $BUTTON_REFRESH = document.getElementById('btn-refresh');
    const $BUTTON_WINDOW_FULL = document.getElementById('btn-window-full');
    const $BUTTON_PLAY = document.getElementById('btn-play');
    const $BUTTON_PAUSE = document.getElementById('btn-pause');
    const $BUTTON_MENU_COLLAPSE = document.getElementById('btn-menu-collapse');
    const $BUTTON_SETTINGS = document.getElementById('btn-settings');
    const $BUTTON_OPTIONS = document.getElementById('btn-options');
    const $BUTTON_CLOSE_OPTIONS = document.getElementById('btn-close-options');
    const $MODAL_OPTIONS = document.getElementById('modal-options');
    const $MODAL_OPTIONS_PANEL = $MODAL_OPTIONS?.querySelector('.modal-dialog-shell');
    const $COLLAPSE_MENU = document.getElementById('collapse-menu');
    // Add elements since v1.1.0
    const $MEDIA_CATEGORY_SELECT = document.getElementById('media-category');
    const $MEDIA_VOLUME = document.getElementById('media-volume');
    let optionsModalHideTimer = null;
    let optionsBackdropPointerStarted = false;
    if (isElement($MODAL_OPTIONS) && $MODAL_OPTIONS.parentElement !== document.body) {
        document.body.appendChild($MODAL_OPTIONS);
    }
    function getViewportWidth() {
        return Math.round(window.visualViewport?.width || window.innerWidth);
    }
    function getViewportHeight() {
        return Math.round(window.visualViewport?.height || window.innerHeight);
    }
    function getBottomMenuHeight() {
        if (!isElement($MENU)) {
            return 0;
        }
        const rect = $MENU.getBoundingClientRect();
        return Math.max(0, Math.ceil(getViewportHeight() - rect.top));
    }
    function getFullWindowPlayerSize() {
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
    function getStandardPlayerSize() {
        const width = currentWindowSize.width >= 640 ? 640 : currentWindowSize.width - 2;
        return {
            width,
            height: Math.floor((9 * width) / 16),
        };
    }
    function getPlayerSizeForCurrentMode() {
        return isFullWindowMode() ? getFullWindowPlayerSize() : getStandardPlayerSize();
    }
    function syncViewportMetrics() {
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
    function scheduleViewportMetricsSync(delay = 0) {
        if (viewportMetricsTimer !== null) {
            window.clearTimeout(viewportMetricsTimer);
        }
        viewportMetricsTimer = window.setTimeout(() => {
            viewportMetricsTimer = null;
            syncViewportMetrics();
            updateWindowSize();
        }, delay);
    }
    function refreshViewportMetricsAfter(delay) {
        window.setTimeout(() => {
            syncViewportMetrics();
            updateWindowSize();
        }, delay);
    }
    // Playlist operation mode UI (v2.2.0 Slice A)
    const $BUTTON_PLAYLIST_MODE = document.getElementById('btn-playlist-mode');
    const $PLAYLIST_MODE_MENU = document.getElementById('playlist-mode-menu');
    const $PLAYLIST_MODE_BUTTON_ICON = document.getElementById('playlist-mode-button-icon');
    const $PLAYLIST_MODE_BUTTON_LABEL = document.getElementById('playlist-mode-button-label');
    let playlistMode = 'normal';
    const defaultPlaylistModeButtonIcon = $PLAYLIST_MODE_BUTTON_ICON ? $PLAYLIST_MODE_BUTTON_ICON.innerHTML : '';
    const defaultPlaylistModeButtonLabel = $PLAYLIST_MODE_BUTTON_LABEL?.textContent || $BUTTON_PLAYLIST_MODE?.dataset['labelModeChange'] || 'Mode Change';
    function syncPlaylistModeButton(mode) {
        if (!$BUTTON_PLAYLIST_MODE || !$PLAYLIST_MODE_BUTTON_ICON || !$PLAYLIST_MODE_BUTTON_LABEL)
            return;
        if (mode === 'normal') {
            $PLAYLIST_MODE_BUTTON_ICON.innerHTML = defaultPlaylistModeButtonIcon;
            $PLAYLIST_MODE_BUTTON_LABEL.textContent = defaultPlaylistModeButtonLabel;
            return;
        }
        const option = $PLAYLIST_MODE_MENU?.querySelector(`.playlist-mode-option[data-mode="${mode}"]`);
        const optionIcon = option?.querySelector('.playlist-mode-option-icon');
        const optionLabel = option?.querySelector('.playlist-mode-option-label');
        if (optionIcon && optionLabel) {
            $PLAYLIST_MODE_BUTTON_ICON.innerHTML = optionIcon.outerHTML;
            $PLAYLIST_MODE_BUTTON_LABEL.textContent = optionLabel.textContent || getPlaylistModeLabel(mode);
        }
    }
    function getPlaylistModeLabel(mode) {
        if (!$BUTTON_PLAYLIST_MODE)
            return mode;
        switch (mode) {
            case 'reorder':
                return $BUTTON_PLAYLIST_MODE.dataset['labelReorder'] || 'Reorder';
            case 'delete':
                return $BUTTON_PLAYLIST_MODE.dataset['labelDelete'] || 'Delete';
            default:
                return $BUTTON_PLAYLIST_MODE.dataset['labelNormal'] || 'Normal';
        }
    }
    function isPlaylistInteractionLocked() {
        return playlistMode !== 'normal';
    }
    function getPlaylistItemsForCurrentView() {
        if (!AMP_STATUS.media)
            return [];
        if (!AMP_STATUS.hasOwnProperty('ctg') || AMP_STATUS.ctg === null || Number(AMP_STATUS.ctg) === -1) {
            return AMP_STATUS.media || [];
        }
        return (AMP_STATUS.media || []).filter((item) => item.catId === AMP_STATUS.ctg);
    }
    function isSortableAvailable() {
        return typeof Sortable !== 'undefined' && typeof Sortable.create === 'function';
    }
    function canUseReorderMode() {
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
    function closePlaylistModeMenu() {
        if (!$PLAYLIST_MODE_MENU || !$BUTTON_PLAYLIST_MODE)
            return;
        $PLAYLIST_MODE_MENU.classList.add('hidden');
        $BUTTON_PLAYLIST_MODE.setAttribute('aria-expanded', 'false');
    }
    function togglePlaylistModeMenu(forceOpen = false) {
        if (!$PLAYLIST_MODE_MENU || !$BUTTON_PLAYLIST_MODE)
            return;
        const shouldOpen = forceOpen || $PLAYLIST_MODE_MENU.classList.contains('hidden');
        if (shouldOpen) {
            $PLAYLIST_MODE_MENU.classList.remove('hidden');
            $BUTTON_PLAYLIST_MODE.setAttribute('aria-expanded', 'true');
        }
        else {
            closePlaylistModeMenu();
        }
    }
    function updatePlaylistModeUI() {
        syncPlaylistModeButton(playlistMode);
        if ($PLAYLIST_MODE_MENU) {
            Array.from($PLAYLIST_MODE_MENU.querySelectorAll('.playlist-mode-option')).forEach((elm) => {
                const optElm = elm;
                const mode = (optElm.dataset['mode'] || '');
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
                }
                else {
                    optElm.classList.remove('text-blue-700', 'dark:text-blue-300');
                    optElm.removeAttribute('aria-current');
                }
            });
        }
    }
    function resetPlaylistOperationMode() {
        deleteSelectedIds.clear();
        resetReorderState();
        playlistMode = 'normal';
        updatePlaylistModeUI();
    }
    function syncPlaylistModeAvailability(visibleItemCount) {
        if (!$BUTTON_PLAYLIST_MODE)
            return;
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
    function setPlaylistMode(nextMode) {
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
        $BUTTON_PLAYLIST_MODE.addEventListener('click', (evt) => {
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
            elm.addEventListener('click', (evt) => {
                evt.preventDefault();
                evt.stopPropagation();
                const optionElm = evt.currentTarget;
                if (optionElm.disabled || optionElm.getAttribute('aria-disabled') === 'true') {
                    return;
                }
                const nextMode = optionElm.dataset['mode'];
                if (nextMode === 'normal' || nextMode === 'reorder' || nextMode === 'delete') {
                    setPlaylistMode(nextMode);
                }
            });
        });
        document.addEventListener('click', (evt) => {
            const target = evt.target;
            if (!$PLAYLIST_MODE_MENU.contains(target) && !$BUTTON_PLAYLIST_MODE.contains(target)) {
                closePlaylistModeMenu();
            }
        });
        document.addEventListener('keydown', (evt) => {
            if (evt.key === 'Escape') {
                closePlaylistModeMenu();
            }
        });
        updatePlaylistModeUI();
    }
    // Playlist delete mode state (v2.2.0 Slice B)
    const $MODAL_PLAYLIST_CONFIRM = document.getElementById('modal-playlist-confirm');
    const $MODAL_PLAYLIST_CONFIRM_TITLE = document.getElementById('modal-playlist-confirm-title');
    const $MODAL_PLAYLIST_CONFIRM_BODY = document.getElementById('modal-playlist-confirm-body');
    const $BTN_PLAYLIST_CONFIRM_APPLY = document.getElementById('btn-playlist-confirm-apply');
    const $BTN_PLAYLIST_CONFIRM_CANCEL = document.getElementById('btn-playlist-confirm-cancel');
    let deleteSelectedIds = new Set();
    let reorderInitialIds = [];
    let reorderWorkingIds = [];
    let reorderCategoryId = null;
    let playlistSortable = null;
    let _playlistConfirmApplyCallback = null;
    function openPlaylistConfirmModal(title, body, onApply) {
        if (!$MODAL_PLAYLIST_CONFIRM)
            return;
        if ($MODAL_PLAYLIST_CONFIRM_TITLE)
            $MODAL_PLAYLIST_CONFIRM_TITLE.textContent = title;
        if ($MODAL_PLAYLIST_CONFIRM_BODY)
            $MODAL_PLAYLIST_CONFIRM_BODY.textContent = body;
        _playlistConfirmApplyCallback = onApply;
        $MODAL_PLAYLIST_CONFIRM.classList.remove('hidden');
    }
    function closePlaylistConfirmModal() {
        if (!$MODAL_PLAYLIST_CONFIRM)
            return;
        $MODAL_PLAYLIST_CONFIRM.classList.add('hidden');
        _playlistConfirmApplyCallback = null;
    }
    function cancelPlaylistConfirmModal() {
        if (playlistMode === 'reorder') {
            reorderWorkingIds = [...reorderInitialIds];
            updatePlaylist();
        }
        closePlaylistConfirmModal();
    }
    function applyDeleteSelections() {
        if (!canMutateCurrentPlaylist()) {
            deleteSelectedIds.clear();
            return;
        }
        if (!AMP_STATUS.media || deleteSelectedIds.size === 0)
            return;
        AMP_STATUS.media = AMP_STATUS.media.filter((item) => !deleteSelectedIds.has(item.amId));
        deleteSelectedIds.clear();
        persistMyPlaylistIfNeeded();
    }
    function syncDeleteSelectionIndicator(itemElm, isSelected) {
        const chkElm = itemElm.querySelector('span[data-delete-selector]');
        if (!chkElm)
            return;
        chkElm.className = isSelected
            ? 'flex-shrink-0 order-first flex items-center justify-center w-5 h-5 rounded border-2 border-red-500 bg-red-500'
            : 'flex-shrink-0 order-first flex items-center justify-center w-5 h-5 rounded border-2 border-gray-400 dark:border-gray-500';
        chkElm.innerHTML = isSelected
            ? '<svg class="w-3 h-3 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>'
            : '';
    }
    function destroyPlaylistSortable() {
        if (playlistSortable) {
            playlistSortable.destroy();
            playlistSortable = null;
        }
    }
    function resetReorderState() {
        destroyPlaylistSortable();
        reorderInitialIds = [];
        reorderWorkingIds = [];
        reorderCategoryId = null;
    }
    function isReorderDirty() {
        return reorderInitialIds.length > 0 &&
            reorderInitialIds.length === reorderWorkingIds.length &&
            reorderInitialIds.some((amId, index) => amId !== reorderWorkingIds[index]);
    }
    function captureReorderSnapshot() {
        reorderCategoryId = Number(AMP_STATUS.ctg);
        reorderInitialIds = getPlaylistItemsForCurrentView().map((item) => item.amId);
        reorderWorkingIds = [...reorderInitialIds];
    }
    function syncReorderWorkingIdsFromDom() {
        reorderWorkingIds = Array.from($LIST_PLAYLIST.querySelectorAll('a[data-playlist-item]')).map((elm) => {
            return Number(elm.dataset['playlistItem'] || elm.getAttribute('data-playlist-item') || -1);
        }).filter((amId) => amId >= 0);
    }
    function applyReorderChanges() {
        if (!canMutateCurrentPlaylist()) {
            resetReorderState();
            return;
        }
        if (!AMP_STATUS.media || reorderCategoryId === null || reorderWorkingIds.length === 0) {
            resetReorderState();
            return;
        }
        const mediaById = new Map((AMP_STATUS.media || []).map((item) => [item.amId, item]));
        const reorderedItems = reorderWorkingIds
            .map((amId) => mediaById.get(amId))
            .filter((item) => !!item);
        let reorderIndex = 0;
        AMP_STATUS.media = (AMP_STATUS.media || []).map((item) => {
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
    function ensurePlaylistSortable() {
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
            if (_playlistConfirmApplyCallback)
                _playlistConfirmApplyCallback();
            closePlaylistConfirmModal();
        });
    }
    if ($BTN_PLAYLIST_CONFIRM_CANCEL) {
        $BTN_PLAYLIST_CONFIRM_CANCEL.addEventListener('click', () => {
            cancelPlaylistConfirmModal();
        });
    }
    if ($MODAL_PLAYLIST_CONFIRM) {
        $MODAL_PLAYLIST_CONFIRM.addEventListener('click', (evt) => {
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
    initMyPlaylistFromStorage();
    if (window.AmbientData) {
        const ambientData = window.AmbientData;
        // Skip server playlist loading if cloud+MyPlaylist already loaded from localStorage
        const skipServerLoad = ambientData?.isCloud === true &&
            localStorage.getItem(MYPLAYLIST_KEY) !== null;
        if (!skipServerLoad) {
            if (ambientData.hasOwnProperty('currentPlaylist')) {
                // If there is only one playlist, load immediately.
                const currentPlaylist = ambientData.currentPlaylist;
                AMP_STATUS.playlist = currentPlaylist;
                getPlaylistData(currentPlaylist);
            }
            else if (ambientData.hasOwnProperty('playlists') &&
                Object.keys(ambientData.playlists || {}).length > 1) {
                // If there are multiple playlists, do nothing yet.
            }
        }
    }
    /**
     * Method for switching display of alert component.
     */
    function toggleAlert(state = null, auto_close = null) {
        let shown;
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
            new Promise((resolve) => {
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
    function restoreOptionsTriggerFocus() {
        if (isElement($BUTTON_OPTIONS)) {
            $BUTTON_OPTIONS.focus();
        }
    }
    if (isElement($BUTTON_CLOSE_OPTIONS)) {
        $BUTTON_CLOSE_OPTIONS.addEventListener('click', () => {
            restoreOptionsTriggerFocus();
        }, true);
    }
    function isOptionsModalVisible() {
        return !$MODAL_OPTIONS.classList.contains('hidden') &&
            $MODAL_OPTIONS.getAttribute('aria-hidden') !== 'true';
    }
    /**
     * Sync active styles of bottom menu drawer toggle buttons.
     */
    function syncDrawerToggleButtonState(button, active) {
        if (!isElement(button)) {
            return;
        }
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
        button.classList.toggle('bg-blue-50', active);
        button.classList.toggle('dark:bg-gray-800', active);
        const labelNodes = Array.from(button.querySelectorAll('span:not(.sr-only)'));
        labelNodes.forEach((node) => {
            node.classList.toggle('text-blue-600', active);
            node.classList.toggle('dark:text-blue-500', active);
            node.classList.toggle('text-gray-500', !active);
            node.classList.toggle('dark:text-gray-400', !active);
        });
        const iconNodes = Array.from(button.querySelectorAll('svg'));
        iconNodes.forEach((node) => {
            node.classList.toggle('text-blue-600', active);
            node.classList.toggle('dark:text-blue-500', active);
            node.classList.toggle('text-gray-500', !active);
            node.classList.toggle('dark:text-gray-400', !active);
        });
    }
    function isDrawerOpen(drawer, hiddenClass) {
        const ariaModal = drawer.getAttribute('aria-modal') === 'true';
        const hiddenByClass = drawer.classList.contains(hiddenClass);
        return ariaModal || !hiddenByClass;
    }
    function syncDrawerToggleButtons() {
        syncDrawerToggleButtonState($BUTTON_PLAYLIST, isDrawerOpen($DRAWER_PLAYLIST, '-translate-x-full'));
        syncDrawerToggleButtonState($BUTTON_SETTINGS, isDrawerOpen($DRAWER_SETTINGS, 'translate-x-full'));
    }
    watcher($MODAL_OPTIONS, (mutation) => {
        if (mutation.type !== 'attributes') {
            return;
        }
        const modalElm = mutation.target;
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
    watcher($DRAWER_PLAYLIST, (mutation) => {
        if (mutation.type !== 'attributes') {
            return;
        }
        syncDrawerToggleButtons();
        if (mutation.attributeName === 'aria-modal' && mutation.target.ariaModal === 'true') {
            scrollToFocusItem();
        }
    }, { attributes: true, childList: false, subtree: true, attributeFilter: ['aria-modal', 'class'] });
    watcher($DRAWER_SETTINGS, (_mutation) => {
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
    watcher($COLLAPSE_MENU, (mutation) => {
        if (mutation.attributeName === 'aria-expanded' && mutation.target.ariaExpanded === 'true') {
            const is_collapse_open = mutation.target.ariaExpanded === 'true';
            const collapse_item_id = mutation.target.getAttribute('aria-controls');
            if (is_collapse_open && collapse_item_id) {
                const $COLLAPSE_ITEM = document.getElementById(collapse_item_id);
                if ($COLLAPSE_ITEM?.firstElementChild) {
                    $COLLAPSE_ITEM.firstElementChild.setAttribute('style', 'max-height: calc(100vh - 420px)');
                    // Reset scroll position to top when any accordion panel opens
                    $COLLAPSE_ITEM.firstElementChild.scrollTop = 0;
                }
            }
        }
    }, { attributes: true, childList: false, subtree: true, attributeFilter: ['aria-expanded'] });
    /**
     * Empty the playlist.
     */
    function clearPlaylist() {
        // Clear all items of playlist
        const $NO_MEDIA = document.getElementById('no-media');
        const clone = $NO_MEDIA?.cloneNode(true);
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
    function bindAddMediaFromDrawer(addBtn) {
        const btn = addBtn;
        if (btn.__ambientBound)
            return;
        btn.__ambientBound = true;
        btn.addEventListener('click', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();
            const activeCatId = (AMP_STATUS.ctg !== undefined && AMP_STATUS.ctg !== null && Number(AMP_STATUS.ctg) >= 0)
                ? Number(AMP_STATUS.ctg)
                : null;
            openMediaManagement(activeCatId);
        });
    }
    function cleanupOptionsModalBackdrops() {
        const isOptionsHidden = !isOptionsModalVisible();
        if (!isOptionsHidden)
            return;
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
    function closePlaylistDrawerForModalIfNeeded() {
        if (currentWindowSize.width >= currentWindowSize.minFullUIWidth) {
            return;
        }
        if (!isDrawerOpen($DRAWER_PLAYLIST, '-translate-x-full')) {
            return;
        }
        document.getElementById('btn-close-playlist')?.click();
    }
    function closeSettingsDrawerForModalIfNeeded() {
        if (currentWindowSize.width >= currentWindowSize.minFullUIWidth) {
            return;
        }
        if (!isDrawerOpen($DRAWER_SETTINGS, 'translate-x-full')) {
            return;
        }
        document.getElementById('btn-close-settings')?.click();
    }
    function getActiveCategoryId() {
        return (AMP_STATUS.ctg !== undefined && AMP_STATUS.ctg !== null && Number(AMP_STATUS.ctg) >= 0)
            ? Number(AMP_STATUS.ctg)
            : null;
    }
    function syncTargetCategorySelection() {
        if (!isElement($SELECT_CATEGORY))
            return;
        const preferredValue = getActiveCategoryId();
        const nextValue = preferredValue !== null ? String(preferredValue) : '-1';
        const hasOption = Array.from($SELECT_CATEGORY.options).some((opt) => opt.value === nextValue);
        $SELECT_CATEGORY.value = hasOption ? nextValue : '-1';
    }
    function syncMediaCategoryField(preferredCategoryId = getActiveCategoryId()) {
        const $catInput = document.getElementById('media-category-new');
        const hasVisibleSelect = isElement($MEDIA_CATEGORY_SELECT) && !$MEDIA_CATEGORY_SELECT.classList.contains('hidden');
        if (hasVisibleSelect) {
            const hasPreferredOption = preferredCategoryId !== null &&
                Array.from($MEDIA_CATEGORY_SELECT.options).some((opt) => opt.value === String(preferredCategoryId));
            if (hasPreferredOption) {
                $MEDIA_CATEGORY_SELECT.value = String(preferredCategoryId);
            }
            else if (AMP_STATUS.category && AMP_STATUS.category.length === 1) {
                $MEDIA_CATEGORY_SELECT.value = '0';
            }
            else {
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
    function normalizeVolume(value, fallback = DEFAULT_VOLUME) {
        if (value === null || value === undefined || value === '') {
            return fallback;
        }
        const numericValue = Number(value);
        return Number.isFinite(numericValue) && inRange(numericValue, 0, 100)
            ? numericValue
            : fallback;
    }
    function getDefaultVolume() {
        return normalizeVolume(getOption('volume'), DEFAULT_VOLUME);
    }
    function getPlaybackVolume(mediaData = null) {
        const mediaVolume = mediaData?.volume;
        if (mediaData &&
            mediaVolume !== undefined &&
            inRange(Number(mediaVolume), 0, 100)) {
            return Number(mediaVolume);
        }
        return getDefaultVolume();
    }
    function syncRangeProgress(range) {
        if (!range)
            return;
        const min = Number(range.min || 0);
        const max = Number(range.max || 100);
        const value = normalizeVolume(range.value, DEFAULT_VOLUME);
        const progress = max > min ? ((value - min) / (max - min)) * 100 : 0;
        range.style.setProperty('--range-progress', `${Math.min(100, Math.max(0, progress))}%`);
    }
    function syncMediaVolumeField(volume = getDefaultVolume()) {
        if (!$MEDIA_VOLUME)
            return;
        const normalizedVolume = normalizeVolume(volume, getDefaultVolume());
        $MEDIA_VOLUME.value = String(normalizedVolume);
        syncRangeProgress($MEDIA_VOLUME);
        const displayVolume = document.getElementById('default-media-volume');
        if (displayVolume) {
            displayVolume.textContent = String(normalizedVolume);
        }
    }
    function openPlaylistManagementCategoryCreate() {
        ensureAccordionPanel('collapse-item-body-playlist');
        window.setTimeout(() => {
            const categoryNameInput = document.getElementById('category-name');
            categoryNameInput?.scrollIntoView({ block: 'center', behavior: 'smooth' });
            categoryNameInput?.focus();
        }, 120);
    }
    function ensureAccordionPanel(panelId) {
        const accordionBtn = document.querySelector(`[data-accordion-target="#${panelId}"]`);
        const panel = document.getElementById(panelId);
        if (!panel)
            return;
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
    function showOptionsModal() {
        if (isOptionsModalVisible())
            return;
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
        }
        else {
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
    function hideOptionsModal() {
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
            backdrop.style.opacity = '0';
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
        $BUTTON_OPTIONS.addEventListener('click', (evt) => {
            evt.preventDefault();
            if (isOptionsModalVisible()) {
                hideOptionsModal();
            }
            else {
                clearCategory();
                updateCategory();
                syncMediaCategoryField();
                showOptionsModal();
            }
        });
    }
    if (isElement($BUTTON_CLOSE_OPTIONS)) {
        $BUTTON_CLOSE_OPTIONS.addEventListener('click', (evt) => {
            evt.preventDefault();
            hideOptionsModal();
        });
    }
    if (isElement($MODAL_OPTIONS)) {
        $MODAL_OPTIONS.addEventListener('pointerdown', (evt) => {
            optionsBackdropPointerStarted = evt.target === $MODAL_OPTIONS;
        });
        $MODAL_OPTIONS.addEventListener('click', (evt) => {
            if (evt.target === $MODAL_OPTIONS && optionsBackdropPointerStarted) {
                hideOptionsModal();
                restoreOptionsTriggerFocus();
            }
            optionsBackdropPointerStarted = false;
        });
    }
    document.getElementById('link-open-playlist-management-category')
        ?.addEventListener('click', (evt) => {
        evt.preventDefault();
        openPlaylistManagementCategoryCreate();
    });
    document.addEventListener('keydown', (evt) => {
        if (evt.key === 'Escape' && isOptionsModalVisible()) {
            hideOptionsModal();
            restoreOptionsTriggerFocus();
        }
    });
    /**
     * Open the Options modal with the Media Management accordion expanded.
     * Optionally pre-selects the category matching the current filter.
     */
    function openMediaManagement(presetCategoryId = null) {
        // Refresh category UI before opening modal so undefined-category playlists
        // switch to text-input mode reliably.
        clearCategory();
        updateCategory();
        syncMediaCategoryField(presetCategoryId);
        showOptionsModal();
        // After the modal becomes visible, expand the Media Management accordion
        const expandMediaAccordion = () => {
            const $ACCORDION_BTN = document.querySelector('[data-accordion-target="#collapse-item-body-media"]');
            const $panel = document.getElementById('collapse-item-body-media');
            ensureAccordionPanel('collapse-item-body-media');
            if (!$ACCORDION_BTN || $ACCORDION_BTN.getAttribute('aria-expanded') === 'true') {
                if ($panel?.firstElementChild) {
                    $panel.firstElementChild.scrollTop = 0;
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
        if (!$MODAL)
            return;
        const isAlreadyOpen = $MODAL.getAttribute('aria-hidden') !== 'true' && !$MODAL.classList.contains('hidden');
        if (isAlreadyOpen) {
            setTimeout(expandMediaAccordion, 50);
        }
        else {
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
    /**
     * Create a playlist from the data of the AMP_STATUS object.
     */
    function updatePlaylist() {
        destroyPlaylistSortable();
        clearPlaylist();
        const $LIST_NO_MEDIA = document.getElementById('no-media');
        let is_no_media = AMP_STATUS.media && AMP_STATUS.media.length === 0;
        let items = [];
        if (!AMP_STATUS.hasOwnProperty('ctg') || AMP_STATUS.ctg === null || Number(AMP_STATUS.ctg) === -1) {
            items = AMP_STATUS.media || [];
        }
        else {
            items = (AMP_STATUS.media || []).filter((item) => item.catId === AMP_STATUS.ctg);
        }
        is_no_media = items.length === 0;
        syncPlaylistModeAvailability(items.length);
        // Enable playlist download
        const $BUTTON_DOWNLOAD_PLAYLIST = document.getElementById('btn-download-playlist');
        setAtts($BUTTON_DOWNLOAD_PLAYLIST, { disabled: '' }, true);
        if (is_no_media) {
            // no playable media
            $LIST_NO_MEDIA.classList.remove('hidden');
            // close mode menu so it doesn't overlap the "Register media" button
            closePlaylistModeMenu();
            return;
        }
        else {
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
                .map((value) => ({ value, random: Math.random() }))
                .sort((a, b) => a.random - b.random)
                .map(({ value }) => value);
            logger('updatePlaylist::createShufflePlaylist:', AMP_STATUS.shuffle);
        }
        items.forEach((item) => {
            const itemElm = document.createElement('a');
            itemElm.href = '#';
            itemElm.draggable = false;
            if (AMP_STATUS.current && AMP_STATUS.current !== null && AMP_STATUS.current === item.amId) {
                itemElm.setAttribute('aria-current', 'true');
                itemElm.setAttribute('class', 'flex items-center gap-2 w-full min-w-0 px-4 py-2 text-white bg-blue-500 border-b border-gray-200 cursor-pointer dark:bg-gray-800 dark:border-gray-600');
            }
            else {
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
                const ambientData = window.AmbientData;
                if (ambientData && ambientData.imageDir) {
                    imageSrc = ambientData.imageDir + (item.thumb && item.thumb !== '' ? item.thumb : item.image);
                }
            }
            else if (item.videoid && item.videoid !== '') {
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
                    chkElm.innerHTML = '<svg class="w-3 h-3 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>';
                }
                itemElm.prepend(chkElm);
            }
            else if (playlistMode === 'reorder') {
                const handleElm = document.createElement('span');
                handleElm.setAttribute('aria-hidden', 'true');
                handleElm.className = 'playlist-reorder-handle flex-shrink-0 order-first inline-flex items-center justify-center w-5 h-5 text-gray-400 cursor-grab active:cursor-grabbing dark:text-gray-500';
                handleElm.innerHTML = '<svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01"/></svg>';
                itemElm.prepend(handleElm);
            }
            let labelText = item.title;
            const format = getOption('playlist');
            if (format) {
                labelText = filterText(format, item);
            }
            const labelElm = document.createElement('span');
            labelElm.className = 'playlist-item-label flex-1';
            if (/<.*?[!^<].*?>/gi.test(labelText)) {
                labelElm.innerHTML = labelText;
            }
            else {
                labelElm.textContent = labelText;
            }
            itemElm.appendChild(labelElm);
            $LIST_PLAYLIST.appendChild(itemElm);
        });
        Array.from($LIST_PLAYLIST.querySelectorAll('a[data-playlist-item]')).forEach((elm) => {
            elm.addEventListener('click', (evt) => {
                evt.preventDefault();
                // Delete mode: toggle item selection
                if (playlistMode === 'delete') {
                    const amId = Number(elm.getAttribute('data-playlist-item'));
                    if (deleteSelectedIds.has(amId)) {
                        deleteSelectedIds.delete(amId);
                    }
                    else {
                        deleteSelectedIds.add(amId);
                    }
                    syncDeleteSelectionIndicator(elm, deleteSelectedIds.has(amId));
                    return;
                }
                if (isPlaylistInteractionLocked()) {
                    return;
                }
                const target = evt.target;
                playItem(target);
                // Toggle player control buttons shown.
                $BUTTON_PLAY.classList.add('hidden');
                $BUTTON_PAUSE.classList.remove('hidden');
            });
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
            addIconElm.innerHTML = '<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7 7V5"/></svg>';
            addItemElm.appendChild(addIconElm);
            const registerBtn = document.getElementById('btn-add-media-from-drawer');
            const registerText = (registerBtn?.dataset['label'] || registerBtn?.innerText || 'Register media').trim();
            const addLabelElm = document.createElement('span');
            addLabelElm.className = 'playlist-item-label flex-1';
            addLabelElm.textContent = registerText;
            addItemElm.appendChild(addLabelElm);
            addItemElm.addEventListener('click', (evt) => {
                evt.preventDefault();
                const activeCatId = (AMP_STATUS.ctg !== undefined && AMP_STATUS.ctg !== null && Number(AMP_STATUS.ctg) >= 0)
                    ? Number(AMP_STATUS.ctg)
                    : null;
                openMediaManagement(activeCatId);
            });
            $LIST_PLAYLIST.appendChild(addItemElm);
        }
        // For debugging code
        const ambientData = window.AmbientData;
        if (ambientData.hasOwnProperty('debug') && ambientData.debug) {
            execDebug();
        }
    }
    /**
     * Get the URL of the thumbnail image of YouTube media.
     */
    function getYoutubeThumbnailURL(videoid) {
        return 'https://img.youtube.com/vi/' + videoid + '/hqdefault.jpg';
    }
    /**
     * Clears items in the category selection field in the settings menu.
     */
    function clearCategory() {
        const $ALL_CATEGORY = document.getElementById('all-category');
        const clone = $ALL_CATEGORY?.cloneNode(true);
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
        const $catInput = document.getElementById('media-category-new');
        if ($catInput) {
            $catInput.classList.add('hidden');
            $catInput.disabled = true;
        }
        const $catLabel = document.getElementById('media-category-label');
        const $catNote = document.getElementById('note-media-category-create-from-playlist-management');
        if ($catLabel)
            $catLabel.setAttribute('for', 'media-category');
        if ($catNote) {
            $catNote.classList.add('hidden');
        }
    }
    /**
     * Update the items in the category selection field of the settings menu.
     */
    function updateCategory() {
        const $catInput = document.getElementById('media-category-new');
        const $catLabel = document.getElementById('media-category-label');
        const $catNote = document.getElementById('note-media-category-create-from-playlist-management');
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
            if ($catLabel)
                $catLabel.setAttribute('for', 'media-category-new');
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
        if ($catLabel)
            $catLabel.setAttribute('for', 'media-category');
        if ($catNote) {
            $catNote.classList.remove('hidden');
        }
        AMP_STATUS.category.forEach((catName, catId) => {
            const optElm = document.createElement('option');
            optElm.value = String(catId);
            optElm.textContent = catName;
            if (AMP_STATUS.category && AMP_STATUS.category.length === 1) {
                optElm.setAttribute('selected', 'selected');
            }
            $SELECT_CATEGORY.appendChild(optElm);
            // add since v1.1.0
            const cloneOpt = optElm.cloneNode(true);
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
    function getOption(key) {
        if (AMP_STATUS.hasOwnProperty('options') && AMP_STATUS.options !== null) {
            if (!AMP_STATUS.options.hasOwnProperty(key) || AMP_STATUS.options[key] === null || AMP_STATUS.options[key] === '') {
                return null;
            }
            else {
                return AMP_STATUS.options[key];
            }
        }
        else {
            return null;
        }
    }
    /**
     * Causes the application to apply specific option contents of the AMP_STATUS object.
     */
    function applyOptions() {
        // Applies if a background image is specified.
        const bgImage = getOption('background');
        const ambientData = window.AmbientData;
        if (bgImage && ambientData && ambientData.hasOwnProperty('imageDir')) {
            const bgSrc = ambientData.imageDir + bgImage;
            $BODY.setAttribute('style', `background-image: url('${bgSrc}');`);
            $BODY.classList.add('bg-no-repeat', 'bg-bottom', 'bg-cover');
            $MENU.setAttribute('style', 'background: linear-gradient(to bottom, rgba(255,255,255,.3), 50%, rgba(255,255,255,1));');
        }
        else {
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
    function clearCarousel() {
        const $CAROUSEL_NO_MEDIA = document.createElement('div');
        $CAROUSEL_NO_MEDIA.id = 'carousel-item-1';
        $CAROUSEL_NO_MEDIA.classList.add('hidden', 'h-full', 'items-center', 'justify-center', 'duration-700', 'ease-in-out');
        $CAROUSEL_NO_MEDIA.setAttribute('data-carousel-item', '');
        const $NO_MEDIA_IMAGE = document.createElement('img');
        $NO_MEDIA_IMAGE.src = './views/images/no-media-placeholder.svg';
        $NO_MEDIA_IMAGE.setAttribute('class', 'block h-full max-w-full object-contain');
        $NO_MEDIA_IMAGE.setAttribute('alt', 'No media available');
        $CAROUSEL_NO_MEDIA.appendChild($NO_MEDIA_IMAGE);
        const clone = $CAROUSEL_NO_MEDIA.cloneNode(true);
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
    function updateCarousel() {
        const items = [];
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
        items.forEach((amId, index) => {
            const $COROUSEL_ITEM = document.createElement('div');
            $COROUSEL_ITEM.id = 'carousel-item-' + (index + 1);
            if (amId === AMP_STATUS.current) {
                $COROUSEL_ITEM.classList.add('h-full', 'items-center', 'justify-center', 'duration-700', 'ease-in-out');
            }
            else {
                $COROUSEL_ITEM.classList.add('hidden', 'h-full', 'items-center', 'justify-center', 'duration-700', 'ease-in-out');
            }
            $COROUSEL_ITEM.setAttribute('data-carousel-item', amId === AMP_STATUS.current ? 'active' : '');
            const $COROUSEL_ITEM_IMAGE = document.createElement('img');
            let mediaImage = './views/images/no-media-placeholder.svg';
            const mediaData = (AMP_STATUS.media || []).filter((item) => item.amId === amId).shift();
            if (!mediaData)
                return;
            let base_aspect = 'h-full';
            if (mediaData.hasOwnProperty('image') && mediaData.image !== null && mediaData.image !== '') {
                const ambientData = window.AmbientData;
                mediaImage = (ambientData.imageDir ?? '') + (mediaData.image ?? '');
            }
            else if (mediaData.hasOwnProperty('videoid') && mediaData.videoid !== null && mediaData.videoid !== '') {
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
    function updateMediaCaption(mediaData) {
        const format = getOption('caption') || '%artist% - %title%';
        const labelText = filterText(format, mediaData);
        while ($MEDIA_CAPTION.firstChild) {
            $MEDIA_CAPTION.removeChild($MEDIA_CAPTION.firstChild);
        }
        const $textWrap = document.createElement('div');
        $textWrap.classList.add('marquee-inner');
        if (/<.*?[!^<].*?>/gi.test(labelText)) {
            $textWrap.innerHTML = labelText;
        }
        else {
            $textWrap.appendChild(document.createTextNode(labelText));
        }
        $MEDIA_CAPTION.appendChild($textWrap);
        toggleMarqueeCaption();
    }
    /**
     * Toggle caption marqueeing depending on window size.
     */
    function toggleMarqueeCaption() {
        if ($BODY.classList.contains('amp-full-window')) {
            return;
        }
        const $MARQUEE_NODE = $MEDIA_CAPTION.querySelector('.marquee-inner');
        if (!isElement($MARQUEE_NODE)) {
            return;
        }
        const $MARQUEE_CLONE = $MARQUEE_NODE.cloneNode(true);
        const marqueeDuration = Math.floor(($MARQUEE_NODE.clientWidth || 0) / 32); // 16px = 1rem
        if (($MARQUEE_NODE.clientWidth || 0) > currentWindowSize.width || ($MARQUEE_NODE.clientWidth || 0) > 640) {
            // Turn overflow text into a marquee.
            $MARQUEE_CLONE.setAttribute('aria-hidden', 'true');
            $MEDIA_CAPTION.appendChild($MARQUEE_CLONE);
            $MEDIA_CAPTION.querySelectorAll('.marquee-inner').forEach((elm) => {
                elm.animate({
                    // .gap-2 = 0.5rem = 8px
                    translate: ['0px', 'calc(-100% - 8px)'],
                }, {
                    duration: marqueeDuration * 1000,
                    iterations: Infinity,
                });
            });
        }
        else {
            while ($MEDIA_CAPTION.firstChild) {
                $MEDIA_CAPTION.removeChild($MEDIA_CAPTION.firstChild);
            }
            $MEDIA_CAPTION.appendChild($MARQUEE_CLONE);
        }
    }
    /**
     * Returns true when player is shown as full-window.
     */
    function isFullWindowMode() {
        return $BODY.classList.contains('amp-full-window');
    }
    /**
     * Sync icon pair of full-window toggle button.
     */
    function syncWindowFullButtonIcons(enabled) {
        if (!isElement($BUTTON_WINDOW_FULL)) {
            return;
        }
        const $ICON_EXPAND = $BUTTON_WINDOW_FULL.querySelector('.icon-window-expand');
        const $ICON_MINIMIZE = $BUTTON_WINDOW_FULL.querySelector('.icon-window-minimize');
        if (isElement($ICON_EXPAND)) {
            $ICON_EXPAND.classList.toggle('hidden', enabled);
        }
        if (isElement($ICON_MINIMIZE)) {
            $ICON_MINIMIZE.classList.toggle('hidden', !enabled);
        }
        $BUTTON_WINDOW_FULL.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        $BUTTON_WINDOW_FULL.classList.toggle('bg-blue-50', enabled);
        $BUTTON_WINDOW_FULL.classList.toggle('dark:bg-gray-800', enabled);
        const labelNodes = Array.from($BUTTON_WINDOW_FULL.querySelectorAll('span:not(.sr-only)'));
        labelNodes.forEach((node) => {
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
    function setFullWindowMode(enabled, syncOption = true, closeDrawers = false) {
        $BODY.classList.toggle('amp-full-window', enabled);
        const $TOGGLE = $TOGGLE_WINDOW_FULL?.querySelector('input[type="checkbox"]');
        if (isElement($TOGGLE)) {
            $TOGGLE.checked = enabled;
        }
        if (syncOption) {
            if (!isObject(AMP_STATUS.options)) {
                AMP_STATUS.options = { fullwindow: enabled };
            }
            else {
                AMP_STATUS.options.fullwindow = enabled;
            }
            persistMyPlaylistIfNeeded();
        }
        if (enabled && closeDrawers) {
            const shownLeft = !$DRAWER_PLAYLIST.classList.contains('-translate-x-full');
            const shownRight = !$DRAWER_SETTINGS.classList.contains('translate-x-full');
            if (shownLeft) {
                document.getElementById('btn-close-playlist')?.click();
            }
            if (shownRight) {
                document.getElementById('btn-close-settings')?.click();
            }
        }
        syncWindowFullButtonIcons(enabled);
        updateWindowSize();
        refreshViewportMetricsAfter(240);
    }
    /**
     * Synchronize the bottom menu minimize button icon and state.
     */
    function syncMenuCollapseButton(minimized) {
        if (!isElement($BUTTON_MENU_COLLAPSE)) {
            return;
        }
        const $ICON_COMPRESS = $BUTTON_MENU_COLLAPSE.querySelector('.icon-menu-compress');
        const $ICON_EXPAND = $BUTTON_MENU_COLLAPSE.querySelector('.icon-menu-expand');
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
    function setMenuMinimized(minimized) {
        if (!isElement($MENU)) {
            return;
        }
        $MENU.classList.toggle('menu-minimized', minimized);
        syncMenuCollapseButton(minimized);
    }
    /**
     * Filters text to the specified format.
     */
    function filterText(format, mediaData) {
        const patterns = format.match(/%(.+?)%/gi);
        let text = format;
        if (patterns && patterns.length > 0) {
            patterns.forEach((pattern) => {
                const property = pattern.replaceAll('%', '');
                const replacer = (mediaData.hasOwnProperty(property) && mediaData[property])
                    ? mediaData[property]
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
    $SELECT_PLAYLIST.addEventListener('change', (evt) => {
        const newPlaylist = evt.target.value;
        let oldPlaylist = null;
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
            clearCategory();
            getPlaylistData(newPlaylist);
        }
        AMP_STATUS.playlist = newPlaylist;
        applyCloudEditRestrictions();
    });
    /**
     * Event listener when the category selection field in the settings menu is changed.
     */
    $SELECT_CATEGORY.addEventListener('change', (evt) => {
        let oldCtgId = null;
        if (AMP_STATUS.hasOwnProperty('ctg') && AMP_STATUS.ctg !== null) {
            oldCtgId = AMP_STATUS.ctg;
        }
        const newCtgId = Number(evt.target.value);
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
    /**
     * Event listener when the button of "previous" for carousel has been clicked.
     */
    $CAROUSEL_PREV.addEventListener('click', (_evt) => {
        if (AMP_STATUS.prev !== null) {
            playItem(null, AMP_STATUS.prev);
        }
    });
    /**
     * Event listener when the button of "next" for carousel has been clicked.
     */
    $CAROUSEL_NEXT.addEventListener('click', (_evt) => {
        if (AMP_STATUS.next !== null) {
            playItem(null, AMP_STATUS.next);
        }
    });
    /**
     * Event listener when the button of "refresh" in bottom menu has been clicked.
     */
    $BUTTON_REFRESH.addEventListener('click', (_evt) => {
        reloadPage();
    });
    if (isElement($BUTTON_WINDOW_FULL)) {
        $BUTTON_WINDOW_FULL.addEventListener('click', (_evt) => {
            setFullWindowMode(!isFullWindowMode(), true, true);
        });
    }
    if (isElement($TOGGLE_WINDOW_FULL)) {
        $TOGGLE_WINDOW_FULL.querySelector('input[type="checkbox"]').addEventListener('change', (evt) => {
            setFullWindowMode(evt.target.checked);
        });
    }
    if (isElement($BUTTON_MENU_COLLAPSE)) {
        $BUTTON_MENU_COLLAPSE.addEventListener('click', (_evt) => {
            setMenuMinimized(!$MENU.classList.contains('menu-minimized'));
        });
    }
    /**
     * Toggle the display of player controls button after media loaded.
     */
    function togglePlayerControllButtons() {
        if (AMP_STATUS.media !== null && AMP_STATUS.media.length > 0) {
            // There are activated when available media are set.
            $BUTTON_PLAY.removeAttribute('disabled');
            $BUTTON_PAUSE.removeAttribute('disabled');
        }
        else {
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
    $BUTTON_PLAY.addEventListener('click', (_evt) => {
        let playableIds = (AMP_STATUS.media || []).map((item) => item.amId);
        if (AMP_STATUS.ctg > -1) {
            playableIds = (AMP_STATUS.media || [])
                .filter((item) => item.catId === AMP_STATUS.ctg)
                .map((item) => item.amId);
        }
        const isShuffle = getOption('shuffle') || false;
        if (isShuffle && AMP_STATUS.hasOwnProperty('shuffle') && (AMP_STATUS.shuffle || []).length > 0) {
            playableIds = (AMP_STATUS.shuffle || []).map((item) => item.amId);
        }
        let playId;
        if (AMP_STATUS.current !== null) {
            playId = AMP_STATUS.current;
        }
        else {
            if (AMP_STATUS.order === 'random') {
                playId = playableIds[Math.floor(Math.random() * playableIds.length)] ?? 0;
            }
            else {
                playId = playableIds.shift() || 0;
            }
        }
        if (AMP_STATUS.playertype === 'youtube' && player) {
            const YTPstate = player.getPlayerState();
            logger('"Play" the YouTube Player:', YTPstate);
            if (YTPstate !== -1) {
                player.playVideo();
            }
        }
        else if (/^(audio|video)$/i.test(AMP_STATUS.playertype || '')) {
            const _elms = document.getElementsByTagName(AMP_STATUS.playertype);
            const playerElm = _elms[0];
            playerElm.play();
        }
        else {
            playItem(null, playId);
        }
        // Toggle this button shown.
        $BUTTON_PLAY.classList.add('hidden');
        $BUTTON_PAUSE.classList.remove('hidden');
    });
    /**
     * Event listener when the "pause" button in bottom menu has been clicked.
     */
    $BUTTON_PAUSE.addEventListener('click', (_evt) => {
        if (!AMP_STATUS.hasOwnProperty('playertype') || AMP_STATUS.playertype === null) {
            return;
        }
        if (AMP_STATUS.playertype === 'youtube' && player) {
            if (player.getPlayerState() === 1) {
                player.pauseVideo();
            }
            else {
                player.stopVideo();
            }
        }
        else if (/^(audio|video)$/i.test(AMP_STATUS.playertype)) {
            const _elms = document.getElementsByTagName(AMP_STATUS.playertype);
            const playerElm = _elms[0];
            playerElm.pause();
        }
        else {
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
    function changePlaylistFocus() {
        // Change the focus of playlist.
        Array.from($LIST_PLAYLIST.querySelectorAll('a')).forEach((elm) => {
            if (AMP_STATUS.current !== null && elm.dataset.playlistItem === String(AMP_STATUS.current)) {
                elm.setAttribute('aria-current', 'true');
                elm.setAttribute('class', 'flex items-center gap-2 w-full px-4 py-2 text-white bg-blue-500 border-b border-gray-200 cursor-pointer dark:bg-gray-800 dark:border-gray-600');
            }
            else {
                elm.removeAttribute('aria-current');
                elm.setAttribute('class', 'flex items-center gap-2 w-full px-4 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-500 dark:focus:text-white');
            }
        });
        scrollToFocusItem();
    }
    /**
     * Auto-scroll to active item in playlist.
     */
    function scrollToFocusItem() {
        const targetElm = $LIST_PLAYLIST.querySelector('a[aria-current="true"]');
        if (!targetElm)
            return;
        const elmRect = getRect(targetElm);
        if (elmRect) {
            const move = targetElm.offsetTop > $LIST_PLAYLIST.clientHeight
                ? Math.abs($LIST_PLAYLIST.clientHeight - targetElm.offsetTop) + elmRect.height
                : 0;
            $LIST_PLAYLIST.scrollTo({ top: move, behavior: 'smooth' });
        }
    }
    /**
     * Event listener when changing the loop play of settings menu toggle button.
     */
    $TOGGLE_LOOP.querySelector('input[type="checkbox"]').addEventListener('change', (evt) => {
        AMP_STATUS.loop = evt.target.checked;
    });
    /**
     * Event listener when changing the randomly of settings menu toggle button.
     */
    $TOGGLE_RANDOMLY.querySelector('input[type="checkbox"]').addEventListener('change', (evt) => {
        AMP_STATUS.order = evt.target.checked ? 'random' : 'normal';
    });
    /**
     * Toggle the randomly of settings menu toggle button.
     */
    function changeToggleRandomly() {
        const toggleElm = $TOGGLE_RANDOMLY.querySelector('input[type="checkbox"]');
        toggleElm.checked = AMP_STATUS.order === 'random';
    }
    /**
     * Event listener when changing the shuffle play of settings menu toggle button.
     */
    $TOGGLE_SHUFFLE.querySelector('input[type="checkbox"]').addEventListener('change', (evt) => {
        if (isObject(AMP_STATUS.options)) {
            if (AMP_STATUS.options.hasOwnProperty('shuffle')) {
                AMP_STATUS.options.shuffle = evt.target.checked;
            }
            else {
                AMP_STATUS.options['shuffle'] = evt.target.checked;
            }
        }
        else {
            AMP_STATUS.options = { shuffle: evt.target.checked };
        }
        AMP_STATUS.shuffle = shufflePlaylist();
        persistMyPlaylistIfNeeded();
    });
    /**
     * Toggle the shuffle play of settings menu toggle button.
     */
    function changeToggleShuffle() {
        const toggleElm = $TOGGLE_SHUFFLE.querySelector('input[type="checkbox"]');
        toggleElm.checked = !!(AMP_STATUS.options && AMP_STATUS.options.shuffle);
        AMP_STATUS.shuffle = shufflePlaylist();
    }
    /**
     * Shuffle playlist.
     */
    function shufflePlaylist() {
        const newList = [];
        if (isObject(AMP_STATUS.options) && AMP_STATUS.options?.shuffle) {
            let items = AMP_STATUS.media || [];
            if (AMP_STATUS.hasOwnProperty('ctg') && AMP_STATUS.ctg !== null && Number(AMP_STATUS.ctg) !== -1) {
                items = (AMP_STATUS.media || []).filter((item) => item.catId === AMP_STATUS.ctg);
            }
            if (items.length > 0) {
                // Shuffle (evenly mix) the items array
                const shuffled = items
                    .map((value) => ({ value, random: Math.random() }))
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
    $TOGGLE_SEEKPLAY.querySelector('input[type="checkbox"]').addEventListener('change', (evt) => {
        if (!isObject(AMP_STATUS.options)) {
            AMP_STATUS.options = { seek: evt.target.checked };
        }
        else {
            AMP_STATUS.options.seek = evt.target.checked;
        }
        persistMyPlaylistIfNeeded();
    });
    /**
     * Toggle the seekplay of settings menu toggle button.
     */
    function changeToggleSeekplay() {
        const toggleElm = $TOGGLE_SEEKPLAY.querySelector('input[type="checkbox"]');
        toggleElm.checked = !!(AMP_STATUS.options && AMP_STATUS.options.seek);
    }
    /**
     * Event listener when changing the pseudo fader of settings menu toggle button.
     */
    $TOGGLE_FADER.querySelector('input[type="checkbox"]').addEventListener('change', (evt) => {
        if (!isObject(AMP_STATUS.options)) {
            AMP_STATUS.options = { fader: evt.target.checked };
        }
        else {
            AMP_STATUS.options.fader = evt.target.checked;
        }
        persistMyPlaylistIfNeeded();
    });
    /**
     * Toggle the pseudo fader of settings menu toggle button.
     */
    function changeToggleFader() {
        const toggleElm = $TOGGLE_FADER.querySelector('input[type="checkbox"]');
        toggleElm.checked = !!(AMP_STATUS.options && AMP_STATUS.options.fader);
    }
    /**
     * Event listener when inputting the volume of settings menu range slider.
     */
    $RANGE_VOLUME.addEventListener('input', (evt) => {
        const currentVolume = normalizeVolume(evt.target.value);
        evt.target.value = String(currentVolume);
        syncRangeProgress(evt.target);
        const displayVolume = document.getElementById('default-volume-value');
        displayVolume.textContent = String(currentVolume);
    });
    $RANGE_VOLUME.addEventListener('change', (evt) => {
        const currentVolume = normalizeVolume(evt.target.value);
        evt.target.value = String(currentVolume);
        syncRangeProgress(evt.target);
        AMP_STATUS.volume = currentVolume;
        if (!isObject(AMP_STATUS.options)) {
            AMP_STATUS.options = { volume: currentVolume };
        }
        else {
            AMP_STATUS.options.volume = currentVolume;
        }
        persistMyPlaylistIfNeeded();
    });
    /**
     * Fires an input event of range slider when was changed default playback volume.
     */
    function changeRangeVolume() {
        const currentVolume = normalizeVolume(AMP_STATUS.volume, getDefaultVolume());
        $RANGE_VOLUME.value = String(currentVolume);
        syncRangeProgress($RANGE_VOLUME);
        const displayVolume = document.getElementById('default-volume-value');
        if (displayVolume) {
            displayVolume.textContent = String(currentVolume);
        }
    }
    /**
     * Event listener when changing the darkmode of settings menu toggle button.
     */
    $TOGGLE_DARKMODE.querySelector('input[type="checkbox"]').addEventListener('change', (evt) => {
        if (!isObject(AMP_STATUS.options)) {
            AMP_STATUS.options = { dark: evt.target.checked };
        }
        else {
            if (AMP_STATUS.options?.hasOwnProperty('dark')) {
                AMP_STATUS.options.dark = evt.target.checked;
            }
            else {
                AMP_STATUS.options = Object.assign(AMP_STATUS.options, { dark: evt.target.checked });
            }
        }
        // Delay dark class toggle to let the knob slide animation complete (~150ms)
        setTimeout(() => changeToggleDarkmode(), 200);
        persistMyPlaylistIfNeeded();
    });
    /**
     * Toggle the darkmode of settings menu toggle button.
     */
    function changeToggleDarkmode() {
        const toggleElm = $TOGGLE_DARKMODE.querySelector('input[type="checkbox"]');
        const isDarkmode = isObject(AMP_STATUS.options) && AMP_STATUS.options?.dark ? !!AMP_STATUS.options.dark : false;
        toggleElm.checked = isDarkmode;
        if (isDarkmode) {
            document.documentElement.classList.add('dark');
        }
        else {
            document.documentElement.classList.remove('dark');
        }
        const $CAROUSEL_ITEMS = Array.from(document.querySelectorAll('[id^="carousel-item-"]'));
        $CAROUSEL_ITEMS.forEach((item) => {
            if (isDarkmode) {
                setStyles(item, 'opacity: .7');
            }
            else {
                setStyles(item);
            }
        });
        const $AUDIO_PLAYER = document.getElementsByTagName('audio');
        if ($AUDIO_PLAYER.length === 1 && isElement($AUDIO_PLAYER[0])) {
            if (isDarkmode) {
                setStyles($AUDIO_PLAYER[0], 'opacity: .7');
            }
            else {
                setStyles($AUDIO_PLAYER[0]);
            }
        }
    }
    $SELECT_LANGUAGE.addEventListener('change', (evt) => {
        const currentLanguage = getCookie('lang');
        const newLanguage = evt.target.value;
        logger('changeLanguage::', currentLanguage, newLanguage);
        if (currentLanguage !== newLanguage) {
            updateCookie('lang', newLanguage);
            reloadPage();
        }
    });
    /**
     * Updates the user's media playback state.
     */
    function updatePlayStatus(currentAmId) {
        // Set looking ahead to the next index.
        const targetData = AMP_STATUS.ctg !== null && AMP_STATUS.ctg !== -1
            ? (AMP_STATUS.media || []).filter((item) => item.catId === AMP_STATUS.ctg)
            : AMP_STATUS.media || [];
        const isShuffle = getOption('shuffle') || false;
        let idCandidates = [];
        if (isShuffle && AMP_STATUS.hasOwnProperty('shuffle') && (AMP_STATUS.shuffle || []).length > 0) {
            idCandidates = (AMP_STATUS.shuffle || []).map((item) => item.amId);
        }
        else {
            idCandidates = targetData.map((item) => item.amId);
        }
        AMP_STATUS.current = currentAmId;
        let prevId = null;
        let nextId = null;
        if (AMP_STATUS.order === 'random') {
            if (idCandidates.length > 1) {
                idCandidates = idCandidates.filter((v) => v !== currentAmId);
            }
            prevId = idCandidates[Math.floor(Math.random() * idCandidates.length)] ?? null;
            nextId = idCandidates[Math.floor(Math.random() * idCandidates.length)] ?? null;
        }
        else {
            idCandidates.forEach((_v, _i) => {
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
    function reportMediaPlaybackIssue(mediaItem, reason, details = {}) {
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
    function playItem(object = null, id = null) {
        const thisElm = isElement(object) ? object : null;
        const amId = id !== null ? id : Number(thisElm?.dataset?.playlistItem || 0);
        const mediaData = (AMP_STATUS.media || []).filter((item) => item.amId === amId).shift();
        if (!mediaData)
            return;
        let mediaSrc = null;
        let playerType = null;
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
            document.getElementById('btn-close-playlist')?.click();
            document.getElementById('btn-close-settings')?.click();
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
    function setupPlayer(type, src, mediaData) {
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
                }
                else if (/^(avi|mpe?g|mp4|ogv|ts|webm|3g(p|2))$/i.test(extension)) {
                    AMP_STATUS.playertype = 'video';
                    createPlayerTag('video', mediaData);
                }
                else {
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
    function onPlayerReady(event) {
        emitYouTubeSignal('player_ready');
        $EMBED_WRAPPER.classList.add('w-max', 'h-max');
        $EMBED_WRAPPER.classList.remove('w-full', 'h-0', 'opacity-0');
        const mediaData = (AMP_STATUS.media || [])
            .filter((item) => item.amId === AMP_STATUS.current)
            .shift();
        if (!mediaData)
            return;
        const youtubeURL = event.target.getVideoUrl();
        if (youtubeURL) {
            $BUTTON_WATCH_TY.href = youtubeURL;
        }
        else {
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
                if (event.target.getPlayerState() === window.YT.PlayerState.PLAYING) {
                    clearInterval(intervalID);
                    logger(`onPlayerReady::elapsed ${elapsed * 100}ms:`, 'Playback has started!');
                }
                else if (elapsed > wait) {
                    document.getElementById('btn-play').dispatchEvent(new Event('click'));
                    clearInterval(intervalID);
                }
            }, 100);
        }
        // Add since v1.2.0
        if (AMP_STATUS.fader && mediaData.hasOwnProperty('fadein') && mediaData.fadein !== '') {
            event.target.setVolume(0);
        }
        else {
            event.target.setVolume(normalizeVolume(AMP_STATUS.volume, getDefaultVolume()));
        }
        event.target.playVideo();
    }
    /**
     * Event handler called when the state of the YouTube player changes.
     */
    function onPlayerStateChange(event) {
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
            }
            else {
                nextId = AMP_STATUS.next || 0;
            }
            const mediaData = (AMP_STATUS.media || [])
                .filter((item) => item.amId === nextId)
                .shift();
            if (!mediaData)
                return;
            let mediaSrc = null;
            let playerType = null;
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
                    .filter((item) => item.amId === AMP_STATUS.current)
                    .shift();
                if (!currentMedia)
                    return;
                if (currentMedia.hasOwnProperty('fadeout') && currentMedia.fadeout !== '') {
                    const seekEnd = currentMedia.hasOwnProperty('end') && currentMedia.end !== ''
                        ? parseFloat(String(currentMedia.end))
                        : event.target.getDuration();
                    event.target.setVolume(normalizeVolume(AMP_STATUS.volume, getDefaultVolume()));
                    fadeOut(event.target, parseFloat(String(currentMedia.fadeout)), seekEnd);
                }
                if (currentMedia.hasOwnProperty('fadein') && currentMedia.fadein !== '') {
                    const seekStart = currentMedia.hasOwnProperty('start') && currentMedia.start !== ''
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
    function onPlayerError(event) {
        emitYouTubeSignal('error', `yt_error_${event && event.data !== undefined ? event.data : 'unknown'}`);
        // Skip if media playback fails.
        $EMBED_WRAPPER.classList.add('w-full', 'h-0', 'opacity-0');
        $EMBED_WRAPPER.classList.remove('w-max', 'h-max');
        $BUTTON_WATCH_TY.href = '#';
        $BUTTON_WATCH_TY.setAttribute('disabled', '');
        $OPTIONAL_CONTAINER.classList.add('hidden', 'opacity-0');
        const nextId = AMP_STATUS.next;
        if (nextId === null)
            return;
        const mediaData = (AMP_STATUS.media || [])
            .filter((item) => item.amId === nextId)
            .shift();
        if (!mediaData)
            return;
        let mediaSrc = null;
        let playerType = null;
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
    function createYTPlayer(mediaData) {
        emitYouTubeSignal('player_creating');
        const playerElm = document.createElement('div');
        playerElm.id = 'ytplayer';
        while ($EMBED_WRAPPER.firstChild) {
            $EMBED_WRAPPER.removeChild($EMBED_WRAPPER.firstChild);
        }
        $EMBED_WRAPPER.appendChild(playerElm);
        const playerOptions = {
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
        }
        else {
            AMP_STATUS.fader = false;
        }
        if (mediaData.hasOwnProperty('volume') &&
            mediaData.volume !== undefined &&
            inRange(Number(mediaData.volume), 0, 100)) {
            AMP_STATUS.volume = getPlaybackVolume(mediaData);
        }
        else {
            AMP_STATUS.volume = getDefaultVolume();
        }
        const adjustSize = getPlayerSizeForCurrentMode();
        player = new window.YT.Player('ytplayer', {
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
    function createPlayerTag(tagname, mediaData) {
        const playerElm = document.createElement(tagname);
        const sourceElm = document.createElement('source');
        let hasReportedLoadIssue = false;
        playerElm.id = 'html-player';
        playerElm.setAttribute('controls', String(getOption('controls') || ''));
        playerElm.setAttribute('controlslist', 'nodownload');
        playerElm.setAttribute('autoplay', String(getOption('autoplay') || ''));
        // Add since v1.2.0, the following fader option:
        if (getOption('fader')) {
            AMP_STATUS.fader = Boolean(getOption('fader'));
        }
        else {
            AMP_STATUS.fader = false;
        }
        if (mediaData.hasOwnProperty('volume') &&
            mediaData.volume !== undefined &&
            inRange(Number(mediaData.volume), 0, 100)) {
            AMP_STATUS.volume = getPlaybackVolume(mediaData);
        }
        else {
            AMP_STATUS.volume = getDefaultVolume();
        }
        if (AMP_STATUS.fader && mediaData.hasOwnProperty('fadein') && mediaData.fadein !== '') {
            playerElm.volume = 0;
        }
        else {
            playerElm.volume = normalizeVolume(AMP_STATUS.volume, getDefaultVolume()) / 100;
        }
        if (tagname === 'audio' && isObject(AMP_STATUS.options) && AMP_STATUS.options?.dark) {
            setStyles(playerElm, 'opacity: .7');
        }
        if (getOption('seek') && mediaData.hasOwnProperty('start') && mediaData.start !== '') {
            playerElm.currentTime = Number(mediaData.start);
        }
        const reportHtmlMediaLoadIssue = (mediaElement, mediaItem, evt, reason) => {
            if (hasReportedLoadIssue)
                return;
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
        playerElm.addEventListener('play', (_evt) => {
            if (getOption('seek') &&
                mediaData.hasOwnProperty('end') &&
                mediaData.end !== '') {
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
        playerElm.addEventListener('playing', (_evt) => {
            // Toggle this button shown (Play -> Pause).
            $BUTTON_PLAY.classList.add('hidden');
            $BUTTON_PAUSE.classList.remove('hidden');
            if (AMP_STATUS.fader) {
                if (mediaData.hasOwnProperty('fadeout') && mediaData.fadeout !== '') {
                    const seekEnd = mediaData.hasOwnProperty('end') && mediaData.end !== ''
                        ? parseFloat(String(mediaData.end))
                        : playerElm.duration;
                    playerElm.volume = normalizeVolume(AMP_STATUS.volume, getDefaultVolume()) / 100;
                    fadeOut(playerElm, parseFloat(String(mediaData.fadeout)), seekEnd);
                }
                if (mediaData.hasOwnProperty('fadein') && mediaData.fadein !== '') {
                    const seekStart = mediaData.hasOwnProperty('start') && mediaData.start !== ''
                        ? parseFloat(String(mediaData.start))
                        : 0;
                    playerElm.volume = 0;
                    fadeIn(playerElm, parseFloat(String(mediaData.fadein)), seekStart);
                }
            }
        });
        playerElm.addEventListener('pause', (_evt) => {
            // Toggle this button shown (Pause -> Play).
            $BUTTON_PAUSE.classList.add('hidden');
            $BUTTON_PLAY.classList.remove('hidden');
        });
        playerElm.addEventListener('volumechange', (_evt) => {
            logger('playerVolumeChange:', playerElm.volume, AMP_STATUS.volume);
        });
        playerElm.addEventListener('ended', (_evt) => {
            abortPlaybackTimers();
            $EMBED_WRAPPER.classList.remove('max-w-2xl', 'w-max', 'h-max', 'border-0');
            // add since v1.2.2
            let nextId = 0;
            if (AMP_STATUS.loop) {
                nextId = AMP_STATUS.current || 0;
            }
            else {
                nextId = AMP_STATUS.next || 0;
                logger('ended:', AMP_STATUS, nextId);
            }
            const mediaData = (AMP_STATUS.media || [])
                .filter((item) => item.amId === nextId)
                .shift();
            if (!mediaData)
                return;
            let mediaSrc = null;
            let playerType = null;
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
        playerElm.addEventListener('error', (evt) => {
            reportHtmlMediaLoadIssue(playerElm, mediaData, evt, 'player_error');
        });
        playerElm.addEventListener('loadstart', (evt) => {
            setTimeout(() => {
                const target = evt.target;
                if (target.readyState === 0 && (target.networkState === 3 || target.error)) {
                    reportHtmlMediaLoadIssue(target, mediaData, evt, 'load_timeout');
                }
            }, 5000);
        });
        const sourcePath = resolveLocalMediaSrc(mediaData.file || '');
        sourceElm.src = sourcePath;
        sourceElm.setAttribute('type', getMediaMimeType(sourcePath, tagname));
        sourceElm.addEventListener('error', (evt) => {
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
        playerElm.addEventListener('loadedmetadata', (evt) => {
            const self = evt.target;
            if (self.tagName === 'VIDEO') {
                if (!self.videoHeight || !self.videoWidth) {
                    self.setAttribute('poster', './views/images/no-media-placeholder.svg');
                }
                if (isFullWindowMode()) {
                    const adjustSize = getFullWindowPlayerSize();
                    self.width = adjustSize.width;
                    self.height = adjustSize.height;
                }
                else if (currentWindowSize.width >= 640) {
                    self.width = 640;
                    self.height = Math.floor((640 * self.videoHeight) / self.videoWidth);
                }
                else {
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
            playerElm.addEventListener('click', (evt) => {
                const target = evt.target;
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                }
                else {
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
    function fadeIn(media, period, start) {
        abortFader('fadein');
        const mediaType = isElement(media) ? 'local' : 'youtube';
        const fadeEnd = (start + period) * 1000; // unit milliseconds
        const steps = period * 10;
        const stepVolume = normalizeVolume(AMP_STATUS.volume, getDefaultVolume()) / steps;
        logger('fadeIn::', mediaType === 'youtube' ? media.getDuration() : media.duration, mediaType === 'youtube' ? media.getVolume() : media.volume, period, start, fadeEnd, steps, stepVolume, AMP_STATUS.volume);
        let elapsed = 0;
        let incrementVolume = 0;
        fadeinId = setInterval(() => {
            const currentTime = (mediaType === 'youtube' ? media.getCurrentTime() : media.currentTime) * 1000; // unit milliseconds
            if (inRange(currentTime, start * 1000, fadeEnd)) {
                elapsed = Math.floor((currentTime - start * 1000) / 100);
                incrementVolume = elapsed > 0 ? (stepVolume * elapsed * elapsed) / steps : 0;
                if (mediaType === 'youtube') {
                    media.setVolume(incrementVolume);
                }
                else {
                    media.volume = incrementVolume / 100;
                }
            }
            else if (currentTime >= fadeEnd) {
                if (mediaType === 'youtube') {
                    media.setVolume(normalizeVolume(AMP_STATUS.volume, getDefaultVolume()));
                }
                abortFader('fadein');
            }
            else {
                if (mediaType === 'youtube') {
                    media.setVolume(0);
                }
                else {
                    media.volume = 0;
                }
            }
            logger(`fadeIn:: ${currentTime}ms from ${start}; elapsed: ${elapsed}`, incrementVolume, mediaType === 'youtube' ? media.getVolume() : media.volume);
        }, 100);
    }
    /**
     * Fade out the volume of the specified media.
     */
    function fadeOut(media, period, end) {
        abortFader('fadeout');
        const mediaType = isElement(media) ? 'local' : 'youtube';
        const fadeStart = (end - period) * 1000; // unit milliseconds
        const steps = period * 10;
        const stepVolume = ((mediaType === 'youtube' ? AMP_STATUS.volume : media.volume * 100) || 100) / steps;
        logger('fadeOut::', mediaType === 'youtube' ? media.getDuration() : media.duration, mediaType === 'youtube' ? media.getVolume() : media.volume, period, end, fadeStart, steps, stepVolume, AMP_STATUS.volume);
        let elapsed = 0;
        let decrementVolume = 0;
        fadeoutId = setInterval(() => {
            const currentTime = (mediaType === 'youtube' ? media.getCurrentTime() : media.currentTime) * 1000; // unit milliseconds
            if (inRange(currentTime, fadeStart, end * 1000)) {
                elapsed = Math.floor((end * 1000 - currentTime) / 100);
                decrementVolume = elapsed > 0 ? stepVolume * elapsed : 0;
                if (mediaType === 'youtube') {
                    media.setVolume(decrementVolume);
                }
                else {
                    media.volume = decrementVolume / 100;
                }
                logger(`fadeOut:: ${currentTime}ms until ${end * 1000}ms; elapsed: ${elapsed}`, decrementVolume, mediaType === 'youtube' ? media.getVolume() : media.volume);
            }
            else if (currentTime < fadeStart) {
                // continue
            }
            else {
                if (mediaType === 'youtube') {
                    media.setVolume(0);
                    abortFader('fadeout');
                    logger([media]);
                }
                else {
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
    function reloadPage() {
        window.location.reload();
    }
    /**
     * Toggle the display of backdrop for drawer or modal.
     */
    watcher([$DRAWER_PLAYLIST, $DRAWER_SETTINGS, $MODAL_OPTIONS], (mutation) => {
        if (mutation.attributeName === 'aria-modal' && mutation.target.ariaModal === 'true') {
            const $DRAWER_BACKDROP = Array.from(document.querySelectorAll('div[drawer-backdrop]'));
            const $MODAL_BACKDROP = document.querySelector('div[modal-backdrop]');
            if ($DRAWER_BACKDROP.length > 0) {
                $DRAWER_BACKDROP.forEach((elm) => {
                    if (currentWindowSize.width >= currentWindowSize.minFullUIWidth) {
                        elm.classList.add('hidden');
                    }
                    else {
                        elm.classList.remove('hidden');
                    }
                });
            }
            if (isElement($MODAL_BACKDROP)) {
                if (currentWindowSize.width >= currentWindowSize.minFullUIWidth) {
                    $MODAL_BACKDROP.classList.remove('z-40');
                    $MODAL_BACKDROP.classList.add('z-[59]');
                }
                else {
                    $MODAL_BACKDROP.classList.remove('z-[59]');
                    $MODAL_BACKDROP.classList.add('z-40');
                }
            }
        }
    });
    /**
     * Event handler when the window size is resized.
     */
    function updateWindowSize() {
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
        const $HTMLPlayer = document.getElementById('html-player');
        if (isElement($HTMLPlayer)) {
            if ($HTMLPlayer.tagName === 'VIDEO') {
                $HTMLPlayer.width = adjustPlayerSize.width;
                $HTMLPlayer.height = adjustPlayerSize.height;
            }
        }
        if (isFullWindow) {
            return;
        }
        const shownLeftDrawer = getAtts($DRAWER_PLAYLIST, 'aria-modal') || false;
        const shownRightDrawer = getAtts($DRAWER_SETTINGS, 'aria-modal') || false;
        if (currentWindowSize.width < currentWindowSize.minFullUIWidth) {
            if (shownLeftDrawer) {
                document.getElementById('btn-close-playlist')?.click();
                $BUTTON_PLAYLIST.setAttribute('data-drawer-backdrop', 'true');
            }
            if (shownRightDrawer) {
                document.getElementById('btn-close-settings')?.click();
                $BUTTON_SETTINGS.setAttribute('data-drawer-backdrop', 'true');
            }
        }
        else {
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
    const resize = () => {
        let timeoutID = 0;
        const delay = 300;
        window.addEventListener('resize', () => {
            clearTimeout(timeoutID);
            timeoutID = window.setTimeout(() => {
                syncViewportMetrics();
                updateWindowSize();
            }, delay);
        }, false);
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
    const $MEDIA_MANAGE_FORM = document.querySelector('form[name="mediaManagement"]');
    const $MEDIA_MANAGE_ELMS = $MEDIA_MANAGE_FORM
        ? Array.from($MEDIA_MANAGE_FORM.elements)
        : [];
    const $PLAYLIST_MANAGE_FORM = document.querySelector('form[name="playlistManagement"]');
    const $PLAYLIST_MANAGE_ELMS = $PLAYLIST_MANAGE_FORM
        ? Array.from($PLAYLIST_MANAGE_FORM.elements)
        : [];
    async function getRelativeFilepath(basefile) {
        const endpointURL = `${BASE_URL}filepath/${encodeURIComponent(basefile)}`;
        const $LABEL_MEDIA_FILE = document.getElementById('note-error-local-media-file');
        const $HIDDEN_FILEPATH = document.getElementById('local-media-filepath');
        const response = await fetchData(endpointURL);
        if (response && response.code == 200) {
            if ($HIDDEN_FILEPATH)
                $HIDDEN_FILEPATH.value = decodeURIComponent(response.data);
            if ($LABEL_MEDIA_FILE)
                $LABEL_MEDIA_FILE.textContent = getAtts($LABEL_MEDIA_FILE, 'data-default-message');
        }
        else {
            if ($HIDDEN_FILEPATH)
                $HIDDEN_FILEPATH.value = '';
            if ($LABEL_MEDIA_FILE)
                $LABEL_MEDIA_FILE.textContent = response?.data || '';
        }
        logger('getRelativeFilepath:', endpointURL, response);
        return response && response.code == 200;
    }
    function resetMediaManageForm() {
        if (!$MEDIA_MANAGE_FORM)
            return;
        $MEDIA_MANAGE_FORM.reset();
        $MEDIA_MANAGE_ELMS.forEach((child) => {
            let event = null;
            if (/^input$/i.test(child.nodeName)) {
                const input = child;
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
            }
            else if (/^textarea$/i.test(child.nodeName)) {
                event = 'input';
            }
            else if (/^select$/i.test(child.nodeName)) {
                child.selectedIndex = 0;
                event = 'change';
            }
            if (event) {
                child.dispatchEvent(new Event(event));
            }
        });
        syncMediaVolumeField();
    }
    function addMediaData(payload) {
        logger('addMediaData::before:', payload, AMP_STATUS.media?.length);
        // --- Auto-playlist: if no playlist is currently selected, use/create MyPlaylist ---
        if (!AMP_STATUS.playlist) {
            AMP_STATUS.playlist = MYPLAYLIST_NAME;
            // Add MyPlaylist option to the dropdown if not present
            if ($SELECT_PLAYLIST) {
                const alreadyExists = Array.from($SELECT_PLAYLIST.options).some((opt) => opt.value === MYPLAYLIST_NAME);
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
        const mediaData = {
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
                        if (!Array.isArray(AMP_STATUS.category))
                            AMP_STATUS.category = [];
                        let autoIdx = AMP_STATUS.category.indexOf(AUTO_CATEGORY);
                        if (autoIdx === -1) {
                            AMP_STATUS.category.push(AUTO_CATEGORY);
                            autoIdx = AMP_STATUS.category.length - 1;
                        }
                        mediaData.catId = autoIdx;
                    }
                    else {
                        mediaData.catId = Number(val);
                    }
                    break;
                case 'category_new_name': {
                    // Text input is shown when no categories exist; value is a new category name
                    const newCatName = (val || '').trim() || 'New Category';
                    if (!Array.isArray(AMP_STATUS.category))
                        AMP_STATUS.category = [];
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
                case 'artist':
                case 'desc':
                    mediaData[key] = val;
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
                            hours = parseInt(times[0] ?? '0', 10);
                            minutes = parseInt(times[1] ?? '0', 10);
                            seconds = parseInt(times[2] ?? '0', 10);
                        }
                        else if (times.length === 2) {
                            minutes = parseInt(times[0] ?? '0', 10);
                            seconds = parseInt(times[1] ?? '0', 10);
                        }
                        else {
                            seconds = parseInt(times[times.length - 1] ?? '0', 10);
                        }
                        mediaData[key] = (hours * 60 * 60) + (minutes * 60) + seconds;
                    }
                    else if (!Number.isInteger(Number(val))) {
                        mediaData[key] = '';
                    }
                    else {
                        mediaData[key] = val;
                    }
                    break;
                default:
                    break;
            }
        }
        // If category was empty and still not set (payload had no 'category' key), auto-create
        if (categoryValue === '' && !payload.some(([k]) => k === 'category')) {
            const AUTO_CATEGORY = 'New Category';
            if (!Array.isArray(AMP_STATUS.category))
                AMP_STATUS.category = [];
            let autoIdx = AMP_STATUS.category.indexOf(AUTO_CATEGORY);
            if (autoIdx === -1) {
                AMP_STATUS.category.push(AUTO_CATEGORY);
                autoIdx = AMP_STATUS.category.length - 1;
            }
            mediaData.catId = autoIdx;
        }
        if (!Array.isArray(AMP_STATUS.media)) {
            AMP_STATUS.media = [mediaData];
        }
        else {
            const lastAmId = Math.max(...AMP_STATUS.media.map((item) => item.amId));
            mediaData.amId = lastAmId + 1;
            AMP_STATUS.media.push(mediaData);
        }
        logger('addMediaData::after:', AMP_STATUS.media.length);
        return true;
    }
    function generatePlaylistJson(seekFormat) {
        const convertHMS = (value) => {
            if (value === '' || value === undefined || Number(value) === 0)
                return '';
            const totalSeconds = Number(value);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const remainingSeconds = totalSeconds % 60;
            if (hours > 0) {
                return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
            }
            else if (minutes > 0) {
                return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
            }
            else if (remainingSeconds > 0) {
                return String(remainingSeconds);
            }
            return '';
        };
        const newPlaylist = {};
        (AMP_STATUS.media || []).forEach((item) => {
            const belongCategory = (AMP_STATUS.category || [])[item.catId] || '';
            const oneData = {
                file: (item.file || '').replace('./assets/media/', ''),
                title: item.title,
                desc: item.desc,
                artist: item.artist,
                videoid: item.videoid,
                image: item.image,
                start: seekFormat ? convertHMS(item.start) : item.start,
                end: seekFormat ? convertHMS(item.end) : item.end,
            };
            if (!Object.prototype.hasOwnProperty.call(newPlaylist, belongCategory)) {
                newPlaylist[belongCategory] = [];
            }
            newPlaylist[belongCategory].push(oneData);
        });
        newPlaylist['options'] = AMP_STATUS.options;
        logger('generatePlaylistJson::after:', newPlaylist);
        return JSON.stringify(newPlaylist, null, 2);
    }
    function resetPlaylistManageForm() {
        if (!$PLAYLIST_MANAGE_FORM)
            return;
        $PLAYLIST_MANAGE_FORM.reset();
        $PLAYLIST_MANAGE_ELMS.forEach((child) => {
            let event = null;
            if (/^input$/i.test(child.nodeName)) {
                const input = child;
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
        $MEDIA_MANAGE_ELMS.forEach((elm) => {
            const $MEDIA_URL_FIELD = document.getElementById('media-management-field-media-url');
            const $MEDIA_FILES_FIELD = document.getElementById('media-management-field-media-files');
            const $INPUT_VIDEOID = document.getElementById('youtube-videoid');
            const $INPUT_FILEPATH = document.getElementById('local-media-filepath');
            const $INPUT_MEDIA_TITLE = document.getElementById('media-title');
            const elmName = elm.name;
            switch (elmName) {
                case 'media_type':
                    elm.addEventListener('click', (evt) => {
                        const target = evt.target;
                        const prevType = AMP_STATUS.addtype ?? null;
                        if (target.value === 'youtube') {
                            if ($MEDIA_URL_FIELD)
                                toggleClass($MEDIA_URL_FIELD, { hidden: false });
                            if ($MEDIA_FILES_FIELD)
                                toggleClass($MEDIA_FILES_FIELD, { hidden: true });
                        }
                        else {
                            if ($MEDIA_URL_FIELD)
                                toggleClass($MEDIA_URL_FIELD, { hidden: true });
                            if ($MEDIA_FILES_FIELD)
                                toggleClass($MEDIA_FILES_FIELD, { hidden: false });
                        }
                        AMP_STATUS.addtype = target.value;
                        if (prevType !== target.value) {
                            resetMediaManageForm();
                        }
                    });
                    break;
                case 'youtube_url':
                    elm.addEventListener('input', (evt) => {
                        const target = evt.target;
                        const value = target.value;
                        const minLength = 'youtube.com/watch?v=.'.length;
                        if (value.length < minLength) {
                            setValidated(elm, null);
                            if ($INPUT_VIDEOID)
                                $INPUT_VIDEOID.value = '';
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
                            }
                            else {
                                if (/^https?:\/\//.test(value)) {
                                    target.value = url.hostname + url.pathname + '?v=' + videoid;
                                }
                                setValidated(elm, true);
                                if ($INPUT_VIDEOID)
                                    $INPUT_VIDEOID.value = videoid;
                            }
                        }
                        catch (err) {
                            logger('error', err, 'force');
                            setValidated(elm, false);
                        }
                    });
                    break;
                case 'local_media_file':
                    elm.addEventListener('change', async (evt) => {
                        const target = evt.target;
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
                        }
                        else {
                            if ($INPUT_FILEPATH)
                                $INPUT_FILEPATH.value = '';
                            if ($INPUT_MEDIA_TITLE)
                                $INPUT_MEDIA_TITLE.value = '';
                            setValidated(elm, null);
                            if ($INPUT_MEDIA_TITLE)
                                setValidated($INPUT_MEDIA_TITLE, null);
                        }
                    });
                    break;
                case 'media_filepath':
                    elm.addEventListener('change', (evt) => {
                        evt.target.focus();
                    });
                    break;
                case 'category':
                    elm.addEventListener('change', (evt) => {
                        const target = evt.target;
                        setValidated(elm, target.value !== '');
                    });
                    break;
                case 'category_new_name':
                    elm.addEventListener('input', (evt) => {
                        const isEmpty = evt.target.value.trim() === '';
                        if (isEmpty) {
                            setValidated(elm, null);
                        }
                        else {
                            setValidated(elm, true);
                        }
                    });
                    elm.addEventListener('change', (evt) => {
                        setValidated(elm, evt.target.value.trim() !== '');
                    });
                    break;
                case 'title':
                    elm.addEventListener('input', (evt) => {
                        const value = evt.target.value.trim();
                        setValidated(elm, value === '' ? null : true);
                    });
                    elm.addEventListener('change', (evt) => {
                        setValidated(elm, evt.target.value.trim() !== '');
                    });
                    break;
                case 'volume':
                    elm.addEventListener('input', (evt) => {
                        const target = evt.target;
                        const currentVolume = normalizeVolume(target.value, getDefaultVolume());
                        target.value = String(currentVolume);
                        syncRangeProgress(target);
                        const $VOLUME_VALUE = document.getElementById('default-media-volume');
                        if ($VOLUME_VALUE)
                            $VOLUME_VALUE.textContent = String(currentVolume);
                    });
                    break;
                case 'start':
                case 'end':
                    elm.addEventListener('input', (evt) => {
                        if (evt.target.value === '') {
                            setValidated(elm, null);
                        }
                    });
                    elm.addEventListener('change', (evt) => {
                        const value = evt.target.value;
                        if (value === '') {
                            setValidated(elm, null);
                        }
                        else {
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
                    elm.addEventListener('click', (_evt) => {
                        if (!$MEDIA_MANAGE_FORM)
                            return;
                        const formData = new FormData($MEDIA_MANAGE_FORM);
                        const categoryField = $MEDIA_CATEGORY_SELECT.classList.contains('hidden')
                            ? 'media-category-new'
                            : 'media-category';
                        const preferredCategoryValue = String(formData.get(categoryField) || '').trim();
                        const result = addMediaData(Array.from(formData.entries()));
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
                        }
                        else if ((AMP_STATUS.media || []).length > 0) {
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
                                ? elm.dataset['messageSuccess'] || ''
                                : elm.dataset['messageFailure'] || '',
                            delay: 2400,
                        });
                    });
                    break;
                default:
                    logger('Event undefined element:', elmName, elm);
                    break;
            }
        });
        watcher($MEDIA_MANAGE_FORM, (mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-validate') {
                if (!$MEDIA_MANAGE_FORM)
                    return;
                const formData = new FormData($MEDIA_MANAGE_FORM);
                const mediaType = formData.get('media_type');
                const valid_items = [];
                if (getAtts(mutation.target, 'data-validate')) {
                    $MEDIA_MANAGE_ELMS.forEach((elm) => {
                        if (getAtts(elm, 'data-validate'))
                            valid_items.push(elm.id);
                    });
                }
                const $BUTTON_ADD_MEDIA = document.getElementById('btn-add-media');
                const categoryField = $MEDIA_CATEGORY_SELECT.classList.contains('hidden')
                    ? 'media-category-new'
                    : 'media-category';
                const contains = [mediaType === 'youtube' ? 'youtube-url' : 'local-media-file', categoryField, 'media-title'];
                const isContainAll = inArray(contains, valid_items, false);
                logger(`Check valid items for "${mediaType}":`, valid_items, contains, isContainAll);
                if ($BUTTON_ADD_MEDIA)
                    setAtts($BUTTON_ADD_MEDIA, { disabled: '' }, isContainAll);
            }
        }, { childList: true, attributes: true, subtree: true });
    }
    if ($PLAYLIST_MANAGE_FORM) {
        $PLAYLIST_MANAGE_ELMS.forEach((elm) => {
            const elmName = elm.name;
            switch (elmName) {
                case 'local_media_dir':
                case 'symlink_name':
                case 'category_name':
                    elm.addEventListener('input', (evt) => {
                        if (evt.target.value === '') {
                            setValidated(elm, null);
                        }
                    });
                    elm.addEventListener('change', (evt) => {
                        setValidated(elm, evt.target.value !== '');
                    });
                    break;
                case 'create_symlink':
                case 'create_category':
                case 'download_playlist': {
                    const callback = {
                        getFormData(oneData = null) {
                            if (!$PLAYLIST_MANAGE_FORM)
                                return null;
                            const formData = new FormData($PLAYLIST_MANAGE_FORM);
                            return oneData ? formData.get(oneData) : Array.from(formData.entries());
                        },
                        async createSymlink() {
                            const endpointURL = `${BASE_URL}symlink`;
                            const payload = {};
                            for (const pair of this.getFormData()) {
                                if (inArray(pair[0], ['local_media_dir', 'symlink_name'])) {
                                    payload[pair[0]] = pair[1];
                                }
                            }
                            const response = await fetchData(endpointURL, 'post', payload);
                            logger('createSymlink:', endpointURL, payload, response);
                            updateNotice({
                                type: response?.state === 'ok' ? 'success' : 'error',
                                message: response?.data || '',
                                delay: 2000,
                            });
                        },
                        createCategory() {
                            const selfElm = document.getElementById('btn-create-category');
                            try {
                                const categoryName = this.getFormData('category_name');
                                if (!Array.isArray(AMP_STATUS.category))
                                    AMP_STATUS.category = [];
                                if (!inArray(categoryName, AMP_STATUS.category)) {
                                    AMP_STATUS.category.push(categoryName);
                                }
                                else {
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
                            }
                            catch (err) {
                                logger('createCategory: error', err);
                                updateNotice({
                                    type: 'error',
                                    message: selfElm?.dataset['messageFailure'] || '',
                                    delay: 2400,
                                });
                            }
                        },
                        async downloadPlaylist() {
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
                    elm.addEventListener('click', (evt) => {
                        const target = evt.target;
                        callback[snakeToCapital(target.name)]();
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
        watcher($PLAYLIST_MANAGE_FORM, (mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-validate') {
                const valid_items = [];
                if (getAtts(mutation.target, 'data-validate')) {
                    $PLAYLIST_MANAGE_ELMS.forEach((elm) => {
                        if (getAtts(elm, 'data-validate'))
                            valid_items.push(elm.id);
                    });
                }
                const $BUTTON_CREATE_SYMLINK = document.getElementById('btn-create-symlink');
                const symlink_contains = ['local-media-directory', 'symlink-name'];
                const isSymlinkContainAll = inArray(symlink_contains, valid_items, false);
                logger('Check valid items for "Create Symlink":', valid_items, symlink_contains, isSymlinkContainAll);
                if ($BUTTON_CREATE_SYMLINK)
                    setAtts($BUTTON_CREATE_SYMLINK, { disabled: '' }, isSymlinkContainAll);
                const $BUTTON_CREATE_CATEGORY = document.getElementById('btn-create-category');
                const category_contains = ['category-name'];
                const isCategoryContainAll = inArray(category_contains, valid_items, false);
                logger('Check valid items for "Create Category":', valid_items, category_contains, isCategoryContainAll);
                if ($BUTTON_CREATE_CATEGORY)
                    setAtts($BUTTON_CREATE_CATEGORY, { disabled: '' }, isCategoryContainAll);
            }
        }, { childList: true, attributes: true, subtree: true });
    }
    const $INITIAL_ALERT = document.getElementById('alert-notification');
    if ($INITIAL_ALERT) {
        const initialMessage = ($INITIAL_ALERT.dataset['noticeMessage'] || '').trim();
        const initialType = ($INITIAL_ALERT.dataset['noticeType'] || 'info');
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
function execDebug() {
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
function isObject(value) {
    return value !== null && typeof value === 'object';
}
/**
 * Finds whether the given variable is an element of HTML.
 */
function isElement(node) {
    return !(!node || !(node.nodeName || (node.prop && node.attr && node.find)));
}
/**
 * Determines if the given variable is a numeric string.
 */
function isNumberString(numstr) {
    return typeof numstr === 'string' && numstr !== '' && !isNaN(Number(numstr));
}
/**
 * Determines if the given variable is a boolean string.
 */
function isBooleanString(boolstr) {
    return typeof boolstr === 'string' && boolstr !== '' && /^(true|false)$/i.test(boolstr);
}
/**
 * Given a string containing the path to a file or directory,
 * this function will return the trailing name component.
 */
function basename(path) {
    return path.split(/[\/\\]/).pop()?.split('.').shift() || '';
}
/**
 * Gets the extension from the given file path.
 */
function getExt(path) {
    const cleanPath = path.split(/[?#]/).shift() || '';
    return cleanPath.split('.').pop()?.toLowerCase() || '';
}
function getMediaMimeType(path, tagname) {
    const ext = getExt(path);
    const mimeTypes = {
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
function resolveLocalMediaSrc(path) {
    const normalizedPath = String(path || '').replace(/\\/g, '/');
    if (!normalizedPath) {
        return '';
    }
    if (/^(https?:)?\/\//i.test(normalizedPath) || /^(blob|data):/i.test(normalizedPath)) {
        return normalizedPath;
    }
    const ambientData = window.AmbientData;
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
function escapeHTML(value) {
    const map = {
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
function inRange(num, min, max) {
    if (isNaN(Number(num))) {
        return false;
    }
    else {
        num = Number(num);
        return (num - min) * (num - max) <= 0;
    }
}
function inArray(contains, targetArray, at_least_one = false) {
    if (!Array.isArray(targetArray))
        return false;
    const items = Array.isArray(contains) ? contains : [contains];
    return at_least_one
        ? items.some((item) => targetArray.includes(item))
        : items.every((item) => targetArray.includes(item));
}
function snakeToCapital(str) {
    return str.replace(/_./g, (match) => match.charAt(1).toUpperCase());
}
function setValidated(targetElement, result = null) {
    const elm = isElement(targetElement) ? targetElement : null;
    if (!elm)
        return;
    const baseId = elm.id;
    const $FIELD_LABEL = document.getElementById(baseId + '-label');
    const $FIELD_PREFIX = document.getElementById(baseId + '-prefix');
    const $NOTE_ERROR = document.getElementById('note-error-' + baseId);
    const $NOTE_SUCCESS = document.getElementById('note-success-' + baseId);
    if (result === null) {
        toggleClass(elm, { 'normal-input': true, 'error-input': false, 'success-input': false });
        if (isElement($FIELD_LABEL))
            toggleClass($FIELD_LABEL, { 'normal-text': true, 'error-text': false, 'success-text': false });
        if (isElement($FIELD_PREFIX))
            toggleClass($FIELD_PREFIX, { 'normal-prefix': true, 'error-prefix': false, 'success-prefix': false });
        if (isElement($NOTE_ERROR))
            toggleClass($NOTE_ERROR, { hidden: true });
        if (isElement($NOTE_SUCCESS))
            toggleClass($NOTE_SUCCESS, { hidden: true });
        elm.setAttribute('data-validate', 'false');
    }
    else {
        toggleClass(elm, { 'normal-input': !result, 'error-input': !result, 'success-input': result });
        if (isElement($FIELD_LABEL))
            toggleClass($FIELD_LABEL, { 'normal-text': !result, 'error-text': !result, 'success-text': result });
        if (isElement($FIELD_PREFIX))
            toggleClass($FIELD_PREFIX, { 'normal-prefix': !result, 'error-prefix': !result, 'success-prefix': result });
        if (isElement($NOTE_ERROR))
            toggleClass($NOTE_ERROR, { hidden: result });
        if (isElement($NOTE_SUCCESS))
            toggleClass($NOTE_SUCCESS, { hidden: !result });
        elm.setAttribute('data-validate', String(result));
    }
}
/**
 * Get cookie with specified name.
 */
function getCookie(name) {
    const getCookiePath = (cookie) => {
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
            }
            else {
                return null;
            }
        }
    }
    return null;
}
/**
 * Update the value of the cookie with the specified name.
 */
function updateCookie(name, value, daysToExpire = null) {
    const expirationDate = new Date();
    if (!daysToExpire) {
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    }
    else {
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
function getRect(targetElement, property = '') {
    if (isElement(targetElement)) {
        const _RECT_OBJ = targetElement.getBoundingClientRect();
        if (property === '') {
            return _RECT_OBJ;
        }
        if (property in _RECT_OBJ) {
            return _RECT_OBJ[property];
        }
    }
    return false;
}
/**
 * Toggle classes on element.
 */
function toggleClass(targetElement, classes, force) {
    if (!isElement(targetElement))
        return false;
    const classArray = Array.isArray(classes) ? classes : [classes];
    classArray.forEach((oneClass) => {
        if (typeof oneClass === 'object') {
            for (const property in oneClass) {
                if (typeof oneClass[property] === 'boolean') {
                    targetElement.classList.toggle(property, oneClass[property]);
                }
            }
        }
        else if (typeof oneClass === 'string') {
            if (force === undefined) {
                targetElement.classList.toggle(oneClass);
            }
            else {
                targetElement.classList.toggle(oneClass, force);
            }
        }
    });
    return false;
}
/**
 * Set styles on element.
 */
function setStyles(targetElements, styles = '') {
    const _ELMS = targetElements instanceof Array ? targetElements : [targetElements];
    _ELMS.forEach((elm) => {
        if (styles instanceof Object) {
            for (const _prop in styles) {
                elm.style[_prop] = styles[_prop];
            }
        }
        else {
            elm.style.cssText = String(styles);
        }
    });
}
/**
 * Get attributes from element.
 */
function getAtts(targetElement, attribute = '') {
    const _ATTS = targetElement.getAttributeNames();
    if (_ATTS.length !== 0) {
        if (attribute === '') {
            const _obj = {};
            _ATTS.forEach((item) => {
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
function setAtts(targetElements, attributes = {}, remove = false) {
    const _ELMS = targetElements instanceof Array ? targetElements : [targetElements];
    _ELMS.forEach((elm) => {
        for (const _key in attributes) {
            const val = attributes[_key];
            if (val === undefined)
                continue;
            if (!remove) {
                elm.setAttribute(_key, val);
            }
            else {
                elm.removeAttribute(_key);
            }
        }
    });
}
/**
 * Returns the width of string, where halfwidth characters count as 1,
 * and fullwidth characters count as 2.
 */
function mb_strwidth(str) {
    let i = 0;
    const l = str.length;
    let length = 0;
    for (; i < l; i++) {
        const c = str.charCodeAt(i);
        if (0x0000 <= c && c <= 0x0019) {
            length += 0;
        }
        else if (0x0020 <= c && c <= 0x1fff) {
            length += 1;
        }
        else if (0x2000 <= c && c <= 0xff60) {
            length += 2;
        }
        else if (0xff61 <= c && c <= 0xff9f) {
            length += 1;
        }
        else if (0xffa0 <= c) {
            length += 2;
        }
    }
    return length;
}
/**
 * Truncates string to specified width.
 */
function mb_strimwidth(str, start, width, trimmarker = '') {
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
function watcher(targetElements, callback, config = {}) {
    const _ELMS = targetElements instanceof Array ? targetElements : [targetElements];
    if (!callback || typeof callback !== 'function') {
        return;
    }
    const _CONF = Object.assign({
        childList: true,
        attributes: true,
        characterData: true,
        subtree: true,
    }, config);
    _ELMS.forEach((elm) => {
        if (!isElement(elm)) {
            logger('error', 'Watching target is not an HTML element.', 'force');
            return;
        }
        new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                callback(mutation);
            });
        }).observe(elm, _CONF);
    });
}
/**
 * Fetch data using the specified URL and method.
 * This function as a wrapper for Fetch API.
 */
async function fetchData(url = '', method = 'get', data = {}, datatype = 'json', timeout = 15000) {
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
    const sendData = {
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
    }
    else {
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
        }
        else {
            const errObj = await response.json();
            return Promise.reject({
                code: errObj.code,
                status: errObj.data.status,
                message: errObj.message,
            });
        }
    }
    catch (err) {
        logger('error', 'fetchData::error:', err, 'force');
    }
    finally {
        clearTimeout(timeoutId);
    }
}
/**
 * Set the storage for saving user data on the client side to be used.
 */
function useStge(stge = 'localStorage') {
    const ambientObj = window.$ambient;
    if (ambientObj) {
        ambientObj.useStorage = stge;
    }
    else {
        window.$ambient = { useStorage: stge };
    }
}
/**
 * Store user data in client-side storage.
 */
function saveStge(key, data) {
    const appKey = window.APP_KEY;
    const _data = window[window.$ambient.useStorage].getItem(appKey);
    if (!_data) {
        const newData = {};
        newData[key] = data;
        window[window.$ambient.useStorage].setItem(appKey, JSON.stringify(newData));
        return true;
    }
    try {
        const userData = JSON.parse(_data);
        if (isObject(userData)) {
            userData[key] = data;
            window[window.$ambient.useStorage].setItem(appKey, JSON.stringify(userData));
            return true;
        }
    }
    catch (error) {
        logger(error, _data);
    }
    return false;
}
/**
 * Removes specific properties from user data stored in client-side storage.
 */
function removeStge(key = null) {
    const appKey = window.APP_KEY;
    if (!key) {
        window[window.$ambient.useStorage].removeItem(appKey);
        return true;
    }
    const _data = window[window.$ambient.useStorage].getItem(appKey);
    try {
        const userData = JSON.parse(_data);
        if (isObject(userData) && userData.hasOwnProperty(key)) {
            delete userData[key];
            window[window.$ambient.useStorage].setItem(appKey, JSON.stringify(userData));
            return true;
        }
    }
    catch (error) {
        logger(error, _data);
    }
    return false;
}
/**
 * Logger for frontend of Ambient Media Player.
 */
function logger(...args) {
    const ambientData = window.AmbientData;
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
    return console[type](dateStr, ...args);
}
let noticeHideTimerGlobal = null;
let noticeCleanupTimerGlobal = null;
/**
 * Update notice/notification display.
 */
function updateNotice(notification) {
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
    const $ALERT = document.getElementById('alert-notification');
    const $BUTTON_ALERT_DISMISS = document.getElementById('btn-alert-dismiss');
    const classKey = notification.type;
    const btnClassKey = `btn${notification.type}`;
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
    const hideNotice = () => {
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
        $BUTTON_ALERT_DISMISS.addEventListener('click', (evt) => {
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
}
else if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', init, false);
}
else {
    window.onload = init;
}
//# sourceMappingURL=ambient.js.map