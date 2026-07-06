import { deleteSessionDraftByKey, hydrateSessionDraftStore } from './session-draft-store';

export function hydrateMediaEditDraftMap<TDraft>(options: {
  storageKey: string;
  targetStore: Map<string, TDraft>;
  parseEntry: (value: unknown) => TDraft | null;
}): void {
  options.targetStore.clear();
  hydrateSessionDraftStore<TDraft>({
    storageKey: options.storageKey,
    clearOnError: true,
    parseEntry: options.parseEntry,
  }).forEach((draft, key) => {
    options.targetStore.set(key, draft);
  });
}

export function deleteMediaEditDraftEntry<TDraft>(options: {
  storageKey: string;
  draftStore: Map<string, TDraft>;
  key: string;
}): void {
  deleteSessionDraftByKey({
    storageKey: options.storageKey,
    draftStore: options.draftStore,
    key: options.key,
  });
}
