export interface LocalMediaUrlBeforeCheckContext {
  source: 'media-management';
  rawUrl: string;
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
