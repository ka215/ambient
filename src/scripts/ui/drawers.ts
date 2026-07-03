export interface ResponsiveDrawerElements {
  playlistDrawer: HTMLElement | null;
  settingsDrawer: HTMLElement | null;
  playlistButton: HTMLElement | null;
  settingsButton: HTMLElement | null;
  playlistCloseButton: HTMLElement | null;
  settingsCloseButton: HTMLElement | null;
}

function isElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement;
}

function isDrawerOpen(drawer: HTMLElement | null): boolean {
  return drawer?.getAttribute('aria-modal') === 'true';
}

export function cleanupDrawerBackdrops(drawers: Array<HTMLElement | null>): void {
  if (drawers.some((drawer) => isDrawerOpen(drawer))) {
    return;
  }

  document.querySelectorAll('div[drawer-backdrop]').forEach((backdrop) => {
    backdrop.remove();
  });

  const hasVisibleModal = Array.from(document.querySelectorAll('[aria-modal="true"]')).some((elm) => {
    return elm instanceof HTMLElement && !elm.classList.contains('hidden');
  });
  if (!hasVisibleModal) {
    document.body.classList.remove('overflow-hidden');
  }
}

export function syncDrawerAndModalBackdrops(width: number, minFullUiWidth: number): void {
  const drawerBackdrops = Array.from(document.querySelectorAll('div[drawer-backdrop]'));
  const modalBackdrop = document.querySelector('div[modal-backdrop]');
  const isFullUi = width >= minFullUiWidth;

  drawerBackdrops.forEach((elm: Element) => {
    if (!isElement(elm)) {
      return;
    }
    elm.classList.toggle('hidden', isFullUi);
  });

  if (isElement(modalBackdrop)) {
    modalBackdrop.classList.toggle('z-40', !isFullUi);
    modalBackdrop.classList.toggle('z-[59]', isFullUi);
  }
}

export function reconcileResponsiveDrawers(
  elements: ResponsiveDrawerElements,
  width: number,
  minFullUiWidth: number
): void {
  const shownLeftDrawer = isDrawerOpen(elements.playlistDrawer);
  const shownRightDrawer = isDrawerOpen(elements.settingsDrawer);

  if (width < minFullUiWidth) {
    if (shownLeftDrawer) {
      elements.playlistCloseButton?.click();
      elements.playlistButton?.setAttribute('data-drawer-backdrop', 'true');
    }
    if (shownRightDrawer) {
      elements.settingsCloseButton?.click();
      elements.settingsButton?.setAttribute('data-drawer-backdrop', 'true');
    }
    return;
  }

  if (!shownLeftDrawer) {
    elements.playlistButton?.setAttribute('data-drawer-backdrop', 'false');
    elements.playlistButton?.click();
  }
  if (!shownRightDrawer) {
    elements.settingsButton?.setAttribute('data-drawer-backdrop', 'false');
    elements.settingsButton?.click();
  }
}

export function closeResponsiveDrawers(
  elements: Pick<ResponsiveDrawerElements, 'playlistCloseButton' | 'settingsCloseButton'>,
  width: number,
  minFullUiWidth: number
): void {
  if (width >= minFullUiWidth) {
    return;
  }

  elements.playlistCloseButton?.click();
  elements.settingsCloseButton?.click();
}
