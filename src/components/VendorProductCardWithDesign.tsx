import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  Upload
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import ProductImageWithDesign from './ProductImageWithDesign';

// Types pour le produit vendeur avec design
interface VendorProductWithDesign {
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
  basePriceAdmin?: number;
  vendorStock?: number;
  publishedAt?: string;
  validatedAt?: string;
  rejectionReason?: string;
}

interface VendorProductCardWithDesignProps {
  product: VendorProductWithDesign;
  onEdit?: (product: VendorProductWithDesign) => void;
  onDelete?: (id: number) => void;
  onView?: (product: VendorProductWithDesign) => void;
  onPublish?: (id: number) => void;
  className?: string;
  showDelimitations?: boolean;
}

export const VendorProductCardWithDesign: React.FC<VendorProductCardWithDesignProps> = ({
  product,
  onEdit,
  onDelete,
  onView,
  onPublish,
  className = "",
  showDelimitations = false
}) => {
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  // Couleur actuellement sélectionnée
  const selectedColor = product.colorVariations[selectedColorIndex];
  
  // Image principale de la couleur sélectionnée (première image disponible)
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

  // Calculate profit margin
  const profitMargin = product.price - (product.basePriceAdmin || 0);
  const profitPercentage = product.basePriceAdmin ? 
    ((profitMargin / product.basePriceAdmin) * 100).toFixed(1) : '0';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden ${className}`}
    >
      {/* Product Image avec Design */}
      <div className="relative aspect-square bg-gray-100 dark:bg-gray-900">
        {primaryImage ? (
          <>
            {/* Utiliser ProductImageWithDesign si on a un design et des délimitations */}
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

        {/* Design Badge (si design présent) */}
        {product.designApplication?.designUrl && (
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-purple-600 text-white hover:bg-purple-700 shadow-lg">
              <Palette className="h-3 w-3 mr-1" />
              Design
            </Badge>
          </div>
        )}

        {/* Délimitations Badge */}
        {totalDelimitations > 0 && (
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
              <Target className="h-3 w-3 mr-1" />
              {totalDelimitations}
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
              {/* Masquer Modifier si le produit est déjà validé */}
              {!product.isValidated && (
              <DropdownMenuItem onClick={() => onEdit?.(product)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              )}

              {/* 🆕 Publier (si brouillon & validé) */}
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

        {/* Navigation des couleurs (si plusieurs couleurs disponibles) */}
        {product.colorVariations.length > 1 && (
          <div className="absolute bottom-3 right-3">
            <div className="flex items-center gap-2 bg-black/60 rounded-full px-3 py-2">
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
      </div>

      {/* Product Info */}
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Product Name */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
              {product.vendorName}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Basé sur: {product.baseProduct.name}
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

          {/* Pricing Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Prix vendeur</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'XOF',
                  maximumFractionDigits: 0
                }).format(product.price)}
              </span>
            </div>
            
            {product.basePriceAdmin && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Prix base</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'XOF',
                      maximumFractionDigits: 0
                    }).format(product.basePriceAdmin)}
                  </span>
                </div>

                {/* Profit Info */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    Bénéfice
                  </span>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      +{new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'XOF',
                        maximumFractionDigits: 0
                      }).format(profitMargin)}
                    </span>
                    <span className="text-xs text-green-600 dark:text-green-400 ml-1">
                      ({profitPercentage}%)
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Design Info */}
          {product.designApplication?.designUrl && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                <Palette className="h-3 w-3" />
                <span>Design personnalisé</span>
              </div>
              
              <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                <Target className="h-3 w-3" />
                <span>{totalDelimitations} zone{totalDelimitations > 1 ? 's' : ''}</span>
              </div>
            </div>
          )}

          {/* Couleur actuellement sélectionnée */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: selectedColor?.colorCode }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {selectedColor?.name}
              </span>
            </div>

            {/* Stock Info */}
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Package className="h-3 w-3" />
              <span>Stock: {product.vendorStock || 0}</span>
            </div>
          </div>

          {/* 🆕 Informations de validation */}
          {product.isValidated && product.validatedAt && (
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 pt-2 border-t border-gray-100 dark:border-gray-700">
              <Clock className="h-3 w-3" />
              <span>
                Validé le {new Date(product.validatedAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}

          {/* 🆕 Motif de rejet */}
          {product.rejectionReason && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 mt-2">
              <strong>Design rejeté :</strong> {product.rejectionReason}
            </div>
          )}

          {/* Publication Date */}
          {product.publishedAt && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
              <Clock className="h-3 w-3" />
              <span>
                Publié le {new Date(product.publishedAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </motion.div>
  );
};

export default VendorProductCardWithDesign; 