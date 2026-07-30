import type { YouTubeMetadataPayload } from '../types/ambient';

export type FetchJson = (
  url: string,
  method?: string,
  data?: Record<string, unknown>,
  datatype?: string,
  timeout?: number,
  logger?: (...args: unknown[]) => void
) => Promise<unknown>;

export interface YouTubeMetadataFetchResult {
  ok: boolean;
  data?: YouTubeMetadataPayload;
  message?: string;
  reason?: string;
}

export interface YouTubeMetadataClient {
  fetchMetadata(videoId: string): Promise<YouTubeMetadataFetchResult>;
}

function isMetadataPayload(value: unknown): value is YouTubeMetadataPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const payload = value as Partial<YouTubeMetadataPayload>;
  return typeof payload.videoId === 'string'
    && typeof payload.title === 'string'
    && typeof payload.artist === 'string'
    && typeof payload.desc === 'string';
}

export function createYouTubeMetadataClient(options: {
  baseUrl: string;
  fetchData: FetchJson;
  logger?: (...args: unknown[]) => void;
}): YouTubeMetadataClient {
  const cache = new Map<string, YouTubeMetadataPayload>();

  return {
    async fetchMetadata(videoId: string): Promise<YouTubeMetadataFetchResult> {
      const normalizedVideoId = String(videoId || '').trim();
      if (cache.has(normalizedVideoId)) {
        return {
          ok: true,
          data: cache.get(normalizedVideoId),
        };
      }

      try {
        const endpoint = `${options.baseUrl}youtube-metadata/${encodeURIComponent(normalizedVideoId)}`;
        const response = await options.fetchData(endpoint, 'get', {}, 'json', 15000, options.logger) as {
          state?: string;
          data?: unknown;
        } | null;
        if (response?.state === 'ok' && isMetadataPayload(response.data)) {
          cache.set(normalizedVideoId, response.data);
          return {
            ok: true,
            data: response.data,
          };
        }

        const errorData = response?.data as { message?: unknown; reason?: unknown } | undefined;
        return {
          ok: false,
          message: typeof errorData?.message === 'string' ? errorData.message : undefined,
          reason: typeof errorData?.reason === 'string' ? errorData.reason : undefined,
        };
      } catch (error) {
        options.logger?.('error', 'youtubeMetadata::fetch:', error, 'force');
        return {
          ok: false,
          reason: 'network-error',
        };
      }
    },
  };
}
