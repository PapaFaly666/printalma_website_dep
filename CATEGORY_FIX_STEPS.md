# 🔧 Étapes pour résoudre le problème d'affichage des catégories

Basé sur les logs : **"Catégorie par défaut créée en cas d'erreur réseau"**

---

## 🚨 Problème identifié

L'API `/categories` échoue ou ne retourne pas de données valides, donc le frontend crée une catégorie de secours.

---

## 📋 Étape 1 : Vérifier les nouveaux logs

Avec les logs détaillés ajoutés, rechargez la page et regardez la console :

### Logs à chercher :

```
🔄 [fetchCategories] Appel de l'API: https://printalma-back-dep.onrender.com/categories
📥 [fetchCategories] Status: 200
📥 [fetchCategories] Headers: {...}
🔍 [fetchCategories] Données brutes reçues: [...]
```

### Scénarios possibles :

#### ✅ Scénario A : Status 200 avec données vides

```
Status: 200
Données brutes reçues: []
```

**Solution** : La base de données est vide. Créer des catégories :

```bash
curl -X POST https://printalma-back-dep.onrender.com/categories/structure \
  -H "Content-Type: application/json" \
  -d '{
    "parentName": "Téléphone",
    "childName": "Coque",
    "variations": ["iPhone 13", "iPhone 14", "iPhone 15"]
  }'
```

#### ❌ Scénario B : Erreur CORS

```
❌ [fetchCategories] Erreur complète: TypeError: Failed to fetch
❌ [fetchCategories] Message: Failed to fetch
```

**Solution** : Voir `CORS_FIX_GUIDE.md` - Ajouter `x-user-id` aux headers autorisés

#### ❌ Scénario C : Erreur 500

```
Response status: 500
Response data: { error: "..." }
```

**Solution** : Problème backend - Vérifier :
1. La table `categories` existe
2. Les migrations Prisma sont appliquées
3. Les logs du serveur backend

#### ❌ Scénario D : Format de données incorrect

```
Response.data n'est pas un tableau: object
```

**Solution** : Le backend retourne `{ data: [...] }` au lieu de `[...]`

---

## 📋 Étape 2 : Tester l'endpoint directement

### Test 1 : Avec curl

```bash
# Tester GET /categories
curl -i https://printalma-back-dep.onrender.com/categories

# Devrait retourner :
# HTTP/1.1 200 OK
# Content-Type: application/json
# [{"id": 1, "name": "...", ...}]
```

### Test 2 : Dans le navigateur

Ouvrez dans un nouvel onglet :
```
https://printalma-back-dep.onrender.com/categories
```

**Attendu** : Un JSON avec des catégories
**Si erreur** : Note le message d'erreur

### Test 3 : Avec fetch depuis la console

```javascript
// Dans la console navigateur (F12)
fetch('https://printalma-back-dep.onrender.com/categories')
  .then(r => {
    console.log('Status:', r.status);
    return r.json();
  })
  .then(data => console.log('Data:', data))
  .catch(err => console.error('Error:', err));
```

---

## 📋 Étape 3 : Créer des données de test

Si la base est vide, utilisez l'endpoint `/categories/structure` :

### Option A : Via curl

```bash
# Créer une structure complète
curl -X POST https://printalma-back-dep.onrender.com/categories/structure \
  -H "Content-Type: application/json" \
  -d '{
    "parentName": "Téléphone",
    "parentDescription": "Accessoires de téléphone",
    "childName": "Coque",
    "variations": ["iPhone 13", "iPhone 14", "iPhone 15"]
  }'

# Créer une autre structure
curl -X POST https://printalma-back-dep.onrender.com/categories/structure \
  -H "Content-Type: application/json" \
  -d '{
    "parentName": "Vêtements",
    "childName": "T-Shirt",
    "variations": ["Homme", "Femme", "Enfant"]
  }'
```

### Option B : Via l'interface frontend

Si l'endpoint fonctionne :
1. Cliquer sur "Nouvelle catégorie"
2. Remplir :
   - Parent : "Téléphone"
   - Enfant : "Coque"
   - Variations : "iPhone 13", "iPhone 14", "iPhone 15"
3. Cliquer sur "Créer"

---

## 📋 Étape 4 : Vérifier la structure des données retournées

Le backend doit retourner ce format (selon `docModifie.md`) :

```json
[
  {
    "id": 1,
    "name": "Téléphone",
    "description": "Accessoires téléphone",
    "parentId": null,
    "level": 0,
    "order": 0,
    "createdAt": "2025-09-30T10:00:00.000Z",
    "updatedAt": "2025-09-30T10:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Coque",
    "description": "Sous-catégorie de Téléphone",
    "parentId": 1,
    "level": 1,
    "order": 0
  }
]
```

### ⚠️ Si le format est différent :

#### Cas 1 : Enveloppé dans `{ data: [...] }`

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "...", ... }
  ]
}
```

**Fix** : Modifier `fetchCategories()` :

```typescript
// Déjà géré dans le code actuel
const rawData = response.data.data || response.data;
```

#### Cas 2 : Champs manquants

```json
[
  { "id": 1, "name": "Téléphone" }  // ❌ Manque level, order, etc.
]
```

**Fix** : Backend doit retourner tous les champs

---

## 📋 Étape 5 : Vérifier la configuration CORS

Si vous voyez `Failed to fetch` :

### Backend doit avoir :

```typescript
// main.ts (NestJS)
app.enableCors({
  origin: [
    'http://localhost:5174',
    'https://printalma.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-user-id'  // ⚠️ Important !
  ]
});
```

---

## 📋 Étape 6 : Vérifier que le backend est démarré

```bash
# Tester un endpoint simple
curl https://printalma-back-dep.onrender.com/health

# Ou
curl https://printalma-back-dep.onrender.com
```

**Si erreur "Connection refused"** → Le backend est arrêté

**Sur Render :**
1. Aller sur https://dashboard.render.com
2. Vérifier que le service est "Live" (vert)
3. Consulter les logs pour voir les erreurs

---

## 📋 Étape 7 : Tester avec localhost

Si le backend en production ne fonctionne pas, testez en local :

```bash
# Backend local
cd /path/to/backend
npm run start:dev
# Backend sur http://localhost:3004

# Frontend - modifier .env
VITE_API_URL=http://localhost:3004

# Redémarrer le frontend
npm run dev
```

---

## 🧪 Test complet

Une fois les corrections faites :

### 1. Vérifier l'API

```bash
curl https://printalma-back-dep.onrender.com/categories
# Devrait retourner des catégories, pas []
```

### 2. Vider le cache navigateur

```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

### 3. Ouvrir la console (F12)

Chercher ces logs :
```
🔄 [fetchCategories] Appel de l'API: ...
📥 [fetchCategories] Status: 200
📊 [fetchCategories] 5 élément(s) dans la réponse
✅ [fetchCategories] Catégorie 1: {id: 1, name: "Téléphone", ...}
✅ [fetchCategories] Catégorie 2: {id: 2, name: "Coque", ...}
✅ [fetchCategories] 5 catégories valides chargées
```

### 4. Vérifier l'affichage

Dans `CategoryManagement`, vous devriez voir :
```
📊 [CategoryManagement] Catégories: [{id: 1, name: "Téléphone", ...}, ...]
📊 [CategoryManagement] Catégories organisées: [{...subcategories: [...]}]
```

Et **pas** :
```
❌ Catégories: [{id: 1, name: "Catégorie par défaut", ...}]
```

---

## 📞 Checklist finale

- [ ] L'endpoint `/categories` retourne 200
- [ ] Il retourne un tableau non vide `[{...}]`
- [ ] Chaque catégorie a : `id`, `name`, `level`, `order`, `parentId`
- [ ] Pas d'erreur CORS dans la console
- [ ] Les logs montrent "X catégories valides chargées"
- [ ] Le tableau affiche les vraies catégories
- [ ] Pas de "Catégorie par défaut" affichée

---

## 🆘 Si rien ne marche

### Contourner temporairement

Créer des catégories mockées dans le frontend :

```typescript
// src/contexts/CategoryContext.tsx

// TEMPORAIRE - À retirer une fois le backend fixé
const MOCK_CATEGORIES: Category[] = [
  {
    id: 1,
    name: 'Téléphone',
    description: 'Accessoires téléphone',
    parentId: null,
    level: 0,
    order: 0
  },
  {
    id: 2,
    name: 'Coque',
    description: 'Coques de téléphone',
    parentId: 1,
    level: 1,
    order: 0
  },
  {
    id: 3,
    name: 'iPhone 13',
    description: 'Coques iPhone 13',
    parentId: 2,
    level: 2,
    order: 0
  }
];

// Dans refreshCategories()
const refreshCategories = async () => {
  setLoading(true);
  try {
    // Essayer le backend
    const data = await fetchCategories();

    // Si catégorie par défaut, utiliser les mocks
    if (data.length === 1 && data[0].name === 'Catégorie par défaut') {
      console.warn('⚠️ Backend ne retourne pas de données, utilisation des mocks');
      setCategories(MOCK_CATEGORIES);
      return MOCK_CATEGORIES;
    }

    setCategories(data);
    return data;
  } catch (err) {
    console.error('Erreur:', err);
    setCategories(MOCK_CATEGORIES); // Fallback sur les mocks
    return MOCK_CATEGORIES;
  } finally {
    setLoading(false);
  }
};
```

---

**✨ Suivez ces étapes dans l'ordre et vous identifierez le problème !**

Les logs détaillés ajoutés vous donneront toutes les informations nécessaires.
