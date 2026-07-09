/**
 * Ambient Media Player v2 - TypeScript Frontend Application
 * Vite entrypoint and compatibility composition root
 */
/// <reference path="./types/index.ts" />
import 'flowbite';
import Sortable from 'sortablejs';
import '../styles/app.css';
import {
  basename as sharedBasename,
  escapeHTML as sharedEscapeHTML,
  getExt as sharedGetExt,
  parseJsonWithBom as sharedParseJsonWithBom,
  snakeToCapital as sharedSnakeToCapital,
} from './shared/string';
import {
  isLikelyJsonFile as sharedIsLikelyJsonFile,
  isLikelyMediaFile as sharedIsLikelyMediaFile,
  sanitizeMediaDesc as sharedSanitizeMediaDesc,
  sanitizeMediaDescInput as sharedSanitizeMediaDescInput,
  sanitizeMediaDescInputLive as sharedSanitizeMediaDescInputLive,
  sanitizeMediaEditDescForStorage as sharedSanitizeMediaEditDescForStorage,
  sanitizeMediaEditDescInput as sharedSanitizeMediaEditDescInput,
  sanitizeMediaItemTextFields as sharedSanitizeMediaItemTextFields,
  sanitizeMediaText as sharedSanitizeMediaText,
  sanitizeMediaTextInput as sharedSanitizeMediaTextInput,
} from './shared/media-sanitize';
import {
  formatSecondsToHHMMSS as sharedFormatSecondsToHHMMSS,
  formatSecondsToTimelineLabel as sharedFormatSecondsToTimelineLabel,
  normalizeMediaEditTimingValue as sharedNormalizeMediaEditTimingValue,
  parseMediaTimeToIntegerSeconds as sharedParseMediaTimeToIntegerSeconds,
  sanitizeMediaEditTimingInputField as sharedSanitizeMediaEditTimingInputField,
  stepMediaEditTimingField as sharedStepMediaEditTimingField,
  toMediaEditTimingInputValue as sharedToMediaEditTimingInputValue,
} from './shared/media-edit-timing-input';
import {
  inArray as sharedInArray,
  inRange as sharedInRange,
  isObject as sharedIsObject,
} from './shared/validation';
import {
  getAtts,
  getCookie,
  isElement,
  mb_strimwidth,
  setStyles,
  setValidated,
  updateCookie,
  watcher,
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
  isRuntimeLocalMode,
  runtimeLogger,
  saveStorageAdapter,
  useStorageAdapter,
} from './platform/runtime-support';
import {
  deleteMediaEditThumbnail as deleteMediaEditThumbnailPlatform,
  persistPlaylistMediaEdit,
  uploadMediaEditThumbnail as uploadMediaEditThumbnailPlatform,
} from './platform/media-edit-persistence';
import {
  createPlaylistResumeController,
  PlaylistResumeMediaContext,
} from './state/playlist-context';
import { createPlaylistResumeBindings } from './state/playlist-resume-bindings';
import {
  readPlaylistOption,
  setPlaylistOption,
} from './state/playlist-options';
import { bindAmbientStatusWatchers } from './state/status-watchers';
import {
  canUsePlaylistReorderMode,
  createShuffledPlaylistItems,
  getDefaultMediaItemForView,
  getMediaCategoryName as getMediaCategoryNameState,
  getPlaylistItemsForView,
} from './state/playlist-mode-state';
import {
  applyMediaEditDirtyState,
  canOpenMediaEditModal,
  confirmDiscardMediaEditDraft,
} from './state/media-edit-state';
import { createMediaEditTimingBindings } from './state/media-edit-timing-bindings';
import {
  deleteMediaEditThumbnailIfNeeded as deleteMediaEditThumbnailIfNeededState,
  persistMediaEditForCurrentPlaylist as persistMediaEditForCurrentPlaylistState,
  uploadMediaEditThumbnailIfNeeded as uploadMediaEditThumbnailIfNeededState,
} from './state/media-edit-save';
import { createMediaEditSaveBindings } from './state/media-edit-save-bindings';
import {
  applyMediaEditDraftToItem,
  cloneMediaEditDraft as cloneMediaEditDraftState,
  createEmptyMediaEditDraft,
  ensureMediaEditCategory,
  findMediaEditCategoryIndex,
  isSameMediaEditDraft as isSameMediaEditDraftState,
  sanitizeMediaEditDraft as sanitizeMediaEditDraftState,
  type MediaEditDraft,
  type MediaEditDraftInput,
} from './state/media-edit-draft';
import { createMediaEditDraftBindings } from './state/media-edit-draft-bindings';
import {
  closeResponsiveDrawers,
  isResponsiveDrawerOpen,
} from './ui/drawers';
import {
  getToggleInput,
  syncToggleRoot,
  syncVolumeSlider,
} from './ui/settings-view';
import {
  isFullWindowMode as isFullWindowModeView,
} from './ui/viewport';
import { createViewportRuntimeController } from './ui/viewport-runtime';
import {
  createOptionsModalController,
  createPlaylistDescModalController,
} from './ui/modals';
import {
  focusPlaylistItemById as focusPlaylistItemByIdView,
  finalizeMediaEditModalClose,
  openManagedMediaEditModal,
  renderMediaEditSourceBadges as renderMediaEditSourceBadgesView,
  resetMediaEditModalView,
} from './ui/media-edit-modal-view';
import {
  applyMediaEditDraftToFormView,
  resolveMediaEditThumbnailSrc,
} from './ui/media-edit-form-view';
import { createMediaEditUiBindings } from './state/media-edit-ui-bindings';
import { createMediaEditPreviewBindings } from './state/media-edit-preview-bindings';
import {
  getPlaylistDescriptionPayload,
  PlaylistMode,
  scrollPlaylistToCurrentFocus,
  syncPlaylistCurrentFocus,
} from './ui/playlist-view';
import {
  createNoticeController,
  dispatchInitialNotice,
  type NoticeController,
} from './ui/notifications';
import {
  isPlaybackActive,
  syncPlaybackButtonState,
  syncMenuCollapseButtonState,
  syncPlaybackButtons,
  syncWindowFullButtonState,
} from './ui/player/player-shell';
import {
  getBottomMenuHeight as getBottomMenuHeightView,
  getPlayerSizeForCurrentMode as getPlayerSizeForCurrentModeView,
} from './ui/player/player-layout';
import {
  findMediaById,
  resolveSeekRange,
} from './ui/player/player-runtime';
import {
  syncYouTubePreviewDuration,
} from './ui/player/youtube-player-events';
import {
  ensureSelectOption,
  selectExistingOption,
} from './ui/forms/management-forms';
import { applyCloudEditRestrictionsView as applyCloudEditRestrictionsFormView } from './ui/forms/cloud-edit-restrictions';
import {
  getAmbientPlaybackVolume,
  normalizeAmbientVolume,
  resolveAmbientDefaultVolume,
  syncAmbientResolvedMediaVolumeField,
  syncAmbientRangeProgress,
} from './ui/forms/category-volume-bindings';
import {
  createPlaylistLoadGuard,
  resetPlaylistRuntimeStatus,
} from './domain/playlist-loader';
import {
  buildPlaylistJson,
  ensureCloudMyPlaylistSeed as domainEnsureCloudMyPlaylistSeed,
  hasStoredMyPlaylist,
  MYPLAYLIST_NAME,
  writeMyPlaylistJson,
} from './domain/myplaylist-storage';
import { createPlaybackTimerController } from './domain/media-playback';
import {
  bindAmbientAppControlBindings,
  bindAmbientViewportLifecycle,
} from './bootstrap/app-init';
import { initializeOptionsModalBindings } from './bootstrap/options-modal-init';
import { initializePlaylistModeBindings } from './bootstrap/playlist-mode-init';
import { initializeMediaEditControls } from './bootstrap/media-edit-controls-init';
import { initializeAmbientPlayer } from './bootstrap/player-init';
import { initializeManagementBindingComposition } from './bootstrap/management-bindings-init';
import {
  createPlaylistManagementActions,
} from './bootstrap/management-init';
import {
  applyAmbientDisplayOptions,
  getAmbientNoMediaImagePath,
  isAmbientDarkModeEnabled,
  toggleAmbientCaptionBindings,
} from './bootstrap/display-runtime';
import {
  importPlaylistFromManagementFile,
  resolveManagementRelativeFilepath,
} from './bootstrap/management-import';
import { createPlaylistUiBindings } from './bootstrap/playlist-ui-init';
import { createAppBootController } from './bootstrap/app-boot';
import {
  fetchAmbientPlaylistData,
  initAmbientMyPlaylistFromStorage,
  loadAmbientMyPlaylistFromStorage,
  removeAmbientMyPlaylistOption,
} from './bootstrap/playlist-load-bindings';
import {
  ensureMyPlaylistOptionFromStorage as ensureMyPlaylistOptionFromStorageBootstrap,
  resolveInitialPlaylistStartup,
} from './bootstrap/playlist-startup';
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
  const AMP_STATUS = initStatus();
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
      syncViewportMetrics();
      viewportRuntime.updateWindowSize();
    },
  });

  appBoot.setBootState('pending');
  appBoot.setPlaylistReadyState(false);

  // Fail-safe: never leave the UI hidden even if initialization errors occur.
  window.setTimeout(() => {
    appBoot.forceRelease();
  }, 3500);

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

  const playbackTimers = createPlaybackTimerController();
  let noticeController: NoticeController | null = null;

  function updateNotice(notification: NotificationPayload): void {
    noticeController?.update(notification);
  }

  /**
   * Abort seek for playback media.
   */
  function abortSeeking(): void {
    playbackTimers.abortSeek();
  }

  /**
   * Abort fader for playback media.
   * @param type Either `fadein` or `fadeout`
   */
  function abortFader(type: 'fadein' | 'fadeout'): void {
    playbackTimers.abortFader(type);
  }

  /**
   * Watcher for AMP_STATUS object.
   */
  function watchState(): void {
    bindAmbientStatusWatchers({
      status: AMP_STATUS as unknown as Record<string, unknown>,
      onPropertyChange: (prop, _oldValue, newValue) => {
        switch (true) {
          case /^(prev|current|next|ctg|order|loop)$/i.test(prop):
            saveStorageAdapter(prop, newValue, runtimeLogger);
            if (/^ctg$/i.test(prop)) {
              savePlaylistContext();
            }
            if ('current' === prop) {
              syncPlaylistCurrentFocus($LIST_PLAYLIST, AMP_STATUS.current);
              scrollPlaylistToCurrentFocus($LIST_PLAYLIST);
              savePlaylistContext();
            }
            if ('order' === prop) {
              syncToggleRoot($TOGGLE_RANDOMLY, AMP_STATUS.order === 'random');
            }
            break;
          case /^playlist$/i.test(prop):
            savePlaylistContext();
            break;
          case /^media$/i.test(prop):
            syncPlaybackButtons($BUTTON_PLAY, $BUTTON_PAUSE, AMP_STATUS.media !== null && AMP_STATUS.media.length > 0);
            break;
          case /^category$/i.test(prop):
            playlistUiBindings?.updateCategory();
            break;
          case /^shuffle$/i.test(prop):
            syncToggleRoot($TOGGLE_SHUFFLE, !!(AMP_STATUS.options && AMP_STATUS.options.shuffle));
            AMP_STATUS.shuffle = createShuffledPlaylistItems({
              mediaItems: AMP_STATUS.media,
              categoryId: AMP_STATUS.ctg,
              shuffleEnabled: !!(AMP_STATUS.options && AMP_STATUS.options.shuffle),
            });
            break;
          case /^volume$/i.test(prop):
            syncVolumeSlider({
              input: $RANGE_VOLUME,
              volume: normalizeAmbientVolume(
                AMP_STATUS.volume,
                resolveAmbientDefaultVolume(getOption('volume'), DEFAULT_VOLUME)
              ),
              syncRangeProgress: (range) => syncAmbientRangeProgress(range, DEFAULT_VOLUME),
              display: document.getElementById('default-volume-value') as HTMLElement | null,
            });
            break;
          case /^notice$/i.test(prop):
            if (newValue) {
              updateNotice(newValue as NotificationPayload);
            }
            break;
          case /^options$/i.test(prop):
            {
              const ambientData = (window as any).AmbientData as AmbientData;
              applyAmbientDisplayOptions({
                status: AMP_STATUS,
                getOption: (key) => getOption(key as Extract<keyof PlaylistOptions, string>),
                defaultVolume: resolveAmbientDefaultVolume(getOption('volume'), DEFAULT_VOLUME),
                body: $BODY,
                menu: $MENU,
                imageDir: ambientData?.imageDir,
                shuffleToggleRoot: $TOGGLE_SHUFFLE,
                seekToggleRoot: $TOGGLE_SEEKPLAY,
                faderToggleRoot: $TOGGLE_FADER,
                darkModeToggleRoot: $TOGGLE_DARKMODE,
                volumeRange: $RANGE_VOLUME,
                defaultVolumeDisplay: document.getElementById('default-volume-value') as HTMLElement | null,
                normalizeVolume: (value, fallback = DEFAULT_VOLUME) => normalizeAmbientVolume(value, fallback),
                syncRangeProgress: (range) => syncAmbientRangeProgress(range, DEFAULT_VOLUME),
                syncMediaVolumeField: () => {
                  syncAmbientResolvedMediaVolumeField({
                    input: $MEDIA_VOLUME,
                    display: document.getElementById('default-media-volume'),
                    volume: getOption('volume'),
                    defaultVolume: getOption('volume'),
                    fallbackVolume: DEFAULT_VOLUME,
                  });
                },
                shufflePlaylist: () => createShuffledPlaylistItems({
                  mediaItems: AMP_STATUS.media,
                  categoryId: AMP_STATUS.ctg,
                  shuffleEnabled: true,
                }),
                setStyles,
                setFullWindowMode: (enabled, syncOption = true, closeDrawers = false) => {
                  viewportRuntime.setFullWindowMode(enabled, syncOption, closeDrawers);
                },
              });
            }
            break;
          case /^yt_(phase|seq|error)$/i.test(prop):
            syncYouTubeSignalAttrs();
            break;
        }
      },
    });
  }

  watchState();

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

  function isPlaylistLoadActive(seq: number): boolean {
    return playlistLoadGuard.isActive(seq);
  }

  function beginPlaylistLoad(playlist: string): number {
    appBoot.setPlaylistReadyState(false);
    return playlistLoadGuard.begin(playlist, (nextPlaylist) => {
      AMP_STATUS.playlist = nextPlaylist;
      applyCloudEditRestrictions();
    });
  }

  function finishPlaylistLoad(seq: number): void {
    playlistLoadGuard.finish(seq);
  }

  function resetPlaylistRuntimeState(preserveOptions: boolean = false): void {
    resetPlaylistRuntimeStatus(AMP_STATUS, preserveOptions);
    playlistUiBindings?.clearCategory();
    playlistUiBindings?.updatePlaylist();
    appBoot.setPlaylistReadyState(false);
  }

  /**
   * Save the current in-memory state of MyPlaylist to localStorage.
   * Only called in cloud mode when the active playlist is MyPlaylist.
   */
  function saveMyPlaylistToStorage(): boolean {
    try {
      const jsonStr = generatePlaylistJson(false);
      writeMyPlaylistJson(jsonStr);
      runtimeLogger('saveMyPlaylistToStorage: saved', jsonStr.length, 'bytes');
      return true;
    } catch (e) {
      runtimeLogger('saveMyPlaylistToStorage: error', e);
      return false;
    }
  }

  function abortPlaybackTimers(): void {
    playbackTimers.abortAll();
  }

  /**
   * Persist MyPlaylist only when cloud mode + MyPlaylist is currently active.
   */
  function persistMyPlaylistIfNeeded(): boolean {
    const ambientData = getRuntimeAmbientData();
    if (playlistLoadGuard.isLoading()) {
      runtimeLogger('persistMyPlaylistIfNeeded: skipped while playlist load is active');
      return false;
    }
    if (ambientData?.isCloud && AMP_STATUS.playlist === MYPLAYLIST_NAME) {
      return saveMyPlaylistToStorage();
    }
    return true;
  }

  function canMutateCurrentPlaylist(): boolean {
    const ambientData = getAmbientData();
    if (ambientData?.isCloud === true) {
      return AMP_STATUS.playlist === MYPLAYLIST_NAME || !AMP_STATUS.playlist;
    }
    return true;
  }

  function sanitizeMediaText(value: string, maxLength: number): string {
    return sharedSanitizeMediaText(value, maxLength, DISALLOWED_CONTROL_CHARS_RE);
  }

  function sanitizeMediaDesc(value: string, maxLength: number = MEDIA_DESC_MAX_LENGTH): string {
    return sharedSanitizeMediaDesc(value, maxLength, DISALLOWED_CONTROL_CHARS_RE);
  }

  const {
    getSavedPlaylistContext,
    savePlaylistContext,
    isPlaylistAvailableForResume,
    requestCategoryResume,
    requestMediaResume,
    applyPendingCategoryResume,
    applyPendingMediaResume,
  } = createPlaylistResumeBindings({
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
      playlistUiBindings?.syncTargetCategorySelection();
    },
    onMediaResumeApplied: (resumeAmId) => {
      updatePlayStatus(resumeAmId);
    },
  });

  /**
   * Load MyPlaylist from localStorage and populate AMP_STATUS as if a
   * normal JSON playlist was loaded from the server.
   */
  function loadMyPlaylistFromStorage(): boolean {
    return loadAmbientMyPlaylistFromStorage({
      status: AMP_STATUS,
      myPlaylistName: MYPLAYLIST_NAME,
      sanitizeMediaItem: <T extends Partial<MediaItem>>(item: T): T => sharedSanitizeMediaItemTextFields({
        item,
        titleMaxLength: MEDIA_TITLE_MAX_LENGTH,
        artistMaxLength: MEDIA_ARTIST_MAX_LENGTH,
        descMaxLength: MEDIA_DESC_MAX_LENGTH,
        disallowedControlChars: DISALLOWED_CONTROL_CHARS_RE,
      }),
      applyPendingCategoryResume,
      applyPendingMediaResume,
      updatePlaylist: () => {
        playlistUiBindings?.updatePlaylist();
      },
      updatePlayStatus,
      getDefaultMediaItemForCurrentView: () => getDefaultMediaItemForView({
        mediaItems: AMP_STATUS.media,
        categoryId: AMP_STATUS.ctg,
      }),
      logger,
    });
  }

  // In cloud mode: if MyPlaylist exists in localStorage, inject it into the
  // playlist dropdown and load it automatically.
  // NOTE: This block runs after DOM element constants are declared.
  function ensureMyPlaylistOptionFromStorage(): boolean {
    const ambientData = (window as any).AmbientData as AmbientData | undefined;
    return ensureMyPlaylistOptionFromStorageBootstrap({
      hasStoredMyPlaylist: hasStoredMyPlaylist(),
      isCloud: ambientData?.isCloud === true,
      myPlaylistName: MYPLAYLIST_NAME,
      selectElement: document.getElementById('current-playlist') as HTMLSelectElement | null,
    });
  }

  function initMyPlaylistFromStorage(): void {
    initAmbientMyPlaylistFromStorage({
      ensureMyPlaylistOptionFromStorage,
      resetPlaylistRuntimeState: () => {
        resetPlaylistRuntimeState();
      },
      loadMyPlaylistFromStorage,
      selectPlaylistOption: (playlist) => {
        selectExistingOption(isElement($SELECT_PLAYLIST) ? $SELECT_PLAYLIST : null, playlist);
      },
      myPlaylistName: MYPLAYLIST_NAME,
      applyCloudEditRestrictions,
      removePlaylistOption: () => {
        removeAmbientMyPlaylistOption(
          document.getElementById('current-playlist') as HTMLSelectElement | null,
          MYPLAYLIST_NAME
        );
      },
      clearCurrentPlaylist: () => {
        AMP_STATUS.playlist = null;
      },
      setPlaylistReadyState: (isReady) => {
        appBoot.setPlaylistReadyState(isReady);
      },
    });
  }

  // Process global data passed by the system.
  // NOTE: initMyPlaylistFromStorage() and AmbientData processing have been moved
  // to AFTER DOM element constants to avoid temporal dead zone issues.

  /**
   * Fetch data of specific playlist.
   */
  async function getPlaylistData(playlist: string, preserveOptionsDuringLoad: boolean = false): Promise<void> {
    await fetchAmbientPlaylistData({
      playlist,
      preserveOptionsDuringLoad,
      myPlaylistName: MYPLAYLIST_NAME,
      beginPlaylistLoad,
      resetPlaylistRuntimeState,
      loadMyPlaylistFromStorage,
      isPlaylistLoadActive,
      clearCurrentPlaylist: () => {
        AMP_STATUS.playlist = null;
      },
      applyCloudEditRestrictions,
      fetchData,
      baseUrl: BASE_URL,
      status: AMP_STATUS,
      applyPendingCategoryResume,
      applyPendingMediaResume,
      updatePlaylist: () => {
        playlistUiBindings?.updatePlaylist();
      },
      updatePlayStatus,
      getDefaultMediaItemForCurrentView: () => getDefaultMediaItemForView({
        mediaItems: AMP_STATUS.media,
        categoryId: AMP_STATUS.ctg,
      }),
      finishPlaylistLoad,
      releaseAppBootGate: () => {
        appBoot.release();
      },
    });
  }

  /**
   * In cloud mode, disable media-add and category-add controls when the
   * currently loaded playlist is an existing JSON file (not MyPlaylist).
   * MyPlaylist (localStorage-only virtual playlist) is always editable.
   */
  function applyCloudEditRestrictions(): void {
    const ambientData = getRuntimeAmbientData();
    if (!ambientData?.isCloud) return;
    applyCloudEditRestrictionsFormView({
      canMutatePlaylist: canMutateCurrentPlaylist(),
      mediaForm: document.querySelector('form[name="mediaManagement"]') as HTMLFormElement | null,
      playlistForm: document.querySelector('form[name="playlistManagement"]') as HTMLFormElement | null,
      readonlyTitle: 'Editing existing playlists is not available in cloud mode.',
    });
  }

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
  const $MODAL_MEDIA_EDIT = document.getElementById('modal-media-edit') as HTMLElement | null;
  const $MODAL_MEDIA_EDIT_TITLE = document.getElementById('modal-media-edit-title') as HTMLElement | null;
  const $MODAL_MEDIA_EDIT_ITEM_TITLE = document.getElementById('modal-media-edit-item-title') as HTMLElement | null;
  const $MODAL_MEDIA_EDIT_ITEM_SOURCE = document.getElementById('modal-media-edit-item-source') as HTMLElement | null;
  const $FORM_MEDIA_EDIT = document.getElementById('form-media-edit') as HTMLFormElement | null;
  const $MEDIA_EDIT_CATEGORY_COMBOBOX = document.getElementById('modal-media-edit-category-combobox') as HTMLElement | null;
  const $MEDIA_EDIT_CATEGORY = document.getElementById('modal-media-edit-category') as HTMLInputElement | null;
  const $BUTTON_MEDIA_EDIT_CATEGORY_CLEAR = document.getElementById('btn-media-edit-category-clear') as HTMLButtonElement | null;
  const $BUTTON_MEDIA_EDIT_CATEGORY_TOGGLE = document.getElementById('btn-media-edit-category-toggle') as HTMLButtonElement | null;
  const $MEDIA_EDIT_CATEGORY_DROPDOWN = document.getElementById('modal-media-edit-category-dropdown') as HTMLElement | null;
  const $MEDIA_EDIT_CATEGORY_OPTIONS = document.getElementById('modal-media-edit-category-options') as HTMLElement | null;
  const $MEDIA_EDIT_TITLE = document.getElementById('modal-media-edit-title-input') as HTMLInputElement | null;
  const $MEDIA_EDIT_ARTIST = document.getElementById('modal-media-edit-artist-input') as HTMLInputElement | null;
  const $MEDIA_EDIT_DESCRIPTION = document.getElementById('modal-media-edit-description') as HTMLTextAreaElement | null;
  const $MEDIA_EDIT_VOLUME = document.getElementById('modal-media-edit-volume') as HTMLInputElement | null;
  const $MEDIA_EDIT_VOLUME_VALUE = document.getElementById('modal-media-edit-volume-value') as HTMLElement | null;
  const $MEDIA_EDIT_THUMBNAIL_PREVIEW = document.getElementById('modal-media-edit-thumbnail-preview') as HTMLImageElement | null;
  const $MEDIA_EDIT_THUMBNAIL_NAME = document.getElementById('modal-media-edit-thumbnail-name') as HTMLElement | null;
  const $MEDIA_EDIT_THUMBNAIL_INPUT = document.getElementById('modal-media-edit-thumbnail-input') as HTMLInputElement | null;
  const $BUTTON_MEDIA_EDIT_THUMBNAIL_PICK = document.getElementById('btn-media-edit-thumbnail-pick') as HTMLButtonElement | null;
  const $BUTTON_MEDIA_EDIT_THUMBNAIL_REMOVE = document.getElementById('btn-media-edit-thumbnail-remove') as HTMLButtonElement | null;
  const $BUTTON_MEDIA_EDIT_THUMBNAIL_CLEAR = document.getElementById('btn-media-edit-thumbnail-clear') as HTMLButtonElement | null;
  const $MEDIA_EDIT_THUMBNAIL_SECTION = document.getElementById('media-edit-thumbnail-section') as HTMLElement | null;
  const $MEDIA_EDIT_PREVIEW = document.getElementById('modal-media-edit-preview') as HTMLElement | null;
  const $MEDIA_EDIT_PREVIEW_ERROR = document.getElementById('modal-media-edit-preview-error') as HTMLElement | null;
  const $MEDIA_EDIT_PREVIEW_ERROR_MESSAGE = document.getElementById('modal-media-edit-preview-error-message') as HTMLElement | null;
  const $BUTTON_MEDIA_EDIT_PREVIEW_RETRY = document.getElementById('btn-media-edit-preview-retry') as HTMLButtonElement | null;
  const $MEDIA_EDIT_SEEK_START = document.getElementById('modal-media-edit-seek-start') as HTMLInputElement | null;
  const $MEDIA_EDIT_SEEK_END = document.getElementById('modal-media-edit-seek-end') as HTMLInputElement | null;
  const $MEDIA_EDIT_FADEIN_END = document.getElementById('modal-media-edit-fadein-end') as HTMLInputElement | null;
  const $MEDIA_EDIT_FADEOUT_START = document.getElementById('modal-media-edit-fadeout-start') as HTMLInputElement | null;
  const $MEDIA_EDIT_SEEK_START_HMS = document.getElementById('modal-media-edit-seek-start-hms') as HTMLElement | null;
  const $MEDIA_EDIT_SEEK_END_HMS = document.getElementById('modal-media-edit-seek-end-hms') as HTMLElement | null;
  const $MEDIA_EDIT_FADEIN_END_HMS = document.getElementById('modal-media-edit-fadein-end-hms') as HTMLElement | null;
  const $MEDIA_EDIT_FADEOUT_START_HMS = document.getElementById('modal-media-edit-fadeout-start-hms') as HTMLElement | null;
  const $MEDIA_EDIT_SEEK_TIMELINE = document.getElementById('modal-media-edit-seek-timeline') as HTMLElement | null;
  const $MEDIA_EDIT_SEEK_TIMELINE_LOADING = document.getElementById('modal-media-edit-seek-timeline-loading') as HTMLElement | null;
  const $MEDIA_EDIT_SEEK_MARKER_START = document.getElementById('modal-media-edit-seek-marker-start') as HTMLElement | null;
  const $MEDIA_EDIT_SEEK_MARKER_FADEIN_END = document.getElementById('modal-media-edit-seek-marker-fadein-end') as HTMLElement | null;
  const $MEDIA_EDIT_SEEK_MARKER_FADEOUT_START = document.getElementById('modal-media-edit-seek-marker-fadeout-start') as HTMLElement | null;
  const $MEDIA_EDIT_SEEK_MARKER_END = document.getElementById('modal-media-edit-seek-marker-end') as HTMLElement | null;
  const $MEDIA_EDIT_SEEK_FIXED_START_TIME = document.getElementById('modal-media-edit-seek-fixed-start-time') as HTMLElement | null;
  const $MEDIA_EDIT_SEEK_FIXED_END_TIME = document.getElementById('modal-media-edit-seek-fixed-end-time') as HTMLElement | null;
  const $MEDIA_EDIT_SEEK_MARKER_START_TIME = document.getElementById('modal-media-edit-seek-marker-start-time') as HTMLElement | null;
  const $MEDIA_EDIT_SEEK_MARKER_FADEIN_END_TIME = document.getElementById('modal-media-edit-seek-marker-fadein-end-time') as HTMLElement | null;
  const $MEDIA_EDIT_SEEK_MARKER_FADEOUT_START_TIME = document.getElementById('modal-media-edit-seek-marker-fadeout-start-time') as HTMLElement | null;
  const $MEDIA_EDIT_SEEK_MARKER_END_TIME = document.getElementById('modal-media-edit-seek-marker-end-time') as HTMLElement | null;
  const $BUTTON_MEDIA_EDIT_SYNC_SEEK_START = document.getElementById('btn-media-edit-sync-seek-start') as HTMLButtonElement | null;
  const $BUTTON_MEDIA_EDIT_SYNC_SEEK_END = document.getElementById('btn-media-edit-sync-seek-end') as HTMLButtonElement | null;
  const $BUTTON_MEDIA_EDIT_SYNC_FADEIN_END = document.getElementById('btn-media-edit-sync-fadein-end') as HTMLButtonElement | null;
  const $BUTTON_MEDIA_EDIT_SYNC_FADEOUT_START = document.getElementById('btn-media-edit-sync-fadeout-start') as HTMLButtonElement | null;
  const $BUTTON_CLOSE_MEDIA_EDIT = document.getElementById('btn-close-media-edit') as HTMLButtonElement | null;
  const $BUTTON_CANCEL_MEDIA_EDIT = document.getElementById('btn-cancel-media-edit') as HTMLButtonElement | null;
  const $BUTTON_SAVE_MEDIA_EDIT = document.getElementById('btn-save-media-edit') as HTMLButtonElement | null;
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
  if (isElement($MODAL_MEDIA_EDIT) && $MODAL_MEDIA_EDIT.parentElement !== document.body) {
    document.body.appendChild($MODAL_MEDIA_EDIT);
  }

  const viewportRuntime = createViewportRuntimeController({
    body: $BODY,
    menu: $MENU,
    menuCollapseButton: $BUTTON_MENU_COLLAPSE,
    toggleInput: toggleWindowFullInput,
    drawerElements: {
      playlistDrawer: $DRAWER_PLAYLIST,
      settingsDrawer: $DRAWER_SETTINGS,
      playlistButton: $BUTTON_PLAYLIST,
      settingsButton: $BUTTON_SETTINGS,
      playlistCloseButton: document.getElementById('btn-close-playlist') as HTMLButtonElement | null,
      settingsCloseButton: document.getElementById('btn-close-settings') as HTMLButtonElement | null,
    },
    state: currentWindowSize,
    getViewportWidth: () => Math.round(window.visualViewport?.width || window.innerWidth),
    getViewportHeight: () => Math.round(window.visualViewport?.height || window.innerHeight),
    getBottomMenuHeight: () => getBottomMenuHeightView(
      $MENU,
      () => Math.round(window.visualViewport?.height || window.innerHeight)
    ),
    getPlayerSizeForCurrentMode: () => getPlayerSizeForCurrentModeView({
      fullWindow: isFullWindowModeView($BODY),
      viewportWidth: currentWindowSize.width,
      viewportHeight: currentWindowSize.height,
      bottomMenuHeight: getBottomMenuHeightView(
        $MENU,
        () => Math.round(window.visualViewport?.height || window.innerHeight)
      ),
    }),
    isFullWindowMode: () => isFullWindowModeView($BODY),
    getPlayer: () => player,
    getHtmlPlayer: () => document.getElementById('html-player') as HTMLVideoElement | null,
    clearTimer: (timerId) => {
      window.clearTimeout(timerId);
    },
    setTimer: (handler, delay) => window.setTimeout(handler, delay),
    persistFullWindowOption: (enabled) => {
      setPlaylistOption(AMP_STATUS, 'fullwindow', enabled);
      persistMyPlaylistIfNeeded();
    },
    syncFullWindowButtonState: (enabled) => {
      syncWindowFullButtonState($BUTTON_WINDOW_FULL, enabled);
    },
    syncMenuCollapseButtonState: (minimized) => {
      syncMenuCollapseButtonState($BUTTON_MENU_COLLAPSE, minimized);
    },
    onCaptionRefresh: () => {
      toggleAmbientCaptionBindings({
        bodyElement: $BODY,
        captionElement: $MEDIA_CAPTION,
        fallbackWidth: currentWindowSize.width,
      });
    },
  });

  const playlistDescModal = createPlaylistDescModalController(
    {
      modal: $MODAL_PLAYLIST_DESC,
      title: $MODAL_PLAYLIST_DESC_TITLE,
      artist: $MODAL_PLAYLIST_DESC_ARTIST,
      content: $MODAL_PLAYLIST_DESC_CONTENT,
    },
    {
      title: (value: string) => sanitizeMediaText(value, MEDIA_TITLE_MAX_LENGTH),
      artist: (value: string) => sanitizeMediaText(value, MEDIA_ARTIST_MAX_LENGTH),
      desc: (value: string) => sanitizeMediaDesc(value, MEDIA_DESC_MAX_LENGTH),
    }
  );
  const optionsModal = createOptionsModalController({
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
  });
  let activeMediaEditTrigger: HTMLElement | null = null;
  const defaultMediaEditModalTitle = $MODAL_MEDIA_EDIT_TITLE?.textContent?.trim() || 'Media Edit';
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
  const mediaEditDraftStore = new Map<string, MediaEditDraft>();
  let mediaEditActiveItem: MediaItem | null = null;
  let mediaEditBaseDraft: MediaEditDraft | null = null;
  let mediaEditIsDirty = false;

  const {
    resolveMediaEditEffectiveEnd,
    resolveMediaEditKnownDuration,
    getMediaEditTimingFromStoredDurations,
    getMediaEditComputedFadeDurations,
    syncMediaEditTimingDisplay,
    mediaEditDurationSync,
  } = createMediaEditTimingBindings({
    timeline: isElement($MEDIA_EDIT_SEEK_TIMELINE) ? $MEDIA_EDIT_SEEK_TIMELINE : null,
    timelineLoading: isElement($MEDIA_EDIT_SEEK_TIMELINE_LOADING) ? $MEDIA_EDIT_SEEK_TIMELINE_LOADING : null,
    fixedStartTime: isElement($MEDIA_EDIT_SEEK_FIXED_START_TIME) ? $MEDIA_EDIT_SEEK_FIXED_START_TIME : null,
    fixedEndTime: isElement($MEDIA_EDIT_SEEK_FIXED_END_TIME) ? $MEDIA_EDIT_SEEK_FIXED_END_TIME : null,
    startMarker: isElement($MEDIA_EDIT_SEEK_MARKER_START) ? $MEDIA_EDIT_SEEK_MARKER_START : null,
    startLabel: isElement($MEDIA_EDIT_SEEK_MARKER_START_TIME) ? $MEDIA_EDIT_SEEK_MARKER_START_TIME : null,
    fadeInMarker: isElement($MEDIA_EDIT_SEEK_MARKER_FADEIN_END) ? $MEDIA_EDIT_SEEK_MARKER_FADEIN_END : null,
    fadeInLabel: isElement($MEDIA_EDIT_SEEK_MARKER_FADEIN_END_TIME) ? $MEDIA_EDIT_SEEK_MARKER_FADEIN_END_TIME : null,
    fadeOutMarker: isElement($MEDIA_EDIT_SEEK_MARKER_FADEOUT_START) ? $MEDIA_EDIT_SEEK_MARKER_FADEOUT_START : null,
    fadeOutLabel: isElement($MEDIA_EDIT_SEEK_MARKER_FADEOUT_START_TIME) ? $MEDIA_EDIT_SEEK_MARKER_FADEOUT_START_TIME : null,
    endMarker: isElement($MEDIA_EDIT_SEEK_MARKER_END) ? $MEDIA_EDIT_SEEK_MARKER_END : null,
    endLabel: isElement($MEDIA_EDIT_SEEK_MARKER_END_TIME) ? $MEDIA_EDIT_SEEK_MARKER_END_TIME : null,
    seekStartHms: isElement($MEDIA_EDIT_SEEK_START_HMS) ? $MEDIA_EDIT_SEEK_START_HMS : null,
    seekEndHms: isElement($MEDIA_EDIT_SEEK_END_HMS) ? $MEDIA_EDIT_SEEK_END_HMS : null,
    fadeInEndHms: isElement($MEDIA_EDIT_FADEIN_END_HMS) ? $MEDIA_EDIT_FADEIN_END_HMS : null,
    fadeOutStartHms: isElement($MEDIA_EDIT_FADEOUT_START_HMS) ? $MEDIA_EDIT_FADEOUT_START_HMS : null,
    seekStartField: $MEDIA_EDIT_SEEK_START,
    seekEndField: $MEDIA_EDIT_SEEK_END,
    fadeInEndField: $MEDIA_EDIT_FADEIN_END,
    fadeOutStartField: $MEDIA_EDIT_FADEOUT_START,
    timeoutMs: MEDIA_EDIT_DURATION_SYNC_TIMEOUT_MS,
    pollMs: MEDIA_EDIT_DURATION_SYNC_POLL_MS,
    getActiveItem: () => mediaEditActiveItem,
    getPreviewDurationSeconds: () => mediaEditPreview.getPreviewDurationSeconds(),
    getItemIdentity: getMediaEditItemIdentity,
    normalizeTimingValue: sharedNormalizeMediaEditTimingValue,
    parseMediaTimeToIntegerSeconds: sharedParseMediaTimeToIntegerSeconds,
    formatSecondsToHHMMSS: sharedFormatSecondsToHHMMSS,
    formatSecondsToTimelineLabel: sharedFormatSecondsToTimelineLabel,
  });

  function sanitizeMediaEditDraft(
    draft: MediaEditDraftInput,
    fallback: MediaEditDraft | null = null
  ): MediaEditDraft {
    return sanitizeMediaEditDraftState({
      draft,
      fallback,
      defaultVolume: resolveAmbientDefaultVolume(getOption('volume'), DEFAULT_VOLUME),
      titleMaxLength: MEDIA_TITLE_MAX_LENGTH,
      artistMaxLength: MEDIA_ARTIST_MAX_LENGTH,
      descriptionMaxLength: MEDIA_DESC_MAX_LENGTH,
      sanitizeText: sanitizeMediaText,
      sanitizeDescription: (value, maxLength = MEDIA_DESC_MAX_LENGTH) => (
        sharedSanitizeMediaEditDescInput(value, maxLength, DISALLOWED_CONTROL_CHARS_RE)
      ),
      normalizeVolume: (value, fallback = DEFAULT_VOLUME) => normalizeAmbientVolume(value, fallback),
      normalizeTimingValue: sharedNormalizeMediaEditTimingValue,
    });
  }

  const {
    isMediaEditCategoryDropdownVisible,
    renderMediaEditCategoryOptions,
    syncMediaEditCategoryClearButton,
    closeMediaEditCategoryDropdown,
    openMediaEditCategoryDropdown,
    setMediaEditSaveButtonDisabled,
    clearMediaEditValidationView,
    validateAndRenderMediaEditDraftFromForm,
  } = createMediaEditUiBindings({
    categoryField: $MEDIA_EDIT_CATEGORY,
    titleField: $MEDIA_EDIT_TITLE,
    seekStartField: $MEDIA_EDIT_SEEK_START,
    seekEndField: $MEDIA_EDIT_SEEK_END,
    fadeInEndField: $MEDIA_EDIT_FADEIN_END,
    fadeOutStartField: $MEDIA_EDIT_FADEOUT_START,
    saveButton: $BUTTON_SAVE_MEDIA_EDIT instanceof HTMLButtonElement ? $BUTTON_SAVE_MEDIA_EDIT : null,
    categoryDropdown: isElement($MEDIA_EDIT_CATEGORY_DROPDOWN) ? $MEDIA_EDIT_CATEGORY_DROPDOWN : null,
    categoryCombobox: isElement($MEDIA_EDIT_CATEGORY_COMBOBOX) ? $MEDIA_EDIT_CATEGORY_COMBOBOX : null,
    categoryToggleButton: isElement($BUTTON_MEDIA_EDIT_CATEGORY_TOGGLE) ? $BUTTON_MEDIA_EDIT_CATEGORY_TOGGLE : null,
    categoryOptionsContainer: isElement($MEDIA_EDIT_CATEGORY_OPTIONS) ? $MEDIA_EDIT_CATEGORY_OPTIONS : null,
    categoryClearButton: isElement($BUTTON_MEDIA_EDIT_CATEGORY_CLEAR) ? $BUTTON_MEDIA_EDIT_CATEGORY_CLEAR : null,
    getCategories: () => AMP_STATUS.category,
    getLocalizedMessage,
    createValidationDraft: () => readMediaEditDraftFromForm(),
    getActiveItem: () => mediaEditActiveItem,
    resolveKnownDuration: resolveMediaEditKnownDuration,
    resolveEffectiveEnd: resolveMediaEditEffectiveEnd,
    normalizeTimingValue: sharedNormalizeMediaEditTimingValue,
  });
  const mediaEditPreview = createMediaEditPreviewBindings({
    previewElement: isElement($MEDIA_EDIT_PREVIEW) ? $MEDIA_EDIT_PREVIEW : null,
    errorElement: isElement($MEDIA_EDIT_PREVIEW_ERROR) ? $MEDIA_EDIT_PREVIEW_ERROR : null,
    errorMessageElement: isElement($MEDIA_EDIT_PREVIEW_ERROR_MESSAGE) ? $MEDIA_EDIT_PREVIEW_ERROR_MESSAGE : null,
    previewPlayerId: MEDIA_EDIT_PREVIEW_YT_PLAYER_ID,
    normalizeTimingValue: sharedNormalizeMediaEditTimingValue,
    syncYouTubePreviewDuration,
    getLocalizedMessage,
    mediaEditDurationSync,
    syncMediaEditTimingDisplay,
    syncMediaEditDraftStateFromForm: () => syncMediaEditDraftStateFromForm(),
    validateAndRenderMediaEditDraftFromForm,
  });
  const {
    resetMediaEditPreviewState,
    syncMediaEditTimingFieldFromPreview,
    createMediaEditPreview,
  } = mediaEditPreview;

  function setMediaEditDirtyState(isDirty: boolean): void {
    applyMediaEditDirtyState({
      isDirty,
      modalElement: isElement($MODAL_MEDIA_EDIT) ? $MODAL_MEDIA_EDIT : null,
      onDirtyChange: (nextDirty) => {
        mediaEditIsDirty = nextDirty;
      },
    });
  }

  function getMediaEditItemIdentity(mediaItem: MediaItem): string {
    if (Number.isInteger(mediaItem.amId) && mediaItem.amId >= 0) {
      return `amId:${mediaItem.amId}`;
    }
    if (typeof mediaItem.file === 'string' && mediaItem.file.trim() !== '') {
      return `file:${mediaItem.file.trim()}`;
    }
    if (typeof mediaItem.videoid === 'string' && mediaItem.videoid.trim() !== '') {
      return `videoid:${mediaItem.videoid.trim()}`;
    }
    return `title:${sanitizeMediaText(mediaItem.title || '', MEDIA_TITLE_MAX_LENGTH)}`;
  }
  const {
    getMediaEditDraftKey,
    hydrateMediaEditDraftStore,
    deleteMediaEditDraftByKey,
    createMediaEditBaseDraft,
    readMediaEditDraftFromForm,
    isActiveMediaEditUnsaved,
    syncMediaEditDraftStateFromForm,
    applyMediaEditDraftState,
    discardActiveMediaEditDraft,
    clearMediaEditContext,
    bindMediaEditForm,
  } = createMediaEditDraftBindings({
    storageKey: MEDIA_EDIT_DRAFT_STORAGE_KEY,
    status: AMP_STATUS,
    draftStore: mediaEditDraftStore,
    getActiveItem: () => mediaEditActiveItem,
    setActiveItem: (mediaItem) => {
      mediaEditActiveItem = mediaItem;
    },
    getBaseDraft: () => mediaEditBaseDraft,
    setBaseDraft: (draft) => {
      mediaEditBaseDraft = draft;
    },
    setPreviewSourceItem: (mediaItem) => {
      mediaEditPreview.setPreviewSourceItem(mediaItem);
    },
    setDirtyState: setMediaEditDirtyState,
    isSameDraft: isSameMediaEditDraftState,
    cloneDraft: cloneMediaEditDraftState,
    sanitizeDraft: sanitizeMediaEditDraft,
    createEmptyDraft: () => createEmptyMediaEditDraft(resolveAmbientDefaultVolume(getOption('volume'), DEFAULT_VOLUME)),
      getItemIdentity: getMediaEditItemIdentity,
      getMediaCategoryName: (mediaItem) => getMediaCategoryNameState(mediaItem, AMP_STATUS.category),
      sanitizeDescription: (value) => sharedSanitizeMediaEditDescInput(
        value,
        MEDIA_DESC_MAX_LENGTH,
        DISALLOWED_CONTROL_CHARS_RE
      ),
      getTiming: getMediaEditTimingFromStoredDurations,
      getDefaultVolume: () => resolveAmbientDefaultVolume(getOption('volume'), DEFAULT_VOLUME),
    applyDraftToForm: applyMediaEditDraftToForm,
    validateDraft: () => {
      validateAndRenderMediaEditDraftFromForm();
    },
    readFormValues: () => ({
      category: $MEDIA_EDIT_CATEGORY?.value,
      title: $MEDIA_EDIT_TITLE?.value,
      artist: $MEDIA_EDIT_ARTIST?.value,
      description: $MEDIA_EDIT_DESCRIPTION?.value,
      volume: $MEDIA_EDIT_VOLUME ? Number($MEDIA_EDIT_VOLUME.value) : undefined,
      seekStart: $MEDIA_EDIT_SEEK_START?.value,
      seekEnd: $MEDIA_EDIT_SEEK_END?.value,
      fadeInEnd: $MEDIA_EDIT_FADEIN_END?.value,
      fadeOutStart: $MEDIA_EDIT_FADEOUT_START?.value,
    }),
  });

  function applyMediaEditDraftToForm(draft: MediaEditDraft): void {
    applyMediaEditDraftToFormView({
      draft,
      activeItem: mediaEditActiveItem,
      categoryInput: isElement($MEDIA_EDIT_CATEGORY) ? $MEDIA_EDIT_CATEGORY : null,
      titleInput: isElement($MEDIA_EDIT_TITLE) ? $MEDIA_EDIT_TITLE : null,
      artistInput: isElement($MEDIA_EDIT_ARTIST) ? $MEDIA_EDIT_ARTIST : null,
      descriptionInput: isElement($MEDIA_EDIT_DESCRIPTION) ? $MEDIA_EDIT_DESCRIPTION : null,
      volumeInput: isElement($MEDIA_EDIT_VOLUME) ? $MEDIA_EDIT_VOLUME : null,
      volumeDisplay: isElement($MEDIA_EDIT_VOLUME_VALUE) ? $MEDIA_EDIT_VOLUME_VALUE : null,
      thumbnailName: isElement($MEDIA_EDIT_THUMBNAIL_NAME) ? $MEDIA_EDIT_THUMBNAIL_NAME : null,
      thumbnailPreview: isElement($MEDIA_EDIT_THUMBNAIL_PREVIEW) ? $MEDIA_EDIT_THUMBNAIL_PREVIEW : null,
      thumbnailSection: isElement($MEDIA_EDIT_THUMBNAIL_SECTION) ? $MEDIA_EDIT_THUMBNAIL_SECTION : null,
      thumbnailClearButton: isElement($BUTTON_MEDIA_EDIT_THUMBNAIL_CLEAR) ? $BUTTON_MEDIA_EDIT_THUMBNAIL_CLEAR : null,
      thumbnailRemoveButton: isElement($BUTTON_MEDIA_EDIT_THUMBNAIL_REMOVE) ? $BUTTON_MEDIA_EDIT_THUMBNAIL_REMOVE : null,
      seekStartInput: isElement($MEDIA_EDIT_SEEK_START) ? $MEDIA_EDIT_SEEK_START : null,
      seekEndInput: isElement($MEDIA_EDIT_SEEK_END) ? $MEDIA_EDIT_SEEK_END : null,
      fadeinEndInput: isElement($MEDIA_EDIT_FADEIN_END) ? $MEDIA_EDIT_FADEIN_END : null,
      fadeoutStartInput: isElement($MEDIA_EDIT_FADEOUT_START) ? $MEDIA_EDIT_FADEOUT_START : null,
      isLocalMode: isRuntimeLocalMode(),
      syncCategoryClearButton: syncMediaEditCategoryClearButton,
      renderCategoryOptions: renderMediaEditCategoryOptions,
      syncVolumeSlider,
      syncRangeProgress: (range) => syncAmbientRangeProgress(range, DEFAULT_VOLUME),
      getLocalizedMessage,
      getThumbnailSrc: getMediaEditThumbnailSrc,
      toTimingInputValue: sharedToMediaEditTimingInputValue,
      syncTimingDisplay: syncMediaEditTimingDisplay,
    });
  }

  function applyDraftToMediaItem(item: MediaItem, draft: MediaEditDraft): MediaItem {
    return applyMediaEditDraftToItem({
      item,
      draft,
      findCategoryIndexByName: (categoryName) => findMediaEditCategoryIndex(AMP_STATUS.category, categoryName),
      sanitizeDescriptionForStorage: (value) => sharedSanitizeMediaEditDescForStorage(
        value,
        MEDIA_DESC_MAX_LENGTH,
        DISALLOWED_CONTROL_CHARS_RE
      ),
      getComputedFadeDurations: getMediaEditComputedFadeDurations,
    });
  }

  async function uploadMediaEditThumbnailIfNeeded(draft: MediaEditDraft): Promise<{ ok: boolean; message: string }> {
    return uploadMediaEditThumbnailIfNeededState({
      draft,
      isLocalMode: isRuntimeLocalMode(),
      getLocalizedMessage,
      upload: async (nextDraft) => uploadMediaEditThumbnailPlatform({
        baseUrl: BASE_URL,
        endpoint: MEDIA_EDIT_THUMBNAIL_ENDPOINT,
        filename: nextDraft.thumbnailName,
        dataUrl: nextDraft.thumbnailDataUrl,
        getLocalizedMessage,
      }),
    });
  }

  async function deleteMediaEditThumbnailIfNeeded(draft: MediaEditDraft): Promise<{ ok: boolean; message: string }> {
    return deleteMediaEditThumbnailIfNeededState({
      draft,
      baseThumbnailName: mediaEditBaseDraft?.thumbnailName || '',
      isLocalMode: isRuntimeLocalMode(),
      getLocalizedMessage,
      remove: async (filename) => deleteMediaEditThumbnailPlatform({
        baseUrl: BASE_URL,
        endpoint: MEDIA_EDIT_THUMBNAIL_ENDPOINT,
        filename,
        getLocalizedMessage,
      }),
    });
  }

  async function persistMediaEditForCurrentPlaylist(workingMedia: MediaItem[]): Promise<{ ok: boolean; message: string }> {
    return persistMediaEditForCurrentPlaylistState({
      workingMedia,
      isCloud: !!getRuntimeAmbientData()?.isCloud,
      playlistName: AMP_STATUS.playlist || '',
      persistCloud: persistMyPlaylistIfNeeded,
      persistRemote: async () => {
      const payloadText = generatePlaylistJson(false);
      const payloadObject = sharedParseJsonWithBom(payloadText);
      return persistPlaylistMediaEdit({
        baseUrl: BASE_URL,
        endpoint: MEDIA_EDIT_SAVE_ENDPOINT,
        playlistName: AMP_STATUS.playlist || '',
        payloadObject,
        getLocalizedMessage,
      });
      },
      getLocalizedMessage,
    });
  }

  function setMediaEditSaveBusyState(isBusy: boolean): void {
    if (!isElement($BUTTON_SAVE_MEDIA_EDIT)) {
      return;
    }
    $BUTTON_SAVE_MEDIA_EDIT.disabled = isBusy;
    if (isBusy) {
      $BUTTON_SAVE_MEDIA_EDIT.setAttribute('aria-busy', 'true');
      return;
    }
    $BUTTON_SAVE_MEDIA_EDIT.removeAttribute('aria-busy');
  }

  function failMediaEditSave(message: string, delay: number = 2600): void {
    setMediaEditSaveBusyState(false);
    updateNotice({ type: 'error', message, delay });
  }

  function finalizeMediaEditSave(options: {
    activeItem: MediaItem;
    updatedItem: MediaItem;
    persistMessage: string;
  }): void {
    const draftKey = getMediaEditDraftKey(options.activeItem);
    deleteMediaEditDraftByKey(draftKey);
    mediaEditBaseDraft = createMediaEditBaseDraft(options.updatedItem);
    setMediaEditDirtyState(false);
    playlistUiBindings?.clearCategory();
    playlistUiBindings?.updateCategory();
    playlistUiBindings?.syncMediaCategoryField(playlistUiBindings?.getActiveCategoryId() ?? null);
    syncMediaEditCategoryClearButton();
    renderMediaEditCategoryOptions();
    playlistUiBindings?.updatePlaylist();
    if (AMP_STATUS.current === options.updatedItem.amId) {
      updatePlayStatus(options.updatedItem.amId);
    }
    setMediaEditSaveBusyState(false);
    updateNotice({
      type: 'success',
      message: options.persistMessage || getRuntimeLocalizedMessage('mediaEditSaveSuccess', 'Media changes were saved successfully.'),
      delay: 2200,
    });
    hideMediaEditModal(true);
  }
  const { saveMediaEdit } = createMediaEditSaveBindings({
    status: AMP_STATUS,
    getActiveItem: () => mediaEditActiveItem,
    getBaseDraft: () => mediaEditBaseDraft,
    getLocalizedMessage,
    ensureCategory: ensureMediaEditCategory,
    readDraftFromForm: readMediaEditDraftFromForm,
    validateDraft: validateAndRenderMediaEditDraftFromForm,
    setSaveButtonDisabled: setMediaEditSaveButtonDisabled,
    setSaveBusyState: setMediaEditSaveBusyState,
    updateNotice,
    applyDraftToMediaItem,
    uploadThumbnail: uploadMediaEditThumbnailIfNeeded,
    deleteThumbnail: deleteMediaEditThumbnailIfNeeded,
    persistWorkingMedia: persistMediaEditForCurrentPlaylist,
    finalizeSave: finalizeMediaEditSave,
    failSave: failMediaEditSave,
  });

  function confirmDiscardActiveMediaEditIfNeeded(
    fallbackMessage: string = getRuntimeLocalizedMessage('mediaEditDiscardUnsaved', 'Discard unsaved edits?')
  ): boolean {
    return confirmDiscardMediaEditDraft({
      hasUnsavedDraft: isActiveMediaEditUnsaved(),
      isDirty: mediaEditIsDirty,
      fallbackMessage,
      getLocalizedMessage,
      confirm: (message) => window.confirm(message),
      discardDraft: discardActiveMediaEditDraft,
    });
  }

  hydrateMediaEditDraftStore();

  function getMediaEditThumbnailSrc(mediaItem: MediaItem | null, draft: MediaEditDraft | null = null): string {
    return resolveMediaEditThumbnailSrc({
      mediaItem,
      draft,
      imageDir: getRuntimeAmbientData()?.imageDir,
      getFallbackThumbnailSrc: () => getAmbientNoMediaImagePath(AMP_STATUS.options, 'thumb'),
    });
  }

  function hideMediaEditModal(restoreFocus = false): void {
    if (!isElement($MODAL_MEDIA_EDIT)) {
      return;
    }
    const editedMediaId = mediaEditActiveItem?.amId ?? null;
    resetMediaEditPreviewState();
    clearMediaEditValidationView();
    const restoreTarget = activeMediaEditTrigger;
    activeMediaEditTrigger = null;
    finalizeMediaEditModalClose({
      restoreFocus,
      preferredFocusId: isPlaybackActive({
        currentMediaId: AMP_STATUS.current,
        playerType: AMP_STATUS.playertype,
        youtubePlayer: player || null,
        playButton: $BUTTON_PLAY,
        pauseButton: $BUTTON_PAUSE,
      }) ? AMP_STATUS.current : editedMediaId,
      restoreTarget,
      resetModalView: () => {
        resetMediaEditModalView({
          modalElement: $MODAL_MEDIA_EDIT,
          titleElement: isElement($MODAL_MEDIA_EDIT_TITLE) ? $MODAL_MEDIA_EDIT_TITLE : null,
          itemTitleElement: isElement($MODAL_MEDIA_EDIT_ITEM_TITLE) ? $MODAL_MEDIA_EDIT_ITEM_TITLE : null,
          itemSourceElement: isElement($MODAL_MEDIA_EDIT_ITEM_SOURCE) ? $MODAL_MEDIA_EDIT_ITEM_SOURCE : null,
          defaultTitle: defaultMediaEditModalTitle,
        });
      },
      closeCategoryDropdown: () => closeMediaEditCategoryDropdown(false),
      focusPlaylistItemById: (amId) => focusPlaylistItemByIdView({
        listElement: $LIST_PLAYLIST,
        amId,
      }),
    });
  }

  function closeMediaEditModal(restoreFocus = false): void {
    hideMediaEditModal(restoreFocus);
  }

  function cancelMediaEditModal(restoreFocus = false): void {
    discardActiveMediaEditDraft();
    hideMediaEditModal(restoreFocus);
  }

  function openMediaEditModal(mediaItem: MediaItem, trigger: HTMLElement): void {
    if (!canOpenMediaEditModal({
      mediaItem,
      activeItem: mediaEditActiveItem,
      getDraftKey: getMediaEditDraftKey,
      confirmDiscard: confirmDiscardActiveMediaEditIfNeeded,
      getLocalizedMessage,
    })) {
      return;
    }
    openManagedMediaEditModal({
      mediaItem,
      trigger,
      playlistMode,
      setActiveTrigger: (nextTrigger) => {
        activeMediaEditTrigger = nextTrigger;
      },
      closePlaylistModeMenu,
      buildItemTitle: (item) => sanitizeMediaText(item.title || '', MEDIA_TITLE_MAX_LENGTH)
        || getRuntimeLocalizedMessage('mediaEditUntitled', 'Untitled media'),
      renderSourceBadges: (item) => {
        renderMediaEditSourceBadgesView({
          container: isElement($MODAL_MEDIA_EDIT_ITEM_SOURCE) ? $MODAL_MEDIA_EDIT_ITEM_SOURCE : null,
          mediaItem: item,
          getLocalizedMessage,
          getCategoryName: (mediaItem) => getMediaCategoryNameState(mediaItem, AMP_STATUS.category),
        });
      },
      bindForm: bindMediaEditForm,
      updatePlaylist: () => {
        playlistUiBindings?.updatePlaylist();
      },
      createPreview: createMediaEditPreview,
      startDurationSyncWait: mediaEditDurationSync.startIfNeeded,
      modalElement: $MODAL_MEDIA_EDIT,
      titleElement: $MODAL_MEDIA_EDIT_TITLE,
      itemTitleElement: isElement($MODAL_MEDIA_EDIT_ITEM_TITLE) ? $MODAL_MEDIA_EDIT_ITEM_TITLE : null,
      closeButton: isElement($BUTTON_CLOSE_MEDIA_EDIT) ? $BUTTON_CLOSE_MEDIA_EDIT : null,
      defaultTitle: defaultMediaEditModalTitle,
    });
  }

  const syncViewportMetrics = (): void => viewportRuntime.syncMetrics();
  const scheduleViewportMetricsSync = (delay = 0): void => viewportRuntime.scheduleMetricsSync(delay);
  const refreshViewportMetricsAfter = (delay: number): void => viewportRuntime.refreshMetricsAfter(delay);

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

  function canUseReorderMode(): boolean {
    return canUsePlaylistReorderMode({
      canMutatePlaylist: canMutateCurrentPlaylist(),
      sortableAvailable: typeof Sortable !== 'undefined' && typeof Sortable.create === 'function',
      categoryId: AMP_STATUS.ctg,
      visibleItems: getPlaylistItemsForView(AMP_STATUS.media, AMP_STATUS.ctg),
    });
  }

  // Playlist delete mode state (v2.2.0 Slice B)
  const $MODAL_PLAYLIST_CONFIRM = document.getElementById('modal-playlist-confirm') as HTMLElement | null;
  const $MODAL_PLAYLIST_CONFIRM_TITLE = document.getElementById('modal-playlist-confirm-title') as HTMLElement | null;
  const $MODAL_PLAYLIST_CONFIRM_BODY = document.getElementById('modal-playlist-confirm-body') as HTMLElement | null;
  const $BTN_PLAYLIST_CONFIRM_APPLY = document.getElementById('btn-playlist-confirm-apply') as HTMLButtonElement | null;
  const $BTN_PLAYLIST_CONFIRM_CANCEL = document.getElementById('btn-playlist-confirm-cancel') as HTMLButtonElement | null;

  let deleteSelectedIds = new Set<number>();
  async function persistCurrentPlaylistMutation(): Promise<{ ok: boolean; message: string }> {
    return persistMediaEditForCurrentPlaylist(AMP_STATUS.media || []);
  }

  const {
    closePlaylistModeMenu,
    destroyPlaylistSortable,
    ensurePlaylistSortable,
    isPlaylistInteractionLocked,
    resetReorderState,
    syncDeleteSelectionIndicator,
    syncPlaylistModeAvailability,
    updatePlaylistModeUi: updatePlaylistModeUI,
  } = initializePlaylistModeBindings({
    playlistModeUi,
    defaultPlaylistModeButtonIcon,
    defaultPlaylistModeButtonLabel,
    listElement: $LIST_PLAYLIST,
    confirmModal: {
      modal: $MODAL_PLAYLIST_CONFIRM,
      title: $MODAL_PLAYLIST_CONFIRM_TITLE,
      body: $MODAL_PLAYLIST_CONFIRM_BODY,
      applyButton: $BTN_PLAYLIST_CONFIRM_APPLY,
      cancelButton: $BTN_PLAYLIST_CONFIRM_CANCEL,
    },
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
    canDiscardEditLeave: confirmDiscardActiveMediaEditIfNeeded,
    discardEditState: () => {
      discardActiveMediaEditDraft();
      hideMediaEditModal(false);
      clearMediaEditContext();
    },
    updatePlaylist: () => {
      playlistUiBindings?.updatePlaylist();
    },
    persistCurrentPlaylistMutation,
    updateNotice,
    getLocalizedMessage,
  });

  let openMediaManagementAction: (presetCategoryId?: number | null) => void = () => {};
  let playlistUiBindings: ReturnType<typeof createPlaylistUiBindings> | null = createPlaylistUiBindings({
    status: AMP_STATUS,
    getOption: (key) => getOption(key as Extract<keyof PlaylistOptions, string>),
    playlistMode: playlistMode,
    setPlaylistMode: (mode) => {
      playlistMode = mode;
    },
    deleteSelectedIds,
    getEditSelectedId: () => mediaEditActiveItem?.amId ?? null,
    playlistList: $LIST_PLAYLIST,
    targetCategorySelect: isElement($SELECT_CATEGORY) ? $SELECT_CATEGORY : null,
    mediaCategorySelect: isElement($MEDIA_CATEGORY_SELECT) ? $MEDIA_CATEGORY_SELECT : null,
    mediaCategoryInput: document.getElementById('media-category-new') as HTMLInputElement | null,
    mediaCategoryLabel: document.getElementById('media-category-label') as HTMLLabelElement | null,
    mediaCategoryNote: document.getElementById('note-media-category-create-from-playlist-management') as HTMLElement | null,
    canUseReorderMode,
    canMutateCurrentPlaylist,
    ambientData: (window as any).AmbientData as { imageDir?: string; debug?: boolean } | null,
    getNoMediaImagePath: (kind) => getAmbientNoMediaImagePath(AMP_STATUS.options, kind),
    openMediaManagement: (presetCategoryId) => {
      openMediaManagementAction(presetCategoryId);
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
  });

  // Process global data passed by the system.
  // In cloud mode: load MyPlaylist from localStorage before processing server data.
  // (Placed here, AFTER DOM constants, to avoid const temporal dead zone issues.)
  const savedPlaylistContext = getSavedPlaylistContext();
  domainEnsureCloudMyPlaylistSeed(logger);
  ensureMyPlaylistOptionFromStorage();
  const initialPlaylistStartup = resolveInitialPlaylistStartup<PlaylistResumeMediaContext>({
    ambientData: ((window as any).AmbientData as AmbientData | undefined) ?? null,
    hasStoredMyPlaylist: localStorage.getItem(MYPLAYLIST_KEY) !== null,
    isPlaylistAvailableForResume,
    myPlaylistName: MYPLAYLIST_NAME,
    savedPlaylistContext,
  });
  switch (initialPlaylistStartup.type) {
    case 'resume':
      requestCategoryResume(initialPlaylistStartup.category);
      requestMediaResume(initialPlaylistStartup.media);
      selectExistingOption(isElement($SELECT_PLAYLIST) ? $SELECT_PLAYLIST : null, initialPlaylistStartup.playlist);
      void getPlaylistData(initialPlaylistStartup.playlist);
      break;
    case 'autoload_myplaylist':
      initMyPlaylistFromStorage();
      appBoot.release();
      break;
    case 'autoload_current_playlist':
      void getPlaylistData(initialPlaylistStartup.playlist);
      break;
    case 'ready':
      appBoot.setPlaylistReadyState(true);
      appBoot.release();
      break;
  }

  if (isElement($ALERT)) {
    noticeController.hideLegacyAlert();
  }

  const optionsModalBindings = initializeOptionsModalBindings({
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
    playlistDescManagementLink: document.getElementById('link-open-playlist-management-category') as HTMLAnchorElement | null,
    mediaEditModal: $MODAL_MEDIA_EDIT,
    mediaVolumeInput: $MEDIA_VOLUME,
    defaultMediaVolumeDisplay: document.getElementById('default-media-volume'),
    playlistList: $LIST_PLAYLIST,
    defaultVolume: DEFAULT_VOLUME,
    getVolumeOption: () => getOption('volume'),
    getActiveCategoryId: () => playlistUiBindings?.getActiveCategoryId() ?? null,
    clearCategory: () => {
      playlistUiBindings?.clearCategory();
    },
    updateCategory: () => {
      playlistUiBindings?.updateCategory();
    },
    syncMediaCategoryField: (preferredCategoryId?: number | null) => {
      playlistUiBindings?.syncMediaCategoryField(
        preferredCategoryId ?? (playlistUiBindings?.getActiveCategoryId() ?? null)
      );
    },
    closeMediaEditCategoryDropdown,
    closeMediaEditModal,
    isMediaEditCategoryDropdownVisible,
    watcher,
  });
  const hideOptionsModal = optionsModalBindings.hideOptionsModal;
  const openMediaManagement = optionsModalBindings.openMediaManagement;
  openMediaManagementAction = openMediaManagement;

  initializeMediaEditControls({
    primary: {
      closeButton: $BUTTON_CLOSE_MEDIA_EDIT,
      cancelButton: $BUTTON_CANCEL_MEDIA_EDIT,
      saveButton: $BUTTON_SAVE_MEDIA_EDIT,
      form: $FORM_MEDIA_EDIT,
      onClose: () => {
        closeMediaEditModal(true);
      },
      onCancel: () => {
        cancelMediaEditModal(true);
      },
      onSave: async () => {
        await saveMediaEdit();
      },
    },
    category: {
      toggleButton: $BUTTON_MEDIA_EDIT_CATEGORY_TOGGLE,
      clearButton: $BUTTON_MEDIA_EDIT_CATEGORY_CLEAR,
      categoryInput: $MEDIA_EDIT_CATEGORY,
      categoryCombobox: $MEDIA_EDIT_CATEGORY_COMBOBOX,
      isDropdownVisible: isMediaEditCategoryDropdownVisible,
      openDropdown: openMediaEditCategoryDropdown,
      closeDropdown: closeMediaEditCategoryDropdown,
      syncClearButton: syncMediaEditCategoryClearButton,
      renderOptions: renderMediaEditCategoryOptions,
    },
    field: {
      draftFields: [$MEDIA_EDIT_CATEGORY, $MEDIA_EDIT_TITLE, $MEDIA_EDIT_ARTIST, $MEDIA_EDIT_DESCRIPTION],
      volumeInput: $MEDIA_EDIT_VOLUME,
      timingFields: [$MEDIA_EDIT_SEEK_START, $MEDIA_EDIT_SEEK_END, $MEDIA_EDIT_FADEIN_END, $MEDIA_EDIT_FADEOUT_START],
      timingStepperButtons: document.querySelectorAll('.media-edit-timing-stepper-btn'),
      onDraftFieldInput: () => {
        syncMediaEditDraftStateFromForm();
        validateAndRenderMediaEditDraftFromForm();
      },
      onDraftFieldChange: () => {
        syncMediaEditDraftStateFromForm();
        validateAndRenderMediaEditDraftFromForm();
      },
      onVolumeInput: () => {
        if (!$MEDIA_EDIT_VOLUME) {
          return;
        }
        const normalized = readMediaEditDraftFromForm();
        syncVolumeSlider({
          input: $MEDIA_EDIT_VOLUME,
          volume: normalized.volume,
          syncRangeProgress: (range) => syncAmbientRangeProgress(range, DEFAULT_VOLUME),
          display: $MEDIA_EDIT_VOLUME_VALUE,
        });
        syncMediaEditDraftStateFromForm();
        validateAndRenderMediaEditDraftFromForm();
      },
      onVolumeBlur: () => {
        if (!$MEDIA_EDIT_VOLUME) {
          return;
        }
        const normalized = readMediaEditDraftFromForm();
        syncVolumeSlider({
          input: $MEDIA_EDIT_VOLUME,
          volume: normalized.volume,
          syncRangeProgress: (range) => syncAmbientRangeProgress(range, DEFAULT_VOLUME),
          display: $MEDIA_EDIT_VOLUME_VALUE,
        });
        syncMediaEditDraftStateFromForm();
        validateAndRenderMediaEditDraftFromForm();
      },
      onTimingInput: (field: HTMLInputElement) => {
        sharedSanitizeMediaEditTimingInputField(field);
        syncMediaEditTimingDisplay();
        syncMediaEditDraftStateFromForm();
        validateAndRenderMediaEditDraftFromForm();
      },
      onTimingChange: (field: HTMLInputElement) => {
        sharedSanitizeMediaEditTimingInputField(field);
        syncMediaEditTimingDisplay();
        syncMediaEditDraftStateFromForm();
        validateAndRenderMediaEditDraftFromForm();
      },
      onTimingBlur: (field: HTMLInputElement) => {
        field.value = sharedToMediaEditTimingInputValue(sharedParseMediaTimeToIntegerSeconds(field.value));
        syncMediaEditTimingDisplay();
        syncMediaEditDraftStateFromForm();
        validateAndRenderMediaEditDraftFromForm();
      },
      onTimingStep: (field: HTMLInputElement, direction: 1 | -1) => {
        sharedStepMediaEditTimingField(field, direction);
      },
    },
    preview: {
      syncSeekStartButton: $BUTTON_MEDIA_EDIT_SYNC_SEEK_START,
      syncSeekEndButton: $BUTTON_MEDIA_EDIT_SYNC_SEEK_END,
      syncFadeinEndButton: $BUTTON_MEDIA_EDIT_SYNC_FADEIN_END,
      syncFadeoutStartButton: $BUTTON_MEDIA_EDIT_SYNC_FADEOUT_START,
      previewRetryButton: $BUTTON_MEDIA_EDIT_PREVIEW_RETRY,
      onSyncSeekStart: () => {
        syncMediaEditTimingFieldFromPreview($MEDIA_EDIT_SEEK_START, 'seek start');
      },
      onSyncSeekEnd: () => {
        syncMediaEditTimingFieldFromPreview($MEDIA_EDIT_SEEK_END, 'seek end');
      },
      onSyncFadeinEnd: () => {
        syncMediaEditTimingFieldFromPreview($MEDIA_EDIT_FADEIN_END, 'fade-in end');
      },
      onSyncFadeoutStart: () => {
        syncMediaEditTimingFieldFromPreview($MEDIA_EDIT_FADEOUT_START, 'fade-out start');
      },
      onPreviewRetry: () => {
        const previewSourceItem = mediaEditPreview.getPreviewSourceItem();
        if (!previewSourceItem) {
          return;
        }
        createMediaEditPreview(previewSourceItem);
      },
    },
    thumbnail: {
      pickButton: $BUTTON_MEDIA_EDIT_THUMBNAIL_PICK,
      input: $MEDIA_EDIT_THUMBNAIL_INPUT,
      removeButton: $BUTTON_MEDIA_EDIT_THUMBNAIL_REMOVE,
      clearButton: $BUTTON_MEDIA_EDIT_THUMBNAIL_CLEAR,
      onPick: () => {
        $MEDIA_EDIT_THUMBNAIL_INPUT?.click();
      },
      onInputChange: () => {
        const thumbnailInput = $MEDIA_EDIT_THUMBNAIL_INPUT;
        if (!thumbnailInput) {
          return;
        }
        const file = thumbnailInput.files?.[0] || null;
        if (!file) {
          return;
        }
        const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
        if (!allowed.includes(file.type)) {
          updateNotice({
            type: 'error',
            message: getRuntimeLocalizedMessage('mediaEditThumbnailTypeError', 'Only PNG, JPEG, GIF, and WebP images are accepted.'),
            delay: 2500,
          });
          thumbnailInput.value = '';
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          if (!mediaEditActiveItem) {
            return;
          }
          const current = readMediaEditDraftFromForm();
          const next = sanitizeMediaEditDraft({
            ...current,
            thumbnailMode: 'upload',
            thumbnailName: file.name,
            thumbnailMime: file.type,
            thumbnailDataUrl: typeof reader.result === 'string' ? reader.result : '',
          }, current);
          applyMediaEditDraftToForm(next);
          applyMediaEditDraftState(next);
        };
        reader.readAsDataURL(file);
        thumbnailInput.value = '';
      },
      onRemove: () => {
        if (!mediaEditActiveItem) {
          return;
        }
        const current = readMediaEditDraftFromForm();
        const currentName = current.thumbnailName || mediaEditBaseDraft?.thumbnailName || '';
        if (currentName === '') {
          return;
        }
        const confirmed = window.confirm(getRuntimeLocalizedMessage('mediaEditThumbnailRemoveConfirm', 'Remove the current thumbnail image?'));
        if (!confirmed) {
          return;
        }
        const next = sanitizeMediaEditDraft({
          ...current,
          thumbnailMode: 'remove',
          thumbnailName: currentName,
          thumbnailMime: '',
          thumbnailDataUrl: '',
        }, current);
        applyMediaEditDraftToForm(next);
        applyMediaEditDraftState(next);
      },
    },
  });

  function getOption<K extends Extract<keyof PlaylistOptions, string>>(
    key: K
  ): Exclude<PlaylistOptions[K], undefined> | null {
    return readPlaylistOption<PlaylistOptions, K>(AMP_STATUS, key, MYPLAYLIST_NAME);
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  bindAmbientAppControlBindings({
    selectorControls: {
      playlistSelect: $SELECT_PLAYLIST,
      categorySelect: $SELECT_CATEGORY,
      languageSelect: $SELECT_LANGUAGE,
      getCurrentPlaylist: () => AMP_STATUS.hasOwnProperty('playlist') ? AMP_STATUS.playlist : null,
      getCurrentCategoryId: () => (AMP_STATUS.hasOwnProperty('ctg') && AMP_STATUS.ctg !== null ? AMP_STATUS.ctg : null),
      getPlaylistMode: () => playlistMode,
      canDiscardEditMode: () => confirmDiscardActiveMediaEditIfNeeded(),
      clearDeleteSelections: () => {
        deleteSelectedIds.clear();
      },
      resetReorderState,
      hideMediaEditModal: () => {
        hideMediaEditModal(false);
      },
      clearMediaEditContext,
      resetPlaylistMode: () => {
        playlistMode = 'normal';
      },
      updatePlaylistModeUi: updatePlaylistModeUI,
      loadPlaylist: (playlist) => {
        void getPlaylistData(playlist);
      },
      applyCategoryChange: (newCtgId) => {
        AMP_STATUS.ctg = newCtgId;
        AMP_STATUS.prev = null;
        AMP_STATUS.current = null;
        AMP_STATUS.next = null;
      },
      updatePlaylist: () => {
        playlistUiBindings?.updatePlaylist();
      },
      getCookie,
      updateCookie,
      logger,
      reloadPage: () => {
        window.location.reload();
      },
    },
    playlistInteractionControls: {
      listElement: $LIST_PLAYLIST,
      getDescriptionPayload: getPlaylistDescriptionPayload,
      openDescriptionModal: (payload) => {
        playlistDescModal.open(
          payload.titleText,
          payload.artistText,
          payload.descText,
          payload.trigger
        );
      },
      getPlaylistMode: () => playlistMode,
      deleteSelectedIds,
      syncDeleteSelectionIndicator,
      resolveMediaItem: (amId) => AMP_STATUS.media?.find((item: MediaItem) => item.amId === amId) || null,
      openMediaEditModal,
      isPlaylistInteractionLocked,
      playItem: (target) => {
        playItem(target);
      },
      showPlayingState: () => {
        $BUTTON_PLAY.classList.add('hidden');
        $BUTTON_PAUSE.classList.remove('hidden');
      },
    },
    playerControls: {
      carouselPrevButton: $CAROUSEL_PREV,
      carouselNextButton: $CAROUSEL_NEXT,
      refreshButton: $BUTTON_REFRESH,
      windowFullButton: $BUTTON_WINDOW_FULL,
      windowFullToggle: toggleWindowFullInput,
      menuCollapseButton: $BUTTON_MENU_COLLAPSE,
      playButton: $BUTTON_PLAY,
      pauseButton: $BUTTON_PAUSE,
      menuElement: $MENU,
      getPreviousId: () => AMP_STATUS.prev,
      getNextId: () => AMP_STATUS.next,
      playItemById: (playId) => {
        playItem(null, playId);
      },
      reloadPage: () => {
        window.location.reload();
      },
      isFullWindowMode: () => isFullWindowModeView($BODY),
      setFullWindowMode: (enabled, syncOption = true, closeDrawers = false) => {
        viewportRuntime.setFullWindowMode(enabled, syncOption, closeDrawers);
      },
      setMenuMinimized: (minimized) => {
        viewportRuntime.setMenuMinimized(minimized);
      },
      playertype: AMP_STATUS.playertype,
      player,
      logger,
      mediaItems: AMP_STATUS.media || [],
      categoryId: AMP_STATUS.ctg,
      shuffleEnabled: Boolean(getOption('shuffle')),
      shuffleItems: AMP_STATUS.shuffle || [],
      currentId: AMP_STATUS.current,
      order: AMP_STATUS.order,
    },
    settingsControlRoots: {
      loop: $TOGGLE_LOOP,
      randomly: $TOGGLE_RANDOMLY,
      shuffle: $TOGGLE_SHUFFLE,
      seekplay: $TOGGLE_SEEKPLAY,
      fader: $TOGGLE_FADER,
      darkmode: $TOGGLE_DARKMODE,
    },
    settingsControls: {
      volumeRange: $RANGE_VOLUME,
      status: AMP_STATUS,
      shufflePlaylist: () => createShuffledPlaylistItems({
        mediaItems: AMP_STATUS.media,
        categoryId: AMP_STATUS.ctg,
        shuffleEnabled: true,
      }),
      persistMyPlaylistIfNeeded,
      normalizeVolume: (value) => normalizeAmbientVolume(value, DEFAULT_VOLUME),
      syncRangeProgress: (range) => syncAmbientRangeProgress(range, DEFAULT_VOLUME),
      getDefaultVolumeDisplay: () => document.getElementById('default-volume-value') as HTMLElement | null,
      isDarkModeEnabled: () => isAmbientDarkModeEnabled({ playlistOptions: AMP_STATUS.options }),
      setStyles,
    },
  });

  const { updatePlayStatus, playItem } = initializeAmbientPlayer({
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
    defaultVolume: resolveAmbientDefaultVolume(getOption('volume'), DEFAULT_VOLUME),
    imageDir: ((window as any).AmbientData as AmbientData | undefined)?.imageDir,
    getOption,
    getExtension: sharedGetExt,
    getPlaybackVolume: (mediaData: MediaItem | null = null) => getAmbientPlaybackVolume({
      mediaData,
      defaultVolume: resolveAmbientDefaultVolume(getOption('volume'), DEFAULT_VOLUME),
    }),
    normalizeVolume: (value, fallback = DEFAULT_VOLUME) => normalizeAmbientVolume(value, fallback),
    inRange: sharedInRange,
    findMediaById,
    resolveSeekRange,
    logger,
    getLocalizedMessage,
    escapeHtml: sharedEscapeHTML,
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
  });

  async function activateImportedPlaylist(playlistName: string): Promise<void> {
    ensureSelectOption(
      isElement($SELECT_PLAYLIST) ? $SELECT_PLAYLIST : null,
      playlistName,
      playlistName.replace(/\.json$/i, '')
    );
    selectExistingOption(isElement($SELECT_PLAYLIST) ? $SELECT_PLAYLIST : null, playlistName);
    requestCategoryResume(null);
    requestMediaResume(null);
    await getPlaylistData(playlistName, true);
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Toggle the display of backdrop for drawer or modal.
   */
  bindAmbientViewportLifecycle({
    drawerPlaylist: $DRAWER_PLAYLIST,
    drawerSettings: $DRAWER_SETTINGS,
    modalOptions: $MODAL_OPTIONS,
    getCurrentWidth: () => currentWindowSize.width,
    minFullUIWidth: currentWindowSize.minFullUIWidth,
    setMenuMinimized: (minimized) => {
      viewportRuntime.setMenuMinimized(minimized);
    },
    syncViewportMetrics,
    updateWindowSize: () => {
      viewportRuntime.updateWindowSize();
    },
    refreshViewportMetricsAfter,
    scheduleViewportMetricsSync,
  });

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
    return resolveManagementRelativeFilepath({
      baseUrl: BASE_URL,
      basefile,
      fetchData: async (url) => fetchData(url),
      filepathInput: document.getElementById('local-media-filepath') as HTMLInputElement | null,
      messageLabel: document.getElementById('note-error-local-media-file'),
      getDefaultMessage: (label) => String(getAtts(label, 'data-default-message') ?? ''),
      logger: runtimeLogger,
    });
  }
  const {
    resetMediaManageForm,
    addMediaData,
    generatePlaylistJson,
    resetPlaylistManageForm,
  } = initializeManagementBindingComposition({
    bindingOptions: {
    mediaForm: $MEDIA_MANAGE_FORM,
    mediaElements: $MEDIA_MANAGE_ELMS,
    playlistForm: $PLAYLIST_MANAGE_FORM,
    playlistElements: $PLAYLIST_MANAGE_ELMS,
    getAddType: () => AMP_STATUS.addtype,
    syncMediaVolumeField: () => {
      syncAmbientResolvedMediaVolumeField({
        input: $MEDIA_VOLUME,
        display: document.getElementById('default-media-volume'),
        volume: getOption('volume'),
        defaultVolume: getOption('volume'),
        fallbackVolume: DEFAULT_VOLUME,
      });
    },
    setValidated: (field, valid) => {
      if (field instanceof HTMLElement) {
        setValidated(field, valid);
      }
    },
    logger,
    ensureTargetPlaylist: () => {
      if (!AMP_STATUS.playlist) {
        AMP_STATUS.playlist = MYPLAYLIST_NAME;
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
          for (let i = 0; i < $SELECT_PLAYLIST.options.length; i++) {
            if ($SELECT_PLAYLIST.options[i]?.value === MYPLAYLIST_NAME) {
              $SELECT_PLAYLIST.selectedIndex = i;
              break;
            }
          }
        }
      }
    },
    getMediaItems: () => AMP_STATUS.media || [],
    getCategories: () => AMP_STATUS.category || [],
    setCategories: (categories) => {
      AMP_STATUS.category = categories;
    },
    setMediaItems: (mediaItems) => {
      AMP_STATUS.media = mediaItems;
    },
    titleMaxLength: MEDIA_TITLE_MAX_LENGTH,
    artistMaxLength: MEDIA_ARTIST_MAX_LENGTH,
    descMaxLength: MEDIA_DESC_MAX_LENGTH,
    sanitizeMediaText,
    sanitizeMediaDesc,
    isVolumeInRange: (value) => sharedInRange(value, 0, 100),
    generatePlaylistJson: (seekFormat) => buildPlaylistJson({
      mediaItems: AMP_STATUS.media || [],
      categories: AMP_STATUS.category || [],
      playlistOptions: AMP_STATUS.options,
      seekFormat,
    }),
    },
  })!;

  async function importPlaylistFromFile(file: File): Promise<{ ok: boolean; message: string }> {
    const ambientData = getRuntimeAmbientData();
    return importPlaylistFromManagementFile({
      file,
      ambientData,
      isLikelyJsonFile: sharedIsLikelyJsonFile,
      getLocalizedMessage: getRuntimeLocalizedMessage,
      getCloudImportSizeLimitBytes: getCloudImportSizeLimitBytesDomain,
      cloudImportSizeLimitBytes: CLOUD_IMPORT_SIZE_LIMIT_BYTES,
      parseImportedPlaylistJson,
      validatePlaylistSchemaContract: validatePlaylistSchemaContractDomain,
      sanitizeAndNormalizeImportPlaylist: (source, stripPlaylistTemplate) => sanitizeAndNormalizeImportPlaylistDomain({
        source: source as Record<string, unknown>,
        stripPlaylistTemplate,
        sanitizeText: sanitizeMediaText,
        sanitizeDesc: sanitizeMediaDesc,
        titleMaxLength: MEDIA_TITLE_MAX_LENGTH,
        artistMaxLength: MEDIA_ARTIST_MAX_LENGTH,
        descMaxLength: MEDIA_DESC_MAX_LENGTH,
      }),
      persistImportedCloudPlaylist,
      ensureMyPlaylistOptionFromStorage,
      activateImportedPlaylist,
      myPlaylistName: MYPLAYLIST_NAME,
      postImportedPlaylist: async (baseUrl, filename, playlist) => postImportedPlaylist({
        baseUrl,
        filename,
        playlist: playlist as Record<string, unknown>,
      }),
      baseUrl: BASE_URL,
      resolveImportedPlaylistPersistResult,
      getRuntimeAmbientData,
      ensureAmbientPlaylistMap: (ambient) => {
        if (!sharedIsObject(ambient.playlists)) {
          ambient.playlists = {};
        }
        return ambient.playlists as Record<string, unknown>;
      },
    });
  }

  const {
    createCategory: createPlaylistCategory,
    downloadPlaylist: downloadCurrentPlaylist,
    importPlaylist: importPlaylistFromManagementForm,
  } = createPlaylistManagementActions({
    form: $PLAYLIST_MANAGE_FORM,
    getCategories: () => AMP_STATUS.category || [],
    persistMyPlaylistIfNeeded,
    setCategories: (categories) => {
      AMP_STATUS.category = categories;
    },
    onCategoryCreated: () => {
      playlistUiBindings?.clearCategory();
      playlistUiBindings?.updateCategory();
    },
    logger,
    getPlaylistName: () => AMP_STATUS.playlist || 'playlist.json',
    generatePlaylistJson,
    importFileInput: document.getElementById('playlist-import-file') as HTMLInputElement | null,
    importPlaylistFromFile,
    hideOptionsModal,
    getLocalizedMessage: getRuntimeLocalizedMessage,
  });

  initializeManagementBindingComposition({
    initOptions: {
    mediaBindings: $MEDIA_MANAGE_FORM ? {
      form: $MEDIA_MANAGE_FORM,
      elements: $MEDIA_MANAGE_ELMS,
      mediaCategorySelect: isElement($MEDIA_CATEGORY_SELECT) ? $MEDIA_CATEGORY_SELECT : null,
      mediaTitleMaxLength: MEDIA_TITLE_MAX_LENGTH,
      mediaArtistMaxLength: MEDIA_ARTIST_MAX_LENGTH,
      mediaDescMaxLength: MEDIA_DESC_MAX_LENGTH,
      getDefaultVolume: () => resolveAmbientDefaultVolume(getOption('volume'), DEFAULT_VOLUME),
      normalizeVolume: (value, fallback = DEFAULT_VOLUME) => normalizeAmbientVolume(value, fallback),
      resetMediaManagementForm: resetMediaManageForm,
      canMutateCurrentPlaylist,
      applyCloudEditRestrictions,
      updateNotice,
      addMediaData,
      updatePlaylist: () => {
        playlistUiBindings?.updatePlaylist();
      },
      clearCategory: () => {
        playlistUiBindings?.clearCategory();
      },
      updateCategory: () => {
        playlistUiBindings?.updateCategory();
      },
      syncMediaCategoryField: (preferredCategoryId?: number | null) => {
        playlistUiBindings?.syncMediaCategoryField(
          preferredCategoryId ?? (playlistUiBindings?.getActiveCategoryId() ?? null)
        );
      },
      syncPlaybackAfterMediaAdd: (): void => {
        if (AMP_STATUS.current !== null) {
          updatePlayStatus(AMP_STATUS.current);
        } else if ((AMP_STATUS.media || []).length > 0) {
          updatePlayStatus((AMP_STATUS.media || [])[0]?.amId ?? 0);
        }
      },
      persistMediaEditForCurrentPlaylist,
      hideOptionsModal,
      setValidated,
      sanitizeMediaText,
      sanitizeMediaTextInput: (value, maxLength) => sharedSanitizeMediaTextInput(value, maxLength, DISALLOWED_CONTROL_CHARS_RE),
      sanitizeMediaDescInput: (value, maxLength = MEDIA_DESC_MAX_LENGTH) => sharedSanitizeMediaDescInput(value, maxLength, DISALLOWED_CONTROL_CHARS_RE),
      sanitizeMediaDescInputLive: (value, maxLength = MEDIA_DESC_MAX_LENGTH) => sharedSanitizeMediaDescInputLive(value, maxLength, DISALLOWED_CONTROL_CHARS_RE),
      basename: sharedBasename,
      isLikelyMediaFile: sharedIsLikelyMediaFile,
      getRelativeFilepath,
      syncRangeProgress: (range) => syncAmbientRangeProgress(range, DEFAULT_VOLUME),
      logger: runtimeLogger,
      getMediaItems: () => AMP_STATUS.media || [],
      getAddType: () => AMP_STATUS.addtype,
      setAddType: (nextType: string) => {
        AMP_STATUS.addtype = nextType;
      },
    } : null,
    playlistBindings: $PLAYLIST_MANAGE_FORM ? {
      form: $PLAYLIST_MANAGE_FORM,
      elements: $PLAYLIST_MANAGE_ELMS,
      canMutateCurrentPlaylist,
      applyCloudEditRestrictions,
      setValidated,
      updateNotice,
      resetPlaylistManagementForm: resetPlaylistManageForm,
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
      getPlaylistManageFormData: (oneData: string | null = null) => {
        if (!$PLAYLIST_MANAGE_FORM) return null;
        const formData = new FormData($PLAYLIST_MANAGE_FORM);
        return oneData ? formData.get(oneData) : Array.from(formData.entries());
      },
      createCategory: createPlaylistCategory,
      downloadPlaylist: downloadCurrentPlaylist,
      importPlaylist: importPlaylistFromManagementForm,
    } : null,
    },
  });

  const $INITIAL_ALERT = document.getElementById('alert-notification') as HTMLElement | null;
  dispatchInitialNotice($INITIAL_ALERT, updateNotice, 5000);
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

// [MODULE-BOUNDARY][v2.5.3-P0][EXTRACT-BL-003]: pure tail utility wrappers delegated to src/scripts/shared/*

// Do dispatcher
if ('complete' === document.readyState || 'loading' !== document.readyState) {
  init();
} else if (document.addEventListener) {
  document.addEventListener('DOMContentLoaded', init, false);
} else {
  (window as any).onload = init;
}
