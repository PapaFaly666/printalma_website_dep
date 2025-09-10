import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useProductForm } from '../../hooks/useProductForm';
import { ProductFormFields } from './ProductFormFields';
import { ColorVariationsPanel } from './ColorVariationsPanel';
import { CategoriesAndSizesPanel } from './CategoriesAndSizesPanel';
import { DelimitationCanvas, DelimitationCanvasHandle } from './DelimitationCanvas';
import { DesignUploadInterface } from './DesignUploadInterface';
import { DelimitationDuplicator } from './DelimitationDuplicator';
import { ProductImage, Delimitation } from '../../types/product';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useCategories } from '../../contexts/CategoryContext';
import { ProductService } from '../../services/productService';

// 🔧 Configuration backend centralisée (basée sur per.md) - Compatible tous environnements
const getBackendUrl = () => {
  try {
    // Essai Vite
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL;
    }
    // Essai Create React App (si applicable)
    if (typeof process !== 'undefined' && process.env) {
      return process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL;
    }
    // Essai window global (si défini manuellement)
    if (typeof window !== 'undefined' && (window as any).BACKEND_URL) {
      return (window as any).BACKEND_URL;
    }
  } catch (e) {
    console.log('⚠️ Erreur récupération variable environnement:', e);
  }
  // Fallback par défaut
  return 'https://printalma-back-dep.onrender.com';
};

const BACKEND_URL = getBackendUrl();

// 🔧 Log de vérification au chargement (per.md recommandé)
console.log('🚀 [ProductFormMain] Backend URL configurée:', BACKEND_URL);

// 🧪 Fonction de test de connexion backend (per.md recommandé)
async function testBackendConnection() {
  try {
    console.log('🧪 Test de connexion backend...');
    console.log('🔧 Backend URL configuré:', BACKEND_URL);
    
    // Test simple GET
    const response = await fetch(`${BACKEND_URL}/products/1`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend connecté');
      console.log('📖 Produit test:', {
        id: data.id,
        name: data.name,
        suggestedPrice: data.suggestedPrice
      });
      return true;
    } else {
      console.log('❌ Erreur backend:', response.status);
      return false;
    }
  } catch (error) {
    console.log('💥 Erreur de connexion:', error.message);
    return false;
  }
}

// Composants d'étapes
const BasicInfoStep: React.FC<{
  formData: any;
  errors: any;
  onUpdate: (field: any, value: any) => void;
}> = ({ formData, errors, onUpdate }) => {
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
          formData={formData}
          errors={errors}
          onUpdate={onUpdate}
        />
      </CardContent>
    </Card>
  );
};

const ColorVariationsStep: React.FC<{
  colorVariations: any[];
  onAddColorVariation: () => string;
  onUpdateColorVariation: (colorId: string, updates: Partial<any>) => void;
  onRemoveColorVariation: (id: string) => void;
  onAddImageToColor: (colorId: string, file: File, colorName?: string, colorCode?: string) => Promise<string>;
  onUpdateImage: (colorId: string, imageId: string, updates: Partial<any>) => void;
  onReplaceImage: (colorId: string, imageId: string, file: File) => Promise<void>;
  onSuggestedPriceChange: (price: number) => void;
}> = ({ 
  colorVariations, 
  onAddColorVariation, 
  onUpdateColorVariation, 
  onRemoveColorVariation, 
  onAddImageToColor, 
  onUpdateImage,
  onReplaceImage,
  onSuggestedPriceChange
}) => {
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
          colorVariations={colorVariations}
          onAddColorVariation={onAddColorVariation}
          onUpdateColorVariation={onUpdateColorVariation}
          onRemoveColorVariation={onRemoveColorVariation}
          onAddImageToColor={onAddImageToColor}
          onUpdateImage={onUpdateImage}
          onReplaceImage={onReplaceImage}
          onSuggestedPriceChange={onSuggestedPriceChange}
        />
      </CardContent>
    </Card>
  );
};

const CategoriesStep: React.FC<{
  categories: string[];
  sizes: string[];
  onCategoriesUpdate: (categories: string[]) => void;
  onSizesUpdate: (sizes: string[]) => void;
}> = ({ categories, sizes, onCategoriesUpdate, onSizesUpdate }) => {
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
          categories={categories}
          sizes={sizes}
          onCategoriesUpdate={onCategoriesUpdate}
          onSizesUpdate={onSizesUpdate}
        />
      </CardContent>
    </Card>
  );
};

const DelimitationsStep: React.FC<{
  colorVariations: any[];
  designsByImageId: Record<string, string>;
  canvasRefs: React.MutableRefObject<Record<string, DelimitationCanvasHandle | null>>;
  onDelimitationUpdate: (colorVariations: any[]) => void;
  onDesignUpload: (imageId: string, file: File) => void;
  onDesignReplace: (imageId: string, file: File) => void;
  onDesignRemove: (imageId: string) => void;
  onOpenDuplicator: (image: ProductImage, colorName: string) => void;
  onExportFinalImage: (imageId: string) => void;
}> = ({ 
  colorVariations, 
  designsByImageId, 
  canvasRefs, 
  onDelimitationUpdate, 
  onDesignUpload, 
  onDesignReplace, 
  onDesignRemove, 
  onOpenDuplicator, 
  onExportFinalImage
}) => {
  const getDesignForImage = (imageId: string) => designsByImageId[imageId] || null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Images et zones de personnalisation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {colorVariations.length > 0 ? (
          colorVariations.map((color) => (
            <div key={color.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: color.colorCode }}
                />
                <h4 className="font-semibold">{color.name}</h4>
                <Badge variant="secondary">
                  {color.images.length} image{color.images.length > 1 ? 's' : ''}
                </Badge>
              </div>
              
              {color.images.length > 0 ? (
                <div className="space-y-6">
                  {color.images.map((image: ProductImage, imageIndex: number) => {
                    const currentDesign = getDesignForImage(image.id);
                    const hasDelimitations = image.delimitations && image.delimitations.length > 0;
                    
                    return (
                      <div key={image.id} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">Image {imageIndex + 1}</span>
                            {hasDelimitations && (
                              <Badge variant="outline">
                                {image.delimitations!.length} zone{image.delimitations!.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          
                          {hasDelimitations && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onOpenDuplicator(image, color.name)}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Dupliquer
                            </Button>
                          )}
                        </div>
                        
                        <DelimitationCanvas
                          ref={(el) => {
                            canvasRefs.current[image.id] = el;
                          }}
                          imageUrl={image.url}
                          designImageUrl={currentDesign || undefined}
                          existingDelimitations={image.delimitations || []}
                          onSave={(delimitations) => {
                            const updatedVariations = colorVariations.map(colorVar => ({
                              ...colorVar,
                              images: colorVar.images.map((img: any) => 
                                img.id === image.id 
                                  ? { ...img, delimitations }
                                  : img
                              )
                            }));
                            
                            onDelimitationUpdate(updatedVariations);
                            toast.success('Zone sauvegardée automatiquement');
                          }}
                          onCancel={() => {}}
                          className="min-h-[400px] border border-gray-200 dark:border-gray-700 rounded-lg"
                          integrated={true}
                        />

                        <DesignUploadInterface
                          currentDesignUrl={currentDesign || undefined}
                          onDesignUpload={(file) => onDesignUpload(image.id, file)}
                          onDesignReplace={(file) => onDesignReplace(image.id, file)}
                          onDesignRemove={() => onDesignRemove(image.id)}
                          onExport={() => onExportFinalImage(image.id)}
                          hasDelimitation={hasDelimitations || false}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Ajoutez des images pour cette couleur</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Palette className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune variation de couleur</h3>
            <p className="text-gray-500">
              Ajoutez des variations de couleur à l'étape précédente
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ValidationStep: React.FC<{
  formData: any;
  formStats: any;
  onSubmit: () => void;
  onPreview: () => void;
  loading: boolean;
}> = ({ formData, formStats, onSubmit, onPreview, loading }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Validation finale
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Résumé du produit */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formStats.completionPercentage}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Progression</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formStats.totalColors}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Couleurs</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formStats.totalImages}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Images</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formStats.totalDelimitations}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Zones</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={onPreview}
            disabled={!formStats.isComplete}
            className="px-8"
          >
            <Eye className="h-4 w-4 mr-2" />
            Prévisualiser
          </Button>
          
          <Button
            onClick={onSubmit}
            disabled={loading || !formStats.isComplete}
            className="bg-green-600 hover:bg-green-700 text-white px-8"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Validation...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Valider le produit
              </>
            )}
          </Button>
        </div>

        {/* Message d'aide */}
        {!formStats.isComplete && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Éléments manquants :
                </p>
                <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                  {!formData.name && <li>• Nom du produit</li>}
                  {formData.price <= 0 && <li>• Prix valide</li>}
                  {!formData.description && <li>• Description</li>}
                  {formData.colorVariations.length === 0 && <li>• Au moins une couleur</li>}
                  {formStats.totalImages === 0 && <li>• Au moins une image</li>}
                  {formStats.totalDelimitations === 0 && <li>• ⚠️ Au moins une zone de personnalisation (délimitation obligatoire)</li>}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface ProductFormMainProps {
  initialData?: any;
  mode?: 'edit' | 'create';
  productId?: string;
  onProductPatched?: (product: any) => void;
}

export const ProductFormMain: React.FC<ProductFormMainProps> = ({ initialData, mode = 'create', productId, onProductPatched }) => {
  const {
    formData,
    errors,
    loading,
    updateFormData,
    addColorVariation,
    updateColorVariation,
    removeColorVariation,
    addImageToColor,
    updateImage,
    submitForm,
    resetForm
  } = useProductForm();

  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { categories: allCategories } = useCategories();
  // Exemple de liste de tailles (à remplacer par la vraie source si dispo)
  const allSizes = [
    { id: 1, label: '500ml' },
    { id: 2, label: '250ml' },
    { id: 3, label: 'M' },
    { id: 4, label: 'L' },
    { id: 5, label: 'XL' },
    // ...
  ];

  function mapLabelsToIds(selectedLabels: string[], allOptions: { id: number, name?: string, label?: string, sizeName?: string }[]) {
    return selectedLabels
      .map(label => {
        const found = allOptions.find(opt => opt.name === label || opt.label === label || opt.sizeName === label);
        return found ? found.id : null;
      })
      .filter((id): id is number => id !== null);
  }
  // Pour les tailles : retourne l'id si trouvé, sinon le label (string)
  function mapLabelsToIdsOrString(selectedLabels: string[], allOptions: { id: number, name?: string, label?: string, sizeName?: string }[]) {
    return selectedLabels
      .map(label => {
        const found = allOptions.find(opt => opt.name === label || opt.label === label || opt.sizeName === label);
        return found ? found.id : label; // fallback string si pas trouvé
      })
      .filter(id => id !== null && id !== undefined);
  }

  // État pour les étapes
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImagesLoaded, setPreviewImagesLoaded] = useState<Set<string>>(new Set());
  
  // État pour gérer un design par image
  const [designsByImageId, setDesignsByImageId] = useState<Record<string, string>>({});
  
  // État pour le duplicateur de délimitations
  const [duplicatorState, setDuplicatorState] = useState<{
    isOpen: boolean;
    sourceImage: ProductImage | null;
    sourceColorName: string;
  }>({
    isOpen: false,
    sourceImage: null,
    sourceColorName: '',
  });
  
  // Créer un objet de refs pour chaque canvas
  const canvasRefs = useRef<Record<string, DelimitationCanvasHandle | null>>({});
  
  // Étapes du processus
  const steps = [
    { id: 1, title: 'Informations de base', icon: Package },
    { id: 2, title: 'Variations de couleur', icon: Palette },
    { id: 3, title: 'Catégories et tailles', icon: Tag },
    { id: 4, title: 'Images et délimitations', icon: Layers },
    { id: 5, title: 'Validation', icon: CheckCircle }
  ];
  
  // Helper functions pour les designs
  const getDesignForImage = (imageId: string) => designsByImageId[imageId] || null;
  
  const setDesignForImage = (imageId: string, designUrl: string | null) => {
    setDesignsByImageId(prev => {
      if (designUrl === null) {
        const { [imageId]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [imageId]: designUrl };
    });
  };

  const handleDesignUpload = (imageId: string, file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setDesignForImage(imageId, objectUrl);
  };

  const handleDesignReplace = (imageId: string, file: File) => {
    const oldUrl = getDesignForImage(imageId);
    if (oldUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(oldUrl);
    }
    
    const objectUrl = URL.createObjectURL(file);
    setDesignForImage(imageId, objectUrl);
  };

  const handleDesignRemove = (imageId: string) => {
    const oldUrl = getDesignForImage(imageId);
    if (oldUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(oldUrl);
    }
    
    setDesignForImage(imageId, null);
  };

  // Fonctions pour le duplicateur
  const handleOpenDuplicator = (sourceImage: ProductImage, sourceColorName: string) => {
    if (!sourceImage.delimitations || sourceImage.delimitations.length === 0) {
      toast.error('Cette image ne contient aucune délimitation à dupliquer');
      return;
    }

    setDuplicatorState({
      isOpen: true,
      sourceImage,
      sourceColorName,
    });
  };

  const handleCloseDuplicator = () => {
    setDuplicatorState({
      isOpen: false,
      sourceImage: null,
      sourceColorName: '',
    });
  };

  const handleDuplicateDelimitations = (targetImageIds: string[], delimitations: Delimitation[]) => {
    // 🧠 Gestion centralisée des délimitations par produit
    console.log('🔄 Duplication de délimitations avec gestion centralisée');
    
    // 1. Identifier les délimitations uniques par nom/type
    const uniqueDelimitations = new Map<string, Delimitation>();
    
    // Collecter toutes les délimitations existantes du produit
    formData.colorVariations.forEach(colorVar => {
      colorVar.images.forEach(img => {
        if (img.delimitations) {
          img.delimitations.forEach(delim => {
            // Utiliser le nom comme clé unique, ou l'ID si pas de nom
            const key = delim.name || `zone_${delim.id}`;
            if (!uniqueDelimitations.has(key)) {
              uniqueDelimitations.set(key, delim);
            }
          });
        }
      });
    });
    
    // 2. Ajouter les nouvelles délimitations (en évitant les doublons)
    delimitations.forEach(delim => {
      const key = delim.name || `zone_${delim.id}`;
      if (!uniqueDelimitations.has(key)) {
        uniqueDelimitations.set(key, delim);
        console.log(`✅ Nouvelle délimitation ajoutée: ${key}`);
      } else {
        console.log(`⚠️ Délimitation déjà existante, ignorée: ${key}`);
      }
    });
    
    // 3. Convertir en array et générer de nouveaux IDs uniques
    const allDelimitations = Array.from(uniqueDelimitations.values()).map((delim, index) => ({
      ...delim,
      id: `product_delim_${Date.now()}_${index}`,
      name: delim.name || `Zone ${index + 1}`
    }));
    
    console.log(`📊 Total délimitations uniques: ${allDelimitations.length}`);
    
    // 🧠 MODIFICATION : Ne garder que la délimitation la plus récente
    const latestDelimitation = allDelimitations.length > 0 ? [allDelimitations[allDelimitations.length - 1]] : [];
    
    // 4. Appliquer les délimitations à toutes les images du produit
    const updatedVariations = formData.colorVariations.map(colorVar => ({
      ...colorVar,
      images: colorVar.images.map(img => {
        // Appliquer seulement la délimitation la plus récente
        return {
          ...img,
          delimitations: [...latestDelimitation] // Copie pour chaque image
        };
      })
    }));

    updateFormData('colorVariations', updatedVariations);
    handleCloseDuplicator();
    
    toast.success(`✅ 1 zone synchronisée sur toutes les images du produit (dernière modification)`);
  };

  // Calculer les statistiques du formulaire
  const formStats = useMemo(() => {
    const totalImages = formData.colorVariations.reduce((total, color) => total + color.images.length, 0);
    const totalDelimitations = formData.colorVariations.reduce((total, color) => 
      total + color.images.reduce((imageTotal, image) => imageTotal + (image.delimitations?.length || 0), 0), 0
    );
    
    // 🧠 Validation complète incluant les délimitations obligatoires
    const hasBasicInfo = formData.name && formData.price > 0 && formData.description;
    const hasColors = formData.colorVariations.length > 0;
    const hasImages = totalImages > 0;
    const hasDelimitations = totalDelimitations > 0; // Délimitations obligatoires
    
    const isComplete = hasBasicInfo && hasColors && hasImages && hasDelimitations;

    return {
      totalImages,
      totalColors: formData.colorVariations.length,
      totalDelimitations,
      isComplete,
      completionPercentage: Math.round(
        ((formData.name ? 1 : 0) + 
         (formData.price > 0 ? 1 : 0) + 
         (formData.description ? 1 : 0) + 
         (formData.colorVariations.length > 0 ? 1 : 0) + 
         (totalImages > 0 ? 1 : 0) +
         (totalDelimitations > 0 ? 1 : 0)) * 16.67 // 6 éléments = 100% / 6
      )
    };
  }, [formData]);

  // Validation des étapes
  const validateStep = (step: number): string[] => {
    const errors: string[] = [];

    switch (step) {
      case 1:
        if (!formData.name.trim()) errors.push('Nom du produit requis');
        if (!formData.description.trim()) errors.push('Description requise');
        if (formData.price <= 0) errors.push('Prix invalide');
        if (formData.stock < 0) errors.push('Stock invalide');
        break;
      
      case 2:
        if (formData.colorVariations.length === 0) errors.push('Au moins une couleur requise');
        
        // Vérifier que toutes les couleurs ont un nom
        const colorsWithoutName = formData.colorVariations.filter((color: any) => 
          !color.name || !color.name.trim()
        );
        if (colorsWithoutName.length > 0) {
          errors.push(`${colorsWithoutName.length} couleur(s) sans nom. Le nom de la couleur est obligatoire.`);
        }
        break;
      
      case 3:
        if (formData.categories.length === 0) errors.push('Au moins une catégorie requise');
        if (formData.sizes.length === 0) errors.push('Au moins une taille requise');
        break;
      
      case 4:
        if (formStats.totalImages === 0) errors.push('Au moins une image requise');
        
        // 🧠 Validation obligatoire des délimitations pour les produits mockup admin
        const totalDelimitations = formData.colorVariations.reduce((total, color) => 
          total + color.images.reduce((imageTotal, image) => imageTotal + (image.delimitations?.length || 0), 0), 0
        );
        
        if (totalDelimitations === 0) {
          errors.push('⚠️ Délimitation obligatoire : Au moins une zone de personnalisation doit être définie pour ce produit mockup admin');
        }
        
        // Vérifier que chaque image a au moins une délimitation
        const imagesWithoutDelimitations = formData.colorVariations.flatMap(color => 
          color.images.filter(image => !image.delimitations || image.delimitations.length === 0)
        );
        
        if (imagesWithoutDelimitations.length > 0) {
          errors.push(`⚠️ ${imagesWithoutDelimitations.length} image(s) sans délimitation. Chaque image doit avoir au moins une zone de personnalisation.`);
        }
        break;
    }

    return errors;
  };

  // Navigation entre les étapes
  const nextStep = () => {
    const errors = validateStep(currentStep);
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
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

  // Ajoute un effet pour initialiser le formulaire si initialData change
  useEffect(() => {
    if (initialData) {
      // Réinitialise le formulaire puis applique les données initiales
      resetForm();
      Object.entries(initialData).forEach(([key, value]) => {
        updateFormData(key as keyof typeof formData, value as any);
      });
    }
    // eslint-disable-next-line
  }, [initialData]);

  // 🧪 Test de connexion backend au chargement du composant (per.md recommandé)
  useEffect(() => {
    console.log('🚀 [ProductFormMain] Initialisation du composant');
    console.log('🌐 Backend URL configurée:', BACKEND_URL);
    
    // Test de connexion différé pour ne pas bloquer le rendu
    const timer = setTimeout(async () => {
      const connected = await testBackendConnection();
      if (connected) {
        console.log('✅ [ProductFormMain] Backend disponible');
      } else {
        console.warn('⚠️ [ProductFormMain] Backend non disponible');
        toast.warning('⚠️ Backend non disponible - Vérifiez la connexion', { duration: 3000 });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getUpdatePayload = (formData: any, initialData: any) => {
  console.log('🔧 Début getUpdatePayload');
  console.log('🌐 URL backend configurée:', BACKEND_URL);
  
  // 🔍 Debug spécial pour suggestedPrice (recommandé per.md)
  console.log('💰 [DEBUG suggestedPrice] Valeur dans formData:', formData.suggestedPrice);
  console.log('💰 [DEBUG suggestedPrice] Type:', typeof formData.suggestedPrice);
  console.log('💰 [DEBUG suggestedPrice] Est null/undefined:', formData.suggestedPrice === null || formData.suggestedPrice === undefined);
  
  // Envoie tous les champs attendus, pas juste les modifiés
  const allowedFields = [
    'name', 'description', 'price', 'suggestedPrice', 'stock', 'status', 'categories', 'sizes', 'genre', 'colorVariations'
  ];
  const payload: any = {};
  for (const key of allowedFields) {
    if (key in formData) payload[key] = formData[key];
  }
  
  console.log('🔧 Payload base:', Object.keys(payload));
  
  // Normalisation catégories: envoyer des NOMS (strings) au backend
  try {
    if (payload.categories && Array.isArray(payload.categories)) {
      const categoriesAsNames = (payload.categories as any[]).map((c) => {
        if (typeof c === 'string') return c;
        if (typeof c === 'number') {
          const found = (allCategories as any[])?.find((opt) => opt.id === c);
          return found?.name ?? String(c);
        }
        return String(c);
      });
      payload.categories = categoriesAsNames;
      console.log('🔧 Categories normalisées (noms):', payload.categories);
    }
  } catch (error) {
    console.error('❌ Erreur normalisation categories:', error);
  }
  
  // ✅ Normalisation des tailles: toujours des strings, pas de mapping ID
  try {
    if (payload.sizes && Array.isArray(payload.sizes)) {
      const sizesAsStrings = payload.sizes.map((size: any) => (typeof size === 'string' ? size : String(size)));
      payload.sizes = sizesAsStrings;
      console.log('🔧 [SIZES] Sizes normalisées (strings):', payload.sizes);
    }
  } catch (error) {
    console.error('❌ Erreur normalisation sizes:', error);
  }
  
  // Force status en MAJUSCULES
  if (payload.status && typeof payload.status === 'string') {
    payload.status = payload.status.toUpperCase();
  }
  
  // ✅ Normaliser suggestedPrice avec logs détaillés (per.md recommandé)
  console.log('💰 [DEBUG suggestedPrice] Traitement en cours...');
  if (payload.suggestedPrice !== undefined && payload.suggestedPrice !== null) {
    console.log('💰 [DEBUG suggestedPrice] Valeur présente:', payload.suggestedPrice);
    const num = Number(payload.suggestedPrice);
    console.log('💰 [DEBUG suggestedPrice] Après Number():', num);
    console.log('💰 [DEBUG suggestedPrice] Number.isFinite():', Number.isFinite(num));
    
    if (Number.isFinite(num)) {
      payload.suggestedPrice = num;
      console.log('✅ [DEBUG suggestedPrice] Valeur normalisée:', payload.suggestedPrice);
    } else {
      console.log('⚠️ [DEBUG suggestedPrice] Valeur invalide, suppression du champ');
      delete payload.suggestedPrice;
    }
  } else {
    console.log('⚠️ [DEBUG suggestedPrice] Valeur null/undefined, pas de traitement');
  }

  // Normaliser genre et valeur par défaut
  if (payload.genre && typeof payload.genre === 'string') {
    const normalized = payload.genre.toUpperCase();
    const allowed = ['HOMME', 'FEMME', 'BEBE', 'UNISEXE'];
    payload.genre = allowed.includes(normalized) ? normalized : 'UNISEXE';
  }
  
  // Nettoyage des sous-objets pour correspondre au DTO backend - VERSION SÉCURISÉE
  if (payload.colorVariations && Array.isArray(payload.colorVariations)) {
    try {
      payload.colorVariations = payload.colorVariations.map((cv: any, cvIndex: number) => {
        console.log(`🔧 Traitement couleur ${cvIndex}:`, { id: cv.id, name: cv.name });
        
        // Nettoie les images de la couleur - PROTECTION CONTRE LES PROPRIÉTÉS MANQUANTES
        const images = (cv.images || []).map((img: any, imgIndex: number) => {
          console.log(`🔧 Traitement image ${imgIndex} de couleur ${cvIndex}:`, { id: img.id, url: img.url?.substring(0, 50) });
          
          // Créer un objet d'image nettoyé
          const cleanImage: any = {
            url: img.url,
            view: img.view || 'Front',
            delimitations: img.delimitations || []
          };
          
          // Ajouter l'ID seulement si c'est un ID valide de BD
          if (img.id && typeof img.id === 'number' && img.id < 2000000000) {
            cleanImage.id = img.id;
          }
          
          // Ajouter publicId si présent
          if (img.publicId) {
            cleanImage.publicId = img.publicId;
          }
          
          return cleanImage;
        });
        
        // Créer un objet couleur nettoyé
        const cleanColor: any = {
          name: cv.name,
          colorCode: cv.colorCode,
          images: images
        };
        
        // Ajouter l'ID seulement si c'est un ID valide de BD
        if (cv.id && typeof cv.id === 'number' && cv.id < 2000000000) {
          cleanColor.id = cv.id;
        }
        
        return cleanColor;
      });
    } catch (error) {
      console.error('❌ Erreur traitement colorVariations:', error);
      // En cas d'erreur, ne pas envoyer les colorVariations
      delete payload.colorVariations;
    }
  }
  
  console.log('🔧 Payload final keys:', Object.keys(payload));
  return payload;
};

  // Upload une image couleur locale sur le backend et retourne { url, publicId }
  async function uploadColorImage(productId: string, colorId: number, file: File) {
    console.log('📤 [UPLOAD] URL backend utilisée:', `${BACKEND_URL}/products/${productId}/colors/${colorId}/images`);
    
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${BACKEND_URL}/products/${productId}/colors/${colorId}/images`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        // Pas de Content-Type, géré par FormData
      },
      body: formData
    });
    
    console.log('📥 [UPLOAD] Response status:', res.status);
    if (!res.ok) throw new Error('Erreur upload image couleur');
    return await res.json(); // { url, publicId, ... }
  }

  // Prépare toutes les images pour le PATCH (upload les blobs, remplace dans le state)
  async function prepareImagesForPatch(product: any) {
    const productCopy = JSON.parse(JSON.stringify(product));
    for (const color of productCopy.colorVariations) {
      if (typeof color.id !== 'number') continue;
      for (const image of color.images) {
        // Gérer les images temporaires (mode création)
        if (image.isTemp && image.file) {
          console.log('🔄 Upload image temporaire pour couleur:', color.id);
          const uploadResult = await uploadColorImage(productCopy.id, color.id, image.file);
          image.url = uploadResult.url;
          image.publicId = uploadResult.publicId;
          delete image.file;
          delete image.isTemp;
        }
        // Gérer les images blob existantes (mode édition)
        else if (image.url && image.url.startsWith('blob:') && image.file) {
          console.log('🔄 Upload image blob pour couleur:', color.id);
          const uploadResult = await uploadColorImage(productCopy.id, color.id, image.file);
          image.url = uploadResult.url;
          image.publicId = uploadResult.publicId;
          delete image.file;
        }
      }
    }
    return productCopy;
  }

  // Fonction de debug locale pour vérifier le rôle utilisateur
  const handleDebugRole = async () => {
    console.log('🔍 [DEBUG LOCAL] Vérification du rôle utilisateur...');
    
    try {
      // Récupération des tokens disponibles
      const authToken = localStorage.getItem('authToken');
      const adminToken = (window as any).adminToken;
      const userString = localStorage.getItem('user');
      
      console.log('🔍 Informations de session:', {
        authTokenPresent: !!authToken,
        adminTokenPresent: !!adminToken,
        userDataPresent: !!userString,
        authTokenStart: authToken ? authToken.substring(0, 20) + '...' : 'N/A',
        adminTokenStart: adminToken ? adminToken.substring(0, 20) + '...' : 'N/A'
      });
      
      // Parse user data from localStorage
      let userData = null;
      if (userString) {
        try {
          userData = JSON.parse(userString);
          console.log('📋 Données utilisateur localStorage:', {
            id: userData.id,
            email: userData.email,
            role: userData.role,
            firstName: userData.firstName,
            lastName: userData.lastName
          });
        } catch (e) {
          console.log('❌ Erreur parsing userData:', e);
        }
      }
      
      // Test avec un appel simple pour vérifier l'authentification
      const token = authToken || adminToken || '';
      if (token) {
        console.log('🧪 Test de l\'authentification avec /products...');
        
        try {
          const testResponse = await fetch(`${BACKEND_URL}/products`, {
            method: 'GET',
            headers: {
              // 'Authorization': `Bearer ${token}`, // Removed: using cookies authentication
              'Content-Type': 'application/json'
            }
          });
          
          console.log('📡 Résultat test GET /products:', {
            status: testResponse.status,
            ok: testResponse.ok,
            statusText: testResponse.statusText
          });
          
          if (testResponse.ok) {
            console.log('✅ Authentification réussie');
            
            // Créer un objet de debug local
            const debugResult = {
              user: userData || {
                id: 'unknown',
                email: 'unknown',
                role: userData?.role || 'USER',
                firstName: 'Unknown',
                lastName: 'User'
              },
              debug: {
                isAdmin: ['ADMIN', 'SUPERADMIN'].includes(userData?.role),
                isSuperAdmin: userData?.role === 'SUPERADMIN',
                includesAdminCheck: ['ADMIN', 'SUPERADMIN'].includes(userData?.role),
                tokenValid: true,
                localTest: true
              }
            };
            
            toast.success(`✅ Rôle: ${debugResult.user.role}\nAutorisé: ${debugResult.debug.includesAdminCheck ? 'OUI' : 'NON'}`, {
              duration: 5000
            });
            
            return debugResult;
          } else {
            throw new Error(`Auth failed: ${testResponse.status}`);
          }
        } catch (authError) {
          console.log('❌ Erreur authentification:', authError);
          toast.error(`❌ Erreur auth: ${authError.message}`, { duration: 5000 });
          return null;
        }
      } else {
        console.log('❌ Aucun token disponible');
        toast.error('❌ Aucun token d\'authentification trouvé');
        return null;
      }
    } catch (error) {
      console.error('❌ Erreur debug local:', error);
      toast.error('Erreur lors de la vérification locale du rôle');
      return null;
    }
  };

  // ✅ Fonction de contournement avec ProductService (per.md recommandé)
  const handleForceSubmit = async () => {
    if (mode === 'edit' && productId) {
      console.log('🚨 CONTOURNEMENT D\'URGENCE - Force submission...');
      console.log('🌐 URL backend configurée:', BACKEND_URL);
      
      // Test de connexion backend préalable
      const connectionOk = await testBackendConnection();
      if (!connectionOk) {
        toast.error('❌ Impossible de joindre le backend');
        return;
      }
      
      try {
        const productReady = await prepareImagesForPatch(formData);
        const payload = getUpdatePayload(productReady, initialData);
        
        console.log('🚨 FORCE PATCH payload:', JSON.stringify(payload, null, 2));
        console.log('📤 [FORCE] URL utilisée:', `${BACKEND_URL}/products/${productId}`);
        
        // ✅ SOLUTION: Utiliser ProductService.updateProductSafe avec nettoyage automatique
        console.log('🔄 [FORCE] Utilisation de ProductService.updateProductSafe...');
        const result = await ProductService.updateProductSafe(parseInt(productId), payload);
        
        if (result.success) {
          console.log('✅ [FORCE] Succès ProductService:', result);
          if (onProductPatched && result.data) onProductPatched(result.data);
          toast.success('🚨 CONTOURNEMENT RÉUSSI - Produit modifié avec succès');
          navigate('/admin/products');
        } else {
          throw new Error(result.error || 'Erreur ProductService');
        }
      } catch (e: any) {
        console.error('🚨 FORCE - Erreur:', e);
        toast.error(`🚨 FORCE ERROR: ${e.message}`);
      }
    } else {
      toast.error('Mode de contournement disponible seulement en édition');
    }
  };

  // Remplace handleSubmit pour PATCH si mode === 'edit'
  const handleSubmit = async () => {
    if (mode === 'edit' && productId) {
      try {
        // 0. Vérifier les autorisations avec AuthContext
        console.log('🔐 Vérification des autorisations...');
        
        if (!isAuthenticated || !user) {
          console.log('❌ Utilisateur non authentifié');
          toast.error('❌ Vous devez être connecté pour effectuer cette action');
          return;
        }
        
        const allowedRoles = ['ADMIN', 'SUPERADMIN', 'VENDEUR'];
        const hasValidRole = allowedRoles.includes(user.role);
        
        if (!hasValidRole) {
          console.log('❌ Autorisation échouée:', { 
            userRole: user.role, 
            allowedRoles,
            hasValidRole 
          });
          toast.error(`❌ Autorisations insuffisantes. Votre rôle: ${user.role}`);
          return;
        }
        
        console.log('✅ Autorisation réussie:', {
          userId: user.id,
          userRole: user.role,
          userEmail: user.email,
          isAuthenticated: true
        });
        
        // ✅ VÉRIFICATION PRÉALABLE AVEC LE BACKEND
        console.log('🔍 Vérification des permissions côté serveur...');
        console.log('🌐 URL auth check:', `${BACKEND_URL}/auth/check`);
        
        const authResponse = await fetch(`${BACKEND_URL}/auth/check`, {
          credentials: 'include'
        });
        
        if (!authResponse.ok) {
          console.error('❌ Backend ne reconnaît pas l\'utilisateur comme authentifié');
          toast.error('Session expirée côté serveur. Veuillez vous reconnecter.');
          return;
        }
        
        const backendUserData = await authResponse.json();
        console.log('🔍 STRUCTURE COMPLÈTE de la réponse /auth/check:', backendUserData);
        console.log('🔍 Données utilisateur côté serveur:', {
          role: backendUserData.role,
          userRole: backendUserData.user?.role,
          id: backendUserData.id,
          userId: backendUserData.user?.id,
          permissions: backendUserData.permissions
        });
        
        const serverUserRole = backendUserData.user?.role;
        
        if (!['SUPERADMIN', 'ADMIN', 'VENDEUR'].includes(serverUserRole)) {
          console.error('❌ Rôle insuffisant côté serveur:', serverUserRole);
          toast.error(`Permissions insuffisantes. Rôle backend: ${serverUserRole || 'undefined'}`);
          return;
        }
        
        console.log('✅ Vérification serveur réussie pour rôle:', serverUserRole);
        
        // 1. Upload toutes les images locales (blob) avant le PATCH
        console.log('🔍 Utilisation de l\'authentification par cookies...');
        const productReady = await prepareImagesForPatch(formData);
        // 2. Prépare le payload PATCH (mapping déjà en place)
        console.log('🔍 FormData avant traitement:', JSON.stringify(productReady, null, 2));
        console.log('🔍 InitialData:', JSON.stringify(initialData, null, 2));
        const payload = getUpdatePayload(productReady, initialData);
        console.log('🚀 PATCH payload final:', JSON.stringify(payload, null, 2));
        
        // ✅ SOLUTION: Utiliser ProductService.updateProductSafe (per.md + solution sizes mixtes)
        console.log('🔄 Utilisation de ProductService.updateProductSafe...');
        console.log('🌐 Backend URL:', BACKEND_URL);
        
        const result = await ProductService.updateProductSafe(parseInt(productId), payload);
        
        if (result.success) {
          console.log('✅ Succès ProductService:', result);
          if (onProductPatched && result.data) onProductPatched(result.data);
          
          // 🧪 Test final recommandé par per.md
          console.log('🎉 Test final:');
          console.log('   - suggestedPrice sauvegardé:', result.data.suggestedPrice);
          console.log('   - genre sauvegardé:', result.data.genre);
          console.log('   - status sauvegardé:', result.data.status);
          console.log('   - sizes sauvegardées:', result.data.sizes);
          
          toast.success('Produit modifié avec succès');
          navigate('/admin/products');
        } else {
          console.error('❌ Erreur ProductService:', result.error);
          toast.error(result.error || 'Erreur lors de la sauvegarde');
          return;
        }
      } catch (e: any) {
        console.error(e);
        toast.error(e.message || 'Erreur lors de la sauvegarde');
      }
    } else {
      await submitForm();
    }
  };

  const handleReset = () => {
    // Nettoyer les URLs des designs
    Object.values(designsByImageId).forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    setDesignsByImageId({});
    
    // Nettoyer les URLs temporaires des images
    formData.colorVariations.forEach(color => {
      color.images.forEach((image: any) => {
        if (image.url && image.url.startsWith('blob:')) {
          URL.revokeObjectURL(image.url);
        }
      });
    });
    
    resetForm();
    setCurrentStep(1);
    toast.success('Formulaire réinitialisé');
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handlePreviewImageLoad = (imageId: string) => {
    setPreviewImagesLoaded(prev => new Set([...prev, imageId]));
  };

  // Reset preview images loaded when modal opens
  useEffect(() => {
    if (showPreview) {
      setPreviewImagesLoaded(new Set());
    }
  }, [showPreview]);

  const handleExportFinalImage = async (imageId: string) => {
    const canvasHandle = canvasRefs.current[imageId];
    if (canvasHandle) {
      const dataUrl = await canvasHandle.exportFinalImage();
      if (dataUrl) {
        const link = document.createElement('a');
        const colorName = formData.colorVariations.find(c => c.images.some(i => i.id === imageId))?.name || 'couleur';
        link.download = `${formData.name || 'produit'}-${colorName}-rendu-final.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  // Ajout d'image couleur admin (upload API si mode edit + productId)
  const handleAddImageToColor = async (colorId: string, file: File, colorName?: string, colorCode?: string): Promise<string> => {
    // ✅ Upload intelligent avec gestion automatique des IDs de couleur
    try {
      console.log(`🚀 [ProductFormMain] Upload intelligent image couleur ${colorId}...`);
      
      // ✅ Vérifier d'abord que le produit existe (seulement si on a un productId valide)
      const productIdForUpload = productId || '0';
      
      if (productIdForUpload !== '0') {
        // Mode édition avec productId valide
        try {
          const productResponse = await fetch(`${BACKEND_URL}/products/${productIdForUpload}`, {
            credentials: 'include'
          });
          
          if (!productResponse.ok) {
            throw new Error(`Produit ${productIdForUpload} non trouvé`);
          }
          
          const product = await productResponse.json();
          console.log('📋 Produit trouvé:', product);
          
          // ✅ Afficher toutes les variations de couleur disponibles
          console.log('🎨 Variations de couleur disponibles:', 
            product.colorVariations.map((cv: any) => ({
              id: cv.id,
              name: cv.name,
              colorCode: cv.colorCode
            }))
          );
          
          // 🧠 DÉTECTION INTELLIGENTE DE L'ID DE COULEUR
          let colorIdForUpload = colorId;
          
          // Si c'est un timestamp (nouvelle couleur), utiliser le mapping intelligent
          if (colorId && colorId.length > 10) {
            console.log('⚠️ Nouvelle couleur (timestamp), utilisation du mapping intelligent');
            
            // Mapping intelligent basé sur le timestamp
            const timestamp = parseInt(colorId);
            const colorVariations = product.colorVariations;
            
            if (colorVariations && colorVariations.length > 0) {
              // Créer un mapping déterministe basé sur le timestamp
              const index = Math.abs(timestamp % colorVariations.length);
              const selectedColor = colorVariations[index];
              
              colorIdForUpload = selectedColor.id.toString();
              console.log(`🔄 Mapping intelligent: timestamp ${timestamp} → index ${index} → couleur ${selectedColor.name} (ID: ${selectedColor.id})`);
            } else {
              throw new Error('Aucune couleur disponible pour ce produit');
            }
          } else {
            // ✅ Vérifier que la variation de couleur existe (pour les IDs directs)
            const colorVar = product.colorVariations?.find((cv: any) => cv.id === parseInt(colorId));
            if (!colorVar) {
              throw new Error(`Variation de couleur ${colorId} non trouvée pour le produit ${productIdForUpload}. Couleurs disponibles: ${product.colorVariations.map((cv: any) => cv.id).join(', ')}`);
            }
            console.log('✅ Variation de couleur trouvée:', colorVar);
          }
          
          // ✅ Upload direct selon la documentation avec l'ID correct
          const formDataUpload = new FormData();
          formDataUpload.append('image', file);
          
          console.log(`📤 Envoi vers: POST /products/upload-color-image/${productIdForUpload}/${colorIdForUpload}`);
          
          const response = await fetch(`${BACKEND_URL}/products/upload-color-image/${productIdForUpload}/${colorIdForUpload}`, {
            method: 'POST',
            credentials: 'include',
            body: formDataUpload,
          });
          
          console.log(`📥 Réponse reçue (${response.status})`);
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erreur lors de l\'upload de l\'image');
          }
          
          const result = await response.json();
          
          if (result.success && result.image) {
            // ✅ Image uploadée avec succès sur le serveur
            const newImage = {
              id: result.image.id || Date.now(),
              url: result.image.url,
              publicId: result.image.publicId,
              view: 'Front',
              delimitations: [],
            };
            
            const updatedColors = formData.colorVariations.map((color: any) =>
              color.id === colorId
                ? { ...color, images: [...color.images, newImage] }
                : color
            );
            updateFormData('colorVariations', updatedColors);
            
            console.log(`✅ [ProductFormMain] Image couleur ${colorId} uploadée intelligemment:`, result.image.url);
            toast.success('Image couleur uploadée avec succès', { duration: 2000 });
            return newImage.id.toString();
          } else {
            throw new Error(result.message || 'Erreur lors de l\'upload de l\'image');
          }
          
        } catch (error) {
          console.error('❌ Erreur de vérification:', error);
          toast.error(`Erreur de validation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
          return '';
        }
      } else {
        // Mode création sans productId - Stockage local temporaire
        console.log('⚠️ Mode création, stockage local temporaire');
        
        // Créer une URL temporaire pour l'image
        const objectUrl = URL.createObjectURL(file);
        
        // Créer un objet image temporaire
        const tempImage = {
          id: Date.now().toString(), // ID temporaire
          url: objectUrl,
          publicId: null,
          view: 'Front',
          delimitations: [],
          file: file, // Garder la référence au fichier pour upload ultérieur
          isTemp: true // Marquer comme temporaire
        };
        
        // Mettre à jour le state local
        const updatedColors = formData.colorVariations.map((color: any) =>
          color.id === colorId
            ? { ...color, images: [...color.images, tempImage] }
            : color
        );
        updateFormData('colorVariations', updatedColors);
        
        console.log(`✅ [ProductFormMain] Image couleur ${colorId} stockée temporairement:`, objectUrl);
        toast.success('Image ajoutée temporairement (sera uploadée lors de la création du produit)', { duration: 2000 });
        return tempImage.id;
      }
    } catch (error) {
      console.error(`❌ [ProductFormMain] Erreur upload image couleur ${colorId}:`, error);
      toast.error(`Erreur lors de l'upload: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      return '';
    }
  };

  // Remplacement d'image couleur admin (upload API si mode edit + productId)
  const handleReplaceImage = async (colorId: string, imageId: string, file: File): Promise<void> => {
    if (!(mode === 'edit' && productId)) return;
    // 1. Upload la nouvelle image
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);
    const res = await fetch(`${BACKEND_URL}/products/${productId}/colors/${colorId}/images`, {
      method: 'POST',
      credentials: 'include',
      body: formDataUpload,
    });
    if (!res.ok) {
      toast.error('Erreur lors de l\'upload de la nouvelle image');
      return;
    }
    const data = await res.json();
    // 2. Mets à jour l'image dans le state (on garde le même id)
    const updatedColors = formData.colorVariations.map((color: any) =>
      color.id === colorId
        ? {
            ...color,
            images: color.images.map((img: any) =>
              img.id === imageId ? { ...img, url: data.url, publicId: data.publicId } : img
            )
          }
        : color
    );
    updateFormData('colorVariations', updatedColors);
  };

  // Fonction pour obtenir les délimitations centralisées du produit (dernières modifications)
  const getCentralizedDelimitations = () => {
    const uniqueDelimitations = new Map<string, any>();
    
    // Collecter toutes les délimitations existantes du produit
    formData.colorVariations.forEach(colorVar => {
      colorVar.images.forEach(img => {
        if (img.delimitations) {
          img.delimitations.forEach(delim => {
            // Utiliser le nom comme clé unique, ou l'ID si pas de nom
            const key = delim.name || `zone_${delim.id}`;
            if (!uniqueDelimitations.has(key)) {
              uniqueDelimitations.set(key, delim);
            } else {
              // Si la délimitation existe déjà, garder la plus récente (basée sur l'ID)
              const existing = uniqueDelimitations.get(key);
              if (delim.id && existing.id) {
                // Comparer les IDs pour déterminer la plus récente
                const delimId = parseInt(delim.id.toString().replace(/\D/g, ''));
                const existingId = parseInt(existing.id.toString().replace(/\D/g, ''));
                if (delimId > existingId) {
                  uniqueDelimitations.set(key, delim);
                }
              }
            }
          });
        }
      });
    });
    
    // 🧠 Filtrer pour ne garder que les délimitations les plus récentes
    const allDelimitations = Array.from(uniqueDelimitations.values());
    
    // Si on a plus d'une délimitation, ne garder que la plus récente
    if (allDelimitations.length > 1) {
      // Trier par ID pour trouver la plus récente
      const sortedDelimitations = allDelimitations.sort((a, b) => {
        const aId = parseInt(a.id.toString().replace(/\D/g, ''));
        const bId = parseInt(b.id.toString().replace(/\D/g, ''));
        return bId - aId; // Ordre décroissant (plus récent en premier)
      });
      
      // Ne retourner que la délimitation la plus récente
      return [sortedDelimitations[0]];
    }
    
    return allDelimitations;
  };

  // Fonctions de rendu pour la prévisualisation
  const renderDelimitationOverlay = (image: ProductImage, containerRef?: string) => {
    // 🧠 Utiliser les délimitations centralisées du produit au lieu des délimitations individuelles
    const centralizedDelimitations = getCentralizedDelimitations();
    
    if (!centralizedDelimitations || centralizedDelimitations.length === 0) return null;

    return (
      <div className="absolute inset-0">
        {centralizedDelimitations.map((delim, index) => {
          let percentageCoords;
          
          if (delim._debug?.realImageSize) {
            // Utiliser les dimensions réelles stockées lors de la création
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
            
            if (containerRef) {
              const container = document.querySelector(containerRef);
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
              // Fallback
              percentageCoords = {
                left: (delim.x / 1200) * 100,
                top: (delim.y / 1200) * 100,
                width: (delim.width / 1200) * 100,
                height: (delim.height / 1200) * 100
              };
            }
          }

          return (
            <div
              key={delim.id || index}
              className="absolute border-2 border-red-500 bg-red-500/20 rounded backdrop-blur-sm z-10"
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
              {/* Badge d'information */}
              <div className="absolute -top-6 left-0 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-20">
                Zone {index + 1}
              </div>
              
              {/* Point central */}
              <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-red-600 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-20"></div>
              
              {/* Coins de redimensionnement */}
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-red-600 rounded-full"></div>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full"></div>
              <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-red-600 rounded-full"></div>
              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-red-600 rounded-full"></div>
            </div>
          );
        })}
      </div>
    );
  };

  // Rendu du contenu selon l'étape
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <BasicInfoStep formData={formData} errors={errors} onUpdate={updateFormData} />;
      
      case 2:
        return (
          <ColorVariationsStep 
            colorVariations={formData.colorVariations}
            onAddColorVariation={addColorVariation}
            onUpdateColorVariation={updateColorVariation}
            onRemoveColorVariation={removeColorVariation}
            onAddImageToColor={handleAddImageToColor}
            onUpdateImage={updateImage}
            onReplaceImage={handleReplaceImage}
            onSuggestedPriceChange={(price) => updateFormData('price', price)}
          />
        );
      
      case 3:
          return (
          <CategoriesStep
            categories={formData.categories}
            sizes={formData.sizes}
            onCategoriesUpdate={(categories: string[]) => updateFormData('categories', categories)}
            onSizesUpdate={(sizes: string[]) => updateFormData('sizes', sizes)}
          />
        );
      
      case 4:
        return (
          <DelimitationsStep
            colorVariations={formData.colorVariations}
            designsByImageId={designsByImageId}
            canvasRefs={canvasRefs}
            onDelimitationUpdate={(colorVariations) => updateFormData('colorVariations', colorVariations)}
            onDesignUpload={handleDesignUpload}
            onDesignReplace={handleDesignReplace}
            onDesignRemove={handleDesignRemove}
            onOpenDuplicator={handleOpenDuplicator}
            onExportFinalImage={handleExportFinalImage}
          />
        );
      
      case 5:
        return (
          <ValidationStep
            formData={formData}
            formStats={formStats}
            onSubmit={handleSubmit}
            onPreview={handlePreview}
            loading={loading}
          />
        );
      
      default:
        return null;
    }
  };

  // Nettoyage des Object URLs
  useEffect(() => {
    return () => {
      Object.values(designsByImageId).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [designsByImageId]);

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
                🎨 Ajouter un produit
              </h1>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between"
        >
                <Button
                  variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1 || loading}
            className="border-gray-300 dark:border-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Précédent
                </Button>

          {currentStep < steps.length ? (
                <Button
              onClick={nextStep}
                  disabled={loading}
              className="bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900"
            >
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={!formStats.isComplete}
                className="border-gray-300 dark:border-gray-600"
              >
                <Eye className="h-4 w-4 mr-2" />
                Prévisualiser
                </Button>

                <Button
                  onClick={handleSubmit}
                  disabled={loading || !formStats.isComplete}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Validation...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Valider le produit
                  </>
                )}
                </Button>
              </div>
          )}
        </motion.div>
      </div>

      {/* Modal de prévisualisation - CONSERVÉE */}
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
                <h4 className="product-title mb-2">Catégories</h4>
                <p className="product-description">
                  {formData.categories.length > 0 ? formData.categories.join(', ') : 'Aucune'}
                </p>
              </div>
            </div>

            {formData.colorVariations.length > 0 ? (
              <div className="space-y-6">
                <h3 className="subsection-title flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Variations avec zones de personnalisation
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
                        {color.images.map((image, imageIndex) => {
                          const imageId = `preview-${color.id}-${image.id}`;
                          
                          return (
                          <div key={image.id} className="relative group">
                              <div 
                                id={imageId}
                                className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"
                              >
                              <img
                                src={image.url}
                                alt={`${color.name} - Image ${imageIndex + 1}`}
                                className="w-full h-full object-cover"
                                  onLoad={(e) => {
                                    handlePreviewImageLoad(imageId);
                                    // Simple re-render pour s'assurer que les délimitations sont visibles
                                    setTimeout(() => {
                                      // Force un simple repaint
                                      const container = document.getElementById(imageId);
                                      if (container) {
                                        container.style.transform = 'translateZ(0)';
                                        setTimeout(() => {
                                          container.style.transform = '';
                                          // Délai supplémentaire pour s'assurer que les délimitations sont bien calculées
                                          setTimeout(() => {
                                            // Force un re-render des délimitations
                                            const event = new CustomEvent('delimitation-refresh');
                                            container.dispatchEvent(event);
                                          }, 50);
                                        }, 10);
                                      }
                                    }, 100);
                                  }}
                                />
                                {renderDelimitationOverlay(image, `#${imageId}`)}
                            </div>
                            
                              {/* Informations sur les délimitations */}
                              {(() => {
                                const centralizedDelimitations = getCentralizedDelimitations();
                                return centralizedDelimitations && centralizedDelimitations.length > 0 ? (
                                  <div className="mt-2 text-center">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full text-sm">
                                      <Layers className="h-3 w-3" />
                                      {centralizedDelimitations.length} zone{centralizedDelimitations.length > 1 ? 's' : ''}
                                    </div>
                                  </div>
                                ) : null;
                              })()}
                                  </div>
                          );
                        })}
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

      {/* Duplicateur de délimitations - CONSERVÉ */}
      {duplicatorState.sourceImage && (
        <DelimitationDuplicator
          isOpen={duplicatorState.isOpen}
          onClose={handleCloseDuplicator}
          sourceImage={duplicatorState.sourceImage}
          sourceColorName={duplicatorState.sourceColorName}
          allColorVariations={formData.colorVariations}
          onDuplicate={handleDuplicateDelimitations}
        />
      )}
    </div>
  );
}; 