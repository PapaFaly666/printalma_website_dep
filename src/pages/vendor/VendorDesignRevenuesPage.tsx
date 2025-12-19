import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  Eye,
  Download,
  Calendar,
  Filter,
  Search,
  ChevronDown,
  Info,
  ArrowLeft,
  FileText,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { formatPrice } from '../../utils/priceUtils';
import { Button } from '../../components/ui/button';
import { useToast } from '../../components/ui/use-toast';
import vendorDesignRevenueService, { DesignRevenue, DesignUsage } from '../../services/vendorDesignRevenueService';

interface RevenueStats {
  totalRevenue: number;
  pendingRevenue: number;
  completedRevenue: number;
  totalUsages: number;
  uniqueDesignsUsed: number;
}

const VendorDesignRevenuesPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // États
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [designRevenues, setDesignRevenues] = useState<DesignRevenue[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'revenue' | 'usage' | 'recent'>('revenue');
  const [expandedDesign, setExpandedDesign] = useState<number | null>(null);

  // Charger les données depuis le backend
  useEffect(() => {
    loadRevenueData();
  }, [selectedPeriod, sortBy]);

  const loadRevenueData = async () => {
    try {
      setLoading(true);

      // Charger les statistiques et les designs en parallèle
      const [statsResponse, designsResponse] = await Promise.all([
        vendorDesignRevenueService.getRevenueStats(selectedPeriod),
        vendorDesignRevenueService.getDesignRevenues({
          period: selectedPeriod,
          sortBy: sortBy,
          search: searchTerm || undefined
        })
      ]);

      setStats(statsResponse);
      setDesignRevenues(designsResponse);
    } catch (error: any) {
      console.error('Erreur chargement données revenus:', error);

      // Gérer les erreurs d'authentification
      if (error.response?.status === 401) {
        toast({
          title: 'Session expirée',
          description: 'Veuillez vous reconnecter',
          variant: 'destructive'
        });
        // Rediriger vers la page de connexion
        navigate('/login');
        return;
      }

      if (error.response?.status === 403) {
        toast({
          title: 'Accès refusé',
          description: 'Vous n\'avez pas les permissions nécessaires',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Impossible de charger les données de revenus',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Charger l'historique d'un design spécifique
  const loadDesignHistory = async (designId: number) => {
    try {
      const history = await vendorDesignRevenueService.getDesignUsageHistory(designId);

      // Mettre à jour le design avec son historique
      setDesignRevenues(prev => prev.map(design =>
        design.designId === designId
          ? { ...design, usageHistory: history }
          : design
      ));
    } catch (error: any) {
      console.error('Erreur chargement historique design:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger l\'historique de ce design',
        variant: 'destructive'
      });
    }
  };

  // Filtrer et trier les designs
  const filteredDesigns = designRevenues
    .filter(design =>
      design.designName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return b.totalRevenue - a.totalRevenue;
        case 'usage':
          return b.totalUsages - a.totalUsages;
        case 'recent':
          return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
        default:
          return 0;
      }
    });

  // Gérer le clic sur un design pour charger l'historique
  const handleDesignClick = async (designId: number) => {
    const isCurrentlyExpanded = expandedDesign === designId;

    // Si on déplie et que l'historique n'est pas encore chargé
    if (!isCurrentlyExpanded) {
      const design = designRevenues.find(d => d.designId === designId);
      if (design && (!design.usageHistory || design.usageHistory.length === 0)) {
        await loadDesignHistory(designId);
      }
    }

    setExpandedDesign(expandedDesign === designId ? null : designId);
  };

  const getStatusBadge = (usage: DesignUsage) => {
    // Utiliser orderPaymentStatus si disponible, sinon utiliser status
    const paymentStatus = usage.orderPaymentStatus || usage.status;

    switch (paymentStatus) {
      case 'PAID':
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Payé
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            En attente
          </span>
        );
      case 'CANCELLED':
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            {paymentStatus === 'REFUNDED' ? 'Remboursé' : 'Annulé'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="w-3 h-3" />
            {paymentStatus}
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/vendeur/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Revenus des Designs</h1>
              <p className="text-sm text-gray-600">Suivez l'utilisation et les revenus de vos designs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total des revenus */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Revenus</span>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatPrice(stats?.totalRevenue || 0)}</p>
            <p className="text-xs text-gray-500 mt-1">Tous les designs</p>
          </div>

          {/* Revenus complétés */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Payés</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{formatPrice(stats?.completedRevenue || 0)}</p>
            <p className="text-xs text-gray-500 mt-1">Déjà reçus</p>
          </div>

          {/* Revenus en attente */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">En attente</span>
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-yellow-600">{formatPrice(stats?.pendingRevenue || 0)}</p>
            <p className="text-xs text-gray-500 mt-1">À recevoir</p>
          </div>

          {/* Total utilisations */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Utilisations</span>
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.totalUsages || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Total</p>
          </div>

          {/* Designs utilisés */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Designs actifs</span>
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.uniqueDesignsUsed || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Différents</p>
          </div>
        </div>

        {/* Informations de paiement */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Comment fonctionne le paiement ?</h3>
            <p className="text-sm text-blue-800 mb-2">
              Vous recevez un pourcentage du prix de chaque design utilisé dans les commandes clients.
              Les paiements sont effectués automatiquement une fois la commande confirmée et livrée.
            </p>
            <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
              <li>Commission vendeur : <strong>70%</strong> du prix du design</li>
              <li>Paiement sous <strong>7 jours</strong> après livraison</li>
              <li>Virement automatique sur votre compte bancaire enregistré</li>
            </ul>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un design..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Période */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="year">Cette année</option>
              <option value="all">Tout</option>
            </select>

            {/* Tri */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="revenue">Plus de revenus</option>
              <option value="usage">Plus utilisés</option>
              <option value="recent">Plus récents</option>
            </select>
          </div>
        </div>

        {/* Liste des designs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Vos Designs ({filteredDesigns.length})
            </h2>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exporter CSV
            </Button>
          </div>

          {filteredDesigns.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun design trouvé</h3>
              <p className="text-gray-600">
                {searchTerm
                  ? "Aucun design ne correspond à votre recherche"
                  : "Vos designs n'ont pas encore été utilisés"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDesigns.map((design) => (
                <div
                  key={design.id}
                  className="bg-white rounded-lg shadow-sm border overflow-hidden"
                >
                  {/* En-tête du design */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleDesignClick(design.designId)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Image du design */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={design.designImage}
                          alt={design.designName}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Informations */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{design.designName}</h3>
                        <p className="text-sm text-gray-600">
                          Dernière utilisation : {formatDate(design.lastUsedAt)}
                        </p>
                      </div>

                      {/* Statistiques */}
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{design.totalUsages}</p>
                          <p className="text-xs text-gray-600">Utilisations</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{formatPrice(design.totalRevenue)}</p>
                          <p className="text-xs text-gray-600">Revenus</p>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            expandedDesign === design.designId ? 'transform rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Historique des utilisations (expandable) */}
                  {expandedDesign === design.designId && design.usageHistory && design.usageHistory.length > 0 && (
                    <div className="border-t bg-gray-50">
                      <div className="p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">
                          Historique d'utilisation ({design.usageHistory.length})
                        </h4>
                        <div className="space-y-2">
                          {design.usageHistory.map((usage) => (
                            <div
                              key={usage.id}
                              className="bg-white rounded-lg border p-3 flex items-center justify-between"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-gray-900 text-sm">{usage.orderNumber}</p>
                                  {getStatusBadge(usage)}
                                </div>
                                <p className="text-sm text-gray-600">
                                  {usage.customerName} • {usage.productName}
                                </p>
                                <p className="text-xs text-gray-500">{formatDate(usage.usedAt)}</p>
                              </div>
                              <div className="text-right flex-shrink-0 ml-4">
                                <p className="text-lg font-bold text-green-600">{formatPrice(usage.revenue)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorDesignRevenuesPage;
