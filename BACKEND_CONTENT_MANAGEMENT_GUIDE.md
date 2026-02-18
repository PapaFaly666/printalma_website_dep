# Guide d'implémentation Backend - Gestion du Contenu

## 📋 Vue d'ensemble

Ce guide décrit l'implémentation backend nécessaire pour le système de gestion du contenu de la page d'accueil. Le système permet aux administrateurs de gérer trois sections distinctes avec des nombres d'items fixes.

## 🎯 Sections et Limites

| Section | Nombre d'items | Couleur thématique | Description |
|---------|---------------|-------------------|-------------|
| Designs Exclusifs | **6 items (fixe)** | rgb(241, 209, 45) | Designers/créateurs de contenu |
| Influenceurs Partenaires | **5 items (fixe)** | rgb(20, 104, 154) | Influenceurs et personnalités |
| Merchandising Musical | **6 items (fixe)** | rgb(230, 29, 44) | Artistes musicaux |

⚠️ **IMPORTANT:** Le nombre d'items est **fixe et non modifiable**. Les administrateurs peuvent uniquement **modifier** le nom et l'image de chaque item existant. Il n'y a **pas d'ajout ni de suppression** d'items.

💡 **Note:** Pour "remplacer" un vendeur par un autre, l'admin modifie simplement le nom et l'image de l'item existant. L'ID reste le même, seules les informations affichées changent.

## 📊 Modèle de données (Prisma)

### Option 1 : Table unique avec type (Recommandé)

```prisma
model HomeContent {
  id        String   @id @default(cuid())
  type      ContentType
  name      String   @db.VarChar(100)
  imageUrl  String   @db.VarChar(500)
  order     Int      // Position dans la section (0-5 ou 0-4)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@unique([type, order]) // Garantit l'unicité de l'ordre par type
  @@map("home_content")
}

enum ContentType {
  DESIGN          // Designs Exclusifs
  INFLUENCER      // Influenceurs Partenaires
  MERCHANDISING   // Merchandising Musical
}
```

### Option 2 : Tables séparées (Alternative)

```prisma
model DesignContent {
  id        String   @id @default(cuid())
  name      String   @db.VarChar(100)
  imageUrl  String   @db.VarChar(500)
  order     Int      @unique
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("design_content")
}

model InfluencerContent {
  id        String   @id @default(cuid())
  name      String   @db.VarChar(100)
  imageUrl  String   @db.VarChar(500)
  order     Int      @unique
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("influencer_content")
}

model MerchandisingContent {
  id        String   @id @default(cuid())
  name      String   @db.VarChar(100)
  imageUrl  String   @db.VarChar(500)
  order     Int      @unique
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("merchandising_content")
}
```

## 🔌 API Endpoints

### 1. GET `/api/admin/content` - Récupérer tout le contenu

**Auth:** Admin uniquement

**Response:**
```typescript
{
  success: true,
  data: {
    designs: [
      {
        id: "clx123...",
        name: "Pap Musa",
        imageUrl: "https://cloudinary.com/.../x_pap_musa.svg",
        order: 0
      },
      // ... 5 autres items
    ],
    influencers: [
      {
        id: "clx456...",
        name: "Ebu Jomlong",
        imageUrl: "https://images.unsplash.com/...",
        order: 0
      },
      // ... 4 autres items
    ],
    merchandising: [
      {
        id: "clx789...",
        name: "Bathie Drizzy",
        imageUrl: "https://tse2.mm.bing.net/...",
        order: 0
      },
      // ... 5 autres items
    ]
  }
}
```

**Implémentation (avec Option 1):**
```typescript
async getContent() {
  const content = await prisma.homeContent.findMany({
    orderBy: { order: 'asc' }
  });

  return {
    designs: content.filter(item => item.type === 'DESIGN'),
    influencers: content.filter(item => item.type === 'INFLUENCER'),
    merchandising: content.filter(item => item.type === 'MERCHANDISING')
  };
}
```

### 2. PUT `/api/admin/content` - Sauvegarder tout le contenu

**Auth:** Admin uniquement

**Request Body:**
```typescript
{
  designs: [
    {
      id: string,  // ID obligatoire (modification uniquement)
      name: string,
      imageUrl: string
    },
    // ... exactement 6 items
  ],
  influencers: [
    {
      id: string,  // ID obligatoire (modification uniquement)
      name: string,
      imageUrl: string
    },
    // ... exactement 5 items
  ],
  merchandising: [
    {
      id: string,  // ID obligatoire (modification uniquement)
      name: string,
      imageUrl: string
    },
    // ... exactement 6 items
  ]
}
```

⚠️ **Note:** Les IDs doivent correspondre aux items existants en base de données. Pas de création ni suppression d'items.

**Validation:**
```typescript
// Validation Zod
const ContentItemSchema = z.object({
  id: z.string().cuid(), // ID obligatoire
  name: z.string().min(1).max(100),
  imageUrl: z.string().url().max(500)
});

const ContentUpdateSchema = z.object({
  designs: z.array(ContentItemSchema).length(6),
  influencers: z.array(ContentItemSchema).length(5),
  merchandising: z.array(ContentItemSchema).length(6)
});
```

**Implémentation:**
```typescript
async updateContent(data: ContentUpdateDto) {
  // Validation des quantités
  if (data.designs.length !== 6) {
    throw new BadRequestException('Designs: 6 items requis');
  }
  if (data.influencers.length !== 5) {
    throw new BadRequestException('Influenceurs: 5 items requis');
  }
  if (data.merchandising.length !== 6) {
    throw new BadRequestException('Merchandising: 6 items requis');
  }

  // Vérifier que tous les IDs existent
  const allIds = [
    ...data.designs.map(d => d.id),
    ...data.influencers.map(i => i.id),
    ...data.merchandising.map(m => m.id)
  ];

  const existingItems = await prisma.homeContent.findMany({
    where: { id: { in: allIds } }
  });

  if (existingItems.length !== allIds.length) {
    throw new BadRequestException('Certains IDs sont invalides');
  }

  // Transaction pour garantir la cohérence
  return await prisma.$transaction(async (tx) => {
    // Mettre à jour chaque item individuellement
    const updates = [
      ...data.designs.map(item =>
        tx.homeContent.update({
          where: { id: item.id },
          data: {
            name: item.name,
            imageUrl: item.imageUrl
          }
        })
      ),
      ...data.influencers.map(item =>
        tx.homeContent.update({
          where: { id: item.id },
          data: {
            name: item.name,
            imageUrl: item.imageUrl
          }
        })
      ),
      ...data.merchandising.map(item =>
        tx.homeContent.update({
          where: { id: item.id },
          data: {
            name: item.name,
            imageUrl: item.imageUrl
          }
        })
      )
    ];

    await Promise.all(updates);

    return { success: true, message: 'Contenu sauvegardé' };
  });
}
```

### 3. POST `/api/admin/content/upload` - Upload d'image vers Cloudinary

**Auth:** Admin uniquement

**Request:** Multipart form-data
- `file`: Image file (jpg, png, svg, webp)
- `section`: "designs" | "influencers" | "merchandising"

**Response:**
```typescript
{
  success: true,
  data: {
    url: "https://res.cloudinary.com/.../image.png",
    publicId: "home_content/designs/clx123..."
  }
}
```

**Implémentation:**
```typescript
import { v2 as cloudinary } from 'cloudinary';

async uploadContentImage(file: Express.Multer.File, section: string) {
  // Validation du type de fichier
  const allowedMimes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
  if (!allowedMimes.includes(file.mimetype)) {
    throw new BadRequestException('Type de fichier non supporté');
  }

  // Limite de taille: 5MB
  if (file.size > 5 * 1024 * 1024) {
    throw new BadRequestException('Fichier trop volumineux (max 5MB)');
  }

  // Upload vers Cloudinary
  const result = await cloudinary.uploader.upload(file.path, {
    folder: `home_content/${section}`,
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ]
  });

  return {
    url: result.secure_url,
    publicId: result.public_id
  };
}
```

### 4. GET `/api/public/content` - Récupérer le contenu (Public)

**Auth:** Aucune (endpoint public)

**Response:** Même structure que GET `/api/admin/content`

**Note:** Cet endpoint est utilisé par la page d'accueil pour afficher le contenu.

## 🔐 Sécurité et Permissions

### Middleware d'authentification

```typescript
// Vérifier que l'utilisateur est admin
@UseGuards(AdminGuard)
@Controller('admin/content')
export class AdminContentController {
  // ...
}
```

### Validation des URLs d'images

```typescript
// Vérifier que l'URL provient de Cloudinary ou sources autorisées
const isValidImageUrl = (url: string): boolean => {
  const allowedDomains = [
    'res.cloudinary.com',
    'images.unsplash.com',
    'tse2.mm.bing.net',
    // Autres domaines autorisés
  ];

  try {
    const urlObj = new URL(url);
    return allowedDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
};
```

## 📝 DTO TypeScript

```typescript
// src/admin/dto/content-item.dto.ts
export class ContentItemDto {
  @IsString()
  @IsNotEmpty()
  id: string;  // ID obligatoire pour modification

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsUrl()
  @MaxLength(500)
  imageUrl: string;
}

// src/admin/dto/update-content.dto.ts
export class UpdateContentDto {
  @IsArray()
  @ArrayMinSize(6)
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => ContentItemDto)
  designs: ContentItemDto[];

  @IsArray()
  @ArrayMinSize(5)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => ContentItemDto)
  influencers: ContentItemDto[];

  @IsArray()
  @ArrayMinSize(6)
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => ContentItemDto)
  merchandising: ContentItemDto[];
}
```

## 🧪 Tests

### Test de validation des quantités

```typescript
describe('Content Management', () => {
  it('should reject if designs count is not 6', async () => {
    const data = {
      designs: [/* 5 items */],
      influencers: [/* 5 items */],
      merchandising: [/* 6 items */]
    };

    await expect(updateContent(data)).rejects.toThrow('6 items requis');
  });

  it('should reject if influencers count is not 5', async () => {
    const data = {
      designs: [/* 6 items */],
      influencers: [/* 6 items */], // Wrong count
      merchandising: [/* 6 items */]
    };

    await expect(updateContent(data)).rejects.toThrow('5 items requis');
  });

  it('should save content successfully with correct counts', async () => {
    const data = {
      designs: [/* 6 items */],
      influencers: [/* 5 items */],
      merchandising: [/* 6 items */]
    };

    const result = await updateContent(data);
    expect(result.success).toBe(true);
  });
});
```

## 📊 Migration Prisma

```bash
# Créer la migration
npx prisma migrate dev --name add_home_content_table

# Générer le client
npx prisma generate

# Appliquer en production
npx prisma migrate deploy
```

## 🚀 Initialisation des données

⚠️ **OBLIGATOIRE:** Le système nécessite que **17 items** (6+5+6) soient présents en base de données **avant** la première utilisation. Si la base est vide, l'interface admin ne fonctionnera pas correctement.

### Script de seed (REQUIS pour la première installation)

```typescript
// prisma/seed-content.ts
async function seedHomeContent() {
  const designs = [
    { name: 'Pap Musa', imageUrl: '/x_pap_musa.svg', order: 0 },
    { name: 'Ceeneer', imageUrl: '/x_ceeneer.svg', order: 1 },
    { name: 'K & C', imageUrl: '/x_kethiakh.svg', order: 2 },
    { name: 'Breadwinner', imageUrl: '/x_breadwinner.svg', order: 3 },
    { name: 'Meissa Biguey', imageUrl: '/x_maisssa_biguey.svg', order: 4 },
    { name: 'DAD', imageUrl: '/x_dad.svg', order: 5 }
  ];

  const influencers = [
    { name: 'Ebu Jomlong', imageUrl: 'https://...', order: 0 },
    { name: 'Dip Poundou Guiss', imageUrl: 'https://...', order: 1 },
    { name: 'Massamba Amadeus', imageUrl: 'https://...', order: 2 },
    { name: 'Amina Abed', imageUrl: 'https://...', order: 3 },
    { name: 'Mut Cash', imageUrl: 'https://...', order: 4 }
  ];

  const merchandising = [
    { name: 'Bathie Drizzy', imageUrl: 'https://...', order: 0 },
    { name: 'Latzo Dozé', imageUrl: 'https://...', order: 1 },
    { name: 'Jaaw Ketchup', imageUrl: 'https://...', order: 2 },
    { name: 'Dudu FDV', imageUrl: 'https://...', order: 3 },
    { name: 'Adja Everywhere', imageUrl: 'https://...', order: 4 },
    { name: 'Pape Sidy Fall', imageUrl: 'https://...', order: 5 }
  ];

  await prisma.homeContent.createMany({
    data: [
      ...designs.map(d => ({ ...d, type: 'DESIGN' as const })),
      ...influencers.map(i => ({ ...i, type: 'INFLUENCER' as const })),
      ...merchandising.map(m => ({ ...m, type: 'MERCHANDISING' as const }))
    ]
  });

  console.log('✅ Home content seeded successfully');
}
```

## 📖 Notes importantes

1. **Modification uniquement** : Le système permet **uniquement** de modifier le nom et l'image des items existants. **Aucun ajout ni suppression** n'est possible.
2. **Initialisation obligatoire** : La base de données **DOIT** contenir exactement 17 items (6+5+6) avant la première utilisation. Utiliser le script de seed.
3. **Transactions obligatoires** : Utiliser `prisma.$transaction` pour garantir la cohérence des données lors des mises à jour
4. **Validation stricte** :
   - Le nombre d'items DOIT être exact (6-5-6)
   - Tous les IDs doivent correspondre à des items existants
   - Aucun champ ne peut être vide
5. **URLs sécurisées** : Valider que les URLs proviennent de sources autorisées (Cloudinary, Unsplash, etc.)
6. **Cache** : Considérer un cache Redis pour l'endpoint public (`/api/public/content`)
7. **CDN** : Utiliser Cloudinary CDN pour optimiser le chargement des images

## 🔄 Flux complet

```
Admin UI → Modification des champs nom/image
    ↓
PUT /api/admin/content (avec IDs existants)
    ↓
Validation (6-5-6 items + IDs valides + champs remplis)
    ↓
Transaction Prisma
    ↓
Update de chaque item individuellement
    ↓
Response Success
    ↓
Frontend recharge → GET /api/admin/content
```

```
Page d'accueil → GET /api/public/content
    ↓
Cache Redis (optionnel)
    ↓
Prisma query
    ↓
Response avec images Cloudinary
    ↓
Affichage des sections
```

---

**Version:** 1.0.0
**Date:** 2026-02-06
**Auteur:** Claude Code
**Status:** Prêt pour implémentation
