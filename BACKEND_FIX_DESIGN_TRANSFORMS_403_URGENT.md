# 🚨 BACKEND FIX URGENT - Erreur 403 Design Transforms

## 📋 PROBLÈME IDENTIFIÉ

L'endpoint `/vendor/design-transforms` génère une erreur 403 "Accès refusé à ce produit" car il y a **confusion entre Admin Product ID et Vendor Product ID**.

### Erreur actuelle :
```
❌ API Error: 403 
{message: 'Accès refusé à ce produit', error: 'Forbidden', statusCode: 403}
```

### Cause racine :
- Le frontend envoie `productId: 15` (Admin Product ID)
- Le backend cherche un Vendor Product avec ID 15
- Le vendor n'a pas accès au produit admin 15 ou il n'existe pas comme vendor product

## 🔧 SOLUTION BACKEND URGENT

### 1. Modifier l'endpoint GET `/vendor/design-transforms/:productId`

**AVANT (problématique) :**
```typescript
@Get(':productId')
async getDesignTransforms(
  @Param('productId') productId: number,
  @Query('designUrl') designUrl: string,
  @Request() req
) {
  // ❌ Cherche un VendorProduct avec productId = 15 (admin ID)
  const vendorProduct = await this.vendorProductService.findOne(productId, req.user.id);
  if (!vendorProduct) {
    throw new ForbiddenException('Accès refusé à ce produit');
  }
}
```

**APRÈS (corrigé) :**
```typescript
@Get(':productId')
async getDesignTransforms(
  @Param('productId') productId: number,
  @Query('designUrl') designUrl: string,
  @Request() req
) {
  const vendorId = req.user.id;
  
  // ✅ STRATÉGIE DOUBLE : Chercher par vendor product ID OU admin product ID
  let vendorProduct = null;
  
  // 1. D'abord essayer en tant que vendor product ID
  try {
    vendorProduct = await this.vendorProductService.findOne(productId, vendorId);
  } catch (error) {
    // Continue vers la stratégie 2
  }
  
  // 2. Si pas trouvé, chercher par admin product ID  
  if (!vendorProduct) {
    vendorProduct = await this.vendorProductService.findByAdminProductId(productId, vendorId);
  }
  
  // 3. Si toujours pas trouvé, autoriser la création pour admin products
  if (!vendorProduct) {
    // Vérifier que l'admin product existe
    const adminProduct = await this.productService.findOne(productId);
    if (!adminProduct) {
      throw new NotFoundException('Produit admin non trouvé');
    }
    
    // Permettre la sauvegarde pour les admin products (phase de conception)
    console.log(`📝 Autorisation design transforms pour admin product ${productId} par vendor ${vendorId}`);
  }
  
  // Charger les transforms existantes
  const transforms = await this.designTransformsService.findByProductAndDesign(
    productId, // Peut être admin ou vendor product ID
    designUrl,
    vendorId
  );
  
  return {
    success: true,
    data: transforms || { transforms: {}, lastModified: 0 }
  };
}
```

### 2. Modifier l'endpoint POST `/vendor/design-transforms`

```typescript
@Post()
async saveDesignTransforms(
  @Body() payload: SaveDesignTransformsDto,
  @Request() req
) {
  const vendorId = req.user.id;
  
  // ✅ STRATÉGIE FLEXIBLE : Accepter admin product ID pendant la conception
  let targetProductId = payload.productId;
  let productType = 'unknown';
  
  // 1. Vérifier si c'est un vendor product
  const vendorProduct = await this.vendorProductService.findOne(payload.productId, vendorId);
  if (vendorProduct) {
    productType = 'vendor_product';
    targetProductId = vendorProduct.id;
  } else {
    // 2. Vérifier si c'est un admin product valide
    const adminProduct = await this.productService.findOne(payload.productId);
    if (adminProduct) {
      productType = 'admin_product';
      targetProductId = payload.productId; // Garder l'admin ID pour la phase conception
    } else {
      throw new NotFoundException('Produit non trouvé');
    }
  }
  
  console.log(`💾 Sauvegarde transforms - Type: ${productType}, ID: ${targetProductId}, Vendor: ${vendorId}`);
  
  // 3. Sauvegarder avec le contexte approprié
  const savedTransforms = await this.designTransformsService.saveTransforms({
    productId: targetProductId,
    productType,
    vendorId,
    designUrl: payload.designUrl,
    transforms: payload.transforms,
    lastModified: payload.lastModified || Date.now()
  });
  
  return {
    success: true,
    message: 'Transformations sauvegardées',
    data: savedTransforms
  };
}
```

### 3. Créer le service DesignTransformsService

```typescript
// design-transforms.service.ts
@Injectable()
export class DesignTransformsService {
  constructor(
    @InjectRepository(DesignTransform)
    private transformsRepository: Repository<DesignTransform>
  ) {}

  async saveTransforms(data: {
    productId: number;
    productType: 'vendor_product' | 'admin_product';
    vendorId: number;
    designUrl: string;
    transforms: Record<number, any>;
    lastModified: number;
  }) {
    // Rechercher l'entrée existante
    let existingTransform = await this.transformsRepository.findOne({
      where: {
        productId: data.productId,
        productType: data.productType,
        vendorId: data.vendorId,
        designUrl: data.designUrl
      }
    });

    if (existingTransform) {
      // Mettre à jour
      existingTransform.transforms = data.transforms;
      existingTransform.lastModified = new Date(data.lastModified);
      existingTransform.updatedAt = new Date();
      
      await this.transformsRepository.save(existingTransform);
      return existingTransform;
    } else {
      // Créer nouveau
      const newTransform = this.transformsRepository.create({
        productId: data.productId,
        productType: data.productType,
        vendorId: data.vendorId,
        designUrl: data.designUrl,
        transforms: data.transforms,
        lastModified: new Date(data.lastModified),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await this.transformsRepository.save(newTransform);
      return newTransform;
    }
  }

  async findByProductAndDesign(
    productId: number, 
    designUrl: string, 
    vendorId: number
  ) {
    // Chercher en priorité comme vendor product
    let transform = await this.transformsRepository.findOne({
      where: {
        productId,
        productType: 'vendor_product',
        vendorId,
        designUrl
      }
    });

    // Fallback admin product
    if (!transform) {
      transform = await this.transformsRepository.findOne({
        where: {
          productId,
          productType: 'admin_product',
          vendorId,
          designUrl
        }
      });
    }

    return transform ? {
      transforms: transform.transforms,
      lastModified: transform.lastModified.getTime()
    } : null;
  }
}
```

### 4. Créer l'entité DesignTransform

```typescript
// entities/design-transform.entity.ts
@Entity('design_transforms')
export class DesignTransform {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productId: number;

  @Column({
    type: 'enum',
    enum: ['vendor_product', 'admin_product'],
    default: 'admin_product'
  })
  productType: 'vendor_product' | 'admin_product';

  @Column()
  vendorId: number;

  @Column()
  designUrl: string;

  @Column('json')
  transforms: Record<number, any>;

  @Column()
  lastModified: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Index composé pour performance
  @Index(['productId', 'productType', 'vendorId', 'designUrl'])
  compositeIndex: string;
}
```

### 5. Ajouter la migration

```sql
-- migration: create_design_transforms_table
CREATE TABLE design_transforms (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  product_type VARCHAR(20) NOT NULL DEFAULT 'admin_product',
  vendor_id INTEGER NOT NULL,
  design_url TEXT NOT NULL,
  transforms JSONB NOT NULL,
  last_modified TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT design_transforms_product_type_check 
    CHECK (product_type IN ('vendor_product', 'admin_product'))
);

-- Index pour performance
CREATE INDEX idx_design_transforms_composite 
ON design_transforms (product_id, product_type, vendor_id, design_url);

-- Index pour les requêtes par vendor
CREATE INDEX idx_design_transforms_vendor 
ON design_transforms (vendor_id);
```

## 🧪 TEST DE VALIDATION

### 1. Test avec admin product ID :
```bash
curl -X GET "http://localhost:3004/vendor/design-transforms/15?designUrl=https://..." \
  -H "Authorization: Bearer YOUR_TOKEN"
  
# Doit retourner 200 (pas 403)
```

### 2. Test sauvegarde :
```bash
curl -X POST "http://localhost:3004/vendor/design-transforms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "productId": 15,
    "designUrl": "https://...",
    "transforms": {"0": {"x": 100, "y": 50, "scale": 1.2}},
    "lastModified": 1751475574952
  }'
  
# Doit retourner 200 avec success: true
```

## ⚡ DÉPLOIEMENT URGENT

1. **Appliquer la migration**
2. **Déployer le service DesignTransformsService** 
3. **Mettre à jour les endpoints**
4. **Tester avec curl/Postman**

Cette solution permet de gérer la **transition smooth** entre admin products (phase conception) et vendor products (phase publication) sans casser l'expérience utilisateur. 