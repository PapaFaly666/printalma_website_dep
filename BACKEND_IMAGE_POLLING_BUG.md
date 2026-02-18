# 🐛 Bug Backend : Polling de Génération d'Images Bloqué à 0%

**Date:** 29 janvier 2026
**Priorité:** 🟡 **IMPORTANTE**
**Statut:** À corriger côté backend

---

## 📋 Résumé du Problème

Après la création de produits vendeur, le modal de génération d'images affiche une **boucle infinie à 0%** :

```
📊 [Multi-Polling] Progression globale: 0% (2/0 images)
📊 [Multi-Polling] Progression globale: 0% (2/0 images)
📊 [Multi-Polling] Progression globale: 0% (2/0 images)
... (à l'infini)
```

**Symptôme :** Le calcul montre `0% (2/0 images)` ce qui signifie :
- `totalGenerated: 2` (2 images générées ✅)
- `totalExpected: 0` (0 images attendues ❌ **BUG**)
- `percentage: 0` (car 2/0 = impossible)

Le pourcentage reste à **0%** alors que des images sont générées, et **n'atteint jamais 100%** pour fermer le modal.

---

## 🔍 Endpoint Concerné

**Endpoint :** `GET /vendor/products/:id/images-status`

**Fichier backend probable :** `src/vendor-product/vendor-publish.controller.ts` (ligne 1191)

**Frontend qui appelle :** `src/hooks/useMultiProductImagePolling.ts` (ligne 93)

---

## 📊 Réponse Attendue vs Réponse Actuelle

### ✅ Réponse Attendue (Correcte)

```json
{
  "success": true,
  "productId": 123,
  "product": {
    "id": 123,
    "status": "PUBLISHED",
    "designId": 42
  },
  "imagesGeneration": {
    "totalExpected": 5,      // ✅ Nombre total d'images à générer
    "totalGenerated": 2,     // ✅ Nombre d'images déjà générées
    "percentage": 40,        // ✅ 2/5 = 40%
    "allGenerated": false    // ✅ Pas encore terminé
  },
  "finalImages": [
    {
      "id": 1,
      "colorId": 12,
      "colorName": "Rouge",
      "finalImageUrl": "https://res.cloudinary.com/.../final_123_12.png",
      "imageType": "final"
    },
    {
      "id": 2,
      "colorId": 13,
      "colorName": "Bleu",
      "finalImageUrl": "https://res.cloudinary.com/.../final_123_13.png",
      "imageType": "final"
    }
  ]
}
```

### ❌ Réponse Actuelle (Incorrecte - Suspectée)

```json
{
  "success": true,
  "productId": 123,
  "product": {
    "id": 123,
    "status": "PUBLISHED",
    "designId": 42
  },
  "imagesGeneration": {
    "totalExpected": 0,      // ❌ BUG : devrait être 5
    "totalGenerated": 2,     // ✅ OK
    "percentage": 0,         // ❌ BUG : 2/0 = NaN/0
    "allGenerated": false    // ❌ Ne sera jamais true
  },
  "finalImages": [...]
}
```

---

## 🔧 Ce Que le Backend Doit Vérifier

### 1. Calcul de `totalExpected`

**Problème probable :** Le backend ne compte pas correctement le nombre d'images à générer.

**Où chercher :** Dans le controller ou service qui gère `GET /vendor/products/:id/images-status`

**Code attendu :**

```typescript
async getImagesStatus(productId: number) {
  const product = await this.prisma.vendorProduct.findUnique({
    where: { id: productId },
    include: {
      selectedColors: true,  // ✅ Inclure les couleurs sélectionnées
      finalImages: true      // ✅ Inclure les images générées
    }
  });

  // ✅ Calculer le nombre total d'images attendues
  const totalExpected = product.selectedColors.length; // Nombre de couleurs

  // ✅ Calculer le nombre d'images déjà générées
  const totalGenerated = product.finalImages.filter(
    img => img.finalImageUrl !== null
  ).length;

  // ✅ Calculer le pourcentage
  const percentage = totalExpected > 0
    ? Math.round((totalGenerated / totalExpected) * 100)
    : 0;

  // ✅ Vérifier si tout est généré
  const allGenerated = totalGenerated >= totalExpected && totalExpected > 0;

  return {
    success: true,
    productId: product.id,
    product: {
      id: product.id,
      status: product.status,
      designId: product.designId
    },
    imagesGeneration: {
      totalExpected,      // ✅ Doit être > 0
      totalGenerated,     // ✅ OK
      percentage,         // ✅ Calcul correct
      allGenerated        // ✅ Devient true quand terminé
    },
    finalImages: product.finalImages.map(img => ({
      id: img.id,
      colorId: img.colorId,
      colorName: img.colorName,
      finalImageUrl: img.finalImageUrl,
      imageType: img.imageType
    }))
  };
}
```

### 2. Erreurs Possibles

#### Erreur 1 : `totalExpected` codé en dur à 0

```typescript
// ❌ INCORRECT
const imagesGeneration = {
  totalExpected: 0,  // ❌ Toujours 0
  totalGenerated: finalImages.length,
  percentage: 0,
  allGenerated: false
};
```

#### Erreur 2 : Mauvaise relation Prisma

```typescript
// ❌ INCORRECT : selectedColors non inclus
const product = await this.prisma.vendorProduct.findUnique({
  where: { id: productId },
  // ❌ selectedColors manquant !
  include: {
    finalImages: true
  }
});

// Du coup, product.selectedColors est undefined
const totalExpected = product.selectedColors?.length || 0; // ❌ = 0
```

#### Erreur 3 : Mauvais champ utilisé

```typescript
// ❌ INCORRECT : utilise un champ qui n'existe pas
const totalExpected = product.expectedImagesCount; // ❌ undefined
```

---

## 🧪 Tests à Effectuer

### 1. Test Backend Direct avec curl

```bash
# Remplacer 123 par un vrai productId
curl -X GET https://printalma-back-dep.onrender.com/api/vendor/products/123/images-status \
  -H "Cookie: jwt_token=YOUR_JWT_TOKEN"
```

**Vérifier dans la réponse :**
- ✅ `imagesGeneration.totalExpected` est > 0
- ✅ `imagesGeneration.totalGenerated` <= `totalExpected`
- ✅ `imagesGeneration.percentage` = (totalGenerated / totalExpected) * 100
- ✅ `imagesGeneration.allGenerated` = true quand totalGenerated == totalExpected

### 2. Logs Backend à Ajouter

```typescript
async getImagesStatus(productId: number) {
  const product = await this.prisma.vendorProduct.findUnique({
    where: { id: productId },
    include: {
      selectedColors: true,
      finalImages: true
    }
  });

  console.log('🔍 [ImagesStatus] Produit chargé:', {
    productId: product.id,
    selectedColorsCount: product.selectedColors?.length || 0,
    finalImagesCount: product.finalImages?.length || 0
  });

  const totalExpected = product.selectedColors?.length || 0;
  const totalGenerated = product.finalImages.filter(
    img => img.finalImageUrl !== null
  ).length;

  console.log('📊 [ImagesStatus] Calcul:', {
    totalExpected,
    totalGenerated,
    percentage: totalExpected > 0
      ? Math.round((totalGenerated / totalExpected) * 100)
      : 0
  });

  // ... retourner la réponse
}
```

### 3. Vérification Base de Données

```sql
-- Vérifier qu'un produit a bien des couleurs sélectionnées
SELECT
  vp.id AS productId,
  vp.vendorName,
  COUNT(DISTINCT sc.id) AS totalColorsSelected,
  COUNT(DISTINCT fi.id) AS totalImagesGenerated
FROM "VendorProduct" vp
LEFT JOIN "SelectedColor" sc ON sc.vendorProductId = vp.id
LEFT JOIN "FinalImage" fi ON fi.vendorProductId = vp.id AND fi.finalImageUrl IS NOT NULL
WHERE vp.id = 123  -- Remplacer par le vrai ID
GROUP BY vp.id, vp.vendorName;
```

**Résultat attendu :**
```
productId | vendorName        | totalColorsSelected | totalImagesGenerated
----------|-------------------|---------------------|---------------------
123       | Mon Super Produit | 5                   | 2
```

---

## 🔄 Flow de Génération d'Images

### Architecture Actuelle (Supposée)

```
1. Création du produit vendeur
   └─> POST /vendor/products
       └─> Créer VendorProduct en BDD
           └─> Associer les couleurs sélectionnées (SelectedColors)
               └─> Job de génération d'images (async)
                   └─> Pour chaque couleur:
                       └─> Générer l'image finale
                           └─> Sauvegarder FinalImage en BDD

2. Polling du statut
   └─> GET /vendor/products/:id/images-status (toutes les 2.5s)
       └─> Compter selectedColors (totalExpected)
       └─> Compter finalImages avec URL (totalGenerated)
       └─> Calculer percentage
       └─> Retourner au frontend

3. Frontend affiche la progression
   └─> Modal avec barre de progression
   └─> Se ferme quand allGenerated = true
```

### Où le Bug Peut Survenir

```
✅ Étape 1 : Création du produit → OK
✅ Étape 2 : Association des couleurs → OK (probablement)
❌ Étape 3 : Calcul de totalExpected → ❌ BUG ICI
   │
   ├─ Soit : selectedColors non inclus dans la requête Prisma
   ├─ Soit : Mauvaise relation dans le schéma Prisma
   ├─ Soit : Champ utilisé n'existe pas
   └─ Soit : Valeur codée en dur à 0

✅ Étape 4 : Génération des images → OK (2 images générées)
✅ Étape 5 : Frontend polling → OK
```

---

## 📋 Schéma Prisma à Vérifier

```prisma
model VendorProduct {
  id          Int     @id @default(autoincrement())
  vendorName  String
  designId    Int
  status      String  @default("PENDING")

  // ✅ Relation avec les couleurs sélectionnées
  selectedColors SelectedColor[] // ⚠️ Vérifier que cette relation existe

  // ✅ Relation avec les images finales générées
  finalImages    FinalImage[]    // ⚠️ Vérifier que cette relation existe

  // ... autres champs
}

model SelectedColor {
  id               Int     @id @default(autoincrement())
  vendorProductId  Int
  colorId          Int
  colorName        String
  colorCode        String
  isActive         Boolean @default(true)

  vendorProduct    VendorProduct @relation(fields: [vendorProductId], references: [id], onDelete: Cascade)
}

model FinalImage {
  id               Int     @id @default(autoincrement())
  vendorProductId  Int
  colorId          Int
  colorName        String
  finalImageUrl    String? // ⚠️ Peut être NULL pendant la génération
  imageType        String  @default("final")

  vendorProduct    VendorProduct @relation(fields: [vendorProductId], references: [id], onDelete: Cascade)
}
```

**Si les relations n'existent pas**, les ajouter et migrer :

```bash
npx prisma migrate dev --name add_images_relations
npx prisma generate
```

---

## ✅ Solution Complète

### Code Corrigé (Backend)

```typescript
// src/vendor-product/vendor-publish.controller.ts ou service

@Get(':id/images-status')
async getImagesGenerationStatus(@Param('id') productId: string) {
  const id = parseInt(productId);

  // ✅ Charger le produit AVEC ses relations
  const product = await this.prisma.vendorProduct.findUnique({
    where: { id },
    include: {
      selectedColors: {
        where: { isActive: true } // ✅ Seulement les couleurs actives
      },
      finalImages: {
        where: {
          imageType: 'final' // ✅ Seulement les images finales
        }
      }
    }
  });

  if (!product) {
    throw new NotFoundException(`Produit ${id} non trouvé`);
  }

  // ✅ Calcul correct de totalExpected
  const totalExpected = product.selectedColors.length;

  // ✅ Calcul correct de totalGenerated (images avec URL non null)
  const totalGenerated = product.finalImages.filter(
    img => img.finalImageUrl !== null && img.finalImageUrl !== ''
  ).length;

  // ✅ Calcul du pourcentage
  const percentage = totalExpected > 0
    ? Math.round((totalGenerated / totalExpected) * 100)
    : 0;

  // ✅ Vérifier si terminé
  const allGenerated = totalGenerated >= totalExpected && totalExpected > 0;

  // 🔍 Logs de debug
  console.log('📊 [ImagesStatus]', {
    productId: id,
    totalExpected,
    totalGenerated,
    percentage,
    allGenerated
  });

  // ✅ Retourner la réponse formatée
  return {
    success: true,
    productId: product.id,
    product: {
      id: product.id,
      status: product.status,
      designId: product.designId
    },
    imagesGeneration: {
      totalExpected,
      totalGenerated,
      percentage,
      allGenerated
    },
    finalImages: product.finalImages
      .filter(img => img.finalImageUrl) // ✅ Seulement les images générées
      .map(img => ({
        id: img.id,
        colorId: img.colorId,
        colorName: img.colorName,
        finalImageUrl: img.finalImageUrl,
        imageType: img.imageType
      }))
  };
}
```

---

## 🎯 Résultat Attendu Après Correction

### Logs Frontend (Console)

```javascript
// Progression normale
📊 [Multi-Polling] Progression globale: 20% (1/5 images)
📊 [Multi-Polling] Progression globale: 40% (2/5 images)
📊 [Multi-Polling] Progression globale: 60% (3/5 images)
📊 [Multi-Polling] Progression globale: 80% (4/5 images)
📊 [Multi-Polling] Progression globale: 100% (5/5 images)
✅ [Multi-Polling] Toutes les images de tous les produits générées!
🛑 [Multi-Polling] Arrêt du polling
```

### Comportement Modal

1. **Ouverture :** Modal s'affiche après création des produits
2. **Progression :** Barre de progression monte de 0% à 100%
3. **Complétion :** Message "Génération terminée !"
4. **Fermeture automatique :** Modal se ferme après 2 secondes
5. **Redirection :** Navigate vers `/vendeur/products`

---

## 📊 Impact

**Sévérité :** 🟡 **IMPORTANTE** (mais pas bloquante)

**Conséquences :**
- ⚠️ Modal reste ouvert indéfiniment
- ⚠️ Utilisateur doit fermer manuellement
- ⚠️ Mauvaise expérience utilisateur
- ✅ Les images sont générées (pas de perte de données)
- ✅ Les produits sont créés correctement

**Workaround temporaire :** L'utilisateur peut fermer le modal manuellement en cliquant sur le X.

---

## ✅ Checklist de Résolution

- [ ] **Identifier le controller/service** qui gère `GET /vendor/products/:id/images-status`
- [ ] **Vérifier le schéma Prisma** pour les relations `selectedColors` et `finalImages`
- [ ] **Ajouter les logs de debug** pour voir les valeurs calculées
- [ ] **Corriger le calcul de `totalExpected`** pour utiliser `selectedColors.length`
- [ ] **Tester avec curl/Postman** pour vérifier la réponse
- [ ] **Vérifier en BDD** que les relations existent
- [ ] **Tester depuis le frontend** pour confirmer que le modal fonctionne
- [ ] **Supprimer les logs de debug** une fois corrigé

---

## 🔗 Références

- Frontend hook : `src/hooks/useMultiProductImagePolling.ts`
- Frontend modal : `src/components/vendor/MultiProductImagesModal.tsx`
- Documentation : `FRONTEND_IMAGE_GENERATION_POLLING.md`
- Guide backend stickers : `BACKEND_AUTOCOLLANT_GUIDE.md`

---

**Fin du document**

Ce bug doit être corrigé pour améliorer l'expérience utilisateur lors de la création de produits vendeur.
