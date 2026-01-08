import React, { useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Crown, TrendingUp, User } from 'lucide-react';
import Button from './ui/Button';
import CustomButton from './ui/Button';
import { BestSellerCard } from './BestSellerCard';
import { useBestSellers } from '../hooks/useBestSellers';
import { BestSellerProduct } from '../types/bestSellers';
import { useOptimizedBestSellers } from '../hooks/useOptimizedBestSellers';
import { useNavigate } from 'react-router-dom';

interface BestSellersCarouselProps {
  title?: string;
  limit?: number;
  showViewAllButton?: boolean;
  className?: string;
  useOptimized?: boolean; // 🚀 NOUVEAU: Option pour utiliser le système optimisé
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';
}

const BestSellersCarousel: React.FC<BestSellersCarouselProps> = ({
  title = "🏆 Nos Best Sellers",
  limit = 10,
  showViewAllButton = true,
  className = '',
  useOptimized = false, // 🚀 NOUVEAU: Par défaut utilise l'ancien système
  period = 'month'
}) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // 🚀 NOUVEAU: Utilisation conditionnelle du hook optimisé
  const optimizedData = useOptimizedBestSellers(
    useOptimized ? { 
      limit, 
      period,
      includeImages: true,
      sortBy: 'sales',
      sortOrder: 'desc'
    } : undefined
  );
  
  // Utilisation de l'ancien hook en fallback
  const legacyData = useBestSellers(
    !useOptimized ? { limit } : undefined
  );
  
  // Sélection des données selon le mode
  const { 
    data: bestSellers, 
    loading, 
    error, 
    stats,
    executionTime,
    dataSource,
    isCached
  } = useOptimized ? {
    data: optimizedData.data,
    loading: optimizedData.loading,
    error: optimizedData.error,
    stats: optimizedData.stats,
    executionTime: optimizedData.executionTime,
    dataSource: optimizedData.dataSource,
    isCached: optimizedData.isCached
  } : {
    data: legacyData.data,
    loading: legacyData.loading,
    error: legacyData.error,
    stats: legacyData.stats,
    executionTime: 0,
    dataSource: 'legacy',
    isCached: false
  };

  // 🏆 Trier les produits par rang selon la nouvelle API
  const rankedBestSellers = useMemo(() => {
    if (!Array.isArray(bestSellers)) {
      console.warn('❌ [BestSellersCarousel] bestSellers n\'est pas un tableau:', bestSellers);
      return [];
    }

    // ✅ TRI PAR RANG: Utiliser rank de l'API, puis fallback sur totalQuantitySold
    const sorted = bestSellers
      .sort((a, b) => {
        // Priorité 1: rank (1 = meilleur)
        if (a.rank && b.rank) {
          return a.rank - b.rank;
        }
        if (a.rank) return -1; // a a un rang, b non
        if (b.rank) return 1;  // b a un rang, a non
        
        // Priorité 2: nombre de ventes (fallback)
        return (b.totalQuantitySold || 0) - (a.totalQuantitySold || 0);
      })
      .map((product, index) => ({
        ...product,
        // 🏆 Utiliser le rang de l'API ou calculer un rang de fallback
        rank: product.rank || index + 1
      }));

    // 🏆 Debug log pour vérifier le tri
    console.log(`🏆 [BestSellersCarousel] Produits triés (${useOptimized ? 'optimized' : 'legacy'}):`, 
      sorted.map(p => ({
        name: p.name,
        rank: p.rank,
        sales: p.totalQuantitySold
      }))
    );

    return sorted;
  }, [bestSellers, useOptimized]);

  const handleProductView = async (product: BestSellerProduct) => {
    // Navigation vers la page produit vendeur
    navigate(`/vendor-product/${product.id}`);
  };

  const handleProductBuy = (product: BestSellerProduct) => {
    // Navigation vers l'achat
    navigate(`/vendor-product/${product.id}?action=buy`);
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      // Scroll de 2 cartes vers la gauche
      const cardWidth = (scrollContainerRef.current.clientWidth + 24) / 4; // 24px pour les gaps
      scrollContainerRef.current.scrollBy({
        left: -cardWidth * 2,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      // Scroll de 2 cartes vers la droite
      const cardWidth = (scrollContainerRef.current.clientWidth + 24) / 4; // 24px pour les gaps
      scrollContainerRef.current.scrollBy({
        left: cardWidth * 2,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-gray-100 py-8">
        {/* Titre principal */}
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-2 flex items-center justify-center gap-2">
            <Crown className="w-8 h-8 text-yellow-600" />
            <span className="font-bold">Meilleures Ventes</span>
          </h2>
        </div>

        {/* Container principal */}
        <div className="w-full px-4 sm:px-8">
          <div className="rounded-xl p-4 md:p-6" style={{ backgroundColor: '#F59E0B' }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              <div className="text-white flex flex-col justify-center items-center px-8 py-8 text-center">
                <div className="h-8 w-64 bg-white/20 rounded animate-pulse mb-4"></div>
                <div className="h-4 w-full bg-white/20 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-3/4 bg-white/20 rounded animate-pulse"></div>
              </div>
              <div className="flex gap-6 overflow-hidden">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 bg-white/20 rounded-lg animate-pulse"
                    style={{ 
                      width: 'calc(25% - 18px)',
                      height: '320px',
                      minWidth: '220px',
                      maxWidth: '280px'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-gray-100 py-8">
        {/* Titre principal */}
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-2 flex items-center justify-center gap-2">
            <Crown className="w-8 h-8 text-yellow-600" />
            <span className="font-bold">Meilleures Ventes</span>
          </h2>
        </div>

        {/* Container principal */}
        <div className="w-full px-4 sm:px-8">
          <div className="rounded-xl p-4 md:p-6" style={{ backgroundColor: '#F59E0B' }}>
            <div className="text-center text-white py-8">
              <div className="text-lg font-semibold mb-2">
                Erreur lors du chargement des meilleures ventes
              </div>
              <div className="text-white/80">
                {error}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!rankedBestSellers || rankedBestSellers.length === 0) {
    return (
      <div className="w-full bg-gray-100 py-8">
        {/* Titre principal */}
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-2 flex items-center justify-center gap-2">
            <Crown className="w-8 h-8 text-yellow-600" />
            <span className="font-bold">Meilleures Ventes</span>
          </h2>
        </div>

        {/* Container principal */}
        <div className="w-full px-4 sm:px-8">
          <div className="rounded-xl p-4 md:p-6" style={{ backgroundColor: '#F59E0B' }}>
            <div className="text-center text-white py-8">
              <div className="text-lg font-semibold mb-2">
                Aucune meilleure vente disponible
              </div>
              <div className="text-white/80">
                Revenez plus tard pour découvrir nos produits populaires
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-100 py-8">
      {/* Titre principal */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-black mb-2 flex items-center justify-center gap-2">
          <Crown className="w-8 h-8 text-yellow-600" />
          <span className="font-bold">Meilleures Ventes</span>
        </h2>
      </div>

      {/* Container principal */}
      <div className="w-full px-4 sm:px-8">
        <div className="rounded-xl p-4 md:p-6" style={{ backgroundColor: '#F59E0B' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            
            {/* Colonne gauche - Texte */}
            <div className="text-white flex flex-col justify-center items-center px-8 py-8 text-center">
              <h3 className="text-xl md:text-2xl font-bold mb-4 uppercase tracking-wide">
                PRODUITS LES PLUS VENDUS
              </h3>
              <p className="text-sm md:text-base mb-6 leading-relaxed">
                Découvrez les produits préférés de notre communauté.
                Des designs qui cartonnent, testés et approuvés par
                nos clients les plus exigeants.
              </p>
              {showViewAllButton && (
                <button
                  onClick={() => navigate('/best-sellers')}
                  className="bg-white text-[#F59E0B] hover:bg-gray-100 px-2 xs:px-2.5 py-1 xs:py-1.5 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-full text-[10px] xs:text-xs sm:text-sm md:text-base font-medium transition-colors duration-200"
                >
                  Voir tout
                </button>
              )}
            </div>

            {/* Colonne droite - Carousel des produits */}
            <div className="relative">
              {/* Boutons de navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={scrollLeft}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors duration-200 z-10"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <span className="text-white text-sm">
                  {Math.min(rankedBestSellers.length, 4)} sur {rankedBestSellers.length} produits
                </span>
                <button
                  onClick={scrollRight}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors duration-200 z-10"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </div>
              
              {/* Container de scroll avec 4 cartes visibles */}
              <div
                ref={scrollContainerRef}
                className="flex gap-6 overflow-x-auto scroll-smooth pb-4"
                style={{ 
                  scrollbarWidth: 'none', 
                  msOverflowStyle: 'none',
                  scrollSnapType: 'x mandatory'
                }}
              >
                {rankedBestSellers.map((product, index) => (
                  <div 
                    key={product.id} 
                    className="flex-shrink-0 transition-transform duration-300 hover:scale-105"
                    style={{ 
                      width: 'calc(25% - 18px)',
                      minWidth: '220px',
                      maxWidth: '280px',
                      scrollSnapAlign: 'start'
                    }}
                  >
                    <div className="h-full">
                      <BestSellerCard
                        product={product}
                        onView={handleProductView}
                        onBuy={handleProductBuy}
                        showRank={true}
                        showVendor={false}
                        showStats={false}
                        rank={product.rank}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BestSellersCarousel; 