# Guide Backend - Ajout de Sous-Catégories à une Catégorie Existante

Guide spécifique pour implémenter l'ajout de sous-catégories à une catégorie principale existante.

## 📡 Endpoint Principal

### Ajouter une Sous-Catégorie
```http
POST /api/categories/subcategory
```

**Corps de la requête :**
```json
{
  "name": "T-Shirts",
  "description": "T-shirts en coton bio et tissus recyclés",
  "parentId": 4,
  "level": 1
}
```

**Réponse attendue (201) - Succès :**
```json
{
  "success": true,
  "message": "Sous-catégorie créée avec succès",
  "data": {
    "id": 8,
    "name": "T-Shirts",
    "description": "T-shirts en coton bio et tissus recyclés",
    "parentId": 4,
    "level": 1,
    "slug": "t-shirts",
    "display_order": 1,
    "is_active": true,
    "created_at": "2025-10-17T10:30:00Z",
    "updated_at": "2025-10-17T10:30:00Z"
  }
}
```

## 🔧 Logique d'Implémentation

### 1. Validation des Données d'Entrée
```javascript
const { name, description, parentId, level } = req.body;

// Validation du nom (requis)
if (!name || !name.trim()) {
  return res.status(400).json({
    success: false,
    error: "MISSING_NAME",
    message: "Le nom de la sous-catégorie est requis"
  });
}

// Validation du parentId (requis)
if (!parentId || isNaN(parseInt(parentId))) {
  return res.status(400).json({
    success: false,
    error: "MISSING_PARENT_ID",
    message: "L'ID de la catégorie parente est requis"
  });
}

// Validation du niveau (doit être 1 pour sous-catégorie)
if (level !== 1) {
  return res.status(400).json({
    success: false,
    error: "INVALID_LEVEL",
    message: "Le niveau doit être 1 pour une sous-catégorie"
  });
}
```

### 2. Validation de la Catégorie Parente
```javascript
// Vérifier que la catégorie parente existe et est de niveau 0 (catégorie principale)
const parentCategory = await dbGet(
  'SELECT * FROM categories WHERE id = ? AND level = 0 AND is_active = 1',
  [parseInt(parentId)]
);

if (!parentCategory) {
  return res.status(404).json({
    success: false,
    error: "PARENT_CATEGORY_NOT_FOUND",
    message: "La catégorie parente n'existe pas ou n'est pas une catégorie principale"
  });
}
```

### 3. Vérification des Doublons
```javascript
// Vérifier qu'une sous-catégorie avec le même nom n'existe pas déjà dans cette catégorie
const existingSubCategory = await dbGet(
  'SELECT id FROM categories WHERE name = ? AND parent_id = ? AND level = 1 AND is_active = 1',
  [name.trim(), parseInt(parentId)]
);

if (existingSubCategory) {
  return res.status(400).json({
    success: false,
    error: "DUPLICATE_SUBCATEGORY",
    message: "Une sous-catégorie avec ce nom existe déjà dans cette catégorie"
  });
}
```

### 4. Calcul du Display Order
```javascript
// Trouver le plus grand display_order pour les sous-catégories de ce parent
const maxOrderResult = await dbGet(
  'SELECT MAX(display_order) as max_order FROM categories WHERE parent_id = ? AND level = 1',
  [parseInt(parentId)]
);

const displayOrder = (maxOrderResult.max_order || 0) + 1;
```

### 5. Génération du Slug Unique
```javascript
async function generateUniqueSlug(name, parentId) {
  const baseSlug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');

  let slug = baseSlug;
  let counter = 1;

  // Vérifier que le slug est unique dans toute la table
  while (await dbGet('SELECT id FROM categories WHERE slug = ?', [slug])) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

const slug = await generateUniqueSlug(name.trim(), parentId);
```

### 6. Création de la Sous-Catégorie
```javascript
// Insérer la nouvelle sous-catégorie
const result = await dbRun(`
  INSERT INTO categories (name, slug, description, level, parent_id, display_order, is_active)
  VALUES (?, ?, ?, 1, ?, ?, 1)
`, [
  name.trim(),
  slug,
  description?.trim() || null,
  parseInt(parentId),
  displayOrder
]);

// Récupérer la sous-catégorie créée
const subCategory = await dbGet(
  'SELECT * FROM categories WHERE id = ?',
  [result.lastID]
);
```

### 7. Formatage de la Réponse
```javascript
res.status(201).json({
  success: true,
  message: "Sous-catégorie créée avec succès",
  data: {
    id: subCategory.id,
    name: subCategory.name,
    description: subCategory.description,
    parentId: subCategory.parent_id,
    level: subCategory.level,
    slug: subCategory.slug,
    display_order: subCategory.display_order,
    is_active: Boolean(subCategory.is_active),
    created_at: subCategory.created_at,
    updated_at: subCategory.updated_at
  }
});
```

## 🚨 Gestion Complète des Erreurs

### Données manquantes
```json
{
  "success": false,
  "error": "MISSING_NAME",
  "message": "Le nom de la sous-catégorie est requis"
}
```

```json
{
  "success": false,
  "error": "MISSING_PARENT_ID",
  "message": "L'ID de la catégorie parente est requis"
}
```

### Catégorie parente non trouvée
```json
{
  "success": false,
  "error": "PARENT_CATEGORY_NOT_FOUND",
  "message": "La catégorie parente n'existe pas ou n'est pas une catégorie principale"
}
```

### Doublon
```json
{
  "success": false,
  "error": "DUPLICATE_SUBCATEGORY",
  "message": "Une sous-catégorie avec ce nom existe déjà dans cette catégorie"
}
```

### Niveau invalide
```json
{
  "success": false,
  "error": "INVALID_LEVEL",
  "message": "Le niveau doit être 1 pour une sous-catégorie"
}
```

## 🧪 Tests Complets

### Test 1: Création réussie
```bash
curl -X POST http://localhost:3004/api/categories/subcategory \
  -H "Content-Type: application/json" \
  -d '{
    "name": "T-Shirts",
    "description": "T-shirts en coton bio",
    "parentId": 4,
    "level": 1
  }'
```

### Test 2: Sans nom
```bash
curl -X POST http://localhost:3004/api/categories/subcategory \
  -H "Content-Type: application/json" \
  -d '{
    "description": "T-shirts en coton bio",
    "parentId": 4,
    "level": 1
  }'
```

### Test 3: Catégorie parente inexistante
```bash
curl -X POST http://localhost:3004/api/categories/subcategory \
  -H "Content-Type: application/json" \
  -d '{
    "name": "T-Shirts",
    "description": "T-shirts en coton bio",
    "parentId": 999,
    "level": 1
  }'
```

### Test 4: Doublon
```bash
curl -X POST http://localhost:3004/api/categories/subcategory \
  -H "Content-Type: application/json" \
  -d '{
    "name": "T-Shirts",
    "description": "T-shirts en coton bio",
    "parentId": 4,
    "level": 1
  }'
```

### Test 5: Sans description (optionnel)
```bash
curl -X POST http://localhost:3004/api/categories/subcategory \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pantalons",
    "parentId": 4,
    "level": 1
  }'
```

## 🔄 Intégration avec le Frontend

### Ce que le frontend envoie
Le frontend envoie actuellement :
```javascript
{
  name: "ferfref",
  description: "fefrer",
  parentId: 4,
  level: 1
}
```

### Réponse attendue par le frontend
```javascript
{
  success: true,
  message: "Sous-catégorie créée avec succès",
  data: {
    id: 8,
    name: "ferfref",
    description: "fefrer",
    parentId: 4,
    level: 1,
    // ... autres champs
  }
}
```

Le frontend utilisera cette réponse pour :
- Afficher un message de succès
- Rafraîchir la liste des catégories
- Fermer le modal d'ajout
- Réinitialiser le formulaire

## 🎯 Suggestion d'Amélioration (Optionnel)

### Endpoint Batch pour Sous-Catégories
Si vous voulez permettre l'ajout multiple de sous-catégories :

```http
POST /api/categories/subcategories/batch
```

```json
{
  "parentId": 4,
  "subcategories": [
    {"name": "T-Shirts", "description": "T-shirts en coton"},
    {"name": "Pantalons", "description": "Pantalons jeans"},
    {"name": "Chemises", "description": "Chemises habillées"}
  ]
}
```

## 📋 Checklist d'Implémentation

- [ ] Créer l'endpoint `POST /api/categories/subcategory`
- [ ] Valider que `name` est présent et non vide
- [ ] Valider que `parentId` est un nombre valide
- [ ] Valider que `level` est égal à 1
- [ ] Vérifier que la catégorie parente existe et est de niveau 0
- [ ] Vérifier les doublons dans la même catégorie parente
- [ ] Calculer automatiquement le `display_order`
- [ ] Générer un slug unique basé sur le nom
- [ ] Retourner la sous-catégorie créée avec tous ses champs
- [ ] Tester avec les commandes curl ci-dessus
- [ ] Configurer CORS pour le frontend

**Une fois cet endpoint implémenté, les utilisateurs pourront ajouter des sous-catégories à n'importe quelle catégorie principale existante ! 🎯**