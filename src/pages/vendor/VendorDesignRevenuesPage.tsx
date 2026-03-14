import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
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
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

import { formatPrice } from '../../utils/priceUtils';
import vendorDesignRevenueService, { DesignRevenue, DesignUsage } from '../../services/vendorDesignRevenueService';

// React Query Hooks pour les revenus de designs
import {
  useDesignRevenueStats,
  useDesignRevenues,
  useDesignUsageHistory
} from '../../hooks/vendor';

interface RevenueStats {
  totalRevenue: number;
  pendingRevenue: number;
  completedRevenue: number;
  totalUsages: number;
  uniqueDesignsUsed: number;
}

const VendorDesignRevenuesPage: React.FC = () => {
  // États
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'revenue' | 'usage' | 'recent'>('revenue');
  const [expandedDesign, setExpandedDesign] = useState<number | null>(null);

  // 🔄 React Query Hooks - Gestion automatique du cache et des requêtes
  const statsQuery = useDesignRevenueStats(selectedPeriod);
  const designsQuery = useDesignRevenues({
    period: selectedPeriod,
    sortBy: sortBy,
    search: searchTerm || undefined
  });

  const isLoading = statsQuery.isLoading || designsQuery.isLoading;
  const isRefetching = statsQuery.isRefetching || designsQuery.isRefetching;

  // Hook pour charger l'historique d'un design spécifique
  const historyQuery = useDesignUsageHistory(
    expandedDesign || 0,
    !!expandedDesign
  );

  // Données avec valeurs par défaut
  const stats: RevenueStats = statsQuery.data || {
    totalRevenue: 0,
    pendingRevenue: 0,
    completedRevenue: 0,
    totalUsages: 0,
    uniqueDesignsUsed: 0
  };

  const designRevenues = designsQuery.data || [];

  // Fusionner les données avec l'historique si chargé
  const designsWithHistory = useMemo(() => {
    if (expandedDesign && historyQuery.data) {
      return designRevenues.map(design =>
        design.designId === expandedDesign
          ? { ...design, usageHistory: historyQuery.data }
          : design
      );
    }
    return designRevenues;
  }, [designRevenues, expandedDesign, historyQuery.data]);

  // Filtrer et trier les designs
  const filteredDesigns = useMemo(() => {
    return designsWithHistory
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
  }, [designsWithHistory, searchTerm, sortBy]);

  // Fonction pour tout rafraîchir
  const refetchAll = () => {
    statsQuery.refetch();
    designsQuery.refetch();
  };

  // Gérer le clic sur un design pour charger l'historique
  const handleDesignClick = (designId: number) => {
    const isCurrentlyExpanded = expandedDesign === designId;
    setExpandedDesign(isCurrentlyExpanded ? null : designId);
  };

  const getStatusBadge = (usage: DesignUsage) => {
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
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircle className="w-3 h-3" />
            Confirmé
          </span>
        );
      case 'READY_FOR_PAYOUT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <DollarSign className="w-3 h-3" />
            Prêt pour retrait
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

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        {/* Header moderne */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-b border-gray-200 px-6 py-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Revenus des Designs
              </h1>
              <p className="text-gray-600 text-sm">
                Suivez l'utilisation et les revenus de vos designs
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={refetchAll}
                disabled={isLoading}
                className="inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[rgb(20,104,154)] text-[rgb(20,104,154)] hover:bg-[rgb(20,104,154)] hover:text-white bg-white px-3 py-1.5 text-sm gap-1.5"
              >
                <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualiser</span>
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[rgb(20,104,154)] text-[rgb(20,104,154)] hover:bg-[rgb(20,104,154)] hover:text-white bg-white px-3 py-1.5 text-sm gap-1.5"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exporter CSV</span>
              </button>
            </div>
          </div>
        </motion.div>

        <div className="px-6 pb-8 space-y-8">
          {/* Cartes de statistiques - 5 KPIs modernes */}
          <div className="grid gap-4 md:grid-cols-5">
            {isLoading ? (
              <>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse mb-3"></div>
                    <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                ))}
              </>
            ) : (
              <>
                {/* 1. Total des revenus */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-[rgb(20,104,154)]/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">Total Revenus</span>
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatPrice(stats.totalRevenue)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Tous les designs
                    </div>
                  </div>
                </motion.div>

                {/* 2. Revenus complétés */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-[rgb(20,104,154)]/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">Payés</span>
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatPrice(stats.completedRevenue)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Déjà reçus
                    </div>
                  </div>
                </motion.div>

                {/* 3. Revenus en attente */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-amber-900">En attente</span>
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-amber-600" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-amber-600">
                      {formatPrice(stats.pendingRevenue)}
                    </div>
                    <div className="text-xs text-amber-700 mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Disponible après livraison
                    </div>
                  </div>
                </motion.div>

                {/* 4. Total utilisations */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-[rgb(20,104,154)]/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">Utilisations</span>
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Eye className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.totalUsages}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Total
                    </div>
                  </div>
                </motion.div>

                {/* 5. Designs utilisés */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-[rgb(20,104,154)]/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">Designs actifs</span>
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats.uniqueDesignsUsed}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Différents
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </div>

          {/* Informations de paiement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Comment fonctionne le paiement ?</h3>
                <p className="text-sm text-blue-800 mb-2">
                  Vous recevez un pourcentage du prix de chaque design utilisé dans les commandes clients.
                </p>
                <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
                  <li>Commission vendeur : <strong>90%</strong> du prix du design</li>
                  <li><strong>Montant disponible</strong> dès que l'admin livre la commande</li>
                  <li>Retirez vos gains via <strong>Appel de Fonds</strong></li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Filtres et recherche */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Recherche */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher un design..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Période */}
                  <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as any)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Période" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Cette semaine</SelectItem>
                      <SelectItem value="month">Ce mois</SelectItem>
                      <SelectItem value="year">Cette année</SelectItem>
                      <SelectItem value="all">Tout</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Tri */}
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Tri" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Plus de revenus</SelectItem>
                      <SelectItem value="usage">Plus utilisés</SelectItem>
                      <SelectItem value="recent">Plus récents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Liste des designs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Vos Designs ({filteredDesigns.length})
                </h2>
              </div>

              {filteredDesigns.length === 0 ? (
                <Card className="border-gray-200 p-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun design trouvé</h3>
                    <p className="text-gray-600">
                      {searchTerm
                        ? "Aucun design ne correspond à votre recherche"
                        : "Vos designs n'ont pas encore été utilisés"}
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredDesigns.map((design) => (
                    <motion.div
                      key={design.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-[rgb(20,104,154)]/30 transition-all"
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
                                  className="bg-white border-2 border-gray-200 rounded-lg p-3 flex items-center justify-between hover:shadow-sm transition-shadow"
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
                                    {(usage.orderPaymentStatus === 'PENDING' || usage.orderPaymentStatus === 'CONFIRMED') && (
                                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Disponible après livraison
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default VendorDesignRevenuesPage;
