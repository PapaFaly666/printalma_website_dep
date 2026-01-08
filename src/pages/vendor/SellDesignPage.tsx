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
  Palette, 
  Upload, 
  ArrowRight, 
  Check, 
  ArrowLeft,
  Search,
  Loader2,
  AlertCircle,
  Save,
  CheckCircle,
  Download
} from 'lucide-react';

// Import du composant de positionnement interactif
import InteractiveDesignPositioner from '../../components/vendor/InteractiveDesignPositioner';

// Import des services
import designService, { Design } from '../../services/designService';
import { vendorProductService } from '../../services/vendorProductService';
import { saveDesignTransforms } from '../../services/designTransformsAPI';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category?: string;
  status: 'PUBLISHED' | 'DRAFT';
}

interface DesignTransforms {
  positionX: number;
  positionY: number;
  scale: number;
  rotation: number;
}

interface BoundaryValidation {
  isValid: boolean;
  message: string;
  violations: string[];
}


export const SellDesignPage: React.FC = () => {
  const navigate = useNavigate();
  
  // États principaux
  const [currentStep, setCurrentStep] = useState<'select' | 'position' | 'finalize'>(
    'select'
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [designTransforms, setDesignTransforms] = useState<DesignTransforms>({
    positionX: 0.5,
    positionY: 0.3,
    scale: 0.95,
    rotation: 0
  });
  const [boundaryValidation, setBoundaryValidation] = useState<BoundaryValidation>({
    isValid: true,
    message: 'Position valide',
    violations: []
  });
  
  // États pour les données
  const [products, setProducts] = useState<Product[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingDesigns, setIsLoadingDesigns] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // États pour les filtres
  const [productSearch, setProductSearch] = useState('');
  const [designSearch, setDesignSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // États pour le formulaire final
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [publicationMode, setPublicationMode] = useState<'auto' | 'manual'>('auto');

  // Charger les produits disponibles
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoadingProducts(true);
      try {
        // Simuler un appel API pour récupérer les produits publiés par l'admin
        const mockProducts: Product[] = [
          {
            id: 1,
            name: "T-shirt Classique Blanc",
            description: "T-shirt en coton 100% biologique",
            price: 19.99,
            imageUrl: "https://res.cloudinary.com/dxhh7qpob/image/upload/v1/products/tshirt-white.png",
            category: "t-shirts",
            status: "PUBLISHED"
          },
          {
            id: 2,
            name: "Mug Blanc 350ml",
            description: "Mug en céramique de qualité premium",
            price: 12.99,
            imageUrl: "https://res.cloudinary.com/dxhh7qpob/image/upload/v1/products/mug-white.png",
            category: "mugs",
            status: "PUBLISHED"
          },
          {
            id: 3,
            name: "Casquette Noire",
            description: "Casquette baseball ajustable",
            price: 24.99,
            imageUrl: "https://res.cloudinary.com/dxhh7qpob/image/upload/v1/products/cap-black.png",
            category: "accessories",
            status: "PUBLISHED"
          },
          {
            id: 4,
            name: "Tote Bag Canvas",
            description: "Sac en toile naturelle résistant",
            price: 16.99,
            imageUrl: "https://res.cloudinary.com/dxhh7qpob/image/upload/v1/products/bag-canvas.png",
            category: "bags",
            status: "PUBLISHED"
          }
        ];
        
        setProducts(mockProducts);
      } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
        toast.error('Erreur lors du chargement des produits');
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  // Charger les designs du vendeur
  useEffect(() => {
    const loadDesigns = async () => {
      setIsLoadingDesigns(true);
      try {
        const response = await designService.getDesigns({ 
          limit: 50,
          status: 'published'
        });
        setDesigns(response.designs);
      } catch (error) {
        console.error('Erreur lors du chargement des designs:', error);
        toast.error('Erreur lors du chargement de vos designs');
        
        // Fallback avec des designs de démonstration
        const mockDesigns: Design[] = [
          {
            id: 1,
            name: "Logo Entreprise",
            description: "Design professionnel pour entreprise",
            price: 0,
            imageUrl: "https://res.cloudinary.com/dxhh7qpob/image/upload/v1/designs/example-logo.png",
            category: "logo",
            isPublished: true
          },
          {
            id: 2,
            name: "Motif Artistique",
            description: "Pattern créatif et coloré",
            price: 0,
            imageUrl: "https://res.cloudinary.com/dxhh7qpob/image/upload/v1/designs/artistic-pattern.png",
            category: "pattern",
            isPublished: true
          }
        ];
        setDesigns(mockDesigns);
      } finally {
        setIsLoadingDesigns(false);
      }
    };

    loadDesigns();
  }, []);

  // Filtrer les produits
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                         product.description.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filtrer les designs
  const filteredDesigns = designs.filter(design => {
    const matchesSearch = design.name.toLowerCase().includes(designSearch.toLowerCase()) ||
                         (design.description && design.description.toLowerCase().includes(designSearch.toLowerCase()));
    return matchesSearch;
  });

  // Gérer la sélection de produit
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setProductName(`${product.name} - ${selectedDesign?.name || 'Design personnalisé'}`);
    setProductDescription(`${product.description} avec design personnalisé appliqué.`);
  };

  // Gérer la sélection de design
  const handleDesignSelect = (design: Design) => {
    setSelectedDesign(design);
    if (selectedProduct) {
      setProductName(`${selectedProduct.name} - ${design.name}`);
    }
  };

  // Passer à l'étape suivante
  const handleNextStep = () => {
    if (currentStep === 'select') {
      if (!selectedProduct || !selectedDesign) {
        toast.error('Veuillez sélectionner un produit et un design');
        return;
      }
      setCurrentStep('position');
    } else if (currentStep === 'position') {
      // Vérifier que le design est dans les limites avant de passer à l'étape finale
      if (!boundaryValidation.isValid) {
        toast.error('Le design doit être positionné dans les limites autorisées avant de continuer');
        return;
      }
      setCurrentStep('finalize');
    }
  };

  // Revenir à l'étape précédente
  const handlePreviousStep = () => {
    if (currentStep === 'position') {
      setCurrentStep('select');
    } else if (currentStep === 'finalize') {
      setCurrentStep('position');
    }
  };

  // Fonction pour télécharger le produit avec le design incorporé
  const downloadProductWithDesign = async (): Promise<void> => {
    if (!selectedProduct || !selectedDesign) {
      toast.error('Produit et design requis pour le téléchargement');
      return;
    }

    try {
      console.log('🎯 Début téléchargement produit avec design...');
      
      // Créer un canvas pour la composition
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Impossible de créer le contexte canvas');
      }

      // Fond blanc
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 400);

      // Charger l'image du produit
      const productImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Erreur chargement image produit'));
        img.src = selectedProduct.imageUrl;
      });

      // Dessiner l'image du produit (centré, aspect ratio préservé)
      const imgRatio = productImg.width / productImg.height;
      let drawWidth, drawHeight, offsetX, offsetY;
      
      if (imgRatio > 1) {
        drawWidth = 400;
        drawHeight = 400 / imgRatio;
        offsetX = 0;
        offsetY = (400 - drawHeight) / 2;
      } else {
        drawHeight = 400;
        drawWidth = 400 * imgRatio;
        offsetX = (400 - drawWidth) / 2;
        offsetY = 0;
      }

      ctx.drawImage(productImg, offsetX, offsetY, drawWidth, drawHeight);

      // Charger et dessiner le design si disponible
      if (selectedDesign.imageUrl) {
        const designImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Erreur chargement design'));
          img.src = selectedDesign.imageUrl || '';
        });

        // Calculer la position du design basée sur les transformations
        const designWidth = drawWidth * 0.3 * designTransforms.scale; // 30% de la largeur du produit
        const designHeight = (designImg.height / designImg.width) * designWidth;
        
        const designX = offsetX + (drawWidth * designTransforms.positionX) - (designWidth / 2);
        const designY = offsetY + (drawHeight * designTransforms.positionY) - (designHeight / 2);

        // Sauvegarder le contexte pour la rotation
        ctx.save();
        ctx.translate(designX + designWidth / 2, designY + designHeight / 2);
        ctx.rotate((designTransforms.rotation * Math.PI) / 180);
        ctx.drawImage(designImg, -designWidth / 2, -designHeight / 2, designWidth, designHeight);
        ctx.restore();
      }

      // Convertir en blob et télécharger
      canvas.toBlob((blob) => {
        if (blob) {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `${selectedProduct.name.replace(/[^a-zA-Z0-9]/g, '_')}_avec_design.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Libérer la mémoire
          setTimeout(() => URL.revokeObjectURL(link.href), 1000);
          
          toast.success('Image téléchargée avec succès!');
        }
      }, 'image/png', 0.9);

    } catch (error) {
      console.error('❌ Erreur téléchargement:', error);
      toast.error('Erreur lors du téléchargement de l\'image');
    }
  };

  // Valider le produit selon le mode de publication choisi
  const handleValidateProduct = async () => {
    if (!selectedProduct || !selectedDesign) {
      toast.error('Données manquantes');
      return;
    }

    // Vérifier que le design est dans les limites
    if (!boundaryValidation.isValid) {
      toast.error('Le design doit être positionné dans les limites autorisées avant de valider le produit');
      return;
    }

    setIsSaving(true);
    try {
      // Récupérer les données du localStorage
      const storageKey = `design-position-${selectedProduct.id}-${selectedDesign.imageUrl}`;
      const savedTransforms = localStorage.getItem(storageKey);
      
      let localStorageTransforms = designTransforms;
      if (savedTransforms) {
        try {
          localStorageTransforms = JSON.parse(savedTransforms);
        } catch (e) {
          console.warn('Erreur lors du parsing du localStorage:', e);
        }
      }

      // Déterminer le statut selon le mode de publication et la validation du design
      const isDesignValidated = selectedDesign.isValidated || false; // Supposons que le design a une propriété isValidated
      
      let finalStatus: 'DRAFT' | 'PENDING';
      
      if (publicationMode === 'auto') {
        // Publication automatique : PENDING si design validé, sinon PENDING
        finalStatus = 'PENDING';
      } else {
        // Publication manuelle : DRAFT si design validé (vendeur peut publier), sinon PENDING
        finalStatus = isDesignValidated ? 'DRAFT' : 'PENDING';
      }

      // Préparer les données pour la création du produit
      const vendorProductData: any = {
        baseProductId: selectedProduct.id,
        productStructure: {
          adminProduct: {
            id: selectedProduct.id,
            name: selectedProduct.name,
            description: selectedProduct.description,
            price: selectedProduct.price,
            images: {
              colorVariations: []
            },
            sizes: []
          },
          designApplication: {
            designBase64: selectedDesign.imageUrl || '',
            positioning: 'CENTER' as const,
            scale: localStorageTransforms.scale || 0.95
          }
        },
        vendorName: productName || `${selectedProduct.name} - ${selectedDesign.name}`,
        vendorDescription: productDescription || `Design personnalisé appliqué sur ${selectedProduct.name}`,
        vendorPrice: selectedProduct.price,
        vendorStock: 10,
        selectedColors: [],
        selectedSizes: [],
        finalImagesBase64: {},
        designPosition: {
          x: localStorageTransforms.positionX || 0.5,
          y: localStorageTransforms.positionY || 0.3,
          scale: localStorageTransforms.scale || 0.95,
          rotation: localStorageTransforms.rotation || 0
        },
        publicationMode: publicationMode,
        bypassValidation: true
      };

      // Ajouter le statut forcé seulement si nécessaire
      if (finalStatus !== 'PENDING') {
        vendorProductData.forcedStatus = finalStatus;
      }

      // Créer le produit vendor
      const createResponse = await vendorProductService.createVendorProduct(vendorProductData);
      
      if (!createResponse.success || !createResponse.productId) {
        throw new Error(createResponse.message || 'Erreur lors de la création du produit');
      }

      const vendorProductId = createResponse.productId;

      // Sauvegarder les transformations dans VendorDesignTransform
      const transformsPayload = {
        vendorProductId: vendorProductId,
        designUrl: selectedDesign.imageUrl || '',
        transforms: {
          '0': {
            x: localStorageTransforms.positionX || 0.5,
            y: localStorageTransforms.positionY || 0.3,
            scale: localStorageTransforms.scale || 0.95
          },
          positioning: {
            x: localStorageTransforms.positionX || 0.5,
            y: localStorageTransforms.positionY || 0.3,
            scale: localStorageTransforms.scale || 0.95,
            rotation: localStorageTransforms.rotation || 0
          }
        },
        lastModified: Date.now()
      };

      await saveDesignTransforms(transformsPayload);

      // Sauvegarder la position dans ProductDesignPosition si designId existe
      if (selectedDesign.id && typeof selectedDesign.id === 'number') {
        const positionPayload = {
          x: localStorageTransforms.positionX || 0.5,
          y: localStorageTransforms.positionY || 0.3,
          scale: localStorageTransforms.scale || 0.95,
          rotation: localStorageTransforms.rotation || 0
        };

        await vendorProductService.saveDesignPosition(
          vendorProductId,
          selectedDesign.id,
          positionPayload
        );
      }

      // Message de succès selon le statut final
      let successMessage = '';
      let description = '';
      
      switch (finalStatus) {
        case 'PENDING':
          successMessage = 'Produit en attente de validation !';
          description = isDesignValidated 
            ? 'Le produit sera publié après validation par l\'administrateur.'
            : 'Le design doit d\'abord être validé par l\'administrateur.';
          break;
        case 'DRAFT':
          successMessage = 'Produit créé en brouillon !';
          description = 'Vous pourrez le publier manuellement depuis la page produits.';
          break;
      }
      
      toast.success(successMessage, { description });
      
      // Nettoyer le localStorage
      localStorage.removeItem(storageKey);
      
      // Télécharger automatiquement le produit avec le design
      try {
        await downloadProductWithDesign();
        toast.success('Produit validé et image téléchargée!', {
          description: 'Votre produit avec le design a été téléchargé automatiquement'
        });
      } catch (downloadError) {
        console.warn('Erreur téléchargement automatique:', downloadError);
        // Le message de succès précédent reste affiché
      }
      
      // Rediriger vers la page des produits
      navigate('/vendeur/products');
      
    } catch (error) {
      console.error('Erreur lors de la validation du produit:', error);
      toast.error('Erreur lors de la validation du produit');
    } finally {
      setIsSaving(false);
    }
  };

  // Rendu des différentes étapes
  const renderStepContent = () => {
    switch (currentStep) {
      case 'select':
        return (
          <div className="space-y-6">
            {/* Sélection de produit */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Choisir un produit
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filtres produits */}
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <Label htmlFor="product-search">Rechercher</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="product-search"
                        placeholder="Nom du produit..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="category-select">Catégorie</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="t-shirts">T-shirts</SelectItem>
                        <SelectItem value="mugs">Mugs</SelectItem>
                        <SelectItem value="accessories">Accessoires</SelectItem>
                        <SelectItem value="bags">Sacs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Liste des produits */}
                {isLoadingProducts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => (
                      <Card
                        key={product.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedProduct?.id === product.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => handleProductSelect(product)}
                      >
                        <CardContent className="p-0">
                          <div className="aspect-square bg-gray-50 relative overflow-hidden rounded-t-lg">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-contain"
                            />
                            {selectedProduct?.id === product.id && (
                              <div className="absolute top-2 right-2">
                                <div className="bg-blue-500 text-white rounded-full p-1">
                                  <Check className="h-4 w-4" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-sm">{product.name}</h3>
                            <p className="text-xs text-gray-600 mt-1">{product.price}€</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sélection de design */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Choisir votre design
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Recherche designs */}
                <div className="mb-4">
                  <Label htmlFor="design-search">Rechercher dans vos designs</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="design-search"
                      placeholder="Nom du design..."
                      value={designSearch}
                      onChange={(e) => setDesignSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Liste des designs */}
                {isLoadingDesigns ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : filteredDesigns.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun design trouvé</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => navigate('/vendeur/designs')}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Créer un design
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredDesigns.map((design) => (
                      <Card
                        key={design.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedDesign?.id === design.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => handleDesignSelect(design)}
                      >
                        <CardContent className="p-0">
                          <div className="aspect-square bg-gray-50 relative overflow-hidden rounded-t-lg">
                            <img
                              src={design.imageUrl}
                              alt={design.name}
                              className="w-full h-full object-cover"
                            />
                            {selectedDesign?.id === design.id && (
                              <div className="absolute top-2 right-2">
                                <div className="bg-blue-500 text-white rounded-full p-1">
                                  <Check className="h-4 w-4" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h3 className="font-semibold text-xs">{design.name}</h3>
                            <Badge variant="outline" className="text-xs mt-1">
                              {design.category}
                            </Badge>
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

      case 'position':
        return selectedProduct && selectedDesign ? (
          <InteractiveDesignPositioner
            productId={selectedProduct.id}
            productImageUrl={selectedProduct.imageUrl}
            productName={selectedProduct.name}
            designUrl={selectedDesign.imageUrl || ''}
            designName={selectedDesign.name}
            onTransformsChange={setDesignTransforms}
            onValidationChange={setBoundaryValidation}
            autoSave={true}
          />
        ) : null;

      case 'finalize':
        return (
          <div className="space-y-6">
            {/* Aperçu final */}
            <Card>
              <CardHeader>
                <CardTitle>Aperçu final</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedProduct && selectedDesign && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Aperçu visuel */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="aspect-square relative bg-white rounded-lg overflow-hidden">
                        <img
                          src={selectedProduct.imageUrl}
                          alt={selectedProduct.name}
                          className="w-full h-full object-contain"
                        />
                        <div
                          className="absolute top-0 left-0"
                          style={{
                            transform: `translate(${designTransforms.positionX * 100}%, ${designTransforms.positionY * 100}%) scale(${designTransforms.scale}) rotate(${designTransforms.rotation}deg)`,
                            transformOrigin: 'top left'
                          }}
                        >
                          <img
                            src={selectedDesign.imageUrl || ''}
                            alt={selectedDesign.name}
                            className="w-24 h-auto"
                          />
                        </div>
                      </div>
                      
                      {/* Indicateur de validation dans l'aperçu */}
                      <div className="mt-4">
                        {boundaryValidation.isValid ? (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-green-800">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">Position valide</span>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-red-800">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">Position hors limites</span>
                            </div>
                            <p className="text-xs text-red-600 mt-1">
                              {boundaryValidation.message}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Formulaire de finalisation */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="product-name">Nom du produit final</Label>
                        <Input
                          id="product-name"
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                          placeholder="Nom de votre produit personnalisé"
                        />
                      </div>

                      <div>
                        <Label htmlFor="product-description">Description</Label>
                        <textarea
                          id="product-description"
                          value={productDescription}
                          onChange={(e) => setProductDescription(e.target.value)}
                          placeholder="Décrivez votre produit personnalisé"
                          className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Sélecteur de mode de publication */}
                      <div>
                        <Label className="text-base font-medium">Mode de publication</Label>
                        <div className="mt-2 space-y-3">
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              id="auto-publish"
                              name="publication-mode"
                              value="auto"
                              checked={publicationMode === 'auto'}
                              onChange={(e) => setPublicationMode(e.target.value as 'auto' | 'manual')}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <Label htmlFor="auto-publish" className="text-sm font-medium text-gray-900 cursor-pointer">
                                Publication automatique
                              </Label>
                              <p className="text-xs text-gray-500 mt-1">
                                Le produit sera publié automatiquement si le design est validé par l'admin, sinon il restera en attente.
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              id="manual-publish"
                              name="publication-mode"
                              value="manual"
                              checked={publicationMode === 'manual'}
                              onChange={(e) => setPublicationMode(e.target.value as 'auto' | 'manual')}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <Label htmlFor="manual-publish" className="text-sm font-medium text-gray-900 cursor-pointer">
                                Publication manuelle
                              </Label>
                              <p className="text-xs text-gray-500 mt-1">
                                Le produit sera créé en brouillon si le design est validé (vous pourrez le publier), sinon il restera en attente.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold mb-2">Résumé</h4>
                        <div className="space-y-2 text-sm">
                          <p><strong>Produit de base:</strong> {selectedProduct.name}</p>
                          <p><strong>Design:</strong> {selectedDesign.name}</p>
                          <p><strong>Prix de base:</strong> {selectedProduct.price}€</p>
                          <p><strong>Position:</strong> {Math.round(designTransforms.positionX * 100)}%, {Math.round(designTransforms.positionY * 100)}%</p>
                          <p><strong>Échelle:</strong> {designTransforms.scale.toFixed(2)}x</p>
                          <p><strong>Rotation:</strong> {Math.round(designTransforms.rotation)}°</p>
                          <p><strong>Mode de publication:</strong> {publicationMode === 'auto' ? 'Automatique' : 'Manuelle'}</p>
                          <p><strong>Validation position:</strong> 
                            <span className={boundaryValidation.isValid ? 'text-green-600' : 'text-red-600'}>
                              {boundaryValidation.isValid ? ' ✓ Valide' : ' ✗ Hors limites'}
                            </span>
                          </p>
                        </div>
                      </div>

                        {/* Informations sur le statut final */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="font-medium text-blue-900">Que faire après validation du design ?</h4>
                              {publicationMode === 'auto' ? (
                                <p className="text-sm text-blue-700 mt-1">
                                  <strong>Publication automatique :</strong> Si votre design est validé par l'administrateur, 
                                  votre produit sera automatiquement publié et visible par les clients. 
                                  Sinon, il restera en attente de validation.
                                </p>
                              ) : (
                                <p className="text-sm text-blue-700 mt-1">
                                  <strong>Publication manuelle :</strong> Si votre design est validé par l'administrateur, 
                                  votre produit sera créé en brouillon et vous pourrez le publier manuellement depuis la page produits. 
                                  Sinon, il restera en attente de validation.
                                </p>
                              )}
                            </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Créer un produit personnalisé</h1>
          <p className="text-gray-600">
            Sélectionnez un produit, appliquez votre design et configurez le positionnement
          </p>
        </div>

        {/* Indicateur d'étapes */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 ${currentStep === 'select' ? 'text-blue-600' : currentStep === 'position' || currentStep === 'finalize' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${currentStep === 'select' ? 'border-blue-600 bg-blue-600 text-white' : currentStep === 'position' || currentStep === 'finalize' ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300'}`}>
                  1
                </div>
                <span className="font-medium">Sélection</span>
              </div>
              
              <ArrowRight className="h-4 w-4 text-gray-400" />
              
              <div className={`flex items-center gap-2 ${currentStep === 'position' ? 'text-blue-600' : currentStep === 'finalize' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${currentStep === 'position' ? 'border-blue-600 bg-blue-600 text-white' : currentStep === 'finalize' ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300'}`}>
                  2
                </div>
                <span className="font-medium">Positionnement</span>
              </div>
              
              <ArrowRight className="h-4 w-4 text-gray-400" />
              
              <div className={`flex items-center gap-2 ${currentStep === 'finalize' ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${currentStep === 'finalize' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
                  3
                </div>
                <span className="font-medium">Finalisation</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contenu de l'étape */}
        {renderStepContent()}

        {/* Actions */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                {currentStep !== 'select' && (
                  <Button
                    variant="outline"
                    onClick={handlePreviousStep}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Précédent
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {currentStep === 'finalize' ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={downloadProductWithDesign}
                      disabled={!boundaryValidation.isValid}
                      className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleValidateProduct}
                        disabled={isSaving || !boundaryValidation.isValid}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
                ) : (
                  <Button
                    onClick={handleNextStep}
                    disabled={
                      (currentStep === 'select' && (!selectedProduct || !selectedDesign)) ||
                      (currentStep === 'position' && !boundaryValidation.isValid)
                    }
                  >
                    Suivant
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellDesignPage; 