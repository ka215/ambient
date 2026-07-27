import type { MediaItem } from '../types/ambient';
import type { PlaylistMode } from '../ui/playlist-view';
import { initializePlaylistModeBindings } from './playlist-mode-init';

export interface InitializePlaylistModeRuntimeOptions {
  document: Document;
  playlistModeUi: {
    button: HTMLButtonElement | null;
    menu: HTMLElement | null;
    buttonIcon: HTMLElement | null;
    buttonLabel: HTMLElement | null;
  };
  defaultPlaylistModeButtonIcon: string;
  defaultPlaylistModeButtonLabel: string;
  listElement: HTMLElement;
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

export function initializePlaylistModeRuntime(options: InitializePlaylistModeRuntimeOptions) {
  return initializePlaylistModeBindings({
    playlistModeUi: options.playlistModeUi,
    defaultPlaylistModeButtonIcon: options.defaultPlaylistModeButtonIcon,
    defaultPlaylistModeButtonLabel: options.defaultPlaylistModeButtonLabel,
    listElement: options.listElement,
    confirmModal: {
      modal: options.document.getElementById('modal-playlist-confirm') as HTMLElement | null,
      title: options.document.getElementById('modal-playlist-confirm-title') as HTMLElement | null,
      body: options.document.getElementById('modal-playlist-confirm-body') as HTMLElement | null,
      applyButton: options.document.getElementById('btn-playlist-confirm-apply') as HTMLButtonElement | null,
      cancelButton: options.document.getElementById('btn-playlist-confirm-cancel') as HTMLButtonElement | null,
    },
    getPlaylistMode: options.getPlaylistMode,
    setPlaylistModeState: options.setPlaylistModeState,
    getCategoryId: options.getCategoryId,
    getMediaItems: options.getMediaItems,
    getPlaylistName: options.getPlaylistName,
    setMediaItems: options.setMediaItems,
    canMutateCurrentPlaylist: options.canMutateCurrentPlaylist,
    myPlaylistName: options.myPlaylistName,
    hasStoredMyPlaylist: options.hasStoredMyPlaylist,
    getDeleteSelectedIds: options.getDeleteSelectedIds,
    clearDeleteSelections: options.clearDeleteSelections,
    canDiscardEditLeave: options.canDiscardEditLeave,
    discardEditState: options.discardEditState,
    updatePlaylist: options.updatePlaylist,
    persistCurrentPlaylistMutation: options.persistCurrentPlaylistMutation,
    updateNotice: options.updateNotice,
    getLocalizedMessage: options.getLocalizedMessage,
  });
}
