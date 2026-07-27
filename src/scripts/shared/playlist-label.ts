import type { MediaItem } from '../types/ambient';

export function formatAmbientPlaylistLabel(format: string, mediaData: MediaItem): string {
  const patterns = format.match(/%(.+?)%/gi);
  let text = format;

  if (patterns && patterns.length > 0) {
    patterns.forEach((pattern: string) => {
      const property = pattern.replaceAll('%', '');
      const replacer = Object.prototype.hasOwnProperty.call(mediaData, property) && (mediaData as any)[property]
        ? (mediaData as any)[property]
        : '';
      text = text.replaceAll(`%${property}%`, replacer);
    });

    text = text
      .trim()
      .replace(/^[-_‐–−—ー]?(.*)[-_‐–−—ー]?$/, '$1')
      .trim();
  }

  return text;
}
