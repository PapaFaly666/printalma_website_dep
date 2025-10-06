/**
 * Service de publication vendeur amélioré
 * - Intégration design dans mockups
 * - Haute qualité sans pixellisation
 * - Upload design original séparé
 */

import { 
  composeDesignWithMultipleMockups, 
  optimizeImageForUpload,
  blobToBase64,
  validateImageQuality,
  type Delimitation 
} from './imageCompositionService';

import { 
  VendorPublishPayload, 
  PublishResult, 
  convertBlobToBase64,
  ensureDesignId
} from './vendorPublishService';

export interface EnhancedVendorPublishPayload extends VendorPublishPayload {
  designUrl: string;                    // ✅ Design original
  originalDesignUrl?: string;           // ✅ Backup design
  composedImages?: Record<string, string>; // ✅ Images avec design intégré
  delimitations?: Record<string, Delimitation[]>; // ✅ Délimitations par couleur
}

export interface EnhancedPublishResult extends PublishResult {
  designUrl?: string;
  originalDesignUrl?: string;
  highQualityImages?: Record<string, {
    url: string;
    width: number;
    height: number;
    quality: number;
  }>;
}

/**
 * Prépare les images avec design intégré en haute qualité
 */
export const prepareHighQualityImagesWithDesign = async (
  designImageUrl: string,
  capturedImages: Record<string, string>,
  colorDelimitations: Record<string, Delimitation[]>,
  options: {
    canvasWidth?: number;
    canvasHeight?: number;
    quality?: number;
  } = {}
): Promise<{
  composedImages: Record<string, string>;
  originalDesign: string;
  qualityReport: Record<string, boolean>;
}> => {
  console.log('🎨 === PRÉPARATION IMAGES HAUTE QUALITÉ ===');
  console.log('🖼️ Design URL:', designImageUrl);
  console.log('📊 Images capturées:', Object.keys(capturedImages));
  console.log('🎯 Délimitations:', Object.keys(colorDelimitations));

  const {
    canvasWidth = 1200,
    canvasHeight = 1200,
    quality = 1.0
  } = options;

  try {
    // 1. Convertir le design en base64 si nécessaire
    let designBase64: string;
    if (designImageUrl.startsWith('blob:')) {
      console.log('🔄 Conversion design blob → base64...');
      designBase64 = await blobToBase64(designImageUrl);
    } else {
      designBase64 = designImageUrl;
    }

    // 2. Convertir les images capturées en base64
    console.log('🔄 Conversion images capturées → base64...');
    const mockupImages: Record<string, string> = {};
    
    for (const [colorKey, blobUrl] of Object.entries(capturedImages)) {
      if (blobUrl.startsWith('blob:')) {
        mockupImages[colorKey] = await blobToBase64(blobUrl);
      } else {
        mockupImages[colorKey] = blobUrl;
      }
    }

    // 3. Préparer les données pour composition batch
    const mockupsData = Object.entries(mockupImages).map(([colorName, mockupUrl]) => ({
      mockupUrl,
      colorName,
      delimitations: colorDelimitations[colorName] || []
    }));

    console.log('🎨 Début composition batch avec design...');
    
    // 4. Composer toutes les images avec le design
    const composedImages = await composeDesignWithMultipleMockups(
      designBase64,
      mockupsData,
      {
        canvasWidth,
        canvasHeight,
        quality,
        format: 'png', // Format sans perte pour qualité maximale
        smoothing: true
      }
    );

    // 5. Optimiser les images pour l'upload
    console.log('⚡ Optimisation images pour upload...');
    const optimizedImages: Record<string, string> = {};
    
    for (const [colorName, imageData] of Object.entries(composedImages)) {
      console.log(`🔧 Optimisation ${colorName}...`);
      optimizedImages[colorName] = await optimizeImageForUpload(
        imageData,
        1200, // Résolution maximale demandée
        0.95  // Qualité élevée
      );
    }

    // 6. Valider la qualité des images finales
    console.log('🔍 Validation qualité images...');
    const qualityReport: Record<string, boolean> = {};
    
    for (const [colorName, imageData] of Object.entries(optimizedImages)) {
      const isGoodQuality = await validateImageQuality(imageData, 1200, 1200);
      qualityReport[colorName] = isGoodQuality;
      
      if (!isGoodQuality) {
        console.warn(`⚠️ Qualité insuffisante pour ${colorName}`);
      }
    }

    console.log('✅ Préparation terminée');
    console.log('📊 Rapport qualité:', qualityReport);

    return {
      composedImages: optimizedImages,
      originalDesign: designBase64,
      qualityReport
    };

  } catch (error) {
    console.error('❌ Erreur préparation images:', error);
    throw new Error(`Erreur préparation images haute qualité: ${error.message}`);
  }
};

/**
 * Publie un produit avec design intégré vers le backend
 */
export const publishToBackendWithDesign = async (
  productData: EnhancedVendorPublishPayload,
  finalImagesBase64: Record<string, string>,
  designImageUrl: string,
  delimitations: Record<string, Delimitation[]>
): Promise<EnhancedPublishResult> => {
  try {
    console.log('🚀 === PUBLICATION AVEC DESIGN INTÉGRÉ ===');
    console.log('📦 Produit:', productData.vendorName);
    console.log('🎨 Design:', designImageUrl ? 'Présent' : 'Manquant');
    console.log('🖼️ Images:', Object.keys(finalImagesBase64));

    // 1. Préparer les images haute qualité avec design
    const { composedImages, originalDesign, qualityReport } = await prepareHighQualityImagesWithDesign(
      designImageUrl,
      finalImagesBase64,
      delimitations,
      {
        canvasWidth: 1200,
        canvasHeight: 1200,
        quality: 1.0
      }
    );

    // 2. Vérifier que toutes les images sont de bonne qualité
    const lowQualityImages = Object.entries(qualityReport)
      .filter(([_, isGood]) => !isGood)
      .map(([colorName]) => colorName);

    if (lowQualityImages.length > 0) {
      console.warn('⚠️ Images de qualité insuffisante:', lowQualityImages);
      // Continuer quand même mais signaler
    }

    // 3. Payload enrichi pour le backend
    productData.designId = productData.designId || undefined;
    try {
      productData.designId = await ensureDesignId(productData as any);
    } catch (err) {
      return { success: false, error: (err as any).message } as any;
    }

    const enhancedPayload: EnhancedVendorPublishPayload & { finalImagesBase64: Record<string, string> } = {
      ...productData,
      designUrl: originalDesign,
      originalDesignUrl: originalDesign, // Backup
      composedImages,
      delimitations,
      finalImagesBase64: {
        'design': originalDesign,    // ✅ Design original séparé
        ...composedImages           // ✅ Images avec design intégré
      }
    };

    console.log('📡 Envoi payload enrichi au backend...');
    console.log('📊 Taille payload:', JSON.stringify(enhancedPayload).length, 'caractères');

    // 4. Envoi au backend avec endpoint spécialisé
    const response = await fetch('/api/vendor/publish-with-design', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(enhancedPayload)
    });

    console.log('📡 Statut réponse:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Erreur backend:', errorData);
      
      // Gestion d'erreurs spécifiques
      if (response.status === 413) {
        throw new Error('Images trop volumineuses - Réduisez la qualité ou la résolution');
      } else if (response.status === 400 && errorData.message?.includes('Invalid extension')) {
        throw new Error('Erreur format Cloudinary - Contactez l\'administrateur');
      } else {
        throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
      }
    }

    const result = await response.json();
    console.log('✅ Réponse backend:', result);

    return {
      success: true,
      productId: result.productId,
      message: result.message || 'Produit publié avec design intégré haute qualité',
      imagesProcessed: result.imagesProcessed,
      designUrl: result.designUrl,
      originalDesignUrl: result.originalDesignUrl,
      highQualityImages: result.highQualityImages
    };

  } catch (error: any) {
    console.error('❌ Erreur publication avec design:', error);
    
    return {
      success: false,
      error: error.message || 'Erreur lors de la publication avec design'
    };
  }
};

/**
 * Publie plusieurs produits avec design intégré
 */
export const publishAllProductsWithDesign = async (
  productsData: EnhancedVendorPublishPayload[],
  finalImagesBase64: Record<string, string>,
  designImageUrl: string,
  delimitations: Record<string, Delimitation[]>
): Promise<Array<EnhancedPublishResult & { productName?: string; productId: number }>> => {
  console.log('🚀 === PUBLICATION BATCH AVEC DESIGN ===');
  console.log('📦 Produits:', productsData.length);
  
  const results: Array<EnhancedPublishResult & { productName?: string; productId: number }> = [];
  
  // Publication séquentielle pour éviter surcharge serveur
  for (const productData of productsData) {
    try {
      console.log(`🔄 Publication ${productData.vendorName}...`);
      
      const result = await publishToBackendWithDesign(
        productData,
        finalImagesBase64,
        designImageUrl,
        delimitations
      );
      
      results.push({
        ...result,
        productName: productData.vendorName,
        productId: productData.baseProductId
      });
      
      console.log(`✅ ${productData.vendorName} publié`);
      
    } catch (error: any) {
      console.error(`❌ Erreur ${productData.vendorName}:`, error);
      
      results.push({
        success: false,
        error: error.message,
        productName: productData.vendorName,
        productId: productData.baseProductId
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.length - successCount;
  
  console.log(`✅ Publication batch terminée: ${successCount} succès, ${failCount} échecs`);
  
  return results;
};

/**
 * Valide qu'un design peut être intégré aux mockups
 */
export const validateDesignIntegration = async (
  designUrl: string,
  mockupUrls: Record<string, string>,
  delimitations: Record<string, Delimitation[]>
): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // 1. Vérifier que le design existe et est accessible
    if (!designUrl || designUrl.trim() === '') {
      errors.push('URL du design manquante');
    } else {
      try {
        const designBase64 = designUrl.startsWith('blob:') 
          ? await blobToBase64(designUrl)
          : designUrl;
        
        const isGoodQuality = await validateImageQuality(designBase64, 1200, 1200);
        if (!isGoodQuality) {
          warnings.push('Qualité du design insuffisante (< 1200x1200px)');
        }
      } catch (error) {
        errors.push('Impossible de charger le design');
      }
    }

    // 2. Vérifier les mockups
    const mockupKeys = Object.keys(mockupUrls);
    if (mockupKeys.length === 0) {
      errors.push('Aucun mockup fourni');
    }

    for (const colorName of mockupKeys) {
      const mockupUrl = mockupUrls[colorName];
      if (!mockupUrl || mockupUrl.trim() === '') {
        errors.push(`Mockup manquant pour la couleur ${colorName}`);
        continue;
      }

      // Vérifier les délimitations pour cette couleur
      const colorDelimitations = delimitations[colorName] || [];
      if (colorDelimitations.length === 0) {
        warnings.push(`Aucune délimitation définie pour ${colorName} - Le design ne sera pas appliqué`);
      }
    }

    // 3. Vérifier la cohérence délimitations/mockups
    const delimitationKeys = Object.keys(delimitations);
    const orphanDelimitations = delimitationKeys.filter(key => !mockupKeys.includes(key));
    
    if (orphanDelimitations.length > 0) {
      warnings.push(`Délimitations sans mockup correspondant: ${orphanDelimitations.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };

  } catch (error) {
    errors.push(`Erreur validation: ${error.message}`);
    return { isValid: false, errors, warnings };
  }
};

/**
 * Crée un payload enrichi avec design intégré
 */
export const createEnhancedPublishPayload = (
  basePayload: VendorPublishPayload,
  designUrl: string,
  delimitations: Record<string, Delimitation[]>
): EnhancedVendorPublishPayload => {
  return {
    ...basePayload,
    designUrl,
    originalDesignUrl: designUrl,
    delimitations
  };
};

export default {
  prepareHighQualityImagesWithDesign,
  publishToBackendWithDesign,
  publishAllProductsWithDesign,
  validateDesignIntegration,
  createEnhancedPublishPayload
}; 