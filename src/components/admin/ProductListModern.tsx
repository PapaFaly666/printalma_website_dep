import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, 
  Edit3, 
  Eye, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Package,
  Palette,
  Layers,
  MoreVertical,
  Rocket,
  Search,
  Filter,
  Plus,
  ImageIcon,
  AlertCircle,
  Check,
  Clock,
  X,
  Target
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { AdminButton } from './AdminButton';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { toast } from 'sonner';
import { ProductStatusBadge } from '../common/ProductStatusBadge';
import ProductImageWithDesign from '../ProductImageWithDesign';
import { GenreBadge } from '../ui/genre-badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '../ui/dialog';
import { useNavigate } from 'react-router-dom';

// Types basés sur votre structure API
interface Delimitation {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  coordinateType: string;
  originalImageWidth: number;
  originalImageHeight: number;
}

interface ProductImage {
  id: number;
  view: string;
  url: string;
  publicId: string;
  naturalWidth: number;
  naturalHeight: number;
  colorVariationId: number;
  delimitations: Delimitation[];
  designUrl?: string;
  designPublicId?: string;
  designFileName?: string;
  designUploadDate?: string;
}

interface ColorVariation {
  id: number;
  name: string;
  colorCode: string;
  productId: number;
  images: ProductImage[];
}

interface Category {
  id: number;
  name: string;
  description: string | null;
}

interface SubCategory {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  categoryId: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Variation {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  subCategoryId: number;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Size {
  id: number;
  productId: number;
  sizeName: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  suggestedPrice?: number; // Added for suggested price
  stock: number;
  status: 'DRAFT' | 'PUBLISHED' | 'PENDING';
  description: string;
  createdAt: string;
  updatedAt: string;
  categories: Category[];
  sizes: Size[];
  colorVariations: ColorVariation[];
  hasDesign?: boolean;
  designCount?: number;
  rejectionReason?: string | null;
  isValidated?: boolean;
  submittedForValidationAt?: string | null;
  isDelete?: boolean; // Added for soft delete
  genre?: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE' | 'AUTOCOLLANT' | 'TABLEAU'; // Added for genre
  // Relations pour sous-catégories et variations (backend fournit les objets complets via Prisma)
  subCategoryId?: number | null;
  variationId?: number | null;
  subCategory?: SubCategory | null;
  variation?: Variation | null;

  // 🆕 Prix par taille (structure API backend)
  useGlobalPricing?: boolean;
  globalCostPrice?: number;
  globalSuggestedPrice?: number;
  sizePrices?: Array<{
    id: number;
    productId: number;
    size: string;
    costPrice: number;
    suggestedPrice: number;
    createdAt: string;
    updatedAt: string;
  }>;
}

// Composant pour gérer l'affichage d'une image avec fallback
const ProductImageDisplay: React.FC<{
  src: string;
  alt: string;
  className?: string;
  onError?: () => void;
}> = ({ src, alt, className = "", onError }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
    onError?.();
  };

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[rgb(20,104,154)]"></div>
        </div>
      )}

      {error ? (
        <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center text-gray-400">
          <AlertCircle className="h-6 w-6 mb-1" />
          <span className="text-xs">Image indisponible</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`transition-opacity duration-200 ${loading ? 'opacity-0' : 'opacity-100'} w-full h-full object-cover`}
          crossOrigin="anonymous"
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
    </div>
  );
};

// Composant Badge de statut simplifié
const StatusBadge: React.FC<{
  status: 'DRAFT' | 'PUBLISHED' | 'PENDING';
  isValidated?: boolean;
}> = ({ status, isValidated }) => {
  // Considérer un produit PENDING mais déjà validé comme publié pour l'affichage
  if ((status === 'PUBLISHED') || (status === 'PENDING' && isValidated)) {
    return (
      <Badge variant="default" className="bg-gray-900 text-white hover:bg-gray-800">
        <Check className="w-3 h-3 mr-1" />
        Publié
      </Badge>
    );
  }
  
  // Afficher « En attente » aussi pour les brouillons dont le design n'est pas encore validé
  if (status === 'PENDING' || (status === 'DRAFT' && !isValidated)) {
    return (
      <Badge variant="outline" className="border-yellow-400 text-yellow-700 bg-yellow-50">
        <Clock className="w-3 h-3 mr-1" />
        En attente
      </Badge>
    );
  }
  
  // DRAFT validé mais pas encore publié ⇒ prêt à publier
  if (isValidated) {
    return (
      <Badge className="bg-green-600 text-white hover:bg-green-700 border-0">
        <Rocket className="w-3 h-3 mr-1" />
        Prêt à publier
      </Badge>
    );
  }
  
  // (Cas rare) Brouillon générique
  return (
    <Badge variant="secondary" className="bg-gray-200 text-gray-700 border border-gray-300">
      <X className="w-3 h-3 mr-1" />
      Brouillon
    </Badge>
  );
};

interface ProductCardProps {
  product: Product;
  onDelete: (id: number) => void;
  onEdit?: (product: Product) => void;
  onView?: (product: Product) => void;
  onPublish?: (id: number) => void;
  viewMode?: 'grid';
  vendorDesigns?: any[];
  deleting?: boolean; // Added for soft delete
  trashMode?: boolean; // Ajouté pour la corbeille
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onDelete, 
  onEdit, 
  onView,
  onPublish,
  viewMode = 'grid',
  vendorDesigns = [],
  deleting = false,
  trashMode = false
}) => {
  const navigate = useNavigate();
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const currentColor = product.colorVariations[selectedColorIndex];
  const currentImage = currentColor?.images[selectedImageIndex];
  const designCount = product.designCount || 0;

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    onDelete(product.id);
  };

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

  const nextImage = () => {
    if (currentColor?.images.length > 1) {
      setSelectedImageIndex((prev) => 
        prev === currentColor.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (currentColor?.images.length > 1) {
      setSelectedImageIndex((prev) => 
        prev === 0 ? currentColor.images.length - 1 : prev - 1
      );
    }
  };

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(product);
    } else {
      navigate(`/admin/products/${product.id}/edit`);
    }
  };

  // Nouveau: la validation se base uniquement sur le champ isValidated fourni par l'API.
  const isDesignValidated = product.isValidated === true;

  // 🔧 Logique de publication améliorée avec deux workflows
  const isDraft = product.status === 'DRAFT';
  const readyToPublish = isDraft && isDesignValidated;
  const pendingAutoPublish = product.status === 'PENDING'; // En attente de validation -> auto-publication
  // 🆕 Afficher bouton seulement si brouillon déjà validé
  const showPublishButton = onPublish && readyToPublish;

  // 🆕 Messages contextuels selon le workflow
  const getStatusMessage = () => {
    if (product.status === 'PUBLISHED') {
      return 'Produit publié et disponible à la vente';
    }

    if (product.status === 'PENDING') {
      return 'En attente de validation admin. Sera automatiquement publié après validation.';
    }

    if (product.status === 'DRAFT') {
      if (isDesignValidated) {
        return 'Produit validé et prêt à être publié manuellement.';
      } else {
        return 'Brouillon en attente de validation. Restera en brouillon après validation.';
      }
    }

    return 'Statut inconnu';
  };

  // Vue grille simplifiée
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group"
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 bg-white border border-gray-200 hover:border-[rgb(20,104,154)]/50">
        <div className="relative">
          {/* Image principale */}
          <div className="relative aspect-square bg-gray-100 overflow-hidden">
            {currentImage ? (
              (() => {
                // Vérifier si on a un design et des délimitations
                const hasDesign = (product as any).designApplication?.designUrl;
                const hasDelimitations = currentImage.delimitations && currentImage.delimitations.length > 0;
                
                if (hasDesign && hasDelimitations) {
                  return (
                    <ProductImageWithDesign
                      productImage={{
                        id: currentImage.id,
                        url: currentImage.url,
                        viewType: currentImage.view || 'Front',
                        delimitations: currentImage.delimitations.map(d => ({
                          x: d.x,
                          y: d.y,
                          width: d.width,
                          height: d.height,
                          coordinateType: (d.coordinateType === 'PERCENTAGE' ? 'PERCENTAGE' : 'ABSOLUTE') as 'PERCENTAGE' | 'ABSOLUTE'
                        }))
                      }}
                      designUrl={(product as any).designApplication.designUrl}
                      designConfig={{
                        positioning: (product as any).designApplication?.positioning || 'CENTER',
                        scale: (product as any).designApplication?.scale || 0.8
                      }}
                      showDelimitations={false}
                      className="w-full h-full"
                      vendorProductId={product.id}
                      vendorDesigns={vendorDesigns}
                    />
                  );
                } else {
                  return (
                    <ProductImageDisplay
                      src={currentImage.url}
                      alt={`${product.name} - ${currentColor.name}`}
                      className="w-full h-full"
                    />
                  );
                }
              })()
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">Aucune image</p>
                </div>
              </div>
            )}

            {/* Navigation des images */}
            {currentColor?.images.length > 1 && (
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <AdminButton size="sm" className="h-7 w-7 p-0 rounded-full bg-white/95 hover:bg-[rgb(20,104,154)] text-[rgb(20,104,154)] hover:text-white shadow-md" onClick={prevImage}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </AdminButton>
                <AdminButton size="sm" className="h-7 w-7 p-0 rounded-full bg-white/95 hover:bg-[rgb(20,104,154)] text-[rgb(20,104,154)] hover:text-white shadow-md" onClick={nextImage}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </AdminButton>
              </div>
            )}

            {/* Indicateurs d'images */}
            {currentColor?.images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1">
                {currentColor.images.map((_, index) => (
                  <button
                    key={`image-indicator-${currentColor.id}-${index}`}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === selectedImageIndex ? 'bg-white' : 'bg-white/60'
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                  />
                ))}
              </div>
            )}

            {/* Badge de statut */}
            {!trashMode && (
            <div className="absolute top-3 left-3">
              <StatusBadge 
                status={product.status as any}
                isValidated={isDesignValidated}
              />
            </div>
            )}


            {/* Menu d'actions */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <div className="relative">
                <AdminButton size="sm" className="h-7 w-7 p-0 rounded-full bg-white/95 hover:bg-[rgb(20,104,154)] text-[rgb(20,104,154)] hover:text-white shadow-md" onClick={() => setShowActions(!showActions)}>
                  <MoreVertical className="h-3.5 w-3.5" />
                </AdminButton>
                
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-[120px]"
                  >
                    {onView && (
                      <button
                        className="w-full px-4 py-2 text-left text-sm hover:bg-[rgb(20,104,154)] hover:text-white transition-colors flex items-center gap-2 text-gray-700"
                        onClick={() => {
                          onView(product);
                          setShowActions(false);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        Voir
                      </button>
                    )}

                    {/* Bouton Modifier toujours visible dans le menu contextuel */}
                      <button
                        className="w-full px-4 py-2 text-left text-sm hover:bg-[rgb(20,104,154)] hover:text-white transition-colors flex items-center gap-2 text-gray-700"
                        onClick={() => {
                          handleEditClick();
                          setShowActions(false);
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                        Modifier
                      </button>

                    <button
                      className="w-full px-4 py-2 text-left text-sm hover:bg-red-600 hover:text-white transition-colors flex items-center gap-2 text-red-600"
                      onClick={() => {
                        setShowDeleteConfirm(true);
                        setShowActions(false);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </button>

                    {onPublish && showPublishButton && (
                      <button
                        className="w-full px-4 py-2 text-left text-sm hover:bg-[rgb(20,104,154)] hover:text-white transition-colors flex items-center gap-2 text-gray-900"
                        onClick={() => {
                          onPublish(product.id);
                          setShowActions(false);
                        }}
                      >
                        <Check className="h-4 w-4" />
                        {readyToPublish ? 'Publier maintenant' : 'Publier ce produit'}
                      </button>
                    )}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Bouton rapide de publication */}
            {onPublish && showPublishButton && (
              <AdminButton
                size="sm"
                className="absolute bottom-3 right-3 h-8 w-8 p-0 rounded-full bg-gray-900 hover:bg-gray-800 text-white"
                onClick={() => onPublish(product.id)}
                title={readyToPublish ? 'Publier maintenant' : 'Test: Publier ce produit'}
              >
                <Check className="h-4 w-4" />
              </AdminButton>
            )}

            {/* Bouton rapide Modifier (grid) */}
            {!product.isValidated && (
              <AdminButton
                size="sm"
                className="absolute bottom-3 right-12 h-8 w-8 p-0 rounded-full bg-white/90 hover:bg-[rgb(20,104,154)] text-[rgb(20,104,154)] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleEditClick}
                title="Modifier"
              >
                <Edit3 className="h-4 w-4" />
              </AdminButton>
            )}
          </div>

          {/* Navigation couleurs */}
          {product.colorVariations.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#049BE5]/80 to-transparent p-4">
              <div className="flex items-center justify-center gap-3">
                <AdminButton size="sm" className="h-6 w-6 p-0 text-white hover:bg-[rgb(20,104,154)]/80 rounded-full" onClick={prevColor}>
                  <ChevronLeft className="h-3 w-3" />
                </AdminButton>

                <div className="flex items-center gap-2">
                  {product.colorVariations.map((color, index) => (
                    <button
                      key={`color-grid-${color.id}`}
                      onClick={() => setSelectedColorIndex(index)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        index === selectedColorIndex
                          ? 'border-white scale-110'
                          : 'border-white/50 hover:border-white/80'
                      }`}
                      style={{ backgroundColor: color.colorCode }}
                      title={color.name}
                    />
                  ))}
                </div>

                <AdminButton size="sm" className="h-6 w-6 p-0 text-white hover:bg-[rgb(20,104,154)]/80 rounded-full" onClick={nextColor}>
                  <ChevronRight className="h-3 w-3" />
                </AdminButton>
              </div>
            </div>
          )}
        </div>

        {/* Contenu de la carte */}
        <CardContent className="p-4 space-y-3">
          {/* Titre du produit */}
          <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm leading-tight">
            {product.name}
          </h3>

          {/* Section prix et stock */}
          <div className="space-y-2.5">
              {/* 💰 Prix par taille - Design moderne */}
              {product.useGlobalPricing ? (
                // Prix global - affichage compact
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] text-gray-500 uppercase tracking-wide mb-0.5 font-medium">
                        Prix
                      </div>
                      <div className="font-bold text-base text-[rgb(20,104,154)] leading-none truncate">
                        {(product.globalSuggestedPrice || product.suggestedPrice || product.price).toLocaleString()} <span className="text-xs">F</span>
                      </div>
                    </div>
                    {product.globalCostPrice > 0 && (
                      <div className="text-right bg-white rounded px-2 py-1.5 border border-blue-100">
                        <div className="text-[9px] text-gray-500 uppercase tracking-wide mb-0.5">
                          Coût
                        </div>
                        <div className="font-semibold text-xs text-gray-700 leading-none">
                          {product.globalCostPrice.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : product.sizePrices && product.sizePrices.length > 0 ? (
                // Prix par taille - grille moderne avec badges
                <>
                  {product.sizePrices.slice(0, 2).map((sizePrice, idx) => (
                    <div
                      key={sizePrice.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200"
                    >
                      {/* Nom de la taille */}
                      <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0.5 bg-white border-gray-300">
                        {sizePrice.size}
                      </Badge>

                      {/* Prix */}
                      <div className="flex items-center gap-1.5">
                        {sizePrice.costPrice > 0 && (
                          <>
                            <div className="text-right">
                              <div className="text-[8px] text-gray-500 uppercase">Coût</div>
                              <div className="text-[11px] font-semibold text-gray-700 leading-none">
                                {sizePrice.costPrice.toLocaleString()}
                              </div>
                            </div>
                            <div className="h-3 w-px bg-gray-300"></div>
                          </>
                        )}
                        <div className="text-right">
                          <div className="text-[8px] text-[rgb(20,104,154)] uppercase">Prix</div>
                          <div className="text-xs font-bold text-[rgb(20,104,154)] leading-none">
                            {sizePrice.suggestedPrice.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {product.sizePrices.length > 2 && (
                    <div className="text-center py-1 px-2 bg-gray-100 rounded border border-gray-200">
                      <span className="text-[10px] text-gray-600 font-medium">
                        +{product.sizePrices.length - 2} autre{product.sizePrices.length - 2 > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                // Pas de prix par taille - fallback
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
                  <div className="text-[9px] text-gray-500 uppercase tracking-wide mb-0.5">
                    Prix
                  </div>
                  <div className="font-bold text-gray-900 text-sm leading-none">
                    {(product.suggestedPrice || product.price).toLocaleString()} <span className="text-xs">F</span>
                  </div>
                </div>
              )}
          </div>

          {/* Section stock */}
          <div className="space-y-2">
            {/* Indicateurs de stock */}
            <div className="flex items-center justify-between px-2.5 py-1.5 bg-gray-50 rounded-md border border-gray-200">
              <span className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Stock</span>
              <div className="flex items-center gap-1">
                {product.colorVariations.slice(0, 3).map((color: any) => {
                  const colorStock = color.sizes ?
                    Object.values(color.sizes).reduce((sum: number, stock: any) => sum + (typeof stock === 'number' ? stock : 0), 0) :
                    (color.stock || 0);

                  let indicatorColor = 'bg-green-500';
                  if (colorStock === 0) indicatorColor = 'bg-red-500';
                  else if (colorStock < 10) indicatorColor = 'bg-yellow-500';

                  return (
                    <div
                      key={color.id}
                      className={`w-2 h-2 rounded-full ${indicatorColor} ring-1 ring-white shadow-sm`}
                      title={`${color.name}: ${colorStock}`}
                    />
                  );
                })}
                {product.colorVariations.length > 3 && (
                  <span className="text-[9px] text-gray-500 ml-0.5">
                    +{product.colorVariations.length - 3}
                  </span>
                )}
              </div>
            </div>

            {/* Bouton gérer stock */}
            <AdminButton
              variant="outline"
              size="sm"
              onClick={() => window.open(`/admin/stock?productId=${product.id}`, '_blank')}
              className="w-full text-xs"
            >
              <Package className="h-3.5 w-3.5" />
              Gérer stock
            </AdminButton>
          </div>

          {/* Couleur actuelle */}
          {currentColor && (
            <div className="flex items-center gap-2 bg-gray-50 rounded-md px-2.5 py-2 border border-gray-200">
              <div
                className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-300 flex-shrink-0"
                style={{ backgroundColor: currentColor.colorCode }}
              />
              <span className="text-xs text-gray-700 font-medium truncate">
                {currentColor.name}
              </span>
            </div>
          )}

          {/* Métadonnées - Badges compacts */}
          <div className="flex flex-wrap gap-1">
            {/* Sous-catégorie */}
            {product.subCategory && (
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 border-green-200">
                {product.subCategory.name}
              </Badge>
            )}

            {/* Genre */}
            {product.genre && (
              <GenreBadge genre={product.genre} className="text-[9px] px-1.5 py-0.5" />
            )}

            {/* Tailles */}
            {(product.sizes || []).slice(0, 2).map(size => (
              <Badge key={size.id} variant="outline" className="text-[9px] px-1.5 py-0.5 bg-white border-gray-300">
                {size.sizeName}
              </Badge>
            ))}
            {product.sizes && product.sizes.length > 2 && (
              <Badge variant="outline" className="text-[9px] px-1 py-0.5 bg-white border-gray-300">
                +{product.sizes.length - 2}
              </Badge>
            )}
          </div>

          {/* Date */}
          <div className="text-[9px] text-gray-500 pt-2.5 border-t border-gray-200 flex items-center gap-1">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span>{new Date(product.createdAt).toLocaleDateString('fr-FR')}</span>
          </div>
        </CardContent>
      </Card>

      {/* 🎯 Indicateur visuel pour produits prêts à publier */}
      {readyToPublish && (
        <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-lg hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-2 text-green-800">
            <Rocket className="w-4 h-4" />
            <span className="text-sm font-medium">Ce produit est prêt à être publié !</span>
          </div>
          <p className="text-xs text-green-700 mt-1">
            Design validé → Publication manuelle disponible
          </p>
        </div>
      )}

      {/* 🕐 Indicateur pour produits en attente de validation avec workflow AUTO */}
      {product.status === 'PENDING' && (
        <div className="mt-4 p-3 bg-gradient-to-r from-[#049BE5]/10 to-blue-50 border border-[#049BE5]/30 rounded-lg hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-2 text-[#049BE5]">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              Workflow AUTO-PUBLISH activé
            </span>
          </div>
          <p className="text-xs text-[#049BE5] mt-1">
            ⚡ Dès validation admin → Publication automatique immédiate
          </p>
        </div>
      )}

      {/* 📝 Indicateur pour brouillons avec workflow MANUEL */}
      {product.status === 'DRAFT' && !isDesignValidated && (
        <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200/50 rounded-lg hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-2 text-yellow-800">
            <Edit3 className="w-4 h-4" />
            <span className="text-sm font-medium">
              Workflow MANUEL activé
            </span>
          </div>
          <p className="text-xs text-yellow-700 mt-1">
            📝 Après validation admin → Reste en brouillon pour publication manuelle
          </p>
        </div>
      )}

      {/* 🆕 Affichage du motif de rejet si le produit a été rejeté */}
      {product.rejectionReason && (
        <div className="mt-4 p-3 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/50 rounded-lg hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-2 text-red-800">
            <X className="w-4 h-4" />
            <span className="text-sm font-medium">Design rejeté</span>
          </div>
          <p className="text-xs text-red-700 mt-1">
            <strong>Motif :</strong> {product.rejectionReason}
          </p>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200"
          >
            <h4 className="text-lg font-semibold mb-2 text-gray-900">Confirmer la suppression</h4>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer <span className="font-medium">"{product.name}"</span> ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <AdminButton variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Annuler
              </AdminButton>
              <AdminButton variant="destructive" onClick={handleDelete} disabled={deleting}>
                Supprimer
              </AdminButton>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

// Composant pour afficher un produit supprimé dans le modal corbeille
const DeletedProductCard: React.FC<{ prod: any }> = ({ prod }) => {
  const [selectedColorIndex, setSelectedColorIndex] = React.useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const currentColor = prod.colorVariations[selectedColorIndex];
  const currentImage = currentColor?.images[selectedImageIndex];

  return (
    <div className="flex items-center gap-4 py-4 border-b border-[#049BE5]/10 hover:bg-[#049BE5]/5 transition-colors duration-200">
      {/* Image principale */}
      <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        {currentImage ? (
          <img
            src={currentImage.url}
            alt={prod.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
        )}
        {/* Navigation des images (faces) */}
        {currentColor?.images.length > 1 && (
          <>
            <button
              onClick={() => setSelectedImageIndex(prev => prev === 0 ? currentColor.images.length - 1 : prev - 1)}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 bg-[#049BE5]/80 hover:bg-[#049BE5] text-white rounded-full flex items-center justify-center"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={() => setSelectedImageIndex(prev => prev === currentColor.images.length - 1 ? 0 : prev + 1)}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 bg-[#049BE5]/80 hover:bg-[#049BE5] text-white rounded-full flex items-center justify-center"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </>
        )}
      </div>
      {/* Infos produit */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900">{prod.name}</div>

        {/* Prix par taille - version compacte pour la corbeille */}
        <div className="mt-1.5 space-y-1">
          {prod.useGlobalPricing ? (
            // Prix global
            <div className="flex items-center gap-2">
              {prod.globalCostPrice > 0 && (
                <span className="text-xs text-gray-600">
                  Coût: {prod.globalCostPrice.toLocaleString()} FCFA
                </span>
              )}
              <span className="text-sm font-semibold text-[rgb(20,104,154)]">
                {(prod.globalSuggestedPrice || prod.suggestedPrice || prod.price).toLocaleString()} FCFA
              </span>
            </div>
          ) : prod.sizePrices && Array.isArray(prod.sizePrices) && prod.sizePrices.length > 0 ? (
            // Prix par taille - affichage compact
            prod.sizePrices.slice(0, 2).map((sp: any) => (
              <div key={sp.id} className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-white border-gray-300">
                  {sp.size}
                </Badge>
                {sp.costPrice > 0 && (
                  <span className="text-gray-600">
                    {sp.costPrice.toLocaleString()}
                  </span>
                )}
                <span className="font-semibold text-[rgb(20,104,154)]">
                  {sp.suggestedPrice.toLocaleString()} FCFA
                </span>
              </div>
            ))
          ) : (
            // Fallback
            <div className="text-sm font-semibold text-[#049BE5]">
              {(prod.suggestedPrice || prod.price).toLocaleString()} FCFA
            </div>
          )}
        </div>
        {/* Navigation couleurs */}
        {prod.colorVariations.length > 1 && (
          <div className="flex items-center gap-2 mt-1">
            {prod.colorVariations.map((color: any, idx: number) => (
              <button
                key={color.id}
                onClick={() => {
                  setSelectedColorIndex(idx);
                  setSelectedImageIndex(0);
                }}
                className={`w-5 h-5 rounded-full border-2 transition-all ${idx === selectedColorIndex ? 'border-gray-900 scale-110' : 'border-gray-300 hover:border-gray-600'}`}
                style={{ backgroundColor: color.colorCode }}
                title={color.name}
              />
            ))}
          </div>
        )}
        {/* Nom couleur et vue */}
        <div className="text-xs text-gray-500 mt-1">
          {currentColor?.name} {currentImage?.view ? `- ${currentImage.view}` : ''}
        </div>
      </div>
    </div>
  );
};

// 1. Fonction utilitaire pour soft delete
async function softDeleteProduct(productId: number) {
  const res = await fetch(`https://printalma-back-dep.onrender.com/products/${productId}/soft-delete`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erreur lors de la suppression');
  return data;
}

interface ProductListModernProps {
  products: Product[];
  loading?: boolean;
  onEditProduct?: (product: Product) => void;
  onViewProduct?: (product: Product) => void;
  onDeleteProduct?: (id: number) => void;
  onRefresh?: () => void;
  onAddProduct?: () => void;
  onPublishProduct?: (id: number) => void;
  
  // Customization props for vendor context
  title?: string;
  showAddButton?: boolean;
  addButtonText?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateButtonText?: string;
  vendorDesigns?: any[];
}

export const ProductListModern: React.FC<ProductListModernProps> = ({
  products,
  loading = false,
  onEditProduct,
  onViewProduct,
  onDeleteProduct,
  onRefresh,
  onAddProduct,
  onPublishProduct,
  
  // Customization props for vendor context
  title,
  showAddButton = true,
  addButtonText = "Nouveau produit",
  emptyStateTitle = "Aucun produit disponible",
  emptyStateDescription = "Vous n'avez pas encore créé de produits. Commencez par ajouter votre premier produit pour débuter.",
  emptyStateButtonText = "Créer mon premier produit",
  vendorDesigns = []
}) => {
  // Force grid only
  const [viewMode] = useState<'grid'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'PENDING'>('ALL');

  // 2. State local pour la suppression douce
  const [deletingId, setDeletingId] = useState<number|null>(null);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [deletedProducts, setDeletedProducts] = useState<any[]>([]);
  const [loadingTrash, setLoadingTrash] = useState(false);
  const [errorTrash, setErrorTrash] = useState<string|null>(null);

  // Charger les produits supprimés quand on ouvre le modal
  const openTrashModal = async () => {
    setShowTrashModal(true);
    setLoadingTrash(true);
    setErrorTrash(null);
    try {
      const res = await fetch('https://printalma-back-dep.onrender.com/products/deleted', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Erreur lors de la récupération des produits supprimés');
      const data = await res.json();
      setDeletedProducts(data);
    } catch (e: any) {
      setErrorTrash(e.message || 'Erreur lors de la récupération des produits supprimés');
    } finally {
      setLoadingTrash(false);
    }
  };

  // 3. Handler suppression douce
  const handleSoftDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await softDeleteProduct(id);
      toast.success('Produit supprimé (soft delete)');
      if (onRefresh) onRefresh();
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  // 4. Filtrage des produits supprimés (isDelete: true)
  const filteredProducts = products.filter(product => {
    if (product.isDelete) return false;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || product.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Statistiques des produits
  const stats = {
    total: filteredProducts.length,
    published: filteredProducts.filter(p => p.status === 'PUBLISHED').length,
  };

  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen">
      {/* En-tête simplifié */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 px-4 sm:px-6 py-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {title || "Gestion des produits"}
            </h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                <span className="font-semibold text-gray-900">{stats.total}</span> produit{stats.total > 1 ? 's' : ''}
              </span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span className="text-gray-600">
                <span className="font-semibold text-green-600">{stats.published}</span> publié{stats.published > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {showAddButton && (
            <div className="flex items-center gap-2">
              <AdminButton variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualiser</span>
              </AdminButton>
              <AdminButton variant="outline" size="sm" onClick={() => navigate('/admin/trash')}>
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Corbeille</span>
              </AdminButton>
              <AdminButton variant="primary" size="sm" onClick={onAddProduct}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{addButtonText}</span>
              </AdminButton>
            </div>
          )}
        </div>
      </motion.div>


      {/* Modal Corbeille */}
      <Dialog open={showTrashModal} onOpenChange={setShowTrashModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Produits supprimés (Corbeille)</DialogTitle>
            <DialogDescription>
              Liste des produits supprimés (soft delete). Vous pouvez les restaurer si besoin.
            </DialogDescription>
          </DialogHeader>
          {loadingTrash ? (
            <div className="py-8 text-center text-gray-500">Chargement...</div>
          ) : errorTrash ? (
            <div className="py-8 text-center text-red-600">{errorTrash}</div>
          ) : deletedProducts.length === 0 ? (
            <div className="py-8 text-center text-gray-400">Aucun produit supprimé.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {deletedProducts.map((prod: any) => (
                <DeletedProductCard key={prod.id} prod={prod} />
              ))}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <AdminButton variant="outline">Fermer</AdminButton>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barre de recherche et filtres */}
      <div className="px-4 sm:px-6 py-4 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
        >
          {/* Recherche */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 border-gray-300 focus:border-[rgb(20,104,154)] focus:ring-[rgb(20,104,154)]/20"
              />
            </div>
          </div>

          {/* Filtres */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 h-10 border border-gray-300 rounded-md bg-white text-sm focus:border-[rgb(20,104,154)] focus:ring-[rgb(20,104,154)]/20 transition-colors"
            >
              <option value="ALL">Tous</option>
              <option value="PUBLISHED">Publiés</option>
            </select>
          </div>
        </motion.div>
      </div>

      {/* Liste des produits */}
      {loading ? (
        <div className="px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-20"
          >
            <div className="text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-gray-200 border-t-[rgb(20,104,154)] mx-auto mb-3"></div>
              <p className="text-sm text-gray-600">Chargement...</p>
            </div>
          </motion.div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-16 bg-white rounded-lg border border-gray-200 mx-4 sm:mx-6"
          >
            <div className="max-w-md mx-auto px-4">
              {searchTerm || statusFilter !== 'ALL' ? (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    Aucun résultat
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Aucun produit ne correspond à votre recherche.
                  </p>
                  <AdminButton
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('ALL');
                    }}
                  >
                    Réinitialiser
                  </AdminButton>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
                    <Package className="h-8 w-8 text-[rgb(20,104,154)]" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    {emptyStateTitle}
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    {emptyStateDescription}
                  </p>
                  <AdminButton variant="primary" onClick={onAddProduct}>
                    <Plus className="h-4 w-4" />
                    {emptyStateButtonText}
                  </AdminButton>
                </>
              )}
            </div>
          </motion.div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 px-4 sm:px-6"
        >
          <AnimatePresence>
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProductCard
                  product={product}
                  onDelete={handleSoftDelete}
                  onEdit={onEditProduct}
                  onView={onViewProduct}
                  onPublish={onPublishProduct}
                  viewMode={viewMode}
                  vendorDesigns={vendorDesigns}
                  deleting={deletingId === product.id}
                  trashMode={product.isDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}; 

export { ProductCard }; 