import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Move, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Save,
  RefreshCw,
  Trash2,
  Eye,
  Plus,
  Settings,
  Check,
  X,
  AlertCircle,
  Package,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { ProductService } from '../../services/productService';
import { designService } from '../../services/designService';
import { useDesignPositionLocalStorage } from '../../hooks/useDesignPositionLocalStorage';
import SaveIndicator from './SaveIndicator';
import ProductCreationModal from './ProductCreationModal';
import DraftsList from './DraftsList';
import { DesignPositionData } from '../../services/DesignPositionService';
import type { Transformation } from '../../services/transformationService';

// Types conformes à la nouvelle approche localStorage
interface AdminProduct {
  id: number;
  name: string;
  description?: string;
  price: number;
  colorVariations: Array<{
    id: number;
    name: string;
    colorCode: string;
    images: Array<{
      id: number;
      url: string;
      viewType: string;
      delimitations: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        coordinateType: 'PIXEL' | 'PERCENTAGE';
      }>;
    }>;
  }>;
  sizes: Array<{
    id: number;
    sizeName: string;
  }>;
}

interface Design {
  id: number;
  name: string;
  imageUrl?: string;
  thumbnailUrl?: string;
}

interface VendorDesignTransformationWorkflowProps {
  baseProductId: number;
  designId?: number;
  vendorId?: number; // Requis pour localStorage, par défaut 0 si non fourni
  onProductCreated?: (productId: number) => void;
  onTransformationCreated?: (transformation: Transformation) => void;
  onProductPublished?: (productId: number) => void;
  className?: string;
}

export const VendorDesignTransformationWorkflow: React.FC<VendorDesignTransformationWorkflowProps> = ({
  baseProductId,
  designId,
  vendorId = 0,
  onProductCreated,
  onTransformationCreated,
  onProductPublished,
  className = ''
}) => {
  // État principal
  const [adminProduct, setAdminProduct] = useState<AdminProduct | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // État de l'éditeur avec localStorage
  const {
    position,
    setPosition,
    previewSelections,
    setPreviewSelections,
    hasPosition,
    lastSaved,
    deletePosition,
    getAllDrafts,
    cleanupOldDrafts
  } = useDesignPositionLocalStorage({
    vendorId,
    baseProductId,
    designId: selectedDesign?.id || designId || 0,
    debounceMs: 300
  });
  
  // État de l'éditeur
  const [isDragging, setIsDragging] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDraftsList, setShowDraftsList] = useState(false);
  
  // Références pour l'éditeur
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Récupération du produit admin ✅
  useEffect(() => {
    const fetchAdminProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await ProductService.getProductSmart(baseProductId);
        setAdminProduct(result.data);
        
        console.log('✅ Produit admin récupéré:', result.data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Erreur lors de la récupération du produit');
        console.error('❌ Erreur récupération produit:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminProduct();
  }, [baseProductId]);
  
  // Récupération des designs disponibles
  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        const result = await designService.getDesigns({ status: 'published' });
        // Normaliser les IDs des designs en numbers
        const normalizedDesigns = result.designs.map(design => ({
          ...design,
          id: typeof design.id === 'string' ? parseInt(design.id, 10) : design.id
        }));
        setDesigns(normalizedDesigns as Design[]);
        
        // Sélectionner le design par défaut
        if (designId) {
          const design = normalizedDesigns.find(d => d.id === designId);
          if (design) setSelectedDesign(design as Design);
        }
      } catch (error) {
        console.error('❌ Erreur récupération designs:', error);
      }
    };
    
    fetchDesigns();
  }, [designId]);
  
  // Gestionnaires de drag pour l'éditeur
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };
  
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    const newPosition = {
      ...position,
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y))
    };
    
    setPosition(newPosition);
  }, [isDragging, position, setPosition]);
  
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);
  
  // Gestionnaires pour les contrôles
  const handleScaleChange = (newScale: number) => {
    const newPosition = { ...position, scale: newScale };
    setPosition(newPosition);
  };
  
  const handleRotationChange = (newRotation: number) => {
    const newPosition = { ...position, rotation: newRotation };
    setPosition(newPosition);
  };
  
  // Gestionnaires pour les brouillons
  const handleEditDraft = (draft: DesignPositionData) => {
    // Sélectionner le design correspondant
    const design = designs.find(d => d.id === draft.designId);
    if (design) {
      setSelectedDesign(design);
      setShowDraftsList(false);
      console.log('✏️ Édition du brouillon:', draft);
    }
  };
  
  const handleCreateProductFromDraft = (draft: DesignPositionData) => {
    // Sélectionner le design correspondant
    const design = designs.find(d => d.id === draft.designId);
    if (design) {
      setSelectedDesign(design);
      setShowProductModal(true);
      console.log('📦 Création produit depuis brouillon:', draft);
    }
  };
  
  const handleDeleteDraft = (draft: DesignPositionData) => {
    console.log('🗑️ Brouillon supprimé:', draft);
    // Le DraftsList gère déjà la suppression
  };
  
  // Bouton de validation
  const handleValidateDesign = () => {
    if (!selectedDesign) {
      toast.error('Veuillez sélectionner un design');
      return;
    }
    
    if (!hasPosition) {
      toast.error('Veuillez positionner le design d\'abord');
      return;
    }
    
    setShowProductModal(true);
  };
  
  // Nettoyage des brouillons
  const handleCleanupDrafts = () => {
    const cleaned = cleanupOldDrafts();
    if (cleaned > 0) {
      toast.success(`${cleaned} brouillons nettoyés`);
    } else {
      toast.info('Aucun brouillon à nettoyer');
    }
  };
  
  if (loading && !adminProduct) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <AlertCircle className="h-8 w-8 mr-2" />
        <span>{error}</span>
      </div>
    );
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header avec indicateur de sauvegarde */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold">Positionnement Design</h2>
          <SaveIndicator 
            lastSaved={lastSaved}
            hasPosition={hasPosition}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDraftsList(true)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Brouillons ({getAllDrafts().length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCleanupDrafts}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Nettoyer
          </Button>
        </div>
      </div>
      
      {/* Sélection du design */}
      <Card>
        <CardHeader>
          <CardTitle>Sélectionner un design</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {designs.map((design) => (
              <div
                key={design.id}
                className={`relative cursor-pointer rounded-lg border-2 p-2 ${
                  selectedDesign?.id === design.id ? 'border-blue-500' : 'border-gray-200'
                }`}
                onClick={() => setSelectedDesign(design)}
              >
                <img
                  src={design.thumbnailUrl || design.imageUrl}
                  alt={design.name}
                  className="h-20 w-20 object-cover rounded"
                />
                <p className="mt-1 text-sm font-medium truncate">{design.name}</p>
                {selectedDesign?.id === design.id && (
                  <Check className="absolute -top-2 -right-2 h-6 w-6 text-blue-500 bg-white rounded-full" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Éditeur de design */}
      {adminProduct && selectedDesign && (
        <Card>
          <CardHeader>
            <CardTitle>Éditeur de design - {adminProduct.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Prévisualisation */}
              <div className="space-y-4">
                <div
                  ref={containerRef}
                  className="relative bg-gray-100 rounded-lg overflow-hidden"
                  style={{ aspectRatio: '1/1', height: '400px' }}
                >
                  {/* Mockup produit */}
                  <img
                    src={adminProduct.colorVariations[0]?.images[0]?.url}
                    alt={adminProduct.name}
                    className="w-full h-full object-contain"
                  />
                  
                  {/* Design superposé */}
                  <div
                    className="absolute cursor-move"
                    style={{
                      left: `${position.x * 100}%`,
                      top: `${position.y * 100}%`,
                      transform: `translate(-50%, -50%) scale(${position.scale}) rotate(${position.rotation}deg)`,
                      transformOrigin: 'center'
                    }}
                    onMouseDown={handleDragStart}
                  >
                    <img
                      src={selectedDesign.imageUrl}
                      alt={selectedDesign.name}
                      className="w-24 h-24 object-contain pointer-events-none"
                    />
                  </div>
                  
                  {/* Indicateur de drag */}
                  {isDragging && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-2 border-blue-500 border-dashed" />
                  )}
                </div>
                
                {/* Bouton de validation */}
                <Button
                  onClick={handleValidateDesign}
                  disabled={!hasPosition}
                  className="w-full"
                >
                  <Package className="h-4 w-4 mr-2" />
                  {hasPosition ? 'Créer le produit' : 'Positionnez d\'abord le design'}
                </Button>
              </div>
              
              {/* Contrôles */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Échelle</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleScaleChange(Math.max(0.1, position.scale - 0.1))}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="min-w-16 text-center">{position.scale.toFixed(1)}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleScaleChange(Math.min(2, position.scale + 0.1))}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Rotation</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRotationChange(position.rotation - 15)}
                    >
                      <RotateCw className="h-4 w-4 transform rotate-180" />
                    </Button>
                    <span className="min-w-16 text-center">{position.rotation}°</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRotationChange(position.rotation + 15)}
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Position</label>
                  <div className="text-sm text-gray-600 mt-1">
                    X: {(position.x * 100).toFixed(0)}% | Y: {(position.y * 100).toFixed(0)}%
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Prévisualisation prix/stock</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <input
                      type="number"
                      placeholder="Prix (FCFA)"
                      value={previewSelections.price}
                      onChange={(e) => setPreviewSelections({
                        ...previewSelections,
                        price: parseInt(e.target.value) || 0
                      })}
                      className="px-2 py-1 border rounded text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Stock"
                      value={previewSelections.stock}
                      onChange={(e) => setPreviewSelections({
                        ...previewSelections,
                        stock: parseInt(e.target.value) || 0
                      })}
                      className="px-2 py-1 border rounded text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const resetPosition = { x: 0.5, y: 0.5, scale: 1, rotation: 0 };
                      setPosition(resetPosition);
                    }}
                    className="flex-1"
                  >
                    Réinitialiser
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => deletePosition()}
                    className="flex-1 text-red-500"
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Modal de création de produit */}
      <ProductCreationModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        vendorId={vendorId}
        baseProductId={baseProductId}
        designId={selectedDesign?.id || 0}
        adminProduct={adminProduct}
        designUrl={selectedDesign?.imageUrl || selectedDesign?.thumbnailUrl || ''}
        onProductCreated={(productId) => {
          console.log('✅ Produit créé:', productId);
          onProductCreated?.(productId);
          setShowProductModal(false);
        }}
      />
      
      {/* Modal de liste des brouillons */}
      {showDraftsList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Brouillons de design</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDraftsList(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <DraftsList
                onEditDraft={handleEditDraft}
                onCreateProductFromDraft={handleCreateProductFromDraft}
                onDeleteDraft={handleDeleteDraft}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDesignTransformationWorkflow; 