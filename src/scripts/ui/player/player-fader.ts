export interface PlaybackFaderAdapter {
  kind: 'youtube' | 'local';
  readDuration(): number;
  readLevel(): number;
  readCurrentTimeMs(): number;
  writeLevel(level: number): void;
  onFadeOutCompleted?: () => void;
}

export interface RunPlaybackFadeOptions {
  adapter: PlaybackFaderAdapter;
  period: number;
  point: number;
  readTargetVolume: () => number;
  startFader: (callback: () => void, intervalMs: number) => void;
  abortFader: () => void;
  inRange: (value: number, min: number, max: number) => boolean;
  logger: (...args: unknown[]) => void;
}

export function runPlaybackFadeIn(options: RunPlaybackFadeOptions): void {
  options.abortFader();
  const fadeEnd = (options.point + options.period) * 1000;
  const steps = options.period * 10;
  const stepVolume = options.readTargetVolume() / steps;

  options.logger(
    'fadeIn::',
    options.adapter.readDuration(),
    options.adapter.readLevel(),
    options.period,
    options.point,
    fadeEnd,
    steps,
    stepVolume,
    options.readTargetVolume()
  );

  let elapsed = 0;
  let incrementVolume = 0;

  options.startFader(() => {
    const currentTime = options.adapter.readCurrentTimeMs();

    if (options.inRange(currentTime, options.point * 1000, fadeEnd)) {
      elapsed = Math.floor((currentTime - options.point * 1000) / 100);
      incrementVolume = elapsed > 0 ? (stepVolume * elapsed * elapsed) / steps : 0;
      options.adapter.writeLevel(incrementVolume);
    } else if (currentTime >= fadeEnd) {
      options.adapter.writeLevel(options.readTargetVolume());
      options.abortFader();
    } else {
      options.adapter.writeLevel(0);
    }

    options.logger(
      `fadeIn:: ${currentTime}ms from ${options.point}; elapsed: ${elapsed}`,
      incrementVolume,
      options.adapter.readLevel()
    );
  }, 100);
}

export function runPlaybackFadeOut(options: RunPlaybackFadeOptions): void {
  options.abortFader();
  const fadeStart = (options.point - options.period) * 1000;
  const steps = options.period * 10;
  const stepVolume = (options.adapter.readLevel() || 100) / steps;

  options.logger(
    'fadeOut::',
    options.adapter.readDuration(),
    options.adapter.readLevel(),
    options.period,
    options.point,
    fadeStart,
    steps,
    stepVolume,
    options.readTargetVolume()
  );

  let elapsed = 0;
  let decrementVolume = 0;

  options.startFader(() => {
    const currentTime = options.adapter.readCurrentTimeMs();

    if (options.inRange(currentTime, fadeStart, options.point * 1000)) {
      elapsed = Math.floor((options.point * 1000 - currentTime) / 100);
      decrementVolume = elapsed > 0 ? stepVolume * elapsed : 0;
      options.adapter.writeLevel(decrementVolume);

      options.logger(
        `fadeOut:: ${currentTime}ms until ${options.point * 1000}ms; elapsed: ${elapsed}`,
        decrementVolume,
        options.adapter.readLevel()
      );
    } else if (currentTime >= options.point * 1000) {
      options.adapter.writeLevel(0);
      options.abortFader();
      options.adapter.onFadeOutCompleted?.();
    }
  }, 100);
}
