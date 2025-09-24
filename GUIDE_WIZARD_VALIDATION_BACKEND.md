# Guide d'intégration Backend - Validation des produits WIZARD

## Vue d'ensemble

Ce guide détaille les modifications backend nécessaires pour supporter la validation des produits WIZARD dans le système d'administration. Les produits WIZARD sont des produits créés sans design (designId = null) qui utilisent des images personnalisées fournies par le vendeur.

## Différence entre produits WIZARD et traditionnels

### Produits Traditionnels (avec design)
- Ont un `designId` non-null
- Le **design** doit être validé par l'admin
- Une fois le design validé, TOUS les produits utilisant ce design peuvent être publiés
- Validation = Design validation

### Produits WIZARD (sans design)
- Ont un `designId` null/undefined/0
- Le **produit lui-même** doit être validé par l'admin
- Chaque produit WIZARD doit être validé individuellement
- Validation = Product validation

## Détection côté frontend

```typescript
const isWizardProduct = !product.designId || product.designId === null || product.designId === 0;
```

## Endpoints à modifier/créer

### 1. GET /api/admin/products/validation

**Objectif**: Récupérer les produits en attente de validation avec support WIZARD

**Modifications nécessaires**:
```json
{
  "data": [
    {
      "id": 123,
      "vendorName": "Mon Super Produit",
      "vendorPrice": 15000,
      "status": "PENDING",
      "designId": null, // ← null pour WIZARD
      "isWizardProduct": true, // ← nouveau champ calculé
      "productType": "WIZARD", // ← nouveau champ
      "adminProductName": "T-Shirt Blanc", // ← nom du produit de base
      "vendorImages": [ // ← nouveau tableau d'images
        {
          "id": 1,
          "imageType": "base", // 'base' | 'detail' | 'admin_reference'
          "cloudinaryUrl": "https://res.cloudinary.com/...",
          "colorName": "Blanc",
          "colorCode": "#FFFFFF"
        },
        {
          "id": 2,
          "imageType": "detail",
          "cloudinaryUrl": "https://res.cloudinary.com/...",
          "colorName": "Rouge",
          "colorCode": "#FF0000"
        }
      ],
      "baseProduct": {
        "id": 456,
        "name": "T-Shirt Unisex"
      },
      "vendor": {
        "id": 789,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "shop_name": "John's Shop"
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 2. POST /api/admin/products/{productId}/validate

**Objectif**: Valider ou rejeter un produit WIZARD

**Body**:
```json
{
  "approved": true, // ou false
  "rejectionReason": "Images de mauvaise qualité" // optionnel si approved=false
}
```

**Réponse**:
```json
{
  "success": true,
  "message": "Produit validé avec succès",
  "productId": 123,
  "newStatus": "PUBLISHED", // ou "REJECTED"
  "validatedAt": "2024-01-15T14:30:00Z"
}
```

**Logique côté backend**:
```sql
-- Si approved = true
UPDATE vendor_products
SET status = 'PUBLISHED',
    validated_at = NOW(),
    validated_by = :admin_id,
    rejection_reason = NULL
WHERE id = :product_id;

-- Si approved = false
UPDATE vendor_products
SET status = 'REJECTED',
    rejected_at = NOW(),
    validated_by = :admin_id,
    rejection_reason = :rejection_reason
WHERE id = :product_id;
```

### 3. GET /api/vendor/products

**Modifications nécessaires**: Inclure le statut de validation pour les produits WIZARD

```json
{
  "data": [
    {
      "id": 123,
      "vendorName": "Mon Produit",
      "status": "PENDING", // ← Important pour le blocage publication
      "designId": null, // ← null = WIZARD
      "isWizardProduct": true, // ← calculé côté backend
      "validatedAt": null, // ← null si pas encore validé
      "rejectionReason": null, // ← null si pas rejeté
      "designApplication": {
        "hasDesign": false // ← false pour WIZARD
      }
    }
  ]
}
```

## Modifications de la base de données

### Table vendor_products
Ajouter les colonnes suivantes (si pas déjà présentes):

```sql
ALTER TABLE vendor_products ADD COLUMN validated_at TIMESTAMP NULL;
ALTER TABLE vendor_products ADD COLUMN validated_by INTEGER NULL;
ALTER TABLE vendor_products ADD COLUMN rejection_reason TEXT NULL;
ALTER TABLE vendor_products ADD COLUMN rejected_at TIMESTAMP NULL;

-- Index pour performance
CREATE INDEX idx_vendor_products_validation
ON vendor_products(status, validated_at, validated_by);

-- Contrainte foreign key pour validated_by
ALTER TABLE vendor_products
ADD CONSTRAINT fk_vendor_products_validator
FOREIGN KEY (validated_by) REFERENCES users(id);
```

### Table vendor_product_images
S'assurer que cette table existe avec les colonnes nécessaires:

```sql
CREATE TABLE IF NOT EXISTS vendor_product_images (
    id SERIAL PRIMARY KEY,
    vendor_product_id INTEGER NOT NULL,
    image_type VARCHAR(20) NOT NULL, -- 'base', 'detail', 'admin_reference'
    cloudinary_url TEXT NOT NULL,
    color_name VARCHAR(100),
    color_code VARCHAR(7), -- Code hex couleur
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (vendor_product_id) REFERENCES vendor_products(id) ON DELETE CASCADE
);

CREATE INDEX idx_vendor_product_images_product
ON vendor_product_images(vendor_product_id, image_type, display_order);
```

## Règles de validation côté backend

### Détection produit WIZARD
```python
def is_wizard_product(product):
    return product.design_id is None or product.design_id == 0

def get_product_type(product):
    return "WIZARD" if is_wizard_product(product) else "TRADITIONAL"
```

### Logique de publication
```python
def can_publish_product(product, user_role):
    if user_role == "admin":
        return True  # Admin peut tout publier

    if is_wizard_product(product):
        # WIZARD: doit être validé par admin
        return product.status == "PUBLISHED"
    else:
        # TRADITIONAL: design doit être validé
        return product.design and product.design.is_validated
```

## Notifications et logs

### Notifications à envoyer
1. **Vendeur**: Quand son produit WIZARD est validé/rejeté
2. **Admin**: Quand un nouveau produit WIZARD est soumis

### Logs à enregistrer
```json
{
  "action": "WIZARD_PRODUCT_VALIDATED",
  "product_id": 123,
  "validator_id": 456,
  "decision": "APPROVED", // ou "REJECTED"
  "rejection_reason": null,
  "timestamp": "2024-01-15T14:30:00Z"
}
```

## Tests à implémenter

### Tests unitaires
1. Détection correcte des produits WIZARD
2. Validation d'un produit WIZARD (approved/rejected)
3. Blocage publication vendeur si produit non validé
4. Récupération des images WIZARD dans l'endpoint admin

### Tests d'intégration
1. Workflow complet : Création → Soumission → Validation → Publication
2. Notifications envoyées correctement
3. Permissions admin/vendeur respectées

## Migration des données existantes

Si des produits WIZARD existent déjà en base:

```sql
-- Identifier les produits WIZARD existants
UPDATE vendor_products
SET status = 'PENDING'
WHERE design_id IS NULL
  AND status = 'PUBLISHED'
  AND validated_at IS NULL;

-- Log de la migration
INSERT INTO migration_logs (table_name, action, affected_rows, timestamp)
VALUES ('vendor_products', 'WIZARD_VALIDATION_MIGRATION', ROW_COUNT(), NOW());
```

## Points d'attention

1. **Performance**: Ajouter des index sur les colonnes de validation
2. **Sécurité**: Vérifier que seuls les admins peuvent valider
3. **Images**: S'assurer que les URLs Cloudinary sont sécurisées
4. **Rollback**: Prévoir une procédure de rollback si problème
5. **Monitoring**: Ajouter des métriques sur les validations WIZARD

## Interface admin attendue

L'admin doit pouvoir :
1. ✅ Voir la liste des produits WIZARD en attente
2. ✅ Distinguer visuellement WIZARD vs TRADITIONAL
3. ✅ Voir l'image principale du produit WIZARD
4. ✅ Cliquer pour voir toutes les images en détail
5. ✅ Valider ou rejeter avec raison
6. ✅ Voir l'historique des validations

## État actuel côté frontend

✅ **Déjà implémenté** :
- Détection produits WIZARD dans AdminProductValidation.tsx
- Affichage différencié avec badge "🎨 WIZARD"
- Modal de détails avec galerie d'images
- Blocage publication côté vendeur
- Messages appropriés selon le type de produit

⏳ **En attente côté backend** :
- Endpoints de validation WIZARD
- Champs de validation en base de données
- Logique de publication avec validation WIZARD
- Images WIZARD dans l'API admin
