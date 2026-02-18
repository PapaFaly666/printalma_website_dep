import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
  Plus,
  Upload,
  FileText,
  Settings,
  Target,
  Ruler,
  ChevronLeft,
  ChevronRight,
  Move,
  RotateCw,
  Maximize2,
  Minimize2,
  Square,
  Check
} from 'lucide-react';
import { fabric } from 'fabric';
import Button from '../../components/ui/Button';
import { AdminButton } from '../../components/admin/AdminButton';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { ProductFormFields } from '../../components/product-form/ProductFormFields';
import { ColorVariationsPanel } from '../../components/product-form/ColorVariationsPanel';
import { CategoriesAndSizesPanel, CategoryPricing } from '../../components/product-form/CategoriesAndSizesPanel';
import { ProductImage } from '../../types/product';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useCategories } from '../../contexts/CategoryContext';
import { apiPost, is404Error } from '../../utils/apiHelpers';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ProductViewWithDesign } from '../../components/product-view/ProductViewWithDesign';
import { Label } from '../../components/ui/label';
import { GenreBadge } from '../../components/ui/genre-badge';

// Types pour les produits et designs
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  status: string;
  isReadyProduct: boolean;
  categories: Array<{
    id: number;
    name: string;
    description: string | null;
  }>;
  colorVariations: Array<{
    id: number;
    name: string;
    colorCode: string;
    productId: number;
    images: Array<{
      id: number;
      view: string;
      url: string;
      publicId: string;
      naturalWidth: number | null;
      naturalHeight: number | null;
      delimitations?: Array<{
        id: number;
        x: number;
        y: number;
        width: number;
        height: number;
        coordinateType: string;
      }>;
    }>;
  }>;
  sizes: Array<{
    id: number;
    productId: number;
    sizeName: string;
  }>;
  createdAt: string;
  updatedAt: string;
  delimitations?: Array<{
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    coordinateType: string;
  }>;
}

interface Design {
  id: number;
  name: string;
  description: string;
  price: number;
  status: string;
  url: string;
  vendorId: number;
  createdAt: string;
  updatedAt: string;
}

// Composant de sélection du mode de création
const ModeSelection: React.FC<{
  selectedMode: 'create' | 'design' | null;
  onModeSelect: (mode: 'create' | 'design') => void;
}> = ({ selectedMode, onModeSelect }) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Choisir le mode de création
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedMode === 'create'
                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : ''
            }`}
            onClick={() => onModeSelect('create')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Créer un produit prêt</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Créer un nouveau produit prêt depuis zéro
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Ajouter des informations de base</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Configurer les variations de couleur</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Définir les catégories et tailles</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedMode === 'design'
                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : ''
            }`}
            onClick={() => onModeSelect('design')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Upload className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Appliquer un design</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choisir un mockup et y appliquer un design
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Sélectionner un mockup existant</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Uploader ou choisir un design</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Positionner et ajuster le design</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

// Composants d'étapes pour les produits prêts
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
}> = ({ 
  colorVariations, 
  onAddColorVariation, 
  onUpdateColorVariation, 
  onRemoveColorVariation, 
  onAddImageToColor, 
  onUpdateImage,
  onReplaceImage
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
        />
      </CardContent>
    </Card>
  );
};

const CategoriesStep: React.FC<{
  categories: string[];
  sizes: string[];
  sizePricing?: any[];
  useGlobalPricing?: boolean;
  globalCostPrice?: number;
  globalSuggestedPrice?: number;
  onCategoriesUpdate: (categories: string[]) => void;
  onSizesUpdate: (sizes: string[]) => void;
  onSizePricingUpdate?: (pricing: any[]) => void;
}> = ({ categories, sizes, sizePricing, useGlobalPricing, globalCostPrice, globalSuggestedPrice, onCategoriesUpdate, onSizesUpdate, onSizePricingUpdate }) => {
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
          sizePricing={sizePricing}
          useGlobalPricing={useGlobalPricing}
          globalCostPrice={globalCostPrice}
          globalSuggestedPrice={globalSuggestedPrice}
          onCategoriesUpdate={onCategoriesUpdate}
          onSizesUpdate={onSizesUpdate}
          onSizePricingUpdate={onSizePricingUpdate}
        />
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
            {/* Informations du produit */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-3">Résumé du produit :</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Nom :</span>
                  <span className="font-medium">{formData.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Prix :</span>
                  <span className="font-medium">{formData.price} FCFA</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Genre :</span>
                  <GenreBadge genre={formData.genre || 'UNISEXE'} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Statut :</span>
                  <Badge variant={formData.status === 'published' ? 'default' : 'secondary'}>
                    {formData.status === 'published' ? 'Publié' : 'Brouillon'}
                  </Badge>
                </div>
              </div>
            </div>

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
                <div className="text-2xl font-bold text-purple-600">{formStats.totalCategories}</div>
                <div className="text-sm text-gray-600">Catégories</div>
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
          onClick={onPreview}
          disabled={!formStats.isComplete}
          className="flex-1"
        >
          <Eye className="h-4 w-4 mr-2" />
          Prévisualiser
        </Button>

        <Button
          onClick={onSubmit}
          disabled={loading || !formStats.isComplete}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Création...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Créer le produit prêt
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

const CreateReadyProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { categories: availableCategories } = useCategories();
  
  // États du formulaire
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedMode, setSelectedMode] = useState<'create' | 'design' | null>(null);

  // États pour le mode design
  const [mockups, setMockups] = useState<Product[]>([]);
  const [selectedMockup, setSelectedMockup] = useState<Product | null>(null);
  const [loadingMockups, setLoadingMockups] = useState(false);
  const [showDesignUpload, setShowDesignUpload] = useState(false);

  // États pour le design uploadé
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [designUrl, setDesignUrl] = useState<string>('');
  const [designName, setDesignName] = useState<string>('');
  const [designDescription, setDesignDescription] = useState<string>('');
  const [designPrice, setDesignPrice] = useState<number>(0);
  const [showDesignPriceModal, setShowDesignPriceModal] = useState(false);
  const [tempDesignFile, setTempDesignFile] = useState<File | null>(null);
  const [tempDesignUrl, setTempDesignUrl] = useState<string>('');
  const [designPriceError, setDesignPriceError] = useState<string>('');
  const [designNameError, setDesignNameError] = useState<string>('');

  // États pour les transformations
  const [designTransforms, setDesignTransforms] = useState<{
    x: number;
    y: number;
    scale: number;
    rotation: number;
  }>({ x: 0, y: 0, scale: 1, rotation: 0 });

  // Données du formulaire
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    status: 'draft' as 'draft' | 'published',
    categories: [] as string[],
    sizes: [] as string[],
    colorVariations: [] as any[],
    genre: 'UNISEXE' as 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE',
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

  // Statistiques du formulaire
  const formStats = useMemo(() => {
    const totalImages = formData.colorVariations.reduce((total, color) => total + color.images.length, 0);
    const totalColorVariations = formData.colorVariations.length;
    const totalCategories = formData.categories.length;
    
    const errors: string[] = [];
    
    if (!formData.name.trim()) errors.push('Nom du produit requis');
    if (!formData.description.trim()) errors.push('Description requise');
    // Prix retiré - validation déplacée vers sizePricing (géré dans CategoriesAndSizesPanel)
    if (formData.categories.length === 0) errors.push('Au moins une catégorie requise');
    if (formData.colorVariations.length === 0) errors.push('Au moins une variation de couleur requise');
    // Le genre a une valeur par défaut 'unisexe', donc pas besoin de validation stricte
    
    // Vérifier que chaque variation a au moins une image
    formData.colorVariations.forEach((color, index) => {
      if (!color.name.trim()) errors.push(`Variation ${index + 1}: nom requis`);
      if (color.images.length === 0) errors.push(`Variation ${index + 1}: au moins une image requise`);
    });

    return {
      totalImages,
      totalColorVariations,
      totalCategories,
      errors,
      isComplete: errors.length === 0
    };
  }, [formData]);

  // Mise à jour des données du formulaire
  const updateFormData = (field: string, value: any) => {
    console.log(`🔄 updateFormData: ${field} = ${value}`);
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
        if (formData.categories.length === 0) stepErrors.push('Au moins une catégorie requise');
        break;
    }
    
    return stepErrors;
  };

  // Navigation
  const nextStep = () => {
    const stepErrors = validateStep(currentStep);
    if (stepErrors.length > 0) {
      setErrors(stepErrors.reduce((acc, error) => ({ ...acc, [error]: error }), {}));
      return;
    }

    if (selectedMode === 'create' && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (selectedMode === 'create' && currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBackToModeSelection = () => {
    setSelectedMode(null);
    setCurrentStep(1);
    setErrors({});
    // Réinitialiser les états du mode design
    setMockups([]);
    setSelectedMockup(null);
    setLoadingMockups(false);
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!formStats.isComplete) {
      formStats.errors.forEach(error => toast.error(error));
      return;
    }

    // Vérifier qu'il y a au moins une image
    const totalImages = formData.colorVariations.reduce((total, color) => total + color.images.length, 0);
    if (totalImages === 0) {
      toast.error('Au moins une image est requise pour créer un produit');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      
      // Ajouter les données du produit
      const productDataToSend = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        stock: formData.stock,
        status: formData.status,
        categories: formData.categories,
        sizes: formData.sizes,
        isReadyProduct: true, // ← Automatiquement défini à true pour les produits prêts
        genre: formData.genre || 'UNISEXE', // ← NOUVEAU: Ajout du champ genre
        // 🆕 Prix par taille
        useGlobalPricing: formData.useGlobalPricing || false,
        globalCostPrice: formData.globalCostPrice || 0,
        globalSuggestedPrice: formData.globalSuggestedPrice || 0,
        sizePricing: formData.sizePricing || [],
        colorVariations: formData.colorVariations.map(variation => ({
          name: variation.name,
          colorCode: variation.colorCode,
          images: variation.images.map(img => ({
            fileId: img.id,
            view: img.view
          }))
        }))
      };

      // Log pour déboguer
      console.log('🔍 Données envoyées au backend:', productDataToSend);
      console.log('🔍 isReadyProduct:', productDataToSend.isReadyProduct);
      console.log('🔍 Genre:', productDataToSend.genre);
      console.log('🔍 formData.genre:', formData.genre);
      console.log('🔍 formData complet:', formData);
      console.log('🔍 productDataToSend complet:', productDataToSend);
      console.log('🔍 Genre sélectionné par l\'utilisateur:', formData.genre);
      console.log('🔍 Genre qui sera envoyé:', productDataToSend.genre);
      console.log('🔍 Vérification - genre est-il défini?', !!formData.genre);
      console.log('🔍 Vérification - genre est-il différent de UNISEXE?', formData.genre !== 'UNISEXE');

      formDataToSend.append('productData', JSON.stringify(productDataToSend));

      // Ajouter les fichiers de manière synchrone
      let fileCount = 0;
      for (const variation of formData.colorVariations) {
        for (const image of variation.images) {
          try {
            // Convertir l'URL blob en fichier
            const response = await fetch(image.url);
            const blob = await response.blob();
            const file = new File([blob], `${image.id}.jpg`, { type: 'image/jpeg' });
            formDataToSend.append(image.id, file);
            fileCount++;
          } catch (error) {
            console.error(`Erreur lors de la conversion de l'image ${image.id}:`, error);
            toast.error(`Erreur lors de la préparation de l'image ${image.id}`);
            return;
          }
        }
      }

      // Vérifier qu'au moins un fichier a été ajouté
      if (fileCount === 0) {
        toast.error('Aucune image n\'a pu être préparée pour l\'envoi');
        return;
      }

      console.log(`Envoi de ${fileCount} fichiers au serveur`);

      const result = await apiPost('https://printalma-back-dep.onrender.com/products/ready', formDataToSend);

      if (result.error) {
        if (is404Error(result.error)) {
          toast.error('L\'endpoint des produits n\'est pas encore disponible côté backend');
        } else {
          toast.error(result.error);
        }
        return;
      }

      toast.success('Produit prêt créé avec succès');
      navigate('/admin/ready-products');
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.message || 'Erreur lors de la création du produit');
    } finally {
      setLoading(false);
    }
  };

  // Réinitialisation
  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      stock: 0,
      status: 'draft',
      categories: [],
      sizes: [],
      colorVariations: [],
      genre: 'UNISEXE',
      useGlobalPricing: false,
      globalCostPrice: 0,
      globalSuggestedPrice: 0,
      sizePricing: []
    });
    setCurrentStep(1);
    setErrors({});
    toast.success('Formulaire réinitialisé');
  };

  // Prévisualisation
  const handlePreview = () => {
    setShowPreview(true);
  };

  // Fonctions pour le mode design
  const fetchMockups = async () => {
    // Éviter les appels multiples
    if (loadingMockups) {
      console.log('⚠️ Chargement déjà en cours, ignoré');
      return;
    }
    
    try {
      setLoadingMockups(true);
      console.log('🔍 Chargement des mockups (isReadyProduct: false)...');
      
      // Utiliser l'URL complète avec le préfixe /api et filtrer par isReadyProduct=false
      const response = await fetch('/api/products?isReadyProduct=false');
      console.log('📡 Réponse API mockups:', response);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📦 Données mockups reçues:', data);
      
      let mockupsData: Product[] = [];
      
      if (Array.isArray(data)) {
        mockupsData = data;
      } else if (data && Array.isArray(data.data)) {
        mockupsData = data.data;
      } else {
        console.warn('⚠️ Format de réponse inattendu:', data);
        setMockups([]);
        toast.error('Format de réponse inattendu pour les mockups');
        return;
      }
      
      // Filtrer côté client pour s'assurer qu'on n'a que des produits avec isReadyProduct: false
      const filteredMockups = mockupsData.filter(product => product.isReadyProduct === false);
      console.log('🔍 Mockups filtrés (isReadyProduct: false):', filteredMockups.length);
      console.log('📋 Détails des mockups:', filteredMockups.map(p => ({ 
        id: p.id, 
        name: p.name, 
        isReadyProduct: p.isReadyProduct 
      })));
      
      setMockups(filteredMockups);
      console.log('✅ Mockups chargés avec succès:', filteredMockups.length);
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des mockups:', error);
      
      // Afficher plus de détails sur l'erreur
      if (error instanceof Error) {
        console.error('Message d\'erreur:', error.message);
        console.error('Stack trace:', error.stack);
      }
      
      toast.error('Erreur lors du chargement des mockups');
      setMockups([]);
    } finally {
      setLoadingMockups(false);
    }
  };

  // Fonction pour gérer l'upload de design
  const handleDesignFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error('Type de fichier non supporté. Veuillez sélectionner un fichier image (PNG, JPG, SVG).');
      return;
    }
    
    // Traitement du fichier
    setTempDesignFile(file);
    const objectUrl = URL.createObjectURL(file);
    setTempDesignUrl(objectUrl);
    
    toast.success('📁 Design importé avec succès');
    
    // Ouvrir le modal pour demander les informations du design
    setDesignPrice(0);
    setDesignName(file.name.replace(/\.[^/.]+$/, "")); // Nom du fichier sans extension
    setDesignDescription('');
    setDesignPriceError('');
    setDesignNameError('');
    setShowDesignPriceModal(true);
  };

  // Fonction pour confirmer le prix et charger les mockups
  const handleConfirmDesignPrice = async () => {
    // Reset des erreurs
    setDesignPriceError('');
    setDesignNameError('');

    // Validation du nom
    if (!designName.trim()) {
      setDesignNameError('Veuillez entrer un nom pour votre design');
      return;
    }

    if (designName.trim().length < 3) {
      setDesignNameError('Le nom doit contenir au moins 3 caractères');
      return;
    }

    // Validation du prix
    if (!designPrice || designPrice <= 0) {
      setDesignPriceError('Veuillez entrer un prix valide pour votre design');
      return;
    }

    // On masque le modal et indique le chargement
    setShowDesignPriceModal(false);
    setLoading(true);

    try {
      // Simuler la création du design (pour l'admin, on peut directement utiliser le fichier)
      if (tempDesignFile) {
        // Pour l'admin, on peut directement utiliser le fichier sans passer par le backend
        setDesignFile(tempDesignFile);
        setDesignUrl(tempDesignUrl);
        setDesignName(designName.trim());
        setDesignDescription(designDescription);
        setDesignPrice(designPrice);
        
        toast.success('Design configuré avec succès. Chargement des mockups...');
        
        // Charger les mockups après avoir configuré le design
        await fetchMockups();
      }
    } catch (error) {
      console.error('❌ Erreur lors de la configuration du design:', error);
      toast.error('Erreur lors de la configuration du design');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour annuler la configuration du design
  const handleCancelDesignPrice = () => {
    setShowDesignPriceModal(false);
    setTempDesignFile(null);
    setTempDesignUrl('');
    setDesignName('');
    setDesignDescription('');
    setDesignPrice(0);
    setDesignPriceError('');
    setDesignNameError('');
    toast.info('Configuration du design annulée');
  };

  // Composant pour la sélection de mockup
  const MockupSelection: React.FC = React.memo(() => {
    const handleMockupSelect = useCallback((mockup: Product) => {
      setSelectedMockup(mockup);
    }, []);

    useEffect(() => {
      // Ne charger les mockups que si on n'en a pas déjà et qu'on est en mode design
      if (selectedMode === 'design' && mockups.length === 0 && !loadingMockups) {
        fetchMockups();
      }
    }, [selectedMode]); // Dépendance sur selectedMode

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Sélectionner un mockup
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMockups ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Chargement des mockups...</p>
            </div>
          ) : mockups.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Aucun mockup disponible
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Aucun produit avec <code className="bg-gray-100 px-1 rounded">isReadyProduct: false</code> n'a été trouvé.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>Pour utiliser cette fonctionnalité, vous devez d'abord :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Créer des produits avec <code className="bg-gray-100 px-1 rounded">isReadyProduct: false</code></li>
                  <li>Ou utiliser le mode "Créer un produit prêt" à la place</li>
                </ul>
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Note :</strong> Les mockups sont des produits de base (isReadyProduct: false) 
                    sur lesquels on peut appliquer des designs pour créer des produits prêts.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleBackToModeSelection}
                className="mt-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au choix de mode
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {mockups.length} mockup{mockups.length > 1 ? 's' : ''} disponible{mockups.length > 1 ? 's' : ''}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockups.map((mockup) => (
                  <div
                    key={mockup.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedMockup?.id === mockup.id
                        ? 'ring-2 ring-gray-900 bg-gray-100 dark:ring-white dark:bg-gray-800'
                        : ''
                    }`}
                    onClick={() => handleMockupSelect(mockup)}
                  >
                    <MockupCardWithColorSlider mockup={mockup} />
                    
                    {/* Affichage des tailles */}
                    {mockup.sizes && mockup.sizes.length > 0 && (
                      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-1 mb-1">
                          <Ruler className="w-3 h-3 text-gray-500" />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Tailles disponibles:
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {mockup.sizes.slice(0, 4).map((size, index) => (
                            <Badge 
                              key={size.id} 
                              variant="outline" 
                              className="text-xs px-2 py-1"
                            >
                              {size.sizeName}
                            </Badge>
                          ))}
                          {mockup.sizes.length > 4 && (
                            <Badge 
                              variant="outline" 
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-700"
                            >
                              +{mockup.sizes.length - 4} autres
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  });

  // Composant modal séparé pour éviter les re-renders
  const DesignUploadModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onUpload: (designData: { name: string; description: string; price: number; file: File; url: string }) => void;
  }> = React.memo(({ isOpen, onClose, onUpload }) => {
    const [designName, setDesignName] = useState('');
    const [designDescription, setDesignDescription] = useState('');
    const [designPrice, setDesignPrice] = useState(0);
    const [designFile, setDesignFile] = useState<File | null>(null);
    const [designUrl, setDesignUrl] = useState<string>('');

    const handleDesignNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setDesignName(e.target.value);
    }, []);

    const handleDesignDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setDesignDescription(e.target.value);
    }, []);

    const handleDesignPriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setDesignPrice(parseInt(e.target.value) || 0);
    }, []);

    const handleDesignFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setDesignFile(file);
        const url = URL.createObjectURL(file);
        setDesignUrl(url);
      }
    }, []);

    const handleUpload = useCallback(() => {
      if (!designFile || !designName.trim()) {
        toast.error('Veuillez sélectionner un fichier et donner un nom au design');
        return;
      }

      onUpload({
        name: designName,
        description: designDescription,
        price: designPrice,
        file: designFile,
        url: designUrl
      });

      // Reset form
      setDesignName('');
      setDesignDescription('');
      setDesignPrice(0);
      setDesignFile(null);
      setDesignUrl('');
      onClose();
    }, [designFile, designName, designDescription, designPrice, designUrl, onUpload, onClose]);

    const handleCancel = useCallback(() => {
      // Reset form
      setDesignName('');
      setDesignDescription('');
      setDesignPrice(0);
      setDesignFile(null);
      setDesignUrl('');
      onClose();
    }, [onClose]);

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Uploader un design</DialogTitle>
            <DialogDescription>
              Sélectionnez un fichier d'image pour appliquer un design à votre mockup.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom du design
              </label>
              <Input
                value={designName}
                onChange={handleDesignNameChange}
                placeholder="Nom du design"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <Textarea
                value={designDescription}
                onChange={handleDesignDescriptionChange}
                placeholder="Description du design"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prix du design (en centimes)
              </label>
              <Input
                type="number"
                value={designPrice}
                onChange={handleDesignPriceChange}
                placeholder="2500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fichier design
              </label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleDesignFileChange}
                className="cursor-pointer"
              />
            </div>
            {designUrl && (
              <div className="mt-4">
                <img
                  src={designUrl}
                  alt="Aperçu du design"
                  className="w-full h-32 object-contain border rounded-lg"
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={!designFile || !designName.trim()}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Positionner le design
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  });

  // Composant pour la sélection de mockup avec slider
  const MockupCardWithColorSlider: React.FC<{ mockup: Product }> = React.memo(({ mockup }) => {
    const [currentColorIndex, setCurrentColorIndex] = useState(0);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const currentColor = mockup.colorVariations?.[currentColorIndex];
    const currentImage = currentColor?.images?.[currentImageIndex];

    const handleNextColor = useCallback(() => {
      setCurrentColorIndex((prev) => (prev + 1) % mockup.colorVariations.length);
      setCurrentImageIndex(0);
    }, [mockup.colorVariations.length]);

    const handlePrevColor = useCallback(() => {
      setCurrentColorIndex((prev) => (prev - 1 + mockup.colorVariations.length) % mockup.colorVariations.length);
      setCurrentImageIndex(0);
    }, [mockup.colorVariations.length]);

    const handleNextImage = useCallback(() => {
      if (currentColor?.images.length > 1) {
        setCurrentImageIndex((prev) => (prev + 1) % currentColor.images.length);
      }
    }, [currentColor?.images.length]);

    const handlePrevImage = useCallback(() => {
      if (currentColor?.images.length > 1) {
        setCurrentImageIndex((prev) => (prev - 1 + currentColor.images.length) % currentColor.images.length);
      }
    }, [currentColor?.images.length]);

    const handleColorSelect = useCallback((index: number) => {
      setCurrentColorIndex(index);
      setCurrentImageIndex(0);
    }, []);

    return (
      <Card className="relative group">
        <CardContent className="p-4">
          {/* Image principale avec navigation */}
          <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 mb-3">
            {currentImage ? (
              <img
                src={currentImage.url}
                alt={`${mockup.name} - ${currentColor?.name || 'Couleur'}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
            )}
            
            {/* Navigation des images */}
            {currentColor?.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Navigation des couleurs */}
          {mockup.colorVariations.length > 1 && (
            <div className="flex justify-center mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevColor();
                  }}
                  className="w-6 h-6 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full flex items-center justify-center transition-all"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                
                <div className="flex gap-1">
                  {mockup.colorVariations.map((color, index) => (
                    <button
                      key={`color-${color.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleColorSelect(index);
                      }}
                      className={`w-4 h-4 rounded-full border-2 transition-all ${
                        index === currentColorIndex 
                          ? 'border-gray-900 scale-110' 
                          : 'border-gray-300 hover:border-gray-600'
                      }`}
                      style={{ backgroundColor: color.colorCode }}
                      title={color.name}
                    />
                  ))}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextColor();
                  }}
                  className="w-6 h-6 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full flex items-center justify-center transition-all"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Informations du mockup */}
          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
            {mockup.name}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {mockup.description}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <Badge variant="outline" className="text-xs">
              Mockup
            </Badge>
            <span className="text-sm text-gray-500">
              {mockup.colorVariations?.length || 0} couleurs
            </span>
          </div>
          
          <div className="mt-2 text-xs text-gray-500">
            <p>ID: {mockup.id} • isReadyProduct: {mockup.isReadyProduct ? 'true' : 'false'}</p>
          </div>

          {/* Informations supplémentaires */}
          <div className="text-xs text-gray-500 space-y-1 mt-2">
            {mockup.colorVariations && mockup.colorVariations.length > 0 && (
              <div className="flex items-center gap-1">
                <Palette className="w-3 h-3" />
                <span className="font-medium">Couleurs:</span> {mockup.colorVariations.length}
              </div>
            )}
            {mockup.sizes && mockup.sizes.length > 0 && (
              <div className="flex items-center gap-1">
                <Ruler className="w-3 h-3" />
                <span className="font-medium">Tailles:</span> {mockup.sizes.length}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  });

  // Composant pour la sélection de mockup avec design incorporé
  const MockupCardWithDesign: React.FC<{ mockup: Product; designUrl: string }> = React.memo(({ mockup, designUrl }) => {
    // Créer une vue pour le mockup avec ses vraies délimitations
    const createViewFromMockup = (mockup: Product) => {
      const firstImage = mockup.colorVariations?.[0]?.images?.[0];
      if (!firstImage) return null;

      // Utiliser les vraies délimitations du mockup si elles existent
      const mockupDelimitations = firstImage.delimitations || mockup.delimitations || [];
      
      // Si pas de délimitations, créer une par défaut
      const delimitations = mockupDelimitations.length > 0 ? mockupDelimitations : [
        {
          id: 1,
          x: 50, // 50% du centre
          y: 50, // 50% du centre
          width: 30, // 30% de la largeur
          height: 30, // 30% de la hauteur
          coordinateType: 'PERCENTAGE'
        }
      ];

      return {
        id: firstImage.id,
        url: firstImage.url,
        imageUrl: firstImage.url,
        viewType: 'FRONT',
        width: firstImage.naturalWidth,
        height: firstImage.naturalHeight,
        naturalWidth: firstImage.naturalWidth,
        naturalHeight: firstImage.naturalHeight,
        delimitations: delimitations
      };
    };

    const view = createViewFromMockup(mockup);

    return (
      <Card className="relative group">
        <CardContent className="p-4">
          {/* Titre du mockup */}
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            {mockup.name}
          </h4>
          
          {/* Zone de positionnement du design */}
          <div className="relative w-full h-80 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 mb-3">
            {view && designUrl ? (
              <div className="w-full h-full flex items-center justify-center p-4">
                <div className="relative w-full h-full bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <ProductViewWithDesign 
                    view={view} 
                    designUrl={designUrl} 
                    productId={mockup.id}
                    products={[mockup]}
                    vendorDesigns={[]}
                    isAdmin={true}
                  />
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {!view ? 'Aucune image disponible' : 'Design en cours de chargement...'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Informations du mockup */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {mockup.description}
            </p>
            
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                Mockup
              </Badge>
              <span className="text-sm text-gray-500">
                {mockup.colorVariations?.length || 0} couleurs
              </span>
            </div>
            
            <div className="text-xs text-gray-500">
              <p>ID: {mockup.id} • isReadyProduct: {mockup.isReadyProduct ? 'true' : 'false'}</p>
              {view?.delimitations && (
                <p>Délimitations: {view.delimitations.length}</p>
              )}
            </div>

            {/* Informations supplémentaires */}
            <div className="text-xs text-gray-500 space-y-1">
              {mockup.colorVariations && mockup.colorVariations.length > 0 && (
                <div className="flex items-center gap-1">
                  <Palette className="w-3 h-3" />
                  <span className="font-medium">Couleurs:</span> {mockup.colorVariations.length}
                </div>
              )}
              {mockup.sizes && mockup.sizes.length > 0 && (
                <div className="flex items-center gap-1">
                  <Ruler className="w-3 h-3" />
                  <span className="font-medium">Tailles:</span> {mockup.sizes.length}
                </div>
              )}
            </div>
          </div>

          {/* Bouton pour positionner le design */}
          <div className="mt-4">
            <Button
              onClick={() => {
                // Rediriger vers la page de positionnement avec ce mockup spécifique
                navigate('/admin/design-positioning', {
                  state: {
                    selectedMockups: [mockup],
                    designUrl,
                    designName,
                    designDescription,
                    designPrice
                  }
                });
              }}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900"
            >
              <Move className="h-4 w-4 mr-2" />
              Positionner le design
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  });

  // Rendu du contenu selon l'étape
  const renderStepContent = () => {
    // Si aucun mode n'est sélectionné, afficher la sélection du mode
    if (!selectedMode) {
      return (
        <div className="space-y-6">
          <ModeSelection
            selectedMode={selectedMode}
            onModeSelect={setSelectedMode}
          />
        </div>
      );
    }

    // Mode création de produit prêt (logique existante)
    if (selectedMode === 'create') {
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
            />
          );
        case 3:
          return (
            <CategoriesStep
              categories={formData.categories}
              sizes={formData.sizes}
              sizePricing={formData.sizePricing}
              useGlobalPricing={formData.useGlobalPricing}
              globalCostPrice={formData.globalCostPrice}
              globalSuggestedPrice={formData.globalSuggestedPrice}
              onCategoriesUpdate={(categories) => updateFormData('categories', categories)}
              onSizesUpdate={(sizes) => updateFormData('sizes', sizes)}
              onSizePricingUpdate={(pricing) => updateFormData('sizePricing', pricing)}
            />
          );
        case 4:
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
    }

    // Mode design - nouveau workflow
    if (selectedMode === 'design') {
      return (
        <div className="space-y-6">
          {/* Étape 1: Upload du design */}
          {!designUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Uploader un design
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Commencez par uploader votre design
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Sélectionnez un fichier image pour votre design, puis configurez ses informations
                    </p>
                    
                    <div className="max-w-md mx-auto">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleDesignFileChange}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Formats supportés: PNG, JPG, SVG
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Étape 2: Affichage des mockups avec design incorporé */}
          {designUrl && (
            <div className="space-y-6">
              {/* Informations sur le design */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Design configuré
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <img
                        src={designUrl}
                        alt={designName}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{designName}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{designDescription}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Prix: {(designPrice / 100).toFixed(2)}€
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Affichage des mockups avec design */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Mockups disponibles avec design incorporé
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingMockups ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
                      <p className="text-gray-600 dark:text-gray-400 mt-2">Chargement des mockups...</p>
                    </div>
                  ) : mockups.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Aucun mockup disponible
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Aucun produit avec <code className="bg-gray-100 px-1 rounded">isReadyProduct: false</code> n'a été trouvé.
                      </p>
                      <div className="space-y-2 text-sm text-gray-500">
                        <p>Pour utiliser cette fonctionnalité, vous devez d'abord :</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Créer des produits avec <code className="bg-gray-100 px-1 rounded">isReadyProduct: false</code></li>
                          <li>Ou utiliser le mode "Créer un produit prêt" à la place</li>
                        </ul>
                      </div>
                      <Button
                        onClick={handleBackToModeSelection}
                        className="mt-4"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour au choix de mode
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                      {mockups.map((mockup) => (
                        <div key={mockup.id} className="relative group">
                          <MockupCardWithDesign mockup={mockup} designUrl={designUrl} />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête moderne */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="display-title text-shimmer mb-2">
                🎨 Créer un produit prêt
              </h1>
              <p className="text-readable">
                Processus guidé pour créer un produit prêt à l'emploi sans délimitations
              </p>
            </div>

            <Button
              variant="outline"
              onClick={handleReset}
              className="border-gray-300 dark:border-gray-600"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
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
          className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-4">
            {selectedMode ? (
              <Button
                variant="outline"
                onClick={handleBackToModeSelection}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Changer de mode
              </Button>
            ) : null}
            
            {selectedMode === 'create' && currentStep > 1 ? (
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>
            ) : null}
          </div>

          <div className="flex items-center gap-4">
            {selectedMode === 'create' && currentStep < 4 ? (
              <Button
                onClick={nextStep}
                disabled={loading}
                className="bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900"
              >
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : null}
            
            {selectedMode === 'design' && selectedMockup && (
              <Button
                onClick={() => {
                  // Ici on pourrait rediriger vers la page de positionnement du design
                  toast.success('Redirection vers la page de positionnement du design...');
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                Positionner le design
              </Button>
            )}
          </div>
        </motion.div>
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
                <h4 className="product-title mb-2">Genre</h4>
                <GenreBadge genre={formData.genre || 'UNISEXE'} />
              </div>
              <div>
                <h4 className="product-title mb-2">Catégories</h4>
                <p className="product-description">
                  {formData.categories.length > 0 ? formData.categories.join(', ') : 'Aucune'}
                </p>
              </div>
              <div>
                <h4 className="product-title mb-2">Statut</h4>
                <Badge variant={formData.status === 'published' ? 'default' : 'secondary'}>
                  {formData.status === 'published' ? 'Publié' : 'Brouillon'}
                </Badge>
              </div>
              <div>
                <h4 className="product-title mb-2">Tailles</h4>
                <p className="product-description">
                  {formData.sizes.length > 0 ? formData.sizes.join(', ') : 'Aucune'}
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

          {/* Modal pour configurer le design */}
          <Dialog open={showDesignPriceModal} onOpenChange={setShowDesignPriceModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Configurer le design</DialogTitle>
                <DialogDescription>
                  Entrez les informations de votre design pour continuer.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {tempDesignUrl && (
                  <div className="text-center">
                    <img
                      src={tempDesignUrl}
                      alt="Aperçu du design"
                      className="w-full h-32 object-contain border rounded-lg"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="design-name">Nom du design</Label>
                  <Input
                    id="design-name"
                    value={designName}
                    onChange={(e) => setDesignName(e.target.value)}
                    placeholder="Nom du design"
                  />
                  {designNameError && (
                    <p className="text-sm text-red-600 mt-1">{designNameError}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="design-description">Description</Label>
                  <Textarea
                    id="design-description"
                    value={designDescription}
                    onChange={(e) => setDesignDescription(e.target.value)}
                    placeholder="Description du design"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="design-price">Prix du design (en centimes)</Label>
                  <Input
                    id="design-price"
                    type="number"
                    value={designPrice}
                    onChange={(e) => setDesignPrice(parseInt(e.target.value) || 0)}
                    placeholder="2500"
                  />
                  {designPriceError && (
                    <p className="text-sm text-red-600 mt-1">{designPriceError}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleConfirmDesignPrice}
                    disabled={!designName.trim() || !designPrice}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Confirmer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelDesignPrice}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
    </div>
  );
};

export default CreateReadyProductPage; 