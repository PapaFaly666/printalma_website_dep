import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Eye, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { 
  VendorProductDetail, 
  DesignPosition, 
  loadImage, 
  calculateDesignPosition,
  useVendorProductDetail 
} from '../../services/vendorProductDetailAPI';

interface ProductDesignPreviewV2Props {
  // ID du produit vendeur
  vendorProductId: number;
  
  // Couleur sélectionnée (optionnel, prendra la première par défaut)
  selectedColorId?: number;
  
  // Options d'affichage
  showInfo?: boolean;
  className?: string;
  width?: number;
  height?: number;
  
  // Callback pour les erreurs
  onError?: (error: string) => void;
  
  // Callback pour les clics (pour édition)
  onEdit?: () => void;
}

export const ProductDesignPreviewV2: React.FC<ProductDesignPreviewV2Props> = ({
  vendorProductId,
  selectedColorId,
  showInfo = false,
  className = '',
  width,
  height,
  onError,
  onEdit
}) => {
  console.log(`🎨 ProductDesignPreviewV2 initialisé pour produit ${vendorProductId}`);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // État des images
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [renderedDataUrl, setRenderedDataUrl] = useState<string | null>(null);
  
  // Hook personnalisé pour charger les données
  const { product, position, loading, error } = useVendorProductDetail(vendorProductId);
  
  console.log(`🎨 ProductDesignPreviewV2 état:`, { 
    vendorProductId, 
    loading, 
    error, 
    hasProduct: !!product,
    hasPosition: !!position 
  });
  
  // Fonction pour rendre le produit avec le design
  const renderProductWithDesign = async () => {
    if (!product || !canvasRef.current) return;
    
    setIsRendering(true);
    setRenderError(null);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Impossible d\'obtenir le contexte 2D du canvas');
      }
      
      // 1. Choisir la couleur et l'image du mock-up
      const selectedColor = selectedColorId 
        ? product.selectedColors.find(c => c.id === selectedColorId)
        : product.selectedColors[0];
      
      if (!selectedColor) {
        throw new Error('Aucune couleur sélectionnée disponible');
      }
      
      // Trouver la variation de couleur correspondante
      const colorVariation = product.adminProduct.colorVariations.find(
        cv => cv.id === selectedColor.id
      );
      
      if (!colorVariation || !colorVariation.images.length) {
        throw new Error(`Aucune image trouvée pour la couleur ${selectedColor.name}`);
      }
      
      // Prendre la première image (ou celle avec viewType "FRONT")
      const mockupImage = colorVariation.images.find(img => img.viewType === 'FRONT') 
        || colorVariation.images[0];
      
      if (!mockupImage.delimitations.length) {
        throw new Error('Aucune délimitation d\'impression trouvée');
      }
      
      // 2. Charger l'image du mock-up
      console.log('📸 Chargement du mock-up:', mockupImage.url);
      const mockupImg = await loadImage(mockupImage.url);
      
      // 3. Charger l'image du design
      console.log('🎨 Chargement du design:', product.designApplication.designUrl);
      const designImg = await loadImage(product.designApplication.designUrl);
      
      // 4. Configurer le canvas
      canvas.width = mockupImg.width;
      canvas.height = mockupImg.height;
      
      // 5. Dessiner le mock-up
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(mockupImg, 0, 0);
      
      // 6. Appliquer le design sur chaque délimitation
      const delimitation = mockupImage.delimitations[0]; // Première délimitation
      
      // Calculer la position finale du design
      const finalPosition = calculateDesignPosition(
        delimitation,
        position,
        product.designApplication.scale,
        mockupImg.width,
        mockupImg.height
      );
      
      console.log('📍 Position finale calculée:', finalPosition);
      console.log('🎯 Délimitation:', delimitation);
      
      // 7. Dessiner le design avec les transformations
      ctx.save();
      
      // Centrer les transformations sur la position du design
      ctx.translate(finalPosition.x, finalPosition.y);
      ctx.rotate((finalPosition.rotation * Math.PI) / 180);
      ctx.scale(finalPosition.scale, finalPosition.scale);
      
      // Dessiner le design centré sur le point de transformation
      const designWidth = designImg.width;
      const designHeight = designImg.height;
      ctx.drawImage(designImg, -designWidth / 2, -designHeight / 2, designWidth, designHeight);
      
      ctx.restore();
      
      // 8. Sauvegarder le résultat
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setRenderedDataUrl(dataUrl);
      
      console.log('✅ Rendu terminé avec succès');
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur de rendu';
      console.error('❌ Erreur lors du rendu:', error);
      setRenderError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsRendering(false);
    }
  };
  
  // Déclencher le rendu quand les données sont prêtes
  useEffect(() => {
    if (product && !loading && !error) {
      renderProductWithDesign();
    }
  }, [product, position, loading, error, selectedColorId]);
  
  // Styles pour le conteneur
  const containerStyles: React.CSSProperties = {
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : '100%',
    minHeight: '200px',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    cursor: onEdit ? 'pointer' : 'default'
  };
  
  // Gérer les clics
  const handleClick = () => {
    if (onEdit) {
      onEdit();
    }
  };
  
  // Indicateurs de statut
  const isLoading = loading || isRendering;
  const hasError = error || renderError;
  
  return (
    <div
      ref={containerRef}
      className={`product-design-preview-v2 ${className}`}
      style={containerStyles}
      onClick={handleClick}
    >
      {/* Canvas caché pour le rendu */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
      
      {/* Debug: Affichage simple pour tester */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-50 border-2 border-blue-200">
        <div className="text-center p-2">
          <div className="text-sm font-bold text-blue-800">Produit #{vendorProductId}</div>
          <div className="text-xs text-blue-600">
            {loading ? 'Chargement...' : error ? `Erreur: ${error}` : product ? 'Données OK' : 'Pas de données'}
          </div>
          {product && (
            <div className="text-xs text-blue-600 mt-1">
              Design: {product.designApplication?.designUrl ? 'Oui' : 'Non'}
            </div>
          )}
        </div>
      </div>
      
      {/* Indicateur de chargement */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="text-sm text-gray-500">
              {loading ? 'Chargement des données...' : 'Rendu en cours...'}
            </span>
          </div>
        </div>
      )}
      
      {/* Indicateur d'erreur */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
          <div className="flex flex-col items-center gap-2 text-red-600">
            <AlertCircle className="h-8 w-8" />
            <span className="text-sm text-center">
              {error || renderError}
            </span>
          </div>
        </div>
      )}
      
      {/* Image rendue */}
      {renderedDataUrl && !isLoading && !hasError && (
        <img
          src={renderedDataUrl}
          alt={product?.adminProduct.name || 'Produit avec design'}
          className="w-full h-full object-contain"
        />
      )}
      
      {/* Informations du produit */}
      {showInfo && product && (
        <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-75 text-white p-2 rounded">
          <div className="text-sm font-semibold">{product.adminProduct.name}</div>
          <div className="text-xs opacity-75">
            Design: {product.designApplication.designUrl.split('/').pop()}
          </div>
          {position && (
            <div className="text-xs opacity-75">
              Position: {Math.round(position.x)}, {Math.round(position.y)} | 
              Échelle: {Math.round(position.scale * 100)}%
            </div>
          )}
        </div>
      )}
      
      {/* Bouton d'édition */}
      {onEdit && (
        <div className="absolute top-2 right-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductDesignPreviewV2; 