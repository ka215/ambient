import type { MediaItem } from '../types/ambient';
import { clampStringLength, isJsonFilename } from './string';

export function stripHtmlTags(value: string): string {
  const parser = document.createElement('div');
  parser.innerHTML = value;
  return parser.textContent || parser.innerText || '';
}

export function sanitizeMediaText(value: string, maxLength: number, disallowedControlChars: RegExp): string {
  const normalized = stripHtmlTags(String(value || ''))
    .replace(/\r\n?/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(disallowedControlChars, '')
    .trim();
  return clampStringLength(normalized, maxLength);
}

export function sanitizeMediaTextInput(value: string, maxLength: number, disallowedControlChars: RegExp): string {
  const normalized = stripHtmlTags(String(value || ''))
    .replace(/\r\n?/g, ' ')
    .replace(disallowedControlChars, '');
  return clampStringLength(normalized, maxLength);
}

export function sanitizeMediaDescInput(value: string, maxLength: number, disallowedControlChars: RegExp): string {
  const normalized = stripHtmlTags(String(value || ''))
    .replace(/\r\n?/g, ' ')
    .replace(/\t/g, ' ')
    .replace(disallowedControlChars, '')
    .replace(/ {2,}/g, ' ')
    .trim();
  return clampStringLength(normalized, maxLength);
}

export function sanitizeMediaDescInputLive(value: string, maxLength: number, disallowedControlChars: RegExp): string {
  const normalized = stripHtmlTags(String(value || ''))
    .replace(/\r\n?/g, ' ')
    .replace(/\t/g, ' ')
    .replace(disallowedControlChars, '');
  return clampStringLength(normalized, maxLength);
}

export function sanitizeMediaDesc(value: string, maxLength: number, disallowedControlChars: RegExp): string {
  const normalized = sanitizeMediaDescInput(value, maxLength, disallowedControlChars)
    .replace(/\\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[^\S\n]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return clampStringLength(normalized, maxLength);
}

export function sanitizeMediaEditDescInput(value: string, maxLength: number, disallowedControlChars: RegExp): string {
  const normalized = stripHtmlTags(String(value || ''))
    .replace(/\\n/g, '\n')
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, ' ')
    .replace(disallowedControlChars, '');
  return clampStringLength(normalized, maxLength);
}

export function sanitizeMediaEditDescForStorage(value: string, maxLength: number, disallowedControlChars: RegExp): string {
  return sanitizeMediaEditDescInput(value, maxLength, disallowedControlChars)
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .replace(/\n/g, '\\n');
}

export function sanitizeMediaItemTextFields<T extends Partial<MediaItem>>(options: {
  item: T;
  titleMaxLength: number;
  artistMaxLength: number;
  descMaxLength: number;
  disallowedControlChars: RegExp;
}): T {
  return {
    ...options.item,
    title: sanitizeMediaText(String(options.item.title || ''), options.titleMaxLength, options.disallowedControlChars),
    artist: sanitizeMediaText(String(options.item.artist || ''), options.artistMaxLength, options.disallowedControlChars),
    desc: sanitizeMediaDesc(String(options.item.desc || ''), options.descMaxLength, options.disallowedControlChars),
  };
}

export function isLikelyJsonFile(file: File): boolean {
  if (isJsonFilename(file.name)) {
    return true;
  }
  const type = (file.type || '').toLowerCase();
  return type === 'application/json' || type === 'text/json';
}

export function isLikelyMediaFile(file: File): boolean {
  const type = (file.type || '').toLowerCase();
  if (/^(audio|video)\//.test(type)) {
    return true;
  }
  return /(\.(aac|avi|flac|m4a|mid|midi|mp3|mp4|mpeg|mpg|ogg|ogv|opus|ts|wav|weba|webm|wma|3gp|3g2))$/i.test(file.name);
}
