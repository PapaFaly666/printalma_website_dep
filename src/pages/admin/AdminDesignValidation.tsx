import React, { useEffect, useState } from 'react';
import {
  Check, X, Eye, Package, Calendar, Tag, DollarSign, Search, RefreshCw, CheckCircle, XCircle, AlertTriangle, Filter, Palette
} from 'lucide-react';
import { designService, Design } from '../../services/designService';
import { hybridAuthService } from '../../services/hybridAuthService';
import { useTokenRefresh } from '../../hooks/useTokenRefresh';
import { API_CONFIG, API_ENDPOINTS } from '../../config/api';
import { Badge } from '../../components/ui/badge';
import { AdminButton } from '../../components/admin/AdminButton';
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
import { motion } from 'framer-motion';

interface DesignWithValidation extends Design {
  vendor: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    shop_name?: string;
    phone?: string;
    country?: string;
    address?: string;
    profile_photo_url?: string | null;
  };
  validationStatus?: 'PENDING' | 'VALIDATED' | 'REJECTED';
  validatorNote?: string;
  rejectionReason?: string;
  submittedForValidationAt: string;
  associatedProducts: number;
}

interface ValidationRequest {
  approved: boolean;
  rejectionReason?: string;
}

interface PendingDesignsResponse {
  success: boolean;
  data: {
    designs: Design[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const AdminDesignValidation: React.FC = () => {
  // 🆕 FORCER LE RECHARGEMENT DU TOKEN POUR CORRIGER LE 401
  useTokenRefresh();

  const [designs, setDesigns] = useState<DesignWithValidation[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [filters, setFilters] = useState({
    status: 'PENDING' as 'PENDING' | 'VALIDATED' | 'REJECTED' | 'ALL',
    vendor: ''
  });
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
    total: 0
  });

  // Modal states
  const [selectedDesign, setSelectedDesign] = useState<DesignWithValidation | null>(null);
  const [validation, setValidation] = useState<{ approved: boolean | null, reason: string }>({
    approved: null,
    reason: ''
  });

  const fetchDesigns = async () => {
    setLoading(true);
    try {
      const response = await designService.getAllDesigns({
        page: pagination.currentPage,
        limit: 20,
        search: filters.vendor.trim() || undefined,
        status: filters.status === 'ALL' ? undefined : filters.status,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      const transformedDesigns = (response.designs || []).map(design => ({
        ...design,
        submittedForValidationAt: design.submittedForValidationAt || design.createdAt || new Date().toISOString()
      }));

      setDesigns(transformedDesigns);

      if (response.pagination) {
        const currentPage = response.pagination.currentPage || 1;
        const totalPages = response.pagination.totalPages || 1;
        setPagination(prev => ({
          ...prev,
          currentPage,
          totalPages,
          totalItems: response.pagination.totalItems || 0,
          itemsPerPage: response.pagination.itemsPerPage || 20,
          hasNext: currentPage < totalPages,
          hasPrevious: currentPage > 1
        }));
      }

      if (response.stats) {
        setStats({
          pending: response.stats.pending || 0,
          validated: response.stats.validated || 0,
          rejected: response.stats.rejected || 0,
          total: response.stats.total || 0
        });
      }
    } catch (e: any) {
      if (e.message.includes('401') || e.message.includes('Unauthorized')) {
        toast.error('Session expirée ou droits insuffisants. Veuillez vous reconnecter en tant qu\'admin.');
      } else {
        toast.error(e.message || 'Erreur de chargement');
      }

      setDesigns([]);
      setStats({
        pending: 0,
        validated: 0,
        rejected: 0,
        total: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigns();
  }, [pagination.currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.currentPage === 1) {
        fetchDesigns();
      } else {
        setPagination(prev => ({ ...prev, currentPage: 1 }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.vendor]);

  useEffect(() => {
    if (pagination.currentPage === 1) {
      fetchDesigns();
    } else {
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }
  }, [filters.status]);

  const handleValidate = async () => {
    if (!selectedDesign || validation.approved === null) {
      toast.error('Données de validation incomplètes');
      return;
    }

    console.log('🎯 Validation du design:', selectedDesign.id, '-', selectedDesign.name);
    console.log('📋 Action:', validation.approved ? 'VALIDATION' : 'REJET');

    if (!validation.approved && !validation.reason.trim()) {
      toast.error('Veuillez entrer une raison de rejet.');
      return;
    }

    setProcessing(true);
    try {
      // 🔄 Utiliser le service d'authentification hybride pour gérer automatiquement
      // l'authentification par cookies avec fallback JWT si nécessaire
      const validationUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.DESIGNS.VALIDATE(Number(selectedDesign.id))}`;
      console.log('🔄 Envoi de la requête de validation vers:', validationUrl);

      const response = await hybridAuthService.makeAuthenticatedRequest(
        validationUrl,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: validation.approved ? 'VALIDATE' : 'REJECT',
            rejectionReason: validation.approved ? undefined : validation.reason
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();

      if (validation.approved) {
        const { cascadeResults } = result;
        const publishedCount = cascadeResults?.publishedProducts || 0;
        const draftCount = cascadeResults?.draftProducts || 0;
        const totalAffected = cascadeResults?.affectedProducts || 0;

        toast.success('Design validé avec succès !', {
          description: `${totalAffected} produit(s) mis à jour: ${publishedCount} publié(s) automatiquement, ${draftCount} en brouillon pour publication manuelle.`,
          duration: 8000
        });
      } else {
        const { cascadeResults } = result;
        const affectedProducts = cascadeResults?.affectedProducts || 0;

        toast.success('Design rejeté', {
          description: `${affectedProducts} produit(s) remis en brouillon. Le vendeur a été notifié du motif de rejet.`,
          duration: 6000
        });
      }

      setSelectedDesign(null);
      setValidation({ approved: null, reason: '' });
      await fetchDesigns();
    } catch (e: any) {
      console.error('Erreur lors de la validation:', e);
      toast.error(e.message || 'Erreur lors de la validation');
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedDesign(null);
    setValidation({ approved: null, reason: '' });
  };

  const getDesignStatus = (design: DesignWithValidation | null) => {
    if (!design) return 'PENDING';
    if (design.isPublished) return 'VALIDATED';
    if (design.isDraft) return 'REJECTED';
    return 'PENDING';
  };

  
  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'PENDING':
        return 'En attente';
      case 'VALIDATED':
        return 'Validé';
      case 'REJECTED':
        return 'Rejeté';
      default: return 'Inconnu';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDesignActions = (design: DesignWithValidation) => {
    return (
      <AdminButton
        size="sm"
        variant="outline"
        onClick={() => {
          setSelectedDesign(design);
        }}
      >
        <Eye className="h-3 w-3" />
        Voir
      </AdminButton>
    );
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* En-tête simplifié */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 px-4 sm:px-6 py-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Validation des designs
            </h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                <span className="font-semibold text-gray-900">{stats.total}</span> design{stats.total > 1 ? 's' : ''}
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">
                <span className="font-semibold text-yellow-600">{stats.pending}</span> en attente
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">
                <span className="font-semibold text-green-600">{stats.validated}</span> validé{stats.validated > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AdminButton
              variant="outline"
              size="sm"
              onClick={fetchDesigns}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </AdminButton>
          </div>
        </div>
      </motion.div>

      {/* Contenu principal */}
      <div className="px-4 sm:px-6 py-8">
        {/* Filtres */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-900">Filtres</span>
            </div>

            <div className="flex flex-wrap gap-4 flex-1">
              <div className="min-w-40">
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">En attente</SelectItem>
                    <SelectItem value="VALIDATED">Validés</SelectItem>
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
                  className="pl-10 h-11"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                <span className="font-medium">{designs?.length || 0}</span> design{(designs?.length || 0) > 1 ? 's' : ''}
              </span>

              {(filters.status !== 'ALL' || filters.vendor.trim()) && (
                <AdminButton
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ status: 'ALL', vendor: '' })}
                >
                  Réinitialiser
                </AdminButton>
              )}
            </div>
          </div>
        </div>

        {/* Tableau - Design minimaliste */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="h-5 w-5 animate-spin text-gray-400 mr-3" />
              <p className="text-gray-600 font-medium">Chargement...</p>
            </div>
          ) : designs && designs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-100 bg-gray-50/50">
                    <TableHead className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Design
                    </TableHead>
                    <TableHead className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Vendeur
                    </TableHead>
                    <TableHead className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Prix
                    </TableHead>
                    <TableHead className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Produits associés
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
                  {designs.map((design) => {
                    const status = getDesignStatus(design);

                    return (
                      <TableRow key={design.id} className="hover:bg-gray-50/80 transition-colors">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100">
                              {design.imageUrl || design.thumbnailUrl ? (
                                <img
                                  src={design.imageUrl || design.thumbnailUrl}
                                  alt={design.name || 'Design'}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                      parent.innerHTML = '<svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                                    }
                                  }}
                                />
                              ) : (
                                <Palette className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 mb-1">
                                {design.name || 'Design sans nom'}
                              </div>
                              <div className="text-xs text-gray-500 max-w-xs truncate">
                                {design.category || 'Catégorie non spécifiée'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {design.vendor ?
                              `${design.vendor.firstName} ${design.vendor.lastName}` :
                              'Vendeur inconnu'
                            }
                          </div>
                          {design.vendor?.shop_name && (
                            <div className="text-xs text-gray-500 mt-1">
                              {design.vendor.shop_name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {design.price ? design.price.toLocaleString() : '0'} FCFA
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {design.associatedProducts || 0}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <Badge className={`font-medium ${
                            status === 'PENDING'
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            status === 'VALIDATED'
                              ? 'bg-green-50 text-green-700 border-green-200' :
                            status === 'REJECTED'
                              ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }`}>
                            {getStatusLabel(status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {design.submittedForValidationAt ? new Date(design.submittedForValidationAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                          {getDesignActions(design)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-16">
              <Palette className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-700 font-medium mb-2">
                {filters.status === 'ALL' && !filters.vendor.trim() ?
                  'Aucun design trouvé' :
                  'Aucun design ne correspond aux filtres'}
              </p>
              <p className="text-gray-500 text-sm">
                {filters.status === 'ALL' && !filters.vendor.trim() ?
                  'Les nouveaux designs apparaîtront ici' :
                  'Essayez de modifier les filtres de recherche'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600">
              Page {pagination.currentPage} sur {pagination.totalPages} ({pagination.totalItems} designs)
            </p>
            <div className="flex gap-2">
              <AdminButton
                variant="outline"
                size="sm"
                disabled={!pagination.hasPrevious}
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              >
                Précédent
              </AdminButton>
              <AdminButton
                variant="outline"
                size="sm"
                disabled={!pagination.hasNext}
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              >
                Suivant
              </AdminButton>
            </div>
          </div>
        )}
      </div>

      {/* Modal de validation - Design professionnel */}
      <Dialog open={!!selectedDesign} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-50" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          <DialogHeader className="pb-4 border-b border-gray-100 bg-white px-6 py-4">
            <DialogTitle className="text-xl font-semibold text-gray-900">Détails du design</DialogTitle>
            <DialogDescription className="text-gray-600 font-medium">
              {selectedDesign?.name || 'Design sans nom'} • Créé par {selectedDesign?.vendor ? `${selectedDesign.vendor.firstName} ${selectedDesign.vendor.lastName}` : 'Vendeur inconnu'}
            </DialogDescription>
          </DialogHeader>

          {selectedDesign && (() => {
            const status = getDesignStatus(selectedDesign);

            return (
              <div className="space-y-6 p-6">
                {/* Statut */}
                <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm">
                  <Badge className={`font-medium ${
                    status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                    status === 'VALIDATED'
                      ? 'bg-green-100 text-green-700 border-green-200' :
                    status === 'REJECTED'
                      ? 'bg-red-100 text-red-700 border-red-200' :
                    'bg-gray-100 text-gray-700 border-gray-200'
                  }`}>
                    {getStatusLabel(status)}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {status === 'PENDING' ? 'En attente de validation' : status === 'VALIDATED' ? 'Design validé et publié' : 'Design rejeté'}
                  </span>
                </div>

                {/* Design preview and info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Design image */}
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Aperçu du design</h3>
                    <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                      {selectedDesign.imageUrl || selectedDesign.thumbnailUrl ? (
                        <img
                          src={selectedDesign.imageUrl || selectedDesign.thumbnailUrl}
                          alt={selectedDesign.name || 'Design'}
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
                          <Palette className="w-16 h-16" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Design information */}
                  <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900">Informations du design</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nom du design</p>
                        <p className="text-sm text-gray-900 font-medium mt-1">
                          {selectedDesign.name || 'Nom non défini'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Catégorie</p>
                        <p className="text-sm text-gray-700 mt-1">
                          {selectedDesign.category || 'Non spécifiée'}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Prix</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {selectedDesign.price ? selectedDesign.price.toLocaleString() : '0'} FCFA
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Produits associés</p>
                        <p className="text-sm text-gray-900 font-medium mt-1">
                          {selectedDesign.associatedProducts || 0} produit(s)
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date de soumission</p>
                        <p className="text-sm text-gray-700 mt-1">
                          {formatDate(selectedDesign.submittedForValidationAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vendor information */}
                {selectedDesign.vendor && (
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Informations vendeur</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nom du vendeur</p>
                          <p className="text-sm text-gray-900 font-medium mt-1">
                            {selectedDesign.vendor.firstName} {selectedDesign.vendor.lastName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
                          <p className="text-sm text-gray-700 mt-1">
                            {selectedDesign.vendor.email}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Boutique</p>
                          <p className="text-sm text-gray-700 mt-1">
                            {selectedDesign.vendor.shop_name || 'Non spécifiée'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Téléphone</p>
                          <p className="text-sm text-gray-700 mt-1">
                            {selectedDesign.vendor.phone || 'Non spécifié'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
                      placeholder="Expliquez en détail pourquoi ce design est rejeté..."
                      className="min-h-[100px] resize-none border-gray-200 rounded-lg focus:border-red-300 focus:ring-red-100"
                    />
                  </div>
                )}
              </div>
            );
          })()}

          <DialogFooter className="flex gap-3 pt-4 border-t border-gray-100">
            <AdminButton
              variant="outline"
              onClick={handleCloseModal}
            >
              Fermer
            </AdminButton>

            {/* Boutons de validation selon le statut */}
            {selectedDesign && (() => {
              const currentStatus = getDesignStatus(selectedDesign);
              return (
                <>
                  {currentStatus === 'PENDING' ? (
                    <>
                      <AdminButton
                        variant="outline"
                        onClick={() => setValidation({ approved: true, reason: '' })}
                        className="border-green-600 text-green-600 hover:bg-green-50"
                        disabled={processing}
                      >
                        <Check className="h-4 w-4" />
                        Valider
                      </AdminButton>
                      <AdminButton
                        variant="outline"
                        onClick={() => setValidation({ approved: false, reason: '' })}
                        className="border-red-600 text-red-600 hover:bg-red-50"
                        disabled={processing}
                      >
                        <X className="h-4 w-4" />
                        Rejeter
                      </AdminButton>
                    </>
                  ) : currentStatus === 'REJECTED' ? (
                    <AdminButton
                      variant="primary"
                      onClick={() => setValidation({ approved: true, reason: '' })}
                      disabled={processing}
                    >
                      <RefreshCw className="h-4 w-4" />
                      Réviser
                    </AdminButton>
                  ) : null}

                  {/* Bouton de confirmation */}
                  {validation.approved !== null && (
                    <AdminButton
                      variant={validation.approved ? "primary" : "destructive"}
                      onClick={handleValidate}
                      disabled={processing || (validation.approved === false && !validation.reason.trim())}
                    >
                      {processing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Traitement...
                        </>
                      ) : (
                        validation.approved ? 'Confirmer' : 'Confirmer le rejet'
                      )}
                    </AdminButton>
                  )}
                </>
              );
            })()}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDesignValidation; 