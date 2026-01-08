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
import Button from '../ui/Button';
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
  genre?: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE'; // Added for genre
  // Relations pour sous-catégories et variations (backend fournit les objets complets via Prisma)
  subCategoryId?: number | null;
  variationId?: number | null;
  subCategory?: SubCategory | null;
  variation?: Variation | null;
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
        <div className="absolute inset-0 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-gray-100"></div>
        </div>
      )}
      
      {error ? (
        <div className="absolute inset-0 bg-gray-50 dark:bg-gray-800 flex flex-col items-center justify-center text-gray-400">
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
  
  // 🐛 Debug info - à supprimer en production
  console.log('Product debug:', {
    id: product.id,
    name: product.name,
    price: product.price,
    suggestedPrice: product.suggestedPrice,
    priceAligned: product.suggestedPrice === product.price,
    status: product.status,
    isValidated: isDesignValidated,
    readyToPublish,
    pendingAutoPublish,
    showPublishButton,
    workflow: product.status === 'PENDING' ? 'AUTO-PUBLISH' : 'MANUAL-PUBLISH',
    // 🆕 Debug pour design et délimitations
    hasDesignApplication: !!(product as any).designApplication?.designUrl,
    designUrl: (product as any).designApplication?.designUrl,
    colorVariationsCount: product.colorVariations?.length || 0,
    currentImageDelimitations: currentImage?.delimitations?.length || 0,
    currentImageData: currentImage ? {
      id: currentImage.id,
      url: currentImage.url,
      view: currentImage.view,
      delimitations: currentImage.delimitations
    } : null
  });

  // Vue grille simplifiée
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="group"
    >
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-900 border-[#049BE5]/20 hover:border-[#049BE5]/40">
        <div className="relative">
          {/* Image principale */}
          <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-[#049BE5]/5 dark:from-gray-800 dark:to-[#049BE5]/10 overflow-hidden">
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
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
                <Button size="sm" variant="secondary" className="h-8 w-8 p-0 rounded-full bg-white/90 hover:bg-[#049BE5] text-[#049BE5] hover:text-white" onClick={prevImage}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="secondary" className="h-8 w-8 p-0 rounded-full bg-white/90 hover:bg-[#049BE5] text-[#049BE5] hover:text-white" onClick={nextImage}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
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
                <Button size="sm" variant="secondary" className="h-8 w-8 p-0 rounded-full bg-white/90 hover:bg-[#049BE5] text-[#049BE5] hover:text-white" onClick={() => setShowActions(!showActions)}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
                
                {showActions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 py-2 z-10 min-w-[120px]"
                  >
                    {onView && (
                      <button
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
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
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                        onClick={() => {
                          handleEditClick();
                          setShowActions(false);
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                        Modifier
                      </button>
                    
                    <button
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-red-600"
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
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-gray-900 font-medium"
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
              <Button
                size="sm"
                className="absolute bottom-3 right-3 h-8 w-8 p-0 rounded-full bg-gray-900 hover:bg-gray-800 text-white"
                onClick={() => onPublish(product.id)}
                title={readyToPublish ? 'Publier maintenant' : 'Test: Publier ce produit'}
              >
                <Check className="h-4 w-4" />
              </Button>
            )}

            {/* Bouton rapide Modifier (grid) */}
            {!product.isValidated && (
              <Button
                size="sm"
                variant="secondary"
                className="absolute bottom-3 right-12 h-8 w-8 p-0 rounded-full bg-white/90 hover:bg-[#049BE5] text-[#049BE5] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleEditClick}
                title="Modifier"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Navigation couleurs */}
          {product.colorVariations.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#049BE5]/80 to-transparent p-4">
              <div className="flex items-center justify-center gap-3">
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-white hover:bg-[#049BE5]/80 rounded-full" onClick={prevColor}>
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                
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
                
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-white hover:bg-[#049BE5]/80 rounded-full" onClick={nextColor}>
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Contenu de la carte */}
        <CardContent className="p-4">
          <div className="mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 mb-1">
              {product.name}
            </h3>
            {/* Description masquée selon la demande */}
            {/* <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {product.description}
            </p> */}
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="space-y-1">
              {/* Prix de base */}
              <div className="font-bold text-gray-900 dark:text-white">
                {product.price.toLocaleString()} FCFA
              </div>

              {/* Prix suggéré si différent du prix de base - pourcentage supprimé */}
              {product.suggestedPrice && product.suggestedPrice !== product.price && (
                <div className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Prix suggéré: </span>
                  <span className="font-semibold text-[#049BE5] dark:text-[#049BE5]/80">
                    {product.suggestedPrice.toLocaleString()} FCFA
                  </span>
                </div>
              )}

              {/* Affichage spécial si prix suggéré identique */}
              {product.suggestedPrice && product.suggestedPrice === product.price && (
                <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Prix aligné
                </div>
              )}
            </div>
            {/* Bouton pour voir le stock */}
            <div className="flex flex-col items-end gap-1">
              <Button
                variant="outline"
                size="sm"
                className="border-[#049BE5] text-[#049BE5] hover:bg-[#049BE5] hover:text-white text-xs px-2 py-1 h-auto"
                onClick={() => window.open(`/admin/stock?productId=${product.id}`, '_blank')}
              >
                <Package className="h-3 w-3 mr-1" />
                Voir stock
              </Button>
              {/* Indicateur de stock par couleur - sans les chiffres */}
              <div className="flex flex-wrap gap-1 justify-end">
                {product.colorVariations.slice(0, 3).map((color: any) => {
                  // Calcul du stock pour cette couleur (somme de tous les stocks par taille)
                  const colorStock = color.sizes ?
                    Object.values(color.sizes).reduce((sum: number, stock: any) => sum + (typeof stock === 'number' ? stock : 0), 0) :
                    (color.stock || 0);

                  let indicatorColor = 'bg-green-500';

                  if (colorStock === 0) {
                    indicatorColor = 'bg-red-500';
                  } else if (colorStock < 10) {
                    indicatorColor = 'bg-yellow-500';
                  }

                  return (
                    <div
                      key={color.id}
                      className="flex items-center gap-1"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${indicatorColor}`}
                        style={{ backgroundColor: color.colorCode }}
                        title={color.name}
                      />
                    </div>
                  );
                })}
                {product.colorVariations.length > 3 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full border border-gray-300 text-gray-500 text-xs">
                    +{product.colorVariations.length - 3}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Couleur actuelle */}
          {currentColor && (
            <div className="flex items-center gap-2 mb-3">
              <div 
                className="w-3 h-3 rounded-full border border-gray-300"
                style={{ backgroundColor: currentColor.colorCode }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {currentColor.name}
              </span>
            </div>
          )}

          {/* Métadonnées */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {(product.categories || []).slice(0, 2).map(category => (
                <Badge key={category.id} variant="secondary" className="text-xs">
                  {category.name}
                </Badge>
              ))}
              {product.categories && product.categories.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{(product.categories || []).length - 2}
                </Badge>
              )}
            </div>

            {/* Sous-catégorie (relations Prisma) */}
            {product.subCategory && (
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  {product.subCategory.name}
                </Badge>
              </div>
            )}

            {/* Variation (relations Prisma) */}
            {product.variation && (
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-xs border-orange-400 text-orange-700 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-600">
                  {product.variation.name}
                </Badge>
              </div>
            )}

            {/* Genre */}
            {product.genre && (
              <div className="flex items-center gap-1">
                <GenreBadge genre={product.genre} className="text-xs" />
              </div>
            )}

            {/* Tailles */}
            <div className="flex items-center gap-1">
              {(product.sizes || []).slice(0, 2).map(size => (
                <Badge key={size.id} variant="outline" className="text-xs">
                  {size.sizeName}
                </Badge>
              ))}
              {product.sizes && product.sizes.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{(product.sizes || []).length - 2}
                </Badge>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-[#049BE5]/10">
            Créé le {new Date(product.createdAt).toLocaleDateString('fr-FR')}
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
            className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h4 className="text-lg font-semibold mb-2">Confirmer la suppression</h4>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir supprimer <span className="font-medium">"{product.name}"</span> ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" className="border-[#049BE5] text-[#049BE5] hover:bg-[#049BE5] hover:text-white" onClick={() => setShowDeleteConfirm(false)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                Supprimer
              </Button>
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
      <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-[#049BE5]/5 dark:from-gray-800 dark:to-[#049BE5]/10">
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
        <div className="font-semibold text-gray-900 dark:text-white">{prod.name}</div>
        <div className="text-sm text-gray-500 mb-1">
          {prod.price.toLocaleString()} FCFA
          {prod.suggestedPrice && prod.suggestedPrice !== prod.price && (
            <span className="ml-2 text-[#049BE5] font-medium">
              (suggéré: {prod.suggestedPrice.toLocaleString()})
            </span>
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
    <div className="w-full min-h-screen space-y-6 bg-gradient-to-br from-gray-50/50 to-[#049BE5]/5 dark:from-gray-900 dark:to-[#049BE5]/10">
      {/* En-tête simplifié */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 px-4 sm:px-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {title || "Gestion des produits"}
          </h1>
          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">
              {stats.total} produit{stats.total > 1 ? 's' : ''}
            </span>
            <span className="text-gray-900 dark:text-white font-medium">
              {stats.published} publié{stats.published > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {showAddButton && (
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="border-[#049BE5] text-[#049BE5] hover:bg-[#049BE5] hover:text-white" onClick={onRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            {/* Bouton Corbeille */}
            <Button variant="outline" size="sm" className="border-[#049BE5] text-[#049BE5] hover:bg-[#049BE5] hover:text-white" onClick={() => navigate('/admin/trash')}>
              <Trash2 className="h-4 w-4 mr-2" />
              Corbeille
            </Button>
            <Button size="sm" className="bg-[#049BE5] hover:bg-[#0378B1] text-white" onClick={onAddProduct}>
              <Plus className="h-4 w-4 mr-2" />
              {addButtonText}
            </Button>
          </div>
        )}
      </motion.div>

      {/* Cartes de statistiques */}
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 px-4 sm:px-6">
        <Card className="border-[#049BE5]/20 hover:border-[#049BE5]/40 transition-all duration-300 hover:shadow-lg">
          <CardContent className="pt-4 bg-gradient-to-br from-white to-[#049BE5]/5 dark:from-gray-900 dark:to-[#049BE5]/10">
            <div className="text-sm text-[#049BE5] font-medium">Produits</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 hover:border-green-400 transition-all duration-300 hover:shadow-lg">
          <CardContent className="pt-4 bg-gradient-to-br from-white to-green-50 dark:from-gray-900 dark:to-green-900/20">
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">Publiés</div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.published}</div>
          </CardContent>
        </Card>
      </div>

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
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {deletedProducts.map((prod: any) => (
                <DeletedProductCard key={prod.id} prod={prod} />
              ))}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="border-[#049BE5] text-[#049BE5] hover:bg-[#049BE5] hover:text-white">Fermer</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barre de contrôles simplifiée */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-900 p-4 rounded-lg border border-[#049BE5]/20 hover:border-[#049BE5]/30 transition-all duration-300 hover:shadow-lg mx-4 sm:mx-6"
      >
        {/* Recherche */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-[#049BE5]/30 focus:border-[#049BE5] focus:ring-[#049BE5]/20"
            />
          </div>
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-[#049BE5]/30 rounded-md bg-white dark:bg-gray-900 text-sm focus:border-[#049BE5] focus:ring-[#049BE5]/20 transition-colors"
          >
            <option value="ALL">Tous les produits</option>
            <option value="PUBLISHED">Publiés</option>
          </select>

          {/* Mode d'affichage supprimé: grid uniquement */}
        </div>
      </motion.div>

      {/* Liste des produits */}
      {loading ? (
        <div className="px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-16"
          >
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Chargement des produits...</p>
            </div>
          </motion.div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center py-16 bg-white dark:bg-gray-900 rounded-lg border border-[#049BE5]/20 hover:border-[#049BE5]/30 transition-all duration-300 hover:shadow-lg"
          >
            <div className="max-w-md mx-auto">
              {searchTerm || statusFilter !== 'ALL' ? (
                <>
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Aucun résultat trouvé
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Essayez de modifier vos filtres ou votre terme de recherche.
                  </p>
                  <Button
                    variant="outline"
                    className="border-[#049BE5] text-[#049BE5] hover:bg-[#049BE5] hover:text-white"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('ALL');
                    }}
                  >
                    Réinitialiser les filtres
                  </Button>
                </>
              ) : (
                <>
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {emptyStateTitle}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {emptyStateDescription}
                  </p>
                  <Button className="bg-[#049BE5] hover:bg-[#0378B1] text-white" onClick={onAddProduct}>
                    <Plus className="h-4 w-4 mr-2" />
                    {emptyStateButtonText}
                  </Button>
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
          className={'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4 sm:px-6'}
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