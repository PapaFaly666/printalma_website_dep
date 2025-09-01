import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Heart, Share2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Separator } from '../components/ui/separator';

interface VendorProductDetails {
    id: number;
    vendorName: string;
    price: number;
    status: string;
    bestSeller: {
        isBestSeller: boolean;
        salesCount: number;
        totalRevenue: number;
    };
    adminProduct: {
        id: number;
        name: string;
        description: string;
        price: number;
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
                designUrl: string | null;
                designPublicId: string | null;
                designFileName: string | null;
                designUploadDate: string | null;
                designSize: number | null;
                designOriginalName: string | null;
                designDescription: string | null;
                isDesignActive: boolean;
                colorVariationId: number;
            }>;
        }>;
        sizes: string[];
    };
    designApplication: {
        hasDesign: boolean;
        designUrl: string;
        positioning: string;
        scale: number;
        mode: string;
    };
    designPositions: Array<{
        designId: number;
        position: {
            x: number;
            y: number;
            scale: number;
            rotation: number;
            constraints: any;
            designWidth: number;
            designHeight: number;
        };
    }>;
    design: {
        id: number;
        name: string;
        description: string;
        category: string;
        imageUrl: string;
        tags: string[];
        isValidated: boolean;
    };
    vendor: {
        id: number;
        fullName: string;
        shop_name: string;
        profile_photo_url: string;
    };
    images: {
        adminReferences: Array<{
            colorName: string;
            colorCode: string;
            adminImageUrl: string;
            imageType: string;
        }>;
        total: number;
        primaryImageUrl: string;
    };
    selectedSizes: Array<{
        id: number;
        sizeName: string;
    }>;
    selectedColors: Array<{
        id: number;
        name: string;
        colorCode: string;
    }>;
    designId: number;
}

export default function VendorProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [product, setProduct] = useState<VendorProductDetails | null>(null);
    const [selectedColorId, setSelectedColorId] = useState<number>(0);
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageMetrics, setImageMetrics] = useState<{
        originalWidth: number;
        originalHeight: number;
        displayWidth: number;
        displayHeight: number;
        offsetX: number;
        offsetY: number;
    } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    // Récupérer les données du produit depuis l'état de navigation
    useEffect(() => {
        const locationState = location.state as any;
        if (locationState?.product) {
            setProduct(locationState.product);
            setSelectedColorId(locationState.product.selectedColors?.[0]?.id || locationState.product.adminProduct?.colorVariations?.[0]?.id || 0);
            setLoading(false);
        } else {
            // Si pas de données dans l'état, récupérer depuis l'API
            fetchProductDetails();
        }
    }, [id, location.state]);

    const fetchProductDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`https://printalma-back-dep.onrender.com/public/vendor-products/${id}`);
            const data = await response.json();
            
            if (data.success && data.data) {
                setProduct(data.data);
                setSelectedColorId(data.data.selectedColors?.[0]?.id || data.data.adminProduct?.colorVariations?.[0]?.id || 0);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des détails du produit:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectedColor = product?.selectedColors?.find(color => color.id === selectedColorId);
    if (selectedColor) {
      // Utiliser selectedColor si nécessaire
      console.log('Couleur sélectionnée:', selectedColor);
    }
    const selectedColorVariation = product?.adminProduct?.colorVariations?.find(cv => cv.id === selectedColorId);
    const currentImage = selectedColorVariation?.images?.[0]?.url || product?.images?.primaryImageUrl || '/placeholder-product.jpg';

    // Calculer les métriques d'image
    const calculateImageMetrics = () => {
        if (!imgRef.current || !containerRef.current) return null;

        const img = imgRef.current;
        const container = containerRef.current;
        
        const originalWidth = img.naturalWidth;
        const originalHeight = img.naturalHeight;
        const containerRect = container.getBoundingClientRect();
        
        const containerRatio = containerRect.width / containerRect.height;
        const imageRatio = originalWidth / originalHeight;
        
        let displayWidth, displayHeight, offsetX, offsetY;
        
        if (imageRatio > containerRatio) {
            displayWidth = containerRect.width;
            displayHeight = containerRect.width / imageRatio;
            offsetX = 0;
            offsetY = (containerRect.height - displayHeight) / 2;
        } else {
            displayHeight = containerRect.height;
            displayWidth = containerRect.height * imageRatio;
            offsetX = (containerRect.width - displayWidth) / 2;
            offsetY = 0;
        }
        
        return {
            originalWidth,
            originalHeight,
            displayWidth,
            displayHeight,
            offsetX,
            offsetY
        };
    };

    // Calculer la position responsive du design
    const getResponsiveDesignPosition = () => {
        if (!imageMetrics || !product) return { width: 200, height: 200, transform: 'translate(-50%, -50%)' };

        const designPosition = product.designPositions?.[0]?.position;
        if (!designPosition) return { width: 200, height: 200, transform: 'translate(-50%, -50%)' };

        const { displayWidth, displayHeight } = imageMetrics;

        // Calculer les dimensions responsive du design
        const designWidth = designPosition.designWidth || 200;
        const designHeight = designPosition.designHeight || 200;

        // Calculer le ratio de l'image originale
        const imageRatio = imageMetrics.originalWidth / imageMetrics.originalHeight;
        
        // Calculer les dimensions responsive
        let responsiveWidth, responsiveHeight;
        
        if (imageRatio > 1) {
            // Image plus large que haute
            responsiveWidth = (designWidth / imageMetrics.originalWidth) * displayWidth;
            responsiveHeight = (designHeight / imageMetrics.originalHeight) * displayHeight;
        } else {
            // Image plus haute que large
            responsiveWidth = (designWidth / imageMetrics.originalWidth) * displayWidth;
            responsiveHeight = (designHeight / imageMetrics.originalHeight) * displayHeight;
        }

        // Calculer la position responsive
        const responsiveX = (designPosition.x / imageMetrics.originalWidth) * displayWidth;
        const responsiveY = (designPosition.y / imageMetrics.originalHeight) * displayHeight;

        return {
            width: responsiveWidth,
            height: responsiveHeight,
            transform: `translate(-50%, -50%) translate(${responsiveX}px, ${responsiveY}px) rotate(${designPosition.rotation}deg)`
        };
    };

    // Mettre à jour les métriques quand l'image est chargée
    useEffect(() => {
        if (imageLoaded) {
            const metrics = calculateImageMetrics();
            setImageMetrics(metrics);
        }
    }, [imageLoaded, selectedColorId]);

    // Debug: Afficher les informations du produit
    useEffect(() => {
        if (product) {
            console.log('Product info:', {
                hasAdminProduct: product.adminProduct,
                description: product.adminProduct?.description,
                name: product.adminProduct?.name,
                price: product.adminProduct?.price
            });
        }
    }, [product]);

    const handleAddToCart = () => {
        // Logique pour ajouter au panier
        console.log('Ajouter au panier:', {
            productId: product?.id,
            colorId: selectedColorId,
            size: selectedSize,
            quantity
        });
    };

    const handleBuyNow = () => {
        // Logique pour acheter maintenant
        console.log('Acheter maintenant:', {
            productId: product?.id,
            colorId: selectedColorId,
            size: selectedSize,
            quantity
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement des détails du produit...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Produit non trouvé</h2>
                    <p className="text-gray-600 mb-4">Le produit que vous recherchez n'existe pas.</p>
                    <Button onClick={() => navigate('/')}>
                        Retour à l'accueil
                    </Button>
                </div>
            </div>
        );
    }

    // Formater le prix en FCFA
    const formatPriceInFCFA = (price: number) => {
        return new Intl.NumberFormat('fr-SN', {
            style: 'currency',
            currency: 'XOF',
            maximumFractionDigits: 0,
            currencyDisplay: 'symbol'
        }).format(price);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header avec navigation */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Button
                            variant="ghost"
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Retour
                        </Button>
                        
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon">
                                <Heart className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                                <Share2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Galerie d'images */}
                    <div className="space-y-4">
                        {/* Image principale avec design incorporé */}
                        <div className="aspect-square bg-white rounded-lg overflow-hidden border relative">
                            <div ref={containerRef} className="w-full h-full relative">
                                <img
                                    ref={imgRef}
                                    src={currentImage}
                                    alt={product.adminProduct.name}
                                    className="w-full h-full object-contain"
                                    onLoad={() => setImageLoaded(true)}
                                />
                                
                                {/* Design incorporé */}
                                {product.designApplication?.hasDesign && product.design && imageMetrics && (
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div
                                            className="absolute"
                                            style={{
                                                left: '50%',
                                                top: '50%',
                                                ...getResponsiveDesignPosition()
                                            }}
                                        >
                                            <img
                                                src={product.design.imageUrl}
                                                alt={product.design.name}
                                                className="w-full h-full object-contain"
                                                style={{
                                                    transform: `scale(${product.designPositions?.[0]?.position?.scale || product.designApplication?.scale || 1})`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Images des couleurs */}
                        {product.selectedColors.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto">
                                {product.selectedColors.map((color) => {
                                    const colorVariation = product.adminProduct.colorVariations.find(cv => cv.id === color.id);
                                    const colorImage = colorVariation?.images[0]?.url;
                                    
                                    return (
                                        <button
                                            key={color.id}
                                            onClick={() => setSelectedColorId(color.id)}
                                            className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden relative ${
                                                selectedColorId === color.id 
                                                    ? 'border-primary' 
                                                    : 'border-gray-200'
                                            }`}
                                        >
                                            <img
                                                src={colorImage}
                                                alt={color.name}
                                                className="w-full h-full object-cover"
                                            />
                                            
                                            {/* Design incorporé dans les miniatures - version simplifiée */}
                                            {product.designApplication?.hasDesign && product.design && (
                                                <div className="absolute inset-0 pointer-events-none">
                                                    <div
                                                        className="absolute"
                                                        style={{
                                                            left: '50%',
                                                            top: '50%',
                                                            width: '60%',
                                                            height: '60%',
                                                            transform: 'translate(-50%, -50%)',
                                                        }}
                                                    >
                                                        <img
                                                            src={product.design.imageUrl}
                                                            alt={product.design.name}
                                                            className="w-full h-full object-contain"
                                                            style={{
                                                                transform: `scale(${(product.designPositions?.[0]?.position?.scale || product.designApplication?.scale || 1) * 0.3})`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Informations du produit */}
                    <div className="space-y-6">
                        {/* En-tête du produit */}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {product.vendorName}
                            </h1>
                            
                            {/* Description du produit à la place du prix */}
                            {product.adminProduct?.description && (
                                <p className="text-2xl font-bold text-primary mb-4">
                                    {product.adminProduct.description}
                                </p>
                            )}
                            
                            {/* Prix du produit de base */}
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-sm text-gray-500">Prix de base:</span>
                                <span className="text-lg font-medium text-gray-700">
                                    {formatPriceInFCFA(product.adminProduct?.price || 0)}
                                </span>
                            </div>

                            {/* Description du design */}
                            {product.design?.description && (
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {product.design.description}
                                    </p>
                                </div>
                            )}

                            {/* Créé par */}
                            <div className="mb-4">
                                <span className="text-sm text-gray-500">Créé par : </span>
                                <button 
                                    className="text-sm font-medium text-primary underline hover:text-primary/80 cursor-pointer transition-colors"
                                    onClick={() => {
                                        // Navigation vers le profil du créateur (à implémenter)
                                        console.log('Navigation vers le profil de:', product.vendor?.fullName);
                                    }}
                                >
                                    {product.vendor?.fullName || 'Créateur'}
                                </button>
                            </div>
                        </div>

                        {/* Informations du design */}
                        {product.design && (
                            <Card>
                                <CardContent className="p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">
                                        Design: {product.design?.name || 'Design'}
                                    </h3>
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={product.design?.imageUrl || '/placeholder-design.jpg'}
                                            alt={product.design?.name || 'Design'}
                                            className="w-20 h-20 rounded-lg object-cover"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-600 mb-2">
                                                {product.design?.description || 'Aucune description disponible'}
                                            </p>
                                            <Badge variant="outline">
                                                {product.design?.category || 'Design'}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Sélection de la couleur */}
                        {product.selectedColors.length > 1 && (
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">
                                    Couleur
                                </h3>
                                <div className="flex gap-2">
                                    {product.selectedColors.map((color) => (
                                        <button
                                            key={color.id}
                                            onClick={() => setSelectedColorId(color.id)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                                                selectedColorId === color.id 
                                                    ? 'border-primary bg-primary/5' 
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <div
                                                className="w-4 h-4 rounded-full border"
                                                style={{ backgroundColor: color.colorCode }}
                                            />
                                            <span className="text-sm font-medium">
                                                {color.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sélection de la taille */}
                        {product.selectedSizes && product.selectedSizes.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">
                                    Taille
                                </h3>
                                <div className="flex gap-2">
                                    {product.selectedSizes.map((size) => (
                                        <button
                                            key={size.id}
                                            onClick={() => setSelectedSize(size.sizeName)}
                                            className={`px-4 py-2 rounded-lg border-2 transition-all ${
                                                selectedSize === size.sizeName 
                                                    ? 'border-primary bg-primary text-primary-foreground' 
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            {size.sizeName}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantité */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3">
                                Quantité
                            </h3>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                >
                                    -
                                </Button>
                                <span className="w-12 text-center font-medium">
                                    {quantity}
                                </span>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setQuantity(quantity + 1)}
                                >
                                    +
                                </Button>
                            </div>
                        </div>

                        <Separator />

                        {/* Actions */}
                        <div className="space-y-3">
                            <Button 
                                onClick={handleAddToCart}
                                className="w-full"
                                size="lg"
                            >
                                <ShoppingBag className="w-4 h-4 mr-2" />
                                Ajouter au panier
                            </Button>
                            
                            <Button 
                                onClick={handleBuyNow}
                                variant="outline"
                                className="w-full"
                                size="lg"
                            >
                                Acheter maintenant
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Description détaillée */}
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Description
                    </h2>
                    <Card>
                        <CardContent className="p-6">
                            <p className="text-gray-700 leading-relaxed">
                                {product.adminProduct.description}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
} 