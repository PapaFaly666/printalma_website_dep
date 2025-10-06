# 🔍 Guide de Debugging - Affichage des Catégories

Ce guide vous aide à diagnostiquer et résoudre les problèmes d'affichage des catégories dans `CategoryManagement.tsx`.

---

## 🚨 Problème : Aucune catégorie ne s'affiche

### Étape 1 : Vérifier la console du navigateur

Ouvrez la console développeur (F12) et cherchez les logs :

```
📊 [CategoryManagement] Catégories: []
📊 [CategoryManagement] Loading: false
📊 [CategoryManagement] Error: null
```

#### Scénario A : `categories` est vide `[]`

**Causes possibles :**
1. Le backend ne retourne pas de catégories
2. L'API endpoint est incorrect
3. Erreur CORS (voir `res.md`)
4. La base de données est vide

**Solutions :**

```bash
# 1. Tester l'endpoint directement
curl https://printalma-back-dep.onrender.com/categories

# Devrait retourner un tableau de catégories
```

Si le curl retourne une erreur 500 ou CORS :
- Voir `CORS_FIX_GUIDE.md`
- Vérifier que la table `categories` existe dans la base

#### Scénario B : `loading` est `true` indéfiniment

**Cause :** La requête ne se termine jamais

**Solution :**

```typescript
// src/contexts/CategoryContext.tsx
const refreshCategories = async () => {
  console.log('🔄 Début du chargement des catégories...');
  setLoading(true);
  setError(null);

  try {
    console.log('📡 Appel API /categories...');
    const data = await fetchCategories();
    console.log('✅ Données reçues:', data);
    setCategories(data);
    return data;
  } catch (err) {
    console.error('❌ Erreur:', err);
    setError('Impossible de charger les catégories.');
    return [];
  } finally {
    console.log('🏁 Fin du chargement');
    setLoading(false); // ⚠️ S'assurer que c'est appelé
  }
};
```

#### Scénario C : `error` contient un message

**Cause :** L'API a retourné une erreur

**Solution :** Lire le message d'erreur et :
- Vérifier les erreurs CORS
- Vérifier que le backend est démarré
- Vérifier l'URL de l'API dans `.env`

---

## 🔍 Étape 2 : Vérifier l'organisation des catégories

Dans la console, vous devriez voir :

```
📊 [CategoryManagement] Catégories organisées: [
  {
    id: 1,
    name: "Téléphone",
    subcategories: [
      {
        id: 2,
        name: "Coque",
        variations: [...]
      }
    ]
  }
]
```

Si `organizedCategories` est vide mais `categories` ne l'est pas :

**Problème :** La fonction `organizeCategories()` ne fonctionne pas

**Vérification :**

```typescript
// Dans organizeCategories(), ajouter des logs
const organizeCategories = () => {
  const parentCategories = categories.filter(cat => !cat.parentId);
  console.log('🔍 Parents trouvés:', parentCategories);

  const childCategories = categories.filter(cat => cat.parentId);
  console.log('🔍 Enfants trouvés:', childCategories);

  return parentCategories.map(parent => {
    const subcats = childCategories.filter(child => child.parentId === parent.id);
    console.log(`🔍 Sous-catégories pour "${parent.name}":`, subcats);

    return {
      ...parent,
      subcategories: subcats.map(subcat => ({
        ...subcat,
        variations: categories.filter(variation => variation.parentId === subcat.id)
      }))
    };
  });
};
```

---

## 🎨 Étape 3 : Vérifier le rendu

Si les données sont chargées mais rien ne s'affiche à l'écran :

### Vérification A : Le composant se rend-il ?

```typescript
// Ajouter au début du return
return (
  <div className="w-full h-full p-6 space-y-6 bg-gray-50/30 dark:bg-gray-950/30 min-h-screen">
    {/* Debug box */}
    <div className="bg-yellow-100 p-4 rounded">
      <h3 className="font-bold">DEBUG INFO</h3>
      <p>Catégories: {categories.length}</p>
      <p>Organisées: {organizedCategories.length}</p>
      <p>Filtrées: {filteredCategories.length}</p>
      <p>Loading: {loading ? 'OUI' : 'NON'}</p>
      <p>Error: {error || 'AUCUNE'}</p>
    </div>

    {/* Reste du composant */}
    ...
  </div>
);
```

### Vérification B : Le tableau affiche-t-il quelque chose ?

```typescript
<TableBody>
  {/* Message de debug */}
  <TableRow>
    <TableCell colSpan={6}>
      <div className="bg-blue-100 p-2 text-center">
        {filteredCategories.length} catégorie(s) à afficher
      </div>
    </TableCell>
  </TableRow>

  {filteredCategories.map((category, index) => (
    <React.Fragment key={category.id}>
      {/* Ligne debug */}
      <TableRow>
        <TableCell colSpan={6}>
          DEBUG: Rendu de "{category.name}" (index {index})
        </TableCell>
      </TableRow>

      {/* Ligne normale */}
      <TableRow className="hover:bg-gray-50">
        ...
      </TableRow>
    </React.Fragment>
  ))}
</TableBody>
```

---

## 🧪 Étape 4 : Test avec données mockées

Si rien ne fonctionne, testez avec des données en dur :

```typescript
// Au début du composant CategoryManagement
const MOCK_CATEGORIES = [
  {
    id: 1,
    name: 'Test Parent',
    description: 'Catégorie de test',
    parentId: null,
    level: 0,
    order: 0,
    subcategories: [
      {
        id: 2,
        name: 'Test Enfant',
        description: 'Sous-catégorie de test',
        parentId: 1,
        level: 1,
        order: 0,
        variations: [
          {
            id: 3,
            name: 'Test Variation',
            description: 'Variation de test',
            parentId: 2,
            level: 2,
            order: 0
          }
        ]
      }
    ]
  }
];

// Remplacer temporairement
const filteredCategories = MOCK_CATEGORIES;
```

**Si les données mockées s'affichent :**
→ Le problème vient du chargement des données (API)

**Si les données mockées ne s'affichent pas :**
→ Le problème vient du rendu (CSS, structure JSX)

---

## 🔧 Solutions rapides

### Solution 1 : Réinitialiser le Context

```typescript
// src/contexts/CategoryContext.tsx
// Forcer un rechargement au montage
useEffect(() => {
  console.log('🔄 CategoryContext monté, chargement des catégories...');
  refreshCategories();
}, []); // ⚠️ S'assurer que le tableau de dépendances est vide
```

### Solution 2 : Vérifier les imports

```typescript
// Vérifier que tous les imports sont corrects
import { useCategories } from '../contexts/CategoryContext'; // ✅
import { Category } from '../schemas/category.schema'; // ✅
```

### Solution 3 : Provider enveloppe bien l'app

```typescript
// src/App.tsx ou main.tsx
<CategoryProvider>
  <Router>
    <Routes>
      <Route path="/categories" element={<CategoryManagement />} />
    </Routes>
  </Router>
</CategoryProvider>
```

### Solution 4 : Clear cache et redémarrer

```bash
# Nettoyer le cache et les node_modules
rm -rf node_modules
rm -rf .vite
npm install

# Redémarrer le serveur
npm run dev
```

---

## 📊 Checklist complète

### Backend

- [ ] Backend démarré et accessible
- [ ] Endpoint `/categories` retourne des données
- [ ] Pas d'erreur 500
- [ ] CORS configuré correctement
- [ ] Table `categories` existe et contient des données

### Frontend

- [ ] `.env` contient la bonne URL backend
- [ ] `CategoryProvider` enveloppe l'application
- [ ] `useCategories()` est appelé dans le composant
- [ ] `categories` n'est pas vide dans la console
- [ ] `organizedCategories` contient des données
- [ ] `filteredCategories` contient des données
- [ ] Aucune erreur dans la console navigateur
- [ ] Les composants UI (Table, Badge, etc.) sont importés

### Rendu

- [ ] Le composant `CategoryManagement` se monte
- [ ] La card principale s'affiche
- [ ] Le tableau s'affiche (même vide)
- [ ] Les données mockées fonctionnent
- [ ] Les vraies données s'affichent

---

## 🆘 Si rien ne fonctionne

### 1. Créer des catégories de test via l'API

```bash
# Créer une catégorie parent
curl -X POST https://printalma-back-dep.onrender.com/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Parent",
    "description": "Catégorie de test",
    "level": 0
  }'

# Créer une sous-catégorie
curl -X POST https://printalma-back-dep.onrender.com/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Enfant",
    "description": "Sous-catégorie de test",
    "parentId": 1,
    "level": 1
  }'
```

### 2. Utiliser l'endpoint `/categories/structure`

```bash
curl -X POST https://printalma-back-dep.onrender.com/categories/structure \
  -H "Content-Type: application/json" \
  -d '{
    "parentName": "Téléphone",
    "childName": "Coque",
    "variations": ["iPhone 13", "iPhone 14", "iPhone 15"]
  }'
```

### 3. Vérifier directement dans la base de données

```sql
-- Se connecter à la base
SELECT * FROM categories ORDER BY level, "order", name;

-- Si vide, insérer des données de test
INSERT INTO categories (name, description, level, "order")
VALUES ('Test', 'Catégorie de test', 0, 0);
```

---

## 📞 Support

Si le problème persiste :

1. **Copier tous les logs de la console** (F12)
2. **Faire un screenshot de la page** (même si elle est vide)
3. **Vérifier les erreurs réseau** (onglet Network dans F12)
4. **Partager le code de `CategoryContext.tsx`** et `CategoryManagement.tsx`

---

**✨ Avec ce guide, vous devriez pouvoir identifier et résoudre n'importe quel problème d'affichage !**
