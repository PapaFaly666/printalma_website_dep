import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import useFeaturedSlider from '../hooks/useFeaturedSlider';
import VendorProductCard from './VendorProductCard';
import Button from './ui/Button';

interface VendorProduct {
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
}

interface VendorProductsSliderProps {
    products: VendorProduct[];
    title: string;
}

export default function VendorProductsSlider({ products, title }: VendorProductsSliderProps) {
    const {
        emblaRef,
        prevBtnEnabled,
        nextBtnEnabled,
        selectedIndex,
        scrollSnaps,
        scrollPrev,
        scrollNext,
        scrollTo,
    } = useFeaturedSlider({
        loop: true,
        align: 'start',
        skipSnaps: false,
        containScroll: 'trimSnaps',
    });

    const navigate = useNavigate();

    const handleViewAllClick = () => {
        navigate('/vendor-products');
    };

    if (products.length === 0) {
        return null;
    }

    return (
        <section className="w-full bg-background py-16 md:py-20 lg:py-24">
            <div className="w-full">
                {/* Header */}
                <div className="text-center mb-12 md:mb-16 lg:mb-20 px-6 md:px-8">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light text-foreground mb-6 md:mb-8 tracking-tight">
                        {title}
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                        Découvrez les créations uniques de nos vendeurs talentueux
                    </p>
                </div>

                {/* Slider */}
                <div className="relative px-6 md:px-8 lg:px-12">
                    <div className="overflow-hidden" ref={emblaRef}>
                        <div className="flex gap-4 md:gap-6 lg:gap-8">
                            {products.map((product) => (
                                <div key={product.id} className="flex-none w-[calc(100%-2rem)] sm:w-[calc(50%-1rem)] md:w-[calc(33.333%-1.5rem)] lg:w-[calc(25%-1.5rem)] xl:w-[calc(20%-1.6rem)]">
                                    <VendorProductCard product={product} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation buttons */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border-2 hover:bg-background/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={scrollPrev}
                        disabled={!prevBtnEnabled}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border-2 hover:bg-background/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={scrollNext}
                        disabled={!nextBtnEnabled}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>

                    {/* Dots indicator */}
                    {scrollSnaps.length > 1 && (
                        <div className="flex justify-center mt-8 gap-2">
                            {scrollSnaps.map((_, index) => (
                                <button
                                    key={index}
                                    className={`w-2 h-2 rounded-full transition-all ${
                                        index === selectedIndex ? 'bg-primary w-6' : 'bg-muted'
                                    }`}
                                    onClick={() => scrollTo(index)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* View All Button */}
                <div className="text-center mt-12">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={handleViewAllClick}
                        className="group hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                        Voir tous les produits vendeurs
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </div>
        </section>
    );
} 