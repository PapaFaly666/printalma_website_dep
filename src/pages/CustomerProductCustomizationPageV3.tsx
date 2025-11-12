import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2,
  ShoppingCart,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Type,
  Save,
  Share2,
  Maximize,
  HelpCircle,
  Shirt,
  X,
  Search,
  Star,
  Flag
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import adminProductsService, { AdminProduct } from '../services/adminProductsService';
import designService from '../services/designService';
import ProductDesignEditor, { ProductDesignEditorRef } from '../components/ProductDesignEditor';

const CustomerProductCustomizationPageV3: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const editorRef = useRef<ProductDesignEditorRef>(null);

  // États du produit
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [selectedColorVariation, setSelectedColorVariation] = useState<any>(null);
  const [selectedView, setSelectedView] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États de l'interface
  const [activeTab, setActiveTab] = useState<'designs' | 'text' | 'upload'>('designs');
  const [showDesignLibrary, setShowDesignLibrary] = useState(false);
  const [vendorDesigns, setVendorDesigns] = useState<any[]>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [designSearch, setDesignSearch] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filtres pour les designs
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [showAllAudience, setShowAllAudience] = useState(true);
  const [showAdaptableColor, setShowAdaptableColor] = useState(true);

  // Éléments de design
  const [designElements, setDesignElements] = useState<any[]>([]);

  // Charger le produit
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        const productData = await adminProductsService.getProductById(Number(id));
        setProduct(productData);

        if (productData.colorVariations && productData.colorVariations.length > 0) {
          const firstColor = productData.colorVariations[0];
          setSelectedColorVariation(firstColor);

          if (firstColor.images && firstColor.images.length > 0) {
            setSelectedView(firstColor.images[0]);
          }
        }
      } catch (err) {
        console.error('Erreur chargement produit:', err);
        setError('Impossible de charger le produit');
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  // Charger les données depuis localStorage au démarrage
  useEffect(() => {
    if (!id || !product) return;

    const storageKey = `design-data-product-${id}`;
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      try {
        const data = JSON.parse(saved);

        // Restaurer les éléments de design via le ref de l'éditeur
        if (data.elements && data.elements.length > 0) {
          setDesignElements(data.elements);
          // Aussi passer au ProductDesignEditor via ref
          setTimeout(() => {
            editorRef.current?.setElements(data.elements);
          }, 100);
        }

        // Restaurer la couleur et la vue sélectionnées
        if (data.colorVariationId && product.colorVariations) {
          const savedColor = product.colorVariations.find(c => c.id === data.colorVariationId);
          if (savedColor) {
            setSelectedColorVariation(savedColor);

            if (data.viewId && savedColor.images) {
              const savedView = savedColor.images.find(img => img.id === data.viewId);
              if (savedView) {
                setSelectedView(savedView);
              }
            }
          }
        }

        toast({
          title: '✨ Design restauré',
          description: 'Votre design a été récupéré automatiquement',
          duration: 3000
        });
      } catch (err) {
        console.error('Erreur lecture localStorage:', err);
      }
    }
  }, [id, product, toast]);

  // Sauvegarder automatiquement dans localStorage à chaque modification
  useEffect(() => {
    if (!id) return;

    // Sauvegarder même si aucun élément (pour garder la sélection de couleur/vue)
    const storageKey = `design-data-product-${id}`;
    const dataToSave = {
      elements: designElements,
      colorVariationId: selectedColorVariation?.id,
      viewId: selectedView?.id,
      timestamp: Date.now()
    };

    localStorage.setItem(storageKey, JSON.stringify(dataToSave));

    // Log pour debug (à supprimer en production)
    console.log('💾 Auto-sauvegarde:', dataToSave);
  }, [designElements, selectedColorVariation, selectedView, id]);

  // Gérer le plein écran
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
        toast({
          title: 'Mode plein écran activé',
          description: 'Appuyez sur Échap pour quitter'
        });
      }).catch((err) => {
        console.error('Erreur plein écran:', err);
        toast({
          title: 'Erreur',
          description: 'Impossible d\'activer le plein écran',
          variant: 'destructive'
        });
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Écouter les changements de plein écran (Échap par exemple)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Sauvegarder manuellement
  const handleSave = () => {
    if (!id) return;

    const storageKey = `design-data-product-${id}`;
    const dataToSave = {
      elements: designElements,
      colorVariationId: selectedColorVariation?.id,
      viewId: selectedView?.id,
      timestamp: Date.now()
    };

    localStorage.setItem(storageKey, JSON.stringify(dataToSave));

    toast({
      title: '✅ Sauvegardé',
      description: `${designElements.length} élément(s) sauvegardé(s) avec succès`,
      duration: 2000
    });
  };

  // Charger les designs vendeur
  const loadVendorDesigns = async () => {
    try {
      setLoadingDesigns(true);
      const result = await designService.getPublicDesigns({
        limit: 50
      });
      setVendorDesigns(result.designs || []);
      setShowDesignLibrary(true);
    } catch (err) {
      console.error('Erreur chargement designs:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les designs',
        variant: 'destructive'
      });
    } finally {
      setLoadingDesigns(false);
    }
  };

  // Ajouter au panier
  const handleAddToCart = () => {
    if (designElements.length === 0) {
      toast({
        title: 'Design requis',
        description: 'Veuillez ajouter au moins un élément',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Ajouté au panier',
      description: 'Votre produit personnalisé a été ajouté au panier'
    });

    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Produit introuvable'}</p>
          <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  const delimitation = selectedView?.delimitations?.[0];

  // Extraire les catégories pour les designs
  const categories = Array.from(
    new Set(vendorDesigns.map(d => d.category?.name).filter(Boolean))
  ).sort();


  const filteredDesigns = vendorDesigns.filter(design => {
    const matchSearch = design.name.toLowerCase().includes(designSearch.toLowerCase()) ||
                       design.creator?.shopName?.toLowerCase().includes(designSearch.toLowerCase());
    const matchCategory = !selectedCategory || design.category?.name === selectedCategory;
    const matchFreeOnly = !showFreeOnly || design.price === 0;
    return matchSearch && matchCategory && matchFreeOnly;
  });

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header Top Actions */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <HelpCircle className="w-4 h-4 mr-2" />
                Assistance
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Partager
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Quitter le plein écran' : 'Mode plein écran'}
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex h-full overflow-hidden">
            {/* Left Sidebar - Tools */}
            <div className="w-20 bg-white border-r flex flex-col items-center py-6 gap-4">
              <button
                onClick={() => setActiveTab('designs')}
                className={`flex flex-col items-center gap-1 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'designs'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Produits"
              >
                <Shirt className="w-6 h-6" />
                <span className="text-xs font-medium">Produits</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('designs');
                  loadVendorDesigns();
                }}
                className={`flex flex-col items-center gap-1 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'designs' && showDesignLibrary
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Designs"
              >
                <ImageIcon className="w-6 h-6" />
                <span className="text-xs font-medium">Designs</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('text');
                  editorRef.current?.addText();
                }}
                className={`flex flex-col items-center gap-1 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'text'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Texte"
              >
                <Type className="w-6 h-6" />
                <span className="text-xs font-medium">Texte</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('upload');
                  editorRef.current?.triggerImageUpload();
                }}
                className={`flex flex-col items-center gap-1 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'upload'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Importer"
              >
                <Upload className="w-6 h-6" />
                <span className="text-xs font-medium">Importer</span>
              </button>
            </div>

            {/* Center - Product Display avec éditeur intégré */}
            <div className="flex-1 flex flex-col p-8 overflow-y-auto">
              <div className="flex-1 flex items-center justify-center">
                {selectedView && delimitation ? (
                  <div className="w-full max-w-4xl">
                    <ProductDesignEditor
                      ref={editorRef}
                      productImageUrl={selectedView.url}
                      delimitation={delimitation}
                      initialElements={designElements}
                      onElementsChange={setDesignElements}
                      className="flex-row-reverse"
                    />
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="relative" style={{ width: '500px', height: '500px' }}>
                      {selectedView && (
                        <img
                          src={selectedView.url}
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* View Selector */}
              {selectedColorVariation && selectedColorVariation.images && selectedColorVariation.images.length > 1 && (
                <div className="flex gap-2 bg-white rounded-lg p-3 shadow justify-center mt-6">
                  {selectedColorVariation.images.map((img: any, idx: number) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedView(img)}
                      className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                        selectedView?.id === img.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Vue {idx + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Sidebar - Product Info */}
            <div className="w-96 bg-white border-l p-6 overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>

              <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className="text-yellow-400">★</span>
              ))}
            </div>
            <span className="text-sm text-gray-600">(0 avis)</span>
          </div>

          {product.description && (
            <p className="text-sm text-gray-600 mb-6">{product.description}</p>
          )}

          {/* Color Selection */}
          {product.colorVariations && product.colorVariations.length > 1 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Couleur</h3>
              <div className="flex flex-wrap gap-2">
                {product.colorVariations.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => {
                      setSelectedColorVariation(color);
                      if (color.images && color.images.length > 0) {
                        setSelectedView(color.images[0]);
                      }
                    }}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      selectedColorVariation?.id === color.id
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color.colorCode }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Prix</span>
              <span className="text-2xl font-bold text-gray-900">
                {product.price.toLocaleString()} FCFA
              </span>
            </div>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={designElements.length === 0}
            className="w-full py-6 text-lg"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Choisir la quantité & taille
          </Button>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900 font-medium mb-2">💡 Comment utiliser:</p>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Utilisez la barre latérale pour ajouter des designs ou du texte</li>
              <li>• Cliquez et glissez pour déplacer les éléments</li>
              <li>• Utilisez les poignées pour redimensionner et pivoter</li>
            </ul>
          </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panneau latéral Bibliothèque de designs */}
      {showDesignLibrary && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDesignLibrary(false)}
          />

          {/* Panneau */}
          <div className="relative ml-auto w-full max-w-5xl bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Choisissez un design</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDesignLibrary(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar gauche - Filtres */}
              <div className="w-72 border-r bg-gray-50 p-4 overflow-y-auto">
                {/* Recherche */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      value={designSearch}
                      onChange={(e) => setDesignSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                </div>

                {/* Interrupteurs de filtres */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Designs gratuits</span>
                    <button
                      onClick={() => setShowFreeOnly(!showFreeOnly)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        showFreeOnly ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showFreeOnly ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Designs tout public</span>
                    <button
                      onClick={() => setShowAllAudience(!showAllAudience)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        showAllAudience ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showAllAudience ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Couleur adaptable</span>
                    <button
                      onClick={() => setShowAdaptableColor(!showAdaptableColor)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        showAdaptableColor ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          showAdaptableColor ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Labels associés */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Labels associés</h3>
                  <div className="flex flex-wrap gap-2">
                    {/* Bouton "Tous" */}
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        selectedCategory === null
                          ? 'bg-primary text-white border border-primary'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      Tous
                    </button>
                    {/* Boutons de catégories */}
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          selectedCategory === category
                            ? 'bg-primary text-white border border-primary'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contenu principal - Grille de designs */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Résultats et info */}
                <div className="px-6 py-3 border-b bg-white">
                  <p className="text-sm text-gray-600">
                    {filteredDesigns.length} design{filteredDesigns.length > 1 ? 's' : ''} trouvé{filteredDesigns.length > 1 ? 's' : ''}
                  </p>
                </div>

                {/* Grille scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                  {loadingDesigns ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : filteredDesigns.length > 0 ? (
                    <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredDesigns.map((design) => (
                        <div
                          key={design.id}
                          className="group relative bg-white rounded-lg border-2 border-gray-200 hover:border-primary hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                          onClick={() => {
                            editorRef.current?.addVendorDesign(design);
                            toast({
                              title: 'Design ajouté',
                              description: `${design.name} a été ajouté`
                            });
                            setShowDesignLibrary(false);
                          }}
                        >
                          {/* Actions en haut */}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button
                              className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast({ title: 'Ajouté aux favoris' });
                              }}
                            >
                              <Star className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast({ title: 'Design signalé' });
                              }}
                            >
                              <Flag className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>

                          {/* Label gratuit */}
                          {design.price === 0 && (
                            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded z-10">
                              Gratuit
                            </div>
                          )}

                          {/* Image */}
                          <div className="aspect-square bg-gray-50 p-4">
                            <img
                              src={design.imageUrl || design.thumbnailUrl}
                              alt={design.name}
                              className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                            />
                          </div>

                          {/* Info */}
                          <div className="p-3 border-t">
                            <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">
                              {design.name}
                            </p>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600 truncate">
                                {design.creator?.shopName}
                              </span>
                              <span className="font-bold text-primary ml-2 whitespace-nowrap">
                                {design.price > 0 ? `${design.price.toLocaleString()} FCFA` : 'Gratuit'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 text-gray-500">
                      Aucun design trouvé
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerProductCustomizationPageV3;
