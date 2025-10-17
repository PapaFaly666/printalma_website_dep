# Guide Backend - Ajout Multiple de Variations à une Sous-Catégorie

Guide spécifique pour implémenter l'ajout de plusieurs variations à une sous-catégorie existante.

## 📡 Endpoint Principal

### Ajouter Plusieurs Variations en Lot
```http
POST /api/categories/variations/batch
```

**Corps de la requête :**
```json
{
  "variations": [
    {"name": "Col V", "parentId": 6, "level": 2},
    {"name": "Col Rond", "parentId": 6, "level": 2},
    {"name": "Col Polo", "parentId": 6, "level": 2},
    {"name": "Manches Longues", "parentId": 6, "level": 2}
  ]
}
```

**Réponse attendue (201) - Succès total :**
```json
{
  "success": true,
  "message": "4 variation(s) créée(s) avec succès",
  "data": {
    "created": [
      {
        "id": 15,
        "name": "Col V",
        "parentId": 6,
        "level": 2,
        "slug": "col-v",
        "display_order": 1,
        "is_active": true,
        "created_at": "2025-10-17T10:30:00Z"
      },
      {
        "id": 16,
        "name": "Col Rond",
        "parentId": 6,
        "level": 2,
        "slug": "col-rond",
        "display_order": 2,
        "is_active": true,
        "created_at": "2025-10-17T10:30:00Z"
      },
      {
        "id": 17,
        "name": "Col Polo",
        "parentId": 6,
        "level": 2,
        "slug": "col-polo",
        "display_order": 3,
        "is_active": true,
        "created_at": "2025-10-17T10:30:00Z"
      },
      {
        "id": 18,
        "name": "Manches Longues",
        "parentId": 6,
        "level": 2,
        "slug": "manches-longues",
        "display_order": 4,
        "is_active": true,
        "created_at": "2025-10-17T10:30:00Z"
      }
    ],
    "skipped": [],
    "duplicates": []
  }
}
```

**Réponse partielle - Avec doublons :**
```json
{
  "success": true,
  "message": "2 variation(s) créée(s), 2 ignorée(s)",
  "data": {
    "created": [
      {
        "id": 19,
        "name": "Col V",
        "parentId": 6,
        "level": 2,
        "slug": "col-v",
        "display_order": 5,
        "is_active": true,
        "created_at": "2025-10-17T10:31:00Z"
      },
      {
        "id": 20,
        "name": "Manches Longues",
        "parentId": 6,
        "level": 2,
        "slug": "manches-longues",
        "display_order": 6,
        "is_active": true,
        "created_at": "2025-10-17T10:31:00Z"
      }
    ],
    "skipped": ["Col Rond", "Col Polo"],
    "duplicates": [
      {
        "name": "Col Rond",
        "reason": "Cette variation existe déjà dans cette sous-catégorie"
      },
      {
        "name": "Col Polo",
        "reason": "Cette variation existe déjà dans cette sous-catégorie"
      }
    ]
  }
}
```

## 🔧 Logique d'Implémentation

### 1. Validation Initiale
```javascript
// Vérifier que le tableau n'est pas vide
if (!variations || !Array.isArray(variations) || variations.length === 0) {
  return res.status(400).json({
    success: false,
    error: "MISSING_VARIATIONS",
    message: "Le tableau des variations est requis et ne doit pas être vide"
  });
}
```

### 2. Validation de la Sous-Catégorie Parente
```javascript
// Vérifier que la sous-catégorie parente existe pour toutes les variations
const parentIds = [...new Set(variations.map(v => v.parentId))];

for (const parentId of parentIds) {
  const parentSubCategory = await dbGet(
    'SELECT * FROM categories WHERE id = ? AND level = 1 AND is_active = 1',
    [parentId]
  );

  if (!parentSubCategory) {
    return res.status(404).json({
      success: false,
      error: "SUBCATEGORY_NOT_FOUND",
      message: `La sous-catégorie avec l'ID ${parentId} n'existe pas`
    });
  }
}
```

### 3. Traitement en Lot
```javascript
const results = {
  created: [],
  skipped: [],
  duplicates: []
};

for (const variationData of variations) {
  try {
    // Vérifier les doublons pour cette variation spécifique
    const existingVariation = await dbGet(
      'SELECT id FROM categories WHERE name = ? AND parent_id = ? AND level = 2 AND is_active = 1',
      [variationData.name.trim(), variationData.parentId]
    );

    if (existingVariation) {
      results.duplicates.push({
        name: variationData.name,
        reason: 'Cette variation existe déjà dans cette sous-catégorie'
      });
      results.skipped.push(variationData.name);
      continue;
    }

    // Créer la variation
    const variation = await createSingleVariation(variationData);
    results.created.push(variation);

  } catch (error) {
    results.skipped.push(variationData.name);
    // Log l'erreur pour debugging
    console.error(`Erreur création variation ${variationData.name}:`, error);
  }
}
```

### 4. Fonction de Création Individuelle
```javascript
async function createSingleVariation(variationData) {
  const { name, parentId } = variationData;

  // Générer le slug unique
  const slug = await generateUniqueSlug(name.trim(), parentId);

  // Calculer le display_order
  const maxOrderResult = await dbGet(
    'SELECT MAX(display_order) as max_order FROM categories WHERE parent_id = ? AND level = 2',
    [parentId]
  );

  const displayOrder = (maxOrderResult.max_order || 0) + 1;

  // Insérer la variation
  const result = await dbRun(`
    INSERT INTO categories (name, slug, description, level, parent_id, display_order, is_active)
    VALUES (?, ?, null, 2, ?, ?, 1)
  `, [name.trim(), slug, parentId, displayOrder]);

  // Récupérer la variation créée
  return await dbGet('SELECT * FROM categories WHERE id = ?', [result.lastID]);
}
```

## 🚨 Erreurs Spécifiques

### Données invalides
```json
{
  "success": false,
  "error": "MISSING_VARIATIONS",
  "message": "Le tableau des variations est requis et ne doit pas être vide"
}
```

### Sous-catégorie non trouvée
```json
{
  "success": false,
  "error": "SUBCATEGORY_NOT_FOUND",
  "message": "La sous-catégorie avec l'ID 6 n'existe pas"
}
```

### Erreur de validation
```json
{
  "success": false,
  "error": "INVALID_VARIATION_DATA",
  "message": "Données de variation invalides: le nom est requis"
}
```

## 🧪 Tests Complets

### Test 1: Ajout réussi de plusieurs variations
```bash
curl -X POST http://localhost:3004/api/categories/variations/batch \
  -H "Content-Type: application/json" \
  -d '{
    "variations": [
      {"name": "Col V", "parentId": 6, "level": 2},
      {"name": "Col Rond", "parentId": 6, "level": 2},
      {"name": "Col Polo", "parentId": 6, "level": 2}
    ]
  }'
```

### Test 2: Avec des doublons
```bash
curl -X POST http://localhost:3004/api/categories/variations/batch \
  -H "Content-Type: application/json" \
  -d '{
    "variations": [
      {"name": "Col V", "parentId": 6, "level": 2},
      {"name": "Nouvelle Variation", "parentId": 6, "level": 2},
      {"name": "Col V", "parentId": 6, "level": 2}
    ]
  }'
```

### Test 3: Sous-catégorie inexistante
```bash
curl -X POST http://localhost:3004/api/categories/variations/batch \
  -H "Content-Type: application/json" \
  -d '{
    "variations": [
      {"name": "Test", "parentId": 999, "level": 2}
    ]
  }'
```

### Test 4: Tableau vide
```bash
curl -X POST http://localhost:3004/api/categories/variations/batch \
  -H "Content-Type: application/json" \
  -d '{"variations": []}'
```

## 🔄 Intégration avec le Frontend

### Ce que le frontend attend
Le frontend envoie actuellement :
```javascript
{
  variations: [
    {name: "erfer", parentId: 6, level: 2},
    {name: "feffe", parentId: 6, level: 2},
    {name: "fefefr", parentId: 6, level: 2}
  ]
}
```

### Réponse attendue par le frontend
```javascript
{
  success: true,
  message: "3 variation(s) créée(s) avec succès",
  data: {
    created: [...],
    skipped: [],
    duplicates: [...]
  }
}
```

Le frontend utilisera ces informations pour :
- Afficher le nombre de variations créées
- Afficher un message d'avertissement pour les doublons
- Rafraîchir la liste des catégories

## 🎯 Checklist d'Implémentation

- [ ] Créer l'endpoint `POST /api/categories/variations/batch`
- [ ] Valider que le tableau de variations n'est pas vide
- [ ] Vérifier que tous les `parentId` pointent vers des sous-catégories existantes
- [ ] Implémenter la gestion des doublons (ne pas créer si existe déjà)
- [ ] Calculer automatiquement le `display_order` pour chaque variation
- [ ] Générer des slugs uniques pour chaque variation
- [ ] Retourner la structure de réponse avec `created`, `skipped`, `duplicates`
- [ ] Tester avec les commandes curl ci-dessus
- [ ] Configurer CORS pour le frontend

**Une fois cet endpoint implémenté, l'utilisateur pourra ajouter plusieurs variations d'un seul coup depuis l'interface ! 🚀**