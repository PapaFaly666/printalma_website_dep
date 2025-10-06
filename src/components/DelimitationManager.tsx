import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Target, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Plus,
  MousePointer,
  Maximize2 
} from 'lucide-react';
import { DelimitationService, Delimitation } from '../services/delimitationService';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface DelimitationManagerProps {
  imageUrl: string;
  imageId: number;
  initialDelimitations?: Delimitation[];
  onDelimitationsChange?: (delimitations: Delimitation[]) => void;
  readonly?: boolean;
  className?: string;
}

interface EditingDelimitation extends Delimitation {
  isEditing: boolean;
}

const DelimitationManager: React.FC<DelimitationManagerProps> = ({
  imageUrl,
  imageId,
  initialDelimitations = [],
  onDelimitationsChange,
  readonly = false,
  className = ''
}) => {
  const [delimitations, setDelimitations] = useState<EditingDelimitation[]>(
    initialDelimitations.map(d => ({ ...d, isEditing: false }))
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDelimitation, setSelectedDelimitation] = useState<Delimitation | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupDrawingRef = useRef<(() => void) | null>(null);
  const resizeObserverRef = useRef<(() => void) | null>(null);

  // Charger les délimitations depuis l'API
  const loadDelimitations = useCallback(async () => {
    if (!imageId) return;
    
    try {
      setIsLoading(true);
      const result = await DelimitationService.getImageDelimitations(imageId);
      
      if (result.success && result.data) {
        const loadedDelimitations = result.data.map(d => ({ ...d, isEditing: false }));
        setDelimitations(loadedDelimitations);
        onDelimitationsChange?.(result.data);
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des délimitations');
    } finally {
      setIsLoading(false);
    }
  }, [imageId, onDelimitationsChange]);

  // Actualiser l'affichage des délimitations
  const refreshDisplay = useCallback(() => {
    if (imageRef.current) {
      const activeDelimitations = delimitations.map(({ isEditing, ...rest }) => rest);
      DelimitationService.refreshDelimitationsDisplay(imageRef.current, activeDelimitations);
    }
  }, [delimitations]);

  // Effet pour charger les délimitations initiales
  useEffect(() => {
    if (initialDelimitations.length > 0) {
      setDelimitations(initialDelimitations.map(d => ({ ...d, isEditing: false })));
    } else {
      loadDelimitations();
    }
  }, [initialDelimitations, loadDelimitations]);

  // Effet pour actualiser l'affichage quand les délimitations changent
  useEffect(() => {
    const timer = setTimeout(refreshDisplay, 100);
    return () => clearTimeout(timer);
  }, [delimitations, refreshDisplay]);

  // Effet pour observer les changements de taille d'image
  useEffect(() => {
    if (imageRef.current) {
      const activeDelimitations = delimitations.map(({ isEditing, ...rest }) => rest);
      resizeObserverRef.current = DelimitationService.observeImageResize(
        imageRef.current,
        activeDelimitations
      );
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current();
      }
    };
  }, [delimitations]);

  // Activer/désactiver le mode création
  const toggleCreationMode = () => {
    if (readonly) return;

    if (isCreating) {
      // Désactiver le mode création
      if (cleanupDrawingRef.current) {
        cleanupDrawingRef.current();
        cleanupDrawingRef.current = null;
      }
      setIsCreating(false);
    } else {
      // Activer le mode création
      if (containerRef.current && imageId) {
        cleanupDrawingRef.current = DelimitationService.enableDelimitationDrawingRobust(
          containerRef.current,
          imageId,
          (newDelimitation) => {
            const updatedDelimitations = [...delimitations, { ...newDelimitation, isEditing: false }];
            setDelimitations(updatedDelimitations);
            onDelimitationsChange?.(updatedDelimitations.map(({ isEditing, ...rest }) => rest));
            toast.success('Zone de personnalisation créée avec succès!');
          }
        );
        setIsCreating(true);
      }
    }
  };

  // Modifier une délimitation
  const handleEdit = (delimitation: Delimitation) => {
    if (readonly) return;
    
    setDelimitations(prev => 
      prev.map(d => 
        d.id === delimitation.id 
          ? { ...d, isEditing: true }
          : { ...d, isEditing: false }
      )
    );
  };

  // Sauvegarder les modifications
  const handleSave = async (delimitation: EditingDelimitation) => {
    if (!delimitation.id) return;

    try {
      const { isEditing, ...delimitationData } = delimitation;
      const result = await DelimitationService.updateDelimitation(delimitation.id, delimitationData);
      
      if (result.success && result.data) {
        const updatedDelimitations = delimitations.map(d => 
          d.id === delimitation.id 
            ? { ...result.data, isEditing: false }
            : d
        );
        setDelimitations(updatedDelimitations);
        onDelimitationsChange?.(updatedDelimitations.map(({ isEditing, ...rest }) => rest));
        toast.success('Délimitation mise à jour avec succès!');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de la délimitation');
    }
  };

  // Annuler les modifications
  const handleCancel = (delimitation: EditingDelimitation) => {
    const originalDelimitation = initialDelimitations.find(d => d.id === delimitation.id);
    if (originalDelimitation) {
      setDelimitations(prev => 
        prev.map(d => 
          d.id === delimitation.id 
            ? { ...originalDelimitation, isEditing: false }
            : d
        )
      );
    }
  };

  // Supprimer une délimitation
  const handleDelete = (delimitation: Delimitation) => {
    setSelectedDelimitation(delimitation);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedDelimitation?.id) return;

    try {
      const result = await DelimitationService.deleteDelimitation(selectedDelimitation.id);
      
      if (result.success) {
        const updatedDelimitations = delimitations.filter(d => d.id !== selectedDelimitation.id);
        setDelimitations(updatedDelimitations);
        onDelimitationsChange?.(updatedDelimitations.map(({ isEditing, ...rest }) => rest));
        toast.success('Délimitation supprimée avec succès!');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression de la délimitation');
    } finally {
      setShowDeleteDialog(false);
      setSelectedDelimitation(null);
    }
  };

  // Mettre à jour les champs d'une délimitation en cours d'édition
  const updateDelimitationField = (id: number, field: string, value: any) => {
    setDelimitations(prev => 
      prev.map(d => 
        d.id === id 
          ? { ...d, [field]: value }
          : d
      )
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Zones de Personnalisation
              <Badge variant="outline">{delimitations.length}</Badge>
            </CardTitle>
            
            {!readonly && (
              <div className="flex gap-2">
                <Button
                  variant={isCreating ? "destructive" : "default"}
                  size="sm"
                  onClick={toggleCreationMode}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <X className="h-4 w-4" />
                      Annuler
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Créer Zone
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
          
          {isCreating && (
            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded-lg">
              <MousePointer className="h-4 w-4" />
              Cliquez et glissez sur l'image pour créer une zone de personnalisation
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Container d'image avec délimitations */}
      <Card>
        <CardContent className="p-0">
          <div 
            ref={containerRef}
            className="relative bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden p-4"
            style={{ minHeight: '300px' }}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Image du produit"
              className="w-full h-auto max-w-full max-h-[500px] object-contain mx-auto block"
              style={{ 
                cursor: isCreating ? 'crosshair' : 'default',
                userSelect: 'none'
              }}
              onLoad={refreshDisplay}
              onError={() => toast.error('Erreur lors du chargement de l\'image')}
            />
            
            {!imageUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Maximize2 className="h-12 w-12 mx-auto mb-2" />
                  <p>Aucune image disponible</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Liste des délimitations */}
      {delimitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Délimitations existantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {delimitations.map((delimitation) => (
              <div 
                key={delimitation.id} 
                className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800"
              >
                {delimitation.isEditing ? (
                  // Mode édition
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Nom</Label>
                        <Input
                          value={delimitation.name || ''}
                          onChange={(e) => updateDelimitationField(delimitation.id!, 'name', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">X (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={delimitation.x}
                            onChange={(e) => updateDelimitationField(delimitation.id!, 'x', parseFloat(e.target.value))}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Y (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={delimitation.y}
                            onChange={(e) => updateDelimitationField(delimitation.id!, 'y', parseFloat(e.target.value))}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Largeur (%)</Label>
                        <Input
                          type="number"
                          min="0.1"
                          max="100"
                          step="0.1"
                          value={delimitation.width}
                          onChange={(e) => updateDelimitationField(delimitation.id!, 'width', parseFloat(e.target.value))}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Hauteur (%)</Label>
                        <Input
                          type="number"
                          min="0.1"
                          max="100"
                          step="0.1"
                          value={delimitation.height}
                          onChange={(e) => updateDelimitationField(delimitation.id!, 'height', parseFloat(e.target.value))}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(delimitation)}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Annuler
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSave(delimitation)}
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Sauvegarder
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Mode affichage
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">
                        {delimitation.name || `Zone ${delimitation.id}`}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Position: {delimitation.x.toFixed(1)}%, {delimitation.y.toFixed(1)}% • 
                        Taille: {delimitation.width.toFixed(1)}% × {delimitation.height.toFixed(1)}%
                      </p>
                    </div>
                    
                    {!readonly && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(delimitation)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(delimitation)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmation de suppression */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la délimitation</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer la zone "{selectedDelimitation?.name}" ? 
              Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSS pour les délimitations */}
      <style>{`
        .delimitation-zone {
          transition: opacity 0.2s ease;
        }
        .delimitation-zone:hover {
          opacity: 0.8;
          border-color: #0056b3;
        }
        .delimitation-zone-temp {
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default DelimitationManager; 