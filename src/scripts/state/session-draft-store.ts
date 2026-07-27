export function persistSessionDraftStore<T>(storageKey: string, draftStore: Map<string, T>): void {
  try {
    const serialized = JSON.stringify(Object.fromEntries(draftStore));
    window.sessionStorage.setItem(storageKey, serialized);
  } catch (_error) {
    // Ignore storage failures and keep in-memory drafts only.
  }
}

export function hydrateSessionDraftStore<T>(options: {
  storageKey: string;
  parseEntry: (value: unknown) => T | null;
  clearOnError?: boolean;
}): Map<string, T> {
  const draftStore = new Map<string, T>();

  try {
    const raw = window.sessionStorage.getItem(options.storageKey);
    if (!raw) {
      return draftStore;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return draftStore;
    }

    Object.entries(parsed).forEach(([key, value]) => {
      const normalized = options.parseEntry(value);
      if (normalized !== null) {
        draftStore.set(key, normalized);
      }
    });
  } catch (_error) {
    if (options.clearOnError) {
      draftStore.clear();
    }
  }

  return draftStore;
}

export function setSessionDraftByKey<T>(options: {
  storageKey: string;
  draftStore: Map<string, T>;
  key: string;
  draft: T;
  cloneDraft: (draft: T) => T;
}): void {
  options.draftStore.set(options.key, options.cloneDraft(options.draft));
  persistSessionDraftStore(options.storageKey, options.draftStore);
}

export function deleteSessionDraftByKey<T>(options: {
  storageKey: string;
  draftStore: Map<string, T>;
  key: string;
}): void {
  options.draftStore.delete(options.key);
  persistSessionDraftStore(options.storageKey, options.draftStore);
}

export function syncSessionDraftState<T>(options: {
  storageKey: string;
  draftStore: Map<string, T>;
  key: string;
  baseDraft: T;
  nextDraft: T;
  isSameDraft: (a: T, b: T) => boolean;
  cloneDraft: (draft: T) => T;
}): boolean {
  const isDirty = !options.isSameDraft(options.nextDraft, options.baseDraft);

  if (isDirty) {
    setSessionDraftByKey({
      storageKey: options.storageKey,
      draftStore: options.draftStore,
      key: options.key,
      draft: options.nextDraft,
      cloneDraft: options.cloneDraft,
    });
  } else {
    deleteSessionDraftByKey({
      storageKey: options.storageKey,
      draftStore: options.draftStore,
      key: options.key,
    });
  }

  return isDirty;
}
