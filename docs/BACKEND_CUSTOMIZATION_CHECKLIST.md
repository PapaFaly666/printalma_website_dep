# ✅ Checklist Backend : Customisations dans les Commandes

## 🎯 Checklist d'implémentation rapide

### 1. Schéma de base de données

- [ ] Ajouter les colonnes à `order_items` :
  ```sql
  ALTER TABLE order_items ADD COLUMN customization_id INTEGER;
  ALTER TABLE order_items ADD COLUMN customization_ids JSONB;
  ALTER TABLE order_items ADD COLUMN design_elements_by_view JSONB;
  ```

- [ ] Index pour performance :
  ```sql
  CREATE INDEX idx_order_items_customization_ids ON order_items USING gin(customization_ids);
  CREATE INDEX idx_order_items_design_elements ON order_items USING gin(design_elements_by_view);
  ```

### 2. Endpoint de création de commande

#### Route `/orders` (utilisateur authentifié)
- [ ] Accepter `customizationId`, `customizationIds`, `designElementsByView` dans `orderItems`
- [ ] Valider la structure de `customizationIds` (format `"colorId-viewId": id`)
- [ ] Valider la structure de `designElementsByView`
- [ ] Enregistrer dans `order_items.customization_ids` (JSONB)
- [ ] Enregistrer dans `order_items.design_elements_by_view` (JSONB)
- [ ] Mettre à jour `customizations.order_id` pour chaque ID dans `customizationIds`
- [ ] Mettre à jour `customizations.status = 'ORDERED'`

#### Route `/orders/guest` (utilisateur non authentifié)
- [ ] Même logique que `/orders`
- [ ] Vérifier que les customizations appartiennent à la `sessionId`

### 3. Validation des données

```javascript
function validateOrderItem(item) {
  // ✅ Vérifier productId
  if (!item.productId || item.productId <= 0) {
    throw new Error('productId invalide');
  }

  // ✅ Vérifier customizationIds si présent
  if (item.customizationIds) {
    for (const [key, value] of Object.entries(item.customizationIds)) {
      // Format attendu: "1-5" (colorId-viewId)
      if (!/^\d+-\d+$/.test(key)) {
        throw new Error(`Format invalide pour customizationIds: "${key}"`);
      }
      if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`ID invalide: ${value}`);
      }
    }
  }

  // ✅ Vérifier designElementsByView si présent
  if (item.designElementsByView) {
    for (const [viewKey, elements] of Object.entries(item.designElementsByView)) {
      if (!Array.isArray(elements)) {
        throw new Error(`designElementsByView["${viewKey}"] doit être un tableau`);
      }
      elements.forEach(elem => {
        if (!['text', 'image'].includes(elem.type)) {
          throw new Error(`Type invalide: ${elem.type}`);
        }
        if (elem.type === 'text' && !elem.text) {
          throw new Error('Texte manquant');
        }
        if (elem.type === 'image' && !elem.imageUrl) {
          throw new Error('URL image manquante');
        }
      });
    }
  }

  return true;
}
```

### 4. Insertion dans la base de données

```javascript
// Exemple avec Sequelize/TypeORM
async function createOrderItem(orderId, itemData, transaction) {
  // 1. Créer l'order item
  const orderItem = await OrderItem.create({
    orderId: orderId,
    productId: itemData.productId,
    quantity: itemData.quantity,
    unitPrice: itemData.unitPrice,
    size: itemData.size,
    color: itemData.color,
    colorId: itemData.colorId,

    // Customisations
    customizationId: itemData.customizationId || null,
    customizationIds: itemData.customizationIds || null,
    designElementsByView: itemData.designElementsByView || null,
  }, { transaction });

  // 2. Mettre à jour les customizations
  if (itemData.customizationIds) {
    const ids = Object.values(itemData.customizationIds);

    await Customization.update(
      {
        orderId: orderId,
        status: 'ORDERED'
      },
      {
        where: { id: { [Op.in]: ids } },
        transaction
      }
    );
  }

  return orderItem;
}
```

### 5. Récupération pour affichage

```javascript
async function getOrderWithCustomizations(orderId) {
  const order = await Order.findByPk(orderId, {
    include: [{
      model: OrderItem,
      as: 'orderItems',
      include: [{ model: Product, as: 'product' }]
    }]
  });

  // Enrichir avec les détails de customization
  for (const item of order.orderItems) {
    if (item.customizationIds) {
      const ids = Object.values(item.customizationIds);
      item.customizations = await Customization.findAll({
        where: { id: { [Op.in]: ids } }
      });
    }
  }

  return order;
}
```

### 6. Tests

- [ ] Test 1 : Commande simple avec 1 vue
- [ ] Test 2 : Commande avec 2 vues (devant + arrière)
- [ ] Test 3 : Commande avec 3+ vues
- [ ] Test 4 : Commande sans customisation (rétro-compatibilité)
- [ ] Test 5 : Commande guest avec customisation
- [ ] Test 6 : Validation des données invalides
- [ ] Test 7 : Vérification que `customizations.order_id` est bien mis à jour
- [ ] Test 8 : Vérification que `customizations.status` passe à 'ORDERED'

### 7. Réponse API

Format de réponse attendu :

```json
{
  "success": true,
  "message": "Commande créée avec succès",
  "data": {
    "id": 123,
    "orderNumber": "ORD-2025-ABC123",
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "totalAmount": 15000,
    "payment": {
      "token": "...",
      "redirect_url": "https://...",
      "mode": "test"
    }
  }
}
```

---

## 🔍 Vérifications post-implémentation

### Vérifier les données dans la BDD

```sql
-- Vérifier qu'un order_item a bien ses customisations
SELECT
  id,
  customization_id,
  customization_ids,
  jsonb_object_keys(design_elements_by_view) AS views_with_elements
FROM order_items
WHERE order_id = 123;
```

### Vérifier que les customizations sont liées

```sql
-- Les customizations doivent avoir order_id rempli et status = 'ORDERED'
SELECT
  id,
  order_id,
  status,
  view_id
FROM customizations
WHERE id IN (
  SELECT jsonb_object_keys(customization_ids)::integer
  FROM order_items
  WHERE order_id = 123
);
```

### Statistiques

```sql
-- Vérifier le taux de customisation
SELECT
  COUNT(*) AS total_items,
  COUNT(CASE WHEN customization_ids IS NOT NULL THEN 1 END) AS customized_items,
  ROUND(
    COUNT(CASE WHEN customization_ids IS NOT NULL THEN 1 END)::numeric
    / COUNT(*)::numeric * 100,
    2
  ) AS customization_rate
FROM order_items
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
```

---

## 🚨 Points critiques

### ⚠️ NE PAS OUBLIER

1. **Transaction SQL** : Utiliser une transaction pour garantir la cohérence
2. **Mise à jour de customizations** : Ne pas oublier de mettre à jour `order_id` et `status`
3. **Validation** : Valider la structure avant insertion
4. **Type JSONB** : Utiliser `JSONB` et non `JSON` pour meilleures performances
5. **Logs** : Logger les customisations pour debug

### ✅ BONNES PRATIQUES

1. ✅ Utiliser des transactions
2. ✅ Valider les données côté backend (ne pas faire confiance au frontend)
3. ✅ Créer des index sur les colonnes JSONB
4. ✅ Tester avec des données réelles
5. ✅ Logger les erreurs de validation

---

## 📚 Ressources

- **Guide complet** : `BACKEND_ORDER_CUSTOMIZATION_GUIDE.md`
- **Exemples d'API** : `BACKEND_CUSTOMIZATION_API_EXAMPLES.md`
- **Documentation customisations** : `BACKEND_CUSTOMIZATION_README.md`

---

**Version** : 1.0
**Date** : 2025-01-17
**Priorité** : HAUTE ⚡
