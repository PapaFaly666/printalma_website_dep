import React, { useState, useEffect } from 'react';
import { VendeurType } from '../../types/auth.types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Percent, 
  Save, 
  RotateCcw, 
  TrendingUp,
  Check,
  X
} from 'lucide-react';

interface MiniCommissionSliderProps {
  vendeurId: number;
  vendeurType: VendeurType;
  initialValue?: number;
  onSave: (vendeurId: number, commission: number) => Promise<void>;
  className?: string;
}

// Recommandations par type de vendeur (simplifiées pour le tableau)
const COMMISSION_DEFAULTS = {
  [VendeurType.DESIGNER]: 10,
  [VendeurType.INFLUENCEUR]: 15,
  [VendeurType.ARTISTE]: 12
};

export const MiniCommissionSlider: React.FC<MiniCommissionSliderProps> = ({
  vendeurId,
  vendeurType,
  initialValue = 40, // Valeur par défaut demandée
  onSave,
  className = ''
}) => {
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const recommendedValue = COMMISSION_DEFAULTS[vendeurType] || 10;

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    setIsModified(value !== initialValue);
  }, [value, initialValue]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setValue(newValue);
  };

  const handleSave = async () => {
    if (!isModified) return;

    setIsSaving(true);
    try {
      await onSave(vendeurId, value);
      setIsModified(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setValue(initialValue);
    setIsModified(false);
  };

  const handleQuickSet = (quickValue: number) => {
    setValue(quickValue);
  };

  // Couleur basée sur la valeur
  const getValueColor = (percentage: number) => {
    if (percentage <= 10) return 'text-green-600';
    if (percentage <= 20) return 'text-yellow-600';
    if (percentage <= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSliderTrackColor = (percentage: number) => {
    if (percentage <= 10) return 'from-green-400 to-green-500';
    if (percentage <= 20) return 'from-yellow-400 to-yellow-500';
    if (percentage <= 30) return 'from-orange-400 to-orange-500';
    return 'from-red-400 to-red-500';
  };

  return (
    <div className={`space-y-2 p-2 bg-gray-50 rounded-lg min-w-[200px] ${className}`}>
      {/* Header avec valeur actuelle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Percent className="h-3 w-3 text-gray-500" />
          <span className={`text-sm font-semibold ${getValueColor(value)}`}>
            {value}%
          </span>
        </div>
        
        {showSuccess && (
          <Badge className="bg-green-100 text-green-800 text-xs py-0 px-1">
            <Check className="h-3 w-3 mr-1" />
            Sauvé
          </Badge>
        )}
        
        {isModified && !showSuccess && (
          <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs py-0 px-1">
            Modifié
          </Badge>
        )}
      </div>

      {/* Slider compact */}
      <div className="relative">
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${getSliderTrackColor(value)} transition-all duration-300`}
            style={{ width: `${(value / 50) * 100}%` }}
          />
        </div>
        
        <input
          type="range"
          min="0"
          max="50"
          step="1"
          value={value}
          onChange={handleSliderChange}
          className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
        />
        
        {/* Marqueurs discrets */}
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
        </div>
      </div>

      {/* Presets rapides et actions */}
      <div className="flex items-center justify-between">
        {/* Presets rapides */}
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleQuickSet(recommendedValue)}
            className="h-6 px-2 text-xs text-blue-600 hover:bg-blue-50"
            title={`Recommandé pour ${vendeurType}`}
          >
            {recommendedValue}%
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleQuickSet(20)}
            className="h-6 px-2 text-xs text-gray-600 hover:bg-gray-100"
          >
            20%
          </Button>
        </div>

        {/* Actions */}
        <div className="flex gap-1">
          {isModified && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-6 w-6 p-0 text-gray-500 hover:bg-gray-200"
                title="Annuler"
              >
                <X className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-6 w-6 p-0 text-green-600 hover:bg-green-100"
                title="Sauvegarder"
              >
                {isSaving ? (
                  <div className="h-3 w-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="h-3 w-3" />
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Indicateur du revenu estimé */}
      <div className="text-xs text-gray-500 text-center bg-white rounded px-2 py-1">
        Pour 100€ → Vendeur: <span className="font-medium text-green-600">{100 - value}€</span>
        {' | '}Admin: <span className="font-medium text-blue-600">{value}€</span>
      </div>
    </div>
  );
};

export default MiniCommissionSlider;