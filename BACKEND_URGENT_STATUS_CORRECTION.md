# 🚨 URGENT – Correction du statut produit après validation design

## 🎯 Problème constaté
Le frontend affiche :
```
Status: PENDING | Validé: Oui | Bouton: Caché
```

Cela signifie que le backend renvoie **incorrectement** :
- `status: "PENDING"`  ❌ 
- `isValidated: true`  ✅

**Mais selon le workflow "Mettre en brouillon", après validation admin, cela devrait être :**
- `status: "DRAFT"`    ✅
- `isValidated: true`  ✅

---

## ✅ Comportement correct requis

### Pour `forcedStatus: "DRAFT"` (Mettre en brouillon)
| Moment | Backend `status` | `isValidated` | Frontend affiche |
|--------|------------------|---------------|------------------|
| **Création** | `DRAFT` | `false` | "Brouillon" |
| **Après validation** | `DRAFT` | `true` | "Prêt à publier" + bouton |

### Pour `forcedStatus: "PENDING"` (Créer en attente) 
| Moment | Backend `status` | `isValidated` | Frontend affiche |
|--------|------------------|---------------|------------------|
| **Création** | `PENDING` | `false` | "En attente" |
| **Après validation** | `PUBLISHED` | `true` | "Publié" |

---

## 🛠️ Code à corriger dans la cascade de validation

```ts
// ❌ INCORRECT - Version actuelle probable
if (action === 'VALIDATE') {
  const products = await db.products.findAll({ where: { design_id: id } });
  
  for (const p of products) {
    // PROBLÈME : on met tous les produits en PUBLISHED ou on ignore forcedStatus
    await p.update({ status: 'PUBLISHED', is_validated: true });
  }
}
```

```ts
// ✅ CORRECT - Version fixée
if (action === 'VALIDATE') {
  const products = await db.products.findAll({ where: { design_id: id } });
  
  for (const p of products) {
    if (p.forced_status === 'PENDING') {
      // Auto-publication
      await p.update({ status: 'PUBLISHED', is_validated: true });
    } else if (p.forced_status === 'DRAFT') {
      // 🚀 CORRECTION : garder DRAFT, juste marquer validé
      await p.update({ is_validated: true });
      // NE PAS changer status !
    }
  }
}
```

---

## 🔍 Debug immédiat

1. **Vérifier la BDD** pour un produit créé "Mettre en brouillon" après validation :
   ```sql
   SELECT id, status, forced_status, is_validated 
   FROM products 
   WHERE design_id = 117;
   ```

2. **Résultat attendu** :
   ```
   id | status | forced_status | is_validated
   80 | DRAFT  | DRAFT        | true
   ```

3. **Si le résultat montre `status = PENDING`**, alors la cascade de validation ne respecte pas `forced_status`.

---

## ⚡ Test de validation

1. Créer un produit avec "Mettre en brouillon"
2. Valider le design dans l'interface admin
3. Vérifier que `GET /vendor/products` renvoie :
   ```json
   {
     "id": 80,
     "status": "DRAFT",
     "forcedStatus": "DRAFT", 
     "isValidated": true
   }
   ```

---

💡 **Le frontend fait son travail correctement**. Le problème est que le backend ne préserve pas `status: "DRAFT"` lors de la validation design. 