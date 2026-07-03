import type { MediaItem } from '../../types/ambient';

export function renderEmptyCarousel(options: {
  wrapper: HTMLElement;
  prevButton: HTMLButtonElement;
  nextButton: HTMLButtonElement;
  placeholderImage: string;
}): void {
  const carouselItem = document.createElement('div');
  carouselItem.id = 'carousel-item-1';
  carouselItem.classList.add('hidden', 'h-full', 'items-center', 'justify-center', 'duration-700', 'ease-in-out');
  carouselItem.setAttribute('data-carousel-item', '');

  const image = document.createElement('img');
  image.src = options.placeholderImage;
  image.setAttribute('class', 'block h-full max-w-full object-contain');
  image.setAttribute('alt', 'No media available');
  carouselItem.appendChild(image);

  const clone = carouselItem.cloneNode(true) as HTMLElement;
  clone.id = 'carousel-item-2';

  while (options.wrapper.firstChild) {
    options.wrapper.removeChild(options.wrapper.firstChild);
  }
  options.wrapper.appendChild(carouselItem);
  options.wrapper.appendChild(clone);
  options.prevButton.setAttribute('disabled', '');
  options.nextButton.setAttribute('disabled', '');
}

export function renderCarouselItems(options: {
  wrapper: HTMLElement;
  prevButton: HTMLButtonElement;
  nextButton: HTMLButtonElement;
  currentId: number | null;
  itemIds: number[];
  mediaItems: MediaItem[];
  placeholderImage: string;
  resolveYouTubeThumbnail: (videoId: string) => string;
  resolveImagePath: (image: string) => string;
}): void {
  while (options.wrapper.firstChild) {
    options.wrapper.removeChild(options.wrapper.firstChild);
  }

  options.itemIds.forEach((amId, index) => {
    const mediaData = options.mediaItems.find((item) => item.amId === amId);
    if (!mediaData) {
      return;
    }

    const carouselItem = document.createElement('div');
    carouselItem.id = `carousel-item-${index + 1}`;
    if (amId === options.currentId) {
      carouselItem.classList.add('h-full', 'items-center', 'justify-center', 'duration-700', 'ease-in-out');
    } else {
      carouselItem.classList.add('hidden', 'h-full', 'items-center', 'justify-center', 'duration-700', 'ease-in-out');
    }
    carouselItem.setAttribute('data-carousel-item', amId === options.currentId ? 'active' : '');

    const image = document.createElement('img');
    let mediaImage = options.placeholderImage;
    let baseAspect = 'h-full';

    if (mediaData.image) {
      mediaImage = options.resolveImagePath(mediaData.image);
    } else if (mediaData.videoid) {
      mediaImage = options.resolveYouTubeThumbnail(mediaData.videoid);
      baseAspect = 'max-h-full';
    }

    image.src = mediaImage;
    image.classList.add('block', baseAspect, 'max-w-full', 'object-contain');
    image.setAttribute('alt', mediaData.title);

    carouselItem.appendChild(image);
    options.wrapper.appendChild(carouselItem);
  });

  options.prevButton.removeAttribute('disabled');
  options.nextButton.removeAttribute('disabled');
}
