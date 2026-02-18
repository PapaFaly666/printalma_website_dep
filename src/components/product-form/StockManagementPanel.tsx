import React from 'react';
import { motion } from 'framer-motion';
import { PackageOpen, Plus, Minus, AlertCircle } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { AdminButton } from '../admin/AdminButton';

// Structure de stock par taille (pour une couleur)
interface StockBySize {
  [size: string]: number;
}

// ColorVariation avec son stock
interface ColorVariation {
  id?: string;
  name: string;
  colorCode: string;
  stock?: StockBySize;
  images?: any[];
}

interface StockManagementPanelProps {
  sizes: string[];
  colorVariations: ColorVariation[];
  onStockChange: (colorIndex: number, stock: StockBySize) => void;
}

export const StockManagementPanel: React.FC<StockManagementPanelProps> = ({
  sizes,
  colorVariations,
  onStockChange
}) => {
  // Fonction pour obtenir le stock d'une taille pour une couleur
  const getStock = (colorIndex: number, size: string): number => {
    return colorVariations[colorIndex]?.stock?.[size] || 0;
  };

  // Fonction pour mettre à jour le stock
  const updateStock = (colorIndex: number, size: string, value: number) => {
    const currentStock = colorVariations[colorIndex]?.stock || {};
    const newStock = {
      ...currentStock,
      [size]: Math.max(0, value) // Éviter les valeurs négatives
    };
    onStockChange(colorIndex, newStock);
  };

  // Fonction pour incrémenter/décrémenter
  const adjustStock = (colorIndex: number, size: string, delta: number) => {
    const currentStock = getStock(colorIndex, size);
    updateStock(colorIndex, size, currentStock + delta);
  };

  // Calculer le stock total pour une couleur
  const getTotalStockForColor = (colorIndex: number): number => {
    const stock = colorVariations[colorIndex]?.stock || {};
    return Object.values(stock).reduce((sum, qty) => sum + qty, 0);
  };

  // Calculer le stock total général
  const getTotalStock = () => {
    let total = 0;
    colorVariations.forEach((_, index) => {
      total += getTotalStockForColor(index);
    });
    return total;
  };

  // Remplir avec une quantité pour toutes les tailles d'une couleur
  const fillAllSizes = (colorIndex: number, quantity: number) => {
    const newStock: StockBySize = {};
    sizes.forEach(size => {
      newStock[size] = quantity;
    });
    onStockChange(colorIndex, newStock);
  };

  if (sizes.length === 0 || colorVariations.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
        <PackageOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h4 className="font-semibold text-gray-700 mb-1">
          Configuration requise
        </h4>
        <p className="text-sm text-gray-500">
          {sizes.length === 0 && 'Ajoutez des tailles à l\'étape précédente'}
          {sizes.length === 0 && colorVariations.length === 0 && ' et '}
          {colorVariations.length === 0 && 'ajoutez des variations de couleur'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="flex items-center justify-between p-4 bg-[rgb(20,104,154)]/5 rounded-lg border border-[rgb(20,104,154)]/30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[rgb(20,104,154)] rounded-lg">
            <PackageOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Gestion du stock par variation
            </h3>
            <p className="text-sm text-gray-600">
              {sizes.length} taille{sizes.length > 1 ? 's' : ''} × {colorVariations.length} couleur{colorVariations.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Badge className="bg-[rgb(20,104,154)] text-white text-lg px-4 py-2">
          {getTotalStock()} unités
        </Badge>
      </div>

      {/* Section pour chaque variation de couleur */}
      {colorVariations.map((variation, colorIndex) => (
        <motion.div
          key={colorIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: colorIndex * 0.1 }}
          className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden"
        >
          {/* En-tête de la couleur */}
          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm"
                  style={{ backgroundColor: variation.colorCode }}
                />
                <div>
                  <h4 className="font-bold text-gray-900">
                    {variation.name || `Couleur ${colorIndex + 1}`}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Stock total: {getTotalStockForColor(colorIndex)} unités
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-sm">
                {sizes.length} tailles
              </Badge>
            </div>
          </div>

          {/* Tableau de stock pour cette couleur */}
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-4">
              {sizes.map((size, sizeIndex) => {
                const stock = getStock(colorIndex, size);
                const isLowStock = stock > 0 && stock < 10;
                const isOutOfStock = stock === 0;

                return (
                  <motion.div
                    key={`${colorIndex}-${sizeIndex}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: sizeIndex * 0.05 }}
                    className={`
                      p-3 rounded-lg border-2 transition-all
                      ${isOutOfStock
                        ? 'border-red-300 bg-red-50'
                        : isLowStock
                        ? 'border-amber-300 bg-amber-50'
                        : 'border-green-300 bg-green-50'
                      }
                    `}
                  >
                    <Label className="text-xs font-semibold text-gray-700 mb-2 block">
                      {size}
                    </Label>
                    <div className="flex items-center gap-2">
                      <AdminButton
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => adjustStock(colorIndex, size, -1)}
                        disabled={stock === 0}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </AdminButton>

                      <Input
                        type="number"
                        min="0"
                        value={stock}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          updateStock(colorIndex, size, value);
                        }}
                        className={`
                          w-16 text-center font-bold
                          ${isOutOfStock
                            ? 'border-red-400 text-red-600'
                            : isLowStock
                            ? 'border-amber-400 text-amber-600'
                            : 'border-green-400 text-green-600'
                          }
                        `}
                      />

                      <AdminButton
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => adjustStock(colorIndex, size, 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </AdminButton>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Actions rapides pour cette couleur */}
            <div className="flex gap-3">
              <AdminButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillAllSizes(colorIndex, 10)}
                className="flex-1"
              >
                Définir tout à 10
              </AdminButton>
              <AdminButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillAllSizes(colorIndex, 0)}
                className="flex-1"
              >
                Réinitialiser
              </AdminButton>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Tableau récapitulatif */}
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
        <div className="p-4 bg-[rgb(20,104,154)]/5 border-b-2 border-gray-200">
          <h4 className="font-bold text-gray-900">
            Récapitulatif global
          </h4>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Couleur
                </th>
                {sizes.map((size, idx) => (
                  <th key={idx} className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                    {size}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {colorVariations.map((variation, colorIndex) => (
                <tr key={colorIndex} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border-2 border-gray-300"
                        style={{ backgroundColor: variation.colorCode }}
                      />
                      <span className="font-medium text-gray-900">
                        {variation.name}
                      </span>
                    </div>
                  </td>
                  {sizes.map((size, sizeIdx) => (
                    <td key={sizeIdx} className="px-4 py-3 text-center text-gray-900 font-medium">
                      {getStock(colorIndex, size)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center font-bold text-[rgb(20,104,154)]">
                    {getTotalStockForColor(colorIndex)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100">
              <tr>
                <td className="px-4 py-3 font-bold text-gray-900">
                  Total général
                </td>
                {sizes.map((size, idx) => (
                  <td key={idx} className="px-4 py-3 text-center font-bold text-gray-900">
                    {colorVariations.reduce((sum, _, colorIndex) => sum + getStock(colorIndex, size), 0)}
                  </td>
                ))}
                <td className="px-4 py-3 text-center font-bold text-lg text-[rgb(20,104,154)]">
                  {getTotalStock()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-600">Rupture de stock</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span className="text-gray-600">Stock faible (&lt; 10)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-600">En stock</span>
        </div>
      </div>
    </div>
  );
};
