# Notes de Migration Frontend - Système Autocollant

## Date
24 janvier 2026

## Statut actuel
⚠️ **BACKEND NON ADAPTÉ** - Modifications temporaires en place

---

## 🔴 Problème rencontré

Lors de la création d'un produit avec genre "AUTOCOLLANT", le backend retourne une erreur 500 :

```
POST /products
Status: 500 Internal Server Error
Error: Internal server error
```

### Cause
Le backend ne reconnaît pas encore les nouveaux champs :
- `requiresStock: boolean` dans Product
- `price: number` dans ColorVariation

---

## ✅ Solution temporaire appliquée

### Fichier modifié
`src/components/product-form/ProductFormMain.tsx:1346-1362`

### Code ajouté

```typescript
// ⚠️ TEMPORAIRE: Retirer requiresStock jusqu'à adaptation backend
if (payload.requiresStock !== undefined) {
  console.log('⚠️ [TEMP] Suppression de requiresStock du payload (backend pas encore adapté)');
  delete payload.requiresStock;
}

// ⚠️ TEMPORAIRE: Retirer price des colorVariations jusqu'à adaptation backend
if (payload.colorVariations && Array.isArray(payload.colorVariations)) {
  payload.colorVariations = payload.colorVariations.map((cv: any) => {
    const { price, ...rest } = cv;
    if (price !== undefined) {
      console.log(`⚠️ [TEMP] Suppression du prix ${price} pour variation "${rest.name}"`);
    }
    return rest;
  });
}
```

### Ce qui fonctionne actuellement

1. **Interface utilisateur** ✅
   - Le genre "AUTOCOLLANT" est sélectionnable
   - Le checkbox de gestion de stock est masqué pour AUTOCOLLANT
   - Les champs de prix par variation sont affichés
   - La navigation saute l'étape stock automatiquement

2. **Logique frontend** ✅
   - `requiresStock = false` est défini automatiquement pour AUTOCOLLANT
   - Les prix par variation sont sauvegardés dans le state
   - La validation fonctionne correctement

3. **Communication backend** ✅
   - Les champs problématiques sont retirés avant envoi
   - Le produit peut être créé sans erreur 500
   - Les autres données sont envoyées normalement

### Ce qui ne fonctionne PAS encore

1. **Sauvegarde backend** ❌
   - Le champ `requiresStock` n'est pas sauvegardé en base
   - Les prix par variation ne sont pas sauvegardés
   - Le backend utilise toujours la logique de stock par défaut

2. **Filtrage** ❌
   - Impossible de filtrer les produits par `requiresStock`
   - Les autocollants sont traités comme des produits normaux

---

## 📋 Checklist pour réactiver les fonctionnalités

Une fois le backend adapté selon `BACKEND_ADAPTATION_AUTOCOLLANT.md` :

### 1. Vérifier que le backend est prêt

```bash
# Tester l'endpoint avec curl
curl -X POST http://localhost:3004/products \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Autocollant",
    "price": 500,
    "suggestedPrice": 2000,
    "genre": "AUTOCOLLANT",
    "requiresStock": false,
    "colorVariations": [
      {
        "name": "Noir",
        "colorCode": "#000000",
        "price": 2000
      }
    ]
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "requiresStock": false,
    "colorVariations": [
      {
        "id": 456,
        "price": 2000
      }
    ]
  }
}
```

### 2. Supprimer le code temporaire

**Fichier :** `src/components/product-form/ProductFormMain.tsx`

**Lignes à supprimer :** 1346-1362

```typescript
// ❌ SUPPRIMER CE BLOC
// ⚠️ TEMPORAIRE: Retirer requiresStock jusqu'à adaptation backend
if (payload.requiresStock !== undefined) {
  console.log('⚠️ [TEMP] Suppression de requiresStock du payload (backend pas encore adapté)');
  delete payload.requiresStock;
}

// ⚠️ TEMPORAIRE: Retirer price des colorVariations jusqu'à adaptation backend
if (payload.colorVariations && Array.isArray(payload.colorVariations)) {
  payload.colorVariations = payload.colorVariations.map((cv: any) => {
    const { price, ...rest } = cv;
    if (price !== undefined) {
      console.log(`⚠️ [TEMP] Suppression du prix ${price} pour variation "${rest.name}"`);
    }
    return rest;
  });
}
```

### 3. Tester la création complète

1. Créer un autocollant dans `/admin/add-product`
2. Vérifier que `requiresStock = false` en base
3. Vérifier que les prix par variation sont sauvegardés
4. Tester la navigation (étape stock masquée)
5. Créer un produit classique pour vérifier la régression

### 4. Tester le filtrage

```typescript
// Frontend - Filtrer les autocollants
const autocollants = await fetch('/products?genre=AUTOCOLLANT&requiresStock=false');

// Vérifier que seuls les autocollants sont retournés
```

### 5. Build de production

```bash
npm run build
```

Vérifier qu'il n'y a pas d'erreurs TypeScript.

---

## 🔧 Configuration actuelle

### État du frontend

| Fonctionnalité | Implémentée | Active | Backend requis |
|----------------|-------------|--------|----------------|
| Genre AUTOCOLLANT | ✅ | ✅ | ✅ |
| Checkbox stock masqué | ✅ | ✅ | ❌ |
| `requiresStock` auto | ✅ | ⚠️ Retiré | ❌ |
| Prix par variation | ✅ | ⚠️ Retiré | ❌ |
| Navigation simplifiée | ✅ | ✅ | ❌ |
| Validation frontend | ✅ | ✅ | ❌ |

### Fichiers modifiés

1. **Types**
   - `src/types/product.ts` - Ajout de `requiresStock?: boolean`

2. **Composants**
   - `src/components/product-form/ProductFormFields.tsx` - Checkbox conditionnel
   - `src/components/product-form/ColorVariationsPanel.tsx` - Champ prix
   - `src/components/product-form/ProductFormMain.tsx` - Navigation + payload temporaire

3. **Hooks**
   - `src/hooks/useProductForm.ts` - Logique auto `requiresStock`

4. **Services**
   - `src/services/vendorStickerService.ts` - Déjà adapté pour `/vendor/stickers`

5. **Pages**
   - `src/pages/vendor/VendorStickerPage.tsx` - Utilise le service backend stickers

---

## 📊 Comparaison Workflow

### Workflow actuel (backend non adapté)

```
1. Admin sélectionne AUTOCOLLANT
   ↓
2. requiresStock = false (frontend only)
   ↓
3. Prix par variation renseignés (frontend only)
   ↓
4. Navigation saute l'étape stock ✅
   ↓
5. Submit → Champs temporairement retirés ⚠️
   ↓
6. Backend sauvegarde sans requiresStock/prix ❌
   ↓
7. Produit créé mais incomplet
```

### Workflow attendu (backend adapté)

```
1. Admin sélectionne AUTOCOLLANT
   ↓
2. requiresStock = false automatiquement
   ↓
3. Prix par variation renseignés
   ↓
4. Navigation saute l'étape stock ✅
   ↓
5. Submit avec tous les champs ✅
   ↓
6. Backend valide et sauvegarde ✅
   ↓
7. Produit créé complètement ✅
```

---

## 🎯 Prochaines étapes

### Côté Backend (priorité haute)

1. **Appliquer la migration Prisma**
   ```bash
   npx prisma migrate dev --name add_requires_stock_and_variation_price
   ```

2. **Mettre à jour les DTOs**
   - Ajouter `requiresStock?: boolean` dans `CreateProductDto`
   - Ajouter `price?: number` dans `ColorVariationDto`

3. **Implémenter les validations**
   - AUTOCOLLANT → requiresStock = false obligatoire
   - AUTOCOLLANT → prix par variation obligatoire

4. **Tester l'endpoint**
   - Créer un autocollant via l'API
   - Vérifier la sauvegarde en base

### Côté Frontend (après backend adapté)

1. **Supprimer le code temporaire**
   - Retirer les lignes 1346-1362 dans ProductFormMain.tsx

2. **Tester la création complète**
   - Créer un autocollant
   - Vérifier que tout est sauvegardé

3. **Déployer**
   - Build de production
   - Tests E2E

---

## 📝 Notes importantes

### Pour l'équipe backend

- La documentation complète est dans `BACKEND_ADAPTATION_AUTOCOLLANT.md`
- Tous les exemples de payload sont fournis
- Les tests unitaires recommandés sont inclus
- La migration SQL est prête à l'emploi

### Pour l'équipe frontend

- Le code temporaire est clairement marqué avec `⚠️ TEMPORAIRE`
- Les logs sont activés pour faciliter le debug
- L'interface fonctionne normalement malgré les limitations backend
- Aucun refactoring n'est nécessaire après adaptation backend

### Pour les testeurs

- Les autocollants peuvent être créés mais sans les fonctionnalités avancées
- Tester principalement l'UI et la navigation
- Les tests de bout en bout doivent attendre l'adaptation backend

---

## 🔗 Liens utiles

- **Documentation backend :** `BACKEND_ADAPTATION_AUTOCOLLANT.md`
- **Documentation système stickers :** `CLAUDE.md` (section Stickers)
- **Code modifié :** Voir git blame sur les fichiers listés ci-dessus

---

**Dernière mise à jour :** 24 janvier 2026
**Auteur :** Claude Sonnet 4.5
**Statut :** En attente d'adaptation backend
