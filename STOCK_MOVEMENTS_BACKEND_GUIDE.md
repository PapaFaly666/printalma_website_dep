# Guide d'implémentation Backend - Système de Mouvements de Stock

## 📋 Vue d'ensemble

Le frontend a été mis à jour pour gérer les **entrées** et **sorties** de stock avec un système d'historique complet. Ce guide décrit les endpoints et la structure de base de données nécessaires côté backend.

## 🗄️ Structure de base de données

### Nouvelle table : `stock_movements`

```sql
CREATE TABLE stock_movements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  color_id INT NOT NULL,
  size_name VARCHAR(50) NOT NULL,
  type ENUM('IN', 'OUT') NOT NULL,
  quantity INT NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INT,  -- ID de l'utilisateur (optionnel)

  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (color_id) REFERENCES product_color_variations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_product (product_id),
  INDEX idx_created_at (created_at DESC)
);
```

### Modification de la table `product_stocks`

La table existante `product_stocks` reste inchangée mais sera mise à jour automatiquement par les mouvements.

## 🔌 Endpoints à implémenter

### 1. Enregistrer un mouvement de stock

**Endpoint :** `POST /products/:productId/stocks/movement`

**Description :** Enregistre une entrée ou sortie de stock et met à jour le stock actuel.

**Headers :**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body :**
```json
{
  "colorId": 15,
  "sizeName": "M",
  "type": "IN",  // ou "OUT"
  "quantity": 50,
  "reason": "Réception fournisseur XYZ"  // optionnel
}
```

**Validation :**
- `type` : Doit être "IN" ou "OUT"
- `quantity` : Entier positif > 0
- Pour type "OUT" : vérifier que le stock actuel >= quantity

**Logique :**
1. Vérifier que le produit existe
2. Vérifier que la couleur appartient au produit
3. Si type = "OUT", vérifier stock suffisant :
   ```sql
   SELECT stock FROM product_stocks
   WHERE product_id = ? AND color_id = ? AND size_name = ?
   ```
4. Créer l'enregistrement dans `stock_movements`
5. Mettre à jour le stock dans `product_stocks` :
   - Si type = "IN" : `stock = stock + quantity`
   - Si type = "OUT" : `stock = stock - quantity`

**Réponse succès (200) :**
```json
{
  "success": true,
  "message": "Mouvement de stock enregistré",
  "data": {
    "movement": {
      "id": 123,
      "productId": 45,
      "colorId": 15,
      "sizeName": "M",
      "type": "IN",
      "quantity": 50,
      "reason": "Réception fournisseur XYZ",
      "createdAt": "2025-10-03T14:30:00Z"
    },
    "newStock": 150
  }
}
```

**Erreurs possibles :**
- 400 : Validation échouée, type invalide, quantité invalide
- 404 : Produit ou couleur introuvable
- 409 : Stock insuffisant pour une sortie

---

### 2. Récupérer l'historique des mouvements

**Endpoint :** `GET /products/:productId/stocks/history`

**Description :** Récupère l'historique paginé des mouvements de stock pour un produit.

**Headers :**
```
Authorization: Bearer <token>
```

**Query Parameters :**
- `colorId` (optionnel) : Filtrer par couleur
- `sizeName` (optionnel) : Filtrer par taille
- `type` (optionnel) : Filtrer par type ("IN" ou "OUT")
- `limit` (optionnel, défaut: 20) : Nombre d'éléments par page
- `offset` (optionnel, défaut: 0) : Décalage pour la pagination

**Exemple :**
```
GET /products/45/stocks/history?colorId=15&limit=20&offset=0
```

**Requête SQL (exemple) :**
```sql
SELECT
  sm.id,
  sm.product_id,
  p.name AS product_name,
  sm.color_id,
  pcv.name AS color_name,
  sm.size_name,
  sm.type,
  sm.quantity,
  sm.reason,
  sm.created_at,
  u.name AS created_by
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
JOIN product_color_variations pcv ON sm.color_id = pcv.id
LEFT JOIN users u ON sm.created_by = u.id
WHERE sm.product_id = ?
  AND (? IS NULL OR sm.color_id = ?)
  AND (? IS NULL OR sm.size_name = ?)
  AND (? IS NULL OR sm.type = ?)
ORDER BY sm.created_at DESC
LIMIT ? OFFSET ?
```

**Réponse succès (200) :**
```json
{
  "success": true,
  "data": {
    "movements": [
      {
        "id": 125,
        "productId": 45,
        "productName": "T-shirt Premium",
        "colorId": 15,
        "colorName": "Bleu Marine",
        "sizeName": "M",
        "type": "IN",
        "quantity": 50,
        "reason": "Réception fournisseur XYZ",
        "createdAt": "2025-10-03T14:30:00Z",
        "createdBy": "Admin"
      },
      {
        "id": 124,
        "productId": 45,
        "productName": "T-shirt Premium",
        "colorId": 15,
        "colorName": "Bleu Marine",
        "sizeName": "M",
        "type": "OUT",
        "quantity": 10,
        "reason": "Commande #12345",
        "createdAt": "2025-10-02T10:15:00Z",
        "createdBy": "Système"
      }
    ],
    "total": 47,
    "limit": 20,
    "offset": 0
  }
}
```

**Erreurs possibles :**
- 400 : Paramètres invalides
- 404 : Produit introuvable

---

## 🔄 Intégration avec le système existant

### Modification des ventes/commandes

Lorsqu'une commande est validée, créer automatiquement des mouvements de sortie :

```javascript
// Exemple lors de la validation d'une commande
async function processOrder(orderId) {
  const order = await getOrder(orderId);

  for (const item of order.items) {
    await createStockMovement({
      productId: item.productId,
      colorId: item.colorId,
      sizeName: item.sizeName,
      type: 'OUT',
      quantity: item.quantity,
      reason: `Commande #${orderId}`,
      createdBy: order.customerId
    });
  }
}
```

### Migration des données existantes (optionnel)

Si vous avez déjà des données de stock, vous pouvez créer des mouvements initiaux :

```sql
INSERT INTO stock_movements (product_id, color_id, size_name, type, quantity, reason, created_at)
SELECT
  product_id,
  color_id,
  size_name,
  'IN',
  stock,
  'Stock initial',
  NOW()
FROM product_stocks
WHERE stock > 0;
```

---

## 🧪 Tests recommandés

### Test 1 : Entrée de stock
```bash
POST /products/1/stocks/movement
{
  "colorId": 1,
  "sizeName": "L",
  "type": "IN",
  "quantity": 100,
  "reason": "Réception"
}
# Vérifier que le stock augmente de 100
```

### Test 2 : Sortie de stock valide
```bash
POST /products/1/stocks/movement
{
  "colorId": 1,
  "sizeName": "L",
  "type": "OUT",
  "quantity": 20,
  "reason": "Vente"
}
# Vérifier que le stock diminue de 20
```

### Test 3 : Sortie avec stock insuffisant
```bash
POST /products/1/stocks/movement
{
  "colorId": 1,
  "sizeName": "L",
  "type": "OUT",
  "quantity": 999999
}
# Doit retourner une erreur 409
```

### Test 4 : Récupération de l'historique
```bash
GET /products/1/stocks/history?limit=10&offset=0
# Doit retourner les 10 derniers mouvements
```

---

## 📊 Rapports et statistiques (bonus)

### Endpoint bonus : Statistiques de mouvements

**Endpoint :** `GET /products/:productId/stocks/stats`

**Réponse :**
```json
{
  "success": true,
  "data": {
    "totalIn": 500,
    "totalOut": 350,
    "currentStock": 150,
    "lastMovement": {
      "type": "IN",
      "quantity": 50,
      "createdAt": "2025-10-03T14:30:00Z"
    },
    "movementsByType": {
      "IN": 15,
      "OUT": 32
    }
  }
}
```

---

## 🔒 Sécurité

1. **Authentification :** Tous les endpoints nécessitent un token valide
2. **Autorisation :**
   - Seuls les admins peuvent créer des mouvements manuels
   - Les vendeurs ne peuvent voir que leurs produits
3. **Validation stricte :**
   - Empêcher les quantités négatives
   - Empêcher les sorties supérieures au stock
4. **Audit trail :** Enregistrer `created_by` pour traçabilité

---

## 📝 Checklist d'implémentation

- [ ] Créer la table `stock_movements`
- [ ] Implémenter `POST /products/:id/stocks/movement`
  - [ ] Validation des données
  - [ ] Vérification du stock pour OUT
  - [ ] Transaction atomique (insertion + update)
  - [ ] Gestion des erreurs
- [ ] Implémenter `GET /products/:id/stocks/history`
  - [ ] Pagination
  - [ ] Filtres (colorId, sizeName, type)
  - [ ] Jointures pour récupérer les noms
- [ ] Tests unitaires et d'intégration
- [ ] Documentation API (Swagger/OpenAPI)
- [ ] Intégration avec le système de commandes

---

## 🚀 Appels frontend correspondants

Le frontend utilise ces fonctions (déjà implémentées) :

```typescript
// Entrée de stock
await stockIn(productId, colorId, sizeName, quantity, reason);

// Sortie de stock
await stockOut(productId, colorId, sizeName, quantity, reason);

// Récupération de l'historique
const { movements, total } = await getStockHistory(productId, {
  colorId: 15,
  limit: 20,
  offset: 0
});
```

---

## 📞 Support

Pour toute question sur l'implémentation frontend ou les contrats d'API, consultez :
- [stockService.ts](src/services/stockService.ts:511-609) - Fonctions API
- [AdminStockManagement.tsx](src/pages/admin/AdminStockManagement.tsx:157-277) - Utilisation dans l'UI
