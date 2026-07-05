export interface ResponsiveDrawerElements {
  playlistDrawer: HTMLElement | null;
  settingsDrawer: HTMLElement | null;
  playlistButton: HTMLElement | null;
  settingsButton: HTMLElement | null;
  playlistCloseButton: HTMLElement | null;
  settingsCloseButton: HTMLElement | null;
}

export interface DrawerToggleButtonStateOptions {
  active: boolean;
  button: HTMLButtonElement | null;
}

function isElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement;
}

function isDrawerOpen(drawer: HTMLElement | null): boolean {
  return drawer?.getAttribute('aria-modal') === 'true';
}

export function isResponsiveDrawerOpen(drawer: HTMLElement | null, hiddenClass: string): boolean {
  if (!drawer) {
    return false;
  }
  const ariaModal = drawer.getAttribute('aria-modal') === 'true';
  const hiddenByClass = drawer.classList.contains(hiddenClass);
  return ariaModal || !hiddenByClass;
}

export function syncDrawerToggleButtonState(options: DrawerToggleButtonStateOptions): void {
  const button = options.button;
  if (!button) {
    return;
  }

  button.setAttribute('aria-pressed', options.active ? 'true' : 'false');
  button.classList.toggle('bg-blue-50', options.active);
  button.classList.toggle('dark:bg-gray-800', options.active);

  const labelNodes = Array.from(button.querySelectorAll('span:not(.sr-only)')) as HTMLElement[];
  labelNodes.forEach((node: HTMLElement) => {
    node.classList.toggle('text-blue-600', options.active);
    node.classList.toggle('dark:text-blue-500', options.active);
    node.classList.toggle('text-gray-500', !options.active);
    node.classList.toggle('dark:text-gray-400', !options.active);
  });

  const iconNodes = Array.from(button.querySelectorAll('svg')) as SVGElement[];
  iconNodes.forEach((node: SVGElement) => {
    node.classList.toggle('text-blue-600', options.active);
    node.classList.toggle('dark:text-blue-500', options.active);
    node.classList.toggle('text-gray-500', !options.active);
    node.classList.toggle('dark:text-gray-400', !options.active);
  });
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
