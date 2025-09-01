import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight,
  Edit3, 
  Eye, 
  Trash2, 
  Rocket,
  Palette,
  Package,
  AlertCircle,
  Check,
  Clock,
  X,
  Edit2,
  Play,
  RotateCcw,
  CheckCircle,
  TrendingUp,
  ExternalLink,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardFooter } from '../ui/card';
import { toast } from 'sonner';
import { Skeleton } from '../ui/skeleton';
import { VendorProduct, vendorProductService } from '../../services/vendorProductService';
import ProductImageWithDesign from '../ProductImageWithDesign';
import ProductWithSavedTransforms from '../ProductWithSavedTransforms';

interface Mockup {
  id?: number;
  colorId: number;
  colorName: string;
  colorCode: string;
  mockupUrl: string;
  mockupPublicId?: string;
  width?: number;
  height?: number;
  generationStatus: 'GENERATING' | 'COMPLETED' | 'FAILED';
  generatedAt?: string;
}

// Interface unifiée pour les produits avec workflow
interface ProductWithWorkflow {
  id: number;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  category?: string | { name: string };
  status?: 'PUBLISHED' | 'PENDING' | 'DRAFT';
  forcedStatus?: 'PENDING' | 'DRAFT';
  isValidated?: boolean;
  designValidationStatus?: 'PENDING' | 'VALIDATED' | 'REJECTED';
  colorVariations?: Array<{
    id: number;
    name: string;
    images?: Array<{ url: string }>;
  }>;
  // 🆕 Architecture V2 - Structure admin préservée
  adminProduct?: {
    id: number;
    name: string;
    colorVariations: Array<{
      id: number;
      name: string;
      colorCode: string;
      images: Array<{
        url: string;
        viewType: string;
        delimitations?: Array<{
          x: number;
          y: number;
          width: number;
          height: number;
        }>;
      }>;
    }>;
  };
  designApplication?: {
    hasDesign: boolean;
    designBase64?: string;
    positioning?: 'CENTER';
    scale?: number;
    designTransforms?: Record<string, any>;
  };
  images?: {
    primaryImageUrl?: string;
    adminReferences?: Array<{
      colorName: string;
      colorCode: string;
      adminImageUrl: string;
    }>;
  };
}

interface ModernVendorProductCardProps {
  product: VendorProduct | ProductWithWorkflow;
  selectedColor?: string;
  onEdit?: (product: any) => void;
  onDelete?: (productId: number) => void;
  onPublish?: (productId: number) => void;
  onView?: (product: any) => void;
  onRefresh?: () => void;
  viewMode?: 'grid' | 'list';
  showHealthMetrics?: boolean;
  className?: string;
}

// 🎯 SOLUTION PRINCIPALE : Extraire l'URL d'image selon Architecture V2
const getProductImageUrl = (product: any, selectedColorIndex: number = 0): string => {
  console.log('🖼️ === EXTRACTION URL IMAGE ARCHITECTURE V2 ===');
  console.log('📋 Produit:', { id: product.id, name: product.name });
  
  // 🔄 STRATÉGIE 1 : Images admin préservées (Architecture V2)
  if (product.adminProduct?.colorVariations?.length > 0) {
    const colorVariation = product.adminProduct.colorVariations[selectedColorIndex] || product.adminProduct.colorVariations[0];
    if (colorVariation?.images?.length > 0) {
      const adminImageUrl = colorVariation.images[0].url;
      console.log('✅ Image admin trouvée:', adminImageUrl);
      return adminImageUrl;
    }
  }
  
  // 🔄 STRATÉGIE 2 : Images dans la structure "images" V2
  if (product.images?.primaryImageUrl) {
    console.log('✅ Image primaire V2 trouvée:', product.images.primaryImageUrl);
    return product.images.primaryImageUrl;
  }
  
  // 🔄 STRATÉGIE 3 : Références admin dans images
  if (product.images?.adminReferences?.length > 0) {
    const adminRef = product.images.adminReferences[0];
    console.log('✅ Référence admin trouvée:', adminRef.adminImageUrl);
    return adminRef.adminImageUrl;
  }
  
  // 🔄 STRATÉGIE 4 : ColorVariations legacy
  if (product.colorVariations?.length > 0) {
    const variation = product.colorVariations[selectedColorIndex] || product.colorVariations[0];
    if (variation?.images?.length > 0) {
      const imageUrl = variation.images[0].url;
      console.log('✅ Image legacy trouvée:', imageUrl);
      return imageUrl;
    }
  }
  
  // 🔄 STRATÉGIE 5 : Service vendorProductService
  if ('getPrimaryImageUrl' in vendorProductService) {
    try {
      const serviceUrl = vendorProductService.getPrimaryImageUrl(product as VendorProduct);
      if (serviceUrl && serviceUrl !== '/placeholder-image.jpg') {
        console.log('✅ Image service trouvée:', serviceUrl);
        return serviceUrl;
      }
    } catch (error) {
      console.warn('⚠️ Erreur service getPrimaryImageUrl:', error);
    }
  }
  
  // 🔄 STRATÉGIE 6 : Propriété directe imageUrl
  if (product.imageUrl && product.imageUrl.trim() && product.imageUrl !== '') {
    console.log('✅ Image directe trouvée:', product.imageUrl);
    return product.imageUrl;
  }
  
  // 🔄 STRATÉGIE 7 : Design comme fallback (si pas d'image admin)
  if (product.designApplication?.designBase64) {
    console.log('✅ Design utilisé comme fallback');
    return product.designApplication.designBase64;
  }
  
  // 🚨 FALLBACK FINAL : Placeholder
  console.log('⚠️ Aucune image trouvée, utilisation placeholder');
  return '/placeholder-image.jpg';
};

// Composant pour gérer l'affichage d'une image avec fallback
const ProductImageDisplay: React.FC<{
  src: string;
  alt: string;
  className?: string;
  onError?: () => void;
  showDesignBadge?: boolean;
  hasDesign?: boolean;
}> = ({ src, alt, className = "", onError, showDesignBadge = true, hasDesign = false }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    onError?.();
  };

  // 🚨 VALIDATION URL : Vérifier que l'URL n'est pas vide
  const isValidUrl = src && src.trim() && src !== '' && src !== 'undefined' && src !== 'null';

  if (!isValidUrl) {
    console.error('❌ URL d\'image invalide:', src);
    return (
      <div className={`relative ${className}`}>
        <div className="absolute inset-0 bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center text-gray-400">
          <AlertCircle className="h-8 w-8 mb-2" />
          <span className="text-sm font-medium">Image manquante</span>
          <span className="text-xs">URL: {src || 'vide'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-100"></div>
        </div>
      )}
      
      {error ? (
        <div className="absolute inset-0 bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center text-gray-400">
          <AlertCircle className="h-6 w-6 mb-1" />
          <span className="text-xs">Erreur chargement</span>
          <span className="text-xs break-all">{src.substring(0, 30)}...</span>
        </div>
      ) : (
        <>
          <img
            src={src}
            alt={alt}
            className={`transition-opacity duration-200 ${loading ? 'opacity-0' : 'opacity-100'} w-full h-full object-cover`}
            crossOrigin="anonymous"
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
          />
          
          {/* 🎨 Badge design (Architecture V2) */}
          {showDesignBadge && hasDesign && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                <Palette className="w-3 h-3 mr-1" />
                Design personnalisé
              </Badge>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Logique de détection workflow
const getProductDisplay = (product: any) => {
  const workflowType = product.forcedStatus === 'PENDING' ? 'AUTO_PUBLISH' : 'MANUAL_PUBLISH';
  const displayStatus = product.status || 'DRAFT';
  const showPublishButton = (
    product.forcedStatus === 'DRAFT' && 
    product.isValidated === true &&
    displayStatus === 'DRAFT'
  );
  
  const workflowMessage = workflowType === 'AUTO_PUBLISH' 
    ? "Workflow AUTO-PUBLISH activé" 
    : "Workflow MANUEL - Clic requis pour publier";
    
  return {
    workflowType,
    displayStatus,
    showPublishButton,
    workflowMessage
  };
};

// Badge de statut unifié
const StatusBadge: React.FC<{
  product: any;
}> = ({ product }) => {
  const display = getProductDisplay(product);
  
  if (display.displayStatus === 'PUBLISHED') {
    return (
      <Badge className="bg-black text-white hover:bg-gray-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Publié
      </Badge>
    );
  }
  
  if (display.displayStatus === 'PENDING') {
    return (
      <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
        <Clock className="w-3 h-3 mr-1" />
        En attente
      </Badge>
    );
  }
  
  if (display.displayStatus === 'DRAFT') {
    if (display.showPublishButton || product.isValidated) {
      return (
        <Badge className="bg-green-600 text-white hover:bg-green-700">
          <Rocket className="w-3 h-3 mr-1" />
          Prêt à publier
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-500 text-white hover:bg-gray-600">
          <Edit3 className="w-3 h-3 mr-1" />
          Brouillon
        </Badge>
      );
    }
  }
  
  return (
    <Badge className="bg-gray-400 text-white">
      <XCircle className="w-3 h-3 mr-1" />
      Inconnu
    </Badge>
  );
};

// Indicateur de workflow
const WorkflowIndicator = ({ product }: { product: any }) => {
  const display = getProductDisplay(product);
  
  return (
    <div className="text-xs space-y-1">
      <div className={`font-medium ${
        display.workflowType === 'AUTO_PUBLISH' ? 'text-green-600' : 'text-purple-600'
      }`}>
        {display.workflowMessage}
      </div>
      
      {product.designValidationStatus === 'PENDING' && (
        <div className="text-yellow-600 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Design en cours de validation
        </div>
      )}
      {product.designValidationStatus === 'VALIDATED' && (
        <div className="text-green-600 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Design validé
        </div>
      )}
      {product.designValidationStatus === 'REJECTED' && (
        <div className="text-red-600 flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Design rejeté
        </div>
      )}
    </div>
  );
};

export const ModernVendorProductCard: React.FC<ModernVendorProductCardProps> = ({
  product,
  selectedColor = 'all',
  onEdit,
  onDelete,
  onPublish,
  onView,
  onRefresh,
  viewMode = 'grid',
  showHealthMetrics = true,
  className = ''
}) => {
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [regeneratingMockups, setRegeneratingMockups] = useState(false);

  // 🎯 SOLUTION PRINCIPALE : Obtenir l'URL d'image avec fallbacks multiples
  const imageUrl = getProductImageUrl(product, selectedColorIndex);
  
  // 🎨 Vérifier si le produit a un design (Architecture V2)
  const hasDesign = product.designApplication?.hasDesign || 
                   !!(product.designApplication?.designBase64) || 
                   !!(product as any).designUrl ||
                   !!(product as any).design;

  // 🎯 Obtenir les données de l'image avec délimitations pour l'affichage unifié
  const getProductImageData = () => {
    // Essayer d'obtenir les données admin d'abord
    const adminProduct = product.adminProduct;
    if (adminProduct?.colorVariations?.length > 0) {
      const colorVariation = adminProduct.colorVariations[selectedColorIndex] || adminProduct.colorVariations[0];
      if (colorVariation?.images?.length > 0) {
        const imageData = colorVariation.images[0];
        // Vérifier si on a des délimitations
        if (imageData.delimitations && imageData.delimitations.length > 0) {
          return {
            id: (imageData as any).id || product.id,
            url: imageData.url,
            viewType: imageData.viewType || 'front',
            delimitations: imageData.delimitations.map(d => ({
              x: d.x,
              y: d.y,
              width: d.width,
              height: d.height,
              coordinateType: 'PERCENTAGE' as const
            }))
          };
        }
      }
    }
    return null;
  };

  const productImageData = getProductImageData();
  const designUrl = product.designApplication?.designBase64 || (product as any).designUrl;

  // 🆕 Extraire les transformations sauvegardées
  const savedTransforms = product.designApplication?.designTransforms || null;

  // ✅ Calculer les métriques de santé
  const healthStatus = 'getProductHealthStatus' in vendorProductService 
    ? vendorProductService.getProductHealthStatus(product as VendorProduct)
    : { score: 100, status: 'excellent' as const, issues: [] };

  // ✅ Gérer la publication
  const handlePublish = async () => {
    if ('canPublishProduct' in vendorProductService && !vendorProductService.canPublishProduct(product as VendorProduct)) {
      toast.error('Ce produit ne peut pas être publié');
      return;
    }

    try {
      setLoading(true);
      
      if ('publishProduct' in vendorProductService) {
        await vendorProductService.publishProduct(product.id);
      }
      
      toast.success('Produit publié avec succès');
      onPublish?.(product.id);
      onRefresh?.();
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Gérer la suppression
  const handleDelete = async () => {
    try {
      setLoading(true);
      
      if ('deleteVendorProduct' in vendorProductService) {
        await vendorProductService.deleteVendorProduct(product.id);
      }
      
      toast.success('Produit supprimé');
      onDelete?.(product.id);
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const display = getProductDisplay(product);

  // 🎨 Affichage des couleurs disponibles (Architecture V2)
  const availableColors = product.adminProduct?.colorVariations || 
                         (product as any).colorVariations || 
                         (product as any).selectedColors || 
                         [];

  // ✅ Nom d'affichage (gère VendorProduct | ProductWithWorkflow)
  const displayName = (() => {
    if ('name' in product && typeof (product as any).name === 'string') return (product as any).name;
    if ((product as any).adminProduct?.name) return (product as any).adminProduct.name;
    return 'Sans nom';
  })();

  console.log('🖼️ Rendu ProductCard:', {
    productId: product.id,
    productName: displayName,
    imageUrl,
    hasDesign,
    hasDelimitations: !!productImageData,
    hasSavedTransforms: !!savedTransforms,
    transformsCount: savedTransforms ? Object.keys(savedTransforms).length : 0,
    savedTransformsData: savedTransforms,
    availableColors: availableColors.length
  });

  // ✅ Catégorie (gère VendorProduct | ProductWithWorkflow)
  const categoryLabel = (() => {
    if ('category' in product && (product as any).category != null) {
      const cat = (product as any).category;
      return typeof cat === 'object' ? (cat?.name || 'Non catégorisé') : (cat || 'Non catégorisé');
    }
    return 'Non catégorisé';
  })();

  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-200 hover:shadow-md">
      {/* Image du produit */}
      <div className="relative w-full h-48">
        {/* Utiliser ProductWithSavedTransforms pour conserver les positions */}
        {hasDesign && designUrl && productImageData ? (
          <ProductWithSavedTransforms
            productId={product.id}
            productImage={productImageData}
            designUrl={designUrl}
            designConfig={{
              positioning: product.designApplication?.positioning || 'CENTER',
              scale: product.designApplication?.scale || 0.6
            }}
            className="w-full h-full"
            interactive={false}
            showDelimitations={false}
            fallbackComponent={
              <ProductImageDisplay
                src={imageUrl}
                alt={displayName}
                className="w-full h-full"
                hasDesign={hasDesign}
                showDesignBadge={true}
              />
            }
          />
        ) : (
          <ProductImageDisplay
            src={imageUrl}
            alt={displayName}
            className="w-full h-full"
            hasDesign={hasDesign}
            showDesignBadge={true}
          />
        )}
        
        {/* 🎨 Indicateur de couleurs (Architecture V2) */}
        {availableColors.length > 1 && (
          <div className="absolute bottom-2 right-2 flex gap-1">
            {availableColors.slice(0, 3).map((color: any, index: number) => (
              <div
                key={color.id || index}
                className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: color.colorCode || '#ccc' }}
                title={color.name}
              />
            ))}
            {availableColors.length > 3 && (
              <div className="w-4 h-4 rounded-full bg-gray-500 border-2 border-white shadow-sm flex items-center justify-center">
                <span className="text-xs text-white font-bold">+</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-gray-900 dark:text-white truncate text-sm">
              {displayName}
            </h3>
            <StatusBadge product={product} />
          </div>
          
          {/* 🆕 Nom admin original (Architecture V2) */}
          {(product as any).originalAdminName && (product as any).originalAdminName !== displayName && (
            <p className="text-xs text-gray-400 mb-1 truncate">
              Base: {(product as any).originalAdminName}
            </p>
          )}
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 truncate">{categoryLabel}</p>
          
          <p className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: 'XOF',
              maximumFractionDigits: 0
            }).format(product.price)}
          </p>

          {/* Workflow Indicator */}
          <WorkflowIndicator product={product} />
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView?.(product)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-1" />
            Voir
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit?.(product)}
            className="flex-1"
          >
            <Edit2 className="w-4 h-4 mr-1" />
            Modifier
          </Button>
          
          {display.showPublishButton && (
            <Button 
              size="sm" 
              onClick={handlePublish}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Rocket className="w-4 h-4 mr-1" />
              Publier
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

// Skeleton pour le chargement
export const ModernVendorProductCardSkeleton: React.FC<{ 
  viewMode?: 'grid' | 'list' 
}> = ({ viewMode = 'grid' }) => {
  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="relative w-full h-48">
        <Skeleton className="w-full h-full" />
          </div>
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-20" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </Card>
  );
};

export default ModernVendorProductCard; 