import React, { useState } from 'react';
import { Copy, Check, X, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { ColorVariation, ProductImage, Delimitation } from '../../types/product';
import { toast } from 'sonner';

interface DelimitationDuplicatorProps {
  isOpen: boolean;
  onClose: () => void;
  sourceImage: ProductImage;
  sourceColorName: string;
  allColorVariations: ColorVariation[];
  onDuplicate: (targetImageIds: string[], delimitations: Delimitation[]) => void;
}

export const DelimitationDuplicator: React.FC<DelimitationDuplicatorProps> = ({
  isOpen,
  onClose,
  sourceImage,
  sourceColorName,
  allColorVariations,
  onDuplicate,
}) => {
  const [selectedTargetImages, setSelectedTargetImages] = useState<Set<string>>(new Set());
  const [selectedDelimitations, setSelectedDelimitations] = useState<Set<string>>(new Set());
  const [imagesLoaded, setImagesLoaded] = useState<Set<string>>(new Set());

  // Initialize with all delimitations selected
  React.useEffect(() => {
    if (sourceImage.delimitations) {
      setSelectedDelimitations(new Set(sourceImage.delimitations.map(d => d.id)));
    }
  }, [sourceImage.delimitations]);

  // Reset images loaded when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setImagesLoaded(new Set());
    }
  }, [isOpen]);

  const handleImageLoad = (imageId: string) => {
    setImagesLoaded(prev => new Set([...prev, imageId]));
  };

  // Fonction pour afficher les délimitations avec style moderne
  const renderDelimitationOverlay = (image: ProductImage, isSource = false, containerId?: string) => {
    if (!image.delimitations || image.delimitations.length === 0) return null;

    return (
      <div className="absolute inset-0">
        {image.delimitations.map((delim, index) => {
          let percentageCoords;
          
          if (delim._debug?.realImageSize) {
            const realImageWidth = delim._debug.realImageSize.width;
            const realImageHeight = delim._debug.realImageSize.height;
            
            percentageCoords = {
              left: (delim.x / realImageWidth) * 100,
              top: (delim.y / realImageHeight) * 100,
              width: (delim.width / realImageWidth) * 100,
              height: (delim.height / realImageHeight) * 100
            };
          } else {
            // Utiliser l'identifiant du conteneur pour trouver la bonne image
            let imageElement: HTMLImageElement | null = null;
            
            if (containerId) {
              const container = document.getElementById(containerId.replace('#', ''));
              if (container) {
                imageElement = container.querySelector('img') as HTMLImageElement;
              }
            } else {
              // Fallback : chercher toutes les images avec cette URL et prendre la première visible
              const images = document.querySelectorAll(`img[src="${image.url}"]`) as NodeListOf<HTMLImageElement>;
              for (const img of images) {
                const rect = img.getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                  imageElement = img;
                  break;
                }
              }
            }
            
            if (imageElement && imageElement.naturalWidth && imageElement.naturalHeight) {
              percentageCoords = {
                left: (delim.x / imageElement.naturalWidth) * 100,
                top: (delim.y / imageElement.naturalHeight) * 100,
                width: (delim.width / imageElement.naturalWidth) * 100,
                height: (delim.height / imageElement.naturalHeight) * 100
              };
            } else {
              percentageCoords = {
                left: (delim.x / 600) * 100,
                top: (delim.y / 400) * 100,
                width: (delim.width / 600) * 100,
                height: (delim.height / 400) * 100
              };
            }
          }

          // Style épuré : noir pour source sélectionnée, gris pour non-sélectionnée, gris foncé pour existante
          const colorScheme = isSource ? {
            border: selectedDelimitations.has(delim.id) ? 'border-gray-900 dark:border-gray-100' : 'border-gray-400 dark:border-gray-600',
            bg: selectedDelimitations.has(delim.id) ? 'bg-gray-900/20 dark:bg-gray-100/20' : 'bg-gray-400/10 dark:bg-gray-600/10',
            badgeBg: selectedDelimitations.has(delim.id) ? 'bg-gray-900 dark:bg-gray-100' : 'bg-gray-400 dark:bg-gray-600',
            badgeText: selectedDelimitations.has(delim.id) ? 'text-white dark:text-gray-900' : 'text-white',
            centerBg: selectedDelimitations.has(delim.id) ? 'bg-gray-900 dark:bg-gray-100' : 'bg-gray-500 dark:bg-gray-600'
          } : {
            border: 'border-gray-600 dark:border-gray-400',
            bg: 'bg-gray-600/15 dark:bg-gray-400/15',
            badgeBg: 'bg-gray-600 dark:bg-gray-400',
            badgeText: 'text-white dark:text-gray-900',
            centerBg: 'bg-gray-700 dark:bg-gray-500'
          };

          return (
            <div
              key={delim.id || index}
              className={`absolute border-2 ${colorScheme.border} ${colorScheme.bg} rounded backdrop-blur-sm transition-all duration-200 z-10`}
              style={{
                left: `${percentageCoords.left}%`,
                top: `${percentageCoords.top}%`,
                width: `${percentageCoords.width}%`,
                height: `${percentageCoords.height}%`,
                transform: delim.rotation ? `rotate(${delim.rotation}deg)` : 'none',
                transformOrigin: 'center',
                minWidth: '4px',
                minHeight: '4px'
              }}
            >
              {/* Zone info badge épuré */}
              <div className={`absolute -top-6 left-0 ${colorScheme.badgeBg} ${colorScheme.badgeText} text-xs px-2 py-0.5 rounded shadow-lg whitespace-nowrap font-medium z-20`}>
                {isSource ? `Zone ${index + 1}` : `${index + 1}`}
              </div>
              
              {/* Center point indicator */}
              <div className={`absolute top-1/2 left-1/2 w-2 h-2 ${colorScheme.centerBg} rounded-full transform -translate-x-1/2 -translate-y-1/2 z-20`}></div>
              
              {/* Corner indicators */}
              <div className={`absolute -top-1 -left-1 w-2 h-2 ${colorScheme.centerBg} rounded-full`}></div>
              <div className={`absolute -top-1 -right-1 w-2 h-2 ${colorScheme.centerBg} rounded-full`}></div>
              <div className={`absolute -bottom-1 -left-1 w-2 h-2 ${colorScheme.centerBg} rounded-full`}></div>
              <div className={`absolute -bottom-1 -right-1 w-2 h-2 ${colorScheme.centerBg} rounded-full`}></div>
            </div>
          );
        })}
      </div>
    );
  };

  const handleTargetImageToggle = (imageId: string) => {
    const newSelected = new Set(selectedTargetImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedTargetImages(newSelected);
  };

  const handleDelimitationToggle = (delimitationId: string) => {
    const newSelected = new Set(selectedDelimitations);
    if (newSelected.has(delimitationId)) {
      newSelected.delete(delimitationId);
    } else {
      newSelected.add(delimitationId);
    }
    setSelectedDelimitations(newSelected);
  };

  const handleSelectAllImages = () => {
    const allImageIds = allColorVariations
      .filter(color => color.name !== sourceColorName)
      .flatMap(color => color.images.map(img => img.id));
    setSelectedTargetImages(new Set(allImageIds));
  };

  const handleDeselectAllImages = () => {
    setSelectedTargetImages(new Set());
  };

  const handleDuplicate = () => {
    if (selectedTargetImages.size === 0) {
      toast.error('Veuillez sélectionner au moins une image de destination');
      return;
    }

    if (selectedDelimitations.size === 0) {
      toast.error('Veuillez sélectionner au moins une délimitation à dupliquer');
      return;
    }

    const delimitationsToDuplicate = sourceImage.delimitations?.filter(d => 
      selectedDelimitations.has(d.id)
    ) || [];

    // Create new delimitations with unique IDs
    const newDelimitations = delimitationsToDuplicate.map(delim => ({
      ...delim,
      id: `${delim.id}_copy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: delim.name ? `${delim.name} (copie)` : undefined
    }));

    onDuplicate(Array.from(selectedTargetImages), newDelimitations);

    // Message mis à jour pour expliquer la synchronisation centralisée
    toast.success(`🔄 Synchronisation des zones : Les délimitations seront appliquées à toutes les images du produit pour maintenir la cohérence`);

    onClose();
  };

  const selectedCount = selectedTargetImages.size;
  const selectedDelimitationsCount = selectedDelimitations.size;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] w-[95vw] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
            <Copy className="h-6 w-6" />
            Dupliquer les zones de personnalisation
          </DialogTitle>
          <p className="text-readable mt-2">
            Copiez les délimitations de <span className="font-semibold">{sourceColorName}</span> vers d'autres couleurs
          </p>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6 p-6 overflow-hidden min-h-0">
          {/* Source - Panel gauche */}
          <div className="flex flex-col space-y-4 min-h-0">
            <div className="flex items-center justify-between">
              <h3 className="subsection-title">
                Source : {sourceColorName}
              </h3>
              <div className="badge-modern badge-size">
                {sourceImage.delimitations?.length || 0} zone{(sourceImage.delimitations?.length || 0) > 1 ? 's' : ''}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 flex-1 min-h-0 flex flex-col">
              <div 
                id="duplicator-source-image"
                className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 mb-4 flex-shrink-0"
              >
                <img
                  src={sourceImage.url}
                  alt={`${sourceColorName} - ${sourceImage.view}`}
                  className="w-full h-full object-cover"
                  onLoad={(e) => {
                    handleImageLoad('source');
                    // Simple re-render pour s'assurer que les délimitations sont visibles
                    setTimeout(() => {
                      const container = document.getElementById('duplicator-source-image');
                      if (container) {
                        container.style.transform = 'translateZ(0)';
                        setTimeout(() => {
                          container.style.transform = '';
                        }, 10);
                      }
                    }, 100);
                  }}
                />
                {renderDelimitationOverlay(sourceImage, true, 'duplicator-source-image')}
              </div>

              <div className="flex-1 min-h-0">
                <h4 className="product-title mb-3">Zones à dupliquer :</h4>
                <ScrollArea className="h-full max-h-40">
                  <div className="space-y-3 pr-2">
                    {sourceImage.delimitations?.map((delim, index) => (
                      <div key={delim.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <Checkbox
                          id={`delim-${delim.id}`}
                          checked={selectedDelimitations.has(delim.id)}
                          onCheckedChange={() => handleDelimitationToggle(delim.id)}
                          className="border-gray-300 dark:border-gray-600"
                        />
                        <label 
                          htmlFor={`delim-${delim.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="product-meta font-semibold">
                            Zone {index + 1} {delim.name ? `(${delim.name})` : ''}
                          </div>
                          <div className="stat-number text-gray-500 dark:text-gray-400">
                            {Math.round(delim.width)}×{Math.round(delim.height)}px
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>

          {/* Destinations - Panel droit */}
          <div className="flex flex-col space-y-4 min-h-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="subsection-title">
                Destinations
              </h3>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleSelectAllImages}
                  className="text-xs border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Tout sélectionner
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleDeselectAllImages}
                  className="text-xs border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Désélectionner
                </Button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex-1 min-h-0">
              <ScrollArea className="h-full p-4">
                <div className="space-y-6">
                  {allColorVariations
                    .filter(color => color.name !== sourceColorName)
                    .map((color) => (
                      <div key={color.id} className="space-y-3">
                        <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                          <div 
                            className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: color.colorCode }}
                          />
                          <h4 className="product-title">
                            {color.name}
                          </h4>
                          <div className="badge-modern badge-size">
                            {color.images.length} image{color.images.length > 1 ? 's' : ''}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {color.images.map((image) => {
                            const imageId = `duplicator-target-${color.id}-${image.id}`;
                            
                            return (
                              <div
                                key={image.id}
                                className={`relative cursor-pointer rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                                  selectedTargetImages.has(image.id)
                                    ? 'border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-gray-700'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                                onClick={() => handleTargetImageToggle(image.id)}
                              >
                                <div 
                                  id={imageId}
                                  className="aspect-square rounded-lg overflow-hidden relative"
                                >
                                  <img
                                    src={image.url}
                                    alt={`${color.name} - ${image.view}`}
                                    className="w-full h-full object-cover"
                                    onLoad={(e) => {
                                      handleImageLoad(imageId);
                                      // Simple re-render pour s'assurer que les délimitations sont visibles
                                      setTimeout(() => {
                                        const container = document.getElementById(imageId);
                                        if (container) {
                                          container.style.transform = 'translateZ(0)';
                                          setTimeout(() => {
                                            container.style.transform = '';
                                          }, 10);
                                        }
                                      }, 100);
                                    }}
                                  />
                                  
                                  {renderDelimitationOverlay(image, false, imageId)}
                                </div>
                                
                                {/* Indicateur de sélection */}
                                <div className="absolute top-2 right-2">
                                  {selectedTargetImages.has(image.id) && (
                                    <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full p-1 shadow-lg">
                                      <Check className="h-3 w-3" />
                                    </div>
                                  )}
                                </div>

                                {/* Label de vue */}
                                <div className="absolute bottom-2 left-2 bg-gray-900/80 dark:bg-gray-100/80 text-white dark:text-gray-900 text-xs px-2 py-1 rounded font-medium">
                                  {image.view}
                                </div>

                                {/* Indicateur de zones existantes */}
                                {image.delimitations && image.delimitations.length > 0 && (
                                  <div className="absolute top-2 left-2 bg-gray-600 dark:bg-gray-400 text-white dark:text-gray-900 text-xs px-2 py-1 rounded font-medium">
                                    {image.delimitations.length} zone{image.delimitations.length > 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        {/* Actions - Footer fixe */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-readable">
              <span className="font-semibold">{selectedDelimitationsCount}</span> délimitation{selectedDelimitationsCount > 1 ? 's' : ''} → <span className="font-semibold">{selectedCount}</span> image{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              
              <Button 
                onClick={handleDuplicate}
                disabled={selectedCount === 0 || selectedDelimitationsCount === 0}
                className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 button-text hover-lift"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Dupliquer ({selectedDelimitationsCount} → {selectedCount})
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 