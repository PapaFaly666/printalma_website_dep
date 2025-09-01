import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { X, ImageIcon, RefreshCw, Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useVendorPublish } from '../../hooks/useVendorPublish';
import DesignPositionService from '../../services/DesignPositionService';

interface ProductCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: number;
  baseProductId: number;
  designId: number;
  adminProduct?: any;
  onProductCreated?: (productId: number) => void;
  designUrl?: string;
}

interface FormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  selectedColors: Array<{ id: number; name: string; colorCode: string }>;
  selectedSizes: Array<{ id: number; sizeName: string }>;
}

export const ProductCreationModal: React.FC<ProductCreationModalProps> = ({
  isOpen,
  onClose,
  vendorId,
  baseProductId,
  designId,
  adminProduct,
  onProductCreated,
  designUrl
}) => {
  const { createVendorProduct, loading, error } = useVendorPublish();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: 0,
    stock: 10,
    selectedColors: [],
    selectedSizes: []
  });

  // Récupérer la position sauvegardée
  const savedPosition = DesignPositionService.getPosition(designId, baseProductId, vendorId);

  useEffect(() => {
    if (adminProduct) {
      setFormData(prev => ({
        ...prev,
        name: adminProduct.name || '',
        description: adminProduct.description || '',
        price: adminProduct.price || 0,
        selectedColors: adminProduct.colorVariations?.slice(0, 3) || [],
        selectedSizes: adminProduct.sizes?.slice(0, 3) || []
      }));
    }
  }, [adminProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!savedPosition) {
      toast.error('Aucune position sauvegardée trouvée');
      return;
    }
    
    if (!formData.name.trim()) {
      toast.error('Le nom du produit est requis');
      return;
    }
    
    if (formData.selectedColors.length === 0) {
      toast.error('Veuillez sélectionner au moins une couleur');
      return;
    }
    
    if (formData.selectedSizes.length === 0) {
      toast.error('Veuillez sélectionner au moins une taille');
      return;
    }
    
    try {
      // ✅ STRUCTURE COMPLÈTE REQUISE SELON LA DOCUMENTATION
      const productData = {
        baseProductId: savedPosition.baseProductId,
        designId: savedPosition.designId,
        vendorName: formData.name,
        vendorDescription: formData.description,
        vendorPrice: formData.price,
        vendorStock: formData.stock,
        selectedColors: formData.selectedColors,
        selectedSizes: formData.selectedSizes,
        
        // 🎨 STRUCTURE ADMIN (OBLIGATOIRE)
        productStructure: {
          adminProduct: {
            id: baseProductId,
            name: adminProduct?.name || 'Produit Admin',
            description: adminProduct?.description || '',
            price: adminProduct?.price || 0,
            images: {
              colorVariations: adminProduct?.colorVariations || []
            },
            sizes: adminProduct?.sizes || []
          },
          designApplication: {
            positioning: 'CENTER' as const,
            scale: 0.6
          }
        },
        
        // 🆕 Position design depuis localStorage
        designPosition: savedPosition.position,
        
        // 🔧 OPTIONS
        forcedStatus: 'DRAFT' as const,
        postValidationAction: 'AUTO_PUBLISH' as const,
        bypassValidation: false
      };
      
      console.log('📦 Données produit:', productData);
      
      const result = await createVendorProduct(productData);
      
      if (result.success) {
        toast.success('Produit créé avec succès !');
        
        // Nettoyer le localStorage
        DesignPositionService.deletePosition(vendorId, baseProductId, designId);
        
        // Callback
        if (onProductCreated && result.productId) {
          onProductCreated(result.productId);
        }
        
        onClose();
      } else {
        toast.error(result.message || 'Erreur lors de la création du produit');
      }
      
    } catch (error) {
      console.error('❌ Erreur création produit:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la création du produit');
    }
  };
  
  const handleColorToggle = (color: { id: number; name: string; colorCode: string }) => {
    setFormData(prev => ({
      ...prev,
      selectedColors: prev.selectedColors.some(c => c.id === color.id)
        ? prev.selectedColors.filter(c => c.id !== color.id)
        : [...prev.selectedColors, color]
    }));
  };
  
  const handleSizeToggle = (size: { id: number; sizeName: string }) => {
    setFormData(prev => ({
      ...prev,
      selectedSizes: prev.selectedSizes.some(s => s.id === size.id)
        ? prev.selectedSizes.filter(s => s.id !== size.id)
        : [...prev.selectedSizes, size]
    }));
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Créer le produit</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Informations de position */}
          {savedPosition && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Position sauvegardée
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Position X</Label>
                    <p className="text-gray-600">{savedPosition.position.x.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label>Position Y</Label>
                    <p className="text-gray-600">{savedPosition.position.y.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label>Échelle</Label>
                    <p className="text-gray-600">{savedPosition.position.scale.toFixed(2)}</p>
                  </div>
                  <div>
                    <Label>Rotation</Label>
                    <p className="text-gray-600">{savedPosition.position.rotation}°</p>
                  </div>
                </div>
                <Badge variant="secondary" className="mt-2">
                  Sauvegardé le {new Date(savedPosition.timestamp).toLocaleString()}
                </Badge>
              </CardContent>
            </Card>
          )}
          
          {/* Erreur */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}
          
          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom et description */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="name">Nom du produit *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: T-shirt Dragon Bleu Premium"
                  required
                  disabled={loading}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description détaillée du produit..."
                  rows={3}
                  disabled={loading}
                />
              </div>
            </div>
            
            {/* Prix et stock */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Prix (FCFA) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                  min="0"
                  required
                  disabled={loading}
                />
              </div>
              
              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                  min="0"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            
            {/* Couleurs disponibles */}
            <div>
              <Label>Couleurs disponibles *</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {adminProduct?.colorVariations?.map((color: any) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => handleColorToggle(color)}
                    className={`flex items-center px-3 py-2 rounded-lg border ${
                      formData.selectedColors.some(c => c.id === color.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-white'
                    }`}
                    disabled={loading}
                  >
                    <div
                      className="w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: color.colorCode }}
                    />
                    <span className="text-sm">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Tailles disponibles */}
            <div>
              <Label>Tailles disponibles *</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {adminProduct?.sizes?.map((size: any) => (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => handleSizeToggle(size)}
                    className={`px-3 py-2 rounded-lg border ${
                      formData.selectedSizes.some(s => s.id === size.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-white'
                    }`}
                    disabled={loading}
                  >
                    <span className="text-sm">{size.sizeName}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Boutons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading || !savedPosition}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2" />
                    Créer le produit
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProductCreationModal; 