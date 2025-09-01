# 🗄️ Guide Backend NestJS - Gestion des Propriétés de Rotation et Dimensions

## 📋 Vue d'ensemble

Ce guide explique comment étendre la structure backend NestJS pour stocker les nouvelles propriétés de transformation des designs :
- `rotation` : Rotation en degrés (0-360°)
- `designWidth` : Largeur du design en pixels
- `designHeight` : Hauteur du design en pixels

Ces propriétés s'ajoutent aux propriétés existantes `x`, `y`, `scale` dans le champ JSON `position`.

## 🎯 Objectif

Permettre la sauvegarde et la récupération des transformations complètes des designs, incluant la rotation et les dimensions personnalisées, dans la base de données existante sans modification structurelle.

---

## 1. 📊 Structure de Base de Données

### 1.1 Entité DesignTransform Étendue

```typescript
// 📁 src/design-transforms/entities/design-transform.entity.ts
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('design_transforms')
export class DesignTransform {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  designId: number;

  @Column()
  productId: number;

  @Column()
  delimitation_index: number;

  // 🆕 Position étendue avec les nouvelles propriétés
  @Column('json')
  position: {
    x: number;              // Position horizontale
    y: number;              // Position verticale
    scale: number;          // Échelle du design
    rotation?: number;      // 🆕 Rotation en degrés (0-360)
    designWidth?: number;   // 🆕 Largeur du design en pixels
    designHeight?: number;  // 🆕 Hauteur du design en pixels
  };

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
```

### 1.2 Migration de Base de Données

```sql
-- 📁 migrations/add-rotation-dimensions-to-position.sql
-- Aucune modification structurelle requise car le champ position est déjà en JSON
-- Ajout de valeurs par défaut pour les anciennes données

UPDATE design_transforms 
SET position = JSON_SET(
  position, 
  '$.rotation', COALESCE(JSON_EXTRACT(position, '$.rotation'), 0),
  '$.designWidth', COALESCE(JSON_EXTRACT(position, '$.designWidth'), 100),
  '$.designHeight', COALESCE(JSON_EXTRACT(position, '$.designHeight'), 100)
) 
WHERE JSON_EXTRACT(position, '$.rotation') IS NULL 
   OR JSON_EXTRACT(position, '$.designWidth') IS NULL 
   OR JSON_EXTRACT(position, '$.designHeight') IS NULL;
```

---

## 2. 🎨 DTO et Validation

### 2.1 DTO de Transformation

```typescript
// 📁 src/design-transforms/dto/design-transform.dto.ts
import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class DesignTransformDto {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsNumber()
  @Min(0.1)
  @Max(5)
  scale: number;

  // 🆕 Nouvelles propriétés avec validation
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(360)
  rotation?: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(1000)
  designWidth?: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(1000)
  designHeight?: number;
}

export class SaveTransformDto {
  @IsNumber()
  designId: number;

  @IsNumber()
  productId: number;

  @IsNumber()
  delimitation_index: number;

  position: DesignTransformDto;
}
```

### 2.2 DTO de Réponse

```typescript
// 📁 src/design-transforms/dto/transform-response.dto.ts
export class TransformResponseDto {
  id: number;
  designId: number;
  productId: number;
  delimitation_index: number;
  position: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
    designWidth: number;
    designHeight: number;
  };
  created_at: Date;
  updated_at: Date;
}
```

---

## 3. 🔧 Service de Gestion des Transformations

### 3.1 Service Principal

```typescript
// 📁 src/design-transforms/design-transforms.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DesignTransform } from './entities/design-transform.entity';
import { DesignTransformDto, SaveTransformDto } from './dto/design-transform.dto';

@Injectable()
export class DesignTransformsService {
  constructor(
    @InjectRepository(DesignTransform)
    private designTransformRepository: Repository<DesignTransform>,
  ) {}

  // 🆕 Créer ou mettre à jour une transformation complète
  async upsertTransform(data: SaveTransformDto): Promise<DesignTransform> {
    const { designId, productId, delimitation_index, position } = data;

    const existingTransform = await this.designTransformRepository.findOne({
      where: { designId, productId, delimitation_index }
    });

    // 🆕 Préparation des données avec valeurs par défaut
    const transformData = {
      x: position.x,
      y: position.y,
      scale: position.scale,
      rotation: position.rotation ?? 0,
      designWidth: position.designWidth ?? 100,
      designHeight: position.designHeight ?? 100,
    };

    if (existingTransform) {
      // Mise à jour avec fusion des propriétés
      existingTransform.position = {
        ...existingTransform.position,
        ...transformData,
      };
      return this.designTransformRepository.save(existingTransform);
    } else {
      // Création nouvelle transformation
      return this.designTransformRepository.save({
        designId,
        productId,
        delimitation_index,
        position: transformData,
      });
    }
  }

  // 🆕 Récupérer toutes les transformations d'un design
  async getDesignTransforms(designId: number): Promise<DesignTransform[]> {
    const transforms = await this.designTransformRepository.find({
      where: { designId },
      order: { delimitation_index: 'ASC' }
    });

    // 🆕 Normalisation des données avec valeurs par défaut
    return transforms.map(transform => ({
      ...transform,
      position: {
        x: transform.position.x,
        y: transform.position.y,
        scale: transform.position.scale,
        rotation: transform.position.rotation ?? 0,
        designWidth: transform.position.designWidth ?? 100,
        designHeight: transform.position.designHeight ?? 100,
      }
    }));
  }

  // 🆕 Récupérer une transformation spécifique
  async getTransform(
    designId: number,
    productId: number,
    delimitation_index: number
  ): Promise<DesignTransform | null> {
    const transform = await this.designTransformRepository.findOne({
      where: { designId, productId, delimitation_index }
    });

    if (!transform) {
      return null;
    }

    // 🆕 Normalisation avec valeurs par défaut
    return {
      ...transform,
      position: {
        x: transform.position.x,
        y: transform.position.y,
        scale: transform.position.scale,
        rotation: transform.position.rotation ?? 0,
        designWidth: transform.position.designWidth ?? 100,
        designHeight: transform.position.designHeight ?? 100,
      }
    };
  }

  // 🆕 Supprimer une transformation
  async deleteTransform(id: number): Promise<void> {
    const result = await this.designTransformRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Transformation avec ID ${id} non trouvée`);
    }
  }

  // 🆕 Supprimer toutes les transformations d'un design
  async deleteDesignTransforms(designId: number): Promise<void> {
    await this.designTransformRepository.delete({ designId });
  }
}
```

---

## 4. 🛠️ Contrôleur API

### 4.1 Contrôleur Principal

```typescript
// 📁 src/design-transforms/design-transforms.controller.ts
import { 
  Controller, 
  Post, 
  Get, 
  Delete, 
  Body, 
  Param, 
  ParseIntPipe,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DesignTransformsService } from './design-transforms.service';
import { SaveTransformDto } from './dto/design-transform.dto';

@ApiTags('Design Transforms')
@Controller('design-transforms')
export class DesignTransformsController {
  constructor(
    private readonly designTransformsService: DesignTransformsService
  ) {}

  // 🆕 Sauvegarder une transformation complète
  @Post('save')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sauvegarder une transformation de design' })
  @ApiResponse({ status: 200, description: 'Transformation sauvegardée avec succès' })
  async saveTransform(@Body() saveTransformDto: SaveTransformDto) {
    return this.designTransformsService.upsertTransform(saveTransformDto);
  }

  // 🆕 Récupérer toutes les transformations d'un design
  @Get('design/:designId')
  @ApiOperation({ summary: 'Récupérer toutes les transformations d\'un design' })
  @ApiParam({ name: 'designId', description: 'ID du design' })
  @ApiResponse({ status: 200, description: 'Transformations récupérées avec succès' })
  async getDesignTransforms(@Param('designId', ParseIntPipe) designId: number) {
    return this.designTransformsService.getDesignTransforms(designId);
  }

  // 🆕 Récupérer une transformation spécifique
  @Get(':designId/:productId/:delimitation_index')
  @ApiOperation({ summary: 'Récupérer une transformation spécifique' })
  @ApiParam({ name: 'designId', description: 'ID du design' })
  @ApiParam({ name: 'productId', description: 'ID du produit' })
  @ApiParam({ name: 'delimitation_index', description: 'Index de délimitation' })
  @ApiResponse({ status: 200, description: 'Transformation récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Transformation non trouvée' })
  async getTransform(
    @Param('designId', ParseIntPipe) designId: number,
    @Param('productId', ParseIntPipe) productId: number,
    @Param('delimitation_index', ParseIntPipe) delimitation_index: number
  ) {
    return this.designTransformsService.getTransform(
      designId,
      productId,
      delimitation_index
    );
  }

  // 🆕 Supprimer une transformation
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une transformation' })
  @ApiParam({ name: 'id', description: 'ID de la transformation' })
  @ApiResponse({ status: 204, description: 'Transformation supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Transformation non trouvée' })
  async deleteTransform(@Param('id', ParseIntPipe) id: number) {
    return this.designTransformsService.deleteTransform(id);
  }

  // 🆕 Supprimer toutes les transformations d'un design
  @Delete('design/:designId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer toutes les transformations d\'un design' })
  @ApiParam({ name: 'designId', description: 'ID du design' })
  @ApiResponse({ status: 204, description: 'Transformations supprimées avec succès' })
  async deleteDesignTransforms(@Param('designId', ParseIntPipe) designId: number) {
    return this.designTransformsService.deleteDesignTransforms(designId);
  }
}
```

---

## 5. 🔗 Intégration Frontend

### 5.1 Hook mis à jour

```typescript
// 📁 src/hooks/useDesignTransforms.ts
import { useCallback } from 'react';

export const useDesignTransforms = (designId: number) => {
  // 🆕 Sauvegarder une transformation complète
  const saveTransform = useCallback(async (
    productId: number,
    delimitation_index: number,
    position: {
      x: number;
      y: number;
      scale: number;
      rotation?: number;
      designWidth?: number;
      designHeight?: number;
    }
  ) => {
    try {
      const response = await fetch('/api/design-transforms/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          designId,
          productId,
          delimitation_index,
          position: {
            x: position.x,
            y: position.y,
            scale: position.scale,
            rotation: position.rotation ?? 0,
            designWidth: position.designWidth ?? 100,
            designHeight: position.designHeight ?? 100,
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur sauvegarde transformation:', error);
      throw error;
    }
  }, [designId]);

  // 🆕 Récupérer les transformations d'un design
  const getDesignTransforms = useCallback(async () => {
    try {
      const response = await fetch(`/api/design-transforms/design/${designId}`);
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération');
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur récupération transformations:', error);
      throw error;
    }
  }, [designId]);

  return { saveTransform, getDesignTransforms };
};
```

### 5.2 Utilisation dans SellDesignPage

```typescript
// Dans SellDesignPage.tsx
const { saveTransform, getDesignTransforms } = useDesignTransforms(designId);

const updateTransform = useCallback((idx: number, updates: Partial<SimpleTransform>) => {
  // Mise à jour locale immédiate
  updateTransformOriginal(idx, {
    x: updates.x ?? 0,
    y: updates.y ?? 0,
    scale: updates.scale ?? 1,
    rotation: updates.rotation ?? 0,
    designWidth: updates.designWidth ?? 100,
    designHeight: updates.designHeight ?? 100,
  });

  // 🆕 Sauvegarde asynchrone en base de données
  saveTransform(currentProductId, idx, {
    x: updates.x ?? 0,
    y: updates.y ?? 0,
    scale: updates.scale ?? 1,
    rotation: updates.rotation ?? 0,
    designWidth: updates.designWidth ?? 100,
    designHeight: updates.designHeight ?? 100,
  }).catch(error => {
    console.error('Erreur sauvegarde:', error);
    // Optionnel: rollback local ou notification utilisateur
  });
}, [updateTransformOriginal, saveTransform, currentProductId]);
```

---

## 6. 🧪 Tests

### 6.1 Tests du Service

```typescript
// 📁 src/design-transforms/design-transforms.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DesignTransformsService } from './design-transforms.service';
import { DesignTransform } from './entities/design-transform.entity';

describe('DesignTransformsService', () => {
  let service: DesignTransformsService;
  let repository: Repository<DesignTransform>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DesignTransformsService,
        {
          provide: getRepositoryToken(DesignTransform),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DesignTransformsService>(DesignTransformsService);
    repository = module.get<Repository<DesignTransform>>(getRepositoryToken(DesignTransform));
  });

  describe('upsertTransform', () => {
    it('should create a new transform with default values', async () => {
      const saveTransformDto = {
        designId: 1,
        productId: 1,
        delimitation_index: 0,
        position: {
          x: 10,
          y: 20,
          scale: 1.5,
          rotation: 45,
          designWidth: 200,
          designHeight: 150,
        },
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'save').mockResolvedValue({
        id: 1,
        ...saveTransformDto,
        created_at: new Date(),
        updated_at: new Date(),
      } as DesignTransform);

      const result = await service.upsertTransform(saveTransformDto);

      expect(result).toBeDefined();
      expect(result.position.rotation).toBe(45);
      expect(result.position.designWidth).toBe(200);
      expect(result.position.designHeight).toBe(150);
    });

    it('should apply default values when properties are missing', async () => {
      const saveTransformDto = {
        designId: 1,
        productId: 1,
        delimitation_index: 0,
        position: {
          x: 10,
          y: 20,
          scale: 1.5,
          // rotation, designWidth, designHeight omis
        },
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'save').mockImplementation(async (entity) => {
        return { id: 1, ...entity, created_at: new Date(), updated_at: new Date() } as DesignTransform;
      });

      const result = await service.upsertTransform(saveTransformDto);

      expect(result.position.rotation).toBe(0);
      expect(result.position.designWidth).toBe(100);
      expect(result.position.designHeight).toBe(100);
    });
  });
});
```

### 6.2 Tests du Contrôleur

```typescript
// 📁 src/design-transforms/design-transforms.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { DesignTransformsController } from './design-transforms.controller';
import { DesignTransformsService } from './design-transforms.service';

describe('DesignTransformsController', () => {
  let controller: DesignTransformsController;
  let service: DesignTransformsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DesignTransformsController],
      providers: [
        {
          provide: DesignTransformsService,
          useValue: {
            upsertTransform: jest.fn(),
            getDesignTransforms: jest.fn(),
            getTransform: jest.fn(),
            deleteTransform: jest.fn(),
            deleteDesignTransforms: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DesignTransformsController>(DesignTransformsController);
    service = module.get<DesignTransformsService>(DesignTransformsService);
  });

  describe('saveTransform', () => {
    it('should save a transform with all properties', async () => {
      const saveTransformDto = {
        designId: 1,
        productId: 1,
        delimitation_index: 0,
        position: {
          x: 10,
          y: 20,
          scale: 1.5,
          rotation: 45,
          designWidth: 200,
          designHeight: 150,
        },
      };

      const mockResult = { id: 1, ...saveTransformDto, created_at: new Date(), updated_at: new Date() };
      jest.spyOn(service, 'upsertTransform').mockResolvedValue(mockResult as any);

      const result = await controller.saveTransform(saveTransformDto);

      expect(service.upsertTransform).toHaveBeenCalledWith(saveTransformDto);
      expect(result).toBe(mockResult);
    });
  });
});
```

---

## 7. 📝 Documentation API

### 7.1 Swagger/OpenAPI

```typescript
// 📁 src/design-transforms/design-transforms.swagger.ts
import { ApiProperty } from '@nestjs/swagger';

export class DesignTransformPositionSchema {
  @ApiProperty({ description: 'Position X en pixels', example: 10 })
  x: number;

  @ApiProperty({ description: 'Position Y en pixels', example: 20 })
  y: number;

  @ApiProperty({ description: 'Échelle du design', example: 1.5, minimum: 0.1, maximum: 5 })
  scale: number;

  @ApiProperty({ description: 'Rotation en degrés', example: 45, minimum: 0, maximum: 360, required: false })
  rotation?: number;

  @ApiProperty({ description: 'Largeur du design en pixels', example: 200, minimum: 10, maximum: 1000, required: false })
  designWidth?: number;

  @ApiProperty({ description: 'Hauteur du design en pixels', example: 150, minimum: 10, maximum: 1000, required: false })
  designHeight?: number;
}

export class SaveTransformSchema {
  @ApiProperty({ description: 'ID du design', example: 1 })
  designId: number;

  @ApiProperty({ description: 'ID du produit', example: 1 })
  productId: number;

  @ApiProperty({ description: 'Index de délimitation', example: 0 })
  delimitation_index: number;

  @ApiProperty({ description: 'Position et transformations', type: DesignTransformPositionSchema })
  position: DesignTransformPositionSchema;
}
```

---

## 8. 🚀 Déploiement

### 8.1 Checklist de Déploiement

- [ ] **Migration DB** : Exécuter la migration pour ajouter les valeurs par défaut
- [ ] **Tests** : Vérifier que tous les tests passent
- [ ] **Documentation** : Mettre à jour la documentation API
- [ ] **Rétrocompatibilité** : Vérifier que les anciennes données fonctionnent
- [ ] **Monitoring** : Surveiller les performances des nouvelles requêtes

### 8.2 Commandes de Déploiement

```bash
# Migration de la base de données
npm run migration:run

# Tests
npm run test
npm run test:e2e

# Build et déploiement
npm run build
npm run start:prod
```

---

## 9. 🔍 Monitoring et Maintenance

### 9.1 Métriques à Surveiller

- **Performance** : Temps de réponse des endpoints de sauvegarde
- **Utilisation** : Fréquence d'utilisation des nouvelles propriétés
- **Erreurs** : Erreurs de validation sur les nouvelles propriétés
- **Stockage** : Taille des données JSON après extension

### 9.2 Maintenance Préventive

```sql
-- Vérifier la cohérence des données
SELECT 
  COUNT(*) as total_transforms,
  COUNT(CASE WHEN JSON_EXTRACT(position, '$.rotation') IS NOT NULL THEN 1 END) as with_rotation,
  COUNT(CASE WHEN JSON_EXTRACT(position, '$.designWidth') IS NOT NULL THEN 1 END) as with_width,
  COUNT(CASE WHEN JSON_EXTRACT(position, '$.designHeight') IS NOT NULL THEN 1 END) as with_height
FROM design_transforms;

-- Nettoyer les données incohérentes
UPDATE design_transforms 
SET position = JSON_SET(
  position,
  '$.rotation', CASE 
    WHEN JSON_EXTRACT(position, '$.rotation') < 0 THEN 0
    WHEN JSON_EXTRACT(position, '$.rotation') > 360 THEN 360
    ELSE JSON_EXTRACT(position, '$.rotation')
  END
)
WHERE JSON_EXTRACT(position, '$.rotation') IS NOT NULL;
```

---

## 🎯 Résumé

Cette implémentation permet de :

1. **Stocker** les nouvelles propriétés `rotation`, `designWidth`, `designHeight` dans la structure existante
2. **Maintenir** la rétrocompatibilité avec les données existantes
3. **Fournir** une API complète pour la gestion des transformations
4. **Assurer** la validation et la cohérence des données
5. **Faciliter** l'intégration frontend avec des hooks spécialisés

Les nouvelles propriétés sont optionnelles et ont des valeurs par défaut appropriées, garantissant une migration en douceur sans interruption de service. 