import type { MediaItem } from '../types/ambient';

function normalizeImagePath(value: unknown): string {
  return String(value || '').trim();
}

export function isGeneratedArtworkImage(value: unknown): boolean {
  return /^artwork-[a-f0-9]{40}\.(jpg|jpeg|png|gif|webp)$/i.test(normalizeImagePath(value));
}

export function collectGeneratedArtworkImages(mediaItems: MediaItem[]): string[] {
  const images = new Set<string>();
  mediaItems.forEach((item) => {
    [item.image, item.thumb].forEach((image) => {
      const normalized = normalizeImagePath(image);
      if (isGeneratedArtworkImage(normalized)) {
        images.add(normalized);
      }
    });
  });
  return [...images];
}

export function resolveUnreferencedGeneratedArtworkImages(options: {
  candidates: Array<unknown>;
  remainingMediaItems: MediaItem[];
}): string[] {
  const remainingImages = new Set(
    options.remainingMediaItems.flatMap((item) => [
      normalizeImagePath(item.image),
      normalizeImagePath(item.thumb),
    ]).filter((image) => image !== '')
  );

  return [...new Set(
    options.candidates
      .map((candidate) => normalizeImagePath(candidate))
      .filter((candidate) => isGeneratedArtworkImage(candidate))
  )].filter((candidate) => !remainingImages.has(candidate));
}
