import React, { useState, useMemo } from 'react';
import { X, TableProperties, ShoppingCart } from 'lucide-react';
import { Button } from './ui/button';

interface SizeQuantity {
  size: string;
  sizeId?: number;
  quantity: number;
}

interface SizeQuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  productPrice: number;
  productName: string;
  productSizes: (string | { id?: number; sizeName?: string; name?: string })[]; // Tailles venant de la base de données (strings ou objets)
  onAddToCart: (selections: SizeQuantity[]) => void;
}

const SizeQuantityModal: React.FC<SizeQuantityModalProps> = ({
  isOpen,
  onClose,
  productPrice,
  productName,
  productSizes,
  onAddToCart
}) => {
  // Fonction pour normaliser les tailles (strings ou objets)
  const normalizeSizes = (sizes: (string | { id?: number; sizeName?: string; name?: string })[]): string[] => {
    return sizes.map(size => {
      if (typeof size === 'string') {
        return size;
      }
      // Si c'est un objet, extraire le nom de taille
      return size.sizeName || size.name || 'Taille inconnue';
    });
  };

  const normalizedSizes = React.useMemo(() => normalizeSizes(productSizes), [productSizes]);

  // Initialiser les quantités avec les tailles normalisées
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    normalizedSizes.reduce((acc, size) => ({ ...acc, [size]: 0 }), {})
  );
  const [showSizeChart, setShowSizeChart] = useState(false);

  // Réinitialiser les quantités quand les tailles du produit changent
  React.useEffect(() => {
    setQuantities(normalizedSizes.reduce((acc, size) => ({ ...acc, [size]: 0 }), {}));
  }, [normalizedSizes]);

  // Calculer le total d'articles et le prix
  const { totalItems, totalPrice } = useMemo(() => {
    const items = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
    const total = items * productPrice;

    return {
      totalItems: items,
      totalPrice: total
    };
  }, [quantities, productPrice]);

  const handleQuantityChange = (size: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [size]: Math.max(0, (prev[size] || 0) + delta)
    }));
  };

  const handleAddToCart = () => {
    const selections = normalizedSizes
      .filter(size => quantities[size] > 0)
      .map((size, index) => {
        // Trouver l'objet de taille original pour récupérer le sizeId
        const originalSize = productSizes[index];
        const sizeId = typeof originalSize === 'object' ? originalSize.id : undefined;

        return {
          size,
          sizeId,
          quantity: quantities[size]
        };
      });

    if (selections.length === 0) return;

    onAddToCart(selections);
    onClose();
  };

  const resetQuantities = () => {
    setQuantities(normalizedSizes.reduce((acc, size) => ({ ...acc, [size]: 0 }), {}));
  };

  if (!isOpen) return null;

  // Gérer le cas où il n'y a pas de tailles
  if (!normalizedSizes || normalizedSizes.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col sm:rounded-2xl rounded-t-2xl p-6">
          <div className="text-center py-8">
            <p className="text-gray-900 font-semibold mb-2">Aucune taille disponible</p>
            <p className="text-sm text-gray-600 mb-4">Ce produit n'a pas de tailles configurées.</p>
            <Button onClick={onClose}>Fermer</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col max-h-[90vh] sm:rounded-2xl rounded-t-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gray-50 sm:rounded-t-2xl rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Choisir la taille</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Size List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            {normalizedSizes.map((size, index) => (
              <div
                key={`${size}-${index}`}
                className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900 w-12">{size}</span>

                {/* Quantity Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleQuantityChange(size, -1)}
                    disabled={quantities[size] === 0}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label={`Diminuer ${size}`}
                  >
                    <span className="text-gray-700 font-semibold">−</span>
                  </button>

                  <span className="w-10 text-center text-sm font-medium text-gray-900">
                    {quantities[size]}
                  </span>

                  <button
                    onClick={() => handleQuantityChange(size, 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
                    aria-label={`Augmenter ${size}`}
                  >
                    <span className="text-gray-700 font-semibold">+</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Size Chart Link */}
          <button
            onClick={() => setShowSizeChart(!showSizeChart)}
            className="mt-4 flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <TableProperties className="w-4 h-4" />
            <span>Tableau des tailles</span>
          </button>

          {/* Size Chart Display */}
          {showSizeChart && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-blue-200">
                    <th className="text-left py-2 text-gray-700">Taille</th>
                    <th className="text-center py-2 text-gray-700">Tour de poitrine (cm)</th>
                    <th className="text-center py-2 text-gray-700">Longueur (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-blue-100"><td className="py-2">S</td><td className="text-center">88-96</td><td className="text-center">68</td></tr>
                  <tr className="border-b border-blue-100"><td className="py-2">M</td><td className="text-center">96-104</td><td className="text-center">70</td></tr>
                  <tr className="border-b border-blue-100"><td className="py-2">L</td><td className="text-center">104-112</td><td className="text-center">72</td></tr>
                  <tr className="border-b border-blue-100"><td className="py-2">XL</td><td className="text-center">112-120</td><td className="text-center">74</td></tr>
                  <tr className="border-b border-blue-100"><td className="py-2">XXL</td><td className="text-center">120-128</td><td className="text-center">76</td></tr>
                  <tr className="border-b border-blue-100"><td className="py-2">3XL</td><td className="text-center">128-136</td><td className="text-center">78</td></tr>
                  <tr><td className="py-2">4XL</td><td className="text-center">136-144</td><td className="text-center">80</td></tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Summary */}
        <div className="px-6 py-4 border-t bg-gray-50">
          {/* Price Info */}
          <div className="mb-4 p-4 bg-white rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Prix de l'article</span>
              <span className="text-base font-semibold text-gray-900">
                {productPrice.toLocaleString()} FCFA
              </span>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-700">
                {totalItems} article{totalItems > 1 ? 's' : ''} sélectionné{totalItems > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900">
                Total: {totalPrice.toLocaleString()} FCFA
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">hors frais de port</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {totalItems > 0 && (
              <Button
                onClick={resetQuantities}
                variant="outline"
                className="flex-1"
              >
                Réinitialiser
              </Button>
            )}
            <Button
              onClick={handleAddToCart}
              disabled={totalItems === 0}
              className={`flex-1 py-6 text-base font-semibold transition-all ${
                totalItems === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#90EE90] hover:bg-[#7FDD7F] text-gray-900'
              }`}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Ajouter au panier
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SizeQuantityModal;
