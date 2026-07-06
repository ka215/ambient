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
  clampStringLength as sharedClampStringLength,
  escapeHTML as sharedEscapeHTML,
  getExt as sharedGetExt,
  isJsonFilename as sharedIsJsonFilename,
  parseJsonWithBom as sharedParseJsonWithBom,
  snakeToCapital as sharedSnakeToCapital,
} from './shared/string';
import {
  formatSecondsToHHMMSS as sharedFormatSecondsToHHMMSS,
  formatSecondsToTimelineLabel as sharedFormatSecondsToTimelineLabel,
  parseMediaTimeToIntegerSeconds as sharedParseMediaTimeToIntegerSeconds,
  toMediaEditTimingInputValue as sharedToMediaEditTimingInputValue,
} from './shared/time';
import {
  inArray as sharedInArray,
  inRange as sharedInRange,
  isBooleanString as sharedIsBooleanString,
  isNumberString as sharedIsNumberString,
  isObject as sharedIsObject,
} from './shared/validation';
import {
  getAmbientData as platformGetAmbientData,
  getLocalizedMessage as platformGetLocalizedMessage,
  hasPlaylist as platformHasPlaylist,
  isLocalMode as platformIsLocalMode,
} from './platform/ambient-data';
import {
  getLocalItem,
  MYPLAYLIST_KEY,
  saveUserData,
  USER_DATA_APP_KEY,
  useAppStorage,
} from './platform/storage';
import {
  deleteMediaEditThumbnail as deleteMediaEditThumbnailPlatform,
  persistPlaylistMediaEdit,
  uploadMediaEditThumbnail as uploadMediaEditThumbnailPlatform,
} from './platform/media-edit-persistence';
import {
  createPlaylistResumeController,
  getSavedPlaylistResumeContext,
  PlaylistResumeContext,
  PlaylistResumeMediaContext,
  savePlaylistResumeContext,
} from './state/playlist-context';
import {
  readPlaylistOption,
  resolvePlaylistOptionState,
  setPlaylistOption,
} from './state/playlist-options';
import {
  canUsePlaylistReorderMode,
  getPlaylistItemsForView,
} from './state/playlist-mode-state';
import {
  getMediaEditComputedFadeDurations as getMediaEditComputedFadeDurationsDomain,
  getMediaEditTimingFromStoredDurations as getMediaEditTimingFromStoredDurationsDomain,
  resolveMediaEditEffectiveEnd as resolveMediaEditEffectiveEndDomain,
  resolveMediaEditKnownDuration as resolveMediaEditKnownDurationDomain,
} from './domain/media-edit-timing';
import {
  deleteSessionDraftByKey,
  hydrateSessionDraftStore,
  syncSessionDraftState,
} from './state/session-draft-store';
import {
  applyMediaEditDirtyState,
  bindMediaEditDraftState,
  canOpenMediaEditModal,
  clearMediaEditStateContext,
  discardMediaEditDraft,
  hasActiveUnsavedMediaEditDraft,
} from './state/media-edit-state';
import {
  createMediaEditDurationSyncController,
} from './state/media-edit-duration-sync';
import {
  applyMediaEditDraftToItem,
  cloneMediaEditDraft as cloneMediaEditDraftState,
  createEmptyMediaEditDraft,
  createMediaEditDraftKey as createMediaEditDraftKeyState,
  ensureMediaEditCategory,
  findMediaEditCategoryIndex,
  isSameMediaEditDraft as isSameMediaEditDraftState,
  sanitizeMediaEditDraft as sanitizeMediaEditDraftState,
  type MediaEditDraft,
  type MediaEditDraftInput,
  updateMediaEditWorkingCopy,
} from './state/media-edit-draft';
import {
  closeResponsiveDrawers,
  cleanupDrawerBackdrops,
  isResponsiveDrawerOpen,
  syncDrawerToggleButtonState as syncDrawerToggleButtonStateView,
  syncDrawerAndModalBackdrops,
} from './ui/drawers';
import {
  applyResolvedPlaylistOptions,
  applyDarkModeAppearance,
  getToggleInput,
  resolveNoMediaImagePath,
  syncToggleRoot,
  syncVolumeSlider,
  updateNoMediaImagesForTheme,
} from './ui/settings-view';
import {
  bindViewportSyncEvents,
  isFullWindowMode as isFullWindowModeView,
} from './ui/viewport';
import { createViewportRuntimeController } from './ui/viewport-runtime';
import {
  bindModalKeyboardControls,
  bindOptionsModalControls,
  bindPlaylistDescModalControls,
  createOptionsModalController,
  createPlaylistConfirmModalController,
  createPlaylistDescModalController,
  ensureAccordionPanel as ensureAccordionPanelView,
  expandMediaManagementWhenOptionsModalVisible,
  openPlaylistManagementCategoryCreate as openPlaylistManagementCategoryCreateView,
} from './ui/modals';
import {
  focusPlaylistItemById as focusPlaylistItemByIdView,
  isMediaEditModalVisible as isMediaEditModalVisibleView,
  openManagedMediaEditModal,
  renderMediaEditSourceBadges as renderMediaEditSourceBadgesView,
  resetMediaEditModalView,
  restoreMediaEditModalFocus,
  trapMediaEditModalFocus as trapMediaEditModalFocusView,
} from './ui/media-edit-modal-view';
import {
  setMediaEditSeekTimelineLoadingView,
  syncMediaEditSeekTimelineView,
} from './ui/media-edit-timing-view';
import {
  clearMediaEditValidationView as clearMediaEditValidationViewState,
  renderMediaEditValidationView,
  setMediaEditSaveButtonDisabled as setMediaEditSaveButtonDisabledView,
} from './ui/media-edit-validation-view';
import {
  bindMediaEditCategoryControls,
  createMediaEditCategoryOptionButton,
  bindMediaEditFieldControls,
  bindMediaEditPreviewControls,
  bindMediaEditPrimaryControls,
  bindMediaEditThumbnailControls,
} from './ui/media-edit-controls';
import {
  appendPlaylistQuickAddItem,
  createShuffledPlaylist,
  enablePlaylistDownloadButton,
  finalizePlaylistRender,
  filterPlaylistItemsByCategory,
  getPlaylistDescriptionPayload,
  PlaylistMode,
  renderPlaylistItems,
  resolvePlaylistModeForRendering,
  scrollPlaylistToCurrentFocus,
  syncPlaylistCurrentFocus,
  syncPlaylistModeButton as syncPlaylistModeButtonView,
  syncDeleteSelectionIndicator as syncDeleteSelectionIndicatorView,
} from './ui/playlist-view';
import {
  bindPlaylistConfirmModalControls,
  bindPlaylistModeControls,
} from './ui/playlist-mode-controls';
import { createPlaylistModeRuntimeController } from './ui/playlist-mode-runtime';
import { createPlaylistReorderRuntimeController } from './ui/playlist-reorder-runtime';
import {
  bindAddMediaTrigger,
  bindPlayerControls,
  bindPlaylistInteractionControls,
} from './ui/app-controls';
import {
  handleCategorySelectionChange,
  handlePlayerPause,
  handlePlayerPlay,
  handlePlaylistItemActivation,
  handlePlaylistSelectionChange,
} from './ui/app-event-handlers';
import {
  bindSelectorControls,
  bindSettingsControls,
} from './ui/settings-controls';
import {
  createNoticeController,
  dispatchInitialNotice,
  type NoticeController,
} from './ui/notifications';
import {
  syncPlaybackButtonState,
  syncMenuCollapseButtonState,
  syncPlaybackButtons,
  syncWindowFullButtonState,
} from './ui/player/player-shell';
import {
  toggleCaptionMarqueeDisplay,
  updateCarouselDisplay,
  updateMediaCaptionDisplay,
} from './ui/player/player-display';
import {
  playMediaSelection,
  updatePlaybackStatus,
} from './ui/player/player-actions';
import {
  cleanupManagedYouTubeTransition,
} from './ui/player/player-orchestration';
import {
  reportPlaybackIssue,
} from './ui/player/player-effects';
import {
  runPlayerFadeIn,
  runPlayerFadeOut,
  runPlayerSetup,
} from './ui/player/player-controller';
import {
  getBottomMenuHeight as getBottomMenuHeightView,
  getFullWindowPlayerSize as getFullWindowPlayerSizeView,
  getPlayerSizeForCurrentMode as getPlayerSizeForCurrentModeView,
} from './ui/player/player-layout';
import {
  findMediaById,
  resolvePlaybackCandidateIds,
  runPlaybackTransition,
  resolveRequestedPlayId,
  resolveSeekRange,
} from './ui/player/player-runtime';
import {
  cleanupHtmlPlayerWrapper,
  destroyHtmlPreviewPlayer,
} from './ui/player/html-player-view';
import {
} from './ui/player/html-player-source';
import {
  clearMediaEditPreviewContainerView,
  createManagedMediaEditPreview,
  hideMediaEditPreviewErrorView,
  resolveMediaEditPreviewCurrentTime,
  showMediaEditPreviewErrorView,
} from './ui/player/media-edit-preview';
import { type PlayableSetupKind } from './ui/player/player-setup';
import {
  destroyYouTubePreviewPlayer,
  resetYouTubePlayerView,
  setWatchOriginState,
  showYouTubePlayerWrapper,
} from './ui/player/youtube-player-view';
import {
  syncYouTubePreviewDuration,
} from './ui/player/youtube-player-events';
import {
  clearCategoryView,
  ensureSelectOption,
  resetMediaManagementForm,
  resetPlaylistManagementForm,
  selectExistingOption,
  syncMediaCategoryField as syncMediaCategoryFieldView,
  syncMediaVolumeField as syncMediaVolumeFieldView,
  syncRangeProgress as syncRangeProgressView,
  updateCategoryView,
} from './ui/forms/management-forms';
import { applyCloudEditRestrictionsView as applyCloudEditRestrictionsFormView } from './ui/forms/cloud-edit-restrictions';
import {
  createHtmlPlayerInstance,
  createYouTubePlayerInstance,
} from './ui/player/player-instantiation';
import { bindMediaManagementForm } from './ui/forms/media-management';
import { bindPlaylistManagementForm } from './ui/forms/playlist-management';
import {
  buildMediaManagementBindings as buildMediaManagementBindingsView,
  buildPlaylistManagementBindings as buildPlaylistManagementBindingsView,
} from './ui/forms/management-binding-builders';
import {
  assignSequentialMediaIds,
  createPlaylistLoadGuard,
  materializeCategorizedMedia,
  normalizePlaylistData,
  resetPlaylistRuntimeStatus,
} from './domain/playlist-loader';
import {
  buildPlaylistJson,
  ensureCloudMyPlaylistSeed as domainEnsureCloudMyPlaylistSeed,
  hasStoredMyPlaylist,
  MYPLAYLIST_NAME,
  parseStoredMyPlaylist,
  readMyPlaylistJson,
  writeMyPlaylistJson,
} from './domain/myplaylist-storage';
import { createPlaybackTimerController } from './domain/media-playback';
import { createAppBootController } from './bootstrap/app-boot';
import {
  ensureMyPlaylistOptionFromStorage as ensureMyPlaylistOptionFromStorageBootstrap,
  removeMyPlaylistOption,
  resolveInitialPlaylistStartup,
} from './bootstrap/playlist-startup';
import { appendManagedMediaItem, buildManagedMediaItem } from './domain/media-management-data';
import {
  getCloudImportSizeLimitBytes as getCloudImportSizeLimitBytesDomain,
  parseImportedPlaylistJson,
  postImportedPlaylist,
  persistImportedCloudPlaylist,
  resolveImportedPlaylistPersistResult,
  sanitizeAndNormalizeImportPlaylist as sanitizeAndNormalizeImportPlaylistDomain,
  validatePlaylistSchemaContract as validatePlaylistSchemaContractDomain,
} from './domain/playlist-import';
import { appendUniqueCategory } from './domain/playlist-management-data';

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

  useStge();
  const AMP_STATUS = initStatus();
  const BOOT_SPLASH_MIN_VISIBLE_MS = isE2EMode ? 0 : 2400;
  const BOOT_SPLASH_FADE_MS = 220;
  const appBoot = createAppBootController({
    body: document.body,
    splash: document.getElementById('app-boot-splash'),
    minVisibleMs: BOOT_SPLASH_MIN_VISIBLE_MS,
    fadeMs: BOOT_SPLASH_FADE_MS,
    onReady: () => {
      syncViewportMetrics();
      updateWindowSize();
    },
  });

  function setPlaylistReadyState(isReady: boolean): void {
    appBoot.setPlaylistReadyState(isReady);
  }

  function setBootState(state: 'pending' | 'transition' | 'ready'): void {
    appBoot.setBootState(state);
  }

  function releaseAppBootGate(): void {
    appBoot.release();
  }

  function forceReleaseAppBootGate(): void {
    appBoot.forceRelease();
  }

  setBootState('pending');
  setPlaylistReadyState(false);

  // Fail-safe: never leave the UI hidden even if initialization errors occur.
  window.setTimeout(() => {
    forceReleaseAppBootGate();
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
          updateCategory();
          break;
        case /^shuffle$/i.test(prop):
          syncToggleRoot($TOGGLE_SHUFFLE, !!(AMP_STATUS.options && AMP_STATUS.options.shuffle));
          AMP_STATUS.shuffle = shufflePlaylist();
          break;
        case /^volume$/i.test(prop):
          syncVolumeSlider({
            input: $RANGE_VOLUME,
            volume: normalizeVolume(AMP_STATUS.volume, getDefaultVolume()),
            syncRangeProgress,
            display: document.getElementById('default-volume-value') as HTMLElement | null,
          });
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
    setPlaylistReadyState(false);
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
    clearCategory();
    updatePlaylist();
    setPlaylistReadyState(false);
  }

  /**
   * Save the current in-memory state of MyPlaylist to localStorage.
   * Only called in cloud mode when the active playlist is MyPlaylist.
   */
  function saveMyPlaylistToStorage(): boolean {
    try {
      const jsonStr = generatePlaylistJson(false);
      writeMyPlaylistJson(jsonStr);
      logger('saveMyPlaylistToStorage: saved', jsonStr.length, 'bytes');
      return true;
    } catch (e) {
      logger('saveMyPlaylistToStorage: error', e);
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
    const ambientData = getAmbientData();
    if (playlistLoadGuard.isLoading()) {
      logger('persistMyPlaylistIfNeeded: skipped while playlist load is active');
      return false;
    }
    if (ambientData?.isCloud && AMP_STATUS.playlist === MYPLAYLIST_NAME) {
      return saveMyPlaylistToStorage();
    }
    return true;
  }

  function getAmbientData(): AmbientData | undefined {
    return platformGetAmbientData();
  }

  function isLocalMode(): boolean {
    return platformIsLocalMode();
  }

  function getLocalizedMessage(key: string, fallback: string = key): string {
    return platformGetLocalizedMessage(key, fallback);
  }

  function getCurrentCategoryName(): string {
    const catId = Number(AMP_STATUS.ctg);
    if (Number.isInteger(catId) && catId >= 0 && Array.isArray(AMP_STATUS.category)) {
      return AMP_STATUS.category[catId] || '';
    }
    return '';
  }

  function getMediaCategoryName(mediaItem: MediaItem | null | undefined): string {
    if (!mediaItem || !Array.isArray(AMP_STATUS.category)) {
      return '';
    }
    return AMP_STATUS.category[mediaItem.catId] || '';
  }

  function getCurrentMediaItem(): MediaItem | null {
    if (AMP_STATUS.current === null || !Array.isArray(AMP_STATUS.media)) {
      return null;
    }
    return AMP_STATUS.media.find((item: MediaItem) => item.amId === AMP_STATUS.current) || null;
  }

  function createResumeMediaContext(mediaItem: MediaItem | null): PlaylistResumeMediaContext | null {
    return playlistResume.createResumeMediaContext(
      mediaItem,
      getCurrentCategoryName(),
      getMediaCategoryName(mediaItem as MediaItem),
      (value) => sanitizeMediaText(value, MEDIA_TITLE_MAX_LENGTH),
      (value) => sanitizeMediaText(value, MEDIA_ARTIST_MAX_LENGTH)
    );
  }

  function savePlaylistContext(): void {
    if (!AMP_STATUS.playlist) {
      return;
    }
    savePlaylistResumeContext({
      playlist: AMP_STATUS.playlist,
      category: getCurrentCategoryName(),
      media: createResumeMediaContext(getCurrentMediaItem()),
    });
  }

  function getSavedPlaylistContext(): PlaylistResumeContext | null {
    return getSavedPlaylistResumeContext(
      sanitizeMediaText,
      MEDIA_TITLE_MAX_LENGTH,
      MEDIA_ARTIST_MAX_LENGTH
    );
  }

  function isPlaylistAvailableForResume(playlist: string): boolean {
    const ambientData = getAmbientData();
    if (playlist === MYPLAYLIST_NAME) {
      return ambientData?.isCloud === true && getLocalItem(MYPLAYLIST_KEY) !== null;
    }
    return platformHasPlaylist(playlist);
  }

  function selectPlaylistOption(playlist: string): void {
    selectExistingOption(isElement($SELECT_PLAYLIST) ? $SELECT_PLAYLIST : null, playlist);
  }

  function requestCategoryResume(categoryName: string | null | undefined): void {
    playlistResume.requestCategoryResume(categoryName);
  }

  function requestMediaResume(mediaContext: PlaylistResumeMediaContext | null | undefined): void {
    playlistResume.requestMediaResume(mediaContext);
  }

  function applyPendingCategoryResume(): void {
    AMP_STATUS.ctg = playlistResume.applyPendingCategoryResume(AMP_STATUS.category);
    syncTargetCategorySelection();
  }

  function applyPendingMediaResume(): boolean {
    const resumeAmId = playlistResume.applyPendingMediaResume(
      AMP_STATUS.media || [],
      (item) => (AMP_STATUS.category || [])[item.catId] || '',
      (value) => sanitizeMediaText(value, MEDIA_TITLE_MAX_LENGTH),
      (value) => sanitizeMediaText(value, MEDIA_ARTIST_MAX_LENGTH)
    );
    if (resumeAmId === null) {
      return false;
    }
    updatePlayStatus(resumeAmId);
    return true;
  }

  function getDefaultMediaItemForCurrentView(): MediaItem | null {
    return getPlaylistItemsForCurrentView()[0] || (AMP_STATUS.media || [])[0] || null;
  }

  function stripHtmlTags(value: string): string {
    const parser = document.createElement('div');
    parser.innerHTML = value;
    return parser.textContent || parser.innerText || '';
  }

  // [MODULE-BOUNDARY][v2.5.3-P0][EXTRACT-BL-001]: shared pure string/time/validation adapters
  function clampStringLength(value: string, maxLength: number): string {
    return sharedClampStringLength(value, maxLength);
  }

  function sanitizeMediaText(value: string, maxLength: number): string {
    const normalized = stripHtmlTags(String(value || ''))
      .replace(/\r\n?/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(DISALLOWED_CONTROL_CHARS_RE, '')
      .trim();
    return clampStringLength(normalized, maxLength);
  }

  // Keep spaces while user is typing; normalize strictly on change/save.
  function sanitizeMediaTextInput(value: string, maxLength: number): string {
    const normalized = stripHtmlTags(String(value || ''))
      .replace(/\r\n?/g, ' ')
      .replace(DISALLOWED_CONTROL_CHARS_RE, '');
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

  function sanitizeMediaDescInputLive(value: string, maxLength: number = MEDIA_DESC_MAX_LENGTH): string {
    const normalized = stripHtmlTags(String(value || ''))
      .replace(/\r\n?/g, ' ')
      .replace(/\t/g, ' ')
      .replace(DISALLOWED_CONTROL_CHARS_RE, '');
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

  function sanitizeMediaEditDescInput(value: string, maxLength: number = MEDIA_DESC_MAX_LENGTH): string {
    const normalized = stripHtmlTags(String(value || ''))
      .replace(/\\n/g, '\n')
      .replace(/\r\n?/g, '\n')
      .replace(/\t/g, ' ')
      .replace(DISALLOWED_CONTROL_CHARS_RE, '');
    return clampStringLength(normalized, maxLength);
  }

  function sanitizeMediaEditDescForStorage(value: string, maxLength: number = MEDIA_DESC_MAX_LENGTH): string {
    return sanitizeMediaEditDescInput(value, maxLength)
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .replace(/\n/g, '\\n');
  }

  function sanitizeMediaItemTextFields<T extends Partial<MediaItem>>(item: T): T {
    return {
      ...item,
      title: sanitizeMediaText(String(item.title || ''), MEDIA_TITLE_MAX_LENGTH),
      artist: sanitizeMediaText(String(item.artist || ''), MEDIA_ARTIST_MAX_LENGTH),
      desc: sanitizeMediaDesc(String(item.desc || ''), MEDIA_DESC_MAX_LENGTH),
    };
  }

  function isJsonFilename(name: string): boolean {
    return sharedIsJsonFilename(name);
  }

  function isLikelyJsonFile(file: File): boolean {
    if (isJsonFilename(file.name)) {
      return true;
    }
    const type = (file.type || '').toLowerCase();
    return type === 'application/json' || type === 'text/json';
  }

  function isLikelyMediaFile(file: File): boolean {
    const type = (file.type || '').toLowerCase();
    if (/^(audio|video)\//.test(type)) {
      return true;
    }
    return /(\.(aac|avi|flac|m4a|mid|midi|mp3|mp4|mpeg|mpg|ogg|ogv|opus|ts|wav|weba|webm|wma|3gp|3g2))$/i.test(file.name);
  }

  function parseJsonWithBom(text: string): unknown {
    return sharedParseJsonWithBom(text);
  }

  function getCloudImportSizeLimitBytes(): number {
    return getCloudImportSizeLimitBytesDomain(
      navigator.userAgent || '',
      CLOUD_IMPORT_SIZE_LIMIT_BYTES
    );
  }

  function validatePlaylistSchemaContract(value: unknown): value is Record<string, unknown> {
    return validatePlaylistSchemaContractDomain(value);
  }

  function ensurePlaylistOption(playlistName: string): void {
    ensureSelectOption(
      isElement($SELECT_PLAYLIST) ? $SELECT_PLAYLIST : null,
      playlistName,
      playlistName.replace(/\.json$/i, '')
    );
  }

  function ensureCloudMyPlaylistSeed(): boolean {
    return domainEnsureCloudMyPlaylistSeed(logger);
  }

  function canMutateCurrentPlaylist(): boolean {
    const ambientData = getAmbientData();
    if (ambientData?.isCloud === true) {
      return AMP_STATUS.playlist === MYPLAYLIST_NAME || !AMP_STATUS.playlist;
    }
    return true;
  }

  /**
   * Load MyPlaylist from localStorage and populate AMP_STATUS as if a
   * normal JSON playlist was loaded from the server.
   */
  function loadMyPlaylistFromStorage(): boolean {
    const raw = readMyPlaylistJson();
    if (!raw) return false;
    try {
      const storedPlaylist = parseStoredMyPlaylist({
        raw,
        sanitizeMediaItem: sanitizeMediaItemTextFields,
      });
      if (!storedPlaylist) {
        logger('loadMyPlaylistFromStorage: invalid schema');
        return false;
      }

      const materialized = materializeCategorizedMedia(
        storedPlaylist.mediaByCategory
      );
      const categories = materialized.categories;
      let media = materialized.media;

      if (media.length > 0) {
        media = assignSequentialMediaIds(media);
      }

      AMP_STATUS.options = storedPlaylist.options as PlaylistOptions | null;
      AMP_STATUS.category = categories;
      AMP_STATUS.media = media;
      AMP_STATUS.playlist = MYPLAYLIST_NAME;
      applyPendingCategoryResume();
      updatePlaylist();
      if (applyPendingMediaResume()) {
        // The saved media item has been restored without autoplay.
      } else if (AMP_STATUS.current !== null) {
        updatePlayStatus(AMP_STATUS.current);
      } else if (media.length > 0) {
        updatePlayStatus(getDefaultMediaItemForCurrentView()?.amId ?? 0);
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
    return ensureMyPlaylistOptionFromStorageBootstrap({
      hasStoredMyPlaylist: hasStoredMyPlaylist(),
      isCloud: ambientData?.isCloud === true,
      myPlaylistName: MYPLAYLIST_NAME,
      selectElement: document.getElementById('current-playlist') as HTMLSelectElement | null,
    });
  }

  function initMyPlaylistFromStorage(): void {
    if (!ensureMyPlaylistOptionFromStorage()) return;
    resetPlaylistRuntimeState();
    if (loadMyPlaylistFromStorage()) {
      selectPlaylistOption(MYPLAYLIST_NAME);
      applyCloudEditRestrictions();
      return;
    }
    removeMyPlaylistOption(
      document.getElementById('current-playlist') as HTMLSelectElement | null,
      MYPLAYLIST_NAME
    );
    AMP_STATUS.playlist = null;
    applyCloudEditRestrictions();
    setPlaylistReadyState(true);
  }

  // Process global data passed by the system.
  // NOTE: initMyPlaylistFromStorage() and AmbientData processing have been moved
  // to AFTER DOM element constants to avoid temporal dead zone issues.

  /**
   * Fetch data of specific playlist.
   */
  async function getPlaylistData(playlist: string, preserveOptionsDuringLoad: boolean = false): Promise<void> {
    const loadSeq = beginPlaylistLoad(playlist);
    resetPlaylistRuntimeState(preserveOptionsDuringLoad);
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
        const normalized = normalizePlaylistData(data);
        AMP_STATUS.options = normalized.options as PlaylistOptions | null;
        AMP_STATUS.category = normalized.categories;
        AMP_STATUS.media = normalized.media;
        AMP_STATUS.playlist = playlist;
        applyPendingCategoryResume();
        updatePlaylist();
        if (applyPendingMediaResume()) {
          // The saved media item has been restored without autoplay.
        } else if (AMP_STATUS.current !== null) {
          updatePlayStatus(AMP_STATUS.current);
        } else if (normalized.media.length > 0) {
          updatePlayStatus(getDefaultMediaItemForCurrentView()?.amId ?? 0);
        }
      }
      applyCloudEditRestrictions();
    } finally {
      finishPlaylistLoad(loadSeq);
      releaseAppBootGate();
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
    getViewportWidth,
    getViewportHeight,
    getBottomMenuHeight,
    getPlayerSizeForCurrentMode,
    isFullWindowMode,
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
    onCaptionRefresh: toggleMarqueeCaption,
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
      closePlaylistDrawerForModalIfNeeded();
      closeSettingsDrawerForModalIfNeeded();
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
  let mediaEditPreviewYouTubePlayer: YTPlayer | null = null;
  let mediaEditPreviewHtmlPlayer: HTMLMediaElement | null = null;
  let mediaEditPreviewSourceItem: MediaItem | null = null;
  let mediaEditPreviewType: 'youtube' | 'audio' | 'video' | null = null;
  let mediaEditPreviewDurationSeconds: number | null = null;
  interface MediaEditValidationResult {
    valid: boolean;
    messages: string[];
    invalidFieldIds: string[];
    fieldMessages: Record<string, string[]>;
  }

  // [MODULE-BOUNDARY][v2.5.3-P0][EXTRACT-BL-002]: shared time adapters for media-edit timing
  function parseMediaTimeToIntegerSeconds(value: unknown): number | null {
    return sharedParseMediaTimeToIntegerSeconds(value);
  }

  function normalizeMediaEditTimingValue(value: unknown, fallback: number | null = null): number | null {
    const parsed = parseMediaTimeToIntegerSeconds(value);
    if (parsed !== null) {
      return parsed;
    }
    return fallback;
  }

  function toMediaEditTimingInputValue(value: number | null): string {
    return sharedToMediaEditTimingInputValue(value);
  }

  function sanitizeMediaEditTimingInputField(field: HTMLInputElement | null): void {
    if (!isElement(field)) {
      return;
    }
    if (field.value === '') {
      return;
    }
    field.value = field.value.replace(/[^\d]/g, '');
  }

  function formatSecondsToHHMMSS(value: number | null): string {
    return sharedFormatSecondsToHHMMSS(value);
  }

  function formatSecondsToTimelineLabel(value: number | null): string {
    return sharedFormatSecondsToTimelineLabel(value);
  }

  function syncMediaEditSeekTimeline(
    seekStart: number | null,
    seekEnd: number | null,
    fadeInEnd: number | null,
    fadeOutStart: number | null
  ): void {
    const knownDuration = resolveMediaEditKnownDuration(mediaEditActiveItem);
    syncMediaEditSeekTimelineView({
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
      seekStart,
      seekEnd,
      fadeInEnd,
      fadeOutStart,
      knownDuration,
      formatSecondsToTimelineLabel,
    });
  }

  function setMediaEditSeekTimelineLoading(isLoading: boolean): void {
    setMediaEditSeekTimelineLoadingView(
      isElement($MEDIA_EDIT_SEEK_TIMELINE) ? $MEDIA_EDIT_SEEK_TIMELINE : null,
      isElement($MEDIA_EDIT_SEEK_TIMELINE_LOADING) ? $MEDIA_EDIT_SEEK_TIMELINE_LOADING : null,
      isLoading
    );
  }

  function resolveMediaEditEffectiveEnd(
    seekEnd: number | null,
    duration: number | null,
    seekStart: number | null,
    fallbackFadeoutDuration: number | null = null
  ): number | null {
    return resolveMediaEditEffectiveEndDomain(seekEnd, duration, seekStart, fallbackFadeoutDuration);
  }

  function resolveMediaEditKnownDuration(mediaItem: MediaItem | null): number | null {
    return resolveMediaEditKnownDurationDomain({
      mediaItem,
      activeItem: mediaEditActiveItem,
      previewDurationSeconds: mediaEditPreviewDurationSeconds,
      getItemIdentity: getMediaEditItemIdentity,
      normalizeTimingValue: normalizeMediaEditTimingValue,
    });
  }

  function getMediaEditTimingFromStoredDurations(mediaItem: MediaItem): {
    seekStart: number | null;
    seekEnd: number | null;
    fadeInEnd: number | null;
    fadeOutStart: number | null;
  } {
    return getMediaEditTimingFromStoredDurationsDomain({
      mediaItem,
      activeItem: mediaEditActiveItem,
      previewDurationSeconds: mediaEditPreviewDurationSeconds,
      getItemIdentity: getMediaEditItemIdentity,
      normalizeTimingValue: normalizeMediaEditTimingValue,
    });
  }

  function getMediaEditComputedFadeDurations(item: MediaItem, draft: MediaEditDraft): {
    fadein: number | '';
    fadeout: number | '';
  } {
    return getMediaEditComputedFadeDurationsDomain({
      item,
      draft,
      activeItem: mediaEditActiveItem,
      previewDurationSeconds: mediaEditPreviewDurationSeconds,
      getItemIdentity: getMediaEditItemIdentity,
      normalizeTimingValue: normalizeMediaEditTimingValue,
    });
  }

  function syncMediaEditTimingDisplay(): void {
    const seekStart = parseMediaTimeToIntegerSeconds($MEDIA_EDIT_SEEK_START?.value || '');
    const seekEnd = parseMediaTimeToIntegerSeconds($MEDIA_EDIT_SEEK_END?.value || '');
    const fadeInEnd = parseMediaTimeToIntegerSeconds($MEDIA_EDIT_FADEIN_END?.value || '');
    const fadeOutStart = parseMediaTimeToIntegerSeconds($MEDIA_EDIT_FADEOUT_START?.value || '');
    if (isElement($MEDIA_EDIT_SEEK_START_HMS)) {
      $MEDIA_EDIT_SEEK_START_HMS.textContent = formatSecondsToHHMMSS(seekStart);
    }
    if (isElement($MEDIA_EDIT_SEEK_END_HMS)) {
      $MEDIA_EDIT_SEEK_END_HMS.textContent = formatSecondsToHHMMSS(seekEnd);
    }
    if (isElement($MEDIA_EDIT_FADEIN_END_HMS)) {
      $MEDIA_EDIT_FADEIN_END_HMS.textContent = formatSecondsToHHMMSS(fadeInEnd);
    }
    if (isElement($MEDIA_EDIT_FADEOUT_START_HMS)) {
      $MEDIA_EDIT_FADEOUT_START_HMS.textContent = formatSecondsToHHMMSS(fadeOutStart);
    }
    syncMediaEditSeekTimeline(seekStart, seekEnd, fadeInEnd, fadeOutStart);
  }

  const mediaEditDurationSync = createMediaEditDurationSyncController({
    timeoutMs: MEDIA_EDIT_DURATION_SYNC_TIMEOUT_MS,
    pollMs: MEDIA_EDIT_DURATION_SYNC_POLL_MS,
    onSetLoading: setMediaEditSeekTimelineLoading,
    getActiveItemKey: () => (mediaEditActiveItem ? getMediaEditItemIdentity(mediaEditActiveItem) : null),
    hasKnownDuration: () => resolveMediaEditKnownDuration(mediaEditActiveItem) !== null,
    onSyncReady: syncMediaEditTimingDisplay,
  });

  function getMediaEditCategoryOptions(): string[] {
    if (!Array.isArray(AMP_STATUS.category)) {
      return [];
    }
    const unique = new Set<string>();
    const options: string[] = [];
    AMP_STATUS.category.forEach((catName: string) => {
      const normalized = String(catName).trim();
      if (normalized !== '' && !unique.has(normalized)) {
        unique.add(normalized);
        options.push(normalized);
      }
    });
    return options;
  }

  function isMediaEditCategoryDropdownVisible(): boolean {
    return isElement($MEDIA_EDIT_CATEGORY_DROPDOWN)
      && !$MEDIA_EDIT_CATEGORY_DROPDOWN.classList.contains('hidden');
  }

  function renderMediaEditCategoryOptions(): void {
    if (!isElement($MEDIA_EDIT_CATEGORY_OPTIONS)) {
      return;
    }
    const selected = isElement($MEDIA_EDIT_CATEGORY) ? $MEDIA_EDIT_CATEGORY.value.trim() : '';
    const options = getMediaEditCategoryOptions();

    $MEDIA_EDIT_CATEGORY_OPTIONS.innerHTML = '';
    if (options.length === 0) {
      const emptyElm = document.createElement('div');
      emptyElm.className = 'media-edit-category-option-empty px-3 py-2 text-xs text-gray-500 dark:text-gray-300';
      emptyElm.textContent = getLocalizedMessage('mediaEditCategoryNoMatches', 'No categories');
      $MEDIA_EDIT_CATEGORY_OPTIONS.appendChild(emptyElm);
      return;
    }

    options.forEach((catName: string) => {
      const optionElm = createMediaEditCategoryOptionButton({
        categoryInput: $MEDIA_EDIT_CATEGORY,
        categoryName: catName,
        isSelected: selected === catName,
        onCloseDropdown: closeMediaEditCategoryDropdown,
      });
      $MEDIA_EDIT_CATEGORY_OPTIONS.appendChild(optionElm);
    });
  }

  function syncMediaEditCategoryClearButton(): void {
    if (!isElement($BUTTON_MEDIA_EDIT_CATEGORY_CLEAR)) {
      return;
    }
    const hasValue = isElement($MEDIA_EDIT_CATEGORY)
      && $MEDIA_EDIT_CATEGORY.value.trim() !== '';
    $BUTTON_MEDIA_EDIT_CATEGORY_CLEAR.classList.toggle('hidden', !hasValue);
    $BUTTON_MEDIA_EDIT_CATEGORY_CLEAR.setAttribute('aria-hidden', hasValue ? 'false' : 'true');
  }

  function setMediaEditCategoryDropdownExpanded(expanded: boolean): void {
    if (!isElement($MEDIA_EDIT_CATEGORY_DROPDOWN)) {
      return;
    }
    $MEDIA_EDIT_CATEGORY_DROPDOWN.classList.toggle('hidden', !expanded);
    if (isElement($MEDIA_EDIT_CATEGORY_COMBOBOX)) {
      $MEDIA_EDIT_CATEGORY_COMBOBOX.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }
    if (isElement($BUTTON_MEDIA_EDIT_CATEGORY_TOGGLE)) {
      $BUTTON_MEDIA_EDIT_CATEGORY_TOGGLE.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }
  }

  function closeMediaEditCategoryDropdown(restoreFocus: boolean = false): void {
    setMediaEditCategoryDropdownExpanded(false);
    if (restoreFocus && isElement($MEDIA_EDIT_CATEGORY)) {
      $MEDIA_EDIT_CATEGORY.focus();
    }
  }

  function openMediaEditCategoryDropdown(): void {
    renderMediaEditCategoryOptions();
    setMediaEditCategoryDropdownExpanded(true);
  }

  function stepMediaEditTimingField(field: HTMLInputElement, direction: 1 | -1): void {
    const stepValue = Number(field.step);
    const step = Number.isFinite(stepValue) && stepValue > 0 ? stepValue : 1;
    const minValue = field.min !== '' && Number.isFinite(Number(field.min)) ? Number(field.min) : 0;
    const maxValue = field.max !== '' && Number.isFinite(Number(field.max)) ? Number(field.max) : null;
    const current = parseMediaTimeToIntegerSeconds(field.value) ?? minValue;
    let nextValue = current + (step * direction);
    if (nextValue < minValue) {
      nextValue = minValue;
    }
    if (maxValue !== null && nextValue > maxValue) {
      nextValue = maxValue;
    }
    field.value = toMediaEditTimingInputValue(Math.max(0, Math.trunc(nextValue)));
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function sanitizeMediaEditDraft(
    draft: MediaEditDraftInput,
    fallback: MediaEditDraft | null = null
  ): MediaEditDraft {
    return sanitizeMediaEditDraftState({
      draft,
      fallback,
      defaultVolume: getDefaultVolume(),
      titleMaxLength: MEDIA_TITLE_MAX_LENGTH,
      artistMaxLength: MEDIA_ARTIST_MAX_LENGTH,
      descriptionMaxLength: MEDIA_DESC_MAX_LENGTH,
      sanitizeText: sanitizeMediaText,
      sanitizeDescription: sanitizeMediaEditDescInput,
      normalizeVolume,
      normalizeTimingValue: normalizeMediaEditTimingValue,
    });
  }

  function cloneMediaEditDraft(draft: MediaEditDraft): MediaEditDraft {
    return cloneMediaEditDraftState(draft);
  }

  function isSameMediaEditDraft(a: MediaEditDraft, b: MediaEditDraft): boolean {
    return isSameMediaEditDraftState(a, b);
  }

  function setMediaEditSaveButtonDisabled(disabled: boolean): void {
    setMediaEditSaveButtonDisabledView(
      $BUTTON_SAVE_MEDIA_EDIT instanceof HTMLButtonElement ? $BUTTON_SAVE_MEDIA_EDIT : null,
      disabled
    );
  }

  function clearMediaEditValidationView(): void {
    clearMediaEditValidationViewState({
      categoryField: $MEDIA_EDIT_CATEGORY,
      titleField: $MEDIA_EDIT_TITLE,
      seekStartField: $MEDIA_EDIT_SEEK_START,
      seekEndField: $MEDIA_EDIT_SEEK_END,
      fadeInEndField: $MEDIA_EDIT_FADEIN_END,
      fadeOutStartField: $MEDIA_EDIT_FADEOUT_START,
      saveButton: $BUTTON_SAVE_MEDIA_EDIT instanceof HTMLButtonElement ? $BUTTON_SAVE_MEDIA_EDIT : null,
    });
  }

  function renderMediaEditValidation(result: MediaEditValidationResult): void {
    renderMediaEditValidationView({
      categoryField: $MEDIA_EDIT_CATEGORY,
      titleField: $MEDIA_EDIT_TITLE,
      seekStartField: $MEDIA_EDIT_SEEK_START,
      seekEndField: $MEDIA_EDIT_SEEK_END,
      fadeInEndField: $MEDIA_EDIT_FADEIN_END,
      fadeOutStartField: $MEDIA_EDIT_FADEOUT_START,
      saveButton: $BUTTON_SAVE_MEDIA_EDIT instanceof HTMLButtonElement ? $BUTTON_SAVE_MEDIA_EDIT : null,
    }, result);
  }

  function validateMediaEditDraft(draft: MediaEditDraft): MediaEditValidationResult {
    const messages: string[] = [];
    const invalidFieldIds = new Set<string>();
    const fieldMessages: Record<string, string[]> = {};
    const addFieldMessage = (fieldId: string, message: string): void => {
      if (!fieldMessages[fieldId]) {
        fieldMessages[fieldId] = [];
      }
      fieldMessages[fieldId].push(message);
    };
    const knownDuration = resolveMediaEditKnownDuration(mediaEditActiveItem);
    const effectiveEnd = resolveMediaEditEffectiveEnd(
      draft.seekEnd,
      knownDuration,
      draft.seekStart,
      mediaEditActiveItem ? normalizeMediaEditTimingValue(mediaEditActiveItem.fadeout, null) : null
    );

    if (draft.category.trim() === '') {
      const message = getLocalizedMessage('Category is required.');
      messages.push(message);
      addFieldMessage('modal-media-edit-category', message);
      invalidFieldIds.add('modal-media-edit-category');
    }

    if (draft.title.trim() === '') {
      const message = getLocalizedMessage('Title is required.');
      messages.push(message);
      addFieldMessage('modal-media-edit-title-input', message);
      invalidFieldIds.add('modal-media-edit-title-input');
    }

    if (draft.seekStart !== null && draft.seekEnd !== null && draft.seekStart > draft.seekEnd) {
      const message = getLocalizedMessage('Seek start must be less than or equal to seek end.');
      messages.push(message);
      addFieldMessage('modal-media-edit-seek-start', message);
      addFieldMessage('modal-media-edit-seek-end', message);
      invalidFieldIds.add('modal-media-edit-seek-start');
      invalidFieldIds.add('modal-media-edit-seek-end');
    }

    if (draft.seekStart !== null && draft.fadeInEnd !== null && draft.seekStart > draft.fadeInEnd) {
      const message = getLocalizedMessage('Seek start must be less than or equal to fade-in end.');
      messages.push(message);
      addFieldMessage('modal-media-edit-seek-start', message);
      addFieldMessage('modal-media-edit-fadein-end', message);
      invalidFieldIds.add('modal-media-edit-seek-start');
      invalidFieldIds.add('modal-media-edit-fadein-end');
    }

    if (draft.seekStart !== null && draft.fadeOutStart !== null && draft.seekStart > draft.fadeOutStart) {
      const message = getLocalizedMessage('Seek start must be less than or equal to fade-out start.');
      messages.push(message);
      addFieldMessage('modal-media-edit-seek-start', message);
      addFieldMessage('modal-media-edit-fadeout-start', message);
      invalidFieldIds.add('modal-media-edit-seek-start');
      invalidFieldIds.add('modal-media-edit-fadeout-start');
    }

    if (draft.fadeInEnd !== null && draft.seekEnd !== null && draft.fadeInEnd > draft.seekEnd) {
      const message = getLocalizedMessage('Fade-in end must be less than or equal to seek end.');
      messages.push(message);
      addFieldMessage('modal-media-edit-fadein-end', message);
      addFieldMessage('modal-media-edit-seek-end', message);
      invalidFieldIds.add('modal-media-edit-fadein-end');
      invalidFieldIds.add('modal-media-edit-seek-end');
    }

    if (draft.fadeOutStart !== null && draft.seekEnd !== null && draft.fadeOutStart >= draft.seekEnd) {
      const message = getLocalizedMessage('Fade-out start must be less than seek end.');
      messages.push(message);
      addFieldMessage('modal-media-edit-fadeout-start', message);
      addFieldMessage('modal-media-edit-seek-end', message);
      invalidFieldIds.add('modal-media-edit-fadeout-start');
      invalidFieldIds.add('modal-media-edit-seek-end');
    }

    if (draft.fadeInEnd !== null && draft.fadeOutStart !== null && draft.fadeInEnd > draft.fadeOutStart) {
      const message = getLocalizedMessage('Fade-in end must be less than or equal to fade-out start.');
      messages.push(message);
      addFieldMessage('modal-media-edit-fadein-end', message);
      addFieldMessage('modal-media-edit-fadeout-start', message);
      invalidFieldIds.add('modal-media-edit-fadein-end');
      invalidFieldIds.add('modal-media-edit-fadeout-start');
    }

    if (draft.seekEnd !== null && knownDuration !== null && draft.seekEnd > knownDuration) {
      const message = getLocalizedMessage('Seek end must be less than or equal to media duration.');
      messages.push(message);
      addFieldMessage('modal-media-edit-seek-end', message);
      invalidFieldIds.add('modal-media-edit-seek-end');
    }

    if (draft.seekEnd === null && draft.fadeOutStart !== null && effectiveEnd !== null && draft.fadeOutStart > effectiveEnd) {
      const message = getLocalizedMessage('Fade-out start must be less than or equal to seek end.');
      messages.push(message);
      addFieldMessage('modal-media-edit-fadeout-start', message);
      addFieldMessage('modal-media-edit-seek-end', message);
      invalidFieldIds.add('modal-media-edit-fadeout-start');
      invalidFieldIds.add('modal-media-edit-seek-end');
    }

    return {
      valid: messages.length === 0,
      messages,
      invalidFieldIds: Array.from(invalidFieldIds),
      fieldMessages,
    };
  }

  function validateAndRenderMediaEditDraftFromForm(): MediaEditValidationResult {
    const draft = readMediaEditDraftFromForm();
    const result = validateMediaEditDraft(draft);
    renderMediaEditValidation(result);
    return result;
  }

  function hideMediaEditPreviewError(): void {
    hideMediaEditPreviewErrorView({
      errorElement: isElement($MEDIA_EDIT_PREVIEW_ERROR) ? $MEDIA_EDIT_PREVIEW_ERROR : null,
      errorMessageElement: isElement($MEDIA_EDIT_PREVIEW_ERROR_MESSAGE) ? $MEDIA_EDIT_PREVIEW_ERROR_MESSAGE : null,
    });
  }

  function showMediaEditPreviewError(message: string): void {
    showMediaEditPreviewErrorView({
      errorElement: isElement($MEDIA_EDIT_PREVIEW_ERROR) ? $MEDIA_EDIT_PREVIEW_ERROR : null,
      errorMessageElement: isElement($MEDIA_EDIT_PREVIEW_ERROR_MESSAGE) ? $MEDIA_EDIT_PREVIEW_ERROR_MESSAGE : null,
      message,
    });
  }

  function destroyMediaEditPreviewPlayer(): void {
    if (mediaEditPreviewYouTubePlayer) {
      destroyYouTubePreviewPlayer(mediaEditPreviewYouTubePlayer);
      mediaEditPreviewYouTubePlayer = null;
    }
    if (mediaEditPreviewHtmlPlayer) {
      destroyHtmlPreviewPlayer(mediaEditPreviewHtmlPlayer);
      mediaEditPreviewHtmlPlayer = null;
    }
    mediaEditPreviewType = null;
  }

  function clearMediaEditPreviewContainer(): void {
    clearMediaEditPreviewContainerView(isElement($MEDIA_EDIT_PREVIEW) ? $MEDIA_EDIT_PREVIEW : null);
  }

  function resetMediaEditPreviewState(): void {
    mediaEditDurationSync.clear();
    destroyMediaEditPreviewPlayer();
    clearMediaEditPreviewContainer();
    mediaEditPreviewSourceItem = null;
    mediaEditPreviewDurationSeconds = null;
    hideMediaEditPreviewError();
  }

  function getMediaEditPreviewCurrentTime(): number | null {
    return resolveMediaEditPreviewCurrentTime({
      previewType: mediaEditPreviewType,
      youtubePlayer: mediaEditPreviewYouTubePlayer,
      htmlPlayer: mediaEditPreviewHtmlPlayer,
    });
  }

  function syncMediaEditTimingFieldFromPreview(field: HTMLInputElement | null, label: string): void {
    if (!isElement(field)) {
      return;
    }
    const currentTime = getMediaEditPreviewCurrentTime();
    if (currentTime === null) {
      showMediaEditPreviewError(
        getLocalizedMessage('mediaEditPreviewSyncFailed', `Unable to sync ${label}. Preview is not ready.`)
      );
      return;
    }
    hideMediaEditPreviewError();
    field.value = String(currentTime);
    syncMediaEditTimingDisplay();
    syncMediaEditDraftStateFromForm();
    validateAndRenderMediaEditDraftFromForm();
  }

  function createMediaEditPreview(mediaItem: MediaItem): void {
    resetMediaEditPreviewState();
    mediaEditPreviewSourceItem = mediaItem;
    const previewState = createManagedMediaEditPreview({
      mediaItem,
      previewElement: isElement($MEDIA_EDIT_PREVIEW) ? $MEDIA_EDIT_PREVIEW : null,
      previewPlayerId: MEDIA_EDIT_PREVIEW_YT_PLAYER_ID,
      normalizeTimingValue: normalizeMediaEditTimingValue,
      syncYouTubePreviewDuration,
      onDurationResolved: (duration) => {
        mediaEditPreviewDurationSeconds = duration;
        validateAndRenderMediaEditDraftFromForm();
      },
      onDurationAvailable: () => {
        mediaEditDurationSync.maybeComplete();
      },
      hidePreviewError: hideMediaEditPreviewError,
      showPreviewError: showMediaEditPreviewError,
      getLocalizedMessage,
    });
    mediaEditPreviewType = previewState.previewType;
    mediaEditPreviewYouTubePlayer = previewState.youtubePlayer;
    mediaEditPreviewHtmlPlayer = previewState.htmlPlayer;
  }

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

  function getMediaEditDraftKey(mediaItem: MediaItem): string {
    const playlistKey = (AMP_STATUS.playlist || '').trim() || '__playlist__';
    return createMediaEditDraftKeyState(playlistKey, getMediaEditItemIdentity(mediaItem));
  }

  function hydrateMediaEditDraftStore(): void {
    mediaEditDraftStore.clear();
    hydrateSessionDraftStore<MediaEditDraft>({
      storageKey: MEDIA_EDIT_DRAFT_STORAGE_KEY,
      clearOnError: true,
      parseEntry: (value) => {
        if (!isObject(value) || Array.isArray(value)) {
          return null;
        }
        return sanitizeMediaEditDraft({
          category: value['category'],
          title: value['title'],
          artist: value['artist'],
          description: value['description'],
          volume: value['volume'],
          seekStart: value['seekStart'],
          seekEnd: value['seekEnd'],
          fadeInEnd: value['fadeInEnd'],
          fadeOutStart: value['fadeOutStart'],
        });
      },
    }).forEach((draft, key) => {
      mediaEditDraftStore.set(key, draft);
    });
  }

  function deleteMediaEditDraftByKey(key: string): void {
    deleteSessionDraftByKey({
      storageKey: MEDIA_EDIT_DRAFT_STORAGE_KEY,
      draftStore: mediaEditDraftStore,
      key,
    });
  }

  function createMediaEditBaseDraft(mediaItem: MediaItem): MediaEditDraft {
    const timing = getMediaEditTimingFromStoredDurations(mediaItem);
    return sanitizeMediaEditDraft({
      category: getMediaCategoryName(mediaItem),
      title: mediaItem.title || '',
      artist: mediaItem.artist || '',
      description: sanitizeMediaEditDescInput(String(mediaItem.desc || ''), MEDIA_DESC_MAX_LENGTH),
      volume: mediaItem.volume,
      seekStart: timing.seekStart,
      seekEnd: timing.seekEnd,
      fadeInEnd: timing.fadeInEnd,
      fadeOutStart: timing.fadeOutStart,
      thumbnailMode: 'keep',
      thumbnailName: mediaItem.image || mediaItem.thumb || '',
      thumbnailMime: '',
      thumbnailDataUrl: '',
    }, createEmptyMediaEditDraft(getDefaultVolume()));
  }

  function applyMediaEditDraftToForm(draft: MediaEditDraft): void {
    if (isElement($MEDIA_EDIT_CATEGORY)) {
      $MEDIA_EDIT_CATEGORY.value = draft.category;
    }
    syncMediaEditCategoryClearButton();
    renderMediaEditCategoryOptions();
    if (isElement($MEDIA_EDIT_TITLE)) {
      $MEDIA_EDIT_TITLE.value = draft.title;
    }
    if (isElement($MEDIA_EDIT_ARTIST)) {
      $MEDIA_EDIT_ARTIST.value = draft.artist;
    }
    if (isElement($MEDIA_EDIT_DESCRIPTION)) {
      $MEDIA_EDIT_DESCRIPTION.value = draft.description;
    }
    if (isElement($MEDIA_EDIT_VOLUME)) {
      syncVolumeSlider({
        input: $MEDIA_EDIT_VOLUME,
        volume: draft.volume,
        syncRangeProgress,
        display: $MEDIA_EDIT_VOLUME_VALUE,
      });
    }
    if (isElement($MEDIA_EDIT_THUMBNAIL_NAME)) {
      $MEDIA_EDIT_THUMBNAIL_NAME.textContent = draft.thumbnailMode === 'upload'
        ? draft.thumbnailName
        : draft.thumbnailMode === 'remove'
          ? getLocalizedMessage('mediaEditThumbnailRemovalPending', 'Thumbnail removal pending')
          : draft.thumbnailName || '';
    }
    if (isElement($MEDIA_EDIT_THUMBNAIL_PREVIEW)) {
      $MEDIA_EDIT_THUMBNAIL_PREVIEW.src = draft.thumbnailMode === 'upload' && draft.thumbnailDataUrl
        ? draft.thumbnailDataUrl
        : getMediaEditThumbnailSrc(mediaEditActiveItem, draft);
    }
    if (isElement($MEDIA_EDIT_THUMBNAIL_SECTION)) {
      $MEDIA_EDIT_THUMBNAIL_SECTION.classList.toggle('hidden', !isLocalMode());
    }
    const hasThumbnail = draft.thumbnailMode === 'upload'
      || (draft.thumbnailMode !== 'remove' && (
        draft.thumbnailName !== ''
        || !!mediaEditActiveItem?.image
        || !!mediaEditActiveItem?.thumb
      ));
    if (isElement($BUTTON_MEDIA_EDIT_THUMBNAIL_CLEAR)) {
      $BUTTON_MEDIA_EDIT_THUMBNAIL_CLEAR.classList.toggle('hidden', !hasThumbnail);
    }
    if (isElement($BUTTON_MEDIA_EDIT_THUMBNAIL_REMOVE)) {
      $BUTTON_MEDIA_EDIT_THUMBNAIL_REMOVE.disabled = !hasThumbnail;
    }
    if (isElement($MEDIA_EDIT_SEEK_START)) {
      $MEDIA_EDIT_SEEK_START.value = toMediaEditTimingInputValue(draft.seekStart);
    }
    if (isElement($MEDIA_EDIT_SEEK_END)) {
      $MEDIA_EDIT_SEEK_END.value = toMediaEditTimingInputValue(draft.seekEnd);
    }
    if (isElement($MEDIA_EDIT_FADEIN_END)) {
      $MEDIA_EDIT_FADEIN_END.value = toMediaEditTimingInputValue(draft.fadeInEnd);
    }
    if (isElement($MEDIA_EDIT_FADEOUT_START)) {
      $MEDIA_EDIT_FADEOUT_START.value = toMediaEditTimingInputValue(draft.fadeOutStart);
    }
    syncMediaEditTimingDisplay();
  }

  function findCategoryIndexByName(categoryName: string): number | null {
    return findMediaEditCategoryIndex(AMP_STATUS.category, categoryName);
  }

  function applyDraftToMediaItem(item: MediaItem, draft: MediaEditDraft): MediaItem {
    return applyMediaEditDraftToItem({
      item,
      draft,
      findCategoryIndexByName,
      sanitizeDescriptionForStorage: (value) => sanitizeMediaEditDescForStorage(value, MEDIA_DESC_MAX_LENGTH),
      getComputedFadeDurations: getMediaEditComputedFadeDurations,
    });
  }

  async function uploadMediaEditThumbnailIfNeeded(draft: MediaEditDraft): Promise<{ ok: boolean; message: string }> {
    if (draft.thumbnailMode !== 'upload' || draft.thumbnailDataUrl === '' || draft.thumbnailName === '') {
      return { ok: true, message: '' };
    }

    if (!isLocalMode()) {
      return { ok: false, message: getLocalizedMessage('mediaEditThumbnailCloudOnly', 'Thumbnail upload is available only in local mode.') };
    }

    return uploadMediaEditThumbnailPlatform({
      baseUrl: BASE_URL,
      endpoint: MEDIA_EDIT_THUMBNAIL_ENDPOINT,
      filename: draft.thumbnailName,
      dataUrl: draft.thumbnailDataUrl,
      getLocalizedMessage,
    });
  }

  async function deleteMediaEditThumbnailIfNeeded(draft: MediaEditDraft): Promise<{ ok: boolean; message: string }> {
    if (draft.thumbnailMode !== 'remove') {
      return { ok: true, message: '' };
    }

    const filename = mediaEditBaseDraft?.thumbnailName || '';
    if (filename === '') {
      return { ok: true, message: '' };
    }

    if (!isLocalMode()) {
      return { ok: false, message: getLocalizedMessage('mediaEditThumbnailCloudOnly', 'Thumbnail removal is available only in local mode.') };
    }

    return deleteMediaEditThumbnailPlatform({
      baseUrl: BASE_URL,
      endpoint: MEDIA_EDIT_THUMBNAIL_ENDPOINT,
      filename,
      getLocalizedMessage,
    });
  }

  async function persistMediaEditForCurrentPlaylist(workingMedia: MediaItem[]): Promise<{ ok: boolean; message: string }> {
    const ambientData = getAmbientData();
    if (ambientData?.isCloud) {
      const persisted = persistMyPlaylistIfNeeded();
      return {
        ok: persisted,
        message: persisted
          ? getLocalizedMessage('mediaEditSaveSuccess', 'Media changes were saved successfully.')
          : getLocalizedMessage('mediaEditSaveFailed', 'Failed to save media changes.'),
      };
    }

    const playlistName = AMP_STATUS.playlist || '';
    if (playlistName === '') {
      return { ok: false, message: getLocalizedMessage('mediaEditSaveFailed', 'Failed to save media changes.') };
    }

    try {
      const payloadText = generatePlaylistJson(false);
      const payloadObject = parseJsonWithBom(payloadText);
      const payload = await persistPlaylistMediaEdit({
        baseUrl: BASE_URL,
        endpoint: MEDIA_EDIT_SAVE_ENDPOINT,
        playlistName,
        payloadObject,
        getLocalizedMessage,
      });
      if (!payload.ok) {
        return payload;
      }
      void workingMedia;
      return payload;
    } catch (_error) {
      return { ok: false, message: getLocalizedMessage('mediaEditSaveFailed', 'Failed to save media changes.') };
    }
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

  async function saveMediaEdit(): Promise<void> {
    if (!mediaEditActiveItem || !mediaEditBaseDraft || !Array.isArray(AMP_STATUS.media)) {
      return;
    }

    const validation = validateAndRenderMediaEditDraftFromForm();
    if (!validation.valid) {
      setMediaEditSaveButtonDisabled(true);
      updateNotice({
        type: 'error',
        message: getLocalizedMessage('Please fix the validation errors before saving.'),
        delay: 2400,
      });
      return;
    }

    const draft = readMediaEditDraftFromForm();
    AMP_STATUS.category = ensureMediaEditCategory(AMP_STATUS.category, draft.category);

    setMediaEditSaveBusyState(true);

    const saveTarget = updateMediaEditWorkingCopy({
      mediaItems: AMP_STATUS.media,
      activeMediaId: mediaEditActiveItem.amId,
      applyUpdate: (item) => applyDraftToMediaItem(item, draft),
    });
    if (!saveTarget) {
      setMediaEditSaveBusyState(false);
      return;
    }
    const { workingMedia, updatedItem } = saveTarget;

    const uploadResult = await uploadMediaEditThumbnailIfNeeded(draft);
    if (!uploadResult.ok) {
      failMediaEditSave(uploadResult.message);
      return;
    }

    const deleteResult = await deleteMediaEditThumbnailIfNeeded(draft);
    if (!deleteResult.ok) {
      failMediaEditSave(deleteResult.message);
      return;
    }

    const previousMedia = AMP_STATUS.media;
    AMP_STATUS.media = workingMedia;
    const persistResult = await persistMediaEditForCurrentPlaylist(workingMedia);
    if (!persistResult.ok) {
      AMP_STATUS.media = previousMedia;
      failMediaEditSave(persistResult.message);
      return;
    }

    const draftKey = getMediaEditDraftKey(mediaEditActiveItem);
    deleteMediaEditDraftByKey(draftKey);
    mediaEditBaseDraft = createMediaEditBaseDraft(updatedItem);
    setMediaEditDirtyState(false);
    clearCategory();
    updateCategory();
    syncMediaCategoryField();
    syncMediaEditCategoryClearButton();
    renderMediaEditCategoryOptions();
    updatePlaylist();
    if (AMP_STATUS.current === updatedItem.amId) {
      updatePlayStatus(updatedItem.amId);
    }
    setMediaEditSaveBusyState(false);
    updateNotice({
      type: 'success',
      message: persistResult.message || getLocalizedMessage('mediaEditSaveSuccess', 'Media changes were saved successfully.'),
      delay: 2200,
    });
    hideMediaEditModal(true);
  }

  function readMediaEditDraftFromForm(): MediaEditDraft {
    const fallback = mediaEditBaseDraft || createEmptyMediaEditDraft(getDefaultVolume());
    const activeDraft = mediaEditActiveItem
      ? mediaEditDraftStore.get(getMediaEditDraftKey(mediaEditActiveItem)) || null
      : null;
    return sanitizeMediaEditDraft({
      category: $MEDIA_EDIT_CATEGORY?.value,
      title: $MEDIA_EDIT_TITLE?.value,
      artist: $MEDIA_EDIT_ARTIST?.value,
      description: $MEDIA_EDIT_DESCRIPTION?.value,
      volume: $MEDIA_EDIT_VOLUME ? Number($MEDIA_EDIT_VOLUME.value) : undefined,
      seekStart: $MEDIA_EDIT_SEEK_START?.value,
      seekEnd: $MEDIA_EDIT_SEEK_END?.value,
      fadeInEnd: $MEDIA_EDIT_FADEIN_END?.value,
      fadeOutStart: $MEDIA_EDIT_FADEOUT_START?.value,
      thumbnailMode: activeDraft?.thumbnailMode,
      thumbnailName: activeDraft?.thumbnailName,
      thumbnailMime: activeDraft?.thumbnailMime,
      thumbnailDataUrl: activeDraft?.thumbnailDataUrl,
    }, fallback);
  }

  function isActiveMediaEditUnsaved(): boolean {
    return hasActiveUnsavedMediaEditDraft({
      activeItem: mediaEditActiveItem,
      draftStore: mediaEditDraftStore,
      getDraftKey: getMediaEditDraftKey,
    });
  }

  function syncMediaEditDraftStateFromForm(): void {
    if (!mediaEditActiveItem || !mediaEditBaseDraft) {
      return;
    }
    const currentDraft = readMediaEditDraftFromForm();
    const currentKey = getMediaEditDraftKey(mediaEditActiveItem);
    const isDirty = syncSessionDraftState({
      storageKey: MEDIA_EDIT_DRAFT_STORAGE_KEY,
      draftStore: mediaEditDraftStore,
      key: currentKey,
      baseDraft: mediaEditBaseDraft,
      nextDraft: currentDraft,
      isSameDraft: isSameMediaEditDraft,
      cloneDraft: cloneMediaEditDraft,
    });
    setMediaEditDirtyState(isDirty);
  }

  function applyMediaEditDraftState(nextDraft: MediaEditDraft): void {
    if (!mediaEditActiveItem || !mediaEditBaseDraft) {
      return;
    }
    const currentKey = getMediaEditDraftKey(mediaEditActiveItem);
    const isDirty = syncSessionDraftState({
      storageKey: MEDIA_EDIT_DRAFT_STORAGE_KEY,
      draftStore: mediaEditDraftStore,
      key: currentKey,
      baseDraft: mediaEditBaseDraft,
      nextDraft,
      isSameDraft: isSameMediaEditDraft,
      cloneDraft: cloneMediaEditDraft,
    });
    setMediaEditDirtyState(isDirty);
  }

  function discardActiveMediaEditDraft(): void {
    discardMediaEditDraft({
      activeItem: mediaEditActiveItem,
      getDraftKey: getMediaEditDraftKey,
      deleteDraftByKey: deleteMediaEditDraftByKey,
      setDirtyState: setMediaEditDirtyState,
    });
  }

  function clearMediaEditContext(): void {
    clearMediaEditStateContext({
      setActiveItem: (mediaItem) => {
        mediaEditActiveItem = mediaItem;
      },
      setBaseDraft: (draft) => {
        mediaEditBaseDraft = draft as MediaEditDraft | null;
      },
      setPreviewSourceItem: (mediaItem) => {
        mediaEditPreviewSourceItem = mediaItem;
      },
      setDirtyState: setMediaEditDirtyState,
    });
  }

  function confirmDiscardActiveMediaEditIfNeeded(
    fallbackMessage: string = getLocalizedMessage('mediaEditDiscardUnsaved', 'Discard unsaved edits?')
  ): boolean {
    if (!isActiveMediaEditUnsaved() && !mediaEditIsDirty) {
      return true;
    }
    const message = getLocalizedMessage('Discard unsaved media edits?', fallbackMessage);
    const shouldDiscard = window.confirm(message);
    if (!shouldDiscard) {
      return false;
    }
    discardActiveMediaEditDraft();
    return true;
  }

  function bindMediaEditForm(mediaItem: MediaItem): void {
    const binding = bindMediaEditDraftState({
      mediaItem,
      draftStore: mediaEditDraftStore,
      getDraftKey: getMediaEditDraftKey,
      createBaseDraft: createMediaEditBaseDraft,
      isSameDraft: isSameMediaEditDraft,
    });
    mediaEditActiveItem = binding.activeItem;
    mediaEditBaseDraft = binding.baseDraft;
    const initialDraft = binding.initialDraft;
    applyMediaEditDraftToForm(initialDraft);
    setMediaEditDirtyState(binding.isDirty);
    validateAndRenderMediaEditDraftFromForm();
  }

  hydrateMediaEditDraftStore();

  function isMediaEditModalVisible(): boolean {
    return isMediaEditModalVisibleView(isElement($MODAL_MEDIA_EDIT) ? $MODAL_MEDIA_EDIT : null);
  }

  function trapMediaEditModalFocus(evt: KeyboardEvent): void {
    trapMediaEditModalFocusView({
      modalElement: isElement($MODAL_MEDIA_EDIT) ? $MODAL_MEDIA_EDIT : null,
      event: evt,
    });
  }

  function renderMediaEditSourceBadges(mediaItem: MediaItem): void {
    renderMediaEditSourceBadgesView({
      container: isElement($MODAL_MEDIA_EDIT_ITEM_SOURCE) ? $MODAL_MEDIA_EDIT_ITEM_SOURCE : null,
      mediaItem,
      getLocalizedMessage,
      getCategoryName: getMediaCategoryName,
    });
  }

  function getMediaEditThumbnailSrc(mediaItem: MediaItem | null, draft: MediaEditDraft | null = null): string {
    if (draft?.thumbnailMode === 'upload' && draft.thumbnailDataUrl !== '') {
      return draft.thumbnailDataUrl;
    }
    const ambientData = getAmbientData();
    if (draft?.thumbnailMode === 'remove') {
      return getNoMediaImagePath('thumb');
    }
    const thumbnailName = draft?.thumbnailName || mediaItem?.image || mediaItem?.thumb || '';
    if (thumbnailName !== '' && ambientData?.imageDir) {
      return ambientData.imageDir + thumbnailName;
    }
    return getNoMediaImagePath('thumb');
  }

  function hideMediaEditModal(restoreFocus = false): void {
    if (!isElement($MODAL_MEDIA_EDIT)) {
      return;
    }
    const editedMediaId = mediaEditActiveItem?.amId ?? null;
    resetMediaEditPreviewState();
    clearMediaEditValidationView();
    resetMediaEditModalView({
      modalElement: $MODAL_MEDIA_EDIT,
      titleElement: isElement($MODAL_MEDIA_EDIT_TITLE) ? $MODAL_MEDIA_EDIT_TITLE : null,
      itemTitleElement: isElement($MODAL_MEDIA_EDIT_ITEM_TITLE) ? $MODAL_MEDIA_EDIT_ITEM_TITLE : null,
      itemSourceElement: isElement($MODAL_MEDIA_EDIT_ITEM_SOURCE) ? $MODAL_MEDIA_EDIT_ITEM_SOURCE : null,
      defaultTitle: defaultMediaEditModalTitle,
    });
    closeMediaEditCategoryDropdown(false);
    const restoreTarget = activeMediaEditTrigger;
    activeMediaEditTrigger = null;
    restoreMediaEditModalFocus({
      restoreFocus,
      preferredFocusId: isMediaPlaybackActive() ? AMP_STATUS.current : editedMediaId,
      restoreTarget,
      focusPlaylistItemById,
    });
  }

  function closeMediaEditModal(restoreFocus = false): void {
    hideMediaEditModal(restoreFocus);
  }

  function cancelMediaEditModal(restoreFocus = false): void {
    discardActiveMediaEditDraft();
    hideMediaEditModal(restoreFocus);
  }

  function isMediaPlaybackActive(): boolean {
    if (AMP_STATUS.current === null) {
      return false;
    }
    if (AMP_STATUS.playertype === 'youtube' && player && typeof player.getPlayerState === 'function') {
      try {
        return player.getPlayerState() === 1;
      } catch (_error) {
        return $BUTTON_PLAY.classList.contains('hidden') && !$BUTTON_PAUSE.classList.contains('hidden');
      }
    }
    if (/^(audio|video)$/i.test(String(AMP_STATUS.playertype || ''))) {
      const mediaElm = document.querySelector(String(AMP_STATUS.playertype)) as HTMLMediaElement | null;
      if (mediaElm) {
        return !mediaElm.paused && !mediaElm.ended;
      }
    }
    return $BUTTON_PLAY.classList.contains('hidden') && !$BUTTON_PAUSE.classList.contains('hidden');
  }

  function focusPlaylistItemById(amId: number | null): boolean {
    return focusPlaylistItemByIdView({
      listElement: $LIST_PLAYLIST,
      amId,
    });
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
        || getLocalizedMessage('mediaEditUntitled', 'Untitled media'),
      renderSourceBadges: renderMediaEditSourceBadges,
      bindForm: bindMediaEditForm,
      updatePlaylist,
      createPreview: createMediaEditPreview,
      startDurationSyncWait: mediaEditDurationSync.startIfNeeded,
      modalElement: $MODAL_MEDIA_EDIT,
      titleElement: $MODAL_MEDIA_EDIT_TITLE,
      itemTitleElement: isElement($MODAL_MEDIA_EDIT_ITEM_TITLE) ? $MODAL_MEDIA_EDIT_ITEM_TITLE : null,
      closeButton: isElement($BUTTON_CLOSE_MEDIA_EDIT) ? $BUTTON_CLOSE_MEDIA_EDIT : null,
      defaultTitle: defaultMediaEditModalTitle,
    });
  }

  function isDarkModeEnabled(): boolean {
    return isObject(AMP_STATUS.options) && AMP_STATUS.options?.dark ? !!AMP_STATUS.options.dark : false;
  }

  function getNoMediaImagePath(kind: 'placeholder' | 'thumb' = 'placeholder'): string {
    return resolveNoMediaImagePath(isDarkModeEnabled(), kind);
  }

  function getViewportWidth(): number {
    return Math.round(window.visualViewport?.width || window.innerWidth);
  }

  function getViewportHeight(): number {
    return Math.round(window.visualViewport?.height || window.innerHeight);
  }

  function getBottomMenuHeight(): number {
    return getBottomMenuHeightView($MENU, getViewportHeight);
  }

  function getFullWindowPlayerSize(): { width: number; height: number } {
    return getFullWindowPlayerSizeView({
      viewportWidth: currentWindowSize.width,
      viewportHeight: currentWindowSize.height,
      bottomMenuHeight: getBottomMenuHeight(),
    });
  }

  function getPlayerSizeForCurrentMode(): { width: number; height: number } {
    return getPlayerSizeForCurrentModeView({
      fullWindow: isFullWindowMode(),
      viewportWidth: currentWindowSize.width,
      viewportHeight: currentWindowSize.height,
      bottomMenuHeight: getBottomMenuHeight(),
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

  function syncPlaylistModeButton(mode: PlaylistMode): void {
    syncPlaylistModeButtonView(
      playlistModeUi,
      mode,
      defaultPlaylistModeButtonIcon,
      defaultPlaylistModeButtonLabel
    );
  }

  let playlistModeRuntime: ReturnType<typeof createPlaylistModeRuntimeController> | null = null;

  function isPlaylistInteractionLocked(): boolean {
    return playlistModeRuntime?.isInteractionLocked() ?? playlistMode !== 'normal';
  }

  function getPlaylistItemsForCurrentView(): MediaItem[] {
    return getPlaylistItemsForView(AMP_STATUS.media, AMP_STATUS.ctg);
  }

  function isSortableAvailable(): boolean {
    return typeof Sortable !== 'undefined' && typeof Sortable.create === 'function';
  }

  function canUseReorderMode(): boolean {
    return canUsePlaylistReorderMode({
      canMutatePlaylist: canMutateCurrentPlaylist(),
      sortableAvailable: isSortableAvailable(),
      categoryId: AMP_STATUS.ctg,
      visibleItems: getPlaylistItemsForCurrentView(),
    });
  }

  const closePlaylistModeMenu = (): void => {
    playlistModeRuntime?.closeMenu();
  };

  const updatePlaylistModeUI = (): void => {
    playlistModeRuntime?.updateUi();
  };

  const syncPlaylistModeAvailability = (visibleItemCount: number): void => {
    playlistModeRuntime?.onViewItemCountChanged(visibleItemCount);
  };

  const setPlaylistMode = (nextMode: PlaylistMode): void => {
    playlistModeRuntime?.setMode(nextMode);
  };

  const handlePlaylistModeButtonClick = (): void => {
    playlistModeRuntime?.handleModeButtonClick();
  };

  if ($BUTTON_PLAYLIST_MODE && $PLAYLIST_MODE_MENU) {
    bindPlaylistModeControls({
      button: $BUTTON_PLAYLIST_MODE,
      menu: $PLAYLIST_MODE_MENU,
      onModeButtonClick: handlePlaylistModeButtonClick,
      onModeSelect: setPlaylistMode,
      closeMenu: closePlaylistModeMenu,
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
  const playlistConfirmModal = createPlaylistConfirmModalController({
    modal: $MODAL_PLAYLIST_CONFIRM,
    title: $MODAL_PLAYLIST_CONFIRM_TITLE,
    body: $MODAL_PLAYLIST_CONFIRM_BODY,
  });
  const playlistReorderRuntime = createPlaylistReorderRuntimeController({
    listElement: $LIST_PLAYLIST,
    getCategoryId: () => AMP_STATUS.ctg,
    getVisibleItems: getPlaylistItemsForCurrentView,
    getMediaItems: () => AMP_STATUS.media,
    setMediaItems: (mediaItems) => {
      AMP_STATUS.media = mediaItems;
    },
    canMutatePlaylist: canMutateCurrentPlaylist,
    canUseReorderMode,
    sortableLibrary: Sortable,
    onPersist: persistMyPlaylistIfNeeded,
  });
  playlistModeRuntime = createPlaylistModeRuntimeController({
    playlistModeUi,
    getMode: () => playlistMode,
    setModeState: (mode) => {
      playlistMode = mode;
    },
    syncModeButton: syncPlaylistModeButton,
    getStatus: () => ({
      ctg: AMP_STATUS.ctg,
      media: AMP_STATUS.media,
      playlist: AMP_STATUS.playlist,
    }),
    canMutatePlaylist: canMutateCurrentPlaylist,
    sortableAvailable: isSortableAvailable,
    isCloud: () => getAmbientData()?.isCloud === true,
    myPlaylistName: MYPLAYLIST_NAME,
    hasStoredMyPlaylist: () => localStorage.getItem(MYPLAYLIST_KEY) !== null,
    getDeleteSelectionCount: () => deleteSelectedIds.size,
    clearDeleteSelections: () => {
      deleteSelectedIds.clear();
    },
    resetReorderState,
    captureReorderSnapshot,
    syncReorderWorkingIdsFromDom,
    restoreReorderInitialOrder: () => {
      playlistReorderRuntime.restoreInitialOrder();
    },
    isReorderDirty,
    canDiscardEditLeave: confirmDiscardActiveMediaEditIfNeeded,
    discardEditState: () => {
      discardActiveMediaEditDraft();
      hideMediaEditModal(false);
      clearMediaEditContext();
    },
    updatePlaylist,
    openDeleteConfirm: () => {
      const title = $BUTTON_PLAYLIST_MODE?.dataset['confirmDeleteTitle'] || 'Delete selected items?';
      const body = $BUTTON_PLAYLIST_MODE?.dataset['confirmDeleteBody'] || 'Selected items will be removed from your playlist.';
      playlistConfirmModal.open(title, body, () => {
        void commitDeleteSelections();
      }, () => {
        if (playlistMode === 'reorder') {
          playlistReorderRuntime.restoreInitialOrder();
          updatePlaylist();
        }
      });
    },
    openReorderConfirm: () => {
      const title = $BUTTON_PLAYLIST_MODE?.dataset['confirmReorderTitle'] || 'Apply reordered sequence?';
      const body = $BUTTON_PLAYLIST_MODE?.dataset['confirmReorderBody'] || 'Apply the current item order to your playlist.';
      playlistConfirmModal.open(title, body, () => {
        applyReorderChanges();
        playlistMode = 'normal';
        updatePlaylistModeUI();
        updatePlaylist();
      }, () => {
        if (playlistMode === 'reorder') {
          playlistReorderRuntime.restoreInitialOrder();
          updatePlaylist();
        }
      });
    },
  });
  async function persistCurrentPlaylistMutation(): Promise<{ ok: boolean; message: string }> {
    return persistMediaEditForCurrentPlaylist(AMP_STATUS.media || []);
  }

  async function commitDeleteSelections(): Promise<void> {
    if (!canMutateCurrentPlaylist()) {
      deleteSelectedIds.clear();
      updateNotice({
        type: 'error',
        message: getLocalizedMessage('mediaEditSaveFailed', 'Failed to save media changes.'),
        delay: 2600,
      });
      return;
    }

    if (!AMP_STATUS.media || deleteSelectedIds.size === 0) {
      return;
    }

    const previousMedia = AMP_STATUS.media;
    AMP_STATUS.media = previousMedia.filter(
      (item: MediaItem) => !deleteSelectedIds.has(item.amId)
    );
    deleteSelectedIds.clear();
    playlistMode = 'normal';
    updatePlaylistModeUI();
    updatePlaylist();

    const persistResult = await persistCurrentPlaylistMutation();
    if (!persistResult.ok) {
      AMP_STATUS.media = previousMedia;
      updatePlaylist();
      updateNotice({
        type: 'error',
        message: persistResult.message || getLocalizedMessage('mediaEditSaveFailed', 'Failed to save media changes.'),
        delay: 2600,
      });
      return;
    }

    updateNotice({
      type: 'success',
      message: persistResult.message || getLocalizedMessage('Playlist saved successfully.', 'Playlist saved successfully.'),
      delay: 2200,
    });
  }

  function syncDeleteSelectionIndicator(itemElm: HTMLElement, isSelected: boolean): void {
    syncDeleteSelectionIndicatorView(itemElm, isSelected);
  }

  function destroyPlaylistSortable(): void {
    playlistReorderRuntime.reset();
  }

  function resetReorderState(): void {
    playlistReorderRuntime.reset();
  }

  function isReorderDirty(): boolean {
    return playlistReorderRuntime.isDirty();
  }

  function captureReorderSnapshot(): void {
    playlistReorderRuntime.captureSnapshot();
  }

  function syncReorderWorkingIdsFromDom(): void {
    playlistReorderRuntime.syncWorkingIdsFromDom();
  }

  function applyReorderChanges(): void {
    playlistReorderRuntime.applyChanges();
  }

  function ensurePlaylistSortable(): void {
    if (playlistMode !== 'reorder') {
      playlistReorderRuntime.reset();
      return;
    }
    playlistReorderRuntime.ensureSortable();
  }

  bindPlaylistConfirmModalControls({
    modal: $MODAL_PLAYLIST_CONFIRM,
    applyButton: $BTN_PLAYLIST_CONFIRM_APPLY,
    cancelButton: $BTN_PLAYLIST_CONFIRM_CANCEL,
    onApply: () => {
      playlistConfirmModal.apply();
    },
    onCancel: () => {
      playlistConfirmModal.cancel();
    },
  });

  // Process global data passed by the system.
  // In cloud mode: load MyPlaylist from localStorage before processing server data.
  // (Placed here, AFTER DOM constants, to avoid const temporal dead zone issues.)
  const savedPlaylistContext = getSavedPlaylistContext();
  ensureCloudMyPlaylistSeed();
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
      selectPlaylistOption(initialPlaylistStartup.playlist);
      void getPlaylistData(initialPlaylistStartup.playlist);
      break;
    case 'autoload_myplaylist':
      initMyPlaylistFromStorage();
      releaseAppBootGate();
      break;
    case 'autoload_current_playlist':
      void getPlaylistData(initialPlaylistStartup.playlist);
      break;
    case 'ready':
      setPlaylistReadyState(true);
      releaseAppBootGate();
      break;
  }

  if (isElement($ALERT)) {
    noticeController.hideLegacyAlert();
  }

  /**
   * Return focus to the options trigger when the modal is being hidden.
   */
  function restoreOptionsTriggerFocus(): void {
    if (isElement($BUTTON_OPTIONS)) {
      $BUTTON_OPTIONS.focus();
    }
  }

  function isOptionsModalVisible(): boolean {
    return optionsModal.isVisible();
  }

  /**
   * Sync active styles of bottom menu drawer toggle buttons.
   */
  function syncDrawerToggleButtons(): void {
    syncDrawerToggleButtonStateView({
      button: $BUTTON_PLAYLIST,
      active: isResponsiveDrawerOpen($DRAWER_PLAYLIST, '-translate-x-full'),
    });
    syncDrawerToggleButtonStateView({
      button: $BUTTON_SETTINGS,
      active: isResponsiveDrawerOpen($DRAWER_SETTINGS, 'translate-x-full'),
    });
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
    bindAddMediaTrigger({
      trigger: addBtn,
      onActivate: (evt: Event) => {
        evt.preventDefault();
        evt.stopPropagation();
        const activeCatId = (AMP_STATUS.ctg !== undefined && AMP_STATUS.ctg !== null && Number(AMP_STATUS.ctg) >= 0)
          ? Number(AMP_STATUS.ctg)
          : null;
        openMediaManagement(activeCatId);
      },
    });
  }

  function cleanupOptionsModalBackdrops(): void {
    optionsModal.cleanupBackdrops();
  }

  function closePlaylistDrawerForModalIfNeeded(): void {
    if (currentWindowSize.width >= currentWindowSize.minFullUIWidth) {
      return;
    }
    if (!isResponsiveDrawerOpen($DRAWER_PLAYLIST, '-translate-x-full')) {
      return;
    }
    (document.getElementById('btn-close-playlist') as HTMLButtonElement | null)?.click();
  }

  function closeSettingsDrawerForModalIfNeeded(): void {
    if (currentWindowSize.width >= currentWindowSize.minFullUIWidth) {
      return;
    }
    if (!isResponsiveDrawerOpen($DRAWER_SETTINGS, 'translate-x-full')) {
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
    syncMediaCategoryFieldView({
      select: isElement($MEDIA_CATEGORY_SELECT) ? $MEDIA_CATEGORY_SELECT : null,
      categoryInput: document.getElementById('media-category-new') as HTMLInputElement | null,
      categories: AMP_STATUS.category,
      preferredCategoryId,
    });
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
    syncRangeProgressView(range, DEFAULT_VOLUME);
  }

  function syncMediaVolumeField(volume: number = getDefaultVolume()): void {
    const normalizedVolume = normalizeVolume(volume, getDefaultVolume());
    syncMediaVolumeFieldView({
      input: $MEDIA_VOLUME,
      display: document.getElementById('default-media-volume'),
      volume: normalizedVolume,
      fallbackVolume: getDefaultVolume(),
    });
  }

  function openPlaylistManagementCategoryCreate(): void {
    openPlaylistManagementCategoryCreateView();
  }

  function ensureAccordionPanel(panelId: string): void {
    ensureAccordionPanelView(panelId);
  }

  function showOptionsModal(): void {
    optionsModal.show();
  }

  function hideOptionsModal(): void {
    optionsModal.hide();
  }

  bindOptionsModalControls({
    triggerButton: $BUTTON_OPTIONS,
    closeButton: $BUTTON_CLOSE_OPTIONS,
    modal: $MODAL_OPTIONS,
    onTrigger: () => {
      if (isOptionsModalVisible()) {
        hideOptionsModal();
      } else {
        clearCategory();
        updateCategory();
        syncMediaCategoryField();
        showOptionsModal();
      }
    },
    onClose: () => {
      hideOptionsModal();
    },
    onCloseCapture: () => {
      restoreOptionsTriggerFocus();
    },
    onBackdropPointerDown: (evt: PointerEvent) => {
      optionsModal.handleBackdropPointerDown(evt);
    },
    onBackdropClick: (evt: Event) => {
      optionsModal.handleBackdropClick(evt, restoreOptionsTriggerFocus);
    },
  });

  bindModalKeyboardControls({
    onEscapeMediaEditCategory: () => {
      closeMediaEditCategoryDropdown(true);
    },
    onEscapeMediaEdit: () => {
      closeMediaEditModal(true);
    },
    onTabMediaEdit: (evt: KeyboardEvent) => {
      trapMediaEditModalFocus(evt);
    },
    onEscapeOptions: () => {
      hideOptionsModal();
      restoreOptionsTriggerFocus();
    },
    onEscapePlaylistDesc: () => {
      playlistDescModal.close(true);
    },
    isMediaEditModalVisible,
    isMediaEditCategoryDropdownVisible,
    isOptionsModalVisible,
    isPlaylistDescOpen: () => {
      return playlistDescModal.isOpen();
    },
  });

  bindPlaylistDescModalControls({
    closeButton: $BUTTON_CLOSE_PLAYLIST_DESC,
    backdrop: $MODAL_PLAYLIST_DESC_BACKDROP,
    managementLink: document.getElementById('link-open-playlist-management-category') as HTMLAnchorElement | null,
    onClose: () => {
      playlistDescModal.close(true);
    },
    onBackdrop: () => {
      playlistDescModal.close(false);
    },
    onOpenPlaylistManagementCategory: () => {
      openPlaylistManagementCategoryCreate();
    },
  });

  bindMediaEditPrimaryControls({
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
  });

  bindMediaEditCategoryControls({
    toggleButton: $BUTTON_MEDIA_EDIT_CATEGORY_TOGGLE,
    clearButton: $BUTTON_MEDIA_EDIT_CATEGORY_CLEAR,
    categoryInput: $MEDIA_EDIT_CATEGORY,
    categoryCombobox: $MEDIA_EDIT_CATEGORY_COMBOBOX,
    isDropdownVisible: isMediaEditCategoryDropdownVisible,
    openDropdown: openMediaEditCategoryDropdown,
    closeDropdown: closeMediaEditCategoryDropdown,
    syncClearButton: syncMediaEditCategoryClearButton,
    renderOptions: renderMediaEditCategoryOptions,
  });

  bindMediaEditFieldControls({
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
        syncRangeProgress,
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
        syncRangeProgress,
        display: $MEDIA_EDIT_VOLUME_VALUE,
      });
      syncMediaEditDraftStateFromForm();
      validateAndRenderMediaEditDraftFromForm();
    },
    onTimingInput: (field: HTMLInputElement) => {
      sanitizeMediaEditTimingInputField(field);
      syncMediaEditTimingDisplay();
      syncMediaEditDraftStateFromForm();
      validateAndRenderMediaEditDraftFromForm();
    },
    onTimingChange: (field: HTMLInputElement) => {
      sanitizeMediaEditTimingInputField(field);
      syncMediaEditTimingDisplay();
      syncMediaEditDraftStateFromForm();
      validateAndRenderMediaEditDraftFromForm();
    },
    onTimingBlur: (field: HTMLInputElement) => {
      field.value = toMediaEditTimingInputValue(parseMediaTimeToIntegerSeconds(field.value));
      syncMediaEditTimingDisplay();
      syncMediaEditDraftStateFromForm();
      validateAndRenderMediaEditDraftFromForm();
    },
    onTimingStep: (field: HTMLInputElement, direction: 1 | -1) => {
      stepMediaEditTimingField(field, direction);
    },
  });

  bindMediaEditPreviewControls({
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
      if (!mediaEditPreviewSourceItem) {
        return;
      }
      createMediaEditPreview(mediaEditPreviewSourceItem);
    },
  });

  bindMediaEditThumbnailControls({
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
          message: getLocalizedMessage('mediaEditThumbnailTypeError', 'Only PNG, JPEG, GIF, and WebP images are accepted.'),
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
      const confirmed = window.confirm(getLocalizedMessage('mediaEditThumbnailRemoveConfirm', 'Remove the current thumbnail image?'));
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
  });

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

    expandMediaManagementWhenOptionsModalVisible({
      modal: document.getElementById('modal-options'),
      presetCategoryId,
      ensureAccordionPanel,
      syncMediaCategoryField,
      syncMediaVolumeField,
    });
  }

  /**
   * Create a playlist from the data of the AMP_STATUS object.
   */
  function updatePlaylist(): void {
    destroyPlaylistSortable();
    playlistDescModal.close(false);
    clearPlaylist();
    const $LIST_NO_MEDIA = document.getElementById('no-media') as HTMLElement;
    const items = filterPlaylistItemsByCategory(AMP_STATUS.media || [], AMP_STATUS.ctg);
    const isNoMedia = items.length === 0;
    syncPlaylistModeAvailability(items.length);

    const $BUTTON_DOWNLOAD_PLAYLIST = document.getElementById('btn-download-playlist') as HTMLButtonElement;
    enablePlaylistDownloadButton($BUTTON_DOWNLOAD_PLAYLIST);

    const ambientData = (window as any).AmbientData as AmbientData;
    if (finalizePlaylistRender({
      noMediaElement: $LIST_NO_MEDIA,
      isEmpty: isNoMedia,
      closePlaylistModeMenu,
      setPlaylistReadyState,
    })) {
      return;
    }

    const playlistModeAdjustment = resolvePlaylistModeForRendering({
      mode: playlistMode,
      canUseReorderMode: canUseReorderMode(),
    });
    if (playlistModeAdjustment.changed) {
      resetReorderState();
      playlistMode = playlistModeAdjustment.nextMode;
    }
    updatePlaylistModeUI();

    const isShuffle = getOption('shuffle') || false;
    if (isShuffle) {
      AMP_STATUS.shuffle = createShuffledPlaylist(items);
      logger('updatePlaylist::createShufflePlaylist:', AMP_STATUS.shuffle);
    }

    renderPlaylistItems({
      listElement: $LIST_PLAYLIST,
      items,
      currentId: AMP_STATUS.current,
      mode: playlistMode,
      deleteSelectedIds,
      editSelectedId: mediaEditActiveItem?.amId ?? null,
      format: getOption('playlist'),
      imageDir: ambientData?.imageDir || null,
      fallbackThumbPath: getNoMediaImagePath('thumb'),
      resolveYoutubeThumbnailUrl: getYoutubeThumbnailURL,
      trimTitle: (value: string) => mb_strimwidth(value, 0, 50, '...'),
      formatLabel: filterText,
    });

    ensurePlaylistSortable();

    // Append "[+] Add media" item at the bottom of the playlist
    // Hidden in cloud mode for existing JSON playlists (read-only)
    // and hidden when playlist operation mode is not normal.
    const registerBtn = document.getElementById('btn-add-media-from-drawer');
    const registerText = (registerBtn?.dataset['label'] || registerBtn?.innerText || 'Register media').trim();
    appendPlaylistQuickAddItem({
      listElement: $LIST_PLAYLIST,
      canMutatePlaylist: canMutateCurrentPlaylist(),
      playlistMode,
      registerText,
      onClick: (evt: Event) => {
        evt.preventDefault();
        const activeCatId = (AMP_STATUS.ctg !== undefined && AMP_STATUS.ctg !== null && Number(AMP_STATUS.ctg) >= 0)
          ? Number(AMP_STATUS.ctg)
          : null;
        openMediaManagement(activeCatId);
      },
    });

    if (ambientData.hasOwnProperty('debug') && ambientData.debug) {
      execDebug();
    }
    setPlaylistReadyState(true);
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
    clearCategoryView({
      targetSelect: $SELECT_CATEGORY,
      mediaSelect: $MEDIA_CATEGORY_SELECT,
      mediaInput: document.getElementById('media-category-new') as HTMLInputElement | null,
      mediaLabel: document.getElementById('media-category-label') as HTMLLabelElement | null,
      mediaNote: document.getElementById('note-media-category-create-from-playlist-management') as HTMLElement | null,
    }, applyCloudEditRestrictions);
  }

  /**
   * Update the items in the category selection field of the settings menu.
   */
  function updateCategory(): void {
    updateCategoryView({
      elements: {
        targetSelect: $SELECT_CATEGORY,
        mediaSelect: $MEDIA_CATEGORY_SELECT,
        mediaInput: document.getElementById('media-category-new') as HTMLInputElement | null,
        mediaLabel: document.getElementById('media-category-label') as HTMLLabelElement | null,
        mediaNote: document.getElementById('note-media-category-create-from-playlist-management') as HTMLElement | null,
      },
      categories: AMP_STATUS.category,
      syncTargetCategorySelection,
      syncMediaCategoryField,
      applyCloudEditRestrictions,
    });
  }

  function getOption<K extends Extract<keyof PlaylistOptions, string>>(
    key: K
  ): Exclude<PlaylistOptions[K], undefined> | null {
    return readPlaylistOption<PlaylistOptions, K>(AMP_STATUS, key, MYPLAYLIST_NAME);
  }

  /**
   * Causes the application to apply specific option contents of the AMP_STATUS object.
   */
  function applyOptions(): void {
    const optionState = resolvePlaylistOptionState({
      getOption,
      defaultVolume: getDefaultVolume(),
    });

    const ambientData = (window as any).AmbientData as AmbientData;
    applyResolvedPlaylistOptions({
      optionState,
      body: $BODY,
      menu: $MENU,
      imageDir: ambientData?.imageDir,
      syncRandomOrder: (enabled) => {
        AMP_STATUS.order = enabled ? 'random' : 'normal';
      },
      syncShuffle: () => {
        AMP_STATUS.shuffle = [];
        syncToggleRoot($TOGGLE_SHUFFLE, !!(AMP_STATUS.options && AMP_STATUS.options.shuffle));
        AMP_STATUS.shuffle = shufflePlaylist();
      },
      syncSeek: (enabled) => {
        syncToggleRoot($TOGGLE_SEEKPLAY, enabled);
      },
      syncFader: (enabled) => {
        syncToggleRoot($TOGGLE_FADER, enabled);
      },
      applyVolume: (volume) => {
        AMP_STATUS.volume = volume;
        syncVolumeSlider({
          input: $RANGE_VOLUME,
          volume: normalizeVolume(AMP_STATUS.volume, getDefaultVolume()),
          syncRangeProgress,
          display: document.getElementById('default-volume-value') as HTMLElement | null,
        });
        syncMediaVolumeField();
      },
      applyDarkModeFlag: (enabled) => {
        if (AMP_STATUS.options) {
          AMP_STATUS.options.dark = enabled;
        }
      },
      darkModeEnabled: () => isObject(AMP_STATUS.options) && AMP_STATUS.options?.dark ? !!AMP_STATUS.options.dark : false,
      toggleInput: toggleDarkmodeInput,
      updateNoMediaImagesForTheme: () => updateNoMediaImagesForTheme(isDarkModeEnabled()),
      setStyles,
      applyFullWindowMode: (enabled) => {
        setFullWindowMode(enabled, false);
      },
    });
  }

  /**
   * Clear and initialize the carousel display.
   */
  function updateCarousel(): void {
    updateCarouselDisplay({
      prevId: AMP_STATUS.hasOwnProperty('prev') ? AMP_STATUS.prev : null,
      currentId: AMP_STATUS.hasOwnProperty('current') ? AMP_STATUS.current : null,
      nextId: AMP_STATUS.hasOwnProperty('next') ? AMP_STATUS.next : null,
      wrapper: $CAROUSEL_WRAPPER,
      prevButton: $CAROUSEL_PREV,
      nextButton: $CAROUSEL_NEXT,
      mediaItems: AMP_STATUS.media || [],
      placeholderImage: getNoMediaImagePath('placeholder'),
      resolveYouTubeThumbnail: getYoutubeThumbnailURL,
      resolveImagePath: (image) => {
        const ambientData = (window as any).AmbientData as AmbientData;
        return (ambientData.imageDir ?? '') + image;
      },
    });
  }

  /**
   * Update the media caption display.
   */
  function updateMediaCaption(mediaData: MediaItem): void {
    updateMediaCaptionDisplay({
      mediaData,
      bodyElement: $BODY,
      captionElement: $MEDIA_CAPTION,
      fallbackWidth: currentWindowSize.width,
      sanitizeTitle: (value: string) => sanitizeMediaText(value, MEDIA_TITLE_MAX_LENGTH),
      sanitizeArtist: (value: string) => sanitizeMediaText(value, MEDIA_ARTIST_MAX_LENGTH),
    });
  }

  /**
   * Toggle caption marqueeing depending on window size.
   */
  function toggleMarqueeCaption(): void {
    toggleCaptionMarqueeDisplay($BODY, $MEDIA_CAPTION, currentWindowSize.width);
  }

  /**
   * Returns true when player is shown as full-window.
   */
  function isFullWindowMode(): boolean {
    return isFullWindowModeView($BODY);
  }

  /**
   * Toggle full-window mode and synchronize controls from drawer and bottom menu.
   * @param closeDrawers When true, auto-close any open drawers (only for bottom-menu trigger).
   */
  function setFullWindowMode(enabled: boolean, syncOption = true, closeDrawers = false): void {
    viewportRuntime.setFullWindowMode(enabled, syncOption, closeDrawers);
  }

  /**
   * Toggle bottom menu minimized state.
   */
  function setMenuMinimized(minimized: boolean): void {
    viewportRuntime.setMenuMinimized(minimized);
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

  bindSelectorControls({
    playlistSelect: $SELECT_PLAYLIST,
    categorySelect: $SELECT_CATEGORY,
    languageSelect: $SELECT_LANGUAGE,
    onPlaylistChange: (evt: Event) => {
      handlePlaylistSelectionChange(evt, {
        getCurrentPlaylist: () => AMP_STATUS.hasOwnProperty('playlist') ? AMP_STATUS.playlist : null,
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
      });
    },
    onCategoryChange: (evt: Event) => {
      handleCategorySelectionChange(evt, {
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
        applyCategoryChange: (newCtgId) => {
          AMP_STATUS.ctg = newCtgId;
          AMP_STATUS.prev = null;
          AMP_STATUS.current = null;
          AMP_STATUS.next = null;
        },
        updatePlaylist,
      });
    },
    onLanguageChange: (evt: Event) => {
      const currentLanguage = getCookie('lang');
      const newLanguage = (evt.target as HTMLSelectElement).value;
      logger('changeLanguage::', currentLanguage, newLanguage);
      if (currentLanguage !== newLanguage) {
        updateCookie('lang', newLanguage);
        reloadPage();
      }
    },
  });

  bindPlaylistInteractionControls({
    listElement: $LIST_PLAYLIST,
    getDescriptionPayload: getPlaylistDescriptionPayload,
    onDescriptionActivate: (target: HTMLElement, event: Event) => {
      const descPayload = getPlaylistDescriptionPayload(target);
      if (!descPayload) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      playlistDescModal.open(
        descPayload.titleText,
        descPayload.artistText,
        descPayload.descText,
        descPayload.trigger
      );
    },
    onItemActivate: (itemElm: HTMLElement, event: Event) => {
      handlePlaylistItemActivation(itemElm, event, {
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
      });
    },
  });

  /**
   * Event listener when the button of "previous" for carousel has been clicked.
   */
  bindPlayerControls({
    carouselPrevButton: $CAROUSEL_PREV,
    carouselNextButton: $CAROUSEL_NEXT,
    refreshButton: $BUTTON_REFRESH,
    windowFullButton: $BUTTON_WINDOW_FULL,
    windowFullToggle: toggleWindowFullInput,
    menuCollapseButton: $BUTTON_MENU_COLLAPSE,
    playButton: $BUTTON_PLAY,
    pauseButton: $BUTTON_PAUSE,
    onCarouselPrev: () => {
      if (AMP_STATUS.prev !== null) {
        playItem(null, AMP_STATUS.prev);
      }
    },
    onCarouselNext: () => {
      if (AMP_STATUS.next !== null) {
        playItem(null, AMP_STATUS.next);
      }
    },
    onRefresh: () => {
      reloadPage();
    },
    onToggleWindowFull: () => {
      setFullWindowMode(!isFullWindowMode(), true, true);
    },
    onWindowFullToggleChange: (checked: boolean) => {
      setFullWindowMode(checked);
    },
    onToggleMenuCollapse: () => {
      setMenuMinimized(!$MENU.classList.contains('menu-minimized'));
    },
    onPlay: () => {
      handlePlayerPlay({
        playertype: AMP_STATUS.playertype,
        player,
        logger,
        resolvePlayId: () => {
          const playableIds = resolvePlaybackCandidateIds({
            mediaItems: AMP_STATUS.media || [],
            categoryId: AMP_STATUS.ctg,
            shuffleEnabled: Boolean(getOption('shuffle')),
            shuffleItems: AMP_STATUS.shuffle || [],
          });
          return resolveRequestedPlayId({
            currentId: AMP_STATUS.current,
            candidateIds: playableIds,
            order: AMP_STATUS.order,
          });
        },
        playItem: (playId) => {
          playItem(null, playId);
        },
        showPlayingState: () => {
          syncPlaybackButtonState($BUTTON_PLAY, $BUTTON_PAUSE, 'playing');
        },
      });
    },
    onPause: () => {
      handlePlayerPause({
        playertype: AMP_STATUS.playertype,
        player,
        showDisabledState: () => {
          syncPlaybackButtonState($BUTTON_PLAY, $BUTTON_PAUSE, 'disabled');
        },
        showPausedState: () => {
          syncPlaybackButtonState($BUTTON_PLAY, $BUTTON_PAUSE, 'paused');
        },
      });
    },
  });

  /**
   * Toggle style to focus the active item in a playlist.
   */
  function changePlaylistFocus(): void {
    syncPlaylistCurrentFocus($LIST_PLAYLIST, AMP_STATUS.current);
    scrollToFocusItem();
  }

  /**
   * Auto-scroll to active item in playlist.
   */
  function scrollToFocusItem(): void {
    scrollPlaylistToCurrentFocus($LIST_PLAYLIST);
  }

  const toggleLoopInput = getToggleInput($TOGGLE_LOOP);
  const toggleRandomlyInput = getToggleInput($TOGGLE_RANDOMLY);
  const toggleShuffleInput = getToggleInput($TOGGLE_SHUFFLE);
  const toggleSeekplayInput = getToggleInput($TOGGLE_SEEKPLAY);
  const toggleFaderInput = getToggleInput($TOGGLE_FADER);
  const toggleDarkmodeInput = getToggleInput($TOGGLE_DARKMODE);

  /**
   * Event listener when changing the loop play of settings menu toggle button.
   */
  bindSettingsControls({
    loopToggle: toggleLoopInput,
    randomlyToggle: toggleRandomlyInput,
    shuffleToggle: toggleShuffleInput,
    seekplayToggle: toggleSeekplayInput,
    faderToggle: toggleFaderInput,
    darkmodeToggle: toggleDarkmodeInput,
    volumeRange: $RANGE_VOLUME,
    onLoopChange: (evt: Event) => {
      AMP_STATUS.loop = (evt.target as HTMLInputElement).checked;
    },
    onRandomlyChange: (evt: Event) => {
      AMP_STATUS.order = (evt.target as HTMLInputElement).checked ? 'random' : 'normal';
    },
    onShuffleChange: (evt: Event) => {
      setPlaylistOption(AMP_STATUS, 'shuffle', (evt.target as HTMLInputElement).checked);
      AMP_STATUS.shuffle = shufflePlaylist();
      persistMyPlaylistIfNeeded();
    },
    onSeekplayChange: (evt: Event) => {
      setPlaylistOption(AMP_STATUS, 'seek', (evt.target as HTMLInputElement).checked);
      persistMyPlaylistIfNeeded();
    },
    onFaderChange: (evt: Event) => {
      setPlaylistOption(AMP_STATUS, 'fader', (evt.target as HTMLInputElement).checked);
      persistMyPlaylistIfNeeded();
    },
    onDarkmodeChange: (evt: Event) => {
      setPlaylistOption(AMP_STATUS, 'dark', (evt.target as HTMLInputElement).checked);
      setTimeout(() => {
        const isDarkmode = isObject(AMP_STATUS.options) && AMP_STATUS.options?.dark ? !!AMP_STATUS.options.dark : false;
        applyDarkModeAppearance({
          enabled: isDarkmode,
          toggleInput: toggleDarkmodeInput,
          updateNoMediaImagesForTheme: () => updateNoMediaImagesForTheme(isDarkModeEnabled()),
          setStyles,
        });
      }, 200);
      persistMyPlaylistIfNeeded();
    },
    onVolumeInput: (evt: Event) => {
      const currentVolume = normalizeVolume((evt.target as HTMLInputElement).value);
      syncVolumeSlider({
        input: evt.target as HTMLInputElement,
        volume: currentVolume,
        syncRangeProgress,
        display: document.getElementById('default-volume-value') as HTMLElement | null,
      });
    },
    onVolumeChange: (evt: Event) => {
      const currentVolume = normalizeVolume((evt.target as HTMLInputElement).value);
      syncVolumeSlider({
        input: evt.target as HTMLInputElement,
        volume: currentVolume,
        syncRangeProgress,
        display: document.getElementById('default-volume-value') as HTMLElement | null,
      });
      AMP_STATUS.volume = currentVolume;
      setPlaylistOption(AMP_STATUS, 'volume', currentVolume);
      persistMyPlaylistIfNeeded();
    },
  });

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
   * Updates the user's media playback state.
   */
  function updatePlayStatus(currentAmId: number): void {
    updatePlaybackStatus({
      mediaItems: AMP_STATUS.media || [],
      categoryId: AMP_STATUS.ctg,
      shuffleEnabled: Boolean(getOption('shuffle')),
      shuffleItems: AMP_STATUS.shuffle || [],
      currentId: currentAmId,
      order: AMP_STATUS.order,
      applyPlaybackStatus: (playbackStatus) => {
        AMP_STATUS.current = playbackStatus.currentId;
        AMP_STATUS.prev = playbackStatus.prevId;
        AMP_STATUS.next = playbackStatus.nextId;
      },
    });
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
    reportPlaybackIssue({
      mediaItem,
      reason,
      details,
      logger,
      getLocalizedMessage,
      escapeHtml: escapeHTML,
      updateNotice: ({ type, message, delay }) => {
        updateNotice({ type, message, delay });
      },
    });
  }

  function playItem(object: HTMLElement | null = null, id: number | null = null): void {
    playMediaSelection({
      mediaItems: AMP_STATUS.media || [],
      triggerElement: isElement(object) ? (object as HTMLElement) : null,
      targetId: id,
      getExtension: getExt,
      logger,
      updatePlayStatus,
      closeResponsiveDrawers: () => {
        closeResponsiveDrawers({
          playlistCloseButton: document.getElementById('btn-close-playlist') as HTMLButtonElement | null,
          settingsCloseButton: document.getElementById('btn-close-settings') as HTMLButtonElement | null,
        }, currentWindowSize.width, currentWindowSize.minFullUIWidth);
      },
      reportMissingSource: (mediaData) => {
        reportMediaPlaybackIssue(mediaData, 'media_source_missing', {
          currentPlaylist: AMP_STATUS.playlist || '',
          currentCategory: AMP_STATUS.ctg,
        });
      },
      setupPlayer,
    });
  }

  /**
   * Handle the player to prepare depending on the type of media to play.
   */
  function setupPlayer(
    setupKind: PlayableSetupKind,
    src: string | null,
    mediaData: MediaItem,
    extension: string | null = null
  ): void {
    runPlayerSetup({
      setupKind,
      src,
      extension,
      mediaData,
      abortPlaybackTimers,
      updateMediaCaption,
      getExtension: getExt,
      onPlayerTypeResolved: (playerType) => {
        AMP_STATUS.playertype = playerType;
      },
      onYouTubeSignal: (phase, error) => {
        emitYouTubeSignal(phase, error || '');
      },
      onIssue: (reason, details) => {
        reportMediaPlaybackIssue(mediaData, reason, details);
      },
      onCreateYouTubePlayer: () => {
        AMP_STATUS.yt_error = '';
        createYTPlayer(mediaData);
      },
      onCreateHtmlPlayer: (kind) => {
        createPlayerTag(kind, mediaData);
      },
    });
  }

  async function activateImportedPlaylist(playlistName: string): Promise<void> {
    ensurePlaylistOption(playlistName);
    selectPlaylistOption(playlistName);
    requestCategoryResume(null);
    requestMediaResume(null);
    await getPlaylistData(playlistName, true);
  }

  /**
   * Create a YouTube player.
   */
  function createYTPlayer(mediaData: MediaItem): void {
    player = createYouTubePlayerInstance({
      mediaData,
      embedWrapper: $EMBED_WRAPPER,
      playerId: 'ytplayer',
      size: getPlayerSizeForCurrentMode(),
      getOption,
      status: AMP_STATUS as any,
      getDefaultVolume,
      getPlaybackVolume,
      normalizeVolume,
      inRange,
      emitYouTubeSignal,
      showPlayerWrapper: () => {
        showYouTubePlayerWrapper($EMBED_WRAPPER);
      },
      findMediaById,
      logger,
      onAutoplayTimeout: () => {
        (document.getElementById('btn-play') as HTMLButtonElement).dispatchEvent(new Event('click'));
      },
      setWatchOrigin: (watchUrl: string) => {
        setWatchOriginState($BUTTON_WATCH_TY, $OPTIONAL_CONTAINER, watchUrl);
      },
      showPausedState: () => {
        syncPlaybackButtonState($BUTTON_PLAY, $BUTTON_PAUSE, 'paused');
      },
      showPlayingState: () => {
        syncPlaybackButtonState($BUTTON_PLAY, $BUTTON_PAUSE, 'playing');
      },
      cleanupTransition: (eventTarget, playbackTarget) => {
        cleanupManagedYouTubeTransition(
          eventTarget as { destroy?: () => void; g?: { remove?: () => void } },
          playbackTarget
        );
      },
      transitionToTarget: (playbackTarget) => {
        runPlaybackTransition({
          playbackTarget,
          getExtension: getExt,
          updatePlayStatus,
          setupPlayer,
        });
      },
      abortPlaybackTimers,
      resetPlayerView: () => {
        resetYouTubePlayerView({
          embedWrapper: $EMBED_WRAPPER,
          watchButton: $BUTTON_WATCH_TY,
          optionalContainer: $OPTIONAL_CONTAINER,
        });
      },
      resolveSeekRange,
      fadeIn: (eventTarget, period, start) => fadeIn(eventTarget, period, start),
      fadeOut: (eventTarget, period, end) => fadeOut(eventTarget, period, end),
      playingState: (window as any).YT.PlayerState.PLAYING,
    });
  }

  /**
   * Create a media playback player using HTML.
   */
  function createPlayerTag(tagname: 'audio' | 'video', mediaData: MediaItem): void {
    createHtmlPlayerInstance({
      tagName: tagname,
      mediaData,
      embedWrapper: $EMBED_WRAPPER,
      watchButton: $BUTTON_WATCH_TY,
      optionalContainer: $OPTIONAL_CONTAINER,
      getPlaceholderPath: () => getNoMediaImagePath('placeholder'),
      isFullWindowMode,
      getFullWindowPlayerSize,
      getViewportWidth: () => currentWindowSize.width,
      getOption,
      status: AMP_STATUS as any,
      getDefaultVolume,
      getPlaybackVolume,
      normalizeVolume,
      inRange,
      reportMediaPlaybackIssue,
      isSeekActive: () => playbackTimers.isSeekActive(),
      startSeek: (callback, intervalMs) => playbackTimers.startSeek(callback, intervalMs),
      abortSeeking,
      abortFadeOut: () => abortFader('fadeout'),
      showPlayingState: () => {
        syncPlaybackButtonState($BUTTON_PLAY, $BUTTON_PAUSE, 'playing');
      },
      showPausedState: () => {
        syncPlaybackButtonState($BUTTON_PLAY, $BUTTON_PAUSE, 'paused');
      },
      logger,
      resolveSeekRange,
      fadeOut,
      fadeIn,
      onBeforeTransition: () => {
        abortPlaybackTimers();
        cleanupHtmlPlayerWrapper($EMBED_WRAPPER);
      },
      getExtension: getExt,
      updatePlayStatus,
      setupPlayer,
    });
  }

  /**
   * Fade in the volume of the specified media.
   */
  function fadeIn(media: any, period: number, start: number): void {
    runPlayerFadeIn({
      media,
      period,
      start,
      readTargetVolume: () => normalizeVolume(AMP_STATUS.volume, getDefaultVolume()),
      startFader: (callback, intervalMs) => playbackTimers.startFader('fadein', callback, intervalMs),
      abortFader: () => abortFader('fadein'),
      inRange,
      logger,
    });
  }

  /**
   * Fade out the volume of the specified media.
   */
  function fadeOut(media: any, period: number, end: number): void {
    runPlayerFadeOut({
      media,
      period,
      end,
      readTargetVolume: () => normalizeVolume(AMP_STATUS.volume, getDefaultVolume()),
      startFader: (callback, intervalMs) => playbackTimers.startFader('fadeout', callback, intervalMs),
      abortFader: () => abortFader('fadeout'),
      inRange,
      logger,
    });
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
    if (mutation.attributeName !== 'aria-modal') {
      return;
    }

    if ((mutation.target as HTMLElement).ariaModal === 'true') {
      syncDrawerAndModalBackdrops(currentWindowSize.width, currentWindowSize.minFullUIWidth);
      return;
    }

    cleanupDrawerBackdrops([$DRAWER_PLAYLIST, $DRAWER_SETTINGS]);
  });

  /**
   * Event handler when the window size is resized.
   */
  function updateWindowSize(): void {
    viewportRuntime.updateWindowSize();
  }

  setMenuMinimized(false);

  syncViewportMetrics();
  bindViewportSyncEvents({
    onResizeSettled: () => {
      syncViewportMetrics();
      updateWindowSize();
    },
    onOrientationChange: () => {
      refreshViewportMetricsAfter(80);
      refreshViewportMetricsAfter(420);
    },
    onVisualViewportChange: () => {
      scheduleViewportMetricsSync(60);
    },
    onVisibilityRestore: () => {
      scheduleViewportMetricsSync(80);
    },
  });

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
    resetMediaManagementForm({
      form: $MEDIA_MANAGE_FORM,
      elements: $MEDIA_MANAGE_ELMS,
      addType: AMP_STATUS.addtype,
      syncMediaVolumeField,
      setValidated,
    });
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

    const buildResult = buildManagedMediaItem({
      payload,
      categories: AMP_STATUS.category || [],
      titleMaxLength: MEDIA_TITLE_MAX_LENGTH,
      artistMaxLength: MEDIA_ARTIST_MAX_LENGTH,
      descMaxLength: MEDIA_DESC_MAX_LENGTH,
      sanitizeMediaText,
      sanitizeMediaDesc,
      isVolumeInRange: (value) => inRange(value, 0, 100),
    });
    AMP_STATUS.category = buildResult.categories;
    AMP_STATUS.media = appendManagedMediaItem(AMP_STATUS.media || [], buildResult.mediaItem);
    logger('addMediaData::after:', AMP_STATUS.media.length);
    return true;
  }

  function generatePlaylistJson(seekFormat: boolean): string {
    const playlistJson = buildPlaylistJson({
      mediaItems: AMP_STATUS.media || [],
      categories: AMP_STATUS.category || [],
      playlistOptions: AMP_STATUS.options,
      seekFormat,
    });
    logger('generatePlaylistJson::after:', playlistJson);
    return playlistJson;
  }

  async function importPlaylistFromFile(file: File): Promise<{ ok: boolean; message: string }> {
    const ambientData = getAmbientData();
    if (!isLikelyJsonFile(file)) {
      return { ok: false, message: getLocalizedMessage('importUnsupportedFile', 'Only .json files are accepted.') };
    }

    if (ambientData?.isCloud) {
      const maxBytes = getCloudImportSizeLimitBytes();
      if (file.size > maxBytes) {
        return { ok: false, message: getLocalizedMessage('importCloudSizeError', 'File size exceeds the cloud import limit for this device.') };
      }
    }

    let parsed: unknown;
    try {
      const text = await file.text();
      parsed = parseImportedPlaylistJson(text);
    } catch (_error) {
      return { ok: false, message: getLocalizedMessage('importParseError', 'The selected file is not valid JSON.') };
    }

    if (!validatePlaylistSchemaContract(parsed)) {
      return { ok: false, message: getLocalizedMessage('importSchemaError', 'The selected file does not match the playlist schema.') };
    }

    const sanitized = sanitizeAndNormalizeImportPlaylistDomain({
      source: parsed,
      stripPlaylistTemplate: ambientData?.isCloud === true,
      sanitizeText: sanitizeMediaText,
      sanitizeDesc: sanitizeMediaDesc,
      titleMaxLength: MEDIA_TITLE_MAX_LENGTH,
      artistMaxLength: MEDIA_ARTIST_MAX_LENGTH,
      descMaxLength: MEDIA_DESC_MAX_LENGTH,
    });
    if (!sanitized) {
      return { ok: false, message: getLocalizedMessage('importSanitizeError', 'Unsafe or invalid media entries exceeded the allowed limit.') };
    }

    if (!validatePlaylistSchemaContract(sanitized.playlist)) {
      return { ok: false, message: getLocalizedMessage('importSchemaError', 'The selected file does not match the playlist schema.') };
    }

    if (ambientData?.isCloud) {
      if (!persistImportedCloudPlaylist(sanitized.playlist)) {
        return { ok: false, message: getLocalizedMessage('importPersistError', 'Failed to save imported playlist data.') };
      }
      ensureMyPlaylistOptionFromStorage();
      await activateImportedPlaylist(MYPLAYLIST_NAME);
      return { ok: true, message: getLocalizedMessage('importCloudReplacedMyPlaylist', 'Import completed. MyPlaylist has been replaced.') };
    }

    const response = await postImportedPlaylist({
      baseUrl: BASE_URL,
      filename: file.name,
      playlist: sanitized.playlist,
    });

    const persistResult = resolveImportedPlaylistPersistResult(
      response,
      getLocalizedMessage('importPersistError', 'Failed to save imported playlist data.'),
      getLocalizedMessage('Playlist imported successfully.', 'Playlist imported successfully.')
    );
    if (!persistResult.ok) {
      return persistResult;
    }

    const importedPlaylistName = persistResult.filename;
    const ambient = getAmbientData();
    if (ambient) {
      if (!isObject(ambient.playlists)) {
        ambient.playlists = {};
      }
      ambient.playlists[importedPlaylistName] = `./assets/${importedPlaylistName}`;
    }
    await activateImportedPlaylist(importedPlaylistName);

    return {
      ok: true,
      message: persistResult.message,
    };
  }

  function resetPlaylistManageForm(): void {
    resetPlaylistManagementForm({
      form: $PLAYLIST_MANAGE_FORM,
      elements: $PLAYLIST_MANAGE_ELMS,
      setValidated,
      logger,
    });
  }

  function createPlaylistCategory(): { ok: boolean; message: string } {
    const selfElm = document.getElementById('btn-create-category');
    if (!$PLAYLIST_MANAGE_FORM) {
      return {
        ok: false,
        message: selfElm?.dataset['messageFailure'] || '',
      };
    }
    try {
      const formData = new FormData($PLAYLIST_MANAGE_FORM);
      const categoryName = String(formData.get('category_name') || '');
      const result = appendUniqueCategory(AMP_STATUS.category || [], categoryName);
      AMP_STATUS.category = result.categories;
      logger('createCategory:', categoryName, AMP_STATUS);
      const persisted = persistMyPlaylistIfNeeded();
      clearCategory();
      updateCategory();
      return {
        ok: persisted,
        message: persisted
          ? selfElm?.dataset['messageSuccess'] || ''
          : selfElm?.dataset['messageFailure'] || '',
      };
    } catch (err) {
      logger('createCategory: error', err);
      return {
        ok: false,
        message: selfElm?.dataset['messageFailure'] || '',
      };
    }
  }

  function downloadCurrentPlaylist(): { ok: boolean; message: string } {
    if (!$PLAYLIST_MANAGE_FORM) {
      const selfElm = document.getElementById('btn-download-playlist');
      return {
        ok: false,
        message: selfElm?.dataset['messageFailure'] || '',
      };
    }
    const formData = new FormData($PLAYLIST_MANAGE_FORM);
    const seekFormat = Number(formData.get('seek_format')) === 1;
    const jsonContent = generatePlaylistJson(seekFormat);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = AMP_STATUS.playlist || 'playlist.json';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    const selfElm = document.getElementById('btn-download-playlist');
    return {
      ok: true,
      message: selfElm?.dataset['messageSuccess'] || '',
    };
  }

  async function importPlaylistFromManagementForm(): Promise<{ ok: boolean; message: string }> {
    const selfElm = document.getElementById('btn-import-playlist') as HTMLButtonElement | null;
    const inputImportFile = document.getElementById('playlist-import-file') as HTMLInputElement | null;
    const importFile = inputImportFile?.files && inputImportFile.files.length > 0
      ? inputImportFile.files[0]
      : null;
    if (!importFile) {
      return {
        ok: false,
        message: getLocalizedMessage('importNoFile', 'Please choose a playlist JSON file.'),
      };
    }
    const result = await importPlaylistFromFile(importFile);
    if (result.ok) {
      hideOptionsModal();
    }
    return {
      ok: result.ok,
      message: result.message || (result.ok
        ? (selfElm?.dataset['messageSuccess'] || '')
        : (selfElm?.dataset['messageFailure'] || '')),
    };
  }

  if ($MEDIA_MANAGE_FORM) {
    bindMediaManagementForm(buildMediaManagementBindingsView({
      form: $MEDIA_MANAGE_FORM,
      elements: $MEDIA_MANAGE_ELMS,
      mediaCategorySelect: isElement($MEDIA_CATEGORY_SELECT) ? $MEDIA_CATEGORY_SELECT : null,
      mediaTitleMaxLength: MEDIA_TITLE_MAX_LENGTH,
      mediaArtistMaxLength: MEDIA_ARTIST_MAX_LENGTH,
      mediaDescMaxLength: MEDIA_DESC_MAX_LENGTH,
      getDefaultVolume,
      normalizeVolume,
      resetMediaManagementForm: resetMediaManageForm,
      canMutateCurrentPlaylist,
      applyCloudEditRestrictions,
      updateNotice,
      addMediaData,
      updatePlaylist,
      clearCategory,
      updateCategory,
      syncMediaCategoryField,
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
      sanitizeMediaTextInput,
      sanitizeMediaDescInput,
      sanitizeMediaDescInputLive,
      basename,
      isLikelyMediaFile,
      getRelativeFilepath,
      syncRangeProgress,
      logger,
      getMediaItems: () => AMP_STATUS.media || [],
      getAddType: () => AMP_STATUS.addtype,
      setAddType: (nextType: string) => {
        AMP_STATUS.addtype = nextType;
      },
    }));
  }

  if ($PLAYLIST_MANAGE_FORM) {
    bindPlaylistManagementForm(buildPlaylistManagementBindingsView({
      form: $PLAYLIST_MANAGE_FORM,
      elements: $PLAYLIST_MANAGE_ELMS,
      canMutateCurrentPlaylist,
      applyCloudEditRestrictions,
      setValidated,
      updateNotice,
      resetPlaylistManagementForm: resetPlaylistManageForm,
      fetchData: async (endpointURL: string, method?: string, payload?: Record<string, string>) => {
        return fetchData(endpointURL, method, payload);
      },
      inArray: (contains: unknown | unknown[], targetArray: unknown[], atLeastOne = false) => {
        return inArray(contains, targetArray as any[], atLeastOne);
      },
      snakeToCapital,
      logger,
      isLikelyJsonFile,
      getBaseUrl: () => BASE_URL,
      getPlaylistManageFormData: (oneData: string | null = null) => {
        if (!$PLAYLIST_MANAGE_FORM) return null;
        const formData = new FormData($PLAYLIST_MANAGE_FORM);
        return oneData ? formData.get(oneData) : Array.from(formData.entries());
      },
      createCategory: createPlaylistCategory,
      downloadPlaylist: downloadCurrentPlaylist,
      importPlaylist: importPlaylistFromManagementForm,
    }));
  }

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

/**
 * Finds whether the given variable is an object.
 */
function isObject(value: any): value is Record<string, any> {
  return sharedIsObject(value);
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
  return sharedIsNumberString(numstr);
}

/**
 * Determines if the given variable is a boolean string.
 */
function isBooleanString(boolstr: any): boolstr is string {
  return sharedIsBooleanString(boolstr);
}

/**
 * Given a string containing the path to a file or directory,
 * this function will return the trailing name component.
 */
function basename(path: string): string {
  return sharedBasename(path);
}

/**
 * Gets the extension from the given file path.
 */
function getExt(path: string): string {
  return sharedGetExt(path);
}

function escapeHTML(value: string): string {
  return sharedEscapeHTML(value);
}

/**
 * Return true if a number is in range, otherwise false.
 */
function inRange(num: any, min: number, max: number): boolean {
  return sharedInRange(num, min, max);
}

function inArray(contains: any | any[], targetArray: any[], at_least_one: boolean = false): boolean {
  return sharedInArray(contains, targetArray, at_least_one);
}

function snakeToCapital(str: string): string {
  return sharedSnakeToCapital(str);
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
  useAppStorage(stge === 'sessionStorage' ? 'sessionStorage' : 'localStorage');
}

/**
 * Store user data in client-side storage.
 */
function saveStge(key: string, data: any): boolean {
  const saved = saveUserData(key, data);
  if (!saved) {
    logger('saveStge: failed to save user data', key);
  }
  return saved;
}

/**
 * Logger for frontend of Ambient Media Player.
 */
function logger(...args: any[]): any {
  const ambientData = platformGetAmbientData();
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

// Do dispatcher
if ('complete' === document.readyState || 'loading' !== document.readyState) {
  init();
} else if (document.addEventListener) {
  document.addEventListener('DOMContentLoaded', init, false);
} else {
  (window as any).onload = init;
}
