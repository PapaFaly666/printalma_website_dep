import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calculator, TrendingUp, AlertTriangle, CheckCircle, DollarSign, Zap } from 'lucide-react';
import { productPriceService } from '../../services/productPriceService';

interface ProductPriceManagerProps {
  initialPrice?: number;
  initialSuggestedPrice?: number;
  onChange: (data: { price: number; suggestedPrice?: number; usedSuggestion?: boolean }) => void;
  disabled?: boolean;
  showCalculator?: boolean;
  category?: string;
}

export const ProductPriceManager: React.FC<ProductPriceManagerProps> = ({
  initialPrice = 0,
  initialSuggestedPrice = undefined,
  onChange,
  disabled = false,
  showCalculator = true,
  category = ''
}) => {
  const [price, setPrice] = useState(initialPrice);
  const [suggestedPrice, setSuggestedPrice] = useState<number | undefined>(initialSuggestedPrice);
  const [baseCost, setBaseCost] = useState(0);
  const [quality, setQuality] = useState<'standard' | 'premium' | 'luxury'>('standard');
  const [complexity, setComplexity] = useState<'simple' | 'medium' | 'complex'>('simple');
  const [marketPosition, setMarketPosition] = useState<'budget' | 'mid-range' | 'premium'>('mid-range');
  const [errors, setErrors] = useState<string[]>([]);
  const [useSuggested, setUseSuggested] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Validation des prix en temps réel
  const validatePrices = useCallback((currentPrice: number, currentSuggestedPrice?: number) => {
    const validation = productPriceService.validatePrices(currentPrice, currentSuggestedPrice);
    setErrors(validation.errors);
    return validation.isValid;
  }, []);

  // Appliquer le prix suggéré au prix réel
  const applySuggestedPrice = () => {
    if (suggestedPrice && suggestedPrice > 0) {
      setPrice(suggestedPrice);
      setUseSuggested(true);
      
      // Notifier le parent du changement
      onChange({ 
        price: suggestedPrice, 
        suggestedPrice: suggestedPrice,
        usedSuggestion: true
      });
    }
  };

  // Calculer automatiquement le prix suggéré simple
  const calculateSuggested = () => {
    if (baseCost > 0) {
      const calculated = productPriceService.calculateSuggestedPrice(baseCost, 0.4);
      setSuggestedPrice(calculated);
      
      onChange({ 
        price: price, 
        suggestedPrice: calculated
      });
    }
  };

  // Calculer le prix suggéré avancé
  const calculateAdvancedSuggested = () => {
    if (baseCost > 0) {
      const calculated = productPriceService.calculateAdvancedSuggestedPrice({
        baseCost,
        quality,
        complexity,
        marketPosition
      });
      setSuggestedPrice(calculated);
      
      onChange({ 
        price: price, 
        suggestedPrice: calculated
      });
    }
  };

  // Générer des suggestions basées sur la catégorie
  const generateCategorySuggestions = () => {
    if (baseCost > 0 && category) {
      const suggestions = productPriceService.generateCategorySuggestions(baseCost, category);
      // Prendre la suggestion du milieu
      const middleSuggestion = suggestions[1] || suggestions[0];
      setSuggestedPrice(middleSuggestion);
      
      onChange({ 
        price: price, 
        suggestedPrice: middleSuggestion
      });
    }
  };

  // Gérer le changement de prix
  const handlePriceChange = (newPrice: number) => {
    setPrice(newPrice);
    setUseSuggested(false);
    validatePrices(newPrice, suggestedPrice);
    
    onChange({ 
      price: newPrice, 
      suggestedPrice: suggestedPrice,
      usedSuggestion: false
    });
  };

  // Gérer le changement de prix suggéré
  const handleSuggestedPriceChange = (newSuggestedPrice?: number) => {
    setSuggestedPrice(newSuggestedPrice);
    validatePrices(price, newSuggestedPrice);
    
    onChange({ 
      price: price, 
      suggestedPrice: newSuggestedPrice
    });
  };

  // Initialisation et mise à jour des valeurs externes
  useEffect(() => {
    setPrice(initialPrice);
    setSuggestedPrice(initialSuggestedPrice);
    validatePrices(initialPrice, initialSuggestedPrice);
  }, [initialPrice, initialSuggestedPrice, validatePrices]);

  // Calculer la différence de prix
  const priceDifference = suggestedPrice && price ? 
    productPriceService.getPriceDifference(price, suggestedPrice) : null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-blue-600" />
          💰 Gestion des Prix
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Calculateur automatique */}
        {showCalculator && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                🔢 Calculateur Prix Suggéré
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Coût de base */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="base-cost" className="text-xs font-medium">
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
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={calculateSuggested}
                    disabled={disabled || !baseCost}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Calculer Simple
                  </Button>
                  
                  {category && (
                    <Button
                      type="button"
                      onClick={generateCategorySuggestions}
                      disabled={disabled || !baseCost}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Par Catégorie
                    </Button>
                  )}
                </div>
                
                <Button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  size="sm"
                  variant="ghost"
                  className="self-end"
                >
                  {showAdvanced ? 'Simple' : 'Avancé'}
                </Button>
              </div>

              {/* Mode avancé */}
              {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label className="text-xs">Qualité</Label>
                    <Select
                      value={quality}
                      onValueChange={(value: any) => setQuality(value)}
                      disabled={disabled}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="luxury">Luxe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Complexité</Label>
                    <Select
                      value={complexity}
                      onValueChange={(value: any) => setComplexity(value)}
                      disabled={disabled}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simple</SelectItem>
                        <SelectItem value="medium">Moyen</SelectItem>
                        <SelectItem value="complex">Complexe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Positionnement</Label>
                    <Select
                      value={marketPosition}
                      onValueChange={(value: any) => setMarketPosition(value)}
                      disabled={disabled}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="budget">Budget</SelectItem>
                        <SelectItem value="mid-range">Milieu de gamme</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="button"
                    onClick={calculateAdvancedSuggested}
                    disabled={disabled || !baseCost}
                    size="sm"
                    className="md:col-span-3"
                  >
                    <Calculator className="h-3 w-3 mr-2" />
                    Calculer Prix Avancé
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Prix Suggéré */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="suggested-price" className="font-medium">
              💡 Prix Suggéré (FCFA) - Optionnel
            </Label>
            {suggestedPrice && suggestedPrice > 0 && (
              <Button
                type="button"
                onClick={applySuggestedPrice}
                disabled={disabled || useSuggested}
                size="sm"
                variant={useSuggested ? "default" : "outline"}
              >
                {useSuggested ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Appliqué
                  </>
                ) : (
                  'Appliquer'
                )}
              </Button>
            )}
          </div>
          
          <Input
            id="suggested-price"
            type="number"
            value={suggestedPrice || ''}
            onChange={(e) => handleSuggestedPriceChange(Number(e.target.value) || undefined)}
            placeholder="Prix suggéré automatique ou manuel"
            disabled={disabled}
            min="0"
            step="100"
          />
          
          <p className="text-xs text-gray-600">
            💡 Ce prix sera sauvegardé en base de données comme référence pour l'admin
          </p>
        </div>

        {/* Prix Réel */}
        <div className="space-y-3">
          <Label htmlFor="final-price" className="font-medium">
            💰 Prix de Vente (FCFA) - Requis *
          </Label>
          
          <Input
            id="final-price"
            type="number"
            value={price}
            onChange={(e) => handlePriceChange(Number(e.target.value) || 0)}
            placeholder="Prix final du produit"
            disabled={disabled}
            min="1"
            step="100"
            required
            className={`font-semibold ${
              errors.length > 0 
                ? 'border-red-500' 
                : useSuggested 
                  ? 'border-green-500 bg-green-50' 
                  : ''
            }`}
          />
          
          <p className="text-xs text-gray-600">
            💳 Prix affiché aux clients sur le site
          </p>
        </div>

        {/* Comparaison des Prix */}
        {suggestedPrice && price && priceDifference && (
          <Card className="bg-gray-50">
            <CardContent className="pt-4">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                📊 Comparaison des Prix
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Suggéré</p>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {productPriceService.formatPrice(suggestedPrice)}
                  </Badge>
                </div>
                
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Réel</p>
                  <Badge variant="outline" className={useSuggested ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}>
                    {productPriceService.formatPrice(price)}
                  </Badge>
                </div>
              </div>
              
              <div className="mt-3 text-center">
                <Badge 
                  variant={Math.abs(priceDifference.percentage) > 20 ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  Écart: {priceDifference.formatted.absolute} ({priceDifference.formatted.percentage})
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Erreurs de validation */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Statut de validation */}
        {errors.length === 0 && price > 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-800">
              ✅ Prix valides - Prêt pour l'enregistrement en base de données
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};