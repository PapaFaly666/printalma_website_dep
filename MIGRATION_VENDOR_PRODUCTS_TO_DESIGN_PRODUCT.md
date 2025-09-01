# 🔄 GUIDE DE MIGRATION - VENDOR PRODUCTS → VENDOR DESIGN PRODUCT

## 📋 Vue d'ensemble

Ce guide explique comment migrer de l'ancienne API `/vendor/products` vers la nouvelle API `/vendor/design-product` plus performante et structurée.

## 🚨 Problème identifié

**Erreur actuelle :**
```
POST http://localhost:3004/vendor/products 404 (Not Found)
```

**Cause :** L'ancienne API `/vendor/products` n'est plus disponible. Il faut utiliser la nouvelle API `/vendor/design-product`.

## 🔧 Corrections déjà effectuées

### ✅ 1. Fichier `getOrCreateVendorProduct.ts`
- **Ancien :** `GET /vendor/products` + `POST /vendor/products`
- **Nouveau :** `GET /vendor/design-product` + `POST /vendor/design-product`

### ✅ 2. Fichier `designService.ts`
- **Méthodes corrigées :**
  - `createDesign()` → utilise `vendorDesignProductAPI`
  - `getDesigns()` → utilise `vendorDesignProductAPI`
  - `getDesignValidationStatus()` → utilise `vendorDesignProductAPI`
  - `updateDesign()` → utilise `vendorDesignProductAPI`
  - `togglePublish()` → utilise `vendorDesignProductAPI`
  - `deleteDesign()` → utilise `vendorDesignProductAPI`

## 🔄 Fichiers à migrer

### 📁 Services

#### 1. `src/services/cascadeValidationService.ts`
```typescript
// ANCIEN
`${API_BASE}/vendor/products/${productId}/post-validation-action`
`${API_BASE}/vendor/products/${productId}/publish`
`${API_BASE}/vendor/products`

// NOUVEAU
`${API_BASE}/vendor/design-product/${designProductId}/status`
`${API_BASE}/vendor/design-product/${designProductId}/status`
`${API_BASE}/vendor/design-product`
```

#### 2. `src/services/vendorPublishService.ts`
```typescript
// ANCIEN
const apiUrl = `${API_CONFIG.BASE_URL}/vendor/products`;

// NOUVEAU
const apiUrl = `${API_CONFIG.BASE_URL}/vendor/design-product`;
```

#### 3. `src/services/vendorProductService.ts`
```typescript
// ANCIEN
POST /api/vendor/products
GET /api/vendor/products
GET /api/vendor/products/:id
PUT /api/vendor/products/:id/publish
PUT /api/vendor/products/:id
DELETE /api/vendor/products/:id

// NOUVEAU
POST /vendor/design-product
GET /vendor/design-product
GET /vendor/design-product/:id
PUT /vendor/design-product/:id/status
PUT /vendor/design-product/:id
DELETE /vendor/design-product/:id
```

### 📁 Pages

#### 1. `src/pages/vendor/VendorProductDetailPage.tsx`
```typescript
// ANCIEN
fetch(`${API_BASE_URL}/vendor/products/${productId}`)
fetch(`${API_BASE_URL}/vendor/products/${product.id}`)

// NOUVEAU
fetch(`${API_BASE_URL}/vendor/design-product/${designProductId}`)
fetch(`${API_BASE_URL}/vendor/design-product/${designProduct.id}`)
```

### 📁 Utils

#### 1. `src/utils/positionDebugger.ts`
```typescript
// ANCIEN
const vendorProductsRes = await this.api.get('/vendor/products');
this.api.get('/vendor/products')

// NOUVEAU
const vendorDesignProductsRes = await this.api.get('/vendor/design-product');
this.api.get('/vendor/design-product')
```

#### 2. `src/utils/globalDebugHelpers.ts`
```typescript
// ANCIEN
const productsRes = await apiClient.get('/vendor/products');

// NOUVEAU
const designProductsRes = await apiClient.get('/vendor/design-product');
```

## 📊 Mapping des données

### Structure de données

#### ANCIEN : VendorProduct
```typescript
interface VendorProduct {
  id: number;
  baseProductId: number;
  designId: number;
  productStructure: {
    adminProduct: Product;
    designApplication: {
      designId: number;
      scale: number;
      positioning: string;
    };
  };
  selectedColors: Color[];
  selectedSizes: Size[];
  vendorName: string;
  vendorDescription: string;
  vendorPrice: number;
  vendorStock: number;
}
```

#### NOUVEAU : VendorDesignProduct
```typescript
interface VendorDesignProduct {
  id: number;
  vendorId: number;
  productId: number;
  designUrl: string;
  designPublicId?: string;
  designFileName?: string;
  positionX: number; // 0-1
  positionY: number; // 0-1
  scale: number; // 0.1-2
  rotation: number; // 0-360
  name?: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'PENDING_VALIDATION' | 'VALIDATED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}
```

### Conversion des données

```typescript
// Convertir VendorProduct vers VendorDesignProduct
function convertVendorProductToDesignProduct(vendorProduct: VendorProduct): CreateVendorDesignProductDto {
  return {
    productId: vendorProduct.baseProductId,
    designUrl: vendorProduct.productStructure.designApplication.designUrl || '',
    positionX: 0.5, // Centre par défaut
    positionY: 0.5, // Centre par défaut
    scale: vendorProduct.productStructure.designApplication.scale || 1.0,
    rotation: 0,
    name: vendorProduct.vendorName,
    description: vendorProduct.vendorDescription,
    status: 'DRAFT'
  };
}

// Convertir VendorDesignProduct vers VendorProduct (pour compatibilité)
function convertDesignProductToVendorProduct(designProduct: VendorDesignProduct): VendorProduct {
  return {
    id: designProduct.id,
    baseProductId: designProduct.productId,
    designId: designProduct.id,
    productStructure: {
      adminProduct: {}, // À remplir selon le contexte
      designApplication: {
        designId: designProduct.id,
        scale: designProduct.scale,
        positioning: 'CENTER'
      }
    },
    selectedColors: [],
    selectedSizes: [],
    vendorName: designProduct.name || '',
    vendorDescription: designProduct.description || '',
    vendorPrice: 0,
    vendorStock: 0
  };
}
```

## 🛠️ Service de migration

### Créer un service de migration temporaire

```typescript
// src/services/migrationService.ts
import { vendorDesignProductAPI } from './vendorDesignProductAPI';

export class MigrationService {
  /**
   * Migrer un ancien vendorProduct vers le nouveau système
   */
  async migrateVendorProductToDesignProduct(
    vendorProductId: number
  ): Promise<VendorDesignProductResponse> {
    try {
      // 1. Récupérer l'ancien vendorProduct (si encore disponible)
      const vendorProduct = await this.getOldVendorProduct(vendorProductId);
      
      // 2. Convertir vers le nouveau format
      const designProductData = this.convertVendorProductToDesignProduct(vendorProduct);
      
      // 3. Créer le nouveau design-produit
      const designProduct = await vendorDesignProductAPI.createDesignProduct(designProductData);
      
      console.log(`✅ Migration réussie : VendorProduct ${vendorProductId} → DesignProduct ${designProduct.id}`);
      return designProduct;
    } catch (error) {
      console.error(`❌ Erreur migration VendorProduct ${vendorProductId}:`, error);
      throw error;
    }
  }
  
  /**
   * Migrer tous les vendorProducts d'un utilisateur
   */
  async migrateAllUserVendorProducts(): Promise<VendorDesignProductResponse[]> {
    try {
      // 1. Récupérer tous les anciens vendorProducts
      const vendorProducts = await this.getAllOldVendorProducts();
      
      // 2. Migrer chaque produit
      const migrationPromises = vendorProducts.map(vp => 
        this.migrateVendorProductToDesignProduct(vp.id)
      );
      
      const results = await Promise.allSettled(migrationPromises);
      
      const successful = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<VendorDesignProductResponse>).value);
      
      const failed = results
        .filter(r => r.status === 'rejected')
        .map(r => (r as PromiseRejectedResult).reason);
      
      console.log(`✅ Migration terminée : ${successful.length} réussies, ${failed.length} échouées`);
      return successful;
    } catch (error) {
      console.error('❌ Erreur migration globale:', error);
      throw error;
    }
  }
  
  private async getOldVendorProduct(id: number): Promise<any> {
    // Implémentation pour récupérer l'ancien format
    // Peut utiliser un cache local ou une API de compatibilité
    throw new Error('Méthode à implémenter selon le contexte');
  }
  
  private async getAllOldVendorProducts(): Promise<any[]> {
    // Implémentation pour récupérer tous les anciens vendorProducts
    throw new Error('Méthode à implémenter selon le contexte');
  }
  
  private convertVendorProductToDesignProduct(vendorProduct: any): CreateVendorDesignProductDto {
    return {
      productId: vendorProduct.baseProductId,
      designUrl: vendorProduct.productStructure?.designApplication?.designUrl || '',
      positionX: 0.5,
      positionY: 0.5,
      scale: vendorProduct.productStructure?.designApplication?.scale || 1.0,
      rotation: 0,
      name: vendorProduct.vendorName,
      description: vendorProduct.vendorDescription,
      status: 'DRAFT'
    };
  }
}

export const migrationService = new MigrationService();
```

## 🧪 Tests de migration

### Utiliser le script de test

1. **Ouvrir le fichier de test :**
   ```bash
   open test-new-vendor-design-product-api.html
   ```

2. **Tester les nouveaux endpoints :**
   - `GET /vendor/design-product` - Récupérer tous les designs
   - `POST /vendor/design-product/upload-design` - Upload d'un design
   - `POST /vendor/design-product` - Créer un design-produit
   - `PUT /vendor/design-product/:id/status` - Changer le statut
   - `DELETE /vendor/design-product/:id` - Supprimer

## 📋 Checklist de migration

### Phase 1 : Préparation
- [ ] ✅ Corriger `getOrCreateVendorProduct.ts`
- [ ] ✅ Corriger `designService.ts`
- [ ] ✅ Créer le script de test
- [ ] ✅ Créer le guide de migration

### Phase 2 : Migration des services
- [ ] Migrer `cascadeValidationService.ts`
- [ ] Migrer `vendorPublishService.ts`
- [ ] Migrer `vendorProductService.ts`
- [ ] Migrer `ProductValidationService.ts`
- [ ] Migrer `productService.ts`

### Phase 3 : Migration des pages
- [ ] Migrer `VendorProductDetailPage.tsx`
- [ ] Migrer `VendorProductDetailPage_backup.tsx`
- [ ] Migrer `CascadeValidationDemoPage.tsx`
- [ ] Migrer `VendorProductsWithCascadePage.tsx`

### Phase 4 : Migration des utils
- [ ] Migrer `positionDebugger.ts`
- [ ] Migrer `globalDebugHelpers.ts`
- [ ] Migrer `buildProductStructure.ts`

### Phase 5 : Migration des composants
- [ ] Migrer `ProductDiagnostic.tsx`
- [ ] Migrer `VendorDashboardWithDeduplication.tsx`
- [ ] Migrer `VendorProductCreateForm.tsx`
- [ ] Migrer `VendorProductsList.tsx`
- [ ] Migrer `VendorProductImageDebugger.tsx`

### Phase 6 : Tests et validation
- [ ] Tester tous les endpoints avec le script
- [ ] Vérifier la compatibilité avec l'existant
- [ ] Tester la création de designs-produits
- [ ] Tester les transformations (position, échelle, rotation)
- [ ] Tester les changements de statut
- [ ] Tester la suppression

## 🔧 Commandes utiles

### Rechercher les fichiers à migrer
```bash
# Trouver tous les fichiers utilisant l'ancienne API
grep -r "/vendor/products" src/ --include="*.ts" --include="*.tsx"

# Trouver les imports à mettre à jour
grep -r "vendorProduct" src/ --include="*.ts" --include="*.tsx"
```

### Remplacements automatiques
```bash
# Remplacer les endpoints dans les fichiers
sed -i 's|/vendor/products|/vendor/design-product|g' src/**/*.ts src/**/*.tsx

# Remplacer les noms de variables
sed -i 's/vendorProduct/designProduct/g' src/**/*.ts src/**/*.tsx
```

## 📚 Documentation

### Nouvelle API - Endpoints principaux
- `POST /vendor/design-product/upload-design` - Upload design
- `POST /vendor/design-product` - Créer design-produit  
- `GET /vendor/design-product` - Lister designs-produits
- `GET /vendor/design-product/:id` - Récupérer design-produit
- `PUT /vendor/design-product/:id` - Modifier design-produit
- `PUT /vendor/design-product/:id/status` - Changer statut
- `DELETE /vendor/design-product/:id` - Supprimer design-produit

### Workflow complet
1. **Upload design** → `/vendor/design-product/upload-design`
2. **Créer design-produit** → `/vendor/design-product`
3. **Appliquer transformations** → `/vendor/design-product/:id`
4. **Publier** → `/vendor/design-product/:id/status`

## 🚀 Prochaines étapes

1. **Tester la nouvelle API** avec le script fourni
2. **Migrer les services critiques** en priorité
3. **Migrer les pages** une par une
4. **Tester chaque migration** avant de passer à la suivante
5. **Nettoyer le code** une fois la migration terminée

## 📞 Support

En cas de problème lors de la migration :
1. Vérifier les logs du backend
2. Utiliser le script de test pour diagnostiquer
3. Vérifier la documentation API
4. Tester avec des données simples d'abord

---

Cette migration améliore significativement la structure de l'API et simplifie la gestion des designs de vendeurs. 🎨 