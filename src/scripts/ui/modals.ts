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
  isOpen(): boolean;
  open(titleText: string, artistText: string, descText: string, button: HTMLElement): void;
}

export interface PlaylistConfirmModalElements {
  modal: HTMLElement | null;
  title: HTMLElement | null;
  body: HTMLElement | null;
}

export interface PlaylistConfirmModalController {
  apply(): void;
  cancel(): void;
  close(): void;
  open(title: string, body: string, onApply: () => void, onCancel?: () => void): void;
}

export interface OptionsModalElements {
  modal: HTMLElement | null;
  panel: HTMLElement | null;
}

export interface OptionsModalLayout {
  width: number;
  minFullUIWidth: number;
}

export interface OptionsModalControllerOptions {
  elements: OptionsModalElements;
  getLayout(): OptionsModalLayout;
  beforeShow?(): void;
}

export interface OptionsModalController {
  cleanupBackdrops(): void;
  handleBackdropClick(evt: Event, afterHide?: () => void): void;
  handleBackdropPointerDown(evt: PointerEvent): void;
  hide(): void;
  isVisible(): boolean;
  show(): void;
}

export interface ExpandMediaManagementOptions {
  modal: HTMLElement | null;
  presetCategoryId: number | null;
  ensureAccordionPanel(panelId: string): void;
  syncMediaCategoryField(preferredCategoryId?: number | null): void;
  syncMediaVolumeField(): void;
}

export interface OptionsModalBindings {
  triggerButton: HTMLButtonElement | null;
  closeButton: HTMLButtonElement | null;
  modal: HTMLElement | null;
  onTrigger(): void;
  onClose(): void;
  onCloseCapture?(): void;
  onBackdropPointerDown(evt: PointerEvent): void;
  onBackdropClick(evt: Event): void;
}

export interface ModalKeyboardBindings {
  onEscapeMediaEditCategory(): void;
  onEscapeMediaEdit(): void;
  onTabMediaEdit(evt: KeyboardEvent): void;
  onEscapeOptions(): void;
  onEscapePlaylistDesc(): void;
  isMediaEditModalVisible(): boolean;
  isMediaEditCategoryDropdownVisible(): boolean;
  isOptionsModalVisible(): boolean;
  isPlaylistDescOpen(): boolean;
}

export interface PlaylistDescModalBindings {
  closeButton: HTMLButtonElement | null;
  backdrop: HTMLElement | null;
  managementLink: HTMLAnchorElement | null;
  onClose(): void;
  onBackdrop(): void;
  onOpenPlaylistManagementCategory(): void;
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

export function createOptionsModalController(options: OptionsModalControllerOptions): OptionsModalController {
  const { elements, getLayout, beforeShow } = options;
  let hideTimer: number | null = null;
  let backdropPointerStarted = false;

  const isVisible = (): boolean => {
    return isElement(elements.modal) &&
      !elements.modal.classList.contains('hidden') &&
      elements.modal.getAttribute('aria-hidden') !== 'true';
  };

  const cleanupBackdrops = (): void => {
    if (isVisible()) {
      return;
    }

    document.querySelectorAll('div[modal-backdrop]').forEach((backdrop) => {
      backdrop.remove();
    });

    const hasVisibleModal = Array.from(document.querySelectorAll('[aria-modal="true"]')).some((elm) => {
      return elm instanceof HTMLElement && !elm.classList.contains('hidden');
    });
    if (!hasVisibleModal) {
      document.body.classList.remove('overflow-hidden');
    }
  };

  const clearHideTimer = (): void => {
    if (hideTimer !== null) {
      window.clearTimeout(hideTimer);
      hideTimer = null;
    }
  };

  const hide = (): void => {
    if (!isElement(elements.modal)) {
      return;
    }
    clearHideTimer();
    elements.modal.style.opacity = '0';
    elements.modal.style.pointerEvents = 'none';
    elements.modal.setAttribute('aria-hidden', 'true');
    elements.modal.removeAttribute('aria-modal');
    elements.modal.removeAttribute('role');
    if (isElement(elements.panel)) {
      elements.panel.style.opacity = '0';
      elements.panel.style.transform = 'translateY(0.5rem) scale(0.98)';
    }
    document.querySelectorAll('div[modal-backdrop]').forEach((backdrop) => {
      (backdrop as HTMLElement).style.opacity = '0';
    });
    hideTimer = window.setTimeout(() => {
      if (!isVisible() && isElement(elements.modal)) {
        elements.modal.classList.add('hidden');
        elements.modal.classList.remove('flex');
        cleanupBackdrops();
      }
      hideTimer = null;
    }, 180);
  };

  return {
    cleanupBackdrops,
    handleBackdropClick(evt: Event, afterHide?: () => void): void {
      if (isElement(elements.modal) && evt.target === elements.modal && backdropPointerStarted) {
        hide();
        afterHide?.();
      }
      backdropPointerStarted = false;
    },
    handleBackdropPointerDown(evt: PointerEvent): void {
      backdropPointerStarted = evt.target === elements.modal;
    },
    hide,
    isVisible,
    show(): void {
      if (!isElement(elements.modal) || isVisible()) {
        return;
      }
      clearHideTimer();
      beforeShow?.();
      cleanupBackdrops();

      elements.modal.classList.add('flex');
      elements.modal.classList.remove('hidden');
      elements.modal.style.zIndex = '9999';
      elements.modal.style.opacity = '0';
      elements.modal.style.pointerEvents = 'none';
      elements.modal.style.transition = 'opacity 180ms ease';
      elements.modal.setAttribute('aria-modal', 'true');
      elements.modal.setAttribute('role', 'dialog');
      elements.modal.removeAttribute('aria-hidden');
      if (isElement(elements.panel)) {
        elements.panel.style.opacity = '0';
        elements.panel.style.transform = 'translateY(0.5rem) scale(0.98)';
        elements.panel.style.transition = 'opacity 180ms ease, transform 180ms ease';
      }

      const backdrop = document.createElement('div');
      backdrop.setAttribute('modal-backdrop', '');
      const layout = getLayout();
      backdrop.className = layout.width >= layout.minFullUIWidth
        ? 'modal-backdrop-layer fixed inset-0 z-[59]'
        : 'modal-backdrop-layer fixed inset-0 z-40';
      backdrop.style.zIndex = '9998';
      backdrop.style.pointerEvents = 'none';
      backdrop.style.opacity = '0';
      backdrop.style.transition = 'opacity 180ms ease';
      if (elements.modal.parentNode) {
        elements.modal.parentNode.insertBefore(backdrop, elements.modal);
      } else {
        document.body.appendChild(backdrop);
      }
      document.body.classList.add('overflow-hidden');
      window.requestAnimationFrame(() => {
        if (!isElement(elements.modal)) {
          return;
        }
        elements.modal.style.opacity = '1';
        elements.modal.style.pointerEvents = 'auto';
        if (isElement(elements.panel)) {
          elements.panel.style.opacity = '1';
          elements.panel.style.transform = 'translateY(0) scale(1)';
        }
        backdrop.style.opacity = '1';
      });
    },
  };
}

export function bindOptionsModalControls(bindings: OptionsModalBindings): void {
  if (bindings.closeButton && bindings.onCloseCapture) {
    bindings.closeButton.addEventListener('click', () => {
      bindings.onCloseCapture?.();
    }, true);
  }

  bindings.triggerButton?.addEventListener('click', (evt: Event) => {
    evt.preventDefault();
    bindings.onTrigger();
  });

  bindings.closeButton?.addEventListener('click', (evt: Event) => {
    evt.preventDefault();
    bindings.onClose();
  });

  bindings.modal?.addEventListener('pointerdown', (evt: PointerEvent) => {
    bindings.onBackdropPointerDown(evt);
  });

  bindings.modal?.addEventListener('click', (evt: Event) => {
    bindings.onBackdropClick(evt);
  });
}

export function bindModalKeyboardControls(bindings: ModalKeyboardBindings): void {
  document.addEventListener('keydown', (evt: KeyboardEvent) => {
    if (evt.key === 'Escape' && bindings.isMediaEditModalVisible() && bindings.isMediaEditCategoryDropdownVisible()) {
      evt.preventDefault();
      bindings.onEscapeMediaEditCategory();
      return;
    }
    if (evt.key === 'Escape' && bindings.isMediaEditModalVisible()) {
      evt.preventDefault();
      bindings.onEscapeMediaEdit();
      return;
    }
    if (evt.key === 'Tab' && bindings.isMediaEditModalVisible()) {
      bindings.onTabMediaEdit(evt);
      return;
    }
    if (evt.key === 'Escape' && bindings.isOptionsModalVisible()) {
      bindings.onEscapeOptions();
    } else if (evt.key === 'Escape' && bindings.isPlaylistDescOpen()) {
      bindings.onEscapePlaylistDesc();
    }
  });
}

export function bindPlaylistDescModalControls(bindings: PlaylistDescModalBindings): void {
  bindings.closeButton?.addEventListener('click', (evt: Event) => {
    evt.preventDefault();
    bindings.onClose();
  });

  bindings.backdrop?.addEventListener('click', (evt: Event) => {
    evt.preventDefault();
    bindings.onBackdrop();
  });

  bindings.managementLink?.addEventListener('click', (evt: Event) => {
    evt.preventDefault();
    bindings.onOpenPlaylistManagementCategory();
  });
}

export function createPlaylistConfirmModalController(
  elements: PlaylistConfirmModalElements
): PlaylistConfirmModalController {
  let applyCallback: (() => void) | null = null;
  let cancelCallback: (() => void) | null = null;

  const close = (): void => {
    if (!isElement(elements.modal)) {
      return;
    }
    elements.modal.classList.add('hidden');
    applyCallback = null;
    cancelCallback = null;
  };

  return {
    apply(): void {
      if (applyCallback) {
        applyCallback();
      }
      close();
    },
    cancel(): void {
      if (cancelCallback) {
        cancelCallback();
      }
      close();
    },
    close,
    open(title: string, body: string, onApply: () => void, onCancel?: () => void): void {
      if (!isElement(elements.modal)) {
        return;
      }
      if (isElement(elements.title)) {
        elements.title.textContent = title;
      }
      if (isElement(elements.body)) {
        elements.body.textContent = body;
      }
      applyCallback = onApply;
      cancelCallback = onCancel || null;
      elements.modal.classList.remove('hidden');
    },
  };
}

export function createPlaylistDescModalController(
  elements: PlaylistDescModalElements,
  sanitizers: PlaylistDescModalSanitizers
): PlaylistDescModalController {
  let activeButton: HTMLElement | null = null;

  const isOpen = (): boolean => {
    return isElement(elements.modal) && !elements.modal.classList.contains('hidden');
  };

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
    isOpen,
    open(titleText: string, artistText: string, descText: string, button: HTMLElement): void {
      if (!isElement(elements.modal) || !isElement(elements.content)) {
        return;
      }
      if (activeButton === button && isOpen()) {
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
