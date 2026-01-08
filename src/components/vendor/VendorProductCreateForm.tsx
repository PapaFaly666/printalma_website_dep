import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Package, DollarSign, FileText, Layers, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { PostValidationActionSelector } from '../PostValidationActionSelector';
import { DesignReuseNotification } from './DesignReuseNotification';
import { useVendorProductsWithDeduplication } from '../../hooks/useVendorProductsWithDeduplication';
import { PostValidationAction } from '../../types/cascadeValidation';
import { toast } from 'sonner';

interface VendorProductCreateFormProps {
  baseProduct?: {
    id: number;
    name: string;
    description: string;
    price: number;
  };
  onCancel?: () => void;
  onSuccess?: (productId: number) => void;
}

export const VendorProductCreateForm: React.FC<VendorProductCreateFormProps> = ({
  baseProduct,
  onCancel,
  onSuccess
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createProduct, loading } = useVendorProductsWithDeduplication();
  
  const [formData, setFormData] = useState({
    vendorName: '',
    vendorDescription: '',
    vendorPrice: 0,
    vendorStock: 100,
    selectedColors: [] as Array<{id: number, name: string, hexCode: string}>,
    selectedSizes: [] as Array<{id: number, name: string}>,
    designFile: null as string | null,
    postValidationAction: PostValidationAction.AUTO_PUBLISH
  });

  const [designPreview, setDesignPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [designReuseInfo, setDesignReuseInfo] = useState<{
    isReused: boolean;
    designId?: number;
  } | null>(null);

  const handleDesignUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setDesignPreview(result);
        setFormData(prev => ({
          ...prev,
          designFile: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.vendorName.trim()) {
      newErrors.vendorName = 'Le nom du produit est requis';
    }

    if (!formData.vendorDescription.trim()) {
      newErrors.vendorDescription = 'La description est requise';
    }

    if (formData.vendorPrice <= 0) {
      newErrors.vendorPrice = 'Le prix doit être supérieur à 0';
    }

    if (formData.vendorStock < 0) {
      newErrors.vendorStock = 'Le stock ne peut pas être négatif';
    }

    if (!formData.designFile) {
      newErrors.designFile = 'Un design doit être téléchargé';
    }

    if (!baseProduct) {
      newErrors.baseProduct = 'Un produit de base doit être sélectionné';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setSubmitting(true);
    
    try {
      const productData = {
        baseProductId: baseProduct!.id,
        vendorName: formData.vendorName,
        vendorDescription: formData.vendorDescription,
        vendorPrice: formData.vendorPrice * 100, // Convertir en centimes
        vendorStock: formData.vendorStock,
        selectedColors: formData.selectedColors,
        selectedSizes: formData.selectedSizes,
        finalImagesBase64: {
          design: formData.designFile!
        },
        postValidationAction: formData.postValidationAction,
        productStructure: {
          adminProduct: baseProduct,
          designApplication: {
            designBase64: formData.designFile!,
            positioning: 'CENTER',
            scale: 0.6
          }
        }
      };

      const result = await createProduct(productData);

      if (result.success) {
        // Afficher les informations de déduplication
        if (result.isDesignReused) {
          setDesignReuseInfo({
            isReused: true,
            designId: result.designId
          });
        }

        // Rediriger après succès
        if (onSuccess) {
          onSuccess(result.productId);
        } else {
          navigate('/vendor/products');
        }
      }
    } catch (error) {
      console.error('Erreur création produit:', error);
      toast.error('Erreur lors de la création du produit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      vendorName: '',
      vendorDescription: '',
      vendorPrice: 0,
      vendorStock: 100,
      selectedColors: [],
      selectedSizes: [],
      designFile: null,
      postValidationAction: PostValidationAction.AUTO_PUBLISH
    });
    setDesignPreview(null);
    setDesignReuseInfo(null);
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Notification de déduplication */}
      {designReuseInfo && (
        <DesignReuseNotification
          isReused={designReuseInfo.isReused}
          designId={designReuseInfo.designId}
          onClose={() => setDesignReuseInfo(null)}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Créer un nouveau produit
          </CardTitle>
          {baseProduct && (
            <p className="text-sm text-gray-600">
              Basé sur : <span className="font-medium">{baseProduct.name}</span>
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="vendorName">Nom du produit *</Label>
                <Input
                  id="vendorName"
                  value={formData.vendorName}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    vendorName: e.target.value 
                  }))}
                  placeholder="Mon super produit personnalisé"
                  className={errors.vendorName ? 'border-red-500' : ''}
                />
                {errors.vendorName && (
                  <p className="text-sm text-red-500">{errors.vendorName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendorPrice">Prix (€) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="vendorPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.vendorPrice}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      vendorPrice: parseFloat(e.target.value) || 0 
                    }))}
                    placeholder="29.99"
                    className={`pl-10 ${errors.vendorPrice ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.vendorPrice && (
                  <p className="text-sm text-red-500">{errors.vendorPrice}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="vendorDescription">Description du produit *</Label>
              <Textarea
                id="vendorDescription"
                value={formData.vendorDescription}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  vendorDescription: e.target.value 
                }))}
                placeholder="Décrivez votre produit personnalisé..."
                rows={4}
                className={errors.vendorDescription ? 'border-red-500' : ''}
              />
              {errors.vendorDescription && (
                <p className="text-sm text-red-500">{errors.vendorDescription}</p>
              )}
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <Label htmlFor="vendorStock">Stock disponible</Label>
              <Input
                id="vendorStock"
                type="number"
                min="0"
                value={formData.vendorStock}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  vendorStock: parseInt(e.target.value) || 0 
                }))}
                placeholder="100"
                className={errors.vendorStock ? 'border-red-500' : ''}
              />
              {errors.vendorStock && (
                <p className="text-sm text-red-500">{errors.vendorStock}</p>
              )}
            </div>

            {/* Action après validation */}
            <div className="space-y-2">
              <Label>Action après validation admin</Label>
              <PostValidationActionSelector
                value={formData.postValidationAction}
                onChange={(action) => setFormData(prev => ({
                  ...prev,
                  postValidationAction: action
                }))}
              />
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {formData.postValidationAction === PostValidationAction.AUTO_PUBLISH 
                    ? 'Votre produit sera publié automatiquement dès que l\'admin validera le design'
                    : 'Votre produit restera en brouillon après validation, vous pourrez le publier manuellement quand vous le souhaitez'
                  }
                </AlertDescription>
              </Alert>
            </div>

            {/* Information sur la publication des brouillons */}
            {formData.postValidationAction === PostValidationAction.TO_DRAFT && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <strong>💡 Astuce :</strong> Vous pourrez publier votre produit même s'il n'est pas encore validé par l'admin. 
                  Cependant, il est recommandé d'attendre la validation pour une meilleure qualité.
                </AlertDescription>
              </Alert>
            )}

            {/* Upload design */}
            <div className="space-y-2">
              <Label htmlFor="designFile">Design à appliquer *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  id="designFile"
                  type="file"
                  accept="image/*"
                  onChange={handleDesignUpload}
                  className="hidden"
                />
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-gray-400" />
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Sélectionner un fichier
                    </Button>
                    <p className="text-sm text-gray-500 mt-1">
                      PNG, JPG, SVG jusqu'à 5MB
                    </p>
                  </div>
                </div>
              </div>
              {errors.designFile && (
                <p className="text-sm text-red-500">{errors.designFile}</p>
              )}
              
              {designPreview && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Aperçu du design :</p>
                  <img 
                    src={designPreview} 
                    alt="Aperçu du design" 
                    className="max-w-xs max-h-48 object-contain border rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel || (() => navigate('/vendor/products'))}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={submitting}
              >
                Réinitialiser
              </Button>
              <Button
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Création...' : 'Créer le produit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}; 
 
 
 
 
 