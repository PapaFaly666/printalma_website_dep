# Guide d'Implémentation Backend - Gestion des Designers

## 📋 Vue d'ensemble

Ce document décrit comment implémenter l'API de gestion des designers pour le système PrintAlma. Les designers sont des créateurs qui apparaissent sur la page d'accueil avec leurs avatars et informations.

## 🔗 Endpoints API à implémenter

### Routes disponibles

| Méthode | Endpoint | Description | Authentification | Statut |
|---------|----------|-------------|------------------|-------|
| `GET` | `/designers/health` | Vérifier la santé du service | Non | 200 OK |
| `GET` | `/designers/admin` | Lister tous les designers (admin) | Admin | 200 OK |
| `POST` | `/designers/admin` | Créer un designer (admin) | Admin | 201 Created |
| `PUT` | `/designers/admin/:id` | Modifier un designer (admin) | Admin | 200 OK |
| `DELETE` | `/designers/admin/:id` | Supprimer un designer (admin) | Admin | 204 No Content |
| `GET` | `/designers/featured` | Lister les designers en vedette (public) | Non | 200 OK |
| `PUT` | `/designers/featured/update` | Mettre à jour l'ordre des designers en vedette | Admin | 200 OK |

---

## 🗄️ Structure de la Base de Données

### Table `designers`

```sql
CREATE TABLE designers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    bio TEXT,
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    featured_order INTEGER,
    is_featured BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes pour optimiser les requêtes
CREATE INDEX idx_designers_is_active ON designers(is_active);
CREATE INDEX idx_designers_is_featured ON designers(is_featured);
CREATE INDEX idx_designers_sort_order ON designers(sort_order);
CREATE INDEX idx_designers_featured_order ON designers(featured_order);
```

### Relations

- **Un designer** → **Un utilisateur** (créateur)
- **Un designer** peut être **en vedette** ou non
- Les designers en vedette ont un `featured_order` pour le classement

---

## 📝 Détaillé des Endpoints

### 1. Health Check

**Endpoint** : `GET /designers/health`
**Authentification** : Non requise
**Description** : Vérifie que le service designers fonctionne correctement.

**Réponse (200 OK)** :
```json
{
  "status": "ok",
  "timestamp": "2025-01-31T12:00:00.000Z"
}
```

---

### 2. Lister tous les designers (Admin)

**Endpoint** : `GET /designers/admin`
**Authentification** : Admin (JWT requis)
**Description** : Récupère tous les designers, avec option de filtrage.

**Headers requis** :
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Réponse (200 OK)** :
```json
{
  "designers": [
    {
      "id": 1,
      "name": "Pap Musa",
      "displayName": "Pap Musa",
      "bio": "Artiste spécialisé dans les motifs traditionnels africains",
      "avatarUrl": "https://res.cloudinary.com/your-account/designers/avatar-1.jpg",
      "isActive": true,
      "sortOrder": 1,
      "featuredOrder": 1,
      "isFeatured": true,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "creator": {
        "id": 1,
        "firstName": "Papa Faly",
        "lastName": "Diagne"
      }
    }
  ],
  "total": 6
}
```

**Erreurs possibles** :
- `401 Unauthorized` : Token JWT invalide ou manquant
- `403 Forbidden` : L'utilisateur n'est pas admin
- `500 Internal Server Error` : Erreur serveur

---

### 3. Créer un Designer (Admin)

**Endpoint** : `POST /designers/admin`
**Authentification** : Admin (JWT requis)
**Description** : Crée un nouveau designer avec ses informations.

**Headers requis** :
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Body (FormData)** :
```
name: "Nouveau Designer"
displayName: "Display Name Optionnel"
bio: "Description détaillée du designer et de son style"
avatar: [File image - Optionnel, max 2MB]
isActive: "true"
sortOrder: "7"
```

**Réponse (201 Created)** :
```json
{
  "id": 7,
  "name": "Nouveau Designer",
  "displayName": "Display Name Optionnel",
  "bio": "Description détaillée du designer et de son style",
  "avatarUrl": "https://res.cloudinary.com/your-account/designers/avatar-7.jpg",
  "isActive": true,
  "sortOrder": 7,
  "featuredOrder": null,
  "isFeatured": false,
  "createdAt": "2025-01-31T12:00:00.000Z",
  "updatedAt": "2025-01-31T12:00:00.000Z",
  "creator": {
    "id": 1,
    "firstName": "Papa Faly",
    "lastName": "Diagne"
  }
}
```

**Validation** :
- `name` : Requis, min 2 caractères, max 255
- `displayName` : Optionnel, max 255 caractères
- `bio` : Optionnel, max 1000 caractères
- `avatar` : Optionnel, formats: jpg/jpeg/png/gif/webp, max 2MB
- `isActive` : Boolean, défaut `true`
- `sortOrder` : Entier, défaut incrémental

**Erreurs possibles** :
- `400 Bad Request` : Validation échouée
- `401 Unauthorized` : Non authentifié
- `403 Forbidden` : Non admin
- `413 Payload Too Large` : Avatar trop volumineux (> 2MB)

---

### 4. Modifier un Designer (Admin)

**Endpoint** : `PUT /designers/admin/:id`
**Authentification** : Admin (JWT requis)
**Description** : Modifie les informations d'un designer existant.

**Headers requis** :
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Body (FormData)** :
```
name: "Nom modifié"
displayName: "Nouveau display"
bio: "Description mise à jour"
avatar: [File image - Optionnel]
removeAvatar: "true" // Pour supprimer l'avatar existant
isActive: "true"
sortOrder: "8"
isFeatured: "true"
featuredOrder: "3"
```

**Réponse (200 OK)** : Même format que la création

**Erreurs possibles** :
- `400 Bad Request` : Validation échouée
- `401 Unauthorized` : Non authentifié
- `403 Forbidden` : Non admin
- `404 Not Found` : Designer inexistant
- `413 Payload Too Large` : Avatar trop volumineux

---

### 5. Supprimer un Designer (Admin)

**Endpoint** : `DELETE /designers/admin/:id`
**Authentification** : Admin (JWT requis)
**Description** : Supprime définitivement un designer.

**Headers requis** :
```
Authorization: Bearer <jwt_token>
```

**Réponse (204 No Content)** : Designer supprimé avec succès

**Erreurs possibles** :
- `401 Unauthorized` : Non authentifié
- `403 Forbidden` : Non admin
- `404 Not Found` : Designer inexistant
- `409 Conflict` : Designer utilisé dans des designs

---

### 6. Lister les Designers en Vedette (Public)

**Endpoint** : `GET /designers/featured`
**Authentification** : Non requise
**Description** : Récupère les designers configurés pour apparaître sur la page d'accueil.

**Réponse (200 OK)** :
```json
[
  {
    "id": 1,
    "name": "Pap Musa",
    "displayName": "Pap Musa",
    "bio": "Artiste spécialisé dans les motifs traditionnels africains",
    "avatarUrl": "https://res.cloudinary.com/your-account/designers/avatar-1.jpg",
    "isActive": true,
    "sortOrder": 1,
    "featuredOrder": 1,
    "isFeatured": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "creator": {
      "id": 1,
      "firstName": "Papa Faly",
      "lastName": "Diagne"
    }
  }
]
```

**Tri** : Les designers sont retournés triés par `featuredOrder` (1 = premier à afficher).

---

### 7. Mettre à Jour les Designers en Vedette (Admin)

**Endpoint** : `PUT /designers/featured/update`
**Authentification** : Admin (JWT requis)
**Description** : Met à jour la liste et l'ordre des designers en vedette sur la page d'accueil.

**Headers requis** :
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body** :
```json
{
  "designerIds": ["1", "2", "3", "4", "5", "6"]
}
```

**Réponse (200 OK)** : Tableau des designers mis à jour avec les bons `featuredOrder` :

```json
[
  {
    "id": 1,
    "name": "Pap Musa",
    "displayName": "Pap Musa",
    "bio": "Artiste spécialisé dans les motifs traditionnels africains",
    "avatarUrl": "https://res.cloudinary.com/your-account/designers/avatar-1.jpg",
    "isActive": true,
    "sortOrder": 1,
    "featuredOrder": 1,
    "isFeatured": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-31T12:00:00.000Z",
    "creator": {
      "id": 1,
      "firstName": "Papa Faly",
      "lastName": "Diagne"
    }
  }
  // ... 5 autres designers
]
```

**Validation côté client** :
- Les IDs peuvent être envoyés en strings ou en nombres
- Exactement 6 designers requis
- Maximum 6 designers autorisés
- Tous les IDs doivent exister et être actifs

**Erreurs possibles** :
- `400 Bad Request` : "Exactement 6 designers doivent être sélectionnés"
- `400 Bad Request` : "Maximum 6 designers autorisés"
- `400 Bad Request` : "Les designers suivants n'existent pas: 99, 100"
- `400 Bad Request` : "Les designers suivants sont inactifs: Designer Inactif"
- `401 Unauthorized` : Token JWT invalide
- `403 Forbidden` : L'utilisateur n'a pas les droits administrateur

---

## 🏗️ Exemple d'Implémentation (NestJS + Prisma)

### 1. Schéma Prisma

```prisma
// schema.prisma
model Designer {
  id            Int      @id @default(autoincrement())
  name          String   @db.VarChar(255)
  displayName    String?  @db.VarChar(255)
  bio           String?  @db.Text
  avatarUrl     String?  @db.VarChar(500)
  isActive      Boolean  @default(true)
  sortOrder     Int      @default(0)
  featuredOrder Int?     @default(null)
  isFeatured   Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  creator       User     @relation(fields: [createdBy], references: [id])
  createdBy     Int

  @@map("designers")
}

model User {
  // ... autres champs
  designers     Designer[]
}

model User {
  // ... autres champs
  createdDesigners Designer[]
}
```

### 2. DTOs

```typescript
// dto/create-designer.dto.ts
export class CreateDesignerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsOptional()
  @MaxLength(255)
  displayName?: string;

  @IsOptional()
  @MaxLength(1000)
  bio?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

// dto/update-designer.dto.ts
export class UpdateDesignerDto {
  @IsOptional()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @MaxLength(255)
  displayName?: string;

  @IsOptional()
  @MaxLength(1000)
  bio?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsInt()
  featuredOrder?: number;

  @IsOptional()
  @IsBoolean()
  removeAvatar?: boolean;
}

// dto/update-featured-designers.dto.ts
export class UpdateFeaturedDesignersDto {
  @IsArray()
  @IsString({ each: true })
  designerIds: string[];
}
```

### 3. Service

```typescript
// services/designers.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@nestjs/prisma';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateDesignerDto, UpdateDesignerDto } from './dto';

@Injectable()
export class DesignersService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async getAllDesigners() {
    return {
      designers: await this.prisma.designer.findMany({
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' },
        ],
      }),
      total: await this.prisma.designer.count(),
    };
  }

  async createDesigner(
    createData: CreateDesignerDto,
    avatarFile: Express.Multer.File,
    createdBy: number,
  ) {
    let avatarUrl: string | null = null;

    if (avatarFile) {
      avatarUrl = await this.cloudinary.uploadImage(avatarFile, 'designers');
    }

    return this.prisma.designer.create({
      data: {
        ...createData,
        avatarUrl,
        createdBy,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async updateDesigner(
    id: number,
    updateData: UpdateDesignerDto,
    avatarFile: Express.Multer.File,
  ) {
    const existingDesigner = await this.prisma.designer.findUnique({
      where: { id },
    });

    if (!existingDesigner) {
      throw new NotFoundException(`Designer #${id} not found`);
    }

    let avatarUrl = existingDesigner.avatarUrl;

    if (avatarFile) {
      avatarUrl = await this.cloudinary.uploadImage(avatarFile, 'designers');
    } else if (updateData.removeAvatar) {
      avatarUrl = null;
    }

    return this.prisma.designer.update({
      where: { id },
      data: {
        ...updateData,
        avatarUrl,
        updatedAt: new Date(),
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async deleteDesigner(id: number) {
    const existingDesigner = await this.prisma.designer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            designs: true,
          },
        },
      },
    });

    if (!existingDesigner) {
      throw new NotFoundException(`Designer #${id} not found`);
    }

    if (existingDesigner._count.designs > 0) {
      throw new ConflictException(
        `Cannot delete designer "${existingDesigner.name}" - it is used in ${existingDesigner._count.designs} designs`
      );
    }

    await this.prisma.designer.delete({
      where: { id },
    });
  }

  async getFeaturedDesigners() {
    return this.prisma.designer.findMany({
      where: {
        isFeatured: true,
        isActive: true,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        featuredOrder: 'asc',
      },
    });
  }

  async updateFeaturedDesigners(designerIds: string[]): Promise<any[]> {
    // Validation
    if (designerIds.length === 0) {
      throw new BadRequestException('Au moins 1 designer doit être sélectionné');
    }

    if (designerIds.length < 6) {
      throw new BadRequestException('Exactement 6 designers doivent être sélectionnés');
    }

    if (designerIds.length > 6) {
      throw new BadRequestException('Maximum 6 designers autorisés');
    }

    // Convertir les IDs en nombres
    const numericIds = designerIds.map(id => parseInt(id, 10));

    // Vérifier que tous les designers existent
    const existingDesigners = await this.prisma.designer.findMany({
      where: {
        id: { in: numericIds },
      },
    });

    if (existingDesigners.length !== numericIds.length) {
      const foundIds = existingDesigners.map(d => d.id);
      const missingIds = numericIds.filter(id => !foundIds.includes(id));
      throw new BadRequestException(
        `Les designers suivants n'existent pas: ${missingIds.join(', ')}`
      );
    }

    // Vérifier que tous les designers sont actifs
    const inactiveDesigners = existingDesigners.filter(d => !d.isActive);
    if (inactiveDesigners.length > 0) {
      const inactiveNames = inactiveDesigners.map(d => d.name);
      throw new BadRequestException(
        `Les designers suivants sont inactifs: ${inactiveNames.join(', ')}`
      );
    }

    // Transaction atomique
    return await this.prisma.$transaction(async (tx) => {
      // Réinitialiser tous les designers
      await tx.designer.updateMany({
        where: {},
        data: {
          isFeatured: false,
          featuredOrder: null,
        },
      });

      // Mettre à jour les designers sélectionnés
      const updatedDesigners = [];

      for (let i = 0; i < numericIds.length; i++) {
        const designer = await tx.designer.update({
          where: { id: numericIds[i] },
          data: {
            isFeatured: true,
            featuredOrder: i + 1,
          },
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        updatedDesigners.push(designer);
      }

      return updatedDesigners;
    });
  }
}
```

### 4. Controller

```typescript
// controllers/designers.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  ParseFilePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DesignersService } from './designers.service';
import { CreateDesignerDto, UpdateDesignerDto, UpdateFeaturedDesignersDto } from './dto';
import { AdminGuard } from '../auth/admin.guard';
import { User } from '../users/user.entity';

@Controller('designers')
export class DesignersController {
  constructor(private readonly designersService: DesignersService) {}

  @Get('health')
  async health() {
    return { status: 'ok' };
  }

  @Get('admin')
  @UseGuards(AdminGuard)
  async getAllDesigners(@User() user: User) {
    return this.designersService.getAllDesigners();
  }

  @Post('admin')
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async createDesigner(
    @Body() createData: CreateDesignerDto,
    @UploadedFile() avatar: Express.Multer.File,
    @User() user: User,
  ) {
    return this.designersService.createDesigner(createData, avatar, user.id);
  }

  @Put('admin/:id')
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async updateDesigner(
    @Param('id') id: number,
    @Body() updateData: UpdateDesignerDto,
    @UploadedFile() avatar: Express.Multer.File,
    @User() user: User,
  ) {
    return this.designersService.updateDesigner(id, updateData, avatar);
  }

  @Delete('admin/:id')
  @UseGuards(AdminGuard)
  async deleteDesigner(@Param('id') id: number, @User() user: User) {
    await this.designersService.deleteDesigner(id);
  }

  @Get('featured')
  async getFeaturedDesigners() {
    return this.designersService.getFeaturedDesigners();
  }

  @Put('featured/update')
  @UseGuards(AdminGuard)
  async updateFeaturedDesigners(
    @Body() updateData: UpdateFeaturedDesignersDto,
  ) {
    return this.designersService.updateFeaturedDesigners(updateData.designerIds);
  }
}
```

### 5. Module

```typescript
// designers.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DesignersController } from './designers.controller';
import { DesignersService } from './designers.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature(['Designer']),
    CloudinaryModule,
    UsersModule,
  ],
  controllers: [DesignersController],
  providers: [DesignersService],
  exports: [DesignersService],
})
export class DesignersModule {}
```

---

## 🔧 Configuration Requise

### 1. **Environment Variables**

```bash
# Configuration Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Base URL
API_BASE_URL=http://localhost:3004

# JWT
JWT_SECRET=your-jwt-secret
```

### 2. **Dépendances**

```json
{
  "@nestjs/common": "^9.0.0",
  "@nestjs/core": "^9.0.0",
  "@nestjs/platform-express": "^9.0.0",
  "@nestjs/typeorm": "^9.0.0",
  "@nestjs/config": "^9.0.0",
  "prisma": "^4.0.0",
  "cloudinary": "^1.41.0",
  "@types/multer": "^1.4.7"
}
```

### 3. **File Upload Configuration**

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuration pour l'upload de fichiers
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // CORS pour permettre l'upload depuis le frontend
  app.enableCors({
    origin: ['http://localhost:5174', 'https://printalma-website-dep.onrender.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(3004);
}
bootstrap();
```

---

## 🚀 Déploiement et Tests

### Tests API

```bash
# Test de santé
curl http://localhost:3004/designers/health

# Test avec authentification admin
curl -X GET http://localhost:3004/designers/admin \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test création designer
curl -X POST http://localhost:3004/designers/admin \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "name=Nouveau Designer" \
  -F "displayName=Display Name" \
  -F "bio=Description du designer" \
  -F "isActive=true"

# Test mise à jour designers en vedette
curl -X PUT http://localhost:3004/designers/featured/update \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"designerIds": ["1", "2", "3", "4", "5", "6"]}'
```

### Vérification

1. **Accès santé** : `GET /designers/health` → `200 OK`
2. **Liste designers** : `GET /designers/admin` → Tableau avec 6 designers
3. **Création designer** : `POST /designers/admin` → `201 Created`
4. **Mise à jour** : `PUT /designers/admin/1` → `200 OK`
5. **Suppression** : `DELETE /designers/admin/6` → `204 No Content`
6. **Designers vedette** : `GET /designers/featured` → Tableau de 6 designers triés
7. **Classement vedette** : `PUT /designers/featured/update` → `200 OK` avec ordre mis à jour

---

## 📝 Notes de Développement

### Business Logic

1. **6 designers requis** : Exactement 6 designers doivent être configurés en vedette
2. **Transaction atomique** : La mise à jour des `featuredOrder` utilise une transaction pour garantir la cohérence
3. **Cascade validation** : Vérifie que les designers existent et sont actifs avant de les inclure
4. **Upload d'images** : Support de Cloudinary pour stocker les avatars
5. **Fallback** : Le frontend utilise des données mockées si le backend n'est pas disponible

### Sécurité

1. **Authentification JWT** pour toutes les routes admin
2. **Validation des entrées** avec class-validator
3. **Contrôle d'accès** avec Guards admin
4. **Gestion des erreurs** appropriée avec messages clairs

### Performance

1. **Indexes de base de données** optimisés pour les requêtes fréquentes
2. **Upload d'images** asynchrone avec Cloudinary
3. **Pagination** implémentée si le nombre de designers devient important

Avec cette documentation, votre backend sera prêt à gérer complètement la fonctionnalité de gestion des designers ! 🎨✨