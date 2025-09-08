import React, { useState, useEffect } from 'react';
import { VendeurType } from '../../types/auth.types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Percent, 
  TrendingUp, 
  TrendingDown, 
  Info, 
  Zap, 
  Target,
  DollarSign,
  Calculator,
  Sparkles
} from 'lucide-react';

interface CommissionSliderProps {
  vendeurType?: VendeurType;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

// Configuration recommandée par type de vendeur
const COMMISSION_RECOMMENDATIONS = {
  [VendeurType.DESIGNER]: {
    min: 5,
    recommended: 10,
    max: 20,
    label: 'Designer',
    description: 'Frais de création et design personnalisé',
    color: 'purple'
  },
  [VendeurType.INFLUENCEUR]: {
    min: 8,
    recommended: 15,
    max: 25,
    label: 'Influenceur',
    description: 'Commission sur promotion et marketing',
    color: 'pink'
  },
  [VendeurType.ARTISTE]: {
    min: 5,
    recommended: 12,
    max: 22,
    label: 'Artiste',
    description: 'Droits d\'auteur et création artistique',
    color: 'amber'
  }
};

// Presets de commission populaires
const COMMISSION_PRESETS = [
  { value: 5, label: '5%', description: 'Commission minimale' },
  { value: 10, label: '10%', description: 'Équilibré' },
  { value: 15, label: '15%', description: 'Recommandé' },
  { value: 20, label: '20%', description: 'Premium' }
];

export const CommissionSlider: React.FC<CommissionSliderProps> = ({
  vendeurType,
  value,
  onChange,
  className = ''
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const recommendation = vendeurType ? COMMISSION_RECOMMENDATIONS[vendeurType] : null;

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handlePresetClick = (presetValue: number) => {
    setLocalValue(presetValue);
    onChange(presetValue);
    // Animation feedback
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 1000);
  };

  // Calcul des couleurs dynamiques basées sur la valeur
  const getSliderColor = (percentage: number) => {
    if (percentage <= 10) return 'from-green-500 to-green-600';
    if (percentage <= 15) return 'from-yellow-500 to-orange-500';
    if (percentage <= 20) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-red-600';
  };

  const getTextColor = (percentage: number) => {
    if (percentage <= 10) return 'text-green-700';
    if (percentage <= 15) return 'text-yellow-700';
    if (percentage <= 20) return 'text-orange-700';
    return 'text-red-700';
  };

  const getBadgeVariant = (percentage: number) => {
    if (percentage <= 10) return 'bg-green-100 text-green-800';
    if (percentage <= 15) return 'bg-yellow-100 text-yellow-800';
    if (percentage <= 20) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  // Simulation du calcul d'impact (exemple avec 100€ de vente)
  const simulateImpact = (commission: number) => {
    const saleAmount = 100;
    const commissionAmount = (saleAmount * commission) / 100;
    const vendorRevenue = saleAmount - commissionAmount;
    
    return { saleAmount, commissionAmount, vendorRevenue };
  };

  const impact = simulateImpact(localValue);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête avec icône et titre */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Percent className="h-5 w-5 text-white" />
        </div>
        <div>
          <Label className="text-lg font-semibold text-gray-900">Commission Admin</Label>
          <p className="text-sm text-gray-600">Définissez le pourcentage prélevé sur les revenus vendeur</p>
        </div>
      </div>

      {/* Recommandation contextuelle par type de vendeur */}
      {recommendation && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-1">
                  Recommandation pour {recommendation.label}
                </h4>
                <p className="text-sm text-blue-800 mb-2">
                  {recommendation.description}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-blue-700">Plage suggérée :</span>
                  <Badge variant="outline" className="text-blue-700 border-blue-300">
                    {recommendation.min}% - {recommendation.max}%
                  </Badge>
                  <span className="text-blue-700">|</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    <Target className="h-3 w-3 mr-1" />
                    Optimal: {recommendation.recommended}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slider principal avec design moderne */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Affichage de la valeur actuelle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getSliderColor(localValue)} flex items-center justify-center transition-all duration-300`}>
                  <span className="text-white text-sm font-bold">{localValue}</span>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${getTextColor(localValue)} transition-colors duration-300`}>
                    {localValue}%
                  </div>
                  <div className="text-xs text-gray-500">Commission actuelle</div>
                </div>
              </div>
              
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getBadgeVariant(localValue)} transition-all duration-300`}>
                {localValue <= 10 ? '✓ Équilibré' : localValue <= 15 ? '⚡ Modéré' : localValue <= 20 ? '🔥 Élevé' : '⚠️ Maximum'}
              </div>
            </div>

            {/* Slider avec gradient progressif */}
            <div className="relative">
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${getSliderColor(localValue)} transition-all duration-500 ease-out`}
                  style={{ width: `${(localValue / 30) * 100}%` }}
                />
              </div>
              
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={localValue}
                onChange={handleSliderChange}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                className={`absolute inset-0 w-full h-3 opacity-0 cursor-pointer transition-transform duration-150 ${isDragging ? 'scale-110' : 'hover:scale-105'}`}
              />
              
              {/* Marqueurs de valeurs */}
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>0%</span>
                <span>10%</span>
                <span>20%</span>
                <span>30%</span>
              </div>
            </div>

            {/* Presets rapides */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Zap className="h-4 w-4" />
                <span>Presets rapides</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {COMMISSION_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    type="button"
                    variant={localValue === preset.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetClick(preset.value)}
                    className={`h-auto py-2 px-3 transition-all duration-200 ${
                      localValue === preset.value 
                        ? 'bg-black text-white shadow-lg scale-105' 
                        : 'hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-semibold">{preset.label}</div>
                      <div className="text-xs opacity-75">{preset.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simulation d'impact financier */}
      <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="h-5 w-5 text-blue-600" />
            <span>Impact sur les revenus</span>
            <Badge variant="outline" className="text-blue-700 border-blue-300 text-xs">
              Exemple: 100€ de vente
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Revenu vendeur */}
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">Vendeur reçoit</span>
              </div>
              <div className="text-xl font-bold text-green-700">
                {impact.vendorRevenue.toFixed(2)}€
              </div>
              <div className="text-xs text-gray-500">
                {(100 - localValue)}% du prix
              </div>
            </div>

            {/* Commission admin */}
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs font-medium">Commission</span>
              </div>
              <div className="text-xl font-bold text-blue-700">
                {impact.commissionAmount.toFixed(2)}€
              </div>
              <div className="text-xs text-gray-500">
                {localValue}% du prix
              </div>
            </div>

            {/* Prix total */}
            <div className="text-center p-3 bg-white rounded-lg border">
              <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                <Target className="h-4 w-4" />
                <span className="text-xs font-medium">Prix total</span>
              </div>
              <div className="text-xl font-bold text-gray-800">
                {impact.saleAmount.toFixed(2)}€
              </div>
              <div className="text-xs text-gray-500">
                Prix de vente
              </div>
            </div>
          </div>

          {/* Barre de répartition visuelle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Répartition des revenus</span>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs">Temps réel</span>
              </div>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full flex">
                <div 
                  className="bg-green-500 transition-all duration-500 ease-out"
                  style={{ width: `${100 - localValue}%` }}
                />
                <div 
                  className="bg-blue-500 transition-all duration-500 ease-out"
                  style={{ width: `${localValue}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-green-600">👤 Vendeur ({100 - localValue}%)</span>
              <span className="text-blue-600">🏢 Admin ({localValue}%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tooltip animé lors de la sélection de preset */}
      {showTooltip && (
        <div className="fixed top-4 right-4 bg-black text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in slide-in-from-right duration-300">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span>Commission mise à jour: {localValue}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionSlider;