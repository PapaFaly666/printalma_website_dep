import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit3, 
  Eye, 
  Trash2, 
  MoreVertical,
  Package,
  Palette,
  Clock,
  DollarSign,
  Target,
  ChevronLeft,
  ChevronRight,
  Upload,
  Calculator,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Percent,
  Save,
  RotateCcw
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import ProductImageWithDesign from '../ProductImageWithDesign';

// Types pour le produit vendeur avec pricing moderne
interface ModernPricingProduct {
  id: number;
  vendorName: string;
  vendorDescription?: string;
  price: number;
  status: 'PUBLISHED' | 'DRAFT' | 'PENDING';
  isValidated?: boolean;
  colorVariations: Array<{
    id: number;
    name: string;
    colorCode: string;
    images: Array<{
      id: number;
      url: string;
      viewType: string;
      delimitations: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
        coordinateType: 'ABSOLUTE' | 'PERCENTAGE';
      }>;
    }>;
  }>;
  baseProduct: {
    name: string;
    type: string;
    categories: Array<{ id: number; name: string }>;
  };
  designApplication?: {
    designUrl: string;
    positioning: 'CENTER' | 'TOP' | 'BOTTOM';
    scale: number;
    designTransforms?: Record<string, any>;
  };
  basePriceAdmin: number; // Prix de revient (non modifiable)
  vendorStock?: number;
  publishedAt?: string;
  validatedAt?: string;
  rejectionReason?: string;
}

interface ModernPricingProductCardProps {
  product: ModernPricingProduct;
  onEdit?: (product: ModernPricingProduct) => void;
  onDelete?: (id: number) => void;
  onView?: (product: ModernPricingProduct) => void;
  onPublish?: (id: number) => void;
  onPriceUpdate?: (id: number, newPrice: number, profit: number) => void;
  className?: string;
  showDelimitations?: boolean;
}

export const ModernPricingProductCard: React.FC<ModernPricingProductCardProps> = ({
  product,
  onEdit,
  onDelete,
  onView,
  onPublish,
  onPriceUpdate,
  className = "",
  showDelimitations = false
}) => {
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [isPricingExpanded, setIsPricingExpanded] = useState(false);
  const [customProfit, setCustomProfit] = useState<number>(product.price - product.basePriceAdmin);
  const [isEditingProfit, setIsEditingProfit] = useState(false);

  // Calculs de prix
  const baseCost = product.basePriceAdmin;
  const currentPrice = baseCost + customProfit;
  const profitMargin = customProfit;
  const profitPercentage = baseCost ? ((profitMargin / baseCost) * 100).toFixed(1) : '0';
  const markup = baseCost ? (((currentPrice / baseCost) - 1) * 100).toFixed(1) : '0';

  // Couleur actuellement sélectionnée
  const selectedColor = product.colorVariations[selectedColorIndex];
  const primaryImage = selectedColor?.images?.[0];

  // Calculer le nombre total de délimitations
  const totalDelimitations = product.colorVariations.reduce(
    (total, color) => total + color.images.reduce(
      (imgTotal, img) => imgTotal + (img.delimitations?.length || 0), 
      0
    ), 
    0
  );

  // Gestion de la navigation entre couleurs
  const nextColor = () => {
    setSelectedColorIndex((prev) => 
      prev === product.colorVariations.length - 1 ? 0 : prev + 1
    );
  };

  const prevColor = () => {
    setSelectedColorIndex((prev) => 
      prev === 0 ? product.colorVariations.length - 1 : prev - 1
    );
  };

  // Gérer le changement de bénéfice
  const handleProfitChange = (newProfit: number) => {
    setCustomProfit(Math.max(0, newProfit)); // Minimum 0
  };

  // Sauvegarder les changements de prix
  const handleSavePricing = () => {
    const newPrice = baseCost + customProfit;
    onPriceUpdate?.(product.id, newPrice, customProfit);
    setIsEditingProfit(false);
  };

  // Réinitialiser aux valeurs d'origine
  const handleResetPricing = () => {
    setCustomProfit(product.price - product.basePriceAdmin);
    setIsEditingProfit(false);
  };

  // Badge de statut
  const StatusBadge = () => {
    if (product.status === 'PUBLISHED') {
      return (
        <Badge className="bg-green-600 text-white hover:bg-green-700">
          🚀 Publié
        </Badge>
      );
    }
    
    if (product.status === 'DRAFT') {
      return (
        <Badge className="bg-gray-500 text-white hover:bg-gray-600">
          📝 Brouillon
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
        ⏳ En attente
      </Badge>
    );
  };

  // Animation variants
  const pricingPanelVariants = {
    collapsed: {
      height: 0,
      opacity: 0,
      y: -20
    },
    expanded: {
      height: 'auto',
      opacity: 1,
      y: 0
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden ${className}`}
    >
      {/* Product Image avec Design */}
      <div className="relative aspect-square bg-gray-100 dark:bg-gray-900">
        {primaryImage ? (
          <>
            {product.designApplication?.designUrl && primaryImage.delimitations?.length ? (
              <ProductImageWithDesign
                productImage={primaryImage}
                designUrl={product.designApplication.designUrl}
                designConfig={{
                  positioning: product.designApplication.positioning || 'CENTER',
                  scale: product.designApplication.scale || 0.6
                }}
                showDelimitations={showDelimitations}
                className="w-full h-full"
                interactive={false}
                vendorProductId={product.id}
                designTransforms={product.designApplication.designTransforms}
              />
            ) : (
              <img
                src={primaryImage.url}
                alt={`${product.vendorName} - ${selectedColor.name}`}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
                loading="lazy"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Aucune image</p>
            </div>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <StatusBadge />
        </div>

        {/* Design Badge */}
        {product.designApplication?.designUrl && (
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-purple-600 text-white hover:bg-purple-700 shadow-lg">
              <Palette className="h-3 w-3 mr-1" />
              Design
            </Badge>
          </div>
        )}

        {/* Actions Menu */}
        <div className="absolute top-3 right-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onView?.(product)}>
                <Eye className="h-4 w-4 mr-2" />
                Voir les détails
              </DropdownMenuItem>
              {!product.isValidated && (
                <DropdownMenuItem onClick={() => onEdit?.(product)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
              )}
              {onPublish && product.status === 'DRAFT' && product.isValidated && (
                <DropdownMenuItem
                  onClick={() => onPublish(product.id)}
                  className="text-green-700 dark:text-green-400 font-medium"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Publier
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onDelete?.(product.id)}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation des couleurs */}
        {product.colorVariations.length > 1 && (
          <div className="absolute bottom-3 right-3">
            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-2">
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0 text-white hover:bg-white/20 rounded-full" 
                onClick={prevColor}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              
              <div className="flex items-center gap-1">
                {product.colorVariations.map((color, index) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColorIndex(index)}
                    className={`w-4 h-4 rounded-full border transition-all ${
                      index === selectedColorIndex 
                        ? 'border-white scale-110' 
                        : 'border-white/50 hover:border-white/80'
                    }`}
                    style={{ backgroundColor: color.colorCode }}
                    title={color.name}
                  />
                ))}
              </div>
              
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0 text-white hover:bg-white/20 rounded-full" 
                onClick={nextColor}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Pricing Expansion Trigger */}
        <motion.div
          className="absolute bottom-3 left-3"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="sm"
            onClick={() => setIsPricingExpanded(!isPricingExpanded)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
          >
            <Calculator className="h-3 w-3 mr-1" />
            {isPricingExpanded ? 'Masquer' : 'Tarifs'}
            {isPricingExpanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </Button>
        </motion.div>
      </div>

      {/* Product Info */}
      <CardContent className="p-4 space-y-3">
        {/* Product Name */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
            {product.vendorName}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {product.baseProduct.name}
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-1">
          {(product.baseProduct?.categories || []).slice(0, 2).map((category) => (
            <Badge
              key={category.id}
              variant="outline"
              className="text-xs px-2 py-0.5"
            >
              {category.name}
            </Badge>
          ))}
          {product.baseProduct.categories.length > 2 && (
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              +{product.baseProduct.categories.length - 2}
            </Badge>
          )}
        </div>

        {/* Basic Price Display */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Prix de vente</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF',
                maximumFractionDigits: 0
              }).format(currentPrice)}
            </span>
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Bénéfice</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                +{new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'XOF',
                  maximumFractionDigits: 0
                }).format(profitMargin)}
              </span>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-600 border-green-200">
                {profitPercentage}%
              </Badge>
            </div>
          </div>
        </div>

        {/* Color & Stock Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border-2 border-gray-300"
              style={{ backgroundColor: selectedColor?.colorCode }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {selectedColor?.name}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Package className="h-3 w-3" />
            <span>Stock: {product.vendorStock || 0}</span>
          </div>
        </div>
      </CardContent>

      {/* Expandable Pricing Panel */}
      <AnimatePresence>
        {isPricingExpanded && (
          <motion.div
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={pricingPanelVariants}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="border-t border-gray-200 dark:border-gray-700 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700"
          >
            <div className="p-4 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Calcul des prix
                </h4>
                {isEditingProfit && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleResetPricing}
                      className="h-7 px-2"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSavePricing}
                      className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Prix de revient (non modifiable) */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  Prix de revient (fixe)
                </Label>
                <div className="relative">
                  <Input
                    value={new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'XOF',
                      maximumFractionDigits: 0
                    }).format(baseCost)}
                    disabled
                    className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <DollarSign className="h-3 w-3 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Bénéfice net (modifiable) */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-green-600 dark:text-green-400">
                  Bénéfice net (modifiable)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={customProfit}
                    onChange={(e) => handleProfitChange(Number(e.target.value))}
                    onFocus={() => setIsEditingProfit(true)}
                    className="border-green-300 focus:border-green-500 focus:ring-green-200"
                    placeholder="0"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <span className="text-xs text-green-600 font-medium">FCFA</span>
                  </div>
                </div>
              </div>

              {/* Gain total (calculé automatiquement) */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-purple-600 dark:text-purple-400">
                  Prix de vente final (auto-calculé)
                </Label>
                <div className="relative">
                  <Input
                    value={new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'XOF',
                      maximumFractionDigits: 0
                    }).format(currentPrice)}
                    disabled
                    className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900 dark:to-blue-900 text-purple-700 dark:text-purple-300 font-semibold"
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <TrendingUp className="h-3 w-3 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Marge</span>
                    <Percent className="h-3 w-3 text-blue-500" />
                  </div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {profitPercentage}%
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Markup</span>
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  </div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {markup}%
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  💡 <strong>Conseil:</strong> Une marge de 30-50% est recommandée pour ce type de produit.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ModernPricingProductCard;