# 🛠️ Correction Backend — Déduplication des VendorProducts

> Date : 08 juillet 2025  
> Auteur : Équipe Front PrintAlma  
> Objet : Multiples produits « auto-générés » créés par erreur lors du positionnement design.

---

## 1. Contexte

Le front utilise lʼendpoint `POST /vendor/products` pour créer **un seul** produit vendeur par couple :

* `(baseProductId, designId, vendorId)`

Lors de drag/move rapides, plusieurs requêtes identiques peuvent arriver quasi simultanément.  
Actuellement le backend **crée un nouvel enregistrement à chaque appel**, ce qui génère des doublons nommés « Produit personnalisé #X ».

---

## 2. Symptomatologie côté front

* Plusieurs produits avec la même `baseProductId` / `designApplication.designId` mais des `id` différents.
* Nom par défaut : *Produit personnalisé #X* ou description *Produit auto-généré pour positionnage design*.
* Empêche la résolution de `vendorProductId` côté front (la liste `/vendor/products` explose).

---

## 3. Correctif minimal recommandé

### 3.1 Index dʼunicité base de données

```sql
-- Exemple : MySQL / MariaDB
ALTER TABLE vendor_products
ADD UNIQUE KEY uq_vendor_unique (vendor_id, base_product_id, design_application_design_id);
```

*Assurez-vous que `design_application_design_id` existe sous forme de colonne (sinon, créez-la ou stockez `designId` au niveau racine).*  
En cas de tentative dʼinsertion doublon ➜ **erreur 1062** → à gérer côté code (voir §3.2).

### 3.2 Vérification préalable dans le contrôleur

```js
// controllers/vendorController.js (createVendorProduct)
const existing = await VendorProduct.findOne({
  vendorId: vendorId || req.user?.id,
  baseProductId,
  'designApplication.designId': designId // <-- nouveau champ dans payload
});

if (existing) {
  return res.status(200).json({
    success: true,
    productId: existing._id,
    reused: true,
    message: 'Produit déjà existant, réutilisé',
  });
}
```

### 3.3 Protection transactionnelle (optionnel)
Si vous préférez éviter le `findOne` + `insert` (race-condition), utilisez :

* `findOneAndUpdate` avec lʼoption `upsert: true`  
* Ou une transaction **ACID** (MongoDB 4.0+, MySQL InnoDB) avec verrouillage.

---

## 4. Adaptations du schéma

Ajoutez le champ `designApplication.designId` en **indexé** et **requis** :

```jsonc
{
  "designApplication": {
    "designId": {
      "type": "Number",
      "required": true,
      "index": true
    },
    // … autres champs
  }
}
```

Ainsi lʼindex dʼunicité fonctionne (vendorId + baseProductId + designId).

---

## 5. Réponse côté API

Lorsquʼun doublon est détecté :

```jsonc
{
  "success": true,
  "productId": 352,
  "reused": true,
  "message": "Produit déjà existant, réutilisé"
}
```

Le front saura quʼil peut directement utiliser `productId` sans créer de nouveau produit.

---

## 6. Nettoyage des doublons existants

1. Requête dʼidentification :
   ```sql
   SELECT vendor_id, base_product_id, design_application_design_id, COUNT(*)
   FROM vendor_products
   GROUP BY vendor_id, base_product_id, design_application_design_id
   HAVING COUNT(*) > 1;
   ```
2. Conservez le plus ancien (ou le plus récent publié), supprimez les autres.
3. Purgez également les images inutilisées dans le stockage (Cloudinary / S3).

---

## 7. Validation finale

1. Front : tenter plusieurs moves rapides ➜ une seule création.
2. `/vendor/products?limit=...` renvoie max **1** produit pour `(baseProductId=2, designId=28)`.
3. Les positions se sauvegardent sans 404 ni duplication.

---

> **TL;DR :** Créez un index unique `(vendorId, baseProductId, designId)` + vérifiez lʼexistence avant insertion pour stopper les doublons. 