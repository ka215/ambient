import { parseMediaTimeToIntegerSeconds } from '../shared/time';
import type { MediaItem } from '../types/ambient';

const AUTO_CATEGORY_NAME = 'New Category';

export interface BuildMediaItemOptions {
  payload: [string, string][];
  categories: string[];
  titleMaxLength: number;
  artistMaxLength: number;
  descMaxLength: number;
  sanitizeMediaText: (value: string, maxLength: number) => string;
  sanitizeMediaDesc: (value: string, maxLength: number) => string;
  isVolumeInRange: (value: number) => boolean;
}

export interface BuildMediaItemResult {
  mediaItem: MediaItem;
  categories: string[];
}

function ensureAutoCategory(categories: string[]): { categories: string[]; categoryIndex: number } {
  const nextCategories = [...categories];
  let categoryIndex = nextCategories.indexOf(AUTO_CATEGORY_NAME);
  if (categoryIndex === -1) {
    nextCategories.push(AUTO_CATEGORY_NAME);
    categoryIndex = nextCategories.length - 1;
  }
  return { categories: nextCategories, categoryIndex };
}

export function buildManagedMediaItem(options: BuildMediaItemOptions): BuildMediaItemResult {
  const mediaItem: MediaItem = {
    amId: 0,
    catId: 0,
    title: '',
    artist: '',
    desc: '',
    file: '',
    videoid: '',
    volume: 50,
    start: '',
    end: '',
  };

  let categories = [...options.categories];
  let categoryValue = '';

  for (const [key, val] of options.payload) {
    switch (key) {
      case 'youtube_videoid':
        mediaItem.videoid = val;
        break;
      case 'media_filepath':
        mediaItem.file = val;
        break;
      case 'category':
        categoryValue = val;
        if (val === '') {
          const resolved = ensureAutoCategory(categories);
          categories = resolved.categories;
          mediaItem.catId = resolved.categoryIndex;
        } else {
          mediaItem.catId = Number(val);
        }
        break;
      case 'category_new_name': {
        const newCategoryName = options.sanitizeMediaText(val || '', options.titleMaxLength) || AUTO_CATEGORY_NAME;
        const nextCategories = [...categories];
        let newCategoryIndex = nextCategories.indexOf(newCategoryName);
        if (newCategoryIndex === -1) {
          nextCategories.push(newCategoryName);
          newCategoryIndex = nextCategories.length - 1;
        }
        categories = nextCategories;
        mediaItem.catId = newCategoryIndex;
        categoryValue = String(newCategoryIndex);
        break;
      }
      case 'title':
        mediaItem.title = options.sanitizeMediaText(val, options.titleMaxLength);
        break;
      case 'artist':
        mediaItem.artist = options.sanitizeMediaText(val, options.artistMaxLength);
        break;
      case 'desc':
        mediaItem.desc = options.sanitizeMediaDesc(val, options.descMaxLength);
        break;
      case 'volume': {
        const numVolume = Number(val);
        if (Number.isInteger(numVolume) && options.isVolumeInRange(numVolume)) {
          mediaItem.volume = numVolume;
        }
        break;
      }
      case 'start':
      case 'end': {
        const seconds = parseMediaTimeToIntegerSeconds(val);
        mediaItem[key] = seconds === null ? '' : seconds;
        break;
      }
      default:
        break;
    }
  }

  if (categoryValue === '' && !options.payload.some(([payloadKey]) => payloadKey === 'category')) {
    const resolved = ensureAutoCategory(categories);
    categories = resolved.categories;
    mediaItem.catId = resolved.categoryIndex;
  }

  return {
    mediaItem,
    categories,
  };
}

export function appendManagedMediaItem(mediaItems: MediaItem[], mediaItem: MediaItem): MediaItem[] {
  const nextItems = [...mediaItems];
  const lastAmId = nextItems.length > 0
    ? Math.max(...nextItems.map((item) => item.amId))
    : -1;
  nextItems.push({
    ...mediaItem,
    amId: lastAmId + 1,
  });
  return nextItems;
}
