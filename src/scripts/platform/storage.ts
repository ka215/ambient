import { isObject } from '../shared/validation';

export const USER_DATA_APP_KEY = 'AmbientUserData';
export const MYPLAYLIST_KEY = 'AmbientMyPlaylist';
export const PLAYLIST_CONTEXT_KEY = 'playlistContext';

type WebStorageName = 'localStorage' | 'sessionStorage';

interface AmbientStorageState {
  useStorage?: WebStorageName;
  [key: string]: unknown;
}

interface AmbientStorageWindow extends Window {
  APP_KEY?: string;
  $ambient?: AmbientStorageState;
}

function getAmbientWindow(): AmbientStorageWindow {
  return window as AmbientStorageWindow;
}

function getAppKey(): string {
  const ambientWindow = getAmbientWindow();
  if (!ambientWindow.APP_KEY) {
    ambientWindow.APP_KEY = USER_DATA_APP_KEY;
  }
  return ambientWindow.APP_KEY;
}

function getStorageName(): WebStorageName {
  return getAmbientWindow().$ambient?.useStorage || 'localStorage';
}

function getStorage(): Storage {
  return window[getStorageName()];
}

export function useAppStorage(storageName: WebStorageName = 'localStorage'): void {
  const ambientWindow = getAmbientWindow();
  ambientWindow.APP_KEY = getAppKey();
  if (ambientWindow.$ambient) {
    ambientWindow.$ambient.useStorage = storageName;
    return;
  }
  ambientWindow.$ambient = { useStorage: storageName };
}

export function saveUserData(key: string, data: unknown): boolean {
  const appKey = getAppKey();
  const storage = getStorage();
  const rawData = storage.getItem(appKey);

  if (!rawData) {
    storage.setItem(appKey, JSON.stringify({ [key]: data }));
    return true;
  }

  try {
    const userData = JSON.parse(rawData) as unknown;
    if (isObject(userData)) {
      userData[key] = data;
      storage.setItem(appKey, JSON.stringify(userData));
      return true;
    }
  } catch (_error) {
    return false;
  }

  return false;
}

export function getUserData(key: string | null = null): unknown {
  const rawData = getStorage().getItem(getAppKey());
  if (!rawData) {
    return null;
  }

  try {
    const userData = JSON.parse(rawData) as unknown;
    if (!isObject(userData)) {
      return null;
    }
    return key ? userData[key] ?? null : userData;
  } catch (_error) {
    return null;
  }
}

export function getLocalItem(key: string): string | null {
  return window.localStorage.getItem(key);
}

export function setLocalItem(key: string, value: string): void {
  window.localStorage.setItem(key, value);
}
