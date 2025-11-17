# 📚 Guide d'Intégration Backend : Système de Customisation

## 🎯 Objectif

Ce guide vous aide à intégrer le système de customisation de produits dans votre backend. Lorsqu'un client crée une commande avec des produits personnalisés, vous devez enregistrer ces données pour :
- ✅ Conserver l'historique des personnalisations
- ✅ Permettre la reproduction du produit
- ✅ Afficher les détails dans l'interface admin
- ✅ Générer les mockups pour la production

---

## 📖 Documentation disponible

### 🚀 **Démarrage rapide**
📄 **[BACKEND_CUSTOMIZATION_CHECKLIST.md](./BACKEND_CUSTOMIZATION_CHECKLIST.md)**
- Checklist complète des étapes d'implémentation
- Points critiques à ne pas oublier
- Tests à effectuer
- ⏱️ Temps de lecture : 5 minutes
- 🎯 **Commencez ici si vous êtes pressé**

### 📘 **Guide complet**
📄 **[BACKEND_ORDER_CUSTOMIZATION_GUIDE.md](./BACKEND_ORDER_CUSTOMIZATION_GUIDE.md)**
- Structure détaillée des données reçues
- Schéma de base de données complet
- Exemples de code (Node.js/TypeScript)
- Validation des données
- Requêtes SQL
- ⏱️ Temps de lecture : 20 minutes
- 🎯 **Référence complète pour l'implémentation**

### 📝 **Exemples d'API**
📄 **[BACKEND_CUSTOMIZATION_API_EXAMPLES.md](./BACKEND_CUSTOMIZATION_API_EXAMPLES.md)**
- Exemples de requêtes/réponses JSON
- Cas d'usage réels
- Commandes de test (curl)
- Requêtes SQL pour debugging
- Statistiques utiles
- ⏱️ Temps de lecture : 15 minutes
- 🎯 **Parfait pour les tests et le debugging**

### 🔄 **Flux de traitement**
📄 **[BACKEND_CUSTOMIZATION_FLOW.md](./BACKEND_CUSTOMIZATION_FLOW.md)**
- Diagramme de flux complet
- État des données à chaque étape
- Cas d'usage détaillés
- Optimisations de performance
- Logs recommandés
- ⏱️ Temps de lecture : 10 minutes
- 🎯 **Visualisation du processus complet**

---

## ⚡ Quick Start (5 minutes)

### Étape 1 : Modifications de la base de données

```sql
-- Ajouter les colonnes nécessaires à order_items
ALTER TABLE order_items
ADD COLUMN customization_id INTEGER,
ADD COLUMN customization_ids JSONB,
ADD COLUMN design_elements_by_view JSONB;

-- Créer les index pour performance
CREATE INDEX idx_order_items_customization_ids
ON order_items USING gin(customization_ids);

CREATE INDEX idx_order_items_design_elements
ON order_items USING gin(design_elements_by_view);
```

### Étape 2 : Code minimal (Node.js/TypeScript)

```javascript
// Dans votre controller de création de commande
async function createOrder(req, res) {
  const { orderItems, ...orderData } = req.body;

  await sequelize.transaction(async (transaction) => {
    // 1. Créer la commande
    const order = await Order.create(orderData, { transaction });

    // 2. Pour chaque item
    for (const itemData of orderItems) {
      // Créer l'order_item avec les customisations
      await OrderItem.create({
        orderId: order.id,
        productId: itemData.productId,
        quantity: itemData.quantity,
        unitPrice: itemData.unitPrice,
        size: itemData.size,
        color: itemData.color,

        // 🎨 CUSTOMISATIONS - ESSENTIEL
        customizationId: itemData.customizationId,
        customizationIds: itemData.customizationIds,
        designElementsByView: itemData.designElementsByView,
      }, { transaction });

      // 🔗 Lier les customizations à la commande
      if (itemData.customizationIds) {
        const ids = Object.values(itemData.customizationIds);

        await Customization.update(
          { orderId: order.id, status: 'ORDERED' },
          { where: { id: { [Op.in]: ids } }, transaction }
        );
      }
    }

    return order;
  });
}
```

### Étape 3 : Tester

```bash
# Test avec curl
curl -X POST http://localhost:3004/orders/guest \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "shippingDetails": {...},
    "phoneNumber": "77 000 00 00",
    "orderItems": [{
      "productId": 1,
      "quantity": 1,
      "unitPrice": 10000,
      "size": "M",
      "color": "Blanc",
      "customizationId": 100,
      "customizationIds": {"1-5": 100},
      "designElementsByView": {
        "1-5": [{
          "id": "text-1",
          "type": "text",
          "text": "TEST",
          "x": 0.5,
          "y": 0.5,
          "width": 100,
          "height": 50,
          "fontSize": 24,
          "fontFamily": "Arial",
          "color": "#000000",
          "zIndex": 1
        }]
      }
    }],
    "paymentMethod": "CASH_ON_DELIVERY"
  }'
```

---

## 📦 Structure des données principales

### Données reçues du frontend

```typescript
{
  orderItems: [{
    // Base
    productId: number,
    quantity: number,
    unitPrice: number,
    size: string,
    color: string,

    // 🎨 CUSTOMISATION (NOUVEAU)
    customizationId: number,           // ID principal
    customizationIds: {                 // Tous les IDs par vue
      "1-5": 456,                      // colorId-viewId: customizationId
      "1-6": 457
    },
    designElementsByView: {             // Éléments de design par vue
      "1-5": [                         // Array d'éléments pour cette vue
        {
          type: "text" | "image",
          text?: string,
          imageUrl?: string,
          x: number,                    // 0-1 (pourcentage)
          y: number,                    // 0-1 (pourcentage)
          width: number,                // pixels
          height: number,               // pixels
          rotation: number,             // degrés
          fontSize?: number,
          fontFamily?: string,
          color?: string,
          zIndex: number
        }
      ]
    }
  }]
}
```

### À enregistrer dans `order_items`

| Colonne | Type | Description |
|---------|------|-------------|
| `customization_id` | INTEGER | ID principal (première vue) |
| `customization_ids` | JSONB | **Objet** `{"1-5": 456, "1-6": 457}` |
| `design_elements_by_view` | JSONB | **Objet** avec arrays d'éléments par vue |

---

## ✅ Checklist d'implémentation

- [ ] Ajouter les colonnes à `order_items`
- [ ] Créer les index JSONB
- [ ] Modifier le code de création de commande
- [ ] Enregistrer `customizationIds` et `designElementsByView`
- [ ] Mettre à jour `customizations.order_id`
- [ ] Mettre à jour `customizations.status = 'ORDERED'`
- [ ] Utiliser des transactions SQL
- [ ] Valider la structure des données
- [ ] Tester avec 1 vue
- [ ] Tester avec 2+ vues
- [ ] Vérifier que les données sont bien enregistrées
- [ ] Vérifier que les customizations sont bien liées

---

## 🔍 Vérification rapide

Après avoir créé une commande, vérifiez :

```sql
-- 1. Les données sont bien enregistrées
SELECT customization_ids, design_elements_by_view
FROM order_items
WHERE order_id = <votre_order_id>;

-- 2. Les customizations sont bien liées
SELECT id, order_id, status
FROM customizations
WHERE id IN (
  SELECT jsonb_object_keys(customization_ids)::integer
  FROM order_items
  WHERE order_id = <votre_order_id>
);
```

Résultat attendu :
- `customization_ids` : `{"1-5": 456, "1-6": 457}`
- `design_elements_by_view` : Objet JSON avec les éléments
- Les customizations ont `order_id` rempli et `status = 'ORDERED'`

---

## 🚨 Erreurs courantes

### ❌ Erreur 1 : Ne pas enregistrer `customizationIds`
```javascript
// MAUVAIS
await OrderItem.create({
  customizationId: itemData.customizationId,
  // ❌ Manque customizationIds et designElementsByView
});
```

**Solution** : Enregistrer les deux champs
```javascript
// BON
await OrderItem.create({
  customizationId: itemData.customizationId,
  customizationIds: itemData.customizationIds,          // ✅
  designElementsByView: itemData.designElementsByView,  // ✅
});
```

### ❌ Erreur 2 : Oublier de lier les customizations
```javascript
// MAUVAIS : Les customizations restent avec status='DRAFT'
await OrderItem.create({...});
// ❌ Pas de UPDATE des customizations
```

**Solution** : Mettre à jour après création
```javascript
// BON
await OrderItem.create({...});

if (itemData.customizationIds) {
  const ids = Object.values(itemData.customizationIds);
  await Customization.update(
    { orderId: order.id, status: 'ORDERED' },
    { where: { id: { [Op.in]: ids } } }
  );  // ✅
}
```

### ❌ Erreur 3 : Pas de transaction
```javascript
// MAUVAIS : Risque d'incohérence
const order = await Order.create({...});
await OrderItem.create({...});
await Customization.update({...});
```

**Solution** : Utiliser une transaction
```javascript
// BON
await sequelize.transaction(async (t) => {
  const order = await Order.create({...}, { transaction: t });
  await OrderItem.create({...}, { transaction: t });
  await Customization.update({...}, { transaction: t });
});  // ✅
```

---

## 📞 Support et questions

### Structure des fichiers de documentation

```
docs/
├── BACKEND_INTEGRATION_README.md        ← Vous êtes ici
├── BACKEND_CUSTOMIZATION_CHECKLIST.md   ← Checklist rapide
├── BACKEND_ORDER_CUSTOMIZATION_GUIDE.md ← Guide complet
├── BACKEND_CUSTOMIZATION_API_EXAMPLES.md← Exemples d'API
└── BACKEND_CUSTOMIZATION_FLOW.md        ← Diagrammes de flux
```

### Ordre de lecture recommandé

1. 📄 **Ce fichier (README)** - Vue d'ensemble
2. ✅ **CHECKLIST** - Steps d'implémentation
3. 📘 **GUIDE** - Détails techniques
4. 📝 **EXEMPLES** - Cas d'usage réels
5. 🔄 **FLOW** - Visualisation

### En cas de problème

1. Vérifier la checklist
2. Consulter les exemples d'API
3. Examiner le flux de traitement
4. Vérifier les logs dans la console
5. Tester avec les exemples curl fournis

---

## 🎉 Résumé

### Ce que vous devez faire

1. ✅ Ajouter 3 colonnes à `order_items`
2. ✅ Créer 2 index JSONB
3. ✅ Enregistrer `customizationIds` et `designElementsByView` lors de la création de commande
4. ✅ Mettre à jour les customizations (order_id, status)
5. ✅ Utiliser des transactions

### Ce que vous recevrez

```json
{
  "customizationId": 456,
  "customizationIds": {"1-5": 456, "1-6": 457},
  "designElementsByView": {
    "1-5": [{...}],
    "1-6": [{...}]
  }
}
```

### Ce que vous devez stocker

- Dans `order_items.customization_ids` (JSONB)
- Dans `order_items.design_elements_by_view` (JSONB)
- Mettre à jour `customizations` avec `order_id` et `status='ORDERED'`

---

**Date de création** : 2025-01-17
**Version** : 1.0
**Compatibilité frontend** : CustomerProductCustomizationPageV3, CartSidebar, OrderFormPage, ModernOrderFormPage

**Temps d'implémentation estimé** : 1-2 heures
**Complexité** : ⭐⭐ (Moyenne)
