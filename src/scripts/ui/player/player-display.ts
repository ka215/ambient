import type { MediaItem } from '../../types/ambient';
import { resolveCarouselItemIds, renderCarouselItems, renderEmptyCarousel } from './carousel-view';
import { buildMediaCaptionText, renderMediaCaption, syncCaptionMarquee } from './player-shell';

export function updateCarouselDisplay(options: {
  currentId: number | null;
  prevId: number | null;
  nextId: number | null;
  mediaItems: MediaItem[];
  wrapper: HTMLElement;
  prevButton: HTMLButtonElement;
  nextButton: HTMLButtonElement;
  placeholderImage: string;
  resolveYouTubeThumbnail: (videoId: string) => string;
  resolveImagePath: (image: string) => string;
}): void {
  const carouselState = resolveCarouselItemIds({
    prevId: options.prevId,
    currentId: options.currentId,
    nextId: options.nextId,
  });

  if (!carouselState.hasCurrent) {
    renderEmptyCarousel({
      wrapper: options.wrapper,
      prevButton: options.prevButton,
      nextButton: options.nextButton,
      placeholderImage: options.placeholderImage,
    });
    return;
  }

  renderCarouselItems({
    wrapper: options.wrapper,
    prevButton: options.prevButton,
    nextButton: options.nextButton,
    currentId: options.currentId,
    itemIds: carouselState.itemIds,
    mediaItems: options.mediaItems,
    placeholderImage: options.placeholderImage,
    resolveYouTubeThumbnail: options.resolveYouTubeThumbnail,
    resolveImagePath: options.resolveImagePath,
  });
}

export function updateMediaCaptionDisplay(options: {
  mediaData: MediaItem;
  bodyElement: HTMLElement;
  captionElement: HTMLElement;
  fallbackWidth: number;
  sanitizeTitle: (value: string) => string;
  sanitizeArtist: (value: string) => string;
}): void {
  const captionText = buildMediaCaptionText({
    mediaData: options.mediaData,
    sanitizeTitle: options.sanitizeTitle,
    sanitizeArtist: options.sanitizeArtist,
  });

  renderMediaCaption({
    mediaData: options.mediaData,
    bodyElement: options.bodyElement,
    captionElement: options.captionElement,
    fallbackWidth: options.fallbackWidth,
    sanitizeTitle: () => captionText.titleText,
    sanitizeArtist: () => captionText.artistText,
  });
}

export function toggleCaptionMarqueeDisplay(
  bodyElement: HTMLElement,
  captionElement: HTMLElement,
  fallbackWidth: number
): void {
  syncCaptionMarquee(bodyElement, captionElement, fallbackWidth);
}
