import { handleCategorySelectionChange, handlePlaylistSelectionChange } from './app-event-handlers';
import { bindSelectorControls } from './settings-controls';

export function bindAmbientSelectorControls(options: {
  playlistSelect: HTMLSelectElement | null;
  categorySelect: HTMLSelectElement | null;
  languageSelect: HTMLSelectElement | null;
  getCurrentPlaylist: () => string | null;
  getCurrentCategoryId: () => number | null;
  getPlaylistMode: () => string;
  canDiscardEditMode: () => boolean;
  clearDeleteSelections: () => void;
  resetReorderState: () => void;
  hideMediaEditModal: () => void;
  clearMediaEditContext: () => void;
  resetPlaylistMode: () => void;
  updatePlaylistModeUi: () => void;
  loadPlaylist: (playlist: string) => void;
  applyCategoryChange: (newCtgId: number) => void;
  updatePlaylist: () => void;
  getCookie: (key: string) => string | null;
  updateCookie: (key: string, value: string, days?: number | null) => void;
  logger: (...args: unknown[]) => void;
  reloadPage: () => void;
}): void {
  bindSelectorControls({
    playlistSelect: options.playlistSelect,
    categorySelect: options.categorySelect,
    languageSelect: options.languageSelect,
    onPlaylistChange: (evt: Event) => {
      handlePlaylistSelectionChange(evt, {
        getCurrentPlaylist: options.getCurrentPlaylist,
        getPlaylistMode: options.getPlaylistMode,
        canDiscardEditMode: options.canDiscardEditMode,
        clearDeleteSelections: options.clearDeleteSelections,
        resetReorderState: options.resetReorderState,
        hideMediaEditModal: options.hideMediaEditModal,
        clearMediaEditContext: options.clearMediaEditContext,
        resetPlaylistMode: options.resetPlaylistMode,
        updatePlaylistModeUi: options.updatePlaylistModeUi,
        loadPlaylist: options.loadPlaylist,
      });
    },
    onCategoryChange: (evt: Event) => {
      handleCategorySelectionChange(evt, {
        getCurrentCategoryId: options.getCurrentCategoryId,
        getPlaylistMode: options.getPlaylistMode,
        canDiscardEditMode: options.canDiscardEditMode,
        clearDeleteSelections: options.clearDeleteSelections,
        resetReorderState: options.resetReorderState,
        hideMediaEditModal: options.hideMediaEditModal,
        clearMediaEditContext: options.clearMediaEditContext,
        resetPlaylistMode: options.resetPlaylistMode,
        updatePlaylistModeUi: options.updatePlaylistModeUi,
        applyCategoryChange: options.applyCategoryChange,
        updatePlaylist: options.updatePlaylist,
      });
    },
    onLanguageChange: (evt: Event) => {
      const currentLanguage = options.getCookie('lang');
      const newLanguage = (evt.target as HTMLSelectElement).value;
      options.logger('changeLanguage::', currentLanguage, newLanguage);
      if (currentLanguage !== newLanguage) {
        options.updateCookie('lang', newLanguage);
        options.reloadPage();
      }
    },
  });
}
