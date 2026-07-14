import { isResponsiveDrawerOpen } from '../ui/drawers';
import type { OptionsModalControllerOptions } from '../ui/modals';

export interface CreateOptionsModalHelpersOptions {
  document: Document;
  currentWindowSize: WindowSize;
  drawerPlaylist: HTMLElement | null;
  drawerSettings: HTMLElement | null;
}

export interface OptionsModalHelpers {
  getLayout: OptionsModalControllerOptions['getLayout'];
  beforeShow: NonNullable<OptionsModalControllerOptions['beforeShow']>;
}

export function createOptionsModalHelpers(
  options: CreateOptionsModalHelpersOptions
): OptionsModalHelpers {
  return {
    getLayout: () => ({
      width: options.currentWindowSize.width,
      minFullUIWidth: options.currentWindowSize.minFullUIWidth,
    }),
    beforeShow: () => {
      if (
        options.currentWindowSize.width < options.currentWindowSize.minFullUIWidth &&
        isResponsiveDrawerOpen(options.drawerPlaylist, '-translate-x-full')
      ) {
        (options.document.getElementById('btn-close-playlist') as HTMLButtonElement | null)?.click();
      }
      if (
        options.currentWindowSize.width < options.currentWindowSize.minFullUIWidth &&
        isResponsiveDrawerOpen(options.drawerSettings, 'translate-x-full')
      ) {
        (options.document.getElementById('btn-close-settings') as HTMLButtonElement | null)?.click();
      }
    },
  };
}
