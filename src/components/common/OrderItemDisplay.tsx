import React from 'react';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { OrderItemDto } from '../../types/order';

interface OrderItemDisplayProps {
  item: OrderItemDto;
  showPrice?: boolean;
  className?: string;
}

const OrderItemDisplay: React.FC<OrderItemDisplayProps> = ({
  item,
  showPrice = true,
  className = ''
}) => {
  const { product } = item;

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('fr-SN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price || 0) + ' CFA';
  };

  return (
    <Card className={`order-item-display ${className}`}>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Informations produit */}
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-2">
              {product?.name || 'Produit'}
            </h3>
            
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
              <div>
                <span className="font-medium">Quantité:</span> {item.quantity}
              </div>
              {item.size && (
                <div>
                  <span className="font-medium">Taille:</span> {item.size}
                </div>
              )}
              {showPrice && (
                <div>
                  <span className="font-medium">Prix unitaire:</span> {formatPrice(item.unitPrice)}
                </div>
              )}
              {showPrice && (
                <div>
                  <span className="font-medium">Total:</span> {formatPrice(item.totalPrice || (item.unitPrice * item.quantity))}
                </div>
              )}
            </div>
          </div>

          {/* Images du produit */}
          <div className="flex flex-col md:flex-row gap-4 md:w-1/2">
            {/* Image du design */}
            {product?.designImageUrl && (
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Design</h4>
                <img 
                  src={product.designImageUrl} 
                  alt={`Design ${product.designName || product.name}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                {product.designName && (
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    {product.designName}
                  </p>
                )}
              </div>
            )}

            {/* 🆕 Image de la couleur commandée */}
            {product?.orderedColorImageUrl && (
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Couleur commandée</h4>
                <img 
                  src={product.orderedColorImageUrl}
                  alt={`Couleur ${product.orderedColorName}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                <div className="mt-2 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      {product.orderedColorName}
                    </span>
                    {product.orderedColorHexCode && (
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: product.orderedColorHexCode }}
                        title={product.orderedColorHexCode}
                      />
                    )}
                  </div>
                  {product.orderedColorHexCode && (
                    <p className="text-xs text-gray-500 mt-1">
                      {product.orderedColorHexCode}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Fallback si pas d'image de couleur spécifique */}
            {!product?.orderedColorImageUrl && (item.color || item.selectedColor) && (
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Couleur</h4>
                <div className="w-full h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    {item.selectedColor?.hexCode ? (
                      <div 
                        className="w-16 h-16 rounded-full border border-gray-300 mx-auto mb-2"
                        style={{ backgroundColor: item.selectedColor.hexCode }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-300 mx-auto mb-2" />
                    )}
                    <p className="text-sm font-medium text-gray-700">
                      {item.selectedColor?.name || item.color || 'Couleur inconnue'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Badge de statut de l'image */}
        <div className="mt-4 flex flex-wrap gap-2">
          {product?.orderedColorImageUrl && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              ✅ Image de couleur disponible
            </Badge>
          )}
          {!product?.orderedColorImageUrl && (
            <Badge variant="outline" className="border-yellow-300 text-yellow-800">
              ⚠️ Image de couleur non disponible
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderItemDisplay; 