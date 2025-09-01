# 🛠️ Guide Backend – Cascade Validation Design → Produits

## 1. Objectif
Lorsque l'admin valide un **design**, tous les produits qui utilisent ce design doivent :
1. Mettre à jour le champ `designValidationStatus` à `VALIDATED` ou `isValidated = true`.
2. Mettre à jour leur `status` selon le workflow initial choisi par le vendeur :
   | Statut initial | Champ `forcedStatus` envoyé par le frontend | Après validation admin |
   |----------------|--------------------------------------------|------------------------|
   | `PENDING`      | `"PENDING"`                                | **`PUBLISHED`**        |
   | `DRAFT`       | `"DRAFT"`                                  | **`DRAFT`** (reste⠀brouillon) |

Le frontend attend ces indicateurs pour afficher correctement badges et boutons.

---

## 2. Schémas de données

### 2.1 Table `designs`
| Colonne | Type | Commentaire |
|---------|------|-------------|
| `id` | INT (PK) | |
| `status` | ENUM('PENDING','VALIDATED','REJECTED') | ✔️ Changer sur validation |
| `validated_at` | DATETIME NULL | |

### 2.2 Table `products`
| Colonne | Type | Commentaire |
|---------|------|-------------|
| `forced_status` | ENUM('DRAFT','PENDING') | reçu du frontend |
| `status` | ENUM('DRAFT','PENDING','PUBLISHED') | affiché dans UI |
| `design_id` | INT FK → designs.id | |
| `is_validated` | BOOL | ✅ nouvelle colonne OU vue virtuelle |

---

## 3. Endpoint `PUT /api/designs/:id/validate`

```
PUT /api/designs/42/validate
{
  "action": "VALIDATE" | "REJECT",
  "rejectionReason": "..."   // optionnel si REJECT
}
```
### 3.1 Traitement côté serveur
```ts
// pseudo-code TypeScript / Node
async function validateDesign(req, res) {
  const { id } = req.params;
  const { action, rejectionReason } = req.body;

  const design = await db.designs.findByPk(id);
  if (!design) return res.status(404).json({ error: 'Design not found' });

  if (action === 'VALIDATE') {
    await design.update({ status: 'VALIDATED', validated_at: new Date() });

    // 👉 Cascade sur les produits liés
    const products = await db.products.findAll({ where: { design_id: id } });

    for (const p of products) {
      if (p.forced_status === 'PENDING') {
        await p.update({ status: 'PUBLISHED', is_validated: true });
      }
      if (p.forced_status === 'DRAFT') {
        await p.update({ is_validated: true }); // reste DRAFT
      }
    }

    return res.json({ success: true, affectedProducts: products.length, newStatus: 'VALIDATED' });
  }

  if (action === 'REJECT') {
    await design.update({ status: 'REJECTED', rejection_reason: rejectionReason });

    // Tous les produits retournent en DRAFT non-validé
    await db.products.update({ status: 'DRAFT', is_validated: false }, { where: { design_id: id } });

    return res.json({ success: true, affectedProducts: await db.products.count({ where: { design_id: id } }), newStatus: 'REJECTED' });
  }

  res.status(400).json({ error: 'Invalid action' });
}
```

---

## 4. Endpoint `GET /vendor/products`
### Réponse minimale attendue
```json
[
  {
    "id": 80,
    "name": "Tshirt",
    "status": "DRAFT",        // PUBLISHED / PENDING / DRAFT
    "forcedStatus": "DRAFT",   // stocké côté backend
    "isValidated": true,        // ⚠️ clé indispensable pour bouton Publier
    "designValidationStatus": "VALIDATED", // redondant mais pratique
    ...
  }
]
```
*   `isValidated = true` doit être renvoyé dès que le design est validé.
*   Pour les produits auto-publiés, renvoyez directement `status = "PUBLISHED"`.

---

## 5. Migrations SQL (exemple PostgreSQL)
```sql
-- Ajout colonne forced_status & is_validated
ALTER TABLE products ADD COLUMN forced_status VARCHAR(10);
ALTER TABLE products ADD COLUMN is_validated BOOLEAN DEFAULT FALSE;

-- Index pour requêtes cascade
CREATE INDEX idx_products_design_id ON products(design_id);
```

---

## 6. Tests à effectuer
1. Créer produits via frontend avec `forcedStatus: 'PENDING'`.
2. Valider le design → vérifier que `products.status = 'PUBLISHED'`.
3. Créer produits avec `forcedStatus: 'DRAFT'`.
4. Valider le design → vérifier `is_validated = true` **sans** changer `status`.
5. `GET /vendor/products` doit refléter ces valeurs.

---

## 7. Checklist DevOps
- [ ] Migration appliquée en production.
- [ ] Permissions mises à jour pour endpoint `/api/designs/:id/validate`.
- [ ] Tests unitaires & e2e pour la cascade.
- [ ] Documentation API mise à jour.

---

### En résumé
Ajoutez un champ `is_validated` (ou un alias `designValidationStatus`) dans la réponse des produits et appliquez la **cascade** décrite ci-dessus. Le frontend affichera alors correctement le badge « Prêt à publier » et le bouton « Publier maintenant ». 