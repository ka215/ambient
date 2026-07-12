type PlaylistActionOptions =
  NonNullable<Parameters<typeof import('./management-runtime-init').initializeManagementRuntime>[0]['playlistActionOptions']>;

export interface CreateManagementPlaylistActionsFacadeOptions {
  document: Document;
  getCategories(): string[];
  persistMyPlaylistIfNeeded(): boolean;
  setCategories(categories: string[]): void;
  onCategoryCreated(): void;
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
    persistMyPlaylistIfNeeded: options.persistMyPlaylistIfNeeded,
    setCategories: options.setCategories,
    onCategoryCreated: options.onCategoryCreated,
    logger: options.logger,
    getPlaylistName: options.getPlaylistName,
    importFileInput: options.importFileInput,
    hideOptionsModal: options.hideOptionsModal,
    getLocalizedMessage: options.getLocalizedMessage,
    generatePlaylistJson: options.generatePlaylistJson,
  };
}
