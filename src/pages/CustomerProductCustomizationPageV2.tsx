import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ShoppingCart, ArrowLeft, Upload, Image as ImageIcon, X } from 'lucide-react';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/use-toast';
import adminProductsService, { AdminProduct } from '../services/adminProductsService';
import designService, { Design } from '../services/designService';
import ProductDesignEditor from '../components/ProductDesignEditor';

const CustomerProductCustomizationPageV2: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // États du produit
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [selectedColorVariation, setSelectedColorVariation] = useState<any>(null);
  const [selectedView, setSelectedView] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États des designs
  const [showDesignLibrary, setShowDesignLibrary] = useState(false);
  const [vendorDesigns, setVendorDesigns] = useState<Design[]>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);

  // Éléments de design (géré par l'éditeur)
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

        // Sélectionner la première variation de couleur et la première vue
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

  // Charger les designs vendeur
  const loadVendorDesigns = async () => {
    try {
      setLoadingDesigns(true);
      const response = await designService.getDesigns({
        limit: 20,
        status: 'published'
      });
      setVendorDesigns(response.designs || []);
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
        description: 'Veuillez ajouter au moins un élément (texte ou image)',
        variant: 'destructive'
      });
      return;
    }

    // TODO: Ajouter la logique d'ajout au panier avec designElements
    console.log('Ajout au panier:', {
      productId: product?.id,
      colorVariationId: selectedColorVariation?.id,
      elements: designElements
    });

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

  // Récupérer la délimitation
  const delimitation = selectedView?.delimitations?.[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                <p className="text-sm text-gray-600">Éditeur de design - Style Spreadshirt</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-gray-900">
                {product.price.toLocaleString()} FCFA
              </span>
              <Button onClick={handleAddToCart} disabled={designElements.length === 0}>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Ajouter au panier
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sélection de couleur */}
        {product.colorVariations && product.colorVariations.length > 1 && (
          <div className="bg-white rounded-lg border p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Couleur du produit</h3>
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
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                    selectedColorVariation?.id === color.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: color.colorCode }}
                  />
                  <span className="text-sm font-medium">{color.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Éditeur de design */}
        {selectedView && (
          <ProductDesignEditor
            productImageUrl={selectedView.url}
            delimitation={delimitation}
            onElementsChange={setDesignElements}
          />
        )}

        {/* Bibliothèque de designs (modal ou panneau) */}
        {showDesignLibrary && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Bibliothèque de designs</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDesignLibrary(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {loadingDesigns ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : vendorDesigns.length > 0 ? (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                    {vendorDesigns.map((design) => (
                      <button
                        key={design.id}
                        onClick={() => {
                          // TODO: Ajouter le design à l'éditeur via une fonction exposée
                          setShowDesignLibrary(false);
                          toast({
                            title: 'Design ajouté',
                            description: 'Le design a été ajouté à votre produit'
                          });
                        }}
                        className="p-3 rounded-lg border-2 border-gray-200 hover:border-primary transition-all"
                      >
                        <img
                          src={design.imageUrl}
                          alt={design.name}
                          className="w-full aspect-square object-contain rounded"
                        />
                        <p className="text-xs font-medium text-gray-900 mt-2 truncate">
                          {design.name}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Aucun design disponible</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Informations */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Comment utiliser l'éditeur</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Ajouter texte :</strong> Cliquez sur "Ajouter texte" puis éditez le contenu, police, couleur, taille</li>
            <li>• <strong>Ajouter image :</strong> Cliquez sur "Ajouter image" pour uploader votre design</li>
            <li>• <strong>Déplacer :</strong> Cliquez et glissez un élément (limité à la zone bleue)</li>
            <li>• <strong>Gérer les calques :</strong> Utilisez le panneau de droite pour réorganiser, dupliquer ou supprimer</li>
            <li>• <strong>Zone bleue :</strong> Vos éléments ne peuvent pas sortir de cette zone d'impression</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CustomerProductCustomizationPageV2;
