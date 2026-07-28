type PlaylistActionOptions =
  NonNullable<Parameters<typeof import('./management-runtime-init').initializeManagementRuntime>[0]['playlistActionOptions']>;

export interface CreateManagementPlaylistActionsFacadeOptions {
  document: Document;
  getCategories(): string[];
  getMediaItems(): import('../types/ambient').MediaItem[];
  persistMyPlaylistIfNeeded(): boolean;
  setCategories(categories: string[]): void;
  setMediaItems(mediaItems: import('../types/ambient').MediaItem[]): void;
  resetActiveCategory(): void;
  onCategoryCreated(): void;
  onCategoriesMutated(): void;
  logger(...args: unknown[]): void;
  getPlaylistName(): string;
  importFileInput: HTMLInputElement | null;
  hideOptionsModal(): void;
  getLocalizedMessage(key: string, fallback: string): string;
  generatePlaylistJson(seekFormat: boolean): string;
}

export function createManagementPlaylistActionsFacade(
  options: CreateManagementPlaylistActionsFacadeOptions
): Omit<PlaylistActionOptions, 'form' | 'importPlaylistFromFile'> & {
  generatePlaylistJson: PlaylistActionOptions['generatePlaylistJson'];
} {
  return {
    getCategories: options.getCategories,
    getMediaItems: options.getMediaItems,
    persistMyPlaylistIfNeeded: options.persistMyPlaylistIfNeeded,
    setCategories: options.setCategories,
    setMediaItems: options.setMediaItems,
    resetActiveCategory: options.resetActiveCategory,
    onCategoryCreated: options.onCategoryCreated,
    onCategoriesMutated: options.onCategoriesMutated,
    logger: options.logger,
    getPlaylistName: options.getPlaylistName,
    importFileInput: options.importFileInput,
    hideOptionsModal: options.hideOptionsModal,
    getLocalizedMessage: options.getLocalizedMessage,
    generatePlaylistJson: options.generatePlaylistJson,
  };
}
