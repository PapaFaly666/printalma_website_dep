import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Eye, ShoppingBag, Star, User, TrendingUp } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { ProductWithDesign } from './ProductWithDesign';
import { GenreBadge } from './ui/genre-badge';
import { BestSellerProduct } from '../types/bestSellers';

interface BestSellerCardProps {
  product: BestSellerProduct;
  onView?: (product: BestSellerProduct) => void;
  onBuy?: (product: BestSellerProduct) => void;
  className?: string;
  showRank?: boolean;
  showVendor?: boolean;
  showStats?: boolean;
  rank?: number; // Rang calculé côté frontend (fallback)
}

export const BestSellerCard: React.FC<BestSellerCardProps> = ({
  product,
  onView,
  onBuy,
  className = '',
  showRank = true,
  showVendor = true,
  showStats = true,
  rank
}) => {
  const handleClick = () => {
    if (onView) {
      onView(product);
    }
  };

  const handleBuyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBuy) {
      onBuy(product);
    }
  };

  // Formater le prix en FCFA
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-SN', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Formater le chiffre d'affaires
  const formatRevenue = (revenue: number) => {
    if (revenue >= 1000000) {
      return `${(revenue / 1000000).toFixed(1)}M`;
    } else if (revenue >= 1000) {
      return `${(revenue / 1000).toFixed(1)}K`;
    }
    return revenue.toString();
  };

  // 🏆 NOUVEAU: Fonctions pour le rang
  const getRankColor = (rankNumber: number) => {
    if (rankNumber === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600'; // Or
    if (rankNumber === 2) return 'bg-gradient-to-r from-gray-400 to-gray-600'; // Argent
    if (rankNumber === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600'; // Bronze
    return 'bg-gradient-to-r from-red-400 to-red-600'; // Rouge par défaut
  };

  const getRankIcon = (rankNumber: number) => {
    if (rankNumber === 1) return '🥇';
    if (rankNumber === 2) return '🥈';
    if (rankNumber === 3) return '🥉';
    return '🏆';
  };

  // 🏆 NOUVEAU: Récupérer le rang (priorité: rank de l'API, puis rank calculé)
  const productRank = product.rank || rank;

  // 🏆 NOUVEAU: Debug log pour vérifier le rang
  if (productRank && product.rank) {
    console.log(`🏆 [BestSellerCard] ${product.name} - Rang API: ${product.rank} ✅`);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-900">
        {/* 🏆 Badge de rang Best Seller */}
        {showRank && productRank && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className={`${getRankColor(productRank)} text-white border-0 text-xs font-bold px-3 py-1 shadow-lg`}>
              <span className="mr-1">{getRankIcon(productRank)}</span>
              <span className="rank-number">#{productRank}</span>
            </Badge>
          </div>
        )}

        {/* Genre Badge */}
        <div className="absolute top-3 right-3 z-10">
          <GenreBadge genre={product.baseProduct?.categories?.[0] as 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE' || 'UNISEXE'} className="text-xs" />
        </div>

        {/* Badge Best Seller si applicable */}
        {productRank && (
          <div className="absolute top-12 left-3 z-10">
            <Badge className="bg-gradient-to-r from-green-400 to-green-600 text-white border-0 text-xs font-medium px-2 py-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              Best Seller
            </Badge>
          </div>
        )}

        <CardContent className="p-0">
          {/* Image du produit avec design */}
          <div className="aspect-square relative overflow-hidden">
            <ProductWithDesign
              product={product}
              className="w-full h-full"
              onClick={handleClick}
              showDelimitations={false}
            />
            
            {/* Overlay au hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBuyClick}
                className="bg-white text-gray-900 px-4 py-2 rounded-full font-medium shadow-lg hover:bg-gray-100 transition-colors"
              >
                <ShoppingBag className="w-4 h-4 mr-2 inline" />
                Acheter
              </motion.button>
            </div>
          </div>

          {/* Informations du produit */}
          <div className="p-4 space-y-3">
            {/* Nom et prix */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-orange-600 transition-colors cursor-pointer" onClick={handleClick}>
                {product.name}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-orange-600">
                  {formatPrice(product.price)}
                </span>
                {/* Indicateur de statut */}
                <Badge variant="default" className="text-xs">
                  En vente
                </Badge>
              </div>
            </div>

            {/* Catégories du produit de base */}
            <div className="flex flex-wrap gap-1">
              {product.baseProduct?.categories?.slice(0, 2).map((category, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>

            {/* Statistiques de vente */}
            {showStats && (
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <ShoppingBag className="w-4 h-4" />
                    <span>{product.totalQuantitySold} ventes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>{formatRevenue(product.totalRevenue)} FCFA</span>
                  </div>
                </div>
              </div>
            )}

            {/* Informations vendeur */}
            {showVendor && (
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  {product.vendor?.profilePhotoUrl ? (
                    <img
                      src={product.vendor.profilePhotoUrl}
                      alt={product.vendor.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-3 h-3 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {product.vendor?.name || 'Vendeur'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {product.vendor?.shopName || 'Boutique'}
                  </p>
                </div>
              </div>
            )}

            {/* Produit de base utilisé */}
            <div className="text-xs text-gray-500 dark:text-gray-400 pt-1">
              Basé sur: {product.baseProduct?.name || 'Produit de base'}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}; 