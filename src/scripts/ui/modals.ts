export interface PlaylistDescModalElements {
  modal: HTMLElement | null;
  title: HTMLElement | null;
  artist: HTMLElement | null;
  content: HTMLElement | null;
}

export interface PlaylistDescModalSanitizers {
  title: (value: string) => string;
  artist: (value: string) => string;
  desc: (value: string) => string;
}

export interface PlaylistDescModalController {
  close(restoreFocus?: boolean): void;
  open(titleText: string, artistText: string, descText: string, button: HTMLElement): void;
}

function isElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement;
}

export function createPlaylistDescModalController(
  elements: PlaylistDescModalElements,
  sanitizers: PlaylistDescModalSanitizers
): PlaylistDescModalController {
  let activeButton: HTMLElement | null = null;

  const close = (restoreFocus = false): void => {
    if (!isElement(elements.modal) || !isElement(elements.content)) {
      return;
    }
    elements.modal.classList.add('hidden');
    if (isElement(elements.title)) {
      elements.title.textContent = '';
    }
    if (isElement(elements.artist)) {
      elements.artist.textContent = '';
      elements.artist.classList.add('hidden');
    }
    elements.content.textContent = '';
    if (isElement(activeButton)) {
      activeButton.classList.remove('is-active');
      if (restoreFocus) {
        activeButton.focus();
      }
    }
    activeButton = null;
  };

  return {
    close,
    open(titleText: string, artistText: string, descText: string, button: HTMLElement): void {
      if (!isElement(elements.modal) || !isElement(elements.content)) {
        return;
      }
      if (activeButton === button && !elements.modal.classList.contains('hidden')) {
        close(true);
        return;
      }
      if (isElement(activeButton)) {
        activeButton.classList.remove('is-active');
      }
      activeButton = button;
      activeButton.classList.add('is-active');

      if (isElement(elements.title)) {
        elements.title.textContent = sanitizers.title(titleText);
      }
      if (isElement(elements.artist)) {
        const normalizedArtistText = sanitizers.artist(artistText);
        if (normalizedArtistText.trim() !== '') {
          elements.artist.textContent = normalizedArtistText;
          elements.artist.classList.remove('hidden');
        } else {
          elements.artist.textContent = '';
          elements.artist.classList.add('hidden');
        }
      }
      elements.content.textContent = sanitizers.desc(descText);
      elements.modal.classList.remove('hidden');
    },
  };
}
