# BACKEND - Intégration des dimensions de design (designWidth, designHeight)

## 🎯 CONTEXTE

Le frontend utilise maintenant un système de dimensionnement style Photoshop qui nécessite de sauvegarder les dimensions des designs en plus de leur position. Actuellement, le système sauvegarde déjà `x`, `y`, `scale`, mais il faut ajouter `designWidth` et `designHeight`.

## 📋 ÉTAT ACTUEL DU SYSTÈME

### Structure actuelle des données de position :
```json
{
  "x": 50,
  "y": 30,
  "scale": 0.8,
  "rotation": 0
}
```

### Endpoints existants :
- `POST /api/design-positions` - Sauvegarde des positions
- `GET /api/design-positions/{vendorProductId}` - Récupération des positions
- `PUT /api/design-positions/{id}` - Mise à jour des positions
- `DELETE /api/design-positions/{id}` - Suppression des positions

## 🚀 MODIFICATIONS REQUISES

### 1. Base de données - Ajouter les colonnes

**Table : `design_positions`**
```sql
ALTER TABLE design_positions 
ADD COLUMN design_width FLOAT DEFAULT NULL,
ADD COLUMN design_height FLOAT DEFAULT NULL;
```

**Description des colonnes :**
- `design_width` : Largeur finale du design affichée en pixels
- `design_height` : Hauteur finale du design affichée en pixels
- Ces valeurs sont les dimensions réelles affichées à l'utilisateur

### 2. Modèle de données - Mise à jour

**Exemple pour Laravel/PHP :**
```php
// Migration
Schema::table('design_positions', function (Blueprint $table) {
    $table->float('design_width')->nullable();
    $table->float('design_height')->nullable();
});

// Modèle DesignPosition
class DesignPosition extends Model
{
    protected $fillable = [
        'vendor_product_id',
        'design_id',
        'delimitation_index',
        'x',
        'y',
        'scale',
        'rotation',
        'design_width',    // ✅ NOUVEAU
        'design_height',   // ✅ NOUVEAU
    ];

    protected $casts = [
        'x' => 'float',
        'y' => 'float',
        'scale' => 'float',
        'rotation' => 'float',
        'design_width' => 'float',   // ✅ NOUVEAU
        'design_height' => 'float',  // ✅ NOUVEAU
    ];
}
```

### 3. Endpoints - Validation des données

**Validation des requêtes :**
```php
// Validation pour POST/PUT
$validated = $request->validate([
    'x' => 'required|numeric',
    'y' => 'required|numeric',
    'scale' => 'required|numeric|min:0.1|max:5',
    'rotation' => 'numeric|min:0|max:360',
    'design_width' => 'nullable|numeric|min:10|max:1000',   // ✅ NOUVEAU
    'design_height' => 'nullable|numeric|min:10|max:1000',  // ✅ NOUVEAU
]);
```

### 4. Réponses JSON - Format mis à jour

**Réponse attendue :**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "vendor_product_id": 456,
    "design_id": 789,
    "delimitation_index": 0,
    "x": 50.5,
    "y": 30.2,
    "scale": 0.8,
    "rotation": 0,
    "design_width": 200.0,    // ✅ NOUVEAU
    "design_height": 150.0,   // ✅ NOUVEAU
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T11:45:00Z"
  }
}
```

## 🔧 EXEMPLES DE REQUÊTES

### 1. Sauvegarde avec dimensions
```javascript
// Frontend → Backend
POST /api/design-positions
{
  "vendor_product_id": 456,
  "design_id": 789,
  "delimitation_index": 0,
  "x": 50.5,
  "y": 30.2,
  "scale": 1.0,
  "rotation": 0,
  "design_width": 200.0,    // ✅ NOUVEAU
  "design_height": 150.0    // ✅ NOUVEAU
}
```

### 2. Mise à jour des dimensions
```javascript
// Frontend → Backend
PUT /api/design-positions/123
{
  "x": 60.0,
  "y": 40.0,
  "scale": 1.0,
  "rotation": 0,
  "design_width": 250.0,    // ✅ Dimensions mises à jour
  "design_height": 180.0    // ✅ Dimensions mises à jour
}
```

### 3. Récupération avec dimensions
```javascript
// Backend → Frontend
GET /api/design-positions/456
{
  "success": true,
  "data": [
    {
      "id": 123,
      "delimitation_index": 0,
      "x": 50.5,
      "y": 30.2,
      "scale": 1.0,
      "rotation": 0,
      "design_width": 200.0,    // ✅ NOUVEAU
      "design_height": 150.0    // ✅ NOUVEAU
    }
  ]
}
```

## 🔄 RÉTROCOMPATIBILITÉ

**Gestion des anciennes données :**
- Les positions existantes auront `design_width` et `design_height` = `null`
- Le frontend gérera ces valeurs `null` en utilisant des dimensions par défaut
- Pas de migration de données nécessaire

**Logique de fallback :**
```php
// Dans le contrôleur
public function show($vendorProductId)
{
    $positions = DesignPosition::where('vendor_product_id', $vendorProductId)->get();
    
    return $positions->map(function ($position) {
        return [
            'id' => $position->id,
            'x' => $position->x,
            'y' => $position->y,
            'scale' => $position->scale,
            'rotation' => $position->rotation,
            'design_width' => $position->design_width ?? null,   // ✅ Peut être null
            'design_height' => $position->design_height ?? null, // ✅ Peut être null
        ];
    });
}
```

## 🧪 TESTS À EFFECTUER

### 1. Tests unitaires
```php
// Test de sauvegarde avec dimensions
public function test_save_position_with_dimensions()
{
    $data = [
        'vendor_product_id' => 456,
        'design_id' => 789,
        'delimitation_index' => 0,
        'x' => 50.5,
        'y' => 30.2,
        'scale' => 1.0,
        'rotation' => 0,
        'design_width' => 200.0,
        'design_height' => 150.0,
    ];
    
    $response = $this->post('/api/design-positions', $data);
    
    $response->assertStatus(201)
             ->assertJsonStructure([
                 'success',
                 'data' => [
                     'id',
                     'design_width',
                     'design_height'
                 ]
             ]);
}
```

### 2. Tests d'intégration
- Sauvegarde avec `design_width` et `design_height`
- Récupération des dimensions sauvegardées
- Mise à jour des dimensions existantes
- Gestion des valeurs `null` (rétrocompatibilité)

## 📊 UTILISATION CÔTÉ FRONTEND

Le frontend utilise ces dimensions pour :
1. **Redimensionnement fluide** : Les poignées de redimensionnement modifient directement ces valeurs
2. **Cohérence visuelle** : Les dimensions affichées correspondent exactement aux valeurs sauvegardées
3. **Contrôles numériques** : Les champs largeur/hauteur modifient ces valeurs en temps réel

## 🔐 SÉCURITÉ

**Validation des limites :**
- `design_width` : min 10px, max 1000px
- `design_height` : min 10px, max 1000px
- Validation côté backend obligatoire pour éviter les valeurs aberrantes

## 🚨 POINTS IMPORTANTS

1. **Dimensions = valeurs finales** : `design_width` et `design_height` sont les dimensions réelles affichées, pas des valeurs intrinsèques
2. **Scale = 1** : Avec ce nouveau système, `scale` sera généralement 1.0 car les dimensions sont déjà finales
3. **Nullable** : Les colonnes doivent être nullable pour la rétrocompatibilité
4. **Float** : Utiliser le type `float` pour permettre les valeurs décimales

## 📋 CHECKLIST IMPLÉMENTATION

- [ ] Ajouter les colonnes `design_width` et `design_height` à la table
- [ ] Mettre à jour le modèle avec les nouveaux champs
- [ ] Ajouter la validation pour les nouveaux champs
- [ ] Modifier les endpoints pour accepter/retourner les nouvelles données
- [ ] Tester la sauvegarde avec dimensions
- [ ] Tester la récupération avec dimensions
- [ ] Vérifier la rétrocompatibilité (valeurs null)
- [ ] Mettre à jour la documentation API

Cette intégration permettra un système de dimensionnement fluide et cohérent entre le frontend et le backend ! 🎨 