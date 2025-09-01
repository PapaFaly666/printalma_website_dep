# 🎨 Guide Backend – Implémentation des Endpoints Design Transforms

> **Date :** 2025-01-02  
> **Statut :** Les endpoints retournent actuellement 403 Forbidden  
> **Objectif :** Implémenter la sauvegarde/restauration des transformations de design

---

## 📋 Résumé Exécutif

Les endpoints `vendor/design-transforms` sont nécessaires pour sauvegarder les ajustements (position, échelle) des designs appliqués par les vendeurs sur leurs produits. Le frontend envoie actuellement des requêtes qui retournent **403 Forbidden**, indiquant un problème d'autorisation ou d'implémentation.

---

## 🎯 Endpoints à Implémenter

### 1. **POST** `/vendor/design-transforms`
**Sauvegarde les transformations d'un design**

```typescript
// Request Body
{
  productId: number;          // ID du produit vendeur
  designUrl: string;          // URL Cloudinary du design
  transforms: {               // Transformations par délimitation
    "0": { x: -14, y: -1, scale: 0.6 },
    "1": { x: 10, y: 5, scale: 0.8 }
  };
  lastModified: number;       // Timestamp epoch (ms)
}

// Response 200
{
  success: true,
  message: "Transformations sauvegardées",
  data: {
    id: 42,
    lastModified: "2025-01-02T14:32:11.987Z"
  }
}
```

### 2. **GET** `/vendor/design-transforms/:productId?designUrl=...`
**Récupère les transformations sauvegardées**

```typescript
// Response 200 (si trouvé)
{
  success: true,
  data: {
    productId: 11,
    designUrl: "https://res.cloudinary.com/dsxab4qnu/...",
    transforms: {
      "0": { x: -14, y: -1, scale: 0.6 }
    },
    lastModified: 1751460297854
  }
}

// Response 404 (si pas trouvé)
{
  success: false,
  message: "Aucune transformation trouvée",
  data: null
}
```

---

## 🗃️ Modèle de Base de Données

### Table `vendor_design_transforms`

```sql
CREATE TABLE vendor_design_transforms (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER NOT NULL,              -- ID du vendeur (pour sécurité)
  product_id INTEGER NOT NULL,             -- ID du produit vendeur
  design_url VARCHAR(500) NOT NULL,        -- URL du design Cloudinary
  transforms JSONB NOT NULL,               -- Transformations par délimitation
  last_modified BIGINT NOT NULL,           -- Timestamp epoch (ms)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Index pour performance
  UNIQUE(product_id, design_url),
  INDEX idx_vendor_product (vendor_id, product_id),
  INDEX idx_design_url (design_url)
);
```

**Structure `transforms` JSON :**
```json
{
  "0": { "x": -14.5, "y": -1.2, "scale": 0.6 },
  "1": { "x": 10.0, "y": 5.5, "scale": 0.8 }
}
```

---

## 🔧 Implémentation NestJS

### 1. DTO (Data Transfer Objects)

```typescript
// save-design-transforms.dto.ts
import { IsNumber, IsString, IsObject, IsPositive } from 'class-validator';

export class SaveDesignTransformsDto {
  @IsNumber()
  @IsPositive()
  productId: number;

  @IsString()
  designUrl: string;

  @IsObject()
  transforms: Record<string, {
    x: number;
    y: number;
    scale: number;
  }>;

  @IsNumber()
  @IsPositive()
  lastModified: number;
}

// get-design-transforms.dto.ts
export class GetDesignTransformsDto {
  @IsString()
  designUrl: string;
}
```

### 2. Entity (TypeORM)

```typescript
// vendor-design-transform.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('vendor_design_transforms')
@Index(['productId', 'designUrl'], { unique: true })
export class VendorDesignTransform {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'vendor_id' })
  vendorId: number;

  @Column({ name: 'product_id' })
  productId: number;

  @Column({ name: 'design_url', length: 500 })
  designUrl: string;

  @Column({ type: 'jsonb' })
  transforms: Record<string, { x: number; y: number; scale: number }>;

  @Column({ name: 'last_modified', type: 'bigint' })
  lastModified: number;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
```

### 3. Service

```typescript
// vendor-design-transform.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VendorDesignTransform } from './entities/vendor-design-transform.entity';
import { SaveDesignTransformsDto } from './dto/save-design-transforms.dto';

@Injectable()
export class VendorDesignTransformService {
  constructor(
    @InjectRepository(VendorDesignTransform)
    private readonly transformRepo: Repository<VendorDesignTransform>,
  ) {}

  async saveTransforms(
    vendorId: number,
    dto: SaveDesignTransformsDto
  ): Promise<{ id: number; lastModified: Date }> {
    // Vérifier que le produit appartient au vendeur
    await this.validateProductOwnership(vendorId, dto.productId);

    const existing = await this.transformRepo.findOne({
      where: { productId: dto.productId, designUrl: dto.designUrl }
    });

    if (existing) {
      // Mise à jour
      existing.transforms = dto.transforms;
      existing.lastModified = dto.lastModified;
      existing.updatedAt = new Date();
      
      const saved = await this.transformRepo.save(existing);
      return { id: saved.id, lastModified: saved.updatedAt };
    } else {
      // Création
      const newTransform = this.transformRepo.create({
        vendorId,
        productId: dto.productId,
        designUrl: dto.designUrl,
        transforms: dto.transforms,
        lastModified: dto.lastModified,
      });

      const saved = await this.transformRepo.save(newTransform);
      return { id: saved.id, lastModified: saved.createdAt };
    }
  }

  async getTransforms(
    vendorId: number,
    productId: number,
    designUrl: string
  ): Promise<VendorDesignTransform | null> {
    // Vérifier que le produit appartient au vendeur
    await this.validateProductOwnership(vendorId, productId);

    return this.transformRepo.findOne({
      where: { productId, designUrl, vendorId }
    });
  }

  private async validateProductOwnership(vendorId: number, productId: number): Promise<void> {
    // TODO: Adapter selon votre modèle de données
    // Exemple avec repository des produits vendeur
    const product = await this.productRepo.findOne({
      where: { id: productId, vendorId }
    });

    if (!product) {
      throw new ForbiddenException('Accès refusé à ce produit');
    }
  }
}
```

### 4. Controller

```typescript
// vendor-design-transform.controller.ts
import { Controller, Post, Get, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { VendorDesignTransformService } from './vendor-design-transform.service';
import { SaveDesignTransformsDto, GetDesignTransformsDto } from './dto';
import { VendorAuthGuard } from '../auth/guards/vendor-auth.guard';
import { GetVendor } from '../auth/decorators/get-vendor.decorator';

@Controller('vendor/design-transforms')
@UseGuards(VendorAuthGuard) // 🔒 Authentification vendeur requise
export class VendorDesignTransformController {
  constructor(
    private readonly designTransformService: VendorDesignTransformService,
  ) {}

  @Post()
  async saveTransforms(
    @GetVendor('id') vendorId: number,
    @Body() dto: SaveDesignTransformsDto,
  ) {
    const result = await this.designTransformService.saveTransforms(vendorId, dto);
    
    return {
      success: true,
      message: 'Transformations sauvegardées',
      data: result,
    };
  }

  @Get(':productId')
  async getTransforms(
    @GetVendor('id') vendorId: number,
    @Param('productId', ParseIntPipe) productId: number,
    @Query() query: GetDesignTransformsDto,
  ) {
    const transforms = await this.designTransformService.getTransforms(
      vendorId,
      productId,
      query.designUrl,
    );

    if (!transforms) {
      return {
        success: false,
        message: 'Aucune transformation trouvée',
        data: null,
      };
    }

    return {
      success: true,
      data: {
        productId: transforms.productId,
        designUrl: transforms.designUrl,
        transforms: transforms.transforms,
        lastModified: transforms.lastModified,
      },
    };
  }
}
```

---

## 🔒 Sécurité & Validation

### 1. Authentification Vendeur
```typescript
// Exemple de guard d'authentification
@Injectable()
export class VendorAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Depuis votre middleware auth
    
    return user && user.role === 'VENDOR';
  }
}
```

### 2. Validation des Données
- **productId** : Doit appartenir au vendeur authentifié
- **designUrl** : Validation format URL Cloudinary
- **transforms** : Validation structure JSON
- **lastModified** : Timestamp valide

### 3. Rate Limiting
```typescript
// Limitez les sauvegardes à 60/minute par vendeur
@Throttle(60, 60) // 60 requêtes par 60 secondes
```

---

## 🧪 Tests

### 1. Test d'Intégration
```bash
# Test POST
curl -X POST http://localhost:3004/vendor/design-transforms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <vendor-token>" \
  -d '{
    "productId": 11,
    "designUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1751043356/designs/9/1751043355475-solo-leveling-logo-01.png",
    "transforms": {"0": {"x": -14, "y": -1, "scale": 0.6}},
    "lastModified": 1751460297854
  }'

# Test GET
curl -X GET "http://localhost:3004/vendor/design-transforms/11?designUrl=https%3A%2F%2Fres.cloudinary.com%2Fdsxab4qnu%2Fimage%2Fupload%2Fv1751043356%2Fdesigns%2F9%2F1751043355475-solo-leveling-logo-01.png" \
  -H "Authorization: Bearer <vendor-token>"
```

### 2. Cases de Test
- ✅ Sauvegarde réussie avec données valides
- ✅ Récupération après sauvegarde
- ❌ Tentative d'accès à un produit d'un autre vendeur
- ❌ Données malformées
- ❌ Accès sans authentification

---

## 🚀 Migration & Déploiement

### 1. Migration SQL
```sql
-- Créer la table
CREATE TABLE vendor_design_transforms (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  design_url VARCHAR(500) NOT NULL,
  transforms JSONB NOT NULL,
  last_modified BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performance
CREATE UNIQUE INDEX idx_product_design ON vendor_design_transforms(product_id, design_url);
CREATE INDEX idx_vendor_product ON vendor_design_transforms(vendor_id, product_id);
```

### 2. Module Registration
```typescript
// app.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([VendorDesignTransform]),
    // ... autres modules
  ],
  controllers: [VendorDesignTransformController],
  providers: [VendorDesignTransformService],
})
export class AppModule {}
```

---

## 🔍 Debugging

### Vérifications Courantes
1. **403 Forbidden** → Vérifier l'authentification vendeur
2. **404 Not Found** → Vérifier les routes dans le module
3. **500 Server Error** → Vérifier la connexion DB et les validations

### Logs Utiles
```typescript
// Dans le service
console.log('🎨 Saving transforms for vendor:', vendorId, 'product:', dto.productId);
console.log('📊 Transforms data:', JSON.stringify(dto.transforms, null, 2));
```

---

## ✅ Checklist d'Implémentation

- [ ] Entity `VendorDesignTransform` créée
- [ ] DTOs `SaveDesignTransformsDto` et `GetDesignTransformsDto` créés
- [ ] Service `VendorDesignTransformService` implémenté
- [ ] Controller `VendorDesignTransformController` créé
- [ ] Guard d'authentification vendeur configuré
- [ ] Migration SQL exécutée
- [ ] Module enregistré dans `AppModule`
- [ ] Tests d'intégration validés
- [ ] CORS configuré pour origin `http://localhost:5174`

Une fois implémenté, le frontend détectera automatiquement la disponibilité des endpoints et passera du mode localStorage au mode backend ! 🎯 