import { useState } from 'react';
import { API_CONFIG } from '../config/api';

// Fonction pour récupérer le token d'authentification
function getAuthToken(): string | null {
  const tokenFromStorage = localStorage.getItem('jwt_token') ||
                          localStorage.getItem('authToken') ||
                          sessionStorage.getItem('jwt_token') ||
                          sessionStorage.getItem('authToken');

  if (tokenFromStorage) {
    return tokenFromStorage;
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'jwt_token' || name === 'authToken' || name === 'token' || name === 'jwt') {
      return value;
    }
  }

  return null;
}

interface WizardProductData {
  // Étape 1: Mockup sélectionné
  selectedMockup: {
    id: number;
    name: string;
    price: number; // Prix de revient en FCFA
    suggestedPrice?: number;
    colorVariations?: Array<{
      id: number;
      name: string;
      colorCode: string;
      images: Array<{
        id: number;
        url: string;
        viewType: string;
      }>;
    }>;
  };

  // Étape 2: Informations produit
  productName: string;
  productDescription: string;
  productPrice: number; // Prix en FCFA (pas en centimes)
  basePrice: number; // Prix de revient
  vendorProfit: number; // Bénéfice calculé
  expectedRevenue: number; // Revenu attendu (70% du profit)
  isPriceCustomized: boolean;

  // Étape 3: Sélections
  selectedTheme: string; // ID de la catégorie design
  selectedColors: Array<{
    id: number;
    name: string;
    colorCode: string;
  }>;
  selectedSizes: Array<{
    id: number;
    sizeName: string;
  }>;

  // Action post-validation
  postValidationAction: 'TO_DRAFT' | 'TO_PUBLISHED';
}

interface WizardImages {
  baseImage: File; // OBLIGATOIRE - Image principale
  detailImages: File[]; // Images de détail
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

interface UseWizardProductUpload {
  uploadProduct: (data: WizardProductData, images: WizardImages) => Promise<any>;
  loading: boolean;
  error: string | null;
  progress: number;
  validateWizardData: (data: WizardProductData, images: WizardImages) => ValidationResult;
}

export const useWizardProductUpload = (): UseWizardProductUpload => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const validateWizardData = (data: WizardProductData, images: WizardImages): ValidationResult => {
    const errors: Record<string, string> = {};

    // Validation mockup sélectionné
    if (!data.selectedMockup || !data.selectedMockup.id) {
      errors.selectedMockup = 'Aucun mockup sélectionné';
    }

    // Validation image principale
    if (!images.baseImage) {
      errors.baseImage = 'Image principale obligatoire';
    }

    // Validation prix minimum (marge 10%)
    const minimumPrice = data.basePrice * 1.1;
    if (data.productPrice < minimumPrice) {
      errors.productPrice = `Prix minimum: ${minimumPrice.toLocaleString()} FCFA (marge 10%)`;
    }

    // Validation calculs
    const expectedProfit = data.productPrice - data.basePrice;
    const expectedRevenue = Math.round(expectedProfit * 0.7);

    if (Math.abs(data.vendorProfit - expectedProfit) > 1) {
      errors.vendorProfit = 'Erreur dans le calcul du bénéfice';
    }

    if (Math.abs(data.expectedRevenue - expectedRevenue) > 1) {
      errors.expectedRevenue = 'Erreur dans le calcul du revenu attendu';
    }

    // Validation sélections
    if (!data.selectedColors.length) {
      errors.selectedColors = 'Au moins une couleur doit être sélectionnée';
    }

    if (!data.selectedSizes.length) {
      errors.selectedSizes = 'Au moins une taille doit être sélectionnée';
    }

    // Validation taille des images
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (images.baseImage) {
      if (images.baseImage.size > maxSize) {
        errors.baseImageSize = 'Image principale trop volumineuse (max 5MB)';
      }
      if (!allowedTypes.includes(images.baseImage.type)) {
        errors.baseImageType = 'Type d\'image non autorisé (JPG, PNG, WebP uniquement)';
      }
    }

    // Validation images de détail
    images.detailImages.forEach((image, index) => {
      if (image.size > maxSize) {
        errors[`detailImage${index}Size`] = `Image détail ${index + 1} trop volumineuse (max 5MB)`;
      }
      if (!allowedTypes.includes(image.type)) {
        errors[`detailImage${index}Type`] = `Image détail ${index + 1}: type non autorisé`;
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  const uploadProduct = async (productData: WizardProductData, images: WizardImages) => {
    try {
      setLoading(true);
      setError(null);
      setProgress(0);

      // Validation côté frontend
      const validationResult = validateWizardData(productData, images);
      if (!validationResult.isValid) {
        const firstError = Object.values(validationResult.errors)[0];
        throw new Error(firstError);
      }

      // Utilitaires d'image: compression + conversion en base64
      const readFileAsDataURL = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      };

      const compressImage = (file: File, options?: { maxWidth?: number; maxHeight?: number; quality?: number; mimeType?: string; }): Promise<Blob> => {
        const { maxWidth = 1200, maxHeight = 1200, quality = 0.8, mimeType = 'image/webp' } = options || {};
        return new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => {
            let targetWidth = image.width;
            let targetHeight = image.height;

            // Redimensionner en gardant le ratio
            if (targetWidth > maxWidth || targetHeight > maxHeight) {
              const widthRatio = maxWidth / targetWidth;
              const heightRatio = maxHeight / targetHeight;
              const ratio = Math.min(widthRatio, heightRatio);
              targetWidth = Math.round(targetWidth * ratio);
              targetHeight = Math.round(targetHeight * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Impossible de créer le contexte canvas'));
              return;
            }
            ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
            canvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error('Compression image échouée'));
                return;
              }
              resolve(blob);
            }, mimeType, quality);
          };
          image.onerror = () => reject(new Error('Chargement image échoué'));
          const url = URL.createObjectURL(file);
          image.src = url;
        });
      };

      const imageToBase64 = async (file: File): Promise<string> => {
        try {
          // Compresser avant conversion
          const compressed = await compressImage(file, { maxWidth: 1400, maxHeight: 1400, quality: 0.8, mimeType: 'image/webp' });
          return await readFileAsDataURL(compressed);
        } catch (e) {
          // Fallback: si compression échoue, renvoyer l'original en base64
          return await readFileAsDataURL(file);
        }
      };

      const baseImageBase64 = await imageToBase64(images.baseImage);
      const detailImagesBase64 = await Promise.all(images.detailImages.map(img => imageToBase64(img)));

      // Validation du mockup sélectionné
      if (!productData.selectedMockup || !productData.selectedMockup.id) {
        throw new Error('Aucun mockup sélectionné ou ID du mockup manquant');
      }

      // Validation que l'ID est bien un nombre
      const baseProductId = Number(productData.selectedMockup.id);
      if (isNaN(baseProductId) || baseProductId <= 0) {
        throw new Error(`ID du mockup invalide: ${productData.selectedMockup.id}. Doit être un nombre positif.`);
      }

      // Structure du payload conforme au CreateWizardProductDto
      // Force explicitement la conversion en nombre pour éviter les problèmes de parsing backend
      const baseProductIdAsNumber = Number(baseProductId);

      // Validation stricte côté frontend pour être sûr
      if (!baseProductIdAsNumber || isNaN(baseProductIdAsNumber) || baseProductIdAsNumber <= 0) {
        throw new Error(`baseProductId invalide: ${baseProductId}. Conversion en nombre échouée.`);
      }

      const wizardPayload = {
        baseProductId: baseProductIdAsNumber, // Conversion explicite en nombre
        vendorName: String(productData.productName).trim(),
        vendorDescription: String(productData.productDescription).trim(),
        vendorPrice: Number(productData.productPrice),
        vendorStock: Number(10),
        selectedColors: productData.selectedColors.map(color => ({
          id: Number(color.id),
          name: String(color.name),
          colorCode: String(color.colorCode)
        })),
        selectedSizes: productData.selectedSizes.map(size => ({
          id: Number(size.id),
          sizeName: String(size.sizeName)
        })),
        productImages: {
          baseImage: String(baseImageBase64),
          detailImages: (detailImagesBase64 || []).map(img => String(img))
        },
        forcedStatus: productData.postValidationAction === 'TO_PUBLISHED' ? 'PUBLISHED' : 'DRAFT'
      };

      // Validation du payload avant envoi
      const validateWizardPayload = (payload: typeof wizardPayload) => {
        const errors: string[] = [];

        // Validation renforcée du baseProductId
        console.log('🔧 Validation payload - baseProductId:', payload.baseProductId);

        if (payload.baseProductId === undefined || payload.baseProductId === null) {
          errors.push(`baseProductId est undefined/null: ${payload.baseProductId}`);
        } else if (typeof payload.baseProductId !== 'number') {
          errors.push(`baseProductId n'est pas un nombre: ${typeof payload.baseProductId} (${payload.baseProductId})`);
        } else if (isNaN(payload.baseProductId)) {
          errors.push(`baseProductId est NaN: ${payload.baseProductId}`);
        } else if (payload.baseProductId <= 0) {
          errors.push(`baseProductId doit être positif: ${payload.baseProductId}`);
        }

        if (!payload.vendorName || payload.vendorName.length === 0) {
          errors.push('vendorName est requis');
        }

        if (!payload.vendorDescription || payload.vendorDescription.length === 0) {
          errors.push('vendorDescription est requise');
        }

        if (!payload.vendorPrice || payload.vendorPrice <= 0) {
          errors.push('vendorPrice doit être supérieur à 0');
        }

        if (!payload.selectedColors || payload.selectedColors.length === 0) {
          errors.push('Au moins une couleur doit être sélectionnée');
        }

        if (!payload.selectedSizes || payload.selectedSizes.length === 0) {
          errors.push('Au moins une taille doit être sélectionnée');
        }

        if (!payload.productImages || !payload.productImages.baseImage) {
          errors.push('Une image principale est requise');
        }

        if (errors.length > 0) {
          throw new Error(`Validation échouée: ${errors.join(', ')}`);
        }
      };

      // Valider le payload
      validateWizardPayload(wizardPayload);

      // Log pour debug - afficher le payload complet qui sera envoyé
      console.log('🔍 Debug - baseProductId à chaque étape:');
      console.log('  - Original mockup ID:', productData.selectedMockup.id, typeof productData.selectedMockup.id);
      console.log('  - Après Number():', baseProductId, typeof baseProductId);
      console.log('  - Après Number() explicite:', baseProductIdAsNumber, typeof baseProductIdAsNumber);

      const payloadToSend = JSON.stringify(wizardPayload);
      console.log('📤 Envoi du payload wizard (complet):', wizardPayload);

      // Vérifier que baseProductId est bien présent dans le JSON et EXACTEMENT comme attendu
      const parsedPayload = JSON.parse(payloadToSend);
      console.log('🔍 Vérification finale du JSON qui sera envoyé:');
      console.log('  - baseProductId:', parsedPayload.baseProductId);
      console.log('  - type:', typeof parsedPayload.baseProductId);
      console.log('  - isNumber:', typeof parsedPayload.baseProductId === 'number');
      console.log('  - isNaN:', isNaN(parsedPayload.baseProductId));
      console.log('  - isPositive:', parsedPayload.baseProductId > 0);

      // Log du JSON brut pour vérifier la sérialisation
      console.log('📤 JSON brut (première partie):', payloadToSend.substring(0, 200));

      // Préparer les headers avec authentification
      const token = getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Authentification par token JWT');
      } else {
        console.log('🔑 Fallback vers authentification par cookies');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/vendor/wizard-products`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: payloadToSend
      });

      // Log pour debug
      console.log('Upload wizard product:', {
        productName: productData.productName,
        productPrice: productData.productPrice,
        basePrice: productData.basePrice,
        profit: productData.vendorProfit,
        revenue: productData.expectedRevenue,
        mockupId: productData.selectedMockup.id,
        mockupColorVariations: productData.selectedMockup.colorVariations?.length || 0,
        theme: productData.selectedTheme,
        colors: productData.selectedColors.length,
        sizes: productData.selectedSizes.length,
        baseImage: images.baseImage.name,
        detailImages: images.detailImages.length
      });


      // Simuler progression (puisque fetch ne supporte pas onUploadProgress nativement)
      const uploadProgressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(uploadProgressInterval);
            return 95;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      if (!response.ok) {
        clearInterval(uploadProgressInterval);
        let errorText = '';
        try {
          errorText = await response.text();
        } catch {}
        let errorMessage: string | undefined;
        try {
          const parsed = JSON.parse(errorText || '{}');
          errorMessage = parsed.message || parsed.error || parsed.details;
        } catch {}
        console.error('❌ Erreur wizard endpoint:', errorMessage || errorText);

        throw new Error(errorMessage || `Erreur lors de la création du produit wizard`);
      }

      const result = await response.json();
      clearInterval(uploadProgressInterval);
      setProgress(100);

      console.log('✅ Produit wizard créé avec succès:', result);
      return result;

    } catch (error: any) {
      console.error('Error uploading wizard product:', error);
      const errorMessage = error.message || 'Erreur lors de la création du produit';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    uploadProduct,
    loading,
    error,
    progress,
    validateWizardData
  };
};

// Utilitaires pour les calculs
export const WizardCalculations = {
  // Calculer le bénéfice vendeur
  calculateVendorProfit: (sellingPrice: number, basePrice: number): number => {
    return sellingPrice - basePrice;
  },

  // Calculer le revenu attendu (70% du bénéfice)
  calculateExpectedRevenue: (vendorProfit: number): number => {
    return Math.round(vendorProfit * 0.7);
  },

  // Calculer la commission plateforme (30% du bénéfice)
  calculatePlatformCommission: (vendorProfit: number): number => {
    return Math.round(vendorProfit * 0.3);
  },

  // Calculer le prix minimum autorisé (marge 10%)
  calculateMinimumPrice: (basePrice: number): number => {
    return Math.round(basePrice * 1.1);
  },

  // Calculer le pourcentage de marge
  calculateMarginPercentage: (sellingPrice: number, basePrice: number): number => {
    return ((sellingPrice - basePrice) / basePrice) * 100;
  },

  // Valider que tous les calculs sont cohérents
  validateCalculations: (data: WizardProductData): boolean => {
    const expectedProfit = WizardCalculations.calculateVendorProfit(
      data.productPrice,
      data.basePrice
    );
    const expectedRevenue = WizardCalculations.calculateExpectedRevenue(expectedProfit);

    return (
      Math.abs(data.vendorProfit - expectedProfit) <= 1 &&
      Math.abs(data.expectedRevenue - expectedRevenue) <= 1
    );
  }
};

export type { WizardProductData, WizardImages, ValidationResult };