import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Heart, Share2, ShoppingCart, Plus, Minus, Check, 
  Truck, Shield, RotateCcw, Star, ChevronDown, ChevronUp,
  Palette, Ruler, Info, ChevronLeft, ChevronRight
} from 'lucide-react';

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { AspectRatio } from "../components/ui/aspect-ratio";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

import { Product } from '../schemas/product.schema';
import { fetchProductById } from '../services/api';
import { useCart, CartItem } from '../hooks/useCart';
import { useProducts } from '@/hooks/useProducts';
import RelatedProducts from '../components/RelatedProducts';

export default function ModernProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, formatPrice } = useCart();
  const { products } = useProducts(); // Récupérer tous les produits
  
  // États du produit
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États de l'interface
  const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageGallery, setImageGallery] = useState<Array<{url: string, type: string, label: string}>>([]);
  
  // Charger le produit
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const productData = await fetchProductById(id);
        setProduct(productData);
        
        // Sélectionner la première couleur par défaut
        if (productData.colors && productData.colors.length > 0) {
          setSelectedColorId(productData.colors[0].id);
        }
        
        // Sélectionner la première taille par défaut
        if (productData.sizes && productData.sizes.length > 0) {
          setSelectedSizeId(productData.sizes[0].id);
        }
        
        // Construire la galerie d'images
        buildImageGallery(productData);
      } catch (err) {
        setError('Erreur lors du chargement du produit');
        console.error('Erreur:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProduct();
  }, [id]);

  // Construire la galerie d'images à partir de toutes les sources disponibles
  const buildImageGallery = (product: Product) => {
    const gallery: Array<{url: string, type: string, label: string}> = [];
    
    // 1. Ajouter l'image du design si disponible
    if (product.designImageUrl) {
      gallery.push({
        url: product.designImageUrl,
        type: 'design',
        label: product.designName || 'Design personnalisé'
      });
    }
    
    // 2. Ajouter les images des couleurs
    if (product.colors && product.colors.length > 0) {
      product.colors.forEach(color => {
        if (color.imageUrl) {
          gallery.push({
            url: color.imageUrl,
            type: 'color',
            label: `Couleur ${color.name}`
          });
        }
      });
    }
    
    // 3. Ajouter les vues du produit
    if (product.views && product.views.length > 0) {
      product.views.forEach((view, index) => {
        if (view.imageUrl) {
          gallery.push({
            url: view.imageUrl,
            type: 'view',
            label: `Vue ${index + 1}`
          });
        }

      });
    }
    
    // 4. Ajouter l'image principale si aucune autre image n'est disponible
    if (gallery.length === 0 && product.imageUrl) {
      gallery.push({
        url: product.imageUrl,
        type: 'main',
        label: 'Image principale'
      });
    }
    
    // S'assurer qu'il y a au moins une image placeholder
    if (gallery.length === 0) {
      gallery.push({
        url: '/placeholder-product.jpg',
        type: 'placeholder',
        label: 'Image non disponible'
      });
    }
    
    setImageGallery(gallery);
    setActiveImageIndex(0);
  };

  // Obtenir l'image active selon l'index sélectionné et la couleur
  const getActiveImage = () => {
    if (imageGallery.length === 0) return '/placeholder-product.jpg';
    
    // Si une couleur est sélectionnée, essayer de trouver son image dans la galerie
    if (selectedColorId && product?.colors) {
      const selectedColor = product.colors.find(c => c.id === selectedColorId);
      if (selectedColor?.imageUrl) {
        const colorImageIndex = imageGallery.findIndex(img => 
          img.type === 'color' && img.url === selectedColor.imageUrl
        );
        if (colorImageIndex >= 0) {
          return imageGallery[colorImageIndex].url;
        }
      }
    }
    
    // Sinon, retourner l'image active de la galerie
    return imageGallery[activeImageIndex]?.url || '/placeholder-product.jpg';
  };

  // Ajouter au panier
  const handleAddToCart = () => {
    if (!product || !selectedColorId || !selectedSizeId) {
      toast.error('Veuillez sélectionner une couleur et une taille');
      return;
    }

    setIsAddingToCart(true);

    try {
      const selectedColor = product.colors?.find(c => c.id === selectedColorId);
      const selectedSize = product.sizes?.find(s => s.id === selectedSizeId);
      
      if (!selectedColor || !selectedSize) {
        toast.error('Sélection invalide');
        return;
      }

      const cartItem: CartItem = {
        productId: product.id!,
        productName: product.name,
        selectedColorId: selectedColor.id,
        selectedColorObject: {
          id: selectedColor.id,
          name: selectedColor.name,
          hexCode: selectedColor.hexCode || '#000000',
          imageUrl: selectedColor.imageUrl || ''
        },
        selectedColor: {
          id: selectedColor.id,
          name: selectedColor.name,
          hexCode: selectedColor.hexCode || '#000000',
          imageUrl: selectedColor.imageUrl || ''
        },
        selectedSize: {
          id: selectedSize.id,
          name: selectedSize.sizeName
        },
        quantity,
        unitPrice: product.price,
        totalPrice: product.price * quantity,
        productImage: getActiveImage()
      };

      // Utiliser le hook useCart pour ajouter l'article
      addToCart(cartItem);
      
      toast.success(`${product.name} ajouté au panier!`, {
        description: `${quantity} x ${selectedColor.name} - ${selectedSize.sizeName}`
      });

      // Réinitialiser l'état
      setQuantity(1);
      
    } catch (error) {
      toast.error('Erreur lors de l\'ajout au panier');
      console.error('Erreur:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Gestion des favoris
  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris');
  };

  // Partager le produit
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Lien copié dans le presse-papiers');
    }
  };

  // Acheter maintenant
  const handleBuyNow = () => {
    if (!product || !selectedColorId || !selectedSizeId) {
      toast.error('Veuillez sélectionner une couleur et une taille');
      return;
    }

    try {
      const selectedColor = product.colors?.find(c => c.id === selectedColorId);
      const selectedSize = product.sizes?.find(s => s.id === selectedSizeId);
      
      if (!selectedColor || !selectedSize) {
        toast.error('Sélection invalide');
        return;
      }

      // Créer l'objet de commande directe avec support colorId
      const orderItem = {
        id: product.id!.toString(),
        title: product.name,
        price: `${product.price} CFA`,
        image: getActiveImage(),
        quantity,
        selectedColorId: selectedColor.id,
        selectedColorObject: {
          id: selectedColor.id,
          name: selectedColor.name,
          hexCode: selectedColor.hexCode || '#000000',
          imageUrl: selectedColor.imageUrl || ''
        },
        size: selectedSize.sizeName,
        color: selectedColor.name,
        productData: {
          productId: product.id!,
          selectedColor,
          selectedSize,
          unitPrice: product.price,
          totalPrice: product.price * quantity
        }
      };

      // Rediriger vers la page de commande
      navigate('/cart', {
        state: {
          product: orderItem,
          quantity,
          selectedSize: selectedSize.sizeName,
          selectedColor: selectedColor.name,
          selectedColorId: selectedColor.id,
          selectedColorObject: selectedColor,
          buyNow: true
        }
      });

    } catch (error) {
      toast.error('Erreur lors de la préparation de la commande');
      console.error('Erreur:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="space-y-6">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Produit non trouvé</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Le produit que vous recherchez n'existe pas.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation breadcrumb */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-2 text-sm">
            <button 
              onClick={() => navigate('/')}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Accueil
            </button>
            <span className="text-gray-300">/</span>
            <button 
              onClick={() => navigate('/products')}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Produits
            </button>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 dark:text-white font-medium">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images du produit avec galerie */}
          <div className="space-y-4">
            {/* Image principale */}
            <AspectRatio ratio={1} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <img
                src={getActiveImage()}
                alt={imageGallery[activeImageIndex]?.label || product.name}
                className="w-full h-full object-cover"
              />
              
              {/* Badge du type d'image */}
              {imageGallery[activeImageIndex] && (
                <div className="absolute top-4 left-4">
                  <Badge 
                    variant="secondary" 
                    className="bg-white/90 backdrop-blur-sm text-gray-800 capitalize"
                  >
                    {imageGallery[activeImageIndex].type === 'design' && '🎨 Design'}
                    {imageGallery[activeImageIndex].type === 'color' && '🎨 Couleur'}
                    {imageGallery[activeImageIndex].type === 'view' && '👁️ Vue'}
                    {imageGallery[activeImageIndex].type === 'main' && '📷 Principal'}
                  </Badge>
                </div>
              )}
              
              {/* Navigation des images si plus d'une image */}
              {imageGallery.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex(prev => 
                      prev > 0 ? prev - 1 : imageGallery.length - 1
                    )}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex(prev => 
                      prev < imageGallery.length - 1 ? prev + 1 : 0
                    )}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </AspectRatio>
            
            {/* Galerie de miniatures */}
            {imageGallery.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {imageGallery.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      activeImageIndex === index 
                        ? 'border-gray-900 dark:border-white ring-2 ring-gray-200 dark:ring-gray-600' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.label}
                      className="w-full h-full object-cover"
                    />
                    {/* Indicateur de type sur la miniature */}
                    <div className="absolute bottom-1 right-1">
                      <div className="w-2 h-2 rounded-full bg-white/80">
                        {image.type === 'design' && <div className="w-full h-full bg-purple-500 rounded-full" />}
                        {image.type === 'color' && <div className="w-full h-full bg-blue-500 rounded-full" />}
                        {image.type === 'view' && <div className="w-full h-full bg-green-500 rounded-full" />}
                        {image.type === 'main' && <div className="w-full h-full bg-gray-500 rounded-full" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {/* Légende de l'image active */}
            {imageGallery[activeImageIndex] && (
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {imageGallery[activeImageIndex].label}
                  {imageGallery.length > 1 && (
                    <span className="ml-2 text-gray-400">
                      ({activeImageIndex + 1}/{imageGallery.length})
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Informations du produit */}
          <div className="space-y-6">
            {/* En-tête */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleToggleFavorite}
                    className={isFavorite ? 'text-red-500 border-red-500' : ''}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Prix et description */}
              <div className="space-y-4">
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(product.price)}
                  </span>
                  {/* Commented out originalPrice since it's not in the schema
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-lg text-gray-500 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                  */}
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                      />
                    ))}
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">(4.0)</span>
                  </div>
                  <Badge variant="secondary" className="text-green-700 bg-green-100">
                    En stock
                  </Badge>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {product.description}
                </p>
              </div>
            </div>

            {/* Sélection des options */}
            <div className="space-y-6">
              {/* Sélection de la couleur */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Palette className="w-4 h-4 text-gray-600" />
                    <Label className="text-sm font-medium">
                      Couleur: {product.colors.find(c => c.id === selectedColorId)?.name}
                    </Label>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setSelectedColorId(color.id)}
                        className={`relative p-2 rounded-lg border-2 transition-all hover:shadow-md ${
                          selectedColorId === color.id
                            ? 'border-gray-900 dark:border-white ring-2 ring-gray-200 dark:ring-gray-600'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                        }`}
                      >
                        <div 
                          className="w-full h-8 rounded-md border"
                          style={{ backgroundColor: color.hexCode || '#000000' }}
                        />
                        <div className="mt-1 text-xs text-center text-gray-700 dark:text-gray-300 truncate">
                          {color.name}
                        </div>
                        {selectedColorId === color.id && (
                          <Check className="absolute top-1 right-1 w-3 h-3 text-white bg-gray-900 rounded-full p-0.5" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sélection de la taille */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Ruler className="w-4 h-4 text-gray-600" />
                      <Label className="text-sm font-medium">
                        Taille: {product.sizes.find(s => s.id === selectedSizeId)?.sizeName}
                      </Label>
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setShowSizeGuide(!showSizeGuide)}
                      className="text-xs p-0 h-auto"
                    >
                      Guide des tailles
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {product.sizes.map((size) => (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSizeId(size.id)}
                        className={`relative p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                          selectedSizeId === size.id
                            ? 'border-gray-900 dark:border-white ring-2 ring-gray-200 dark:ring-gray-600'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-sm font-medium text-center">
                          {size.sizeName}
                        </div>
                        {selectedSizeId === size.id && (
                          <Check className="absolute top-1 right-1 w-3 h-3 text-white bg-gray-900 rounded-full p-0.5" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Guide des tailles */}
              {showSizeGuide && (
                <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Guide des tailles</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSizeGuide(false)}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <strong>S:</strong> Poitrine 86-91cm
                      </div>
                      <div>
                        <strong>M:</strong> Poitrine 91-96cm
                      </div>
                      <div>
                        <strong>L:</strong> Poitrine 96-101cm
                      </div>
                      <div>
                        <strong>XL:</strong> Poitrine 101-106cm
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Quantité */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Quantité</Label>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="h-10 w-10 rounded-l-lg rounded-r-none"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 h-10 text-center border-0 border-x focus:ring-0 rounded-none"
                      min="1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-10 w-10 rounded-r-lg rounded-l-none"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Prix total: {formatPrice(product.price * quantity)}
                  </span>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <Button
                  size="lg"
                  onClick={handleBuyNow}
                  disabled={!selectedColorId || !selectedSizeId}
                  className="w-full"
                >
                  Acheter maintenant
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || !selectedColorId || !selectedSizeId}
                  className="w-full"
                >
                  {isAddingToCart ? (
                    <span className="flex items-center">
                      <span className="animate-spin mr-2 w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></span>
                      Ajout en cours...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Ajouter au panier
                    </span>
                  )}
                </Button>
              </div>

              {/* Informations de livraison */}
              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-start space-x-3 text-sm">
                  <Truck className="w-4 h-4 mt-0.5 text-green-600" />
                  <div>
                    <div className="font-medium">Livraison rapide</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Livraison en 24-48h partout au Sénégal
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3 text-sm">
                  <Shield className="w-4 h-4 mt-0.5 text-blue-600" />
                  <div>
                    <div className="font-medium">Paiement sécurisé</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Paiement mobile sécurisé (Wave, Orange Money)
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3 text-sm">
                  <RotateCcw className="w-4 h-4 mt-0.5 text-purple-600" />
                  <div>
                    <div className="font-medium">Retours gratuits</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      14 jours pour changer d'avis
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Détails du produit */}
            <div>
              <Button
                variant="ghost"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full justify-between p-0 h-auto"
              >
                <span className="flex items-center space-x-2">
                  <Info className="w-4 h-4" />
                  <span className="font-medium">Détails du produit</span>
                </span>
                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              
              {showDetails && (
                <Card className="mt-3 p-4">
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">Matériau:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        Coton 100%
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Entretien:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        Lavage machine 30°C, séchage à l'air libre
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Origine:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">
                        Fabriqué au Sénégal
                      </span>
                    </div>
                    {product.designName && (
                      <div>
                        <span className="font-medium">Design:</span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">
                          {product.designName}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Produits similaires */}
        <div className="mt-16">
          <RelatedProducts 
            currentProduct={product} 
            products={products || []}
          />
        </div>
      </div>
    </div>
  );
}
