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
import { createYouTubeMetadataClient } from './platform/youtube-metadata-api';
import {
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
  closeResponsiveDrawers,
} from './ui/drawers';
import {
  getToggleInput,
} from './ui/settings-view';
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
import { createAppSettingsSupport } from './bootstrap/app-settings-support';
import { createAmbientPlaylistHelpersFacade } from './bootstrap/ambient-playlist-helpers-facade';
import { createAmbientPlaylistSupport } from './bootstrap/ambient-playlist-support';
import { initializeAmbientStatus, mountYouTubePlayerApi } from './bootstrap/app-runtime-bootstrap';
import { createOptionsModalFacade, createPlaylistDescModalFacade } from './bootstrap/modal-controller-facades';
import { createOptionsModalHelpers } from './bootstrap/options-modal-helpers';
import { initializeOptionsSurfaceRuntime } from './bootstrap/options-surface-runtime-init';
import { createOptionsSurfaceFacade } from './bootstrap/options-surface-facade';
import { createOptionsSurfacePlaylistHelpers } from './bootstrap/options-surface-playlist-helpers';
import { createPlaylistEnvironmentSupport } from './bootstrap/playlist-environment-support';
import { createStatusWatcherViewSupport } from './bootstrap/status-watcher-view-support';
import { initializePlaylistModeRuntime } from './bootstrap/playlist-mode-runtime-init';
import { createPlaylistModeRuntimeFacade } from './bootstrap/playlist-mode-runtime-facade';
import { createPlaylistModeStateSupport } from './bootstrap/playlist-mode-state-support';
import { createPlaylistLoadSupport } from './bootstrap/playlist-load-support';
import { createPlaylistUiFacade } from './bootstrap/playlist-ui-facade';
import { createMediaEditRuntimeFacade } from './bootstrap/media-edit-runtime-facade';
import { createMediaEditRuntimeSupport } from './bootstrap/media-edit-runtime-support';
import { createMediaEditPlaylistHelpers } from './bootstrap/media-edit-playlist-helpers';
import { createMediaEditRuntimeWiringFacade } from './bootstrap/media-edit-runtime-wiring-facade';
import { initializeMediaEditRuntimeWiring } from './bootstrap/media-edit-runtime-wiring-init';
import { createPlayerActionSupport } from './bootstrap/player-action-support';
import { createPlayerRuntimeWiringFacade } from './bootstrap/player-runtime-wiring-facade';
import { createPlayerRuntimeHelpers } from './bootstrap/player-runtime-helpers';
import { createPlayerRuntimeSupport } from './bootstrap/player-runtime-support';
import { createPlayerStateSupport } from './bootstrap/player-state-support';
import { createPlaylistModeMenuSupport } from './bootstrap/playlist-mode-menu-support';
import { createVolumeOptionSupport } from './bootstrap/volume-option-support';
import { initializeAmbientPlayerRuntimeWiring } from './bootstrap/player-runtime-wiring-init';
import { initializeManagementRuntime } from './bootstrap/management-runtime-init';
import { createManagementImportFacade } from './bootstrap/management-import-facade';
import { createManagementImportSanitizeSupport } from './bootstrap/management-import-sanitize-support';
import { createManagementBindingOptionsFacade } from './bootstrap/management-binding-options-facade';
import { createManagementMediaSupport } from './bootstrap/management-media-support';
import { createManagementMediaBindingsFacade } from './bootstrap/management-media-bindings-facade';
import { createManagementPlaylistActionsFacade } from './bootstrap/management-playlist-actions-facade';
import { createManagementPlaylistBindingsFacade } from './bootstrap/management-playlist-bindings-facade';
import { createManagementPlaylistStateSupport } from './bootstrap/management-playlist-state-support';
import { createManagementPlaylistUiHelpers } from './bootstrap/management-playlist-ui-helpers';
import { createManagementRuntimeSupport } from './bootstrap/management-runtime-support';
import { createManagementRuntimeFacade } from './bootstrap/management-runtime-facade';
import { createManagementStateFacade } from './bootstrap/management-state-facade';
import { createMediaManagementActionBridge } from './bootstrap/management-action-bridge';
import { createAppControlsSupport } from './bootstrap/app-controls-support';
import { createStatusWatcherFacade } from './bootstrap/status-watcher-facade';
import { createStatusWatcherViewHelpers } from './bootstrap/status-watcher-view-helpers';
import { createStatusWatcherSupport } from './bootstrap/status-watcher-support';
import { createStatusWatcherRuntimeFacade } from './bootstrap/status-watcher-runtime-facade';
import { initializeStatusWatcherRuntime } from './bootstrap/status-watcher-runtime-init';
import { initializePlaylistPolicy } from './bootstrap/playlist-policy-init';
import { createPlaylistResumeBindingsFacade } from './bootstrap/playlist-resume-bindings-facade';
import { createPlaylistResumeSupport } from './bootstrap/playlist-resume-support';
import { createPlaylistSessionFacade } from './bootstrap/playlist-session-facade';
import { createPlaylistSessionSupport } from './bootstrap/playlist-session-support';
import { canUseAmbientReorderMode } from './bootstrap/playlist-capabilities';
import { initializePlaylistSession } from './bootstrap/playlist-session-init';
import { createAmbientRuntimeSupportFacade } from './bootstrap/ambient-runtime-support-facade';
import { createNoticeSupport } from './bootstrap/notice-support';
import { createDebugSupport } from './bootstrap/debug-support';
import {
  getAmbientNoMediaImagePath,
} from './bootstrap/display-runtime';
import { createAppBootController } from './bootstrap/app-boot';
import { createAppBootSupport } from './bootstrap/app-boot-support';
import { initializePlaylistUiRuntime } from './bootstrap/playlist-ui-runtime-init';
import { createPlaylistUiRuntimeFacade } from './bootstrap/playlist-ui-runtime-facade';
import { createPlaylistRuntimeViewHelpers } from './bootstrap/playlist-runtime-view-helpers';
import { createPlaylistRuntimeViewSupport } from './bootstrap/playlist-runtime-view-support';
import { createPlaylistRuntimeSupport } from './bootstrap/playlist-runtime-support';
import { createPlaylistRuntimeWiringFacade } from './bootstrap/playlist-runtime-wiring-facade';
import { initializePlaylistRuntimeWiring } from './bootstrap/playlist-runtime-wiring-init';
import { createPlaylistStartupRuntimeFacade } from './bootstrap/playlist-startup-runtime-facade';
import { createPlaylistStartupSupport } from './bootstrap/playlist-startup-support';
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
  const appBootSupport = createAppBootSupport({
    onViewportReady: () => {
      viewportRuntime.syncMetrics();
      viewportRuntime.updateWindowSize();
    },
  });
  const appBoot = createAppBootController({
    body: document.body,
    splash: document.getElementById('app-boot-splash'),
    minVisibleMs: BOOT_SPLASH_MIN_VISIBLE_MS,
    fadeMs: BOOT_SPLASH_FADE_MS,
    onReady: appBootSupport.onReady,
  });

  appBoot.setBootState('pending');
  appBoot.setPlaylistReadyState(false);

  // Fail-safe: never leave the UI hidden even if initialization errors occur.
  appBootSupport.scheduleFailSafeRelease(appBoot);

  // Window sizes container
  const currentWindowSize: WindowSize = {
    width: window.innerWidth,
    height: window.innerHeight,
    minFullUIWidth: 1282, // = 320 + 1 + 640 + 1 + 320
  };

  const playerRef: { current: YTPlayer | undefined } = { current: undefined };
  const playerStateSupport = createPlayerStateSupport({
    playerRef,
  });

  const playbackTimers = createPlaybackTimerController();
  let noticeController: NoticeController | null = null;
  const noticeSupport = createNoticeSupport({
    getNoticeController: () => noticeController,
  });
  const runtimeSupport = createAmbientRuntimeSupportFacade({
    status: AMP_STATUS,
    playbackTimers,
    updateNotice: noticeSupport.updateNoticeController,
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
  const MEDIA_DESC_MAX_LENGTH = 1000;
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
  const volumeOptionSupport = createVolumeOptionSupport({
    getVolumeOption: () => getOption('volume'),
  });
  const ambientPlaylistSupport = createAmbientPlaylistSupport({
    sanitizeMediaText: (value, maxLength) => sharedSanitizeMediaText(value, maxLength, DISALLOWED_CONTROL_CHARS_RE),
    sanitizeMediaDesc: (value, maxLength = MEDIA_DESC_MAX_LENGTH) => sharedSanitizeMediaDesc(value, maxLength, DISALLOWED_CONTROL_CHARS_RE),
  });
  const playlistHelpers = createAmbientPlaylistHelpersFacade({
    status: AMP_STATUS,
    buildPlaylistJson,
    sanitizeText: ambientPlaylistSupport.sanitizeText,
    sanitizeDesc: ambientPlaylistSupport.sanitizeDesc,
  });
  const { generatePlaylistJson, sanitizeMediaText, sanitizeMediaDesc } = playlistHelpers;
  let playlistUiBindings: ReturnType<typeof initializePlaylistUiRuntime> | null = null;
  const playlistUiFacade = createPlaylistUiFacade(() => playlistUiBindings);
  const playerActionSupport = createPlayerActionSupport();
  const playlistEnvironmentSupport = createPlaylistEnvironmentSupport({
    hasStoredMyPlaylist,
    isCloudMode: () => getRuntimeAmbientData()?.isCloud === true,
  });
  const playlistResumeSupport = createPlaylistResumeSupport({
    status: AMP_STATUS,
    getPlaylistUiFacade: () => playlistUiFacade,
    updatePlayStatus: playerActionSupport.updatePlayStatus,
  });

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
    hasStoredMyPlaylist: playlistEnvironmentSupport.hasStoredMyPlaylist,
    isCloudMode: playlistEnvironmentSupport.isCloudMode,
    myPlaylistName: MYPLAYLIST_NAME,
    hasPlaylist: platformHasPlaylist,
    onCategoryResumeApplied: playlistResumeSupport.onCategoryResumeApplied,
    onMediaResumeApplied: playlistResumeSupport.onMediaResumeApplied,
  }));
  const debugSupport = createDebugSupport();

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
    ...createPlaylistSessionSupport({
      status: AMP_STATUS,
      appBoot,
      getPlaylistUiFacade: () => playlistUiFacade,
      buildPlaylistJson,
    }),
    writeMyPlaylistJson,
    logger: runtimeLogger,
  }));
  let persistCurrentPlaylistSettings = (): void => {
    void persistMyPlaylistIfNeeded();
  };

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
    persistCurrentPlaylistSettings: () => persistCurrentPlaylistSettings(),
    getPlayer: playerStateSupport.getPlayer,
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
  const optionsModalHelpers = createOptionsModalHelpers({
    document,
    currentWindowSize,
    drawerPlaylist: $DRAWER_PLAYLIST,
    drawerSettings: $DRAWER_SETTINGS,
  });
  const optionsModal = createOptionsModalFacade({
    options: {
      elements: {
        modal: $MODAL_OPTIONS,
        panel: $MODAL_OPTIONS_PANEL,
      },
      getLayout: optionsModalHelpers.getLayout,
      beforeShow: optionsModalHelpers.beforeShow,
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
  const MEDIA_EDIT_THUMBNAIL_GENERATE_ENDPOINT = 'thumbnail-generate';
  const mediaEditPlaylistHelpers = createMediaEditPlaylistHelpers(() => playlistUiFacade);
  const playlistModeMenuSupport = createPlaylistModeMenuSupport();
  const mediaEditRuntimeSupport = createMediaEditRuntimeSupport({
    status: AMP_STATUS,
    getOption: (key) => getOption(key as Extract<keyof PlaylistOptions, string>),
    persistCloudPlaylist: persistMyPlaylistIfNeeded,
    generatePlaylistJson: (pretty = false) => generatePlaylistJson(pretty),
    updatePlayStatus: playerActionSupport.updatePlayStatus,
    confirm: (message) => window.confirm(message),
  });
  const mediaEditRuntime = initializeMediaEditRuntimeWiring(createMediaEditRuntimeWiringFacade({
    elements: mediaEditElements,
    status: AMP_STATUS,
    baseUrl: BASE_URL,
    playlistListElement: $LIST_PLAYLIST,
    playButton: $BUTTON_PLAY,
    pauseButton: $BUTTON_PAUSE,
    youtubePlayer: (playerStateSupport.getPlayer() as YTPlayer | undefined) ?? null,
    playlistMode: () => playlistMode,
    closePlaylistModeMenu: playlistModeMenuSupport.closePlaylistModeMenu,
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
    thumbnailGenerateEndpoint: MEDIA_EDIT_THUMBNAIL_GENERATE_ENDPOINT,
    getLocalizedMessage,
    updateNotice,
    getOption: mediaEditRuntimeSupport.getOption,
    sanitizeMediaText: sanitizeMediaText,
    persistCloudPlaylist: mediaEditRuntimeSupport.persistCloudPlaylist,
    generatePlaylistJson: mediaEditRuntimeSupport.generatePlaylistJson,
    updatePlayStatus: mediaEditRuntimeSupport.updatePlayStatus,
    getMediaCategoryName: mediaEditRuntimeSupport.getMediaCategoryName,
    clearCategory: mediaEditPlaylistHelpers.clearCategory,
    updateCategory: mediaEditPlaylistHelpers.updateCategory,
    syncMediaCategoryField: mediaEditPlaylistHelpers.syncMediaCategoryField,
    getActiveCategoryId: mediaEditPlaylistHelpers.getActiveCategoryId,
    updatePlaylist: mediaEditPlaylistHelpers.updatePlaylist,
    canMutateCurrentPlaylist,
    applyEditRestrictions: applyCloudEditRestrictions,
    confirm: mediaEditRuntimeSupport.confirm,
  }));
  const mediaEditFacade = createMediaEditRuntimeFacade(mediaEditRuntime);
  persistCurrentPlaylistSettings = (): void => {
    void mediaEditFacade.persistCurrentPlaylist(AMP_STATUS.media || [])
      .then((result) => {
        if (result.ok) {
          return;
        }
        updateNotice({
          type: 'error',
          message: result.message || getRuntimeLocalizedMessage('mediaEditSaveFailed', 'Failed to save media changes.'),
          delay: 2400,
        });
      })
      .catch((error) => {
        runtimeLogger('persistCurrentPlaylistSettings', error, 'force');
        updateNotice({
          type: 'error',
          message: getRuntimeLocalizedMessage('mediaEditSaveFailed', 'Failed to save media changes.'),
          delay: 2400,
        });
      });
  };

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
  const playlistModeStateSupport = createPlaylistModeStateSupport({
    getPlaylistMode: () => playlistMode,
    setPlaylistMode: (mode) => {
      playlistMode = mode;
    },
    getDeleteSelectedIds: () => deleteSelectedIds,
    clearDeleteSelections: () => {
      deleteSelectedIds.clear();
    },
  });
  const playlistLoadSupport = createPlaylistLoadSupport();
  const mediaManagementActionBridge = createMediaManagementActionBridge();
  const playlistRuntimeSupport = createPlaylistRuntimeSupport({
    status: AMP_STATUS,
    appBoot,
    getPlaylistUiFacade: () => playlistUiFacade,
    buildPlaylistJson,
    getPlaylistMode: playlistModeStateSupport.getPlaylistMode,
    setPlaylistMode: playlistModeStateSupport.setPlaylistMode,
    getDeleteSelectedIds: playlistModeStateSupport.getDeleteSelectedIds,
    clearDeleteSelections: playlistModeStateSupport.clearDeleteSelections,
    mediaEdit: {
      discardDraft: mediaEditFacade.discardDraft,
      hideModal: mediaEditFacade.hideModal,
      clearContext: mediaEditFacade.clearContext,
      persistCurrentPlaylist: mediaEditFacade.persistCurrentPlaylist,
      getActiveItem: mediaEditFacade.getActiveItem,
    },
    playlistDescModal,
    mediaManagementActionBridge,
  });

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
    getPlaylistMode: playlistRuntimeSupport.getPlaylistMode,
    setPlaylistModeState: playlistRuntimeSupport.setPlaylistMode,
    getCategoryId: playlistRuntimeSupport.getCategoryId,
    getMediaItems: playlistRuntimeSupport.getMediaItems,
    getPlaylistName: playlistRuntimeSupport.getPlaylistName,
    setMediaItems: playlistRuntimeSupport.setMediaItems,
    canMutateCurrentPlaylist,
    myPlaylistName: MYPLAYLIST_NAME,
    hasStoredMyPlaylist: playlistEnvironmentSupport.hasStoredMyPlaylist,
    getDeleteSelectedIds: playlistRuntimeSupport.getDeleteSelectedIds,
    clearDeleteSelections: playlistRuntimeSupport.clearDeleteSelections,
    canDiscardEditLeave: mediaEditFacade.confirmDiscard,
    discardEditState: playlistRuntimeSupport.discardEditState,
    updatePlaylist: playlistRuntimeSupport.updatePlaylist,
    persistCurrentPlaylistMutation: playlistRuntimeSupport.persistCurrentPlaylistMutation,
    updateNotice,
    getLocalizedMessage,
  }));
  playlistModeMenuSupport.setClosePlaylistModeMenu(closePlaylistModeMenu);

  playlistUiBindings = initializePlaylistUiRuntime(createPlaylistUiRuntimeFacade({
    document,
    status: AMP_STATUS,
    getOption: (key) => getOption(key as Extract<keyof PlaylistOptions, string>),
    getPlaylistMode: playlistRuntimeSupport.getPlaylistMode,
    setPlaylistMode: playlistRuntimeSupport.setPlaylistMode,
    deleteSelectedIds,
    getEditSelectedId: playlistRuntimeSupport.getEditSelectedId,
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
    openMediaManagement: playlistRuntimeSupport.openMediaManagement,
    trimTitle: (value: string) => mb_strimwidth(value, 0, 50, '...'),
    destroyPlaylistSortable,
    closePlaylistDescModal: playlistRuntimeSupport.closePlaylistDescModal,
    syncPlaylistModeAvailability,
    closePlaylistModeMenu,
    setPlaylistReadyState: playlistRuntimeSupport.setPlaylistReadyState,
    resetReorderState,
    updatePlaylistModeUi: updatePlaylistModeUI,
    ensurePlaylistSortable,
    execDebug: debugSupport.execDebug,
    logger,
    applyCloudEditRestrictions,
    onShuffleItemsChanged: playlistRuntimeSupport.onShuffleItemsChanged,
  }));
  const statusWatcherViewSupport = createStatusWatcherViewSupport({
    status: AMP_STATUS,
  });
  const statusWatcherViewHelpers = createStatusWatcherViewHelpers({
    playlistList: $LIST_PLAYLIST,
    getCurrentMediaId: statusWatcherViewSupport.getCurrentMediaId,
    playButton: $BUTTON_PLAY,
    pauseButton: $BUTTON_PAUSE,
    hasMediaItems: statusWatcherViewSupport.hasMediaItems,
  });
  const statusWatcherSupport = createStatusWatcherSupport({
    body: $BODY,
    getOption: (key) => getOption(key),
    getPlaylistUiFacade: () => playlistUiFacade,
    viewportRuntime,
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
    updatePlaylistCategory: statusWatcherSupport.updatePlaylistCategory,
    updateNotice,
    syncPlaylistCurrentFocus: statusWatcherViewHelpers.syncPlaylistCurrentFocus,
    scrollPlaylistToCurrentFocus: statusWatcherViewHelpers.scrollPlaylistToCurrentFocus,
    syncPlaybackButtons: statusWatcherViewHelpers.syncPlaybackButtons,
    syncYouTubeSignalAttrs,
    setStyles,
    setFullWindowMode: statusWatcherSupport.setFullWindowMode,
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
    getVolumeOption: volumeOptionSupport.getVolumeOption,
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
  const appSettingsSupport = createAppSettingsSupport({
    status: AMP_STATUS,
    defaultVolume: DEFAULT_VOLUME,
    persistCurrentPlaylistSettings,
    normalizeVolume: normalizeAmbientVolume,
    syncRangeProgress: syncAmbientRangeProgress,
  });
  const appSettingsHelpers = createAppSettingsHelpers({
    shufflePlaylist: appSettingsSupport.shufflePlaylist,
    persistCurrentPlaylistSettings: appSettingsSupport.persistCurrentPlaylistSettings,
    normalizeVolume: appSettingsSupport.normalizeVolume,
    syncRangeProgress: appSettingsSupport.syncRangeProgress,
    isDarkModeEnabled: appSettingsSupport.isDarkModeEnabled,
  });
  const appControlsSupport = createAppControlsSupport({
    getPlaylistMode: playlistModeStateSupport.getPlaylistMode,
    clearDeleteSelections: playlistModeStateSupport.clearDeleteSelections,
    getPlaylistUiFacade: () => playlistUiFacade,
    playlistDescModal,
    loadPlaylist: playlistLoadSupport.loadPlaylist,
    mediaEdit: {
      confirmDiscard: mediaEditFacade.confirmDiscard,
      hideModal: mediaEditFacade.hideModal,
    },
    setPlaylistMode: playlistModeStateSupport.setPlaylistMode,
    playItem: playerActionSupport.playItem,
    statusWatcherSupport,
    viewportRuntime,
    getPlayer: () => playerStateSupport.getPlayer() as {
      getPlayerState(): number;
      playVideo(): void;
      pauseVideo(): void;
      stopVideo(): void;
    } | null | undefined,
  });
  const appControlsPlaylistHelpers = createAppControlsPlaylistHelpers({
    getPlaylistMode: playlistModeStateSupport.getPlaylistMode,
    clearDeleteSelections: playlistModeStateSupport.clearDeleteSelections,
    resetReorderState,
    clearMediaEditContext: mediaEditFacade.clearContext,
    updatePlaylistModeUi: updatePlaylistModeUI,
    updatePlaylist: appControlsSupport.updatePlaylist,
    isPlaylistInteractionLocked,
    openDescriptionModal: appControlsSupport.openDescriptionModal,
    getDescriptionPayload: getPlaylistDescriptionPayload,
    openMediaEditModal: mediaEditFacade.openModal,
    loadPlaylist: appControlsSupport.loadPlaylist,
    canDiscardEditMode: appControlsSupport.canDiscardEditMode,
    hideMediaEditModal: appControlsSupport.hideMediaEditModal,
    resetPlaylistMode: appControlsSupport.resetPlaylistMode,
  });
  const appControlsPlayerHelpers = createAppControlsPlayerHelpers({
    playItem: appControlsSupport.playItem,
    playItemById: appControlsSupport.playItemById,
    isFullWindowMode: appControlsSupport.isFullWindowMode,
    setFullWindowMode: appControlsSupport.setFullWindowMode,
    setMenuMinimized: appControlsSupport.setMenuMinimized,
    getPlayer: appControlsSupport.getPlayer,
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
      persistCurrentPlaylistSettings: appSettingsHelpers.persistCurrentPlaylistSettings,
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
  const playlistRuntimeViewSupport = createPlaylistRuntimeViewSupport({
    status: AMP_STATUS,
    appBoot,
  });
  const playlistRuntimeViewHelpers = createPlaylistRuntimeViewHelpers({
    playlistUiFacade,
    getMediaItems: playlistRuntimeViewSupport.getMediaItems,
    getCategoryId: playlistRuntimeViewSupport.getCategoryId,
    setPlaylistReadyState: playlistRuntimeViewSupport.setPlaylistReadyState,
    releaseAppBootGate: playlistRuntimeViewSupport.releaseAppBootGate,
  });
  const playerRuntimeHelpers = createPlayerRuntimeHelpers({
    isSeekActive: () => playbackTimers.isSeekActive(),
    startSeek: (callback, intervalMs) => playbackTimers.startSeek(callback, intervalMs),
    startFader: (type, callback, intervalMs) => playbackTimers.startFader(type, callback, intervalMs),
    resolvePlayingState: () => (window as any).YT.PlayerState.PLAYING,
    setPlayer: playerStateSupport.setPlayer,
  });
  const playerRuntimeSupport = createPlayerRuntimeSupport({
    sanitizeMediaText,
    mediaTitleMaxLength: MEDIA_TITLE_MAX_LENGTH,
    mediaArtistMaxLength: MEDIA_ARTIST_MAX_LENGTH,
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
    isSeekActive: playerRuntimeHelpers.isSeekActive,
    startSeek: playerRuntimeHelpers.startSeek,
    startFader: playerRuntimeHelpers.startFader,
    emitYouTubeSignal,
    sanitizeTitle: playerRuntimeSupport.sanitizeTitle,
    sanitizeArtist: playerRuntimeSupport.sanitizeArtist,
    resolvePlayingState: playerRuntimeHelpers.resolvePlayingState,
    setPlayer: playerRuntimeHelpers.setPlayer,
  }));
  playerActionSupport.setUpdatePlayStatus(updatePlayStatus);
  playerActionSupport.setPlayItem(playItem);

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
  playlistLoadSupport.setLoadPlaylist(getPlaylistData);

  // Process global data passed by the system.
  // In cloud mode: load MyPlaylist from localStorage before processing server data.
  // (Placed here, AFTER runtime bindings, to avoid dependency initialization gaps.)
  const savedPlaylistContext = getSavedPlaylistContext();
  domainEnsureCloudMyPlaylistSeed(logger);
  ensureMyPlaylistOptionFromStorage();
  const playlistStartupSupport = createPlaylistStartupSupport({
    appBoot,
  });
  const playlistStartupRuntimeFacade = createPlaylistStartupRuntimeFacade({
    ambientData: ((window as any).AmbientData as AmbientData | undefined) ?? null,
    hasStoredMyPlaylist: playlistEnvironmentSupport.hasStoredMyPlaylist(),
    isPlaylistAvailableForResume,
    myPlaylistName: MYPLAYLIST_NAME,
    savedPlaylistContext,
    requestCategoryResume,
    requestMediaResume,
    selectElement: isElement($SELECT_PLAYLIST) ? $SELECT_PLAYLIST : null,
    loadPlaylist: getPlaylistData,
    initMyPlaylistFromStorage,
    setPlaylistReadyState: playlistStartupSupport.setPlaylistReadyState,
    releaseAppBoot: playlistStartupSupport.releaseAppBoot,
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
  const managementRuntimeSupport = createManagementRuntimeSupport({
    fetchData,
    logger: runtimeLogger,
    baseUrl: BASE_URL,
    status: AMP_STATUS,
    selectPlaylist: $SELECT_PLAYLIST,
    myPlaylistName: MYPLAYLIST_NAME,
    document,
    sanitizeAndNormalizeImportPlaylist: createManagementImportSanitizeSupport({
      sanitizeAndNormalizeImportPlaylist: sanitizeAndNormalizeImportPlaylistDomain,
      sanitizeText: sanitizeMediaText,
      sanitizeDesc: sanitizeMediaDesc,
      titleMaxLength: MEDIA_TITLE_MAX_LENGTH,
      artistMaxLength: MEDIA_ARTIST_MAX_LENGTH,
      descMaxLength: MEDIA_DESC_MAX_LENGTH,
    }).sanitizeAndNormalizeImportPlaylist,
    sanitizeText: sanitizeMediaText,
    sanitizeDesc: sanitizeMediaDesc,
    titleMaxLength: MEDIA_TITLE_MAX_LENGTH,
    artistMaxLength: MEDIA_ARTIST_MAX_LENGTH,
    descMaxLength: MEDIA_DESC_MAX_LENGTH,
    postImportedPlaylist,
    inArray: sharedInArray,
    isVolumeInRange: sharedInRange,
  });
  const managementImportFacade = createManagementImportFacade({
    document,
    baseUrl: BASE_URL,
    fetchData: managementRuntimeSupport.fetchRelativeFilepathData,
    getRuntimeAmbientData,
    isLikelyJsonFile: sharedIsLikelyJsonFile,
    getLocalizedMessage: getRuntimeLocalizedMessage,
    getCloudImportSizeLimitBytes: getCloudImportSizeLimitBytesDomain,
    cloudImportSizeLimitBytes: CLOUD_IMPORT_SIZE_LIMIT_BYTES,
    parseImportedPlaylistJson,
    validatePlaylistSchemaContract: validatePlaylistSchemaContractDomain,
    sanitizeAndNormalizeImportPlaylist: managementRuntimeSupport.sanitizeImportedPlaylist,
    persistImportedCloudPlaylist,
    ensureMyPlaylistOptionFromStorage,
    activateImportedPlaylist,
    myPlaylistName: MYPLAYLIST_NAME,
    postImportedPlaylist: managementRuntimeSupport.postImportedPlaylist,
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
    fetchData: managementRuntimeSupport.fetchPlaylistBindingData,
    inArray: managementRuntimeSupport.inArray,
    snakeToCapital: sharedSnakeToCapital,
    logger: runtimeLogger,
    isLikelyJsonFile: sharedIsLikelyJsonFile,
    getBaseUrl: () => BASE_URL,
    getCategories: managementStateFacade.getCategories,
    getMediaItems: managementStateFacade.getMediaItems,
  });
  const managementPlaylistStateSupport = createManagementPlaylistStateSupport({
    status: AMP_STATUS,
  });
  const managementPlaylistUiHelpers = createManagementPlaylistUiHelpers({
    playlistUiFacade,
    getCurrentMediaId: managementPlaylistStateSupport.getCurrentMediaId,
    getFirstMediaId: managementPlaylistStateSupport.getFirstMediaId,
    updatePlayStatus,
  });
  const managementMediaSupport = createManagementMediaSupport({
    defaultVolume: DEFAULT_VOLUME,
    getVolumeOption: volumeOptionSupport.getVolumeOption,
    normalizeVolume: normalizeAmbientVolume,
    sanitizeMediaTextInput: (value, maxLength) => sharedSanitizeMediaTextInput(value, maxLength, DISALLOWED_CONTROL_CHARS_RE),
    sanitizeMediaDescInput: (value, maxLength = MEDIA_DESC_MAX_LENGTH) => sharedSanitizeMediaDescInput(value, maxLength, DISALLOWED_CONTROL_CHARS_RE),
    sanitizeMediaDescInputLive: (value, maxLength = MEDIA_DESC_MAX_LENGTH) => sharedSanitizeMediaDescInputLive(value, maxLength, DISALLOWED_CONTROL_CHARS_RE),
    syncRangeProgress: syncAmbientRangeProgress,
  });
  const youtubeMetadataClient = createYouTubeMetadataClient({
    baseUrl: BASE_URL,
    fetchData,
    logger: runtimeLogger,
  });
  const managementMediaBindingsFacade = createManagementMediaBindingsFacade({
    mediaCategorySelect: isElement($MEDIA_CATEGORY_SELECT) ? $MEDIA_CATEGORY_SELECT : null,
    mediaTitleMaxLength: MEDIA_TITLE_MAX_LENGTH,
    mediaArtistMaxLength: MEDIA_ARTIST_MAX_LENGTH,
    mediaDescMaxLength: MEDIA_DESC_MAX_LENGTH,
    getDefaultVolume: managementMediaSupport.getDefaultVolume,
    normalizeVolume: managementMediaSupport.normalizeVolume,
    canMutateCurrentPlaylist,
    applyCloudEditRestrictions,
    updateNotice,
    updatePlaylist: managementPlaylistUiHelpers.updatePlaylist,
    clearCategory: managementPlaylistUiHelpers.clearCategory,
    updateCategory: managementPlaylistUiHelpers.updateCategory,
    getActiveCategoryId: playlistUiFacade.getActiveCategoryId,
    syncMediaCategoryField: managementPlaylistUiHelpers.syncMediaCategoryField,
    syncPlaybackAfterMediaAdd: managementPlaylistUiHelpers.syncPlaybackAfterMediaAdd,
    persistMediaEditForCurrentPlaylist: mediaEditFacade.persistCurrentPlaylist,
    hideOptionsModal,
    setValidated,
    sanitizeMediaText,
    sanitizeMediaTextInput: managementMediaSupport.sanitizeMediaTextInput,
    sanitizeMediaDescInput: managementMediaSupport.sanitizeMediaDescInput,
    sanitizeMediaDescInputLive: managementMediaSupport.sanitizeMediaDescInputLive,
    basename: sharedBasename,
    isLikelyMediaFile: sharedIsLikelyMediaFile,
    syncRangeProgress: managementMediaSupport.syncRangeProgress,
    logger: runtimeLogger,
    getMediaItems: managementStateFacade.getMediaItems,
    getAddType: managementStateFacade.getAddType,
    setAddType: managementStateFacade.setAddType,
    isYouTubeMetadataEnabled: () => getRuntimeAmbientData()?.youtubeMetadata?.enabled === true,
    fetchYouTubeMetadata: youtubeMetadataClient.fetchMetadata,
    getLocalizedMessage: getRuntimeLocalizedMessage,
  });
  const managementPlaylistActionsFacade = createManagementPlaylistActionsFacade({
    document,
    getCategories: managementStateFacade.getCategories,
    getMediaItems: managementStateFacade.getMediaItems,
    persistMyPlaylistIfNeeded,
    setCategories: managementStateFacade.setCategories,
    setMediaItems: managementStateFacade.setMediaItems,
    resetActiveCategory: managementStateFacade.resetActiveCategory,
    onCategoryCreated: managementPlaylistUiHelpers.onCategoryCreated,
    onCategoriesMutated: managementPlaylistUiHelpers.onCategoriesMutated,
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
    getVolumeOption: volumeOptionSupport.getVolumeOption,
    defaultVolume: DEFAULT_VOLUME,
    getAddType: managementStateFacade.getAddType,
    setValidated,
    logger,
    ensureTargetPlaylist: managementRuntimeSupport.ensureTargetPlaylist,
    getMediaItems: managementStateFacade.getMediaItems,
    getCategories: managementStateFacade.getCategories,
    setCategories: managementStateFacade.setCategories,
    setMediaItems: managementStateFacade.setMediaItems,
    titleMaxLength: MEDIA_TITLE_MAX_LENGTH,
    artistMaxLength: MEDIA_ARTIST_MAX_LENGTH,
    descMaxLength: MEDIA_DESC_MAX_LENGTH,
    sanitizeMediaText,
    sanitizeMediaDesc,
    isVolumeInRange: managementRuntimeSupport.isVolumeInRange,
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
