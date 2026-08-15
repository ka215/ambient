import { bindFileDropzone, setFileDropzoneState } from './file-dropzone';
import {
  checkExternalMediaUrlPlayable,
  isValidExternalMediaUrlFormat,
  normalizeExternalMediaUrl,
} from '../../platform/external-media-url';
import { resolveLocalMediaUrl } from '../../platform/local-media-url-resolver';
import { extractLocalMediaMetadata, type LocalMediaArtworkPayload } from '../../platform/local-media-metadata';
import type { YouTubeMetadataPayload } from '../../types/ambient';

export interface MediaManagementBindings {
  form: HTMLFormElement | null;
  elements: HTMLElement[];
  mediaCategorySelect: HTMLSelectElement | null;
  mediaTitleMaxLength: number;
  mediaArtistMaxLength: number;
  mediaDescMaxLength: number;
  getDefaultVolume(): number;
  normalizeVolume(value: unknown, fallback?: number): number;
  resetMediaManagementForm(): void;
  canMutateCurrentPlaylist(): boolean;
  applyCloudEditRestrictions(): void;
  updateNotice(notification: { type: 'info' | 'success' | 'warning' | 'error'; message: string; delay?: number }): void;
  addMediaData(payload: [string, string][], preferredCategoryId?: number | null): boolean;
  updatePlaylist(): void;
  clearCategory(): void;
  updateCategory(): void;
  getActiveCategoryId(): number | null;
  syncMediaCategoryField(preferredCategoryId?: number | null): void;
  syncPlaybackAfterMediaAdd(): void;
  persistMediaEditForCurrentPlaylist(workingMedia: unknown[]): Promise<{ ok: boolean; message: string }>;
  saveArtworkThumbnail(artwork: LocalMediaArtworkPayload): Promise<{ ok: boolean; filename?: string; message: string }>;
  hideOptionsModal(): void;
  setValidated(targetElement: HTMLElement, result?: boolean | null): void;
  sanitizeMediaText(value: string, maxLength: number): string;
  sanitizeMediaTextInput(value: string, maxLength: number): string;
  sanitizeMediaDescInput(value: string, maxLength?: number): string;
  sanitizeMediaDescInputLive(value: string, maxLength?: number): string;
  basename(path: string): string;
  isLikelyMediaFile(file: File): boolean;
  getRelativeFilepath(basefile: string): Promise<boolean>;
  syncRangeProgress(range: HTMLInputElement | null): void;
  logger(...args: unknown[]): void;
  getMediaItems(): unknown[];
  getAddType(): string | null | undefined;
  setAddType(nextType: string): void;
  isYouTubeMetadataEnabled(): boolean;
  fetchYouTubeMetadata(videoId: string): Promise<{ ok: boolean; data?: YouTubeMetadataPayload; message?: string; reason?: string }>;
  getLocalizedMessage(key: string, fallback?: string): string;
}

function observeValidationMutations(
  form: HTMLFormElement,
  callback: (mutation: MutationRecord) => void
): void {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(callback);
  });
  observer.observe(form, { childList: true, attributes: true, subtree: true });
}

function isValidMediaTime(value: string): boolean {
  return /^\d+$/.test(value) ||
    (value.indexOf(':') > 0 && /^(\d+:)?([0-5]?[0-9]:)?[0-5]?[0-9]$/.test(value));
}

export function bindMediaManagementForm(bindings: MediaManagementBindings): void {
  const {
    form,
    elements,
    mediaCategorySelect,
    mediaTitleMaxLength,
    mediaArtistMaxLength,
    mediaDescMaxLength,
    getDefaultVolume,
    normalizeVolume,
    resetMediaManagementForm,
    canMutateCurrentPlaylist,
    applyCloudEditRestrictions,
    updateNotice,
    addMediaData,
    updatePlaylist,
    clearCategory,
    updateCategory,
    getActiveCategoryId,
    syncMediaCategoryField,
    syncPlaybackAfterMediaAdd,
    persistMediaEditForCurrentPlaylist,
    saveArtworkThumbnail,
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
    getMediaItems,
    getAddType,
    setAddType,
    isYouTubeMetadataEnabled,
    fetchYouTubeMetadata,
    getLocalizedMessage,
  } = bindings;

  if (!form) {
    return;
  }

  const youtubeMetadataAssist = document.getElementById('youtube-metadata-assist') as HTMLElement | null;
  const youtubeMetadataStatus = document.getElementById('youtube-metadata-status') as HTMLElement | null;
  const youtubeMetadataSuggestions = document.getElementById('youtube-metadata-suggestions') as HTMLElement | null;
  const youtubeMetadataTitle = document.getElementById('youtube-metadata-title-suggestion') as HTMLElement | null;
  const youtubeMetadataArtist = document.getElementById('youtube-metadata-artist-suggestion') as HTMLElement | null;
  const youtubeMetadataDesc = document.getElementById('youtube-metadata-desc-suggestion') as HTMLElement | null;
  const buttonApplyMetadataAll = document.getElementById('btn-apply-youtube-metadata-all') as HTMLButtonElement | null;
  const buttonApplyMetadataTitle = document.getElementById('btn-apply-youtube-metadata-title') as HTMLButtonElement | null;
  const buttonApplyMetadataArtist = document.getElementById('btn-apply-youtube-metadata-artist') as HTMLButtonElement | null;
  const buttonApplyMetadataDesc = document.getElementById('btn-apply-youtube-metadata-desc') as HTMLButtonElement | null;
  const buttonDismissMetadata = document.getElementById('btn-dismiss-youtube-metadata') as HTMLButtonElement | null;
  const titleField = document.getElementById('media-title') as HTMLInputElement | null;
  const artistField = document.getElementById('media-artist') as HTMLInputElement | null;
  const descField = document.getElementById('media-desc') as HTMLInputElement | HTMLTextAreaElement | null;
  const videoIdField = document.getElementById('youtube-videoid') as HTMLInputElement | null;
  const localMediaContainer = document.getElementById('media-management-field-media-files') as HTMLElement | null;
  const localMediaTabs = Array.from(document.querySelectorAll('[data-local-media-mode]')) as HTMLButtonElement[];
  const localMediaPanels = Array.from(document.querySelectorAll('[data-local-media-panel]')) as HTMLElement[];
  const localMediaUrlInput = document.getElementById('local-media-url') as HTMLInputElement | null;
  const localMediaUrlCheckButton = document.getElementById('btn-check-local-media-url') as HTMLButtonElement | null;
  const localMediaUrlStatus = document.getElementById('local-media-url-status') as HTMLElement | null;
  const localMediaKindValue = document.getElementById('local-media-kind') as HTMLInputElement | null;
  const localMediaMimeValue = document.getElementById('local-media-mime') as HTMLInputElement | null;
  const localMediaRangeProxyOption = document.getElementById('local-media-range-proxy-option') as HTMLElement | null;
  const localMediaRangeProxyToggle = document.getElementById('local-media-range-proxy') as HTMLInputElement | null;
  const localMediaRangeProxyValue = document.getElementById('local-media-range-proxy-value') as HTMLInputElement | null;
  const localMediaUploadDisabled = localMediaContainer?.dataset['cloudUploadDisabled'] === 'true';
  let activeLocalMediaMode: 'upload' | 'url' = localMediaContainer?.dataset['defaultLocalInputMode'] === 'url'
    ? 'url'
    : 'upload';
  let localMediaUrlRequestSeq = 0;
  let localMediaUrlCheckState: {
    originUrl: string;
    playable: boolean;
    rangeProxySuggested: boolean;
    rangeProxyEnabled: boolean;
  } | null = null;

  let metadataDebounceId: ReturnType<typeof setTimeout> | null = null;
  let metadataRequestSeq = 0;
  let latestMetadata: YouTubeMetadataPayload | null = null;
  let latestLocalArtwork: LocalMediaArtworkPayload | null = null;
  let latestMetadataSource: 'youtube' | 'local' = 'youtube';
  const lastAppliedMetadata = {
    title: '',
    artist: '',
    desc: '',
  };

  const setMetadataAssistVisible = (visible: boolean): void => {
    youtubeMetadataAssist?.classList.toggle('hidden', !visible);
  };

  const setLocalMediaUrlStatus = (
    message: string,
    state: 'neutral' | 'loading' | 'success' | 'error' = 'neutral'
  ): void => {
    if (!localMediaUrlStatus) {
      return;
    }
    localMediaUrlStatus.textContent = message;
    localMediaUrlStatus.classList.toggle('text-red-600', state === 'error');
    localMediaUrlStatus.classList.toggle('dark:text-red-400', state === 'error');
    localMediaUrlStatus.classList.toggle('text-green-700', state === 'success');
    localMediaUrlStatus.classList.toggle('dark:text-green-300', state === 'success');
    localMediaUrlStatus.classList.toggle('text-gray-500', state === 'neutral' || state === 'loading');
    localMediaUrlStatus.classList.toggle('dark:text-gray-300', state === 'neutral' || state === 'loading');
  };

  const getAmbientData = (): { isCloud?: boolean; localMediaProxy?: { enabled?: boolean; maxBytes?: number } } => {
    return ((window as any).AmbientData || {}) as {
      isCloud?: boolean;
      localMediaProxy?: { enabled?: boolean; maxBytes?: number };
    };
  };

  const setLocalMediaRangeProxyValue = (enabled: boolean): void => {
    if (localMediaRangeProxyValue) {
      localMediaRangeProxyValue.value = enabled ? 'true' : '';
    }
    if (localMediaRangeProxyToggle) {
      localMediaRangeProxyToggle.checked = enabled;
    }
    if (localMediaUrlCheckState) {
      localMediaUrlCheckState.rangeProxyEnabled = enabled;
    }
  };

  const setLocalMediaKindValue = (kind: 'audio' | 'video' | null): void => {
    if (localMediaKindValue) {
      localMediaKindValue.value = kind || '';
    }
  };

  const setLocalMediaMimeValue = (mime: string | null): void => {
    if (localMediaMimeValue) {
      const normalizedMime = String(mime || '').trim().toLowerCase();
      localMediaMimeValue.value = /^(audio|video)\/[a-z0-9.+-]+$/i.test(normalizedMime) ? normalizedMime : '';
    }
  };

  const hideLocalMediaRangeProxyOption = (): void => {
    localMediaRangeProxyOption?.classList.add('hidden');
    setLocalMediaRangeProxyValue(false);
  };

  const showLocalMediaRangeProxyOption = (defaultEnabled: boolean): void => {
    localMediaRangeProxyOption?.classList.remove('hidden');
    setLocalMediaRangeProxyValue(defaultEnabled);
  };

  const canSuggestLocalMediaRangeProxy = (options: {
    checkResult: Awaited<ReturnType<typeof checkExternalMediaUrlPlayable>>;
    canMutate: boolean;
  }): boolean => {
    const ambientData = getAmbientData();
    const maxBytes = Number(ambientData.localMediaProxy?.maxBytes || 0);
    const contentLength = options.checkResult.meta?.contentLength;
    const acceptRanges = String(options.checkResult.meta?.acceptRanges || '').trim().toLowerCase();
    const resolvedBy = String(options.checkResult.meta?.resolvedBy || '').trim();
    const isGoogleDriveCoreResolved = resolvedBy === 'ambient-google-drive-shared-url';
    return options.canMutate
      && ambientData.isCloud !== true
      && ambientData.localMediaProxy?.enabled !== false
      && options.checkResult.ok
      && options.checkResult.source === 'server'
      && (options.checkResult.kind === 'audio' || options.checkResult.kind === 'video')
      && (acceptRanges !== 'bytes' || isGoogleDriveCoreResolved)
      && typeof contentLength === 'number'
      && Number.isFinite(contentLength)
      && contentLength > 0
      && maxBytes > 0
      && contentLength <= maxBytes;
  };

  const setMetadataState = (
    state: 'idle' | 'loading' | 'suggested' | 'applied' | 'failed' | 'limited',
    message = ''
  ): void => {
    if (!youtubeMetadataAssist) {
      return;
    }
    youtubeMetadataAssist.dataset['state'] = state;
    setMetadataAssistVisible(state !== 'idle');
    if (youtubeMetadataStatus) {
      youtubeMetadataStatus.textContent = message;
      youtubeMetadataStatus.classList.toggle('text-red-600', state === 'failed' || state === 'limited');
      youtubeMetadataStatus.classList.toggle('dark:text-red-400', state === 'failed' || state === 'limited');
    }
    const hasSuggestions = state === 'suggested' || state === 'applied';
    youtubeMetadataSuggestions?.classList.toggle('hidden', !hasSuggestions);
    buttonApplyMetadataAll?.classList.toggle('hidden', !hasSuggestions);
    buttonDismissMetadata?.classList.toggle('hidden', !hasSuggestions && state !== 'failed' && state !== 'limited');
  };

  const clearMetadataSuggestions = (): void => {
    metadataRequestSeq++;
    latestMetadata = null;
    latestLocalArtwork = null;
    if (metadataDebounceId) {
      clearTimeout(metadataDebounceId);
      metadataDebounceId = null;
    }
    setMetadataState('idle');
  };

  const getInputFilepath = (): HTMLInputElement | null => {
    return document.getElementById('local-media-filepath') as HTMLInputElement | null;
  };

  const setLocalMediaUrlCheckButtonDisabled = (disabled: boolean): void => {
    if (!localMediaUrlCheckButton) {
      return;
    }
    localMediaUrlCheckButton.disabled = disabled;
    localMediaUrlCheckButton.setAttribute('aria-disabled', String(disabled));
  };

  const clearLocalMediaUrlState = (): void => {
    localMediaUrlRequestSeq++;
    localMediaUrlCheckState = null;
    hideLocalMediaRangeProxyOption();
    setLocalMediaKindValue(null);
    setLocalMediaMimeValue(null);
    if (localMediaUrlInput) {
      setValidated(localMediaUrlInput, null);
    }
    if (localMediaUrlCheckButton) {
      setLocalMediaUrlCheckButtonDisabled(true);
      localMediaUrlCheckButton.removeAttribute('aria-busy');
    }
    const inputFilepath = getInputFilepath();
    if (inputFilepath) {
      inputFilepath.value = '';
    }
    setLocalMediaUrlStatus(
      getLocalizedMessage(
        'Enter an audio or video URL, then check whether it can be played.',
        'Enter an audio or video URL, then check whether it can be played.'
      )
    );
  };

  const resetLocalMediaUrlUiForModalOpen = (): void => {
    if (localMediaUrlInput) {
      localMediaUrlInput.value = '';
    }
    clearLocalMediaUrlState();
  };

  const syncLocalMediaInputMode = (mode: 'upload' | 'url', options: { clearInactive: boolean } = { clearInactive: true }): void => {
    if (mode === 'upload' && localMediaUploadDisabled) {
      activeLocalMediaMode = 'url';
    } else {
      activeLocalMediaMode = mode;
    }

    localMediaTabs.forEach((tab) => {
      const isActive = tab.dataset['localMediaMode'] === activeLocalMediaMode;
      tab.setAttribute('aria-selected', String(isActive));
      tab.classList.toggle('bg-blue-100', isActive);
      tab.classList.toggle('text-blue-700', isActive);
      tab.classList.toggle('border-blue-300', isActive);
      tab.classList.toggle('dark:bg-blue-900', isActive);
      tab.classList.toggle('dark:text-blue-100', isActive);
      tab.classList.toggle('dark:border-blue-700', isActive);
      tab.classList.toggle('bg-white', !isActive);
      tab.classList.toggle('text-gray-500', !isActive);
      tab.classList.toggle('border-gray-300', !isActive);
      tab.classList.toggle('dark:bg-gray-800', !isActive);
      tab.classList.toggle('dark:text-gray-400', !isActive);
      tab.classList.toggle('dark:border-gray-600', !isActive);
      tab.classList.toggle('opacity-50', tab.disabled);
      tab.classList.toggle('cursor-not-allowed', tab.disabled);
    });
    localMediaPanels.forEach((panel) => {
      panel.classList.toggle('hidden', panel.dataset['localMediaPanel'] !== activeLocalMediaMode);
    });

    if (!options.clearInactive) {
      return;
    }

    const inputFilepath = getInputFilepath();
    if (inputFilepath) {
      inputFilepath.value = '';
    }
    if (activeLocalMediaMode === 'url') {
      const localMediaFile = document.getElementById('local-media-file') as HTMLInputElement | null;
      if (localMediaFile) {
        localMediaFile.value = '';
        setValidated(localMediaFile, null);
      }
      const localMediaFileName = document.getElementById('local-media-file-name') as HTMLElement | null;
      if (localMediaFileName && localMediaFile) {
        localMediaFileName.textContent = localMediaFile.dataset['labelEmpty'] || 'No file selected';
      }
      setFileDropzoneState(document.getElementById('local-media-dropzone'), { dragover: false, invalid: false });
    } else {
      clearLocalMediaUrlState();
    }
  };

  const renderMetadataSuggestions = (metadata: YouTubeMetadataPayload): void => {
    latestMetadata = metadata;
    if (youtubeMetadataTitle) youtubeMetadataTitle.textContent = metadata.title;
    if (youtubeMetadataArtist) youtubeMetadataArtist.textContent = metadata.artist;
    if (youtubeMetadataDesc) youtubeMetadataDesc.textContent = metadata.desc;
    setMetadataState(
      'suggested',
      latestMetadataSource === 'local'
        ? getLocalizedMessage('Local media metadata found.', 'Local media metadata found.')
        : getLocalizedMessage('YouTube metadata found.', 'YouTube metadata found.')
    );
  };

  const applyTextFieldValue = (
    field: HTMLInputElement | HTMLTextAreaElement | null,
    value: string,
    maxLength: number,
    sanitizer: (value: string, maxLength: number) => string
  ): string => {
    if (!field) {
      return '';
    }
    const sanitizedValue = sanitizer(value, maxLength);
    field.value = sanitizedValue;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    return sanitizedValue;
  };

  const applyMetadataField = (fieldName: 'title' | 'artist' | 'desc'): void => {
    if (!latestMetadata) {
      return;
    }
    if (fieldName === 'title') {
      lastAppliedMetadata.title = applyTextFieldValue(titleField, latestMetadata.title, mediaTitleMaxLength, sanitizeMediaTextInput);
      if (titleField) setValidated(titleField, titleField.value.trim() !== '');
    } else if (fieldName === 'artist') {
      lastAppliedMetadata.artist = applyTextFieldValue(artistField, latestMetadata.artist, mediaArtistMaxLength, sanitizeMediaTextInput);
    } else {
      lastAppliedMetadata.desc = applyTextFieldValue(descField, latestMetadata.desc, mediaDescMaxLength, sanitizeMediaDescInputLive);
    }
    setMetadataState(
      'applied',
      latestMetadataSource === 'local'
        ? getLocalizedMessage('Local media metadata applied.', 'Local media metadata applied.')
        : getLocalizedMessage('YouTube metadata applied.', 'YouTube metadata applied.')
    );
  };

  const applyTitleIfSafe = (): void => {
    if (!titleField) {
      return;
    }
    const currentTitle = titleField.value.trim();
    if (currentTitle !== '' && currentTitle !== lastAppliedMetadata.title) {
      return;
    }
    applyMetadataField('title');
    setMetadataState(
      'suggested',
      latestMetadataSource === 'local'
        ? getLocalizedMessage('Local media metadata found.', 'Local media metadata found.')
        : getLocalizedMessage('YouTube metadata found.', 'YouTube metadata found.')
    );
  };

  const applyLocalMetadataTextIfSafe = (
    fieldName: 'artist' | 'desc',
    field: HTMLInputElement | HTMLTextAreaElement | null,
    metadataValue: string,
    lastAppliedValue: string
  ): void => {
    if (!field || metadataValue.trim() === '') {
      return;
    }
    const currentValue = field.value.trim();
    if (currentValue !== '' && currentValue !== lastAppliedValue) {
      return;
    }
    applyMetadataField(fieldName);
  };

  const applyLocalMetadataIfSafe = (): void => {
    if (!latestMetadata) {
      return;
    }
    applyTitleIfSafe();
    applyLocalMetadataTextIfSafe('artist', artistField, latestMetadata.artist, lastAppliedMetadata.artist);
    applyLocalMetadataTextIfSafe('desc', descField, latestMetadata.desc, lastAppliedMetadata.desc);
    setMetadataState(
      'suggested',
      getLocalizedMessage('Local media metadata found.', 'Local media metadata found.')
    );
  };

  const scheduleYouTubeMetadataFetch = (videoId: string): void => {
    if (!isYouTubeMetadataEnabled() || !canMutateCurrentPlaylist()) {
      clearMetadataSuggestions();
      return;
    }
    if (metadataDebounceId) {
      clearTimeout(metadataDebounceId);
    }
    metadataDebounceId = setTimeout(async () => {
      const requestSeq = ++metadataRequestSeq;
      const activeVideoId = videoIdField?.value || '';
      if (activeVideoId !== videoId) {
        return;
      }
      setMetadataState('loading', getLocalizedMessage('Fetching YouTube metadata...', 'Fetching YouTube metadata...'));
      const result = await fetchYouTubeMetadata(videoId);
      if (requestSeq !== metadataRequestSeq || (videoIdField?.value || '') !== videoId) {
        return;
      }
      if (!result.ok || !result.data) {
        const isLimited = result.reason === 'quota-exceeded';
        setMetadataState(
          isLimited ? 'limited' : 'failed',
          result.message || getLocalizedMessage(
            isLimited ? 'YouTube metadata monthly limit has been reached.' : 'YouTube metadata could not be fetched.',
            isLimited ? 'YouTube metadata monthly limit has been reached.' : 'YouTube metadata could not be fetched.'
          )
        );
        return;
      }
      latestMetadataSource = 'youtube';
      renderMetadataSuggestions(result.data);
      applyTitleIfSafe();
    }, 500);
  };

  const applyLocalMediaMetadata = async (file: File, fallbackTitle: string): Promise<void> => {
    const requestSeq = ++metadataRequestSeq;
    latestMetadataSource = 'local';
    setMetadataState('loading', getLocalizedMessage('Reading local media metadata...', 'Reading local media metadata...'));
    const result = await extractLocalMediaMetadata(file, { fallbackTitle });
    if (requestSeq !== metadataRequestSeq) {
      return;
    }
    if (!result.ok || !result.data) {
      clearMetadataSuggestions();
      return;
    }
    latestLocalArtwork = result.artwork || null;
    if (titleField) {
      lastAppliedMetadata.title = fallbackTitle;
    }
    renderMetadataSuggestions(result.data);
    applyLocalMetadataIfSafe();
  };

  buttonApplyMetadataAll?.addEventListener('click', () => {
    applyMetadataField('title');
    applyMetadataField('artist');
    applyMetadataField('desc');
  });
  buttonApplyMetadataTitle?.addEventListener('click', () => applyMetadataField('title'));
  buttonApplyMetadataArtist?.addEventListener('click', () => applyMetadataField('artist'));
  buttonApplyMetadataDesc?.addEventListener('click', () => applyMetadataField('desc'));
  buttonDismissMetadata?.addEventListener('click', () => clearMetadataSuggestions());
  localMediaRangeProxyToggle?.addEventListener('change', () => {
    setLocalMediaRangeProxyValue(localMediaRangeProxyToggle.checked);
  });

  syncLocalMediaInputMode(activeLocalMediaMode, { clearInactive: false });
  localMediaTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset['localMediaMode'] === 'url' ? 'url' : 'upload';
      syncLocalMediaInputMode(mode);
    });
  });
  const optionsModal = document.getElementById('modal-options');
  if (optionsModal) {
    let previousOptionsModalVisible = !optionsModal.classList.contains('hidden')
      && optionsModal.getAttribute('aria-hidden') !== 'true';
    const observer = new MutationObserver(() => {
      const isVisible = !optionsModal.classList.contains('hidden')
        && optionsModal.getAttribute('aria-hidden') !== 'true';
      if (isVisible && !previousOptionsModalVisible) {
        resetLocalMediaUrlUiForModalOpen();
      }
      previousOptionsModalVisible = isVisible;
    });
    observer.observe(optionsModal, {
      attributes: true,
      attributeFilter: ['class', 'aria-hidden'],
    });
  }
  localMediaUrlCheckButton?.addEventListener('click', async () => {
    if (!localMediaUrlInput || !canMutateCurrentPlaylist()) {
      applyCloudEditRestrictions();
      return;
    }
    const rawUrl = localMediaUrlInput.value;
    const originUrl = normalizeExternalMediaUrl(rawUrl);
    if (!originUrl || !isValidExternalMediaUrlFormat(rawUrl)) {
      setValidated(localMediaUrlInput, false);
      localMediaUrlCheckState = null;
      setLocalMediaUrlStatus(
        getLocalizedMessage('Enter a valid http(s) audio or video URL.', 'Enter a valid http(s) audio or video URL.'),
        'error'
      );
      return;
    }
    const requestSeq = ++localMediaUrlRequestSeq;
    setLocalMediaUrlCheckButtonDisabled(true);
    localMediaUrlCheckButton.setAttribute('aria-busy', 'true');
    setValidated(localMediaUrlInput, null);
    setLocalMediaUrlStatus(getLocalizedMessage('Checking media URL...', 'Checking media URL...'), 'loading');
    const resolved = await resolveLocalMediaUrl({
      url: originUrl,
      source: 'media-management',
      phase: 'check',
      refreshCache: true,
    });
    const result = await checkExternalMediaUrlPlayable(resolved.url);
    if (requestSeq !== localMediaUrlRequestSeq) {
      return;
    }
    localMediaUrlCheckButton.removeAttribute('aria-busy');
    if (!result.ok) {
      const inputFilepath = getInputFilepath();
      if (inputFilepath) {
        inputFilepath.value = '';
      }
      localMediaUrlCheckState = null;
      hideLocalMediaRangeProxyOption();
      setLocalMediaUrlCheckButtonDisabled(false);
      setValidated(localMediaUrlInput, false);
      setLocalMediaUrlStatus(getLocalizedMessage(result.message, result.message), 'error');
      return;
    }
    const inputFilepath = getInputFilepath();
    if (inputFilepath) {
      inputFilepath.value = originUrl;
      inputFilepath.dispatchEvent(new Event('change'));
    }
    setLocalMediaKindValue(result.kind === 'audio' || result.kind === 'video' ? result.kind : null);
    setLocalMediaMimeValue(result.mime || null);
    localMediaUrlCheckState = {
      originUrl,
      playable: true,
      rangeProxySuggested: false,
      rangeProxyEnabled: false,
    };
    const shouldSuggestRangeProxy = canSuggestLocalMediaRangeProxy({
      checkResult: result,
      canMutate: canMutateCurrentPlaylist(),
    });
    localMediaUrlCheckState.rangeProxySuggested = shouldSuggestRangeProxy;
    if (shouldSuggestRangeProxy) {
      showLocalMediaRangeProxyOption(resolved.defaultResolverName === 'ambient-google-drive-shared-url');
    } else {
      hideLocalMediaRangeProxyOption();
    }
    localMediaUrlInput.value = originUrl;
    setValidated(localMediaUrlInput, true);
    setLocalMediaUrlStatus(getLocalizedMessage(result.message, result.message), 'success');
  });

  elements.forEach((elm) => {
    const mediaUrlField = document.getElementById('media-management-field-media-url');
    const mediaFilesField = document.getElementById('media-management-field-media-files');
    const inputVideoId = document.getElementById('youtube-videoid') as HTMLInputElement | null;
    const inputFilepath = document.getElementById('local-media-filepath') as HTMLInputElement | null;
    const inputMediaTitle = document.getElementById('media-title') as HTMLInputElement | null;
    const localMediaPicker = document.getElementById('btn-local-media-file-picker') as HTMLButtonElement | null;
    const localMediaFileName = document.getElementById('local-media-file-name') as HTMLElement | null;
    const localMediaDropzone = document.getElementById('local-media-dropzone') as HTMLElement | null;
    const elmName = (elm as HTMLInputElement).name;

    switch (elmName) {
      case 'media_type':
        elm.addEventListener('click', (evt: Event) => {
          const target = evt.target as HTMLInputElement;
          const prevType = getAddType() ?? null;
          const currentCategoryValue = String(mediaCategorySelect?.value || '').trim();
          const numericCurrentCategory = Number(currentCategoryValue);
          const preferredCategoryId = currentCategoryValue !== '' && !Number.isNaN(numericCurrentCategory)
            ? numericCurrentCategory
            : getActiveCategoryId();
          if (target.value === 'youtube') {
            mediaUrlField?.classList.remove('hidden');
            mediaFilesField?.classList.add('hidden');
          } else {
            mediaUrlField?.classList.add('hidden');
            mediaFilesField?.classList.remove('hidden');
            syncLocalMediaInputMode(activeLocalMediaMode, { clearInactive: false });
            clearMetadataSuggestions();
          }
          setAddType(target.value);
          if (prevType !== target.value) {
            resetMediaManagementForm();
            syncMediaCategoryField(preferredCategoryId);
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
            if (inputVideoId) inputVideoId.value = '';
            clearMetadataSuggestions();
            return;
          }
          try {
            if (!/^(https?:\/\/|)([a-z0-9-]+\.)?youtube\.com/.test(value)) {
              throw new Error('Invalid URL.');
            }
            const normalizedValue = /^https?:\/\//.test(value) ? value : 'https://' + value;
            const url = new URL(normalizedValue);
            const videoid = url.searchParams.get('v');
            if (!url.hostname.endsWith('youtube.com') || videoid === null || videoid === '') {
              throw new Error('Invalid URL.');
            }
            if (/^https?:\/\//.test(value)) {
              target.value = url.hostname + url.pathname + '?v=' + videoid;
            }
            setValidated(elm, true);
            if (inputVideoId) inputVideoId.value = videoid;
            scheduleYouTubeMetadataFetch(videoid);
          } catch (err) {
            logger('error', err, 'force');
            setValidated(elm, false);
            clearMetadataSuggestions();
          }
        });
        break;
      case 'local_media_file': {
        const localMediaInput = elm as HTMLInputElement;

        const clearLocalMediaFile = (): void => {
          if (localMediaFileName) {
            localMediaFileName.textContent = localMediaInput.dataset['labelEmpty'] || 'No file selected';
          }
          setFileDropzoneState(localMediaDropzone, { dragover: false, invalid: false });
          if (inputFilepath) inputFilepath.value = '';
          if (inputMediaTitle) inputMediaTitle.value = '';
          setValidated(elm, null);
          if (inputMediaTitle) setValidated(inputMediaTitle, null);
        };

        const applyLocalMediaFile = async (file: File | null): Promise<void> => {
          if (!canMutateCurrentPlaylist()) {
            clearLocalMediaFile();
            applyCloudEditRestrictions();
            return;
          }
          if (!file || file.size <= 0) {
            clearLocalMediaFile();
            return;
          }
          if (localMediaFileName) {
            localMediaFileName.textContent = file.name;
          }
          const mediaFileLooksValid = isLikelyMediaFile(file);
          const pathIsValid = mediaFileLooksValid ? await getRelativeFilepath(file.name) : false;
          setValidated(elm, mediaFileLooksValid && pathIsValid);
          setFileDropzoneState(localMediaDropzone, {
            dragover: false,
            invalid: !(mediaFileLooksValid && pathIsValid),
          });
          if (inputMediaTitle) {
            const fallbackTitle = mediaFileLooksValid && pathIsValid ? basename(file.name) : '';
            inputMediaTitle.value = fallbackTitle;
            localMediaInput.blur();
            inputMediaTitle.dispatchEvent(new Event('change'));
            if (fallbackTitle !== '') {
              void applyLocalMediaMetadata(file, fallbackTitle);
            } else {
              clearMetadataSuggestions();
            }
          }
        };

        bindFileDropzone({
          input: localMediaInput,
          picker: localMediaPicker,
          fileName: localMediaFileName,
          dropzone: localMediaDropzone,
          dropLabelFallback: 'Drop media file here',
          isDisabled: () => !canMutateCurrentPlaylist(),
          onApplyFile: async (file: File | null): Promise<void> => {
            logger('local_file:', localMediaInput.files, [localMediaInput]);
            await applyLocalMediaFile(file);
          },
        });
        break;
      }
      case 'local_media_url':
        elm.addEventListener('input', (evt: Event) => {
          const target = evt.target as HTMLInputElement;
          const normalizedUrl = normalizeExternalMediaUrl(target.value);
          localMediaUrlRequestSeq++;
          localMediaUrlCheckState = null;
          hideLocalMediaRangeProxyOption();
          const inputFilepath = getInputFilepath();
          if (inputFilepath) {
            inputFilepath.value = '';
          }
          setLocalMediaKindValue(null);
          setLocalMediaMimeValue(null);
          setValidated(elm, null);
          if (localMediaUrlCheckButton) {
            setLocalMediaUrlCheckButtonDisabled(!normalizedUrl || !isValidExternalMediaUrlFormat(target.value));
            localMediaUrlCheckButton.removeAttribute('aria-busy');
          }
          setLocalMediaUrlStatus(
            normalizedUrl
              ? getLocalizedMessage('Check the URL before adding media.', 'Check the URL before adding media.')
              : getLocalizedMessage(
                'Enter an audio or video URL, then check whether it can be played.',
                'Enter an audio or video URL, then check whether it can be played.'
              )
          );
        });
        elm.addEventListener('change', (evt: Event) => {
          const target = evt.target as HTMLInputElement;
          const normalizedUrl = normalizeExternalMediaUrl(target.value);
          if (normalizedUrl) {
            target.value = normalizedUrl;
          }
        });
        break;
      case 'media_filepath':
        elm.addEventListener('change', (evt: Event) => {
          (evt.target as HTMLElement).focus();
        });
        break;
      case 'media_kind':
      case 'media_mime':
      case 'range_proxy':
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
          target.value = sanitizeMediaText(target.value, mediaTitleMaxLength);
          setValidated(elm, target.value.trim() === '' ? null : true);
        });
        elm.addEventListener('change', (evt: Event) => {
          const target = evt.target as HTMLInputElement;
          target.value = sanitizeMediaText(target.value, mediaTitleMaxLength);
          setValidated(elm, target.value.trim() !== '');
        });
        break;
      case 'title':
        elm.addEventListener('input', (evt: Event) => {
          const target = evt.target as HTMLInputElement;
          target.value = sanitizeMediaTextInput(target.value, mediaTitleMaxLength);
          setValidated(elm, target.value.trim() === '' ? null : true);
        });
        elm.addEventListener('change', (evt: Event) => {
          const target = evt.target as HTMLInputElement;
          target.value = sanitizeMediaText(target.value, mediaTitleMaxLength);
          setValidated(elm, target.value.trim() !== '');
        });
        break;
      case 'artist':
        elm.addEventListener('input', (evt: Event) => {
          const target = evt.target as HTMLInputElement;
          target.value = sanitizeMediaTextInput(target.value, mediaArtistMaxLength);
        });
        elm.addEventListener('change', (evt: Event) => {
          const target = evt.target as HTMLInputElement;
          target.value = sanitizeMediaText(target.value, mediaArtistMaxLength);
        });
        break;
      case 'desc':
        elm.addEventListener('input', (evt: Event) => {
          const target = evt.target as HTMLInputElement;
          target.value = sanitizeMediaDescInputLive(target.value, mediaDescMaxLength);
        });
        elm.addEventListener('change', (evt: Event) => {
          const target = evt.target as HTMLInputElement;
          target.value = sanitizeMediaDescInput(target.value, mediaDescMaxLength);
        });
        break;
      case 'volume':
        elm.addEventListener('input', (evt: Event) => {
          const target = evt.target as HTMLInputElement;
          const currentVolume = normalizeVolume(target.value, getDefaultVolume());
          target.value = String(currentVolume);
          syncRangeProgress(target);
          const volumeValue = document.getElementById('default-media-volume');
          if (volumeValue) volumeValue.textContent = String(currentVolume);
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
            const isValid = isValidMediaTime(value);
            logger(value, isValid);
            setValidated(elm, isValid);
          }
        });
        break;
      case 'fadein':
      case 'fadeout':
        break;
      case 'add_media':
        elm.addEventListener('click', async () => {
          if (!canMutateCurrentPlaylist()) {
            applyCloudEditRestrictions();
            updateNotice({
              type: 'error',
              message: (elm as HTMLElement).dataset['messageFailure'] || '',
              delay: 2400,
            });
            return;
          }

          if (getAddType() !== 'youtube' && activeLocalMediaMode === 'url') {
            const originUrl = normalizeExternalMediaUrl(localMediaUrlInput?.value || '');
            if (
              !originUrl
              || !localMediaUrlCheckState?.playable
              || localMediaUrlCheckState.originUrl !== originUrl
            ) {
              if (localMediaUrlInput) {
                setValidated(localMediaUrlInput, false);
              }
              setLocalMediaUrlStatus(
                getLocalizedMessage('Check the URL before adding media.', 'Check the URL before adding media.'),
                'error'
              );
              return;
            }
            const inputFilepath = getInputFilepath();
            if (inputFilepath) {
              inputFilepath.value = localMediaUrlCheckState.originUrl;
            }
            setLocalMediaKindValue(localMediaKindValue?.value === 'audio' || localMediaKindValue?.value === 'video'
              ? localMediaKindValue.value
              : null);
            setLocalMediaMimeValue(localMediaMimeValue?.value || null);
            setLocalMediaRangeProxyValue(localMediaUrlCheckState.rangeProxyEnabled);
          }

          const formData = new FormData(form);
          if (getAddType() !== 'youtube' && activeLocalMediaMode === 'upload' && latestLocalArtwork) {
            const artworkResult = await saveArtworkThumbnail(latestLocalArtwork);
            if (artworkResult.ok && artworkResult.filename) {
              formData.set('image', artworkResult.filename);
            } else {
              logger('error', 'local media artwork thumbnail save failed', artworkResult, 'force');
            }
          }
          const categoryField = mediaCategorySelect?.classList.contains('hidden')
            ? 'media-category-new'
            : 'media-category';
          const preferredCategoryValue = String(formData.get(categoryField) || '').trim();
          const numericPreferredCategory = Number(preferredCategoryValue);
          const resolvedPreferredCategory = !Number.isNaN(numericPreferredCategory)
            ? numericPreferredCategory
            : getActiveCategoryId();
          const result = addMediaData(
            Array.from(formData.entries()) as [string, string][],
            resolvedPreferredCategory
          );
          logger(result, getMediaItems());
          let persisted = true;

          updatePlaylist();
          resetMediaManagementForm();
          clearCategory();
          updateCategory();

          if (preferredCategoryValue !== '') {
            syncMediaCategoryField(Number.isNaN(numericPreferredCategory) ? null : numericPreferredCategory);
          }

          try {
            syncPlaybackAfterMediaAdd();
          } catch (error) {
            logger('error', error, 'force');
          }

          if (result) {
            const persistResult = await persistMediaEditForCurrentPlaylist(getMediaItems());
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
        if ((elm as HTMLElement).id === 'local-media-range-proxy') {
          break;
        }
        logger('Event undefined element:', elmName, elm);
        break;
    }
  });

  observeValidationMutations(form, (mutation) => {
    if (mutation.type !== 'attributes' || mutation.attributeName !== 'data-validate') {
      return;
    }

    const formData = new FormData(form);
    const mediaType = formData.get('media_type') as string;
    const validItems: string[] = [];
    if ((mutation.target as HTMLElement).getAttribute('data-validate') === 'true') {
      elements.forEach((elm) => {
        if (elm.getAttribute('data-validate') === 'true') validItems.push(elm.id);
      });
    }

    const buttonAddMedia = document.getElementById('btn-add-media');
    if (!canMutateCurrentPlaylist()) {
      if (buttonAddMedia) {
        buttonAddMedia.removeAttribute('disabled');
      }
      applyCloudEditRestrictions();
      return;
    }

    const categoryField = mediaCategorySelect?.classList.contains('hidden')
      ? 'media-category-new'
      : 'media-category';
    const mediaSourceField = mediaType === 'youtube'
      ? 'youtube-url'
      : activeLocalMediaMode === 'url'
        ? 'local-media-url'
        : 'local-media-file';
    const contains = [mediaSourceField, categoryField, 'media-title'];
    const isContainAll = contains.every((id) => validItems.includes(id));
    logger(`Check valid items for "${mediaType}":`, validItems, contains, isContainAll);
    if (buttonAddMedia) {
      if (isContainAll) {
        buttonAddMedia.removeAttribute('disabled');
        buttonAddMedia.setAttribute('aria-disabled', 'false');
      } else {
        buttonAddMedia.setAttribute('disabled', '');
        buttonAddMedia.setAttribute('aria-disabled', 'true');
      }
    }
  });
}
