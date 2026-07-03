export function bindViewportSyncEvents(options: {
  onResizeSettled: () => void;
  onOrientationChange: () => void;
  onVisualViewportChange: () => void;
  onVisibilityRestore: () => void;
  resizeDelayMs?: number;
}): void {
  let timeoutId = 0;
  const delay = options.resizeDelayMs ?? 300;

  window.addEventListener(
    'resize',
    () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        options.onResizeSettled();
      }, delay);
    },
    false
  );

  window.addEventListener('orientationchange', () => {
    options.onOrientationChange();
  });

  window.visualViewport?.addEventListener('resize', () => {
    options.onVisualViewportChange();
  });

  window.visualViewport?.addEventListener('scroll', () => {
    options.onVisualViewportChange();
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      options.onVisibilityRestore();
    }
  });
}
