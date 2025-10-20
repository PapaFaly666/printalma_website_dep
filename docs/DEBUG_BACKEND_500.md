# 🐛 Debug Erreur 500 Backend - Création Produit

## ✅ Payload Frontend Correct

Le payload envoyé par le frontend est **100% correct** :

```json
{
  "categoryId": 40,
  "subCategoryId": 45,
  "variationId": 71,
  "variations": [{
    "variationId": 71,
    "value": "fefe",
    "colorCode": "#ffffff"
  }]
}
```

---

## 🔍 Causes Possibles Erreur 500

### 1. Relations Catégories Invalides

**Vérifier:**
```sql
-- Vérifier que la catégorie existe
SELECT * FROM categories WHERE id = 40;

-- Vérifier que la sous-catégorie existe ET appartient à la catégorie
SELECT * FROM sub_categories WHERE id = 45 AND categoryId = 40;

-- Vérifier que la variation existe ET appartient à la sous-catégorie
SELECT * FROM variations WHERE id = 71 AND subCategoryId = 45;
```

**Si une de ces requêtes retourne 0 résultat → Erreur 500**

---

### 2. Contraintes de Base de Données

Le backend peut rejeter si:
- `sub_categories.categoryId != 40`
- `variations.subCategoryId != 45`

**Solution:** S'assurer que les relations sont correctes en BD.

---

### 3. Validation DTO Backend

Le backend NestJS peut avoir des validations comme:

```typescript
@IsInt()
categoryId: number;

@IsInt()
subCategoryId: number;

@IsInt()
variationId: number;
```

**Problème détecté:** Le frontend envoie `categoryId` en **string** au lieu de **number** !

```json
"categoryId": "40"  // ❌ String au lieu de number
```

---

## ✅ Solution Immédiate

### Corriger productService.ts ligne 380

**❌ AVANT:**
```typescript
categoryId: parseInt(productData.categoryId),
```

Le `parseInt()` retourne un number, mais quelque part il est reconverti en string.

**Cherchons où:**

Dans **ProductFormMain.tsx ligne 1787**, on force en string :

```typescript
categoryId: finalFormData.categoryId.toString(),  // ❌ PROBLÈME ICI
```

**✅ CORRECTION NÉCESSAIRE:**

```typescript
// ProductFormMain.tsx ligne 1787
categoryId: parseInt(finalFormData.categoryId.toString()),  // ✅ Number
```

---

## 🔧 Autre Problème Possible: Images

Le backend peut avoir un problème avec:
- Format de fichier non supporté
- Taille de fichier trop grande
- Champ `fileId` invalide

**Dans le payload, on voit:**
```json
"images": [{
  "fileId": "1760919238470",  // ⚠️ ID temporaire, pas un vrai fileId
  "view": "Front",
  "delimitations": [...]
}]
```

Le backend s'attend probablement à ce que `fileId` soit un ID valide d'une image déjà uploadée, pas un timestamp.

---

## 🎯 Plan d'Action

### Étape 1 : Corriger categoryId (String → Number)

```typescript
// ProductFormMain.tsx ligne 1787
// AVANT
categoryId: finalFormData.categoryId.toString(),

// APRÈS
categoryId: parseInt(finalFormData.categoryId.toString()),
```

### Étape 2 : Vérifier les Relations BD

Exécuter ces requêtes SQL:

```sql
-- 1. Catégorie existe?
SELECT * FROM categories WHERE id = 40;

-- 2. Sous-catégorie existe et appartient à catégorie 40?
SELECT * FROM sub_categories WHERE id = 45 AND categoryId = 40;

-- 3. Variation existe et appartient à sous-catégorie 45?
SELECT * FROM variations WHERE id = 71 AND subCategoryId = 45;
```

### Étape 3 : Simplifier le Payload de Test

Créer un produit **SANS images** pour isoler le problème:

```typescript
// Test sans images
const testPayload = {
  name: "Test Simple",
  categoryId: 40,
  subCategoryId: 45,
  variations: [{
    variationId: 71,
    value: "Test",
    colorCode: "#ffffff",
    price: 100,
    stock: 10
  }],
  sizes: ["M"],
  genre: "UNISEXE"
};
```

### Étape 4 : Vérifier les Logs Backend

Si vous avez accès aux logs backend (Render):
1. Aller sur le dashboard Render
2. Cliquer sur le service backend
3. Onglet "Logs"
4. Chercher l'erreur exacte

**Logs typiques à chercher:**
- `Foreign key constraint failed`
- `Validation failed`
- `Category not found`
- `SubCategory not found`

---

## 📋 Checklist Debug

- [ ] Corriger categoryId (string → number)
- [ ] Vérifier que categoryId=40 existe en BD
- [ ] Vérifier que subCategoryId=45 existe ET categoryId=40
- [ ] Vérifier que variationId=71 existe ET subCategoryId=45
- [ ] Tester sans images
- [ ] Consulter les logs backend
- [ ] Tester avec des IDs connus valides

---

## 🆘 Si le Problème Persiste

Partager les informations suivantes:

1. **Logs backend complets** (erreur exacte du serveur)
2. **Structure BD:**
   ```sql
   SELECT * FROM categories WHERE id = 40;
   SELECT * FROM sub_categories WHERE id = 45;
   SELECT * FROM variations WHERE id = 71;
   ```
3. **DTO Backend** (si accessible) - voir les validations

---

**Prochaine Étape:** Corriger `categoryId` en number dans ProductFormMain.tsx
