import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Square, 
  Move, 
  RotateCw, 
  Trash2, 
  Download, 
  Upload,
  MousePointer,
  Maximize,
  Crosshair,
  Save,
  X,
  CheckCircle,
  ImageIcon
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { AdminButton } from '../admin/AdminButton';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { useFabricCanvas } from '../../hooks/useFabricCanvas';
import { Delimitation, ProductImage } from '../../types/product';
import { toast } from 'sonner';
import { 
  calculateCenteredDesignPosition, 
  getRecommendedDesignSizes, 
  calculateVisualFeedback, 
  validateDelimitationBounds 
} from '../../utils/realCoordinateHelpers';

interface DelimitationCanvasProps {
  imageUrl: string;
  designImageUrl?: string;
  existingDelimitations?: Delimitation[];
  onSave: (delimitations: Delimitation[]) => void;
  onCancel: () => void;
  className?: string;
  integrated?: boolean;
}

export type DelimitationCanvasHandle = {
  exportFinalImage: () => Promise<string | null>;
  createFullImageDelimitation: () => { success: boolean; delimitations?: Delimitation[]; error?: string };
  saveChanges: () => void; // 🆕 Permet de sauvegarder les changements programmatiquement
};

export const DelimitationCanvas = forwardRef<DelimitationCanvasHandle, DelimitationCanvasProps>(({
  imageUrl,
  designImageUrl,
  existingDelimitations = [],
  onSave,
  onCancel,
  className = '',
  integrated = false
}, ref) => {
  const [mode, setMode] = useState<'select' | 'draw' | 'move'>('select');
  const previousModeRef = useRef<'select' | 'draw' | 'move'>('select');
  const [showInfo, setShowInfo] = useState(false);
  const [isEditingDelimitation, setIsEditingDelimitation] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasLoadedDelimitations, setHasLoadedDelimitations] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isLoadingFromStorage, setIsLoadingFromStorage] = useState(false);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clé de stockage localStorage pour les délimitations
  const localStorageKey = useMemo(() => {
    return `delimitation-canvas-${imageUrl}-${designImageUrl || 'no-design'}`;
  }, [imageUrl, designImageUrl]);

  const {
    canvasRef,
    canvas,
    delimitation,
    isDrawing,
    addDelimitation,
    removeDelimitation,
    saveCurrentDelimitation,
    getCurrentDelimitationData,
    enableDrawingMode,
    disableDrawingMode,
    centerDesignInDelimitation,
    simulateRealDesignPlacement,
    exportCanvas,
    getImageMetrics,
    convertToRealImageCoordinates,
    loadDesignImage,
    exportFinalImage
  } = useFabricCanvas({
    imageUrl,
    designImageUrl,
    onDelimitationChange: (delim) => {
      console.log('Delimitation changed (auto-save triggered):', delim);
      setHasUnsavedChanges(true);
      
      // Sauvegarder immédiatement en localStorage à chaque modification (comme dans SellDesignPage)
      if (hasLoadedFromStorage && !isLoadingFromStorage) {
        const delimitationData = getCurrentDelimitationData();
        if (delimitationData) {
          // Sauvegarder directement en localStorage sans délai
          saveToLocalStorage([delimitationData]);
          console.log('💾 Sauvegarde automatique localStorage:', delimitationData);
        }
      }
    },
    initialDelimitation: existingDelimitations[0]
  });

  // Charger les délimitations depuis localStorage au montage
  useEffect(() => {
    if (isLoadingFromStorage || hasLoadedFromStorage) return; // Éviter la boucle infinie et le rechargement
    
    const saved = localStorage.getItem(localStorageKey);
    if (saved) {
      try {
        setIsLoadingFromStorage(true);
        const savedDelimitations = JSON.parse(saved);
        console.log('📂 Chargement depuis localStorage:', savedDelimitations);
        
        // Appliquer les délimitations sauvegardées
        if (savedDelimitations && savedDelimitations.length > 0) {
          savedDelimitations.forEach((delim: any) => {
            if (delim && delim.id) {
              addDelimitation(delim);
            }
          });
        }
        setHasLoadedFromStorage(true); // Marquer comme chargé
      } catch (e) {
        console.warn('Erreur lors du chargement depuis localStorage:', e);
      } finally {
        setIsLoadingFromStorage(false);
      }
    } else {
      setHasLoadedFromStorage(true); // Marquer comme chargé même si pas de données
    }
  }, [localStorageKey, hasLoadedFromStorage]); // Retiré addDelimitation des dépendances

  // Sauvegarder automatiquement dans localStorage
  const saveToLocalStorage = useCallback((delimitations: Delimitation[]) => {
    if (isLoadingFromStorage || !hasLoadedFromStorage) return; // Éviter la sauvegarde pendant le chargement
    
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(delimitations));
      console.log('💾 Sauvegarde localStorage:', delimitations);
    } catch (e) {
      console.warn('Erreur lors de la sauvegarde localStorage:', e);
    }
  }, [localStorageKey, isLoadingFromStorage, hasLoadedFromStorage]);

  // Récupérer toutes les délimitations actuelles
  const getAllDelimitations = useCallback(() => {
    const allDelimitations: Delimitation[] = [];
    
    if (delimitation) {
      const delimitationData = getCurrentDelimitationData();
      if (delimitationData) {
        allDelimitations.push(delimitationData);
      }
    }
    
    return allDelimitations;
  }, [delimitation, getCurrentDelimitationData]);

  // Sauvegarder toutes les délimitations dans localStorage
  const saveAllDelimitations = useCallback(() => {
    const allDelimitations = getAllDelimitations();
    saveToLocalStorage(allDelimitations);
  }, [getAllDelimitations, saveToLocalStorage]);

  // Debug logging
  useEffect(() => {
    console.log('DelimitationCanvas props:', {
      imageUrl,
      designImageUrl,
      existingDelimitationsCount: existingDelimitations.length,
      hasOnSave: !!onSave,
      hasOnCancel: !!onCancel,
      integrated,
      localStorageKey
    });
  }, [imageUrl, designImageUrl, existingDelimitations, onSave, onCancel, integrated, localStorageKey]);

  // Fonction de sauvegarde automatique avec localStorage immédiat
  const autoSave = useCallback(() => {
    if (isLoadingFromStorage || !hasLoadedFromStorage) return; // Éviter la sauvegarde pendant le chargement
    
    if (delimitation && hasUnsavedChanges) {
      console.log('🔄 Auto-sauvegarde en cours...');
      setIsAutoSaving(true);
      
      const delimitationData = getCurrentDelimitationData();
      if (delimitationData) {
        // Sauvegarder immédiatement dans localStorage (toujours)
        saveAllDelimitations();
        
        // Ne pas appeler onSave à chaque fois pour éviter les appels backend excessifs
        // onSave sera appelé seulement lors de la sauvegarde manuelle
        // setHasUnsavedChanges(false); // Ne pas réinitialiser pour permettre les sauvegardes continues
        
        if (integrated) {
          toast.success('Zone sauvegardée automatiquement', {
            icon: '💾',
            duration: 1500
          });
        }
      }
      
      setIsAutoSaving(false);
    }
  }, [delimitation, hasUnsavedChanges, getCurrentDelimitationData, integrated, saveAllDelimitations, isLoadingFromStorage, hasLoadedFromStorage]);

  // Sauvegarder immédiatement à chaque modification (sans debounce)
  useEffect(() => {
    if (isLoadingFromStorage || !hasLoadedFromStorage) return; // Éviter la sauvegarde pendant le chargement
    
    if (delimitation && hasUnsavedChanges) {
      // Sauvegarder uniquement en localStorage pour une expérience fluide (comme dans SellDesignPage)
      const delimitationData = getCurrentDelimitationData();
      if (delimitationData) {
        saveToLocalStorage([delimitationData]);
        console.log('🔄 Sauvegarde automatique fluide:', delimitationData);
      }
    }
  }, [delimitation, hasUnsavedChanges, getCurrentDelimitationData, saveToLocalStorage, isLoadingFromStorage, hasLoadedFromStorage]);

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Gestion des événements tactiles pour éviter les erreurs d'intervention
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Permettre le défilement naturel sur mobile
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Permettre le défilement naturel sur mobile
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    // Ajouter les listeners seulement si on est sur mobile
    if ('ontouchstart' in window) {
      document.addEventListener('touchstart', handleTouchStart, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Configuration Fabric.js pour éviter les erreurs d'intervention
  useEffect(() => {
    if (canvas) {
      // Désactiver les événements tactiles automatiques de Fabric.js
      canvas.selection = false;
      canvas.skipTargetFind = false;
      
      // Configuration pour éviter les conflits avec le défilement
      canvas.on('mouse:down', (e: any) => {
        if (e.e && e.e.cancelable) {
          e.e.preventDefault();
        }
      });

      canvas.on('mouse:move', (e: any) => {
        if (e.e && e.e.cancelable) {
          e.e.preventDefault();
        }
      });

      // Gestion spécifique des événements tactiles
      canvas.on('touch:gesture', (e: any) => {
        if (e.e && e.e.cancelable) {
          e.e.preventDefault();
        }
      });

      canvas.on('touch:start', (e: any) => {
        if (e.e && e.e.cancelable) {
          e.e.preventDefault();
        }
      });

      canvas.on('touch:move', (e: any) => {
        if (e.e && e.e.cancelable) {
          e.e.preventDefault();
        }
      });
    }
  }, [canvas]);

  // Afficher automatiquement les délimitations existantes au chargement (une seule fois)
  useEffect(() => {
    if (existingDelimitations && existingDelimitations.length > 0 && canvas && !hasLoadedDelimitations) {
      console.log('🔄 Affichage automatique des délimitations existantes:', existingDelimitations);
      
      // Charger la première délimitation existante
      const firstDelimitation = existingDelimitations[0];
      if (firstDelimitation) {
        // Utiliser directement la délimitation existante qui a déjà un ID
        addDelimitation(firstDelimitation);
        console.log('✅ Délimitation existante affichée:', firstDelimitation);
        setHasLoadedDelimitations(true); // Marquer comme chargé pour éviter la boucle
      }
    }
  }, [existingDelimitations, canvas, hasLoadedDelimitations]); // Retiré addDelimitation des dépendances

  // Supprimer l'auto-save et remplacer par un tracking des changements
  const handleDelimitationUpdate = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  // Use ref to avoid infinite loops - only call mode functions when mode actually changes
  useEffect(() => {
    if (mode !== previousModeRef.current) {
      previousModeRef.current = mode;
      
      console.log('🔄 Mode changed to:', mode);
      
      if (mode === 'draw') {
        console.log('🎨 Activating drawing mode');
        enableDrawingMode();
        setIsEditingDelimitation(true);
      } else if (mode === 'select') {
        console.log('🖱️ Activating selection mode');
        disableDrawingMode();
        setIsEditingDelimitation(false);
      } else {
        console.log('🚫 Disabling drawing mode for mode:', mode);
        disableDrawingMode();
      }
    }
  }, [mode, enableDrawingMode, disableDrawingMode]);

  const handleAddDelimitation = () => {
    console.log('➕ Adding new delimitation');
    if (integrated) {
      // En mode intégré, créer une nouvelle délimitation
      const newDelimitation: Delimitation = {
        id: `delim-${Date.now()}`,
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        rotation: 0
      };
      addDelimitation(newDelimitation);
    } else {
      // En mode standalone, utiliser la fonction sans paramètre
      const newDelimitation: Delimitation = {
        id: `delim-${Date.now()}`,
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        rotation: 0
      };
      addDelimitation(newDelimitation);
    }
    setMode('select');
    setIsEditingDelimitation(true);
    setHasUnsavedChanges(true); // Marquer comme non sauvegardé
    if (!integrated) {
      toast.success('Zone de délimitation ajoutée');
    }
  };

  const handleSaveChanges = () => {
    if (!delimitation) return;

    // Utiliser la nouvelle fonction pour obtenir les données
    const delimitationData = getCurrentDelimitationData();
    if (delimitationData) {
      // Sauvegarder dans localStorage (déjà fait par autoSave)
      saveToLocalStorage([delimitationData]);
      
      // Sauvegarder via onSave (pour le backend) - seulement lors de la sauvegarde manuelle
      onSave([delimitationData]);
      
      // Ne pas réinitialiser hasUnsavedChanges pour permettre les sauvegardes automatiques continues
      // setHasUnsavedChanges(false); // ❌ Supprimé pour permettre les repositionnements suivants
      
      if (integrated) {
        toast.success('Zone sauvegardée avec succès', {
          icon: '✅',
          duration: 2000
        });
      }
    }
  };

  const handleRemoveDelimitation = () => {
    removeDelimitation();
    setIsEditingDelimitation(false);
    setHasUnsavedChanges(true); // Suppression = changement non sauvegardé
    if (!integrated) {
      toast.success('Zone de délimitation supprimée');
    }
  };

  const handleModeChange = (newMode: 'select' | 'draw' | 'move') => {
    setMode(newMode);
    if (newMode === 'draw') {
      toast.info('Mode dessin activé. Tracez un rectangle sur l\'image.');
    }
  };

  const handleExportPreview = () => {
    const dataUrl = exportCanvas();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = 'product-preview.png';
      link.href = dataUrl;
      link.click();
      toast.success('Aperçu exporté avec succès');
    }
  };

  const handleTestDesignPlacement = () => {
    if (!delimitation) {
      toast.error('Veuillez d\'abord créer une zone de délimitation');
      return;
    }
    
    const metrics = getImageMetrics();
    if (!metrics) {
      toast.error('Métriques d\'image non disponibles');
      return;
    }

    // Obtenir les coordonnées canvas actuelles
    const canvasCoords = {
      x: delimitation.left || 0,
      y: delimitation.top || 0,
      width: delimitation.width || 0,
      height: delimitation.height || 0,
      scaleX: delimitation.scaleX || 1,
      scaleY: delimitation.scaleY || 1
    };

    // Convertir en coordonnées réelles
    const realCoords = convertToRealImageCoordinates(canvasCoords);
    
    console.log('🎯 Design placement avec coordonnées réelles:', {
      imageOriginale: `${metrics.originalWidth}x${metrics.originalHeight}px`,
      zoneReelle: {
        x: realCoords.x.toFixed(1),
        y: realCoords.y.toFixed(1),
        width: realCoords.width.toFixed(1),
        height: realCoords.height.toFixed(1)
      },
      centreZone: {
        x: (realCoords.x + realCoords.width / 2).toFixed(1),
        y: (realCoords.y + realCoords.height / 2).toFixed(1)
      }
    });

    // Créer un design SVG avec des dimensions connues (par exemple 100x50px)
    const designWidth = 100;
    const designHeight = 50;
    
    // Calculer la position pour centrer le design dans la zone réelle
    const designCenterX = realCoords.x + (realCoords.width / 2);
    const designCenterY = realCoords.y + (realCoords.height / 2);
    const designX = designCenterX - (designWidth / 2);
    const designY = designCenterY - (designHeight / 2);

    // URL d'exemple avec coordonnées réelles intégrées
    const testDesignUrl = 'data:image/svg+xml;base64,' + btoa(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#3b82f6"/>
        <text x="100" y="80" font-family="Arial" font-size="12" fill="white" text-anchor="middle">
          DESIGN TEST
        </text>
        <text x="100" y="100" font-family="Arial" font-size="10" fill="white" text-anchor="middle">
          Zone: ${realCoords.width.toFixed(0)}x${realCoords.height.toFixed(0)}px
        </text>
        <text x="100" y="115" font-family="Arial" font-size="10" fill="white" text-anchor="middle">
          Position: (${realCoords.x.toFixed(0)}, ${realCoords.y.toFixed(0)})
        </text>
        <text x="100" y="130" font-family="Arial" font-size="10" fill="white" text-anchor="middle">
          Centré parfaitement !
        </text>
      </svg>
    `);
    
    centerDesignInDelimitation(testDesignUrl);
    
    toast.success(`Design centré avec précision ! Zone réelle: ${realCoords.width.toFixed(0)}×${realCoords.height.toFixed(0)}px à (${realCoords.x.toFixed(0)}, ${realCoords.y.toFixed(0)})`);
  };

  const handleTestRealCoordinates = () => {
    const metrics = getImageMetrics();
    if (!metrics) {
      toast.error('Métriques d\'image non disponibles');
      return;
    }

    // Créer une délimitation de test au centre de l'image
    const centerX = metrics.originalWidth / 2 - 50; // 100px de large, centré
    const centerY = metrics.originalHeight / 2 - 50; // 100px de haut, centré
    
    const testDelimitation: Delimitation = {
      id: `test-delim-${Date.now()}`,
      x: centerX,
      y: centerY,
      width: 100,
      height: 100,
      rotation: 0
    };

    console.log('🧪 Test real coordinates:', {
      originalImageSize: `${metrics.originalWidth}x${metrics.originalHeight}`,
      realDelimitation: testDelimitation,
      description: 'Centre de l\'image, 100x100px'
    });

    addDelimitation(testDelimitation);
    setMode('select');
    toast.success(`Zone test ajoutée au centre (${centerX.toFixed(0)}, ${centerY.toFixed(0)}) - 100×100px réels`);
  };

  const handleTestPreciseDesignPlacement = () => {
    if (!delimitation) {
      toast.error('Veuillez d\'abord créer une zone de délimitation');
      return;
    }

    // Test avec des dimensions réelles spécifiques (par exemple un logo de 150x80px)
    const designDimensions = { width: 150, height: 80 };
    
    // Créer un design SVG de test avec les dimensions exactes
    const preciseDesignUrl = 'data:image/svg+xml;base64,' + btoa(`
      <svg width="${designDimensions.width}" height="${designDimensions.height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${designDimensions.width}" height="${designDimensions.height}" fill="#10b981" stroke="#059669" stroke-width="2"/>
        <text x="${designDimensions.width/2}" y="25" font-family="Arial" font-size="12" fill="white" text-anchor="middle" font-weight="bold">
          LOGO PRÉCIS
        </text>
        <text x="${designDimensions.width/2}" y="40" font-family="Arial" font-size="10" fill="white" text-anchor="middle">
          ${designDimensions.width} × ${designDimensions.height} pixels
        </text>
        <text x="${designDimensions.width/2}" y="55" font-family="Arial" font-size="9" fill="white" text-anchor="middle">
          Coordonnées réelles
        </text>
        <text x="${designDimensions.width/2}" y="70" font-family="Arial" font-size="9" fill="white" text-anchor="middle">
          Centrage parfait !
        </text>
      </svg>
    `);

    // Utiliser la nouvelle fonction pour un placement précis
    const placement = simulateRealDesignPlacement(preciseDesignUrl, designDimensions);
    
    if (placement) {
      toast.success(`Design ${designDimensions.width}×${designDimensions.height}px placé précisément au centre !`);
      console.log('🎯 Placement précis effectué:', placement);
    } else {
      toast.error('Erreur lors du placement précis');
    }
  };

  const handleTestAutoAdaptedDesign = () => {
    if (!delimitation) {
      toast.error('Veuillez d\'abord définir une zone de délimitation.');
      return;
    }

    // URL d'un design de test
    const testDesignUrl = 'https://picsum.photos/id/237/200/300'; // Un design rectangulaire
    loadDesignImage(testDesignUrl);

    toast.success('Design de test appliqué. Modifiez la zone pour voir l\'adaptation.');
  };

  // 🆕 Exposer les méthodes via le ref (déplacé ici après toutes les définitions de fonctions)
  useImperativeHandle(ref, () => ({
    exportFinalImage,
    createFullImageDelimitation: () => {
      try {
        const metrics = getImageMetrics();
        if (!metrics) {
          return { success: false, error: 'Métriques d\'image non disponibles' };
        }

        const { originalWidth, originalHeight } = metrics;

        // Créer une délimitation qui couvre toute l'image (avec une petite marge de 2%)
        const margin = 0.02; // 2% de marge
        const fullImageDelimitation: Delimitation = {
          id: `delim-full-${Date.now()}`,
          x: originalWidth * margin,
          y: originalHeight * margin,
          width: originalWidth * (1 - 2 * margin),
          height: originalHeight * (1 - 2 * margin),
          rotation: 0,
          name: 'Zone autocollant'
        };

        // Ajouter la délimitation au canvas
        addDelimitation(fullImageDelimitation);

        // Retourner la délimitation créée
        return {
          success: true,
          delimitations: [fullImageDelimitation]
        };
      } catch (error) {
        console.error('Erreur lors de la création de la délimitation pleine image:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        };
      }
    },
    // 🆕 Exposer handleSaveChanges pour permettre la sauvegarde programmatique
    saveChanges: handleSaveChanges
  }), [exportFinalImage, getImageMetrics, addDelimitation, handleSaveChanges]);

  const renderDelimitationPreview = () => {
    if (!delimitation) return null;

    const metrics = getImageMetrics();
    if (!metrics) return null;

    // Obtenir les coordonnées réelles actuelles
    const canvasCoords = {
      x: delimitation.left || 0,
      y: delimitation.top || 0,
      width: delimitation.width || 0,
      height: delimitation.height || 0,
      scaleX: delimitation.scaleX || 1,
      scaleY: delimitation.scaleY || 1
    };

    const realCoords = convertToRealImageCoordinates(canvasCoords);

    // Calculer les informations utiles
    const centerX = realCoords.x + (realCoords.width / 2);
    const centerY = realCoords.y + (realCoords.height / 2);
    const aspectRatio = realCoords.width / realCoords.height;
    const percentageOfImage = ((realCoords.width * realCoords.height) / (metrics.originalWidth * metrics.originalHeight)) * 100;

    // Calculer le feedback visuel et les validations
    const realCoordsWithId = {
      ...realCoords,
      id: (delimitation as any)?.delimitationId || 'temp-id'
    };
    const feedback = calculateVisualFeedback(realCoordsWithId, { width: metrics.originalWidth, height: metrics.originalHeight });
    const validation = validateDelimitationBounds(realCoordsWithId, { width: metrics.originalWidth, height: metrics.originalHeight });
    const recommendedSizes = getRecommendedDesignSizes(realCoordsWithId);

    return (
      <div className="space-y-3">
        {/* Feedback visuel de qualité */}
        <div 
          className="p-3 border rounded text-xs"
          style={{ 
            backgroundColor: `${feedback.color}15`,
            borderColor: feedback.color 
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold" style={{ color: feedback.color }}>
              {feedback.status === 'excellent' && '⭐'} 
              {feedback.status === 'good' && '✅'} 
              {feedback.status === 'warning' && '⚠️'} 
              {feedback.status === 'error' && '❌'} 
              Qualité de la zone
            </h4>
            <div className="flex items-center gap-2">
              <div 
                className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden"
              >
                <div 
                  className="h-full transition-all duration-300"
                  style={{ 
                    width: `${feedback.score}%`,
                    backgroundColor: feedback.color
                  }}
                />
              </div>
              <span className="font-mono text-xs" style={{ color: feedback.color }}>
                {feedback.score}/100
              </span>
            </div>
          </div>
          
          <p style={{ color: feedback.color }} className="font-medium">
            {feedback.message}
          </p>
          
          {/* Affichage des avertissements et suggestions */}
          {validation.warnings.length > 0 && (
            <div className="mt-2 space-y-1">
              {validation.warnings.map((warning, index) => (
                <div key={index} className="text-amber-600 text-xs">
                  ⚠️ {warning}
                </div>
              ))}
            </div>
          )}
          
          {validation.suggestions.length > 0 && (
            <div className="mt-2 space-y-1">
              {validation.suggestions.map((suggestion, index) => (
                <div key={index} className="text-[rgb(20,104,154)] text-xs">
                  💡 {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informations principales sur la délimitation */}
        <div className="p-3 bg-green-50 border border-green-200 rounded text-xs">
          <h4 className="font-semibold text-green-800 mb-2">📐 Zone de personnalisation active</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <div>
                <span className="font-medium text-green-700">Position réelle:</span>
                <div className="font-mono text-green-800">
                  X: {realCoords.x.toFixed(0)}px ({((realCoords.x / metrics.originalWidth) * 100).toFixed(1)}%)
                </div>
                <div className="font-mono text-green-800">
                  Y: {realCoords.y.toFixed(0)}px ({((realCoords.y / metrics.originalHeight) * 100).toFixed(1)}%)
                </div>
              </div>
              
              <div>
                <span className="font-medium text-green-700">Dimensions réelles:</span>
                <div className="font-mono text-green-800">
                  {realCoords.width.toFixed(0)} × {realCoords.height.toFixed(0)} pixels
                </div>
                <div className="text-green-600">
                  Ratio: {aspectRatio.toFixed(2)} ({aspectRatio > 1 ? 'Paysage' : aspectRatio < 1 ? 'Portrait' : 'Carré'})
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div>
                <span className="font-medium text-green-700">Centre de la zone:</span>
                <div className="font-mono text-green-800">
                  ({centerX.toFixed(0)}, {centerY.toFixed(0)})
                </div>
              </div>
              
              <div>
                <span className="font-medium text-green-700">Aire de personnalisation:</span>
                <div className="font-mono text-green-800">
                  {(realCoords.width * realCoords.height).toFixed(0)} px²
                </div>
                <div className="text-green-600">
                  {percentageOfImage.toFixed(1)}% de l'image
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Guides pour le placement de designs */}
        <div className="p-3 bg-[rgb(20,104,154)]/5 border border-[rgb(20,104,154)]/30 rounded text-xs">
          <h4 className="font-semibold text-[rgb(20,104,154)] mb-2">🎯 Tailles recommandées pour designs</h4>
          
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white p-2 rounded border">
                <div className="font-medium text-[rgb(20,104,154)] mb-1">🏷️ Logo</div>
                <div className="font-mono text-xs text-[rgb(20,104,154)]">
                  {recommendedSizes.logo.width.toFixed(0)} × {recommendedSizes.logo.height.toFixed(0)}px
                </div>
                <div className="text-xs text-gray-500">Optimal pour logos</div>
              </div>
              
              <div className="bg-white p-2 rounded border">
                <div className="font-medium text-[rgb(20,104,154)] mb-1">📝 Texte</div>
                <div className="font-mono text-xs text-[rgb(20,104,154)]">
                  {recommendedSizes.text.width.toFixed(0)} × {recommendedSizes.text.height.toFixed(0)}px
                </div>
                <div className="text-xs text-gray-500">Idéal pour textes</div>
              </div>
              
              <div className="bg-white p-2 rounded border">
                <div className="font-medium text-[rgb(20,104,154)] mb-1">🎯 Icône</div>
                <div className="font-mono text-xs text-[rgb(20,104,154)]">
                  {recommendedSizes.icon.width.toFixed(0)} × {recommendedSizes.icon.height.toFixed(0)}px
                </div>
                <div className="text-xs text-gray-500">Parfait pour icônes</div>
              </div>
              
              <div className="bg-white p-2 rounded border">
                <div className="font-medium text-[rgb(20,104,154)] mb-1">🖼️ Zone complète</div>
                <div className="font-mono text-xs text-[rgb(20,104,154)]">
                  {recommendedSizes.fullArea.width.toFixed(0)} × {recommendedSizes.fullArea.height.toFixed(0)}px
                </div>
                <div className="text-xs text-gray-500">Utilise toute la zone</div>
              </div>
            </div>
            
            <div className="pt-2 border-t border-[rgb(20,104,154)]/30">
              <span className="font-medium text-[rgb(20,104,154)]">Position pour centrage parfait:</span>
              <div className="font-mono text-[rgb(20,104,154)] mt-1">
                Pour un design de L×H pixels, le positionner à:
              </div>
              <div className="font-mono text-[rgb(20,104,154)] text-xs">
                X = {centerX.toFixed(0)} - (L/2) | Y = {centerY.toFixed(0)} - (H/2)
              </div>
            </div>
          </div>
        </div>

        {/* Exemple concret de centrage */}
        <div className="p-3 bg-[rgb(20,104,154)]/5 border border-[rgb(20,104,154)]/30 rounded text-xs">
          <h4 className="font-semibold text-[rgb(16,83,123)] mb-2">💡 Exemple concret</h4>
          
          <div className="space-y-1">
            <div className="text-[rgb(20,104,154)]">
              <strong>Logo 100×60px centré dans cette zone :</strong>
            </div>
            <div className="font-mono text-[rgb(16,83,123)]">
              Position X: {(centerX - 50).toFixed(0)}px
            </div>
            <div className="font-mono text-[rgb(16,83,123)]">
              Position Y: {(centerY - 30).toFixed(0)}px
            </div>
            <div className="text-[rgb(20,104,154)] mt-1">
              Résultat: Logo parfaitement centré à {realCoords.width >= 100 && realCoords.height >= 60 ? '100%' : `${Math.min((realCoords.width/100)*100, (realCoords.height/60)*100).toFixed(0)}%`} de sa taille originale
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDebugInfo = () => {
    const metrics = getImageMetrics();
    if (!metrics || !delimitation) return null;

    const canvasCoords = {
      x: delimitation.left || 0,
      y: delimitation.top || 0,
      width: (delimitation.width || 0) * (delimitation.scaleX || 1),
      height: (delimitation.height || 0) * (delimitation.scaleY || 1),
      rotation: delimitation.angle || 0
    };

    const realCoords = convertToRealImageCoordinates({
      ...canvasCoords,
      width: delimitation.width || 0,
      height: delimitation.height || 0,
      scaleX: delimitation.scaleX || 1,
      scaleY: delimitation.scaleY || 1
    });

    return (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
        <h4 className="font-semibold text-yellow-800 mb-2">🐛 Debug - Coordonnées</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white p-2 rounded">
            <h5 className="font-medium text-gray-800">Image Originale</h5>
            <p>Taille: {metrics.originalWidth} × {metrics.originalHeight}px</p>
            <p>Échelle: {metrics.canvasScale.toFixed(3)}</p>
            <p>Offset: {metrics.canvasOffsetX.toFixed(0)}, {metrics.canvasOffsetY.toFixed(0)}</p>
          </div>
          
          <div className="bg-white p-2 rounded">
            <h5 className="font-medium text-gray-800">Coordonnées Canvas</h5>
            <p>X: {canvasCoords.x.toFixed(0)}px</p>
            <p>Y: {canvasCoords.y.toFixed(0)}px</p>
            <p>L: {canvasCoords.width.toFixed(0)}px</p>
            <p>H: {canvasCoords.height.toFixed(0)}px</p>
          </div>
          
          <div className="bg-white p-2 rounded">
            <h5 className="font-medium text-green-800">Coordonnées Réelles</h5>
            <p>X: {realCoords.x.toFixed(0)}px</p>
            <p>Y: {realCoords.y.toFixed(0)}px</p>
            <p>L: {realCoords.width.toFixed(0)}px</p>
            <p>H: {realCoords.height.toFixed(0)}px</p>
          </div>
        </div>
      </div>
    );
  };

  const renderUsageGuide = () => {
    if (!showInfo) return null;

    const metrics = getImageMetrics();
    if (!metrics) return null;

    return (
      <div className="p-4 bg-[rgb(20,104,154)]/5 border border-[rgb(20,104,154)]/30 rounded text-sm">
        <h4 className="font-semibold text-[rgb(20,104,154)] mb-3">💡 Guide d'utilisation des coordonnées réelles</h4>
        
        <div className="space-y-3">
          <div className="bg-white p-3 rounded border">
            <h5 className="font-medium text-gray-800 mb-2">🖼️ Image source</h5>
            <p className="text-gray-600">
              Dimensions originales: <code className="bg-gray-100 px-2 py-1 rounded">{metrics.originalWidth} × {metrics.originalHeight} pixels</code>
            </p>
          </div>

          <div className="bg-white p-3 rounded border">
            <h5 className="font-medium text-gray-800 mb-2">🎯 Utilisation pratique</h5>
            <div className="space-y-2 text-gray-600 text-xs">
              <p><strong>1. Récupération des coordonnées :</strong></p>
              <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
{`const delimitation = {
  x: 450,      // 450px du bord gauche
  y: 300,      // 300px du bord haut  
  width: 200,  // 200px de largeur
  height: 150  // 150px de hauteur
};`}
              </pre>
              
              <p><strong>2. Centrage d'un design :</strong></p>
              <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
{`const designWidth = 100;
const designHeight = 60;

const centerX = delimitation.x + (delimitation.width / 2);
const centerY = delimitation.y + (delimitation.height / 2);

const designX = centerX - (designWidth / 2);
const designY = centerY - (designHeight / 2);

// Position finale: (${metrics.originalWidth / 2 - 50}, ${metrics.originalHeight / 2 - 30})`}
              </pre>

              <p><strong>3. Génération de rendu final :</strong></p>
              <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
{`// Canvas de rendu aux dimensions réelles
const canvas = new Canvas(${metrics.originalWidth}, ${metrics.originalHeight});

// Placement précis du design
canvas.drawImage(designImg, designX, designY, designWidth, designHeight);`}
              </pre>
            </div>
          </div>

          <div className="bg-green-50 p-3 rounded border border-green-200">
            <h5 className="font-medium text-green-800 mb-2">✅ Avantages</h5>
            <ul className="text-green-700 text-xs space-y-1 list-disc list-inside">
              <li>Positionnement pixel-perfect sur l'image originale</li>
              <li>Indépendant de la taille d'affichage du navigateur</li>
              <li>Compatible avec tous les systèmes de rendu (Canvas, SVG, serveur)</li>
              <li>Reproductible sur différents appareils et résolutions</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderIntegratedInterface = () => {
    if (!integrated) return null;

    const metrics = getImageMetrics();
    
    return (
      <div className="absolute inset-0 pointer-events-none">
        {/* Overlay d'informations en temps réel */}
        {delimitation && metrics && (
          <div className="absolute top-4 right-4 pointer-events-auto">
            <div className="bg-black/80 backdrop-blur-sm text-white rounded-lg p-3 text-xs font-mono space-y-1 min-w-[160px]">
              {/* Coordonnées réelles en temps réel */}
              {(() => {
                const canvasCoords = {
                  x: delimitation.left || 0,
                  y: delimitation.top || 0,
                  width: delimitation.width || 0,
                  height: delimitation.height || 0,
                  scaleX: delimitation.scaleX || 1,
                  scaleY: delimitation.scaleY || 1
                };
                const realCoords = convertToRealImageCoordinates(canvasCoords);
                
                return (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-300">X:</span>
                      <span>{realCoords.x.toFixed(0)}px</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Y:</span>
                      <span>{realCoords.y.toFixed(0)}px</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">L:</span>
                      <span>{realCoords.width.toFixed(0)}px</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">H:</span>
                      <span>{realCoords.height.toFixed(0)}px</span>
                    </div>
                    <div className="border-t border-gray-600 pt-1 mt-1">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Aire:</span>
                        <span className="text-green-400">{(realCoords.width * realCoords.height).toFixed(0)}px²</span>
                      </div>
                    </div>
                    
                    {/* Indicateur de changements non sauvegardés */}
                    {hasUnsavedChanges && (
                      <div className="border-t border-gray-600 pt-1 mt-1">
                        <div className="flex items-center gap-1 text-amber-400">
                          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                          <span className="text-xs">Non sauvegardé</span>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}
        
        {/* Barre d'outils minimaliste */}
        <div className="absolute top-4 left-4 pointer-events-auto">
          <div className="flex items-center gap-1 bg-black/80 backdrop-blur-sm rounded-lg p-1">
            <AdminButton
              size="sm"
              variant={mode === 'select' ? 'default' : 'ghost'}
              onClick={() => {
                if (designImageUrl) return;
                console.log('🖱️ Select mode clicked');
                setMode('select');
              }}
              className="h-8 w-8 p-0 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              title={designImageUrl ? "Supprimez le design pour modifier la zone" : "Sélection et ajustement"}
              disabled={!!designImageUrl}
            >
              <MousePointer className="h-4 w-4" />
            </AdminButton>
            <AdminButton
              size="sm"
              variant={mode === 'draw' ? 'default' : 'ghost'}
              onClick={() => {
                if (designImageUrl) return;
                console.log('🎨 Draw mode clicked');
                setMode('draw');
              }}
              className="h-8 w-8 p-0 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              title={designImageUrl ? "Supprimez le design pour modifier la zone" : "Tracer une nouvelle zone"}
              disabled={!!designImageUrl}
            >
              <Square className="h-4 w-4" />
            </AdminButton>
            {delimitation ? (
              <AdminButton
                size="sm"
                variant="ghost"
                onClick={() => {
                  console.log('🗑️ Remove delimitation clicked');
                  handleRemoveDelimitation();
                }}
                className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/20"
                title="Supprimer la zone"
              >
                <Trash2 className="h-4 w-4" />
              </AdminButton>
            ) : (
              <AdminButton
                size="sm"
                variant="ghost"
                onClick={() => {
                  console.log('🎯 Demo delimitation clicked');
                  handleTestAutoAdaptedDesign();
                }}
                className="h-8 w-8 p-0 text-[rgb(20,104,154)] hover:bg-[rgb(20,104,154)]/50/20"
                title="Créer une zone de démonstration"
              >
                <Crosshair className="h-4 w-4" />
              </AdminButton>
            )}
          </div>
        </div>

        {/* Bouton de sauvegarde principal */}
        {(delimitation && hasUnsavedChanges) && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[rgb(20,104,154)] hover:bg-[rgb(16,83,123)] text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 cursor-pointer transition-all duration-200 hover:shadow-xl border border-[rgb(20,104,154)]/30"
              onClick={handleSaveChanges}
            >
              <Save className="h-4 w-4" />
              <span className="font-medium">Sauvegarder les changements</span>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse ml-1" />
            </motion.div>
          </div>
        )}

        {/* Indicateur d'état du dessin */}
        {isDrawing && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
            <div className="bg-[rgb(20,104,154)] text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Tracez votre zone de personnalisation
            </div>
          </div>
        )}

        {/* Feedback de qualité en temps réel */}
        {delimitation && metrics && !isDrawing && (
          <div className="absolute bottom-4 right-4 pointer-events-auto">
            {(() => {
              const canvasCoords = {
                x: delimitation.left || 0,
                y: delimitation.top || 0,
                width: delimitation.width || 0,
                height: delimitation.height || 0,
                scaleX: delimitation.scaleX || 1,
                scaleY: delimitation.scaleY || 1
              };
              const realCoords = convertToRealImageCoordinates(canvasCoords);
              const realCoordsWithId = {
                ...realCoords,
                id: (delimitation as any)?.delimitationId || 'temp-id'
              };
              const feedback = calculateVisualFeedback(realCoordsWithId, { width: metrics.originalWidth, height: metrics.originalHeight });
              
              return (
                <div 
                  className="bg-black/80 backdrop-blur-sm rounded-lg p-2 flex items-center gap-2 text-white text-xs"
                  style={{ borderLeft: `3px solid ${feedback.color}` }}
                >
                  <div className="text-lg">
                    {feedback.status === 'excellent' && '⭐'}
                    {feedback.status === 'good' && '✅'}
                    {feedback.status === 'warning' && '⚠️'}
                    {feedback.status === 'error' && '❌'}
                  </div>
                  <div>
                    <div className="font-medium" style={{ color: feedback.color }}>
                      {feedback.score}/100
                    </div>
                    <div className="text-gray-300 text-xs">
                      {feedback.message.length > 30 ? feedback.message.substring(0, 30) + '...' : feedback.message}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Indicateur de sauvegarde automatique */}
        {isAutoSaving && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg"
            >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>Sauvegarde automatique...</span>
            </motion.div>
          </div>
        )}

        {/* Indicateur de changements non sauvegardés */}
        {hasUnsavedChanges && !isAutoSaving && delimitation && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg"
            >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>Modifications en cours...</span>
            </motion.div>
          </div>
        )}

        {/* Message de bienvenue si pas de délimitation */}
        {!delimitation && !isDrawing && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
            <div className="bg-gray-800/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <Square className="h-4 w-4 text-[rgb(20,104,154)]" />
              Cliquez sur l'icône carré pour tracer une zone
            </div>
          </div>
        )}
      </div>
    );
  };

  if (integrated) {
    return (
      <div className={`relative ${className}`}>
        {/* Canvas principal */}
        <div className="w-full aspect-[4/3] bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
          <canvas 
            ref={canvasRef} 
            className="w-full h-full"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />
        </div>
        
        {/* Interface intégrée */}
        {renderIntegratedInterface()}
        
        {/* Informations détaillées (optionnelles) */}
        {showInfo && renderDelimitationPreview()}
      </div>
    );
  }

  // Version non intégrée (existante)
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header avec les actions */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Square className="h-5 w-5" />
            Zones de personnalisation
          </h3>
          <Badge variant="outline">
            {existingDelimitations.length} zone{existingDelimitations.length > 1 ? 's' : ''}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <AdminButton 
            onClick={() => setShowInfo(!showInfo)} 
            size="sm" 
            variant="ghost"
            className="text-xs"
          >
            🐛 Debug
          </AdminButton>
          <AdminButton onClick={handleSaveChanges} size="sm">
            <Save className="h-4 w-4 mr-1" />
            Sauvegarder
          </AdminButton>
          <AdminButton onClick={onCancel} size="sm" variant="outline">
            <X className="h-4 w-4 mr-1" />
            Annuler
          </AdminButton>
        </div>
      </div>

      {/* Debug Info */}
      {showInfo && renderDebugInfo()}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-1">
          <AdminButton
            size="sm"
            variant={mode === 'select' ? 'default' : 'ghost'}
            onClick={() => setMode('select')}
          >
            <MousePointer className="h-4 w-4" />
          </AdminButton>
          <AdminButton
            size="sm"
            variant={mode === 'draw' ? 'default' : 'ghost'}
            onClick={() => setMode('draw')}
          >
            <Square className="h-4 w-4" />
          </AdminButton>
          <AdminButton
            size="sm"
            variant={mode === 'move' ? 'default' : 'ghost'}
            onClick={() => setMode('move')}
          >
            <Move className="h-4 w-4" />
          </AdminButton>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-1">
          <AdminButton
            size="sm"
            variant="outline"
            onClick={handleAddDelimitation}
          >
            <Maximize className="h-4 w-4 mr-1" />
            Nouvelle zone
          </AdminButton>
          
          {delimitation && (
            <>
              <AdminButton
                size="sm"
                variant="outline"
                onClick={() => {
                  saveCurrentDelimitation();
                  toast.success('Zone de délimitation validée');
                }}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Valider zone
              </AdminButton>
              
              <AdminButton
                size="sm"
                variant="outline"
                onClick={() => removeDelimitation()}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Supprimer
              </AdminButton>
            </>
          )}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Indicateur d'état */}
        {isDrawing && (
          <>
            <Badge variant="secondary" className="flex items-center gap-1 animate-pulse">
              <div className="w-2 h-2 bg-orange-500 rounded-full" />
              Dessin en cours
            </Badge>
            <Separator orientation="vertical" className="h-6" />
          </>
        )}

        <div className="flex items-center gap-1">
          <AdminButton
            size="sm"
            variant="outline"
            onClick={handleTestDesignPlacement}
            disabled={!delimitation}
          >
            <Crosshair className="h-4 w-4 mr-1" />
            Test design
          </AdminButton>
          
          <AdminButton
            size="sm"
            variant="outline"
            onClick={handleTestRealCoordinates}
            disabled={!getImageMetrics()}
          >
            <Crosshair className="h-4 w-4 mr-1" />
            Test réelles
          </AdminButton>
          
          <AdminButton
            size="sm"
            variant="outline"
            onClick={handleTestPreciseDesignPlacement}
            disabled={!delimitation}
          >
            <Crosshair className="h-4 w-4 mr-1" />
            Test précis
          </AdminButton>
          
          <AdminButton
            size="sm"
            variant="outline"
            onClick={handleTestAutoAdaptedDesign}
            disabled={!delimitation}
          >
            <Crosshair className="h-4 w-4 mr-1" />
            Test adaptatif
          </AdminButton>
          
          <AdminButton
            size="sm"
            variant="outline"
            onClick={handleExportPreview}
            disabled={!imageUrl}
          >
            <Download className="h-4 w-4 mr-1" />
            Exporter
          </AdminButton>
        </div>
      </div>

      {/* Canvas principal */}
      <div className="flex-1 p-4 bg-gray-50 overflow-hidden">
        <div className="w-full h-full border border-gray-200 rounded-lg overflow-hidden bg-white">
          <canvas 
            ref={canvasRef} 
            className="w-full h-full"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />
        </div>
      </div>

      {/* Liste des délimitations */}
      {existingDelimitations.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Zones délimitées
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {existingDelimitations.map((delim, index) => (
              <div
                key={delim.id}
                className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
              >
                <span className="text-xs text-gray-700">
                  Zone {index + 1}
                </span>
                <AdminButton
                  size="sm"
                  variant="ghost"
                  onClick={() => removeDelimitation()}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </AdminButton>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="p-3 bg-[rgb(20,104,154)]/5 border-t border-[rgb(20,104,154)]/30">
        <p className="text-xs text-[rgb(20,104,154)]">
          💡 <strong>Instructions :</strong> 
        </p>
        <div className="mt-2 space-y-1 text-xs text-[rgb(20,104,154)]">
          <div>• <strong>Créer une zone :</strong> Utilisez "Nouvelle zone" ou activez le mode dessin pour tracer directement</div>
          <div>• <strong>Ajuster précisément :</strong> Déplacez et redimensionnez avec la souris, puis validez avec "Valider zone"</div>
          <div>• <strong>Coordonnées réelles :</strong> Toutes les dimensions sont automatiquement converties en pixels de l'image source</div>
          <div>• <strong>Tests de placement :</strong> 
            <span className="font-mono bg-[rgb(20,104,154)]/10 px-1 rounded">Test design</span> (centrage basique), 
            <span className="font-mono bg-[rgb(20,104,154)]/10 px-1 rounded">Test précis</span> (150×80px), 
            <span className="font-mono bg-[rgb(20,104,154)]/10 px-1 rounded">Test adaptatif</span> (auto-redimensionnement)
          </div>
          <div>• <strong>Prévisualisation :</strong> Les informations en temps réel montrent les coordonnées exactes et guides de centrage</div>
          <div>• <strong>Export :</strong> L'aperçu exporté inclut les délimitations avec leurs dimensions précises</div>
        </div>
      </div>

      {/* Delimitation Preview */}
      {renderDelimitationPreview()}

      {/* Usage Guide */}
      {renderUsageGuide()}
    </div>
  );
}); 