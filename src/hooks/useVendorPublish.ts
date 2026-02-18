import { useState, useCallback } from 'react';

/**
 * 🎉 HOOK VENDOR PUBLISH - SOLUTION FINALE
 * 
 * ✅ COMPATIBLE AVEC LA SOLUTION BACKEND
 * - Endpoint: POST /vendor/products (maintenant disponible)
 * - Authentification: JWT Bearer token + fallback cookies
 * - Structure: VendorPublishDto complète avec productStructure
 * - Validation: Données requises vérifiées côté frontend
 * 
 * 🚀 FONCTIONNALITÉS
 * - createVendorProduct: Création d'un produit vendeur
 * - publishProducts: Publication en lot (compatibilité SellDesignPage)
 * - Gestion d'erreurs robuste
 * - Progression en temps réel
 * - Logs détaillés pour debugging
 */

interface VendorPublishData {
  baseProductId: number;
  designId: number;
  vendorName: string;
  vendorDescription?: string;
  vendorPrice: number;
  vendorStock?: number;
  selectedColors: Array<{ id: number; name: string; colorCode: string }>;
  selectedSizes: Array<{ id: number; sizeName: string }>;
  defaultColorId?: number;
  productStructure?: {
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
              x: number;
              y: number;
              width: number;
              height: number;
              coordinateType: 'PIXEL' | 'PERCENTAGE';
            }>;
          }>;
        }>;
      };
      sizes: Array<{ id: number; sizeName: string }>;
    };
    designApplication: {
      positioning: 'CENTER';
      scale: number;
    };
  };
  designPosition?: {
    x: number;
    y: number;
    scale: number;
    rotation?: number;
    // ❌ SUPPRIMÉ: designWidth et designHeight ne sont PAS utilisés par le backend
    // Le backend calcule les dimensions du design avec fit: 'inside' (Sharp)
    // designWidth?: number;
    // designHeight?: number;
    // ❌ SUPPRIMÉ: containerWidth et containerHeight sont recalculés par le backend
    // containerWidth?: number;
    // containerHeight?: number;
    // ✅ ESSENTIEL: Dimensions de la délimitation pour le backend
    delimitationWidth: number;
    delimitationHeight: number;
    positionUnit?: 'PIXEL' | 'PERCENTAGE';
  };
  forcedStatus?: 'DRAFT' | 'PENDING';
  postValidationAction?: 'AUTO_PUBLISH' | 'TO_DRAFT';
  bypassValidation?: boolean;

  // 🆕 Prix par taille
  useGlobalPricing?: boolean; // Utiliser les mêmes prix pour toutes les tailles
  globalCostPrice?: number; // Prix de revient global
  globalSuggestedPrice?: number; // Prix de vente suggéré global
  sizePricing?: Array<{
    size: string; // Nom de la taille (ex: "S", "M", "L")
    costPrice: number; // Prix de revient
    suggestedPrice: number; // Prix de vente suggéré
    salePrice: number; // Prix de vente défini par le vendeur
  }>;
}

interface VendorPublishResponse {
  success: boolean;
  productId?: number;
  message: string;
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED';
  needsValidation?: boolean;
  imagesProcessed?: number;
  timing?: {
    totalGenerationTime: number;
    totalColors: number;
    colorsProcessed: number;
    colorsRemaining: number;
    averageTimePerColor: number;
    estimatedRemainingTime: number;
    colorTimings: Array<{
      colorName: string;
      duration: number;
      success: boolean;
    }>;
    estimatedTimePerImage: number;
    completionPercentage: number;
  };
}

interface PublishResult {
  success: boolean;
  productId?: number;
  message: string;
  error?: string;
  imagesProcessed?: number;
}

interface UseVendorPublishOptions {
  onSuccess?: (results: PublishResult[]) => void;
  onError?: (error: Error) => void;
  onProgress?: (step: string, progress: number) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com';

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

export const useVendorPublish = (options: UseVendorPublishOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  
  const updateProgress = useCallback((step: string, progress: number) => {
    setCurrentStep(step);
    setPublishProgress(progress);
    options.onProgress?.(step, progress);
  }, [options]);

  const createVendorProduct = async (productData: VendorPublishData): Promise<VendorPublishResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📦 Création produit vendeur via hook...');
      
      // ✅ VALIDATION DES DONNÉES REQUISES
      if (!productData.baseProductId) {
        throw new Error('baseProductId est requis');
      }
      
      if (!productData.designId) {
        throw new Error('designId est requis (nouvelle architecture)');
      }
      
      if (!productData.vendorName) {
        throw new Error('vendorName est requis');
      }
      
      if (!productData.vendorPrice) {
        throw new Error('vendorPrice est requis');
      }

      // ✅ STRUCTURE COMPLÈTE REQUISE
      const payload = {
        baseProductId: productData.baseProductId,
        designId: productData.designId,
        vendorName: productData.vendorName,
        vendorDescription: productData.vendorDescription || '',
        vendorPrice: productData.vendorPrice,
        vendorStock: productData.vendorStock || 10,
        
        // 🎨 STRUCTURE ADMIN (OBLIGATOIRE)
        productStructure: {
          adminProduct: {
            id: productData.baseProductId,
            name: productData.productStructure?.adminProduct?.name || 'Produit Admin',
            description: productData.productStructure?.adminProduct?.description || '',
            price: productData.productStructure?.adminProduct?.price || 0,
            images: {
              colorVariations: productData.productStructure?.adminProduct?.images?.colorVariations || []
            },
            sizes: productData.productStructure?.adminProduct?.sizes || []
          },
          designApplication: {
            positioning: 'CENTER',
            scale: productData.productStructure?.designApplication?.scale || 0.6
          }
        },
        
        // 🎨 SÉLECTIONS VENDEUR
        selectedColors: productData.selectedColors || [],
        selectedSizes: productData.selectedSizes || [],
        defaultColorId: productData.defaultColorId,

        // 🔧 OPTIONS
        forcedStatus: productData.forcedStatus || 'DRAFT',
        postValidationAction: productData.postValidationAction || 'AUTO_PUBLISH',
        
        // 🆕 Position design envoyée au backend
        // 📐 COHÉRENCE BACKEND: Le backend calcule lui-même les dimensions avec fit: 'inside'
        // Voir BACKEND_DESIGN_POSITIONING_EXACT.md pour la logique complète
        designPosition: {
          x: productData.designPosition?.x || 0,
          y: productData.designPosition?.y || 0,
          scale: productData.designPosition?.scale || 0.8,
          rotation: productData.designPosition?.rotation || 0,
          // ✅ SEULES les dimensions de la délimitation sont nécessaires
          delimitationWidth: productData.designPosition?.delimitationWidth || 0,
          delimitationHeight: productData.designPosition?.delimitationHeight || 0,
          positionUnit: productData.designPosition?.positionUnit || 'PIXEL'
        },

        // 🆕 FLAG BYPASS VALIDATION
        bypassValidation: productData.bypassValidation ?? false,

        // 🆕 PRIX PAR TAILLE
        useGlobalPricing: productData.useGlobalPricing ?? false,
        globalCostPrice: productData.globalCostPrice,
        globalSuggestedPrice: productData.globalSuggestedPrice,
        sizePricing: productData.sizePricing || []
      };

      console.log('📦 Payload final avec dimensions:', {
        ...payload,
        designPosition: payload.designPosition
      });

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

      const response = await fetch(`${API_BASE_URL}/vendor/products`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erreur API:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Produit créé:', result);
        return {
          success: true,
          productId: result.productId || result.id,
          message: result.message || 'Produit créé avec succès',
          status: result.status || 'DRAFT',
          needsValidation: result.needsValidation ?? false,
          imagesProcessed: result.imagesProcessed ?? 0
        };
      } else {
        throw new Error(result.message || 'Erreur création produit');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('❌ Erreur création produit:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Fonction publishProducts pour compatibilité avec SellDesignPage.tsx
  const publishProducts = useCallback(async (
    selectedProductIds: string[],
    products: any[],
    productColors: Record<number, any[]>,
    productSizes: Record<number, any[]>,
    editStates: Record<number, any>,
    basePrices: Record<number, number>,
    designData: {
      designUrl: string;
      designFile?: File | null;
      designId?: number;
      designName?: string;
      designPrice?: number;
      postValidationAction?: string;
    },
    getPreviewView: (product: any) => any,
    forcedStatus?: 'DRAFT' | 'PENDING',
    defaultColorIds?: Record<number, number>,
    // 🆕 Prix par taille pour chaque produit
    sizePricingByProduct?: Record<number, Record<string, { salePrice: number; profit: number }>>
  ): Promise<PublishResult[]> => {
    try {
      setIsPublishing(true);
      setError(null);
      updateProgress('Début de la publication...', 0);
    
      console.log('🚀 === PUBLICATION PRODUITS AVEC DESIGN ===');
    console.log('📋 Produits sélectionnés:', selectedProductIds);
    console.log('🎨 Design data:', designData);

    if (selectedProductIds.length === 0) {
      throw new Error('Aucun produit sélectionné');
    }

    if (!designData.designUrl) {
      throw new Error('Aucun design fourni');
    }

      const results: PublishResult[] = [];

      // Traitement séquentiel des produits
      for (let i = 0; i < selectedProductIds.length; i++) {
        const productIdStr = selectedProductIds[i];
        const productId = Number(productIdStr);
        const product = products.find(p => p.id === productId);

        if (!product) {
          console.warn(`⚠️ Produit ${productId} non trouvé`);
          results.push({
            success: false,
            error: `Produit ${productId} non trouvé`,
            message: `Échec: Produit ${productId}`
          });
          continue;
        }

        // Mise à jour de progression
        const progressPercent = ((i + 1) / selectedProductIds.length) * 100;
        updateProgress(`Publication ${i + 1}/${selectedProductIds.length}...`, progressPercent);

        try {
          console.log(`🚀 Publication produit ${i + 1}/${selectedProductIds.length}:`, product.name);

          // Récupérer les couleurs et tailles actives
        const activeColors = (productColors[productId] || []).filter(c => c.isActive);
        const activeSizes = (productSizes[productId] || []).filter(s => s.isActive);

        if (activeColors.length === 0) {
          console.warn(`⚠️ Aucune couleur active pour le produit ${product.name}`);
            results.push({
              success: false,
              error: `Aucune couleur active pour ${product.name}`,
              message: `Échec: ${product.name}`
            });
          continue;
        }

          // 🆕 RÉCUPÉRER LES DIMENSIONS DU DESIGN SPÉCIFIQUES À CE PRODUIT
          let designDimensions: {
            designWidth?: number;
            designHeight?: number;
            designScale: number;
            rotation: number;
            x: number;
            y: number;
            delimitationWidth?: number;
            delimitationHeight?: number;
          } = {
            designWidth: 200,
            designHeight: 200,
            designScale: 0.6,
            rotation: 0,
            x: 0.5,
            y: 0.5
          };

          try {
            // 🔧 CORRECTION CRITIQUE : Récupérer les dimensions spécifiques au produit + design
            // Chaque produit peut avoir des dimensions différentes pour le même design
            
            // Essayer plusieurs formats de clés possibles SPÉCIFIQUES au produit
            const possibleKeys = [
              `design_position_${productId}_${designData.designId || 1}`,
              `design_position_${designData.designId || 1}_${productId}`,
              `vendor_design_position_${productId}_${designData.designId || 1}`,
              `design_${designData.designId || 1}_product_${productId}`,
              `position_${productId}_${designData.designId || 1}`,
            ];

            let foundData = null;
            let usedKey = null;

            // Essayer les clés spécifiques d'abord
            for (const key of possibleKeys) {
              const savedPosition = localStorage.getItem(key);
              if (savedPosition) {
                try {
                  const parsedPosition = JSON.parse(savedPosition);
                  foundData = parsedPosition;
                  usedKey = key;
                  console.log(`📏 Données trouvées pour produit ${productId} avec la clé: ${key}`, parsedPosition);
                  break;
                } catch (e) {
                  console.warn(`⚠️ Erreur parsing pour clé ${key}:`, e);
                }
              }
            }

            // 🆕 Si aucune clé spécifique ne fonctionne, chercher dans toutes les clés localStorage
            // en filtrant par baseProductId ET designId
            if (!foundData) {
              console.log(`🔍 Recherche spécifique pour produit ${productId} et design ${designData.designId || 1}...`);
              
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (
                  key.includes('design_position') || 
                  key.includes('design_') || 
                  key.includes('vendor_design') ||
                  key.includes('position_')
                )) {
                  try {
                    const savedData = localStorage.getItem(key);
                    if (savedData) {
                      const parsedData = JSON.parse(savedData);
                      
                      // 🔧 VÉRIFICATION STRICTE : baseProductId ET designId doivent correspondre
                      if (parsedData.baseProductId === productId && 
                          parsedData.designId === (designData.designId || 1)) {
                        foundData = parsedData;
                        usedKey = key;
                        console.log(`📏 Données spécifiques trouvées pour produit ${productId} + design ${designData.designId} avec la clé: ${key}`, parsedData);
                        break;
                      }
                    }
                  } catch (e) {
                    // Ignorer les erreurs de parsing
                  }
                }
              }
            }

            if (foundData) {
              // 🔧 EXTRACTION CORRECTE des données selon la structure localStorage
              const positionData = foundData.position || foundData;

              designDimensions = {
                // ❌ PLUS NÉCESSAIRE: Le backend calcule designWidth/designHeight avec fit: 'inside'
                // designWidth: positionData.designWidth ?? foundData.designWidth ?? 200,
                // designHeight: positionData.designHeight ?? foundData.designHeight ?? 200,
                designScale: positionData.scale ?? positionData.designScale ?? foundData.scale ?? 0.8,
                rotation: positionData.rotation ?? foundData.rotation ?? 0,
                // 🔧 CORRECTION CRITIQUE : Utiliser ?? au lieu de || pour gérer les valeurs 0
                x: positionData.x ?? foundData.x ?? 0,
                y: positionData.y ?? foundData.y ?? 0,
                // ❌ PLUS NÉCESSAIRE: Le backend recalcule containerWidth/containerHeight
                // containerWidth: positionData.containerWidth ?? foundData.containerWidth,
                // containerHeight: positionData.containerHeight ?? foundData.containerHeight,
                // ✅ ESSENTIEL: Dimensions de la délimitation pour le backend
                // Fallback sur designWidth/designHeight si delimitationWidth/delimitationHeight non disponibles
                delimitationWidth: positionData.delimitationWidth ?? foundData.delimitationWidth ?? positionData.designWidth ?? foundData.designWidth ?? 0,
                delimitationHeight: positionData.delimitationHeight ?? foundData.delimitationHeight ?? positionData.designHeight ?? foundData.designHeight ?? 0,
              };

              console.log(`📏 Position extraite pour produit ${productId}:`, {
                usedKey,
                originalData: foundData,
                positionData: positionData,
                extractedDimensions: designDimensions
              });
            } else {
              console.log(`📏 Aucune dimension spécifique trouvée pour produit ${productId} + design ${designData.designId}, utilisation des valeurs par défaut`);
              
              // 🔍 DEBUG: Afficher les clés disponibles pour ce produit
              console.log(`🔍 Clés localStorage disponibles pour debug (produit ${productId}):`);
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('design') || key.includes('position'))) {
                  const value = localStorage.getItem(key);
                  try {
                    const parsed = JSON.parse(value || '{}');
                    console.log(`  - ${key}: baseProductId=${parsed.baseProductId}, designId=${parsed.designId}`);
                  } catch {
                    console.log(`  - ${key}: ${value?.substring(0, 50)}...`);
                  }
                }
              }
            }
          } catch (error) {
            console.warn(`⚠️ Erreur lors de la récupération des dimensions pour produit ${productId}:`, error);
          }

          // 🆕 RÉCUPÉRER LES POSITIONS DU DESIGN depuis les délimitations
          const previewView = getPreviewView(product);

          // 🆕 Récupérer la description personnalisée du vendeur SANS générer de description automatique
          const customDescription = editStates[productId]?.description || '';

          // Préparer les données du produit
          const productData: VendorPublishData = {
            baseProductId: product.id,
            designId: designData.designId || 0,
            vendorName: editStates[productId]?.name || product.name,
            vendorDescription: customDescription,
            vendorPrice: editStates[productId]?.price ?? product.suggestedPrice ?? product.price,
            vendorStock: editStates[productId]?.stock || product.stock || 10,
            selectedColors: activeColors,
            selectedSizes: activeSizes,
            defaultColorId: defaultColorIds?.[productId],
            productStructure: {
              adminProduct: {
                id: product.id,
                name: product.name,
                description: product.description,
                price: basePrices[productId] || product.price,
                images: {
                  colorVariations: activeColors.map(color => ({
                      id: color.id,
                      name: color.name,
                      colorCode: color.colorCode,
                    images: [{
                        url: previewView?.url || '/placeholder-image.jpg',
                        viewType: 'FRONT',
                        delimitations: previewView?.delimitations || []
                      }]
                  }))
                },
                sizes: activeSizes.map(size => ({
                  id: size.id,
                  sizeName: size.sizeName
                }))
              },
              designApplication: {
                positioning: 'CENTER',
                scale: designDimensions.designScale
              }
            },
            // ✅ Position design envoyée au backend
            // 📐 COHÉRENCE BACKEND: Le backend calcule les dimensions avec fit: 'inside'
            // Voir BACKEND_DESIGN_POSITIONING_EXACT.md pour la logique complète
            designPosition: {
              x: designDimensions.x || 0,
              y: designDimensions.y || 0,
              scale: designDimensions.designScale || 0.8,
              rotation: designDimensions.rotation || 0,
              positionUnit: 'PIXEL',
              // ✅ SEULES les dimensions de la délimitation sont nécessaires
              delimitationWidth: designDimensions.delimitationWidth || 0,
              delimitationHeight: designDimensions.delimitationHeight || 0,
            },
            forcedStatus: forcedStatus || 'PENDING',
            postValidationAction: designData.postValidationAction as 'AUTO_PUBLISH' | 'TO_DRAFT' || 'AUTO_PUBLISH',
            bypassValidation: true,

            // 🆕 PRIX PAR TAILLE - Récupérer depuis sizePricingByProduct si disponible
            useGlobalPricing: product.useGlobalPricing ?? false,
            globalCostPrice: product.globalCostPrice,
            globalSuggestedPrice: product.globalSuggestedPrice,
            sizePricing: (() => {
              const productSizePricing = sizePricingByProduct?.[productId];
              if (!productSizePricing || Object.keys(productSizePricing).length === 0) {
                // Pas de prix personnalisé, utiliser les prix du produit admin SEULEMENT pour les tailles actives
                if (product.sizePrices && product.sizePrices.length > 0) {
                  return product.sizePrices
                    .filter((sp: any) => activeSizes.some((as: any) => as.sizeName === sp.size))
                    .map((sp: any) => ({
                      size: sp.size,
                      costPrice: sp.costPrice,
                      suggestedPrice: sp.suggestedPrice,
                      salePrice: sp.suggestedPrice
                    }));
                }
                return undefined;
              }

              // Convertir les prix personnalisés au format attendu par le backend
              // ✅ FILTRER: Ne garder que les tailles actives (isActive: true)
              return Object.entries(productSizePricing)
                .filter(([sizeName]) => activeSizes.some((as: any) => as.sizeName === sizeName))
                .map(([sizeName, priceData]) => {
                  // Trouver le prix de revient correspondant depuis le produit admin
                  const adminSizePrice = product.sizePrices?.find((sp: any) => sp.size === sizeName);
                  const costPrice = adminSizePrice?.costPrice || product.price || 0;

                  return {
                    size: sizeName,
                    costPrice: costPrice,
                    suggestedPrice: adminSizePrice?.suggestedPrice || (costPrice * 1.5),
                    salePrice: priceData.salePrice
                  };
                });
            })()
          };

          console.log('📦 Payload avec dimensions dans designPosition:', {
            designDimensions,
            designPosition: productData.designPosition
          });

          // Créer le produit
          const result = await createVendorProduct(productData);
          
          results.push({
            success: true,
            productId: result.productId,
            message: result.message,
            imagesProcessed: result.imagesProcessed
          });

          console.log(`✅ Produit ${product.name} créé avec succès`);

        } catch (apiError: any) {
          console.error(`❌ Erreur API pour produit ${product?.name || productId}:`, apiError);
          
          results.push({
            success: false,
            error: apiError.message || 'Erreur lors de la création du produit',
            message: `Échec: ${product?.name || productId}`
          });
        }
      }

      updateProgress('Publication terminée', 100);
      
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      
      console.log('🎉 === PUBLICATION TERMINÉE ===');
      console.log(`✅ ${successCount}/${totalCount} produits créés avec succès`);
      
      if (successCount > 0) {
        options.onSuccess?.(results);
      }

      if (successCount < totalCount) {
        const failureCount = totalCount - successCount;
        console.warn(`${failureCount} produit(s) ont échoué lors de la création`);
      }
      
      return results;

    } catch (error: any) {
      console.error('❌ === ERREUR PUBLICATION ===', error);
      
      setError(error.message || 'Erreur lors de la publication');
      options.onError?.(error);
      
      return [{
        success: false,
        error: error.message || 'Erreur générale lors de la publication',
        message: 'Publication échouée'
      }];
    } finally {
      setIsPublishing(false);
      setPublishProgress(0);
      setCurrentStep('');
    }
  }, [createVendorProduct, updateProgress, options]);

  return {
    createVendorProduct, 
    publishProducts,
    loading, 
    error,
    isPublishing,
    publishProgress,
    currentStep
  };
}; 