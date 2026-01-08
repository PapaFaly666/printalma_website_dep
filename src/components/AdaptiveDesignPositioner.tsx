import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  RotateCcw, 
  Save, 
  // RefreshCw, // unused 
  Settings,
  Maximize2,
  Minimize2,
  RotateCw,
  Move,
  Zap
} from 'lucide-react';
import Button from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { useAdaptivePositioning } from '../hooks/useAdaptivePositioning';
// import { toast } from 'sonner'; // unused

interface DesignPositioning {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

interface Props {
  productId: number;
  designUrl: string;
  onPositionChange?: (position: DesignPositioning) => void;
  className?: string;
  showPreview?: boolean;
}

export const AdaptiveDesignPositioner: React.FC<Props> = ({
  productId,
  designUrl,
  onPositionChange,
  className = "",
  showPreview = true
}) => {
  const {
    positioning,
    productType,
    description,
    presets,
    loading,
    error,
    saveCustomPositioning,
    applyPreset
  } = useAdaptivePositioning(productId, designUrl);

  const [localPositioning, setLocalPositioning] = useState<DesignPositioning | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  // Synchroniser avec le positionnement chargé
  useEffect(() => {
    if (positioning) {
      setLocalPositioning(positioning);
      setHasUnsavedChanges(false);
    }
  }, [positioning]);

  const handlePositionChange = (field: keyof DesignPositioning, value: number) => {
    if (!localPositioning) return;

    const newPosition = {
      ...localPositioning,
      [field]: value
    };

    setLocalPositioning(newPosition);
    setHasUnsavedChanges(true);
    onPositionChange?.(newPosition);
  };

  const handleSave = async () => {
    if (!localPositioning) return;

    const success = await saveCustomPositioning(localPositioning);
    if (success) {
      setHasUnsavedChanges(false);
    }
  };

  const handlePresetClick = async (presetName: string) => {
    const success = await applyPreset(presetName);
    if (success) {
      setHasUnsavedChanges(false);
    }
  };

  const handleReset = () => {
    if (positioning) {
      setLocalPositioning(positioning);
      setHasUnsavedChanges(false);
      onPositionChange?.(positioning);
    }
  };

  const getPresetIcon = (presetName: string) => {
    switch (presetName) {
      case 'center': return '🎯';
      case 'chest': return '👕';
      case 'small': return '🔸';
      case 'large': return '🔶';
      case 'lower': return '⬇️';
      default: return '📍';
    }
  };

  const getPresetLabel = (presetName: string) => {
    switch (presetName) {
      case 'center': return 'Centre';
      case 'chest': return 'Poitrine';
      case 'small': return 'Petit';
      case 'large': return 'Grand';
      case 'lower': return 'Bas';
      default: return presetName;
    }
  };

  if (loading) {
    return (
      <Card className={`adaptive-design-positioner ${className}`}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Calcul du positionnement optimal...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`adaptive-design-positioner ${className}`}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-red-500 mb-4">⚠️</div>
            <p className="text-red-600 dark:text-red-400 text-center">
              Erreur de chargement: {error}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Utilisation du positionnement par défaut
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!localPositioning) {
    return null;
  }

  return (
    <Card className={`adaptive-design-positioner ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Positionnement adaptatif</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              🎯 {productType.toUpperCase()}
            </Badge>
            {hasUnsavedChanges && (
              <Badge variant="secondary" className="text-xs animate-pulse">
                Non sauvegardé
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Presets rapides */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Positions prédéfinies</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAdvancedMode(!isAdvancedMode)}
              className="text-xs"
            >
              <Settings className="w-4 h-4 mr-1" />
              {isAdvancedMode ? 'Simple' : 'Avancé'}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(presets).map(([name, _preset]) => (
              <motion.div
                key={name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetClick(name)}
                  className="w-full text-xs h-auto py-2 px-3 flex flex-col items-center gap-1"
                  title={`Appliquer la position "${name}"`}
                >
                  <span className="text-base">{getPresetIcon(name)}</span>
                  <span>{getPresetLabel(name)}</span>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Contrôles de positionnement */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Move className="w-4 h-4" />
            Ajustement fin
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Position X */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Position X: {localPositioning.x}%
              </label>
              <Slider
                value={[localPositioning.x]}
                onValueChange={(value) => handlePositionChange('x', value[0])}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            {/* Position Y */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Position Y: {localPositioning.y}%
              </label>
              <Slider
                value={[localPositioning.y]}
                onValueChange={(value) => handlePositionChange('y', value[0])}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            {/* Largeur */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Maximize2 className="w-3 h-3" />
                Largeur: {localPositioning.width}%
              </label>
              <Slider
                value={[localPositioning.width]}
                onValueChange={(value) => handlePositionChange('width', value[0])}
                min={5}
                max={80}
                step={1}
                className="w-full"
              />
            </div>

            {/* Hauteur */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Minimize2 className="w-3 h-3" />
                Hauteur: {localPositioning.height}%
              </label>
              <Slider
                value={[localPositioning.height]}
                onValueChange={(value) => handlePositionChange('height', value[0])}
                min={5}
                max={80}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* Rotation (mode avancé) */}
          <AnimatePresence>
            {isAdvancedMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <RotateCw className="w-3 h-3" />
                  Rotation: {localPositioning.rotation}°
                </label>
                <Slider
                  value={[localPositioning.rotation]}
                  onValueChange={(value) => handlePositionChange('rotation', value[0])}
                  min={-180}
                  max={180}
                  step={1}
                  className="w-full"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Aperçu en temps réel */}
        {showPreview && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Aperçu</h4>
            <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
              <div className="relative w-48 h-48 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden">
                {/* Simulation du produit */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800"></div>
                
                {/* Zone de design */}
                <div 
                  className="absolute border-2 border-dashed border-blue-500 bg-blue-500/10 rounded flex items-center justify-center text-blue-600 font-medium text-xs transition-all duration-200"
                  style={{
                    left: `${localPositioning.x}%`,
                    top: `${localPositioning.y}%`,
                    width: `${localPositioning.width}%`,
                    height: `${localPositioning.height}%`,
                    transform: `translate(-50%, -50%) rotate(${localPositioning.rotation}deg)`,
                  }}
                >
                  <div className="text-center">
                    <Zap className="w-4 h-4 mx-auto mb-1" />
                    Design
                  </div>
                </div>
                
                {/* Indicateurs de position */}
                <div className="absolute top-1 left-1 text-xs text-gray-400">
                  {localPositioning.x.toFixed(0)}, {localPositioning.y.toFixed(0)}
                </div>
                <div className="absolute bottom-1 right-1 text-xs text-gray-400">
                  {localPositioning.width.toFixed(0)}×{localPositioning.height.toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={!hasUnsavedChanges}
              className="text-xs"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Annuler
            </Button>
          </div>
          
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            size="sm"
            className="text-xs"
          >
            <Save className="w-4 h-4 mr-1" />
            Sauvegarder
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 
 
 
 