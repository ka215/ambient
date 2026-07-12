import type { InitializeAppControlsRuntimeOptions } from './app-controls-runtime-init';

type AppControlsFacade = Pick<InitializeAppControlsRuntimeOptions, 'playlist' | 'playerControls'>;
type AppSettingsFacade = Pick<
  InitializeAppControlsRuntimeOptions,
  'settingsControlRoots' | 'settings' | 'getCurrentPlaylist' | 'getCurrentCategoryId'
>;

export interface CreateAppControlsRuntimeFacadeOptions {
  document: Document;
  windowObject: Window & typeof globalThis;
  status: InitializeAppControlsRuntimeOptions['status'];
  selectors: InitializeAppControlsRuntimeOptions['selectors'];
  appControls: AppControlsFacade;
  appSettings: AppSettingsFacade;
  getCookie: InitializeAppControlsRuntimeOptions['getCookie'];
  updateCookie: InitializeAppControlsRuntimeOptions['updateCookie'];
  logger: InitializeAppControlsRuntimeOptions['logger'];
}

export function createAppControlsRuntimeFacade(
  options: CreateAppControlsRuntimeFacadeOptions
): InitializeAppControlsRuntimeOptions {
  return {
    document: options.document,
    windowObject: options.windowObject,
    status: options.status,
    selectors: options.selectors,
    playlist: options.appControls.playlist,
    playerControls: options.appControls.playerControls,
    settingsControlRoots: options.appSettings.settingsControlRoots,
    settings: options.appSettings.settings,
    getCurrentPlaylist: options.appSettings.getCurrentPlaylist,
    getCurrentCategoryId: options.appSettings.getCurrentCategoryId,
    getCookie: options.getCookie,
    updateCookie: options.updateCookie,
    logger: options.logger,
  };
}
