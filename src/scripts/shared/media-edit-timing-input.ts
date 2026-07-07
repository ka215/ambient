import {
  formatSecondsToHHMMSS,
  formatSecondsToTimelineLabel,
  parseMediaTimeToIntegerSeconds,
  toMediaEditTimingInputValue,
} from './time';

export {
  formatSecondsToHHMMSS,
  formatSecondsToTimelineLabel,
  parseMediaTimeToIntegerSeconds,
  toMediaEditTimingInputValue,
};

export function normalizeMediaEditTimingValue(value: unknown, fallback: number | null = null): number | null {
  const parsed = parseMediaTimeToIntegerSeconds(value);
  if (parsed !== null) {
    return parsed;
  }
  return fallback;
}

export function sanitizeMediaEditTimingInputField(field: HTMLInputElement | null): void {
  if (!(field instanceof HTMLInputElement)) {
    return;
  }
  if (field.value === '') {
    return;
  }
  field.value = field.value.replace(/[^\d]/g, '');
}

export function stepMediaEditTimingField(field: HTMLInputElement, direction: 1 | -1): void {
  const stepValue = Number(field.step);
  const step = Number.isFinite(stepValue) && stepValue > 0 ? stepValue : 1;
  const minValue = field.min !== '' && Number.isFinite(Number(field.min)) ? Number(field.min) : 0;
  const maxValue = field.max !== '' && Number.isFinite(Number(field.max)) ? Number(field.max) : null;
  const current = parseMediaTimeToIntegerSeconds(field.value) ?? minValue;
  let nextValue = current + (step * direction);
  if (nextValue < minValue) {
    nextValue = minValue;
  }
  if (maxValue !== null && nextValue > maxValue) {
    nextValue = maxValue;
  }
  field.value = toMediaEditTimingInputValue(Math.max(0, Math.trunc(nextValue)));
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));
}
