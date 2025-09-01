// src/schemas/product.schema.ts
import { z } from 'zod';

// Schéma pour les délimitations
const DelimitationSchema = z.object({
  id: z.number(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number().optional().default(0),
  name: z.string().nullish(),
  coordinateType: z.enum(['PERCENTAGE', 'PIXEL']).optional().default('PERCENTAGE'),
  productImageId: z.number(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

export const ProductSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  stock: z.number().optional().default(0),
  imageUrl: z.string().url().optional(),
  status: z.enum(['PUBLISHED', 'DRAFT']),
  categoryId: z.number(),
  designId: z.number().optional().nullable(),
  featured: z.boolean().optional().default(false),
  deletedAt: z.string().datetime().nullable().optional(),
  sizes: z.array(z.object({
    id: z.number().optional(),
    sizeName: z.string().optional(),
  })).optional().default([]),
  colors: z.array(z.object({
    id: z.number(),
    name: z.string(),
    hexCode: z.string().optional(),
    imageUrl: z.string().url().nullish().or(z.literal("")),
    imagePublicId: z.string().nullish().optional(),
  })),
  category: z.object({
    id: z.number(),
    name: z.string(),
  }),
  design: z.object({
    id: z.number(),
    name: z.string(),
    imageUrl: z.string().url(),
    description: z.string().optional(),
  }).optional().nullable(),
  designImageUrl: z.string().url().optional().nullable(),
  designName: z.string().optional().nullable(),
  designDescription: z.string().optional().nullable(),
  views: z.array(z.object({
    id: z.number(),
    viewType: z.enum(['FRONT', 'BACK', 'LEFT', 'RIGHT', 'TOP', 'BOTTOM', 'DETAIL', 'OTHER']),
    imageUrl: z.string().url(),
    imagePublicId: z.string().optional(),
    description: z.string().optional(),
    delimitations: z.array(DelimitationSchema).optional().default([]),
  })),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Product = z.infer<typeof ProductSchema>;
export type Delimitation = z.infer<typeof DelimitationSchema>;
