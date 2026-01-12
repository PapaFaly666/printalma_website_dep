# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

**Development:**
```bash
npm run dev          # Start development server on port 5174
npm run build        # Build for production (TypeScript + Vite)
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

**Note:** The frontend runs on port 5174 and proxies API requests to the backend at localhost:3004.

## Project Architecture

This is a React + TypeScript e-commerce platform called "PrintAlma" for custom product printing with design placement capabilities.

### Frontend Architecture
- **Framework:** React 19 with TypeScript, Vite build tool, TailwindCSS + shadcn/ui components
- **State Management:** React Context (AuthContext, CategoryContext) + TanStack React Query for server state
- **Routing:** React Router v7 with role-based protected routes (Public/Admin/Vendor)
- **Design System:** Fabric.js for canvas manipulation, design positioning, and product customization

### Key Architecture Patterns

**1. Role-Based Access Control:**
- `PublicRoute`: Open to all users
- `AdminRoute`: Requires admin authentication  
- `VendeurRoute`: Requires vendor authentication
- `ProtectedRoute`: Generic authenticated route

**2. Multi-User System:**
- **Admins:** Full system access, product/vendor management, design validation
- **Vendors:** Can create and sell designs, manage their products
- **Customers:** Browse, customize, and purchase products

**3. Product & Design System:**
- Products have "delimitations" (design placement boundaries)
- Vendors can upload designs and position them on products
- Real-time design preview with Fabric.js canvas
- Cascade validation system for design/product approval workflow

**4. API Architecture:**
- Backend at `localhost:3004` with proxy configuration
- Centralized API config in `src/config/api.ts`
- Services layer for all API interactions (auth, products, designs, etc.)
- Comprehensive error handling with type-safe error messages

### Important Directories

**Core Application:**
- `src/pages/` - Route components organized by user role (admin/, vendor/, public)
- `src/components/` - Reusable components organized by domain (admin/, auth/, cascade/, vendor/, ui/)
- `src/hooks/` - Custom React hooks for state management and API calls
- `src/services/` - API service layer for all backend communications
- `src/contexts/` - React context providers (Auth, Category)

**Business Logic:**
- `src/types/` - TypeScript type definitions for API contracts
- `src/utils/` - Helper functions for image processing, validation, API helpers
- `src/config/` - Application configuration (API endpoints, validation rules)

### Key Features

**Design System:**
- Interactive design positioning with Fabric.js
- Real coordinate system with percentage-based positioning  
- Design transform persistence via localStorage and API
- Boundary validation system for design placement

**Vendor Workflow:**
- Design upload and positioning interface
- Cascade validation system with status tracking
- Product creation with design integration
- Extended vendor profiles with shop management

**Admin Tools:**
- Product validation and management interfaces
- Design positioning tools for admins
- Order management and analytics dashboards
- Theme and category management

## Development Notes

**API Integration:**
- All API endpoints are defined in `src/config/api.ts`
- Services use consistent error handling patterns
- Authentication state managed globally via AuthContext
- File uploads handled via multipart/form-data with proper validation

**Design Canvas:**
- Fabric.js integration for interactive design manipulation
- Position data stored as percentages for responsive design
- Real-time preview updates during design positioning
- Canvas state persistence across page refreshes

**State Management:**
- TanStack Query for server state caching and synchronization
- Local storage for design positioning and draft persistence
- Context providers for global app state (auth, categories)

**Routing Structure:**
- `/admin/*` - Admin dashboard and management tools
- `/vendeur/*` - Vendor dashboard and design tools  
- `/` - Public landing page and product catalog
- Authentication redirects based on user role

The codebase includes extensive debugging utilities, test files, and comprehensive documentation for the design positioning and validation systems.
- Implémentation du Système de Génération Optimale des Stickers

## Résumé

Le système de génération optimale des stickers a été implémenté avec succès. Le backend génère maintenant automatiquement les images finales des stickers avec les bordures, éliminant la charge de traitement CSS du frontend.

## Fichiers Créés

### 1. Services

#### `/src/sticker/services/sticker-generator.service.ts`
Service principal de génération d'images utilisant **Sharp**.

**Fonctionnalités:**
- Téléchargement d'images depuis Cloudinary
- Redimensionnement avec conservation du ratio
- Ajout de bordures (fine pour autocollants, large pour pare-chocs)
- Effet glossy optionnel
- Support des formes (carré, cercle, rectangle, découpe personnalisée)
- Conversion mm/cm → pixels (300 DPI)

**Méthodes principales:**
```typescript
generateStickerImage(config: StickerConfig): Promise<Buffer>
createStickerFromDesign(designImageUrl, stickerType, borderColor, size, shape): Promise<Buffer>
mmToPixels(mm: number, dpi?: number): number
```

#### `/src/sticker/services/sticker-cloudinary.service.ts`
Service d'upload des stickers générés sur Cloudinary.

**Fonctionnalités:**
- Upload de buffer d'image vers Cloudinary
- Transformation automatique (optimisation qualité, progressive loading)
- Gestion du public_id pour traçabilité
- Suppression de stickers

**Méthodes principales:**
```typescript
uploadStickerToCloudinary(imageBuffer, productId, designId): Promise<{url, publicId}>
deleteStickerFromCloudinary(publicId): Promise<void>
uploadStickerWithOptions(imageBuffer, options): Promise<{url, publicId}>
```

## Fichiers Modifiés

### 1. Modèle Prisma (`prisma/schema.prisma`)

Ajout de deux nouveaux champs au modèle `StickerProduct`:

```prisma
model StickerProduct {
  // ... champs existants

  imageUrl           String?  @map("image_url") @db.VarChar(500)
  cloudinaryPublicId String?  @map("cloudinary_public_id") @db.VarChar(255)

  // ... relations
}
```

### 2. DTO (`src/sticker/dto/create-sticker.dto.ts`)

Ajout de deux champs optionnels:

```typescript
export class CreateStickerDto {
  // ... champs existants

  @ApiProperty({
    example: 'autocollant',
    description: 'Type de sticker: autocollant (bordure fine) ou pare-chocs (bordure large)',
    enum: ['autocollant', 'pare-chocs']
  })
  @IsOptional()
  @IsString()
  stickerType?: 'autocollant' | 'pare-chocs';

  @ApiProperty({
    example: 'glossy-white',
    description: 'Couleur de la bordure: white, glossy-white, matte-white, transparent',
    required: false
  })
  @IsOptional()
  @IsString()
  borderColor?: string;
}
```

### 3. Service Principal (`src/sticker/sticker.service.ts`)

**Modifications de la méthode `create()`:**

1. Injection des nouveaux services:
   ```typescript
   constructor(
     private prisma: PrismaService,
     private stickerGenerator: StickerGeneratorService,
     private stickerCloudinary: StickerCloudinaryService,
   ) {}
   ```

2. Workflow de génération après création:
   ```typescript
   // 1. Créer le sticker en BDD (sans imageUrl)
   const sticker = await this.prisma.stickerProduct.create({ ... });

   // 2. Générer l'image avec bordures
   const stickerImageBuffer = await this.stickerGenerator.createStickerFromDesign(
     design.imageUrl,
     stickerType,
     borderColor,
     sizeString,
     shape
   );

   // 3. Upload sur Cloudinary
   const { url, publicId } = await this.stickerCloudinary.uploadStickerToCloudinary(
     stickerImageBuffer,
     sticker.id,
     designId
   );

   // 4. Mettre à jour l'URL dans la BDD
   await this.prisma.stickerProduct.update({
     where: { id: sticker.id },
     data: { imageUrl, cloudinaryPublicId: publicId }
   });
   ```

3. Gestion des erreurs gracieuse:
   - En cas d'erreur de génération, le sticker est quand même créé
   - Un message d'avertissement est retourné
   - L'image peut être générée ultérieurement

### 4. Module (`src/sticker/sticker.module.ts`)

Ajout des nouveaux providers:

```typescript
@Module({
  controllers: [VendorStickerController, PublicStickerController],
  providers: [
    StickerService,
    PrismaService,
    StickerGeneratorService,      // ✅ Nouveau
    StickerCloudinaryService,     // ✅ Nouveau
  ],
  exports: [StickerService],
})
export class StickerModule {}
```

## Dépendances Installées

```json
{
  "sharp": "^0.33.5"
}
```

**Sharp** est une bibliothèque de traitement d'images haute performance basée sur libvips.

## Workflow Complet

```
┌─────────────────────────────────────────────────────────────────┐
│                  POST /vendor/stickers                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Validation (design, taille, finition, prix)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Création en BDD (status: PENDING, imageUrl: null)           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Génération de l'image                                       │
│     - Téléchargement du design depuis Cloudinary                │
│     - Redimensionnement (300 DPI)                               │
│     - Ajout des bordures (4px ou 25px)                          │
│     - Effet glossy si demandé                                   │
│     - Forme (carré, cercle, etc.)                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Upload sur Cloudinary                                       │
│     - Dossier: vendor-stickers                                  │
│     - Nom: sticker_{productId}_design_{designId}_{timestamp}   │
│     - Format: PNG haute qualité                                 │
│     - Transformation: optimisation auto                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Mise à jour en BDD                                          │
│     - imageUrl: URL Cloudinary                                  │
│     - cloudinaryPublicId: ID pour suppression                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. Réponse                                                     │
│     {                                                           │
│       success: true,                                            │
│       productId: 456,                                           │
│       data: { id, name, imageUrl, ... }                         │
│     }                                                           │
└─────────────────────────────────────────────────────────────────┘
```

## Exemple d'Utilisation

### Request

```http
POST /vendor/stickers
Authorization: Bearer <token>
Content-Type: application/json

{
  "designId": 123,
  "name": "Autocollant Logo Entreprise",
  "description": "Sticker haute qualité avec logo",
  "size": {
    "id": "medium",
    "width": 10,
    "height": 10
  },
  "finish": "glossy",
  "shape": "CIRCLE",
  "price": 2500,
  "stockQuantity": 100,
  "stickerType": "autocollant",
  "borderColor": "glossy-white"
}
```

### Response

```json
{
  "success": true,
  "message": "Sticker créé avec succès",
  "productId": 456,
  "data": {
    "id": 456,
    "vendorId": 1,
    "designId": 123,
    "name": "Autocollant Logo Entreprise",
    "sku": "STK-1-123-1",
    "size": {
      "id": "medium",
      "name": "Moyen (10x10 cm)",
      "width": 10,
      "height": 10
    },
    "finish": "glossy",
    "shape": "CIRCLE",
    "imageUrl": "https://res.cloudinary.com/.../sticker_456_design_123_1234567890.png",
    "finalPrice": 2500,
    "status": "PENDING",
    "createdAt": "2024-01-10T22:00:00.000Z"
  }
}
```

## Types de Bordures

### Autocollant (type: 'autocollant')
- Bordure fine: **4 pixels**
- Idéal pour les stickers décoratifs
- Couleurs disponibles:
  - `glossy-white`: Blanc brillant (par défaut)
  - `matte-white`: Blanc mat
  - `white`: Blanc standard
  - `transparent`: Aucune bordure

### Pare-chocs (type: 'pare-chocs')
- Bordure large: **25 pixels**
- Idéal pour les stickers de pare-chocs robustes
- Toujours avec bordure blanche

## Formes Supportées

- `SQUARE`: Carré classique
- `CIRCLE`: Cercle (masque circulaire appliqué)
- `RECTANGLE`: Rectangle
- `DIE_CUT`: Découpe personnalisée selon la forme du design

## Résolution d'Impression

- **300 DPI** (dots per inch)
- Qualité professionnelle pour l'impression
- Exemple: 10cm = 1181 pixels

## Performances

### Temps de génération estimé
- Petit sticker (5x5 cm): ~1-2 secondes
- Moyen (10x10 cm): ~2-4 secondes
- Grand (20x20 cm): ~4-8 secondes

### Optimisations
- Téléchargement parallélisé
- Compression PNG optimale
- Upload asynchrone vers Cloudinary
- Gestion des erreurs gracieuse

## Améliorations Futures Possibles

### Queue de traitement (optionnel)
Pour éviter que la génération bloque l'API:

```bash
npm install bull redis
```

```typescript
// Queue de jobs
const stickerQueue = new Queue('sticker-generation', {
  redis: process.env.REDIS_URL
});

// Ajouter à la queue
await stickerQueue.add({
  stickerProductId: 123,
  designId: 456,
  config: { ... }
});

// Worker
stickerQueue.process(async (job) => {
  // Génération en arrière-plan
});
```

### Mise en cache
- Cache des designs fréquemment utilisés
- Pré-génération des tailles populaires
- CDN Cloudinary pour distribution mondiale

## Migration Base de Données

Pour appliquer les modifications en production:

```bash
# Générer le client Prisma
npx prisma generate

# Créer une migration
npx prisma migrate dev --name add_sticker_image_fields

# Appliquer en production
npx prisma migrate deploy
```

## Tests

### Test manuel
```bash
curl -X POST http://localhost:3000/vendor/stickers \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "designId": 123,
    "name": "Test Sticker",
    "size": {"id": "medium", "width": 10, "height": 10},
    "finish": "glossy",
    "shape": "SQUARE",
    "price": 2000,
    "stockQuantity": 50,
    "stickerType": "autocollant",
    "borderColor": "glossy-white"
  }'
```

## Logs

Le système log chaque étape:
- 🎨 Génération du sticker
- 📐 Dimensions calculées
- 📥 Téléchargement design
- ✅ Image générée
- ☁️ Upload Cloudinary
- ✅ Sticker créé avec succès

## Problèmes Connus et Solutions

### Erreur P3006 (migration Prisma)
Si la migration échoue:
```bash
npx prisma generate  # Regénérer le client uniquement
```

### Timeout sur génération
Si le timeout est atteint:
- Augmenter le timeout de l'API
- Implémenter une queue de jobs
- Réduire la résolution (actuellement 300 DPI)

### Image design introuvable
Le service retourne une erreur claire et ne crée pas le sticker.

## Sécurité

- Validation stricte des entrées (DTO)
- Vérification de propriété du design
- Limitation de taille des images
- Gestion des erreurs sans exposition de données sensibles
- Timeout sur téléchargements externes

## Conclusion

✅ Le système de génération optimale des stickers est **pleinement fonctionnel**.

✅ Le frontend n'a plus à gérer les effets CSS lourds.

✅ Les images sont générées côté serveur avec Sharp (haute performance).

✅ Les images sont stockées sur Cloudinary pour une distribution rapide.

✅ La base de données conserve toutes les métadonnées nécessaires.

---

**Date d'implémentation:** 10 janvier 2026
**Version:** 1.0.0
**Auteur:** Claude Sonnet 4.5
 base toi de la doc pour gerer les stickers dans /vendeur/stickers c qui est dans le frontedn est bon adapte seulement