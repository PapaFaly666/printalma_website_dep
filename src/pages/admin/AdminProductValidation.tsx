import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, X, Eye, Package, Calendar, Tag, DollarSign, Search, RefreshCw, CheckCircle, XCircle, AlertTriangle, Filter
} from 'lucide-react';
import { adminValidationService } from '../../services/ProductValidationService';
import { ProductWithValidation, PaginatedResponse } from '../../types/validation';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '../../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../../components/ui/select';
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
    itemsPerPage: 20,
    hasNext: false,
    hasPrevious: false
  });
  const [stats, setStats] = useState({
    pending: 0,
    validated: 0,
    rejected: 0,
    total: 0,
    wizardProducts: 0,
    traditionalProducts: 0
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'ALL' as 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL', // ✅ Par défaut récupérer TOUS les produits
    productType: 'ALL' as 'ALL' | 'WIZARD' | 'TRADITIONAL',
    vendor: ''
  });
  const [selectedProduct, setSelectedProduct] = useState<ProductWithValidation | null>(null);
  const [validation, setValidation] = useState<{ approved: boolean | null, reason: string }>({
    approved: null,
    reason: ''
  });
  const [processing, setProcessing] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    console.log('🚀 Début fetchProducts avec filtres:', filters);

    // Vérifier l'authentification via cookies
    console.log('🍪 Cookies disponibles:', document.cookie);

    // Avec les cookies HTTP, on ne peut pas vérifier côté client
    // L'authentification sera vérifiée par le serveur
    console.log('🔑 Authentification via cookies HTTP');

    try {
      const requestParams = {
        page: pagination.currentPage,
        limit: 20,
        status: filters.status === 'ALL' ? undefined : filters.status,
        productType: filters.productType,
        vendor: filters.vendor.trim() || undefined
      };
      console.log('📋 Paramètres de requête:', requestParams);

      const res = await adminValidationService.getProductsValidation(requestParams);

      console.log('🔍 Réponse reçue:', res);
      console.log('🔍 Type de réponse:', typeof res);
      console.log('🔍 Structure res.data:', res?.data);
      console.log('🔍 res.success:', res?.success);

      if (res && res.success && res.data) {
        const products = res.data.products || [];
        console.log('📦 Produits extraits:', products.length, products);
        console.log('📦 Premier produit finalStatus:', products[0]?.finalStatus);
        console.log('📦 Tous les produits finalStatus:', products.map(p => ({ id: p.id, finalStatus: p.finalStatus })));

        setProducts(products);

        if (res.data.pagination) {
          setPagination(prev => ({
            ...prev,
            currentPage: res.data.pagination.currentPage || 1,
            totalPages: res.data.pagination.totalPages || 1,
            totalItems: res.data.pagination.totalItems || 0,
            itemsPerPage: res.data.pagination.itemsPerPage || 20,
            hasNext: res.data.pagination.hasNext || false,
            hasPrevious: res.data.pagination.hasPrevious || false
          }));
        }

        if (res.data.stats) {
          setStats({
            pending: res.data.stats.pending || 0,
            validated: res.data.stats.validated || 0,
            rejected: res.data.stats.rejected || 0,
            total: res.data.stats.total || 0,
            wizardProducts: res.data.stats.wizardProducts || 0,
            traditionalProducts: res.data.stats.traditionalProducts || 0
          });
        }
      } else {
        console.log('❌ Structure de réponse inattendue:', res);
        setProducts([]);
      }
    } catch (e: any) {
      console.error('🔥 Erreur lors du chargement des produits:', e);
      console.error('🔥 Stack trace:', e.stack);

      if (e.message.includes('401') || e.message.includes('Unauthorized')) {
        toast.error('Session expirée ou droits insuffisants. Veuillez vous reconnecter en tant qu\'admin.');
        console.log('🔐 Problème d\'authentification détecté');
      } else {
        toast.error(e.message || 'Erreur de chargement');
      }

      // En cas d'erreur, on laisse la liste vide pour voir le vrai problème
      setProducts([]);
      setStats({
        pending: 0,
        validated: 0,
        rejected: 0,
        total: 0,
        wizardProducts: 0,
        traditionalProducts: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [pagination.currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.currentPage === 1) {
        fetchProducts();
      } else {
        setPagination(prev => ({ ...prev, currentPage: 1 }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.vendor]);

  useEffect(() => {
    if (pagination.currentPage === 1) {
      fetchProducts();
    } else {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [filters.status, filters.productType]);

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
      await adminValidationService.validateProduct(
        selectedProduct.id,
        validation.approved,
        validation.reason
      );
      toast.success(`Produit ${validation.approved ? 'validé' : 'rejeté'} avec succès !`);
      setSelectedProduct(null);
      setValidation({ approved: null, reason: '' });
      await fetchProducts();
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

  const getProductStatus = (product: ProductWithValidation) => {
    // Utiliser finalStatus en priorité, puis validationStatus, puis status
    const status = product.finalStatus || product.validationStatus || product.status || 'PENDING';
    console.log(`📝 Produit ${product.id} - finalStatus: ${product.finalStatus}, status final: ${status}`);
    return status;
  };

  const getStatusColor = (finalStatus: string) => {
    switch(finalStatus) {
      case 'PENDING':
      case 'pending_admin_validation':
        return 'orange';
      case 'APPROVED':
      case 'admin_validated':
        return 'green';
      case 'REJECTED':
      case 'admin_rejected':
        return 'red';
      default: return 'gray';
    }
  };

  const getStatusLabel = (finalStatus: string) => {
    switch(finalStatus) {
      case 'PENDING':
      case 'pending_admin_validation':
        return 'En attente';
      case 'APPROVED':
      case 'admin_validated':
        return 'Validé';
      case 'REJECTED':
      case 'admin_rejected':
        return 'Rejeté';
      default: return 'Inconnu';
    }
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
    const isWizardProduct = product.isWizardProduct || product.productType === 'WIZARD';
    const finalStatus = getProductStatus(product);

    const getMainImage = (): string | null => {
      try {
        if (isWizardProduct) {
          if (product.vendorImages && Array.isArray(product.vendorImages)) {
            const baseImage = product.vendorImages.find(img => img.imageType === 'base');
            if (baseImage?.cloudinaryUrl) return baseImage.cloudinaryUrl;

            if (product.vendorImages.length > 0 && product.vendorImages[0]?.cloudinaryUrl) {
              return product.vendorImages[0].cloudinaryUrl;
            }
          }

          if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            return product.images[0];
          }
        } else {
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
                alt={product.vendorName || product.name || 'Produit'}
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
              {/* Afficher le badge de statut seulement si le produit n'est pas validé */}
              {(finalStatus !== 'APPROVED' && finalStatus !== 'admin_validated') && (
                <Badge className={`flex items-center text-xs ${
                  getStatusColor(finalStatus) === 'orange' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                  getStatusColor(finalStatus) === 'green' ? 'bg-green-100 text-green-800 border-green-300' :
                  getStatusColor(finalStatus) === 'red' ? 'bg-red-100 text-red-800 border-red-300' :
                  'bg-gray-100 text-gray-800 border-gray-300'
                }`}>
                  {finalStatus === 'PENDING' && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {finalStatus === 'APPROVED' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {finalStatus === 'REJECTED' && <XCircle className="h-3 w-3 mr-1" />}
                  {getStatusLabel(finalStatus)}
                </Badge>
              )}
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

            {product.vendorDescription && (
              <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                📝 {product.vendorDescription}
              </div>
            )}

            {isWizardProduct ? (
              <div className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                📦 Produit: {product.adminProductName || product.baseProduct?.name || 'Non défini'}
              </div>
            ) : (
              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                🎨 Design: {product.designName || 'Design associé'}
              </div>
            )}

            {/* ✅ Affichage du motif de rejet selon la nouvelle structure API */}
            {product.rejectionReason && (
              <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                ⚠️ Rejeté: {product.rejectionReason}
                {product.rejectedAt && (
                  <div className="text-xs text-gray-500 mt-1">
                    Le: {new Date(product.rejectedAt).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </div>
            )}

            {product.vendor && (
              <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                👤 {product.vendor.firstName} {product.vendor.lastName}
                {product.vendor.shop_name && (
                  <span className="block text-gray-500">{product.vendor.shop_name}</span>
                )}
              </div>
            )}

            {/* Couleurs et tailles sélectionnées */}
            {product.selectedColors && product.selectedColors.length > 0 && (
              <div className="space-y-1">
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-gray-500">Couleurs:</span>
                  {product.selectedColors.map((color: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-1">
                      <div
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.colorCode }}
                      />
                      <span className="text-xs text-gray-600">{color.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.selectedSizes && product.selectedSizes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-gray-500">Tailles:</span>
                {product.selectedSizes.slice(0, 3).map((size: any, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {size.sizeName}
                  </Badge>
                ))}
                {product.selectedSizes.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{product.selectedSizes.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {safeCategories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-gray-500">Catégories:</span>
                {safeCategories.slice(0, 2).map((cat: any, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {typeof cat === 'string' ? cat : (cat?.name || `Cat ${idx + 1}`)}
                  </Badge>
                ))}
                {safeCategories.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{safeCategories.length - 2}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                Créé le {product.createdAt ? new Date(product.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
              </div>
              <div className="text-xs">
                Stock: {product.vendorStock || 0}
              </div>
            </div>

            {/* Boutons d'action seulement pour les produits en attente */}
            {(finalStatus === 'PENDING' || finalStatus === 'pending_admin_validation') && (
              <div className="space-y-2 pt-2">
                <Button
                  className="w-full bg-green-600 text-white hover:bg-green-700"
                  size="sm"
                  onClick={() => onApprove(product)}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Valider
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
            )}
            {(finalStatus === 'REJECTED' || finalStatus === 'admin_rejected') && (
              <div className="pt-2">
                <Button
                  className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  size="sm"
                  onClick={() => onViewProduct(product)}
                >
                  🔄 Réviser
                </Button>
              </div>
            )}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="En attente"
            value={stats.pending}
            icon={<AlertTriangle className="h-6 w-6 text-yellow-600" />}
          />
          <StatsCard
            title="Validés"
            value={stats.validated}
            icon={<CheckCircle className="h-6 w-6 text-green-600" />}
          />
          <StatsCard
            title="Rejetés"
            value={stats.rejected}
            icon={<XCircle className="h-6 w-6 text-red-600" />}
          />
          <StatsCard
            title="Total"
            value={stats.total}
            icon={<Package className="h-6 w-6" />}
          />
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtres:</span>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="min-w-32">
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">En attente</SelectItem>
                    <SelectItem value="APPROVED">Validés</SelectItem>
                    <SelectItem value="REJECTED">Rejetés</SelectItem>
                    <SelectItem value="ALL">Tous les statuts</SelectItem>
                  </SelectContent>
                </Select>
              </div>


              <div className="min-w-48 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par vendeur..."
                  value={filters.vendor}
                  onChange={(e) => setFilters(prev => ({ ...prev, vendor: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Affichage: {products?.length || 0} produit{(products?.length || 0) > 1 ? 's' : ''}
            {filters.status !== 'ALL' && ` • Statut: ${getStatusLabel(filters.status)}`}
            {filters.productType !== 'ALL' && ` • Type: ${filters.productType}`}
            {filters.vendor.trim() && ` • Vendeur: ${filters.vendor}`}
            {(filters.status !== 'ALL' || filters.productType !== 'ALL' || filters.vendor.trim()) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ status: 'ALL', productType: 'ALL', vendor: '' })}
                className="text-xs h-5 px-2 ml-2"
              >
                ✕ Réinitialiser
              </Button>
            )}
            <br />
            <span className="text-xs text-gray-400">
              Debug: products={JSON.stringify(products?.map(p => ({ id: p.id, finalStatus: p.finalStatus, productType: p.productType })) || [])}
            </span>
          </div>
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
          ) : (products && products.length > 0) ? (
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
              <p className="text-center text-gray-600">
                {filters.status === 'ALL' && !filters.vendor.trim() ?
                  'Aucun produit trouvé' :
                  'Aucun produit ne correspond aux filtres'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {filters.status === 'ALL' && !filters.vendor.trim() ?
                  'Les nouveaux produits apparaîtront ici' :
                  'Essayez de modifier les filtres de recherche'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <p className="text-sm text-gray-700">
              Page {pagination.currentPage} sur {pagination.totalPages} ({pagination.totalItems} produits)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPrevious}
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNext}
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}

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
              const isWizardProduct = selectedProduct.isWizardProduct || selectedProduct.productType === 'WIZARD';
              const finalStatus = getProductStatus(selectedProduct);

              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className={`flex items-center ${
                      getStatusColor(finalStatus) === 'orange' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                      getStatusColor(finalStatus) === 'green' ? 'bg-green-100 text-green-800 border-green-300' :
                      getStatusColor(finalStatus) === 'red' ? 'bg-red-100 text-red-800 border-red-300' :
                      'bg-gray-100 text-gray-800 border-gray-300'
                    }`}>
                      {getStatusLabel(finalStatus)}
                    </Badge>
                    <Badge className={`flex items-center ${
                      isWizardProduct
                        ? 'bg-purple-100 text-purple-800 border-purple-300'
                        : 'bg-blue-100 text-blue-800 border-blue-300'
                    }`}>
                      {selectedProduct.productType || (isWizardProduct ? 'WIZARD' : 'TRADITIONAL')}
                    </Badge>
                    {isWizardProduct && (
                      <span className="text-sm text-gray-600">
                        Produit sans design - Images personnalisées du vendeur
                      </span>
                    )}
                  </div>

                  {/* Images du produit pour les produits WIZARD */}
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
                               image.imageType === 'admin_reference' ? 'Admin' :
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

                  {/* Images mockup du produit admin pour tous les produits */}
                  {(() => {
                    // Collect all available mockup images from different sources
                    const mockupSources: Array<{
                      url: string;
                      label: string;
                      color?: string;
                      colorCode?: string;
                      viewType?: string;
                    }> = [];

                    // Add baseProduct.mockupImages (from API response)
                    if (selectedProduct.baseProduct?.mockupImages && Array.isArray(selectedProduct.baseProduct.mockupImages)) {
                      selectedProduct.baseProduct.mockupImages.forEach((mockup, index) => {
                        mockupSources.push({
                          url: mockup.url,
                          label: `Mockup ${mockup.colorName}`,
                          color: mockup.colorName,
                          colorCode: mockup.colorCode,
                          viewType: mockup.viewType
                        });
                      });
                    }

                    // Add adminProductDetails.mockupImages (from API response)
                    if (selectedProduct.adminProductDetails?.mockupImages && Array.isArray(selectedProduct.adminProductDetails.mockupImages)) {
                      selectedProduct.adminProductDetails.mockupImages.forEach((mockup, index) => {
                        // Avoid duplicates by checking if URL already exists
                        const exists = mockupSources.some(source => source.url === mockup.url);
                        if (!exists) {
                          mockupSources.push({
                            url: mockup.url,
                            label: `Mockup Admin ${mockup.colorName}`,
                            color: mockup.colorName,
                            colorCode: mockup.colorCode,
                            viewType: mockup.viewType
                          });
                        }
                      });
                    }

                    // Fallback: Add images array if available (for TRADITIONAL products)
                    if (!isWizardProduct && selectedProduct.images && Array.isArray(selectedProduct.images) && mockupSources.length === 0) {
                      selectedProduct.images.forEach((imageUrl, index) => {
                        mockupSources.push({ url: imageUrl, label: `Mockup ${index + 1}` });
                      });
                    }

                    // Fallback: Add single mockupUrl if available
                    if (selectedProduct.mockupUrl && mockupSources.length === 0) {
                      mockupSources.push({ url: selectedProduct.mockupUrl, label: 'Mockup principal' });
                    }

                    // Fallback: Add mockupImages if available
                    if (selectedProduct.mockupImages && mockupSources.length === 0) {
                      if (Array.isArray(selectedProduct.mockupImages)) {
                        selectedProduct.mockupImages.forEach((imageUrl, index) => {
                          mockupSources.push({ url: imageUrl, label: `Mockup ${index + 1}` });
                        });
                      } else if (typeof selectedProduct.mockupImages === 'object') {
                        Object.entries(selectedProduct.mockupImages).forEach(([color, imageUrl]) => {
                          if (typeof imageUrl === 'string') {
                            mockupSources.push({ url: imageUrl, label: `Mockup ${color}`, color });
                          }
                        });
                      }
                    }

                    return mockupSources.length > 0 ? (
                      <div className="space-y-3">
                        <Label className="font-medium">
                          Images mockup du produit ({mockupSources.length})
                        </Label>
                        <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                          {mockupSources.map((source, index) => (
                            <div key={index} className="relative">
                              <img
                                src={source.url}
                                alt={source.label}
                                className="w-full h-24 object-cover rounded border"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent && !parent.querySelector('.error-placeholder')) {
                                    const placeholder = document.createElement('div');
                                    placeholder.className = 'error-placeholder flex items-center justify-center w-full h-24 bg-gray-100 rounded border text-gray-400';
                                    placeholder.textContent = 'Mockup non disponible';
                                    parent.appendChild(placeholder);
                                  }
                                }}
                              />
                              <div className="absolute bottom-1 left-1 px-1 py-0.5 bg-black/60 text-white text-xs rounded">
                                {source.label}
                              </div>
                              {source.color && (
                                <div className="absolute top-1 right-1 px-1 py-0.5 bg-white/80 text-xs rounded flex items-center gap-1">
                                  {source.colorCode && (
                                    <div
                                      className="w-3 h-3 rounded-full border border-gray-300"
                                      style={{ backgroundColor: source.colorCode }}
                                    />
                                  )}
                                  <span className="max-w-12 truncate">{source.color}</span>
                                </div>
                              )}
                              {source.viewType && (
                                <div className="absolute top-1 left-1 px-1 py-0.5 bg-blue-600/80 text-white text-xs rounded">
                                  {source.viewType}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {selectedProduct.vendorDescription && (
                    <div className="bg-blue-50 p-3 rounded">
                      <Label className="font-medium text-blue-700">Description du vendeur</Label>
                      <p className="text-sm mt-1">{selectedProduct.vendorDescription}</p>
                    </div>
                  )}

                  {/* ✅ Affichage du motif de rejet dans le modal */}
                  {selectedProduct.rejectionReason && (
                    <div className="bg-red-50 p-3 rounded border border-red-200">
                      <Label className="font-medium text-red-700">Raison du rejet</Label>
                      <p className="text-sm mt-1">{selectedProduct.rejectionReason}</p>
                      {selectedProduct.rejectedAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Rejeté le: {new Date(selectedProduct.rejectedAt).toLocaleDateString('fr-FR')}
                        </p>
                      )}
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
                      <Label className="font-medium">Produit de base</Label>
                      <p className="text-sm">
                        {selectedProduct.adminProductName ||
                         selectedProduct.baseProduct?.name ||
                         'Non défini'}
                      </p>
                    </div>
                    <div>
                      <Label className="font-medium">Statut système</Label>
                      <p className={`text-sm ${
                        (selectedProduct.status as string) === 'DRAFT' ? 'text-gray-600' :
                        (selectedProduct.status as string) === 'PUBLISHED' ? 'text-green-600' :
                        'text-orange-600'
                      }`}>
                        {(selectedProduct.status as string) === 'DRAFT' ? 'Brouillon' :
                         (selectedProduct.status as string) === 'PUBLISHED' ? 'Publié' :
                         selectedProduct.status}
                      </p>
                    </div>
                  </div>

                  {/* Couleurs et tailles sélectionnées détaillées */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="font-medium">Couleurs sélectionnées</Label>
                      <div className="space-y-1">
                        {selectedProduct.selectedColors && selectedProduct.selectedColors.length > 0 ? (
                          selectedProduct.selectedColors.map((color: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: color.colorCode }}
                              />
                              <span className="text-sm">{color.name}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">Aucune couleur sélectionnée</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="font-medium">Tailles sélectionnées</Label>
                      <div className="flex flex-wrap gap-1">
                        {selectedProduct.selectedSizes && selectedProduct.selectedSizes.length > 0 ? (
                          selectedProduct.selectedSizes.map((size: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {size.sizeName}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">Aucune taille sélectionnée</span>
                        )}
                      </div>
                    </div>
                  </div>

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

                  {finalStatus === 'APPROVED' && selectedProduct.validatedAt && (
                    <div className="bg-green-50 p-3 rounded border border-green-200">
                      <Label className="font-medium text-green-700">Validation</Label>
                      <p className="text-sm text-green-600 mt-1">
                        Produit validé le {new Date(selectedProduct.validatedAt).toLocaleDateString('fr-FR')}
                      </p>
                      {selectedProduct.validatedBy && (
                        <p className="text-xs text-gray-500 mt-1">
                          Par: {selectedProduct.validatedBy}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={handleCloseModal}>
                Fermer
              </Button>
              {validation.approved !== null && (getProductStatus(selectedProduct!) === 'PENDING' || getProductStatus(selectedProduct!) === 'pending_admin_validation') && (
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
                    validation.approved ? 'Valider' : 'Rejeter'
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