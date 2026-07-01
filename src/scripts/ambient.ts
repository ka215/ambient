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
  hasUnsafeScheme as sharedHasUnsafeScheme,
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
  normalizeBoolish as sharedNormalizeBoolish,
  normalizeNonNegativeNumber as sharedNormalizeNonNegativeNumber,
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
  reconcileResponsiveDrawers,
  syncDrawerAndModalBackdrops,
} from './ui/drawers';
import {
  createOptionsModalController,
  createPlaylistConfirmModalController,
  createPlaylistDescModalController,
  ensureAccordionPanel as ensureAccordionPanelView,
  expandMediaManagementWhenOptionsModalVisible,
  openPlaylistManagementCategoryCreate as openPlaylistManagementCategoryCreateView,
} from './ui/modals';
import {
  buildDefaultPlaylistLabel,
  closePlaylistModeMenu as closePlaylistModeMenuView,
  createPlaylistMaskIcon,
  PlaylistMode,
  syncPlaylistModeAvailabilityButton,
  syncPlaylistModeButton as syncPlaylistModeButtonView,
  togglePlaylistModeMenu as togglePlaylistModeMenuView,
  updatePlaylistModeMenuState,
} from './ui/playlist-view';
import {
  bindFileDropzone,
  setFileDropzoneState,
} from './ui/forms/file-dropzone';
import {
  clearCategoryView,
  resetMediaManagementForm,
  resetPlaylistManagementForm,
  syncMediaCategoryField as syncMediaCategoryFieldView,
  syncMediaVolumeField as syncMediaVolumeFieldView,
  syncRangeProgress as syncRangeProgressView,
  updateCategoryView,
} from './ui/forms/management-forms';
import { createPlaylistLoadGuard } from './domain/playlist-loader';
import {
  ensureCloudMyPlaylistSeed as domainEnsureCloudMyPlaylistSeed,
  hasStoredMyPlaylist,
  MYPLAYLIST_NAME,
  readMyPlaylistJson,
  sanitizeMyPlaylistOptions as domainSanitizeMyPlaylistOptions,
  writeMyPlaylistJson,
} from './domain/myplaylist-storage';
import { createPlaybackTimerController } from './domain/media-playback';

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

  interface ImportSanitizeResult {
    playlist: Record<string, unknown>;
    rejected: number;
    total: number;
  }

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
    return domainSanitizeMyPlaylistOptions(options);
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

  function detectCloudImportDeviceTier(): keyof typeof CLOUD_IMPORT_SIZE_LIMIT_BYTES {
    const ua = navigator.userAgent || '';
    if (/ipad|tablet|playbook|silk/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|android/i.test(ua)) {
      return 'mobile';
    }
    if (/windows|macintosh|linux|x11|cros/i.test(ua)) {
      return 'desktop';
    }
    return 'unknown';
  }

  function getCloudImportSizeLimitBytes(): number {
    const tier = detectCloudImportDeviceTier();
    return CLOUD_IMPORT_SIZE_LIMIT_BYTES[tier] || CLOUD_IMPORT_SIZE_LIMIT_BYTES.unknown;
  }

  function hasUnsafeScheme(value: string): boolean {
    return sharedHasUnsafeScheme(value);
  }

  function normalizeNonNegativeNumber(value: unknown): number | null {
    return sharedNormalizeNonNegativeNumber(value);
  }

  function normalizeBoolish(value: unknown): boolean | null {
    return sharedNormalizeBoolish(value);
  }

  function validatePlaylistSchemaContract(value: unknown): value is Record<string, unknown> {
    if (!isObject(value) || Array.isArray(value)) {
      return false;
    }
    for (const [key, item] of Object.entries(value)) {
      if (key === 'options') {
        if (!isObject(item) || Array.isArray(item)) {
          return false;
        }
        continue;
      }
      if (!Array.isArray(item)) {
        return false;
      }
      for (const media of item) {
        if (!isObject(media) || Array.isArray(media)) {
          return false;
        }
        if (typeof media.title !== 'string' || media.title.trim() === '') {
          return false;
        }
      }
    }
    return true;
  }

  function sanitizeAndNormalizeImportOptions(
    options: Record<string, unknown>,
    stripPlaylistTemplate: boolean
  ): Record<string, unknown> {
    const normalized: Record<string, unknown> = {};
    Object.entries(options).forEach(([key, rawValue]) => {
      if (stripPlaylistTemplate && key === 'playlist') {
        return;
      }
      if (typeof rawValue === 'boolean' || typeof rawValue === 'number' || rawValue === null) {
        normalized[key] = rawValue;
        return;
      }
      if (typeof rawValue === 'string') {
        normalized[key] = sanitizeMediaText(rawValue, 500);
      }
    });

    if (Object.prototype.hasOwnProperty.call(normalized, 'volume')) {
      const volume = normalizeNonNegativeNumber(normalized.volume);
      if (volume === null) {
        delete normalized.volume;
      } else {
        normalized.volume = Math.max(0, Math.min(100, volume));
      }
    }

    ['random', 'shuffle', 'seek', 'fader', 'dark', 'autoplay'].forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(normalized, key)) {
        const boolValue = normalizeBoolish(normalized[key]);
        if (boolValue === null) {
          delete normalized[key];
        } else {
          normalized[key] = boolValue;
        }
      }
    });

    return normalized;
  }

  function sanitizeAndNormalizeImportPlaylist(
    source: Record<string, unknown>,
    stripPlaylistTemplate: boolean
  ): ImportSanitizeResult | null {
    const normalized: Record<string, unknown> = {};
    let total = 0;
    let rejected = 0;

    for (const [category, rawItems] of Object.entries(source)) {
      if (category === 'options') {
        if (isObject(rawItems) && !Array.isArray(rawItems)) {
          normalized.options = sanitizeAndNormalizeImportOptions(rawItems, stripPlaylistTemplate);
        }
        continue;
      }

      const safeCategory = sanitizeMediaText(category, 100);
      if (safeCategory === '' || !Array.isArray(rawItems)) {
        continue;
      }

      const normalizedItems: Record<string, unknown>[] = [];
      rawItems.forEach((rawItem) => {
        total += 1;
        if (!isObject(rawItem) || Array.isArray(rawItem)) {
          rejected += 1;
          return;
        }

        const title = sanitizeMediaText(String(rawItem.title || ''), MEDIA_TITLE_MAX_LENGTH);
        if (title === '') {
          rejected += 1;
          return;
        }

        const item: Record<string, unknown> = { title };
        const artist = sanitizeMediaText(String(rawItem.artist || ''), MEDIA_ARTIST_MAX_LENGTH);
        if (artist !== '') item.artist = artist;

        const desc = sanitizeMediaDesc(String(rawItem.desc || ''), MEDIA_DESC_MAX_LENGTH);
        if (desc !== '') item.desc = desc;

        let hasUnsafeUrl = false;
        ['file', 'image', 'thumb'].forEach((key) => {
          if (!Object.prototype.hasOwnProperty.call(rawItem, key)) return;
          const value = String((rawItem as Record<string, unknown>)[key] || '').trim();
          if (value === '') return;
          if (hasUnsafeScheme(value)) {
            hasUnsafeUrl = true;
            return;
          }
          item[key] = sanitizeMediaText(value, 300);
        });
        if (hasUnsafeUrl) {
          rejected += 1;
          return;
        }

        if (Object.prototype.hasOwnProperty.call(rawItem, 'videoid')) {
          const videoid = sanitizeMediaText(String(rawItem.videoid || ''), 100);
          if (videoid !== '') {
            item.videoid = videoid;
          }
        }

        ['start', 'end', 'fadein', 'fadeout'].forEach((key) => {
          if (!Object.prototype.hasOwnProperty.call(rawItem, key)) return;
          const num = normalizeNonNegativeNumber((rawItem as Record<string, unknown>)[key]);
          if (num !== null) {
            item[key] = num;
          }
        });

        if (Object.prototype.hasOwnProperty.call(rawItem, 'volume')) {
          const volume = normalizeNonNegativeNumber(rawItem.volume);
          if (volume !== null) {
            item.volume = Math.max(0, Math.min(100, volume));
          }
        }

        ['fs', 'cc'].forEach((key) => {
          if (!Object.prototype.hasOwnProperty.call(rawItem, key)) return;
          const boolValue = normalizeBoolish((rawItem as Record<string, unknown>)[key]);
          if (boolValue !== null) {
            item[key] = boolValue;
          }
        });

        if (!item.title) {
          rejected += 1;
          return;
        }
        normalizedItems.push(item);
      });

      if (normalizedItems.length > 0) {
        normalized[safeCategory] = normalizedItems;
      }
    }

    if (total === 0) {
      return null;
    }
    if (rejected > 10 || (rejected / Math.max(1, total)) > 0.05) {
      return null;
    }
    const categoryCount = Object.keys(normalized).filter((key) => key !== 'options').length;
    if (categoryCount === 0) {
      return null;
    }
    return { playlist: normalized, rejected, total };
  }

  function ensurePlaylistOption(playlistName: string): void {
    if (!isElement($SELECT_PLAYLIST)) {
      return;
    }
    const alreadyExists = Array.from($SELECT_PLAYLIST.options).some((opt) => opt.value === playlistName);
    if (!alreadyExists) {
      const opt = document.createElement('option');
      opt.value = playlistName;
      opt.textContent = playlistName.replace(/\.json$/i, '');
      $SELECT_PLAYLIST.appendChild(opt);
    }
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
  function closePlaylistDescModal(restoreFocus = false): void {
    playlistDescModal.close(restoreFocus);
  }

  function openPlaylistDescModal(titleText: string, artistText: string, descText: string, button: HTMLElement): void {
    playlistDescModal.open(titleText, artistText, descText, button);
  }

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
      $MEDIA_EDIT_VOLUME.value = String(draft.volume);
      syncRangeProgress($MEDIA_EDIT_VOLUME);
      if (isElement($MEDIA_EDIT_VOLUME_VALUE)) {
        $MEDIA_EDIT_VOLUME_VALUE.textContent = String(draft.volume);
      }
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
          openPlaylistConfirmModal(title, body, () => {
            void commitDeleteSelections();
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
  function openPlaylistConfirmModal(title: string, body: string, onApply: () => void): void {
    playlistConfirmModal.open(title, body, onApply, () => {
      if (playlistMode === 'reorder') {
        reorderWorkingIds = [...reorderInitialIds];
        updatePlaylist();
      }
    });
  }

  function cancelPlaylistConfirmModal(): void {
    playlistConfirmModal.cancel();
  }

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
      playlistConfirmModal.apply();
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
      $MEDIA_EDIT_VOLUME.value = String(normalized.volume);
      syncRangeProgress($MEDIA_EDIT_VOLUME);
      if (isElement($MEDIA_EDIT_VOLUME_VALUE)) {
        $MEDIA_EDIT_VOLUME_VALUE.textContent = String(normalized.volume);
      }
      syncMediaEditDraftStateFromForm();
      validateAndRenderMediaEditDraftFromForm();
    });
    $MEDIA_EDIT_VOLUME.addEventListener('blur', () => {
      const normalized = readMediaEditDraftFromForm();
      $MEDIA_EDIT_VOLUME.value = String(normalized.volume);
      syncRangeProgress($MEDIA_EDIT_VOLUME);
      if (isElement($MEDIA_EDIT_VOLUME_VALUE)) {
        $MEDIA_EDIT_VOLUME_VALUE.textContent = String(normalized.volume);
      }
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

      let imageSrc = getNoMediaImagePath('thumb');
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
      } else if (playlistMode === 'edit') {
        const gutterElm = document.createElement('span');
        const isSelectedEditTarget = mediaEditActiveItem?.amId === item.amId;
        gutterElm.setAttribute('aria-hidden', 'true');
        gutterElm.className = isSelectedEditTarget
          ? 'playlist-edit-gutter is-selected order-first'
          : 'playlist-edit-gutter order-first';
        const iconElm = document.createElement('span');
        iconElm.className = isSelectedEditTarget
          ? 'ui-icon-mask ui-icon-mask--mode-edit-filled w-4 h-4'
          : 'ui-icon-mask ui-icon-mask--mode-edit w-4 h-4';
        iconElm.setAttribute('aria-hidden', 'true');
        gutterElm.appendChild(iconElm);
        itemElm.prepend(gutterElm);
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
    $NO_MEDIA_IMAGE.src = getNoMediaImagePath('placeholder');
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
      let mediaImage = getNoMediaImagePath('placeholder');
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
    while ($MEDIA_CAPTION.firstChild) {
      $MEDIA_CAPTION.removeChild($MEDIA_CAPTION.firstChild);
    }
    const $textWrap = document.createElement('div');
    $textWrap.classList.add('marquee-inner');

    const titleText = sanitizeMediaText(mediaData.title || '', MEDIA_TITLE_MAX_LENGTH) || 'Unknown media';
    const artistText = sanitizeMediaText(mediaData.artist || '', MEDIA_ARTIST_MAX_LENGTH);
    const $title = document.createElement('span');
    $title.className = 'media-caption-title';
    $title.textContent = titleText;
    $textWrap.appendChild($title);

    if (artistText !== '') {
      const $separator = document.createElement('span');
      $separator.className = 'media-caption-separator';
      $separator.textContent = ' ─ ';
      $textWrap.appendChild($separator);

      const $artist = document.createElement('span');
      $artist.className = 'media-caption-artist';
      $artist.textContent = artistText;
      $textWrap.appendChild($artist);
    }

    $MEDIA_CAPTION.appendChild($textWrap);
    toggleMarqueeCaption();
  }

  /**
   * Toggle caption marqueeing depending on window size.
   */
  function toggleMarqueeCaption(): void {
    const isFullWindowCaptionVisible = $BODY.classList.contains('amp-full-window') && $BODY.classList.contains('amp-menu-minimized');
    if ($BODY.classList.contains('amp-full-window') && !isFullWindowCaptionVisible) {
      return;
    }
    const $MARQUEE_NODE = $MEDIA_CAPTION.querySelector('.marquee-inner') as HTMLElement | null;
    if (!isElement($MARQUEE_NODE)) {
      return;
    }

    ($MEDIA_CAPTION.querySelectorAll('.marquee-inner[aria-hidden="true"]') as NodeListOf<HTMLElement>).forEach((elm: HTMLElement) => {
      elm.remove();
    });
    $MARQUEE_NODE.getAnimations().forEach((animation: Animation) => animation.cancel());

    const $MARQUEE_CLONE = $MARQUEE_NODE.cloneNode(true) as HTMLElement;
    const marqueeDuration = Math.max(8, Math.floor(($MARQUEE_NODE.clientWidth || 0) / 32)); // 16px = 1rem
    const captionWidth = $MEDIA_CAPTION.clientWidth || currentWindowSize.width;
    if (($MARQUEE_NODE.clientWidth || 0) > captionWidth || ($MARQUEE_NODE.clientWidth || 0) > 640) {
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
    toggleMarqueeCaption();
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
    $BODY.classList.toggle('amp-menu-minimized', minimized);
    syncMenuCollapseButton(minimized);
    toggleMarqueeCaption();
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
    updateNoMediaImagesForTheme();
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
    if (tagname === 'audio') {
      playerElm.className = 'ambient-audio-player';
    }
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
        if (!playbackTimers.isSeekActive()) {
          playbackTimers.startSeek(() => {
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
          self.setAttribute('poster', getNoMediaImagePath('placeholder'));
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
    if (mutation.attributeName === 'aria-modal' && (mutation.target as HTMLElement).ariaModal === 'true') {
      syncDrawerAndModalBackdrops(currentWindowSize.width, currentWindowSize.minFullUIWidth);
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

    reconcileResponsiveDrawers(
      {
        playlistDrawer: $DRAWER_PLAYLIST,
        settingsDrawer: $DRAWER_SETTINGS,
        playlistButton: $BUTTON_PLAYLIST,
        settingsButton: $BUTTON_SETTINGS,
        playlistCloseButton: document.getElementById('btn-close-playlist') as HTMLButtonElement | null,
        settingsCloseButton: document.getElementById('btn-close-settings') as HTMLButtonElement | null,
      },
      currentWindowSize.width,
      currentWindowSize.minFullUIWidth
    );

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
    resetMediaManagementForm({
      form: $MEDIA_MANAGE_FORM,
      elements: $MEDIA_MANAGE_ELMS,
      addType: AMP_STATUS.addtype,
      syncMediaVolumeField,
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
      parsed = parseJsonWithBom(text);
    } catch (_error) {
      return { ok: false, message: getLocalizedMessage('importParseError', 'The selected file is not valid JSON.') };
    }

    if (!validatePlaylistSchemaContract(parsed)) {
      return { ok: false, message: getLocalizedMessage('importSchemaError', 'The selected file does not match the playlist schema.') };
    }

    const sanitized = sanitizeAndNormalizeImportPlaylist(parsed, ambientData?.isCloud === true);
    if (!sanitized) {
      return { ok: false, message: getLocalizedMessage('importSanitizeError', 'Unsafe or invalid media entries exceeded the allowed limit.') };
    }

    if (!validatePlaylistSchemaContract(sanitized.playlist)) {
      return { ok: false, message: getLocalizedMessage('importSchemaError', 'The selected file does not match the playlist schema.') };
    }

    if (ambientData?.isCloud) {
      try {
        localStorage.setItem(MYPLAYLIST_KEY, JSON.stringify(sanitized.playlist, null, 2));
      } catch (_error) {
        return { ok: false, message: getLocalizedMessage('importPersistError', 'Failed to save imported playlist data.') };
      }
      ensureMyPlaylistOptionFromStorage();
      ensurePlaylistOption(MYPLAYLIST_NAME);
      selectPlaylistOption(MYPLAYLIST_NAME);
      requestCategoryResume(null);
      requestMediaResume(null);
      await getPlaylistData(MYPLAYLIST_NAME, true);
      return { ok: true, message: getLocalizedMessage('importCloudReplacedMyPlaylist', 'Import completed. MyPlaylist has been replaced.') };
    }

    let response: ApiResponse<{ message?: string; filename?: string }> | undefined;
    try {
      const rawResponse = await fetch(`${BASE_URL}playlist-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          playlist: sanitized.playlist,
        }),
        credentials: 'same-origin',
      });
      const payload = await rawResponse.json().catch(() => null);
      if (payload && typeof payload === 'object') {
        response = payload as ApiResponse<{ message?: string; filename?: string }>;
      }
    } catch (_error) {
      response = undefined;
    }

    if (!response || response.state !== 'ok' || !response.data?.filename) {
      const errorMessage = (response && (response as any).data && (response as any).data.message)
        ? (response as any).data.message
        : getLocalizedMessage('importPersistError', 'Failed to save imported playlist data.');
      return { ok: false, message: errorMessage };
    }

    const importedPlaylistName = response.data.filename;
    const ambient = getAmbientData();
    if (ambient) {
      if (!isObject(ambient.playlists)) {
        ambient.playlists = {};
      }
      ambient.playlists[importedPlaylistName] = `./assets/${importedPlaylistName}`;
    }
    ensurePlaylistOption(importedPlaylistName);
    selectPlaylistOption(importedPlaylistName);
    requestCategoryResume(null);
    requestMediaResume(null);
    await getPlaylistData(importedPlaylistName, true);

    return {
      ok: true,
      message: response.data.message || getLocalizedMessage('Playlist imported successfully.', 'Playlist imported successfully.'),
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

  if ($MEDIA_MANAGE_FORM) {
    $MEDIA_MANAGE_ELMS.forEach((elm: HTMLElement) => {
      const $MEDIA_URL_FIELD   = document.getElementById('media-management-field-media-url');
      const $MEDIA_FILES_FIELD = document.getElementById('media-management-field-media-files');
      const $INPUT_VIDEOID     = document.getElementById('youtube-videoid') as HTMLInputElement | null;
      const $INPUT_FILEPATH    = document.getElementById('local-media-filepath') as HTMLInputElement | null;
      const $INPUT_MEDIA_TITLE = document.getElementById('media-title') as HTMLInputElement | null;
      const $LOCAL_MEDIA_PICKER = document.getElementById('btn-local-media-file-picker') as HTMLButtonElement | null;
      const $LOCAL_MEDIA_FILE_NAME = document.getElementById('local-media-file-name') as HTMLElement | null;
      const $LOCAL_MEDIA_DROPZONE = document.getElementById('local-media-dropzone') as HTMLElement | null;
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
          {
          const $LOCAL_MEDIA_INPUT = elm as HTMLInputElement;

          const clearLocalMediaFile = (): void => {
            if ($LOCAL_MEDIA_FILE_NAME) {
              $LOCAL_MEDIA_FILE_NAME.textContent = $LOCAL_MEDIA_INPUT.dataset['labelEmpty'] || 'No file selected';
            }
            if ($LOCAL_MEDIA_DROPZONE) {
              setFileDropzoneState($LOCAL_MEDIA_DROPZONE, { dragover: false, invalid: false });
            }
            if ($INPUT_FILEPATH) $INPUT_FILEPATH.value = '';
            if ($INPUT_MEDIA_TITLE) $INPUT_MEDIA_TITLE.value = '';
            setValidated(elm, null);
            if ($INPUT_MEDIA_TITLE) setValidated($INPUT_MEDIA_TITLE, null);
          };

          const applyLocalMediaFile = async (file: File | null): Promise<void> => {
            if (!file || file.size <= 0) {
              clearLocalMediaFile();
              return;
            }
            if ($LOCAL_MEDIA_FILE_NAME) {
              $LOCAL_MEDIA_FILE_NAME.textContent = file.name;
            }
            const mediaFileLooksValid = isLikelyMediaFile(file);
            const pathIsValid = mediaFileLooksValid ? await getRelativeFilepath(file.name) : false;
            setValidated(elm, mediaFileLooksValid && pathIsValid);
            if ($LOCAL_MEDIA_DROPZONE) {
              setFileDropzoneState($LOCAL_MEDIA_DROPZONE, { dragover: false, invalid: !(mediaFileLooksValid && pathIsValid) });
            }
            if ($INPUT_MEDIA_TITLE) {
              $INPUT_MEDIA_TITLE.value = mediaFileLooksValid && pathIsValid ? basename(file.name) : '';
              $LOCAL_MEDIA_INPUT.blur();
              $INPUT_MEDIA_TITLE.dispatchEvent(new Event('change'));
            }
          };

          bindFileDropzone({
            input: $LOCAL_MEDIA_INPUT,
            picker: $LOCAL_MEDIA_PICKER,
            fileName: $LOCAL_MEDIA_FILE_NAME,
            dropzone: $LOCAL_MEDIA_DROPZONE,
            dropLabelFallback: 'Drop media file here',
            onApplyFile: async (file: File | null): Promise<void> => {
              logger('local_file:', $LOCAL_MEDIA_INPUT.files, [$LOCAL_MEDIA_INPUT]);
              await applyLocalMediaFile(file);
            },
          });
          }
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
            target.value = sanitizeMediaTextInput(target.value, MEDIA_TITLE_MAX_LENGTH);
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
            target.value = sanitizeMediaTextInput(target.value, MEDIA_ARTIST_MAX_LENGTH);
          });
          elm.addEventListener('change', (evt: Event) => {
            const target = evt.target as HTMLInputElement;
            target.value = sanitizeMediaText(target.value, MEDIA_ARTIST_MAX_LENGTH);
          });
          break;
        case 'desc':
          elm.addEventListener('input', (evt: Event) => {
            const target = evt.target as HTMLInputElement;
            target.value = sanitizeMediaDescInputLive(target.value, MEDIA_DESC_MAX_LENGTH);
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
          elm.addEventListener('click', async (_evt: Event) => {
            if (!$MEDIA_MANAGE_FORM) return;
            if (!canMutateCurrentPlaylist()) {
              applyCloudEditRestrictions();
              updateNotice({
                type: 'error',
                message: (elm as HTMLElement).dataset['messageFailure'] || '',
                delay: 2400,
              });
              return;
            }
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
              // Persist changes immediately for both cloud(MyPlaylist) and local JSON.
              const persistResult = await persistMediaEditForCurrentPlaylist(AMP_STATUS.media || []);
              persisted = persistResult.ok;
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
        if (!canMutateCurrentPlaylist()) {
          if ($BUTTON_ADD_MEDIA) setAtts($BUTTON_ADD_MEDIA, { disabled: '' }, false);
          applyCloudEditRestrictions();
          return;
        }
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
        case 'import_playlist_file':
          {
          const $IMPORT_PICKER = document.getElementById('btn-playlist-import-file-picker') as HTMLButtonElement | null;
          const $IMPORT_FILE_NAME = document.getElementById('playlist-import-file-name') as HTMLElement | null;
          const $IMPORT_DROPZONE = document.getElementById('playlist-import-dropzone') as HTMLElement | null;
          const $IMPORT_INPUT = elm as HTMLInputElement;

          const applyImportFile = (file: File | null): void => {
            const emptyLabel = $IMPORT_INPUT.dataset['labelEmpty'] || 'No file selected';
            if ($IMPORT_FILE_NAME) {
              $IMPORT_FILE_NAME.textContent = file ? file.name : emptyLabel;
            }
            if (!file) {
              setValidated(elm, null);
              if ($IMPORT_DROPZONE) {
                setFileDropzoneState($IMPORT_DROPZONE, { dragover: false, invalid: false });
              }
              return;
            }
            const isValid = isLikelyJsonFile(file);
            setValidated(elm, isValid);
            if ($IMPORT_DROPZONE) {
              setFileDropzoneState($IMPORT_DROPZONE, { dragover: false, invalid: !isValid });
            }
          };

          bindFileDropzone({
            input: $IMPORT_INPUT,
            picker: $IMPORT_PICKER,
            fileName: $IMPORT_FILE_NAME,
            dropzone: $IMPORT_DROPZONE,
            dropLabelFallback: 'Drop JSON file here',
            onApplyFile: applyImportFile,
          });
          }
          break;
        case 'create_symlink':
        case 'create_category':
        case 'download_playlist':
        case 'import_playlist': {
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
              if (!canMutateCurrentPlaylist()) {
                applyCloudEditRestrictions();
                updateNotice({
                  type: 'error',
                  message: selfElm?.dataset['messageFailure'] || '',
                  delay: 2400,
                });
                return;
              }
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
            async importPlaylist(): Promise<void> {
              const selfElm = document.getElementById('btn-import-playlist') as HTMLButtonElement | null;
              const $INPUT_IMPORT_FILE = document.getElementById('playlist-import-file') as HTMLInputElement | null;
              const importFile = $INPUT_IMPORT_FILE?.files && $INPUT_IMPORT_FILE.files.length > 0
                ? $INPUT_IMPORT_FILE.files[0]
                : null;
              if (!importFile) {
                updateNotice({
                  type: 'error',
                  message: getLocalizedMessage('importNoFile', 'Please choose a playlist JSON file.'),
                  delay: 2600,
                });
                return;
              }
              const result = await importPlaylistFromFile(importFile);
              updateNotice({
                type: result.ok ? 'success' : 'error',
                message: result.message || (result.ok
                  ? (selfElm?.dataset['messageSuccess'] || '')
                  : (selfElm?.dataset['messageFailure'] || '')),
                delay: 2800,
              });
              if (result.ok) {
                hideOptionsModal();
              }
            },
          };
          elm.addEventListener('click', async (evt: Event) => {
            const target = evt.target as HTMLInputElement;
            await (callback as any)[snakeToCapital(target.name)]();
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
        if (!canMutateCurrentPlaylist()) {
          if ($BUTTON_CREATE_CATEGORY) setAtts($BUTTON_CREATE_CATEGORY, { disabled: '' }, false);
          applyCloudEditRestrictions();
        } else {
          if ($BUTTON_CREATE_CATEGORY) setAtts($BUTTON_CREATE_CATEGORY, { disabled: '' }, isCategoryContainAll);
        }

        const $BUTTON_IMPORT_PLAYLIST = document.getElementById('btn-import-playlist');
        const import_contains = ['playlist-import-file'];
        const isImportContainAll = inArray(import_contains, valid_items, false);
        logger('Check valid items for "Import Playlist":', valid_items, import_contains, isImportContainAll);
        if ($BUTTON_IMPORT_PLAYLIST) setAtts($BUTTON_IMPORT_PLAYLIST, { disabled: '' }, isImportContainAll);
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
        delay: 5000,
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

let noticeHideTimerGlobal: number | null = null;
let noticeCleanupTimerGlobal: number | null = null;

/**
 * Update notice/notification display.
 */
function updateNotice(notification: NotificationPayload): void {
  logger('Have notification:', notification);

  const classes = {
    base: 'fixed top-2 right-2 w-full max-w-sm flex notice-toast notice-toast--hidden items-start gap-3 p-4 z-[10050] text-sm border rounded-lg shadow-xl ',
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
  $ALERT.style.display = 'flex';
  $ALERT.style.visibility = 'visible';
  $ALERT.style.opacity = '1';
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
    'notice-toast--hidden': true,
    'notice-toast--visible': false,
    'pointer-events-none': true,
  });
  window.requestAnimationFrame(() => {
    toggleClass($ALERT, {
      'notice-toast--hidden': false,
      'notice-toast--visible': true,
      'pointer-events-none': false,
    });
  });

  const hideNotice = (): void => {
    toggleClass($ALERT, {
      'notice-toast--hidden': true,
      'notice-toast--visible': false,
      'pointer-events-none': true,
    });
    noticeCleanupTimerGlobal = window.setTimeout(() => {
      toggleClass($ALERT, { hidden: true });
      $ALERT.style.visibility = 'hidden';
      $ALERT.style.opacity = '0';
      noticeCleanupTimerGlobal = null;
    }, 280);
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
