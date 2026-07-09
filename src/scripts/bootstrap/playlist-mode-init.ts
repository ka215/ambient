import Sortable from 'sortablejs';
import type { MediaItem } from '../types/ambient';
import { canUsePlaylistReorderMode, getPlaylistItemsForView } from '../state/playlist-mode-state';
import { bindAmbientPlaylistMode } from '../ui/playlist-mode-bindings';
import { syncDeleteSelectionIndicator as syncDeleteSelectionIndicatorView, syncPlaylistModeButton as syncPlaylistModeButtonView, type PlaylistMode } from '../ui/playlist-view';
import { getRuntimeAmbientData } from '../platform/runtime-support';

type PlaylistModeBindingsOptions = Parameters<typeof bindAmbientPlaylistMode>[0];

export interface InitializePlaylistModeBindingsOptions {
  playlistModeUi: PlaylistModeBindingsOptions['playlistModeUi'];
  defaultPlaylistModeButtonIcon: string;
  defaultPlaylistModeButtonLabel: string;
  listElement: HTMLElement;
  confirmModal: PlaylistModeBindingsOptions['confirmModal'];
  getPlaylistMode(): PlaylistMode;
  setPlaylistModeState(mode: PlaylistMode): void;
  getCategoryId(): number | null;
  getMediaItems(): MediaItem[] | null;
  getPlaylistName(): string | null;
  setMediaItems(mediaItems: MediaItem[]): void;
  canMutateCurrentPlaylist(): boolean;
  myPlaylistName: string;
  hasStoredMyPlaylist(): boolean;
  getDeleteSelectedIds(): Set<number>;
  clearDeleteSelections(): void;
  canDiscardEditLeave(): boolean;
  discardEditState(): void;
  updatePlaylist(): void;
  persistCurrentPlaylistMutation(): Promise<{ ok: boolean; message: string }>;
  updateNotice(notification: NotificationPayload): void;
  getLocalizedMessage(key: string, fallback?: string): string;
}

export function initializePlaylistModeBindings(options: InitializePlaylistModeBindingsOptions) {
  const getVisibleItems = (): MediaItem[] => getPlaylistItemsForView(options.getMediaItems(), options.getCategoryId());
  const isSortableAvailable = (): boolean => typeof Sortable !== 'undefined' && typeof Sortable.create === 'function';
  const canUseReorderMode = (): boolean => canUsePlaylistReorderMode({
    canMutatePlaylist: options.canMutateCurrentPlaylist(),
    sortableAvailable: isSortableAvailable(),
    categoryId: options.getCategoryId(),
    visibleItems: getVisibleItems(),
  });

  return bindAmbientPlaylistMode({
    playlistModeUi: options.playlistModeUi,
    defaultPlaylistModeButtonIcon: options.defaultPlaylistModeButtonIcon,
    defaultPlaylistModeButtonLabel: options.defaultPlaylistModeButtonLabel,
    listElement: options.listElement,
    confirmModal: options.confirmModal,
    getPlaylistMode: options.getPlaylistMode,
    setPlaylistModeState: options.setPlaylistModeState,
    getStatus: () => ({
      ctg: options.getCategoryId(),
      media: options.getMediaItems(),
      playlist: options.getPlaylistName(),
    }),
    setMediaItems: options.setMediaItems,
    getVisibleItems,
    canMutatePlaylist: options.canMutateCurrentPlaylist,
    canUseReorderMode,
    isCloud: () => getRuntimeAmbientData()?.isCloud === true,
    myPlaylistName: options.myPlaylistName,
    hasStoredMyPlaylist: options.hasStoredMyPlaylist,
    getDeleteSelectedIds: options.getDeleteSelectedIds,
    clearDeleteSelections: options.clearDeleteSelections,
    canDiscardEditLeave: options.canDiscardEditLeave,
    discardEditState: options.discardEditState,
    updatePlaylist: options.updatePlaylist,
    syncModeButton: (mode) => {
      syncPlaylistModeButtonView(
        options.playlistModeUi,
        mode,
        options.defaultPlaylistModeButtonIcon,
        options.defaultPlaylistModeButtonLabel
      );
    },
    syncDeleteSelectionIndicator: (itemElm, isSelected) => {
      syncDeleteSelectionIndicatorView(itemElm, isSelected);
    },
    persistCurrentPlaylistMutation: options.persistCurrentPlaylistMutation,
    updateNotice: options.updateNotice,
    getLocalizedMessage: options.getLocalizedMessage,
  });
}
