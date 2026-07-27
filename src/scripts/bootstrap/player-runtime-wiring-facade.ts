import type { InitializeAmbientPlayerRuntimeWiringOptions } from './player-runtime-wiring-init';

export interface CreatePlayerRuntimeWiringFacadeOptions {
  status: InitializeAmbientPlayerRuntimeWiringOptions['status'];
  body: HTMLElement;
  menu: HTMLElement;
  embedWrapper: HTMLElement;
  watchButton: HTMLAnchorElement;
  optionalContainer: HTMLElement;
  playButton: HTMLButtonElement;
  pauseButton: HTMLButtonElement;
  carouselWrapper: HTMLElement;
  carouselPrevButton: HTMLButtonElement;
  carouselNextButton: HTMLButtonElement;
  mediaCaption: HTMLElement;
  currentWindowSize: InitializeAmbientPlayerRuntimeWiringOptions['currentWindowSize'];
  defaultVolume: number;
  imageDir: InitializeAmbientPlayerRuntimeWiringOptions['imageDir'];
  getOption: InitializeAmbientPlayerRuntimeWiringOptions['getOption'];
  logger: InitializeAmbientPlayerRuntimeWiringOptions['logger'];
  getLocalizedMessage: InitializeAmbientPlayerRuntimeWiringOptions['getLocalizedMessage'];
  updateNotice: InitializeAmbientPlayerRuntimeWiringOptions['updateNotice'];
  closeResponsiveDrawers: InitializeAmbientPlayerRuntimeWiringOptions['closeResponsiveDrawers'];
  syncPlaybackButtonState: InitializeAmbientPlayerRuntimeWiringOptions['syncPlaybackButtonState'];
  abortPlaybackTimers: InitializeAmbientPlayerRuntimeWiringOptions['abortPlaybackTimers'];
  abortSeeking: InitializeAmbientPlayerRuntimeWiringOptions['abortSeeking'];
  abortFader: InitializeAmbientPlayerRuntimeWiringOptions['abortFader'];
  isSeekActive: InitializeAmbientPlayerRuntimeWiringOptions['isSeekActive'];
  startSeek: InitializeAmbientPlayerRuntimeWiringOptions['startSeek'];
  startFader: InitializeAmbientPlayerRuntimeWiringOptions['startFader'];
  emitYouTubeSignal: InitializeAmbientPlayerRuntimeWiringOptions['emitYouTubeSignal'];
  sanitizeTitle: InitializeAmbientPlayerRuntimeWiringOptions['sanitizeTitle'];
  sanitizeArtist: InitializeAmbientPlayerRuntimeWiringOptions['sanitizeArtist'];
  resolvePlayingState: InitializeAmbientPlayerRuntimeWiringOptions['resolvePlayingState'];
  setPlayer: InitializeAmbientPlayerRuntimeWiringOptions['setPlayer'];
}

export function createPlayerRuntimeWiringFacade(
  options: CreatePlayerRuntimeWiringFacadeOptions
): InitializeAmbientPlayerRuntimeWiringOptions {
  return {
    status: options.status,
    body: options.body,
    menu: options.menu,
    embedWrapper: options.embedWrapper,
    watchButton: options.watchButton,
    optionalContainer: options.optionalContainer,
    playButton: options.playButton,
    pauseButton: options.pauseButton,
    carouselWrapper: options.carouselWrapper,
    carouselPrevButton: options.carouselPrevButton,
    carouselNextButton: options.carouselNextButton,
    mediaCaption: options.mediaCaption,
    currentWindowSize: options.currentWindowSize,
    defaultVolume: options.defaultVolume,
    imageDir: options.imageDir,
    getOption: options.getOption,
    logger: options.logger,
    getLocalizedMessage: options.getLocalizedMessage,
    updateNotice: options.updateNotice,
    closeResponsiveDrawers: options.closeResponsiveDrawers,
    syncPlaybackButtonState: options.syncPlaybackButtonState,
    abortPlaybackTimers: options.abortPlaybackTimers,
    abortSeeking: options.abortSeeking,
    abortFader: options.abortFader,
    isSeekActive: options.isSeekActive,
    startSeek: options.startSeek,
    startFader: options.startFader,
    emitYouTubeSignal: options.emitYouTubeSignal,
    sanitizeTitle: options.sanitizeTitle,
    sanitizeArtist: options.sanitizeArtist,
    resolvePlayingState: options.resolvePlayingState,
    setPlayer: options.setPlayer,
  };
}
