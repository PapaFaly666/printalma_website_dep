import React, { useState, useEffect } from 'react';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Target, PiggyBank, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Product } from '../../services/productService';

interface SizePricingConfigProps {
  product: Product;
  onPricesChange?: (productId: number, prices: Record<string, { salePrice: number; profit: number }>) => void;
  currentPrices?: Record<number, Record<string, { salePrice: number; profit: number }>>;
  commissionRate?: number; // Taux de commission en % (ex: 40 pour 40%)
  activeSizes?: Array<{ sizeName: string }>; // Liste des tailles actives à afficher
}

interface SizePriceState {
  salePrice: number;
  profit: number;
  costPrice: number;
}

export const SizePricingConfig: React.FC<SizePricingConfigProps> = ({
  product,
  onPricesChange,
  currentPrices = {},
  commissionRate = 40, // Par défaut 40%
  activeSizes // 🆕 Tailles actives à afficher
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sizePrices, setSizePrices] = useState<Record<string, SizePriceState>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize prices from product data
  useEffect(() => {
    if (product.sizePrices && product.sizePrices.length > 0) {
      const initialPrices: Record<string, SizePriceState> = {};

      // 🆕 FILTRER: Ne garder que les tailles actives si activeSizes est fourni
      const sizesToProcess = activeSizes
        ? product.sizePrices.filter(sp => activeSizes.some((as: any) => as.sizeName === sp.size))
        : product.sizePrices;

      sizesToProcess.forEach(sp => {
        const existingPrices = currentPrices[product.id]?.[sp.size];
        initialPrices[sp.size] = {
          costPrice: sp.costPrice,
          salePrice: existingPrices?.salePrice ?? sp.suggestedPrice,
          profit: existingPrices?.profit ?? Math.max(0, sp.suggestedPrice - sp.costPrice)
        };
      });
      setSizePrices(initialPrices);
    } else if (product.useGlobalPricing && product.globalCostPrice && product.globalSuggestedPrice) {
      // Global pricing - create single entry
      const existingPrices = currentPrices[product.id]?.['global'];
      setSizePrices({
        global: {
          costPrice: product.globalCostPrice,
          salePrice: existingPrices?.salePrice ?? product.globalSuggestedPrice,
          profit: existingPrices?.profit ?? Math.max(0, product.globalSuggestedPrice - product.globalCostPrice)
        }
      });
    }
  }, [product, currentPrices]);

  // Calculate profit when sale price changes
  const handleSalePriceChange = (size: string, newSalePrice: number) => {
    const currentSizePrice = sizePrices[size];
    if (!currentSizePrice) return;

    const newProfit = Math.max(0, newSalePrice - currentSizePrice.costPrice);
    const updatedPrices = {
      ...sizePrices,
      [size]: {
        ...currentSizePrice,
        salePrice: newSalePrice,
        profit: newProfit
      }
    };
    setSizePrices(updatedPrices);

    // Validate
    const minRecommendedPrice = currentSizePrice.costPrice * 1.10;
    if (newSalePrice < minRecommendedPrice) {
      setErrors(prev => ({
        ...prev,
        [size]: `Prix recommandé minimum: ${Math.round(minRecommendedPrice).toLocaleString()} FCFA`
      }));
    } else {
      setErrors(prev => {
        const { [size]: _, ...rest } = prev;
        return rest;
      });
    }

    // Notify parent
    onPricesChange?.(product.id, { [size]: { salePrice: newSalePrice, profit: newProfit } });
  };

  // Calculate sale price when profit changes
  const handleProfitChange = (size: string, newProfit: number) => {
    const currentSizePrice = sizePrices[size];
    if (!currentSizePrice) return;

    const newSalePrice = currentSizePrice.costPrice + newProfit;
    const updatedPrices = {
      ...sizePrices,
      [size]: {
        ...currentSizePrice,
        salePrice: newSalePrice,
        profit: newProfit
      }
    };
    setSizePrices(updatedPrices);

    // Validate
    const minRecommendedProfit = currentSizePrice.costPrice * 0.10;
    if (newProfit < minRecommendedProfit) {
      setErrors(prev => ({
        ...prev,
        [size]: `Bénéfice recommandé minimum: ${Math.round(minRecommendedProfit).toLocaleString()} FCFA (10%)`
      }));
    } else {
      setErrors(prev => {
        const { [size]: _, ...rest } = prev;
        return rest;
      });
    }

    // Notify parent
    onPricesChange?.(product.id, { [size]: { salePrice: newSalePrice, profit: newProfit } });
  };

  // Get label for size
  const getSizeLabel = (size: string) => {
    return size === 'global' ? 'Toutes tailles' : size;
  };

  // Calculate net profit (after commission)
  const getNetProfit = (profit: number): number => {
    const commission = (profit * commissionRate) / 100;
    return Math.max(0, profit - commission);
  };

  // Calculate commission amount
  const getCommissionAmount = (profit: number): number => {
    return Math.round((profit * commissionRate) / 100);
  };

  // Calculate revenue range (min to max profit)
  const getRevenueRange = () => {
    const profits = Object.values(sizePrices).map(p => p.profit);
    if (profits.length === 0) return { min: 0, max: 0, avg: 0 };
    const min = Math.min(...profits);
    const max = Math.max(...profits);
    const avg = profits.reduce((sum, p) => sum + p, 0) / profits.length;
    return { min, max, avg };
  };

  // Calculate total revenue (sum of all profits AFTER commission)
  const getTotalRevenue = () => {
    const profits = Object.values(sizePrices).map(p => getNetProfit(p.profit));
    if (profits.length === 0) return 0;
    return profits.reduce((sum, p) => sum + p, 0);
  };

  const sizeKeys = Object.keys(sizePrices);
  if (sizeKeys.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aucun prix de revient configuré pour ce produit
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700 hover:from-purple-100 hover:to-blue-100 dark:hover:from-purple-900/30 dark:hover:to-blue-900/30 transition-all"
      >
        <div className="flex items-center gap-3">
          <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <div className="text-left">
            <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-200">
              Système de prix suggéré activé
            </h4>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              {sizeKeys.length === 1 && sizeKeys[0] === 'global'
                ? 'Prix global pour toutes les tailles'
                : `${sizeKeys.length} taille${sizeKeys.length > 1 ? 's' : ''} disponible${sizeKeys.length > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="h-5 w-5 text-purple-600" /> : <ChevronDown className="h-5 w-5 text-purple-600" />}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Info banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <span className="font-medium">💡 MARGE RECOMMANDÉE:</span> Il est conseillé de vendre au minimum à prix de revient + 10%
              </p>
            </div>
          </div>

          {/* Size pricing cards */}
          {sizeKeys.map((size) => {
            const sizePrice = sizePrices[size];
            const sizeLabel = getSizeLabel(size);
            const error = errors[size];

            return (
              <div
                key={size}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-4"
              >
                {/* Size header */}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-medium px-2 py-1">
                    {sizeLabel}
                  </Badge>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Coût: {sizePrice.costPrice.toLocaleString()} FCFA
                  </div>
                </div>

                {/* Cost and suggested price display */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 border border-gray-200 dark:border-gray-700">
                    <div className="text-gray-600 dark:text-gray-400 mb-1">Prix de revient</div>
                    <div className="font-semibold text-gray-800 dark:text-gray-200">
                      {sizePrice.costPrice.toLocaleString()} FCFA
                    </div>
                  </div>
                  <div className="bg-purple-100/50 dark:bg-purple-900/50 rounded p-3 border border-purple-200 dark:border-purple-700">
                    <div className="text-purple-600 dark:text-purple-300 mb-1">Prix suggéré</div>
                    <div className="font-bold text-purple-800 dark:text-purple-200">
                      {(sizePrice.costPrice + sizePrice.profit).toLocaleString()} FCFA
                    </div>
                  </div>
                </div>

                {/* Sale price input */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Prix de vente
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="100"
                      value={sizePrice.salePrice}
                      onChange={(e) => handleSalePriceChange(size, Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium whitespace-nowrap">FCFA</span>
                  </div>
                </div>

                {/* Profit input */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-green-700 dark:text-green-300">
                    Votre bénéfice
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="100"
                      value={sizePrice.profit}
                      onChange={(e) => handleProfitChange(size, Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium whitespace-nowrap">FCFA</span>
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded p-2">
                    {error}
                  </div>
                )}
              </div>
            );
          })}

          {/* Revenue summary - par taille */}
          <div className="bg-green-50 dark:bg-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
            <div className="flex items-center gap-2 mb-3">
              <PiggyBank className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                Vos revenus par vente (après commission)
              </span>
            </div>
            <div className="space-y-2">
              {sizeKeys.map((size) => {
                const sizePrice = sizePrices[size];
                const sizeLabel = getSizeLabel(size);
                const netProfit = getNetProfit(sizePrice.profit);

                return (
                  <div key={size} className="flex items-center justify-between text-sm">
                    <span className="text-green-600 dark:text-green-400">{sizeLabel}:</span>
                    <span className="font-bold text-green-800 dark:text-green-200">
                      {netProfit.toLocaleString()} FCFA
                    </span>
                  </div>
                );
              })}
              {sizeKeys.length > 1 && (
                <div className="pt-2 mt-2 border-t border-green-200 dark:border-green-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-700 dark:text-green-300 font-medium">Total (toutes tailles):</span>
                    <span className="font-bold text-green-800 dark:text-green-200">
                      {getTotalRevenue().toLocaleString()} FCFA
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SizePricingConfig;
