type PlaylistBindings =
  NonNullable<
    NonNullable<Parameters<typeof import('./management-runtime-init').initializeManagementRuntime>[0]['initOptions']>['playlistBindings']
  >;

export interface CreateManagementPlaylistBindingsFacadeOptions {
  document: Document;
  canMutateCurrentPlaylist(): boolean;
  applyCloudEditRestrictions(): void;
  setValidated(targetElement: HTMLElement, result?: boolean | null): void;
  updateNotice(notification: { type: 'info' | 'success' | 'warning' | 'error'; message: string; delay?: number }): void;
  fetchData(endpointURL: string, method?: string, payload?: Record<string, string>): Promise<unknown>;
  inArray(contains: unknown | unknown[], targetArray: unknown[], atLeastOne?: boolean): boolean;
  snakeToCapital(value: string): string;
  logger(...args: unknown[]): void;
  isLikelyJsonFile(file: File): boolean;
  getBaseUrl(): string;
  getCategories(): string[];
  getMediaItems(): import('../types/ambient').MediaItem[];
}

export function createManagementPlaylistBindingsFacade(
  options: CreateManagementPlaylistBindingsFacadeOptions
): PlaylistBindings {
  return {
    canMutateCurrentPlaylist: options.canMutateCurrentPlaylist,
    applyCloudEditRestrictions: options.applyCloudEditRestrictions,
    setValidated: options.setValidated,
    updateNotice: options.updateNotice,
    fetchData: options.fetchData,
    inArray: options.inArray,
    snakeToCapital: options.snakeToCapital,
    logger: options.logger,
    isLikelyJsonFile: options.isLikelyJsonFile,
    getBaseUrl: options.getBaseUrl,
    getPlaylistManageFormData: (oneData: string | null = null) => {
      const playlistForm = options.document.querySelector('form[name="playlistManagement"]') as HTMLFormElement | null;
      if (!playlistForm) {
        return null;
      }
      const formData = new FormData(playlistForm);
      return oneData ? formData.get(oneData) : Array.from(formData.entries());
    },
    getCategories: options.getCategories,
    getMediaItems: options.getMediaItems,
  } as PlaylistBindings;
}
