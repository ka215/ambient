export async function generateMediaThumbnailFromPreview(options: {
  baseUrl: string;
  endpoint: string;
  file: string;
  seekTime: number;
  getLocalizedMessage: (key: string, fallback: string) => string;
}): Promise<{
  ok: boolean;
  message: string;
  filename?: string;
  mime?: string;
  dataUrl?: string;
}> {
  try {
    const response = await fetch(`${options.baseUrl}${options.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: options.file,
        seekTime: options.seekTime,
      }),
      credentials: 'same-origin',
    });
    const payload = await response.json().catch(() => null) as ApiResponse<{
      message?: string;
      filename?: string;
      mime?: string;
      dataUrl?: string;
    }> | null;
    if (!payload || payload.state !== 'ok' || !payload.data?.filename || !payload.data?.dataUrl) {
      return {
        ok: false,
        message: payload?.data?.message
          || options.getLocalizedMessage('mediaEditThumbnailGenerateFailed', 'Failed to generate thumbnail image.'),
      };
    }
    return {
      ok: true,
      message: payload.data.message || options.getLocalizedMessage('mediaEditThumbnailGenerateSuccess', 'Thumbnail image generated successfully.'),
      filename: payload.data.filename,
      mime: payload.data.mime || 'image/webp',
      dataUrl: payload.data.dataUrl,
    };
  } catch (_error) {
    return {
      ok: false,
      message: options.getLocalizedMessage('mediaEditThumbnailGenerateFailed', 'Failed to generate thumbnail image.'),
    };
  }
}
