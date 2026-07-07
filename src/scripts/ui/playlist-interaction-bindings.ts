import { handlePlaylistItemActivation } from './app-event-handlers';
import { bindPlaylistInteractionControls } from './app-controls';

export function bindAmbientPlaylistInteractionControls(options: {
  listElement: HTMLElement | null;
  getDescriptionPayload(target: HTMLElement | null): {
    titleText: string;
    artistText: string;
    descText: string;
    trigger: HTMLElement;
  } | null;
  openDescriptionModal(payload: {
    titleText: string;
    artistText: string;
    descText: string;
    trigger: HTMLElement;
  }): void;
  getPlaylistMode(): string;
  deleteSelectedIds: Set<number>;
  syncDeleteSelectionIndicator(itemElm: HTMLElement, selected: boolean): void;
  resolveMediaItem(amId: number): MediaItem | null;
  openMediaEditModal(item: MediaItem, trigger: HTMLElement): void;
  isPlaylistInteractionLocked(): boolean;
  playItem(target: HTMLElement): void;
  showPlayingState(): void;
}): void {
  bindPlaylistInteractionControls({
    listElement: options.listElement,
    getDescriptionPayload: options.getDescriptionPayload,
    onDescriptionActivate: (target: HTMLElement, event: Event) => {
      const descPayload = options.getDescriptionPayload(target);
      if (!descPayload) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      options.openDescriptionModal(descPayload);
    },
    onItemActivate: (itemElm: HTMLElement, event: Event) => {
      handlePlaylistItemActivation(itemElm, event, {
        getPlaylistMode: options.getPlaylistMode,
        deleteSelectedIds: options.deleteSelectedIds,
        syncDeleteSelectionIndicator: options.syncDeleteSelectionIndicator,
        resolveMediaItem: options.resolveMediaItem,
        openMediaEditModal: options.openMediaEditModal,
        isPlaylistInteractionLocked: options.isPlaylistInteractionLocked,
        playItem: options.playItem,
        showPlayingState: options.showPlayingState,
      });
    },
  });
}
