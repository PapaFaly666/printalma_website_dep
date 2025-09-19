/**
 * Service de Publication Vendeur - PrintAlma
 * Gère la conversion d'images et l'envoi vers le backend
 */

import { API_CONFIG } from '../config/api';
import designService from './designService';

export interface VendorPublishPayload {
  baseProductId: number;
  designUrl: string;
  designId?: number;
  designName?: string;
  designPrice?: number;
  designFile?: {
    name: string;
    size: number;
    type: string;
  };
  // 🆕 NOUVELLE ARCHITECTURE: Produit admin + design séparé + délimitations
  productStructure: {
    adminProduct: {
      id: number;
      name: string;
      description?: string;
      price: number;
      images: {
        colorVariations: Array<{
          id: number;
          name: string;
          colorCode: string;
          images: Array<{
            id?: number;
            url: string;
            viewType: string;
            delimitations: Array<{
              id?: number;
              x: number;
              y: number;
              width: number;
              height: number;
              coordinateType: 'PIXEL' | 'PERCENTAGE';
            }>;
          }>;
        }>;
      };
      sizes: Array<{
        id: number;
        sizeName: string;
      }>;
    };
    designApplication: {
      designBase64: string; // Design en base64
      positioning: 'CENTER'; // Toujours au centre pour cette version
      scale: number; // Échelle d'application (par défaut 0.6)
      designTransforms?: Record<number, { x: number; y: number; scale: number }>;
    };
  };
  // Configurations vendeur
  vendorPrice: number;
  vendorName: string;
  vendorDescription?: string;
  vendorStock?: number;
  basePriceAdmin: number;
  selectedSizes: Array<{ id: number; sizeName: string }>;
  selectedColors: Array<{ id: number; name: string; colorCode: string }>;
  previewView?: any;
  publishedAt: string;
  vendorId?: number;
  forcedStatus?: 'DRAFT' | 'PENDING';
}

export interface PublishResult {
  success: boolean;
  productId?: number;
  message?: string;
  imagesProcessed?: number;
  error?: string;
}

/**
 * ✅ SOLUTION PRINCIPALE: Convertit un blob URL en base64
 */
export const convertBlobToBase64 = async (blobUrl: string): Promise<string> => {
  try {
    console.log('🔄 Conversion blob→base64:', blobUrl.substring(0, 50) + '...');
    
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        console.log('✅ Conversion réussie, taille:', Math.round(result.length / 1024) + 'KB');
        resolve(result);
      };
      reader.onerror = () => {
        console.error('❌ Erreur FileReader');
        reject(new Error('Erreur lors de la conversion en base64'));
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('❌ Erreur conversion blob vers base64:', error);
    throw new Error('Impossible de convertir l\'image');
  }
};

/**
 * ✅ SOLUTION PRINCIPALE: Convertit le design original si c'est un blob URL
 */
export const convertDesignToBase64 = async (designUrl: string): Promise<string> => {
  if (!designUrl) {
    throw new Error('Design URL manquant');
  }
  
  // Si c'est déjà en base64, retourner tel quel
  if (designUrl.startsWith('data:image/')) {
    console.log('✅ Design déjà en base64');
    return designUrl;
  }
  
  // Si c'est un blob URL, convertir en base64
  if (designUrl.startsWith('blob:')) {
    console.log('🔄 Conversion design blob→base64...');
    return await convertBlobToBase64(designUrl);
  }
  
  // Si c'est une URL HTTP ou une URL relative, tenter également la conversion en base64
  // Nous utilisons fetch pour récupérer l'image puis la transformer en dataURL afin d'envoyer
  // systématiquement un contenu "data:image/...;base64,XXX" au backend, comme requis.
  if (designUrl.startsWith('http') || designUrl.startsWith('/')) {
    try {
      console.log('🔄 Conversion design http/relative→base64...');
      return await convertBlobToBase64(designUrl);
    } catch (err) {
      console.error('❌ Impossible de convertir l\'URL http/relative en base64, retour de secours sous forme d\'URL');
      return designUrl; // Fallback (évite crash) mais le backend pourra signaler l'erreur.
    }
  }
  
  throw new Error('Format de design non supporté: ' + designUrl.substring(0, 50));
};

/**
 * Convertit toutes les images capturées en base64
 */
export const convertAllImagesToBase64 = async (
  capturedImages: Record<string, string>
): Promise<Record<string, string>> => {
  console.log('🔄 Conversion de', Object.keys(capturedImages).length, 'images vers base64...');
  
  const base64Images: Record<string, string> = {};
  const conversionPromises = Object.entries(capturedImages).map(async ([key, blobUrl]) => {
    try {
      console.log(`📝 Conversion ${key}...`);
      const base64 = await convertBlobToBase64(blobUrl);
      base64Images[key] = base64;
      console.log(`✅ ${key} converti (${Math.round(base64.length / 1024)}KB)`);
    } catch (error) {
      console.error(`❌ Erreur conversion ${key}:`, error);
      throw new Error(`Impossible de convertir l'image ${key}`);
    }
  });

  await Promise.all(conversionPromises);
  
  console.log('✅ Toutes les images converties en base64');
  return base64Images;
};

/**
 * ✅ SOLUTION PRINCIPALE: Convertit toutes les images + design en base64 avec mapping des couleurs
 * Cette fonction inclut maintenant le design original dans finalImagesBase64
 */
export const convertAllImagesToBase64WithMapping = async (
  capturedImages: Record<string, string>,
  colorMappings: Record<string, string>,
  designUrl?: string // Design original (optionnel). Sera ajouté sous la clé "design" en base64.
): Promise<Record<string, string>> => {
  console.log('🔄 === CONVERSION IMAGES MOCKUPS SEULEMENT (plus de design) ===');
  console.log('📋 Images à convertir:', Object.keys(capturedImages).length);
  console.log('🗺️ Mapping disponible:', colorMappings);
  
  const base64Images: Record<string, string> = {};
  
  // 1) Ajouter le design original s'il est fourni
  if (designUrl) {
    try {
      console.log('🎨 Conversion du design original en base64...');
      const designBase64 = await convertDesignToBase64(designUrl);
      base64Images['design'] = designBase64;
      console.log('✅ Design original converti et ajouté sous la clé "design"');
    } catch (err) {
      console.error('❌ Impossible de convertir le design original:', err);
      // On continue malgré tout – le backend signalera l'design manquant si nécessaire
    }
  } else {
    console.warn('⚠️ Aucun designUrl fourni – la clé "design" sera absente');
  }
  
  // Convertir les mockups avec couleurs
  for (const [imageKey, blobUrl] of Object.entries(capturedImages)) {
    const colorName = colorMappings[imageKey];
    
    if (!colorName) {
      console.warn(`⚠️ Aucune couleur trouvée pour imageKey: ${imageKey}`);
      if (imageKey.includes('_default')) {
        // Image par défaut
        try {
          console.log(`📝 Conversion image par défaut ${imageKey}...`);
          const base64 = await convertBlobToBase64(blobUrl);
          base64Images['default'] = base64;
          console.log(`✅ Image par défaut convertie`);
        } catch (error) {
          console.error(`❌ Erreur conversion image par défaut:`, error);
        }
      }
      continue;
    }
    
    try {
      console.log(`📝 Conversion ${imageKey} -> ${colorName}...`);
      const base64 = await convertBlobToBase64(blobUrl);
      base64Images[colorName] = base64;
      console.log(`✅ ${colorName} converti (${Math.round(base64.length / 1024)}KB)`);
    } catch (error) {
      console.error(`❌ Erreur conversion ${colorName}:`, error);
      throw new Error(`Impossible de convertir l'image ${colorName}`);
    }
  }
  
  console.log('✅ === CONVERSION TERMINÉE (mockups uniquement) ===');
  console.log('🔑 Clés finales finalImagesBase64:', Object.keys(base64Images));
  return base64Images;
};

/**
 * Publie un produit vers le backend
 */
export const publishToBackend = async (
  productData: VendorPublishPayload,
  finalImagesBase64: Record<string, string>
): Promise<PublishResult> => {
  try {
    // Étape 0 : Vérifier designId obligatoire
    if (!productData.designId) {
      throw new Error('Vous devez sélectionner un design existant avant la publication (designId manquant)');
    }
    // Le backend exige désormais la présence de la clé "design" (base64 du fichier original)
    if (!finalImagesBase64['design']) {
      console.warn('⚠️ Design non présent dans finalImagesBase64. Le backend pourrait refuser la requête.');
    }

    console.log('🚀 === ENVOI VERS LE BACKEND ===');
    console.log('📋 Produit:', productData.vendorName);
    console.log('📋 Images dans finalImagesBase64:', Object.keys(finalImagesBase64));
    console.log('🎨 Design original inclus:', finalImagesBase64['design'] ? 'OUI' : 'NON');
    console.log('📏 Taille payload:', JSON.stringify({ ...productData, finalImagesBase64 }).length, 'caractères');

    // ✅ Diagnostic détaillé des données envoyées
    console.log('📋 === DIAGNOSTIC DONNÉES BACKEND ===');
    console.log('📋 Structure colorImages:', productData.productStructure.adminProduct.images.colorVariations);
    console.log('📋 Clés colorImages:', Object.keys(productData.productStructure.adminProduct.images.colorVariations || {}));
    console.log('📋 Structure finalImagesBase64:', Object.keys(finalImagesBase64));
    console.log('📋 Correspondance clés:');
    
    const colorImageKeys = Object.keys(productData.productStructure.adminProduct.images.colorVariations || {});
    colorImageKeys.forEach(colorName => {
      const colorEntry = productData.productStructure.adminProduct.images.colorVariations[colorName];
      const imageKey = colorEntry?.images[0]?.id;
      const hasBase64 = finalImagesBase64[imageKey] ? 'OUI' : 'NON';
      console.log(`   ${colorName}: imageKey="${imageKey}" -> base64=${hasBase64}`);
    });
    
    console.log('📋 Payload complet finalImages:', productData.productStructure.adminProduct.images);

    // ✅ Authentification par cookies HTTPS uniquement
    console.log('🍪 Utilisation de l\'authentification par cookies HTTPS');

    // ✅ LOG D'URGENCE: Structure exacte envoyée au backend
    console.log('🚨 === LOG D\'URGENCE STRUCTURE ENVOYÉE ===');
    console.log('🚨 productData.designUrl:', productData.designUrl?.substring(0, 50) + '...');
    console.log('🚨 productData.finalImages:', JSON.stringify(productData.productStructure.adminProduct.images, null, 2));
    console.log('🚨 finalImagesBase64 keys:', Object.keys(finalImagesBase64));
    console.log('🚨 finalImagesBase64.design présent:', !!finalImagesBase64['design']);
    console.log('🚨 Structure complète colorImages:', JSON.stringify(productData.productStructure.adminProduct.images, null, 2));
    console.log('🚨 Payload complet (taille):', JSON.stringify({...productData, finalImagesBase64}).length, 'caractères');
    console.log('🚨 === FIN LOG D\'URGENCE ===');

    // ✅ CORRECTION URL: Utiliser l'URL correcte sans /api
    const apiUrl = `${API_CONFIG.BASE_URL}/vendor/products`;
    console.log('🔗 URL API utilisée:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // ✅ IMPORTANT: Envoie les cookies d'authentification HTTPS
      body: JSON.stringify({
        ...productData,
        finalImagesBase64
      })
    });

    console.log('📡 Réponse status:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ }));

      // Affichage enrichi dans la console
      console.error('❌ Erreur response backend', {
        status: response.status,
        statusText: response.statusText,
        errorData,
      });

      // Si le backend renvoie un tableau "details" ou "errors", les afficher clairement
      if (errorData?.details || errorData?.errors) {
        const detailsArr = errorData.details || errorData.errors;
        if (Array.isArray(detailsArr)) {
          console.group('🚨 Détails de la validation backend');
          detailsArr.forEach((d: any, idx: number) => console.log(`${idx + 1}.`, d));
          console.groupEnd();
        }
      }
      
      // Messages d'erreur spécifiques
      if (response.status === 401) {
        throw new Error('Non autorisé - Veuillez vous reconnecter');
      } else if (response.status === 403) {
        throw new Error('Accès refusé - Compte vendeur inactif ou droits insuffisants');
      } else if (response.status === 404) {
        throw new Error(`Endpoint non trouvé - Vérifiez que ${apiUrl} existe sur le backend`);
      } else if (response.status === 413) {
        throw new Error('Payload trop volumineux - Le backend doit augmenter les limites');
      } else {
        const backendMsg = errorData.message || errorData.error || '';
        throw new Error(backendMsg || `Erreur HTTP ${response.status}: ${response.statusText}`);
      }
    }

    const result = await response.json();
    console.log('✅ Réponse backend:', result);
    
    return {
      success: true,
      productId: result.productId,
      message: result.message,
      imagesProcessed: result.imagesProcessed
    };
    
  } catch (error: any) {
    console.error('❌ Erreur envoi backend:', error);
    
    // Log supplémentaire pour debugging
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        console.error('🌐 Erreur réseau - Vérifiez que le backend est accessible');
      } else if (error.message.includes('401') || error.message.includes('Non autorisé')) {
        console.error('🔐 Erreur d\'authentification - Vérifiez votre connexion');
        // Optionnel: rediriger vers la page de connexion
        // window.location.href = '/vendeur/login';
      } else if (error.message.includes('403') || error.message.includes('inactif')) {
        console.error('👤 Compte vendeur inactif - Contactez l\'administrateur');
      } else if (error.message.includes('404') || error.message.includes('non trouvé')) {
        console.error('🔗 Endpoint manquant - Le backend doit implémenter /vendor/products');
      } else if (error.message.includes('413') || error.message.includes('volumineux')) {
        console.error('📦 Payload trop volumineux - Le backend doit augmenter les limites à 50mb');
      }
    }
    
    return {
      success: false,
      error: error.message || 'Erreur lors de la communication avec le serveur'
    };
  }
};

/**
 * Publie tous les produits sélectionnés
 */
export const publishAllProducts = async (
  productsData: VendorPublishPayload[],
  finalImagesBase64: Record<string, string>
): Promise<Array<PublishResult & { productName?: string; productId: number }>> => {
  console.log('🚀 Publication de', productsData.length, 'produits...');
  
  const results = await Promise.all(
    productsData.map(async (productData) => {
      try {
        const result = await publishToBackend(productData, finalImagesBase64);
        return {
          ...result,
          productName: productData.vendorName,
          productId: productData.baseProductId
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          productName: productData.vendorName,
          productId: productData.baseProductId
        };
      }
    })
  );
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.length - successCount;
  
  console.log(`✅ Publication terminée: ${successCount} succès, ${failCount} échecs`);
  
  return results;
};

/**
 * Valide les données avant envoi
 */
export const validatePublishData = (productData: VendorPublishPayload): string[] => {
  const errors: string[] = [];
  
  if (!productData.baseProductId) {
    errors.push('ID du produit de base manquant');
  }
  
  if (!productData.vendorName?.trim()) {
    errors.push('Nom du produit vendeur requis');
  }
  
  if (!productData.vendorPrice || productData.vendorPrice <= 0) {
    errors.push('Prix vendeur invalide');
  }
  
  if (productData.vendorPrice < productData.basePriceAdmin) {
    errors.push(`Prix vendeur (${productData.vendorPrice}) inférieur au prix minimum (${productData.basePriceAdmin})`);
  }
  
  if (!productData.designUrl?.trim()) {
    errors.push('URL du design manquante');
  }
  
  // 🆕 Validation de la nouvelle structure
  if (!productData.productStructure) {
    errors.push('Structure produit manquante');
  } else {
    if (!productData.productStructure.adminProduct) {
      errors.push('Données produit admin manquantes');
    } else {
      const adminProduct = productData.productStructure.adminProduct;
      
      if (!adminProduct.id) {
        errors.push('ID produit admin manquant');
      }
      
      if (!adminProduct.name?.trim()) {
        errors.push('Nom produit admin manquant');
      }
      
      if (!adminProduct.images?.colorVariations || adminProduct.images.colorVariations.length === 0) {
        errors.push('Aucune variation de couleur dans le produit admin');
      }
    }
    
    if (!productData.productStructure.designApplication) {
      errors.push('Configuration design manquante');
    } else {
      const designApp = productData.productStructure.designApplication;
      
      if (!designApp.designBase64?.trim()) {
        errors.push('Design en base64 manquant');
      }
      
      if (!designApp.positioning) {
        errors.push('Positionnement design manquant');
      }
      
      if (typeof designApp.scale !== 'number' || designApp.scale <= 0) {
        errors.push('Échelle design invalide');
      }
    }
  }
  
  if (!productData.selectedColors || productData.selectedColors.length === 0) {
    errors.push('Aucune couleur sélectionnée');
  }
  
  if (!productData.selectedSizes || productData.selectedSizes.length === 0) {
    errors.push('Aucune taille sélectionnée');
  }
  
  return errors;
};

/**
 * Crée le payload pour un produit
 */
export const createPublishPayload = (
  productId: number,
  product: any,
  vendorModifications: any,
  designData: any,
  designBase64: string, // 🆕 Design en base64 au lieu des images fusionnées
  activeColors: any[],
  activeSizes: any[],
  previewView: any,
  basePrices: Record<number, number>,
  userId?: number,
  forcedStatus?: 'DRAFT' | 'PENDING'
): VendorPublishPayload => {
  console.log('📦 === CRÉATION PAYLOAD NOUVELLE ARCHITECTURE ===');
  console.log('📋 Produit:', product.name);
  console.log('🎨 Design base64 fourni:', designBase64 ? 'OUI' : 'NON');

  // 🆕 Créer la structure admin product + design
  const productStructure = createAdminProductStructure(
    product,
    designBase64,
    activeColors,
    activeSizes
  );

  const computedFallbackUrl = () => {
    if (previewView?.url) return previewView.url;
    if (product?.images?.[0]?.url) return product.images[0].url;
    if (product?.colorVariations?.[0]?.images?.[0]?.url) return product.colorVariations[0].images[0].url;
    return 'https://via.placeholder.com/400x400?text=Image+manquante';
  };

  const payload: VendorPublishPayload = {
    baseProductId: productId,
    designUrl: designData.designUrl || '',
    designId: designData.designId,
    designName: designData.designName,
    designPrice: designData.designPrice,
    designFile: designData.designFile ? {
      name: designData.designFile.name,
      size: designData.designFile.size,
      type: designData.designFile.type
    } : undefined,
    productStructure, // 🆕 Nouvelle structure au lieu de finalImages
    vendorPrice: vendorModifications.price ?? product.price,
    vendorName: vendorModifications.name ?? product.name,
    vendorDescription: vendorModifications.description ?? product.description,
    vendorStock: vendorModifications.stock ?? product.stock,
    basePriceAdmin: basePrices[productId] || product.price,
    selectedSizes: activeSizes,
    selectedColors: activeColors,
    previewView,
    publishedAt: new Date().toISOString(),
    vendorId: userId,
    forcedStatus
  };

  console.log('✅ Payload créé avec nouvelle architecture:');
  console.log('📋 Structure admin product:', {
    id: productStructure.adminProduct.id,
    name: productStructure.adminProduct.name,
    variations: productStructure.adminProduct.images.colorVariations.length
  });
  console.log('🎨 Design application:', {
    hasDesign: !!productStructure.designApplication.designBase64,
    positioning: productStructure.designApplication.positioning,
    scale: productStructure.designApplication.scale
  });

  return payload;
};

/**
 * 🆕 Valide la structure du payload pour la nouvelle architecture
 */
export const validatePayloadStructure = (
  productData: VendorPublishPayload, 
  finalImagesBase64: Record<string, string>
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Vérification de la structure de base
  if (!productData.productStructure?.adminProduct?.images?.colorVariations) {
    errors.push('Structure colorVariations manquante');
    return { isValid: false, errors };
  }
  
  // Vérification du design en base64
  if (!productData.productStructure.designApplication?.designBase64) {
    errors.push('Design base64 manquant dans la structure');
  }
  
  // Vérification que le design est aussi dans finalImagesBase64
  if (!finalImagesBase64['design']) {
    errors.push('Design manquant dans finalImagesBase64');
  }
  
  const colorVariations = productData.productStructure.adminProduct.images.colorVariations;
  
  // Validation de chaque variation de couleur
  colorVariations.forEach((variation, index) => {
    if (!variation.id) {
      errors.push(`Variation couleur ${index}: ID manquant`);
    }
    
    if (!variation.name?.trim()) {
      errors.push(`Variation couleur ${index}: Nom manquant`);
    }
    
    if (!variation.colorCode?.trim()) {
      errors.push(`Variation couleur ${index}: Code couleur manquant`);
    }
    
    if (!variation.images || variation.images.length === 0) {
      errors.push(`Variation couleur ${variation.name}: Aucune image`);
    } else {
      variation.images.forEach((image, imgIndex) => {
        if (!image.url?.trim()) {
          errors.push(`Variation ${variation.name}, image ${imgIndex}: URL manquante`);
        }
        
        if (!image.viewType?.trim()) {
          errors.push(`Variation ${variation.name}, image ${imgIndex}: Type de vue manquant`);
        }
        
        // Les délimitations ne sont pas obligatoires, mais si présentes, elles doivent être valides
        if (image.delimitations && image.delimitations.length > 0) {
          image.delimitations.forEach((delim, delimIndex) => {
            if (typeof delim.x !== 'number' || typeof delim.y !== 'number') {
              errors.push(`Variation ${variation.name}, délimitation ${delimIndex}: Coordonnées invalides`);
            }
            
            if (typeof delim.width !== 'number' || typeof delim.height !== 'number' || delim.width <= 0 || delim.height <= 0) {
              errors.push(`Variation ${variation.name}, délimitation ${delimIndex}: Dimensions invalides`);
            }
          });
        }
      });
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const ensureDesignId = async (payload: VendorPublishPayload): Promise<number> => {
  if (payload.designId && payload.designId > 0) return payload.designId;

  if (!payload.designUrl) {
    throw new Error('DesignUrl manquant pour créer le design');
  }
  console.log('⚙️ Création auto du design avant publication…');

  // Préparer l'objet attendu par designService.createDesign
  const base64 = await convertDesignToBase64(payload.designUrl);
  const blob = await (await fetch(base64)).blob();
  const fileObj = new File([blob], payload.designName ?? 'design.png', { type: blob.type || 'image/png' });

  // 🏷️ Déterminer categoryId selon le mapping pub.md ou utiliser fallback
  let designCategoryId = 2; // Default: 'LOGO'

  // Si une catégorie est spécifiée dans payload, essayer de la mapper
  if (payload.category) {
    try {
      // Utiliser le mapping du designService
      const categoryMapping: { [key: string]: number } = {
        'Mangas': 5,
        'ILLUSTRATION': 1,
        'LOGO': 2,
        'PATTERN': 3,
        'TYPOGRAPHY': 4,
        'ABSTRACT': 6
      };

      designCategoryId = categoryMapping[payload.category] || 2; // Fallback vers LOGO
      console.log(`🏷️ Mapping category "${payload.category}" → ID ${designCategoryId}`);
    } catch (err) {
      console.warn('⚠️ Erreur mapping catégorie, utilisation de LOGO par défaut:', err);
    }
  }

  const newDesign = await designService.createDesign({
    file: fileObj,
    name: payload.designName || payload.vendorName || 'Design Vendeur',
    price: Number(payload.designPrice ?? payload.vendorPrice ?? 0),
    categoryId: designCategoryId,
    description: payload.vendorDescription || ''
  }).catch(err => {
    console.error('⚠️ Impossible de créer le design automatiquement:', err.message);
    return undefined;
  });
  if (!newDesign) {
    return 0; // Laisser backend créer le design
  }
  console.log('✅ Design créé ID=', newDesign.id);
  return newDesign.id as number;
};

/**
 * 🆕 NOUVELLE ARCHITECTURE: Crée la structure produit admin + design positionné
 * Sans fusion d'images - le design est envoyé séparément en base64
 */
export const createAdminProductStructure = (
  product: any,
  designBase64: string,
  activeColors: Array<{ id: number; name: string; colorCode: string }>,
  activeSizes: Array<{ id: number; sizeName: string }>
) => {
  console.log('🏗️ === CRÉATION STRUCTURE ADMIN PRODUCT ===');
  console.log('📋 Produit base:', product.name);
  console.log('🎨 Design fourni:', designBase64 ? 'OUI' : 'NON');
  console.log('🎨 Couleurs actives:', activeColors.length);
  console.log('📏 Tailles actives:', activeSizes.length);

  // ✅ AMÉLIORATION: Préparer les images de fallback depuis les vues du produit
  const fallbackImages = product.views ? product.views.map((view: any) => ({
    id: view.id,
    url: view.imageUrl || view.url || view.src,
    viewType: view.viewType || view.view || 'FRONT',
    delimitations: view.delimitations || []
  })).filter((img: any) => img.url?.trim()) : []; // ✅ Filtrer les URLs vides

  console.log('📋 Images de fallback disponibles:', fallbackImages.length);

  // Construire les variations de couleur en conservant les images admin originales
  const colorVariations = activeColors.map(color => {
    console.log(`🔍 Traitement couleur: ${color.name} (ID: ${color.id})`);
    
    // Trouver la variation de couleur correspondante dans le produit admin
    let adminColorVariation: any = null;
    
    if (product.colorVariations && product.colorVariations.length > 0) {
      adminColorVariation = product.colorVariations.find((cv: any) => 
        cv.id === color.id || 
        cv.name.toLowerCase() === color.name.toLowerCase() ||
        cv.colorCode === color.colorCode
      );
      
      if (adminColorVariation) {
        console.log(`✅ Variation couleur trouvée pour ${color.name}:`, {
          id: adminColorVariation.id,
          images: adminColorVariation.images?.length || 0
        });
      }
    }

    // ✅ AMÉLIORATION: Vérifier que la variation a des images valides
    let validImages = [];
    
    if (adminColorVariation?.images && adminColorVariation.images.length > 0) {
      // Filtrer et valider les images de la variation
      validImages = adminColorVariation.images
        .map((img: any) => ({
          id: img.id,
          url: img.url || img.imageUrl || img.src,
          viewType: img.viewType || img.view || 'FRONT',
          delimitations: img.delimitations || []
        }))
        .filter((img: any) => img.url?.trim()); // ✅ Filtrer les URLs vides
    }

    // ✅ AMÉLIORATION: Si pas d'images valides dans la variation, utiliser le fallback
    if (validImages.length === 0 && fallbackImages.length > 0) {
      console.log(`⚠️ Pas d'images valides pour la variation ${color.name}, utilisation du fallback`);
      validImages = fallbackImages; // Utiliser toutes les vues du produit comme fallback
    }

    // ✅ AMÉLIORATION: Si toujours pas d'images, créer une image placeholder
    if (validImages.length === 0) {
      console.warn(`❌ AUCUNE IMAGE TROUVÉE pour ${color.name} - création d'un placeholder`);
      validImages = [{
        id: null,
        url: 'https://via.placeholder.com/400x400?text=Image+manquante',
        viewType: 'FRONT',
        delimitations: []
      }];
    }

    console.log(`📋 Images finales pour ${color.name}:`, validImages.length);

    return {
      id: color.id,
      name: color.name,
      colorCode: color.colorCode,
      images: validImages
    };
  });

  const adminProduct = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    images: {
      colorVariations
    },
    sizes: activeSizes
  };

  const designApplication = {
    designBase64,
    positioning: 'CENTER' as const,
    scale: 0.6, // Échelle par défaut comme dans l'interface
    designTransforms: {}
  };

  console.log('✅ Structure admin product créée:');
  console.log('📋 Variations couleurs:', colorVariations.length);
  console.log('📋 Images par variation:', colorVariations.map(cv => ({ 
    couleur: cv.name, 
    images: cv.images.length,
    hasValidUrls: cv.images.every((img: any) => img.url?.trim())
  })));
  console.log('📋 Délimitations par image:', colorVariations.map(cv => ({ 
    couleur: cv.name, 
    delimitations: cv.images.map((img: any) => img.delimitations?.length || 0)
  })));

  return {
    adminProduct,
    designApplication
  };
}; 