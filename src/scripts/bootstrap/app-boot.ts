export interface AppBootController {
  forceRelease(): void;
  release(): void;
  setBootState(state: 'pending' | 'transition' | 'ready'): void;
  setPlaylistReadyState(isReady: boolean): void;
}

export interface CreateAppBootControllerOptions {
  body: HTMLElement | null;
  splash: HTMLElement | null;
  minVisibleMs: number;
  fadeMs: number;
  onReady(): void;
}

export function createAppBootController(options: CreateAppBootControllerOptions): AppBootController {
  let bootGateReleased = false;
  let bootGateCompleting = false;
  let bootGateDelayId: number | null = null;
  let bootGateFadeId: number | null = null;
  let playlistReady = false;
  const bootGateStartedAt = Date.now();

  const syncAppReadySignal = (): void => {
    if (!options.body) {
      return;
    }

    options.body.setAttribute('data-playlist-ready', String(playlistReady));
    options.body.setAttribute('data-app-ready', String(options.body.getAttribute('data-boot') === 'ready'));
  };

  const setBootState = (state: 'pending' | 'transition' | 'ready'): void => {
    if (!options.body) {
      return;
    }

    options.body.setAttribute('data-boot', state);
    syncAppReadySignal();
  };

  const setPlaylistReadyState = (isReady: boolean): void => {
    playlistReady = isReady;
    syncAppReadySignal();
  };

  const complete = (): void => {
    options.body?.classList.remove('app-boot-transitioning');
    options.body?.classList.remove('app-boot-pending');
    setBootState('ready');
    options.splash?.classList.remove('app-boot-fadeout');
    window.setTimeout(() => {
      options.onReady();
    }, 0);
  };

  const release = (): void => {
    if (bootGateReleased || bootGateCompleting) {
      return;
    }

    const startFadeOut = (): void => {
      if (bootGateCompleting) {
        return;
      }
      bootGateCompleting = true;
      options.body?.classList.add('app-boot-transitioning');
      setBootState('transition');
      options.splash?.classList.add('app-boot-fadeout');
      bootGateFadeId = window.setTimeout(() => {
        bootGateReleased = true;
        complete();
      }, options.fadeMs);
    };

    const elapsed = Date.now() - bootGateStartedAt;
    const waitMs = Math.max(0, options.minVisibleMs - elapsed);
    if (waitMs === 0) {
      startFadeOut();
      return;
    }

    if (bootGateDelayId !== null) {
      window.clearTimeout(bootGateDelayId);
      bootGateDelayId = null;
    }
    bootGateDelayId = window.setTimeout(() => {
      bootGateDelayId = null;
      startFadeOut();
    }, waitMs);
  };

  const forceRelease = (): void => {
    if (bootGateReleased) {
      return;
    }
    if (bootGateDelayId !== null) {
      window.clearTimeout(bootGateDelayId);
      bootGateDelayId = null;
    }
    if (bootGateFadeId !== null) {
      window.clearTimeout(bootGateFadeId);
      bootGateFadeId = null;
    }
    bootGateCompleting = false;
    bootGateReleased = true;
    options.body?.classList.remove('app-boot-transitioning');
    options.body?.classList.remove('app-boot-pending');
    setBootState('ready');
    options.splash?.classList.remove('app-boot-fadeout');
    window.setTimeout(() => {
      options.onReady();
    }, 0);
  };

  return {
    forceRelease,
    release,
    setBootState,
    setPlaylistReadyState,
  };
}
