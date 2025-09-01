# 🎨 Système de Transformation des Designs - Documentation

> **Implémentation conforme à la documentation officielle**  
> Ce système permet aux vendeurs de positionner leurs designs sur des produits admin et de créer des prototypes avant publication.

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Utilisation](#utilisation)
5. [API Endpoints](#api-endpoints)
6. [Composants](#composants)
7. [Gestion des erreurs](#gestion-des-erreurs)
8. [Exemples](#exemples)
9. [Troubleshooting](#troubleshooting)

---

## 🌟 Vue d'ensemble

Le système de transformation permet de :
- ✅ Récupérer les infos produit admin (`GET /products/:baseProductId`)
- ✅ Ouvrir un éditeur de design interactif avec drag & drop
- ✅ Sauvegarder automatiquement les positions (debounce 500ms)
- ✅ Créer des prototypes via `POST /vendor/products`
- ✅ Lister les prototypes avec `GET /vendor/transformations`
- ✅ Publier les prototypes avec `POST /vendor/transformations/:id/publish`
- ✅ Nettoyer les anciens prototypes
- ✅ Gestion complète des erreurs selon la documentation

---

## 🏗️ Architecture

```
src/
├── components/vendor/
│   ├── VendorDesignTransformationWorkflow.tsx  # Composant principal
│   └── TransformationErrorHandler.tsx          # Gestionnaire d'erreurs
├── hooks/
│   └── useVendorDesignTransformation.ts        # Hook personnalisé
├── services/
│   └── transformationService.ts                # Service API
└── pages/vendor/
    └── VendorDesignTransformationPage.tsx      # Page d'exemple
```

---

## 💻 Installation

### Prérequis
- Node.js 18+
- React 18+
- TypeScript 5+
- Tailwind CSS
- Lucide React

### Dépendances
```bash
npm install sonner lucide-react
```

### Ajout au projet
```bash
# Copier les fichiers dans votre projet
cp src/components/vendor/VendorDesignTransformationWorkflow.tsx ./src/components/vendor/
cp src/hooks/useVendorDesignTransformation.ts ./src/hooks/
cp src/services/transformationService.ts ./src/services/
cp src/pages/vendor/VendorDesignTransformationPage.tsx ./src/pages/vendor/
```

---

## 🚀 Utilisation

### Utilisation basique

```tsx
import VendorDesignTransformationWorkflow from './components/vendor/VendorDesignTransformationWorkflow';

function MyPage() {
  return (
    <VendorDesignTransformationWorkflow
      baseProductId={1}
      designId={10}
      onTransformationCreated={(transformation) => {
        console.log('Prototype créé:', transformation);
      }}
      onProductPublished={(productId) => {
        console.log('Produit publié:', productId);
      }}
    />
  );
}
```

### Avec le hook personnalisé

```tsx
import { useVendorDesignTransformation } from './hooks/useVendorDesignTransformation';

function MyComponent() {
  const {
    adminProduct,
    designs,
    transformations,
    selectedDesign,
    loading,
    error,
    setSelectedDesign,
    createTransformation,
    publishTransformation,
    cleanupOldTransformations
  } = useVendorDesignTransformation({
    baseProductId: 1,
    initialDesignId: 10
  });

  // Utiliser les données et actions...
}
```

---

## 🔌 API Endpoints

### 1. Récupération du produit admin
```typescript
GET /products/:baseProductId
```

### 2. Création d'un prototype
```typescript
POST /vendor/products
Content-Type: application/json

{
  "baseProductId": 1,
  "designId": 10,
  "vendorName": "Produit auto-généré pour positionnement design",
  "vendorDescription": "", // ⬅️ DESCRIPTION VIDE pour éviter l'erreur auto-générée
  "vendorPrice": 25000,
  "vendorStock": 100,
  "selectedColors": [],
  "selectedSizes": [],
  "productStructure": {
    "adminProduct": { /* objet complet */ },
    "designApplication": { "positioning": "CENTER", "scale": 0.6 }
  },
  "designPosition": { "x": -10, "y": 5, "scale": 1, "rotation": 0 },
  "bypassValidation": true
}
```

**Réponse :**
```json
{
  "status": "TRANSFORMATION",
  "transformationId": 14,
  "positionId": "21_10"
}
```

### 3. Liste des prototypes
```typescript
GET /vendor/transformations
```

### 4. Publication d'un prototype
```typescript
POST /vendor/transformations/:id/publish
Content-Type: application/json

{
  "name": "T-shirt Dragon Noir Premium",
  "description": "Dragon vectoriel haute résolution.",
  "price": 40000,
  "stock": 30,
  "selectedColors": [{ "id": 3, "name": "Noir", "colorCode": "#000" }],
  "selectedSizes": [{ "id": 2, "sizeName": "M" }]
}
```

**Réponse :**
```json
{
  "status": "PUBLISHED",
  "productId": 122,
  "message": "Produit publié !"
}
```

### 5. Nettoyage des prototypes
```typescript
DELETE /vendor/transformations/cleanup?olderThanDays=14
```

---

## 🧩 Composants

### VendorDesignTransformationWorkflow

Le composant principal qui orchestre tout le workflow.

**Props :**
```typescript
interface VendorDesignTransformationWorkflowProps {
  baseProductId: number;
  designId?: number;
  onTransformationCreated?: (transformation: Transformation) => void;
  onProductPublished?: (productId: number) => void;
  className?: string;
}
```

**Fonctionnalités :**
- Sélection de design
- Éditeur interactif avec drag & drop
- Contrôles de scale et rotation
- Sauvegarde automatique avec debounce
- Liste des prototypes
- Modal de publication
- Nettoyage des anciens prototypes

### TransformationErrorHandler

Composant pour gérer les erreurs selon la documentation.

**Props :**
```typescript
interface TransformationErrorHandlerProps {
  error: TransformationError | Error | null;
  onRetry?: () => void;
  onRefresh?: () => void;
  onRedirect403?: () => void;
  className?: string;
}
```

**Gestion des erreurs :**
- **400** : Données invalides → Afficher le message sous le champ
- **403** : Permission refusée → Rediriger vers 403 + toast
- **409** : Doublon → Recharger la liste
- **404** : Ressource introuvable → Afficher message d'erreur
- **500** : Erreur serveur → Permettre de réessayer

---

## ⚠️ Gestion des erreurs

### Codes d'erreur supportés

| Code | Signification | Action suggérée |
|------|---------------|-----------------|
| 400  | Mauvais payload | Afficher le message directement sous le champ |
| 403  | Not owner | Rediriger vers 403 + toast |
| 409  | Doublon | Recharger la liste → utiliser l'élément existant |
| 404  | Ressource introuvable | Afficher message d'erreur |
| 500  | Erreur serveur | Permettre de réessayer |

### Utilisation du gestionnaire d'erreurs

```tsx
import { TransformationErrorHandler } from './components/vendor/TransformationErrorHandler';

function MyComponent() {
  const [error, setError] = useState<TransformationError | null>(null);

  return (
    <div>
      <TransformationErrorHandler
        error={error}
        onRetry={() => {
          setError(null);
          // Réessayer l'opération
        }}
        onRefresh={() => {
          // Recharger les données
        }}
        onRedirect403={() => {
          window.location.href = '/403';
        }}
      />
    </div>
  );
}
```

---

## 📝 Exemples

### Exemple 1 : Workflow basique

```tsx
import React from 'react';
import VendorDesignTransformationWorkflow from './components/vendor/VendorDesignTransformationWorkflow';

export default function TransformationPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Système de Transformation</h1>
        
        <VendorDesignTransformationWorkflow
          baseProductId={1}
          onTransformationCreated={(transformation) => {
            console.log('✅ Prototype créé:', transformation);
          }}
          onProductPublished={(productId) => {
            console.log('✅ Produit publié:', productId);
            // Rediriger vers la page du produit
            window.location.href = `/vendor/products/${productId}`;
          }}
        />
      </div>
    </div>
  );
}
```

### Exemple 2 : Intégration avec routeur

```tsx
import { useParams } from 'react-router-dom';
import VendorDesignTransformationWorkflow from './components/vendor/VendorDesignTransformationWorkflow';

export default function ProductTransformationPage() {
  const { baseProductId, designId } = useParams();
  
  return (
    <VendorDesignTransformationWorkflow
      baseProductId={parseInt(baseProductId)}
      designId={designId ? parseInt(designId) : undefined}
      onTransformationCreated={(transformation) => {
        // Logique spécifique à votre app
      }}
      onProductPublished={(productId) => {
        // Redirection ou notification
      }}
    />
  );
}
```

---

## 🔧 Troubleshooting

### Problème : "Erreur 400 - auto-généré"

**Cause :** Le flag `bypassValidation` n'est pas activé.

**Solution :**
```typescript
const payload = {
  // ... autres champs
  bypassValidation: true // ⬅️ Obligatoire pour noms auto-générés
};
```

### Problème : "Erreur 400 - Description auto-générée"

**Cause :** Le backend détecte et rejette les descriptions qui semblent auto-générées.

**Solution :** Utiliser une description vide au lieu d'une description auto-générée :
```typescript
const payload = {
  vendorName: "Produit auto-généré pour positionnement design", // ⬅️ Nom OK
  vendorDescription: "", // ⬅️ DESCRIPTION VIDE pour éviter l'erreur
  // ... autres champs
};
```

### Problème : "Transformation non créée"

**Cause :** Le backend ne retourne pas `status: 'TRANSFORMATION'`.

**Solution :** Vérifier que le backend est configuré pour le système de transformation.

### Problème : "Designs non chargés"

**Cause :** Service de design non accessible.

**Solution :** Vérifier les endpoints et l'authentification :
```typescript
// Vérifier dans la console
console.log('Auth token:', localStorage.getItem('authToken'));
```

### Problème : "Debounce trop fréquent"

**Cause :** Trop d'appels API lors du drag.

**Solution :** Ajuster le délai de debounce :
```typescript
debounceRef.current = setTimeout(async () => {
  // Logique de sauvegarde
}, 1000); // Augmenter à 1000ms si nécessaire
```

---

## 📊 Checklist de vérification

### Frontend
- [ ] Drag = prototype créé (`status: TRANSFORMATION`)
- [ ] Modal « Publier » = produit réel (`status: PUBLISHED`)
- [ ] Aucune erreur 400 « auto-généré » avec `bypassValidation`
- [ ] Debounce fonctionne (500ms)
- [ ] Gestion des erreurs selon la documentation
- [ ] Nettoyage des prototypes obsolètes

### Backend
- [ ] Endpoint `POST /vendor/products` retourne `transformationId`
- [ ] Endpoint `GET /vendor/transformations` liste les prototypes
- [ ] Endpoint `POST /vendor/transformations/:id/publish` publie
- [ ] Endpoint `DELETE /vendor/transformations/cleanup` nettoie
- [ ] Gestion des erreurs 400, 403, 409, 404, 500

---

## 🎯 Roadmap

### Version actuelle (v1.0)
- [x] Workflow complet selon documentation
- [x] Gestion des erreurs
- [x] Composants réutilisables
- [x] Hook personnalisé

### Version future (v1.1)
- [ ] Support multi-designs
- [ ] Historique des transformations
- [ ] Prévisualisation en temps réel
- [ ] Export des configurations

---

## 📚 Ressources

- [Documentation officielle](./ADAPTIVE_POSITIONING_GUIDE.md)
- [Guide API](./API_INTEGRATION_GUIDE.md)
- [Guide backend](./BACKEND_DESIGN_TRANSFORMS_SYSTEM.md)

---

## 💡 Support

Pour toute question ou problème :
1. Vérifier la checklist de vérification
2. Consulter la section Troubleshooting
3. Vérifier les logs dans la console navigateur
4. Vérifier les logs backend

---

*Dernière mise à jour : $(date)* 