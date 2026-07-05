export interface PlaylistInteractionBindings {
  listElement: HTMLElement | null;
  onItemActivate(target: HTMLElement, event: Event): void;
  onDescriptionActivate(target: HTMLElement, event: Event): void;
  getDescriptionPayload(target: HTMLElement | null): unknown;
}

export interface PlayerControlBindings {
  carouselPrevButton: HTMLButtonElement | null;
  carouselNextButton: HTMLButtonElement | null;
  refreshButton: HTMLButtonElement | null;
  windowFullButton: HTMLButtonElement | null;
  windowFullToggle: HTMLInputElement | null;
  menuCollapseButton: HTMLButtonElement | null;
  playButton: HTMLButtonElement | null;
  pauseButton: HTMLButtonElement | null;
  onCarouselPrev(): void;
  onCarouselNext(): void;
  onRefresh(): void;
  onToggleWindowFull(): void;
  onWindowFullToggleChange(checked: boolean): void;
  onToggleMenuCollapse(): void;
  onPlay(): void;
  onPause(): void;
}

export function bindPlaylistInteractionControls(bindings: PlaylistInteractionBindings): void {
  bindings.listElement?.addEventListener('click', (evt: Event) => {
    const target = evt.target as HTMLElement | null;
    if (!target) {
      return;
    }

    if (bindings.getDescriptionPayload(target)) {
      bindings.onDescriptionActivate(target, evt);
      return;
    }

    const itemElm = target.closest('a[data-playlist-item]') as HTMLElement | null;
    if (!itemElm) {
      return;
    }

    bindings.onItemActivate(itemElm, evt);
  });

  bindings.listElement?.addEventListener('keydown', (evt: KeyboardEvent) => {
    const target = evt.target as HTMLElement | null;
    if (!bindings.getDescriptionPayload(target)) {
      return;
    }
    if (evt.key === 'Enter' || evt.key === ' ') {
      bindings.onDescriptionActivate(target as HTMLElement, evt);
    }
  });
}

export function bindPlayerControls(bindings: PlayerControlBindings): void {
  bindings.carouselPrevButton?.addEventListener('click', () => {
    bindings.onCarouselPrev();
  });

  bindings.carouselNextButton?.addEventListener('click', () => {
    bindings.onCarouselNext();
  });

  bindings.refreshButton?.addEventListener('click', () => {
    bindings.onRefresh();
  });

  bindings.windowFullButton?.addEventListener('click', () => {
    bindings.onToggleWindowFull();
  });

  bindings.windowFullToggle?.addEventListener('change', (evt: Event) => {
    bindings.onWindowFullToggleChange((evt.target as HTMLInputElement).checked);
  });

  bindings.menuCollapseButton?.addEventListener('click', () => {
    bindings.onToggleMenuCollapse();
  });

  bindings.playButton?.addEventListener('click', () => {
    bindings.onPlay();
  });

  bindings.pauseButton?.addEventListener('click', () => {
    bindings.onPause();
  });
}
