### PROMPT BACKEND (à copier-coller au dev)

Merci de corriger l’endpoint POST `/vendor/wizard-products` pour supporter le « wizard produit » sans design.

À faire immédiatement:
- Retirer `product: true` des `include` Prisma sur `VendorProduct` (champ inexistant). Garder seulement les relations valides: `baseProduct`, `design`, `validator`, `vendor`, `images`.
- Après création du `vendorProduct`, sauvegarder les images envoyées en base64:
  - `productImages.baseImage` → enregistrer fichier, créer `ProductImage` avec `isMain: true`, `orderIndex: 0`.
  - `productImages.detailImages[]` → boucler et créer `ProductImage` avec `isMain: false`, `orderIndex: i+1`.
- Répondre avec l’objet produit incluant `images` remplis.

Contrat reçu du frontend (extrait):
```json
{
  "baseProductId": 34,
  "vendorName": "Nom produit",
  "vendorDescription": "Description",
  "vendorPrice": 12000,
  "vendorStock": 10,
  "selectedColors": [{ "id": 32, "name": "Noir", "colorCode": "#000000" }],
  "selectedSizes": [{ "id": 157, "sizeName": "500ml" }],
  "productImages": {
    "baseImage": "data:image/webp;base64,...",
    "detailImages": ["data:image/webp;base64,..."]
  },
  "forcedStatus": "PUBLISHED"
}
```

Critères d’acceptation:
- Le produit est créé avec `productType = "WIZARD"`, `designId = null`.
- Les images sont persistées et retournées dans `data.images` (1 base + N détail, ordonnées).
- Validation marge: `vendorPrice >= base.price × 1.1`; message clair si insuffisante.

— Détails complets ci-dessous —

### Guide d’intégration Backend — Wizard Produit (sans design)

Ce document décrit précisément ce que le frontend envoie et ce que l’endpoint backend doit accepter pour créer un produit « wizard » (produit simple, sans design). Il inclut l’exemple de payload, les règles de validation et les réponses attendues.

### Endpoint

- Méthode: POST
- URL: `/vendor/wizard-products`
- Authentification: Bearer JWT (header `Authorization`) ou cookies de session

Exemple d’en-têtes:
```http
Authorization: Bearer <JWT>
Content-Type: application/json
```

### Corps de requête (contrat attendu)

```json
{
  "baseProductId": 34,
  "vendorName": "sweat-baayFall-noir (2)",
  "vendorDescription": "Texte description vendeur",
  "vendorPrice": 12000,
  "vendorStock": 10,
  "selectedColors": [
    { "id": 32, "name": "Noir", "colorCode": "#000000" }
  ],
  "selectedSizes": [
    { "id": 157, "sizeName": "500ml" },
    { "id": 156, "sizeName": "400ml" }
  ],
  "productImages": {
    "baseImage": "data:image/webp;base64,....",  
    "detailImages": [
      "data:image/webp;base64,....",
      "data:image/webp;base64,...."
    ]
  },
  "forcedStatus": "PUBLISHED"
}
```

### Spécifications champs

- **baseProductId**: number > 0. Identifiant du mockup/adminProduct de base.
- **vendorName**: string non vide.
- **vendorDescription**: string non vide.
- **vendorPrice**: number > 0. Doit respecter la marge minimale (≥ prix base × 1.1).
- **vendorStock**: number ≥ 0. Valeur par défaut 10 si non fourni.
- **selectedColors**: tableau d’objets `{ id: number, name: string, colorCode: string }`.
- **selectedSizes**: tableau d’objets `{ id: number, sizeName: string }`.
- **productImages.baseImage**: data URL base64 (JPG/PNG/WebP). Le frontend compresse en WebP ≤ ~1.4k × 1.4k, qualité ~0.8.
- **productImages.detailImages**: tableau de data URL base64 (mêmes contraintes type/taille).
- **forcedStatus**: `"DRAFT"` ou `"PUBLISHED"`.

Notes:
- Le frontend convertit explicitement tous les identifiants en number.
- Le frontend peut envoyer `Authorization: Bearer <token>` ou fallback par cookie de session.

### Règles de validation côté backend

1) Vérifier `baseProductId` existe dans `AdminProduct`.
2) Vérifier marge minimale: `vendorPrice >= AdminProduct.price × 1.1`.
3) Vérifier que `selectedColors` et `selectedSizes` sont cohérents avec le `baseProduct` (si restriction requise).
4) Vérifier présence d’une image principale `productImages.baseImage`.

### Création en base (exemple logique)

Pseudo-code service:
```ts
// 1. Charger le produit de base
const base = await prisma.adminProduct.findUnique({ where: { id: baseProductId } });
if (!base) throw new Error('Produit de base introuvable');

// 2. Vérif marge
const minPrice = Math.round(base.price * 1.1);
if (vendorPrice < minPrice) throw new Error(`Prix trop bas. Minimum: ${minPrice} FCFA (marge 10%)`);

// 3. Créer le produit vendeur (sans design)
const product = await prisma.vendorProduct.create({
  data: {
    vendorId: user.id,
    baseProductId,
    name: vendorName,
    description: vendorDescription,
    price: vendorPrice,
    stock: vendorStock ?? 10,
    status: forcedStatus ?? 'DRAFT',
    designId: null,
    // Stocker les tailles/couleurs côté modèle ou via tables associées selon le schéma
    selectedColors,
    selectedSizes
  },
  include: {
    // Relations valides pour VendorProduct dans votre schéma Prisma
    baseProduct: true,
    design: true,
    validator: true,
    vendor: true,
    images: true
    // NE PAS inclure `product: true` si ce n'est pas une relation définie
  }
});

// 4. Enregistrer les images (base + détail) après conversion base64 -> fichier
//    Associer via ProductImage (isMain, orderIndex, etc.)
```

Important: L’erreur actuelle côté backend vient d’un `include: { product: true }` sur `VendorProduct` qui n’existe pas dans votre schéma Prisma. Supprimez cette clé `product` et ne gardez que les relations réellement définies (par ex. `baseProduct`, `design`, `vendor`, `images`, etc.).

### Réponse attendue (succès)

```json
{
  "success": true,
  "data": {
    "id": 123,
    "name": "sweat-baayFall-noir (2)",
    "status": "PUBLISHED",
    "baseProductId": 34,
    "images": [
      { "id": 1, "url": "/uploads/...", "isMain": true },
      { "id": 2, "url": "/uploads/...", "isMain": false }
    ]
  }
}
```

### Réponse attendue (erreur)

- 400 Validation
```json
{ "success": false, "message": "Prix trop bas. Minimum: 6600 FCFA (marge 10%)" }
```

- 404 Produit de base introuvable
```json
{ "success": false, "message": "Produit de base introuvable" }
```

- 500 Erreur serveur
```json
{ "success": false, "message": "Erreur interne du serveur" }
```

### Points à vérifier côté backend pour corriger le problème actuel

- Retirer `product: true` de l’`include` Prisma sur `VendorProduct` (champ inconnu).
- Accepter exactement le schéma de payload ci-dessus sur `/vendor/wizard-products`.
- Implémenter la sauvegarde d’images base64 (base + détail) et leur association au `vendorProduct`.
- Valider la marge 10% et renvoyer un message clair en cas de prix insuffisant.


