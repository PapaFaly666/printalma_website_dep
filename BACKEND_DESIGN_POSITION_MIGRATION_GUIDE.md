# 🛠️ Backend – Guide de Migration & Implémentation du Système « Design Position »

> Document à remettre à votre développeur backend – tout ce qu’il doit savoir pour mettre en place la **sauvegarde / chargement** précise des positions de design par produit vendeur.

---

## 1. Problématique

1. Le **frontend V2** envoie désormais les positions via des endpoints dédiés :
   - `GET  /api/vendor-products/:vendorProductId/designs/:designId/position/direct`
   - `PUT  /api/vendor-products/:vendorProductId/designs/:designId/position/direct`
2. L’ancien système stockait les transformations dans la table `vendor_design_transforms` (indexés par `transforms[0]`). Résultat :
   - Les anciens produits conservent la bonne position dans l’admin mais pas dans la nouvelle page V2 (`/vendeur/sell-design`).
   - Le frontend effectue automatiquement **une migration** : à la première lecture il convertit `transforms[0]` → nouvelle position et fait un `PUT /position/direct`. **Le backend doit donc accepter ce `PUT` même si aucune entrée n’existe encore.**
3. Les vendeurs pouvaient envoyer l’ID **baseProductId** (ex : 2) au lieu du véritable `vendorProduct.id` (ex : 37). Le backend doit effectuer un fallback.

---

## 2. Modèle de données recommandé

```
Table: design_positions

id              SERIAL PRIMARY KEY
vendor_product_id   INT NOT NULL REFERENCES vendor_products(id) ON DELETE CASCADE
vendor_id          INT NOT NULL REFERENCES vendors(id)           ON DELETE CASCADE
design_id          INT NOT NULL                                  -- peut rester à 1 si un seul design par produit
position_json      JSONB NOT NULL                                -- { x, y, scale, rotation, constraints }
created_at         TIMESTAMP DEFAULT now()
updated_at         TIMESTAMP DEFAULT now()
UNIQUE (vendor_product_id, design_id)
```

> Astuce : si vous n’avez qu’un design par produit, forcez `design_id = 1` et mettez un `CHECK (design_id = 1)`.

---

## 3. Endpoints REST

### 3.1 GET position directe

```
GET /api/vendor-products/:vendorProductId/designs/:designId/position/direct
```

Réponses :

*200 OK*
```json
{
  "success": true,
  "data": {
    "x": -20,
    "y": -60,
    "scale": 0.35,
    "rotation": 0,
    "constraints": {
      "adaptive": true,
      "area": "design-placement"
    }
  }
}
```

*404 Not Found* (pas de position)
```json
{
  "success": true,
  "data": null
}
```

*404* (mauvais ID)
```json
{
  "success": false,
  "error": "NOT_FOUND",
  "message": "Design introuvable",
  "debugInfo": {
    "requestedProductId": 2,
    "requestedDesignId": 1,
    "vendorId": 4,
    "suggestion": {
      "productId": 37,
      "designId": 1
    }
  }
}
```

Le champ `debugInfo.suggestion` est **lu par le frontend** : il ré-essaiera automatiquement avec ces IDs.

### 3.2 PUT position directe

```
PUT /api/vendor-products/:vendorProductId/designs/:designId/position/direct
Body: { x, y, scale, rotation, constraints }
```

Réponses :

*200 OK*
```json
{ "success": true, "message": "Position sauvegardée" }
```

*403* (le produit n’appartient pas au vendeur) → la classe `PositionDebugger` du front tentera une correction auto.

*404* (Produit introuvable)

	a. **Fallback** : Cherchez un `vendor_product` dont `baseProductId = :vendorProductId` *et* `vendorId = authVendorId`. Si trouvé ➡️ utilisez-le.

	b. Si toujours pas trouvé → retournez le JSON 404 avec `debugInfo` + `suggestion` (cf. GET).

---

## 4. Algorithme conseillé (middleware)

1. `vendorProductId = params.vendorProductId`  
   `designId        = params.designId`
2. Récupérer le vendeur courant (`authVendorId`).
3. Chercher `vendor_product` où `id = vendorProductId AND vendor_id = authVendorId`.
4. **Si nul** → *fallback baseProductId*.
5. **Si encore nul** → 404 + suggestion (listez éventuellement les IDs possibles).
6. Pour le **PUT**
   - `UPSERT` dans `design_positions`.
7. Pour le **GET**
   - Retourner `data = null` si aucune ligne.

---

## 5. Migration automatisée (facultatif côté backend)

Le frontend migre déjà, mais pour accélérer :

```sql
INSERT INTO design_positions (vendor_product_id, vendor_id, design_id, position_json)
SELECT vp.id, vp.vendor_id, 1, transforms->'0'
FROM vendor_products vp
JOIN vendor_design_transforms t ON t.vendor_product_id = vp.id
WHERE (transforms->'0') IS NOT NULL
ON CONFLICT (vendor_product_id, design_id) DO NOTHING;
```

---

## 6. Tests rapides (cURL)

```bash
# GET inexistante (doit renvoyer success true data null)
curl -b cookies.txt http://localhost:3004/api/vendor-products/51/designs/1/position/direct

# PUT position
authCookie=$(cat cookies.txt)
curl -X PUT -b "$authCookie" -H "Content-Type: application/json" \
  -d '{"x":0,"y":0,"scale":0.35,"rotation":0,"constraints":{"adaptive":true}}' \
  http://localhost:3004/api/vendor-products/51/designs/1/position/direct
```

---

## 7. Checklist finale

- [ ] Table `design_positions` créée + index `(vendor_product_id, design_id)`
- [ ] Endpoints GET/PUT opérationnels
- [ ] Fallback `baseProductId → vendorProductId` OK
- [ ] `debugInfo.suggestion` renvoyée en 404
- [ ] UPSERT sur `PUT`
- [ ] Tests manuels cURL passent
- [ ] Frontend V2 affiche correctement la position dans `/vendeur/sell-design`

Une fois ces points validés ✅, le problème d’affichage non fidèle sera résolu pour tous les produits existants et futurs. Bon code ! 🎉 
 