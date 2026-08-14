import {
  applyAmbientFilter,
  type LocalMediaUrlBeforeCheckContext,
  type LocalMediaUrlResolvePhase,
  type LocalMediaUrlResolveSource,
} from '../shared/ambient-hooks';
import { normalizeExternalMediaUrl } from './external-media-url';

export type { LocalMediaUrlResolvePhase, LocalMediaUrlResolveSource };

export interface LocalMediaUrlResolveResult {
  originUrl: string;
  url: string;
  resolved: boolean;
  defaultResolved: boolean;
  defaultResolverName?: string;
  error?: string;
}

export type LocalMediaUrlFilterValue = string | Partial<LocalMediaUrlResolveResult>;

const CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_RESOLVER_NAME = 'ambient-normalize-external-url';

const cache = new Map<string, {
  expiresAt: number;
  result: LocalMediaUrlResolveResult;
}>();

function cacheKey(originUrl: string, source: LocalMediaUrlResolveSource, phase: LocalMediaUrlResolvePhase): string {
  return `v1::${source}::${phase}::${originUrl}`;
}

function cloneResult(result: LocalMediaUrlResolveResult): LocalMediaUrlResolveResult {
  return { ...result };
}

function applyDefaultLocalMediaUrlResolver(originUrl: string): {
  url: string;
  resolved: boolean;
  resolverName?: string;
} {
  const normalizedUrl = normalizeExternalMediaUrl(originUrl);
  if (!normalizedUrl) {
    return {
      url: originUrl,
      resolved: false,
    };
  }

  return {
    url: normalizedUrl,
    resolved: normalizedUrl !== originUrl,
    resolverName: normalizedUrl !== originUrl ? DEFAULT_RESOLVER_NAME : undefined,
  };
}

function resolveFilterValue(
  filterValue: LocalMediaUrlFilterValue,
  fallbackUrl: string,
  baseResult: LocalMediaUrlResolveResult
): LocalMediaUrlResolveResult {
  if (typeof filterValue === 'string') {
    const normalizedUrl = normalizeExternalMediaUrl(filterValue);
    const url = normalizedUrl || fallbackUrl;
    return {
      ...baseResult,
      url,
      resolved: baseResult.resolved || url !== baseResult.originUrl,
      error: normalizedUrl ? undefined : 'invalid-filter-url',
    };
  }

  if (!filterValue || typeof filterValue !== 'object') {
    return baseResult;
  }

  const candidateUrl = typeof filterValue.url === 'string' ? filterValue.url : fallbackUrl;
  const normalizedUrl = normalizeExternalMediaUrl(candidateUrl);
  const url = normalizedUrl || fallbackUrl;
  return {
    ...baseResult,
    ...filterValue,
    originUrl: baseResult.originUrl,
    url,
    resolved: Boolean(filterValue.resolved ?? (baseResult.resolved || url !== baseResult.originUrl)),
    defaultResolved: baseResult.defaultResolved,
    defaultResolverName: baseResult.defaultResolverName,
    error: normalizedUrl ? filterValue.error : 'invalid-filter-url',
  };
}

export async function resolveLocalMediaUrl(options: {
  url: string;
  source: LocalMediaUrlResolveSource;
  phase: LocalMediaUrlResolvePhase;
  useCache?: boolean;
  refreshCache?: boolean;
}): Promise<LocalMediaUrlResolveResult> {
  const originUrl = normalizeExternalMediaUrl(options.url) || String(options.url || '').trim();
  const key = cacheKey(originUrl, options.source, options.phase);
  const now = Date.now();
  if (options.useCache !== false && !options.refreshCache) {
    const cached = cache.get(key);
    if (cached && cached.expiresAt > now) {
      return cloneResult(cached.result);
    }
  }

  const defaultResult = applyDefaultLocalMediaUrlResolver(originUrl);
  const baseResult: LocalMediaUrlResolveResult = {
    originUrl,
    url: defaultResult.url,
    resolved: defaultResult.resolved,
    defaultResolved: defaultResult.resolved,
    defaultResolverName: defaultResult.resolverName,
  };
  const context: LocalMediaUrlBeforeCheckContext = {
    source: options.source,
    phase: options.phase,
    rawUrl: originUrl,
    currentUrl: baseResult.url,
    defaultResolved: baseResult.defaultResolved,
    defaultResolverName: baseResult.defaultResolverName,
  };

  let resolvedResult = baseResult;
  try {
    const filteredValue = await applyAmbientFilter<LocalMediaUrlFilterValue, LocalMediaUrlBeforeCheckContext>(
      'localMediaUrl.beforeCheck',
      baseResult.url,
      context
    );
    resolvedResult = resolveFilterValue(filteredValue, baseResult.url, baseResult);
  } catch (error) {
    resolvedResult = {
      ...baseResult,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  cache.set(key, {
    expiresAt: now + CACHE_TTL_MS,
    result: cloneResult(resolvedResult),
  });
  return resolvedResult;
}

export function clearLocalMediaUrlResolverCache(): void {
  cache.clear();
}
