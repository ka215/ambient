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
  closeResponsiveDrawers,
  cleanupDrawerBackdrops,
  syncDrawerAndModalBackdrops,
} from './ui/drawers';
import {
  applyDarkModeAppearance,
  applyPlaylistBackground,
  getToggleInput,
  syncToggleRoot,
  syncVolumeSlider,
} from './ui/settings-view';
import {
  applyFullWindowMode,
  applyMenuMinimizedState,
  bindViewportSyncEvents,
  isFullWindowMode as isFullWindowModeView,
  syncViewportLayout,
} from './ui/viewport';
import {
  createOptionsModalController,
  createPlaylistConfirmModalController,
  createPlaylistDescModalController,
  ensureAccordionPanel as ensureAccordionPanelView,
  expandMediaManagementWhenOptionsModalVisible,
  openPlaylistManagementCategoryCreate as openPlaylistManagementCategoryCreateView,
} from './ui/modals';
import {
  createPlaylistItemElement,
  closePlaylistModeMenu as closePlaylistModeMenuView,
  createPlaylistQuickAddElement,
  getPlaylistDescriptionPayload,
  PlaylistMode,
  readPlaylistItemIdsFromDom,
  syncPlaylistEmptyState,
  syncPlaylistModeAvailabilityButton,
  syncPlaylistModeButton as syncPlaylistModeButtonView,
  syncDeleteSelectionIndicator as syncDeleteSelectionIndicatorView,
  togglePlaylistModeMenu as togglePlaylistModeMenuView,
  updatePlaylistModeMenuState,
} from './ui/playlist-view';
import {
  createNoticeController,
  dispatchInitialNotice,
  type NoticeController,
} from './ui/notifications';
import {
  showPlaybackPauseState,
  showPlaybackPlayState,
  syncCaptionMarquee,
  syncMenuCollapseButtonState,
  syncPlaybackButtons,
  syncWindowFullButtonState,
  updateMediaCaptionView,
} from './ui/player/player-shell';
import {
  getBottomMenuHeight as getBottomMenuHeightView,
  getFullWindowPlayerSize as getFullWindowPlayerSizeView,
  getPlayerSizeForCurrentMode as getPlayerSizeForCurrentModeView,
} from './ui/player/player-layout';
import {
  applyInitialPlaybackStateToElement,
  applyInitialPlaybackStateToStatus,
  buildYouTubePlayerOptions,
  resolveMediaFullscreenEnabled,
  resolvePlaybackConfigSource,
  resolveInitialPlaybackState,
} from './ui/player/player-config';
import {
  renderCarouselItems,
  renderEmptyCarousel,
} from './ui/player/carousel-view';
import {
  applyYouTubeTransitionCleanup,
  findMediaById,
  resolvePlaybackTargetSetupKind,
  resolvePlaybackNeighborIds,
  resolveEndedPlaybackTarget as resolveEndedPlaybackTargetRuntime,
  resolveLoopAwareNextId,
  resolveSeekRange,
  resolveNextPlaybackTarget,
  resolveYouTubeTransitionCleanupMode,
} from './ui/player/player-runtime';
import {
  bindHtmlVideoPresentation,
  mountPlayerElement,
  resetWatchOriginState,
  showHtmlPlayerWrapper,
} from './ui/player/html-player-view';
import {
  bindHtmlEndedEvent,
  bindHtmlErrorEvents,
  bindHtmlPlaybackStateEvents,
  bindHtmlSeekOnPlay,
  createHtmlMediaIssueReporter,
  handleHtmlPlayingState,
} from './ui/player/html-player-events';
import {
  type PlayableSetupKind,
  resolvePlaybackSetupPlan,
} from './ui/player/player-setup';
import { createAudioPlayerView } from './ui/player/audio-player-view';
import { createVideoPlayerView } from './ui/player/video-player-view';
import {
  createYouTubePlayerHost,
  hideYouTubePlayerWrapper,
  setWatchOriginState,
  showYouTubePlayerWrapper,
} from './ui/player/youtube-player-view';
import {
  applyYouTubeReadyPlayback,
  handleYouTubePausedState,
  handleYouTubePlayingState,
  handleYouTubeUnstartedState,
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
import { bindMediaManagementForm, type MediaManagementBindings } from './ui/forms/media-management';
import { bindPlaylistManagementForm, type PlaylistManagementBindings } from './ui/forms/playlist-management';
import { createPlaylistLoadGuard } from './domain/playlist-loader';
import {
  buildPlaylistJson,
  ensureCloudMyPlaylistSeed as domainEnsureCloudMyPlaylistSeed,
  hasStoredMyPlaylist,
  MYPLAYLIST_NAME,
  readMyPlaylistJson,
  sanitizeMyPlaylistOptions as domainSanitizeMyPlaylistOptions,
  writeMyPlaylistJson,
} from './domain/myplaylist-storage';
import { createPlaybackTimerController } from './domain/media-playback';
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

  if (!window.hasOwnProperty('APP_KEY')) {
    (window as any).APP_KEY = USER_DATA_APP_KEY;
  }

  useStge();
  const AMP_STATUS = initStatus();
  let bootGateReleased = false;
  let bootGateCompleting = false;
  let bootGateDelayId: number | null = null;
  let bootGateFadeId: number | null = null;
  const bootGateStartedAt = Date.now();
  const BOOT_SPLASH_MIN_VISIBLE_MS = 2400;
  const BOOT_SPLASH_FADE_MS = 220;

  function completeAppBootGate(): void {
    const body = document.body;
    const splash = document.getElementById('app-boot-splash');
    if (body) {
      body.classList.remove('app-boot-transitioning');
      body.classList.remove('app-boot-pending');
      body.setAttribute('data-boot', 'ready');
    }
    if (splash) {
      splash.classList.remove('app-boot-fadeout');
    }
    window.setTimeout(() => {
      syncViewportMetrics();
      updateWindowSize();
    }, 0);
  }

  function releaseAppBootGate(): void {
    if (bootGateReleased || bootGateCompleting) {
      return;
    }

    const startFadeOut = (): void => {
      if (bootGateCompleting) {
        return;
      }
      bootGateCompleting = true;
      const body = document.body;
      const splash = document.getElementById('app-boot-splash');
      if (body) {
        body.classList.add('app-boot-transitioning');
        body.setAttribute('data-boot', 'transition');
      }
      if (splash) {
        splash.classList.add('app-boot-fadeout');
      }
      bootGateFadeId = window.setTimeout(() => {
        bootGateReleased = true;
        completeAppBootGate();
      }, BOOT_SPLASH_FADE_MS);
    };

    const elapsed = Date.now() - bootGateStartedAt;
    const waitMs = Math.max(0, BOOT_SPLASH_MIN_VISIBLE_MS - elapsed);
    if (waitMs === 0) {
      startFadeOut();
      return;
    }

    if (bootGateDelayId !== null) {
      window.clearTimeout(bootGateDelayId);
      bootGateDelayId = null;
    }
    bootGateDelayId = window.setTimeout(() => {
      bootGateDelayId = null;
      startFadeOut();
    }, waitMs);
  }

  function forceReleaseAppBootGate(): void {
    if (bootGateReleased) {
      return;
    }
    if (bootGateDelayId !== null) {
      window.clearTimeout(bootGateDelayId);
      bootGateDelayId = null;
    }
    if (bootGateFadeId !== null) {
      window.clearTimeout(bootGateFadeId);
      bootGateFadeId = null;
    }
    bootGateCompleting = false;
    bootGateReleased = true;
    const body = document.body;
    if (body) {
      body.classList.remove('app-boot-transitioning');
      body.classList.remove('app-boot-pending');
      body.setAttribute('data-boot', 'ready');
    }
    const splash = document.getElementById('app-boot-splash');
    if (splash) {
      splash.classList.remove('app-boot-fadeout');
    }
    window.setTimeout(() => {
      syncViewportMetrics();
      updateWindowSize();
    }, 0);
  }

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
  let pendingResumeCategoryName: string | null = null;
  let pendingResumeMediaContext: PlaylistResumeMediaContext | null = null;

  function isPlaylistLoadActive(seq: number): boolean {
    return playlistLoadGuard.isActive(seq);
  }

  function beginPlaylistLoad(playlist: string): number {
    return playlistLoadGuard.begin(playlist, (nextPlaylist) => {
      AMP_STATUS.playlist = nextPlaylist;
      applyCloudEditRestrictions();
    });
  }

  function finishPlaylistLoad(seq: number): void {
    playlistLoadGuard.finish(seq);
  }

  function resetPlaylistRuntimeState(preserveOptions: boolean = false): void {
    AMP_STATUS.prev = null;
    AMP_STATUS.current = null;
    AMP_STATUS.next = null;
    AMP_STATUS.ctg = -1;
    AMP_STATUS.category = null;
    AMP_STATUS.media = [];
    if (!preserveOptions) {
      AMP_STATUS.options = null;
    }
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

  function sanitizeMyPlaylistOptions(
    options: PlaylistOptions | null | undefined
  ): PlaylistOptions | null {
    return domainSanitizeMyPlaylistOptions(options) as PlaylistOptions | null;
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
    if (!mediaItem) {
      return null;
    }
    const currentCategory = getCurrentCategoryName();
    const mediaCategory = getMediaCategoryName(mediaItem);
    if (currentCategory !== '' && mediaCategory !== currentCategory) {
      return null;
    }
    return {
      amId: mediaItem.amId,
      category: mediaCategory,
      title: sanitizeMediaText(mediaItem.title || '', MEDIA_TITLE_MAX_LENGTH),
      artist: sanitizeMediaText(mediaItem.artist || '', MEDIA_ARTIST_MAX_LENGTH),
      file: typeof mediaItem.file === 'string' ? mediaItem.file : '',
      videoid: typeof mediaItem.videoid === 'string' ? mediaItem.videoid : '',
    };
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
    pendingResumeCategoryName = categoryName && categoryName.trim() !== '' ? categoryName.trim() : null;
  }

  function requestMediaResume(mediaContext: PlaylistResumeMediaContext | null | undefined): void {
    pendingResumeMediaContext = mediaContext || null;
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

  function isSameResumeMedia(item: MediaItem, mediaContext: PlaylistResumeMediaContext): boolean {
    const sameVideo = mediaContext.videoid !== '' && item.videoid === mediaContext.videoid;
    const sameFile = mediaContext.file !== '' && item.file === mediaContext.file;
    const sameTitle = sanitizeMediaText(item.title || '', MEDIA_TITLE_MAX_LENGTH) === mediaContext.title;
    const sameArtist = sanitizeMediaText(item.artist || '', MEDIA_ARTIST_MAX_LENGTH) === mediaContext.artist;
    return sameVideo || sameFile || (sameTitle && sameArtist);
  }

  function findResumeMediaItem(mediaContext: PlaylistResumeMediaContext): MediaItem | null {
    const media = AMP_STATUS.media || [];
    const expectedCategory = mediaContext.category || pendingResumeCategoryName || '';
    const isCategoryCompatible = (item: MediaItem): boolean => {
      if (expectedCategory === '') {
        return true;
      }
      return getMediaCategoryName(item) === expectedCategory;
    };
    const exactAmId = media.find((item: MediaItem) =>
      item.amId === mediaContext.amId &&
      isCategoryCompatible(item) &&
      isSameResumeMedia(item, mediaContext)
    );
    if (exactAmId) {
      return exactAmId;
    }
    return media.find((item: MediaItem) =>
      isCategoryCompatible(item) &&
      isSameResumeMedia(item, mediaContext)
    ) || null;
  }

  function applyPendingMediaResume(): boolean {
    if (pendingResumeMediaContext === null) {
      return false;
    }
    const resumeItem = findResumeMediaItem(pendingResumeMediaContext);
    pendingResumeMediaContext = null;
    if (!resumeItem) {
      return false;
    }
    updatePlayStatus(resumeItem.amId);
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
    if (!ambientData?.isCloud || !hasStoredMyPlaylist()) return false;
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
          if (applyPendingMediaResume()) {
            // The saved media item has been restored without autoplay.
          } else if (AMP_STATUS.current !== null) {
            updatePlayStatus(AMP_STATUS.current);
          } else if (media.length > 0) {
            updatePlayStatus(getDefaultMediaItemForCurrentView()?.amId ?? 0);
          }
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
    const canMutatePlaylist = canMutateCurrentPlaylist();
    const $MEDIA_MANAGE_FORM_EL = document.querySelector('form[name="mediaManagement"]') as HTMLFormElement | null;
    const $PLAYLIST_MANAGE_FORM_EL = document.querySelector('form[name="playlistManagement"]') as HTMLFormElement | null;
    const $PLAYLIST_MANAGE_NOTICE = document.getElementById('cloud-readonly-notice');
    const readonlyTitle = 'Editing existing playlists is not available in cloud mode.';
    const mediaControlIds = [
      'media-type-youtube',
      'youtube-url',
      'media-category',
      'media-category-new',
      'media-title',
      'media-artist',
      'media-desc',
      'media-volume',
      'seek-start',
      'seek-end',
      'btn-add-media',
    ];
    const categoryControlIds = [
      'category-name',
      'btn-create-category',
    ];
    const setReadonlyState = (ids: string[]): void => {
      ids.forEach((id) => {
        const elm = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLButtonElement | null;
        if (!elm) return;
        elm.disabled = !canMutatePlaylist;
        elm.setAttribute('aria-disabled', String(!canMutatePlaylist));
        if (!canMutatePlaylist) {
          elm.setAttribute('title', readonlyTitle);
        } else {
          elm.removeAttribute('title');
        }
      });
    };

    setReadonlyState(mediaControlIds);
    setReadonlyState(categoryControlIds);

    if (!canMutatePlaylist) {
      if ($MEDIA_MANAGE_FORM_EL) {
        $MEDIA_MANAGE_FORM_EL.classList.add('opacity-50');
      }
      if ($PLAYLIST_MANAGE_FORM_EL) {
        $PLAYLIST_MANAGE_FORM_EL.querySelector('#playlist-management-field-category')?.classList.add('opacity-50');
      }
    } else {
      if ($MEDIA_MANAGE_FORM_EL) {
        $MEDIA_MANAGE_FORM_EL.classList.remove('opacity-50');
      }
      if ($PLAYLIST_MANAGE_FORM_EL) {
        $PLAYLIST_MANAGE_FORM_EL.querySelector('#playlist-management-field-category')?.classList.remove('opacity-50');
      }
    }
    void $PLAYLIST_MANAGE_NOTICE;
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
  let mediaEditDurationSyncTimerId: number | null = null;
  let mediaEditDurationSyncTimeoutId: number | null = null;
  let mediaEditDurationSyncItemKey: string | null = null;

  interface MediaEditDraft {
    category: string;
    title: string;
    artist: string;
    description: string;
    volume: number;
    seekStart: number | null;
    seekEnd: number | null;
    fadeInEnd: number | null;
    fadeOutStart: number | null;
    thumbnailMode: 'keep' | 'upload' | 'remove';
    thumbnailName: string;
    thumbnailMime: string;
    thumbnailDataUrl: string;
  }

  interface MediaEditDraftInput {
    category?: unknown;
    title?: unknown;
    artist?: unknown;
    description?: unknown;
    volume?: unknown;
    seekStart?: unknown;
    seekEnd?: unknown;
    fadeInEnd?: unknown;
    fadeOutStart?: unknown;
    thumbnailMode?: unknown;
    thumbnailName?: unknown;
    thumbnailMime?: unknown;
    thumbnailDataUrl?: unknown;
  }

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

  function setMediaEditSeekTimelineMarker(
    markerElm: HTMLElement | null,
    markerTimeElm: HTMLElement | null,
    value: number | null,
    rangeMax: number
  ): void {
    if (!isElement(markerElm) || !isElement(markerTimeElm)) {
      return;
    }
    if (!Number.isInteger(value) || value === null || value < 0) {
      markerElm.classList.add('hidden');
      markerTimeElm.textContent = '';
      return;
    }
    const positionPercent = Math.min(99, Math.max(1, (value / rangeMax) * 100));
    markerElm.style.setProperty('--media-edit-seek-pos', `${positionPercent}`);
    markerTimeElm.textContent = formatSecondsToTimelineLabel(value);
    markerElm.classList.remove('hidden');
  }

  function syncMediaEditSeekTimeline(
    seekStart: number | null,
    seekEnd: number | null,
    fadeInEnd: number | null,
    fadeOutStart: number | null
  ): void {
    if (!isElement($MEDIA_EDIT_SEEK_TIMELINE)) {
      return;
    }
    const knownDuration = resolveMediaEditKnownDuration(mediaEditActiveItem);
    const rangeMax = Math.max(
      1,
      knownDuration ?? 0,
      seekStart ?? 0,
      seekEnd ?? 0,
      fadeInEnd ?? 0,
      fadeOutStart ?? 0
    );
    if (isElement($MEDIA_EDIT_SEEK_FIXED_START_TIME)) {
      $MEDIA_EDIT_SEEK_FIXED_START_TIME.textContent = formatSecondsToTimelineLabel(0);
    }
    if (isElement($MEDIA_EDIT_SEEK_FIXED_END_TIME)) {
      $MEDIA_EDIT_SEEK_FIXED_END_TIME.textContent = formatSecondsToTimelineLabel(knownDuration ?? rangeMax);
    }
    setMediaEditSeekTimelineMarker($MEDIA_EDIT_SEEK_MARKER_START, $MEDIA_EDIT_SEEK_MARKER_START_TIME, seekStart, rangeMax);
    setMediaEditSeekTimelineMarker($MEDIA_EDIT_SEEK_MARKER_FADEIN_END, $MEDIA_EDIT_SEEK_MARKER_FADEIN_END_TIME, fadeInEnd, rangeMax);
    setMediaEditSeekTimelineMarker($MEDIA_EDIT_SEEK_MARKER_FADEOUT_START, $MEDIA_EDIT_SEEK_MARKER_FADEOUT_START_TIME, fadeOutStart, rangeMax);
    setMediaEditSeekTimelineMarker($MEDIA_EDIT_SEEK_MARKER_END, $MEDIA_EDIT_SEEK_MARKER_END_TIME, seekEnd, rangeMax);
  }

  function setMediaEditSeekTimelineLoading(isLoading: boolean): void {
    if (isElement($MEDIA_EDIT_SEEK_TIMELINE)) {
      $MEDIA_EDIT_SEEK_TIMELINE.classList.toggle('is-loading', isLoading);
      $MEDIA_EDIT_SEEK_TIMELINE.setAttribute('aria-busy', isLoading ? 'true' : 'false');
    }
    if (isElement($MEDIA_EDIT_SEEK_TIMELINE_LOADING)) {
      $MEDIA_EDIT_SEEK_TIMELINE_LOADING.classList.toggle('hidden', !isLoading);
      $MEDIA_EDIT_SEEK_TIMELINE_LOADING.setAttribute('aria-hidden', isLoading ? 'false' : 'true');
    }
  }

  function clearMediaEditDurationSyncWait(): void {
    if (mediaEditDurationSyncTimerId !== null) {
      window.clearInterval(mediaEditDurationSyncTimerId);
      mediaEditDurationSyncTimerId = null;
    }
    if (mediaEditDurationSyncTimeoutId !== null) {
      window.clearTimeout(mediaEditDurationSyncTimeoutId);
      mediaEditDurationSyncTimeoutId = null;
    }
    mediaEditDurationSyncItemKey = null;
    setMediaEditSeekTimelineLoading(false);
  }

  function maybeCompleteMediaEditDurationSyncWait(): boolean {
    if (!mediaEditActiveItem || !mediaEditDurationSyncItemKey) {
      return false;
    }
    if (mediaEditDurationSyncItemKey !== getMediaEditItemIdentity(mediaEditActiveItem)) {
      clearMediaEditDurationSyncWait();
      return false;
    }
    if (resolveMediaEditKnownDuration(mediaEditActiveItem) === null) {
      return false;
    }
    clearMediaEditDurationSyncWait();
    syncMediaEditTimingDisplay();
    return true;
  }

  function startMediaEditDurationSyncWaitIfNeeded(): void {
    if (!mediaEditActiveItem || !isElement($MEDIA_EDIT_SEEK_TIMELINE)) {
      clearMediaEditDurationSyncWait();
      return;
    }
    const itemKey = getMediaEditItemIdentity(mediaEditActiveItem);
    if (resolveMediaEditKnownDuration(mediaEditActiveItem) !== null) {
      clearMediaEditDurationSyncWait();
      return;
    }

    clearMediaEditDurationSyncWait();
    mediaEditDurationSyncItemKey = itemKey;
    setMediaEditSeekTimelineLoading(true);

    mediaEditDurationSyncTimerId = window.setInterval(() => {
      maybeCompleteMediaEditDurationSyncWait();
    }, MEDIA_EDIT_DURATION_SYNC_POLL_MS);

    mediaEditDurationSyncTimeoutId = window.setTimeout(() => {
      clearMediaEditDurationSyncWait();
      syncMediaEditTimingDisplay();
    }, MEDIA_EDIT_DURATION_SYNC_TIMEOUT_MS);
  }

  function parseMediaEditItemDurationSeconds(mediaItem: MediaItem | null): number | null {
    if (!mediaItem) {
      return null;
    }
    const durationCandidate = (mediaItem as unknown as Record<string, unknown>)['duration'];
    return normalizeMediaEditTimingValue(durationCandidate, null);
  }

  function resolveMediaEditEffectiveEnd(
    seekEnd: number | null,
    duration: number | null,
    seekStart: number | null,
    fallbackFadeoutDuration: number | null = null
  ): number | null {
    if (seekEnd !== null) {
      return seekEnd;
    }
    if (duration !== null) {
      return duration;
    }
    if (fallbackFadeoutDuration !== null) {
      return (seekStart ?? 0) + fallbackFadeoutDuration;
    }
    return null;
  }

  function resolveMediaEditKnownDuration(mediaItem: MediaItem | null): number | null {
    const itemDuration = parseMediaEditItemDurationSeconds(mediaItem);
    if (itemDuration !== null) {
      return itemDuration;
    }
    if (mediaItem && mediaEditActiveItem && getMediaEditItemIdentity(mediaItem) === getMediaEditItemIdentity(mediaEditActiveItem)) {
      return mediaEditPreviewDurationSeconds;
    }
    return null;
  }

  function getMediaEditTimingFromStoredDurations(mediaItem: MediaItem): {
    seekStart: number | null;
    seekEnd: number | null;
    fadeInEnd: number | null;
    fadeOutStart: number | null;
  } {
    const seekStart = normalizeMediaEditTimingValue(mediaItem.start, null);
    const seekEnd = normalizeMediaEditTimingValue(mediaItem.end, null);
    const storedFadein = normalizeMediaEditTimingValue(mediaItem.fadein, null);
    const storedFadeout = normalizeMediaEditTimingValue(mediaItem.fadeout, null);
    const duration = resolveMediaEditKnownDuration(mediaItem);
    const effectiveEnd = resolveMediaEditEffectiveEnd(seekEnd, duration, seekStart, storedFadeout);
    return {
      seekStart,
      seekEnd,
      fadeInEnd: storedFadein !== null ? (seekStart ?? 0) + storedFadein : null,
      fadeOutStart: storedFadeout !== null && effectiveEnd !== null
        ? Math.max(0, effectiveEnd - storedFadeout)
        : null,
    };
  }

  function getMediaEditComputedFadeDurations(item: MediaItem, draft: MediaEditDraft): {
    fadein: number | '';
    fadeout: number | '';
  } {
    const seekStart = draft.seekStart ?? 0;
    const fadein = draft.fadeInEnd !== null
      ? Math.max(0, draft.fadeInEnd - seekStart)
      : '';

    const currentStoredFadeout = normalizeMediaEditTimingValue(item.fadeout, null);
    const effectiveEnd = resolveMediaEditEffectiveEnd(
      draft.seekEnd,
      resolveMediaEditKnownDuration(item),
      draft.seekStart,
      currentStoredFadeout
    );
    const fadeout = draft.fadeOutStart !== null
      ? (effectiveEnd !== null
        ? Math.max(0, effectiveEnd - draft.fadeOutStart)
        : (currentStoredFadeout ?? ''))
      : '';

    return { fadein, fadeout };
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
      const optionElm = document.createElement('button');
      optionElm.type = 'button';
      optionElm.className = 'media-edit-category-option block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:text-gray-100 dark:hover:bg-gray-600 dark:focus:ring-blue-900';
      optionElm.setAttribute('role', 'option');
      optionElm.setAttribute('aria-selected', selected === catName ? 'true' : 'false');
      optionElm.textContent = catName;
      optionElm.addEventListener('click', () => {
        if (!isElement($MEDIA_EDIT_CATEGORY)) {
          return;
        }
        $MEDIA_EDIT_CATEGORY.value = catName;
        $MEDIA_EDIT_CATEGORY.dispatchEvent(new Event('input', { bubbles: true }));
        $MEDIA_EDIT_CATEGORY.dispatchEvent(new Event('change', { bubbles: true }));
        closeMediaEditCategoryDropdown(true);
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
    const fallbackVolume = fallback?.volume ?? getDefaultVolume();
    return {
      category: sanitizeMediaText(String(draft.category ?? fallback?.category ?? ''), MEDIA_TITLE_MAX_LENGTH),
      title: sanitizeMediaText(String(draft.title ?? fallback?.title ?? ''), MEDIA_TITLE_MAX_LENGTH),
      artist: sanitizeMediaText(String(draft.artist ?? fallback?.artist ?? ''), MEDIA_ARTIST_MAX_LENGTH),
      description: sanitizeMediaEditDescInput(String(draft.description ?? fallback?.description ?? ''), MEDIA_DESC_MAX_LENGTH),
      volume: normalizeVolume(draft.volume ?? fallbackVolume, fallbackVolume),
      seekStart: normalizeMediaEditTimingValue(draft.seekStart, fallback?.seekStart ?? null),
      seekEnd: normalizeMediaEditTimingValue(draft.seekEnd, fallback?.seekEnd ?? null),
      fadeInEnd: normalizeMediaEditTimingValue(draft.fadeInEnd, fallback?.fadeInEnd ?? null),
      fadeOutStart: normalizeMediaEditTimingValue(draft.fadeOutStart, fallback?.fadeOutStart ?? null),
      thumbnailMode: (draft.thumbnailMode as MediaEditDraft['thumbnailMode'] | undefined) ?? fallback?.thumbnailMode ?? 'keep',
      thumbnailName: sanitizeMediaText(String(draft.thumbnailName ?? fallback?.thumbnailName ?? ''), 255),
      thumbnailMime: sanitizeMediaText(String(draft.thumbnailMime ?? fallback?.thumbnailMime ?? ''), 100),
      thumbnailDataUrl: String(draft.thumbnailDataUrl ?? fallback?.thumbnailDataUrl ?? ''),
    };
  }

  function cloneMediaEditDraft(draft: MediaEditDraft): MediaEditDraft {
    return {
      category: draft.category,
      title: draft.title,
      artist: draft.artist,
      description: draft.description,
      volume: draft.volume,
      seekStart: draft.seekStart,
      seekEnd: draft.seekEnd,
      fadeInEnd: draft.fadeInEnd,
      fadeOutStart: draft.fadeOutStart,
      thumbnailMode: draft.thumbnailMode,
      thumbnailName: draft.thumbnailName,
      thumbnailMime: draft.thumbnailMime,
      thumbnailDataUrl: draft.thumbnailDataUrl,
    };
  }

  function isSameMediaEditDraft(a: MediaEditDraft, b: MediaEditDraft): boolean {
    return a.category === b.category
      && a.title === b.title
      && a.artist === b.artist
      && a.description === b.description
      && a.volume === b.volume
      && a.seekStart === b.seekStart
      && a.seekEnd === b.seekEnd
      && a.fadeInEnd === b.fadeInEnd
      && a.fadeOutStart === b.fadeOutStart
      && a.thumbnailMode === b.thumbnailMode
      && a.thumbnailName === b.thumbnailName
      && a.thumbnailMime === b.thumbnailMime
      && a.thumbnailDataUrl === b.thumbnailDataUrl;
  }

  function setMediaEditFieldValidationState(field: HTMLElement | null, validState: boolean | null): void {
    if (!isElement(field)) {
      return;
    }
    const invalid = validState === false;
    field.setAttribute('aria-invalid', invalid ? 'true' : 'false');
    field.classList.toggle('border-red-500', invalid);
    field.classList.toggle('focus:border-red-500', invalid);
    field.classList.toggle('focus:ring-red-200', invalid);
    field.classList.toggle('dark:focus:ring-red-900', invalid);
    const group = field.closest<HTMLElement>('[data-media-edit-validation-group]');
    if (group) {
      group.classList.toggle('border-red-500', invalid);
      group.classList.toggle('focus-within:border-red-500', invalid);
      group.classList.toggle('focus-within:ring-2', invalid);
      group.classList.toggle('focus-within:ring-red-200', invalid);
      group.classList.toggle('dark:focus-within:border-red-400', invalid);
      group.classList.toggle('dark:focus-within:ring-red-900', invalid);
    }
  }

  function setMediaEditFieldValidationMessage(fieldId: string, message: string | null): void {
    const messageElm = document.getElementById(`${fieldId}-error`) as HTMLElement | null;
    if (!messageElm) {
      return;
    }
    if (message === null || message.trim() === '') {
      messageElm.textContent = '';
      messageElm.classList.add('hidden');
      return;
    }
    messageElm.textContent = message;
    messageElm.classList.remove('hidden');
  }

  function setMediaEditSaveButtonDisabled(disabled: boolean): void {
    if (!isElement($BUTTON_SAVE_MEDIA_EDIT)) {
      return;
    }
    $BUTTON_SAVE_MEDIA_EDIT.disabled = disabled;
    $BUTTON_SAVE_MEDIA_EDIT.setAttribute('aria-disabled', disabled ? 'true' : 'false');
  }

  function clearMediaEditValidationView(): void {
    setMediaEditFieldValidationMessage('modal-media-edit-category', null);
    setMediaEditFieldValidationMessage('modal-media-edit-title-input', null);
    setMediaEditFieldValidationMessage('modal-media-edit-seek-start', null);
    setMediaEditFieldValidationMessage('modal-media-edit-seek-end', null);
    setMediaEditFieldValidationMessage('modal-media-edit-fadein-end', null);
    setMediaEditFieldValidationMessage('modal-media-edit-fadeout-start', null);
    [
      $MEDIA_EDIT_CATEGORY,
      $MEDIA_EDIT_TITLE,
      $MEDIA_EDIT_SEEK_START,
      $MEDIA_EDIT_SEEK_END,
      $MEDIA_EDIT_FADEIN_END,
      $MEDIA_EDIT_FADEOUT_START,
    ].forEach((field) => {
      setMediaEditFieldValidationState(field, null);
    });
    setMediaEditSaveButtonDisabled(false);
  }

  function renderMediaEditValidation(result: MediaEditValidationResult): void {
    const invalidIds = new Set(result.invalidFieldIds);
    const fieldMessages = result.fieldMessages || {};
    setMediaEditFieldValidationState($MEDIA_EDIT_CATEGORY, !invalidIds.has('modal-media-edit-category'));
    setMediaEditFieldValidationState($MEDIA_EDIT_TITLE, !invalidIds.has('modal-media-edit-title-input'));
    setMediaEditFieldValidationState($MEDIA_EDIT_SEEK_START, !invalidIds.has('modal-media-edit-seek-start'));
    setMediaEditFieldValidationState($MEDIA_EDIT_SEEK_END, !invalidIds.has('modal-media-edit-seek-end'));
    setMediaEditFieldValidationState($MEDIA_EDIT_FADEIN_END, !invalidIds.has('modal-media-edit-fadein-end'));
    setMediaEditFieldValidationState($MEDIA_EDIT_FADEOUT_START, !invalidIds.has('modal-media-edit-fadeout-start'));
    setMediaEditFieldValidationMessage('modal-media-edit-category', fieldMessages['modal-media-edit-category']?.[0] || null);
    setMediaEditFieldValidationMessage('modal-media-edit-title-input', fieldMessages['modal-media-edit-title-input']?.[0] || null);
    setMediaEditFieldValidationMessage('modal-media-edit-seek-start', fieldMessages['modal-media-edit-seek-start']?.[0] || null);
    setMediaEditFieldValidationMessage('modal-media-edit-seek-end', fieldMessages['modal-media-edit-seek-end']?.[0] || null);
    setMediaEditFieldValidationMessage('modal-media-edit-fadein-end', fieldMessages['modal-media-edit-fadein-end']?.[0] || null);
    setMediaEditFieldValidationMessage('modal-media-edit-fadeout-start', fieldMessages['modal-media-edit-fadeout-start']?.[0] || null);
    setMediaEditSaveButtonDisabled(!result.valid);
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
    if (isElement($MEDIA_EDIT_PREVIEW_ERROR)) {
      $MEDIA_EDIT_PREVIEW_ERROR.classList.add('hidden');
    }
    if (isElement($MEDIA_EDIT_PREVIEW_ERROR_MESSAGE)) {
      $MEDIA_EDIT_PREVIEW_ERROR_MESSAGE.textContent = '';
    }
  }

  function showMediaEditPreviewError(message: string): void {
    if (isElement($MEDIA_EDIT_PREVIEW_ERROR_MESSAGE)) {
      $MEDIA_EDIT_PREVIEW_ERROR_MESSAGE.textContent = message;
    }
    if (isElement($MEDIA_EDIT_PREVIEW_ERROR)) {
      $MEDIA_EDIT_PREVIEW_ERROR.classList.remove('hidden');
    }
  }

  function destroyMediaEditPreviewPlayer(): void {
    if (mediaEditPreviewYouTubePlayer) {
      try {
        mediaEditPreviewYouTubePlayer.destroy();
      } catch (_error) {
        // Ignore destroy failures when preview iframe is already gone.
      }
      mediaEditPreviewYouTubePlayer = null;
    }
    if (mediaEditPreviewHtmlPlayer) {
      try {
        mediaEditPreviewHtmlPlayer.pause();
      } catch (_error) {
        // Ignore pause failures.
      }
      mediaEditPreviewHtmlPlayer.removeAttribute('src');
      while (mediaEditPreviewHtmlPlayer.firstChild) {
        mediaEditPreviewHtmlPlayer.removeChild(mediaEditPreviewHtmlPlayer.firstChild);
      }
      mediaEditPreviewHtmlPlayer.load();
      mediaEditPreviewHtmlPlayer = null;
    }
    mediaEditPreviewType = null;
  }

  function clearMediaEditPreviewContainer(): void {
    if (!isElement($MEDIA_EDIT_PREVIEW)) {
      return;
    }
    $MEDIA_EDIT_PREVIEW.innerHTML = '';
  }

  function resetMediaEditPreviewState(): void {
    clearMediaEditDurationSyncWait();
    destroyMediaEditPreviewPlayer();
    clearMediaEditPreviewContainer();
    mediaEditPreviewSourceItem = null;
    mediaEditPreviewDurationSeconds = null;
    hideMediaEditPreviewError();
  }

  function getMediaEditPreviewCurrentTime(): number | null {
    try {
      if (mediaEditPreviewType === 'youtube' && mediaEditPreviewYouTubePlayer) {
        const currentTime = mediaEditPreviewYouTubePlayer.getCurrentTime();
        if (Number.isFinite(currentTime) && currentTime >= 0) {
          return Math.trunc(currentTime);
        }
      }
      if ((mediaEditPreviewType === 'audio' || mediaEditPreviewType === 'video') && mediaEditPreviewHtmlPlayer) {
        const currentTime = mediaEditPreviewHtmlPlayer.currentTime;
        if (Number.isFinite(currentTime) && currentTime >= 0) {
          return Math.trunc(currentTime);
        }
      }
    } catch (_error) {
      return null;
    }
    return null;
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

  function resolveMediaEditPreviewTagName(path: string): 'audio' | 'video' {
    const ext = getExt(path);
    const videoExtSet = new Set(['avi', 'mp4', 'mpeg', 'mpg', 'ogv', 'ts', 'webm', '3gp', '3g2']);
    return videoExtSet.has(ext) ? 'video' : 'audio';
  }

  function createMediaEditPreview(mediaItem: MediaItem): void {
    resetMediaEditPreviewState();
    mediaEditPreviewSourceItem = mediaItem;

    if (!isElement($MEDIA_EDIT_PREVIEW)) {
      return;
    }

    if (mediaItem.videoid && mediaItem.videoid.trim() !== '') {
      const ytRoot = document.createElement('div');
      ytRoot.id = MEDIA_EDIT_PREVIEW_YT_PLAYER_ID;
      ytRoot.className = 'media-edit-preview-embed mx-auto aspect-video w-full max-w-3xl';
      $MEDIA_EDIT_PREVIEW.appendChild(ytRoot);

      const ytApi = (window as any).YT;
      if (!ytApi || typeof ytApi.Player !== 'function') {
        showMediaEditPreviewError(
          getLocalizedMessage('mediaEditPreviewUnavailable', 'Preview is not available. Please retry after the player API loads.')
        );
        return;
      }

      try {
        mediaEditPreviewType = 'youtube';
        mediaEditPreviewYouTubePlayer = new ytApi.Player(MEDIA_EDIT_PREVIEW_YT_PLAYER_ID, {
          height: 270,
          width: 480,
          videoId: mediaItem.videoid,
          playerVars: {
            autoplay: 0,
            controls: 1,
            rel: 0,
            fs: 0,
          },
          events: {
            onReady: () => {
              const duration = normalizeMediaEditTimingValue(mediaEditPreviewYouTubePlayer?.getDuration(), null);
              mediaEditPreviewDurationSeconds = duration;
              validateAndRenderMediaEditDraftFromForm();
              maybeCompleteMediaEditDurationSyncWait();
              hideMediaEditPreviewError();
            },
            onStateChange: () => {
              const duration = normalizeMediaEditTimingValue(mediaEditPreviewYouTubePlayer?.getDuration(), null);
              if (duration !== null) {
                mediaEditPreviewDurationSeconds = duration;
                validateAndRenderMediaEditDraftFromForm();
                maybeCompleteMediaEditDurationSyncWait();
              }
              hideMediaEditPreviewError();
            },
            onError: () => {
              showMediaEditPreviewError(
                getLocalizedMessage('mediaEditPreviewLoadFailed', 'Failed to load media preview. Please try again.')
              );
            },
          },
        });
      } catch (_error) {
        showMediaEditPreviewError(
          getLocalizedMessage('mediaEditPreviewLoadFailed', 'Failed to load media preview. Please try again.')
        );
      }
      return;
    }

    if (mediaItem.file && mediaItem.file.trim() !== '') {
      const sourcePath = resolveLocalMediaSrc(mediaItem.file);
      const tagName = resolveMediaEditPreviewTagName(sourcePath);
      const previewElm = document.createElement(tagName) as HTMLMediaElement;
      const sourceElm = document.createElement('source');
      let hasReportedLoadIssue = false;

      previewElm.className = [
        'media-edit-preview-player',
        tagName === 'audio' ? 'ambient-audio-player' : '',
        'mx-auto block w-full max-h-[280px] rounded',
      ].filter(Boolean).join(' ');
      previewElm.setAttribute('controls', 'true');
      previewElm.setAttribute('preload', 'metadata');
      previewElm.setAttribute('playsinline', 'true');

      sourceElm.src = sourcePath;
      sourceElm.setAttribute('type', getMediaMimeType(sourcePath, tagName));
      previewElm.appendChild(sourceElm);

      const showLoadErrorOnce = (): void => {
        if (hasReportedLoadIssue) {
          return;
        }
        hasReportedLoadIssue = true;
        showMediaEditPreviewError(
          getLocalizedMessage('mediaEditPreviewLoadFailed', 'Failed to load media preview. Please try again.')
        );
      };

      previewElm.addEventListener('loadedmetadata', () => {
        mediaEditPreviewDurationSeconds = normalizeMediaEditTimingValue(previewElm.duration, null);
        validateAndRenderMediaEditDraftFromForm();
        maybeCompleteMediaEditDurationSyncWait();
        hideMediaEditPreviewError();
      });
      previewElm.addEventListener('error', () => {
        showLoadErrorOnce();
      });
      sourceElm.addEventListener('error', () => {
        showLoadErrorOnce();
      });
      previewElm.addEventListener('loadstart', () => {
        window.setTimeout(() => {
          if (previewElm.readyState === 0 && (previewElm.networkState === 3 || previewElm.error)) {
            showLoadErrorOnce();
          }
        }, 5000);
      });

      $MEDIA_EDIT_PREVIEW.appendChild(previewElm);
      mediaEditPreviewType = tagName;
      mediaEditPreviewHtmlPlayer = previewElm;
      previewElm.load();
      return;
    }

    showMediaEditPreviewError(
      getLocalizedMessage('mediaEditPreviewNoSource', 'Preview is not available because the media source is missing.')
    );
  }

  function setMediaEditDirtyState(isDirty: boolean): void {
    mediaEditIsDirty = isDirty;
    if (isElement($MODAL_MEDIA_EDIT)) {
      $MODAL_MEDIA_EDIT.setAttribute('data-dirty', String(isDirty));
    }
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
    return `${playlistKey}::${getMediaEditItemIdentity(mediaItem)}`;
  }

  function serializeMediaEditDraftStore(): void {
    try {
      const serialized = JSON.stringify(Object.fromEntries(mediaEditDraftStore));
      window.sessionStorage.setItem(MEDIA_EDIT_DRAFT_STORAGE_KEY, serialized);
    } catch (_error) {
      // Ignore storage failures and keep in-memory drafts only.
    }
  }

  function hydrateMediaEditDraftStore(): void {
    try {
      const raw = window.sessionStorage.getItem(MEDIA_EDIT_DRAFT_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw);
      if (!isObject(parsed) || Array.isArray(parsed)) {
        return;
      }
      Object.entries(parsed).forEach(([key, value]) => {
        if (!isObject(value) || Array.isArray(value)) {
          return;
        }
        const normalized = sanitizeMediaEditDraft({
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
        mediaEditDraftStore.set(key, normalized);
      });
    } catch (_error) {
      mediaEditDraftStore.clear();
    }
  }

  function setMediaEditDraftByKey(key: string, draft: MediaEditDraft): void {
    mediaEditDraftStore.set(key, cloneMediaEditDraft(draft));
    serializeMediaEditDraftStore();
  }

  function deleteMediaEditDraftByKey(key: string): void {
    mediaEditDraftStore.delete(key);
    serializeMediaEditDraftStore();
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
    }, {
      category: '',
      title: '',
      artist: '',
      description: '',
      volume: getDefaultVolume(),
      seekStart: null,
      seekEnd: null,
      fadeInEnd: null,
      fadeOutStart: null,
      thumbnailMode: 'keep',
      thumbnailName: '',
      thumbnailMime: '',
      thumbnailDataUrl: '',
    });
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
    const target = categoryName.trim();
    if (target === '' || !Array.isArray(AMP_STATUS.category)) {
      return null;
    }
    const index = AMP_STATUS.category.findIndex((name) => String(name).trim() === target);
    return index >= 0 ? index : null;
  }

  function getMediaEditWorkingCopyForSave(): MediaItem[] | null {
    if (!Array.isArray(AMP_STATUS.media) || !mediaEditActiveItem) {
      return null;
    }
    return AMP_STATUS.media.map((item: MediaItem) => ({ ...item }));
  }

  function applyDraftToMediaItem(item: MediaItem, draft: MediaEditDraft): MediaItem {
    const nextItem: MediaItem = { ...item };
    const fadeDurations = getMediaEditComputedFadeDurations(item, draft);
    const categoryIndex = findCategoryIndexByName(draft.category);
    if (categoryIndex !== null) {
      nextItem.catId = categoryIndex;
    }
    nextItem.title = draft.title;
    nextItem.artist = draft.artist || '';
    nextItem.desc = sanitizeMediaEditDescForStorage(draft.description || '', MEDIA_DESC_MAX_LENGTH);
    nextItem.volume = draft.volume;
    nextItem.start = draft.seekStart ?? '';
    nextItem.end = draft.seekEnd ?? '';
    nextItem.fadein = fadeDurations.fadein;
    nextItem.fadeout = fadeDurations.fadeout;

    if (draft.thumbnailMode === 'remove') {
      nextItem.image = '';
      nextItem.thumb = '';
    } else if (draft.thumbnailMode === 'upload' && draft.thumbnailName !== '') {
      nextItem.image = draft.thumbnailName;
      nextItem.thumb = '';
    }

    return nextItem;
  }

  async function uploadMediaEditThumbnailIfNeeded(draft: MediaEditDraft): Promise<{ ok: boolean; message: string }> {
    if (draft.thumbnailMode !== 'upload' || draft.thumbnailDataUrl === '' || draft.thumbnailName === '') {
      return { ok: true, message: '' };
    }

    if (!isLocalMode()) {
      return { ok: false, message: getLocalizedMessage('mediaEditThumbnailCloudOnly', 'Thumbnail upload is available only in local mode.') };
    }

    const base64Body = draft.thumbnailDataUrl.includes(',')
      ? draft.thumbnailDataUrl.split(',')[1] || ''
      : draft.thumbnailDataUrl;
    if (base64Body.trim() === '') {
      return { ok: false, message: getLocalizedMessage('mediaEditThumbnailInvalidData', 'Invalid image data.') };
    }

    try {
      const rawResponse = await fetch(`${BASE_URL}${MEDIA_EDIT_THUMBNAIL_ENDPOINT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: draft.thumbnailName,
          content: base64Body,
        }),
        credentials: 'same-origin',
      });
      const payload = await rawResponse.json().catch(() => null) as ApiResponse<{ message?: string }> | null;
      if (!payload || payload.state !== 'ok') {
        const message = payload?.data?.message || getLocalizedMessage('mediaEditThumbnailUploadFailed', 'Failed to save thumbnail image.');
        return { ok: false, message };
      }
      return { ok: true, message: payload.data?.message || '' };
    } catch (_error) {
      return { ok: false, message: getLocalizedMessage('mediaEditThumbnailUploadFailed', 'Failed to save thumbnail image.') };
    }
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

    try {
      const rawResponse = await fetch(`${BASE_URL}${MEDIA_EDIT_THUMBNAIL_ENDPOINT}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
        credentials: 'same-origin',
      });
      const payload = await rawResponse.json().catch(() => null) as ApiResponse<{ message?: string }> | null;
      if (!payload || payload.state !== 'ok') {
        const message = payload?.data?.message || getLocalizedMessage('mediaEditThumbnailDeleteFailed', 'Failed to delete thumbnail image.');
        return { ok: false, message };
      }
      return { ok: true, message: payload.data?.message || '' };
    } catch (_error) {
      return { ok: false, message: getLocalizedMessage('mediaEditThumbnailDeleteFailed', 'Failed to delete thumbnail image.') };
    }
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
      const rawResponse = await fetch(`${BASE_URL}${MEDIA_EDIT_SAVE_ENDPOINT}/${encodeURIComponent(playlistName)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payloadObject),
        credentials: 'same-origin',
      });
      const payload = await rawResponse.json().catch(() => null) as ApiResponse<{ message?: string }> | null;
      if (!payload || payload.state !== 'ok') {
        const message = payload?.data?.message || getLocalizedMessage('mediaEditSaveFailed', 'Failed to save media changes.');
        return { ok: false, message };
      }
      void workingMedia;
      return {
        ok: true,
        message: payload.data?.message || getLocalizedMessage('mediaEditSaveSuccess', 'Media changes were saved successfully.'),
      };
    } catch (_error) {
      return { ok: false, message: getLocalizedMessage('mediaEditSaveFailed', 'Failed to save media changes.') };
    }
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
    let categoryIndex = findCategoryIndexByName(draft.category);
    if (categoryIndex === null) {
      if (!Array.isArray(AMP_STATUS.category)) {
        AMP_STATUS.category = [];
      }
      AMP_STATUS.category.push(draft.category.trim());
      categoryIndex = AMP_STATUS.category.length - 1;
    }

    if (isElement($BUTTON_SAVE_MEDIA_EDIT)) {
      $BUTTON_SAVE_MEDIA_EDIT.disabled = true;
      $BUTTON_SAVE_MEDIA_EDIT.setAttribute('aria-busy', 'true');
    }

    const workingMedia = getMediaEditWorkingCopyForSave();
    if (!workingMedia) {
      if (isElement($BUTTON_SAVE_MEDIA_EDIT)) {
        $BUTTON_SAVE_MEDIA_EDIT.disabled = false;
        $BUTTON_SAVE_MEDIA_EDIT.removeAttribute('aria-busy');
      }
      return;
    }

    const targetIndex = workingMedia.findIndex((item) => item.amId === mediaEditActiveItem!.amId);
    if (targetIndex < 0) {
      if (isElement($BUTTON_SAVE_MEDIA_EDIT)) {
        $BUTTON_SAVE_MEDIA_EDIT.disabled = false;
        $BUTTON_SAVE_MEDIA_EDIT.removeAttribute('aria-busy');
      }
      return;
    }

    const uploadResult = await uploadMediaEditThumbnailIfNeeded(draft);
    if (!uploadResult.ok) {
      if (isElement($BUTTON_SAVE_MEDIA_EDIT)) {
        $BUTTON_SAVE_MEDIA_EDIT.disabled = false;
        $BUTTON_SAVE_MEDIA_EDIT.removeAttribute('aria-busy');
      }
      updateNotice({ type: 'error', message: uploadResult.message, delay: 2600 });
      return;
    }

    const deleteResult = await deleteMediaEditThumbnailIfNeeded(draft);
    if (!deleteResult.ok) {
      if (isElement($BUTTON_SAVE_MEDIA_EDIT)) {
        $BUTTON_SAVE_MEDIA_EDIT.disabled = false;
        $BUTTON_SAVE_MEDIA_EDIT.removeAttribute('aria-busy');
      }
      updateNotice({ type: 'error', message: deleteResult.message, delay: 2600 });
      return;
    }

    const targetMediaItem = workingMedia[targetIndex];
    if (!targetMediaItem) {
      if (isElement($BUTTON_SAVE_MEDIA_EDIT)) {
        $BUTTON_SAVE_MEDIA_EDIT.disabled = false;
        $BUTTON_SAVE_MEDIA_EDIT.removeAttribute('aria-busy');
      }
      return;
    }

    workingMedia[targetIndex] = applyDraftToMediaItem(targetMediaItem, draft);

    const previousMedia = AMP_STATUS.media;
    AMP_STATUS.media = workingMedia;
    const persistResult = await persistMediaEditForCurrentPlaylist(workingMedia);
    if (!persistResult.ok) {
      AMP_STATUS.media = previousMedia;
      if (isElement($BUTTON_SAVE_MEDIA_EDIT)) {
        $BUTTON_SAVE_MEDIA_EDIT.disabled = false;
        $BUTTON_SAVE_MEDIA_EDIT.removeAttribute('aria-busy');
      }
      updateNotice({ type: 'error', message: persistResult.message, delay: 2600 });
      return;
    }

    const draftKey = getMediaEditDraftKey(mediaEditActiveItem);
    deleteMediaEditDraftByKey(draftKey);
    mediaEditBaseDraft = createMediaEditBaseDraft(workingMedia[targetIndex]);
    setMediaEditDirtyState(false);
    clearCategory();
    updateCategory();
    syncMediaCategoryField();
    syncMediaEditCategoryClearButton();
    renderMediaEditCategoryOptions();
    updatePlaylist();
    if (AMP_STATUS.current === workingMedia[targetIndex].amId) {
      updatePlayStatus(workingMedia[targetIndex].amId);
    }
    if (isElement($BUTTON_SAVE_MEDIA_EDIT)) {
      $BUTTON_SAVE_MEDIA_EDIT.disabled = false;
      $BUTTON_SAVE_MEDIA_EDIT.removeAttribute('aria-busy');
    }
    updateNotice({
      type: 'success',
      message: persistResult.message || getLocalizedMessage('mediaEditSaveSuccess', 'Media changes were saved successfully.'),
      delay: 2200,
    });
    hideMediaEditModal(true);
  }

  function readMediaEditDraftFromForm(): MediaEditDraft {
    const fallback = mediaEditBaseDraft || {
      category: '',
      title: '',
      artist: '',
      description: '',
      volume: getDefaultVolume(),
      seekStart: null,
      seekEnd: null,
      fadeInEnd: null,
      fadeOutStart: null,
      thumbnailMode: 'keep',
      thumbnailName: '',
      thumbnailMime: '',
      thumbnailDataUrl: '',
    };
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
    if (!mediaEditActiveItem) {
      return false;
    }
    return mediaEditDraftStore.has(getMediaEditDraftKey(mediaEditActiveItem));
  }

  function syncMediaEditDraftStateFromForm(): void {
    if (!mediaEditActiveItem || !mediaEditBaseDraft) {
      return;
    }
    const currentDraft = readMediaEditDraftFromForm();
    const currentKey = getMediaEditDraftKey(mediaEditActiveItem);
    const isDirty = !isSameMediaEditDraft(currentDraft, mediaEditBaseDraft);
    if (isDirty) {
      setMediaEditDraftByKey(currentKey, currentDraft);
    } else {
      deleteMediaEditDraftByKey(currentKey);
    }
    setMediaEditDirtyState(isDirty);
  }

  function applyMediaEditDraftState(nextDraft: MediaEditDraft): void {
    if (!mediaEditActiveItem || !mediaEditBaseDraft) {
      return;
    }
    const currentKey = getMediaEditDraftKey(mediaEditActiveItem);
    const isDirty = !isSameMediaEditDraft(nextDraft, mediaEditBaseDraft);
    if (isDirty) {
      setMediaEditDraftByKey(currentKey, nextDraft);
    } else {
      deleteMediaEditDraftByKey(currentKey);
    }
    setMediaEditDirtyState(isDirty);
  }

  function discardActiveMediaEditDraft(): void {
    if (mediaEditActiveItem) {
      deleteMediaEditDraftByKey(getMediaEditDraftKey(mediaEditActiveItem));
    }
    setMediaEditDirtyState(false);
  }

  function clearMediaEditContext(): void {
    mediaEditActiveItem = null;
    mediaEditBaseDraft = null;
    mediaEditPreviewSourceItem = null;
    setMediaEditDirtyState(false);
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
    mediaEditActiveItem = mediaItem;
    mediaEditBaseDraft = createMediaEditBaseDraft(mediaItem);
    const draftKey = getMediaEditDraftKey(mediaItem);
    const sessionDraft = mediaEditDraftStore.get(draftKey) || null;
    const initialDraft = sessionDraft || mediaEditBaseDraft;
    applyMediaEditDraftToForm(initialDraft);
    setMediaEditDirtyState(!isSameMediaEditDraft(initialDraft, mediaEditBaseDraft));
    validateAndRenderMediaEditDraftFromForm();
  }

  hydrateMediaEditDraftStore();

  function isMediaEditModalVisible(): boolean {
    return isElement($MODAL_MEDIA_EDIT) && !$MODAL_MEDIA_EDIT.classList.contains('hidden');
  }

  function getMediaEditFocusableElements(): HTMLElement[] {
    if (!isElement($MODAL_MEDIA_EDIT)) {
      return [];
    }
    return Array.from(
      $MODAL_MEDIA_EDIT.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((elm) => !elm.hasAttribute('disabled'));
  }

  function trapMediaEditModalFocus(evt: KeyboardEvent): void {
    if (!isMediaEditModalVisible()) {
      return;
    }
    const focusableElements = getMediaEditFocusableElements();
    if (focusableElements.length === 0) {
      evt.preventDefault();
      $MODAL_MEDIA_EDIT?.focus();
      return;
    }
    const activeElement = document.activeElement as HTMLElement | null;
    const firstElement = focusableElements[0] || null;
    const lastElement = focusableElements[focusableElements.length - 1] || null;
    if (!firstElement || !lastElement) {
      evt.preventDefault();
      $MODAL_MEDIA_EDIT?.focus();
      return;
    }
    if (evt.shiftKey && activeElement === firstElement) {
      evt.preventDefault();
      lastElement.focus();
    } else if (!evt.shiftKey && activeElement === lastElement) {
      evt.preventDefault();
      firstElement.focus();
    }
  }

  function renderMediaEditSourceBadges(mediaItem: MediaItem): void {
    if (!isElement($MODAL_MEDIA_EDIT_ITEM_SOURCE)) {
      return;
    }
    $MODAL_MEDIA_EDIT_ITEM_SOURCE.innerHTML = '';

    const typeBadge = document.createElement('span');
    typeBadge.className = 'media-edit-source-badge media-edit-source-badge--type';

    if (mediaItem.videoid && mediaItem.videoid.trim() !== '') {
      typeBadge.textContent = getLocalizedMessage('mediaEditTypeYoutube', 'YouTube');
      const sourceBadge = document.createElement('span');
      sourceBadge.className = 'media-edit-source-badge';
      sourceBadge.textContent = mediaItem.videoid.trim();
      $MODAL_MEDIA_EDIT_ITEM_SOURCE.appendChild(typeBadge);
      $MODAL_MEDIA_EDIT_ITEM_SOURCE.appendChild(sourceBadge);
    } else if (mediaItem.file && mediaItem.file.trim() !== '') {
      const isAudio = /\.(mp3|aac|ogg|flac|wav|m4a|opus)(\?.*)?$/i.test(mediaItem.file);
      typeBadge.textContent = isAudio
        ? getLocalizedMessage('mediaEditTypeLocalAudio', 'Local audio')
        : getLocalizedMessage('mediaEditTypeLocalVideo', 'Local video');
      const sourceBadge = document.createElement('span');
      sourceBadge.className = 'media-edit-source-badge';
      sourceBadge.textContent = mediaItem.file.trim();
      $MODAL_MEDIA_EDIT_ITEM_SOURCE.appendChild(typeBadge);
      $MODAL_MEDIA_EDIT_ITEM_SOURCE.appendChild(sourceBadge);
    } else {
      typeBadge.textContent = getLocalizedMessage('mediaEditTypeUnknown', 'Unknown');
      $MODAL_MEDIA_EDIT_ITEM_SOURCE.appendChild(typeBadge);
    }

    const categoryName = getMediaCategoryName(mediaItem);
    if (categoryName !== '') {
      const catBadge = document.createElement('span');
      catBadge.className = 'media-edit-source-badge';
      catBadge.textContent = categoryName;
      $MODAL_MEDIA_EDIT_ITEM_SOURCE.appendChild(catBadge);
    }
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
    $MODAL_MEDIA_EDIT.classList.add('hidden');
    $MODAL_MEDIA_EDIT.setAttribute('aria-hidden', 'true');
    if (isElement($MODAL_MEDIA_EDIT_TITLE)) {
      $MODAL_MEDIA_EDIT_TITLE.textContent = defaultMediaEditModalTitle;
    }
    if (isElement($MODAL_MEDIA_EDIT_ITEM_TITLE)) {
      $MODAL_MEDIA_EDIT_ITEM_TITLE.textContent = '';
    }
    if (isElement($MODAL_MEDIA_EDIT_ITEM_SOURCE)) {
      $MODAL_MEDIA_EDIT_ITEM_SOURCE.innerHTML = '';
    }
    closeMediaEditCategoryDropdown(false);
    const restoreTarget = activeMediaEditTrigger;
    activeMediaEditTrigger = null;
    if (restoreFocus) {
      const preferredFocusId = isMediaPlaybackActive() ? AMP_STATUS.current : editedMediaId;
      if (!focusPlaylistItemById(preferredFocusId)) {
        restoreTarget?.focus();
      }
    }
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
    if (amId === null) {
      return false;
    }
    const targetElm = $LIST_PLAYLIST.querySelector(`a[data-playlist-item="${amId}"]`) as HTMLElement | null;
    if (!targetElm) {
      return false;
    }
    targetElm.focus();
    targetElm.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    return true;
  }

  function openMediaEditModal(mediaItem: MediaItem, trigger: HTMLElement): void {
    if (!isElement($MODAL_MEDIA_EDIT) || !isElement($MODAL_MEDIA_EDIT_TITLE)) {
      return;
    }
    const nextDraftKey = getMediaEditDraftKey(mediaItem);
    const activeDraftKey = mediaEditActiveItem ? getMediaEditDraftKey(mediaEditActiveItem) : null;
    if (activeDraftKey !== null && activeDraftKey !== nextDraftKey) {
      const canSwitch = confirmDiscardActiveMediaEditIfNeeded(
        getLocalizedMessage('mediaEditDiscardAndOpenAnother', 'Discard unsaved edits and open another item?')
      );
      if (!canSwitch) {
        return;
      }
    }
    activeMediaEditTrigger = trigger;
    closePlaylistModeMenu();
    if (isElement($MODAL_MEDIA_EDIT_ITEM_TITLE)) {
      $MODAL_MEDIA_EDIT_ITEM_TITLE.textContent = sanitizeMediaText(mediaItem.title || '', MEDIA_TITLE_MAX_LENGTH)
        || getLocalizedMessage('mediaEditUntitled', 'Untitled media');
    }
    renderMediaEditSourceBadges(mediaItem);
    bindMediaEditForm(mediaItem);
    if (playlistMode === 'edit') {
      updatePlaylist();
    }
    createMediaEditPreview(mediaItem);
    startMediaEditDurationSyncWaitIfNeeded();
    $MODAL_MEDIA_EDIT_TITLE.textContent = defaultMediaEditModalTitle;
    $MODAL_MEDIA_EDIT.classList.remove('hidden');
    $MODAL_MEDIA_EDIT.removeAttribute('aria-hidden');
    window.requestAnimationFrame(() => {
      (isElement($BUTTON_CLOSE_MEDIA_EDIT) ? $BUTTON_CLOSE_MEDIA_EDIT : $MODAL_MEDIA_EDIT)?.focus();
    });
  }

  function isDarkModeEnabled(): boolean {
    return isObject(AMP_STATUS.options) && AMP_STATUS.options?.dark ? !!AMP_STATUS.options.dark : false;
  }

  function getNoMediaImagePath(kind: 'placeholder' | 'thumb' = 'placeholder'): string {
    const suffix = isDarkModeEnabled() ? '-dark' : '';
    return `./views/images/no-media-${kind}${suffix}.svg`;
  }

  function getAmbientPlaceholderPath(): string {
    const suffix = isDarkModeEnabled() ? '-dark' : '';
    return `./views/images/ambient-placeholder${suffix}.svg`;
  }

  function updateNoMediaImageForTheme(image: HTMLImageElement): void {
    const name = basename(image.src);
    if (name === 'no-media-placeholder' || name === 'no-media-placeholder-dark') {
      image.src = getNoMediaImagePath('placeholder');
      image.removeAttribute('style');
    }
    if (name === 'no-media-thumb' || name === 'no-media-thumb-dark') {
      image.src = getNoMediaImagePath('thumb');
      image.removeAttribute('style');
    }
    if (name === 'ambient-placeholder' || name === 'ambient-placeholder-dark') {
      image.src = getAmbientPlaceholderPath();
      image.removeAttribute('style');
    }
  }

  function updateNoMediaImagesForTheme(): void {
    (document.querySelectorAll('img') as NodeListOf<HTMLImageElement>).forEach((image: HTMLImageElement) => {
      updateNoMediaImageForTheme(image);
    });
    (document.querySelectorAll('video#html-player') as NodeListOf<HTMLVideoElement>).forEach((video: HTMLVideoElement) => {
      const posterName = basename(video.poster || '');
      if (posterName === 'no-media-placeholder' || posterName === 'no-media-placeholder-dark') {
        video.poster = getNoMediaImagePath('placeholder');
      }
    });
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

  function isPlaylistInteractionLocked(): boolean {
    return playlistMode !== 'normal';
  }

  function canUseEditMode(): boolean {
    const ambientData = getAmbientData();
    if (!AMP_STATUS.playlist || getPlaylistItemsForCurrentView().length === 0) {
      return false;
    }
    if (ambientData?.isCloud === true) {
      return AMP_STATUS.playlist === MYPLAYLIST_NAME && localStorage.getItem(MYPLAYLIST_KEY) !== null;
    }
    return true;
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
    closePlaylistModeMenuView(playlistModeUi);
  }

  function togglePlaylistModeMenu(forceOpen = false): void {
    togglePlaylistModeMenuView(playlistModeUi, forceOpen);
  }

  function updatePlaylistModeUI(): void {
    syncPlaylistModeButton(playlistMode);
    updatePlaylistModeMenuState(
      playlistModeUi,
      playlistMode,
      canUseEditMode(),
      canUseReorderMode()
    );
  }

  function resetPlaylistOperationMode(): void {
    deleteSelectedIds.clear();
    resetReorderState();
    discardActiveMediaEditDraft();
    hideMediaEditModal(false);
    clearMediaEditContext();
    playlistMode = 'normal';
    updatePlaylistModeUI();
  }

  function syncPlaylistModeAvailability(visibleItemCount: number): void {
    if (!$BUTTON_PLAYLIST_MODE) return;
    const canUsePlaylistModes = visibleItemCount > 0 && (canUseEditMode() || canMutateCurrentPlaylist());
    if (!canUsePlaylistModes) {
      closePlaylistModeMenu();
      if (playlistMode !== 'normal') {
        resetPlaylistOperationMode();
      }
    }
    syncPlaylistModeAvailabilityButton($BUTTON_PLAYLIST_MODE, canUsePlaylistModes);
    updatePlaylistModeUI();
  }

  function setPlaylistMode(nextMode: PlaylistMode): void {
    if (nextMode === 'edit' && !canUseEditMode()) {
      closePlaylistModeMenu();
      updatePlaylistModeUI();
      return;
    }
    if (nextMode !== 'normal' && nextMode !== 'edit' && !canMutateCurrentPlaylist()) {
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
    if (playlistMode === 'edit' && nextMode !== 'edit') {
      if (!confirmDiscardActiveMediaEditIfNeeded()) {
        closePlaylistModeMenu();
        updatePlaylistModeUI();
        return;
      }
      hideMediaEditModal(false);
      clearMediaEditContext();
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
          playlistConfirmModal.open(title, body, () => {
            void commitDeleteSelections();
          }, () => {
            if (playlistMode === 'reorder') {
              reorderWorkingIds = [...reorderInitialIds];
              updatePlaylist();
            }
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
          playlistConfirmModal.open(title, body, () => {
            applyReorderChanges();
            playlistMode = 'normal';
            updatePlaylistModeUI();
            updatePlaylist();
          }, () => {
            if (playlistMode === 'reorder') {
              reorderWorkingIds = [...reorderInitialIds];
              updatePlaylist();
            }
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
        if (nextMode === 'normal' || nextMode === 'edit' || nextMode === 'reorder' || nextMode === 'delete') {
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
  const playlistConfirmModal = createPlaylistConfirmModalController({
    modal: $MODAL_PLAYLIST_CONFIRM,
    title: $MODAL_PLAYLIST_CONFIRM_TITLE,
    body: $MODAL_PLAYLIST_CONFIRM_BODY,
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
    reorderWorkingIds = readPlaylistItemIdsFromDom($LIST_PLAYLIST);
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
      playlistConfirmModal.apply();
    });
  }

  if ($BTN_PLAYLIST_CONFIRM_CANCEL) {
    $BTN_PLAYLIST_CONFIRM_CANCEL.addEventListener('click', () => {
      playlistConfirmModal.cancel();
    });
  }

  if ($MODAL_PLAYLIST_CONFIRM) {
    $MODAL_PLAYLIST_CONFIRM.addEventListener('click', (evt: MouseEvent) => {
      const target = evt.target;
      const isBackdrop = target instanceof HTMLElement &&
        target.parentElement === $MODAL_PLAYLIST_CONFIRM &&
        target.getAttribute('aria-hidden') === 'true';
      if (target === $MODAL_PLAYLIST_CONFIRM || isBackdrop) {
        playlistConfirmModal.cancel();
      }
    });
  }

  // Process global data passed by the system.
  // In cloud mode: load MyPlaylist from localStorage before processing server data.
  // (Placed here, AFTER DOM constants, to avoid const temporal dead zone issues.)
  const savedPlaylistContext = getSavedPlaylistContext();
  ensureCloudMyPlaylistSeed();
  ensureMyPlaylistOptionFromStorage();
  if ((window as any).AmbientData) {
    const ambientData: AmbientData = (window as any).AmbientData;
    if (
      savedPlaylistContext &&
      (!ambientData.isCloud || savedPlaylistContext.playlist === MYPLAYLIST_NAME) &&
      isPlaylistAvailableForResume(savedPlaylistContext.playlist)
    ) {
      requestCategoryResume(savedPlaylistContext.category);
      requestMediaResume(savedPlaylistContext.media);
      selectPlaylistOption(savedPlaylistContext.playlist);
      void getPlaylistData(savedPlaylistContext.playlist);
    } else {
      const playlistCount = Object.keys(ambientData.playlists || {}).length;
      const shouldAutoloadMyPlaylist = ambientData?.isCloud === true &&
        localStorage.getItem(MYPLAYLIST_KEY) !== null;
      if (shouldAutoloadMyPlaylist) {
        initMyPlaylistFromStorage();
        releaseAppBootGate();
      } else if (ambientData.hasOwnProperty('currentPlaylist')) {
        // If there is only one playlist, load immediately.
        const currentPlaylist = ambientData.currentPlaylist as string;
        void getPlaylistData(currentPlaylist);
      } else if (ambientData.hasOwnProperty('playlists') && playlistCount > 1) {
        // If there are multiple playlists, do nothing yet.
        releaseAppBootGate();
      } else {
        releaseAppBootGate();
      }
    }
  } else {
    releaseAppBootGate();
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

  if (isElement($BUTTON_CLOSE_OPTIONS)) {
    $BUTTON_CLOSE_OPTIONS.addEventListener('click', () => {
      restoreOptionsTriggerFocus();
    }, true);
  }

  function isOptionsModalVisible(): boolean {
    return optionsModal.isVisible();
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
    optionsModal.cleanupBackdrops();
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
      optionsModal.handleBackdropPointerDown(evt);
    });

    $MODAL_OPTIONS.addEventListener('click', (evt: Event) => {
      optionsModal.handleBackdropClick(evt, restoreOptionsTriggerFocus);
    });
  }

  (document.getElementById('link-open-playlist-management-category') as HTMLAnchorElement | null)
    ?.addEventListener('click', (evt: Event) => {
      evt.preventDefault();
      openPlaylistManagementCategoryCreate();
    });

  document.addEventListener('keydown', (evt: KeyboardEvent) => {
    if (evt.key === 'Escape' && isMediaEditModalVisible() && isMediaEditCategoryDropdownVisible()) {
      evt.preventDefault();
      closeMediaEditCategoryDropdown(true);
      return;
    }
    if (evt.key === 'Escape' && isMediaEditModalVisible()) {
      evt.preventDefault();
      closeMediaEditModal(true);
      return;
    }
    if (evt.key === 'Tab' && isMediaEditModalVisible()) {
      trapMediaEditModalFocus(evt);
      return;
    }
    if (evt.key === 'Escape' && isOptionsModalVisible()) {
      hideOptionsModal();
      restoreOptionsTriggerFocus();
    } else if (evt.key === 'Escape' && playlistDescModal.isOpen()) {
      playlistDescModal.close(true);
    }
  });

  if (isElement($BUTTON_CLOSE_PLAYLIST_DESC)) {
    $BUTTON_CLOSE_PLAYLIST_DESC.addEventListener('click', (evt: Event) => {
      evt.preventDefault();
      playlistDescModal.close(true);
    });
  }

  if (isElement($BUTTON_CLOSE_MEDIA_EDIT)) {
    $BUTTON_CLOSE_MEDIA_EDIT.addEventListener('click', (evt: Event) => {
      evt.preventDefault();
      closeMediaEditModal(true);
    });
  }

  if (isElement($BUTTON_CANCEL_MEDIA_EDIT)) {
    $BUTTON_CANCEL_MEDIA_EDIT.addEventListener('click', (evt: Event) => {
      evt.preventDefault();
      cancelMediaEditModal(true);
    });
  }

  if (isElement($BUTTON_SAVE_MEDIA_EDIT)) {
    $BUTTON_SAVE_MEDIA_EDIT.addEventListener('click', async (evt: Event) => {
      evt.preventDefault();
      await saveMediaEdit();
    });
  }

  if (isElement($FORM_MEDIA_EDIT)) {
    $FORM_MEDIA_EDIT.addEventListener('submit', (evt: Event) => {
      evt.preventDefault();
    });
  }

  if (isElement($BUTTON_MEDIA_EDIT_CATEGORY_TOGGLE)) {
    $BUTTON_MEDIA_EDIT_CATEGORY_TOGGLE.addEventListener('click', (evt: Event) => {
      evt.preventDefault();
      if (isMediaEditCategoryDropdownVisible()) {
        closeMediaEditCategoryDropdown(true);
      } else {
        openMediaEditCategoryDropdown();
        $MEDIA_EDIT_CATEGORY?.focus();
      }
    });
  }

  if (isElement($BUTTON_MEDIA_EDIT_CATEGORY_CLEAR) && isElement($MEDIA_EDIT_CATEGORY)) {
    $BUTTON_MEDIA_EDIT_CATEGORY_CLEAR.addEventListener('click', (evt: Event) => {
      evt.preventDefault();
      $MEDIA_EDIT_CATEGORY.value = '';
      syncMediaEditCategoryClearButton();
      if (isMediaEditCategoryDropdownVisible()) {
        renderMediaEditCategoryOptions();
      }
      $MEDIA_EDIT_CATEGORY.dispatchEvent(new Event('input', { bubbles: true }));
      $MEDIA_EDIT_CATEGORY.dispatchEvent(new Event('change', { bubbles: true }));
      $MEDIA_EDIT_CATEGORY.focus();
    });
  }

  if (isElement($MEDIA_EDIT_CATEGORY)) {
    $MEDIA_EDIT_CATEGORY.addEventListener('keydown', (evt: KeyboardEvent) => {
      if (evt.key === 'ArrowDown') {
        evt.preventDefault();
        openMediaEditCategoryDropdown();
      }
    });
    $MEDIA_EDIT_CATEGORY.addEventListener('input', () => {
      syncMediaEditCategoryClearButton();
      if (isMediaEditCategoryDropdownVisible()) {
        renderMediaEditCategoryOptions();
      }
    });
  }

  document.addEventListener('pointerdown', (evt: PointerEvent) => {
    if (!isMediaEditCategoryDropdownVisible() || !isElement($MEDIA_EDIT_CATEGORY_COMBOBOX)) {
      return;
    }
    const target = evt.target;
    if (target instanceof Node && !$MEDIA_EDIT_CATEGORY_COMBOBOX.contains(target)) {
      closeMediaEditCategoryDropdown(false);
    }
  });

  [$MEDIA_EDIT_CATEGORY, $MEDIA_EDIT_TITLE, $MEDIA_EDIT_ARTIST, $MEDIA_EDIT_DESCRIPTION]
    .forEach((field) => {
      if (!field) {
        return;
      }
      field.addEventListener('input', () => {
        syncMediaEditDraftStateFromForm();
        validateAndRenderMediaEditDraftFromForm();
      });
      field.addEventListener('change', () => {
        syncMediaEditDraftStateFromForm();
        validateAndRenderMediaEditDraftFromForm();
      });
    });

  if (isElement($MEDIA_EDIT_VOLUME)) {
    $MEDIA_EDIT_VOLUME.addEventListener('input', () => {
      const normalized = readMediaEditDraftFromForm();
      syncVolumeSlider({
        input: $MEDIA_EDIT_VOLUME,
        volume: normalized.volume,
        syncRangeProgress,
        display: $MEDIA_EDIT_VOLUME_VALUE,
      });
      syncMediaEditDraftStateFromForm();
      validateAndRenderMediaEditDraftFromForm();
    });
    $MEDIA_EDIT_VOLUME.addEventListener('blur', () => {
      const normalized = readMediaEditDraftFromForm();
      syncVolumeSlider({
        input: $MEDIA_EDIT_VOLUME,
        volume: normalized.volume,
        syncRangeProgress,
        display: $MEDIA_EDIT_VOLUME_VALUE,
      });
      syncMediaEditDraftStateFromForm();
      validateAndRenderMediaEditDraftFromForm();
    });
  }

  [$MEDIA_EDIT_SEEK_START, $MEDIA_EDIT_SEEK_END, $MEDIA_EDIT_FADEIN_END, $MEDIA_EDIT_FADEOUT_START]
    .forEach((field) => {
      if (!field) {
        return;
      }
      field.addEventListener('input', () => {
        sanitizeMediaEditTimingInputField(field);
        syncMediaEditTimingDisplay();
        syncMediaEditDraftStateFromForm();
        validateAndRenderMediaEditDraftFromForm();
      });
      field.addEventListener('change', () => {
        sanitizeMediaEditTimingInputField(field);
        syncMediaEditTimingDisplay();
        syncMediaEditDraftStateFromForm();
        validateAndRenderMediaEditDraftFromForm();
      });
      field.addEventListener('blur', () => {
        field.value = toMediaEditTimingInputValue(parseMediaTimeToIntegerSeconds(field.value));
        syncMediaEditTimingDisplay();
        syncMediaEditDraftStateFromForm();
        validateAndRenderMediaEditDraftFromForm();
      });
    });

  document.querySelectorAll('.media-edit-timing-stepper-btn').forEach((elm) => {
    if (!(elm instanceof HTMLButtonElement)) {
      return;
    }
    elm.addEventListener('click', (evt: Event) => {
      evt.preventDefault();
      const targetId = elm.dataset['target'] || '';
      if (targetId === '') {
        return;
      }
      const targetField = document.getElementById(targetId);
      if (!(targetField instanceof HTMLInputElement)) {
        return;
      }
      const direction: 1 | -1 = elm.dataset['stepDir'] === 'down' ? -1 : 1;
      stepMediaEditTimingField(targetField, direction);
    });
  });

  if (isElement($BUTTON_MEDIA_EDIT_SYNC_SEEK_START)) {
    $BUTTON_MEDIA_EDIT_SYNC_SEEK_START.addEventListener('click', () => {
      syncMediaEditTimingFieldFromPreview($MEDIA_EDIT_SEEK_START, 'seek start');
    });
  }

  if (isElement($BUTTON_MEDIA_EDIT_SYNC_SEEK_END)) {
    $BUTTON_MEDIA_EDIT_SYNC_SEEK_END.addEventListener('click', () => {
      syncMediaEditTimingFieldFromPreview($MEDIA_EDIT_SEEK_END, 'seek end');
    });
  }

  if (isElement($BUTTON_MEDIA_EDIT_SYNC_FADEIN_END)) {
    $BUTTON_MEDIA_EDIT_SYNC_FADEIN_END.addEventListener('click', () => {
      syncMediaEditTimingFieldFromPreview($MEDIA_EDIT_FADEIN_END, 'fade-in end');
    });
  }

  if (isElement($BUTTON_MEDIA_EDIT_SYNC_FADEOUT_START)) {
    $BUTTON_MEDIA_EDIT_SYNC_FADEOUT_START.addEventListener('click', () => {
      syncMediaEditTimingFieldFromPreview($MEDIA_EDIT_FADEOUT_START, 'fade-out start');
    });
  }

  if (isElement($BUTTON_MEDIA_EDIT_PREVIEW_RETRY)) {
    $BUTTON_MEDIA_EDIT_PREVIEW_RETRY.addEventListener('click', () => {
      if (!mediaEditPreviewSourceItem) {
        return;
      }
      createMediaEditPreview(mediaEditPreviewSourceItem);
    });
  }

  if (isElement($BUTTON_MEDIA_EDIT_THUMBNAIL_PICK) && isElement($MEDIA_EDIT_THUMBNAIL_INPUT)) {
    $BUTTON_MEDIA_EDIT_THUMBNAIL_PICK.addEventListener('click', () => {
      $MEDIA_EDIT_THUMBNAIL_INPUT.click();
    });
  }

  if (isElement($MEDIA_EDIT_THUMBNAIL_INPUT)) {
    $MEDIA_EDIT_THUMBNAIL_INPUT.addEventListener('change', () => {
      const file = $MEDIA_EDIT_THUMBNAIL_INPUT.files?.[0] || null;
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
        $MEDIA_EDIT_THUMBNAIL_INPUT.value = '';
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
      $MEDIA_EDIT_THUMBNAIL_INPUT.value = '';
    });
  }

  if (isElement($BUTTON_MEDIA_EDIT_THUMBNAIL_REMOVE) || isElement($BUTTON_MEDIA_EDIT_THUMBNAIL_CLEAR)) {
    const removeHandler = (): void => {
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
    };

    if (isElement($BUTTON_MEDIA_EDIT_THUMBNAIL_REMOVE)) {
      $BUTTON_MEDIA_EDIT_THUMBNAIL_REMOVE.addEventListener('click', removeHandler);
    }
    if (isElement($BUTTON_MEDIA_EDIT_THUMBNAIL_CLEAR)) {
      $BUTTON_MEDIA_EDIT_THUMBNAIL_CLEAR.addEventListener('click', removeHandler);
    }
  }

  if (isElement($MODAL_PLAYLIST_DESC_BACKDROP)) {
    $MODAL_PLAYLIST_DESC_BACKDROP.addEventListener('click', (evt: Event) => {
      evt.preventDefault();
      playlistDescModal.close(false);
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
    let items: MediaItem[] = [];
    if (!AMP_STATUS.hasOwnProperty('ctg') || AMP_STATUS.ctg === null || Number(AMP_STATUS.ctg) === -1) {
      items = AMP_STATUS.media || [];
    } else {
      items = (AMP_STATUS.media || []).filter((item: MediaItem) => item.catId === AMP_STATUS.ctg);
    }
    const isNoMedia = items.length === 0;
    syncPlaylistModeAvailability(items.length);

    // Enable playlist download
    const $BUTTON_DOWNLOAD_PLAYLIST = document.getElementById('btn-download-playlist') as HTMLButtonElement;
    setAtts($BUTTON_DOWNLOAD_PLAYLIST, { disabled: '' }, true);

    syncPlaylistEmptyState($LIST_NO_MEDIA, isNoMedia, () => closePlaylistModeMenu());
    if (isNoMedia) {
      return;
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
      const ambientData = (window as any).AmbientData as AmbientData;
      const itemElm = createPlaylistItemElement({
        item,
        isCurrent: AMP_STATUS.current !== null && AMP_STATUS.current === item.amId,
        mode: playlistMode,
        isDeleteSelected: deleteSelectedIds.has(item.amId),
        isEditSelected: mediaEditActiveItem?.amId === item.amId,
        format: getOption('playlist'),
        imageDir: ambientData?.imageDir || null,
        fallbackThumbPath: getNoMediaImagePath('thumb'),
        resolveYoutubeThumbnailUrl: getYoutubeThumbnailURL,
        trimTitle: (value: string) => mb_strimwidth(value, 0, 50, '...'),
        formatLabel: filterText,
      });
      $LIST_PLAYLIST.appendChild(itemElm);
    });

    ensurePlaylistSortable();

    // Append "[+] Add media" item at the bottom of the playlist
    // Hidden in cloud mode for existing JSON playlists (read-only)
    // and hidden when playlist operation mode is not normal.
    if (canMutateCurrentPlaylist() && playlistMode === 'normal') {
      const registerBtn = document.getElementById('btn-add-media-from-drawer');
      const registerText = (registerBtn?.dataset['label'] || registerBtn?.innerText || 'Register media').trim();
      const addItemElm = createPlaylistQuickAddElement({
        registerText,
        onClick: (evt: Event) => {
        evt.preventDefault();
        const activeCatId = (AMP_STATUS.ctg !== undefined && AMP_STATUS.ctg !== null && Number(AMP_STATUS.ctg) >= 0)
          ? Number(AMP_STATUS.ctg)
          : null;
        openMediaManagement(activeCatId);
        },
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
    applyPlaylistBackground({
      body: $BODY,
      menu: $MENU,
      imageDir: ambientData?.imageDir,
      backgroundImage: optionState.backgroundImage,
    });

    if (optionState.hasRandom) {
      AMP_STATUS.order = optionState.randomEnabled ? 'random' : 'normal';
    }

    if (optionState.hasShuffle && optionState.shuffleEnabled) {
      AMP_STATUS.shuffle = [];
      changeToggleShuffle();
    }

    if (optionState.hasSeek) {
      changeToggleSeekplay();
    }

    if (optionState.hasFader) {
      changeToggleFader();
    }

    AMP_STATUS.volume = optionState.volume;
    changeRangeVolume();
    syncMediaVolumeField();

    if (optionState.hasDark) {
      if (AMP_STATUS.options) {
        AMP_STATUS.options.dark = optionState.darkEnabled;
      }
    }

    changeToggleDarkmode();
    setFullWindowMode(optionState.fullWindowEnabled, false);
  }

  /**
   * Clear and initialize the carousel display.
   */
  function clearCarousel(): void {
    renderEmptyCarousel({
      wrapper: $CAROUSEL_WRAPPER,
      prevButton: $CAROUSEL_PREV,
      nextButton: $CAROUSEL_NEXT,
      placeholderImage: getNoMediaImagePath('placeholder'),
    });
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

    renderCarouselItems({
      wrapper: $CAROUSEL_WRAPPER,
      prevButton: $CAROUSEL_PREV,
      nextButton: $CAROUSEL_NEXT,
      currentId: AMP_STATUS.current,
      itemIds: items,
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
    updateMediaCaptionView({
      mediaData,
      captionElement: $MEDIA_CAPTION,
      sanitizeTitle: (value: string) => sanitizeMediaText(value, MEDIA_TITLE_MAX_LENGTH),
      sanitizeArtist: (value: string) => sanitizeMediaText(value, MEDIA_ARTIST_MAX_LENGTH),
      onUpdated: toggleMarqueeCaption,
    });
  }

  /**
   * Toggle caption marqueeing depending on window size.
   */
  function toggleMarqueeCaption(): void {
    syncCaptionMarquee($BODY, $MEDIA_CAPTION, currentWindowSize.width);
  }

  /**
   * Returns true when player is shown as full-window.
   */
  function isFullWindowMode(): boolean {
    return isFullWindowModeView($BODY);
  }

  /**
   * Sync icon pair of full-window toggle button.
   */
  function syncWindowFullButtonIcons(enabled: boolean): void {
    syncWindowFullButtonState($BUTTON_WINDOW_FULL, enabled);
  }

  /**
   * Toggle full-window mode and synchronize controls from drawer and bottom menu.
   * @param closeDrawers When true, auto-close any open drawers (only for bottom-menu trigger).
   */
  function setFullWindowMode(enabled: boolean, syncOption = true, closeDrawers = false): void {
    applyFullWindowMode({
      body: $BODY,
      enabled,
      toggleInput: toggleWindowFullInput,
      closeDrawers,
      shouldAutoCloseDrawers: currentWindowSize.width < currentWindowSize.minFullUIWidth,
      playlistDrawer: $DRAWER_PLAYLIST,
      settingsDrawer: $DRAWER_SETTINGS,
      playlistCloseButton: document.getElementById('btn-close-playlist') as HTMLElement | null,
      settingsCloseButton: document.getElementById('btn-close-settings') as HTMLElement | null,
    });

    if (syncOption) {
      setPlaylistOption(AMP_STATUS, 'fullwindow', enabled);
      persistMyPlaylistIfNeeded();
    }

    syncWindowFullButtonIcons(enabled);
    updateWindowSize();
    toggleMarqueeCaption();
    refreshViewportMetricsAfter(240);
  }

  /**
   * Synchronize the bottom menu minimize button icon and state.
   */
  function syncMenuCollapseButton(minimized: boolean): void {
    syncMenuCollapseButtonState($BUTTON_MENU_COLLAPSE, minimized);
  }

  /**
   * Toggle bottom menu minimized state.
   */
  function setMenuMinimized(minimized: boolean): void {
    applyMenuMinimizedState({
      body: $BODY,
      menu: $MENU,
      minimized,
      syncButtonState: syncMenuCollapseButton,
      afterToggle: toggleMarqueeCaption,
    });
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
    const selectElm = evt.target as HTMLSelectElement;
    const newPlaylist = selectElm.value;
    let oldPlaylist: string | null = null;
    if (AMP_STATUS.hasOwnProperty('playlist')) {
      oldPlaylist = AMP_STATUS.playlist;
    }
    if (oldPlaylist !== newPlaylist) {
      if (playlistMode !== 'normal') {
        if (playlistMode === 'edit' && !confirmDiscardActiveMediaEditIfNeeded()) {
          selectElm.value = oldPlaylist || '';
          return;
        }
        deleteSelectedIds.clear();
        resetReorderState();
        if (playlistMode === 'edit') {
          hideMediaEditModal(false);
          clearMediaEditContext();
        }
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
    const selectElm = evt.target as HTMLSelectElement;
    let oldCtgId: number | null = null;
    if (AMP_STATUS.hasOwnProperty('ctg') && AMP_STATUS.ctg !== null) {
      oldCtgId = AMP_STATUS.ctg;
    }
    const newCtgId = Number(selectElm.value);
    if (oldCtgId !== newCtgId) {
      if (playlistMode !== 'normal') {
        if (playlistMode === 'edit' && !confirmDiscardActiveMediaEditIfNeeded()) {
          selectElm.value = oldCtgId !== null ? String(oldCtgId) : '-1';
          return;
        }
        deleteSelectedIds.clear();
        resetReorderState();
        if (playlistMode === 'edit') {
          hideMediaEditModal(false);
          clearMediaEditContext();
        }
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
    const descPayload = getPlaylistDescriptionPayload(target);
    if (descPayload) {
      evt.preventDefault();
      evt.stopPropagation();
      playlistDescModal.open(
        descPayload.titleText,
        descPayload.artistText,
        descPayload.descText,
        descPayload.trigger
      );
      return;
    }

    if (!target) {
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
    if (playlistMode === 'edit') {
      const amId = Number(itemElm.getAttribute('data-playlist-item'));
      const mediaItem = AMP_STATUS.media?.find((item: MediaItem) => item.amId === amId) || null;
      if (mediaItem) {
        openMediaEditModal(mediaItem, itemElm);
      }
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
    const descPayload = getPlaylistDescriptionPayload(target);
    if (!descPayload) {
      return;
    }
    if (evt.key === 'Enter' || evt.key === ' ') {
      evt.preventDefault();
      playlistDescModal.open(
        descPayload.titleText,
        descPayload.artistText,
        descPayload.descText,
        descPayload.trigger
      );
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

  toggleWindowFullInput?.addEventListener('change', (evt: Event) => {
    setFullWindowMode((evt.target as HTMLInputElement).checked);
  });

  if (isElement($BUTTON_MENU_COLLAPSE)) {
    $BUTTON_MENU_COLLAPSE.addEventListener('click', (_evt: Event) => {
      setMenuMinimized(!$MENU.classList.contains('menu-minimized'));
    });
  }

  /**
   * Toggle the display of player controls button after media loaded.
   */
  function togglePlayerControllButtons(): void {
    syncPlaybackButtons($BUTTON_PLAY, $BUTTON_PAUSE, AMP_STATUS.media !== null && AMP_STATUS.media.length > 0);
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
    showPlaybackPauseState($BUTTON_PLAY, $BUTTON_PAUSE);
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
      syncPlaybackButtons($BUTTON_PLAY, $BUTTON_PAUSE, false);
    }

    // Toggle this button shown.
    showPlaybackPlayState($BUTTON_PLAY, $BUTTON_PAUSE);
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

  const toggleLoopInput = getToggleInput($TOGGLE_LOOP);
  const toggleRandomlyInput = getToggleInput($TOGGLE_RANDOMLY);
  const toggleShuffleInput = getToggleInput($TOGGLE_SHUFFLE);
  const toggleSeekplayInput = getToggleInput($TOGGLE_SEEKPLAY);
  const toggleFaderInput = getToggleInput($TOGGLE_FADER);
  const toggleDarkmodeInput = getToggleInput($TOGGLE_DARKMODE);

  /**
   * Event listener when changing the loop play of settings menu toggle button.
   */
  toggleLoopInput?.addEventListener('change', (evt: Event) => {
    AMP_STATUS.loop = (evt.target as HTMLInputElement).checked;
  });

  /**
   * Event listener when changing the randomly of settings menu toggle button.
   */
  toggleRandomlyInput?.addEventListener('change', (evt: Event) => {
    AMP_STATUS.order = (evt.target as HTMLInputElement).checked ? 'random' : 'normal';
  });

  /**
   * Toggle the randomly of settings menu toggle button.
   */
  function changeToggleRandomly(): void {
    syncToggleRoot($TOGGLE_RANDOMLY, AMP_STATUS.order === 'random');
  }

  /**
   * Event listener when changing the shuffle play of settings menu toggle button.
   */
  toggleShuffleInput?.addEventListener('change', (evt: Event) => {
    setPlaylistOption(AMP_STATUS, 'shuffle', (evt.target as HTMLInputElement).checked);
    AMP_STATUS.shuffle = shufflePlaylist();
    persistMyPlaylistIfNeeded();
  });

  /**
   * Toggle the shuffle play of settings menu toggle button.
   */
  function changeToggleShuffle(): void {
    syncToggleRoot($TOGGLE_SHUFFLE, !!(AMP_STATUS.options && AMP_STATUS.options.shuffle));
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
  toggleSeekplayInput?.addEventListener('change', (evt: Event) => {
    setPlaylistOption(AMP_STATUS, 'seek', (evt.target as HTMLInputElement).checked);
    persistMyPlaylistIfNeeded();
  });

  /**
   * Toggle the seekplay of settings menu toggle button.
   */
  function changeToggleSeekplay(): void {
    syncToggleRoot($TOGGLE_SEEKPLAY, !!(AMP_STATUS.options && AMP_STATUS.options.seek));
  }

  /**
   * Event listener when changing the pseudo fader of settings menu toggle button.
   */
  toggleFaderInput?.addEventListener('change', (evt: Event) => {
    setPlaylistOption(AMP_STATUS, 'fader', (evt.target as HTMLInputElement).checked);
    persistMyPlaylistIfNeeded();
  });

  /**
   * Toggle the pseudo fader of settings menu toggle button.
   */
  function changeToggleFader(): void {
    syncToggleRoot($TOGGLE_FADER, !!(AMP_STATUS.options && AMP_STATUS.options.fader));
  }

  /**
   * Event listener when inputting the volume of settings menu range slider.
   */
  $RANGE_VOLUME.addEventListener('input', (evt: Event) => {
    const currentVolume = normalizeVolume((evt.target as HTMLInputElement).value);
    syncVolumeSlider({
      input: evt.target as HTMLInputElement,
      volume: currentVolume,
      syncRangeProgress,
      display: document.getElementById('default-volume-value') as HTMLElement | null,
    });
  });

  $RANGE_VOLUME.addEventListener('change', (evt: Event) => {
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
  });

  /**
   * Fires an input event of range slider when was changed default playback volume.
   */
  function changeRangeVolume(): void {
    const currentVolume = normalizeVolume(AMP_STATUS.volume, getDefaultVolume());
    syncVolumeSlider({
      input: $RANGE_VOLUME,
      volume: currentVolume,
      syncRangeProgress,
      display: document.getElementById('default-volume-value') as HTMLElement | null,
    });
  }

  /**
   * Event listener when changing the darkmode of settings menu toggle button.
   */
  toggleDarkmodeInput?.addEventListener('change', (evt: Event) => {
    setPlaylistOption(AMP_STATUS, 'dark', (evt.target as HTMLInputElement).checked);
    // Delay dark class toggle to let the knob slide animation complete (~150ms)
    setTimeout(() => changeToggleDarkmode(), 200);
    persistMyPlaylistIfNeeded();
  });

  /**
   * Toggle the darkmode of settings menu toggle button.
   */
  function changeToggleDarkmode(): void {
    const isDarkmode = isObject(AMP_STATUS.options) && AMP_STATUS.options?.dark ? !!AMP_STATUS.options.dark : false;
    applyDarkModeAppearance({
      enabled: isDarkmode,
      toggleInput: toggleDarkmodeInput,
      updateNoMediaImagesForTheme,
      setStyles,
    });
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
    const { prevId, nextId } = resolvePlaybackNeighborIds({
      currentId: currentAmId,
      candidateIds: idCandidates,
      order: AMP_STATUS.order,
    });
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

    const messagePrefix = getLocalizedMessage(
      'mediaLoadFailedPrefix',
      'Media could not be loaded: '
    );
    updateNotice({
      type: 'error',
      message: `${escapeHTML(messagePrefix)}${escapeHTML(title)}`,
      delay: 6000,
    });
  }

  function playItem(object: HTMLElement | null = null, id: number | null = null): void {
    const thisElm = isElement(object) ? (object as HTMLElement) : null;
    const amId = id !== null ? id : Number((thisElm as any)?.dataset?.playlistItem || 0);
    const mediaData = (AMP_STATUS.media || []).filter((item: MediaItem) => item.amId === amId).shift();

    if (!mediaData) return;

    const playbackPlan = resolvePlaybackSetupPlan({
      mediaData,
      getExtension: getExt,
    });

    logger('playItem:', amId, playbackPlan.src, playbackPlan.kind);
    updatePlayStatus(amId);

    closeResponsiveDrawers({
      playlistCloseButton: document.getElementById('btn-close-playlist') as HTMLButtonElement | null,
      settingsCloseButton: document.getElementById('btn-close-settings') as HTMLButtonElement | null,
    }, currentWindowSize.width, currentWindowSize.minFullUIWidth);

    if (playbackPlan.kind === 'missing') {
      reportMediaPlaybackIssue(mediaData, 'media_source_missing', {
        currentPlaylist: AMP_STATUS.playlist || '',
        currentCategory: AMP_STATUS.ctg,
      });
      return;
    }

    setupPlayer(playbackPlan.kind, playbackPlan.src, mediaData, playbackPlan.extension);
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
    abortPlaybackTimers();
    // update media caption.
    updateMediaCaption(mediaData);

    if (setupKind === 'youtube') {
      AMP_STATUS.playertype = 'youtube';
      AMP_STATUS.yt_error = '';
      createYTPlayer(mediaData);
      return;
    }

    if (setupKind === 'audio' || setupKind === 'video') {
      emitYouTubeSignal('inactive');
      AMP_STATUS.playertype = setupKind;
      createPlayerTag(setupKind, mediaData);
      return;
    }

    if (setupKind === 'unsupported_html') {
      emitYouTubeSignal('inactive');
      AMP_STATUS.playertype = null;
      reportMediaPlaybackIssue(mediaData, 'unsupported_file_format', {
        src,
        extension: extension || getExt(src || ''),
      });
      return;
    }

    AMP_STATUS.playertype = null;
    emitYouTubeSignal('error', 'unsupported_player_specified');
    reportMediaPlaybackIssue(mediaData, 'unsupported_player_specified', {
      src,
      type: setupKind,
    });
  }

  /**
   * Event handler that is called when the YouTube player is ready to play.
   */
  function onPlayerReady(event: any): void {
    emitYouTubeSignal('player_ready');
    showYouTubePlayerWrapper($EMBED_WRAPPER);

    const mediaData = findMediaById(AMP_STATUS.media || [], AMP_STATUS.current);
    if (!mediaData) return;

    applyYouTubeReadyPlayback({
      enabledAutoplayAssist: Boolean(getOption('autoplay')),
      mediaData,
      runtimeUrl: event.target.getVideoUrl(),
      playerStateGetter: () => event.target.getPlayerState(),
      playingState: (window as any).YT.PlayerState.PLAYING,
      onAutoplayConfirmed: (elapsedMs: number) => {
        logger(`onPlayerReady::elapsed ${elapsedMs}ms:`, 'Playback has started!');
      },
      onAutoplayTimeout: () => {
        (document.getElementById('btn-play') as HTMLButtonElement).dispatchEvent(new Event('click'));
      },
      setWatchOrigin: (watchUrl: string) => {
        setWatchOriginState($BUTTON_WATCH_TY, $OPTIONAL_CONTAINER, watchUrl);
      },
      setVolume: (value: number) => {
        event.target.setVolume(value);
      },
      playVideo: () => {
        event.target.playVideo();
      },
      faderEnabled: Boolean(AMP_STATUS.fader),
      normalizedVolume: normalizeVolume(AMP_STATUS.volume, getDefaultVolume()),
    });
  }

  function clearYouTubePlaybackUi(): void {
    hideYouTubePlayerWrapper($EMBED_WRAPPER);
    setWatchOriginState($BUTTON_WATCH_TY, $OPTIONAL_CONTAINER, null);
  }

  function transitionToPlaybackTarget(
    playbackTarget: ReturnType<typeof resolveNextPlaybackTarget> | null
  ): void {
    if (!playbackTarget) {
      return;
    }
    updatePlayStatus(playbackTarget.nextId);
    const setupKind = resolvePlaybackTargetSetupKind(playbackTarget, getExt);
    if (!setupKind) {
      return;
    }
    setupPlayer(setupKind, playbackTarget.mediaSrc, playbackTarget.mediaData);
  }

  function cleanupYouTubeTransition(event: any, playbackTarget: ReturnType<typeof resolveNextPlaybackTarget> | null): void {
    applyYouTubeTransitionCleanup(event.target, resolveYouTubeTransitionCleanupMode(playbackTarget));
  }

  async function activateImportedPlaylist(playlistName: string): Promise<void> {
    ensurePlaylistOption(playlistName);
    selectPlaylistOption(playlistName);
    requestCategoryResume(null);
    requestMediaResume(null);
    await getPlaylistData(playlistName, true);
  }

  function resolveEndedPlaybackTarget(): ReturnType<typeof resolveNextPlaybackTarget> | null {
    return resolveEndedPlaybackTargetRuntime(
      AMP_STATUS.media || [],
      AMP_STATUS.current,
      AMP_STATUS.next,
      Boolean(AMP_STATUS.loop)
    );
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

      clearYouTubePlaybackUi();
      const playbackTarget = resolveEndedPlaybackTarget();
      if (!playbackTarget) return;

      cleanupYouTubeTransition(event, playbackTarget);
      transitionToPlaybackTarget(playbackTarget);
    }

    if (event.data === YT_PAUSED) {
      handleYouTubePausedState({
        emitPaused: () => {
          emitYouTubeSignal('paused');
        },
        showPlayState: () => {
          showPlaybackPlayState($BUTTON_PLAY, $BUTTON_PAUSE);
        },
      });
    }

    if (event.data === YT_PLAYING) {
      const currentMedia = findMediaById(AMP_STATUS.media || [], AMP_STATUS.current);
      handleYouTubePlayingState({
        emitPlaying: () => {
          emitYouTubeSignal('playing');
        },
        showPauseState: () => {
          showPlaybackPauseState($BUTTON_PLAY, $BUTTON_PAUSE);
        },
        faderEnabled: Boolean(AMP_STATUS.fader),
        mediaData: currentMedia,
        duration: event.target.getDuration(),
        playbackVolume: AMP_STATUS.volume ?? getDefaultVolume(),
        normalizeVolume: (value) => normalizeVolume(value, getDefaultVolume()),
        resolveSeekRange,
        setVolume: (value) => event.target.setVolume(value),
        fadeIn: (period, start) => fadeIn(event.target, period, start),
        fadeOut: (period, end) => fadeOut(event.target, period, end),
      });
    }

    handleYouTubeUnstartedState({
      autoplayEnabled: Boolean(getOption('autoplay')) && event.data === -1,
      emitUnstarted: () => {
        emitYouTubeSignal('unstarted');
      },
      logger,
    });
  }

  /**
   * Event handler called when the YouTube player encounters an error.
   */
  function onPlayerError(event: any): void {
    emitYouTubeSignal('error', `yt_error_${event && event.data !== undefined ? event.data : 'unknown'}`);
    // Skip if media playback fails.
    clearYouTubePlaybackUi();

    const playbackTarget = resolveNextPlaybackTarget(AMP_STATUS.media || [], AMP_STATUS.next);
    if (!playbackTarget) return;

    cleanupYouTubeTransition(event, playbackTarget);
    if (playbackTarget.playerType === 'youtube') {
      logger('error', 'onYTPlayerError:', event, 'force');
    }

    abortPlaybackTimers();
    transitionToPlaybackTarget(playbackTarget);
  }

  /**
   * Create a YouTube player.
   */
  function createYTPlayer(mediaData: MediaItem): void {
    emitYouTubeSignal('player_creating');
    createYouTubePlayerHost({ embedWrapper: $EMBED_WRAPPER, playerId: 'ytplayer' });
    const playbackConfig = resolvePlaybackConfigSource(getOption);
    const playerOptions = buildYouTubePlayerOptions(mediaData, playbackConfig);
    const initialPlaybackState = resolveInitialPlaybackState(mediaData, {
      faderEnabled: playbackConfig.faderEnabled,
      fallbackVolume: getDefaultVolume(),
      volumeInRange: (value: number) => inRange(value, 0, 100),
      getPlaybackVolume,
      normalizeVolume,
      seekEnabled: playbackConfig.seekEnabled,
    });
    applyInitialPlaybackStateToStatus(AMP_STATUS, initialPlaybackState);

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
    const sourcePath = resolveLocalMediaSrc(mediaData.file || '');
    const playbackConfig = resolvePlaybackConfigSource(getOption);
    const playerViewOptions = {
      mediaData,
      controls: String(playbackConfig.controls || ''),
      autoplay: String(playbackConfig.autoplay || ''),
      sourcePath,
      sourceType: getMediaMimeType(sourcePath, tagname),
    };
    const { playerElement: playerElm, sourceElement: sourceElm } = tagname === 'audio'
      ? createAudioPlayerView(playerViewOptions)
      : createVideoPlayerView(playerViewOptions);
    const initialPlaybackState = resolveInitialPlaybackState(mediaData, {
      faderEnabled: playbackConfig.faderEnabled,
      fallbackVolume: getDefaultVolume(),
      volumeInRange: (value: number) => inRange(value, 0, 100),
      getPlaybackVolume,
      normalizeVolume,
      seekEnabled: playbackConfig.seekEnabled,
    });
    applyInitialPlaybackStateToStatus(AMP_STATUS, initialPlaybackState);
    applyInitialPlaybackStateToElement(playerElm, initialPlaybackState);
    const reportHtmlMediaLoadIssue = createHtmlMediaIssueReporter({
      mediaData,
      reportMediaPlaybackIssue,
    });

    bindHtmlSeekOnPlay({
      playerElement: playerElm,
      mediaData,
      seekEnabled: playbackConfig.seekEnabled,
      isSeekActive: () => playbackTimers.isSeekActive(),
      startSeek: (callback, intervalMs) => playbackTimers.startSeek(callback, intervalMs),
      abortSeeking,
      abortFadeOut: () => abortFader('fadeout'),
    });

    bindHtmlPlaybackStateEvents({
      playerElement: playerElm,
      onPlaying: () => {
        showPlaybackPauseState($BUTTON_PLAY, $BUTTON_PAUSE);
        handleHtmlPlayingState({
          playerElement: playerElm,
          mediaData,
          faderEnabled: Boolean(AMP_STATUS.fader),
          playbackVolume: AMP_STATUS.volume,
          fallbackVolume: getDefaultVolume(),
          normalizeVolume,
          resolveSeekRange,
          fadeOut,
          fadeIn,
        });
      },
      onPause: () => {
        showPlaybackPlayState($BUTTON_PLAY, $BUTTON_PAUSE);
      },
      onVolumeChange: () => {
        logger('playerVolumeChange:', playerElm.volume, AMP_STATUS.volume);
      },
    });

    bindHtmlEndedEvent({
      playerElement: playerElm,
      onBeforeTransition: () => {
        abortPlaybackTimers();
        $EMBED_WRAPPER.classList.remove('max-w-2xl', 'w-max', 'h-max', 'border-0');
      },
      resolvePlaybackTarget: () => {
        const resolvedNextId = resolveLoopAwareNextId(AMP_STATUS.current, AMP_STATUS.next, Boolean(AMP_STATUS.loop));
        logger('ended:', AMP_STATUS, resolvedNextId);
        return resolveNextPlaybackTarget(AMP_STATUS.media || [], resolvedNextId);
      },
      onTransition: (playbackTarget) => {
        if (playbackTarget.playerType === 'youtube') {
          playerElm.remove();
        }
        transitionToPlaybackTarget(playbackTarget);
      },
    });

    bindHtmlErrorEvents({
      playerElement: playerElm,
      sourceElement: sourceElm,
      reportIssue: (mediaElement, event, reason) => {
        reportHtmlMediaLoadIssue(mediaElement, event, reason);
      },
    });
    mountPlayerElement($EMBED_WRAPPER, playerElm);
    showHtmlPlayerWrapper($EMBED_WRAPPER);
    resetWatchOriginState($BUTTON_WATCH_TY, $OPTIONAL_CONTAINER);
    bindHtmlVideoPresentation({
      playerElement: playerElm,
      allowFullScreen: resolveMediaFullscreenEnabled(mediaData, playbackConfig.fs),
      getPlaceholderPath: () => getNoMediaImagePath('placeholder'),
      isFullWindowMode,
      getFullWindowPlayerSize,
      getViewportWidth: () => currentWindowSize.width,
    });
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

    playbackTimers.startFader('fadein', () => {
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

    playbackTimers.startFader('fadeout', () => {
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
    currentWindowSize.width = getViewportWidth();
    currentWindowSize.height = getViewportHeight();
    const $HTMLPlayer = document.getElementById('html-player') as HTMLVideoElement | null;
    syncViewportLayout({
      width: currentWindowSize.width,
      height: currentWindowSize.height,
      getBottomMenuHeight,
      isFullWindow: isFullWindowMode(),
      getPlayerSizeForCurrentMode,
      player,
      htmlPlayer: $HTMLPlayer,
      drawerElements: {
        playlistDrawer: $DRAWER_PLAYLIST,
        settingsDrawer: $DRAWER_SETTINGS,
        playlistButton: $BUTTON_PLAYLIST,
        settingsButton: $BUTTON_SETTINGS,
        playlistCloseButton: document.getElementById('btn-close-playlist') as HTMLButtonElement | null,
        settingsCloseButton: document.getElementById('btn-close-settings') as HTMLButtonElement | null,
      },
      minFullUiWidth: currentWindowSize.minFullUIWidth,
      onAfterResponsiveLayout: () => {
        toggleMarqueeCaption();
      },
    });
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

  function buildMediaManagementBindings(): MediaManagementBindings {
    return {
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
      persistMediaEditForCurrentPlaylist: async (workingMedia: unknown[]) => {
        return persistMediaEditForCurrentPlaylist(workingMedia as MediaItem[]);
      },
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
    };
  }

  function buildPlaylistManagementBindings(): PlaylistManagementBindings {
    return {
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
    };
  }

  if ($MEDIA_MANAGE_FORM) {
    bindMediaManagementForm(buildMediaManagementBindings());
  }

  if ($PLAYLIST_MANAGE_FORM) {
    bindPlaylistManagementForm(buildPlaylistManagementBindings());
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
