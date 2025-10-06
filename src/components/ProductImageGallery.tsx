import React, { useState } from 'react';
import ProductImageWithDesign from './ProductImageWithDesign';

interface ProductImageGalleryProps {
  product: {
    adminProduct: {
      images: {
        colorVariations: Array<{
          id: number;
          name: string;
          colorCode: string;
          images: Array<{
            id: number;
            url: string;
            viewType: string;
            delimitations: Array<{
              x: number;
              y: number;
              width: number;
              height: number;
              coordinateType: 'ABSOLUTE' | 'PERCENTAGE';
            }>;
          }>;
        }>;
      };
    };
    designApplication?: {
      designUrl: string;
      positioning: 'CENTER' | 'TOP' | 'BOTTOM';
      scale: number;
    };
    selectedColors: Array<{
      id: number;
      name: string;
      colorCode: string;
    }>;
  };
  showDelimitations?: boolean;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  product,
  showDelimitations = false
}) => {
  const [selectedColorId, setSelectedColorId] = useState(
    product.selectedColors[0]?.id || null
  );
  const [selectedViewType, setSelectedViewType] = useState<string>('FRONT');

  // Filtrer les couleurs sélectionnées par le vendeur
  const availableColors = product.adminProduct.images.colorVariations.filter(
    color => product.selectedColors.some(selected => selected.id === color.id)
  );

  // Obtenir la couleur actuellement sélectionnée
  const currentColor = availableColors.find(color => color.id === selectedColorId);

  // Obtenir l'image pour la vue sélectionnée
  const currentImage = currentColor?.images.find(
    img => img.viewType === selectedViewType
  ) || currentColor?.images[0];

  // Obtenir toutes les vues disponibles pour la couleur actuelle
  const availableViews = currentColor?.images.map(img => img.viewType) || [];

  return (
    <div className="space-y-6">
      {/* Sélecteur de couleur */}
      <div className="flex flex-wrap gap-3">
        <span className="text-sm font-medium text-gray-700 flex items-center">
          Couleur:
        </span>
        {availableColors.map((color) => (
          <button
            key={color.id}
            onClick={() => setSelectedColorId(color.id)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all ${
              selectedColorId === color.id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div
              className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: color.colorCode }}
            />
            <span className="text-sm font-medium">{color.name}</span>
          </button>
        ))}
      </div>

      {/* Sélecteur de vue */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-700 flex items-center">
          Vue:
        </span>
        {availableViews.map((viewType) => (
          <button
            key={viewType}
            onClick={() => setSelectedViewType(viewType)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedViewType === viewType
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {viewType}
          </button>
        ))}
      </div>

      {/* Image principale avec design */}
      <div className="flex justify-center bg-gray-50 rounded-lg p-6">
        {currentImage ? (
          <ProductImageWithDesign
            productImage={currentImage}
            designUrl={product.designApplication?.designUrl}
            designConfig={{
              positioning: product.designApplication?.positioning || 'CENTER',
              scale: product.designApplication?.scale || 0.8
            }}
            showDelimitations={showDelimitations}
            className="max-w-md"
            vendorProductId={(product as any)?.id || 0}
          />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Aucune image disponible pour cette couleur
          </div>
        )}
      </div>

      {/* Vignettes des autres vues */}
      {currentColor && currentColor.images.length > 1 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {currentColor.images.map((image) => (
            <button
              key={image.id}
              onClick={() => setSelectedViewType(image.viewType)}
              className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                selectedViewType === image.viewType
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <ProductImageWithDesign
                productImage={image}
                designUrl={product.designApplication?.designUrl}
                designConfig={{
                  positioning: product.designApplication?.positioning || 'CENTER',
                  scale: product.designApplication?.scale || 0.8
                }}
                showDelimitations={false}
                className="w-full"
                vendorProductId={(product as any)?.id || 0}
              />
            </button>
          ))}
        </div>
      )}

      {/* Toggle délimitations (mode debug) */}
      <div className="flex items-center space-x-2 text-sm">
        <input
          type="checkbox"
          id="show-delimitations"
          checked={showDelimitations}
          onChange={(e) => {
            // Cette prop devrait être gérée par le composant parent
            console.log('Toggle délimitations:', e.target.checked);
          }}
          className="rounded"
        />
        <label htmlFor="show-delimitations" className="text-gray-600">
          Afficher les zones de délimitation (Debug)
        </label>
      </div>
    </div>
  );
};

export default ProductImageGallery; 