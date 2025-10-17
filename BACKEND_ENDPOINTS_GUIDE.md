# Guide Backend - Endpoints pour Sous-Catégories et Variations

Guide rapide pour implémenter les 3 endpoints nécessaires à la gestion des catégories dans PrintAlma.

## 📡 Endpoints à Implémenter

### 1. Ajouter une Sous-Catégorie
```http
POST /api/categories/subcategory
```

**Corps de la requête :**
```json
{
  "name": "ferfref",
  "description": "fefrer",
  "parentId": 4,
  "level": 1
}
```

**Réponse attendue (201) :**
```json
{
  "success": true,
  "message": "Sous-catégorie créée avec succès",
  "data": {
    "id": 8,
    "name": "ferfref",
    "description": "fefrer",
    "parentId": 4,
    "level": 1,
    "slug": "ferfref",
    "display_order": 1,
    "is_active": true,
    "created_at": "2025-10-17T10:30:00Z"
  }
}
```

**Validations requises :**
- `name` : requis, non vide
- `parentId` : requis, doit exister et être de niveau 0 (catégorie principale)
- `level` : doit être égal à 1

---

### 2. Ajouter une Variation
```http
POST /api/categories/variation
```

**Corps de la requête :**
```json
{
  "name": "erfer",
  "parentId": 6,
  "level": 2
}
```

**Réponse attendue (201) :**
```json
{
  "success": true,
  "message": "Variation créée avec succès",
  "data": {
    "id": 15,
    "name": "erfer",
    "parentId": 6,
    "level": 2,
    "slug": "erfer",
    "display_order": 3,
    "is_active": true,
    "created_at": "2025-10-17T10:30:00Z"
  }
}
```

**Validations requises :**
- `name` : requis, non vide
- `parentId` : requis, doit exister et être de niveau 1 (sous-catégorie)
- `level` : doit être égal à 2

---

### 3. Ajouter Plusieurs Variations (Batch)
```http
POST /api/categories/variations/batch
```

**Corps de la requête :**
```json
{
  "variations": [
    {"name": "erfer", "parentId": 6, "level": 2},
    {"name": "feffe", "parentId": 6, "level": 2},
    {"name": "fefefr", "parentId": 6, "level": 2}
  ]
}
```

**Réponse attendue (201) :**
```json
{
  "success": true,
  "message": "3 variation(s) créée(s) avec succès",
  "data": {
    "created": [
      {"id": 15, "name": "erfer", "parentId": 6, "level": 2},
      {"id": 16, "name": "feffe", "parentId": 6, "level": 2},
      {"id": 17, "name": "fefefr", "parentId": 6, "level": 2}
    ],
    "skipped": [],
    "duplicates": []
  }
}
```

**Cas avec doublons :**
```json
{
  "success": true,
  "message": "1 variation créée, 2 ignorée(s)",
  "data": {
    "created": [
      {"id": 18, "name": "erfer", "parentId": 6, "level": 2}
    ],
    "skipped": ["feffe", "fefefr"],
    "duplicates": [
      {"name": "feffe", "reason": "Doublon existant"},
      {"name": "fefefr", "reason": "Doublon existant"}
    ]
  }
}
```

---

## 🗄️ Structure de la Base de Données

### Table Categories (si pas existante)
```sql
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  level INTEGER NOT NULL DEFAULT 0,
  parent_id INTEGER NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_level ON categories(level);
CREATE INDEX idx_categories_slug ON categories(slug);
```

## ⚠️ Logique Métier Essentielle

### Pour les Sous-Catégories (level 1)
1. **Vérifier le parent** : `SELECT * FROM categories WHERE id = ? AND level = 0 AND is_active = 1`
2. **Vérifier les doublons** : `SELECT * FROM categories WHERE name = ? AND parent_id = ? AND level = 1`
3. **Calculer display_order** : `MAX(display_order) + 1` pour les enfants du même parent
4. **Générer le slug** : unique basé sur le nom

### Pour les Variations (level 2)
1. **Vérifier le parent** : `SELECT * FROM categories WHERE id = ? AND level = 1 AND is_active = 1`
2. **Vérifier les doublons** : `SELECT * FROM categories WHERE name = ? AND parent_id = ? AND level = 2`
3. **Calculer display_order** : `MAX(display_order) + 1` pour les variations de la même sous-catégorie
4. **Générer le slug** : unique basé sur le nom

## 🚨 Erreurs à Gérer

### Bad Request (400)
```json
{
  "success": false,
  "error": "MISSING_NAME",
  "message": "Le nom est requis"
}
```

```json
{
  "success": false,
  "error": "CATEGORY_NOT_FOUND",
  "message": "La catégorie parente n'existe pas"
}
```

```json
{
  "success": false,
  "error": "DUPLICATE_SUBCATEGORY",
  "message": "Une sous-catégorie avec ce nom existe déjà dans cette catégorie"
}
```

```json
{
  "success": false,
  "error": "DUPLICATE_VARIATION",
  "message": "Une variation avec ce nom existe déjà dans cette sous-catégorie"
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": "PARENT_NOT_FOUND",
  "message": "La catégorie parente n'existe pas"
}
```

## 🔧 Tests Rapides

```bash
# Test 1: Créer une sous-catégorie
curl -X POST http://localhost:3004/api/categories/subcategory \
  -H "Content-Type: application/json" \
  -d '{"name":"T-Shirts","description":"T-shirts coton","parentId":1,"level":1}'

# Test 2: Créer une variation
curl -X POST http://localhost:3004/api/categories/variation \
  -H "Content-Type: application/json" \
  -d '{"name":"Col V","parentId":2,"level":2}'

# Test 3: Créer plusieurs variations
curl -X POST http://localhost:3004/api/categories/variations/batch \
  -H "Content-Type: application/json" \
  -d '{"variations":[{"name":"Col V","parentId":2,"level":2},{"name":"Col Rond","parentId":2,"level":2}]}'
```

## 🎯 Checklist d'Implémentation

- [ ] Créer la table `categories` avec les colonnes `level` et `parent_id`
- [ ] Implémenter `POST /api/categories/subcategory`
- [ ] Implémenter `POST /api/categories/variation`
- [ ] Implémenter `POST /api/categories/variations/batch`
- [ ] Ajouter la validation des parents et des doublons
- [ ] Configurer CORS pour `http://localhost:5174`
- [ ] Tester avec les commandes curl ci-dessus

**Une fois ces 3 endpoints implémentés, le frontend fonctionnera parfaitement ! 🎉**