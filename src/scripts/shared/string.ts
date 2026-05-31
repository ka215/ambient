export function clampStringLength(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

export function isJsonFilename(name: string): boolean {
  return /\.json$/i.test(name.trim());
}

export function parseJsonWithBom(text: string): unknown {
  const sanitized = text.replace(/^\uFEFF/, '');
  return JSON.parse(sanitized);
}

export function hasUnsafeScheme(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === '') {
    return false;
  }
  const match = trimmed.match(/^([a-z][a-z0-9+.-]*):/i);
  if (!match) {
    return false;
  }
  const scheme = (match[1] || '').toLowerCase();
  return !['http', 'https'].includes(scheme);
}

export function basename(path: string): string {
  return path.split(/[\/\\]/).pop()?.split('.').shift() || '';
}

export function getExt(path: string): string {
  const cleanPath = path.split(/[?#]/).shift() || '';
  return cleanPath.split('.').pop()?.toLowerCase() || '';
}

export function escapeHTML(value: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(value).replace(/[&<>"']/g, (char) => map[char] || char);
}

export function snakeToCapital(str: string): string {
  return str.replace(/_./g, (match: string) => match.charAt(1).toUpperCase());
}
