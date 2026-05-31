export function parseMediaTimeToIntegerSeconds(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) {
      return null;
    }
    return Math.trunc(value);
  }
  const textValue = String(value).trim();
  if (textValue === '') {
    return null;
  }
  if (/^\d+(\.\d+)?$/.test(textValue)) {
    const numeric = Number(textValue);
    if (!Number.isFinite(numeric) || numeric < 0) {
      return null;
    }
    return Math.trunc(numeric);
  }
  if (/^(\d+:)?([0-5]?\d:)?[0-5]?\d$/.test(textValue) && textValue.includes(':')) {
    const times = textValue.split(':');
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    if (times.length === 3) {
      hours = parseInt(times[0] || '0', 10);
      minutes = parseInt(times[1] || '0', 10);
      seconds = parseInt(times[2] || '0', 10);
    } else if (times.length === 2) {
      minutes = parseInt(times[0] || '0', 10);
      seconds = parseInt(times[1] || '0', 10);
    } else {
      seconds = parseInt(times[0] || '0', 10);
    }
    return Math.trunc((hours * 3600) + (minutes * 60) + seconds);
  }
  return null;
}

export function toMediaEditTimingInputValue(value: number | null): string {
  return Number.isInteger(value) && value !== null && value >= 0 ? String(value) : '';
}

export function formatSecondsToHHMMSS(value: number | null): string {
  if (!Number.isInteger(value) || value === null || value < 0) {
    return 'HH:MM:SS';
  }
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = value % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatSecondsToTimelineLabel(value: number | null): string {
  if (!Number.isFinite(value) || value === null || value < 0) {
    return '0:00';
  }
  const total = Math.floor(value);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (hours >= 10) {
    return `${String(hours).padStart(2, '0')}:${mm}:${ss}`;
  }
  if (hours >= 1) {
    return `${String(hours)}:${mm}:${ss}`;
  }
  if (minutes >= 10) {
    return `${String(minutes).padStart(2, '0')}:${ss}`;
  }
  return `${String(minutes)}:${ss}`;
}
