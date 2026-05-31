export function isObject(value: any): value is Record<string, any> {
  return value !== null && typeof value === 'object';
}

export function isNumberString(numstr: any): numstr is string {
  return typeof numstr === 'string' && numstr !== '' && !isNaN(Number(numstr));
}

export function isBooleanString(boolstr: any): boolstr is string {
  return typeof boolstr === 'string' && boolstr !== '' && /^(true|false)$/i.test(boolstr);
}

export function inRange(num: any, min: number, max: number): boolean {
  if (isNaN(Number(num))) {
    return false;
  }
  const normalized = Number(num);
  return (normalized - min) * (normalized - max) <= 0;
}

export function inArray(contains: any | any[], targetArray: any[], atLeastOne: boolean = false): boolean {
  if (!Array.isArray(targetArray)) return false;
  const items = Array.isArray(contains) ? contains : [contains];
  return atLeastOne
    ? items.some((item: any) => targetArray.includes(item))
    : items.every((item: any) => targetArray.includes(item));
}

export function normalizeNonNegativeNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '' || Number.isNaN(Number(trimmed))) {
      return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }
  return null;
}

export function normalizeBoolish(value: unknown): boolean | null {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    if (value === 0) return false;
    if (value === 1) return true;
    return null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === '0' || trimmed === 'false') return false;
    if (trimmed === '1' || trimmed === 'true') return true;
  }
  return null;
}
