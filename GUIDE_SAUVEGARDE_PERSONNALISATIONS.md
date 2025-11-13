# 📝 Guide: Sauvegarde des Personnalisations de Produits

**Date:** 13 janvier 2025
**Objectif:** Implémenter la sauvegarde backend des personnalisations faites dans `/product/:id/customize`

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Données actuellement disponibles](#données-actuellement-disponibles)
3. [Architecture proposée](#architecture-proposée)
4. [Implémentation Backend](#implémentation-backend)
5. [Modifications Frontend](#modifications-frontend)
6. [Flux complet](#flux-complet)
7. [Tests](#tests)

---

## 🎯 Vue d'ensemble

### Données existantes dans `/product/:id/customize`

La page `CustomerProductCustomizationPageV3.tsx` contient déjà toutes les données de personnalisation:

#### 1. **Produit sélectionné**
```typescript
{
  id: number;
  name: string;
  price: number;
  suggestedPrice?: number;
  category: { id, name, slug };
  subCategory: { id, name, slug };
  colorVariations: [
    {
      id: number;
      name: string;
      colorCode: string;
      images: [
        {
          id: number;
          view: string; // "Front", "Back", etc.
          url: string;
          delimitations: [
            {
              x: number;
              y: number;
              width: number;
              height: number;
              referenceWidth: number;
              referenceHeight: number;
            }
          ]
        }
      ]
    }
  ];
  sizes: string[];
}
```

#### 2. **Éléments de design (designElements)**
```typescript
type DesignElement = TextElement | ImageElement;

interface TextElement {
  id: string;
  type: 'text';
  x: number;          // Position en % (0-1)
  y: number;          // Position en % (0-1)
  width: number;      // Largeur en pixels
  height: number;     // Hauteur en pixels
  rotation: number;   // Rotation en degrés
  zIndex: number;     // Ordre d'affichage
  text: string;
  fontSize: number;
  baseFontSize: number;
  baseWidth: number;
  fontFamily: string;
  color: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  textAlign: 'left' | 'center' | 'right';
  curve: number;      // Courbure du texte (-355 à 355)
}

interface ImageElement {
  id: string;
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  imageUrl: string;
  naturalWidth: number;
  naturalHeight: number;
}
```

#### 3. **Sélections client**
```typescript
{
  colorVariationId: number;     // Couleur choisie
  viewId: number;               // Vue choisie (Front/Back)
  selections: [
    { size: string; quantity: number }  // Ex: { size: "M", quantity: 2 }
  ]
}
```

#### 4. **Sauvegarde locale actuelle**
Actuellement, les données sont sauvegardées dans `localStorage`:
```typescript
const storageKey = `design-data-product-${id}`;
const dataToSave = {
  elements: designElements,
  colorVariationId: selectedColorVariation?.id,
  viewId: selectedView?.id,
  timestamp: Date.now()
};
localStorage.setItem(storageKey, JSON.stringify(dataToSave));
```

---

## 🏗️ Architecture proposée

### Option 1: Sauvegarde dans une table dédiée (Recommandé)

Créer une table `ProductCustomization` pour stocker toutes les personnalisations:

```prisma
model ProductCustomization {
  id                  Int       @id @default(autoincrement())
  userId              Int?      // Optionnel (pour les utilisateurs connectés)
  sessionId           String?   // Optionnel (pour les guests)

  // Produit et variation
  productId           Int
  colorVariationId    Int
  viewId              Int

  // Éléments de design (JSON)
  designElements      Json      // Tous les éléments (texte + images)

  // Métadonnées
  previewImageUrl     String?   // URL du mockup généré
  totalPrice          Decimal   @db.Decimal(10, 2)

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  // Relations
  product             Product   @relation(fields: [productId], references: [id])
  user                User?     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([sessionId])
  @@index([productId])
}
```

### Option 2: Intégrer dans les OrderItems (Simple)

Ajouter des champs JSON dans `OrderItem` existant:

```prisma
model OrderItem {
  // ... champs existants

  // Nouveaux champs pour personnalisation
  customizationData   Json?     // { elements, colorVariationId, viewId }
  mockupImageUrl      String?   // URL du mockup avec personnalisation

  // ... reste des champs
}
```

**Nous recommandons l'Option 1** pour:
- Séparer les préoccupations (customization vs order)
- Permettre la sauvegarde avant commande
- Récupération facile des designs en cours
- Historique des personnalisations

---

## 💻 Implémentation Backend

### Étape 1: Créer le schema Prisma

**Fichier:** `backend/prisma/schema.prisma`

```prisma
model ProductCustomization {
  id                  Int       @id @default(autoincrement())
  userId              Int?
  sessionId           String?   // UUID pour les guests

  // Produit
  productId           Int
  colorVariationId    Int
  viewId              Int

  // Design data (JSON)
  designElements      Json      // Array de TextElement | ImageElement

  // Sélections de taille (avant commande)
  sizeSelections      Json?     // [{ size: "M", quantity: 2 }]

  // Métadonnées
  previewImageUrl     String?
  totalPrice          Decimal   @db.Decimal(10, 2)

  // État
  status              String    @default("draft") // draft, saved, ordered
  orderId             Int?      // Lien avec la commande si achetée

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  // Relations
  product             Product   @relation(fields: [productId], references: [id])
  user                User?     @relation(fields: [userId], references: [id])
  order               Order?    @relation(fields: [orderId], references: [id])

  @@index([userId])
  @@index([sessionId])
  @@index([productId])
  @@index([status])
}
```

**Commandes:**
```bash
cd backend
npx prisma migrate dev --name add_product_customization
npx prisma generate
```

---

### Étape 2: Créer le DTO (Data Transfer Object)

**Fichier:** `backend/src/customization/dto/create-customization.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// DTO pour un élément de texte
export class TextElementDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ enum: ['text'] })
  type: 'text';

  @ApiProperty()
  @IsNumber()
  x: number;

  @ApiProperty()
  @IsNumber()
  y: number;

  @ApiProperty()
  @IsNumber()
  width: number;

  @ApiProperty()
  @IsNumber()
  height: number;

  @ApiProperty()
  @IsNumber()
  rotation: number;

  @ApiProperty()
  @IsNumber()
  zIndex: number;

  @ApiProperty()
  @IsString()
  text: string;

  @ApiProperty()
  @IsNumber()
  fontSize: number;

  @ApiProperty()
  @IsNumber()
  baseFontSize: number;

  @ApiProperty()
  @IsNumber()
  baseWidth: number;

  @ApiProperty()
  @IsString()
  fontFamily: string;

  @ApiProperty()
  @IsString()
  color: string;

  @ApiProperty({ enum: ['normal', 'bold'] })
  fontWeight: 'normal' | 'bold';

  @ApiProperty({ enum: ['normal', 'italic'] })
  fontStyle: 'normal' | 'italic';

  @ApiProperty({ enum: ['none', 'underline'] })
  textDecoration: 'none' | 'underline';

  @ApiProperty({ enum: ['left', 'center', 'right'] })
  textAlign: 'left' | 'center' | 'right';

  @ApiProperty()
  @IsNumber()
  curve: number;
}

// DTO pour un élément d'image
export class ImageElementDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ enum: ['image'] })
  type: 'image';

  @ApiProperty()
  @IsNumber()
  x: number;

  @ApiProperty()
  @IsNumber()
  y: number;

  @ApiProperty()
  @IsNumber()
  width: number;

  @ApiProperty()
  @IsNumber()
  height: number;

  @ApiProperty()
  @IsNumber()
  rotation: number;

  @ApiProperty()
  @IsNumber()
  zIndex: number;

  @ApiProperty()
  @IsString()
  imageUrl: string;

  @ApiProperty()
  @IsNumber()
  naturalWidth: number;

  @ApiProperty()
  @IsNumber()
  naturalHeight: number;
}

// DTO pour une sélection de taille
export class SizeSelectionDto {
  @ApiProperty()
  @IsString()
  size: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;
}

// DTO principal
export class CreateCustomizationDto {
  @ApiProperty()
  @IsNumber()
  productId: number;

  @ApiProperty()
  @IsNumber()
  colorVariationId: number;

  @ApiProperty()
  @IsNumber()
  viewId: number;

  @ApiProperty({ type: [Object] })
  @IsArray()
  designElements: (TextElementDto | ImageElementDto)[];

  @ApiPropertyOptional({ type: [SizeSelectionDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SizeSelectionDto)
  sizeSelections?: SizeSelectionDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  previewImageUrl?: string;
}

export class UpdateCustomizationDto {
  @ApiPropertyOptional({ type: [Object] })
  @IsArray()
  @IsOptional()
  designElements?: (TextElementDto | ImageElementDto)[];

  @ApiPropertyOptional({ type: [SizeSelectionDto] })
  @IsArray()
  @IsOptional()
  sizeSelections?: SizeSelectionDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  previewImageUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;
}
```

---

### Étape 3: Créer le Service

**Fichier:** `backend/src/customization/customization.service.ts`

```typescript
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomizationDto, UpdateCustomizationDto } from './dto/create-customization.dto';

@Injectable()
export class CustomizationService {
  private readonly logger = new Logger(CustomizationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Créer ou mettre à jour une personnalisation
   * Si une personnalisation existe déjà pour le même produit/user/session, la mettre à jour
   */
  async upsertCustomization(
    dto: CreateCustomizationDto,
    userId?: number
  ) {
    this.logger.log(`Sauvegarde personnalisation - Product: ${dto.productId}, User: ${userId || 'guest'}`);

    // Vérifier que le produit existe
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId }
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${dto.productId} not found`);
    }

    // Calculer le prix total (si sizeSelections fourni)
    const totalQuantity = dto.sizeSelections?.reduce((sum, s) => sum + s.quantity, 0) || 0;
    const totalPrice = totalQuantity * Number(product.price);

    // Chercher une personnalisation existante
    const existingCustomization = await this.prisma.productCustomization.findFirst({
      where: {
        productId: dto.productId,
        ...(userId ? { userId } : { sessionId: dto.sessionId }),
        status: 'draft'
      }
    });

    // Données à sauvegarder
    const data = {
      productId: dto.productId,
      colorVariationId: dto.colorVariationId,
      viewId: dto.viewId,
      designElements: dto.designElements as any,
      sizeSelections: dto.sizeSelections as any,
      previewImageUrl: dto.previewImageUrl,
      totalPrice,
      userId,
      sessionId: userId ? null : dto.sessionId,
      status: 'draft'
    };

    if (existingCustomization) {
      // Mettre à jour
      this.logger.log(`Mise à jour personnalisation existante: ${existingCustomization.id}`);
      return this.prisma.productCustomization.update({
        where: { id: existingCustomization.id },
        data,
        include: {
          product: {
            include: {
              colorVariations: {
                include: {
                  images: true
                }
              }
            }
          }
        }
      });
    } else {
      // Créer nouveau
      this.logger.log('Création nouvelle personnalisation');
      return this.prisma.productCustomization.create({
        data,
        include: {
          product: {
            include: {
              colorVariations: {
                include: {
                  images: true
                }
              }
            }
          }
        }
      });
    }
  }

  /**
   * Récupérer une personnalisation par ID
   */
  async getCustomizationById(id: number) {
    const customization = await this.prisma.productCustomization.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            colorVariations: {
              include: {
                images: true
              }
            }
          }
        }
      }
    });

    if (!customization) {
      throw new NotFoundException(`Customization with ID ${id} not found`);
    }

    return customization;
  }

  /**
   * Récupérer toutes les personnalisations d'un utilisateur
   */
  async getUserCustomizations(userId: number, status?: string) {
    return this.prisma.productCustomization.findMany({
      where: {
        userId,
        ...(status && { status })
      },
      include: {
        product: {
          include: {
            colorVariations: {
              include: {
                images: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
  }

  /**
   * Récupérer les personnalisations d'une session (guest)
   */
  async getSessionCustomizations(sessionId: string, status?: string) {
    return this.prisma.productCustomization.findMany({
      where: {
        sessionId,
        ...(status && { status })
      },
      include: {
        product: {
          include: {
            colorVariations: {
              include: {
                images: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
  }

  /**
   * Mettre à jour une personnalisation
   */
  async updateCustomization(id: number, dto: UpdateCustomizationDto) {
    // Vérifier que la personnalisation existe
    await this.getCustomizationById(id);

    return this.prisma.productCustomization.update({
      where: { id },
      data: {
        ...(dto.designElements && { designElements: dto.designElements as any }),
        ...(dto.sizeSelections && { sizeSelections: dto.sizeSelections as any }),
        ...(dto.previewImageUrl && { previewImageUrl: dto.previewImageUrl }),
        ...(dto.status && { status: dto.status })
      },
      include: {
        product: {
          include: {
            colorVariations: {
              include: {
                images: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Supprimer une personnalisation
   */
  async deleteCustomization(id: number) {
    await this.getCustomizationById(id);

    return this.prisma.productCustomization.delete({
      where: { id }
    });
  }

  /**
   * Marquer une personnalisation comme commandée
   */
  async markAsOrdered(id: number, orderId: number) {
    return this.prisma.productCustomization.update({
      where: { id },
      data: {
        status: 'ordered',
        orderId
      }
    });
  }
}
```

---

### Étape 4: Créer le Controller

**Fichier:** `backend/src/customization/customization.controller.ts`

```typescript
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CustomizationService } from './customization.service';
import { CreateCustomizationDto, UpdateCustomizationDto } from './dto/create-customization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('Product Customizations')
@Controller('customizations')
export class CustomizationController {
  constructor(private readonly customizationService: CustomizationService) {}

  /**
   * Sauvegarder une personnalisation (utilisateur ou guest)
   * POST /customizations
   */
  @Post()
  @UseGuards(OptionalJwtAuthGuard) // Fonctionne avec ou sans authentification
  @ApiOperation({ summary: 'Save product customization' })
  @ApiResponse({ status: 201, description: 'Customization saved successfully' })
  async saveCustomization(
    @Body() dto: CreateCustomizationDto,
    @Req() req: any
  ) {
    const userId = req.user?.id; // undefined si guest
    return this.customizationService.upsertCustomization(dto, userId);
  }

  /**
   * Récupérer une personnalisation par ID
   * GET /customizations/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get customization by ID' })
  async getCustomization(@Param('id', ParseIntPipe) id: number) {
    return this.customizationService.getCustomizationById(id);
  }

  /**
   * Récupérer les personnalisations d'un utilisateur
   * GET /customizations/user/me?status=draft
   */
  @Get('user/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user customizations' })
  async getMyCustomizations(
    @Req() req: any,
    @Query('status') status?: string
  ) {
    return this.customizationService.getUserCustomizations(req.user.id, status);
  }

  /**
   * Récupérer les personnalisations d'une session (guest)
   * GET /customizations/session/:sessionId?status=draft
   */
  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Get session customizations (for guests)' })
  async getSessionCustomizations(
    @Param('sessionId') sessionId: string,
    @Query('status') status?: string
  ) {
    return this.customizationService.getSessionCustomizations(sessionId, status);
  }

  /**
   * Mettre à jour une personnalisation
   * PUT /customizations/:id
   */
  @Put(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Update customization' })
  async updateCustomization(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomizationDto
  ) {
    return this.customizationService.updateCustomization(id, dto);
  }

  /**
   * Supprimer une personnalisation
   * DELETE /customizations/:id
   */
  @Delete(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Delete customization' })
  async deleteCustomization(@Param('id', ParseIntPipe) id: number) {
    return this.customizationService.deleteCustomization(id);
  }
}
```

---

### Étape 5: Créer le Module

**Fichier:** `backend/src/customization/customization.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { CustomizationController } from './customization.controller';
import { CustomizationService } from './customization.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CustomizationController],
  providers: [CustomizationService],
  exports: [CustomizationService]
})
export class CustomizationModule {}
```

**Ajouter au AppModule:**

```typescript
// backend/src/app.module.ts
import { CustomizationModule } from './customization/customization.module';

@Module({
  imports: [
    // ... autres modules
    CustomizationModule,
  ],
})
export class AppModule {}
```

---

## 🎨 Modifications Frontend

### Étape 1: Créer le service de personnalisation

**Fichier:** `src/services/customizationService.ts`

```typescript
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3004';

export interface DesignElement {
  id: string;
  type: 'text' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  // Champs spécifiques au type
  [key: string]: any;
}

export interface SizeSelection {
  size: string;
  quantity: number;
}

export interface CustomizationData {
  productId: number;
  colorVariationId: number;
  viewId: number;
  designElements: DesignElement[];
  sizeSelections?: SizeSelection[];
  sessionId?: string;
  previewImageUrl?: string;
}

class CustomizationService {
  /**
   * Sauvegarder une personnalisation
   */
  async saveCustomization(data: CustomizationData) {
    try {
      console.log('💾 [CustomizationService] Sauvegarde personnalisation:', data);

      const response = await axios.post(`${API_BASE}/customizations`, data, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.getAuthToken() && { Authorization: `Bearer ${this.getAuthToken()}` })
        }
      });

      console.log('✅ [CustomizationService] Personnalisation sauvegardée:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [CustomizationService] Erreur sauvegarde:', error);
      throw error;
    }
  }

  /**
   * Récupérer une personnalisation par ID
   */
  async getCustomization(id: number) {
    try {
      const response = await axios.get(`${API_BASE}/customizations/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ [CustomizationService] Erreur récupération:', error);
      throw error;
    }
  }

  /**
   * Récupérer les personnalisations de l'utilisateur connecté
   */
  async getMyCustomizations(status?: string) {
    try {
      const params = status ? { status } : {};
      const response = await axios.get(`${API_BASE}/customizations/user/me`, {
        params,
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('❌ [CustomizationService] Erreur récupération:', error);
      throw error;
    }
  }

  /**
   * Récupérer les personnalisations d'une session (guest)
   */
  async getSessionCustomizations(sessionId: string, status?: string) {
    try {
      const params = status ? { status } : {};
      const response = await axios.get(`${API_BASE}/customizations/session/${sessionId}`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('❌ [CustomizationService] Erreur récupération session:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour une personnalisation
   */
  async updateCustomization(id: number, data: Partial<CustomizationData>) {
    try {
      const response = await axios.put(`${API_BASE}/customizations/${id}`, data, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.getAuthToken() && { Authorization: `Bearer ${this.getAuthToken()}` })
        }
      });
      return response.data;
    } catch (error) {
      console.error('❌ [CustomizationService] Erreur mise à jour:', error);
      throw error;
    }
  }

  /**
   * Supprimer une personnalisation
   */
  async deleteCustomization(id: number) {
    try {
      await axios.delete(`${API_BASE}/customizations/${id}`, {
        headers: {
          ...(this.getAuthToken() && { Authorization: `Bearer ${this.getAuthToken()}` })
        }
      });
    } catch (error) {
      console.error('❌ [CustomizationService] Erreur suppression:', error);
      throw error;
    }
  }

  /**
   * Générer un sessionId pour les guests
   */
  getOrCreateSessionId(): string {
    const storageKey = 'guest-session-id';
    let sessionId = localStorage.getItem(storageKey);

    if (!sessionId) {
      sessionId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(storageKey, sessionId);
    }

    return sessionId;
  }

  /**
   * Récupérer le token d'authentification
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  }
}

export default new CustomizationService();
```

---

### Étape 2: Modifier CustomerProductCustomizationPageV3.tsx

Ajouter la sauvegarde backend au bouton "Enregistrer" et à l'ajout au panier.

**Modifications à apporter:**

```typescript
// Ajouter l'import
import customizationService from '../services/customizationService';

// Modifier la fonction handleSave
const handleSave = async () => {
  if (!id || !product) return;

  try {
    // Données à sauvegarder
    const customizationData = {
      productId: product.id,
      colorVariationId: selectedColorVariation?.id || 0,
      viewId: selectedView?.id || 0,
      designElements: designElements,
      sessionId: customizationService.getOrCreateSessionId(),
    };

    // Sauvegarder dans le backend
    const result = await customizationService.saveCustomization(customizationData);

    console.log('✅ Personnalisation sauvegardée:', result);

    toast({
      title: '✅ Sauvegardé',
      description: `Personnalisation enregistrée avec succès (ID: ${result.id})`,
      duration: 3000
    });
  } catch (error) {
    console.error('Erreur sauvegarde:', error);
    toast({
      title: 'Erreur',
      description: 'Impossible de sauvegarder la personnalisation',
      variant: 'destructive'
    });
  }
};

// Modifier handleAddToCart pour sauvegarder avant d'ajouter au panier
const handleAddToCart = async (selections: Array<{ size: string; quantity: number }>) => {
  if (!id || !product) return;

  try {
    // Sauvegarder la personnalisation avec les sélections de taille
    const customizationData = {
      productId: product.id,
      colorVariationId: selectedColorVariation?.id || 0,
      viewId: selectedView?.id || 0,
      designElements: designElements,
      sizeSelections: selections,
      sessionId: customizationService.getOrCreateSessionId(),
    };

    const result = await customizationService.saveCustomization(customizationData);

    console.log('✅ Personnalisation sauvegardée avant ajout panier:', result);

    toast({
      title: 'Ajouté au panier',
      description: `${selections.reduce((sum, s) => sum + s.quantity, 0)} article(s) ajouté(s)`,
    });

    // TODO: Implémenter l'ajout réel au panier avec result.id
    // navigate('/cart');
  } catch (error) {
    console.error('Erreur ajout au panier:', error);
    toast({
      title: 'Erreur',
      description: 'Impossible d\'ajouter au panier',
      variant: 'destructive'
    });
  }
};
```

---

## 🔄 Flux complet

### Scénario 1: Utilisateur crée une personnalisation

```
1. Client ouvre /product/:id/customize
   ↓
2. Client ajoute des éléments (texte, images)
   • Sauvegarde auto dans localStorage
   ↓
3. Client clique "Enregistrer"
   • POST /customizations
   • Backend crée ProductCustomization (status: draft)
   • Retourne { id: 123, ... }
   ↓
4. Client continue à modifier
   • Auto-save localStorage
   • Peut cliquer "Enregistrer" pour sync backend
   ↓
5. Client clique "Choisir la quantité & taille"
   • Modal s'ouvre
   • Client sélectionne: M x2, L x1
   ↓
6. Client clique "Ajouter au panier"
   • POST /customizations (avec sizeSelections)
   • Ajout au panier avec customizationId
   • Navigate vers /cart
```

### Scénario 2: Récupération d'une personnalisation

```
1. Client retourne sur /product/:id/customize
   ↓
2. useEffect vérifie:
   • localStorage (récupération immédiate)
   • GET /customizations/session/:sessionId (si guest)
   • GET /customizations/user/me (si connecté)
   ↓
3. Si personnalisation trouvée en backend:
   • Restaurer designElements
   • Restaurer colorVariationId, viewId
   • Afficher toast "Design restauré"
```

---

## ✅ Tests

### Test 1: Créer une personnalisation (guest)

```bash
curl -X POST http://localhost:3004/customizations \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "colorVariationId": 1,
    "viewId": 1,
    "designElements": [
      {
        "id": "text-1",
        "type": "text",
        "x": 0.5,
        "y": 0.5,
        "width": 200,
        "height": 50,
        "rotation": 0,
        "zIndex": 1,
        "text": "Hello World",
        "fontSize": 24,
        "fontFamily": "Arial",
        "color": "#000000"
      }
    ],
    "sessionId": "guest-1234567890"
  }'
```

### Test 2: Récupérer les personnalisations d'une session

```bash
curl -X GET "http://localhost:3004/customizations/session/guest-1234567890"
```

### Test 3: Mettre à jour une personnalisation

```bash
curl -X PUT http://localhost:3004/customizations/1 \
  -H "Content-Type: application/json" \
  -d '{
    "designElements": [
      {
        "id": "text-1",
        "type": "text",
        "x": 0.5,
        "y": 0.5,
        "width": 200,
        "height": 50,
        "rotation": 0,
        "zIndex": 1,
        "text": "Hello Updated",
        "fontSize": 24,
        "fontFamily": "Arial",
        "color": "#FF0000"
      }
    ]
  }'
```

---

## 📊 Avantages de cette approche

1. ✅ **Séparation des préoccupations:** Table dédiée pour les personnalisations
2. ✅ **Support guest:** SessionId pour les utilisateurs non connectés
3. ✅ **Historique:** Toutes les personnalisations sont conservées
4. ✅ **Récupération:** Le client peut récupérer ses designs en cours
5. ✅ **Flexibilité:** JSON pour stocker n'importe quelle structure d'éléments
6. ✅ **Évolutivité:** Facile d'ajouter de nouveaux types d'éléments
7. ✅ **Traçabilité:** CreatedAt, updatedAt, userId, sessionId
8. ✅ **Statut:** draft, saved, ordered pour suivre le cycle de vie

---

## 🚀 Prochaines étapes

1. Implémenter le backend (Prisma migration + Service + Controller)
2. Créer le service frontend
3. Modifier CustomerProductCustomizationPageV3.tsx
4. Tester le flux complet
5. (Optionnel) Générer des mockups avec les personnalisations
6. (Optionnel) Ajouter une page "Mes personnalisations" pour voir l'historique

---

## 📝 Notes importantes

- **Performance:** Le JSON Prisma est performant pour ce cas d'usage
- **Validation:** Valider les éléments côté backend (tailles, positions, etc.)
- **Sécurité:** Vérifier que l'utilisateur a le droit de modifier une personnalisation
- **Nettoyage:** Prévoir un cron job pour supprimer les drafts anciens (ex: >30 jours)
- **Images:** Les URLs d'images doivent être accessibles (Cloudinary, S3, etc.)

Bon développement! 🎨
