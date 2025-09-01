# 🔍 Guide Debug Produits Vendeur - Structure Mockups

> **Objectif** : Analyser la structure actuelle des produits vendeur pour implémenter le système de mockups par couleur selon le prompt backend fourni.

## 📋 Vue d'ensemble

Ce guide vous explique comment utiliser les outils de debug créés pour :
1. **Récupérer** toutes les données des produits vendeur existants
2. **Analyser** leur structure de mockups actuelle
3. **Exporter** les données pour référence backend
4. **Comprendre** l'organisation souhaitée selon votre prompt

---

## 🛠️ Outils de debug disponibles

### 1. **Composant React Debug** - `VendorProductsDebugger`
- **Localisation** : `src/components/debug/VendorProductsDebugger.tsx`
- **Usage** : Composant React intégrable dans l'interface vendeur
- **Fonctionnalités** :
  - Récupération automatique des produits via l'API v2
  - Affichage structuré par couleur et mockup
  - Export JSON des données
  - Logs détaillés dans la console

### 2. **Page Debug** - `VendorProductsDebugPage`
- **Localisation** : `src/pages/vendor/VendorProductsDebugPage.tsx`
- **Usage** : Page dédiée au debug (ajouter dans les routes)

### 3. **Test HTML Standalone** - `test-vendor-products-debug.html`
- **Localisation** : Racine du projet
- **Usage** : Outil indépendant, ouvrir directement dans le navigateur
- **Avantages** :
  - Fonctionne sans compilation React
  - Appels API directs
  - Interface simple et rapide

---

## 🚀 Comment utiliser les outils

### Option A : Test HTML (Recommandé pour debug rapide)

1. **Ouvrir le fichier** `test-vendor-products-debug.html` dans votre navigateur

2. **Modifier l'URL de l'API** si nécessaire :
   ```javascript
   const API_BASE = 'http://localhost:3004'; // Adaptez selon votre backend
   ```

3. **Cliquer sur "🔄 Récupérer les données"**
   - Les données s'afficheront dans la console ET sur la page
   - Structure complète visible avec URL des mockups

4. **Utiliser "📥 Télécharger JSON"** pour sauvegarder les données

### Option B : Composant React

1. **Intégrer dans une route vendeur** :
   ```typescript
   // Dans votre router
   import { VendorProductsDebugPage } from './pages/vendor/VendorProductsDebugPage';
   
   // Route temporaire
   <Route path="/vendeur/debug" element={<VendorProductsDebugPage />} />
   ```

2. **Accéder à** `/vendeur/debug`

### Option C : Console Developer Tools

Si vous voulez juste les logs, ajoutez temporairement dans n'importe quelle page vendeur :
```javascript
// Dans la console du navigateur
fetch('/api/vendor/products?limit=50&offset=0', {
  credentials: 'include'
}).then(r => r.json()).then(data => {
  console.log('🔍 PRODUITS DEBUG:', data);
});
```

---

## 📊 Structure des données analysées

### Données collectées pour chaque produit :

```typescript
interface DebugVendorProduct {
  // Infos de base
  id: number;
  vendorName: string;
  price: number;
  status: string;
  
  // Design
  designId?: number;
  design?: {
    id: number;
    imageUrl: string;    // 🎯 URL du design original
    isValidated: boolean;
  };
  
  // Couleurs sélectionnées
  selectedColors: Array<{
    id: number;
    name: string;
    colorCode: string;   // 🎯 Code hex de la couleur
  }>;
  
  // Mockups par couleur (structure actuelle)
  colorVariations?: Array<{
    id: number;
    name: string;
    colorCode: string;
    images: Array<{
      id: number;
      url: string;       // 🎯 URL du mockup par couleur
      generationStatus: string; // COMPLETED/GENERATING/FAILED
    }>;
  }>;
  
  // Statistiques mockups
  mockups?: {
    completed: number;   // 🎯 Nombre de mockups terminés
    generating: number;  // 🎯 Nombre en cours de génération
    failed: number;      // 🎯 Nombre d'échecs
    expected: number;    // 🎯 Nombre total attendu
  };
  
  // Mockup principal
  primaryMockupUrl?: string; // 🎯 Premier mockup disponible
  
  // Produit de base
  baseProduct?: {
    id: number;
    name: string;
    type: string;
  };
}
```

---

## 🎯 Mapping vers la structure backend souhaitée

Le debug génère automatiquement la structure backend selon votre prompt :

### Structure actuelle → Structure backend

```javascript
// Pour chaque produit
{
  productInfo: {
    id: 123,
    vendorName: "T-shirt Dragon",
    price: 2500,
    status: "PUBLISHED"
  },
  
  // Design principal
  design: {
    id: 88,
    imageUrl: "https://cloudinary.../design_88.png",
    isValidated: true
  },
  
  // Mockups organisés par couleur
  mockupsStructure: {
    primaryUrl: "https://cloudinary.../primary_123.jpg",
    statistics: { completed: 3, generating: 0, failed: 0, expected: 3 },
    
    // 🎯 Chaque couleur avec ses mockups
    byColor: [
      {
        colorId: 12,
        colorName: "Rouge",
        colorCode: "#ff0000",
        mockups: [
          {
            mockupId: 555,
            url: "https://cloudinary.../mockup_123_rouge.jpg",
            status: "COMPLETED",
            
            // 🎯 Structure pour votre table product_mockups
            backendStructure: {
              productId: 123,
              mockupKey: "vendor-products/123/mockups/1751290284671_rouge.jpg",
              url: "https://cloudinary.../mockup_123_rouge.jpg",
              type: "color",
              colorId: 12
            }
          }
        ]
      }
    ]
  }
}
```

---

## 🗂️ Organisation des fichiers selon votre prompt

Le debug génère automatiquement les `mockupKey` selon votre structure souhaitée :

```bash
vendor-products/
  └─ {productId}/              # Ex: 123/
      └─ mockups/
          ├─ {timestamp}_rouge.jpg      # Mockup couleur Rouge
          ├─ {timestamp}_noir.jpg       # Mockup couleur Noir
          ├─ {timestamp}_blanc.jpg      # Mockup couleur Blanc
          └─ {timestamp}_preview.jpg    # Mockup principal
```

### Exemple de clés générées :
```
vendor-products/123/mockups/1751290284671_rouge.jpg
vendor-products/123/mockups/1751290286343_noir.jpg
vendor-products/123/mockups/1751290288901_blanc.jpg
```

---

## 📥 Export et utilisation des données

### Fichier JSON exporté contient :

1. **`rawResponse`** : Réponse API brute complète
2. **`structuredProducts`** : Données organisées pour le backend
3. **`timestamp`** : Horodatage de l'export
4. **`productsCount`** : Nombre total de produits

### Utilisation pour l'implémentation backend :

```sql
-- Table product_mockups selon votre prompt
CREATE TABLE product_mockups (
  id             SERIAL PRIMARY KEY,
  product_id     INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  mockup_key     VARCHAR(255) NOT NULL UNIQUE,  -- Utilisez backendStructure.mockupKey
  url            TEXT NOT NULL,                 -- Utilisez backendStructure.url
  type           ENUM('color','design','preview') DEFAULT 'color',
  color_id       INT,                          -- Utilisez backendStructure.colorId
  created_at     TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 Checklist d'utilisation

### Avant de commencer :
- [ ] Backend en cours d'exécution
- [ ] Produits vendeur créés via `/vendeur/sell-design`
- [ ] API accessible depuis le frontend

### Étapes de debug :
1. [ ] Ouvrir `test-vendor-products-debug.html`
2. [ ] Vérifier l'URL de l'API (`http://localhost:3004`)
3. [ ] Cliquer "🔄 Récupérer les données"
4. [ ] Vérifier les logs dans la console (F12)
5. [ ] Analyser l'affichage des produits sur la page
6. [ ] Télécharger le JSON avec "📥 Télécharger JSON"
7. [ ] Utiliser les données `backendStructure` pour l'implémentation

### Données à analyser :
- [ ] URLs des designs originaux
- [ ] URLs des mockups par couleur
- [ ] Statuts de génération (COMPLETED/GENERATING/FAILED)
- [ ] Codes couleurs et noms
- [ ] Structure des clés de fichiers

---

## 🔧 Personnalisation

### Modifier l'URL de l'API :
```javascript
// Dans test-vendor-products-debug.html, ligne ~120
const API_BASE = 'https://votre-api.com'; // Changez ici
```

### Ajouter plus de données :
```javascript
// Dans fetchDebugData(), ajouter après console.log
console.log('🔗 Informations supplémentaires:', {
  customField: product.customField,
  otherData: product.otherData
});
```

### Modifier la structure exportée :
```javascript
// Dans downloadData(), modifier structuredProducts
backendStructure: {
  productId: product.id,
  mockupKey: `custom-path/${product.id}/${Date.now()}.jpg`, // Personnalisez ici
  url: img.url,
  type: 'color',
  // Ajoutez vos champs
}
```

---

## 🎉 Résultat attendu

Après utilisation des outils de debug, vous aurez :

1. **Vue complète** de la structure actuelle des produits vendeur
2. **URLs de tous les mockups** organisés par couleur  
3. **Données JSON structurées** prêtes pour l'implémentation backend
4. **Mapping précis** vers votre table `product_mockups`
5. **Clés de fichiers** respectant votre arborescence souhaitée

Ces données vous serviront de **référence exacte** pour implémenter le système backend selon votre prompt, garantissant une correspondance parfaite entre frontend et backend ! 🚀 
 
 
 
 
 
 
 
 
 
 
 
 