import { z } from 'zod';

export const CategorySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Le nom de la catégorie ne peut pas être vide"),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  parentId: z.number().optional().nullable(), // ID de la catégorie parent
  level: z.number().default(0), // Niveau hiérarchique (0 = catégorie principale, 1 = sous-catégorie)
  order: z.number().default(0), // Ordre d'affichage
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

// Type pour une catégorie avec ses sous-catégories
export const CategoryWithSubcategoriesSchema = CategorySchema.extend({
  subcategories: z.array(CategorySchema).optional().default([]),
});

export type Category = z.infer<typeof CategorySchema>;
export type CategoryWithSubcategories = z.infer<typeof CategoryWithSubcategoriesSchema>; 