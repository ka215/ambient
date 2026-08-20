export async function generateMediaThumbnailFromPreview(options: {
  baseUrl: string;
  endpoint: string;
  file: string;
  seekTime: number;
  rangeProxy?: boolean;
  playlistName?: string | null;
  mediaId?: number | null;
  getLocalizedMessage: (key: string, fallback: string) => string;
}): Promise<{
  ok: boolean;
  message: string;
  reason?: string;
  details?: unknown;
  filename?: string;
  mime?: string;
  dataUrl?: string;
}> {
  const requestBody = options.rangeProxy === true
    ? {
        source: 'range-proxy',
        playlist: options.playlistName || '',
        media: options.mediaId,
        seekTime: options.seekTime,
      }
    : {
        file: options.file,
        seekTime: options.seekTime,
      };
  try {
    const response = await fetch(`${options.baseUrl}${options.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      credentials: 'same-origin',
    });
    const payload = await response.json().catch(() => null) as ApiResponse<{
      message?: string;
      reason?: string;
      details?: unknown;
      filename?: string;
      mime?: string;
      dataUrl?: string;
    }> | null;
    if (!payload || payload.state !== 'ok' || !payload.data?.filename || !payload.data?.dataUrl) {
      console.error('Media thumbnail generation failed:', {
        status: response.status,
        request: requestBody,
        response: payload,
      });
      return {
        ok: false,
        message: payload?.data?.message
          || options.getLocalizedMessage('mediaEditThumbnailGenerateFailed', 'Failed to generate thumbnail image.'),
        reason: payload?.data?.reason,
        details: payload?.data?.details,
      };
    }
    return {
      ok: true,
      message: payload.data.message || options.getLocalizedMessage('mediaEditThumbnailGenerateSuccess', 'Thumbnail image generated successfully.'),
      filename: payload.data.filename,
      mime: payload.data.mime || 'image/webp',
      dataUrl: payload.data.dataUrl,
    };
  } catch (error) {
    console.error('Media thumbnail generation request failed:', {
      request: requestBody,
      error,
    });
    return {
      ok: false,
      message: options.getLocalizedMessage('mediaEditThumbnailGenerateFailed', 'Failed to generate thumbnail image.'),
      reason: 'request-failed',
      details: error,
    };
  }
}
