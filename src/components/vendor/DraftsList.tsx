import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Button from '../ui/Button';
import { Badge } from '../ui/badge';
import { 
  Edit, 
  Package, 
  Trash2, 
  Image as ImageIcon,
  Clock,
  Layers,
  RefreshCw
} from 'lucide-react';
import { DesignPositionData, designPositionService } from '../../services/DesignPositionService';

interface DraftsListProps {
  onEditDraft?: (draft: DesignPositionData) => void;
  onCreateProductFromDraft?: (draft: DesignPositionData) => void;
  onDeleteDraft?: (draft: DesignPositionData) => void;
  className?: string;
}

export const DraftsList: React.FC<DraftsListProps> = ({
  onEditDraft,
  onCreateProductFromDraft,
  onDeleteDraft,
  className = ''
}) => {
  const [drafts, setDrafts] = useState<DesignPositionData[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Charger les brouillons
  const loadDrafts = useCallback(async () => {
    setLoading(true);
    try {
      const allDrafts = designPositionService.getAllDrafts();
      setDrafts(allDrafts);
      console.log('📋 Brouillons chargés:', allDrafts.length);
    } catch (error) {
      console.error('❌ Erreur chargement brouillons:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);
  
  // Supprimer un brouillon
  const handleDeleteDraft = (draft: DesignPositionData) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce brouillon ?')) {
      designPositionService.deletePosition(draft.vendorId, draft.baseProductId, draft.designId);
      setDrafts(prev => prev.filter(d => 
        !(d.designId === draft.designId && 
          d.baseProductId === draft.baseProductId && 
          d.vendorId === draft.vendorId)
      ));
      onDeleteDraft?.(draft);
      console.log('🗑️ Brouillon supprimé:', draft);
    }
  };
  
  // Nettoyage des brouillons obsolètes
  const handleCleanupOldDrafts = () => {
    const cleaned = designPositionService.cleanupOldDrafts(24);
    if (cleaned > 0) {
      loadDrafts(); // Recharger la liste
      console.log(`🧹 ${cleaned} brouillons obsolètes supprimés`);
    }
  };
  
  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return new Date(timestamp).toLocaleDateString();
  };
  
  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Chargement des brouillons...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Layers className="h-5 w-5 mr-2" />
              Designs en cours de positionnement
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {drafts.length} brouillon{drafts.length > 1 ? 's' : ''}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCleanupOldDrafts}
                title="Nettoyer les brouillons de plus de 24h"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadDrafts}
                title="Actualiser"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {drafts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucun brouillon</p>
              <p className="text-sm">Commencez à positionner un design pour créer un brouillon</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {drafts.map((draft) => (
                <div
                  key={`${draft.vendorId}_${draft.baseProductId}_${draft.designId}`}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* Image placeholder */}
                  <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  
                  {/* Informations */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">
                        Design #{draft.designId}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        Produit #{draft.baseProductId}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Position:</span>
                        <span>x={draft.position.x.toFixed(1)}, y={draft.position.y.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Échelle:</span>
                        <span>{draft.position.scale.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rotation:</span>
                        <span>{draft.position.rotation}°</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatRelativeTime(draft.timestamp)}
                    </div>
                    
                    {/* Prévisualisation des sélections */}
                    {draft.previewSelections && (
                      <div className="text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>Prix:</span>
                          <span>{draft.previewSelections.price.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Stock:</span>
                          <span>{draft.previewSelections.stock}</span>
                        </div>
                        {draft.previewSelections.colors.length > 0 && (
                          <div className="flex justify-between">
                            <span>Couleurs:</span>
                            <span>{draft.previewSelections.colors.length}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditDraft?.(draft)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Continuer
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onCreateProductFromDraft?.(draft)}
                      className="flex-1"
                    >
                      <Package className="h-3 w-3 mr-1" />
                      Créer
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDraft(draft)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DraftsList; 