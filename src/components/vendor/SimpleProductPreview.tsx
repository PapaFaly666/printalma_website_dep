import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
// 🆕 Import du service localStorage pour les positions
import DesignPositionService from '../../services/DesignPositionService';
import { useAuth } from '../../contexts/AuthContext';
// 🆕 Import du service API pour synchroniser vers la base de données
import { vendorProductService } from '../../services/vendorProductService';
import {
  computeResponsivePosition,
  computeDesignTransform,
  createDesignElementStyles
} from '../../utils/responsiveDesignPositioning';

// Interface basée sur l'API /vendor/products et la documentation
interface DelimitationData {
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateType: 'PERCENTAGE' | 'PIXEL';
}

interface VendorProductFromAPI {
  id: number;
  vendorName: string;
  originalAdminName?: string; // ✅ Nom du produit admin de base
  price: number;
  status: string;
  isWizardProduct?: boolean; // Indique si c'est un produit WIZARD
  adminValidated?: boolean | null; // null = pas concerné, false = en attente, true = validé
  // ✅ Statut de validation et motif de rejet (exposés côté vendor)
  validationStatus?: string;
  // ✅ Cacher les badges de validation pour les pages publiques
  hideValidationBadges?: boolean;
  rejectionReason?: string | null;
  adminProduct?: {
    id: number;
    name: string;
    colorVariations: Array<{
      id: number;
      name: string;
      colorCode: string;
      finalUrlImage?: string; // ✅ Image finale générée avec le design appliqué
      images: Array<{
        id: number;
        url: string;
        viewType: string;
        delimitations: DelimitationData[];
      }>;
    }>;
  };
  // ✅ Structure d'images selon la doc - distingue wizard vs traditionnel
  images?: {
    adminReferences: Array<{
      colorName: string | null;
      colorCode: string | null;
      adminImageUrl: string;
      imageType: 'base' | 'detail' | 'admin_reference'; // ✅ Type d'image selon la doc
    }>;
    total: number;
    primaryImageUrl: string; // ✅ Image principale auto-déterminée
  };
  designApplication: {
    hasDesign: boolean;
    designUrl: string;
    positioning: string;
    scale: number;
  };
  designPositions: Array<{
    designId: number;
    position: {
      x: number;
      y: number;
      scale: number;
      rotation: number;
      constraints?: any;
      designWidth?: number;
      designHeight?: number;
      designScale?: number;
    };
  }>;
  designTransforms: Array<{
    id: number;
    designUrl: string;
    transforms: {
      [key: string]: {
        x: number;
        y: number;
        scale: number;
        rotation?: number;
        designWidth?: number;
        designHeight?: number;
        designScale?: number;
        constraints?: any;
      };
    };
  }>;
  selectedColors: Array<{
    id: number;
    name: string;
    colorCode: string;
  }>;
  designId: number | null; // ✅ null pour produits wizard, number pour produits avec design
}

interface SimpleProductPreviewProps {
  product: VendorProductFromAPI;
  showColorSlider?: boolean;
  className?: string;
  onColorChange?: (colorId: number) => void;
  showDelimitations?: boolean;
  onProductClick?: (product: VendorProductFromAPI) => void; // ✅ Callback pour clic sur la card
  showDetailImages?: boolean; // ✅ Mode affichage détails pour wizard
  hideValidationBadges?: boolean; // ✅ Cacher les badges de validation pour les pages publiques
  imageObjectFit?: 'contain' | 'cover'; // ✅ Contrôle du comportement de l'image (contain par défaut, cover pour remplir)
  initialColorId?: number; // ✅ ID de couleur initiale pour synchronisation avec le parent
}

// Interface pour les métriques d'image (comme dans useFabricCanvas)
interface ImageMetrics {
  originalWidth: number;
  originalHeight: number;
  displayWidth: number;
  displayHeight: number;
  canvasScale: number;
  canvasOffsetX: number;
  canvasOffsetY: number;
}

export const SimpleProductPreview: React.FC<SimpleProductPreviewProps> = ({
  product,
  showColorSlider = true,
  className = '',
  onColorChange,
  showDelimitations = false,
  onProductClick,
  showDetailImages = false,
  hideValidationBadges = false,
  imageObjectFit = 'contain', // Par défaut contain pour conserver le comportement actuel
  initialColorId // ✅ ID de couleur initiale optionnel pour synchronisation
}) => {
  // 🆕 Accès au contexte d'authentification
  const { user } = useAuth();

  // État pour la couleur sélectionnée - déclaré en premier
  // ✅ Priorité: initialColorId > defaultColorId > première couleur disponible
  const [currentColorId, setCurrentColorId] = useState<number>(() => {
    console.log('🎨 [SimpleProductPreview] Initialisation couleur pour produit:', {
      productId: product.id,
      defaultColorId: (product as any).defaultColorId,
      selectedColors: product.selectedColors,
      initialColorId
    });

    // 1. Si initialColorId est fourni (parent contrôle)
    if (initialColorId) {
      console.log(`🎨 [SimpleProductPreview] ✅ Utilisation de initialColorId: ${initialColorId}`);
      return initialColorId;
    }

    // 2. Si le produit a un defaultColorId et c'est une couleur valide
    const defaultColorId = (product as any).defaultColorId;
    if (defaultColorId) {
      console.log(`🎨 [SimpleProductPreview] Recherche de la couleur par défaut ID: ${defaultColorId} dans:`, product.selectedColors);
      const defaultColor = product.selectedColors.find(c => c.id === defaultColorId);
      if (defaultColor) {
        console.log(`🎨 [SimpleProductPreview] ✅ Couleur par défaut trouvée: ${defaultColor.name} (ID: ${defaultColor.id})`);
        return defaultColor.id;
      } else {
        console.warn(`⚠️ [SimpleProductPreview] Couleur par défaut ID ${defaultColorId} non trouvée dans selectedColors`);
      }
    } else {
      console.log(`🎨 [SimpleProductPreview] Pas de defaultColorId défini`);
    }

    // 3. Sinon, première couleur disponible
    const firstColorId = product.selectedColors[0]?.id || 0;
    console.log(`🎨 [SimpleProductPreview] ⚪ Utilisation de la première couleur: ${product.selectedColors[0]?.name} (ID: ${firstColorId})`);
    return firstColorId;
  });

  // ✅ Synchroniser la couleur lorsque initialColorId change (parent)
  useEffect(() => {
    if (initialColorId && initialColorId !== currentColorId) {
      setCurrentColorId(initialColorId);
    }
  }, [initialColorId, currentColorId]);

  // ✅ Détecter le type de produit - gérer null et 0 (problème de sérialisation)
  const isWizardProduct = !product.designId || product.designId === null || product.designId === 0;
  const isTraditionalProduct = !isWizardProduct;

  // ✅ Obtenir l'image d'affichage selon le type de produit
  const getCardImage = () => {
    if (isWizardProduct && product.images) {
      // ✅ Pour wizard: TOUJOURS utiliser l'image base (imageType: "base")
      const baseImage = product.images.adminReferences.find(
        img => img.imageType === 'base'
      );
      return baseImage?.adminImageUrl || product.images.primaryImageUrl;
    } else if (isTraditionalProduct && product.adminProduct) {
      // Pour traditionnel: utiliser l'image du mockup de la couleur sélectionnée
      console.log('🖼️ [getCardImage] Recherche de l\'image pour currentColorId:', currentColorId);
      console.log('🖼️ [getCardImage] selectedColors disponibles:', product.selectedColors);
      console.log('🖼️ [getCardImage] colorVariations disponibles:', product.adminProduct.colorVariations.map(cv => ({ id: cv.id, name: cv.name })));

      const currentColor = product.selectedColors.find(c => c.id === currentColorId) || product.selectedColors[0];
      console.log('🖼️ [getCardImage] currentColor trouvée:', currentColor);

      const colorVariation = product.adminProduct.colorVariations.find(
        cv => cv.id === currentColor?.id
      );
      console.log('🖼️ [getCardImage] colorVariation trouvée:', colorVariation ? { id: colorVariation.id, name: colorVariation.name, imagesCount: colorVariation.images.length, hasFinalUrlImage: !!(colorVariation as any).finalUrlImage } : 'NON TROUVÉE');

      // ✅ PRIORITÉ: Utiliser finalUrlImage (image finale générée avec design) si disponible
      if ((colorVariation as any)?.finalUrlImage) {
        console.log('🖼️ [getCardImage] ✅ Utilisation de finalUrlImage:', (colorVariation as any).finalUrlImage.substring(0, 60) + '...');
        return (colorVariation as any).finalUrlImage;
      }

      // Fallback sur l'image mockup admin
      const mockupImage = colorVariation?.images.find(img => img.viewType === 'Front')
        || colorVariation?.images[0];
      console.log('🖼️ [getCardImage] mockupImage sélectionnée (fallback):', mockupImage ? { url: mockupImage.url.substring(0, 50) + '...', viewType: mockupImage.viewType } : 'AUCUNE IMAGE');

      return mockupImage?.url;
    } else if (product.images) {
      // Fallback sur primaryImageUrl si disponible
      return product.images.primaryImageUrl;
    }
    return null;
  };

  // ✅ Obtenir le nom d'affichage
  const getDisplayName = () => {
    // Debug: Loguer toutes les possibilités de noms
    console.log('🔍 [SimpleProductPreview] Debug noms disponibles:', {
      productId: product.id,
      vendorName: product.vendorName,
      originalAdminName: product.originalAdminName,
      adminProductName: product.adminProduct?.name,
      // vendorFullName: product.vendor?.fullName,
      // vendorShopName: product.vendor?.shop_name
    });

    // Priorité: vendorName (nom personnalisé du produit) > adminProductName > originalAdminName > fallback
    const displayName = product.vendorName || product.adminProduct?.name || product.originalAdminName || 'Produit sans nom';

    console.log('📝 [SimpleProductPreview] Nom affiché:', displayName);
    return displayName;
  };

  // ✅ Obtenir toutes les images selon le type (pour les détails)
  const getAllProductImages = () => {
    if (isWizardProduct && product.images) {
      // Pour wizard: retourner base + détails
      return product.images.adminReferences.map(img => ({
        url: img.adminImageUrl,
        type: img.imageType,
        isMain: img.imageType === 'base',
        colorName: null,
        colorCode: null
      }));
    } else if (isTraditionalProduct && product.adminProduct) {
      // Pour traditionnel: retourner mockups par couleur
      return product.adminProduct.colorVariations.flatMap(cv =>
        cv.images.map(img => ({
          url: img.url,
          type: 'mockup' as const,
          isMain: img.viewType === 'Front',
          colorName: cv.name,
          colorCode: cv.colorCode
        }))
      );
    }
    return [];
  };
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageMetrics, setImageMetrics] = useState<ImageMetrics | null>(null);

  // Pour les produits wizard, pas besoin de navigation d'images dans la card
  // La navigation sera dans une page détails séparée

  // 🆕 Logs de diagnostic pour l'incorporation du design
  console.log('🎨 SimpleProductPreview - Produit reçu:', product.id, {
    type: isWizardProduct ? 'WIZARD' : 'TRADITIONNEL',
    designId: product.designId,
    hasImages: !!product.images,
    hasAdminProduct: !!product.adminProduct
  });
  console.log('🎨 SimpleProductPreview - Structure images:', product.images);
  console.log('🎨 SimpleProductPreview - AdminProduct:', product.adminProduct);
  console.log('🎨 SimpleProductPreview - Image sélectionnée pour card:', getCardImage());

  // ✅ Couleur actuelle - doit changer quand currentColorId change
  const currentColor = product.selectedColors.find(c => c.id === currentColorId) || product.selectedColors[0];

  console.log('🎨 [RENDER] Couleur actuelle pour currentColorId:', currentColorId, '-> Couleur:', currentColor);

  // ✅ Variables d'image selon le type de produit - RECALCULÉES À CHAQUE RENDER
  let currentImageUrl: string | null = null;
  let delimitations: DelimitationData[] = [];

  if (isWizardProduct) {
    // ✅ Produit wizard : TOUJOURS afficher l'image de base dans la card
    currentImageUrl = getCardImage();
    delimitations = [];
    console.log('🖼️ [RENDER] Image wizard:', currentImageUrl);
  } else if (isTraditionalProduct && product.adminProduct) {
    // ✅ Produit traditionnel : utiliser le mockup de la couleur sélectionnée
    console.log('🖼️ [RENDER] Recherche colorVariation pour currentColorId:', currentColorId);
    console.log('🖼️ [RENDER] Couleur actuelle:', currentColor);
    console.log('🖼️ [RENDER] ColorVariations disponibles:', product.adminProduct.colorVariations.map(cv => ({ id: cv.id, name: cv.name })));

    const colorVariation = product.adminProduct.colorVariations.find(
      cv => cv.id === currentColor?.id
    );

    console.log('🖼️ [RENDER] ColorVariation trouvée:', colorVariation ? { id: colorVariation.id, name: colorVariation.name, imagesCount: colorVariation.images.length, hasFinalUrlImage: !!(colorVariation as any).finalUrlImage } : 'NON TROUVÉE');

    // ✅ PRIORITÉ: Utiliser finalUrlImage (image finale générée avec design) si disponible
    const finalUrlImage = (colorVariation as any)?.finalUrlImage;
    if (finalUrlImage) {
      console.log('🖼️ [RENDER] ✅ Utilisation de finalUrlImage (image finale):', finalUrlImage.substring(0, 60) + '...');
      currentImageUrl = finalUrlImage;
      // Pour finalUrlImage, les délimitations ne sont pas nécessaires car le design est déjà appliqué
      delimitations = [];
    } else {
      // Fallback sur l'image mockup admin avec délimitations
      const mockupImage = colorVariation?.images.find(img => img.viewType === 'Front')
        || colorVariation?.images[0];

      console.log('🖼️ [RENDER] Image mockup sélectionnée (fallback):', {
        productId: product.id,
        currentColorId: currentColorId,
        currentColorName: currentColor?.name,
        colorVariationId: colorVariation?.id,
        colorVariationName: colorVariation?.name,
        mockupImageUrl: mockupImage?.url?.substring(0, 80) + '...',
        viewType: mockupImage?.viewType,
        hasDelimitations: !!mockupImage?.delimitations && mockupImage.delimitations.length > 0,
        delimitationsCount: mockupImage?.delimitations?.length || 0
      });

      currentImageUrl = mockupImage?.url || null;
      delimitations = mockupImage?.delimitations || [];
    }
  }

  // 🆕 État pour suivre si la synchronisation a déjà été effectuée
  const [syncCompleted, setSyncCompleted] = useState(false);

  // 🆕 Fonction pour synchroniser les données localStorage vers la base de données
  const syncLocalStorageToDatabase = async (vendorProductId: number, designId: number, enrichedData: any) => {
    if (!user?.id || syncCompleted) return;

    try {
      // 🆕 Vérifier si les données ont été enrichies depuis localStorage
      if (enrichedData.source === 'localStorage' || enrichedData.designWidth || enrichedData.designHeight) {
        console.log('🔄 Synchronisation des données enrichies vers la base de données...', {
          vendorProductId,
          designId,
          data: {
            x: enrichedData.x,
            y: enrichedData.y,
            scale: enrichedData.scale,
            rotation: enrichedData.rotation,
            designWidth: enrichedData.designWidth,
            designHeight: enrichedData.designHeight,
            constraints: enrichedData.constraints
          }
        });

        // 🆕 VRAIE SYNCHRONISATION vers la base de données
        const positionPayload = {
          x: enrichedData.x,
          y: enrichedData.y,
          scale: enrichedData.scale,
          rotation: enrichedData.rotation || 0,
          designWidth: enrichedData.designWidth,
          designHeight: enrichedData.designHeight
        };

        // 🚀 Sauvegarder via l'API vendorProductService
        await vendorProductService.saveDesignPosition(vendorProductId, designId, positionPayload);

        setSyncCompleted(true);
        console.log('✅ Données synchronisées avec succès vers la base de données !');
        console.log('📍 Position maintenant disponible dans l\'API pour les prochains appels');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation vers la base de données:', error);
      // 🆕 Afficher l'erreur mais ne pas bloquer l'interface
      console.warn('⚠️ La synchronisation a échoué, mais les données restent disponibles en localStorage');
    }
  };

  // 🆕 Fonction pour obtenir la position du design depuis l'API ET localStorage
  const getDesignPosition = () => {
    console.log('🎨 getDesignPosition - Début de la fonction');
    console.log('🎨 getDesignPosition - product.designPositions:', product.designPositions);
    console.log('🎨 getDesignPosition - product.designTransforms:', product.designTransforms);
    
    // 1. Essayer d'abord designPositions depuis l'API
    if (product.designPositions && product.designPositions.length > 0) {
      const designPos = product.designPositions[0];
      console.log('📍 Position depuis designPositions:', designPos.position);
      
      // 🆕 Enrichir avec localStorage si designWidth/designHeight manquent
      const enrichedPosition: any = { 
        ...designPos.position,
        constraints: (designPos.position as any).constraints || {}
      };
      
      if ((!enrichedPosition.designWidth || !enrichedPosition.designHeight) && product.designId && user?.id) {
        const localStorageData = DesignPositionService.getPosition(product.designId, product.adminProduct.id, user.id);
        if (localStorageData && localStorageData.position) {
          const localPos = localStorageData.position as any;
          enrichedPosition.designWidth = localPos.designWidth || enrichedPosition.designWidth;
          enrichedPosition.designHeight = localPos.designHeight || enrichedPosition.designHeight;
          console.log('📍 Enrichi avec localStorage:', { 
            designWidth: enrichedPosition.designWidth, 
            designHeight: enrichedPosition.designHeight,
            from: 'localStorage'
          });
          
          // 🆕 LOG pour debug - montrer les données avant et après enrichissement
          console.log('📍 AVANT enrichissement:', designPos.position);
          console.log('📍 APRÈS enrichissement:', enrichedPosition);

          // 🆕 La synchronisation sera gérée par un useEffect séparé pour éviter les appels multiples
        }
      }
      
      const result = {
        x: enrichedPosition.x,
        y: enrichedPosition.y,
        scale: enrichedPosition.scale,
        rotation: enrichedPosition.rotation || 0,
        designWidth: enrichedPosition.designWidth,
        designHeight: enrichedPosition.designHeight,
        designScale: enrichedPosition.designScale,
        constraints: enrichedPosition.constraints || {},
        source: 'designPositions'
      };
      
      console.log('🎨 getDesignPosition - Résultat designPositions:', result);
      return result;
    }

    // 2. Essayer designTransforms depuis l'API
    if (product.designTransforms && product.designTransforms.length > 0) {
      const designTransform = product.designTransforms[0];
      const transform = designTransform.transforms['0']; // Délimitation 0
      if (transform) {
        console.log('📍 Position depuis designTransforms:', transform);
        
        // 🆕 Enrichir avec localStorage si designWidth/designHeight manquent
        const enrichedTransform: any = { 
          ...transform,
          constraints: (transform as any).constraints || {}
        };
        
        if ((!enrichedTransform.designWidth || !enrichedTransform.designHeight) && product.designId && user?.id) {
          const localStorageData = DesignPositionService.getPosition(product.designId, product.adminProduct.id, user.id);
          if (localStorageData && localStorageData.position) {
            const localPos = localStorageData.position as any;
            enrichedTransform.designWidth = localPos.designWidth || enrichedTransform.designWidth;
            enrichedTransform.designHeight = localPos.designHeight || enrichedTransform.designHeight;
            console.log('📍 Enrichi avec localStorage:', { 
              designWidth: enrichedTransform.designWidth, 
              designHeight: enrichedTransform.designHeight,
              from: 'localStorage'
            });
            
            // 🆕 LOG pour debug - montrer les données avant et après enrichissement
            console.log('📍 AVANT enrichissement (transform):', transform);
            console.log('📍 APRÈS enrichissement (transform):', enrichedTransform);

            // 🆕 La synchronisation sera gérée par un useEffect séparé pour éviter les appels multiples
          }
        }
        
        const result = {
          x: enrichedTransform.x,
          y: enrichedTransform.y,
          scale: enrichedTransform.scale,
          rotation: enrichedTransform.rotation || 0,
          designWidth: enrichedTransform.designWidth,
          designHeight: enrichedTransform.designHeight,
          designScale: enrichedTransform.designScale,
          constraints: enrichedTransform.constraints || {},
          source: 'designTransforms'
        };
        
        console.log('🎨 getDesignPosition - Résultat designTransforms:', result);
        return result;
      }
    }

    // 3. Essayer localStorage directement
    if (product.designId && user?.id) {
      const localStorageData = DesignPositionService.getPosition(product.designId, product.adminProduct.id, user.id);
      if (localStorageData && localStorageData.position) {
        console.log('📍 Position complète depuis localStorage:', localStorageData.position);
        
        // 🆕 Structurer les données localStorage pour la base de données
        const localPosition = localStorageData.position as any;
        const structuredPosition = {
          x: localPosition.x,
          y: localPosition.y,
          scale: localPosition.scale,
          rotation: localPosition.rotation || 0,
          designWidth: localPosition.designWidth,
          designHeight: localPosition.designHeight,
          designScale: localPosition.designScale,
          constraints: localPosition.constraints || {},
          source: 'localStorage',
          // 🆕 Format pour la base de données
          databaseFormat: {
            position: {
              x: localPosition.x,
              y: localPosition.y,
              scale: localPosition.scale,
              constraints: localPosition.constraints || {}
            }
          }
        };
        
        console.log('📍 Données structurées pour la base de données:', structuredPosition.databaseFormat);
        return structuredPosition;
      }
    }

    // 4. Fallback sur designApplication.scale
    console.log('📍 Position par défaut avec scale:', product.designApplication.scale);
    return {
      x: 0,
      y: 0,
      scale: product.designApplication.scale || 1,
      rotation: 0,
      designWidth: undefined,
      designHeight: undefined,
      designScale: undefined,
      constraints: {},
      source: 'designApplication'
    };
  };

  // 🆕 Calculer les métriques d'image (comme dans useFabricCanvas)
  const calculateImageMetrics = () => {
    if (!imgRef.current || !containerRef.current) return null;

    const img = imgRef.current;
    const container = containerRef.current;
    
    const originalWidth = img.naturalWidth;
    const originalHeight = img.naturalHeight;
    const containerRect = container.getBoundingClientRect();
    
    // Calculer les dimensions d'affichage (object-fit: contain)
    const containerRatio = containerRect.width / containerRect.height;
    const imageRatio = originalWidth / originalHeight;
    
    let displayWidth, displayHeight, offsetX, offsetY;
    
    if (imageRatio > containerRatio) {
      // Image plus large que le container
      displayWidth = containerRect.width;
      displayHeight = containerRect.width / imageRatio;
      offsetX = 0;
      offsetY = (containerRect.height - displayHeight) / 2;
    } else {
      // Image plus haute que le container
      displayHeight = containerRect.height;
      displayWidth = containerRect.height * imageRatio;
      offsetX = (containerRect.width - displayWidth) / 2;
      offsetY = 0;
    }
    
    const scale = displayWidth / originalWidth;
    
    return {
      originalWidth,
      originalHeight,
      displayWidth,
      displayHeight,
      canvasScale: scale,
      canvasOffsetX: offsetX,
      canvasOffsetY: offsetY
    };
  };

  // 🆕 Convertir les coordonnées réelles vers les coordonnées d'affichage (comme dans useFabricCanvas)
  const convertToDisplayCoordinates = (realCoords: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => {
    if (!imageMetrics) return realCoords;
    
    return {
      x: (realCoords.x * imageMetrics.canvasScale) + imageMetrics.canvasOffsetX,
      y: (realCoords.y * imageMetrics.canvasScale) + imageMetrics.canvasOffsetY,
      width: realCoords.width * imageMetrics.canvasScale,
      height: realCoords.height * imageMetrics.canvasScale
    };
  };

  // Observer les dimensions de l'image
  useEffect(() => {
    if (imgRef.current && imageLoaded && containerRef.current) {
      const metrics = calculateImageMetrics();
      setImageMetrics(metrics);
    }
  }, [imageLoaded, currentColorId]);

  // Observer les changements de taille du container
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver(() => {
      if (imageLoaded) {
        const metrics = calculateImageMetrics();
        setImageMetrics(metrics);
      }
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => resizeObserver.disconnect();
  }, [imageLoaded]);

  // 🆕 Fonction pour calculer la position en pixels - IDENTIQUE à ProductViewWithDesign (admin/add-product)
  const computePxPosition = (delim: DelimitationData) => {
    // 🆕 UTILISER LA FONCTION PARTAGÉE POUR UN POSITIONNEMENT COHÉRENT
    const { width: contW, height: contH } = containerRef.current?.getBoundingClientRect() || { width: 0, height: 0 };
    if (contW === 0 || contH === 0) return { left: 0, top: 0, width: 0, height: 0 };

    const imgW = imageMetrics?.originalWidth || 1200;
    const imgH = imageMetrics?.originalHeight || 1200;

    // Utiliser la fonction partagée pour un calcul responsif cohérent
    return computeResponsivePosition(
      delim,
      { width: contW, height: contH },
      { originalWidth: imgW, originalHeight: imgH },
      'contain'
    );
  };

  // Gestionnaire de changement de couleur
  const handleColorChange = (colorId: number) => {
    setCurrentColorId(colorId);
    onColorChange?.(colorId);
  };

  // Gestionnaire pour couleur précédente
  const handlePreviousColor = () => {
    const currentIndex = product.selectedColors.findIndex(c => c.id === currentColorId);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : product.selectedColors.length - 1;
    const previousColor = product.selectedColors[previousIndex];
    handleColorChange(previousColor.id);
  };

  // Gestionnaire pour couleur suivante
  const handleNextColor = () => {
    const currentIndex = product.selectedColors.findIndex(c => c.id === currentColorId);
    const nextIndex = currentIndex < product.selectedColors.length - 1 ? currentIndex + 1 : 0;
    const nextColor = product.selectedColors[nextIndex];
    handleColorChange(nextColor.id);
  };

  // Les gestionnaires d'images wizard seront dans la page détails séparée

  // ✅ Gestionnaire de clic sur la card
  const handleCardClick = () => {
    if (onProductClick) {
      onProductClick(product);
    }
  };

  // 🆕 Mémoriser la position du design pour éviter les recalculs constants
  const designPosition = useMemo(() => {
    return getDesignPosition();
  }, [
    product.designPositions,
    product.designTransforms,
    product.designId,
    product.adminProduct?.id,
    user?.id,
    product.designApplication?.scale
  ]);

  // 🆕 useEffect pour synchroniser les données enrichies vers la base de données (UNE SEULE FOIS)
  useEffect(() => {
    // Ne synchroniser que si les données proviennent de localStorage ou sont enrichies
    if (
      !syncCompleted &&
      product.designId &&
      user?.id &&
      designPosition &&
      (designPosition.source === 'localStorage' || designPosition.designWidth || designPosition.designHeight)
    ) {
      syncLocalStorageToDatabase(product.id, product.designId, designPosition);
    }
  }, [product.id, product.designId, syncCompleted]); // Ne dépend que de l'ID du produit pour éviter les re-syncs

  // 🆕 Log complet pour debug - TOUJOURS actif pour diagnostiquer les problèmes de positionnement
  useEffect(() => {
    console.log('🔍 SimpleProductPreview - Produit reçu:', product.id, {
      hasDesign: product.designApplication.hasDesign,
      designUrl: product.designApplication.designUrl,
      colorVariations: product.adminProduct.colorVariations.length,
      firstColorImages: product.adminProduct.colorVariations[0]?.images || [],
      delimitations: product.adminProduct.colorVariations[0]?.images[0]?.delimitations || [],
      designPositions: product.designPositions,
      designTransforms: product.designTransforms
    });
    
    if (showDelimitations) {
      console.log('🟦 Couleur sélectionnée:', currentColor);
      console.log('🟥 Délimitations pour cette couleur:', delimitations);
      console.log('📐 Position/Transform du design:', designPosition);
      console.log('🖼️ Métriques image:', imageMetrics);
      
      // 🆕 Analyser les délimitations en détail
      if (delimitations.length > 0) {
        const firstDelimitation = delimitations[0];
        console.log('🎯 Première délimitation détaillée:', {
          raw: firstDelimitation,
          type: firstDelimitation.coordinateType,
          inPixels: firstDelimitation.coordinateType === 'PERCENTAGE' ? {
            x: (firstDelimitation.x / 100) * (imageMetrics?.originalWidth || 1200),
            y: (firstDelimitation.y / 100) * (imageMetrics?.originalHeight || 1200),
            width: (firstDelimitation.width / 100) * (imageMetrics?.originalWidth || 1200),
            height: (firstDelimitation.height / 100) * (imageMetrics?.originalHeight || 1200)
          } : firstDelimitation
        });
      }
    }
  }, [product, currentColor, delimitations, designPosition, imageMetrics, showDelimitations]);

  if (!currentImageUrl) {
    return (
      <div className={`aspect-square bg-gray-100 flex items-center justify-center rounded-lg ${className}`}>
        <span className="text-gray-500">
          {isWizardProduct ? 'Image personnalisée manquante' : 'Aucune image mockup'}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`aspect-square relative bg-white rounded-lg overflow-hidden ${className} ${
        onProductClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
      }`}
      onClick={handleCardClick}
    >
  
          
      {/* ✅ Image du produit selon le type */}
      <img
        ref={imgRef}
        src={currentImageUrl}
        alt={getDisplayName()}
        className={`w-full h-full ${imageObjectFit === 'cover' ? 'object-cover' : 'object-contain'}`}
        onLoad={() => setImageLoaded(true)}
      />
      
      {/* 🆕 Délimitations visibles selon la logique admin */}
      {showDelimitations && imageMetrics && delimitations.map((delimitation: DelimitationData, index: number) => (
        <div
          key={`delimitation-${index}`}
          className="absolute border-2 border-red-500 bg-red-100 bg-opacity-20 pointer-events-none"
          style={{
            ...computePxPosition(delimitation),
            zIndex: 1,
          }}
        >
          <div className="absolute -top-5 left-0 bg-red-500 text-white px-2 py-1 text-xs rounded">
            Zone imprimable {index + 1}
          </div>
        </div>
      ))}
      
      {/* 🆕 Design superposé UNIQUEMENT pour les produits traditionnels avec design */}
      {(() => {
        console.log('🎨 SimpleProductPreview - Vérification conditions design:', {
          productId: product.id,
          isTraditionalProduct,
          hasDesign: product.designApplication.hasDesign,
          designUrl: product.designApplication.designUrl,
          imageMetrics: !!imageMetrics,
          delimitationsCount: delimitations.length,
          willShowDesign: isTraditionalProduct && product.designApplication.hasDesign && product.designApplication.designUrl && imageMetrics
        });

        return null; // On retourne null ici pour ne pas casser le rendu
      })()}

      {isTraditionalProduct && product.designApplication.hasDesign && product.designApplication.designUrl && imageMetrics && (
        (() => {
          console.log('🎨 Affichage du design - Conditions vérifiées:', {
            hasDesign: product.designApplication.hasDesign,
            designUrl: product.designApplication.designUrl,
            imageMetrics: !!imageMetrics
          });
          
          const { x, y, scale, rotation, designWidth, designHeight } = designPosition;
          
          console.log('🎨 Affichage du design - designPosition:', designPosition);
          
          // 🆕 Obtenir la première délimitation et calculer sa position comme dans SellDesignPage
          const delimitation = delimitations[0];
          console.log('🎨 Affichage du design - delimitation:', delimitation);
          
          if (!delimitation) {
            console.log('🎨 Affichage du design - Pas de délimitation, pas d\'affichage');
            return null; // Pas de délimitation, pas d'affichage
          }
          
          const pos = computePxPosition(delimitation);
          console.log('🎨 Affichage du design - pos calculé:', pos);
          
          if (pos.width <= 0 || pos.height <= 0) {
            console.log('🎨 Affichage du design - Dimensions invalides, pas d\'affichage');
            return null;
          }
          
          // 🎯 NOUVEAU SYSTÈME : Utiliser un ratio CONSTANT de la délimitation (comme le produit et l'image sont fusionnés)
          // Le design utilise toujours le même pourcentage de la délimitation, indépendamment de la taille d'écran
          const designScale = scale || 0.8; // Ratio constant par défaut : 80% de la délimitation
          const actualDesignWidth = pos.width * designScale;
          const actualDesignHeight = pos.height * designScale;
          
          // 🆕 Contraintes de positionnement comme dans SellDesignPage
          const maxX = (pos.width - actualDesignWidth) / 2;
          const minX = -(pos.width - actualDesignWidth) / 2;
          const maxY = (pos.height - actualDesignHeight) / 2;
          const minY = -(pos.height - actualDesignHeight) / 2;
          const adjustedX = Math.max(minX, Math.min(x, maxX));
          const adjustedY = Math.max(minY, Math.min(y, maxY));
          
          console.log(`🎨 Positionnement exact comme SellDesignPage pour produit ${product.id}:`, {
            originalCoords: { x, y, scale, rotation },
            dimensions: { designWidth, designHeight, actualDesignWidth, actualDesignHeight },
            delimitation,
            pos,
            adjustedCoords: { adjustedX, adjustedY },
            constraints: { maxX, minX, maxY, minY }
          });
          
          return (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ 
                zIndex: 2,
                overflow: 'visible'
              }}
            >
              {/* Conteneur délimité EXACTEMENT comme dans ProductImageWithDesign */}
              <div
                className="absolute overflow-hidden"
                style={{
                  left: pos.left,
                  top: pos.top,
                  width: pos.width,
                  height: pos.height,
                  pointerEvents: 'none',
                  border: showDelimitations ? '2px solid blue' : 'none',
                }}
              >
                {/* Conteneur du design EXACTEMENT comme dans ProductImageWithDesign */}
                <div
                  className="absolute pointer-events-none select-none"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: actualDesignWidth,
                    height: actualDesignHeight,
                    transform: `translate(-50%, -50%) translate(${adjustedX}px, ${adjustedY}px) rotate(${rotation || 0}deg)`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.1s ease-out',
                    border: showDelimitations ? '2px solid green' : 'none',
                  }}
                >
                  {/* Image du design EXACTEMENT comme dans ProductImageWithDesign */}
                  <img
                    src={product.designApplication.designUrl}
                    alt="Design"
                    className="object-contain pointer-events-none select-none"
                    draggable={false}
                    style={{
                      width: '100%',
                      height: '100%',
                      transform: 'scale(1)', // Pas de scale supplémentaire, les dimensions sont déjà appliquées au conteneur
                    }}
                  />
                </div>
              </div>
              
              {/* 🔍 Debug: Points de référence */}
              {showDelimitations && (
                <>
                  {/* Centre de la délimitation */}
                  <div
                    className="absolute w-6 h-6 bg-purple-600 rounded-full border-2 border-white"
                    style={{
                      left: `${pos.left + pos.width / 2}px`,
                      top: `${pos.top + pos.height / 2}px`,
                      zIndex: 25,
                      transform: 'translate(-50%, -50%)',
                    }}
                    title={`Centre délimitation: (${(pos.left + pos.width / 2).toFixed(0)}, ${(pos.top + pos.height / 2).toFixed(0)})`}
                  >
                    <div className="w-full h-full bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      D
                    </div>
                  </div>
                  
                  {/* Position ajustée du design */}
                  <div
                    className="absolute w-4 h-4 bg-green-600 rounded-full border-2 border-white"
                    style={{
                      left: `${pos.left + adjustedX}px`,
                      top: `${pos.top + adjustedY}px`,
                      zIndex: 30,
                      transform: 'translate(-50%, -50%)',
                    }}
                    title={`Position ajustée: (${adjustedX.toFixed(0)}, ${adjustedY.toFixed(0)})`}
                  />
                  
                  {/* Position originale du design */}
                  <div
                    className="absolute w-4 h-4 bg-red-600 rounded-full"
                    style={{
                      left: `${pos.left + x}px`,
                      top: `${pos.top + y}px`,
                      zIndex: 20,
                      transform: 'translate(-50%, -50%)',
                    }}
                    title={`Position originale: (${x}, ${y})`}
                  />
                </>
              )}
            </div>
          );
        })()
      )}

      {/* ✅ Slider de couleurs - UNIQUEMENT pour produits traditionnels */}
      {showColorSlider && isTraditionalProduct && product.selectedColors.length > 1 && (
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePreviousColor();
            }}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex-1 flex items-center justify-center gap-2 mx-3">
            {product.selectedColors.map((color) => (
              <button
                key={color.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleColorChange(color.id);
                }}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  color.id === currentColorId ? 'border-blue-500 scale-110 shadow-lg' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color.colorCode }}
                title={color.name}
              />
            ))}
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNextColor();
            }}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}


      {/* ✅ Indicateur d'images multiples pour produits wizard - suggère de cliquer */}
      {isWizardProduct && product.images && product.images.total > 1 && (
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
          <span>📸</span>
          <span>{product.images.total} images</span>
          <span>→</span>
        </div>
      )}

      {/* ✅ Indicateurs de statut pour produits traditionnels */}
      {!hideValidationBadges && isTraditionalProduct && !product.designApplication.hasDesign && (
        <div className="absolute top-10 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
          Pas de design
        </div>
      )}


      {/* Informations de debug */}
      {showDelimitations && imageMetrics && (
        <div className="absolute bottom-16 right-2 bg-black bg-opacity-70 text-white p-2 rounded text-xs font-mono">
          <div>Couleur: {currentColor?.name}</div>
          <div>Design: {designPosition.x}, {designPosition.y}</div>
          <div>Échelle: {designPosition.scale.toFixed(2)}</div>
          <div>Délimitations: {delimitations.length}</div>
          <div>Métriques: {imageMetrics.originalWidth}x{imageMetrics.originalHeight}</div>
          <div>Affichage: {imageMetrics.displayWidth.toFixed(0)}x{imageMetrics.displayHeight.toFixed(0)}</div>
        </div>
      )}
    </div>
  );
};

export default SimpleProductPreview; 