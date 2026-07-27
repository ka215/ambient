export function resolveHtmlMediaMimeType(path: string, tagName: 'audio' | 'video'): string {
  const ext = getExtension(path);
  const mimeTypes: Record<string, string> = {
    aac: 'audio/aac',
    mid: 'audio/midi',
    midi: 'audio/midi',
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    ogg: 'audio/ogg',
    opus: 'audio/opus',
    wav: 'audio/wav',
    weba: 'audio/webm',
    wma: 'audio/x-ms-wma',
    avi: 'video/x-msvideo',
    mpeg: 'video/mpeg',
    mpg: 'video/mpeg',
    mp4: 'video/mp4',
    ogv: 'video/ogg',
    ts: 'video/mp2t',
    webm: 'video/webm',
    '3gp': 'video/3gpp',
    '3g2': 'video/3gpp2',
  };

  return mimeTypes[ext] || `${tagName}/${ext || 'mpeg'}`;
}

export function resolveHtmlMediaSourcePath(path: string): string {
  const normalizedPath = String(path || '').replace(/\\/g, '/');
  if (!normalizedPath) {
    return '';
  }
  if (/^(https?:)?\/\//i.test(normalizedPath) || /^(blob|data):/i.test(normalizedPath)) {
    return normalizedPath;
  }

  const ambientData = (window as any).AmbientData as { mediaDir?: string } | undefined;
  const mediaDir = (ambientData?.mediaDir || './assets/media/').replace(/\\/g, '/').replace(/\/?$/, '/');
  const mediaDirWithoutDot = mediaDir.replace(/^\.\//, '');
  const pathWithoutDot = normalizedPath.replace(/^\.\//, '');

  if (pathWithoutDot.startsWith(mediaDirWithoutDot)) {
    return `${mediaDir}${pathWithoutDot.slice(mediaDirWithoutDot.length)}`;
  }
  if (pathWithoutDot.startsWith('assets/media/')) {
    return `${mediaDir}${pathWithoutDot.slice('assets/media/'.length)}`;
  }

  return `${mediaDir}${pathWithoutDot.replace(/^\/+/, '')}`;
}

export function resolveHtmlMediaTagName(path: string): 'audio' | 'video' {
  const ext = getExtension(path);
  const videoExtensions = new Set(['avi', 'mp4', 'mpeg', 'mpg', 'ogv', 'ts', 'webm', '3gp', '3g2']);

  return videoExtensions.has(ext) ? 'video' : 'audio';
}

function getExtension(path: string): string {
  const normalizedPath = String(path || '').split(/[?#]/, 1)[0] || '';
  const lastSlashIndex = Math.max(normalizedPath.lastIndexOf('/'), normalizedPath.lastIndexOf('\\'));
  const fileName = lastSlashIndex >= 0 ? normalizedPath.slice(lastSlashIndex + 1) : normalizedPath;
  const dotIndex = fileName.lastIndexOf('.');

  if (dotIndex < 0 || dotIndex === fileName.length - 1) {
    return '';
  }

  return fileName.slice(dotIndex + 1).toLowerCase();
}
