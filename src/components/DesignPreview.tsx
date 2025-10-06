import React from 'react';
import ProductImageWithDesign from './ProductImageWithDesign';

interface DesignPreviewProps {
  adminProduct: {
    name: string;
    images: {
      colorVariations: Array<{
        id: number;
        name: string;
        colorCode: string;
        images: Array<{
          id: number;
          url: string;
          viewType: string;
          delimitations: any[];
        }>;
      }>;
    };
  };
  designUrl: string;
  designConfig: {
    positioning: 'CENTER' | 'TOP' | 'BOTTOM';
    scale: number;
  };
  selectedColors: Array<{ id: number; name: string; colorCode: string }>;
  maxImages?: number;
}

const DesignPreview: React.FC<DesignPreviewProps> = ({
  adminProduct,
  designUrl,
  designConfig,
  selectedColors,
  maxImages = 4
}) => {
  // Collecter toutes les images des couleurs sélectionnées
  const previewImages: Array<{
    image: any;
    color: any;
  }> = [];

  selectedColors.forEach(selectedColor => {
    const colorVariation = adminProduct.images.colorVariations.find(
      cv => cv.id === selectedColor.id
    );
    
    if (colorVariation) {
      // Prioriser la vue FRONT, sinon prendre la première
      const frontImage = colorVariation.images.find(img => img.viewType === 'FRONT');
      const imageToUse = frontImage || colorVariation.images[0];
      
      if (imageToUse) {
        previewImages.push({
          image: imageToUse,
          color: colorVariation
        });
      }
    }
  });

  // Limiter le nombre d'images
  const limitedImages = previewImages.slice(0, maxImages);

  if (limitedImages.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <p className="text-gray-500">Aucune image de prévisualisation disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Aperçu du Design sur {adminProduct.name}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {limitedImages.map(({ image, color }, index) => (
          <div key={`preview-${image.id}-${color.id}`} className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <div
                className="w-4 h-4 rounded-full border"
                style={{ backgroundColor: color.colorCode }}
              />
              <span className="font-medium">{color.name}</span>
              <span className="text-gray-500">- {image.viewType}</span>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <ProductImageWithDesign
                productImage={image}
                designUrl={designUrl}
                designConfig={designConfig}
                showDelimitations={false}
                className="w-full max-w-xs mx-auto"
                /* Pas d'ID vendeur en mode preview */
              />
            </div>
          </div>
        ))}
      </div>

      {previewImages.length > maxImages && (
        <p className="text-sm text-gray-500 text-center">
          Et {previewImages.length - maxImages} autre(s) couleur(s)...
        </p>
      )}
    </div>
  );
};

export default DesignPreview; 