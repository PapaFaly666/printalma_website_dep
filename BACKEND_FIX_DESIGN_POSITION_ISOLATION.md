# 🛠️ BACKEND FIX — Isolation des positions de design par produit

## 1. Problème observé
1. Le vendeur A ouvre le configurateur de design pour le **Produit P1**.
2. Il ajoute le **Design D** sur la zone d’impression, le déplace (ex. `x = 120`, `y = 80`) et enregistre.
3. Le même vendeur (ou un autre) ouvre ensuite le configurateur pour **Produit P2**.
4. Il ajoute de nouveau **Design D**, le déplace ailleurs (ex. `x = 30`, `y = 220`) et enregistre.
5. 🐞 Lorsqu’on retourne sur **Produit P1**, la position du design a été écrasée par la position appliquée dans **Produit P2**.

## 2. Analyse / Cause racine
Aujourd’hui les coordonnées (et transformations) d’un design sont mémorisées **au niveau du design** :`designs.position` (ou champ équivalent) au lieu d’être stockées **au niveau de l’association _Design ↔ Produit_**.

En conséquence :
- Une même instance `Design D` ne peut avoir qu’un seul set de coordonnées, partagé par *tous* les produits où il est utilisé.
- Toute mise à jour d’un `DesignPosition` écrase la précédente, entraînant le bug décrit.

## 3. Objectif
Garantir que chaque paire **(Product, Design)** possède ses propres paramètres de positionnement indépendants :
- X / Y
- Échelle, rotation, miroir, etc.
- Contrainte d’adaptive-positioning (si activée)

## 4. Proposition de solution technique
### 4.1. Nouveau schéma SQL
```sql
-- Table existante (simplifiée)
CREATE TABLE designs (
  id           SERIAL PRIMARY KEY,
  vendor_id    INTEGER NOT NULL,
  name         TEXT,
  -- suppression du champ de position global
  -- position   JSONB,
  ...
);

-- Table existante
CREATE TABLE products (
  id           SERIAL PRIMARY KEY,
  name         TEXT,
  ...
);

-- 🆕 TABLE pivot pour stocker le positionnement par produit
CREATE TABLE product_design_positions (
  product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  design_id       INTEGER NOT NULL REFERENCES designs(id)  ON DELETE CASCADE,
  position        JSONB NOT NULL DEFAULT '{}', -- {x, y, scale, rotation, constraints…}
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (product_id, design_id)
);

CREATE INDEX idx_pdp_product   ON product_design_positions(product_id);
CREATE INDEX idx_pdp_design    ON product_design_positions(design_id);
```
Migrer les anciennes données :
1. Boucler sur chaque design ayant une `position` globale.
2. Créer une ligne `product_design_positions` pour le(s) produit(s) déjà associés.
3. Supprimer le champ `designs.position`.

### 4.2. API REST/GraphQL
| Action | Endpoint | Méthode | Payload | Réponse |
|--------|----------|---------|---------|---------|
| Créer / mettre à jour la position | `/api/vendor-products/:productId/designs/:designId/position` | `PUT` | `{ x, y, scale, rotation, constraints }` | `{ success, data: { productId, designId, position } }` |
| Récupérer la position | `/api/vendor-products/:productId/designs/:designId/position` | `GET` | — | `{ success, data: { position } }` |
| Supprimer l’association (si design retiré) | `/api/vendor-products/:productId/designs/:designId/position` | `DELETE` | — | `{ success }` |

#### Exemple de `PUT`
```http
PUT /api/vendor-products/42/designs/17/position
Content-Type: application/json

{
  "x": 30,
  "y": 220,
  "scale": 0.8,
  "rotation": 15,
  "constraints": {
    "adaptive": true,
    "area": "front_chest"
  }
}
```

Réponse :
```json
{
  "success": true,
  "data": {
    "productId": 42,
    "designId": 17,
    "position": {
      "x": 30,
      "y": 220,
      "scale": 0.8,
      "rotation": 15,
      "constraints": {
        "adaptive": true,
        "area": "front_chest"
      }
    }
  }
}
```

### 4.3. Contraintes d’intégrité
1. **Clé primaire (product_id, design_id)** empêche les doublons.
2. `ON DELETE CASCADE` garantit le nettoyage automatique si un produit ou design est supprimé.
3. Vérification côté service : interdire la création si `(product_id, design_id)` existe déjà (retour 409 « Conflict »).

### 4.4. Impact sur la logique de duplication (front & back)
- Le front doit inclure `productId` dans toutes les requêtes de sauvegarde / lecture de position.
- Le service de détection de doublons compare :
  ```sql
  SELECT COUNT(*)
  FROM product_design_positions
  WHERE product_id = :productId
    AND design_id  = :designId;
  ```
  • `> 0` → design déjà utilisé dans le **même** produit → bloquer ou proposer repositionnement.
  • Dans d’autres produits, pas de blocage.

## 5. Plan de déploiement
1. **Migration DB** : ajouter table + migrer données + drop champ obsolète.
2. **MAJ back-end** : routes, modèles ORM, services.
3. **MAJ front-end** : inclure `productId` & gérer nouvelle réponse.
4. **Tests unitaires & d’intégration** :
   - Création, mise à jour, suppression de positions.
   - Concurrence : deux produits modifient simultanément le même design, positions restent isolées.
5. **Roll-back** : laisser le champ `designs.position` en lecture seule pendant une phase de transition de 48 h.

## 6. Checklist QA
- [ ] Créer P1 avec D à (120, 80) → enregistrer → OK.
- [ ] Créer P2 avec D à (30, 220) → enregistrer → OK.
- [ ] Recharger P1 → position reste (120, 80).
- [ ] Supprimer D de P2 → P1 inchangé.
- [ ] Duplication detection respecte la clé `(product_id, design_id)`.

---
**Référence** : ticket FRONT-1234 « Duplication décalage position » / issue GITHUB-#56

> Merci de valider la conception avant implémentation. 🎨✨ 