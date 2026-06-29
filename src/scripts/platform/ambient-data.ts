import { isObject } from '../shared/validation';

interface AmbientWindow extends Window {
  AmbientData?: AmbientData;
}

export function getAmbientData(): AmbientData | undefined {
  return (window as AmbientWindow).AmbientData;
}

export function isCloudMode(): boolean {
  return getAmbientData()?.isCloud === true;
}

export function isLocalMode(): boolean {
  return !isCloudMode();
}

export function getLocalizedMessage(key: string, fallback: string = key): string {
  const messages = getAmbientData()?.messages;
  if (!isObject(messages) || typeof messages[key] !== 'string') {
    return fallback;
  }
  const localized = messages[key];
  return localized.trim() === '' ? fallback : localized;
}

export function hasPlaylist(playlist: string): boolean {
  const playlists = getAmbientData()?.playlists;
  return !!(playlists && Object.prototype.hasOwnProperty.call(playlists, playlist));
}
