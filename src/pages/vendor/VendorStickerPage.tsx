import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
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
  Sparkles
} from 'lucide-react';

// Import des services
import designService, { Design } from '../../services/designService';
import { useAuth } from '../../contexts/AuthContext';

interface StickerSize {
  id: string;
  name: string;
  width: number; // en cm
  height: number; // en cm
  basePrice: number; // prix de base
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
  const [selectedSize, setSelectedSize] = useState<StickerSize | null>(null);
  const [selectedFinish, setSelectedFinish] = useState<StickerFinish | null>(null);
  const [selectedShape, setSelectedShape] = useState<StickerShape | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
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
      description: '5cm x 5cm - Parfait pour ordinateur portable'
    },
    {
      id: 'medium',
      name: 'Moyen',
      width: 10,
      height: 10,
      basePrice: 1000,
      description: '10cm x 10cm - Taille standard polyvalente'
    },
    {
      id: 'large',
      name: 'Grand',
      width: 15,
      height: 15,
      basePrice: 1500,
      description: '15cm x 15cm - Grand format pour décoration'
    },
    {
      id: 'xlarge',
      name: 'Très Grand',
      width: 20,
      height: 20,
      basePrice: 2500,
      description: '20cm x 20cm - Format XXL'
    },
    {
      id: 'custom',
      name: 'Personnalisé',
      width: 0,
      height: 0,
      basePrice: 0,
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

    const basePrice = selectedSize.basePrice;
    const finishMultiplier = selectedFinish.priceMultiplier;
    const total = basePrice * finishMultiplier * quantity;

    return customPrice > 0 ? customPrice : total;
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

  // Gérer la publication
  const handlePublish = async () => {
    if (!selectedDesign || !selectedSize || !selectedFinish || !selectedShape) {
      toast.error('Veuillez compléter toutes les configurations');
      return;
    }

    setIsSaving(true);
    try {
      // TODO: Appel API pour créer le produit sticker
      const stickerData = {
        designId: selectedDesign.id,
        name: stickerName,
        description: stickerDescription,
        size: {
          id: selectedSize.id,
          width: selectedSize.width,
          height: selectedSize.height
        },
        finish: selectedFinish.id,
        shape: selectedShape.id,
        price: calculateTotalPrice(),
        quantity: quantity,
        vendorId: user?.id
      };

      console.log('📦 Création du sticker:', stickerData);

      toast.success('Sticker publié avec succès !');

      // Rediriger vers le dashboard
      setTimeout(() => {
        navigate('/vendeur/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Erreur lors de la publication:', error);
      toast.error('Erreur lors de la publication du sticker');
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
        {/* Sélection de la taille */}
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
                    <p className="font-bold text-blue-600">{size.basePrice} FCFA</p>
                    {selectedSize?.id === size.id && (
                      <Check className="w-5 h-5 text-blue-500 ml-auto mt-1" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

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
                <span className="text-sm text-gray-600">Prix calculé:</span>
                <span className="font-bold text-lg">{calculateTotalPrice()} FCFA</span>
              </div>
              <p className="text-xs text-gray-500">
                Prix par sticker (base × finition × quantité)
              </p>
            </div>

            <div>
              <Label htmlFor="customPrice">Prix personnalisé (optionnel)</Label>
              <Input
                id="customPrice"
                type="number"
                min="0"
                placeholder="Laissez vide pour prix auto"
                value={customPrice || ''}
                onChange={(e) => setCustomPrice(parseInt(e.target.value) || 0)}
                className="mt-2"
              />
            </div>
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
                </div>
              )}
            </div>
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
              <h4 className="font-semibold text-sm text-gray-600 mb-2">Quantité minimum</h4>
              <p className="font-medium">{quantity} sticker(s)</p>
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
