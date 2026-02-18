# Spécifications API Backend - Content Management

## 🎯 Objectif

Documentation complète de l'API backend nécessaire pour le système de gestion de contenu de la page d'accueil (`/admin/content-management`).

---

## 📋 Endpoints Requis

### 1. GET `/admin/content`

Récupère tout le contenu pour l'interface d'administration.

#### Headers Requis

```http
GET /admin/content HTTP/1.1
Content-Type: application/json
Cookie: session=<session-token>
```

**⚠️ Important:** L'authentification se fait via **cookies de session**, pas de Bearer token.

#### Réponse Succès (200 OK)

```json
{
  "designs": [
    {
      "id": "cmlaxeyxv0001t8kwzmdjrzn7",
      "name": "Designer 1",
      "imageUrl": "https://res.cloudinary.com/xxxx/image/upload/v1234567890/designs/image1.jpg",
      "order": 1
    },
    {
      "id": "cmlaxeyxv0002t8kwzmdjrzn8",
      "name": "Designer 2",
      "imageUrl": "https://res.cloudinary.com/xxxx/image/upload/v1234567890/designs/image2.jpg",
      "order": 2
    }
    // ... 6 items au total
  ],
  "influencers": [
    {
      "id": "cmlaxeyxv0003t8kwzmdjrzn9",
      "name": "Influenceur 1",
      "imageUrl": "https://res.cloudinary.com/xxxx/image/upload/v1234567890/influencers/image1.jpg",
      "order": 1
    }
    // ... 5 items au total
  ],
  "merchandising": [
    {
      "id": "cmlaxeyxv0004t8kwzmdjrzo1",
      "name": "Merchandising 1",
      "imageUrl": "https://res.cloudinary.com/xxxx/image/upload/v1234567890/merchandising/image1.jpg",
      "order": 1
    }
    // ... 6 items au total
  ]
}
```

#### Structure des Données

**Type TypeScript:**
```typescript
interface ContentItem {
  id: string;           // ID unique (cuid ou uuid)
  name: string;         // Nom de l'item
  imageUrl: string;     // URL complète Cloudinary (obligatoire, peut être vide "")
  order?: number;       // Ordre d'affichage (optionnel)
}

interface HomeContent {
  designs: ContentItem[];       // Exactement 6 items
  influencers: ContentItem[];   // Exactement 5 items
  merchandising: ContentItem[]; // Exactement 6 items
}
```

#### Contraintes

- ✅ `designs`: **Exactement 6 items** (ni plus, ni moins)
- ✅ `influencers`: **Exactement 5 items** (ni plus, ni moins)
- ✅ `merchandising`: **Exactement 6 items** (ni plus, ni moins)
- ✅ `imageUrl` peut être **vide (`""`)** si aucune image n'est uploadée
- ✅ `imageUrl` doit être une **URL complète** (avec `https://`)
- ✅ Les IDs doivent être **stables** (ne pas changer à chaque requête)

#### Réponse Erreur (401 Unauthorized)

```json
{
  "success": false,
  "message": "Non autorisé. Veuillez vous reconnecter.",
  "statusCode": 401
}
```

#### Exemple d'Implémentation Backend (NestJS)

```typescript
// content.controller.ts
@Controller('admin/content')
@UseGuards(AuthGuard)
export class ContentController {
  @Get()
  async getAdminContent(@Request() req) {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Accès réservé aux administrateurs');
    }

    const content = await this.contentService.getAll();

    return {
      designs: content.designs.map(item => ({
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl || '', // ⚠️ Important: retourner "" si null
        order: item.order
      })),
      influencers: content.influencers.map(item => ({
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl || '',
        order: item.order
      })),
      merchandising: content.merchandising.map(item => ({
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl || '',
        order: item.order
      }))
    };
  }
}
```

---

### 2. PUT `/admin/content`

Sauvegarde les modifications du contenu.

#### Headers Requis

```http
PUT /admin/content HTTP/1.1
Content-Type: application/json
Cookie: session=<session-token>
```

#### Body de la Requête

```json
{
  "designs": [
    {
      "id": "cmlaxeyxv0001t8kwzmdjrzn7",
      "name": "Designer 1 Modifié",
      "imageUrl": "https://res.cloudinary.com/xxxx/image/upload/v1234567890/designs/new-image.jpg"
    }
    // ... 6 items
  ],
  "influencers": [
    // ... 5 items
  ],
  "merchandising": [
    // ... 6 items
  ]
}
```

#### Réponse Succès (200 OK)

```json
{
  "success": true,
  "message": "Contenu mis à jour avec succès",
  "updatedCount": {
    "designs": 6,
    "influencers": 5,
    "merchandising": 6
  }
}
```

#### Réponse Erreur (400 Bad Request)

```json
{
  "success": false,
  "message": "Validation échouée",
  "errors": [
    "designs doit contenir exactement 6 items",
    "Item avec id 'xyz' introuvable"
  ]
}
```

#### Exemple d'Implémentation Backend (NestJS)

```typescript
// content.controller.ts
@Put()
async updateContent(@Request() req, @Body() updateDto: UpdateContentDto) {
  // Vérifier que l'utilisateur est admin
  if (req.user.role !== 'ADMIN') {
    throw new UnauthorizedException('Accès réservé aux administrateurs');
  }

  // Valider la structure
  if (updateDto.designs.length !== 6) {
    throw new BadRequestException('designs doit contenir exactement 6 items');
  }
  if (updateDto.influencers.length !== 5) {
    throw new BadRequestException('influencers doit contenir exactement 5 items');
  }
  if (updateDto.merchandising.length !== 6) {
    throw new BadRequestException('merchandising doit contenir exactement 6 items');
  }

  // Mettre à jour en base de données
  const result = await this.contentService.updateAll(updateDto);

  return {
    success: true,
    message: 'Contenu mis à jour avec succès',
    updatedCount: result
  };
}
```

---

### 3. POST `/admin/content/upload`

Upload d'une image vers Cloudinary pour le contenu.

#### Headers Requis

```http
POST /admin/content/upload?section=designs HTTP/1.1
Content-Type: multipart/form-data
Cookie: session=<session-token>
```

**⚠️ Important:**
- Pas de `Content-Type: application/json`
- Utiliser `multipart/form-data` pour l'upload de fichiers
- Le paramètre `section` doit être dans l'URL (query string)

#### Query Parameters

| Paramètre | Type | Obligatoire | Valeurs Possibles |
|-----------|------|-------------|-------------------|
| `section` | string | ✅ Oui | `designs`, `influencers`, `merchandising` |

#### Body (Form Data)

```
file: <binary image data>
```

**Formats acceptés:**
- ✅ `.jpg` / `.jpeg`
- ✅ `.png`
- ✅ `.svg` (Important: Support SVG requis)
- ✅ `.webp`

**Taille maximale:** 5 MB

#### Réponse Succès (200 OK)

```json
{
  "success": true,
  "message": "Image uploadée avec succès",
  "data": {
    "url": "https://res.cloudinary.com/xxxx/image/upload/v1234567890/content/designs/image.jpg",
    "publicId": "content/designs/image",
    "format": "jpg",
    "width": 1200,
    "height": 1200,
    "size": 245678
  }
}
```

**⚠️ Important:** Le frontend attend `data.url` ou `url` directement.

#### Réponse Alternative (également acceptée)

```json
{
  "url": "https://res.cloudinary.com/xxxx/image/upload/v1234567890/content/designs/image.jpg",
  "publicId": "content/designs/image"
}
```

#### Réponse Erreur (413 Payload Too Large)

```json
{
  "success": false,
  "message": "Fichier trop volumineux (max 5MB)",
  "statusCode": 413
}
```

#### Réponse Erreur (415 Unsupported Media Type)

```json
{
  "success": false,
  "message": "Format non supporté. Utilisez JPG, PNG, SVG ou WEBP",
  "statusCode": 415
}
```

#### Exemple d'Implémentation Backend (NestJS)

```typescript
// content-upload.controller.ts
import { Controller, Post, UseInterceptors, UploadedFile, Query, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';

@Controller('admin/content')
@UseGuards(AuthGuard)
export class ContentUploadController {
  constructor(private cloudinaryService: CloudinaryService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('section') section: string,
    @Request() req
  ) {
    // Vérifier admin
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException('Accès réservé aux administrateurs');
    }

    // Valider le paramètre section
    const validSections = ['designs', 'influencers', 'merchandising'];
    if (!validSections.includes(section)) {
      throw new BadRequestException('Section invalide');
    }

    // Valider le fichier
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Valider la taille
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new HttpException('Fichier trop volumineux (max 5MB)', HttpStatus.PAYLOAD_TOO_LARGE);
    }

    // Valider le format
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/svg+xml',  // ⚠️ Important: Support SVG
      'image/webp',
      'text/xml',        // SVG peut avoir ce MIME type
      'application/xml'  // SVG peut avoir ce MIME type aussi
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new HttpException('Format non supporté', HttpStatus.UNSUPPORTED_MEDIA_TYPE);
    }

    // Upload vers Cloudinary
    const result = await this.cloudinaryService.uploadImage(file, {
      folder: `content/${section}`,
      resource_type: file.mimetype.includes('svg') ? 'raw' : 'image'
    });

    return {
      success: true,
      message: 'Image uploadée avec succès',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        size: result.bytes
      }
    };
  }
}
```

---

### 4. GET `/public/content`

Récupère le contenu pour la page d'accueil publique (Landing.tsx).

#### Headers

```http
GET /public/content HTTP/1.1
```

**Pas d'authentification requise** - Endpoint public.

#### Réponse Succès (200 OK)

**Même structure que `/admin/content`:**

```json
{
  "designs": [
    {
      "id": "cmlaxeyxv0001t8kwzmdjrzn7",
      "name": "Designer 1",
      "imageUrl": "https://res.cloudinary.com/xxxx/image/upload/v1234567890/designs/image1.jpg"
    }
    // ... 6 items
  ],
  "influencers": [
    // ... 5 items
  ],
  "merchandising": [
    // ... 6 items
  ]
}
```

**⚠️ Important:** Filtrer pour ne retourner que les items **avec une image** (`imageUrl` non vide).

#### Exemple d'Implémentation

```typescript
@Controller('public/content')
export class PublicContentController {
  @Get()
  async getPublicContent() {
    const content = await this.contentService.getAll();

    return {
      designs: content.designs
        .filter(item => item.imageUrl && item.imageUrl !== '')
        .map(item => ({
          id: item.id,
          name: item.name,
          imageUrl: item.imageUrl
        })),
      influencers: content.influencers
        .filter(item => item.imageUrl && item.imageUrl !== '')
        .map(item => ({
          id: item.id,
          name: item.name,
          imageUrl: item.imageUrl
        })),
      merchandising: content.merchandising
        .filter(item => item.imageUrl && item.imageUrl !== '')
        .map(item => ({
          id: item.id,
          name: item.name,
          imageUrl: item.imageUrl
        }))
    };
  }
}
```

---

## 🗄️ Modèle de Base de Données

### Prisma Schema

```prisma
model HomeContentItem {
  id        String   @id @default(cuid())
  section   Section  @default(DESIGNS)
  name      String   @db.VarChar(255)
  imageUrl  String?  @map("image_url") @db.VarChar(500)
  order     Int      @default(0)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("home_content_items")
  @@index([section, order])
}

enum Section {
  DESIGNS
  INFLUENCERS
  MERCHANDISING
}
```

### Initialisation des Données

Le backend doit initialiser **17 items** (6+5+6) au démarrage si la table est vide:

```typescript
// seed.service.ts
async seedHomeContent() {
  const existingCount = await this.prisma.homeContentItem.count();

  if (existingCount === 0) {
    const items = [];

    // 6 designs
    for (let i = 1; i <= 6; i++) {
      items.push({
        section: 'DESIGNS',
        name: `Designer ${i}`,
        imageUrl: '',
        order: i
      });
    }

    // 5 influencers
    for (let i = 1; i <= 5; i++) {
      items.push({
        section: 'INFLUENCERS',
        name: `Influenceur ${i}`,
        imageUrl: '',
        order: i
      });
    }

    // 6 merchandising
    for (let i = 1; i <= 6; i++) {
      items.push({
        section: 'MERCHANDISING',
        name: `Merchandising ${i}`,
        imageUrl: '',
        order: i
      });
    }

    await this.prisma.homeContentItem.createMany({ data: items });
    console.log('✅ 17 home content items créés');
  }
}
```

---

## 🔐 Authentification

### Méthode: Cookies de Session

**Le frontend envoie:**
```typescript
fetch(url, {
  credentials: 'include',  // ⚠️ Important: Envoie les cookies
  headers: {
    'Content-Type': 'application/json'
  }
})
```

**Le backend vérifie:**
```typescript
@UseGuards(AuthGuard)  // Lit le cookie de session
export class ContentController {
  @Get()
  async getContent(@Request() req) {
    // req.user est disponible si authentifié
    if (req.user.role !== 'ADMIN') {
      throw new UnauthorizedException();
    }
  }
}
```

**Configuration CORS requise:**
```typescript
// main.ts
app.enableCors({
  origin: 'http://localhost:5175',  // Frontend
  credentials: true,  // ⚠️ Important: Accepte les cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
});
```

---

## 🧪 Tests de Validation

### Test 1: GET /admin/content

```bash
curl -X GET http://localhost:3000/admin/content \
  -H "Cookie: session=<session-token>" \
  -H "Content-Type: application/json"
```

**Résultat attendu:**
- Status: 200
- Body: Structure avec designs(6), influencers(5), merchandising(6)
- Chaque item a id, name, imageUrl

### Test 2: POST /admin/content/upload

```bash
curl -X POST "http://localhost:3000/admin/content/upload?section=designs" \
  -H "Cookie: session=<session-token>" \
  -F "file=@/path/to/image.jpg"
```

**Résultat attendu:**
- Status: 200
- Body: `{ success: true, data: { url: "https://..." } }`

### Test 3: PUT /admin/content

```bash
curl -X PUT http://localhost:3000/admin/content \
  -H "Cookie: session=<session-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "designs": [...6 items...],
    "influencers": [...5 items...],
    "merchandising": [...6 items...]
  }'
```

**Résultat attendu:**
- Status: 200
- Body: `{ success: true, message: "Contenu mis à jour avec succès" }`

---

## ⚠️ Points d'Attention Critiques

### 1. Support SVG Obligatoire

Les SVG ont des MIME types variés:
- `image/svg+xml` ✅
- `text/xml` ✅ (certains navigateurs)
- `application/xml` ✅ (certains navigateurs)
- `text/plain` ✅ (Safari parfois)

**Validation backend:**
```typescript
const isSvg = file.originalname.toLowerCase().endsWith('.svg') ||
              ['image/svg+xml', 'text/xml', 'application/xml'].includes(file.mimetype);
```

### 2. imageUrl Peut Être Vide

**❌ Mauvais:**
```json
{
  "imageUrl": null  // Frontend va crasher
}
```

**✅ Bon:**
```json
{
  "imageUrl": ""  // Frontend gère correctement
}
```

### 3. URLs Complètes Requises

**❌ Mauvais:**
```json
{
  "imageUrl": "/uploads/image.jpg"  // URL relative
}
```

**✅ Bon:**
```json
{
  "imageUrl": "https://res.cloudinary.com/.../image.jpg"  // URL complète
}
```

### 4. IDs Stables

Les IDs ne doivent **jamais changer**. Le frontend utilise ces IDs pour:
- Associer les uploads aux bonnes entrées
- Maintenir l'état local
- Générer les keys React

**❌ Mauvais:**
```typescript
// Génère de nouveaux IDs à chaque requête
return items.map((item, index) => ({ ...item, id: `${index}` }));
```

**✅ Bon:**
```typescript
// Utilise les IDs de la base de données
return items.map(item => ({ id: item.id, ... }));
```

---

## 📊 Checklist Backend

- [ ] Endpoint GET `/admin/content` implémenté
- [ ] Endpoint PUT `/admin/content` implémenté
- [ ] Endpoint POST `/admin/content/upload` implémenté
- [ ] Endpoint GET `/public/content` implémenté
- [ ] Support SVG complet (tous les MIME types)
- [ ] Validation taille fichiers (max 5MB)
- [ ] Authentification par cookies fonctionnelle
- [ ] CORS configuré avec `credentials: true`
- [ ] 17 items initialisés en base de données
- [ ] imageUrl retourne `""` si null/undefined
- [ ] URLs Cloudinary complètes (https://)
- [ ] IDs stables (cuid ou uuid)
- [ ] Nombres d'items respectés (6, 5, 6)
- [ ] Tests manuels validés

---

**Date:** 6 février 2026
**Version API:** 1.0.0
**Endpoints:** 4 (GET admin, PUT admin, POST upload, GET public)
**Authentification:** Cookies de session
