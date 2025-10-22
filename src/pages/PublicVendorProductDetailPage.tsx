import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Loader2, Check } from 'lucide-react';
import vendorProductsService, { VendorProduct } from '../services/vendorProductsService';
import { SimpleProductPreview } from '../components/vendor/SimpleProductPreview';
import { useCart } from '../contexts/CartContext';

const PublicVendorProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Extraire l'ID du produit depuis l'URL en fallback
  const getProductIdFromUrl = (): string | null => {
    // Essayer useParams d'abord
    if (productId) {
      console.log('✅ [PublicVendorProductDetailPage] ID trouvé via useParams:', productId);
      return productId;
    }

    // Fallback: extraire depuis le pathname
    const pathnameParts = location.pathname.split('/');
    const vendorProductDetailIndex = pathnameParts.indexOf('vendor-product-detail');

    if (vendorProductDetailIndex !== -1 && pathnameParts[vendorProductDetailIndex + 1]) {
      const extractedId = pathnameParts[vendorProductDetailIndex + 1];
      console.log('🔧 [PublicVendorProductDetailPage] ID extrait depuis pathname:', extractedId);
      return extractedId;
    }

    console.log('❌ [PublicVendorProductDetailPage] Impossible de trouver l\'ID du produit');
    return null;
  };

  const actualProductId = getProductIdFromUrl();

  // Debug: Afficher les informations de routage
  console.log('🔍 [PublicVendorProductDetailPage] Infos routage:', {
    pathname: location.pathname,
    productIdFromParams: productId,
    extractedProductId: actualProductId,
    allParams: useParams(),
    search: location.search,
    hash: location.hash
  });

  const [product, setProduct] = useState<VendorProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<{ id: number; name: string } | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const { addToCart } = useCart();

  // Timeout de sécurité pour éviter le chargement infini
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('⏰ [PublicVendorProductDetailPage] Timeout de sécurité déclenché');
        setLoading(false);
        setError('Le chargement prend trop de temps. Veuillez réessayer.');
      }
    }, 15000); // 15 secondes

    return () => clearTimeout(timeout);
  }, [loading]);

  // Charger les détails du produit
  useEffect(() => {
    const loadProduct = async () => {
      if (!actualProductId) {
        console.log('❌ [PublicVendorProductDetailPage] Pas de actualProductId');
        setError('ID de produit manquant');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const productIdNum = parseInt(actualProductId);
        console.log('🔍 [PublicVendorProductDetailPage] Chargement produit:', {
          productId: actualProductId,
          productIdNum,
          url: `/public/vendor-products/${productIdNum}`
        });

        // Utiliser l'API individuelle pour récupérer les détails du produit
        const response = await vendorProductsService.getProductById(productIdNum);

        console.log('📡 [PublicVendorProductDetailPage] Réponse API:', {
          success: response.success,
          hasData: !!response.data,
          message: response.message
        });

        if (response.success && response.data) {
          const foundProduct = response.data;
          console.log('✅ [PublicVendorProductDetailPage] Produit trouvé:', {
            id: foundProduct.id,
            name: foundProduct.vendorName,
            hasDesign: foundProduct.designApplication.hasDesign,
            designPositions: foundProduct.designPositions?.length || 0,
            colors: foundProduct.selectedColors.length
          });

          setProduct(foundProduct);

          // Sélectionner la première couleur par défaut
          if (foundProduct.selectedColors && foundProduct.selectedColors.length > 0) {
            setSelectedColorId(foundProduct.selectedColors[0].id);
            console.log('🎨 [PublicVendorProductDetailPage] Couleur par défaut sélectionnée:', foundProduct.selectedColors[0].id);
          }

          // Sélectionner la première taille par défaut
          if (foundProduct.selectedSizes && foundProduct.selectedSizes.length > 0) {
            setSelectedSize(foundProduct.selectedSizes[0]);
            console.log('📏 [PublicVendorProductDetailPage] Taille par défaut sélectionnée:', foundProduct.selectedSizes[0]);
          }
        } else {
          console.log('❌ [PublicVendorProductDetailPage] Produit non trouvé ou erreur:', response.message);
          setError(response.message || 'Produit non trouvé');
        }
      } catch (err) {
        console.error('❌ [PublicVendorProductDetailPage] Erreur complète:', err);
        setError(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      } finally {
        console.log('🏁 [PublicVendorProductDetailPage] Fin du chargement, setLoading(false)');
        setLoading(false);
      }
    };

    loadProduct();
  }, [actualProductId]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleColorChange = (colorId: number) => {
    setSelectedColorId(colorId);
  };

  const handleAddToCart = async () => {
    if (!product || !selectedColorId || !selectedSize) {
      console.error('Produit, couleur ou taille non sélectionnée');
      return;
    }

    const selectedColor = product.selectedColors.find(c => c.id === selectedColorId);
    if (!selectedColor) {
      console.error('Couleur sélectionnée non trouvée');
      return;
    }

    setIsAddingToCart(true);
    setAddedToCart(false);

    try {
      // Simuler un petit délai pour l'effet visuel
      await new Promise(resolve => setTimeout(resolve, 800));

      // Obtenir les délimitations de la couleur sélectionnée (pour produits traditionnels)
      let delimitations: any[] = [];
      if (product.adminProduct && product.adminProduct.colorVariations) {
        const colorVariation = product.adminProduct.colorVariations.find(cv => cv.id === selectedColorId);
        if (colorVariation && colorVariation.images && colorVariation.images.length > 0) {
          const mockupImage = colorVariation.images.find(img => img.viewType === 'Front') || colorVariation.images[0];
          if (mockupImage && mockupImage.delimitations) {
            delimitations = mockupImage.delimitations;
          }
        }
      }

      addToCart({
        id: product.id,
        name: product.adminProduct?.name || product.vendorName,
        price: product.price,
        color: selectedColor.name,
        colorCode: selectedColor.colorCode,
        size: selectedSize.name, // Pour compatibilité
        imageUrl: product.images.adminReferences[0]?.adminImageUrl || product.images.primaryImageUrl,
        designUrl: product.designApplication?.designUrl,
        vendorName: product.vendor?.shop_name || product.vendor?.fullName,
        // Nouvelles propriétés pour afficher le design dans le panier
        designId: product.designId || undefined,
        adminProductId: product.adminProduct?.id,
        designScale: product.designApplication?.scale,
        delimitations: delimitations.length > 0 ? delimitations : undefined,
        // Propriétés pour les vraies tailles de la base de données
        selectedSize: selectedSize,
        sizeId: selectedSize.id,
        sizeName: selectedSize.name
      });

      setAddedToCart(true);

      // Réinitialiser l'état après 2 secondes
      setTimeout(() => {
        setAddedToCart(false);
      }, 2000);

    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-gray-600">Chargement du produit...</span>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error || 'Produit non trouvé'}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const currentColor = product.selectedColors.find(c => c.id === selectedColorId);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="w-full px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <button onClick={() => navigate('/')} className="hover:text-gray-900 transition-colors">
            Accueil
          </button>
          <span>&gt;</span>
          <button onClick={() => navigate('/personnalisation')} className="hover:text-gray-900 transition-colors">
            Personnalisation
          </button>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">
            {product.adminProduct?.name || product.vendorName}
          </span>
        </div>
      </div>

      <div className="w-full px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
          {/* Colonne gauche : Images du produit */}
          <div className="space-y-6">
            {/* Image principale */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 aspect-square flex items-center justify-center">
              <SimpleProductPreview
                product={product as any}
                onColorChange={handleColorChange}
                showColorSlider={false}
                showDelimitations={false}
                onProductClick={() => {}}
                hideValidationBadges={true}
              />
            </div>

            {/* Miniatures des vues */}
            <div className="grid grid-cols-6 gap-3">
              {/* Première miniature : produit avec design incorporé */}
              <button
                className={`aspect-square bg-white rounded-lg border-2 transition-colors flex items-center justify-center relative overflow-hidden border-blue-500 ring-2 ring-blue-200`}
              >
                <div className="w-full h-full relative">
                  {/* Image du produit comme fond */}
                  <img
                    src={product.images.adminReferences[0]?.adminImageUrl || product.images.primaryImageUrl}
                    alt="Produit principal"
                    className="w-full h-full object-cover"
                  />

                  {/* Design superposé par-dessus */}
                  {product.designApplication?.hasDesign && product.designApplication.designUrl && (
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <img
                        src={product.designApplication.designUrl}
                        alt="Design personnalisé"
                        className="max-w-full max-h-full object-contain"
                        style={{
                          maxWidth: 'calc(100% - 32px)', // 16px padding de chaque côté
                          maxHeight: 'calc(100% - 32px)',
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Indicateur de sélection principale */}
                <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>

                
              </button>

              {/* Miniature du design seul */}
              {product.designApplication?.hasDesign && product.designApplication.designUrl && (
                <div className="aspect-square bg-white rounded-lg border-2 border-gray-200 flex items-center justify-center relative overflow-hidden">
                  <div className="w-full h-full relative bg-white p-4">
                    <img
                      src={product.designApplication.designUrl}
                      alt="Design"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Tabs Description / Caractéristiques / Avis */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex gap-6 border-b border-gray-200 mb-6">
                <button className="pb-3 px-2 border-b-2 border-blue-500 text-blue-600 font-semibold">
                  Description
                </button>
                <button className="pb-3 px-2 text-gray-600 hover:text-gray-900 transition-colors">
                  Caractéristiques du produit
                </button>
                <button className="pb-3 px-2 text-gray-600 hover:text-gray-900 transition-colors">
                  Avis
                </button>
              </div>

              <div className="text-gray-600 text-sm leading-relaxed space-y-4">
                <p>
                  {product.adminProduct?.description || 
                  "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit."}
                </p>
                <p>
                  Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam.
                </p>
              </div>
            </div>
          </div>

          {/* Colonne droite : Détails du produit */}
          <div className="space-y-6">
            {/* En-tête produit */}
            <div>
              <h1 className="text-5xl font-bold text-gray-900 mb-3" style={{ fontStyle: 'italic' }}>
                {product.adminProduct?.name || product.vendorName}
              </h1>
              <p className="text-base text-gray-600 mb-2" style={{ fontStyle: 'italic' }}>Détails</p>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4].map((star) => (
                    <span key={star} className="text-yellow-400 text-lg">★</span>
                  ))}
                  <span className="text-gray-300 text-lg">★</span>
                </div>
                <span className="text-xs text-gray-500">1.2k (ou 200) Les top avis</span>
              </div>
            </div>

            {/* Prix */}
            <div className="pb-6">
              <div className="mb-2">
                <p className="text-5xl font-bold text-gray-900" style={{ fontStyle: 'italic' }}>
                  {(product.price / 100).toLocaleString('fr-FR')} FCFA
                </p>
              </div>
              <p className="text-sm text-gray-500" style={{ fontStyle: 'italic' }}>
                Prix de base, hors personnalisation
              </p>
            </div>

            {/* Couleur sélectionnée - sans bordure */}
            <div className="pb-6">
              <p className="text-sm text-gray-700 mb-4" style={{ fontStyle: 'italic' }}>
                couleur selectionnée : <span className="text-gray-900 font-semibold">{currentColor?.name?.toUpperCase() || 'SÉLECTIONNEZ UNE COULEUR'}</span>
              </p>

              {/* Section avec checkbox */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 border-2 border-gray-900 rounded flex items-center justify-center">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-base text-gray-900">
                  Couleur selectionnée : <span className="font-semibold">{currentColor?.name?.toUpperCase() || 'BLEU'}</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {product.selectedColors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => handleColorChange(color.id)}
                    className={`w-12 h-12 rounded-lg border-2 transition-all relative ${
                      color.id === selectedColorId
                        ? 'border-blue-500'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color.colorCode }}
                    title={color.name}
                  >
                    {color.id === selectedColorId && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Taille - sans bordure */}
            <div className="pb-6">
              {/* Section avec checkbox */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 border-2 border-gray-900 rounded flex items-center justify-center">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-base text-gray-900">
                  Taille selectionnée : <span className="font-semibold">{selectedSize?.name || 'Sélectionner une taille'}</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {product.selectedSizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size)}
                    className={`px-6 py-3 rounded-lg border-2 font-medium transition-all ${
                      selectedSize?.id === size.id
                        ? 'border-blue-500 bg-blue-400 text-white'
                        : 'border-gray-900 bg-white text-gray-900'
                    }`}
                  >
                    {size.sizeName}
                  </button>
                ))}
              </div>
            </div>

            {/* Bouton ajouter au panier */}
            <div className="pt-4">
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || !selectedColorId || !selectedSize}
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                  addedToCart
                    ? 'bg-green-500 text-white'
                    : isAddingToCart
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                    : !selectedColorId || !selectedSize
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-yellow-400 text-gray-900 hover:bg-yellow-500 shadow-md hover:shadow-lg'
                }`}
              >
                {addedToCart ? (
                  <>
                    <Check className="w-6 h-6" />
                    Ajouté au panier !
                  </>
                ) : isAddingToCart ? (
                  <>
                    <div className="w-6 h-6 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                    Ajout en cours...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-6 h-6" />
                    Ajouter au panier
                  </>
                )}
              </button>

              {!selectedColorId && (
                <p className="text-red-500 text-sm mt-2">
                  Veuillez sélectionner une couleur
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicVendorProductDetailPage;