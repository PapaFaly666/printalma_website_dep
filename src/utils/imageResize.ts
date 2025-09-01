import pica from 'pica';

/**
 * Redimensionne une image côté navigateur avec la librairie pica (qualité "Squoosh-like").
 * @param file Fichier image d'origine
 * @param targetWidth Largeur finale voulue (px)
 * @param quality Compression 0-1 (JPEG/WebP)
 */
export async function resizeImageFile(
  file: File,
  targetWidth = 1200,
  quality = 0.9
): Promise<File> {
  // Décoder le fichier en objet ImageBitmap (plus rapide que <img>)
  const bitmap = await createImageBitmap(file);
  if (bitmap.width <= targetWidth) {
    // Pas besoin de redimensionner – retourner l'original
    return file;
  }

  const scale = targetWidth / bitmap.width;
  const targetHeight = Math.round(bitmap.height * scale);

  // Canvas source (contenu de l'image)
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = bitmap.width;
  srcCanvas.height = bitmap.height;
  const srcCtx = srcCanvas.getContext('2d');
  srcCtx!.drawImage(bitmap, 0, 0);

  // Canvas destination (resize)
  const dstCanvas = document.createElement('canvas');
  dstCanvas.width = targetWidth;
  dstCanvas.height = targetHeight;

  // Utiliser pica pour un redimensionnement haute qualité (wasm si dispo)
  await pica({ features: [ 'js', 'wasm', 'cib' ] })
    .resize(srcCanvas, dstCanvas, {
      unsharpAmount: 80,
      unsharpRadius: 0.6,
      unsharpThreshold: 2,
    });

  const blob = await pica().toBlob(dstCanvas, file.type, quality);
  const ext = file.name.substring(file.name.lastIndexOf('.'));
  const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'));
  return new File([blob], `${nameWithoutExt}_${targetWidth}w${ext}`, { type: file.type });
} 