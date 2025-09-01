# 📑 Guide Backend – Gestion des produits **Brouillon** après validation design

> Version : Juin 2025  |  Auteur : Frontend Team

---

## 🎯 Problème constaté
Lorsque le vendeur choisit **« Mettre en brouillon »** :
1. Le frontend envoie `forcedStatus: "DRAFT"` lors de la création du produit.
2. Après validation admin du design, le backend **ne modifie pas** les champs de validation côté produit :
   * `isValidated` reste `false`
   * `designValidationStatus` absent ou ≠ `VALIDATED`

Conséquence : l'UI voit toujours un brouillon *non validé* ⇒ le bouton « Publier » n'apparaît pas.

---

## ✅ Comportement attendu
| Moment | Statut `status` | Champ `forcedStatus` | Champ `isValidated` | Champ `designValidationStatus` |
|--------|-----------------|----------------------|---------------------|--------------------------------|
| **Création** | `DRAFT` | `DRAFT` | `false` | `PENDING` ou `null` |
| **Après validation admin** | `DRAFT` _(inchangé)_ | `DRAFT` _(inchangé)_ | `true` | `VALIDATED` |

> 🚨 **Ne pas** changer `status` : il reste `DRAFT`. Seuls les champs de validation changent.

---

## 🛠️ Implémentation pas-à-pas

### 1. Stocker `forced_status` et `is_validated`
```sql
ALTER TABLE products
  ADD COLUMN forced_status VARCHAR(10) NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN is_validated BOOLEAN NOT NULL DEFAULT FALSE;
```

### 2. Cascade dans l'endpoint de validation design
Extrait de pseudo-code :
```ts
// Lors de la validation d'un design
if (action === 'VALIDATE') {
  await design.update({ status: 'VALIDATED', validated_at: new Date() });

  const products = await db.products.findAll({ where: { design_id: id } });

  for (const p of products) {
    if (p.forced_status === 'PENDING') {
      // Auto-publication
      await p.update({ status: 'PUBLISHED', is_validated: true });
    }
    if (p.forced_status === 'DRAFT') {
      // 🚀 CE CAS NOUS CONCERNE
      await p.update({ is_validated: true });
      // Option : enregistrer la date de validation
    }
  }

  return res.json({ success: true, affectedProducts: products.length });
}
```

### 3. Réponse API `GET /vendor/products`
Assurez-vous de retourner :
```jsonc
{
  "id": 99,
  "status": "DRAFT",
  "forcedStatus": "DRAFT",
  "isValidated": true,
  "designValidationStatus": "VALIDATED",
  ...
}
```
Le frontend se base **uniquement** sur ces deux clés pour afficher le badge « Prêt à publier ».

### 4. WebSocket / SSE (optionnel)
Envoyez un évènement `product.validated` ou `design.validated` avec la liste `affectedProductIds[]` pour rafraîchir instantanément l'UI.

---

## 🔬 Tests de validation
1. Créer un produit via `/vendeur/sell-design` en choisissant **Mettre en brouillon**.
2. Vérifier dans la BDD :
   * `status = DRAFT`
   * `forced_status = DRAFT`
   * `is_validated = FALSE`
3. Valider le design dans l'interface admin ou via l'endpoint `%PUT /api/designs/:id/validate`.
4. Re-vérifier :
   * `status` reste `DRAFT`
   * `is_validated` passe à `TRUE`
5. Appeler `GET /vendor/products` : les champs doivent refléter l'étape 4.
6. Dans l'UI vendeur, le bouton **Publier** doit être visible.

---

## ✅ À livrer
- Migration SQL (voir §1).
- Mise à jour du service de cascade (voir §2).
- Ajout des champs dans la sérialisation `GET /vendor/products`.
- (Optionnel) Évènement temps réel.

---

💡 **Rappel** : Seule la clé `isValidated` (ou `designValidationStatus = 'VALIDATED'`) déclenche le bouton « Publier » côté front. Si vous rencontrez le même symptôme, vérifiez précisément ces champs. 