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

export interface ExpandMediaManagementOptions {
  modal: HTMLElement | null;
  presetCategoryId: number | null;
  ensureAccordionPanel(panelId: string): void;
  syncMediaCategoryField(preferredCategoryId?: number | null): void;
  syncMediaVolumeField(): void;
}

function isElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement;
}

export function ensureAccordionPanel(panelId: string): void {
  const accordionBtn = document.querySelector(`[data-accordion-target="#${panelId}"]`) as HTMLElement | null;
  const panel = document.getElementById(panelId);
  if (!panel) return;
  if (accordionBtn && panel.classList.contains('hidden')) {
    accordionBtn.click();
  }
  window.setTimeout(() => {
    if (panel.classList.contains('hidden')) {
      panel.classList.remove('hidden');
      accordionBtn?.setAttribute('aria-expanded', 'true');
    }
  }, 80);
}

export function openPlaylistManagementCategoryCreate(): void {
  ensureAccordionPanel('collapse-item-body-playlist');
  window.setTimeout(() => {
    const categoryNameInput = document.getElementById('category-name') as HTMLInputElement | null;
    categoryNameInput?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    categoryNameInput?.focus();
  }, 120);
}

export function expandMediaManagementWhenOptionsModalVisible(options: ExpandMediaManagementOptions): void {
  const { modal, presetCategoryId, ensureAccordionPanel, syncMediaCategoryField, syncMediaVolumeField } = options;

  const expandMediaAccordion = (): void => {
    const accordionBtn = document.querySelector(
      '[data-accordion-target="#collapse-item-body-media"]'
    ) as HTMLElement | null;
    const panel = document.getElementById('collapse-item-body-media');
    ensureAccordionPanel('collapse-item-body-media');
    if (!accordionBtn || accordionBtn.getAttribute('aria-expanded') === 'true') {
      if (panel?.firstElementChild) {
        (panel.firstElementChild as HTMLElement).scrollTop = 0;
      }
    }
    if (presetCategoryId !== null && presetCategoryId >= 0) {
      syncMediaCategoryField(presetCategoryId);
    }
    syncMediaVolumeField();
  };

  if (!modal) return;
  const isAlreadyOpen = modal.getAttribute('aria-hidden') !== 'true' && !modal.classList.contains('hidden');
  if (isAlreadyOpen) {
    window.setTimeout(expandMediaAccordion, 50);
    return;
  }

  const observer = new MutationObserver(() => {
    const nowOpen = modal.getAttribute('aria-hidden') !== 'true' && !modal.classList.contains('hidden');
    if (nowOpen) {
      observer.disconnect();
      window.setTimeout(expandMediaAccordion, 50);
    }
  });
  observer.observe(modal, { attributes: true, attributeFilter: ['aria-hidden', 'class'] });
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
