export interface AppendUniqueCategoryResult {
  categories: string[];
  categoryName: string;
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
