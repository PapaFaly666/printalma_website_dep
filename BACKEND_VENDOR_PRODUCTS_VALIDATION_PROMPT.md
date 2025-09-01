# 📑 Spécification API – Vendor Products & Validation Design (v2.0)

Ce document décrit les champs **obligatoires** que l'API backend doit renvoyer dans la route :

```
GET /api/vendor/products
```

afin que le frontend puisse afficher correctement l'état des produits liés à un design.

---
## 1. Champs minimum requis par produit

| Champ | Type | Exemple | Description |
|-------|------|---------|-------------|
| `id` | number | 42 | Identifiant du produit vendeur |
| `designId` | number \| null | 99 | Identifiant du design lié. `null` si aucun design. |
| `status` | string | `PUBLISHED` \| `PENDING` \| `DRAFT` | Statut métier côté vendeur. <br/>• `PENDING` = produit bloqué car design non validé <br/>• `PUBLISHED` = produit actif <br/>• `DRAFT` = brouillon |
| `isValidated` | boolean | `true` | Renvoie **true** uniquement si le design référencé a été approuvé par l'admin. |
| `submittedForValidationAt` | ISO date \| null | `2024-05-03T14:01:22Z` | Date d'envoi en validation. Permet d'afficher le badge « En attente ». |
| `rejectionReason` | string \| null | `"Design flou"` | Raison du rejet fournie par l'admin. S'affiche dans le badge rouge. |

> Remarque : ces champs concernent l'entité *produit vendeur* (pas le produit catalogue). Le frontend se base sur eux pour déterminer le badge d'état.

---
## 2. Règles de gestion

1. **Création produit avec design non validé**  
   • `status` = `PENDING`  
   • `isValidated` = `false`  
   • `submittedForValidationAt` = date actuelle  
   • `rejectionReason` = `null`

2. **Après validation du design**  
   • Tous les produits référencés passent automatiquement :  
     `status = PUBLISHED`, `isValidated = true`, `submittedForValidationAt = null`, `rejectionReason = null`

3. **Rejet du design**  
   • Les produits restent `DRAFT` **ou** `PENDING` mais doivent avoir  
     `isValidated = false` et `rejectionReason` rempli.  
   • Le frontend affiche alors « ❌ Rejeté ».

---
## 3. Exemple de payload JSON

```json
{
  "products": [
    {
      "id": 42,
      "designId": 99,
      "status": "PENDING",
      "isValidated": false,
      "submittedForValidationAt": "2024-06-24T12:30:00Z",
      "rejectionReason": null,
      "price": 12000,
      "vendorStock": 30,
      "name": "T-shirt premium"
    },
    {
      "id": 43,
      "designId": 101,
      "status": "PUBLISHED",
      "isValidated": true,
      "submittedForValidationAt": null,
      "rejectionReason": null,
      "price": 15000,
      "vendorStock": 40,
      "name": "Hoodie oversize"
    }
  ],
  "stats": {
    "totalProducts": 2,
    "pendingProducts": 1,
    "activeProducts": 1,
    "inactiveProducts": 0
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 2,
    "itemsPerPage": 30
  }
}
```

---
## 4. Checklist pour l'équipe backend ✔️

- [ ] Remplir correctement les champs ci-dessus pour chaque produit.
- [ ] Assurer la mise à jour automatique lors de la validation ou du rejet d'un design.
- [ ] Inclure les designs déjà **validés** dans `status = PUBLISHED` et `isValidated = true`.
- [ ] Garantir qu'aucun produit avec `isValidated = false` ne soit livré avec `status = PUBLISHED`.

---
### Contact
En cas de question, ping l'équipe Frontend (#printalma-frontend) sur Slack ☕️ 