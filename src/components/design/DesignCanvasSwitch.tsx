import React, { useState, useCallback } from 'react';
import { Palette, Brush, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import IllustratorCanvas from './IllustratorCanvas';

interface DesignCanvasSwitchProps {
  designUrl: string;
  productView: any;
  productId: number;
  products: any[];
  vendorDesigns: any[];
  onTransformChange?: (transform: any) => void;
  onSave?: () => void;
  className?: string;
}

type CanvasMode = 'modern' | 'illustrator';

const DesignCanvasSwitch: React.FC<DesignCanvasSwitchProps> = ({
  designUrl,
  productView,
  productId,
  products,
  vendorDesigns,
  onTransformChange,
  onSave,
  className = ""
}) => {
  const [canvasMode, setCanvasMode] = useState<CanvasMode>('illustrator');
  const [illustratorTransform, setIllustratorTransform] = useState({
    x: 400,
    y: 300,
    scale: 1,
    rotation: 0,
    width: 200,
    height: 200
  });

  const handleIllustratorTransformChange = useCallback((transform: any) => {
    setIllustratorTransform(transform);
    
    // Convertir les transformations du canvas Illustrator vers le format du système existant
    const normalizedTransform = {
      x: transform.x - 400, // Centrer par rapport au canvas
      y: transform.y - 300,
      scale: transform.scale,
      rotation: transform.rotation,
      designWidth: transform.width,
      designHeight: transform.height,
      designScale: transform.scale
    };
    
    if (onTransformChange) {
      onTransformChange(normalizedTransform);
    }
  }, [onTransformChange]);

  const renderCanvas = () => {
    switch (canvasMode) {
      case 'illustrator':
        return (
          <IllustratorCanvas
            designUrl={designUrl}
            onTransformChange={handleIllustratorTransformChange}
            onSave={onSave}
            initialTransform={illustratorTransform}
            canvasWidth={800}
            canvasHeight={600}
            className="mx-auto"
          />
        );
      
      case 'modern':
        // Import dynamique pour éviter les erreurs de dépendance circulaire
        const ModernDesignCanvas = React.lazy(() => import('./ModernDesignCanvas'));
        return (
          <React.Suspense fallback={<div>Chargement...</div>}>
            <ModernDesignCanvas
              view={productView}
              designUrl={designUrl}
              productId={productId}
              products={products}
              vendorDesigns={vendorDesigns}
              className="mx-auto"
            />
          </React.Suspense>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Sélecteur de mode */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Palette className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-medium text-gray-900 dark:text-white">Mode de canvas</h3>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={canvasMode} onValueChange={(value: CanvasMode) => setCanvasMode(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="illustrator">
                <div className="flex items-center gap-2">
                  <Brush className="h-4 w-4" />
                  <span>Mode Illustrator</span>
                </div>
              </SelectItem>
              <SelectItem value="modern">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Mode Moderne</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description du mode sélectionné */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          {canvasMode === 'illustrator' && <Brush className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />}
          {canvasMode === 'modern' && <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />}
          
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              {canvasMode === 'illustrator' && 'Mode Illustrator - Manipulation directe'}
              {canvasMode === 'modern' && 'Mode Moderne - Contrôles avancés'}
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {canvasMode === 'illustrator' && 'Déplacez et redimensionnez votre design directement sur le canvas comme dans Adobe Illustrator. Drag pour déplacer, Shift+Drag sur les coins pour redimensionner proportionnellement.'}
              {canvasMode === 'modern' && 'Interface avec délimitations visibles et contrôles de dimensions dans un panneau latéral. Sauvegarde automatique en localStorage.'}
            </p>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        {renderCanvas()}
      </div>

      {/* Informations de transformation (uniquement en mode Illustrator) */}
      {canvasMode === 'illustrator' && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Propriétés de transformation</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Position X:</span>
              <span className="ml-2 font-mono">{Math.round(illustratorTransform.x)}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Position Y:</span>
              <span className="ml-2 font-mono">{Math.round(illustratorTransform.y)}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Échelle:</span>
              <span className="ml-2 font-mono">{(illustratorTransform.scale * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Dimensions:</span>
              <span className="ml-2 font-mono">
                {Math.round(illustratorTransform.width * illustratorTransform.scale)}×{Math.round(illustratorTransform.height * illustratorTransform.scale)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignCanvasSwitch; 