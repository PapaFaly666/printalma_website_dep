import React, { useEffect, useState } from 'react';
import {
  Check, X, Eye, Package, Calendar, Tag, DollarSign, Search, RefreshCw, CheckCircle, XCircle, AlertTriangle, Filter
} from 'lucide-react';
import { adminValidationService } from '../../services/ProductValidationService';
import { ProductWithValidation, PaginatedResponse } from '../../types/validation';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '../../components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const requestParams = {
        page: pagination.currentPage,
        limit: 20,
        status: filters.status === 'ALL' ? undefined : filters.status,
        productType: 'WIZARD', // Forcer uniquement les produits WIZARD
        vendor: filters.vendor.trim() || undefined
      };

      const res = await adminValidationService.getProductsValidation(requestParams);

      if (res && res.success && res.data) {
        let products = res.data.products || [];

        // Filtrer pour n'afficher que les produits WIZARD sans design
        products = products.filter(product => {
          // Pour les produits WIZARD, vérifier qu'ils n'ont pas de design associé
          return !product.designId && !product.designName;
        });

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
        setProducts([]);
      }
    } catch (e: any) {
      if (e.message.includes('401') || e.message.includes('Unauthorized')) {
        toast.error('Session expirée ou droits insuffisants. Veuillez vous reconnecter en tant qu\'admin.');
      } else {
        toast.error(e.message || 'Erreur de chargement');
      }

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
    setSelectedImageIndex(0);
  };

  const getProductStatus = (product: ProductWithValidation | null) => {
    if (!product) return 'PENDING';
    // Utiliser finalStatus en priorité, puis validationStatus, puis status
    return product.finalStatus || product.validationStatus || product.status || 'PENDING';
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

  // Fonctions utilitaires pour le tableau
  const getProductType = (product: ProductWithValidation) => {
    return product.isWizardProduct || product.productType === 'WIZARD' ? 'WIZARD' : 'TRADITIONAL';
  };

  const getMainImage = (product: ProductWithValidation): string | null => {
    try {
      const isWizardProduct = getProductType(product) === 'WIZARD';

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
      return null;
    }
    return null;
  };

  const getProductActions = (product: ProductWithValidation) => {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setSelectedProduct(product);
          setSelectedImageIndex(0); // Reset image selection
        }}
        className="rounded-lg border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 transition-colors"
      >
        <Eye className="h-3 w-3 mr-1" />
        Voir
      </Button>
    );
  };

  // Fonction pour collecter toutes les images du produit
  const getAllProductImages = (product: ProductWithValidation) => {
    const images: Array<{
      url: string;
      label: string;
      type: 'vendor' | 'mockup';
      color?: string;
      colorCode?: string;
    }> = [];

    const isWizardProduct = product.isWizardProduct || product.productType === 'WIZARD';

    // Images vendeur pour produits WIZARD
    if (isWizardProduct && product.vendorImages && Array.isArray(product.vendorImages)) {
      product.vendorImages.forEach((image, index) => {
        images.push({
          url: image.cloudinaryUrl,
          label: image.imageType === 'base' ? 'Image principale' : `Image ${index + 1}`,
          type: 'vendor',
          color: image.colorName,
          colorCode: image.colorCode
        });
      });
    }

    // Images mockup du produit de base
    if (product.baseProduct?.mockupImages && Array.isArray(product.baseProduct.mockupImages)) {
      product.baseProduct.mockupImages.forEach((mockup, index) => {
        images.push({
          url: mockup.url,
          label: `Mockup ${mockup.colorName || index + 1}`,
          type: 'mockup',
          color: mockup.colorName,
          colorCode: mockup.colorCode
        });
      });
    }

    // Images mockup des détails admin
    if (product.adminProductDetails?.mockupImages && Array.isArray(product.adminProductDetails.mockupImages)) {
      product.adminProductDetails.mockupImages.forEach((mockup, index) => {
        const exists = images.some(img => img.url === mockup.url);
        if (!exists) {
          images.push({
            url: mockup.url,
            label: `Mockup Admin ${mockup.colorName || index + 1}`,
            type: 'mockup',
            color: mockup.colorName,
            colorCode: mockup.colorCode
          });
        }
      });
    }

    // Fallback: images array pour produits traditionnels
    if (!isWizardProduct && product.images && Array.isArray(product.images)) {
      product.images.forEach((imageUrl, index) => {
        images.push({
          url: imageUrl,
          label: `Image ${index + 1}`,
          type: 'mockup'
        });
      });
    }

    return images;
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-black">Validation des produits</h1>
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

        {/* Stats Cards - Design professionnel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">En attente</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Validés</p>
                <p className="text-3xl font-bold text-gray-900">{stats.validated}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Rejetés</p>
                <p className="text-3xl font-bold text-gray-900">{stats.rejected}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtres - Design épuré */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Filtres</span>
            </div>

            <div className="flex flex-wrap gap-4 flex-1">
              <div className="min-w-40">
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger className="w-full rounded-lg border-gray-200 focus:border-gray-300">
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

              <div className="min-w-64 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par vendeur..."
                  value={filters.vendor}
                  onChange={(e) => setFilters(prev => ({ ...prev, vendor: e.target.value }))}
                  className="pl-10 rounded-lg border-gray-200 focus:border-gray-300"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">
                {products?.length || 0} produit{(products?.length || 0) > 1 ? 's' : ''} WIZARD sans design
              </span>
              {filters.status !== 'ALL' && (
                <span className="ml-2">
                  • Statut: <span className="font-medium">{getStatusLabel(filters.status)}</span>
                </span>
              )}
              {filters.vendor.trim() && (
                <span className="ml-2">
                  • Vendeur: <span className="font-medium">{filters.vendor}</span>
                </span>
              )}
            </div>

            {(filters.status !== 'ALL' || filters.vendor.trim()) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ status: 'ALL', productType: 'ALL', vendor: '' })}
                className="text-xs h-8 px-3 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                ✕ Réinitialiser les filtres
              </Button>
            )}
          </div>
        </div>

        {/* Tableau - Design minimaliste */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="h-5 w-5 animate-spin text-gray-400 mr-3" />
              <p className="text-gray-600 font-medium">Chargement...</p>
            </div>
          ) : products && products.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-100 bg-gray-50/50">
                    <TableHead className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Image
                    </TableHead>
                    <TableHead className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Produit
                    </TableHead>
                    <TableHead className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Vendeur
                    </TableHead>
                    <TableHead className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Prix
                    </TableHead>
                    <TableHead className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Stock
                    </TableHead>
                    <TableHead className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Statut
                    </TableHead>
                    <TableHead className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Date
                    </TableHead>
                    <TableHead className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100">
                  {products.map((product) => {
                    const finalStatus = getProductStatus(product);
                    const mainImage = getMainImage(product);
                    const productType = getProductType(product);

                    return (
                      <TableRow key={product.id} className="hover:bg-gray-50/80 transition-colors">
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100">
                            {mainImage ? (
                              <img
                                src={mainImage}
                                alt={product.vendorName || product.name || 'Produit'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>';
                                  }
                                }}
                              />
                            ) : (
                              <Package className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {product.vendorName || product.name || 'Nom non défini'}
                          </div>
                          {product.vendorDescription && (
                            <div className="text-xs text-gray-500 max-w-xs truncate">
                              {product.vendorDescription}
                            </div>
                          )}
                          {productType === 'WIZARD' ? (
                            <div className="text-xs text-purple-600 mt-2 font-medium">
                              📦 {product.adminProductName || product.baseProduct?.name || 'Non défini'}
                            </div>
                          ) : (
                            <div className="text-xs text-blue-600 mt-2 font-medium">
                              🎨 {product.designName || 'Design associé'}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.vendor ?
                              `${product.vendor.firstName} ${product.vendor.lastName}` :
                              'Vendeur inconnu'
                            }
                          </div>
                          {product.vendor?.shop_name && (
                            <div className="text-xs text-gray-500 mt-1">
                              {product.vendor.shop_name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {product.vendorPrice ? product.vendorPrice.toLocaleString() : '0'} FCFA
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {product.vendorStock || 0}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <Badge className={`font-medium ${
                            finalStatus === 'PENDING' || finalStatus === 'pending_admin_validation'
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            finalStatus === 'APPROVED' || finalStatus === 'admin_validated'
                              ? 'bg-green-50 text-green-700 border-green-200' :
                            finalStatus === 'REJECTED' || finalStatus === 'admin_rejected'
                              ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }`}>
                            {getStatusLabel(finalStatus)}
                          </Badge>
                          {product.rejectionReason && (
                            <div className="text-xs text-red-600 mt-2 max-w-xs truncate font-medium">
                              ⚠️ {product.rejectionReason}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {product.createdAt ? new Date(product.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                          {getProductActions(product)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-16">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-700 font-medium mb-2">
                {filters.status === 'ALL' && !filters.vendor.trim() ?
                  'Aucun produit WIZARD sans design trouvé' :
                  'Aucun produit WIZARD sans design ne correspond aux filtres'}
              </p>
              <p className="text-gray-500 text-sm">
                {filters.status === 'ALL' && !filters.vendor.trim() ?
                  'Les nouveaux produits WIZARD sans design apparaîtront ici' :
                  'Essayez de modifier les filtres de recherche'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <p className="text-sm text-gray-700">
              Page {pagination.currentPage} sur {pagination.totalPages} ({pagination.totalItems} produits WIZARD sans design)
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

        {/* Modal de validation - Design professionnel avec galerie d'images */}
        <Dialog open={!!selectedProduct} onOpenChange={handleCloseModal}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-50" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
            <DialogHeader className="pb-4 border-b border-gray-100 bg-white px-6 py-4">
              <DialogTitle className="text-xl font-semibold text-gray-900">Détails du produit WIZARD</DialogTitle>
              <DialogDescription className="text-gray-600 font-medium">
                {selectedProduct?.vendorName || selectedProduct?.name || 'Produit sans nom'} • Produit personnalisé sans design
              </DialogDescription>
            </DialogHeader>

            {selectedProduct && (() => {
              const isWizardProduct = selectedProduct.isWizardProduct || selectedProduct.productType === 'WIZARD';
              const finalStatus = getProductStatus(selectedProduct);
              const allImages = getAllProductImages(selectedProduct);
              const currentImage = allImages[selectedImageIndex] || allImages[0];

              return (
                <div className="space-y-6 p-6">
                  {/* Statut et type */}
                  <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm">
                    <Badge className={`font-medium ${
                      finalStatus === 'PENDING' || finalStatus === 'pending_admin_validation'
                        ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                      finalStatus === 'APPROVED' || finalStatus === 'admin_validated'
                        ? 'bg-green-100 text-green-700 border-green-200' :
                      finalStatus === 'REJECTED' || finalStatus === 'admin_rejected'
                        ? 'bg-red-100 text-red-700 border-red-200' :
                      'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {getStatusLabel(finalStatus)}
                    </Badge>
                    <Badge className={`font-medium ${
                      isWizardProduct
                        ? 'bg-purple-100 text-purple-700 border-purple-200'
                        : 'bg-blue-100 text-blue-700 border-blue-200'
                    }`}>
                      {selectedProduct.productType || (isWizardProduct ? 'WIZARD' : 'TRADITIONAL')}
                    </Badge>
                    {isWizardProduct && (
                      <span className="text-sm text-gray-600">
                        Produit personnalisé sans design - Images personnalisées du vendeur
                      </span>
                    )}
                  </div>

                  {/* Section images */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900">Images du produit</h3>

                    {allImages.length > 0 ? (
                      <>
                        {/* Image principale */}
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                          <div className="relative">
                            {/* Badge "Image principale" */}
                            <div className="absolute top-4 left-4 z-10">
                              <Badge className="bg-gray-900 text-white text-xs font-medium">
                                {currentImage?.label || 'Image principale'}
                              </Badge>
                            </div>

                            {/* Image principale */}
                            <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                              {currentImage ? (
                                <img
                                  src={currentImage.url}
                                  alt={currentImage.label}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                                    }
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <Package className="w-16 h-16" />
                                </div>
                              )}
                            </div>

                            {/* Informations sur l'image */}
                            {currentImage?.color && (
                              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm">
                                {currentImage.colorCode && (
                                  <div
                                    className="w-4 h-4 rounded-full border border-gray-300"
                                    style={{ backgroundColor: currentImage.colorCode }}
                                  />
                                )}
                                <span className="text-sm font-medium text-gray-700">{currentImage.color}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Miniatures */}
                        {allImages.length > 1 && (
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <div className="flex gap-2 overflow-x-auto pb-2">
                              {allImages.map((image, index) => (
                                <button
                                  key={index}
                                  onClick={() => setSelectedImageIndex(index)}
                                  className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden transition-all ${
                                    index === selectedImageIndex
                                      ? 'border-blue-500 shadow-md'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <img
                                    src={image.url}
                                    alt={image.label}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                                      }
                                    }}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-white rounded-xl p-8 shadow-sm text-center">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Aucune image disponible pour ce produit</p>
                      </div>
                    )}
                  </div>

                  {/* Informations produit en grille */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900">Informations produit personnalisé</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nom du produit</p>
                          <p className="text-sm text-gray-900 font-medium mt-1">
                            {selectedProduct.vendorName || selectedProduct.name || 'Nom non défini'}
                          </p>
                        </div>

                        {selectedProduct.vendorDescription && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Description</p>
                            <p className="text-sm text-gray-700 mt-1">{selectedProduct.vendorDescription}</p>
                          </div>
                        )}

                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Produit de base</p>
                          <p className="text-sm text-gray-900 font-medium mt-1">
                            📦 {selectedProduct.adminProductName || selectedProduct.baseProduct?.name || 'Non défini'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Prix</p>
                          <p className="text-lg font-bold text-gray-900 mt-1">
                            {selectedProduct.vendorPrice ? selectedProduct.vendorPrice.toLocaleString() : '0'} FCFA
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Stock</p>
                          <p className="text-sm text-gray-900 font-medium mt-1">{selectedProduct.vendorStock || 0} unités</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Vendeur */}
                      {selectedProduct.vendor && (
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                          <h3 className="text-sm font-semibold text-gray-900 mb-4">Informations vendeur</h3>
                          <div className="space-y-2">
                            <p className="text-sm text-gray-900 font-medium">
                              {selectedProduct.vendor.firstName || ''} {selectedProduct.vendor.lastName || ''}
                            </p>
                            <p className="text-sm text-gray-600">
                              {selectedProduct.vendor.shop_name || selectedProduct.vendor.email || ''}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Statut et validation */}
                      <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Statut de validation</h3>

                        {/* Motif de rejet existant */}
                        {selectedProduct.rejectionReason && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm font-medium text-red-700 mb-1">Raison du rejet</p>
                            <p className="text-sm text-red-600">{selectedProduct.rejectionReason}</p>
                            {selectedProduct.rejectedAt && (
                              <p className="text-xs text-gray-500 mt-2">
                                Rejeté le: {new Date(selectedProduct.rejectedAt).toLocaleDateString('fr-FR')}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Information de validation */}
                        {finalStatus === 'APPROVED' && selectedProduct.validatedAt && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm font-medium text-green-700 mb-1">Validé</p>
                            <p className="text-sm text-green-600">
                              Le {new Date(selectedProduct.validatedAt).toLocaleDateString('fr-FR')}
                            </p>
                            {selectedProduct.validatedBy && (
                              <p className="text-xs text-gray-500 mt-1">
                                Par: {selectedProduct.validatedBy}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Champ de raison de rejet */}
                  {validation.approved === false && (
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                      <Label htmlFor="rejection-reason" className="text-sm font-semibold text-gray-900 block mb-2">
                        Raison du rejet <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="rejection-reason"
                        value={validation.reason}
                        onChange={(e) => setValidation({...validation, reason: e.target.value})}
                        placeholder="Expliquez en détail pourquoi ce produit est rejeté..."
                        className="min-h-[100px] resize-none border-gray-200 rounded-lg focus:border-red-300 focus:ring-red-100"
                      />
                    </div>
                  )}
                </div>
              );
            })()}

            <DialogFooter className="flex gap-3 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                className="rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
              >
                Fermer
              </Button>

              {/* Boutons de validation selon le statut */}
              {selectedProduct && (() => {
                const currentFinalStatus = getProductStatus(selectedProduct);
                return (
                  <>
                    {currentFinalStatus === 'PENDING' || currentFinalStatus === 'pending_admin_validation' ? (
                      <>
                        <Button
                          onClick={() => setValidation({ approved: true, reason: '' })}
                          className="rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium shadow-sm"
                          disabled={processing}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Valider
                        </Button>
                        <Button
                          onClick={() => setValidation({ approved: false, reason: '' })}
                          className="rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium shadow-sm"
                          disabled={processing}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Rejeter
                        </Button>
                      </>
                    ) : currentFinalStatus === 'REJECTED' || currentFinalStatus === 'admin_rejected' ? (
                      <Button
                        onClick={() => setValidation({ approved: true, reason: '' })}
                        className="rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium shadow-sm"
                        disabled={processing}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Réviser la validation
                      </Button>
                    ) : null}

                    {/* Bouton de confirmation */}
                    {validation.approved !== null && (
                      <Button
                        onClick={handleValidate}
                        disabled={processing || (validation.approved === false && !validation.reason.trim())}
                        className={`rounded-xl font-medium shadow-sm ${
                          validation.approved
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        {processing ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Traitement...
                          </>
                        ) : (
                          validation.approved ? 'Confirmer la validation' : 'Confirmer le rejet'
                        )}
                      </Button>
                    )}
                  </>
                );
              })()}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminProductValidation;