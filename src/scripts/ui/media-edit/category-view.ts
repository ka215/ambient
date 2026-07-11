export function getMediaEditCategoryOptions(categories: string[] | null | undefined): string[] {
  if (!Array.isArray(categories)) {
    return [];
  }

  const unique = new Set<string>();
  const options: string[] = [];
  categories.forEach((categoryName) => {
    const normalized = String(categoryName).trim();
    if (normalized !== '' && !unique.has(normalized)) {
      unique.add(normalized);
      options.push(normalized);
    }
  });
  return options;
}

export function isMediaEditCategoryDropdownVisible(dropdownElement: HTMLElement | null): boolean {
  return dropdownElement instanceof HTMLElement
    && !dropdownElement.classList.contains('hidden');
}

export function renderMediaEditCategoryOptionsView(options: {
  optionsContainer: HTMLElement | null;
  selectedCategory: string;
  categories: string[];
  getLocalizedMessage: (key: string, fallback: string) => string;
  createOptionButton: (categoryName: string, isSelected: boolean) => HTMLButtonElement;
}): void {
  const optionsContainer = options.optionsContainer;
  if (!(optionsContainer instanceof HTMLElement)) {
    return;
  }

  optionsContainer.innerHTML = '';
  if (options.categories.length === 0) {
    const emptyElement = document.createElement('div');
    emptyElement.className = 'media-edit-category-option-empty px-3 py-2 text-xs text-gray-500 dark:text-gray-300';
    emptyElement.textContent = options.getLocalizedMessage('mediaEditCategoryNoMatches', 'No categories');
    optionsContainer.appendChild(emptyElement);
    return;
  }

  options.categories.forEach((categoryName) => {
    optionsContainer.appendChild(
      options.createOptionButton(categoryName, options.selectedCategory === categoryName)
    );
  });
}

export function syncMediaEditCategoryClearButtonView(options: {
  clearButton: HTMLButtonElement | null;
  categoryValue: string;
}): void {
  if (!(options.clearButton instanceof HTMLButtonElement)) {
    return;
  }

  const hasValue = options.categoryValue.trim() !== '';
  options.clearButton.classList.toggle('hidden', !hasValue);
  options.clearButton.setAttribute('aria-hidden', hasValue ? 'false' : 'true');
}

export function setMediaEditCategoryDropdownExpandedView(options: {
  dropdownElement: HTMLElement | null;
  comboboxElement: HTMLElement | null;
  toggleButton: HTMLButtonElement | null;
  expanded: boolean;
}): void {
  if (!(options.dropdownElement instanceof HTMLElement)) {
    return;
  }

  options.dropdownElement.classList.toggle('hidden', !options.expanded);
  if (options.comboboxElement instanceof HTMLElement) {
    options.comboboxElement.setAttribute('aria-expanded', options.expanded ? 'true' : 'false');
  }
  if (options.toggleButton instanceof HTMLButtonElement) {
    options.toggleButton.setAttribute('aria-expanded', options.expanded ? 'true' : 'false');
  }
}
