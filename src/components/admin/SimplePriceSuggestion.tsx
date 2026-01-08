import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import Button from '../ui/Button';
import { Badge } from '../ui/badge';
import { DollarSign, Calculator, TrendingUp } from 'lucide-react';
import { productPriceService } from '../../services/productPriceService';

interface SimplePriceSuggestionProps {
  onPriceChange: (data: { price: number; suggestedPrice?: number }) => void;
  initialPrice?: number;
  initialSuggested?: number;
  disabled?: boolean;
}

export const SimplePriceSuggestion: React.FC<SimplePriceSuggestionProps> = ({
  onPriceChange,
  initialPrice = 0,
  initialSuggested = undefined,
  disabled = false
}) => {
  const [price, setPrice] = useState(initialPrice);
  const [suggestedPrice, setSuggestedPrice] = useState<number | undefined>(initialSuggested);
  const [baseCost, setBaseCost] = useState(0);

  const applySuggested = () => {
    if (suggestedPrice && suggestedPrice > 0) {
      setPrice(suggestedPrice);
      onPriceChange({ price: suggestedPrice, suggestedPrice });
    }
  };

  const calculateSuggested = () => {
    if (baseCost > 0) {
      const calculated = productPriceService.calculateSuggestedPrice(baseCost, 0.4);
      setSuggestedPrice(calculated);
      onPriceChange({ price, suggestedPrice: calculated });
    }
  };

  const handlePriceChange = (newPrice: number) => {
    setPrice(newPrice);
    onPriceChange({ price: newPrice, suggestedPrice });
  };

  const handleSuggestedChange = (newSuggested: number | undefined) => {
    setSuggestedPrice(newSuggested);
    onPriceChange({ price, suggestedPrice: newSuggested });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5 text-blue-600" />
          💰 Prix du Produit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Calculateur simple */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-blue-800 flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculateur Prix Suggéré
          </h4>
          
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label htmlFor="base-cost" className="text-sm">
                Coût de base (FCFA)
              </Label>
              <Input
                id="base-cost"
                type="number"
                value={baseCost || ''}
                onChange={(e) => setBaseCost(Number(e.target.value) || 0)}
                placeholder="Ex: 5000"
                disabled={disabled}
                min="0"
                step="100"
              />
            </div>
            
            <Button
              type="button"
              onClick={calculateSuggested}
              disabled={disabled || !baseCost}
              size="sm"
            >
              Calculer (+40%)
            </Button>
          </div>
        </div>

        {/* Prix suggéré */}
        <div className="space-y-2">
          <Label htmlFor="suggested-price" className="font-medium">
            💡 Prix suggéré (FCFA) - Optionnel
          </Label>
          <div className="flex gap-2">
            <Input
              id="suggested-price"
              type="number"
              value={suggestedPrice || ''}
              onChange={(e) => handleSuggestedChange(Number(e.target.value) || undefined)}
              placeholder="Optionnel"
              disabled={disabled}
              min="0"
              step="100"
              className="flex-1"
            />
            {suggestedPrice && suggestedPrice > 0 && (
              <Button 
                type="button" 
                onClick={applySuggested}
                disabled={disabled}
                size="sm"
                variant="outline"
              >
                Appliquer
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-600">
            💾 Ce prix sera sauvegardé en base de données comme référence admin
          </p>
        </div>
        
        {/* Prix de vente */}
        <div className="space-y-2">
          <Label htmlFor="final-price" className="font-medium">
            💰 Prix de vente (FCFA) - Requis *
          </Label>
          <Input
            id="final-price"
            type="number"
            value={price}
            onChange={(e) => handlePriceChange(Number(e.target.value) || 0)}
            placeholder="Prix final"
            required
            min="1"
            step="100"
            disabled={disabled}
            className="font-semibold text-lg"
          />
          <p className="text-xs text-gray-600">
            💳 Prix affiché aux clients sur le site
          </p>
        </div>
        
        {/* Comparaison */}
        {suggestedPrice && price && (
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="flex justify-between items-center text-sm">
              <div>
                <span className="text-gray-600">Suggéré:</span>
                <Badge variant="secondary" className="ml-2">
                  {productPriceService.formatPrice(suggestedPrice)}
                </Badge>
              </div>
              
              <TrendingUp className="h-4 w-4 text-gray-400" />
              
              <div>
                <span className="text-gray-600">Réel:</span>
                <Badge variant="default" className="ml-2">
                  {productPriceService.formatPrice(price)}
                </Badge>
              </div>
            </div>
            
            <div className="mt-2 text-xs text-gray-600">
              Différence: {price - suggestedPrice > 0 ? '+' : ''}
              {productPriceService.formatPrice(Math.abs(price - suggestedPrice))}
              {' '}({((price - suggestedPrice) / suggestedPrice * 100).toFixed(1)}%)
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimplePriceSuggestion;