export type MediaEditPersistResult = {
  ok: boolean;
  message: string;
};

async function parseApiMessageResponse(
  response: Response
): Promise<ApiResponse<{ message?: string }> | null> {
  return response.json().catch(() => null) as Promise<ApiResponse<{ message?: string }> | null>;
}

export async function uploadMediaEditThumbnail(options: {
  baseUrl: string;
  endpoint: string;
  filename: string;
  dataUrl: string;
  getLocalizedMessage: (key: string, fallback: string) => string;
}): Promise<MediaEditPersistResult> {
  const base64Body = options.dataUrl.includes(',')
    ? options.dataUrl.split(',')[1] || ''
    : options.dataUrl;
  if (base64Body.trim() === '') {
    return {
      ok: false,
      message: options.getLocalizedMessage('mediaEditThumbnailInvalidData', 'Invalid image data.'),
    };
  }

  try {
    const rawResponse = await fetch(`${options.baseUrl}${options.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: options.filename,
        content: base64Body,
      }),
      credentials: 'same-origin',
    });
    const payload = await parseApiMessageResponse(rawResponse);
    if (!payload || payload.state !== 'ok') {
      const message = payload?.data?.message
        || options.getLocalizedMessage('mediaEditThumbnailUploadFailed', 'Failed to save thumbnail image.');
      return { ok: false, message };
    }
    return { ok: true, message: payload.data?.message || '' };
  } catch (_error) {
    return {
      ok: false,
      message: options.getLocalizedMessage('mediaEditThumbnailUploadFailed', 'Failed to save thumbnail image.'),
    };
  }
}

export async function deleteMediaEditThumbnail(options: {
  baseUrl: string;
  endpoint: string;
  filename: string;
  getLocalizedMessage: (key: string, fallback: string) => string;
}): Promise<MediaEditPersistResult> {
  try {
    const rawResponse = await fetch(`${options.baseUrl}${options.endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filename: options.filename }),
      credentials: 'same-origin',
    });
    const payload = await parseApiMessageResponse(rawResponse);
    if (!payload || payload.state !== 'ok') {
      const message = payload?.data?.message
        || options.getLocalizedMessage('mediaEditThumbnailDeleteFailed', 'Failed to delete thumbnail image.');
      return { ok: false, message };
    }
    return { ok: true, message: payload.data?.message || '' };
  } catch (_error) {
    return {
      ok: false,
      message: options.getLocalizedMessage('mediaEditThumbnailDeleteFailed', 'Failed to delete thumbnail image.'),
    };
  }
}

export async function persistPlaylistMediaEdit(options: {
  baseUrl: string;
  endpoint: string;
  playlistName: string;
  payloadObject: unknown;
  getLocalizedMessage: (key: string, fallback: string) => string;
}): Promise<MediaEditPersistResult> {
  try {
    const rawResponse = await fetch(
      `${options.baseUrl}${options.endpoint}/${encodeURIComponent(options.playlistName)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options.payloadObject),
        credentials: 'same-origin',
      }
    );
    const payload = await parseApiMessageResponse(rawResponse);
    if (!payload || payload.state !== 'ok') {
      const message = payload?.data?.message
        || options.getLocalizedMessage('mediaEditSaveFailed', 'Failed to save media changes.');
      return { ok: false, message };
    }
    return {
      ok: true,
      message: payload.data?.message
        || options.getLocalizedMessage('mediaEditSaveSuccess', 'Media changes were saved successfully.'),
    };
  } catch (_error) {
    return {
      ok: false,
      message: options.getLocalizedMessage('mediaEditSaveFailed', 'Failed to save media changes.'),
    };
  }
}
