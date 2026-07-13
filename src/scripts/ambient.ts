/**
 * Ambient Media Player v2 - TypeScript Frontend Application
 * Vite entrypoint and compatibility composition root
 */
/// <reference path="./types/index.ts" />
import 'flowbite';
import '../styles/app.css';
import {
  basename as sharedBasename,
  snakeToCapital as sharedSnakeToCapital,
} from './shared/string';
import {
  isLikelyJsonFile as sharedIsLikelyJsonFile,
  isLikelyMediaFile as sharedIsLikelyMediaFile,
  sanitizeMediaDesc as sharedSanitizeMediaDesc,
  sanitizeMediaDescInput as sharedSanitizeMediaDescInput,
  sanitizeMediaDescInputLive as sharedSanitizeMediaDescInputLive,
  sanitizeMediaItemTextFields as sharedSanitizeMediaItemTextFields,
  sanitizeMediaText as sharedSanitizeMediaText,
  sanitizeMediaTextInput as sharedSanitizeMediaTextInput,
} from './shared/media-sanitize';
import {
  inArray as sharedInArray,
  inRange as sharedInRange,
  isObject as sharedIsObject,
} from './shared/validation';
import {
  getCookie,
  isElement,
  mb_strimwidth,
  setStyles,
  setValidated,
  updateCookie,
} from './shared/dom-utils';
import {
  hasPlaylist as platformHasPlaylist,
} from './platform/ambient-data';
import { fetchData } from './platform/fetch-data';
import {
  MYPLAYLIST_KEY,
  USER_DATA_APP_KEY,
} from './platform/storage';
import {
  getRuntimeAmbientData,
  getRuntimeLocalizedMessage,
  runtimeLogger,
  saveStorageAdapter,
  useStorageAdapter,
} from './platform/runtime-support';
import {
  createPlaylistResumeController,
} from './state/playlist-context';
import { createPlaylistResumeBindings } from './state/playlist-resume-bindings';
import {
  readPlaylistOption,
} from './state/playlist-options';
import {
  createShuffledPlaylistItems,
  getMediaCategoryName as getMediaCategoryNameState,
} from './state/playlist-mode-state';
import {
  closeResponsiveDrawers,
  isResponsiveDrawerOpen,
} from './ui/drawers';
import {
  getToggleInput,
} from './ui/settings-view';
import { isFullWindowMode as isFullWindowModeView } from './ui/viewport';
import {
  getPlaylistDescriptionPayload,
  PlaylistMode,
} from './ui/playlist-view';
import { resolveMediaEditElements } from './ui/media-edit/elements';
import {
  createNoticeController,
  dispatchInitialNotice,
  type NoticeController,
} from './ui/notifications';
import {
  syncPlaybackButtonState,
} from './ui/player/player-shell';
import {
  normalizeAmbientVolume,
  resolveAmbientDefaultVolume,
  syncAmbientRangeProgress,
} from './ui/forms/category-volume-bindings';
import {
  createPlaylistLoadGuard,
} from './domain/playlist-loader';
import {
  buildPlaylistJson,
  ensureCloudMyPlaylistSeed as domainEnsureCloudMyPlaylistSeed,
  hasStoredMyPlaylist,
  MYPLAYLIST_NAME,
  writeMyPlaylistJson,
} from './domain/myplaylist-storage';
import { createPlaybackTimerController } from './domain/media-playback';
import { initializeAppControlsRuntime } from './bootstrap/app-controls-runtime-init';
import { createAppControlFacades } from './bootstrap/app-control-facades';
import { createAppControlsPlayerHelpers } from './bootstrap/app-controls-player-helpers';
import { createAppControlsPlaylistHelpers } from './bootstrap/app-controls-playlist-helpers';
import { createAppControlsRuntimeFacade } from './bootstrap/app-controls-runtime-facade';
import { createAppSettingsHelpers } from './bootstrap/app-settings-helpers';
import { createAmbientPlaylistHelpersFacade } from './bootstrap/ambient-playlist-helpers-facade';
import { initializeAmbientStatus, mountYouTubePlayerApi } from './bootstrap/app-runtime-bootstrap';
import { createOptionsModalFacade, createPlaylistDescModalFacade } from './bootstrap/modal-controller-facades';
import { initializeOptionsSurfaceRuntime } from './bootstrap/options-surface-runtime-init';
import { createOptionsSurfaceFacade } from './bootstrap/options-surface-facade';
import { createOptionsSurfacePlaylistHelpers } from './bootstrap/options-surface-playlist-helpers';
import { initializePlaylistModeRuntime } from './bootstrap/playlist-mode-runtime-init';
import { createPlaylistModeRuntimeFacade } from './bootstrap/playlist-mode-runtime-facade';
import { createPlaylistUiFacade } from './bootstrap/playlist-ui-facade';
import { createMediaEditRuntimeFacade } from './bootstrap/media-edit-runtime-facade';
import { createMediaEditPlaylistHelpers } from './bootstrap/media-edit-playlist-helpers';
import { createMediaEditRuntimeWiringFacade } from './bootstrap/media-edit-runtime-wiring-facade';
import { initializeMediaEditRuntimeWiring } from './bootstrap/media-edit-runtime-wiring-init';
import { createPlayerRuntimeWiringFacade } from './bootstrap/player-runtime-wiring-facade';
import { initializeAmbientPlayerRuntimeWiring } from './bootstrap/player-runtime-wiring-init';
import { initializeManagementRuntime } from './bootstrap/management-runtime-init';
import { createManagementImportFacade } from './bootstrap/management-import-facade';
import { createManagementBindingOptionsFacade } from './bootstrap/management-binding-options-facade';
import { createManagementMediaBindingsFacade } from './bootstrap/management-media-bindings-facade';
import { createManagementPlaylistActionsFacade } from './bootstrap/management-playlist-actions-facade';
import { createManagementPlaylistBindingsFacade } from './bootstrap/management-playlist-bindings-facade';
import { createManagementPlaylistUiHelpers } from './bootstrap/management-playlist-ui-helpers';
import { createManagementRuntimeFacade } from './bootstrap/management-runtime-facade';
import { createManagementStateFacade } from './bootstrap/management-state-facade';
import { ensureManagementTargetPlaylist } from './bootstrap/management-target-playlist';
import { createMediaManagementActionBridge } from './bootstrap/management-action-bridge';
import { createStatusWatcherFacade } from './bootstrap/status-watcher-facade';
import { createStatusWatcherViewHelpers } from './bootstrap/status-watcher-view-helpers';
import { createStatusWatcherRuntimeFacade } from './bootstrap/status-watcher-runtime-facade';
import { initializeStatusWatcherRuntime } from './bootstrap/status-watcher-runtime-init';
import { initializePlaylistPolicy } from './bootstrap/playlist-policy-init';
import { createPlaylistResumeBindingsFacade } from './bootstrap/playlist-resume-bindings-facade';
import { createPlaylistSessionFacade } from './bootstrap/playlist-session-facade';
import { canUseAmbientReorderMode } from './bootstrap/playlist-capabilities';
import { initializePlaylistSession } from './bootstrap/playlist-session-init';
import { createAmbientRuntimeSupportFacade } from './bootstrap/ambient-runtime-support-facade';
import {
  getAmbientNoMediaImagePath,
  isAmbientDarkModeEnabled,
} from './bootstrap/display-runtime';
import { createAppBootController } from './bootstrap/app-boot';
import { initializePlaylistUiRuntime } from './bootstrap/playlist-ui-runtime-init';
import { createPlaylistUiRuntimeFacade } from './bootstrap/playlist-ui-runtime-facade';
import { createPlaylistRuntimeViewHelpers } from './bootstrap/playlist-runtime-view-helpers';
import { createPlaylistRuntimeWiringFacade } from './bootstrap/playlist-runtime-wiring-facade';
import { initializePlaylistRuntimeWiring } from './bootstrap/playlist-runtime-wiring-init';
import { createPlaylistStartupRuntimeFacade } from './bootstrap/playlist-startup-runtime-facade';
import { initializePlaylistStartupRuntime } from './bootstrap/playlist-startup-runtime-init';
import { initializeViewportLifecycleRuntime } from './bootstrap/viewport-lifecycle-runtime-init';
import { createViewportRuntimeWiringFacade } from './bootstrap/viewport-runtime-wiring-facade';
import { initializeViewportRuntimeWiring } from './bootstrap/viewport-runtime-wiring-init';
import {
  getCloudImportSizeLimitBytes as getCloudImportSizeLimitBytesDomain,
  parseImportedPlaylistJson,
  postImportedPlaylist,
  persistImportedCloudPlaylist,
  resolveImportedPlaylistPersistResult,
  sanitizeAndNormalizeImportPlaylist as sanitizeAndNormalizeImportPlaylistDomain,
  validatePlaylistSchemaContract as validatePlaylistSchemaContractDomain,
} from './domain/playlist-import';

// ============================================================================
// INITIALIZATION
// ============================================================================

const init = function (): void {
  const selfURL = new URL(window.location.href);
  const BASE_URL = selfURL.origin + selfURL.pathname;
  const isE2EMode = selfURL.searchParams.get('e2e') === '1';

  if (!window.hasOwnProperty('APP_KEY')) {
    (window as any).APP_KEY = USER_DATA_APP_KEY;
  }

  useStorageAdapter();
  const AMP_STATUS = initializeAmbientStatus((window as any).$ambient);
  const logger = runtimeLogger;
  const getAmbientData = getRuntimeAmbientData;
  const getLocalizedMessage = getRuntimeLocalizedMessage;
  const BOOT_SPLASH_MIN_VISIBLE_MS = isE2EMode ? 0 : 2400;
  const BOOT_SPLASH_FADE_MS = 220;
  const appBoot = createAppBootController({
    body: document.body,
    splash: document.getElementById('app-boot-splash'),
    minVisibleMs: BOOT_SPLASH_MIN_VISIBLE_MS,
    fadeMs: BOOT_SPLASH_FADE_MS,
    onReady: () => {
      viewportRuntime.syncMetrics();
      viewportRuntime.updateWindowSize();
    },
  });

  appBoot.setBootState('pending');
  appBoot.setPlaylistReadyState(false);

  // Fail-safe: never leave the UI hidden even if initialization errors occur.
  window.setTimeout(() => {
    appBoot.forceRelease();
  }, 3500);

  // Window sizes container
  const currentWindowSize: WindowSize = {
    width: window.innerWidth,
    height: window.innerHeight,
    minFullUIWidth: 1282, // = 320 + 1 + 640 + 1 + 320
  };

  let player: YTPlayer | undefined;

  const playbackTimers = createPlaybackTimerController();
  let noticeController: NoticeController | null = null;
  const updateNoticeController = (notification: NotificationPayload): void => {
    noticeController?.update(notification);
  };
  const runtimeSupport = createAmbientRuntimeSupportFacade({
    status: AMP_STATUS,
    playbackTimers,
    updateNotice: updateNoticeController,
  });
  const {
    syncYouTubeSignalAttrs,
    emitYouTubeSignal,
    updateNotice,
    abortSeeking,
    abortFader,
    abortPlaybackTimers,
  } = runtimeSupport;
  mountYouTubePlayerApi({ emitYouTubeSignal });

  // ============================================================================
  // CLOUD: MyPlaylist – localStorage persistence
  // ============================================================================
  const MEDIA_TITLE_MAX_LENGTH = 100;
  const MEDIA_ARTIST_MAX_LENGTH = 100;
  const MEDIA_DESC_MAX_LENGTH = 500;
  const CLOUD_IMPORT_SIZE_LIMIT_BYTES = {
    mobile: 1 * 1024 * 1024,
    tablet: 2 * 1024 * 1024,
    desktop: 4 * 1024 * 1024,
    unknown: 1 * 1024 * 1024,
  } as const;
  const DISALLOWED_CONTROL_CHARS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
  const DEFAULT_VOLUME = 50;
  const playlistLoadGuard = createPlaylistLoadGuard();
  const playlistResume = createPlaylistResumeController();
  function getOption<K extends Extract<keyof PlaylistOptions, string>>(
    key: K
  ): Exclude<PlaylistOptions[K], undefined> | null {
    return readPlaylistOption<PlaylistOptions, K>(AMP_STATUS, key, MYPLAYLIST_NAME);
  }
  const playlistHelpers = createAmbientPlaylistHelpersFacade({
    status: AMP_STATUS,
    buildPlaylistJson,
    sanitizeText: (value, maxLength) => sharedSanitizeMediaText(value, maxLength, DISALLOWED_CONTROL_CHARS_RE),
    sanitizeDesc: (value, maxLength = MEDIA_DESC_MAX_LENGTH) => {
      return sharedSanitizeMediaDesc(value, maxLength, DISALLOWED_CONTROL_CHARS_RE);
    },
  });
  const { generatePlaylistJson, sanitizeMediaText, sanitizeMediaDesc } = playlistHelpers;

  const {
    getSavedPlaylistContext,
    savePlaylistContext,
    isPlaylistAvailableForResume,
    requestCategoryResume,
    requestMediaResume,
    applyPendingCategoryResume,
    applyPendingMediaResume,
  } = createPlaylistResumeBindings(createPlaylistResumeBindingsFacade({
    status: AMP_STATUS,
    playlistResume,
    sanitizeMediaText,
    titleMaxLength: MEDIA_TITLE_MAX_LENGTH,
    artistMaxLength: MEDIA_ARTIST_MAX_LENGTH,
    hasStoredMyPlaylist: () => localStorage.getItem(MYPLAYLIST_KEY) !== null,
    isCloudMode: () => getRuntimeAmbientData()?.isCloud === true,
    myPlaylistName: MYPLAYLIST_NAME,
    hasPlaylist: platformHasPlaylist,
    onCategoryResumeApplied: (nextCategoryId) => {
      AMP_STATUS.ctg = nextCategoryId;
      playlistUiFacade.syncTargetCategorySelection();
    },
    onMediaResumeApplied: (resumeAmId) => {
      updatePlayStatus(resumeAmId);
    },
  }));

  // DOM Elements
  const $BODY = document.body;
  const $ALERT = document.getElementById('alert-notification') as HTMLElement;
  const $BUTTON_ALERT_DISMISS = document.getElementById('btn-alert-dismiss') as HTMLElement | null;
  const $ALERT_MESSAGE = $ALERT?.querySelector('#alert-message') as HTMLElement | null;
  const $SELECT_PLAYLIST = document.getElementById('current-playlist') as HTMLSelectElement;
  const $SELECT_CATEGORY = document.getElementById('target-category') as HTMLSelectElement;
  const $TOGGLE_LOOP = document.getElementById('toggle-loop') as HTMLElement;
  const $TOGGLE_RANDOMLY = document.getElementById('toggle-randomly') as HTMLElement;
  const $TOGGLE_SHUFFLE = document.getElementById('toggle-shuffle') as HTMLElement;
  const $TOGGLE_SEEKPLAY = document.getElementById('toggle-seekplay') as HTMLElement;
  const $TOGGLE_WINDOW_FULL = document.getElementById('toggle-window-full') as HTMLElement;
  const toggleWindowFullInput = getToggleInput($TOGGLE_WINDOW_FULL);
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

  noticeController = createNoticeController({
    alertElement: $ALERT,
    dismissButton: $BUTTON_ALERT_DISMISS,
    messageElement: $ALERT_MESSAGE,
    logger,
  });
  const $BUTTON_CLOSE_PLAYLIST_DESC = document.getElementById('btn-close-playlist-desc') as HTMLButtonElement | null;
  const mediaEditElements = resolveMediaEditElements(document);
  const $COLLAPSE_MENU = document.getElementById('collapse-menu') as HTMLElement;

  // Add elements since v1.1.0
  const $MEDIA_CATEGORY_SELECT = document.getElementById('media-category') as HTMLSelectElement;
  const $MEDIA_VOLUME = document.getElementById('media-volume') as HTMLInputElement | null;
  if (isElement($MODAL_OPTIONS) && $MODAL_OPTIONS.parentElement !== document.body) {
    document.body.appendChild($MODAL_OPTIONS);
  }
  if (isElement($MODAL_PLAYLIST_DESC) && $MODAL_PLAYLIST_DESC.parentElement !== document.body) {
    document.body.appendChild($MODAL_PLAYLIST_DESC);
  }
  if (isElement(mediaEditElements.modal) && mediaEditElements.modal.parentElement !== document.body) {
    document.body.appendChild(mediaEditElements.modal);
  }

  const {
    canMutateCurrentPlaylist,
    applyCloudEditRestrictions,
  } = initializePlaylistPolicy({
    getAmbientData,
    getRuntimeAmbientData,
    getCurrentPlaylist: () => AMP_STATUS.playlist,
    myPlaylistName: MYPLAYLIST_NAME,
    mediaForm: document.querySelector('form[name="mediaManagement"]') as HTMLFormElement | null,
    playlistForm: document.querySelector('form[name="playlistManagement"]') as HTMLFormElement | null,
    readonlyTitle: 'Editing existing playlists is not available in cloud mode.',
  });

  const {
    isPlaylistLoadActive,
    beginPlaylistLoad,
    finishPlaylistLoad,
    resetPlaylistRuntimeState,
    persistMyPlaylistIfNeeded,
  } = initializePlaylistSession(createPlaylistSessionFacade({
    status: AMP_STATUS,
    playlistLoadGuard,
    myPlaylistName: MYPLAYLIST_NAME,
    getRuntimeAmbientData,
    applyCloudEditRestrictions,
    setPlaylistReadyState: (isReady) => {
      appBoot.setPlaylistReadyState(isReady);
    },
    clearCategory: () => {
      playlistUiFacade.clearCategory();
    },
    updatePlaylist: () => {
      playlistUiFacade.updatePlaylist();
    },
    generatePlaylistJson: (seekFormat) => buildPlaylistJson({
      mediaItems: AMP_STATUS.media || [],
      categories: AMP_STATUS.category || [],
      playlistOptions: AMP_STATUS.options,
      seekFormat,
    }),
    writeMyPlaylistJson,
    logger: runtimeLogger,
  }));

  const viewportRuntime = initializeViewportRuntimeWiring(createViewportRuntimeWiringFacade({
    body: $BODY,
    menu: $MENU,
    menuCollapseButton: $BUTTON_MENU_COLLAPSE,
    toggleWindowFullInput,
    drawerPlaylist: $DRAWER_PLAYLIST,
    drawerSettings: $DRAWER_SETTINGS,
    playlistButton: $BUTTON_PLAYLIST,
    settingsButton: $BUTTON_SETTINGS,
    currentWindowSize,
    buttonWindowFull: $BUTTON_WINDOW_FULL,
    mediaCaption: $MEDIA_CAPTION,
    status: AMP_STATUS,
    persistMyPlaylistIfNeeded,
    getPlayer: () => player,
  }));

  const playlistDescModal = createPlaylistDescModalFacade({
    elements: {
      modal: $MODAL_PLAYLIST_DESC,
      title: $MODAL_PLAYLIST_DESC_TITLE,
      artist: $MODAL_PLAYLIST_DESC_ARTIST,
      content: $MODAL_PLAYLIST_DESC_CONTENT,
    },
    sanitizers: {
      title: (value: string) => sanitizeMediaText(value, MEDIA_TITLE_MAX_LENGTH),
      artist: (value: string) => sanitizeMediaText(value, MEDIA_ARTIST_MAX_LENGTH),
      desc: (value: string) => sanitizeMediaDesc(value, MEDIA_DESC_MAX_LENGTH),
    },
  });
  const optionsModal = createOptionsModalFacade({
    options: {
      elements: {
        modal: $MODAL_OPTIONS,
        panel: $MODAL_OPTIONS_PANEL,
      },
    getLayout: () => ({
      width: currentWindowSize.width,
      minFullUIWidth: currentWindowSize.minFullUIWidth,
    }),
      beforeShow: () => {
        if (
          currentWindowSize.width < currentWindowSize.minFullUIWidth &&
          isResponsiveDrawerOpen($DRAWER_PLAYLIST, '-translate-x-full')
        ) {
          (document.getElementById('btn-close-playlist') as HTMLButtonElement | null)?.click();
        }
        if (
          currentWindowSize.width < currentWindowSize.minFullUIWidth &&
          isResponsiveDrawerOpen($DRAWER_SETTINGS, 'translate-x-full')
        ) {
          (document.getElementById('btn-close-settings') as HTMLButtonElement | null)?.click();
        }
      },
    },
  });
  const MEDIA_EDIT_DRAFT_STORAGE_KEY = 'ambient:media-edit-drafts:v2.5.0';
  const MEDIA_EDIT_PREVIEW_YT_PLAYER_ID = 'modal-media-edit-preview-yt-player';
  const mediaEditDurationSyncTimeoutEnv = Number(import.meta.env.VITE_MEDIA_EDIT_DURATION_SYNC_TIMEOUT_MS);
  const MEDIA_EDIT_DURATION_SYNC_TIMEOUT_MS = Number.isFinite(mediaEditDurationSyncTimeoutEnv)
    && mediaEditDurationSyncTimeoutEnv >= 0
    ? Math.trunc(mediaEditDurationSyncTimeoutEnv)
    : 5000;
  const MEDIA_EDIT_DURATION_SYNC_POLL_MS = 250;
  const MEDIA_EDIT_SAVE_ENDPOINT = 'playlist-save';
  const MEDIA_EDIT_THUMBNAIL_ENDPOINT = 'thumbnail';
  const mediaEditPlaylistHelpers = createMediaEditPlaylistHelpers(() => playlistUiFacade);
  const mediaEditRuntime = initializeMediaEditRuntimeWiring(createMediaEditRuntimeWiringFacade({
    elements: mediaEditElements,
    status: AMP_STATUS,
    baseUrl: BASE_URL,
    playlistListElement: $LIST_PLAYLIST,
    playButton: $BUTTON_PLAY,
    pauseButton: $BUTTON_PAUSE,
    youtubePlayer: player || null,
    playlistMode: () => playlistMode,
    closePlaylistModeMenu: () => {
      closePlaylistModeMenu();
    },
    defaultVolume: DEFAULT_VOLUME,
    mediaTitleMaxLength: MEDIA_TITLE_MAX_LENGTH,
    mediaArtistMaxLength: MEDIA_ARTIST_MAX_LENGTH,
    mediaDescMaxLength: MEDIA_DESC_MAX_LENGTH,
    disallowedControlChars: DISALLOWED_CONTROL_CHARS_RE,
    draftStorageKey: MEDIA_EDIT_DRAFT_STORAGE_KEY,
    previewPlayerId: MEDIA_EDIT_PREVIEW_YT_PLAYER_ID,
    durationSyncTimeoutMs: MEDIA_EDIT_DURATION_SYNC_TIMEOUT_MS,
    durationSyncPollMs: MEDIA_EDIT_DURATION_SYNC_POLL_MS,
    saveEndpoint: MEDIA_EDIT_SAVE_ENDPOINT,
    thumbnailEndpoint: MEDIA_EDIT_THUMBNAIL_ENDPOINT,
    getLocalizedMessage,
    updateNotice,
    getOption: (key) => getOption(key as Extract<keyof PlaylistOptions, string>),
    sanitizeMediaText: sanitizeMediaText,
    persistCloudPlaylist: persistMyPlaylistIfNeeded,
    generatePlaylistJson: (pretty = false) => generatePlaylistJson(pretty),
    updatePlayStatus: (amId) => {
      updatePlayStatus(amId);
    },
    getMediaCategoryName: (mediaItem) => getMediaCategoryNameState(mediaItem, AMP_STATUS.category),
    clearCategory: mediaEditPlaylistHelpers.clearCategory,
    updateCategory: mediaEditPlaylistHelpers.updateCategory,
    syncMediaCategoryField: mediaEditPlaylistHelpers.syncMediaCategoryField,
    getActiveCategoryId: mediaEditPlaylistHelpers.getActiveCategoryId,
    updatePlaylist: mediaEditPlaylistHelpers.updatePlaylist,
    confirm: (message) => window.confirm(message),
  }));
  const mediaEditFacade = createMediaEditRuntimeFacade(mediaEditRuntime);

  // Playlist operation mode UI (v2.2.0 Slice A)
  const $BUTTON_PLAYLIST_MODE = document.getElementById('btn-playlist-mode') as HTMLButtonElement | null;
  const $PLAYLIST_MODE_MENU = document.getElementById('playlist-mode-menu') as HTMLElement | null;
  const $PLAYLIST_MODE_BUTTON_ICON = document.getElementById('playlist-mode-button-icon') as HTMLElement | null;
  const $PLAYLIST_MODE_BUTTON_LABEL = document.getElementById('playlist-mode-button-label') as HTMLElement | null;
  let playlistMode: PlaylistMode = 'normal';
  const defaultPlaylistModeButtonIcon = $PLAYLIST_MODE_BUTTON_ICON ? $PLAYLIST_MODE_BUTTON_ICON.innerHTML : '';
  const defaultPlaylistModeButtonLabel =
    $PLAYLIST_MODE_BUTTON_LABEL?.textContent || $BUTTON_PLAYLIST_MODE?.dataset['labelModeChange'] || 'Mode Change';
  const playlistModeUi = {
    button: $BUTTON_PLAYLIST_MODE,
    menu: $PLAYLIST_MODE_MENU,
    buttonIcon: $PLAYLIST_MODE_BUTTON_ICON,
    buttonLabel: $PLAYLIST_MODE_BUTTON_LABEL,
  };

  let deleteSelectedIds = new Set<number>();
  let playlistUiBindings: ReturnType<typeof initializePlaylistUiRuntime> | null = null;
  const playlistUiFacade = createPlaylistUiFacade(() => playlistUiBindings);

  const {
    closePlaylistModeMenu,
    destroyPlaylistSortable,
    ensurePlaylistSortable,
    isPlaylistInteractionLocked,
    resetReorderState,
    syncDeleteSelectionIndicator,
    syncPlaylistModeAvailability,
    updatePlaylistModeUi: updatePlaylistModeUI,
  } = initializePlaylistModeRuntime(createPlaylistModeRuntimeFacade({
    document,
    playlistModeUi,
    defaultPlaylistModeButtonIcon,
    defaultPlaylistModeButtonLabel,
    listElement: $LIST_PLAYLIST,
    getPlaylistMode: () => playlistMode,
    setPlaylistModeState: (mode) => {
      playlistMode = mode;
    },
    getCategoryId: () => AMP_STATUS.ctg,
    getMediaItems: () => AMP_STATUS.media,
    getPlaylistName: () => AMP_STATUS.playlist,
    setMediaItems: (mediaItems) => {
      AMP_STATUS.media = mediaItems;
    },
    canMutateCurrentPlaylist,
    myPlaylistName: MYPLAYLIST_NAME,
    hasStoredMyPlaylist: () => localStorage.getItem(MYPLAYLIST_KEY) !== null,
    getDeleteSelectedIds: () => deleteSelectedIds,
    clearDeleteSelections: () => {
      deleteSelectedIds.clear();
    },
    canDiscardEditLeave: mediaEditFacade.confirmDiscard,
    discardEditState: () => {
      mediaEditFacade.discardDraft();
      mediaEditFacade.hideModal(false);
      mediaEditFacade.clearContext();
    },
    updatePlaylist: () => {
      playlistUiFacade.updatePlaylist();
    },
    persistCurrentPlaylistMutation: async () => mediaEditFacade.persistCurrentPlaylist(AMP_STATUS.media || []),
    updateNotice,
    getLocalizedMessage,
  }));

  const mediaManagementActionBridge = createMediaManagementActionBridge();
  playlistUiBindings = initializePlaylistUiRuntime(createPlaylistUiRuntimeFacade({
    document,
    status: AMP_STATUS,
    getOption: (key) => getOption(key as Extract<keyof PlaylistOptions, string>),
    playlistMode: playlistMode,
    setPlaylistMode: (mode) => {
      playlistMode = mode;
    },
    deleteSelectedIds,
    getEditSelectedId: () => mediaEditFacade.getActiveItem()?.amId ?? null,
    playlistList: $LIST_PLAYLIST,
    targetCategorySelect: isElement($SELECT_CATEGORY) ? $SELECT_CATEGORY : null,
    mediaCategorySelect: isElement($MEDIA_CATEGORY_SELECT) ? $MEDIA_CATEGORY_SELECT : null,
    canUseReorderMode: () => canUseAmbientReorderMode({
      canMutatePlaylist: canMutateCurrentPlaylist(),
      categoryId: AMP_STATUS.ctg,
      mediaItems: AMP_STATUS.media,
    }),
    canMutateCurrentPlaylist,
    ambientData: (window as any).AmbientData as { imageDir?: string; debug?: boolean } | null,
    getNoMediaImagePath: (kind) => getAmbientNoMediaImagePath(AMP_STATUS.options, kind),
    openMediaManagement: (presetCategoryId) => {
      mediaManagementActionBridge.open(presetCategoryId);
    },
    trimTitle: (value: string) => mb_strimwidth(value, 0, 50, '...'),
    destroyPlaylistSortable,
    closePlaylistDescModal: () => {
      playlistDescModal.close(false);
    },
    syncPlaylistModeAvailability,
    closePlaylistModeMenu,
    setPlaylistReadyState: (isReady) => {
      appBoot.setPlaylistReadyState(isReady);
    },
    resetReorderState,
    updatePlaylistModeUi: updatePlaylistModeUI,
    ensurePlaylistSortable,
    execDebug,
    logger,
    applyCloudEditRestrictions,
    onShuffleItemsChanged: (items) => {
      AMP_STATUS.shuffle = items;
    },
  }));
  const statusWatcherViewHelpers = createStatusWatcherViewHelpers({
    playlistList: $LIST_PLAYLIST,
    getCurrentMediaId: () => AMP_STATUS.current,
    playButton: $BUTTON_PLAY,
    pauseButton: $BUTTON_PAUSE,
    hasMediaItems: () => AMP_STATUS.media !== null && AMP_STATUS.media.length > 0,
  });

  const statusWatcherFacade = createStatusWatcherFacade({
    document,
    windowObject: window,
    status: AMP_STATUS as unknown as Record<string, unknown> & {
      current?: number | null;
      order?: string | null;
      media?: unknown[] | null;
      category?: string[] | null;
      ctg?: number | null;
      volume?: number | null;
      options?: Record<string, unknown>;
      shuffle?: unknown[] | null;
    },
    runtimeLogger,
    saveStorageAdapter,
    savePlaylistContext,
    listElement: $LIST_PLAYLIST,
    randomToggleRoot: $TOGGLE_RANDOMLY,
    shuffleToggleRoot: $TOGGLE_SHUFFLE,
    seekToggleRoot: $TOGGLE_SEEKPLAY,
    faderToggleRoot: $TOGGLE_FADER,
    darkModeToggleRoot: $TOGGLE_DARKMODE,
    playButton: $BUTTON_PLAY,
    pauseButton: $BUTTON_PAUSE,
    body: $BODY,
    menu: $MENU,
    volumeRange: $RANGE_VOLUME,
    mediaVolumeInput: $MEDIA_VOLUME,
    defaultVolume: DEFAULT_VOLUME,
    getOption: (key) => getOption(key),
    updatePlaylistCategory: () => {
      playlistUiFacade.updateCategory();
    },
    updateNotice,
    syncPlaylistCurrentFocus: statusWatcherViewHelpers.syncPlaylistCurrentFocus,
    scrollPlaylistToCurrentFocus: statusWatcherViewHelpers.scrollPlaylistToCurrentFocus,
    syncPlaybackButtons: statusWatcherViewHelpers.syncPlaybackButtons,
    syncYouTubeSignalAttrs,
    setStyles,
    setFullWindowMode: (enabled, syncOption = true, closeDrawers = false) => {
      viewportRuntime.setFullWindowMode(enabled, syncOption, closeDrawers);
    },
  });
  initializeStatusWatcherRuntime(createStatusWatcherRuntimeFacade(statusWatcherFacade));
  const optionsSurfacePlaylistHelpers = createOptionsSurfacePlaylistHelpers(playlistUiFacade);

  const optionsModalBindings = initializeOptionsSurfaceRuntime(createOptionsSurfaceFacade({
    document,
    alertElement: $ALERT,
    noticeController,
    triggerButton: $BUTTON_OPTIONS,
    closeButton: $BUTTON_CLOSE_OPTIONS,
    optionsButton: $BUTTON_OPTIONS,
    playlistButton: $BUTTON_PLAYLIST,
    settingsButton: $BUTTON_SETTINGS,
    modal: $MODAL_OPTIONS,
    drawerPlaylist: $DRAWER_PLAYLIST,
    drawerSettings: $DRAWER_SETTINGS,
    collapseMenu: $COLLAPSE_MENU,
    optionsModal,
    playlistDescModal,
    playlistDescCloseButton: $BUTTON_CLOSE_PLAYLIST_DESC,
    playlistDescBackdrop: $MODAL_PLAYLIST_DESC_BACKDROP,
    mediaEditModal: mediaEditElements.modal,
    mediaVolumeInput: $MEDIA_VOLUME,
    playlistList: $LIST_PLAYLIST,
    defaultVolume: DEFAULT_VOLUME,
    getVolumeOption: () => getOption('volume'),
    getActiveCategoryId: optionsSurfacePlaylistHelpers.getActiveCategoryId,
    clearCategory: optionsSurfacePlaylistHelpers.clearCategory,
    updateCategory: optionsSurfacePlaylistHelpers.updateCategory,
    syncMediaCategoryField: optionsSurfacePlaylistHelpers.syncMediaCategoryField,
    closeMediaEditCategoryDropdown: mediaEditFacade.closeCategoryDropdown,
    closeMediaEditModal: mediaEditFacade.closeModal,
    isMediaEditCategoryDropdownVisible: mediaEditFacade.isCategoryDropdownVisible,
  }));
  const hideOptionsModal = optionsModalBindings.hideOptionsModal;
  const openMediaManagement = optionsModalBindings.openMediaManagement;
  mediaManagementActionBridge.setOpenAction(openMediaManagement);
  const appControlsPlaylistHelpers = createAppControlsPlaylistHelpers({
    getPlaylistMode: () => playlistMode,
    clearDeleteSelections: () => {
      deleteSelectedIds.clear();
    },
    resetReorderState,
    clearMediaEditContext: mediaEditFacade.clearContext,
    updatePlaylistModeUi: updatePlaylistModeUI,
    updatePlaylist: () => {
      playlistUiFacade.updatePlaylist();
    },
    isPlaylistInteractionLocked,
    openDescriptionModal: (payload) => {
      playlistDescModal.open(payload.titleText, payload.artistText, payload.descText, payload.trigger);
    },
    getDescriptionPayload: getPlaylistDescriptionPayload,
    openMediaEditModal: mediaEditFacade.openModal,
    loadPlaylist: (playlist) => {
      void getPlaylistData(playlist);
    },
    canDiscardEditMode: () => mediaEditFacade.confirmDiscard(),
    hideMediaEditModal: () => {
      mediaEditFacade.hideModal(false);
    },
    resetPlaylistMode: () => {
      playlistMode = 'normal';
    },
  });
  const appSettingsHelpers = createAppSettingsHelpers({
    shufflePlaylist: () => createShuffledPlaylistItems({
      mediaItems: AMP_STATUS.media,
      categoryId: AMP_STATUS.ctg,
      shuffleEnabled: true,
    }),
    persistMyPlaylistIfNeeded,
    normalizeVolume: (value) => normalizeAmbientVolume(value, DEFAULT_VOLUME),
    syncRangeProgress: (range) => syncAmbientRangeProgress(range, DEFAULT_VOLUME),
    isDarkModeEnabled: () => isAmbientDarkModeEnabled({ playlistOptions: AMP_STATUS.options }),
  });
  const appControlsPlayerHelpers = createAppControlsPlayerHelpers({
    playItem: (target) => {
      playItem(target);
    },
    playItemById: (playId) => {
      playItem(null, playId);
    },
    isFullWindowMode: () => isFullWindowModeView($BODY),
    setFullWindowMode: (enabled, syncOption = true, closeDrawers = false) => {
      viewportRuntime.setFullWindowMode(enabled, syncOption, closeDrawers);
    },
    setMenuMinimized: (minimized) => {
      viewportRuntime.setMenuMinimized(minimized);
    },
    getPlayer: () => player,
  });

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const { appControlsFacade, appSettingsFacade } = createAppControlFacades({
    appControls: {
      status: AMP_STATUS,
      listElement: $LIST_PLAYLIST,
      getPlaylistMode: appControlsPlaylistHelpers.getPlaylistMode,
      clearDeleteSelections: appControlsPlaylistHelpers.clearDeleteSelections,
      resetReorderState: appControlsPlaylistHelpers.resetReorderState,
      clearMediaEditContext: appControlsPlaylistHelpers.clearMediaEditContext,
      updatePlaylistModeUi: appControlsPlaylistHelpers.updatePlaylistModeUi,
      updatePlaylist: appControlsPlaylistHelpers.updatePlaylist,
      deleteSelectedIds,
      syncDeleteSelectionIndicator,
      isPlaylistInteractionLocked: appControlsPlaylistHelpers.isPlaylistInteractionLocked,
      openDescriptionModal: appControlsPlaylistHelpers.openDescriptionModal,
      getDescriptionPayload: appControlsPlaylistHelpers.getDescriptionPayload,
      openMediaEditModal: appControlsPlaylistHelpers.openMediaEditModal,
      loadPlaylist: appControlsPlaylistHelpers.loadPlaylist,
      canDiscardEditMode: appControlsPlaylistHelpers.canDiscardEditMode,
      hideMediaEditModal: appControlsPlaylistHelpers.hideMediaEditModal,
      resetPlaylistMode: appControlsPlaylistHelpers.resetPlaylistMode,
      carouselPrevButton: $CAROUSEL_PREV,
      carouselNextButton: $CAROUSEL_NEXT,
      refreshButton: $BUTTON_REFRESH,
      windowFullButton: $BUTTON_WINDOW_FULL,
      windowFullToggle: toggleWindowFullInput,
      menuCollapseButton: $BUTTON_MENU_COLLAPSE,
      playButton: $BUTTON_PLAY,
      pauseButton: $BUTTON_PAUSE,
      menuElement: $MENU,
      playItem: appControlsPlayerHelpers.playItem,
      playItemById: appControlsPlayerHelpers.playItemById,
      isFullWindowMode: appControlsPlayerHelpers.isFullWindowMode,
      setFullWindowMode: appControlsPlayerHelpers.setFullWindowMode,
      setMenuMinimized: appControlsPlayerHelpers.setMenuMinimized,
      getPlayer: appControlsPlayerHelpers.getPlayer,
    },
    appSettings: {
      status: AMP_STATUS as typeof AMP_STATUS & {
        ctg: number | null;
        playlist?: string | null;
        options: Record<string, unknown>;
      },
      loopToggleRoot: $TOGGLE_LOOP,
      randomlyToggleRoot: $TOGGLE_RANDOMLY,
      shuffleToggleRoot: $TOGGLE_SHUFFLE,
      seekToggleRoot: $TOGGLE_SEEKPLAY,
      faderToggleRoot: $TOGGLE_FADER,
      darkModeToggleRoot: $TOGGLE_DARKMODE,
      volumeRange: $RANGE_VOLUME,
      shufflePlaylist: appSettingsHelpers.shufflePlaylist,
      persistMyPlaylistIfNeeded: appSettingsHelpers.persistMyPlaylistIfNeeded,
      normalizeVolume: appSettingsHelpers.normalizeVolume,
      syncRangeProgress: appSettingsHelpers.syncRangeProgress,
      isDarkModeEnabled: appSettingsHelpers.isDarkModeEnabled,
      setStyles,
    },
  });

  const appControlsRuntimeFacade = createAppControlsRuntimeFacade({
    document,
    windowObject: window,
    status: AMP_STATUS as typeof AMP_STATUS & {
      prev: number | null;
      next: number | null;
      ctg: number | null;
      current: number | null;
      volume: number | null;
      shuffle?: MediaItem[] | null;
      media?: MediaItem[] | null;
      order: 'random' | 'normal';
      playertype: string | null;
      options: Record<string, unknown>;
    },
    selectors: {
      playlistSelect: $SELECT_PLAYLIST,
      categorySelect: $SELECT_CATEGORY,
      languageSelect: $SELECT_LANGUAGE,
    },
    appControls: appControlsFacade,
    appSettings: appSettingsFacade,
    getCookie,
    updateCookie,
    logger,
  });
  initializeAppControlsRuntime(appControlsRuntimeFacade);
  const playlistRuntimeViewHelpers = createPlaylistRuntimeViewHelpers({
    playlistUiFacade,
    getMediaItems: () => AMP_STATUS.media,
    getCategoryId: () => AMP_STATUS.ctg,
    setPlaylistReadyState: (isReady) => {
      appBoot.setPlaylistReadyState(isReady);
    },
    releaseAppBootGate: () => {
      appBoot.release();
    },
  });

  const { updatePlayStatus, playItem } = initializeAmbientPlayerRuntimeWiring(createPlayerRuntimeWiringFacade({
    status: AMP_STATUS,
    body: $BODY,
    menu: $MENU,
    embedWrapper: $EMBED_WRAPPER,
    watchButton: $BUTTON_WATCH_TY,
    optionalContainer: $OPTIONAL_CONTAINER,
    playButton: $BUTTON_PLAY,
    pauseButton: $BUTTON_PAUSE,
    carouselWrapper: $CAROUSEL_WRAPPER as HTMLElement,
    carouselPrevButton: $CAROUSEL_PREV as HTMLButtonElement,
    carouselNextButton: $CAROUSEL_NEXT as HTMLButtonElement,
    mediaCaption: $MEDIA_CAPTION,
    currentWindowSize,
    defaultVolume: DEFAULT_VOLUME,
    imageDir: ((window as any).AmbientData as AmbientData | undefined)?.imageDir,
    getOption,
    logger,
    getLocalizedMessage,
    updateNotice,
    closeResponsiveDrawers,
    syncPlaybackButtonState,
    abortPlaybackTimers,
    abortSeeking,
    abortFader,
    isSeekActive: () => playbackTimers.isSeekActive(),
    startSeek: (callback, intervalMs) => playbackTimers.startSeek(callback, intervalMs),
    startFader: (type, callback, intervalMs) => playbackTimers.startFader(type, callback, intervalMs),
    emitYouTubeSignal,
    sanitizeTitle: (value: string) => sanitizeMediaText(value, MEDIA_TITLE_MAX_LENGTH),
    sanitizeArtist: (value: string) => sanitizeMediaText(value, MEDIA_ARTIST_MAX_LENGTH),
    resolvePlayingState: () => (window as any).YT.PlayerState.PLAYING,
    setPlayer: (nextPlayer) => {
      player = nextPlayer;
    },
  }));

  const {
    ensureMyPlaylistOptionFromStorage,
    initMyPlaylistFromStorage,
    getPlaylistData,
  } = initializePlaylistRuntimeWiring(createPlaylistRuntimeWiringFacade({
    status: AMP_STATUS,
    ambientData: ((window as any).AmbientData as AmbientData | undefined) ?? null,
    myPlaylistName: MYPLAYLIST_NAME,
    hasStoredMyPlaylist,
    selectElement: isElement($SELECT_PLAYLIST) ? $SELECT_PLAYLIST : null,
    sanitizeMediaItem: <T extends Partial<MediaItem>>(item: T): T => sharedSanitizeMediaItemTextFields({
      item,
      titleMaxLength: MEDIA_TITLE_MAX_LENGTH,
      artistMaxLength: MEDIA_ARTIST_MAX_LENGTH,
      descMaxLength: MEDIA_DESC_MAX_LENGTH,
      disallowedControlChars: DISALLOWED_CONTROL_CHARS_RE,
    }),
    applyPendingCategoryResume,
    applyPendingMediaResume,
    updatePlaylist: playlistRuntimeViewHelpers.updatePlaylist,
    updatePlayStatus,
    getDefaultMediaItemForCurrentView: playlistRuntimeViewHelpers.getDefaultMediaItemForCurrentView,
    logger,
    resetPlaylistRuntimeState,
    applyCloudEditRestrictions,
    setPlaylistReadyState: playlistRuntimeViewHelpers.setPlaylistReadyState,
    beginPlaylistLoad,
    isPlaylistLoadActive,
    finishPlaylistLoad,
    releaseAppBootGate: playlistRuntimeViewHelpers.releaseAppBootGate,
    fetchData,
    baseUrl: BASE_URL,
  }));

  // Process global data passed by the system.
  // In cloud mode: load MyPlaylist from localStorage before processing server data.
  // (Placed here, AFTER runtime bindings, to avoid dependency initialization gaps.)
  const savedPlaylistContext = getSavedPlaylistContext();
  domainEnsureCloudMyPlaylistSeed(logger);
  ensureMyPlaylistOptionFromStorage();
  const playlistStartupRuntimeFacade = createPlaylistStartupRuntimeFacade({
    ambientData: ((window as any).AmbientData as AmbientData | undefined) ?? null,
    hasStoredMyPlaylist: localStorage.getItem(MYPLAYLIST_KEY) !== null,
    isPlaylistAvailableForResume,
    myPlaylistName: MYPLAYLIST_NAME,
    savedPlaylistContext,
    requestCategoryResume,
    requestMediaResume,
    selectElement: isElement($SELECT_PLAYLIST) ? $SELECT_PLAYLIST : null,
    loadPlaylist: getPlaylistData,
    initMyPlaylistFromStorage,
    setPlaylistReadyState: (isReady) => {
      appBoot.setPlaylistReadyState(isReady);
    },
    releaseAppBoot: () => {
      appBoot.release();
    },
  });
  const { activateImportedPlaylist } = initializePlaylistStartupRuntime(playlistStartupRuntimeFacade);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Toggle the display of backdrop for drawer or modal.
   */
  initializeViewportLifecycleRuntime({
    drawerPlaylist: $DRAWER_PLAYLIST,
    drawerSettings: $DRAWER_SETTINGS,
    modalOptions: $MODAL_OPTIONS,
    currentWindowSize,
    viewportRuntime,
  });

  // ============================================================================
  // MANAGEMENT FORMS (Media Management & Playlist Management)
  // ============================================================================

  const managementStateFacade = createManagementStateFacade({
    status: AMP_STATUS,
    buildPlaylistJson: (seekFormat) => buildPlaylistJson({
      mediaItems: AMP_STATUS.media || [],
      categories: AMP_STATUS.category || [],
      playlistOptions: AMP_STATUS.options,
      seekFormat,
    }),
  });
  const managementImportFacade = createManagementImportFacade({
    document,
    baseUrl: BASE_URL,
    fetchData: async (url) => fetchData(url),
    getRuntimeAmbientData,
    isLikelyJsonFile: sharedIsLikelyJsonFile,
    getLocalizedMessage: getRuntimeLocalizedMessage,
    getCloudImportSizeLimitBytes: getCloudImportSizeLimitBytesDomain,
    cloudImportSizeLimitBytes: CLOUD_IMPORT_SIZE_LIMIT_BYTES,
    parseImportedPlaylistJson,
    validatePlaylistSchemaContract: validatePlaylistSchemaContractDomain,
    sanitizeAndNormalizeImportPlaylist: (source, stripPlaylistTemplate) => {
      return sanitizeAndNormalizeImportPlaylistDomain({
        source,
        stripPlaylistTemplate,
        sanitizeText: sanitizeMediaText,
        sanitizeDesc: sanitizeMediaDesc,
        titleMaxLength: MEDIA_TITLE_MAX_LENGTH,
        artistMaxLength: MEDIA_ARTIST_MAX_LENGTH,
        descMaxLength: MEDIA_DESC_MAX_LENGTH,
      });
    },
    persistImportedCloudPlaylist,
    ensureMyPlaylistOptionFromStorage,
    activateImportedPlaylist,
    myPlaylistName: MYPLAYLIST_NAME,
    postImportedPlaylist: async (baseUrl, filename, playlist) => postImportedPlaylist({
      baseUrl,
      filename,
      playlist,
    }),
    resolveImportedPlaylistPersistResult,
    isObject: sharedIsObject,
    sanitizeText: sanitizeMediaText,
    sanitizeDesc: sanitizeMediaDesc,
    titleMaxLength: MEDIA_TITLE_MAX_LENGTH,
    artistMaxLength: MEDIA_ARTIST_MAX_LENGTH,
    descMaxLength: MEDIA_DESC_MAX_LENGTH,
    logger: runtimeLogger,
  });
  const managementPlaylistBindingsFacade = createManagementPlaylistBindingsFacade({
    document,
    canMutateCurrentPlaylist,
    applyCloudEditRestrictions,
    setValidated,
    updateNotice,
    fetchData: async (endpointURL: string, method?: string, payload?: Record<string, string>) => {
      return fetchData(endpointURL, method, payload, 'json', 15000, runtimeLogger);
    },
    inArray: (contains: unknown | unknown[], targetArray: unknown[], atLeastOne = false) => {
      return sharedInArray(contains, targetArray as any[], atLeastOne);
    },
    snakeToCapital: sharedSnakeToCapital,
    logger: runtimeLogger,
    isLikelyJsonFile: sharedIsLikelyJsonFile,
    getBaseUrl: () => BASE_URL,
  });
  const managementPlaylistUiHelpers = createManagementPlaylistUiHelpers({
    playlistUiFacade,
    getCurrentMediaId: () => AMP_STATUS.current,
    getFirstMediaId: () => ((AMP_STATUS.media || [])[0]?.amId ?? null),
    updatePlayStatus,
  });
  const managementMediaBindingsFacade = createManagementMediaBindingsFacade({
    mediaCategorySelect: isElement($MEDIA_CATEGORY_SELECT) ? $MEDIA_CATEGORY_SELECT : null,
    mediaTitleMaxLength: MEDIA_TITLE_MAX_LENGTH,
    mediaArtistMaxLength: MEDIA_ARTIST_MAX_LENGTH,
    mediaDescMaxLength: MEDIA_DESC_MAX_LENGTH,
    getDefaultVolume: () => resolveAmbientDefaultVolume(getOption('volume'), DEFAULT_VOLUME),
    normalizeVolume: (value, fallback = DEFAULT_VOLUME) => normalizeAmbientVolume(value, fallback),
    canMutateCurrentPlaylist,
    applyCloudEditRestrictions,
    updateNotice,
    updatePlaylist: managementPlaylistUiHelpers.updatePlaylist,
    clearCategory: managementPlaylistUiHelpers.clearCategory,
    updateCategory: managementPlaylistUiHelpers.updateCategory,
    syncMediaCategoryField: managementPlaylistUiHelpers.syncMediaCategoryField,
    syncPlaybackAfterMediaAdd: managementPlaylistUiHelpers.syncPlaybackAfterMediaAdd,
    persistMediaEditForCurrentPlaylist: mediaEditFacade.persistCurrentPlaylist,
    hideOptionsModal,
    setValidated,
    sanitizeMediaText,
    sanitizeMediaTextInput: (value, maxLength) => sharedSanitizeMediaTextInput(value, maxLength, DISALLOWED_CONTROL_CHARS_RE),
    sanitizeMediaDescInput: (value, maxLength = MEDIA_DESC_MAX_LENGTH) => sharedSanitizeMediaDescInput(value, maxLength, DISALLOWED_CONTROL_CHARS_RE),
    sanitizeMediaDescInputLive: (value, maxLength = MEDIA_DESC_MAX_LENGTH) => sharedSanitizeMediaDescInputLive(value, maxLength, DISALLOWED_CONTROL_CHARS_RE),
    basename: sharedBasename,
    isLikelyMediaFile: sharedIsLikelyMediaFile,
    syncRangeProgress: (range) => syncAmbientRangeProgress(range, DEFAULT_VOLUME),
    logger: runtimeLogger,
    getMediaItems: managementStateFacade.getMediaItems,
    getAddType: managementStateFacade.getAddType,
    setAddType: managementStateFacade.setAddType,
  });
  const managementPlaylistActionsFacade = createManagementPlaylistActionsFacade({
    document,
    getCategories: managementStateFacade.getCategories,
    persistMyPlaylistIfNeeded,
    setCategories: managementStateFacade.setCategories,
    onCategoryCreated: managementPlaylistUiHelpers.onCategoryCreated,
    logger,
    getPlaylistName: managementStateFacade.getPlaylistName,
    importFileInput: document.getElementById('playlist-import-file') as HTMLInputElement | null,
    hideOptionsModal,
    getLocalizedMessage: getRuntimeLocalizedMessage,
    generatePlaylistJson: managementStateFacade.generatePlaylistJson,
  });
  const managementBindingOptionsFacade = createManagementBindingOptionsFacade({
    document,
    mediaVolumeInput: $MEDIA_VOLUME,
    getVolumeOption: () => getOption('volume'),
    defaultVolume: DEFAULT_VOLUME,
    getAddType: managementStateFacade.getAddType,
    setValidated,
    logger,
    ensureTargetPlaylist: () => {
      ensureManagementTargetPlaylist({
        status: AMP_STATUS,
        selectElement: $SELECT_PLAYLIST,
        myPlaylistName: MYPLAYLIST_NAME,
        document,
      });
    },
    getMediaItems: managementStateFacade.getMediaItems,
    getCategories: managementStateFacade.getCategories,
    setCategories: managementStateFacade.setCategories,
    setMediaItems: managementStateFacade.setMediaItems,
    titleMaxLength: MEDIA_TITLE_MAX_LENGTH,
    artistMaxLength: MEDIA_ARTIST_MAX_LENGTH,
    descMaxLength: MEDIA_DESC_MAX_LENGTH,
    sanitizeMediaText,
    sanitizeMediaDesc,
    isVolumeInRange: (value) => sharedInRange(value, 0, 100),
    generatePlaylistJson: managementStateFacade.generatePlaylistJson,
  });

  const managementRuntimeFacade = createManagementRuntimeFacade({
    document,
    importHelperOptions: managementImportFacade,
    bindingOptions: managementBindingOptionsFacade,
    playlistActionOptions: managementPlaylistActionsFacade,
    mediaBindings: managementMediaBindingsFacade,
    playlistBindings: managementPlaylistBindingsFacade,
  });
  initializeManagementRuntime(managementRuntimeFacade);

  const $INITIAL_ALERT = document.getElementById('alert-notification') as HTMLElement | null;
  dispatchInitialNotice($INITIAL_ALERT, updateNotice, 5000);
};

// for debugging code
const execDebug = (): void => {
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
};

// ============================================================================
// UTILITY FUNCTIONS (SHARED LIBRARY)
// ============================================================================

// [MODULE-BOUNDARY][v2.5.3-P0][EXTRACT-BL-003]: pure tail utility wrappers delegated to src/scripts/shared/*

// Do dispatcher
if ('complete' === document.readyState || 'loading' !== document.readyState) {
  init();
} else if (document.addEventListener) {
  document.addEventListener('DOMContentLoaded', init, false);
} else {
  (window as any).onload = init;
}
