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

    // Créer un composant de loading réutilisable
    const LoadingSlider = () => (
        <div className="w-full bg-background py-16 md:py-20 lg:py-24">
            <div className="w-full">
                <div className="text-center mb-12 md:mb-16 lg:mb-20 px-6 md:px-8">
                    <div className="h-8 md:h-10 lg:h-12 bg-gray-200 rounded-lg max-w-md mx-auto mb-6 animate-pulse"></div>
                    <div className="h-4 md:h-5 bg-gray-100 rounded max-w-lg mx-auto animate-pulse"></div>
                </div>
                
                <div className="flex gap-4 md:gap-6 lg:gap-8 px-6 md:px-8 lg:px-12">
                    {[...Array(5)].map((_, index) => (
                        <div key={index} className="flex-none w-[calc(100%-2rem)] sm:w-[calc(50%-1rem)] md:w-[calc(33.333%-1.5rem)] lg:w-[calc(20%-1.6rem)] xl:w-[calc(20%-1.6rem)]">
                            <div className="h-full overflow-hidden bg-background border-0 shadow-none">
                                <div className="aspect-[4/5] bg-gray-200 animate-pulse"></div>
                                <div className="p-4 md:p-6">
                                    <div className="h-4 md:h-5 bg-gray-200 rounded mb-2 animate-pulse"></div>
                                    <div className="h-3 bg-gray-100 rounded w-3/4 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full min-h-screen bg-gray-50 font-sans text-gray-800">
            <CarousselContainer />
            <CategoryTabs/>
            <PersonalizationSection/>
            

            {/* Nouveaux produits - En première position pour plus de visibilité */}
            {isLoading ? (
                <LoadingSlider />
            ) : (
                <FeaturedSlider />
               
            )}
             <NouveautesGrid />
             <ThemesTendances/>

            {/* DesignersSection - Maintenant présent dans tous les cas */}
            <DesignersSection />
            
            {/* ArtistesSection */}
            <ArtistesSection />

            <InfluenceursSection />
            <ServiceFeatures/>
            <Footer />
        </div>
    );
}