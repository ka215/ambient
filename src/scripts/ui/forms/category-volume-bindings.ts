import type { MediaItem } from '../../types/ambient';
import {
  clearCategoryView,
  syncMediaCategoryField as syncMediaCategoryFieldView,
  syncMediaVolumeField as syncMediaVolumeFieldView,
  syncRangeProgress as syncRangeProgressView,
  updateCategoryView,
} from './management-forms';

export function getAmbientActiveCategoryId(categoryId: number | null | undefined): number | null {
  return categoryId !== undefined && categoryId !== null && Number(categoryId) >= 0
    ? Number(categoryId)
    : null;
}

export function syncAmbientTargetCategorySelection(options: {
  select: HTMLSelectElement | null;
  activeCategoryId: number | null;
}): void {
  if (!options.select) {
    return;
  }
  const nextValue = options.activeCategoryId !== null ? String(options.activeCategoryId) : '-1';
  const hasOption = Array.from(options.select.options).some((opt) => opt.value === nextValue);
  options.select.value = hasOption ? nextValue : '-1';
}

export function syncAmbientMediaCategoryField(options: {
  select: HTMLSelectElement | null;
  categoryInput: HTMLInputElement | null;
  categories: string[] | null | undefined;
  preferredCategoryId: number | null;
}): void {
  syncMediaCategoryFieldView({
    select: options.select,
    categoryInput: options.categoryInput,
    categories: options.categories,
    preferredCategoryId: options.preferredCategoryId,
  });
}

export function clearAmbientCategory(options: {
  targetSelect: HTMLSelectElement | null;
  mediaSelect: HTMLSelectElement | null;
  mediaInput: HTMLInputElement | null;
  mediaLabel: HTMLLabelElement | null;
  mediaNote: HTMLElement | null;
  applyCloudEditRestrictions(): void;
}): void {
  clearCategoryView({
    targetSelect: options.targetSelect,
    mediaSelect: options.mediaSelect,
    mediaInput: options.mediaInput,
    mediaLabel: options.mediaLabel,
    mediaNote: options.mediaNote,
  }, options.applyCloudEditRestrictions);
}

export function updateAmbientCategory(options: {
  targetSelect: HTMLSelectElement | null;
  mediaSelect: HTMLSelectElement | null;
  mediaInput: HTMLInputElement | null;
  mediaLabel: HTMLLabelElement | null;
  mediaNote: HTMLElement | null;
  categories: string[] | null | undefined;
  syncTargetCategorySelection(): void;
  syncMediaCategoryField(): void;
  applyCloudEditRestrictions(): void;
}): void {
  updateCategoryView({
    elements: {
      targetSelect: options.targetSelect,
      mediaSelect: options.mediaSelect,
      mediaInput: options.mediaInput,
      mediaLabel: options.mediaLabel,
      mediaNote: options.mediaNote,
    },
    categories: options.categories,
    syncTargetCategorySelection: options.syncTargetCategorySelection,
    syncMediaCategoryField: options.syncMediaCategoryField,
    applyCloudEditRestrictions: options.applyCloudEditRestrictions,
  });
}

export function normalizeAmbientVolume(value: unknown, fallback: number): number {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0 && numericValue <= 100
    ? numericValue
    : fallback;
}

export function resolveAmbientDefaultVolume(value: unknown, fallback: number): number {
  return normalizeAmbientVolume(value, fallback);
}

export function getAmbientPlaybackVolume(options: {
  mediaData: MediaItem | null;
  defaultVolume: number;
}): number {
  const mediaVolume = options.mediaData?.volume;
  if (options.mediaData && mediaVolume !== undefined && mediaVolume !== null) {
    const numericValue = Number(mediaVolume);
    if (Number.isFinite(numericValue) && numericValue >= 0 && numericValue <= 100) {
      return numericValue;
    }
  }
  return options.defaultVolume;
}

export function syncAmbientRangeProgress(range: HTMLInputElement | null, defaultVolume: number): void {
  syncRangeProgressView(range, defaultVolume);
}

export function syncAmbientMediaVolumeField(options: {
  input: HTMLInputElement | null;
  display: HTMLElement | null;
  volume: number;
  fallbackVolume: number;
}): void {
  syncMediaVolumeFieldView(options);
}
