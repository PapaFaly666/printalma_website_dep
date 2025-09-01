# 📄 Guide de Refactorisation du Backend : `DesignPositionService`

## 🎯 Objectif

Ce guide a pour but de refactoriser le service `DesignPositionService` pour :
1.  **Centraliser** toutes les propriétés de transformation (`x`, `y`, `scale`, `rotation`, `designWidth`, `designHeight`) dans un seul champ JSON `position`.
2.  **Éliminer** les colonnes redondantes `design_width` et `design_height` de la table `ProductDesignPosition`.
3.  **Standardiser** les noms de propriétés en `camelCase` pour être cohérent.
4.  **Simplifier** et **fiabiliser** le code en créant des fonctions d'aide.

---

## 1. 🧬 Migration de la Base de Données

La première étape consiste à migrer les données des colonnes `design_width` et `design_height` vers le champ JSON `position`, puis à supprimer ces colonnes.

### 1.1. Script de Migration (SQL)

```sql
-- migration.sql

-- Étape 1 : Ajouter les propriétés designWidth et designHeight au JSON `position`
-- en utilisant les valeurs des colonnes existantes.
UPDATE "ProductDesignPosition"
SET "position" = jsonb_set(
  jsonb_set("position"::jsonb, '{designWidth}', to_jsonb("design_width")),
  '{designHeight}', to_jsonb("design_height")
)
WHERE "design_width" IS NOT NULL AND "design_height" IS NOT NULL;

-- Étape 2 : Supprimer les colonnes redondantes
ALTER TABLE "ProductDesignPosition"
DROP COLUMN "design_width",
DROP COLUMN "design_height";
```

**Note :** Assurez-vous d'adapter la syntaxe (`jsonb_set`, `to_jsonb`) à votre système de base de données (PostgreSQL dans cet exemple).

---

## 2. 🔧 DTO (Data Transfer Object)

Le DTO doit refléter la structure centralisée de `position`.

```typescript
// src/designs/dto/update-design-position.dto.ts

import { IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PositionDto {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsNumber()
  @IsOptional()
  scale?: number;

  @IsNumber()
  @IsOptional()
  rotation?: number;

  @IsNumber()
  @IsOptional()
  designWidth?: number;

  @IsNumber()
  @IsOptional()
  designHeight?: number;

  @IsOptional()
  constraints?: any;
}

export class UpdateDesignPositionDto {
  @ValidateNested()
  @Type(() => PositionDto)
  position: PositionDto;
}
```

---

## 3. 🛠️ Service Refactorisé

Le service est simplifié pour ne manipuler que l'objet `position`.

### 3.1. Fonctions d'Aide (Helpers)

Créons une fonction d'aide pour normaliser l'objet `position`.

```typescript
// src/designs/design-position.helpers.ts

export const normalizePosition = (position: any) => {
  return {
    x: position.x ?? 0,
    y: position.y ?? 0,
    scale: position.scale ?? 1,
    rotation: position.rotation ?? 0,
    designWidth: position.designWidth ?? position.design_width ?? 100, // Accepte les deux formats
    designHeight: position.designHeight ?? position.design_height ?? 100, // Accepte les deux formats
    constraints: position.constraints ?? {},
  };
};
```

### 3.2. `DesignPositionService` Refactorisé

```typescript
// src/designs/design-position.service.ts

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { UpdateDesignPositionDto } from '../dto/update-design-position.dto';
import { normalizePosition } from './design-position.helpers';

@Injectable()
export class DesignPositionService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertPosition(
    vendorId: number,
    vendorProductId: number,
    designId: number,
    dto: UpdateDesignPositionDto,
  ) {
    // Valider les permissions (inchangé)
    await this.validatePermissions(vendorId, vendorProductId, designId);

    const positionJson = normalizePosition(dto.position);

    return this.prisma.productDesignPosition.upsert({
      where: {
        vendorProductId_designId: { vendorProductId, designId },
      },
      create: {
        vendorProductId,
        designId,
        position: positionJson,
      },
      update: {
        position: positionJson,
      },
    });
  }

  async getPositionByDesignId(vendorProductId: number, designId: number) {
    const record = await this.prisma.productDesignPosition.findUnique({
      where: {
        vendorProductId_designId: { vendorProductId, designId },
      },
    });

    if (!record) {
      return null;
    }

    // Normaliser la sortie pour garantir que toutes les propriétés sont présentes
    return normalizePosition(record.position as any);
  }
  
  // ... autres méthodes (delete, etc.)

  private async validatePermissions(vendorId: number, vendorProductId: number, designId: number) {
    // Le code de validation des permissions reste le même
    const product = await this.prisma.vendorProduct.findUnique({
      where: { id: vendorProductId },
    });

    if (!product) throw new NotFoundException('Produit vendeur introuvable');
    if (product.vendorId !== vendorId) throw new ForbiddenException('Ce produit ne vous appartient pas');

    const design = await this.prisma.design.findUnique({
      where: { id: designId },
    });

    if (!design) throw new NotFoundException('Design introuvable');
    if (design.vendorId !== vendorId && !design.isPublished) {
      throw new ForbiddenException('Ce design ne vous est pas accessible');
    }
  }
}
```

---

## 4. 🔗 Endpoint du Contrôleur

Le contrôleur doit être mis à jour pour utiliser le nouveau DTO.

```typescript
// src/designs/design-position.controller.ts

@Controller('design-positions')
export class DesignPositionController {
  constructor(private readonly designPositionService: DesignPositionService) {}

  @Put(':vendorProductId/:designId')
  async upsertPosition(
    @Param('vendorProductId') vendorProductId: number,
    @Param('designId') designId: number,
    @Body() dto: UpdateDesignPositionDto,
    @Req() req: any, // Pour récupérer vendorId
  ) {
    const vendorId = req.user.vendorId; // ou req.vendor.id
    return this.designPositionService.upsertPosition(
      vendorId,
      vendorProductId,
      designId,
      dto,
    );
  }

  @Get(':vendorProductId/:designId')
  async getPosition(
    @Param('vendorProductId') vendorProductId: number,
    @Param('designId') designId: number,
  ) {
    return this.designPositionService.getPositionByDesignId(
      vendorProductId,
      designId,
    );
  }
}
```

---

## ✅ Avantages de cette refactorisation

1.  **Source de vérité unique** : Toutes les données de transformation sont dans un seul champ `position`, ce qui élimine les risques de désynchronisation.
2.  **Code plus propre** : Le code est plus simple, plus lisible et plus facile à maintenir.
3.  **Moins de redondance** : La suppression des colonnes `design_width` et `design_height` réduit la redondance des données.
4.  **Cohérence** : Les noms de propriétés sont standardisés en `camelCase`.
5.  **Fiabilité** : La fonction `normalizePosition` garantit que l'objet `position` a toujours une structure cohérente. 