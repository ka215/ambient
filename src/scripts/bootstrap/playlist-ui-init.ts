import type { MediaItem } from '../types/ambient';
import type { PlaylistMode } from '../ui/playlist-view';
import { bindAddMediaTrigger } from '../ui/app-controls';
import {
  clearAmbientCategory,
  getAmbientActiveCategoryId,
  syncAmbientMediaCategoryField,
  syncAmbientTargetCategorySelection,
  updateAmbientCategory,
} from '../ui/forms/category-volume-bindings';
import { updateAmbientPlaylistDisplay, syncAmbientShuffleIfNeeded } from '../ui/playlist-display-bindings';
import { formatAmbientPlaylistLabel } from '../shared/playlist-label';

export interface CreatePlaylistUiBindingsOptions {
  status: {
    ctg: number | null;
    current: number | null;
    category: string[] | null;
    media: MediaItem[] | null;
    shuffle?: MediaItem[] | null;
  };
  getOption(key: string): unknown;
  playlistMode: PlaylistMode;
  setPlaylistMode(mode: PlaylistMode): void;
  deleteSelectedIds: Set<number>;
  getEditSelectedId(): number | null;
  playlistList: HTMLElement;
  targetCategorySelect: HTMLSelectElement | null;
  mediaCategorySelect: HTMLSelectElement | null;
  mediaCategoryInput: HTMLInputElement | null;
  mediaCategoryLabel: HTMLLabelElement | null;
  mediaCategoryNote: HTMLElement | null;
  canUseReorderMode(): boolean;
  canMutateCurrentPlaylist(): boolean;
  ambientData: { imageDir?: string; debug?: boolean } | null | undefined;
  getNoMediaImagePath(kind: 'placeholder' | 'thumb'): string;
  openMediaManagement(categoryId: number | null): void;
  trimTitle(value: string): string;
  destroyPlaylistSortable(): void;
  closePlaylistDescModal(): void;
  syncPlaylistModeAvailability(itemCount: number): void;
  closePlaylistModeMenu(): void;
  setPlaylistReadyState(isReady: boolean): void;
  resetReorderState(): void;
  updatePlaylistModeUi(): void;
  ensurePlaylistSortable(): void;
  execDebug(): void;
  logger(...args: unknown[]): void;
  applyCloudEditRestrictions(): void;
  onShuffleItemsChanged(items: MediaItem[]): void;
}

export function createPlaylistUiBindings(options: CreatePlaylistUiBindingsOptions): {
  clearPlaylist(): void;
  getActiveCategoryId(): number | null;
  syncTargetCategorySelection(): void;
  syncMediaCategoryField(preferredCategoryId?: number | null): void;
  updatePlaylist(): void;
  clearCategory(): void;
  updateCategory(): void;
} {
  const clearPlaylist = (): void => {
    const noMedia = document.getElementById('no-media');
    const children = Array.from(options.playlistList.children);
    children.forEach((child) => {
      if (child !== noMedia) {
        options.playlistList.removeChild(child);
      }
    });
    if (!noMedia) {
      return;
    }
    noMedia.classList.remove('hidden');
    const addBtn = noMedia.querySelector('#btn-add-media-from-drawer');
    if (addBtn) {
      bindAddMediaTrigger({
        trigger: addBtn,
        onActivate: (evt: Event) => {
          evt.preventDefault();
          evt.stopPropagation();
          options.openMediaManagement(getActiveCategoryId());
        },
      });
    }
  };

  const getActiveCategoryId = (): number | null => {
    return getAmbientActiveCategoryId(options.status.ctg);
  };

  const syncTargetCategorySelection = (): void => {
    syncAmbientTargetCategorySelection({
      select: options.targetCategorySelect,
      activeCategoryId: getActiveCategoryId(),
    });
  };

  const syncMediaCategoryField = (preferredCategoryId: number | null = getActiveCategoryId()): void => {
    syncAmbientMediaCategoryField({
      select: options.mediaCategorySelect,
      categoryInput: options.mediaCategoryInput,
      categories: options.status.category,
      preferredCategoryId,
    });
  };

  const updatePlaylist = (): void => {
    syncAmbientShuffleIfNeeded({
      enabled: Boolean(options.getOption('shuffle')),
      mediaItems: options.status.media || [],
      categoryId: options.status.ctg,
      logger: options.logger,
      setShuffleItems: (items) => {
        options.onShuffleItemsChanged(items);
      },
    });

    updateAmbientPlaylistDisplay({
      mediaItems: options.status.media || [],
      categoryId: options.status.ctg,
      currentId: options.status.current,
      playlistMode: options.playlistMode,
      deleteSelectedIds: options.deleteSelectedIds,
      editSelectedId: options.getEditSelectedId(),
      playlistFormat: (options.getOption('playlist') as string | null | undefined) ?? null,
      listElement: options.playlistList,
      noMediaElement: document.getElementById('no-media') as HTMLElement,
      canUseReorderMode: options.canUseReorderMode(),
      canMutatePlaylist: options.canMutateCurrentPlaylist(),
      imageDir: options.ambientData?.imageDir || null,
      fallbackThumbPath: options.getNoMediaImagePath('thumb'),
      getRegisterText: () => {
        const registerBtn = document.getElementById('btn-add-media-from-drawer');
        return (registerBtn?.dataset['label'] || registerBtn?.innerText || 'Register media').trim();
      },
      onQuickAdd: (evt: Event) => {
        evt.preventDefault();
        options.openMediaManagement(getActiveCategoryId());
      },
      trimTitle: options.trimTitle,
      formatLabel: formatAmbientPlaylistLabel,
      destroyPlaylistSortable: options.destroyPlaylistSortable,
      closePlaylistDescModal: options.closePlaylistDescModal,
      clearPlaylist,
      syncPlaylistModeAvailability: options.syncPlaylistModeAvailability,
      closePlaylistModeMenu: options.closePlaylistModeMenu,
      setPlaylistReadyState: options.setPlaylistReadyState,
      resetReorderState: options.resetReorderState,
      updatePlaylistModeUi: options.updatePlaylistModeUi,
      ensurePlaylistSortable: options.ensurePlaylistSortable,
      execDebug: options.execDebug,
      debugEnabled: Boolean(options.ambientData?.hasOwnProperty('debug') && options.ambientData.debug),
      logger: options.logger,
      setPlaylistMode: (mode) => {
        options.setPlaylistMode(mode);
      },
      setShuffleItems: (items) => {
        options.onShuffleItemsChanged(items);
      },
    });
  };

  const clearCategory = (): void => {
    clearAmbientCategory({
      targetSelect: options.targetCategorySelect,
      mediaSelect: options.mediaCategorySelect,
      mediaInput: options.mediaCategoryInput,
      mediaLabel: options.mediaCategoryLabel,
      mediaNote: options.mediaCategoryNote,
      applyCloudEditRestrictions: options.applyCloudEditRestrictions,
    });
  };

  const updateCategory = (): void => {
    updateAmbientCategory({
      targetSelect: options.targetCategorySelect,
      mediaSelect: options.mediaCategorySelect,
      mediaInput: options.mediaCategoryInput,
      mediaLabel: options.mediaCategoryLabel,
      mediaNote: options.mediaCategoryNote,
      categories: options.status.category,
      syncTargetCategorySelection,
      syncMediaCategoryField,
      applyCloudEditRestrictions: options.applyCloudEditRestrictions,
    });
  };

  return {
    clearPlaylist,
    getActiveCategoryId,
    syncTargetCategorySelection,
    syncMediaCategoryField,
    updatePlaylist,
    clearCategory,
    updateCategory,
  };
}
