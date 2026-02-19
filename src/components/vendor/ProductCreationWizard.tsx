import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ChevronRight,
  ChevronLeft,
  Package,
  Image as ImageIcon,
  Info,
  Settings,
  Upload,
  Check,
  Eye,
  DollarSign,
  FileText,
  Palette,
  Search,
  Filter,
  Heart
} from 'lucide-react';
import Button from '../ui/Button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { useWizardProductUpload, WizardCalculations, type WizardProductData, type WizardImages } from '../../hooks/useWizardProductUpload';
import { API_CONFIG } from '../../config/api';
import { designCategoryService, DesignCategory } from '../../services/designCategoryService';
import commissionService from '../../services/commissionService';
import { useAuth } from '../../contexts/AuthContext';

// Types pour les étapes du workflow
interface MockupProduct {
  id: number;
  name: string;
  description: string;
  price: number; // Prix de revient (coût de production)
  suggestedPrice?: number; // Prix suggéré pour la vente
  genre: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE';
  categories: Array<{
    id: number;
    name: string;
  }>;
  colorVariations: Array<{
    id: number;
    name: string;
    colorCode: string;
    images: Array<{
      id: number;
      url: string;
      viewType: string;
    }>;
  }>;
  sizes: Array<{
    id: number;
    sizeName: string;
  }>;
}

interface ProductFormData {
  selectedMockup: MockupProduct | null;
  productName: string;
  productPrice: number;
  basePrice: number; // Prix de revient du mockup
  productDescription: string;
  vendorProfit: number; // Bénéfice du vendeur
  expectedRevenue: number;
  selectedTheme: string;
  selectedColors: Array<{ id: number; name: string; colorCode: string }>;
  selectedSizes: Array<{ id: number; sizeName: string }>;
  productImages: File[];
  imageColumns: File[][];
  isPriceCustomized: boolean;
}

interface ProductCreationWizardProps {
  onCancel?: () => void;
  onSuccess?: (productId: number) => void;
}

const STEPS = [
  { id: 1, title: 'Sélection Mockup', icon: Package, description: 'Choisir le mockup produit' },
  { id: 2, title: 'Informations', icon: Info, description: 'Nom, prix, description' },
  { id: 3, title: 'Détails', icon: Settings, description: 'Thème, couleurs, tailles' },
  { id: 4, title: 'Upload Images', icon: Upload, description: 'Télécharger vos images' },
  { id: 5, title: 'Prévisualisation', icon: Eye, description: 'Valider et créer' }
];

// Les thèmes seront chargés depuis les catégories de design

export const ProductCreationWizard: React.FC<ProductCreationWizardProps> = ({
  onCancel,
  onSuccess
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadProduct, loading: uploadLoading, error: uploadError, progress, validateWizardData } = useWizardProductUpload();
  const { isAuthenticated, user } = useAuth();

  // État du wizard
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Données du formulaire
  const [formData, setFormData] = useState<ProductFormData>({
    selectedMockup: null,
    productName: '',
    productPrice: 0,
    basePrice: 0,
    productDescription: '',
    vendorProfit: 0,
    expectedRevenue: 0,
    selectedTheme: '',
    selectedColors: [],
    selectedSizes: [],
    productImages: [],
    imageColumns: [[], [], [], []], // Max 4 colonnes
    isPriceCustomized: false
  });

  // État pour l'étape 1 - Sélection mockups
  const [mockups, setMockups] = useState<MockupProduct[]>([]);
  const [filteredMockups, setFilteredMockups] = useState<MockupProduct[]>([]);
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [mockupsLoading, setMockupsLoading] = useState(false);

  // État pour l'étape 3 - Catégories de design (affichées comme "thèmes")
  const [designCategories, setDesignCategories] = useState<DesignCategory[]>([]);
  const [designCategoriesLoading, setDesignCategoriesLoading] = useState(false);

  // États pour la commission du vendeur (comme dans SellDesignPage)
  const [vendorCommission, setVendorCommission] = useState<number | null>(null);
  const [commissionLoading, setCommissionLoading] = useState(false);

  // Charger les mockups disponibles et les catégories de design
  React.useEffect(() => {
    loadMockups();
    loadDesignCategories();
  }, []);

  // Charger la commission du vendeur (comme dans SellDesignPage) - séparé pour auth
  React.useEffect(() => {
    const loadVendorCommission = async () => {
      if (isAuthenticated && user?.role === 'VENDEUR') {
        setCommissionLoading(true);
        try {
          const commission = await commissionService.getMyCommission();
          setVendorCommission(commission.commissionRate || 70); // Par défaut 70% comme dans le wizard

          console.log('✅ Commission vendeur chargée pour wizard:', commission);

          if (commission.isDefault) {
            console.warn('⚠️ Utilisation de la commission par défaut (70%) - Endpoint backend manquant?');
          }
        } catch (error) {
          console.error('❌ Erreur lors du chargement de la commission pour wizard:', error);
          setVendorCommission(70); // Valeur par défaut pour wizard
        } finally {
          setCommissionLoading(false);
        }
      }
    };

    loadVendorCommission();
  }, [isAuthenticated, user?.role]);

  // Filtrer les mockups
  React.useEffect(() => {
    let filtered = [...mockups];

    if (searchTerm) {
      filtered = filtered.filter(mockup =>
        mockup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mockup.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(mockup =>
        mockup.categories.some(cat => cat.name === selectedCategory)
      );
    }

    setFilteredMockups(filtered);
  }, [mockups, searchTerm, selectedCategory]);

  const loadMockups = async () => {
    setMockupsLoading(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/products?isReadyProduct=false`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des mockups');
      }

      const result = await response.json();
      const mockupData = result.data || result || [];

      console.log('🔍 Mockups chargés:', mockupData);
      console.log('🔍 Premier mockup:', mockupData[0]);
      console.log('🔍 Premier mockup ID:', mockupData[0]?.id);

      setMockups(mockupData);
      setFilteredMockups(mockupData);

      // Extraire les catégories uniques
      const allCategories = mockupData.flatMap((m: any) => m.categories || []);
      const uniqueCategories = allCategories.filter((cat: any, index: number, self: any[]) =>
        index === self.findIndex((c: any) => c.id === cat.id)
      );
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Erreur chargement mockups:', error);
      toast.error('Impossible de charger les mockups');
    } finally {
      setMockupsLoading(false);
    }
  };

  const loadDesignCategories = async () => {
    setDesignCategoriesLoading(true);
    try {
      const categories = await designCategoryService.getActiveCategories();
      setDesignCategories(categories);
    } catch (error) {
      console.error('Erreur chargement catégories design:', error);
      toast.error('Impossible de charger les catégories de design');
    } finally {
      setDesignCategoriesLoading(false);
    }
  };

  // Calculer le revenu attendu basé sur le bénéfice vendeur avec la vraie commission
  React.useEffect(() => {
    if (formData.productPrice > 0 && formData.basePrice > 0 && vendorCommission !== null) {
      const profit = Math.max(0, WizardCalculations.calculateVendorProfit(formData.productPrice, formData.basePrice));
      // Utiliser la vraie commission du vendeur au lieu du 70% codé en dur
      const vendorRate = vendorCommission / 100;
      const expectedRevenue = Math.max(0, Math.round(profit * vendorRate));
      setFormData(prev => ({
        ...prev,
        vendorProfit: profit,
        expectedRevenue
      }));
    } else {
      // Si les prix ne sont pas valides, mettre des valeurs par défaut positives
      setFormData(prev => ({
        ...prev,
        vendorProfit: 0,
        expectedRevenue: 0
      }));
    }
  }, [formData.productPrice, formData.basePrice, vendorCommission]);

  // Gérer la sélection d'un mockup et initialiser le prix
  React.useEffect(() => {
    if (formData.selectedMockup && !formData.isPriceCustomized) {
      const basePrice = formData.selectedMockup.price; // Prix de revient
      const suggestedSellingPrice = formData.selectedMockup.suggestedPrice || (basePrice * 1.1); // Prix suggéré ou minimum +10%
      const suggestedProfit = suggestedSellingPrice - basePrice;

      setFormData(prev => ({
        ...prev,
        basePrice: basePrice,
        productPrice: suggestedSellingPrice,
        vendorProfit: suggestedProfit
      }));
    }
  }, [formData.selectedMockup, formData.isPriceCustomized]);

  // Calculer le prix minimum autorisé (prix de revient + 10%)
  const getMinimumPrice = (): number => {
    return WizardCalculations.calculateMinimumPrice(formData.basePrice);
  };

  // Calculer le revenu du vendeur avec la vraie commission (comme dans SellDesignPage)
  const calculateVendorRevenue = (): number => {
    if (vendorCommission === null) return 0;
    const vendorRate = vendorCommission / 100;
    return Math.round(formData.vendorProfit * vendorRate);
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!formData.selectedMockup) {
          toast.error('Veuillez sélectionner un mockup');
          return false;
        }
        return true;
      case 2:
        if (!formData.productName.trim()) {
          toast.error('Le nom du produit est requis');
          return false;
        }
        if (formData.productPrice <= 0) {
          toast.error('Le prix doit être supérieur à 0');
          return false;
        }
        if (formData.basePrice > 0 && formData.productPrice < getMinimumPrice()) {
          toast.error(`Le prix ne peut pas être inférieur à ${getMinimumPrice()} FCFA (prix de revient + 10% minimum)`);
          return false;
        }
        if (!formData.productDescription.trim()) {
          toast.error('La description est requise');
          return false;
        }
        return true;
      case 3:
        if (!formData.selectedTheme) {
          toast.error('Veuillez sélectionner un thème design');
          return false;
        }
        // Vérifier que le thème sélectionné existe dans la liste des catégories
        const selectedThemeExists = designCategories.some(cat => cat.id.toString() === formData.selectedTheme);
        if (!selectedThemeExists) {
          toast.error('Le thème sélectionné n\'est plus disponible');
          return false;
        }
        if (formData.selectedColors.length !== 1) {
          toast.error('Veuillez sélectionner exactement une couleur du mockup');
          return false;
        }
        if (formData.selectedSizes.length === 0) {
          toast.error('Veuillez sélectionner au moins une taille du mockup');
          return false;
        }
        return true;
      case 4:
        if (formData.productImages.length === 0) {
          toast.error('Veuillez télécharger au moins une image');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;

    const files = Array.from(fileList);
    const currentImageCount = formData.productImages.length;
    const maxImages = 6; // 1 image de base + 5 images de détail

    // Vérifier la limite d'images
    if (currentImageCount + files.length > maxImages) {
      const remainingSlots = maxImages - currentImageCount;
      if (remainingSlots <= 0) {
        toast.error('Maximum 6 images autorisées (1 image principale + 5 images de détail)');
        return;
      } else {
        toast.error(`Vous ne pouvez ajouter que ${remainingSlots} image(s) de plus (maximum 6 images au total)`);
        return;
      }
    }

    // Validation des fichiers
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error('Seuls les fichiers image sont autorisés');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Les images ne doivent pas dépasser 5MB');
        return;
      }
    }

    const updatedImages = [...formData.productImages, ...files];
    setFormData(prev => ({
      ...prev,
      productImages: updatedImages
    }));

    // Organiser en colonnes (max 4 par colonne)
    organizeImagesInColumns(updatedImages);

    // Afficher un message informatif sur le nombre d'images restantes
    const remainingSlots = maxImages - updatedImages.length;
    if (remainingSlots > 0) {
      toast.success(`${files.length} image(s) ajoutée(s). Vous pouvez encore ajouter ${remainingSlots} image(s).`);
    } else {
      toast.success(`${files.length} image(s) ajoutée(s). Limite maximale atteinte (6 images).`);
    }
  };

  const organizeImagesInColumns = (images: File[]) => {
    const columns: File[][] = [[], [], [], []];
    images.forEach((image, index) => {
      const columnIndex = index % 4;
      columns[columnIndex].push(image);
    });

    setFormData(prev => ({
      ...prev,
      imageColumns: columns
    }));
  };

  const removeImage = (imageIndex: number) => {
    const newImages = formData.productImages.filter((_, index) => index !== imageIndex);
    setFormData(prev => ({
      ...prev,
      productImages: newImages
    }));
    organizeImagesInColumns(newImages);
  };

  const handleSubmit = async (action: 'TO_DRAFT' | 'TO_PUBLISHED' = 'TO_DRAFT') => {
    if (!validateCurrentStep()) return;

    // Validation supplémentaire pour s'assurer qu'un mockup est sélectionné
    if (!formData.selectedMockup) {
      toast.error('Veuillez sélectionner un mockup avant de continuer');
      return;
    }

    // Vérifier que l'ID du mockup est valide
    if (!formData.selectedMockup.id || isNaN(Number(formData.selectedMockup.id))) {
      toast.error('L\'ID du mockup sélectionné est invalide');
      console.error('Invalid mockup ID:', formData.selectedMockup);
      return;
    }

    setIsSubmitting(true);
    try {
      // Préparer les données pour l'API wizard
      const wizardData: WizardProductData = {
        selectedMockup: {
          id: formData.selectedMockup.id,
          name: formData.selectedMockup.name,
          price: formData.selectedMockup.price,
          suggestedPrice: formData.selectedMockup.suggestedPrice,
          colorVariations: formData.selectedMockup.colorVariations
        },
        productName: formData.productName,
        productDescription: formData.productDescription,
        productPrice: formData.productPrice, // Prix en FCFA (pas en centimes)
        basePrice: formData.basePrice,
        vendorProfit: formData.vendorProfit,
        expectedRevenue: formData.expectedRevenue,
        isPriceCustomized: formData.isPriceCustomized,
        selectedTheme: formData.selectedTheme,
        selectedColors: formData.selectedColors,
        selectedSizes: formData.selectedSizes,
        postValidationAction: action
      };

      // Préparer les images avec hiérarchie
      const wizardImages: WizardImages = {
        baseImage: formData.productImages[0], // Première image = image principale
        detailImages: formData.productImages.slice(1) // Autres images = détail
      };

      console.log('🔍 Debug ProductCreationWizard:');
      console.log('- formData.selectedMockup:', formData.selectedMockup);
      console.log('- formData.selectedMockup?.id:', formData.selectedMockup?.id);
      console.log('- wizardData.selectedMockup:', wizardData.selectedMockup);
      console.log('- wizardData.selectedMockup.id:', wizardData.selectedMockup.id);
      console.log('Submitting wizard data:', {
        wizardData,
        baseImageName: wizardImages.baseImage?.name,
        detailImagesCount: wizardImages.detailImages.length,
        selectedMockupId: formData.selectedMockup?.id,
        selectedMockupName: formData.selectedMockup?.name
      });

      const result = await uploadProduct(wizardData, wizardImages, vendorCommission || 70);

      if (result.success) {
        toast.success(`Produit ${action === 'TO_PUBLISHED' ? 'publié' : 'sauvegardé'} avec succès !`);
        if (onSuccess) {
          onSuccess(result.data.id);
        } else {
          navigate('/vendeur/products');
        }
      } else {
        throw new Error(result.message || 'Erreur lors de la création');
      }
    } catch (error: any) {
      console.error('Erreur création produit wizard:', error);

      // Gestion des erreurs spécifiques du backend
      if (error.message.includes('INSUFFICIENT_MARGIN')) {
        toast.error('Prix trop bas - Une marge de 10% minimum est requise');
      } else if (error.message.includes('MISSING_BASE_IMAGE')) {
        toast.error('Image principale obligatoire');
      } else if (error.message.includes('INVALID_COLORS')) {
        toast.error('Couleurs sélectionnées non disponibles pour ce mockup');
      } else if (error.message.includes('INVALID_SIZES')) {
        toast.error('Tailles sélectionnées non disponibles pour ce mockup');
      } else {
        toast.error(error.message || 'Erreur lors de la création du produit');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                isActive ? 'border-gray-900 bg-gray-900 text-white shadow-lg scale-110' :
                isCompleted ? 'border-gray-900 bg-gray-900 text-white' :
                'border-gray-300 bg-white text-gray-400 hover:border-gray-900'
              }`}>
                {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
              </div>
              {index < STEPS.length - 1 && (
                <div className={`h-0.5 w-16 mx-4 transition-colors ${
                  isCompleted ? 'bg-gray-900' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gray-900 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Étape {currentStep}: {STEPS[currentStep - 1].title}
        </h2>
        <p className="text-gray-600 text-lg">{STEPS[currentStep - 1].description}</p>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <Card className="border-gray-900 bg-white shadow-lg">
        <CardHeader className="border-b border-gray-900">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Package className="h-5 w-5" />
            Sélectionner un mockup
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un mockup..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white min-w-[150px]"
            >
              <option value="all">Toutes catégories</option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Liste des mockups */}
          {mockupsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Chargement des mockups...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {filteredMockups.map(mockup => (
                <Card
                  key={mockup.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    formData.selectedMockup?.id === mockup.id ? 'ring-2 ring-blue-600 bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    console.log('🔍 Mockup sélectionné:', mockup);
                    console.log('🔍 Mockup ID:', mockup.id);
                    setFormData(prev => ({ ...prev, selectedMockup: mockup }));
                  }}
                >
                  <CardContent className="p-4">
                    {mockup.colorVariations[0]?.images[0] && (
                      <div className="w-full h-32 bg-gray-50 rounded-md mb-3 flex items-center justify-center overflow-hidden">
                        <img
                          src={mockup.colorVariations[0].images[0].url}
                          alt={mockup.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    )}
                    <h3 className="font-semibold text-sm mb-1">{mockup.name}</h3>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{mockup.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {mockup.categories[0]?.name || 'Non défini'}
                      </Badge>
                      <div className="text-xs space-y-1">
                        <div className="font-medium text-gray-600">
                          Revient: {mockup.price.toLocaleString()} FCFA
                        </div>
                        {mockup.suggestedPrice && (
                          <div className="font-medium text-green-600">
                            Suggéré: {mockup.suggestedPrice.toLocaleString()} FCFA
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <Card className="border-gray-900 bg-white shadow-lg">
        <CardHeader className="border-b border-gray-900">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Info className="h-5 w-5" />
            Informations de base
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="productName">Nom du produit *</Label>
            <Input
              id="productName"
              value={formData.productName}
              onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
              placeholder="Ex: Mon T-shirt personnalisé"
            />
          </div>

          {/* Système de pricing avancé inspiré de SellDesignPage */}
          <div className="space-y-4">
            {formData.basePrice > 0 && (
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="text-xs text-blue-700">
                  <span className="font-medium">💡 MARGE RECOMMANDÉE:</span> Il est conseillé de vendre au minimum à prix de revient + 10%
                  <br />
                  <span className="text-blue-600">
                    Prix de revient {formData.basePrice.toLocaleString()} FCFA → Prix recommandé: {getMinimumPrice().toLocaleString()} FCFA
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Prix de vente */}
              <div className="space-y-2">
                <Label htmlFor="productPrice" className="text-sm font-medium text-blue-800">
                  {formData.isPriceCustomized ? 'Prix de vente personnalisé' : 'Prix de vente suggéré'} (FCFA) *
                </Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                    <Input
                      id="productPrice"
                      type="number"
                      step="100"
                      min={formData.basePrice > 0 ? getMinimumPrice() : 0}
                      value={formData.productPrice}
                      onChange={(e) => {
                        const newPrice = parseFloat(e.target.value) || 0;
                        const initialSuggestedPrice = formData.selectedMockup?.suggestedPrice || (formData.basePrice * 1.1);
                        const newProfit = Math.max(0, newPrice - formData.basePrice);
                        setFormData(prev => ({
                          ...prev,
                          productPrice: newPrice,
                          vendorProfit: newProfit,
                          isPriceCustomized: newPrice !== initialSuggestedPrice
                        }));
                      }}
                      placeholder={formData.basePrice > 0 ? (formData.selectedMockup?.suggestedPrice || getMinimumPrice()).toString() : "5000"}
                      className="pl-10 border-blue-300 focus:border-blue-500"
                    />
                  </div>
                  <span className="text-sm text-blue-600 font-medium">FCFA</span>
                </div>
                {formData.basePrice > 0 && formData.productPrice < getMinimumPrice() && (
                  <div className="text-xs text-red-600">
                    ⚠️ Prix inférieur au minimum recommandé ({getMinimumPrice().toLocaleString()} FCFA)
                  </div>
                )} 
              </div>

              {/* Bénéfice */}
              <div className="space-y-2">
                <Label htmlFor="vendorProfit" className="text-sm font-medium text-green-700">
                  Votre bénéfice (FCFA)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="vendorProfit"
                    type="number"
                    step="100"
                    min="0"
                    value={formData.vendorProfit}
                    onChange={(e) => {
                      const newProfit = parseFloat(e.target.value) || 0;
                      const newPrice = formData.basePrice + newProfit;
                      const initialSuggestedPrice = formData.selectedMockup?.suggestedPrice || (formData.basePrice * 1.1);
                      setFormData(prev => ({
                        ...prev,
                        vendorProfit: newProfit,
                        productPrice: newPrice,
                        isPriceCustomized: newPrice !== initialSuggestedPrice
                      }));
                    }}
                    className="border-green-300 focus:border-green-500"
                  />
                  <span className="text-sm text-green-600 font-medium">FCFA</span>
                </div>
                {formData.basePrice > 0 && (
                  <div className="text-xs text-gray-500">
                    Marge: {formData.basePrice > 0 ? ((formData.vendorProfit / formData.basePrice) * 100).toFixed(1) : 0}%
                    {formData.vendorProfit < (formData.basePrice * 0.1) && formData.basePrice > 0 && (
                      <span className="text-orange-600 ml-1">⚠️ Marge faible (moins de 10%)</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Résumé financier */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Prix de revient</div>
                <div className="font-semibold text-gray-800">
                  {formData.basePrice.toLocaleString()} FCFA
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <div className="text-xs text-blue-600 mb-1">Prix de vente</div>
                <div className="font-semibold text-blue-800">
                  {formData.productPrice.toLocaleString()} FCFA
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                <div className="text-xs text-green-600 mb-1">
                  Votre revenu {vendorCommission !== null ? `(${vendorCommission}%)` : ''}
                  {commissionLoading && <span className="animate-pulse">...</span>}
                </div>
                <div className="font-semibold text-green-700">
                  {Math.max(0, formData.expectedRevenue).toLocaleString()} FCFA
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Commission plateforme : {vendorCommission !== null ? (100 - vendorCommission) : 30}%
                </div>
                {formData.expectedRevenue < 0 && (
                  <div className="text-xs text-red-600 mt-1">
                    ⚠️ Prix de vente trop bas
                  </div>
                )}
              </div>
            </div>

            {formData.isPriceCustomized && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-xs text-purple-700 font-medium">
                  💡 Vous avez personnalisé le prix de vente
                </p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="productDescription">Description du produit *</Label>
            <Textarea
              id="productDescription"
              value={formData.productDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, productDescription: e.target.value }))}
              placeholder="Décrivez votre produit personnalisé..."
              rows={4}
            />
          </div>

          {formData.selectedMockup && (
            <Alert>
              <Package className="h-4 w-4" />
              <AlertDescription>
                Basé sur le mockup: <strong>{formData.selectedMockup.name}</strong>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <Card className="border-gray-900 bg-white shadow-lg">
        <CardHeader className="border-b border-gray-900">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Settings className="h-5 w-5" />
            Détails du produit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sélection de thème (catégories de design) */}
          <div>
            <Label className="text-base font-semibold">Thème design *</Label>
            {designCategoriesLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Chargement des thèmes...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-3">
                {designCategories.map(category => (
                  <div
                    key={category.id}
                    className={`cursor-pointer rounded-lg border-2 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] overflow-hidden ${
                      formData.selectedTheme === category.id.toString() ? 'border-blue-600 bg-blue-50 shadow-md scale-[1.02]' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, selectedTheme: category.id.toString() }))}
                  >
                    {/* Image de couverture du thème */}
                    <div className="relative h-24 bg-gray-100 flex items-center justify-center overflow-hidden">
                      {category.coverImageUrl ? (
                        <img
                          src={category.coverImageUrl}
                          alt={`Thème ${category.name}`}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            // Si l'image ne se charge pas, on affiche le fallback
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            if (target.nextElementSibling) {
                              (target.nextElementSibling as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      {/* Fallback quand pas d'image ou erreur de chargement */}
                      <div
                        className={`w-full h-full flex items-center justify-center ${category.coverImageUrl ? 'hidden' : 'flex'}`}
                        style={{ backgroundColor: category.color || '#6b7280' }}
                      >
                        {category.icon ? (
                          <span className="text-white text-2xl">{category.icon}</span>
                        ) : (
                          <Palette className="w-8 h-8 text-white" />
                        )}
                      </div>

                      {/* Badge de sélection */}
                      {formData.selectedTheme === category.id.toString() && (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>

                    {/* Informations du thème */}
                    <div className="p-3">
                      <p className="text-center text-sm font-medium text-gray-900 mb-1">{category.name}</p>
                      {category.description && (
                        <p className="text-center text-xs text-gray-400 mt-1 line-clamp-2">{category.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sélection des couleurs */}
          <div>
            <Label className="text-base font-semibold">Couleur disponible *</Label>
            <p className="text-sm text-gray-600 mt-1 mb-3">Choisissez une seule couleur pour votre produit</p>
            {formData.selectedMockup ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {formData.selectedMockup.colorVariations.map(color => {
                  const isSelected = formData.selectedColors.some(c => c.id === color.id);
                  const hasAnySelection = formData.selectedColors.length > 0;
                  const isDisabled = hasAnySelection && !isSelected;

                  return (
                    <div
                      key={color.id}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isSelected ?
                        'border-blue-600 bg-blue-50 ring-2 ring-blue-200' :
                        isDisabled ?
                        'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed' :
                        'border-gray-200 hover:border-gray-300 cursor-pointer'
                      }`}
                      onClick={() => {
                        if (isDisabled) return;

                        if (isSelected) {
                          // Déselectionner la couleur actuelle
                          setFormData(prev => ({
                            ...prev,
                            selectedColors: []
                          }));
                        } else {
                          // Sélectionner cette couleur uniquement
                          setFormData(prev => ({
                            ...prev,
                            selectedColors: [{
                              id: color.id,
                              name: color.name,
                              colorCode: color.colorCode
                            }]
                          }));
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className="w-8 h-8 rounded-full border-2 border-gray-300"
                            style={{ backgroundColor: color.colorCode }}
                          />
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                              <span className="text-xs">✓</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <span className={`text-sm font-medium ${isDisabled ? 'text-gray-400' : 'text-gray-900'}`}>
                            {color.name}
                          </span>
                          <div className={`text-xs ${isDisabled ? 'text-gray-300' : 'text-gray-500'}`}>
                            {color.images?.length || 0} image(s)
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 mt-3 text-sm italic">
                Sélectionnez d'abord un mockup pour voir les couleurs disponibles
              </p>
            )}
            {formData.selectedColors.length > 0 && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ✅ Couleur sélectionnée: <strong>{formData.selectedColors[0].name}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Sélection des tailles */}
          <div>
            <Label className="text-base font-semibold">Tailles disponibles *</Label>
            {formData.selectedMockup ? (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.selectedMockup.sizes.map(size => (
                  <Button
                    key={size.id}
                    variant={formData.selectedSizes.some(s => s.id === size.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const isSelected = formData.selectedSizes.some(s => s.id === size.id);
                      if (isSelected) {
                        setFormData(prev => ({
                          ...prev,
                          selectedSizes: prev.selectedSizes.filter(s => s.id !== size.id)
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          selectedSizes: [...prev.selectedSizes, {
                            id: size.id,
                            sizeName: size.sizeName
                          }]
                        }));
                      }
                    }}
                  >
                    {size.sizeName}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 mt-3 text-sm italic">
                Sélectionnez d'abord un mockup pour voir les tailles disponibles
              </p>
            )}
            {formData.selectedSizes.length > 0 && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ✅ {formData.selectedSizes.length} taille(s) sélectionnée(s): {formData.selectedSizes.map(s => s.sizeName).join(', ')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <Card className="border-gray-900 bg-white">
        <CardHeader className="border-b border-gray-900">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Upload className="h-5 w-5" />
            Upload de vos images
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            La première image sera votre <span className="font-semibold text-gray-900">image principale</span>, les autres seront des images de détail.
            <span className="font-semibold text-blue-600"> Maximum 6 images</span> (1 principale + 5 détail).
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Indicateur de limite d'images */}
          {formData.productImages.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  📸 Images uploadées: {formData.productImages.length}/6
                </span>
                <span className="text-xs text-blue-600">
                  {6 - formData.productImages.length > 0
                    ? `${6 - formData.productImages.length} image(s) restante(s)`
                    : 'Limite atteinte'
                  }
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(formData.productImages.length / 6) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Zone d'upload */}
          <div className={`border-2 border-dashed transition-colors rounded-lg p-8 text-center mb-6 ${
            formData.productImages.length >= 6
              ? 'border-gray-200 bg-gray-50'
              : 'border-gray-300 hover:border-gray-900'
          }`}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="space-y-4">
              <Upload className="h-16 w-16 mx-auto text-gray-400" />
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={formData.productImages.length >= 6}
                  className={`transition-colors ${
                    formData.productImages.length >= 6
                      ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                      : 'border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
                  }`}
                >
                  {formData.productImages.length >= 6 ? 'Limite atteinte (6/6)' : 'Sélectionner des images'}
                </Button>
                <p className="text-sm text-gray-500 mt-3">
                  PNG, JPG, WebP jusqu'à 5MB chacune • Maximum 6 images
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  La première image = Image principale • Les autres = Images de détail (max 5)
                </p>
              </div>
            </div>
          </div>

          {/* Affichage des images avec distinction base/détail */}
          {formData.productImages.length > 0 && (
            <div className="space-y-6">
              {/* Image principale (première) */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-900">Image principale</h3>
                  <Badge className="bg-gray-900 text-white">Base</Badge>
                </div>
                <div className="relative group max-w-xs">
                  <img
                    src={URL.createObjectURL(formData.productImages[0])}
                    alt="Image principale"
                    className="w-full h-48 object-cover rounded-lg border-2 border-gray-900 shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(0)}
                    className="absolute top-2 right-2 bg-gray-900 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-2 left-2 bg-gray-900 text-white text-xs px-2 py-1 rounded font-medium">
                    IMAGE PRINCIPALE
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Cette image sera affichée en premier et représentera votre produit
                </p>
              </div>

              {/* Images de détail */}
              {formData.productImages.length > 1 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Images de détail</h3>
                    <Badge variant="outline" className="border-gray-400 text-gray-600">Galerie</Badge>
                    <span className="text-sm text-gray-500">({formData.productImages.length - 1}/5 images)</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {formData.productImages.slice(1).map((image, index) => {
                      const globalIndex = index + 1;
                      return (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Image détail ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-300 hover:border-gray-900 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(globalIndex)}
                            className="absolute top-1 right-1 bg-gray-900 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            ×
                          </button>
                          <div className="absolute bottom-1 left-1 bg-gray-900 bg-opacity-80 text-white text-xs px-1 py-0.5 rounded">
                            {index + 2}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Ces images seront visibles dans la galerie produit lors du clic sur l'image principale
                  </p>
                </div>
              )}

              {/* Résumé */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total images:</span>
                  <span className="font-semibold text-gray-900">{formData.productImages.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">Organisation:</span>
                  <span className="font-semibold text-gray-900">
                    1 principale + {formData.productImages.length - 1} détail
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <Card className="border-gray-900 bg-white shadow-lg">
        <CardHeader className="border-b border-gray-900">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Eye className="h-5 w-5" />
            Prévisualisation et validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Erreurs de validation ou d'upload */}
          {uploadError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                <span>⚠️</span>
                <span>Erreur lors de la création</span>
              </div>
              <p className="text-red-700 text-sm">{uploadError}</p>
            </div>
          )}

          {/* Barre de progression détaillée pendant l'upload */}
          {isSubmitting && uploadLoading && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 font-medium mb-3">
                <span>🚀</span>
                <span>Création en cours...</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-blue-700">
                  <span>Progression</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-blue-600">
                  {progress < 30 && 'Validation des données...'}
                  {progress >= 30 && progress < 70 && 'Upload des images...'}
                  {progress >= 70 && progress < 95 && 'Traitement backend...'}
                  {progress >= 95 && 'Finalisation...'}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Résumé du produit */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Résumé du produit</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <strong className="text-gray-700">Nom:</strong>
                    <span className="text-gray-900 font-medium">{formData.productName}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <strong className="text-gray-700">Prix de vente:</strong>
                    <span className="text-gray-900 font-medium">{formData.productPrice.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <strong className="text-gray-700">Prix de revient:</strong>
                    <span className="text-gray-600">{formData.basePrice.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <strong className="text-gray-700">Bénéfice:</strong>
                    <span className="text-green-600 font-medium">{formData.vendorProfit.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <strong className="text-gray-700">Votre revenu (70%):</strong>
                    <span className="text-green-700 font-semibold">{formData.expectedRevenue.toLocaleString()} FCFA</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <strong className="text-gray-700">Description:</strong>
                    <p className="text-gray-600 text-sm mt-1">{formData.productDescription}</p>
                  </div>
                  <div className="flex justify-between items-start">
                    <strong className="text-gray-700">Mockup:</strong>
                    <span className="text-gray-900">{formData.selectedMockup?.name}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <strong className="text-gray-700">Thème:</strong>
                    <span className="text-gray-900">{designCategories.find(t => t.id.toString() === formData.selectedTheme)?.name || 'Non défini'}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <strong className="text-gray-700">Couleurs:</strong>
                    <div className="flex flex-wrap gap-1">
                      {formData.selectedColors.map(c => (
                        <span key={c.id} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
                          <div
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: c.colorCode }}
                          />
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-start">
                    <strong className="text-gray-700">Tailles:</strong>
                    <div className="flex flex-wrap gap-1">
                      {formData.selectedSizes.map(s => (
                        <span key={s.id} className="px-2 py-1 bg-gray-100 rounded text-xs">{s.sizeName}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-start">
                    <strong className="text-gray-700">Images:</strong>
                    <span className="text-gray-900">
                      {formData.productImages.length} image{formData.productImages.length > 1 ? 's' : ''}
                      <span className="text-xs text-gray-500 ml-1">
                        (1 principale + {formData.productImages.length - 1} détail)
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Aperçu visuel */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Aperçu visuel</h3>
              {formData.selectedMockup && (
                <div className="space-y-6">
                  {/* Image du mockup */}
                  <div className="relative">
                    <img
                      src={formData.selectedMockup.colorVariations[0]?.images[0]?.url}
                      alt={formData.selectedMockup.name}
                      className="w-full h-64 object-cover rounded-lg border border-gray-200"
                    />
                    <div className="absolute top-3 left-3 bg-gray-900 text-white px-3 py-1 rounded text-sm font-medium">
                      Mockup de base
                    </div>
                  </div>

                  {/* Image principale vs détail */}
                  {formData.productImages.length > 0 && (
                    <div>
                      <p className="font-medium mb-3 text-gray-900">Hiérarchie de vos images:</p>

                      {/* Image principale */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-900">Image principale</span>
                        </div>
                        <div className="relative inline-block">
                          <img
                            src={URL.createObjectURL(formData.productImages[0])}
                            alt="Image principale"
                            className="w-24 h-24 object-cover rounded-lg border-2 border-gray-900 shadow-md"
                          />
                          <div className="absolute -bottom-1 -right-1 bg-gray-900 text-white text-xs px-1 py-0.5 rounded font-medium">
                            BASE
                          </div>
                        </div>
                      </div>

                      {/* Images de détail */}
                      {formData.productImages.length > 1 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-900">
                              Images de détail ({formData.productImages.length - 1})
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {formData.productImages.slice(1, 5).map((image, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={URL.createObjectURL(image)}
                                  alt={`Détail ${index + 1}`}
                                  className="w-full h-16 object-cover rounded border border-gray-300"
                                />
                                <div className="absolute -bottom-1 -right-1 bg-gray-600 text-white text-xs px-1 py-0.5 rounded">
                                  {index + 2}
                                </div>
                              </div>
                            ))}
                            {formData.productImages.length > 5 && (
                              <div className="bg-gray-100 rounded flex items-center justify-center text-xs text-gray-600 h-16">
                                +{formData.productImages.length - 5}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Informations finales */}
          <div className="mt-8 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-800 font-medium mb-2">
                <Heart className="h-4 w-4" />
                <span>Prêt à créer votre produit ?</span>
              </div>
              <p className="text-blue-700 text-sm">
                Vous pouvez soit sauvegarder en brouillon pour revoir plus tard, soit publier directement pour mise en vente immédiate.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Marge bénéficiaire:</span>
                <span className="font-semibold text-gray-900">
                  {((formData.vendorProfit / formData.basePrice) * 100).toFixed(1)}%
                  {formData.vendorProfit / formData.basePrice >= 0.1 ? '✓' : '⚠️'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600">Commission plateforme:</span>
                <span className="text-gray-900">
                  {vendorCommission !== null ?
                    Math.round(formData.vendorProfit * (100 - vendorCommission) / 100).toLocaleString() :
                    WizardCalculations.calculatePlatformCommission(formData.vendorProfit).toLocaleString()
                  } FCFA ({vendorCommission !== null ? (100 - vendorCommission) : 30}%)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const getCurrentStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-screen bg-white">
      {/* Header avec fond noir */}
      <div className="bg-gray-900 text-white py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Créer vos produits</h1>
          <p className="text-gray-300">Suivez les étapes pour créer votre produit personnalisé</p>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {renderStepIndicator()}

        <div className="min-h-[600px]">
          {getCurrentStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-12 pt-8 border-t-2 border-gray-900">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? (onCancel || (() => navigate('/vendeur/products'))) : prevStep}
            disabled={isSubmitting || uploadLoading}
            className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-colors px-6 py-3"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? 'Annuler' : 'Précédent'}
          </Button>

          <div className="flex items-center gap-3">
            <div className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium">
              Étape {currentStep} sur {STEPS.length}
            </div>
            {/* Barre de progression d'upload */}
            {isSubmitting && uploadLoading && (
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">{progress}%</span>
              </div>
            )}
          </div>

          {currentStep < STEPS.length ? (
            <Button
              onClick={nextStep}
              disabled={isSubmitting}
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3"
            >
              Suivant
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                onClick={() => handleSubmit('TO_DRAFT')}
                disabled={isSubmitting}
                variant="outline"
                className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white px-6 py-3"
              >
                {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder en brouillon'}
              </Button>
              <Button
                onClick={() => handleSubmit('TO_PUBLISHED')}
                disabled={isSubmitting}
                className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3"
              >
                {isSubmitting ? 'Publication...' : 'Publier directement'}
                <Check className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};