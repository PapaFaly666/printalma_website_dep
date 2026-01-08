import React, { useState, useEffect } from 'react';
import { VendeurType } from '../../types/auth.types';
import { Badge } from '../ui/badge';
import Button from '../ui/Button';
import '../../styles/smooth-slider.css';
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
  [VendeurType.DESIGNER]: 25,
  [VendeurType.INFLUENCEUR]: 35,
  [VendeurType.ARTISTE]: 30
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
  const [error, setError] = useState<string | null>(null);

  const recommendedValue = COMMISSION_DEFAULTS[vendeurType] || 25;

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    setIsModified(value !== initialValue);
  }, [value, initialValue]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Math.max(1, Math.round(Number(e.target.value)));
    setValue(newValue);
  };

  const handleSave = async () => {
    if (!isModified) return;

    setIsSaving(true);
    setError(null);
    
    try {
      await onSave(vendeurId, value);
      setIsModified(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      setError(error.message || 'Erreur lors de la sauvegarde');
      setTimeout(() => setError(null), 5000); // Effacer l'erreur après 5s
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

  // Couleurs simplifiées pour une meilleure UX
  const getValueColor = (percentage: number) => {
    if (percentage === 0) return 'text-gray-600';    // Gratuit - Gris
    if (percentage <= 30) return 'text-blue-600';    // Faible commission - Bleu
    if (percentage <= 70) return 'text-green-600';   // Commission modérée - Vert
    return 'text-orange-600';                        // Forte commission - Orange
  };

  const getSliderTrackColor = (percentage: number) => {
    if (percentage === 0) return 'from-gray-300 to-gray-400';
    if (percentage <= 30) return 'from-blue-400 to-blue-500';
    if (percentage <= 70) return 'from-green-400 to-green-500';
    return 'from-orange-400 to-orange-500';
  };

  return (
    <div className={`space-y-2 p-2 bg-gray-50 rounded-lg min-w-[200px] ${className}`}>
      {/* Header avec valeur actuelle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Percent className="h-3 w-3 text-gray-500" />
          <span className={`text-sm font-semibold ${getValueColor(value)}`}>
            {`${Math.max(1, Math.round(value))}%`}
          </span>
        </div>
        
        {showSuccess && (
          <Badge className="bg-green-100 text-green-800 text-xs py-0 px-1">
            <Check className="h-3 w-3 mr-1" />
            Sauvé
          </Badge>
        )}
        
        {error && (
          <Badge className="bg-red-100 text-red-800 text-xs py-0 px-1">
            <X className="h-3 w-3 mr-1" />
            Erreur
          </Badge>
        )}
        
        {isModified && !showSuccess && !error && (
          <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs py-0 px-1">
            Modifié
          </Badge>
        )}
      </div>

      {/* Slider compact */}
      <div className="relative slider-container">
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${getSliderTrackColor(value)} transition-all duration-300`}
            style={{ width: `${value}%` }}
          />
        </div>
        
        <input
          type="range"
          min="1"
          max="100"
          step="1"
          value={value}
          onChange={handleSliderChange}
          className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer smooth-slider"
        />
        
        {/* Marqueurs discrets */}
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
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
            onClick={() => handleQuickSet(0)}
            className="h-6 px-2 text-xs text-gray-600 hover:bg-gray-100"
            title="Gratuit"
          >
            0%
          </Button>
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

      {/* Message d'erreur détaillé */}
      {error && (
        <div className="text-xs text-red-600 text-center bg-red-50 border border-red-200 rounded px-2 py-1">
          ⚠️ {error}
        </div>
      )}

      {/* Indicateur du revenu estimé */}
      {!error && (
        <div className="text-xs text-gray-500 text-center bg-white rounded px-2 py-1">
          Pour 50,000 FCFA → Vendeur: <span className="font-medium text-green-600">{((100 - value) * 500).toLocaleString('fr-FR')} FCFA</span>
          {' | '}Admin: <span className="font-medium text-blue-600">{(value * 500).toLocaleString('fr-FR')} FCFA</span>
        </div>
      )}
    </div>
  );
};

export default MiniCommissionSlider;