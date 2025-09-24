import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, X, Eye, Package, Calendar, Tag, DollarSign, Search, RefreshCw, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
import { productValidationService } from '../../services/ProductValidationService';
import { ProductWithValidation, PaginatedResponse } from '../../types/validation';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';

interface StatsCardProps {
  title: string;
  value: any;
  icon: React.ReactNode;
}

interface ProductCardProps {
  product: ProductWithValidation;
  onViewProduct: (product: ProductWithValidation) => void;
  onApprove: (product: ProductWithValidation) => void;
  onReject: (product: ProductWithValidation) => void;
}

const AdminProductValidation: React.FC = () => {
  const [products, setProducts] = useState<ProductWithValidation[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithValidation | null>(null);
  const [validation, setValidation] = useState<{ approved: boolean | null, reason: string }>({
    approved: null,
    reason: ''
  });
  const [processing, setProcessing] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productValidationService.getPendingProducts({
        page: pagination.currentPage,
        limit: 20,
        search
      });

      console.log('🔍 Réponse reçue:', res);

      // Structure attendue: { success: true, data: { products: [], pagination: {}, stats: {} } }
      if (res && res.success && res.data) {
        const products = res.data.products || [];
        console.log('📦 Produits extraits:', products.length, products);

        setProducts(products);

        // Gestion de la pagination
        if (res.data.pagination) {
          setPagination(prev => ({
            ...prev,
            currentPage: res.data.pagination.currentPage,
            totalPages: res.data.pagination.totalPages,
            totalItems: res.data.pagination.totalItems,
            itemsPerPage: res.data.pagination.itemsPerPage
          }));
        }
      } else {
        console.log('❌ Structure de réponse inattendue:', res);
        setProducts([]);
      }
    } catch (e: any) {
      console.error('Erreur lors du chargement des produits:', e);
      toast.error(e.message || 'Erreur de chargement');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Correction: Dépendances du useEffect plus précises
  useEffect(() => {
    fetchProducts();
  }, [pagination.currentPage]);

  // Correction: useEffect séparé pour la recherche avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.currentPage === 1) {
        fetchProducts();
      } else {
        setPagination(prev => ({ ...prev, currentPage: 1 }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const handleValidate = async () => {
    if (!selectedProduct || validation.approved === null) {
      toast.error('Données de validation incomplètes');
      return;
    }

    if (!validation.approved && !validation.reason.trim()) {
      toast.error('Veuillez entrer une raison de rejet.');
      return;
    }

    setProcessing(true);
    try {
      await productValidationService.validateProduct(
        selectedProduct.id,
        validation.approved,
        validation.reason
      );
      toast.success(`Produit ${validation.approved ? 'approuvé' : 'rejeté'} !`);
      setSelectedProduct(null);
      setValidation({ approved: null, reason: '' });
      await fetchProducts(); // Correction: attendre la mise à jour
    } catch (e: any) {
      console.error('Erreur lors de la validation:', e);
      toast.error(e.message || 'Erreur lors de la validation');
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setValidation({ approved: null, reason: '' });
  };

  const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon }) => (
    <Card className="p-4 border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-black">{value}</p>
        </div>
        <div className="text-gray-400">
          {icon}
        </div>
      </div>
    </Card>
  );

  const ProductCard: React.FC<ProductCardProps> = ({
    product,
    onViewProduct,
    onApprove,
    onReject
  }) => {
    // Correction: Vérification plus robuste pour détecter les produits WIZARD
    const isWizardProduct = !product.designId ||
                           product.designId === null ||
                           product.designId === 0 ||
                           product.designId === undefined;

    // Image principale à afficher
    const getMainImage = (): string | null => {
      try {
        if (isWizardProduct) {
          // Pour WIZARD: utiliser l'image principale des vendorImages
          if (product.vendorImages && Array.isArray(product.vendorImages)) {
            const baseImage = product.vendorImages.find(img => img.imageType === 'base');
            if (baseImage?.cloudinaryUrl) return baseImage.cloudinaryUrl;

            // Fallback vers la première image disponible
            if (product.vendorImages.length > 0 && product.vendorImages[0]?.cloudinaryUrl) {
              return product.vendorImages[0].cloudinaryUrl;
            }
          }

          // Fallback vers images génériques
          if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            return product.images[0];
          }
        } else {
          // Pour TRADITIONAL: utiliser l'image du design
          if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            return product.images[0];
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'image:', error);
      }
      return null;
    };

    const mainImage = getMainImage();

    // Correction: Gestion plus sûre des catégories
    const categories = (product as any).categories || [];
    const safeCategories = Array.isArray(categories) ? categories : [];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className="overflow-hidden border-gray-200 hover:border-black transition-all duration-200 hover:shadow-md">
          <div className="relative aspect-video bg-gray-100 flex items-center justify-center">
            {mainImage ? (
              <img
                src={mainImage}
                alt={product.name || 'Produit'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector('.fallback-icon')) {
                    const fallbackIcon = document.createElement('div');
                    fallbackIcon.className = 'fallback-icon flex items-center justify-center w-full h-full';
                    fallbackIcon.innerHTML = '<svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>';
                    parent.appendChild(fallbackIcon);
                  }
                }}
              />
            ) : (
              <Package className="w-12 h-12 text-gray-400" />
            )}

            <div className="absolute top-2 left-2 flex gap-1">
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 flex items-center text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                En attente
              </Badge>
              <Badge className={`flex items-center text-xs ${
                isWizardProduct
                  ? 'bg-purple-100 text-purple-800 border-purple-300'
                  : 'bg-blue-100 text-blue-800 border-blue-300'
              }`}>
                {isWizardProduct ? '🎨 WIZARD' : '🎯 DESIGN'}
              </Badge>
            </div>

            <div className="absolute top-2 right-2">
              <Button
                variant="ghost"
                size="sm"
                className="bg-white/80 hover:bg-white/90 text-gray-700 h-8 w-8 p-0"
                onClick={() => onViewProduct(product)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-gray-900 truncate flex-1 text-sm">
                {product.vendorName || product.name || 'Nom non défini'}
              </h3>
              {product.vendorImages && Array.isArray(product.vendorImages) && product.vendorImages.length > 0 && (
                <span className="text-xs text-gray-500 ml-2">
                  {product.vendorImages.length} image{product.vendorImages.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="text-sm text-gray-600 flex items-center">
              <DollarSign className="h-3 w-3 mr-1" />
              {product.vendorPrice ? product.vendorPrice.toLocaleString() : '0'} FCFA
            </div>

            {/* Description du vendeur */}
            {product.vendorDescription && (
              <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                📝 {product.vendorDescription}
              </div>
            )}

            {/* Informations spécifiques selon le type */}
            {isWizardProduct ? (
              <div className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                📦 Produit de base: {
                  product.adminProductName ||
                  product.baseProduct?.name ||
                  'Non défini'
                }
              </div>
            ) : (
              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                🎨 Design: {product.designName || 'Design associé'}
              </div>
            )}

            {/* Correction: Affichage plus sûr des catégories */}
            {safeCategories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {safeCategories.slice(0, 3).map((cat: any, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {typeof cat === 'string' ? cat : (cat?.name || `Cat ${idx + 1}`)}
                  </Badge>
                ))}
                {safeCategories.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{safeCategories.length - 3}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Soumis {product.submittedAt ? new Date(product.submittedAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
              </div>
              {product.vendor && (
                <span className="text-gray-400 truncate max-w-20">
                  {product.vendor.firstName} {product.vendor.lastName}
                </span>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <Button
                className="w-full bg-green-600 text-white hover:bg-green-700"
                size="sm"
                onClick={() => onApprove(product)}
              >
                <Check className="h-3 w-3 mr-1" />
                Approuver
              </Button>
              <Button
                className="w-full"
                variant="destructive"
                size="sm"
                onClick={() => onReject(product)}
              >
                <X className="h-3 w-3 mr-1" />
                Rejeter
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-black">Validation des Produits</h1>
            <p className="text-gray-600 mt-1">Examiner et valider les produits créés par les vendeurs</p>
          </div>
          <Button
            variant="outline"
            onClick={fetchProducts}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatsCard
            title="Total en attente"
            value={pagination.totalItems}
            icon={<Package className="h-6 w-6" />}
          />
          <StatsCard
            title="Sur cette page"
            value={products?.length ?? 0}
            icon={<Eye className="h-6 w-6" />}
          />
          <StatsCard
            title="Action requise"
            value={(products?.length ?? 0) > 0 ? 'Oui' : 'Non'}
            icon={<AlertTriangle className="h-6 w-6 text-yellow-600" />}
          />
        </div>

        <div className="mb-6 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher par nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-12"
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin text-gray-500" />
                <p className="text-gray-500">Chargement...</p>
              </div>
            </motion.div>
          ) : (products?.length ?? 0) > 0 ? (
            <motion.div
              className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onViewProduct={setSelectedProduct}
                  onApprove={(product) => {
                    setSelectedProduct(product);
                    setValidation({ approved: true, reason: '' });
                  }}
                  onReject={(product) => {
                    setSelectedProduct(product);
                    setValidation({ approved: false, reason: '' });
                  }}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-center text-gray-600">Aucun produit en attente</p>
              <p className="text-sm text-gray-400 mt-1">Les nouveaux produits apparaîtront ici</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de validation */}
        <Dialog open={!!selectedProduct} onOpenChange={handleCloseModal}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Validation produit</DialogTitle>
              <DialogDescription>
                {selectedProduct?.vendorName || selectedProduct?.name || 'Produit sans nom'}
              </DialogDescription>
            </DialogHeader>

            {selectedProduct && (() => {
              const isWizardProduct = !selectedProduct.designId ||
                                     selectedProduct.designId === null ||
                                     selectedProduct.designId === 0 ||
                                     selectedProduct.designId === undefined;

              return (
                <div className="space-y-4">
                  {/* Badge type de produit */}
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className={`flex items-center ${
                      isWizardProduct
                        ? 'bg-purple-100 text-purple-800 border-purple-300'
                        : 'bg-blue-100 text-blue-800 border-blue-300'
                    }`}>
                      {isWizardProduct ? '🎨 WIZARD' : '🎯 DESIGN'}
                    </Badge>
                    {isWizardProduct && (
                      <span className="text-sm text-gray-600">
                        Produit sans design - Images personnalisées du vendeur
                      </span>
                    )}
                  </div>

                  {/* Galerie d'images pour produits WIZARD */}
                  {isWizardProduct &&
                   selectedProduct.vendorImages &&
                   Array.isArray(selectedProduct.vendorImages) &&
                   selectedProduct.vendorImages.length > 0 && (
                    <div className="space-y-3">
                      <Label className="font-medium">
                        Images du produit ({selectedProduct.vendorImages.length})
                      </Label>
                      <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                        {selectedProduct.vendorImages.map((image, index) => (
                          <div key={image.id || index} className="relative">
                            <img
                              src={image.cloudinaryUrl}
                              alt={`Image ${index + 1}`}
                              className="w-full h-24 object-cover rounded border"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector('.error-placeholder')) {
                                  const placeholder = document.createElement('div');
                                  placeholder.className = 'error-placeholder flex items-center justify-center w-full h-24 bg-gray-100 rounded border text-gray-400';
                                  placeholder.textContent = 'Image non disponible';
                                  parent.appendChild(placeholder);
                                }
                              }}
                            />
                            <div className="absolute bottom-1 left-1 px-1 py-0.5 bg-black/60 text-white text-xs rounded">
                              {image.imageType === 'base' ? 'Principal' :
                               image.imageType === 'detail' ? 'Détail' :
                               image.imageType === 'reference' ? 'Référence' :
                               image.imageType === 'admin_reference' ? 'Admin' : 'Autre'}
                            </div>
                            {image.colorName && (
                              <div className="absolute top-1 right-1 px-1 py-0.5 bg-white/80 text-xs rounded flex items-center gap-1">
                                {image.colorCode && (
                                  <div
                                    className="w-3 h-3 rounded-full border border-gray-300"
                                    style={{ backgroundColor: image.colorCode }}
                                  />
                                )}
                                <span className="max-w-12 truncate">{image.colorName}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description du vendeur */}
                  {selectedProduct.vendorDescription && (
                    <div className="bg-blue-50 p-3 rounded">
                      <Label className="font-medium text-blue-700">Description</Label>
                      <p className="text-sm mt-1">{selectedProduct.vendorDescription}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="font-medium">Prix vendeur</Label>
                      <p className="text-lg font-semibold text-green-600">
                        {selectedProduct.vendorPrice ? selectedProduct.vendorPrice.toLocaleString() : '0'} FCFA
                      </p>
                    </div>
                    <div>
                      <Label className="font-medium">Stock</Label>
                      <p>{selectedProduct.vendorStock || 0} unités</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="font-medium">
                        {isWizardProduct ? 'Produit de base' : 'Catégories'}
                      </Label>
                      <p className="text-sm">
                        {isWizardProduct ? (
                          selectedProduct.adminProductName ||
                          selectedProduct.baseProduct?.name ||
                          'Non défini'
                        ) : (
                          (() => {
                            const categories = (selectedProduct as any).categories || [];
                            const safeCategories = Array.isArray(categories) ? categories : [];
                            return safeCategories.length > 0
                              ? safeCategories.map((c: any) => typeof c === 'string' ? c : (c?.name || '')).filter(Boolean).join(', ')
                              : '—';
                          })()
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="font-medium">Statut</Label>
                      <p className={`text-sm ${
                        selectedProduct.status === 'DRAFT' ? 'text-gray-600' :
                        selectedProduct.status === 'PUBLISHED' ? 'text-green-600' :
                        'text-orange-600'
                      }`}>
                        {selectedProduct.status === 'DRAFT' ? 'Brouillon' :
                         selectedProduct.status === 'PUBLISHED' ? 'Publié' :
                         selectedProduct.status}
                      </p>
                    </div>
                  </div>

                  {/* Informations vendeur */}
                  {selectedProduct.vendor && (
                    <div className="bg-gray-50 p-3 rounded">
                      <Label className="font-medium text-gray-700">Vendeur</Label>
                      <p className="text-sm">
                        {selectedProduct.vendor.firstName || ''} {selectedProduct.vendor.lastName || ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedProduct.vendor.shop_name || selectedProduct.vendor.email || ''}
                      </p>
                    </div>
                  )}

                  {validation.approved === false && (
                    <div className="space-y-2">
                      <Label htmlFor="rejection-reason">Raison du rejet *</Label>
                      <Textarea
                        id="rejection-reason"
                        value={validation.reason}
                        onChange={(e) => setValidation({...validation, reason: e.target.value})}
                        placeholder="Expliquez pourquoi ce produit est rejeté..."
                        className="min-h-[80px]"
                      />
                    </div>
                  )}
                </div>
              );
            })()}

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={handleCloseModal}>
                Annuler
              </Button>
              {validation.approved !== null && (
                <Button
                  onClick={handleValidate}
                  disabled={processing || (validation.approved === false && !validation.reason.trim())}
                  className={validation.approved ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {processing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    validation.approved ? 'Approuver' : 'Rejeter'
                  )}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminProductValidation;