export type LocalMediaUrlResolveSource = 'media-management' | 'html-playback' | 'media-edit-preview';
export type LocalMediaUrlResolvePhase = 'check' | 'playback' | 'preview';

export interface LocalMediaUrlBeforeCheckContext {
  source: LocalMediaUrlResolveSource;
  phase: LocalMediaUrlResolvePhase;
  rawUrl: string;
  currentUrl: string;
  defaultResolved: boolean;
  defaultResolverName?: string;
}

export async function applyAmbientFilter<TValue, TContext>(
  hookName: string,
  value: TValue,
  context: TContext
): Promise<TValue> {
  const hooks = (window as any).AmbientHooks;
  if (!hooks || typeof hooks.applyFilters !== 'function') {
    return value;
  }
  return hooks.applyFilters(hookName, value, context) as Promise<TValue>;
}
