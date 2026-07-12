import type { InitializeAppControlsRuntimeOptions } from './app-controls-runtime-init';
import {
  createAmbientAppControlsFacade,
  type CreateAmbientAppControlsFacadeOptions,
} from './app-controls-facade';
import {
  createAmbientAppSettingsFacade,
  type CreateAmbientAppSettingsFacadeOptions,
} from './app-settings-facade';

export interface CreateAppControlFacadesOptions {
  appControls: CreateAmbientAppControlsFacadeOptions;
  appSettings: CreateAmbientAppSettingsFacadeOptions;
}

export interface AppControlFacades {
  appControlsFacade: Pick<InitializeAppControlsRuntimeOptions, 'playlist' | 'playerControls'>;
  appSettingsFacade: Pick<
    InitializeAppControlsRuntimeOptions,
    'settingsControlRoots' | 'settings' | 'getCurrentPlaylist' | 'getCurrentCategoryId'
  >;
}

export function createAppControlFacades(options: CreateAppControlFacadesOptions): AppControlFacades {
  return {
    appControlsFacade: createAmbientAppControlsFacade(options.appControls),
    appSettingsFacade: createAmbientAppSettingsFacade(options.appSettings),
  };
}
