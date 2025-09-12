import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  X, 
  Eye, 
  Clock,
  User,
  Calendar,
  Tag,
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  MessageSquare,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Info
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { toast } from 'sonner';
import { designService, Design } from '../../services/designService';
import { NotificationBanner } from '../../components/ui/notification-banner';
import AutoValidationControls from '../../components/admin/AutoValidationControls';
import { autoValidationService } from '../../services/autoValidationService';

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

export const AdminDesignValidation: React.FC = () => {
  const [designs, setDesigns] = useState<DesignWithValidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'submittedAt' | 'createdAt' | 'price'>('submittedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // 🆕 NOUVEAU: Filtre par statut
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VALIDATED' | 'REJECTED'>('PENDING');

  // 🆕 Filtres supplémentaires: par vendeur et par nombre de designs
  const [vendorFilter, setVendorFilter] = useState<string>('ALL');
  const [minDesignsFilter, setMinDesignsFilter] = useState<number>(0);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPending, setTotalPending] = useState(0);
  
  // Stats
  const [validationStats, setValidationStats] = useState({
    totalDesigns: 0,
    pendingValidation: 0,
    validated: 0,
    rejected: 0,
    draft: 0,
    avgValidationTime: 0,
    todaySubmissions: 0
  });
  
  // Modal states
  const [selectedDesign, setSelectedDesign] = useState<DesignWithValidation | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [validatorNote, setValidatorNote] = useState('');

  // 🆕 État pour la fiche vendeur
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<DesignWithValidation['vendor'] | null>(null);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    loadAllDesigns();
    loadValidationStats();
  }, [currentPage, searchTerm, sortBy, sortOrder, statusFilter]);

  // 🆕 NOUVELLE MÉTHODE: Charger tous les designs avec filtres
  const loadAllDesigns = async () => {
    try {
      setLoading(true);
      const response = await designService.getAllDesigns({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchTerm,
        status: statusFilter,
        sortBy: sortBy === 'submittedAt' ? 'createdAt' : sortBy,
        sortOrder
      });
      
      const transformedDesigns = (response.designs || []).map(design => ({
        ...design,
        submittedForValidationAt: design.submittedForValidationAt || design.createdAt || new Date().toISOString()
      }));
      
      setDesigns(transformedDesigns);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalPending(response.stats?.pending || 0);
      
      setValidationStats(prev => ({
        ...prev,
        totalDesigns: response.stats?.total || 0,
        pendingValidation: response.stats?.pending || 0,
        validated: response.stats?.validated || 0,
        rejected: response.stats?.rejected || 0
      }));
      
    } catch (error) {
      console.error('Erreur chargement designs:', error);
      setDesigns([]);
      setTotalPages(1);
      setTotalPending(0);
    } finally {
      setLoading(false);
    }
  };

  const loadValidationStats = async () => {
    try {
      const stats = await designService.getValidationStats();
      setValidationStats({
        totalDesigns: stats?.totalDesigns || 0,
        pendingValidation: stats?.pendingValidation || 0,
        validated: stats?.validated || 0,
        rejected: stats?.rejected || 0,
        draft: stats?.draft || 0,
        avgValidationTime: stats?.avgValidationTime || 0,
        todaySubmissions: stats?.todaySubmissions || 0
      });
    } catch (error) {
      console.error('Erreur chargement stats validation:', error);
    }
  };

  const handleValidateDesign = async (designId: number, isValid: boolean) => {
    try {
      setValidating(designId);
      
      // Appel API selon la nouvelle spécification
      const response = await fetch(`https://printalma-back-dep.onrender.com/api/designs/${designId}/validate`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        action: isValid ? 'VALIDATE' : 'REJECT',
        rejectionReason: isValid ? undefined : rejectionReason
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      
      // Afficher les résultats de la cascade selon la documentation
      if (isValid) {
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

      // Fermer le modal et recharger
      setShowValidationModal(false);
      setSelectedDesign(null);
      setRejectionReason('');
      setValidatorNote('');
      
      // Auto-valider les produits vendeur si le design a été validé
      if (isValid) {
        try {
          // Utiliser le service pour auto-valider les produits associés à ce design
          const autoResult = await autoValidationService.autoValidateProductsForDesign(designId);
          
          if (autoResult.success && autoResult.data.updatedProducts.length > 0) {
            toast.success('✅ Produits auto-validés !', {
              description: `${autoResult.data.updatedProducts.length} produit(s) vendeur automatiquement validé(s) (isValidated = true) suite à la validation du design.`,
              duration: 6000
            });
          } else {
            // Fallback: essayer l'auto-validation globale
            const globalResult = await autoValidationService.autoValidateAllProducts();
            if (globalResult.success && globalResult.data.updatedProducts.length > 0) {
              toast.success('✅ Auto-validation globale déclenchée !', {
                description: `${globalResult.data.updatedProducts.length} produit(s) vendeur mis à jour avec isValidated = true.`,
                duration: 5000
              });
            }
          }
        } catch (error) {
          console.log('Info: Auto-validation des produits non disponible, les produits devront être validés manuellement.');
        }
      }
      
      // Recharger les listes pour refléter les changements
      await Promise.all([
        loadAllDesigns(),
        loadValidationStats()
      ]);
      
    } catch (error) {
      console.error('Erreur validation design:', error);
      
      // Gestion d'erreurs selon la documentation
      let errorMessage = 'Une erreur inattendue s\'est produite';
      if (error instanceof Error) {
        if (error.message.includes('400')) {
          errorMessage = 'Données invalides. Vérifiez votre saisie.';
        } else if (error.message.includes('403')) {
          errorMessage = 'Accès non autorisé. Vérifiez vos permissions.';
        } else if (error.message.includes('404')) {
          errorMessage = 'Design non trouvé.';
        } else if (error.message.includes('409')) {
          errorMessage = 'Design déjà validé. Rechargement des données...';
          await loadAllDesigns();
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error('Erreur lors de la validation', {
        description: errorMessage
      });
    } finally {
      setValidating(null);
    }
  };

  const openValidationModal = (design: DesignWithValidation) => {
    setSelectedDesign(design);
    setShowValidationModal(true);
    setRejectionReason('');
    setValidatorNote('');
  };

  const openVendorModal = (vendor: DesignWithValidation['vendor']) => {
    setSelectedVendor(vendor);
    setShowVendorModal(true);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
  );
  }

  // 🧮 Construire la liste des vendeurs et le nombre de designs (basé sur les données chargées)
  const vendorCounts = designs.reduce<Record<string, number>>((acc, d) => {
    const key = d.vendor ? String(d.vendor.id) : 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const vendorOptions = Array.from(
    new Map(
      designs.map(d => [String(d.vendor ? d.vendor.id : 'unknown'), d.vendor])
    ).entries()
  ).map(([id, v]) => ({
    id,
    label: v ? `${v.firstName || ''} ${v.lastName || ''}`.trim() || v.email || `Vendeur ${id}` : `Vendeur ${id}`
  }));

  // 🧹 Appliquer les filtres locaux (vendeur et nombre de designs)
  const filteredDesigns = designs.filter(d => {
    const vendorId = String(d.vendor ? d.vendor.id : 'unknown');
    const vendorMatch = vendorFilter === 'ALL' || vendorId === vendorFilter;
    const countMatch = (vendorCounts[vendorId] || 0) >= (minDesignsFilter || 0);
    return vendorMatch && countMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header avec statistiques */}
        <div className="mb-8">
          <NotificationBanner type="admin" className="mb-6" />
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Validation des Designs
              </h1>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md text-left w-full transition-transform hover:scale-[1.02] ${statusFilter==='PENDING' ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">En attente</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {validationStats.pendingValidation}
                  </p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => setStatusFilter('VALIDATED')}
              className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md text-left w-full transition-transform hover:scale-[1.02] ${statusFilter==='VALIDATED' ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="flex items-center">
                <Check className="w-8 h-8 text-green-500 mr-3" />
                  <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Validés</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {validationStats.validated}
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setStatusFilter('REJECTED')}
              className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md text-left w-full transition-transform hover:scale-[1.02] ${statusFilter==='REJECTED' ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="flex items-center">
                <X className="w-8 h-8 text-red-500 mr-3" />
                  <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Rejetés</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {validationStats.rejected}
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setStatusFilter('ALL')}
              className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md text-left w-full transition-transform hover:scale-[1.02] ${statusFilter==='ALL' ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-blue-500 mr-3" />
                  <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Soumissions aujourd'hui</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {validationStats.todaySubmissions}
                    </p>
                </div>
              </div>
            </button>
          </div>
          </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-md">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom de design ou vendeur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="submittedAt">Date de soumission</option>
                <option value="createdAt">Date de création</option>
                <option value="price">Prix</option>
              </select>
              
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="desc">Plus récent</option>
                <option value="asc">Plus ancien</option>
              </select>
            </div>
          </div>

          {/* Ligne de filtres avancés */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filtrer par vendeur</label>
              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="ALL">Tous les vendeurs</option>
                {vendorOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                    {vendorCounts[opt.id] !== undefined ? ` (${vendorCounts[opt.id]})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre minimum de designs (par vendeur)</label>
              <input
                type="number"
                min={0}
                value={minDesignsFilter}
                onChange={(e) => setMinDesignsFilter(Number(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Contrôles d'auto-validation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl">🤖</span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Auto-validation des Produits Vendeur
            </h3>
          </div>
          <AutoValidationControls 
            onValidationComplete={(result) => {
              // Recharger les statistiques après auto-validation
              loadValidationStats();
            }}
            className="w-full"
          />
        </div>

        {/* Liste des designs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {filteredDesigns && filteredDesigns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Design
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Vendeur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Prix
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Produits associés
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Soumis le
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredDesigns.map((design) => {
                    const getDesignStatus = () => {
                      if ((design as any).validationStatus) {
                        return (design as any).validationStatus;
                      }
                      if (design.isPublished) return 'VALIDATED';
                      if (design.isDraft) return 'REJECTED';
                      return 'PENDING';
                    };

                    const designStatus = getDesignStatus();

                    return (
                    <tr key={design.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-16 w-16">
                            <img
                              src={design.imageUrl || design.thumbnailUrl || '/placeholder-design.png'}
                              alt={design.name || 'Design sans nom'}
                              className="h-16 w-16 rounded-lg object-cover"
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {design.name || 'Design sans nom'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {design.category || 'Catégorie non spécifiée'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img
                            src={design.vendor?.profile_photo_url || '/placeholder-avatar.png'}
                            alt={design.vendor?.firstName || 'Avatar'}
                            className="h-10 w-10 rounded-full object-cover border border-gray-200"
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {design.vendor?.firstName || 'N/A'} {design.vendor?.lastName || ''}
                        </div>
                            {design.vendor?.shop_name && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {design.vendor.shop_name}
                              </div>
                            )}
                            </div>
                        </div>
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {designStatus === 'PENDING' && (
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                              ⏳ En attente
                            </Badge>
                          )}
                          {designStatus === 'VALIDATED' && (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                              ✅ Validé
                            </Badge>
                          )}
                          {designStatus === 'REJECTED' && (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                              ❌ Rejeté
                            </Badge>
                          )}
                        </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('fr-FR', { 
                            style: 'currency', 
                            currency: 'XOF', 
                            maximumFractionDigits: 0 
                          }).format(design.price || 0)}
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {design.associatedProducts || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(design.submittedForValidationAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                          <button
                              onClick={() => openVendorModal(design.vendor)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                            
                            {designStatus === 'PENDING' && (
                              <>
                          <button
                                  onClick={() => handleValidateDesign(design.id as number, true)}
                            disabled={validating === design.id}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openValidationModal(design)}
                            disabled={validating === design.id}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                          </button>
                              </>
                            )}
                </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {statusFilter === 'PENDING' ? 'Aucun design en attente de validation' : 'Aucun design trouvé'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-6">
              <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
            >
              Précédent
              </button>
            
            <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
              Page {currentPage} sur {totalPages}
            </span>
            
              <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                  >
                Suivant
              </button>
          </div>
        )}

        {/* Modal de validation/rejet */}
      {showValidationModal && selectedDesign && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto"
          >
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Rejeter le design
              </h3>
              
                <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Motif de rejet (requis)
                </label>
                <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Expliquez pourquoi ce design est rejeté..."
                  />
                </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowValidationModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleValidateDesign(selectedDesign.id as number, false)}
                    disabled={!rejectionReason.trim() || validating === selectedDesign.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      Rejeter
                </button>
                  </div>
                      </div>
          </motion.div>
                  </div>
                )}

        {/* Modal fiche vendeur */}
      {showVendorModal && selectedVendor && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
            >
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Informations vendeur
                </h3>
                
                <div className="space-y-3">
                <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Nom:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                    {selectedVendor.firstName} {selectedVendor.lastName}
                    </p>
                </div>
                  
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Email:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedVendor.email}
                    </p>
              </div>

                  {selectedVendor.shop_name && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Boutique:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedVendor.shop_name}
                      </p>
              </div>
                  )}
                  
                  {selectedVendor.country && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Pays:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedVendor.country}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowVendorModal(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Fermer
                </button>
              </div>
                      </div>
          </motion.div>
                  </div>
                )}
      </div>
    </div>
  );
}; 