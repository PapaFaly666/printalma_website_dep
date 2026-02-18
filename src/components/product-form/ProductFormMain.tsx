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
  ArrowRight,
  PackageOpen
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminButton } from '../admin/AdminButton';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useProductForm } from '../../hooks/useProductForm';
import { ProductFormFields } from './ProductFormFields';
import { ColorVariationsPanel } from './ColorVariationsPanel';
import { CategoriesAndSizesPanel } from './CategoriesAndSizesPanel';
// ❌ RETIRÉ: Ancien système de catégories - remplacé par CategoriesAndSizesPanel
// import { CategorySelector } from './CategorySelector';
import { StockManagementPanel } from './StockManagementPanel';
import { DelimitationCanvas, DelimitationCanvasHandle } from './DelimitationCanvas';
import { DesignUploadInterface } from './DesignUploadInterface';
import { DelimitationDuplicator } from './DelimitationDuplicator';
import { ProductImage, Delimitation, StockBySizeColor } from '../../types/product';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useCategories } from '../../contexts/CategoryContext';
import { updateProductCategories } from '../../services/categoryAdminService';
import categoryRealApi from '../../services/categoryRealApi';
import { ProductService } from '../../services/productService';

// 🔧 Configuration backend centralisée (basée sur per.md) - Compatible tous environnements
const getBackendUrl = () => {
  // 🔧 PRIORITÉ LOCALHOST pour le développement
  const LOCAL_BACKEND = 'http://localhost:3004';

  try {
    // Essai Vite
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || LOCAL_BACKEND;
    }
    // Essai Create React App (si applicable)
    if (typeof process !== 'undefined' && process.env) {
      return process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL || LOCAL_BACKEND;
    }
    // Essai window global (si défini manuellement)
    if (typeof window !== 'undefined' && (window as any).BACKEND_URL) {
      return (window as any).BACKEND_URL;
    }
  } catch (e) {
    console.log('⚠️ Erreur récupération variable environnement:', e);
  }
  // Fallback par défaut : LOCALHOST pour le développement
  return LOCAL_BACKEND;
  // return 'https://printalma-back-dep.onrender.com'; // Production
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

// ✅ CACHE GLOBAL pour la hiérarchie des catégories (évite les requêtes répétées)
let categoryHierarchyCache: any[] | null = null;
let categoryHierarchyCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * 🔧 Fonction pour charger la hiérarchie complète des catégories (avec cache)
 */
const loadCategoryHierarchy = async (): Promise<any[]> => {
  const now = Date.now();

  // Utiliser le cache si disponible et valide
  if (categoryHierarchyCache && (now - categoryHierarchyCacheTime) < CACHE_DURATION) {
    console.log('📦 [CACHE] Utilisation du cache de hiérarchie');
    return categoryHierarchyCache;
  }

  try {
    console.log('🌐 [API] Chargement de la hiérarchie depuis:', `${BACKEND_URL}/categories/hierarchy`);
    const hierarchy = await categoryRealApi.getCategoryHierarchy();

    // ✅ VALIDATION: Vérifier que hierarchy est bien un tableau
    if (!hierarchy) {
      console.warn('⚠️ [API] Hiérarchie null ou undefined, retour tableau vide');
      return [];
    }

    if (!Array.isArray(hierarchy)) {
      console.warn('⚠️ [API] Hiérarchie n\'est pas un tableau:', typeof hierarchy);
      console.warn('   Contenu:', hierarchy);
      return [];
    }

    // Mettre en cache
    categoryHierarchyCache = hierarchy;
    categoryHierarchyCacheTime = now;

    console.log('✅ [CACHE] Hiérarchie mise en cache:', hierarchy.length, 'catégories');
    return hierarchy;
  } catch (error) {
    console.error('❌ [API] Erreur chargement hiérarchie:', error);
    return [];
  }
};

/**
 * 🔧 Fonction pour extraire les IDs (categoryId, subCategoryId, variationId)
 * depuis le format UI: ["Category > SubCategory > Variation"]
 *
 * VERSION OPTIMISÉE - 1 seule requête API avec cache
 */
const extractCategoryIds = async (categories: string[]) => {
  // Si aucune catégorie sélectionnée
  if (categories.length === 0) {
    console.warn('⚠️ Aucune catégorie sélectionnée');
    return { categoryId: null, subCategoryId: null, variationId: null };
  }

  // Prendre la première catégorie (normalement il n'y en a qu'une)
  const categoryString = categories[0];

  // Extraire les noms depuis le format "Parent > Child > Variation"
  const parts = categoryString.split(' > ').map(p => p.trim());

  if (parts.length !== 3) {
    console.warn('⚠️ Format de catégorie invalide:', categoryString);
    console.warn('   Format attendu: "Category > SubCategory > Variation"');
    console.warn('   Format reçu:', parts.length, 'parties:', parts);
    return { categoryId: null, subCategoryId: null, variationId: null };
  }

  const [categoryName, subCategoryName, variationName] = parts;

  try {
    console.log('🔍 [EXTRACT] Extraction des IDs depuis:', { categoryName, subCategoryName, variationName });

    // 1. Charger la hiérarchie complète (1 seule requête API avec cache)
    const hierarchy = await loadCategoryHierarchy();

    if (!hierarchy || hierarchy.length === 0) {
      console.error('❌ Hiérarchie vide ou non disponible');
      return { categoryId: null, subCategoryId: null, variationId: null };
    }

    // 2. Trouver la catégorie par nom
    const category = hierarchy.find((c: any) => c.name === categoryName);

    if (!category) {
      console.error('❌ Catégorie introuvable:', categoryName);
      console.error('   Catégories disponibles:', hierarchy.map((c: any) => c.name));
      return { categoryId: null, subCategoryId: null, variationId: null };
    }

    console.log('✅ Catégorie trouvée:', { id: category.id, name: category.name });

    // 3. Trouver la sous-catégorie dans la hiérarchie
    const subCategory = category.subCategories?.find((sc: any) => sc.name === subCategoryName);

    if (!subCategory) {
      console.error('❌ Sous-catégorie introuvable:', subCategoryName);
      console.error('   Sous-catégories disponibles:', category.subCategories?.map((sc: any) => sc.name) || []);
      return { categoryId: category.id, subCategoryId: null, variationId: null };
    }

    console.log('✅ Sous-catégorie trouvée:', { id: subCategory.id, name: subCategory.name });

    // 4. Trouver la variation dans la hiérarchie
    const variation = subCategory.variations?.find((v: any) => v.name === variationName);

    if (!variation) {
      console.error('❌ Variation introuvable:', variationName);
      console.error('   Variations disponibles:', subCategory.variations?.map((v: any) => v.name) || []);
      return { categoryId: category.id, subCategoryId: subCategory.id, variationId: null };
    }

    console.log('✅ Variation trouvée:', { id: variation.id, name: variation.name });

    const result = {
      categoryId: category.id,
      subCategoryId: subCategory.id,
      variationId: variation.id
    };

    console.log('✅ [EXTRACT] IDs extraits avec succès:', result);

    return result;

  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction des IDs:', error);
    return { categoryId: null, subCategoryId: null, variationId: null };
  }
};

/**
 * 🧪 Fonction de test pour valider le système d'affectation des catégories
 * Peut être utilisée dans la console du navigateur pour tester
 */
export const testCategoryExtraction = async (testCategoryString: string) => {
  console.log('🧪 [TEST] Test d\'extraction de catégories...');
  console.log('📝 [TEST] Input:', testCategoryString);

  try {
    const result = await extractCategoryIds([testCategoryString]);
    console.log('✅ [TEST] Résultat:', result);

    // Validation du résultat
    if (result.categoryId && result.subCategoryId && result.variationId) {
      console.log('🎉 [TEST] SUCCÈS - Tous les IDs extraits');
    } else {
      console.warn('⚠️ [TEST] ÉCHEC - IDs manquants');
    }

    return result;
  } catch (error) {
    console.error('❌ [TEST] Erreur:', error);
    return null;
  }
};

// Composants d'étapes
const BasicInfoStep: React.FC<{
  formData: any;
  errors: any;
  onUpdate: (field: any, value: any) => void;
}> = ({ formData, errors, onUpdate }) => {
  return (
    <ProductFormFields
      formData={formData}
      errors={errors}
      onUpdate={onUpdate}
    />
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
  genre?: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE' | 'AUTOCOLLANT' | 'TABLEAU';
  suggestedPrice?: number;
}> = ({
  colorVariations,
  onAddColorVariation,
  onUpdateColorVariation,
  onRemoveColorVariation,
  onAddImageToColor,
  onUpdateImage,
  onReplaceImage,
  onSuggestedPriceChange,
  genre,
  suggestedPrice
}) => {
  return (
    <ColorVariationsPanel
      colorVariations={colorVariations}
      onAddColorVariation={onAddColorVariation}
      onUpdateColorVariation={onUpdateColorVariation}
      onRemoveColorVariation={onRemoveColorVariation}
      onAddImageToColor={onAddImageToColor}
      onUpdateImage={onUpdateImage}
      onReplaceImage={onReplaceImage}
      onSuggestedPriceChange={onSuggestedPriceChange}
      genre={genre}
      suggestedPrice={suggestedPrice}
    />
  );
};

const CategoriesStep: React.FC<{
  sizes: string[];
  categories: string[];
  sizePricing?: any[];
  useGlobalPricing?: boolean;
  globalCostPrice?: number;
  globalSuggestedPrice?: number;
  onCategoriesUpdate: (categories: string[]) => void;
  onSizesUpdate: (sizes: string[]) => void;
  onSizePricingUpdate?: (pricing: any[]) => void;
  onUseGlobalPricingChange?: (value: boolean) => void;
}> = ({
  sizes,
  categories,
  sizePricing,
  useGlobalPricing,
  globalCostPrice,
  globalSuggestedPrice,
  onCategoriesUpdate,
  onSizesUpdate,
  onSizePricingUpdate,
  onUseGlobalPricingChange
}) => {
  return (
    <CategoriesAndSizesPanel
      categories={categories || []}
      sizes={sizes}
      sizePricing={sizePricing}
      useGlobalPricing={useGlobalPricing}
      globalCostPrice={globalCostPrice}
      globalSuggestedPrice={globalSuggestedPrice}
      onCategoriesUpdate={onCategoriesUpdate}
      onSizesUpdate={onSizesUpdate}
      onSizePricingUpdate={onSizePricingUpdate}
      onUseGlobalPricingChange={onUseGlobalPricingChange}
    />
  );
};

const StockStep: React.FC<{
  sizes: string[];
  colorVariations: any[];
  onStockChange: (colorIndex: number, stock: { [size: string]: number }) => void;
}> = ({ sizes, colorVariations, onStockChange }) => {
  return (
    <StockManagementPanel
      sizes={sizes}
      colorVariations={colorVariations}
      onStockChange={onStockChange}
    />
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
  genre?: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE' | 'AUTOCOLLANT' | 'TABLEAU';
}> = ({ 
  colorVariations, 
  designsByImageId, 
  canvasRefs, 
  onDelimitationUpdate, 
  onDesignUpload, 
  onDesignReplace, 
  onDesignRemove,
  onOpenDuplicator,
  onExportFinalImage,
  genre
}) => {
  const getDesignForImage = (imageId: string) => designsByImageId[imageId] || null;

  // Fonction pour créer une délimitation pleine image (pour autocollants)
  const createFullImageDelimitation = (imageId: string, colorId: string) => {
    const canvasHandle = canvasRefs.current[imageId];
    if (!canvasHandle) {
      toast.error('Canvas non disponible');
      return;
    }

    const result = canvasHandle.createFullImageDelimitation();
    if (result.success) {
      toast.success('Délimitation pleine image créée');

      // Mettre à jour les variations de couleur avec la nouvelle délimitation
      const updatedColorVariations = colorVariations.map(color => {
        if (color.id === colorId) {
          return {
            ...color,
            images: color.images.map((img: ProductImage) => {
              if (img.id === imageId) {
                return {
                  ...img,
                  delimitations: result.delimitations
                };
              }
              return img;
            })
          };
        }
        return color;
      });

      onDelimitationUpdate(updatedColorVariations);
    } else {
      toast.error(result.error || 'Erreur lors de la création de la délimitation');
    }
  };

  return (
    <Card className="border-gray-200">
      <CardHeader className="border-b border-gray-200 bg-gray-50">
        <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Images et zones de personnalisation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {(genre === 'AUTOCOLLANT' || genre === 'TABLEAU') && (
          <div className="p-4 bg-[rgb(20,104,154)]/5 border border-[rgb(20,104,154)]/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[rgb(20,104,154)] mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-[rgb(16,83,123)] mb-1">
                  Mode Autocollant
                </h4>
                <p className="text-sm text-[rgb(20,104,154)]">
                  Pour les autocollants, utilisez le bouton <strong>"Délimitation pleine image"</strong> pour créer automatiquement une zone de personnalisation qui couvre toute l'image. Les vendeurs pourront ensuite placer leurs designs dans cette zone.
                </p>
              </div>
            </div>
          </div>
        )}
        {colorVariations.length > 0 ? (
          colorVariations.map((color) => (
            <div key={color.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-4 h-4 rounded-full border-2 border-gray-300"
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
                            <AdminButton
                              size="sm"
                              variant="outline"
                              onClick={() => onOpenDuplicator(image, color.name)}
                            >
                              <Copy className="h-3 w-3" />
                              <span>Dupliquer</span>
                            </AdminButton>
                          )}
                        </div>

                        {(genre === 'AUTOCOLLANT' || genre === 'TABLEAU') && (
                          <AdminButton
                            onClick={() => createFullImageDelimitation(image.id, color.id)}
                            variant="outline"
                            className="w-full bg-[rgb(20,104,154)]/5 hover:bg-[rgb(20,104,154)]/10 text-[rgb(20,104,154)] border-[rgb(20,104,154)]/50"
                          >
                            <Layers className="h-4 w-4" />
                            <span>Délimitation pleine image</span>
                          </AdminButton>
                        )}

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
                          className="min-h-[400px] border border-gray-200 rounded-lg"
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
    <Card className="border-gray-200">
      <CardHeader className="border-b border-gray-200 bg-gray-50">
        <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Validation finale
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Résumé du produit */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {formStats.completionPercentage}%
            </div>
            <div className="text-sm text-gray-600">Progression</div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {formStats.totalColors}
            </div>
            <div className="text-sm text-gray-600">Couleurs</div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {formStats.totalImages}
            </div>
            <div className="text-sm text-gray-600">Images</div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {formStats.totalDelimitations}
            </div>
            <div className="text-sm text-gray-600">Zones</div>
          </div>
        </div>


        {/* Message d'aide */}
        {!formStats.isComplete && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 mb-2">
                  Éléments manquants :
                </p>
                <ul className="space-y-1 text-sm text-yellow-700">
                  {!formData.name && <li>• Nom du produit</li>}
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

  // États de chargement pour les catégories
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [loadingVariations, setLoadingVariations] = useState(false);

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

  // --- Dépendances Catégorie/Sous-catégorie/Variation (chargement dynamique) ---
  const prevCategoryIdRef = useRef<number | null>(null);
  useEffect(() => {
    const catId: number | null = (formData as any)?.categoryId || null;
    const prev = prevCategoryIdRef.current;
    // Si la catégorie a changé, reset sous-catégorie/variation
    if (catId !== prev) {
      if (prev !== null) {
        updateFormData('subCategoryId' as any, null);
        updateFormData('variationId' as any, null);
        updateFormData('__uiSubCategories' as any, []);
        updateFormData('__uiVariations' as any, []);
      }
      prevCategoryIdRef.current = catId;
    }

    if (!catId) {
      updateFormData('__uiSubCategories' as any, []);
      updateFormData('__uiVariations' as any, []);
      setLoadingSubCategories(false);
      setLoadingVariations(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoadingSubCategories(true);
        setLoadingVariations(false);

        // Charger les sous-catégories via l'endpoint réel: GET /sub-categories?categoryId=X
        const subCategories = await categoryRealApi.getSubCategories(catId);

        if (cancelled) return;

        // Transformer les données pour correspondre au format attendu par l'UI
        const childrenData = subCategories.map(sc => ({
          id: sc.id,
          name: sc.name,
          level: 1, // SubCategory est toujours niveau 1
          parentId: sc.categoryId
        }));

        updateFormData('__uiSubCategories' as any, childrenData);
        setLoadingSubCategories(false);

        // Reset variations quand la catégorie change (elles seront chargées via la sous-catégorie)
        const hasSub = !!(formData as any)?.subCategoryId;
        if (!hasSub) {
          updateFormData('__uiVariations' as any, []);
        }

        console.log('✅ Chargement catégorie terminé:', {
          categoryId: catId,
          subCategories: childrenData.length
        });
      } catch (e) {
        if (cancelled) return;
        console.error('❌ Erreur chargement catégorie:', e);
        updateFormData('__uiSubCategories' as any, []);
        setLoadingSubCategories(false);

        // Garder les variations actuelles seulement si une sous-catégorie est sélectionnée
        const hasSub = !!(formData as any)?.subCategoryId;
        if (!hasSub) {
          updateFormData('__uiVariations' as any, []);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [formData.categoryId]);

  useEffect(() => {
    const subId: number | null = (formData as any)?.subCategoryId || null;

    // Charger les variations uniquement si une sous-catégorie est sélectionnée
    if (!subId) {
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoadingVariations(true);
        console.log(`🔄 Chargement des variations (cate.md) pour sous-catégorie ${subId}...`);

        // 1) Source principale: GET /variations?subCategoryId=ID
        const variations = await categoryRealApi.getVariations(subId);
        if (cancelled) return;

        if (Array.isArray(variations) && variations.length > 0) {
          const uiList = variations.map(v => ({ id: v.id, name: v.name }));
          updateFormData('__uiVariations' as any, uiList);
          setLoadingVariations(false);
          console.log(`✅ ${uiList.length} variation(s) chargée(s) via /variations?subCategoryId=${subId}`);
          return;
        }

        // 2) Fallback: GET /sub-categories/:id (variations incluses)
        console.log('⚠️ Aucune variation via /variations, tentative via /sub-categories/:id...');
        const sub = await categoryRealApi.getSubCategoryById(subId);
          if (cancelled) return;
        const fallbackList = (sub.variations || []).map(v => ({ id: v.id, name: v.name }));
        updateFormData('__uiVariations' as any, fallbackList);
          setLoadingVariations(false);
        console.log(`✅ ${fallbackList.length} variation(s) chargée(s) via /sub-categories/${subId}`);
      } catch (e) {
          if (cancelled) return;
        console.error(`❌ Erreur chargement variations (cate.md) pour sous-catégorie ${subId}:`, e);
          updateFormData('__uiVariations' as any, []);
          setLoadingVariations(false);
      }
    })();
    return () => { cancelled = true; };
  }, [(formData as any)?.subCategoryId]);
  
  // Étapes du processus
  const allSteps = [
    { id: 1, title: 'Informations de base', icon: Package },
    { id: 2, title: 'Variations de couleur', icon: Palette },
    { id: 3, title: 'Catégories et tailles', icon: Tag },
    { id: 4, title: 'Gestion du stock', icon: PackageOpen },
    { id: 5, title: 'Images et délimitations', icon: Layers },
    { id: 6, title: 'Validation', icon: CheckCircle }
  ];

  // Filtrer l'étape "Gestion du stock" si le produit ne nécessite pas de stock
  const steps = formData.requiresStock === false
    ? allSteps.filter(step => step.id !== 4)
    : allSteps;

  // Ordre des couleurs: toujours commencer par le blanc
  const isWhiteColor = (color: any) => {
    const name = (color?.name || '').toString().trim().toLowerCase();
    const code = (color?.colorCode || '').toString().trim().toLowerCase();
    return (
      name === 'blanc' ||
      name === 'white' ||
      code === '#ffffff' ||
      code === '#fff' ||
      code === 'rgb(255,255,255)'
    );
  };

  const colorVariationsWhiteFirst = useMemo(() => {
    const colors = Array.isArray(formData?.colorVariations) ? [...formData.colorVariations] : [];
    return colors.sort((a, b) => {
      const aWhite = isWhiteColor(a);
      const bWhite = isWhiteColor(b);
      if (aWhite && !bWhite) return -1;
      if (!aWhite && bWhite) return 1;
      return 0;
    });
  }, [formData?.colorVariations]);
  
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
    const hasBasicInfo = formData.name && formData.description; // Prix retiré - défini par taille
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
         (formData.description ? 1 : 0) +
         (formData.colorVariations.length > 0 ? 1 : 0) +
         (totalImages > 0 ? 1 : 0) +
         (totalDelimitations > 0 ? 1 : 0)) * 20 // 5 éléments = 100% / 5
      )
    };
  }, [formData]);

  // Validation des étapes
  const validateStep = (step: number, skipDelimitationCheck: boolean = false): string[] => {
    const errors: string[] = [];

    switch (step) {
      case 1:
        if (!formData.name.trim()) errors.push('Nom du produit requis');
        if (!formData.description.trim()) errors.push('Description requise');
        // Prix retiré - validation déplacée à l'étape 3 (Catégories et tailles)
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
        // ✅ Validation améliorée des catégories avec extraction des IDs
        console.log('🔍 [DEBUG validateStep] Validation étape 3:', {
          categoryId: formData.categoryId,
          categories: formData.categories,
          categoriesLength: formData.categories?.length
        });

        if (!formData.categories || formData.categories.length === 0) {
          errors.push('Une catégorie est requise');
          console.log('❌ [DEBUG validateStep] Validation échouée: aucune catégorie sélectionnée');
        } else {
          // Validation du format "Category > SubCategory > Variation"
          const categoryString = formData.categories[0];
          const parts = categoryString.split(' > ').map(p => p.trim());

          if (parts.length !== 3) {
            errors.push('Format de catégorie invalide. Format attendu: "Catégorie > Sous-catégorie > Variation"');
            console.log('❌ [DEBUG validateStep] Format invalide:', categoryString);
          } else {
            console.log('✅ [DEBUG validateStep] Format de catégorie valide:', categoryString);
          }
        }

        if (formData.sizes.length === 0) errors.push('Au moins une taille requise');
        break;

      case 4:
        // Validation optionnelle du stock - vérifier si au moins une variation a du stock
        const hasStock = formData.colorVariations.some(color =>
          color.stock && Object.values(color.stock).some(qty => qty > 0)
        );
        if (!hasStock) {
          errors.push('⚠️ Aucun stock défini (vous pouvez continuer)');
        }
        break;

      case 5:
        if (formStats.totalImages === 0) errors.push('Au moins une image requise');

        // 🔧 CORRECTION: Si on vient de sauvegarder (skipDelimitationCheck), ne pas valider les délimitations
        // car le state React n'est pas encore mis à jour (mise à jour asynchrone)
        if (!skipDelimitationCheck) {
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
        }
        break;
    }

    return errors;
  };

  // Navigation entre les étapes
  const nextStep = () => {
    // 🔧 CORRECTION: Sauvegarder AVANT de valider pour que la validation voit les données sauvegardées
    // Si on est à l'étape 5 (Images et délimitations), sauvegarder automatiquement toutes les délimitations
    let skipDelimitationCheck = false;

    if (currentStep === 5) {
      console.log('💾 Auto-sauvegarde des délimitations avant validation...');
      let savedCount = 0;

      // Parcourir toutes les images et sauvegarder les délimitations si elles existent
      Object.entries(canvasRefs.current).forEach(([imageId, canvasHandle]) => {
        if (canvasHandle && typeof canvasHandle.saveChanges === 'function') {
          try {
            canvasHandle.saveChanges();
            savedCount++;
            console.log(`✅ Délimitations sauvegardées pour l'image ${imageId}`);
          } catch (error) {
            console.error(`❌ Erreur lors de la sauvegarde pour l'image ${imageId}:`, error);
          }
        }
      });

      if (savedCount > 0) {
        console.log(`✅ ${savedCount} délimitation(s) sauvegardée(s) automatiquement`);
        // Toast discret pour informer l'utilisateur
        toast.success(`${savedCount} zone(s) de personnalisation sauvegardée(s)`, {
          duration: 2000
        });
        // ✅ Si on a sauvegardé, ignorer la validation des délimitations (state pas encore à jour)
        skipDelimitationCheck = true;
      }
    }

    // ✅ Validation APRÈS la sauvegarde (avec flag pour ignorer les délimitations si on vient de sauvegarder)
    const errors = validateStep(currentStep, skipDelimitationCheck);
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    let nextStepNumber = currentStep + 1;
    // Si on est à l'étape 3 et que le produit ne nécessite pas de stock, sauter l'étape 4
    if (currentStep === 3 && formData.requiresStock === false) {
      nextStepNumber = 5;
    }

    if (nextStepNumber <= 6) {
      setCurrentStep(nextStepNumber);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      let prevStepNumber = currentStep - 1;
      // Si on est à l'étape 5 et que le produit ne nécessite pas de stock, revenir à l'étape 3
      if (currentStep === 5 && formData.requiresStock === false) {
        prevStepNumber = 3;
      }
      setCurrentStep(prevStepNumber);
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
    'name', 'description', 'price', 'suggestedPrice', 'stock', 'status',
    'categoryId', 'subCategoryId', 'variationId', 'categories', 'sizes', 'genre', 'colorVariations', 'requiresStock'
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
  
  // ✅ Validation et formatage des IDs de catégories (priorité haute)
  console.log('🔧 [PAYLOAD] Traitement des IDs de catégories...');
  if (payload.categoryId !== undefined && payload.categoryId !== null) {
    payload.categoryId = parseInt(payload.categoryId);
    console.log('✅ [PAYLOAD] categoryId formaté:', payload.categoryId);
  }
  if (payload.subCategoryId !== undefined && payload.subCategoryId !== null) {
    payload.subCategoryId = parseInt(payload.subCategoryId);
    console.log('✅ [PAYLOAD] subCategoryId formaté:', payload.subCategoryId);
  }
  if (payload.variationId !== undefined && payload.variationId !== null) {
    payload.variationId = parseInt(payload.variationId);
    console.log('✅ [PAYLOAD] variationId formaté:', payload.variationId);
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
  
  // ✅ BACKEND ADAPTÉ: On garde requiresStock et price dans colorVariations
  // Ces champs sont maintenant supportés par le backend (voir BACKEND_ADAPTATION_AUTOCOLLANT.md)
  if (payload.requiresStock !== undefined) {
    console.log('✅ [BACKEND ADAPTÉ] requiresStock envoyé au backend:', payload.requiresStock);
  }

  if (payload.colorVariations && Array.isArray(payload.colorVariations)) {
    payload.colorVariations.forEach((cv: any) => {
      if (cv.price !== undefined) {
        console.log(`✅ [BACKEND ADAPTÉ] Prix ${cv.price} envoyé pour variation "${cv.name}"`);
      }
    });
  }

  console.log('🔧 Payload final keys:', Object.keys(payload));
  return payload;
};

/**
 * 🔧 FONCTION DE NORMALISATION POUR LA CRÉATION DE PRODUIT
 * Corrige le format des catégories selon la documentation API
 */
const normalizeProductDataForCreation = (formData: any) => {
  console.log('🔧 [NORMALIZATION] Début de la normalisation des données produit...');
  console.log('🔍 [NORMALIZATION] Données brutes reçues:', {
    name: formData.name,
    categories: formData.categories,
    categoryId: formData.categoryId,
    subCategoryId: formData.subCategoryId,
    variationId: formData.variationId
  });

  // Utiliser les IDs extraits ou extraire depuis le format "Category > SubCategory > Variation"
  const categoryId = formData.categoryId;
  const subCategoryId = formData.subCategoryId;
  const variationId = formData.variationId;

  // Si les IDs ne sont pas définis, essayer de les extraire depuis categories
  if ((!categoryId || !subCategoryId || !variationId) && formData.categories && formData.categories.length > 0) {
    console.log('🔄 [NORMALIZATION] Extraction des IDs depuis le format catégories...');

    const categoryString = formData.categories[0];
    const parts = categoryString.split(' > ').map(p => p.trim());

    if (parts.length === 3) {
      console.log('📋 [NORMALIZATION] Format détecté, parties:', parts);
      // Les IDs seront extraits plus tard dans handleSubmit via extractCategoryIds
    } else {
      console.warn('⚠️ [NORMALIZATION] Format de catégorie invalide:', categoryString);
    }
  }

  // Étape 1: Construire les données de base normalisées
  // 🆕 Calculer suggestedPrice par défaut à partir des prix par taille
  let calculatedSuggestedPrice = formData.suggestedPrice || 0;

  // Si useGlobalPricing est activé, utiliser globalSuggestedPrice
  if (formData.useGlobalPricing && formData.globalSuggestedPrice > 0) {
    calculatedSuggestedPrice = formData.globalSuggestedPrice;
  }
  // Sinon, prendre le premier prix de taille disponible
  else if (formData.sizePricing && formData.sizePricing.length > 0) {
    const firstValidPricing = formData.sizePricing.find(p => p.suggestedPrice > 0);
    if (firstValidPricing) {
      calculatedSuggestedPrice = firstValidPricing.suggestedPrice;
    }
  }

  const normalizedData: any = {
    name: formData.name,
    description: formData.description,
    price: formData.price || 0, // Gardé pour compatibilité backend
    suggestedPrice: calculatedSuggestedPrice, // 🆕 Prix calculé > 0
    stock: formData.stock,
    status: formData.status || 'DRAFT',
    genre: formData.genre || 'UNISEXE',
    isReadyProduct: true,
    sizes: formData.sizes || [],
    // ✅ REQUIS: categories (array de strings)
    categories: formData.categories && Array.isArray(formData.categories) && formData.categories.length > 0
      ? formData.categories
      : ["Produit"], // Valeur par défaut si pas de catégories
    // 🆕 Prix par taille
    useGlobalPricing: formData.useGlobalPricing || false,
    globalCostPrice: formData.globalCostPrice || 0,
    globalSuggestedPrice: formData.globalSuggestedPrice || 0,
    sizePricing: formData.sizePricing || []
  };

  // Étape 2: Ajouter les IDs de catégories avec les bons noms de champs
  if (categoryId) {
    normalizedData.categoryId = parseInt(categoryId);
    console.log('✅ [NORMALIZATION] categoryId ajouté:', normalizedData.categoryId);
  }

  if (subCategoryId) {
    normalizedData.subCategoryId = parseInt(subCategoryId);
    console.log('✅ [NORMALIZATION] subCategoryId ajouté:', normalizedData.subCategoryId);
  }

  if (variationId) {
    normalizedData.variationId = parseInt(variationId);
    console.log('✅ [NORMALIZATION] variationId ajouté:', normalizedData.variationId);
  }

  // Étape 3: Préparer les variations de couleur (colorVariations)
  if (formData.colorVariations && Array.isArray(formData.colorVariations)) {
    console.log('🎨 [NORMALIZATION] Traitement des variations de couleur:', formData.colorVariations.length);

    // Garder colorVariations pour la compatibilité
    normalizedData.colorVariations = formData.colorVariations.map((colorVar: any) => ({
      name: colorVar.name,
      colorCode: colorVar.colorCode,
      images: colorVar.images || [],
      stock: colorVar.stock || {}
    }));

    // Créer le tableau variations pour l'API
    normalizedData.variations = formData.colorVariations.map((colorVar: any) => {
      const variation: any = {
        value: colorVar.name,
        colorCode: colorVar.colorCode,
        images: colorVar.images || []
      };

      // Ajouter l'ID de variation si disponible
      if (variationId) {
        variation.variationId = parseInt(variationId);
      }

      // Ajouter le prix spécifique à cette variation si différent
      if (colorVar.price && colorVar.price !== formData.price) {
        variation.price = colorVar.price;
      }

      // 🔧 CORRECTION : Pour AUTOCOLLANT ou TABLEAU, pas de gestion de stock
      if (formData.genre === 'AUTOCOLLANT' || formData.genre === 'TABLEAU') {
        variation.stock = null; // Pas de stock pour ces produits
      } else {
        // Calculer le stock total pour cette variation
        if (colorVar.stock && typeof colorVar.stock === 'object') {
          variation.stock = Object.values(colorVar.stock).reduce((sum: number, stock: any) => sum + (stock || 0), 0);
        }
      }

      return variation;
    });

    console.log('✅ [NORMALIZATION] Variations préparées:', normalizedData.variations.length);
  }

  // ✅ NE PLUS SUPPRIMER categories - c'est un champ REQUIS par le backend!
  // Le backend attend categories comme array de strings (ex: ["Mugs", "Accessoires"])

  console.log('🎯 [NORMALIZATION] Données final normalisées:', {
    name: normalizedData.name,
    categoryId: normalizedData.categoryId,
    subCategoryId: normalizedData.subCategoryId,
    variationId: normalizedData.variationId,
    categories: normalizedData.categories,
    hasVariations: normalizedData.variations?.length > 0,
    variationsCount: normalizedData.variations?.length || 0
  });

  return normalizedData;
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
      // ✅ CRÉATION DE PRODUIT - EXTRACTION DES IDS depuis le format "Category > SubCategory > Variation"
      console.log('📋 [SUBMIT] Création de produit - Catégories sélectionnées:', formData.categories);

      // Étape 1: Extraire les IDs depuis le format UI
      const { categoryId, subCategoryId, variationId } =
        await extractCategoryIds(formData.categories || []);

      console.log('📋 [SUBMIT] IDs extraits:', { categoryId, subCategoryId, variationId });

      // Étape 2: Validation des IDs extraits
      if (!categoryId || !subCategoryId) {
        console.error('❌ [SUBMIT] IDs manquants - Création impossible');
        toast.error('❌ Veuillez sélectionner une catégorie et sous-catégorie valides');
        return;
      }

      // Étape 3: Préparer les données avec les IDs extraits
      const formDataWithIds = {
        ...formData,
        categoryId: categoryId,
        subCategoryId: subCategoryId,
        variationId: variationId
      };

      console.log('🔍 [SUBMIT] FormData avec IDs:', {
        categoryId: formDataWithIds.categoryId,
        subCategoryId: formDataWithIds.subCategoryId,
        variationId: formDataWithIds.variationId,
        name: formDataWithIds.name,
        price: formDataWithIds.price
      });

      // Étape 4: Normaliser les données pour l'API selon la documentation
      const normalizedData = normalizeProductDataForCreation(formDataWithIds);

      console.log('🎯 [SUBMIT] Données normalisées pour création:', {
        name: normalizedData.name,
        categoryId: normalizedData.categoryId,
        subCategoryId: normalizedData.subCategoryId,
        variationId: normalizedData.variationId,
        hasVariations: normalizedData.variations?.length > 0
      });

      // Étape 5: Validation finale avant création
      if (!normalizedData.categoryId || !normalizedData.subCategoryId) {
        console.error('❌ [SUBMIT] Données normalisées invalides');
        toast.error('❌ Erreur dans la préparation des données de catégorie');
        return;
      }

      // Étape 6: Créer le produit avec les données normalisées
      try {
        console.log('🚀 [SUBMIT] Création du produit avec les données normalisées...');

        // 🔧 SOLUTION DIRECTE : Mettre à jour le formData local ET le state
        console.log('🔄 [SUBMIT] Mise à jour directe des données...');

        // Mettre à jour le formData local avec les bons IDs
        // 🆕 Calculer suggestedPrice à partir des prix par taille
        let calculatedSuggestedPrice = formData.suggestedPrice || 0;

        // Si useGlobalPricing est activé, utiliser globalSuggestedPrice
        if (formData.useGlobalPricing && formData.globalSuggestedPrice > 0) {
          calculatedSuggestedPrice = formData.globalSuggestedPrice;
        }
        // Sinon, prendre le premier prix par taille valide
        else if (formData.sizePricing && formData.sizePricing.length > 0) {
          const firstValidPricing = formData.sizePricing.find(p => p.suggestedPrice > 0);
          if (firstValidPricing) {
            calculatedSuggestedPrice = firstValidPricing.suggestedPrice;
          }
        }

        const finalFormData = {
          ...formData,
          categoryId: categoryId,
          subCategoryId: subCategoryId,
          variationId: variationId,
          suggestedPrice: calculatedSuggestedPrice // 🆕 Prix calculé depuis sizePricing
        };

        console.log('✅ [SUBMIT] FormData final préparé:', {
          categoryId: finalFormData.categoryId,
          subCategoryId: finalFormData.subCategoryId,
          variationId: finalFormData.variationId,
          sizes: finalFormData.sizes,
          sizePricing: finalFormData.sizePricing,
          useGlobalPricing: finalFormData.useGlobalPricing
        });

        // Mettre à jour le state pour la cohérence (mais ne pas attendre)
        updateFormData('categoryId', categoryId);

        // Utiliser le service directement avec les données normalisées
        console.log('🎯 [SUBMIT] Appel direct du service avec les données normalisées...');

        // Construire le payload final selon la documentation
        // 🔧 PRODUITS SANS STOCK : AUTOCOLLANT ou TABLEAU
        const isAutocollant = finalFormData.genre === 'AUTOCOLLANT' || finalFormData.genre === 'TABLEAU';

        // 🔧 CORRECTION : Extraire les fichiers AVANT de construire le payload
        const extractedFiles: File[] = [];
        console.log('🔍 [SUBMIT] Extraction des fichiers depuis formData.colorVariations...');

        finalFormData.colorVariations.forEach((color: any, colorIndex: number) => {
          console.log(`🎨 [SUBMIT] Couleur ${colorIndex}: ${color.name}, images: ${color.images?.length}`);

          if (color.images && Array.isArray(color.images)) {
            color.images.forEach((image: any, imageIndex: number) => {
              // 🔧 CORRECTION : Extraire le fichier depuis l'image
              if (image.file && image.file instanceof File) {
                extractedFiles.push(image.file);
                console.log(`📎 [SUBMIT] Fichier extrait (via .file): ${image.file.name} (${image.file.size} bytes)`);
              } else if (image.isTemp && image.file instanceof File) {
                extractedFiles.push(image.file);
                console.log(`📎 [SUBMIT] Fichier temporaire extrait: ${image.file.name}`);
              } else if (image.url && image.url.startsWith('blob:')) {
                console.warn(`⚠️ [SUBMIT] Image blob sans fichier attaché: ${image.url.substring(0, 50)}...`);
                // Les images blob sans fichier ne peuvent pas être envoyées
              } else {
                console.warn(`⚠️ [SUBMIT] Image sans fichier: index=${imageIndex}, couleur=${color.name}`);
              }
            });
          }
        });

        console.log(`✅ [SUBMIT] Total fichiers extraits: ${extractedFiles.length}`);

        const finalPayload = {
          name: finalFormData.name,
          description: finalFormData.description,
          price: finalFormData.price,
          suggestedPrice: finalFormData.suggestedPrice,
          stock: isAutocollant ? undefined : finalFormData.stock,
          status: finalFormData.status,

          // ✅ FORMAT CORRECT : Utiliser le camelCase correct pour le backend NestJS + types number
          categoryId: parseInt(finalFormData.categoryId.toString()),
          subCategoryId: finalFormData.subCategoryId ? parseInt(finalFormData.subCategoryId.toString()) : undefined,

          // ✅ REQUIS: categories (array de strings)
          categories: finalFormData.categories && Array.isArray(finalFormData.categories) && finalFormData.categories.length > 0
            ? finalFormData.categories
            : ["Produit"],

          // ✅ VARIATIONS DE COULEUR (pas de variationId ici!)
          variations: finalFormData.colorVariations.map((color: any): any => ({
            // ❌ SUPPRIMÉ: variationId ne doit PAS être dans les variations de couleur
            value: color.name,        // Nom de la couleur (ex: "Rouge", "Noir")
            colorCode: color.colorCode, // Code hex (ex: "#FF0000")
            // Pour AUTOCOLLANT, utiliser le prix de la variation, sinon le prix global du produit
            price: isAutocollant ? (color.price || finalFormData.suggestedPrice) : finalFormData.price,
            // 🔧 CORRECTION : Pour AUTOCOLLANT, pas de stock
            stock: isAutocollant ? null : (
              color.stock && typeof color.stock === 'object'
                ? Object.values(color.stock).reduce((sum: number, qty: any) => sum + (Number(qty) || 0), 0)
                : 0
            ),
            images: color.images.map((image: any) => ({
              fileId: image.id,
              view: image.view,
              delimitations: (image.delimitations || []).map((delim: any) => ({
                x: delim.x,
                y: delim.y,
                width: delim.width,
                height: delim.height,
                rotation: delim.rotation || 0,
                name: delim.name
              }))
            }))
          })),

          // Autres champs
          sizes: finalFormData.sizes || [],
          genre: finalFormData.genre || 'UNISEXE',
          isReadyProduct: false,
          // ✅ IMPORTANT: requiresStock doit être false pour les AUTOCOLLANT
          requiresStock: isAutocollant ? false : (finalFormData.requiresStock ?? true),
          // 🆕 Prix par taille
          useGlobalPricing: finalFormData.useGlobalPricing || false,
          globalCostPrice: finalFormData.globalCostPrice || 0,
          globalSuggestedPrice: finalFormData.globalSuggestedPrice || 0,
          sizePricing: finalFormData.sizePricing || []
        };

        // Importer directement le service pour contourner le state
        const { ProductService } = await import('../../services/productService');

        console.log('🎯 [SUBMIT] Payload final pour API:', {
          name: finalPayload.name,
          categoryId: finalPayload.categoryId,
          subCategoryId: finalPayload.subCategoryId,
          hasVariations: finalPayload.variations?.length > 0,
          filesCount: extractedFiles.length,
          sizes: finalPayload.sizes,
          sizePricing: finalPayload.sizePricing
        });

        // Appeler l'API directement avec les fichiers extraits
        const result = await ProductService.createProduct(finalPayload, extractedFiles);

        if (result.success) {
          console.log('✅ [SUBMIT] Produit créé avec succès !');
          console.log('🏷️ [SUBMIT] Vérification des catégories:', {
            productId: result.data.id,
            categoryId: result.data.categoryId,
            categoryName: result.data.category?.name
          });
          toast.success('Produit créé avec succès !');
          resetForm();
          navigate('/admin/products');
        } else {
          throw new Error(result.error || 'Erreur lors de la création');
        }

      } catch (error) {
        console.error('❌ [SUBMIT] Erreur lors de la création du produit:', error);
        toast.error(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
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
    // 🔧 Pour les autocollants et tableaux, utiliser les délimitations spécifiques à l'image
    // Pour les autres produits, utiliser les délimitations centralisées
    const isSticker = formData.genre === 'AUTOCOLLANT' || formData.genre === 'TABLEAU';
    const delimitationsToShow = isSticker
      ? (image.delimitations || [])
      : getCentralizedDelimitations();

    if (!delimitationsToShow || delimitationsToShow.length === 0) return null;

    return (
      <div className="absolute inset-0">
        {delimitationsToShow.map((delim, index) => {
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
            colorVariations={colorVariationsWhiteFirst}
            onAddColorVariation={addColorVariation}
            onUpdateColorVariation={updateColorVariation}
            onRemoveColorVariation={removeColorVariation}
            onAddImageToColor={handleAddImageToColor}
            onUpdateImage={updateImage}
            onReplaceImage={handleReplaceImage}
            onSuggestedPriceChange={(price) => updateFormData('price', price)}
            genre={formData.genre}
            suggestedPrice={formData.suggestedPrice}
          />
        );
      
      case 3:
        return (
          <CategoriesStep
            sizes={formData.sizes}
            categories={formData.categories || []}
            sizePricing={formData.sizePricing}
            useGlobalPricing={formData.useGlobalPricing}
            globalCostPrice={formData.globalCostPrice}
            globalSuggestedPrice={formData.globalSuggestedPrice}
            onCategoriesUpdate={(categories: string[]) => {
              console.log('🔍 [DEBUG ProductFormMain] onCategoriesUpdate called with:', categories);
              updateFormData('categories', categories);
              console.log('🔍 [DEBUG ProductFormMain] formData.categories after update:', formData.categories);
            }}
            onSizesUpdate={(sizes: string[]) => updateFormData('sizes', sizes)}
            onSizePricingUpdate={(pricing: any[]) => updateFormData('sizePricing', pricing)}
            onUseGlobalPricingChange={(value: boolean) => {
              console.log('🔍 [DEBUG ProductFormMain] onUseGlobalPricingChange called with:', value);
              updateFormData('useGlobalPricing', value);
            }}
          />
        );

      case 4:
        // Si le produit ne nécessite pas de stock, cette étape est ignorée
        if (formData.requiresStock === false) {
          return null;
        }
        return (
          <StockStep
            sizes={formData.sizes}
            colorVariations={formData.colorVariations}
            onStockChange={(colorIndex: number, stock: { [size: string]: number }) => {
              // Mettre à jour le stock pour une colorVariation spécifique
              const updatedVariations = [...formData.colorVariations];
              updatedVariations[colorIndex] = {
                ...updatedVariations[colorIndex],
                stock: stock
              };
              updateFormData('colorVariations', updatedVariations);
            }}
          />
        );

      case 5:
        return (
          <DelimitationsStep
            colorVariations={colorVariationsWhiteFirst}
            designsByImageId={designsByImageId}
            canvasRefs={canvasRefs}
            onDelimitationUpdate={(colorVariations) => updateFormData('colorVariations', colorVariations)}
            onDesignUpload={handleDesignUpload}
            onDesignReplace={handleDesignReplace}
            onDesignRemove={handleDesignRemove}
            onOpenDuplicator={handleOpenDuplicator}
            onExportFinalImage={handleExportFinalImage}
            genre={formData.genre}
          />
        );

      case 6:
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
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="w-full px-6 lg:px-8">
        {/* En-tête moderne */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                🎨 Ajouter un produit
              </h1>
            </div>
          </div>
        </motion.div>

        {/* Indicateur d'étapes simplifié */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <React.Fragment key={step.id}>
                  <div className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all
                    ${isActive
                      ? 'bg-[rgb(20,104,154)] text-white'
                      : isCompleted
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    <span className="font-semibold">{index + 1}.</span>
                    <span className="text-sm font-medium">{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="text-gray-300">→</div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Contenu de l'étape */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="mb-6"
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
                <AdminButton
                  variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1 || loading}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Précédent</span>
                </AdminButton>

          {currentStep < 6 ? (
                <AdminButton
              onClick={nextStep}
                  disabled={loading}
              variant="primary"
            >
              <span>Suivant</span>
              <ArrowRight className="h-4 w-4" />
            </AdminButton>
          ) : (
            <div className="flex items-center gap-3">
              <AdminButton
                variant="outline"
                onClick={handlePreview}
                disabled={!formStats.isComplete}
              >
                <Eye className="h-4 w-4" />
                <span>Prévisualiser</span>
                </AdminButton>

                <AdminButton
                  onClick={handleSubmit}
                  disabled={loading || !formStats.isComplete}
                variant="primary"
                className="!bg-green-600 hover:!bg-green-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Validation...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Valider le produit</span>
                  </>
                )}
                </AdminButton>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
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
                
                {colorVariationsWhiteFirst.map((color) => (
                  <div key={color.id} className="border border-gray-200 rounded-xl p-6 bg-white">
                    <div className="flex items-center gap-3 mb-6">
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-gray-300"
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
                          const isSticker = formData.genre === 'AUTOCOLLANT' || formData.genre === 'TABLEAU';

                          return (
                          <div key={image.id} className="relative group">
                              <div
                                id={imageId}
                                className={`relative rounded-xl overflow-hidden border border-gray-200 shadow-sm ${
                                  isSticker ? 'max-h-96' : 'aspect-square'
                                }`}
                              >
                              <img
                                src={image.url}
                                alt={`${color.name} - Image ${imageIndex + 1}`}
                                className={`w-full ${
                                  isSticker ? 'h-auto object-contain' : 'h-full object-cover'
                                }`}
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
                                const isSticker = formData.genre === 'AUTOCOLLANT' || formData.genre === 'TABLEAU';
                                const delimitationsCount = isSticker
                                  ? (image.delimitations?.length || 0)
                                  : (getCentralizedDelimitations()?.length || 0);

                                return delimitationsCount > 0 ? (
                                  <div className="mt-2 text-center">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                                      <Layers className="h-3 w-3" />
                                      {delimitationsCount} zone{delimitationsCount > 1 ? 's' : ''}
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
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
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