import type { MediaItem } from '../types/ambient';

export interface AppendUniqueCategoryResult {
  categories: string[];
  categoryName: string;
}

export type CategoryMutationReason = 'empty-name' | 'duplicate' | 'not-found' | 'not-empty' | 'unchanged';

export interface CategoryMutationResult {
  ok: boolean;
  categories: string[];
  mediaItems?: MediaItem[];
  reason?: CategoryMutationReason;
}

export function appendUniqueCategory(categories: string[], requestedName: string): AppendUniqueCategoryResult {
  const nextCategories = [...categories];

  if (!nextCategories.includes(requestedName)) {
    nextCategories.push(requestedName);
    return {
      categories: nextCategories,
      categoryName: requestedName,
    };
  }

  const uniqueSet = new Set(nextCategories);
  let categoryName = requestedName;
  let count = 1;
  while (uniqueSet.has(categoryName)) {
    categoryName = `${requestedName}_${count}`;
    count++;
  }

  nextCategories.push(categoryName);
  return {
    categories: nextCategories,
    categoryName,
  };
}

export function getCategoryMediaCount(mediaItems: MediaItem[], categoryIndex: number): number {
  return mediaItems.filter((item) => item.catId === categoryIndex).length;
}

export function isDuplicateCategoryName(
  categories: string[],
  nextName: string,
  ignoreIndex: number | null = null
): boolean {
  const normalizedName = nextName.trim();
  return categories.some((category, index) => {
    return index !== ignoreIndex && category.trim() === normalizedName;
  });
}

export function renameCategory(
  categories: string[],
  currentIndex: number,
  nextName: string
): CategoryMutationResult {
  if (!Number.isInteger(currentIndex) || currentIndex < 0 || currentIndex >= categories.length) {
    return { ok: false, categories, reason: 'not-found' };
  }

  const normalizedName = nextName.trim();
  if (normalizedName === '') {
    return { ok: false, categories, reason: 'empty-name' };
  }

  if ((categories[currentIndex] ?? '').trim() === normalizedName) {
    return { ok: false, categories, reason: 'unchanged' };
  }

  if (isDuplicateCategoryName(categories, normalizedName, currentIndex)) {
    return { ok: false, categories, reason: 'duplicate' };
  }

  const nextCategories = [...categories];
  nextCategories[currentIndex] = normalizedName;
  return { ok: true, categories: nextCategories };
}

export function deleteEmptyCategory(
  categories: string[],
  mediaItems: MediaItem[],
  currentIndex: number
): CategoryMutationResult {
  if (!Number.isInteger(currentIndex) || currentIndex < 0 || currentIndex >= categories.length) {
    return { ok: false, categories, mediaItems, reason: 'not-found' };
  }

  if (getCategoryMediaCount(mediaItems, currentIndex) > 0) {
    return { ok: false, categories, mediaItems, reason: 'not-empty' };
  }

  const nextCategories = categories.filter((_category, index) => index !== currentIndex);
  const nextMediaItems = mediaItems.map((item) => {
    if (item.catId > currentIndex) {
      return {
        ...item,
        catId: item.catId - 1,
      };
    }
    return item;
  });

  return {
    ok: true,
    categories: nextCategories,
    mediaItems: nextMediaItems,
  };
}
