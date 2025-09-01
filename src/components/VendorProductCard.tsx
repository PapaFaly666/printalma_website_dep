import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Crown, User, ShoppingBag, Eye } from 'lucide-react';

interface VendorProductCardProps {
    product: {
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
        designDelimitations?: Array<{
            colorName: string;
            colorCode: string;
            imageUrl: string;
            naturalWidth: number;
            naturalHeight: number;
            delimitations: Array<{
                name: string;
                x: number;
                y: number;
                width: number;
                height: number;
                description: string;
            }>;
        }>;
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
    };
}

const VendorProductCard: React.FC<VendorProductCardProps> = ({ product }) => {
    const navigate = useNavigate();
    const [selectedColorId, setSelectedColorId] = useState<number>(product.selectedColors?.[0]?.id || product.adminProduct?.colorVariations?.[0]?.id || 0);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageMetrics, setImageMetrics] = useState({
        originalWidth: 0,
        originalHeight: 0,
        displayWidth: 0,
        displayHeight: 0,
        offsetX: 0,
        offsetY: 0
    });
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Log pour diagnostiquer les délimitations
    console.log('🎨 VendorProductCard - Produit reçu:', product.id);
    console.log('🎨 VendorProductCard - designDelimitations:', product.designDelimitations);
    console.log('🎨 VendorProductCard - designPositions:', product.designPositions);
    console.log('🎨 VendorProductCard - designApplication:', product.designApplication);
    console.log('🎨 VendorProductCard - design:', product.design);
    console.log('🎨 VendorProductCard - Conditions design:', {
        hasDesign: product.designApplication?.hasDesign,
        design: !!product.design,
        designUrl: product.design?.imageUrl,
        designPositions: product.designPositions?.length > 0
    });

    // Calculer les métriques de l'image quand elle est chargée
    const calculateImageMetrics = useCallback(() => {
        if (!imageRef.current || !containerRef.current) return;

        const img = imageRef.current;
        const container = containerRef.current;
        
        const originalWidth = img.naturalWidth;
        const originalHeight = img.naturalHeight;
        const containerRect = container.getBoundingClientRect();
        
        // Calculer les dimensions d'affichage (object-fit: contain)
        const containerRatio = containerRect.width / containerRect.height;
        const imageRatio = originalWidth / originalHeight;
        
        let displayWidth, displayHeight, offsetX, offsetY;
        
        if (imageRatio > containerRatio) {
            // Image plus large que le container
            displayWidth = containerRect.width;
            displayHeight = containerRect.width / imageRatio;
            offsetX = 0;
            offsetY = (containerRect.height - displayHeight) / 2;
        } else {
            // Image plus haute que le container
            displayHeight = containerRect.height;
            displayWidth = containerRect.height * imageRatio;
            offsetX = (containerRect.width - displayWidth) / 2;
            offsetY = 0;
        }
        
        setImageMetrics({
            originalWidth,
            originalHeight,
            displayWidth,
            displayHeight,
            offsetX,
            offsetY
        });
    }, []);

    // Observer les changements de taille du container
    useEffect(() => {
        if (!containerRef.current) return;
        
        let resizeTimeout: NodeJS.Timeout;
        
        const handleResize = () => {
            // Debounce pour éviter trop de recalculs
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                calculateImageMetrics();
            }, 100);
        };
        
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(containerRef.current);
        
        return () => {
            resizeObserver.disconnect();
            clearTimeout(resizeTimeout);
        };
    }, [calculateImageMetrics]);

    // Recalculer les métriques quand l'image change (changement de couleur)
    useEffect(() => {
        if (imageRef.current && imageRef.current.complete) {
            calculateImageMetrics();
        }
    }, [selectedColorId, calculateImageMetrics]);

    // Calculer la position responsive du design (comme dans VendorProductDetails)
    const getResponsiveDesignPosition = useCallback(() => {
        if (!imageMetrics.displayWidth || !imageMetrics.displayHeight) {
            return { width: 200, height: 200, transform: 'translate(-50%, -50%)' };
        }

        const designPosition = product.designPositions?.[0]?.position;
        if (!designPosition) {
            return { width: 200, height: 200, transform: 'translate(-50%, -50%)' };
        }

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
    }, [imageMetrics, product.designPositions]);

    const handleProductClick = () => {
        navigate(`/vendor-product/${product.id}`, { 
            state: { 
                product,
                vendorInfo: product.vendor,
                designInfo: product.design
            } 
        });
    };

    // Formater le prix en FCFA
    const formatPriceInFCFA = (price: number) => {
        return new Intl.NumberFormat('fr-SN', {
            style: 'currency',
            currency: 'XOF',
            maximumFractionDigits: 0,
            currencyDisplay: 'symbol'
        }).format(price);
    };

    // Obtenir l'image du produit pour la couleur sélectionnée
    const getProductImage = () => {
        const colorVariation = product.adminProduct.colorVariations.find(cv => cv.id === selectedColorId);
        return colorVariation?.images[0]?.url || product.adminProduct.colorVariations[0]?.images[0]?.url || '/placeholder-product.jpg';
    };

    // Obtenir toutes les couleurs disponibles
    const getAvailableColors = () => {
        return product.adminProduct.colorVariations.map(colorVariation => ({
            id: colorVariation.id,
            name: colorVariation.name,
            hexCode: colorVariation.colorCode,
            imageUrl: colorVariation.images[0]?.url || '/placeholder-product.jpg'
        }));
    };

    // Gérer le changement de couleur
    const handleColorChange = (colorId: number) => {
        setSelectedColorId(colorId);
        setCurrentImageIndex(0); // Reset l'index d'image quand on change de couleur
    };

    const productImage = getProductImage();
    const availableColors = getAvailableColors();

    // Logs de diagnostic pour le design
    console.log('🎨 VendorProductCard - Diagnostic design:', {
        productId: product.id,
        hasDesign: product.designApplication?.hasDesign,
        designExists: !!product.design,
        designUrl: product.design?.imageUrl,
        designPositionsLength: product.designPositions?.length,
        productImage,
        availableColorsLength: availableColors.length
    });

    return (
        <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 bg-white">
            <CardContent className="p-0">
                {/* Badge Meilleure Vente */}
                {product.bestSeller?.isBestSeller && (
                    <div className="absolute top-2 right-2 z-10">
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 text-xs">
                            <Crown className="w-3 h-3 mr-1" />
                            Meilleure Vente
                        </Badge>
                    </div>
                )}

                {/* Image du produit avec design incorporé - Utilise la même logique que VendorProductDetails */}
                <div className="relative aspect-[4/5] overflow-hidden bg-gray-50" ref={containerRef}>
                    {product.designApplication?.hasDesign && product.design ? (
                        <div className="relative w-full h-full">
                            {/* Image du produit */}
                            <img
                                src={productImage}
                                alt={product.adminProduct.name}
                                className="absolute inset-0 w-full h-full object-contain"
                                draggable={false}
                                onLoad={calculateImageMetrics}
                                ref={imageRef}
                            />
                            
                            {/* Design incorporé - Même logique responsive que VendorProductDetails */}
                            {imageMetrics.displayWidth > 0 && (
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
                                            draggable={false}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <img
                            src={productImage}
                            alt={product.adminProduct.name}
                            className="w-full h-full object-contain"
                            onLoad={calculateImageMetrics}
                            ref={imageRef}
                        />
                    )}

                    {/* Overlay au survol */}
                    <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                        <Button 
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white text-gray-900 hover:bg-gray-100"
                            onClick={handleProductClick}
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            Voir le produit
                        </Button>
                    </div>

                    {/* Slider de couleurs */}
                    {availableColors.length > 1 && (
                        <div className="absolute bottom-2 left-2 right-2">
                            <div className="flex gap-1 justify-center">
                                {availableColors.map((color) => (
                                    <button
                                        key={color.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleColorChange(color.id);
                                        }}
                                        className={`w-4 h-4 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                                            selectedColorId === color.id
                                                ? 'border-white shadow-md scale-110'
                                                : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                        style={{ backgroundColor: color.hexCode }}
                                        title={color.name}
                                        aria-label={`Couleur ${color.name}`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Informations du produit */}
                <div className="p-4">
                    {/* Titre et prix */}
                    <div className="mb-3">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2">
                            {product.vendorName || product.adminProduct?.name || 'Produit'}
                        </h3>
                        <p className="text-xl font-bold text-primary">
                            {formatPriceInFCFA(product.price)}
                        </p>
                    </div>

                    {/* Informations du vendeur */}
                    <div className="flex items-center mb-3">
                        <img
                            src={product.vendor?.profile_photo_url || '/placeholder-avatar.jpg'}
                            alt={product.vendor?.fullName || 'Vendeur'}
                            className="w-6 h-6 rounded-full mr-2 object-cover"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">
                                {product.vendor?.fullName || 'Vendeur'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {product.vendor?.shop_name || 'Boutique'}
                            </p>
                        </div>
                    </div>

                    {/* Informations supplémentaires */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                                {product.design?.category || 'Produit'}
                            </Badge>
                            {product.design?.isValidated && (
                                <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                    Validé
                                </Badge>
                            )}
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={handleProductClick}
                            className="text-primary hover:text-primary/80"
                        >
                            Détails
                        </Button>
                    </div>

                    {/* Statistiques de vente (si disponible) */}
                    {product.bestSeller?.salesCount && (
                        <div className="mt-2 text-xs text-gray-500">
                            <span>Vendus: {product.bestSeller.salesCount}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default VendorProductCard; 