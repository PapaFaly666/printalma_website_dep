# Backend – correctif de redimensionnement des images

## Problème constaté
1. Le front redimensionne chaque image uploadée à **500 px de large** *en conservant le ratio* (ex. : 1000×800 → 500×400).
2. Lors de l'upload, cette image 500×H est envoyée au backend.
3. Le backend applique **un second redimensionnement/cropping** qui force systématiquement la sortie à **500 × 500**.
4. Résultat :
   * L'image stockée est déformée (stretch ou crop).
   * Les délimitations (stockées en pourcentage) ne correspondent plus au visuel final.

## Correctif demandé
### Attendu
* **Largeur cible fixe : 500 px**
* **Hauteur ajustée proportionnellement** (`height = round(originalHeight * (500 / originalWidth))`)
* Aucun cropping ni ajout de bandes.
* Format de sortie : JPEG ou WebP (qualité 90 %), selon la config actuelle.

### Exemple :
| Original | Actuel backend | ✗ | Souhaité | ✓ |
|----------|----------------|---|-----------|---|
| 1000×800 | 500×500 (crop) | ❌ | 500×400 | ✅ |
| 800×1200 | 500×500 (crop) | ❌ | 500×750 | ✅ |
| 500×500  | 500×500        | ✅ | 500×500  | ✅ |

## Implémentation (Node + sharp)
```ts
import sharp from 'sharp';

async function resizePreserveRatio(inputBuffer: Buffer): Promise<Buffer> {
  const img = sharp(inputBuffer);
  const metadata = await img.metadata();
  const { width = 500 } = metadata;

  // Si l'image est déjà ≤500 px de large, on ne l'agrandit pas
  const targetWidth = Math.min(width, 500);

  return img
    .resize({
      width: targetWidth,
      withoutEnlargement: true, // pas d'upscale
    })
    .jpeg({ quality: 90 }) // ou .webp({ quality: 90 }) selon votre pipeline
    .toBuffer();
}
```

## Points d'intégration
* Endpoint d'upload des fichiers (ex. `POST /files` ou middleware `multer -> sharp`).
* Ne pas re-déclencher de resize sur une image déjà 500 px de large.
* Conserver le nom d'origine ou générer un UUID comme actuellement.

## Tests de validation
1. Upload 1000×800 → fichier stocké 500×400 (vérifier dimensions).  
2. Upload 800×1200 → 500×750.  
3. Upload 500×500 → inchangé.

---
*Date : {{date}}*  
*Auteur : Frontend team – alignement délimitations.* 