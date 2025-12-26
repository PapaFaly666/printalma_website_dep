import { useEffect, useState } from 'react';
import Footer from '../components/Footer';
import CarousselContainer from '../components/CarousselContainer';
import FeaturedSlider from '../components/FeaturedSlider';
import VendorProductsSlider from '../components/VendorProductsSlider';
import BestSellersCarousel from '../components/BestSellersCarousel';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '../schemas/product.schema';
import featuredBrands from '../data/marqueData';
import CategoryTabs from '../components/CategoryTabs';
import HorizontalTabs from '../components/HorizontalTabs';
import TravailRemarquable from '../components/TravailRemarquable';
import ThemeTendance from '../components/ThemeTendance';
import SurLesReseaux from '../components/ArtisteSection';
import Marque from '../components/Marque';
import ArtistesSection from '../components/ArtisteSection';
import DesignersSection from './DesignersSection';
import InfluenceursSection from './InfluenceurSection';
import NouveautesSlider from './NouveauteSection';
import ThemesTendances from './ThemesTendances';
import ServiceFeatures from './ServiceFeatures ';
import PersonalizationSection from './PersonalizationSection';
import NouveautesGrid from './NouveauteSection';
import ScrollAnimation from '../components/ui/ScrollAnimation';

// Interface pour les produits vendeurs
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

export default function ModernTShirtEcommerce() {
    const { products, isLoading, refreshProducts } = useProducts();
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [topSellers, setTopSellers] = useState<Product[]>([]);
    const [newProducts, setNewProducts] = useState<Product[]>([]);
    
    // État pour les produits vendeurs
    const [vendorProducts, setVendorProducts] = useState<VendorProduct[]>([]);
    const [vendorProductsLoading, setVendorProductsLoading] = useState(true);

    // Fonction pour convertir un produit au format attendu par FeaturedSlider
    const adaptProductForSlider = (product: Product) => {
        // Logique pour déterminer l'image à afficher (priorité pour les couleurs)
        let productImage = '/placeholder-product.jpg'; // Image par défaut
        
        if (product.colors && product.colors.length > 0 && product.colors[0].imageUrl) {
            // Priorité 1: Image de la première couleur
            productImage = product.colors[0].imageUrl;
        } else if (product.views && product.views.length > 0 && product.views[0].imageUrl) {
            // Priorité 2: Image de la première vue
            productImage = product.views[0].imageUrl;
        } else if (product.designImageUrl) {
            // Priorité 3: Image du design personnalisé
            productImage = product.designImageUrl;
        } else if (product.imageUrl) {
            // Priorité 4: Image principale du produit (si elle existe)
            productImage = product.imageUrl;
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

        // Préparer les couleurs disponibles pour le switching
        const availableColors = product.colors?.map(color => ({
            id: color.id,
            name: color.name,
            hexCode: color.hexCode || '#000000',
            imageUrl: color.imageUrl || productImage
        })) || [];

        return {
            id: product.id!,
            title: product.name,
            image: productImage,
            price: formatPriceInFCFA(product.price),
            description: product.description,
            stock: product.stock,
            category: product.category?.name || 'Produit',
            colors: availableColors, // Ajouter les couleurs pour le switching
            defaultColorId: availableColors.length > 0 ? availableColors[0].id : undefined,
            // Propriétés requises pour ExtendedArticle
            categorie: product.category?.name || 'Produit',
            meilleurVente: false // Par défaut, peut être mis à jour selon les données
        };
    };

    // Fonction pour convertir un produit vendeur au format attendu par FeaturedSlider
    const adaptVendorProductForSlider = (vendorProduct: VendorProduct) => {
        // Formater le prix en FCFA
        const formatPriceInFCFA = (price: number) => {
            return new Intl.NumberFormat('fr-SN', {
                style: 'currency',
                currency: 'XOF',
                maximumFractionDigits: 0,
                currencyDisplay: 'symbol'
            }).format(price);
        };

        // Préparer les couleurs disponibles pour le switching
        const availableColors = vendorProduct.adminProduct.colorVariations.map(colorVariation => ({
            id: colorVariation.id,
            name: colorVariation.name,
            hexCode: colorVariation.colorCode,
            imageUrl: colorVariation.images[0]?.url || '/placeholder-product.jpg'
        })) || [];

        return {
            id: vendorProduct.id,
            title: vendorProduct.vendorName,
            image: vendorProduct.designApplication.hasDesign ? vendorProduct.design.imageUrl : vendorProduct.adminProduct.colorVariations[0]?.images[0]?.url || '/placeholder-product.jpg',
            price: formatPriceInFCFA(vendorProduct.price),
            description: vendorProduct.adminProduct.description,
            stock: 999, // Stock par défaut pour les produits vendeurs
            category: vendorProduct.design.category,
            colors: availableColors,
            defaultColorId: availableColors.length > 0 ? availableColors[0].id : undefined,
            // Propriétés requises pour ExtendedArticle
            categorie: vendorProduct.design.category,
            meilleurVente: vendorProduct.bestSeller?.isBestSeller || false,
            // Informations supplémentaires pour les produits vendeurs
            vendor: vendorProduct.vendor,
            design: vendorProduct.design,
            designApplication: vendorProduct.designApplication,
            designPositions: vendorProduct.designPositions,
            // Ajout des nouvelles propriétés
            adminProduct: vendorProduct.adminProduct,
            images: vendorProduct.images,
            selectedSizes: vendorProduct.selectedSizes,
            selectedColors: vendorProduct.selectedColors,
            designId: vendorProduct.designId
        };
    };

    // Créer un composant de loading réutilisable avec container cohérent et fond uniforme
    const LoadingSlider = () => (
        <div className="w-full bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8 sm:mb-12">
                    <div className="h-8 sm:h-10 lg:h-12 bg-gray-200 rounded-lg max-w-md mx-auto mb-4 sm:mb-6 animate-pulse"></div>
                    <div className="h-4 sm:h-5 bg-gray-100 rounded max-w-lg mx-auto animate-pulse"></div>
                </div>

                <div className="flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto pb-4">
                    {[...Array(5)].map((_, index) => (
                        <div key={index} className="flex-none w-64 sm:w-72 lg:w-80">
                            <div className="h-full bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                                <div className="aspect-[4/5] bg-gray-200 animate-pulse"></div>
                                <div className="p-4 sm:p-6">
                                    <div className="h-4 sm:h-5 bg-gray-200 rounded mb-2 animate-pulse"></div>
                                    <div className="h-3 bg-gray-100 rounded w-3/4 animate-pulse"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mt-3 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
            {/* Container principal avec fond moderne et animations */}
            <div className="w-full relative">
                {/* Carousel Hero Section avec overlay moderne */}
                <div className="relative">
                    <CarousselContainer />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-50/80 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* CategoryTabs sticky moderne avec backdrop blur */}
                <div className="sticky top-0 z-40 backdrop-blur-md bg-white/80 shadow-sm transition-all duration-300">
                    <CategoryTabs />
                </div>

                {/* Section de personnalisation modernisée */}
                <ScrollAnimation animation="fadeUp" delay={100}>
                    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5">
                        <PersonalizationSection />
                    </section>
                </ScrollAnimation>

                {/* Nouveaux produits avec design moderne */}
                <ScrollAnimation animation="slideLeft" delay={150}>
                    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-transparent to-purple-50/30 rounded-3xl -z-10" />
                        {isLoading ? (
                            <LoadingSlider />
                        ) : (
                            <FeaturedSlider />
                        )}
                    </section>
                </ScrollAnimation>

                {/* Grille des nouveautés avec espacement moderne */}
                <ScrollAnimation animation="slideRight" delay={200}>
                    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5">
                        <NouveautesGrid />
                    </section>
                </ScrollAnimation>

                {/* Thèmes tendances avec card moderne */}
                <ScrollAnimation animation="scaleUp" delay={250}>
                    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 relative">
                        <div className="absolute inset-0 bg-gradient-to-l from-amber-50/30 via-transparent to-pink-50/30 rounded-3xl -z-10" />
                        <ThemesTendances />
                    </section>
                </ScrollAnimation>

                {/* DesignersSection avec effet moderne */}
                <ScrollAnimation animation="fadeIn" delay={300}>
                    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 transition-all duration-500 hover:scale-[1.01]">
                        <DesignersSection />
                    </section>
                </ScrollAnimation>

                {/* ArtistesSection avec design épuré */}
                <ScrollAnimation animation="fadeUp" delay={350}>
                    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 transition-all duration-500 hover:scale-[1.01]">
                        <ArtistesSection />
                    </section>
                </ScrollAnimation>

                {/* InfluenceursSection moderne */}
                <ScrollAnimation animation="slideLeft" delay={400}>
                    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 transition-all duration-500 hover:scale-[1.01]">
                        <InfluenceursSection />
                    </section>
                </ScrollAnimation>

                {/* ServiceFeatures avec fond subtil */}
                <ScrollAnimation animation="fadeIn" delay={450}>
                    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 via-transparent to-cyan-50/20 rounded-3xl -z-10" />
                        <ServiceFeatures />
                    </section>
                </ScrollAnimation>
            </div>

            {/* Footer moderne avec transition */}
            <ScrollAnimation animation="fadeUp" delay={500}>
                <footer className="mt-16 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50">
                    <Footer />
                </footer>
            </ScrollAnimation>
        </div>
    );
}