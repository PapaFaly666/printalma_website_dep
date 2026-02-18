import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import Button from '../../components/ui/Button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  Package,
  Upload,
  ArrowRight,
  Check,
  ArrowLeft,
  Search,
  Loader2,
  AlertCircle,
  Save,
  CheckCircle,
  Sticker,
  Ruler,
  DollarSign,
  ShoppingCart,
  Eye,
  Sparkles,
  Target
} from 'lucide-react';

// Import des services
import designService, { Design } from '../../services/designService';
import vendorStickerService, { StickerType, StickerSurface } from '../../services/vendorStickerService';
import { useAuth } from '../../contexts/AuthContext';

interface StickerSize {
  id: string;
  name: string;
  width: number; // en cm
  height: number; // en cm
  basePrice: number; // prix de base
  costPrice: number; // prix de revient
  suggestedPrice: number; // prix de vente suggéré
  description: string;
}

interface StickerFinish {
  id: string;
  name: string;
  description: string;
  priceMultiplier: number; // multiplicateur de prix (1.0 = prix normal, 1.2 = +20%)
  imageUrl?: string;
}

interface StickerShape {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const VendorStickerPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // États principaux
  const [currentStep, setCurrentStep] = useState<'design' | 'configure' | 'preview' | 'publish'>('design');
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);

  // Configuration du sticker
  const [stickerType, setStickerType] = useState<StickerType>('autocollant');
  const [selectedSize, setSelectedSize] = useState<StickerSize | null>(null);
  const [selectedFinish, setSelectedFinish] = useState<StickerFinish | null>(null);
  const [selectedShape, setSelectedShape] = useState<StickerShape | null>(null);
  const [borderColor, setBorderColor] = useState<string>('glossy-white');
  const [quantity, setQuantity] = useState<number>(10);
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [stickerName, setStickerName] = useState('');
  const [stickerDescription, setStickerDescription] = useState('');

  // États pour les données
  const [designs, setDesigns] = useState<Design[]>([]);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // États pour les filtres
  const [designSearch, setDesignSearch] = useState('');

  // Tailles de stickers disponibles
  const stickerSizes: StickerSize[] = [
    {
      id: 'small',
      name: 'Petit',
      width: 5,
      height: 5,
      basePrice: 500,
      costPrice: 300,
      suggestedPrice: 800,
      description: '5cm x 5cm - Parfait pour ordinateur portable'
    },
    {
      id: 'medium',
      name: 'Moyen',
      width: 10,
      height: 10,
      basePrice: 1000,
      costPrice: 600,
      suggestedPrice: 1200,
      description: '10cm x 10cm - Taille standard polyvalente'
    },
    {
      id: 'large',
      name: 'Grand',
      width: 15,
      height: 15,
      basePrice: 1500,
      costPrice: 900,
      suggestedPrice: 1800,
      description: '15cm x 15cm - Grand format pour décoration'
    },
    {
      id: 'xlarge',
      name: 'Très Grand',
      width: 20,
      height: 20,
      basePrice: 2500,
      costPrice: 1500,
      suggestedPrice: 3000,
      description: '20cm x 20cm - Format XXL'
    },
    {
      id: 'custom',
      name: 'Personnalisé',
      width: 0,
      height: 0,
      basePrice: 0,
      costPrice: 0,
      suggestedPrice: 0,
      description: 'Dimensions personnalisées'
    }
  ];

  // Finitions disponibles
  const stickerFinishes: StickerFinish[] = [
    {
      id: 'matte',
      name: 'Mat',
      description: 'Finition mate élégante, anti-reflet',
      priceMultiplier: 1.0
    },
    {
      id: 'glossy',
      name: 'Brillant',
      description: 'Finition brillante éclatante',
      priceMultiplier: 1.1
    },
    {
      id: 'transparent',
      name: 'Transparent',
      description: 'Fond transparent, design visible',
      priceMultiplier: 1.3
    },
    {
      id: 'holographic',
      name: 'Holographique',
      description: 'Effet arc-en-ciel premium',
      priceMultiplier: 1.5
    },
    {
      id: 'metallic',
      name: 'Métallique',
      description: 'Effet métallisé brillant',
      priceMultiplier: 1.4
    }
  ];

  // Formes disponibles
  const stickerShapes: StickerShape[] = [
    {
      id: 'square',
      name: 'Carré',
      description: 'Forme carrée classique',
      icon: '⬜'
    },
    {
      id: 'circle',
      name: 'Rond',
      description: 'Forme circulaire',
      icon: '⭕'
    },
    {
      id: 'rectangle',
      name: 'Rectangle',
      description: 'Forme rectangulaire',
      icon: '▭'
    },
    {
      id: 'die-cut',
      name: 'Découpe personnalisée',
      description: 'Découpé selon le contour du design',
      icon: '✂️'
    }
  ];

  // Charger les designs du vendeur
  useEffect(() => {
    const loadDesigns = async () => {
      if (!user?.id) return;

      setIsLoadingDesigns(true);
      try {
        const response = await designService.getDesigns({ status: 'all', limit: 100 });
        setDesigns(response.designs || []);
      } catch (error) {
        console.error('Erreur lors du chargement des designs:', error);
        toast.error('Erreur lors du chargement de vos designs');
      } finally {
        setIsLoadingDesigns(false);
      }
    };

    loadDesigns();
  }, [user?.id]);

  // Calculer le prix total
  const calculateTotalPrice = (): number => {
    if (!selectedSize || !selectedFinish) return 0;

    // Utiliser le prix personnalisé si défini, sinon le prix suggéré
    const basePrice = customPrice > 0 ? customPrice : selectedSize.suggestedPrice;
    const finishMultiplier = selectedFinish.priceMultiplier;
    const total = basePrice * finishMultiplier;

    return total;
  };

  // Filtrer les designs
  const filteredDesigns = designs.filter(design =>
    design.name.toLowerCase().includes(designSearch.toLowerCase()) ||
    design.description?.toLowerCase().includes(designSearch.toLowerCase())
  );

  // Gérer la sélection d'un design
  const handleDesignSelect = (design: Design) => {
    setSelectedDesign(design);
    setStickerName(`Sticker ${design.name}`);
    setStickerDescription(design.description || `Sticker personnalisé avec le design ${design.name}`);
    setCurrentStep('configure');
  };

  // État pour l'image générée
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  // Gérer la publication
  const handlePublish = async () => {
    if (!selectedDesign || !selectedSize || !selectedFinish || !selectedShape) {
      toast.error('Veuillez compléter toutes les configurations');
      return;
    }

    setIsSaving(true);
    try {
      // Mapper shape vers le format API
      const shapeMapping: Record<string, 'SQUARE' | 'CIRCLE' | 'RECTANGLE' | 'DIE_CUT'> = {
        'square': 'SQUARE',
        'circle': 'CIRCLE',
        'rectangle': 'RECTANGLE',
        'die-cut': 'DIE_CUT'
      };

      // Construire le payload selon le format backend DTO
      const payload = {
        designId: typeof selectedDesign.id === 'string' ? parseInt(selectedDesign.id) : selectedDesign.id,
        name: stickerName,
        description: stickerDescription || undefined,
        size: {
          id: selectedSize.id,
          width: selectedSize.width,
          height: selectedSize.height
        },
        finish: selectedFinish.id, // matte, glossy, transparent, holographic, metallic
        shape: shapeMapping[selectedShape.id] || 'SQUARE',
        price: calculateTotalPrice(),
        stockQuantity: quantity,
        stickerType, // optionnel: autocollant | pare-chocs
        borderColor // optionnel: white, glossy-white, etc.
      };

      console.log('📦 Création du sticker via service (backend DTO format):', payload);

      const result = await vendorStickerService.createStickerProduct(payload);

      // Stocker l'URL de l'image générée
      if (result.data?.imageUrl) {
        setGeneratedImageUrl(result.data.imageUrl);
        console.log('✅ Image générée avec bordures:', result.data.imageUrl);
      }

      toast.success('Sticker publié avec succès !', {
        description: result.data?.imageUrl
          ? 'Image avec bordures générée par le serveur'
          : `Le produit "${stickerName}" a été créé`
      });

      // Rediriger vers la liste des produits
      setTimeout(() => {
        navigate('/vendeur/products');
      }, 1500);

    } catch (error: any) {
      console.error('Erreur lors de la publication:', error);
      toast.error('Erreur lors de la publication du sticker', {
        description: error.message || 'Une erreur est survenue'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Rendu des étapes
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {[
        { id: 'design', label: 'Design', icon: Sparkles },
        { id: 'configure', label: 'Configuration', icon: Ruler },
        { id: 'preview', label: 'Aperçu', icon: Eye },
        { id: 'publish', label: 'Publication', icon: CheckCircle }
      ].map((step, index) => {
        const Icon = step.icon;
        const isActive = currentStep === step.id;
        const isCompleted = ['design', 'configure', 'preview', 'publish'].indexOf(currentStep) > index;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-blue-500 text-white scale-110'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
              </div>
              <span
                className={`text-xs mt-2 font-medium ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < 3 && (
              <div
                className={`h-0.5 w-16 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                } transition-all`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  // Étape 1: Sélection du design
  const renderDesignSelection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Choisissez votre design</h2>
        <Button
          variant="outline"
          onClick={() => navigate('/vendeur/upload-design')}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Nouveau design
        </Button>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Rechercher un design..."
          value={designSearch}
          onChange={(e) => setDesignSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Grille de designs */}
      {isLoadingDesigns ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-3 text-gray-600">Chargement de vos designs...</span>
        </div>
      ) : filteredDesigns.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Sticker className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Aucun design trouvé</p>
          <Button onClick={() => navigate('/vendeur/upload-design')}>
            Créer votre premier design
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredDesigns.map((design) => (
            <Card
              key={design.id}
              className="cursor-pointer hover:shadow-lg transition-all group"
              onClick={() => handleDesignSelect(design)}
            >
              <CardContent className="p-4">
                <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                  {design.imageUrl ? (
                    <img
                      src={design.imageUrl}
                      alt={design.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sticker className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-sm truncate">{design.name}</h3>
                {design.category && (
                  <Badge variant="outline" className="mt-2">
                    {typeof design.category === 'string' ? design.category : (design.category as any).name || ''}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Étape 2: Configuration du sticker
  const renderConfiguration = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Configurez votre sticker</h2>
        <Button
          variant="outline"
          onClick={() => setCurrentStep('design')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
      </div>

      {/* Aperçu du design sélectionné */}
      {selectedDesign && (
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-white rounded-lg shadow-md flex items-center justify-center">
                <img
                  src={selectedDesign.imageUrl}
                  alt={selectedDesign.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div>
                <h3 className="font-bold text-lg">{selectedDesign.name}</h3>
                <p className="text-sm text-gray-600">{selectedDesign.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Type de sticker */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-green-500" />
              Type de sticker
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                stickerType === 'autocollant'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setStickerType('autocollant')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Autocollant</h4>
                  <p className="text-sm text-gray-600">Bordure fine personnalisable (4px)</p>
                </div>
                {stickerType === 'autocollant' && (
                  <Check className="w-5 h-5 text-green-500" />
                )}
              </div>
            </div>
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                stickerType === 'pare-chocs'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setStickerType('pare-chocs')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Pare-chocs</h4>
                  <p className="text-sm text-gray-600">Bordure blanche large (25px)</p>
                </div>
                {stickerType === 'pare-chocs' && (
                  <Check className="w-5 h-5 text-green-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Couleur de bordure (autocollants uniquement) */}
        {stickerType === 'autocollant' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                Couleur de bordure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {vendorStickerService.getAvailableBorderColors().map((border) => (
                <div
                  key={border.value}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    borderColor === border.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setBorderColor(border.value)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded border-2 border-gray-300"
                        style={{ backgroundColor: border.preview }}
                      />
                      <span className="font-semibold">{border.label}</span>
                    </div>
                    {borderColor === border.value && (
                      <Check className="w-5 h-5 text-purple-500" />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Sélection de la taille avec pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="w-5 h-5 text-blue-500" />
              Taille du sticker
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stickerSizes.map((size) => (
              <div
                key={size.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedSize?.id === size.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedSize(size)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{size.name}</h4>
                    <p className="text-sm text-gray-600">{size.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{size.suggestedPrice} FCFA</p>
                    <p className="text-xs text-gray-500">Prix suggéré</p>
                    {selectedSize?.id === size.id && (
                      <Check className="w-5 h-5 text-blue-500 ml-auto mt-1" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Configuration des prix par taille */}
        {selectedSize && selectedSize.id !== 'custom' && (
          <Card className="border-purple-200 dark:border-purple-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                Configuration des prix - {selectedSize.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Info banner */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <h5 className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                    Système de prix suggéré activé
                  </h5>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded p-3 border border-purple-100 dark:border-purple-800">
                    <div className="text-gray-600 dark:text-gray-400 mb-1">Prix de revient</div>
                    <div className="font-semibold text-gray-800 dark:text-gray-200">
                      {selectedSize.costPrice.toLocaleString()} F CFA
                    </div>
                  </div>
                  <div className="bg-purple-100/50 dark:bg-purple-900/50 rounded p-3 border border-purple-200 dark:border-purple-700">
                    <div className="text-purple-600 dark:text-purple-300 mb-1">Prix suggéré</div>
                    <div className="font-bold text-purple-800 dark:text-purple-200">
                      {selectedSize.suggestedPrice.toLocaleString()} F CFA
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-purple-700 dark:text-purple-300 bg-purple-100/50 dark:bg-purple-900/30 rounded p-2">
                  <span className="font-medium">💡 Info:</span> Ajoutez votre bénéfice au-dessus de ce prix suggéré.
                </div>
              </div>

              {/* Margin recommendation */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  <span className="font-medium">💡 MARGE RECOMMANDÉE:</span> Il est conseillé de vendre au minimum à prix de revient + 10%<br />
                  <span className="text-blue-600 dark:text-blue-400">
                    Prix de revient {selectedSize.costPrice.toLocaleString()} FCFA → Prix recommandé: {Math.round(selectedSize.costPrice * 1.1).toLocaleString()} FCFA (vous pouvez vendre moins ou plus)
                  </span>
                </div>
              </div>

              {/* Sale price input */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Prix de vente suggéré
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="100"
                    value={customPrice > 0 ? customPrice : selectedSize.suggestedPrice}
                    onChange={(e) => setCustomPrice(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">FCFA</span>
                </div>
              </div>

              {/* Profit input */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-green-700 dark:text-green-300">
                  Votre bénéfice
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="100"
                    value={customPrice > 0 ? customPrice - selectedSize.costPrice : selectedSize.suggestedPrice - selectedSize.costPrice}
                    onChange={(e) => {
                      const newProfit = Number(e.target.value);
                      setCustomPrice(selectedSize.costPrice + newProfit);
                    }}
                    className="flex-1"
                  />
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">FCFA</span>
                </div>
              </div>

              {/* Revenue summary */}
              <div className="bg-green-50 dark:bg-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                      Vos revenus par vente
                    </span>
                  </div>
                  <div className="text-lg font-bold text-green-800 dark:text-green-200">
                    {customPrice > 0
                      ? (customPrice - selectedSize.costPrice).toLocaleString()
                      : (selectedSize.suggestedPrice - selectedSize.costPrice).toLocaleString()} FCFA
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sélection de la finition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Finition
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stickerFinishes.map((finish) => (
              <div
                key={finish.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedFinish?.id === finish.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedFinish(finish)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{finish.name}</h4>
                    <p className="text-sm text-gray-600">{finish.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {finish.priceMultiplier > 1
                        ? `+${((finish.priceMultiplier - 1) * 100).toFixed(0)}%`
                        : 'Standard'}
                    </p>
                    {selectedFinish?.id === finish.id && (
                      <Check className="w-5 h-5 text-purple-500 ml-auto mt-1" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sélection de la forme */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-green-500" />
              Forme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {stickerShapes.map((shape) => (
                <div
                  key={shape.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all text-center ${
                    selectedShape?.id === shape.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedShape(shape)}
                >
                  <div className="text-3xl mb-2">{shape.icon}</div>
                  <h4 className="font-semibold text-sm">{shape.name}</h4>
                  <p className="text-xs text-gray-600 mt-1">{shape.description}</p>
                  {selectedShape?.id === shape.id && (
                    <Check className="w-5 h-5 text-green-500 mx-auto mt-2" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quantité et prix */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-yellow-500" />
              Prix et quantité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="quantity">Quantité minimum par commande</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="mt-2"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Prix par sticker:</span>
                <span className="font-bold text-lg">{calculateTotalPrice().toLocaleString()} FCFA</span>
              </div>
              <p className="text-xs text-gray-500">
                Prix de vente × finition ({selectedFinish ? (selectedFinish.priceMultiplier > 1 ? `+${((selectedFinish.priceMultiplier - 1) * 100).toFixed(0)}%` : 'Standard') : '-'})
              </p>
            </div>

            {selectedSize && (
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 border border-gray-200 dark:border-gray-700">
                  <div className="text-gray-600 dark:text-gray-400 mb-1">Prix de revient</div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200">
                    {selectedSize.costPrice.toLocaleString()} F CFA
                  </div>
                </div>
                <div className="bg-purple-100/50 dark:bg-purple-900/50 rounded p-3 border border-purple-200 dark:border-purple-700">
                  <div className="text-purple-600 dark:text-purple-300 mb-1">Prix suggéré</div>
                  <div className="font-bold text-purple-800 dark:text-purple-200">
                    {selectedSize.suggestedPrice.toLocaleString()} F CFA
                  </div>
                </div>
                <div className="bg-green-100/50 dark:bg-green-900/50 rounded p-3 border border-green-200 dark:border-green-700">
                  <div className="text-green-600 dark:text-green-300 mb-1">Votre bénéfice</div>
                  <div className="font-bold text-green-800 dark:text-green-200">
                    {(customPrice > 0
                      ? customPrice - selectedSize.costPrice
                      : selectedSize.suggestedPrice - selectedSize.costPrice
                    ).toLocaleString()} F CFA
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Nom et description */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du produit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="stickerName">Nom du sticker</Label>
            <Input
              id="stickerName"
              value={stickerName}
              onChange={(e) => setStickerName(e.target.value)}
              placeholder="Ex: Sticker Logo Entreprise"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="stickerDescription">Description</Label>
            <textarea
              id="stickerDescription"
              value={stickerDescription}
              onChange={(e) => setStickerDescription(e.target.value)}
              placeholder="Décrivez votre sticker..."
              className="mt-2 w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Boutons d'action */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep('design')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <Button
          onClick={() => setCurrentStep('preview')}
          disabled={!selectedSize || !selectedFinish || !selectedShape}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Aperçu
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  // Étape 3: Aperçu
  const renderPreview = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Aperçu de votre sticker</h2>
        <Button
          variant="outline"
          onClick={() => setCurrentStep('configure')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Modifier
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aperçu visuel */}
        <Card>
          <CardHeader>
            <CardTitle>Aperçu visuel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-square bg-gray-100 rounded-lg p-8 flex items-center justify-center">
              {selectedDesign && (
                <div className="relative max-w-full max-h-full">
                  <img
                    src={selectedDesign.imageUrl}
                    alt={stickerName}
                    className="max-w-full max-h-full object-contain"
                    style={{
                      filter: selectedFinish?.id === 'holographic'
                        ? 'hue-rotate(45deg) saturate(1.5)'
                        : selectedFinish?.id === 'metallic'
                        ? 'brightness(1.2) contrast(1.1)'
                        : 'none'
                    }}
                  />
                  {selectedFinish?.id === 'transparent' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-transparent to-gray-200 opacity-30 pointer-events-none" />
                  )}
                  {/* Aperçu de bordure */}
                  {borderColor !== 'transparent' && stickerType === 'autocollant' && (
                    <div className="absolute inset-0 border-4 border-white/40 pointer-events-none rounded-sm" />
                  )}
                </div>
              )}
            </div>
            <p className="text-center text-sm text-gray-600 mt-4">
              L'image finale avec bordures sera générée par le serveur
            </p>
          </CardContent>
        </Card>

        {/* Résumé de la configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Résumé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm text-gray-600 mb-2">Design</h4>
              <p className="font-medium">{selectedDesign?.name}</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-gray-600 mb-2">Type de sticker</h4>
              <p className="font-medium">
                {stickerType === 'autocollant' ? 'Autocollant' : 'Pare-chocs'}
              </p>
            </div>

            {stickerType === 'autocollant' && (
              <div>
                <h4 className="font-semibold text-sm text-gray-600 mb-2">Bordure</h4>
                <p className="font-medium">
                  {vendorStickerService.getAvailableBorderColors().find(b => b.value === borderColor)?.label || 'N/A'}
                </p>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-sm text-gray-600 mb-2">Taille</h4>
              <p className="font-medium">
                {selectedSize?.name || ''} ({selectedSize?.width || 0}cm x {selectedSize?.height || 0}cm)
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-gray-600 mb-2">Finition</h4>
              <p className="font-medium">{selectedFinish?.name || ''}</p>
              <p className="text-sm text-gray-500">{selectedFinish?.description || ''}</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-gray-600 mb-2">Forme</h4>
              <p className="font-medium">{selectedShape?.name || ''}</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-gray-600 mb-2">Stock initial</h4>
              <p className="font-medium">{quantity} unité(s)</p>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold">Prix total:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {calculateTotalPrice()} FCFA
                </span>
              </div>
              <p className="text-xs text-gray-500">Prix par lot de {quantity} sticker(s)</p>
            </div>

            <div className="pt-4">
              <h4 className="font-semibold text-sm text-gray-600 mb-2">Description</h4>
              <p className="text-sm text-gray-700">{stickerDescription}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Boutons d'action */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep('configure')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Modifier
        </Button>
        <Button
          onClick={() => setCurrentStep('publish')}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Continuer
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  // Étape 4: Publication
  const renderPublish = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Publier votre sticker</h2>
        <p className="text-gray-600">Votre sticker est prêt à être mis en vente</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-blue-500" />
          </div>

          <h3 className="text-xl font-bold mb-4">{stickerName}</h3>

          <div className="space-y-3 text-left mb-6">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Taille:</span>
              <span className="font-medium">{selectedSize?.name || ''}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Finition:</span>
              <span className="font-medium">{selectedFinish?.name || ''}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-gray-600">Forme:</span>
              <span className="font-medium">{selectedShape?.name || ''}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Prix:</span>
              <span className="text-xl font-bold text-blue-600">{calculateTotalPrice()} FCFA</span>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-blue-800">
              Votre sticker sera visible par tous les clients après publication
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentStep('preview')}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <Button
              onClick={handlePublish}
              disabled={isSaving}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publication...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Publier
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sticker className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Vendre des Stickers</h1>
                <p className="text-sm text-gray-600">Créez et vendez vos stickers personnalisés</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/vendeur/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {renderStepIndicator()}

        <div className="max-w-6xl mx-auto">
          {currentStep === 'design' && renderDesignSelection()}
          {currentStep === 'configure' && renderConfiguration()}
          {currentStep === 'preview' && renderPreview()}
          {currentStep === 'publish' && renderPublish()}
        </div>
      </div>
    </div>
  );
};

export default VendorStickerPage;
