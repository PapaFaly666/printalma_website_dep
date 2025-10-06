// src/types/category.types.ts

export interface Category {
  id: number;
  name: string;
  description?: string;
  level: number;           // 0 = parent, 1 = enfant, 2 = variation
  parentId: number | null;
  order?: number;
  productCount?: number;
  sizes?: string[];        // Tailles disponibles (surtout pour les variations)
  subcategories?: Category[];
  parent?: Category;
  children?: Category[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  parentId?: number | null;
  level?: number;
  order?: number;
}

export interface CreateCategoryStructureDto {
  parentName: string;
  parentDescription?: string;
  childName?: string;
  variations: string[];
  sizes?: string[];        // Tailles communes pour toutes les variations
}

export interface CategoryHierarchy {
  parent: Category;
  child?: Category;
  totalVariations: number;
  createdVariations: number;
}

export interface CreateStructureResponse {
  success: boolean;
  createdCount: number;
  skippedVariations: string[];
  message: string;
  data: CategoryHierarchy;
}
