import { bindPlayerControls } from './app-controls';
import { handlePlayerPause, handlePlayerPlay } from './app-event-handlers';
import { resolvePlaybackCandidateIds, resolveRequestedPlayId } from './player/player-runtime';
import { syncPlaybackButtonState } from './player/player-shell';

export function bindAmbientPlayerControls(options: {
  carouselPrevButton: HTMLButtonElement | null;
  carouselNextButton: HTMLButtonElement | null;
  refreshButton: HTMLButtonElement | null;
  windowFullButton: HTMLButtonElement | null;
  windowFullToggle: HTMLInputElement | null;
  menuCollapseButton: HTMLButtonElement | null;
  playButton: HTMLButtonElement | null;
  pauseButton: HTMLButtonElement | null;
  menuElement: HTMLElement | null;
  getPreviousId(): number | null;
  getNextId(): number | null;
  playItemById(playId: number): void;
  reloadPage(): void;
  isFullWindowMode(): boolean;
  setFullWindowMode(enabled: boolean, forceApply?: boolean, persist?: boolean): void;
  setMenuMinimized(minimized: boolean): void;
  playertype: string | null;
  player: {
    getPlayerState(): number;
    playVideo(): void;
    pauseVideo(): void;
    stopVideo(): void;
  } | null | undefined;
  logger: (...args: unknown[]) => void;
  mediaItems: MediaItem[];
  categoryId: number | null;
  shuffleEnabled: boolean;
  shuffleItems: MediaItem[];
  currentId: number | null;
  order: 'random' | 'normal';
}): void {
  bindPlayerControls({
    carouselPrevButton: options.carouselPrevButton,
    carouselNextButton: options.carouselNextButton,
    refreshButton: options.refreshButton,
    windowFullButton: options.windowFullButton,
    windowFullToggle: options.windowFullToggle,
    menuCollapseButton: options.menuCollapseButton,
    playButton: options.playButton,
    pauseButton: options.pauseButton,
    onCarouselPrev: () => {
      const prevId = options.getPreviousId();
      if (prevId !== null) {
        options.playItemById(prevId);
      }
    },
    onCarouselNext: () => {
      const nextId = options.getNextId();
      if (nextId !== null) {
        options.playItemById(nextId);
      }
    },
    onRefresh: () => {
      options.reloadPage();
    },
    onToggleWindowFull: () => {
      options.setFullWindowMode(!options.isFullWindowMode(), true, true);
    },
    onWindowFullToggleChange: (checked: boolean) => {
      options.setFullWindowMode(checked);
    },
    onToggleMenuCollapse: () => {
      options.setMenuMinimized(!options.menuElement?.classList.contains('menu-minimized'));
    },
    onPlay: () => {
      handlePlayerPlay({
        playertype: options.playertype,
        player: options.player,
        logger: options.logger,
        resolvePlayId: () => {
          const playableIds = resolvePlaybackCandidateIds({
            mediaItems: options.mediaItems,
            categoryId: options.categoryId,
            shuffleEnabled: options.shuffleEnabled,
            shuffleItems: options.shuffleItems,
          });
          return resolveRequestedPlayId({
            currentId: options.currentId,
            candidateIds: playableIds,
            order: options.order,
          });
        },
        playItem: (playId) => {
          if (playId !== null) {
            options.playItemById(playId);
          }
        },
        showPlayingState: () => {
          if (options.playButton && options.pauseButton) {
            syncPlaybackButtonState(options.playButton, options.pauseButton, 'playing');
          }
        },
      });
    },
    onPause: () => {
      handlePlayerPause({
        playertype: options.playertype,
        player: options.player,
        showDisabledState: () => {
          if (options.playButton && options.pauseButton) {
            syncPlaybackButtonState(options.playButton, options.pauseButton, 'disabled');
          }
        },
        showPausedState: () => {
          if (options.playButton && options.pauseButton) {
            syncPlaybackButtonState(options.playButton, options.pauseButton, 'paused');
          }
        },
      });
    },
  });
}
