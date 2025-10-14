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

/**
 * ✅ Récupère les catégories racines (level 0)
 * Endpoint réel backend: GET /categories/hierarchy
 */
export async function fetchRootCategories() {
  try {
    const response = await api<{
      id: number;
      name: string;
      level: number;
      parentId: number | null;
      children?: any[];
    }[]>('/categories/hierarchy');

    // Filtrer pour ne garder que les racines (level 0)
    const roots = Array.isArray(response)
      ? response.filter(cat => cat.level === 0)
      : [];

    return {
      success: true,
      data: roots.map(cat => ({
        id: cat.id,
        name: cat.name,
        level: cat.level,
        parentId: cat.parentId,
        hasChildren: cat.children && cat.children.length > 0
      }))
    };
  } catch (error) {
    console.error('❌ Erreur fetchRootCategories:', error);
    return { success: false, data: [] };
  }
}

/**
 * ✅ Récupère les enfants directs d'une catégorie (sous-catégories ou variations)
 * Endpoint réel backend: GET /categories/:id
 */
export async function fetchCategoryChildren(categoryId: number) {
  try {
    console.log(`🔄 Chargement des enfants de la catégorie ${categoryId}...`);

    const response = await api<{
      id: number;
      name: string;
      level: number;
      parentId: number | null;
      children?: Array<{
        id: number;
        name: string;
        level: number;
        parentId: number;
      }>;
    }>(`/categories/${categoryId}`);

    const children = response.children || [];
    console.log(`✅ ${children.length} enfant(s) trouvé(s) pour catégorie ${categoryId}`);

    return {
      success: true,
      data: children.map(child => ({
        id: child.id,
        name: child.name,
        level: child.level,
        parentId: child.parentId
      }))
    };
  } catch (error) {
    console.error(`❌ Erreur fetchCategoryChildren(${categoryId}):`, error);
    return { success: false, data: [] };
  }
}

/**
 * ✅ Récupère les variations (level 2) d'une catégorie ou sous-catégorie
 * Endpoint réel backend: GET /categories/:id
 * Variations = enfants de level 2
 */
export async function fetchCategoryVariations(categoryId: number) {
  try {
    console.log(`🔄 Chargement des variations de la catégorie ${categoryId}...`);

    const response = await api<{
      id: number;
      name: string;
      level: number;
      parentId: number | null;
      children?: Array<{
        id: number;
        name: string;
        level: number;
        parentId: number;
      }>;
    }>(`/categories/${categoryId}`);

    // Filtrer uniquement les enfants de level 2 (variations)
    const variations = (response.children || []).filter(child => child.level === 2);
    console.log(`✅ ${variations.length} variation(s) trouvée(s) pour catégorie ${categoryId}`);

    return {
      success: true,
      data: variations.map(variation => ({
        id: variation.id,
        name: variation.name,
        level: variation.level,
        parentId: variation.parentId
      }))
    };
  } catch (error) {
    console.error(`❌ Erreur fetchCategoryVariations(${categoryId}):`, error);
    return { success: false, data: [] };
  }
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


