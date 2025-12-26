# Spécification Backend - Éléments de Texte avec Formatage Avancé

## 🎯 PRINCIPE FONDAMENTAL

**LE BACKEND DOIT STOCKER LES DONNÉES EXACTEMENT COMME LE LOCALSTORAGE DU FRONTEND**

```javascript
// Ce que fait le frontend (ligne 554 de CustomerProductCustomizationPageV3.tsx)
localStorage.setItem(storageKey, JSON.stringify(dataToSave));

// Ce que doit faire le backend
database.save(JSON.stringify(designElements)); // AUCUNE TRANSFORMATION !
```

**RÈGLE D'OR:** Utiliser `JSON.stringify()` et `JSON.parse()` SANS AUCUNE MODIFICATION des données.

## Vue d'ensemble

Ce document spécifie les propriétés que le backend doit stocker et restituer pour les éléments de texte personnalisés, notamment :
- Les retours à la ligne (sauts de ligne avec la touche Entrée) - stockés comme `\n`
- L'ajustement automatique de la taille de police
- Toutes les propriétés de formatage de texte
- **Stockage BIT-À-BIT identique au localStorage**

## Structure de données - Élément de texte

### Propriétés requises

Voici la structure complète d'un élément de texte tel qu'envoyé par le frontend dans `designElements` :

```typescript
{
  id: string,                    // Identifiant unique (ex: "text-1234567890")
  type: "text",                  // Type d'élément (OBLIGATOIRE)

  // Position et dimensions (en pourcentage 0-1)
  x: number,                     // Position X (0 à 1, relatif au conteneur)
  y: number,                     // Position Y (0 à 1, relatif au conteneur)
  width: number,                 // Largeur en pixels
  height: number,                // Hauteur en pixels
  rotation: number,              // Rotation en degrés (-180 à 180)
  zIndex: number,                // Ordre d'empilement

  // Contenu texte
  text: string,                  // IMPORTANT: Peut contenir des '\n' pour les retours à la ligne

  // Propriétés de formatage
  fontSize: number,              // Taille de police en pixels (peut être ajustée automatiquement)
  fontFamily: string,            // Police (ex: "Arial", "Roboto", "Montserrat")
  color: string,                 // Couleur au format hex (ex: "#000000")

  // Style de texte
  fontWeight: string,            // "normal" | "bold"
  fontStyle: string,             // "normal" | "italic"
  textDecoration: string,        // "none" | "underline"
  textAlign: string              // "left" | "center" | "right"
}
```

### Exemple de données réelles

#### Texte simple sur une seule ligne
```json
{
  "id": "text-1703521234567",
  "type": "text",
  "x": 0.5,
  "y": 0.3,
  "width": 200,
  "height": 50,
  "rotation": 0,
  "zIndex": 1,
  "text": "Mon texte personnalisé",
  "fontSize": 24,
  "fontFamily": "Arial",
  "color": "#000000",
  "fontWeight": "normal",
  "fontStyle": "normal",
  "textDecoration": "none",
  "textAlign": "center"
}
```

#### Texte multiligne avec retours à la ligne
```json
{
  "id": "text-1703521234568",
  "type": "text",
  "x": 0.5,
  "y": 0.5,
  "width": 250,
  "height": 80,
  "rotation": 0,
  "zIndex": 2,
  "text": "Ligne 1\nLigne 2\nLigne 3",
  "fontSize": 20,
  "fontFamily": "Roboto",
  "color": "#FF5733",
  "fontWeight": "bold",
  "fontStyle": "normal",
  "textDecoration": "none",
  "textAlign": "left"
}
```

#### Texte avec ajustement automatique de taille
```json
{
  "id": "text-1703521234569",
  "type": "text",
  "x": 0.5,
  "y": 0.7,
  "width": 300,
  "height": 60,
  "rotation": -15,
  "zIndex": 3,
  "text": "Un très long texte qui a été automatiquement réduit pour tenir dans la zone",
  "fontSize": 16,
  "fontFamily": "Montserrat",
  "color": "#3498DB",
  "fontWeight": "normal",
  "fontStyle": "italic",
  "textDecoration": "underline",
  "textAlign": "center"
}
```

## 🔴 COMPARAISON EXACTE: localStorage vs Backend

### Ce que contient localStorage (après JSON.stringify)

Quand l'utilisateur tape du texte avec des sauts de ligne, voici EXACTEMENT ce qui est stocké:

```json
{
  "id": "text-1703521234567",
  "type": "text",
  "x": 0.5,
  "y": 0.3,
  "width": 200,
  "height": 80,
  "rotation": 0,
  "zIndex": 1,
  "text": "Première ligne\nDeuxième ligne\nTroisième ligne",
  "fontSize": 18,
  "fontFamily": "Arial",
  "color": "#000000",
  "fontWeight": "bold",
  "fontStyle": "normal",
  "textDecoration": "none",
  "textAlign": "center"
}
```

**Point critique:** Dans la chaîne JSON, `\n` est stocké comme la séquence de deux caractères `\` et `n` (échappés par JSON.stringify). Quand on fait `JSON.parse()`, on récupère le vrai caractère de retour à la ligne.

### Ce que le backend DOIT stocker (IDENTIQUE)

```sql
-- Colonne JSONB dans PostgreSQL
design_elements = '[
  {
    "id": "text-1703521234567",
    "type": "text",
    "text": "Première ligne\nDeuxième ligne\nTroisième ligne",
    ...
  }
]'
```

**La chaîne stockée en base de données doit être BYTE-FOR-BYTE identique à ce que `JSON.stringify()` produit côté frontend.**

## Points critiques pour le backend

### 1. Gestion des retours à la ligne

**IMPORTANT:** Le champ `text` peut contenir des caractères de retour à la ligne (`\n`).

**Actions requises:**
- ✅ **NE PAS** supprimer ou transformer les `\n` lors du stockage
- ✅ **NE PAS** échapper manuellement les `\n` (JSON.stringify le fait automatiquement)
- ✅ **NE PAS** transformer les `\n` en `<br>`, `\\n`, ou autre chose
- ✅ Laisser `JSON.stringify()` et `JSON.parse()` gérer l'échappement
- ✅ Stocker dans un champ JSONB (PostgreSQL) ou JSON (MySQL)

**Exemple de traitement incorrect:**
```javascript
// ❌ MAUVAIS - Ne JAMAIS faire cela
const sanitizedText = element.text.replace(/\n/g, ' '); // Supprime les retours à la ligne
const escaped = element.text.replace(/\n/g, '\\n'); // Double échappement (BUG!)
const htmlified = element.text.replace(/\n/g, '<br>'); // Transformation non désirée
```

**Exemple de traitement correct:**
```javascript
// ✅ BON - Laisser JSON.stringify gérer tout
const dataToStore = JSON.stringify(designElements); // C'est tout!
database.save('design_elements', dataToStore);

// ✅ BON - Lors de la restitution
const retrieved = JSON.parse(database.get('design_elements'));
// retrieved[0].text contiendra les vrais \n
```

**Vérification manuelle:**
Si vous ouvrez la base de données et regardez le champ JSONB/JSON, vous devriez voir:
```
"text": "Ligne 1\nLigne 2\nLigne 3"
```
Et **PAS**:
```
"text": "Ligne 1\\nLigne 2\\nLigne 3"  ❌ Double échappement
"text": "Ligne 1 Ligne 2 Ligne 3"      ❌ Retours à la ligne supprimés
"text": "Ligne 1<br>Ligne 2<br>Ligne 3" ❌ Transformé en HTML
```

### 2. Ajustement de la taille de police

La propriété `fontSize` peut être modifiée dynamiquement côté frontend quand :
- Le texte devient trop long pour la zone définie
- L'utilisateur redimensionne la zone de texte
- Le texte contient plusieurs lignes

**Actions requises:**
- ✅ Stocker la valeur `fontSize` telle quelle (elle reflète l'ajustement automatique)
- ✅ Ne pas appliquer de validation stricte sur `fontSize` (peut varier de 10 à 100)
- ✅ Restituer exactement la valeur stockée

### 3. Champ JSON pour designElements

Le tableau `designElements` doit être stocké dans un champ JSON/JSONB dans la base de données.

**Schéma de table recommandé:**

```sql
CREATE TABLE customizations (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  color_variation_id INTEGER NOT NULL,
  view_id INTEGER NOT NULL,
  design_elements JSONB NOT NULL,  -- Stocke le tableau d'éléments
  session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX idx_customizations_product ON customizations(product_id);
CREATE INDEX idx_customizations_session ON customizations(session_id);
CREATE INDEX idx_customizations_design_elements ON customizations USING GIN (design_elements);
```

### 4. Validation des données

Voici les validations à appliquer côté backend :

```javascript
// Validation d'un élément de texte
function validateTextElement(element) {
  const errors = [];

  // Champs obligatoires
  if (!element.id || typeof element.id !== 'string') {
    errors.push('id is required and must be a string');
  }

  if (element.type !== 'text') {
    errors.push('type must be "text"');
  }

  if (typeof element.text !== 'string') {
    errors.push('text must be a string');
  }

  // Position et dimensions
  if (typeof element.x !== 'number' || element.x < 0 || element.x > 1) {
    errors.push('x must be a number between 0 and 1');
  }

  if (typeof element.y !== 'number' || element.y < 0 || element.y > 1) {
    errors.push('y must be a number between 0 and 1');
  }

  if (typeof element.width !== 'number' || element.width <= 0) {
    errors.push('width must be a positive number');
  }

  if (typeof element.height !== 'number' || element.height <= 0) {
    errors.push('height must be a positive number');
  }

  // Formatage
  if (typeof element.fontSize !== 'number' || element.fontSize < 10 || element.fontSize > 100) {
    errors.push('fontSize must be a number between 10 and 100');
  }

  if (!element.fontFamily || typeof element.fontFamily !== 'string') {
    errors.push('fontFamily is required and must be a string');
  }

  if (!element.color || !/^#[0-9A-Fa-f]{6}$/.test(element.color)) {
    errors.push('color must be a valid hex color (e.g., #000000)');
  }

  // Style (valeurs autorisées)
  if (!['normal', 'bold'].includes(element.fontWeight)) {
    errors.push('fontWeight must be "normal" or "bold"');
  }

  if (!['normal', 'italic'].includes(element.fontStyle)) {
    errors.push('fontStyle must be "normal" or "italic"');
  }

  if (!['none', 'underline'].includes(element.textDecoration)) {
    errors.push('textDecoration must be "none" or "underline"');
  }

  if (!['left', 'center', 'right'].includes(element.textAlign)) {
    errors.push('textAlign must be "left", "center", or "right"');
  }

  return errors;
}
```

## API Endpoints

### POST /api/customizations (Créer/Mettre à jour)

**Request Body:**
```json
{
  "productId": 1,
  "colorVariationId": 5,
  "viewId": 12,
  "sessionId": "session-abc123",
  "designElements": [
    {
      "id": "text-1703521234567",
      "type": "text",
      "x": 0.5,
      "y": 0.3,
      "width": 200,
      "height": 50,
      "rotation": 0,
      "zIndex": 1,
      "text": "Ligne 1\nLigne 2\nLigne 3",
      "fontSize": 24,
      "fontFamily": "Arial",
      "color": "#000000",
      "fontWeight": "bold",
      "fontStyle": "normal",
      "textDecoration": "none",
      "textAlign": "center"
    },
    {
      "id": "image-1703521234568",
      "type": "image",
      "x": 0.5,
      "y": 0.7,
      "width": 150,
      "height": 150,
      "rotation": 0,
      "zIndex": 0,
      "imageUrl": "https://...",
      "designId": 42,
      "designPrice": 5000
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": 123,
  "productId": 1,
  "colorVariationId": 5,
  "viewId": 12,
  "designElements": [...],
  "sessionId": "session-abc123",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### GET /api/customizations/draft/:productId

**Response (200 OK):**
```json
{
  "id": 123,
  "productId": 1,
  "colorVariationId": 5,
  "viewId": 12,
  "designElements": [
    {
      "id": "text-1703521234567",
      "type": "text",
      "text": "Mon texte\navec retour à la ligne",
      "fontSize": 18,
      ...
    }
  ],
  "sessionId": "session-abc123",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## Cas d'usage spécifiques

### Cas 1: Texte avec plusieurs lignes

**Frontend envoie:**
```json
{
  "text": "Bonjour\nComment allez-vous?\nBien merci!"
}
```

**Backend doit stocker exactement:** `"Bonjour\nComment allez-vous?\nBien merci!"`

**Backend doit restituer exactement:** `"Bonjour\nComment allez-vous?\nBien merci!"`

### Cas 2: Texte vide ou avec espaces

**Autorisé:**
- Texte vide: `""`
- Texte avec espaces: `"   "`
- Texte avec seulement des retours à la ligne: `"\n\n\n"`

### Cas 3: Caractères spéciaux

**Le texte peut contenir:**
- Émojis: `"J'adore ❤️ ce produit!"`
- Caractères accentués: `"Café français à été"`
- Symboles: `"Prix: 10€ (TVA 20%)"`
- Guillemets: `"Il a dit \"bonjour\""`

**Action requise:** Assurer un encodage UTF-8 correct dans la base de données.

## 💻 Implémentation Backend (Node.js + PostgreSQL)

### Exemple complet d'implémentation

```javascript
// ✅ IMPLÉMENTATION CORRECTE - Controller/Route Handler

const { Pool } = require('pg');
const pool = new Pool({
  // Configuration PostgreSQL
  connectionString: process.env.DATABASE_URL,
});

// POST /api/customizations - Créer/Mettre à jour une personnalisation
async function saveCustomization(req, res) {
  const { productId, colorVariationId, viewId, designElements, sessionId } = req.body;

  // Validation de base
  if (!productId || !colorVariationId || !viewId || !Array.isArray(designElements)) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  try {
    // 🎯 IMPORTANT: PostgreSQL avec JSONB stocke automatiquement en JSON
    // Pas besoin de faire JSON.stringify si vous utilisez le type JSONB
    const query = `
      INSERT INTO customizations (product_id, color_variation_id, view_id, design_elements, session_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (session_id, product_id, color_variation_id, view_id)
      DO UPDATE SET
        design_elements = EXCLUDED.design_elements,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const values = [
      productId,
      colorVariationId,
      viewId,
      JSON.stringify(designElements), // JSONB accepte les strings JSON ou objets JS
      sessionId
    ];

    const result = await pool.query(query, values);

    // Renvoyer avec les éléments parsés
    const customization = {
      ...result.rows[0],
      designElements: JSON.parse(result.rows[0].design_elements)
    };

    res.status(201).json(customization);
  } catch (error) {
    console.error('Error saving customization:', error);
    res.status(500).json({ error: 'Failed to save customization' });
  }
}

// GET /api/customizations/draft/:productId - Récupérer le draft
async function getProductDraft(req, res) {
  const { productId } = req.params;
  const sessionId = req.query.sessionId || req.headers['x-session-id'];

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID required' });
  }

  try {
    const query = `
      SELECT * FROM customizations
      WHERE product_id = $1 AND session_id = $2
      ORDER BY updated_at DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [productId, sessionId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    // 🎯 IMPORTANT: Parser le JSONB pour renvoyer un objet JS
    const draft = {
      ...result.rows[0],
      designElements: JSON.parse(result.rows[0].design_elements)
    };

    res.json(draft);
  } catch (error) {
    console.error('Error fetching draft:', error);
    res.status(500).json({ error: 'Failed to fetch draft' });
  }
}

module.exports = {
  saveCustomization,
  getProductDraft
};
```

### Migration de base de données

```sql
-- Créer la table avec JSONB pour design_elements
CREATE TABLE customizations (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  color_variation_id INTEGER NOT NULL,
  view_id INTEGER NOT NULL,
  design_elements JSONB NOT NULL,  -- 🎯 Type JSONB pour PostgreSQL
  session_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX idx_customizations_product ON customizations(product_id);
CREATE INDEX idx_customizations_session ON customizations(session_id);
CREATE INDEX idx_customizations_design_elements ON customizations USING GIN (design_elements);

-- Contrainte unique pour éviter les doublons
CREATE UNIQUE INDEX idx_customizations_unique
ON customizations(session_id, product_id, color_variation_id, view_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customizations_updated_at
BEFORE UPDATE ON customizations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Alternative MySQL

```sql
-- Pour MySQL 5.7+ avec support JSON
CREATE TABLE customizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  color_variation_id INT NOT NULL,
  view_id INT NOT NULL,
  design_elements JSON NOT NULL,  -- Type JSON pour MySQL
  session_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_customization (session_id, product_id, color_variation_id, view_id)
);

CREATE INDEX idx_customizations_product ON customizations(product_id);
CREATE INDEX idx_customizations_session ON customizations(session_id);
```

## Tests recommandés

### Tests unitaires backend

```javascript
const request = require('supertest');
const app = require('../app'); // Votre application Express

describe('Text Element Storage', () => {
  it('should preserve newline characters in text', async () => {
    const customizationData = {
      productId: 1,
      colorVariationId: 5,
      viewId: 12,
      sessionId: 'test-session-123',
      designElements: [
        {
          id: 'text-123',
          type: 'text',
          text: 'Line 1\nLine 2\nLine 3',
          x: 0.5,
          y: 0.3,
          width: 200,
          height: 80,
          rotation: 0,
          zIndex: 1,
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#000000',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'none',
          textAlign: 'center'
        }
      ]
    };

    // Sauvegarder
    const saveResponse = await request(app)
      .post('/api/customizations')
      .send(customizationData)
      .expect(201);

    // Récupérer
    const getResponse = await request(app)
      .get(`/api/customizations/draft/${customizationData.productId}`)
      .set('x-session-id', customizationData.sessionId)
      .expect(200);

    // Vérifier que le texte est identique avec les \n préservés
    expect(getResponse.body.designElements[0].text).toBe('Line 1\nLine 2\nLine 3');
  });

  it('should store adjusted fontSize correctly (decimal values)', async () => {
    const customizationData = {
      productId: 1,
      colorVariationId: 5,
      viewId: 12,
      sessionId: 'test-session-124',
      designElements: [
        {
          id: 'text-124',
          type: 'text',
          text: 'Test',
          fontSize: 16.5,  // Valeur décimale
          // ... autres propriétés
        }
      ]
    };

    const saveResponse = await request(app)
      .post('/api/customizations')
      .send(customizationData)
      .expect(201);

    const getResponse = await request(app)
      .get(`/api/customizations/draft/${customizationData.productId}`)
      .set('x-session-id', customizationData.sessionId)
      .expect(200);

    expect(getResponse.body.designElements[0].fontSize).toBe(16.5);
  });

  it('should handle special characters, emojis, and accents', async () => {
    const customizationData = {
      productId: 1,
      colorVariationId: 5,
      viewId: 12,
      sessionId: 'test-session-125',
      designElements: [
        {
          id: 'text-125',
          type: 'text',
          text: 'Émojis 😊\nAccents éàü\nSymboles €$¥',
          // ... autres propriétés
        }
      ]
    };

    const saveResponse = await request(app)
      .post('/api/customizations')
      .send(customizationData)
      .expect(201);

    const getResponse = await request(app)
      .get(`/api/customizations/draft/${customizationData.productId}`)
      .set('x-session-id', customizationData.sessionId)
      .expect(200);

    expect(getResponse.body.designElements[0].text).toBe('Émojis 😊\nAccents éàü\nSymboles €$¥');
  });

  it('should match localStorage behavior exactly', async () => {
    // Simuler ce que fait le frontend
    const frontendData = {
      id: 'text-126',
      type: 'text',
      text: 'Test\nMultiligne\nAvec émojis 🎨',
      fontSize: 18.5,
      fontFamily: 'Roboto',
      color: '#FF5733',
      fontWeight: 'bold',
      fontStyle: 'italic',
      textDecoration: 'underline',
      textAlign: 'left',
      x: 0.5,
      y: 0.3,
      width: 250,
      height: 100,
      rotation: 15,
      zIndex: 2
    };

    // Ce que fait localStorage
    const localStorageString = JSON.stringify(frontendData);

    // Envoyer au backend
    const customizationData = {
      productId: 1,
      colorVariationId: 5,
      viewId: 12,
      sessionId: 'test-session-126',
      designElements: [frontendData]
    };

    await request(app)
      .post('/api/customizations')
      .send(customizationData)
      .expect(201);

    // Récupérer depuis le backend
    const getResponse = await request(app)
      .get(`/api/customizations/draft/${customizationData.productId}`)
      .set('x-session-id', customizationData.sessionId)
      .expect(200);

    // Comparer: le backend doit renvoyer exactement la même chose que localStorage
    const backendString = JSON.stringify(getResponse.body.designElements[0]);

    expect(backendString).toBe(localStorageString);
  });
});
```

## Checklist d'implémentation

### Étape 1: Base de données
- [ ] Table `customizations` créée avec champ **JSONB** (PostgreSQL) ou **JSON** (MySQL)
- [ ] Encodage UTF-8 configuré (`CREATE DATABASE ... WITH ENCODING 'UTF8'`)
- [ ] Index GIN créé sur le champ `design_elements` (PostgreSQL)
- [ ] Contrainte unique sur `(session_id, product_id, color_variation_id, view_id)`

### Étape 2: Backend API
- [ ] Endpoint POST `/api/customizations` implémenté
- [ ] Endpoint GET `/api/customizations/draft/:productId` implémenté
- [ ] Utilisation de `JSON.stringify()` pour stocker (ou laisser JSONB le faire automatiquement)
- [ ] Utilisation de `JSON.parse()` pour restituer
- [ ] Aucune transformation des données (ni `\n`, ni caractères spéciaux)

### Étape 3: Validation
- [ ] Validation des champs obligatoires (`id`, `type`, `text`, positions, etc.)
- [ ] Validation des types de données (string, number, etc.)
- [ ] Validation des plages de valeurs (fontSize 10-100, x/y 0-1, etc.)
- [ ] Validation des valeurs énumérées (fontWeight, fontStyle, textAlign, etc.)

### Étape 4: Tests
- [ ] Test de préservation des `\n` (retours à la ligne)
- [ ] Test des valeurs décimales pour `fontSize`
- [ ] Test des caractères spéciaux, accents, émojis
- [ ] Test de comparaison localStorage vs Backend (doivent être identiques)
- [ ] Test de charge avec plusieurs personnalisations

### Étape 5: Vérification finale
- [ ] Vérifier dans la BDD que `"text": "Ligne 1\nLigne 2"` (et non `\\n`)
- [ ] Tester avec le frontend réel (sauvegarder et recharger la page)
- [ ] Vérifier les logs pour détecter les erreurs de validation
- [ ] Documenter l'API dans Swagger/OpenAPI

## 🔍 Comment vérifier que tout fonctionne

### Test manuel rapide

1. **Frontend:** Créer un texte avec plusieurs lignes
   ```
   Ligne 1
   Ligne 2
   Ligne 3
   ```

2. **Vérifier localStorage** (F12 → Application → Local Storage)
   ```json
   {
     "text": "Ligne 1\nLigne 2\nLigne 3"
   }
   ```

3. **Vérifier la base de données** (avec pgAdmin ou MySQL Workbench)
   ```sql
   SELECT design_elements FROM customizations WHERE id = 123;
   ```

   Résultat attendu:
   ```json
   [{"text": "Ligne 1\nLigne 2\nLigne 3", ...}]
   ```

4. **Recharger la page** et vérifier que le texte s'affiche sur plusieurs lignes

### Diagnostic des problèmes courants

| Symptôme | Cause probable | Solution |
|----------|----------------|----------|
| Texte sur une seule ligne après rechargement | `\n` supprimés par le backend | Vérifier qu'aucun `.replace(/\n/g, ...)` n'est appliqué |
| Double `\\` dans la BDD | Double échappement | Ne pas échapper manuellement, laisser JSON.stringify gérer |
| Caractères bizarres (�) | Encodage incorrect | Configurer UTF-8 dans la BDD et la connexion |
| fontSize arrondi | Conversion en integer | Utiliser DECIMAL ou FLOAT, pas INT |
| Erreur 500 lors de la sauvegarde | Validation trop stricte | Vérifier les logs et ajuster la validation |

## Notes importantes

### ⚠️ À NE JAMAIS FAIRE

```javascript
// ❌ NE JAMAIS transformer les \n
element.text = element.text.replace(/\n/g, ' ');
element.text = element.text.replace(/\n/g, '<br>');
element.text = element.text.replace(/\n/g, '\\n');

// ❌ NE JAMAIS arrondir fontSize
element.fontSize = Math.round(element.fontSize);

// ❌ NE JAMAIS sanitizer le texte
element.text = sanitizeHtml(element.text);

// ❌ NE JAMAIS modifier l'ordre des propriétés
const { text, ...rest } = element; // Garde l'ordre
```

### ✅ À TOUJOURS FAIRE

```javascript
// ✅ Stocker tel quel
const dataToStore = JSON.stringify(designElements);

// ✅ Restituer tel quel
const retrieved = JSON.parse(storedData);

// ✅ Valider sans modifier
if (typeof element.text !== 'string') {
  throw new Error('Invalid text');
}

// ✅ Logger pour debug
console.log('Storing:', element.text);
console.log('Has newlines:', element.text.includes('\n'));
```

## 📊 Résumé visuel

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUX DE DONNÉES                          │
└─────────────────────────────────────────────────────────────┘

Frontend (saisie utilisateur)
        │
        │ "Ligne 1\nLigne 2\nLigne 3"
        ▼
localStorage.setItem(key, JSON.stringify(data))
        │
        │ '{"text":"Ligne 1\\nLigne 2\\nLigne 3"}'
        │
        ▼
Backend reçoit via POST /api/customizations
        │
        │ req.body.designElements[0].text = "Ligne 1\nLigne 2\nLigne 3"
        │
        ▼
PostgreSQL JSONB ou MySQL JSON
        │
        │ Stocke: [{"text":"Ligne 1\nLigne 2\nLigne 3"}]
        │
        ▼
Backend restitue via GET /api/customizations/draft/:id
        │
        │ JSON.parse(row.design_elements)
        │
        ▼
Frontend reçoit et affiche
        │
        │ Ligne 1
        │ Ligne 2
        │ Ligne 3
        ▼
```

## Support et Questions

### Documentation de référence

**Code Frontend:**
- `src/pages/CustomerProductCustomizationPageV3.tsx` (lignes 1226-1433 pour l'éditeur de texte)
- `src/components/ProductDesignEditor.tsx` (composant de gestion du canvas Fabric.js)
- `src/services/customizationService.ts` (service d'API)

**Fichiers de configuration:**
- `src/config/api.ts` (endpoints API)
- `CLAUDE.md` (architecture du projet)

### Ressources externes

- [PostgreSQL JSONB Documentation](https://www.postgresql.org/docs/current/datatype-json.html)
- [MySQL JSON Documentation](https://dev.mysql.com/doc/refman/8.0/en/json.html)
- [MDN: JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
- [MDN: JSON.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse)

---

**Version:** 1.0
**Date:** 2025-01-26
**Auteur:** Équipe PrintAlma
**Dernière mise à jour:** Ce document doit être mis à jour si de nouvelles propriétés de texte sont ajoutées côté frontend.

**🎯 Objectif final:** Le backend doit restituer exactement les mêmes données que celles stockées dans localStorage, bit-à-bit, sans aucune transformation.
