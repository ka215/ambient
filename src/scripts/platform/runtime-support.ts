import {
  getAmbientData,
  getLocalizedMessage,
  isLocalMode,
} from './ambient-data';
import {
  saveUserData,
  useAppStorage,
} from './storage';

export function useStorageAdapter(storage: string = 'localStorage'): void {
  useAppStorage(storage === 'sessionStorage' ? 'sessionStorage' : 'localStorage');
}

export function saveStorageAdapter(
  key: string,
  data: unknown,
  logger?: (...args: unknown[]) => void
): boolean {
  const saved = saveUserData(key, data);
  if (!saved) {
    logger?.('saveStge: failed to save user data', key);
  }
  return saved;
}

export function runtimeLogger(...args: unknown[]): unknown {
  const ambientData = getAmbientData();
  let isForce = ambientData?.debug || false;

  if (args.length > 0 && typeof args[args.length - 1] === 'string' && args[args.length - 1] === 'force') {
    isForce = args.pop() === 'force';
  }

  if (!isForce) {
    return;
  }

  const now = new Date();
  const dateStr = `[${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
  const type = typeof args[0] === 'string' && /^(error|warn|info|debug|log)$/i.test(args[0])
    ? String(args.shift())
    : 'log';

  return (console as any)[type](dateStr, ...args);
}

export {
  getAmbientData as getRuntimeAmbientData,
  getLocalizedMessage as getRuntimeLocalizedMessage,
  isLocalMode as isRuntimeLocalMode,
};
