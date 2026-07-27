export type TimelineLabelFormatter = (value: number | null) => string;

type TimelineMarkerOptions = {
  marker: HTMLElement | null;
  label: HTMLElement | null;
  value: number | null;
  rangeMax: number;
  formatTimelineLabel: TimelineLabelFormatter;
};

export type SyncMediaEditSeekTimelineViewOptions = {
  timeline: HTMLElement | null;
  timelineLoading: HTMLElement | null;
  fixedStartTime: HTMLElement | null;
  fixedEndTime: HTMLElement | null;
  startMarker: HTMLElement | null;
  startLabel: HTMLElement | null;
  fadeInMarker: HTMLElement | null;
  fadeInLabel: HTMLElement | null;
  fadeOutMarker: HTMLElement | null;
  fadeOutLabel: HTMLElement | null;
  endMarker: HTMLElement | null;
  endLabel: HTMLElement | null;
  seekStart: number | null;
  seekEnd: number | null;
  fadeInEnd: number | null;
  fadeOutStart: number | null;
  knownDuration: number | null;
  formatSecondsToTimelineLabel: TimelineLabelFormatter;
};

function setMediaEditSeekTimelineMarker({
  marker,
  label,
  value,
  rangeMax,
  formatTimelineLabel,
}: TimelineMarkerOptions): void {
  if (!(marker instanceof HTMLElement) || !(label instanceof HTMLElement)) {
    return;
  }
  if (!Number.isInteger(value) || value === null || value < 0) {
    marker.classList.add('hidden');
    label.textContent = '';
    return;
  }
  const positionPercent = Math.min(99, Math.max(1, (value / rangeMax) * 100));
  marker.style.setProperty('--media-edit-seek-pos', `${positionPercent}`);
  label.textContent = formatTimelineLabel(value);
  marker.classList.remove('hidden');
}

export function syncMediaEditSeekTimelineView({
  timeline,
  timelineLoading,
  fixedStartTime,
  fixedEndTime,
  startMarker,
  startLabel,
  fadeInMarker,
  fadeInLabel,
  fadeOutMarker,
  fadeOutLabel,
  endMarker,
  endLabel,
  seekStart,
  seekEnd,
  fadeInEnd,
  fadeOutStart,
  knownDuration,
  formatSecondsToTimelineLabel,
}: SyncMediaEditSeekTimelineViewOptions): void {
  if (!(timeline instanceof HTMLElement)) {
    return;
  }
  const rangeMax = Math.max(
    1,
    knownDuration ?? 0,
    seekStart ?? 0,
    seekEnd ?? 0,
    fadeInEnd ?? 0,
    fadeOutStart ?? 0
  );
  if (fixedStartTime instanceof HTMLElement) {
    fixedStartTime.textContent = formatSecondsToTimelineLabel(0);
  }
  if (fixedEndTime instanceof HTMLElement) {
    fixedEndTime.textContent = formatSecondsToTimelineLabel(knownDuration ?? rangeMax);
  }
  setMediaEditSeekTimelineMarker({
    marker: startMarker,
    label: startLabel,
    value: seekStart,
    rangeMax,
    formatTimelineLabel: formatSecondsToTimelineLabel,
  });
  setMediaEditSeekTimelineMarker({
    marker: fadeInMarker,
    label: fadeInLabel,
    value: fadeInEnd,
    rangeMax,
    formatTimelineLabel: formatSecondsToTimelineLabel,
  });
  setMediaEditSeekTimelineMarker({
    marker: fadeOutMarker,
    label: fadeOutLabel,
    value: fadeOutStart,
    rangeMax,
    formatTimelineLabel: formatSecondsToTimelineLabel,
  });
  setMediaEditSeekTimelineMarker({
    marker: endMarker,
    label: endLabel,
    value: seekEnd,
    rangeMax,
    formatTimelineLabel: formatSecondsToTimelineLabel,
  });
  setMediaEditSeekTimelineLoadingView(timeline, timelineLoading, false);
}

export function setMediaEditSeekTimelineLoadingView(
  timeline: HTMLElement | null,
  timelineLoading: HTMLElement | null,
  isLoading: boolean
): void {
  if (timeline instanceof HTMLElement) {
    timeline.classList.toggle('is-loading', isLoading);
    timeline.setAttribute('aria-busy', isLoading ? 'true' : 'false');
  }
  if (timelineLoading instanceof HTMLElement) {
    timelineLoading.classList.toggle('hidden', !isLoading);
    timelineLoading.setAttribute('aria-hidden', isLoading ? 'false' : 'true');
  }
}
