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
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { useVendorProductsWithDeduplication } from '../../hooks/useVendorProductsWithDeduplication';
import { API_CONFIG } from '../../config/api';
import { designCategoryService, DesignCategory } from '../../services/designCategoryService';

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
  const { createProduct, loading } = useVendorProductsWithDeduplication();

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

  // Charger les mockups disponibles et les catégories de design
  React.useEffect(() => {
    loadMockups();
    loadDesignCategories();
  }, []);

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

  // Calculer le revenu attendu basé sur le bénéfice vendeur
  React.useEffect(() => {
    if (formData.productPrice > 0 && formData.basePrice > 0) {
      const profit = formData.productPrice - formData.basePrice;
      const expectedRevenue = Math.round(profit * 0.7); // 70% du bénéfice revient au vendeur
      setFormData(prev => ({
        ...prev,
        vendorProfit: profit,
        expectedRevenue
      }));
    }
  }, [formData.productPrice, formData.basePrice]);

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
    return Math.round(formData.basePrice * 1.1); // Prix de revient + 10% minimum
  };

  // Calculer le revenu du vendeur (70% du bénéfice comme dans SellDesignPage)
  const calculateVendorRevenue = (): number => {
    return Math.round(formData.vendorProfit * 0.7); // 70% du bénéfice revient au vendeur
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
        if (formData.selectedColors.length === 0) {
          toast.error('Veuillez sélectionner au moins une couleur du mockup');
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

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    try {
      const productData = {
        baseProductId: formData.selectedMockup!.id,
        vendorName: formData.productName,
        vendorDescription: formData.productDescription,
        vendorPrice: formData.productPrice * 100, // Convertir en centimes
        vendorStock: 100,
        selectedColors: formData.selectedColors,
        selectedSizes: formData.selectedSizes,
        theme: formData.selectedTheme,
        productImages: formData.productImages,
        postValidationAction: 'TO_DRAFT' // Par défaut en brouillon
      };

      const result = await createProduct(productData as any);

      if (result.success) {
        toast.success('Produit créé avec succès !');
        if (onSuccess) {
          onSuccess(result.productId);
        } else {
          navigate('/vendeur/products');
        }
      } else {
        throw new Error(result.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création produit:', error);
      toast.error('Erreur lors de la création du produit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                isActive ? 'border-blue-600 bg-blue-600 text-white' :
                isCompleted ? 'border-green-600 bg-green-600 text-white' :
                'border-gray-300 bg-white text-gray-500'
              }`}>
                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              {index < STEPS.length - 1 && (
                <ChevronRight className={`w-5 h-5 mx-2 ${
                  isCompleted ? 'text-green-600' : 'text-gray-300'
                }`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="mb-2">
        <Progress value={(currentStep / STEPS.length) * 100} className="h-2" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Étape {currentStep}: {STEPS[currentStep - 1].title}
        </h2>
        <p className="text-gray-600">{STEPS[currentStep - 1].description}</p>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
                  onClick={() => setFormData(prev => ({ ...prev, selectedMockup: mockup }))}
                >
                  <CardContent className="p-4">
                    {mockup.colorVariations[0]?.images[0] && (
                      <img
                        src={mockup.colorVariations[0].images[0].url}
                        alt={mockup.name}
                        className="w-full h-32 object-cover rounded-md mb-3"
                      />
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="productPrice">
                {formData.isPriceCustomized ? 'Prix de vente personnalisé' : 'Prix de vente suggéré'} (FCFA) *
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="productPrice"
                  type="number"
                  min={formData.basePrice > 0 ? getMinimumPrice() : 0}
                  value={formData.productPrice}
                  onChange={(e) => {
                    const newPrice = parseFloat(e.target.value) || 0;
                    const initialSuggestedPrice = formData.selectedMockup?.suggestedPrice || (formData.basePrice * 1.1);
                    setFormData(prev => ({
                      ...prev,
                      productPrice: newPrice,
                      isPriceCustomized: newPrice !== initialSuggestedPrice
                    }));
                  }}
                  placeholder={formData.basePrice > 0 ? (formData.selectedMockup?.suggestedPrice || getMinimumPrice()).toString() : "5000"}
                  className="pl-10"
                />
              </div>
              {formData.basePrice > 0 && (
                <div className="mt-2 space-y-1">
                  {/* Informations sur le système de prix comme SellDesignPage */}
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="text-xs text-blue-700">
                      <span className="font-medium">💡 MARGE RECOMMANDÉE:</span> Il est conseillé de vendre au minimum à prix de revient + 10%
                      <br />
                      <span className="text-blue-600">
                        Prix de revient {formData.basePrice.toLocaleString()} FCFA → Prix recommandé: {getMinimumPrice().toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Prix de revient (mockup) : {formData.basePrice.toLocaleString()} FCFA
                  </p>
                  <p className="text-xs text-gray-500">
                    Bénéfice vendeur : {formData.vendorProfit.toLocaleString()} FCFA
                  </p>
                  {formData.isPriceCustomized && (
                    <p className="text-xs text-blue-600 font-medium">
                      💡 Vous avez personnalisé le prix
                    </p>
                  )}
                </div>
              )}
            </div>
            <div>
              <Label>Votre revenu estimé (FCFA)</Label>
              <div className="p-3 bg-green-50 border border-green-200 rounded-md space-y-1">
                <div className="text-lg font-semibold text-green-700">
                  {formData.expectedRevenue.toLocaleString()} FCFA
                </div>
                <div className="text-xs text-green-600">
                  70% de votre bénéfice ({formData.vendorProfit.toLocaleString()} FCFA)
                </div>
                <div className="text-xs text-gray-500">
                  Commission plateforme : 30%
                </div>
              </div>
            </div>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
                    <div className="relative h-24 bg-gray-100">
                      {category.coverImageUrl ? (
                        <img
                          src={category.coverImageUrl}
                          alt={`Thème ${category.name}`}
                          className="w-full h-full object-cover"
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
                      <p className="text-center text-xs text-gray-500">{category.designCount} designs disponibles</p>
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
            <Label className="text-base font-semibold">Couleurs disponibles *</Label>
            {formData.selectedMockup ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {formData.selectedMockup.colorVariations.map(color => (
                  <div
                    key={color.id}
                    className={`cursor-pointer p-3 rounded-lg border-2 transition-all ${
                      formData.selectedColors.some(c => c.id === color.id) ?
                      'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      const isSelected = formData.selectedColors.some(c => c.id === color.id);
                      if (isSelected) {
                        setFormData(prev => ({
                          ...prev,
                          selectedColors: prev.selectedColors.filter(c => c.id !== color.id)
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          selectedColors: [...prev.selectedColors, {
                            id: color.id,
                            name: color.name,
                            colorCode: color.colorCode
                          }]
                        }));
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: color.colorCode }}
                      />
                      <div>
                        <span className="text-sm font-medium">{color.name}</span>
                        <div className="text-xs text-gray-500">
                          {color.images?.length || 0} image(s)
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 mt-3 text-sm italic">
                Sélectionnez d'abord un mockup pour voir les couleurs disponibles
              </p>
            )}
            {formData.selectedColors.length > 0 && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ✅ {formData.selectedColors.length} couleur(s) sélectionnée(s)
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de vos images
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Zone d'upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-6">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="space-y-3">
              <Upload className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Sélectionner des images
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  PNG, JPG, WebP jusqu'à 5MB chacune
                </p>
              </div>
            </div>
          </div>

          {/* Affichage des images organisées en colonnes */}
          {formData.productImages.length > 0 && (
            <div>
              <p className="font-semibold mb-4">
                Images téléchargées ({formData.productImages.length}) - Organisées en 4 colonnes maximum
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {formData.imageColumns.map((column, columnIndex) => (
                  <div key={columnIndex} className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-600">
                      Colonne {columnIndex + 1} ({column.length} images)
                    </h4>
                    {column.map((image, imageIndex) => {
                      const globalIndex = formData.productImages.indexOf(image);
                      return (
                        <div key={imageIndex} className="relative group">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Image ${globalIndex + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(globalIndex)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                          <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                            {image.name.substring(0, 15)}...
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Prévisualisation et validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Résumé du produit */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Résumé du produit</h3>
                <div className="space-y-3">
                  <div>
                    <strong>Nom:</strong> {formData.productName}
                  </div>
                  <div>
                    <strong>Prix:</strong> {formData.productPrice.toLocaleString()} FCFA
                  </div>
                  <div>
                    <strong>Revenu estimé:</strong> {formData.expectedRevenue.toLocaleString()} FCFA
                  </div>
                  <div>
                    <strong>Description:</strong>
                    <p className="text-gray-600 text-sm mt-1">{formData.productDescription}</p>
                  </div>
                  <div>
                    <strong>Mockup de base:</strong> {formData.selectedMockup?.name}
                  </div>
                  <div>
                    <strong>Thème:</strong> {designCategories.find(t => t.id.toString() === formData.selectedTheme)?.name || 'Non défini'}
                  </div>
                  <div>
                    <strong>Couleurs:</strong> {formData.selectedColors.map(c => c.name).join(', ')}
                  </div>
                  <div>
                    <strong>Tailles:</strong> {formData.selectedSizes.map(s => s.sizeName).join(', ')}
                  </div>
                  <div>
                    <strong>Images:</strong> {formData.productImages.length} images téléchargées
                  </div>
                </div>
              </div>
            </div>

            {/* Aperçu visuel */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Aperçu visuel</h3>
              {formData.selectedMockup && (
                <div className="space-y-4">
                  {/* Image du mockup */}
                  <div className="relative">
                    <img
                      src={formData.selectedMockup.colorVariations[0]?.images[0]?.url}
                      alt={formData.selectedMockup.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
                      Mockup de base
                    </div>
                  </div>

                  {/* Couleurs sélectionnées */}
                  <div>
                    <p className="font-medium mb-2">Couleurs disponibles:</p>
                    <div className="flex gap-2">
                      {formData.selectedColors.map(color => (
                        <div key={color.id} className="flex items-center gap-1">
                          <div
                            className="w-6 h-6 rounded-full border"
                            style={{ backgroundColor: color.colorCode }}
                          />
                          <span className="text-xs">{color.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Aperçu des images uploadées */}
                  {formData.productImages.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">Vos images:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {formData.productImages.slice(0, 4).map((image, index) => (
                          <img
                            key={index}
                            src={URL.createObjectURL(image)}
                            alt={`Aperçu ${index + 1}`}
                            className="w-full h-20 object-cover rounded"
                          />
                        ))}
                        {formData.productImages.length > 4 && (
                          <div className="bg-gray-100 rounded flex items-center justify-center text-sm text-gray-600">
                            +{formData.productImages.length - 4} autres
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <Alert className="mt-6">
            <Heart className="h-4 w-4" />
            <AlertDescription>
              Votre produit sera créé en tant que brouillon. Vous pourrez le publier après vérification.
            </AlertDescription>
          </Alert>
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
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Créer vos produits</h1>
        <p className="text-gray-600">Suivez les étapes pour créer votre produit personnalisé</p>
      </div>

      {renderStepIndicator()}

      <div className="min-h-[500px]">
        {getCurrentStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? (onCancel || (() => navigate('/vendeur/products'))) : prevStep}
          disabled={isSubmitting}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {currentStep === 1 ? 'Annuler' : 'Précédent'}
        </Button>

        <div className="text-sm text-gray-500">
          Étape {currentStep} sur {STEPS.length}
        </div>

        {currentStep < STEPS.length ? (
          <Button onClick={nextStep} disabled={isSubmitting}>
            Suivant
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Création...' : 'Créer le produit'}
            <Check className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};