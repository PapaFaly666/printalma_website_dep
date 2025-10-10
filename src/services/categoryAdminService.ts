export type CategoryUsage = {
  success: true;
  data: {
    categoryId: number;
    productsWithCategory: number;
    productsWithSubCategory: number;
    subcategoriesCount: number;
    variationsCount: number;
  };
};

export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data as T;
}

export async function fetchCategoryUsage(id: number) {
  return api<CategoryUsage>(`/categories/admin/${id}/usage`);
}

export async function reassignCategory(
  id: number,
  payload: {
    targetCategoryId: number;
    reassignType: 'category' | 'subcategory' | 'both';
    reassignVariations?: 'keep' | 'null' | 'map';
    variationMap?: Array<{ from: number; to: number }>;
  }
) {
  return api<{ success: true; data: { updated: number } }>(
    `/categories/admin/${id}/reassign`,
    { method: 'POST', body: JSON.stringify(payload) }
  );
}

export async function fetchCategoryVariations(categoryId: number) {
  return api<{ success: true; data: Array<{ id: number; name: string }> }>(
    `/categories/admin/${categoryId}/variations`
  );
}

export async function fetchCategoryChildren(categoryId: number) {
  return api<{ success: true; data: Array<{ id: number; name: string }> }>(
    `/categories/admin/${categoryId}/children`
  );
}

export async function updateProductCategories(
  productId: number,
  payload: { categoryId?: number | null; subCategoryId?: number | null; variationId?: number | null }
) {
  return api(`/products/admin/${productId}/category`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}


