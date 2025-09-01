# 🗃️ RESTRUCTURATION BASE DE DONNÉES : Mockups par couleur

## 📋 **PROBLÈME ACTUEL**

### Structure incorrecte dans `VendorProduct` :
```sql
CREATE TABLE vendor_products (
  id INT PRIMARY KEY,
  vendor_id INT,
  base_product_id INT,
  vendor_name VARCHAR(255),
  price DECIMAL,
  design_url VARCHAR(500),     -- ❌ INCORRECT : Un seul design pour tout le produit
  mockup_url VARCHAR(500),     -- ❌ INCORRECT : Un seul mockup pour tout le produit
  original_design_url VARCHAR(500),
  status ENUM('DRAFT', 'PUBLISHED', 'PENDING'),
  -- ...
);
```

### Problèmes identifiés :
- ❌ `design_url` : Un produit peut avoir UN design appliqué à PLUSIEURS couleurs
- ❌ `mockup_url` : Un produit doit avoir UN mockup PAR couleur (blanc, noir, rouge, etc.)
- ❌ Impossible de représenter les variations de couleur correctement
- ❌ Pas de cohérence avec l'interface `/vendeur/sell-design`

## 🛠️ **NOUVELLE ARCHITECTURE**

### 1. **Table `VendorProduct` (simplifiée)**
```sql
CREATE TABLE vendor_products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vendor_id INT NOT NULL,
  base_product_id INT NOT NULL,
  design_id INT NOT NULL,              -- ✅ Référence vers le design original
  vendor_name VARCHAR(255) NOT NULL,
  vendor_description TEXT,
  price DECIMAL(10,2) NOT NULL,
  vendor_stock INT DEFAULT 0,
  base_price_admin DECIMAL(10,2),
  status ENUM('DRAFT', 'PUBLISHED', 'PENDING') DEFAULT 'DRAFT',
  forced_status ENUM('PENDING', 'DRAFT'),
  is_validated BOOLEAN DEFAULT FALSE,
  design_validation_status ENUM('PENDING', 'VALIDATED', 'REJECTED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- ❌ SUPPRIMER CES CHAMPS
  -- design_url VARCHAR(500),
  -- mockup_url VARCHAR(500), 
  -- original_design_url VARCHAR(500),
  
  FOREIGN KEY (vendor_id) REFERENCES users(id),
  FOREIGN KEY (base_product_id) REFERENCES base_products(id),
  FOREIGN KEY (design_id) REFERENCES designs(id)
);
```

### 2. **Table `VendorProductMockups` (nouvelle)**
```sql
CREATE TABLE vendor_product_mockups (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vendor_product_id INT NOT NULL,
  color_id INT NOT NULL,
  color_name VARCHAR(100) NOT NULL,
  color_code VARCHAR(7) NOT NULL,
  
  -- URLs des images mockup pour cette couleur
  mockup_url VARCHAR(500) NOT NULL,          -- URL Cloudinary du mockup final
  mockup_public_id VARCHAR(255),             -- Public ID Cloudinary
  
  -- Métadonnées du mockup
  width INT,
  height INT,
  format VARCHAR(10),
  file_size INT,
  
  -- Traçabilité
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  generation_status ENUM('GENERATING', 'COMPLETED', 'FAILED') DEFAULT 'GENERATING',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (vendor_product_id) REFERENCES vendor_products(id) ON DELETE CASCADE,
  FOREIGN KEY (color_id) REFERENCES colors(id),
  
  -- Un seul mockup par produit-couleur
  UNIQUE KEY unique_product_color (vendor_product_id, color_id)
);
```

### 3. **Table `VendorProductSelectedColors` (existante, à conserver)**
```sql
CREATE TABLE vendor_product_selected_colors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vendor_product_id INT NOT NULL,
  color_id INT NOT NULL,
  
  FOREIGN KEY (vendor_product_id) REFERENCES vendor_products(id) ON DELETE CASCADE,
  FOREIGN KEY (color_id) REFERENCES colors(id),
  
  UNIQUE KEY unique_selection (vendor_product_id, color_id)
);
```

### 4. **Table `Designs` (référence)**
```sql
CREATE TABLE designs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vendor_id INT NOT NULL,
  design_name VARCHAR(255),
  
  -- URL du design original (fond transparent)
  original_design_url VARCHAR(500) NOT NULL,
  design_public_id VARCHAR(255),
  
  -- Métadonnées du design
  width INT,
  height INT,
  format VARCHAR(10),
  
  -- Validation
  is_validated BOOLEAN DEFAULT FALSE,
  validation_status ENUM('PENDING', 'VALIDATED', 'REJECTED') DEFAULT 'PENDING',
  validated_at TIMESTAMP NULL,
  rejection_reason TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (vendor_id) REFERENCES users(id)
);
```

## 🔄 **SCRIPT DE MIGRATION**

### Migration SQL :
```sql
-- 1. Créer la nouvelle table mockups
CREATE TABLE vendor_product_mockups (
  id INT PRIMARY KEY AUTO_INCREMENT,
  vendor_product_id INT NOT NULL,
  color_id INT NOT NULL,
  color_name VARCHAR(100) NOT NULL,
  color_code VARCHAR(7) NOT NULL,
  mockup_url VARCHAR(500) NOT NULL,
  mockup_public_id VARCHAR(255),
  width INT,
  height INT,
  format VARCHAR(10),
  file_size INT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  generation_status ENUM('GENERATING', 'COMPLETED', 'FAILED') DEFAULT 'COMPLETED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (vendor_product_id) REFERENCES vendor_products(id) ON DELETE CASCADE,
  FOREIGN KEY (color_id) REFERENCES colors(id),
  UNIQUE KEY unique_product_color (vendor_product_id, color_id)
);

-- 2. Ajouter la colonne design_id si elle n'existe pas
ALTER TABLE vendor_products 
ADD COLUMN design_id INT AFTER base_product_id,
ADD FOREIGN KEY (design_id) REFERENCES designs(id);

-- 3. Migrer les données existantes (si possible)
INSERT INTO vendor_product_mockups (
  vendor_product_id, 
  color_id, 
  color_name, 
  color_code, 
  mockup_url,
  mockup_public_id
)
SELECT 
  vp.id as vendor_product_id,
  c.id as color_id,
  c.name as color_name,
  c.color_code,
  vp.mockup_url,
  SUBSTRING_INDEX(vp.mockup_url, '/', -1) as mockup_public_id
FROM vendor_products vp
JOIN vendor_product_selected_colors vpsc ON vp.id = vpsc.vendor_product_id
JOIN colors c ON vpsc.color_id = c.id
WHERE vp.mockup_url IS NOT NULL AND vp.mockup_url != '';

-- 4. Supprimer les anciennes colonnes (APRÈS VÉRIFICATION)
-- ALTER TABLE vendor_products 
-- DROP COLUMN design_url,
-- DROP COLUMN mockup_url,
-- DROP COLUMN original_design_url;
```

## 📊 **NOUVELLE STRUCTURE API**

### Réponse `/api/vendor/products` :
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 258,
        "vendorName": "Polo Personnalisé",
        "price": 10,
        "status": "PUBLISHED",
        "designId": 123,                    // ✅ Référence vers le design
        "baseProduct": {
          "id": 12,
          "name": "Polos",
          "type": "Polos"
        },
        "design": {                         // ✅ Informations du design
          "id": 123,
          "originalDesignUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1751322540/designs/design_123.png",
          "isValidated": true,
          "validationStatus": "VALIDATED"
        },
        "selectedColors": [
          { "id": 34, "name": "Blanc", "colorCode": "#ffffff" },
          { "id": 35, "name": "Noir", "colorCode": "#000000" }
        ],
        "mockups": [                        // ✅ Mockups par couleur
          {
            "colorId": 34,
            "colorName": "Blanc",
            "colorCode": "#ffffff",
            "mockupUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1751322546/mockups/polo_blanc_design123.jpg",
            "mockupPublicId": "mockups/polo_blanc_design123",
            "width": 800,
            "height": 800,
            "generationStatus": "COMPLETED"
          },
          {
            "colorId": 35,
            "colorName": "Noir", 
            "colorCode": "#000000",
            "mockupUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1751322547/mockups/polo_noir_design123.jpg",
            "mockupPublicId": "mockups/polo_noir_design123",
            "width": 800,
            "height": 800,
            "generationStatus": "COMPLETED"
          }
        ],
        "primaryMockupUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1751322546/mockups/polo_blanc_design123.jpg"  // ✅ Premier mockup pour affichage principal
      }
    ]
  }
}
```

## 🎯 **AVANTAGES DE CETTE STRUCTURE**

### ✅ **Cohérence avec l'interface utilisateur** :
- Comme dans `/vendeur/sell-design` : un design + plusieurs couleurs = plusieurs mockups
- Chaque carte de produit affiche ses propres mockups par couleur
- Pas de mélange d'images entre produits

### ✅ **Flexibilité** :
- Ajout/suppression de couleurs facile
- Regénération de mockups spécifiques
- Traçabilité des générations de mockups

### ✅ **Performance** :
- Requêtes optimisées par produit-couleur
- Pas de données dupliquées
- Cache possible par mockup

### ✅ **Évolutivité** :
- Support de différents types de mockups (front, back, etc.) 
- Métadonnées étendues par mockup
- Gestion des erreurs de génération

## 🚀 **PROCHAINES ÉTAPES**

1. **Valider le nouveau modèle** avec l'équipe
2. **Créer les scripts de migration** complets
3. **Modifier les contrôleurs backend** pour la nouvelle structure
4. **Adapter le frontend** pour utiliser les nouveaux endpoints
5. **Tester la migration** sur un environnement de dev
6. **Déployer progressivement** en production 