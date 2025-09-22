### PROMPT À DESTINATION DU DEV BACKEND — Wizard Produit (sans design)

Merci d’ajouter/adapter l’endpoint POST `/vendor/wizard-products` pour créer un produit « wizard » (sans design) avec image de base et plusieurs images de détail.

### 1) Contrat d’API (ce que le frontend envoie)

- Méthode: POST
- URL: `/vendor/wizard-products`
- Headers: `Authorization: Bearer <JWT>` et `Content-Type: application/json` (ou cookies de session)

Payload JSON:
```json
{
  "baseProductId": 33,
  "vendorName": "sweat-baayFall-noir (2)",
  "vendorDescription": "Description vendeur",
  "vendorPrice": 12000,
  "vendorStock": 10,
  "selectedColors": [
    { "id": 33, "name": "Rouge", "colorCode": "#ec0909" }
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

Contraintes:
- `baseProductId` est un number > 0 (mockup/adminProduct existant).
- `vendorPrice >= base.price × 1.1` (marge 10% minimum).
- `productImages.baseImage` requis; `detailImages[]` optionnels (0..N).
- Le frontend compresse en WebP (≤ ~1400×1400, qualité ~0.8) avant l’envoi.

### 2) Correctifs indispensables (Prisma)

- Dans la création Prisma, ne pas utiliser `include: { product: true }` sur `VendorProduct` (champ inexistant). Utiliser uniquement des relations valides (ex. `baseProduct`, `images`, `vendor`, `design`).

Exemple correct:
```ts
const product = await prisma.vendorProduct.create({
  data: {
    vendorId: req.user.id,
    baseProductId,
    name: vendorName,
    description: vendorDescription,
    price: vendorPrice,
    stock: vendorStock ?? 10,
    status: forcedStatus ?? 'DRAFT',
    designId: null,
    productType: 'WIZARD',
    selectedColors,
    selectedSizes
  },
  include: {
    baseProduct: true,
    images: true,
    vendor: true
  }
});
```

### 3) Sauvegarde des images base64 (obligatoire)

Après la création du produit, il faut:
- Convertir `productImages.baseImage` → fichier, créer `ProductImage` lié avec `isMain: true`, `orderIndex: 0`, `type: 'base'` (si champ présent).
- Parcourir `productImages.detailImages[]` → fichiers, créer `ProductImage` liés avec `isMain: false`, `orderIndex: i+1`, `type: 'detail'`.

Snippet réutilisable:
```ts
async function saveBase64Image(dataUrl: string, filename: string): Promise<string> {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) throw new Error('Data URL invalide');
  const mime = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  const ext = mime.includes('webp') ? 'webp' : mime.includes('png') ? 'png' : (mime.includes('jpeg')||mime.includes('jpg')) ? 'jpg' : 'bin';
  const filePath = `/uploads/wizard/${filename}.${ext}`;
  // fs.writeFileSync(path.resolve(STATIC_ROOT, filePath), buffer);
  return filePath; // ou URL publique si Cloud
}

const imagesToCreate: any[] = [];
if (payload.productImages?.baseImage) {
  const url = await saveBase64Image(payload.productImages.baseImage, `wizard-${product.id}-base`);
  imagesToCreate.push({ vendorProductId: product.id, url, isMain: true, type: 'base', orderIndex: 0 });
}
if (Array.isArray(payload.productImages?.detailImages)) {
  for (let i = 0; i < payload.productImages.detailImages.length; i++) {
    const data = payload.productImages.detailImages[i];
    if (!data) continue;
    const url = await saveBase64Image(data, `wizard-${product.id}-detail-${i+1}`);
    imagesToCreate.push({ vendorProductId: product.id, url, isMain: false, type: 'detail', orderIndex: i+1 });
  }
}
if (imagesToCreate.length) {
  await prisma.productImage.createMany({ data: imagesToCreate });
}

const productWithImages = await prisma.vendorProduct.findUnique({
  where: { id: product.id },
  include: { images: true, baseProduct: true }
});
```

### 4) Réponse attendue

Succès:
```json
{
  "success": true,
  "message": "Produit wizard créé avec succès",
  "data": {
    "id": 133,
    "name": "sweat-baayFall-noir (2)",
    "status": "PUBLISHED",
    "baseProduct": { "id": 33, "name": "Mugs", "price": 10000 },
    "images": [
      { "id": 1, "url": "/uploads/wizard-133-base.webp", "isMain": true, "orderIndex": 0 },
      { "id": 2, "url": "/uploads/wizard-133-detail-1.webp", "isMain": false, "orderIndex": 1 }
    ]
  }
}
```

Erreur (exemples):
- 400 marge insuffisante → `{ "success": false, "message": "Prix trop bas. Minimum: XXXX FCFA (marge 10%)" }`
- 404 mockup introuvable → `{ "success": false, "message": "Produit de base introuvable" }`

### 5) Checklist finale

- [ ] Retirer `product: true` des `include` Prisma sur `VendorProduct`.
- [ ] Valider marge 10% vs `AdminProduct.price`.
- [ ] Sauvegarder base64 → fichiers (base + détails) et créer `ProductImage` liés.
- [ ] Retourner le produit avec `images` non vide et ordonné.
- [ ] Conserver `designId = null` et `productType = 'WIZARD'`.


