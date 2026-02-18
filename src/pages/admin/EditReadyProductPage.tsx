import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Save, 
  RotateCcw, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  Image as ImageIcon,
  Download,
  Layers,
  Copy,
  Package,
  Palette,
  Tag,
  ArrowLeft,
  ArrowRight,
  Edit
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { ProductFormFields } from '../../components/product-form/ProductFormFields';
import { ColorVariationsPanel } from '../../components/product-form/ColorVariationsPanel';
import { CategoriesAndSizesPanel } from '../../components/product-form/CategoriesAndSizesPanel';
import { ProductImage } from '../../types/product';
import { toast } from 'sonner';
import { apiGet, apiPatchFormData, is404Error } from '../../utils/apiHelpers';
import { useCategories } from '../../contexts/CategoryContext';

// Types pour les produits prêts
interface ReadyProductImage {
  id: number;
  view: string;
  url: string;
  publicId: string;
  naturalWidth: number | null;
  naturalHeight: number | null;
  colorVariationId: number;
  delimitations: any[];
  customDesign: any;
}

interface ReadyColorVariation {
  id: number;
  name: string;
  colorCode: string;
  productId: number;
  images: ReadyProductImage[];
}

interface ReadyProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
  status: 'DRAFT' | 'PUBLISHED';
  description: string;
  // 🆕 Prix par taille
  useGlobalPricing?: boolean;
  globalCostPrice?: number;
  globalSuggestedPrice?: number;
  sizePrices?: Array<{
    size: string;
    costPrice: number;
    suggestedPrice: number;
  }>;
  createdAt: string;
  updatedAt: string;
  isValidated: boolean;
  validatedAt: string | null;
  validatedBy: string | null;
  rejectionReason: string | null;
  submittedForValidationAt: string | null;
  isDelete: boolean;
  isReadyProduct: boolean;
  hasCustomDesigns: boolean;
  designsMetadata: {
    totalDesigns: number;
    lastUpdated: string | null;
  };

  // ✅ NEW: FK-based category system
  categoryId?: number | null;
  subCategoryId?: number | null;
  variationId?: number | null;
  category?: {
    id: number;
    name: string;
    level: number;
  } | null;
  subCategory?: {
    id: number;
    name: string;
    level: number;
  } | null;
  variation?: {
    id: number;
    name: string;
    level: number;
  } | null;

  sizes: Array<{
    id: number;
    productId: number;
    sizeName: string;
  }>;
  colorVariations: ReadyColorVariation[];
}

const EditReadyProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { categories: availableCategories } = useCategories();
  
  // États du formulaire
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [originalProduct, setOriginalProduct] = useState<ReadyProduct | null>(null);
  const [newImages, setNewImages] = useState<Map<string, File>>(new Map());
  const [removedImages, setRemovedImages] = useState<Set<string>>(new Set());

  // Données du formulaire
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    status: 'draft' as 'draft' | 'published',
    // ✅ NEW: FK-based category fields
    categoryId: null as number | null,
    subCategoryId: null as number | null,
    variationId: null as number | null,
    categories: [] as string[], // ✅ AJOUTÉ: Champ obligatoire pour ProductFormData
    sizes: [] as string[],
    colorVariations: [] as any[],
    // 🆕 Prix par taille
    useGlobalPricing: false,
    globalCostPrice: 0,
    globalSuggestedPrice: 0,
    sizePricing: [] as any[]
  });

  // Étapes du formulaire (sans délimitations)
  const steps = [
    { id: 1, title: 'Informations', icon: Package },
    { id: 2, title: 'Couleurs', icon: Palette },
    { id: 3, title: 'Catégories', icon: Tag },
    { id: 4, title: 'Validation', icon: CheckCircle }
  ];

  // Charger le produit à modifier
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const result = await apiGet(`https://printalma-back-dep.onrender.com/products/${id}`);
        
        if (result.error) {
          if (is404Error(result.error)) {
            toast.error('Produit prêt non trouvé');
            navigate('/admin/ready-products');
          } else {
            toast.error(result.error);
          }
          return;
        }

        // Vérifier que c'est bien un produit prêt
        if (!result.data?.isReadyProduct) {
          toast.error('Ce produit n\'est pas un produit prêt');
          navigate('/admin/ready-products');
          return;
        }

        const product = result.data;
        setOriginalProduct(product);

        // Préparer les données du formulaire
        setFormData({
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          status: product.status.toLowerCase() as 'draft' | 'published',
          // ✅ NEW: Use FK-based category fields
          categoryId: product.categoryId || null,
          subCategoryId: product.subCategoryId || null,
          variationId: product.variationId || null,
          categories: [], // ✅ AJOUTÉ: Initialisé vide pour les produits prêts
          sizes: product.sizes.map(size => size.sizeName),
          colorVariations: product.colorVariations.map(variation => ({
            id: variation.id,
            name: variation.name,
            colorCode: variation.colorCode,
            images: variation.images.map(img => ({
              id: img.id,
              url: img.url,
              view: img.view,
              naturalWidth: img.naturalWidth || 0,
              naturalHeight: img.naturalHeight || 0,
              colorVariationId: img.colorVariationId,
              delimitations: []
            }))
          })),
          // 🆕 Prix par taille
          useGlobalPricing: product.useGlobalPricing || false,
          globalCostPrice: product.globalCostPrice || 0,
          globalSuggestedPrice: product.globalSuggestedPrice || 0,
          sizePricing: product.sizePrices?.map((sp: any) => ({
            size: sp.size,
            costPrice: sp.costPrice,
            suggestedPrice: sp.suggestedPrice
          })) || []
        });

      } catch (error: any) {
        console.error('Erreur:', error);
        toast.error(error.message || 'Erreur lors du chargement du produit');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  // Statistiques du formulaire
  const formStats = React.useMemo(() => {
    const totalImages = formData.colorVariations.reduce((total, color) => total + color.images.length, 0);
    const totalColorVariations = formData.colorVariations.length;
    // ✅ NEW: Count category selection (at least categoryId required)
    const hasCategory = formData.categoryId !== null;

    const errors: string[] = [];

    if (!formData.name.trim()) errors.push('Nom du produit requis');
    if (!formData.description.trim()) errors.push('Description requise');
    // Prix retiré - validation déplacée vers sizePricing (géré dans CategoriesAndSizesPanel)
    // ✅ NEW: Validate FK-based category
    if (!formData.categoryId) errors.push('Au moins une catégorie requise');
    if (formData.colorVariations.length === 0) errors.push('Au moins une variation de couleur requise');

    // Vérifier que chaque variation a au moins une image
    formData.colorVariations.forEach((color, index) => {
      if (!color.name.trim()) errors.push(`Variation ${index + 1}: nom requis`);
      if (color.images.length === 0) errors.push(`Variation ${index + 1}: au moins une image requise`);
    });

    return {
      totalImages,
      totalColorVariations,
      hasCategory,
      errors,
      isComplete: errors.length === 0
    };
  }, [formData]);

  // Mise à jour des données du formulaire
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Gestion des variations de couleur
  const addColorVariation = () => {
    const colorId = `color_${Date.now()}`;
    setFormData(prev => ({
      ...prev,
      colorVariations: [
        ...prev.colorVariations,
        {
          id: colorId,
          name: '',
          colorCode: '#000000',
          images: []
        }
      ]
    }));
    return colorId;
  };

  const updateColorVariation = (colorId: string, updates: Partial<any>) => {
    setFormData(prev => ({
      ...prev,
      colorVariations: prev.colorVariations.map(color =>
        color.id === colorId ? { ...color, ...updates } : color
      )
    }));
  };

  const removeColorVariation = (colorId: string) => {
    setFormData(prev => ({
      ...prev,
      colorVariations: prev.colorVariations.filter(color => color.id !== colorId)
    }));
  };

  // Gestion des images
  const handleAddImageToColor = async (colorId: string, file: File, colorName?: string, colorCode?: string): Promise<string> => {
    const imageId = `img_${Date.now()}`;
    const imageUrl = URL.createObjectURL(file);
    
    const newImage: ProductImage = {
      id: imageId,
      url: imageUrl,
      view: 'Front',
      // naturalWidth: 0,
      // naturalHeight: 0,
      // colorVariationId: colorId,
      delimitations: []
    };

    setFormData(prev => ({
      ...prev,
      colorVariations: prev.colorVariations.map(color =>
        color.id === colorId
          ? {
              ...color,
              name: colorName || color.name,
              colorCode: colorCode || color.colorCode,
              images: [...color.images, newImage]
            }
          : color
      )
    }));

    // ✅ Ajouter à la liste des nouvelles images
    const key = `${colorId}-${imageId}`;
    setNewImages(prev => new Map(prev.set(key, file)));

    return imageId;
  };

  const updateImage = (colorId: string, imageId: string, updates: Partial<any>) => {
    setFormData(prev => ({
      ...prev,
      colorVariations: prev.colorVariations.map(color =>
        color.id === colorId
          ? {
              ...color,
              images: color.images.map(img =>
                img.id === imageId ? { ...img, ...updates } : img
              )
            }
          : color
      )
    }));
  };

  const handleReplaceImage = async (colorId: string, imageId: string, file: File): Promise<void> => {
    const newImageUrl = URL.createObjectURL(file);
    
    setFormData(prev => ({
      ...prev,
      colorVariations: prev.colorVariations.map(color =>
        color.id === colorId
          ? {
              ...color,
              images: color.images.map(img =>
                img.id === imageId ? { ...img, url: newImageUrl } : img
              )
            }
          : color
      )
    }));

    // ✅ Ajouter à la liste des nouvelles images
    const key = `${colorId}-${imageId}`;
    setNewImages(prev => new Map(prev.set(key, file)));
  };

  // ✅ Fonction pour supprimer des images
  const handleRemoveImage = (colorId: string, imageId: string): void => {
    const key = `${colorId}-${imageId}`;
    
    // Ajouter à la liste des images supprimées
    setRemovedImages(prev => new Set([...prev, key]));
    
    // Supprimer de la liste des nouvelles images si présente
    setNewImages(prev => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  };

  // Validation des étapes
  const validateStep = (step: number): string[] => {
    const stepErrors: string[] = [];
    
    switch (step) {
      case 1:
        if (!formData.name.trim()) stepErrors.push('Nom du produit requis');
        if (!formData.description.trim()) stepErrors.push('Description requise');
        // Prix retiré - validation déplacée vers sizePricing (géré dans CategoriesAndSizesPanel)
        break;
      
      case 2:
        if (formData.colorVariations.length === 0) {
          stepErrors.push('Au moins une variation de couleur requise');
        } else {
          formData.colorVariations.forEach((color, index) => {
            if (!color.name.trim()) stepErrors.push(`Variation ${index + 1}: nom requis`);
            if (color.images.length === 0) stepErrors.push(`Variation ${index + 1}: au moins une image requise`);
          });
        }
        break;
      
      case 3:
        // ✅ NEW: Validate FK-based category
        if (!formData.categoryId) stepErrors.push('Au moins une catégorie requise');
        break;
    }
    
    return stepErrors;
  };

  // Navigation
  const nextStep = () => {
    const stepErrors = validateStep(currentStep);
    if (stepErrors.length > 0) {
      stepErrors.forEach(error => toast.error(error));
      return;
    }
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Sauvegarder les modifications
  const handleSave = async () => {
    if (!formStats.isComplete) {
      formStats.errors.forEach(error => toast.error(error));
      return;
    }

    setSaving(true);
    try {
      // Préparer les données du produit selon la documentation
      const productData = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        stock: formData.stock,
        status: formData.status.toLowerCase(), // Garder en minuscules pour la cohérence
        // ✅ NEW: Use FK-based category fields
        categoryId: formData.categoryId,
        subCategoryId: formData.subCategoryId,
        variationId: formData.variationId,
        sizes: formData.sizes,
        isReadyProduct: true, // Toujours true pour les produits prêts
        // 🆕 Prix par taille
        useGlobalPricing: formData.useGlobalPricing || false,
        globalCostPrice: formData.globalCostPrice || 0,
        globalSuggestedPrice: formData.globalSuggestedPrice || 0,
        sizePricing: formData.sizePricing || [],
        colorVariations: formData.colorVariations.map(variation => ({
          name: variation.name,
          colorCode: variation.colorCode,
          images: variation.images
            .filter(img => !removedImages.has(`${variation.id}-${img.id}`)) // Filtrer les images supprimées
            .map(img => {
              // ✅ CORRECTION : Gérer les différents types d'images selon la documentation
              if (newImages.has(`${variation.id}-${img.id}`)) {
                // Nouvelle image avec fichier
                return {
                  fileId: `${variation.id}-${img.id}`, // fileId pour correspondre au fichier
                  view: img.view
                };
              } else if (img.url && img.url.startsWith('http')) {
                // Image existante avec URL
                return {
                  url: img.url,
                  view: img.view,
                  naturalWidth: img.naturalWidth,
                  naturalHeight: img.naturalHeight
                };
              } else if (img.id && typeof img.id === 'number') {
                // Image existante avec ID de base de données
                return {
                  id: img.id,
                  view: img.view
                };
              } else {
                // Image temporaire (ignorée)
                console.warn(`Image temporaire ignorée: ${img.id}`);
                return null;
              }
            })
            .filter(img => img !== null) // Filtrer les images null
        }))
      };

      // Créer FormData selon la documentation
      const formDataToSend = new FormData();
      formDataToSend.append('productData', JSON.stringify(productData));

      // Ajouter les nouvelles images
      newImages.forEach((file, key) => {
        formDataToSend.append(`file_${key}`, file);
      });

      // Log pour déboguer
      console.log('🔍 Données envoyées pour modification:', productData);
      console.log('🔍 ID du produit:', id);
      console.log('🔍 Endpoint utilisé: /products/ready/' + id);
      console.log('📁 Fichiers à uploader:', Array.from(newImages.keys()));

      // Utiliser le bon endpoint selon la documentation
      const result = await apiPatchFormData(`https://printalma-back-dep.onrender.com/products/ready/${id}`, formDataToSend);

      if (result.error) {
        console.error('❌ Erreur de modification:', result.error);
        toast.error(result.error);
        return;
      }

      console.log('✅ Modification réussie:', result);
      toast.success('Produit prêt modifié avec succès');
      navigate('/admin/ready-products');
    } catch (error: any) {
      console.error('❌ Exception lors de la modification:', error);
      toast.error(error.message || 'Erreur lors de la modification du produit');
    } finally {
      setSaving(false);
    }
  };

  // Réinitialisation
  const handleReset = () => {
    if (originalProduct) {
      setFormData({
        name: originalProduct.name,
        description: originalProduct.description,
        price: originalProduct.price,
        stock: originalProduct.stock,
        status: originalProduct.status.toLowerCase() as 'draft' | 'published',
        // ✅ NEW: Reset FK-based category fields
        categoryId: originalProduct.categoryId || null,
        subCategoryId: originalProduct.subCategoryId || null,
        variationId: originalProduct.variationId || null,
        categories: [], // ✅ AJOUTÉ: Réinitialisé vide
        sizes: originalProduct.sizes.map(size => size.sizeName),
        colorVariations: originalProduct.colorVariations.map(variation => ({
          id: variation.id,
          name: variation.name,
          colorCode: variation.colorCode,
          images: variation.images.map(img => ({
            id: img.id,
            url: img.url,
            view: img.view,
            naturalWidth: img.naturalWidth || 0,
            naturalHeight: img.naturalHeight || 0,
            colorVariationId: img.colorVariationId,
            delimitations: []
          }))
        })),
        // 🆕 Prix par taille
        useGlobalPricing: originalProduct.useGlobalPricing || false,
        globalCostPrice: originalProduct.globalCostPrice || 0,
        globalSuggestedPrice: originalProduct.globalSuggestedPrice || 0,
        sizePricing: originalProduct.sizePrices?.map((sp: any) => ({
          size: sp.size,
          costPrice: sp.costPrice,
          suggestedPrice: sp.suggestedPrice
        })) || []
      });
      setCurrentStep(1);
      setErrors({});
      toast.success('Formulaire réinitialisé');
    }
  };

  // Prévisualisation
  const handlePreview = () => {
    setShowPreview(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du produit...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!originalProduct) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600">Produit non trouvé</p>
            <Button onClick={() => navigate('/admin/ready-products')} className="mt-4">
              Retour à la liste
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Rendu du contenu selon l'étape
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Informations de base
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductFormFields
                formData={{...formData, designs: []}}
                errors={errors}
                onUpdate={updateFormData}
              />
            </CardContent>
          </Card>
        );
      
      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Variations de couleur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ColorVariationsPanel
                colorVariations={formData.colorVariations}
                onAddColorVariation={addColorVariation}
                onUpdateColorVariation={updateColorVariation}
                onRemoveColorVariation={removeColorVariation}
                onAddImageToColor={handleAddImageToColor}
                onUpdateImage={updateImage}
                onReplaceImage={handleReplaceImage}
              />
            </CardContent>
          </Card>
        );
      
      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Catégories et tailles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CategoriesAndSizesPanel
                categories={formData.categories}
                sizes={formData.sizes}
                sizePricing={formData.sizePricing}
                useGlobalPricing={formData.useGlobalPricing}
                globalCostPrice={formData.globalCostPrice}
                globalSuggestedPrice={formData.globalSuggestedPrice}
                onCategoriesUpdate={(categories: string[]) => updateFormData('categories', categories)}
                onSizesUpdate={(sizes: string[]) => updateFormData('sizes', sizes)}
                onSizePricingUpdate={(pricing) => updateFormData('sizePricing', pricing)}
              />
            </CardContent>
          </Card>
        );
      
      case 4:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Validation finale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{formStats.totalImages}</div>
                      <div className="text-sm text-gray-600">Images</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{formStats.totalColorVariations}</div>
                      <div className="text-sm text-gray-600">Couleurs</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{formStats.hasCategory ? '✓' : '✗'}</div>
                      <div className="text-sm text-gray-600">Catégorie</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Statut de validation :</h4>
                    <div className="space-y-2">
                      {formStats.errors.map((error: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">{error}</span>
                        </div>
                      ))}
                      {formStats.errors.length === 0 && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Formulaire valide</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={!formStats.isComplete}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                Prévisualiser
              </Button>

              <Button
                onClick={handleSave}
                disabled={saving || !formStats.isComplete}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder les modifications
                  </>
                )}
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête moderne */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="display-title text-shimmer mb-2">
                ✏️ Modifier le produit prêt
              </h1>
              <p className="text-readable">
                Modifier les informations du produit prêt : {originalProduct.name}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleReset}
                className="border-gray-300 dark:border-gray-600"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/admin/ready-products')}
                className="border-gray-300 dark:border-gray-600"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Indicateur d'étapes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                    ${isActive 
                      ? 'border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900' 
                      : isCompleted 
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-800'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Contenu de l'étape */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="mb-8"
        >
          {renderStepContent()}
        </motion.div>

        {/* Navigation */}
        {currentStep < 4 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between"
          >
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1 || saving}
              className="border-gray-300 dark:border-gray-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>

            <Button
              onClick={nextStep}
              disabled={saving}
              className="bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900"
            >
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        )}
      </div>

      {/* Modal de prévisualisation */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <Eye className="h-6 w-6" />
              Prévisualisation : {formData.name || 'Produit sans nom'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div>
                <h4 className="product-title mb-2">Nom</h4>
                <p className="product-description">{formData.name || 'Non défini'}</p>
              </div>
              <div>
                <h4 className="product-title mb-2">Prix</h4>
                <p className="product-price">{formData.price ? `${formData.price} FCFA` : 'Non défini'}</p>
              </div>
              <div>
                <h4 className="product-title mb-2">Catégorie</h4>
                <p className="product-description">
                  {formData.categoryId ? `ID: ${formData.categoryId}` : 'Aucune'}
                  {formData.subCategoryId && ` → Sous-catégorie: ${formData.subCategoryId}`}
                  {formData.variationId && ` → Variation: ${formData.variationId}`}
                </p>
              </div>
            </div>

            {formData.colorVariations.length > 0 ? (
              <div className="space-y-6">
                <h3 className="subsection-title flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Variations de couleur (produit prêt)
                </h3>
                
                {formData.colorVariations.map((color) => (
                  <div key={color.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-gray-800">
                    <div className="flex items-center gap-3 mb-6">
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"
                        style={{ backgroundColor: color.colorCode }}
                      />
                      <h4 className="product-title">{color.name}</h4>
                      <div className="badge-modern badge-size">
                        {color.images.length} image{color.images.length > 1 ? 's' : ''}
                      </div>
                    </div>
                    
                    {color.images.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {color.images.map((image, imageIndex) => (
                          <div key={image.id} className="relative group">
                            <div className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                              <img
                                src={image.url}
                                alt={`${color.name} - Image ${imageIndex + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="product-description">Aucune image pour cette couleur</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="subsection-title mb-2">Aucune variation de couleur</h3>
                <p className="product-description">Aucune variation de couleur définie pour ce produit</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditReadyProductPage; 