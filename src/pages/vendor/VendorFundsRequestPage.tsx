import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  History,
  Send,
  Download,
  Phone,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Eye,
  Plus,
  RefreshCw,
  Info
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';

import {
  vendorFundsService,
  FundsRequest,
  CreateFundsRequest,
  FundsRequestFilters
} from '../../services/vendorFundsService';
import vendorOnboardingService, { PhoneNumber } from '../../services/vendorOnboardingService';
import { formatDateShort } from '../../utils/dateUtils';

// React Query Hooks pour les fonds
import {
  useVendorEarnings,
  useFundsRequests,
  useCreateFundsRequest,
  useOrderStatistics
} from '../../hooks/vendor';

const VendorFundsRequestPage: React.FC = () => {
  // 🔄 React Query Hooks - Gestion automatique du cache et des requêtes
  const earningsQuery = useVendorEarnings();
  const orderStatsQuery = useOrderStatistics();
  const createMutation = useCreateFundsRequest();

  const [filters, setFilters] = useState<FundsRequestFilters>({
    page: 1,
    limit: 10
  });

  const fundsRequestsQuery = useFundsRequests(filters);

  // États pour les numéros de téléphone enregistrés
  const [savedPhones, setSavedPhones] = useState<PhoneNumber[]>([]);
  const [phonesLoading, setPhonesLoading] = useState(false);

  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FundsRequest | null>(null);

  // État pour le formulaire de nouvelle demande
  const [newRequest, setNewRequest] = useState<CreateFundsRequest>({
    amount: 0,
    paymentMethod: 'WAVE',
    phoneNumber: ''
  });

  const isBank = newRequest.paymentMethod === 'BANK_TRANSFER';
  const submitting = createMutation.isPending;

  const isLoading = earningsQuery.isLoading || orderStatsQuery.isLoading;
  const isRefetching = earningsQuery.isRefetching || orderStatsQuery.isRefetching || fundsRequestsQuery.isRefetching;

  // Données avec valeurs par défaut
  const earnings = earningsQuery.data || {
    totalEarnings: 0,
    pendingAmount: 0,
    availableAmount: 0,
    thisMonthEarnings: 0,
    lastMonthEarnings: 0,
    commissionPaid: 0,
    totalCommission: 0,
    averageCommissionRate: 0
  };

  const orderStats = orderStatsQuery.data || {
    totalVendorAmount: 0,
    monthlyRevenue: 0,
    totalRevenue: 0
  };

  const fundsRequests = fundsRequestsQuery.data?.requests || [];
  const pagination = fundsRequestsQuery.data ? {
    page: fundsRequestsQuery.data.page,
    totalPages: fundsRequestsQuery.data.totalPages,
    total: fundsRequestsQuery.data.total,
    hasNext: fundsRequestsQuery.data.hasNext,
    hasPrevious: fundsRequestsQuery.data.hasPrevious
  } : {
    page: 1,
    totalPages: 1,
    total: 0,
    hasNext: false,
    hasPrevious: false
  };

  // Charger les numéros de téléphone enregistrés
  useEffect(() => {
    loadSavedPhones();
  }, []);

  const loadSavedPhones = async () => {
    setPhonesLoading(true);
    try {
      const info = await vendorOnboardingService.getOnboardingInfo();
      setSavedPhones(info.phones);

      const primaryPhone = info.phones.find(p => p.isPrimary);
      if (primaryPhone) {
        setNewRequest(prev => ({ ...prev, phoneNumber: primaryPhone.number }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des numéros:', error);
    } finally {
      setPhonesLoading(false);
    }
  };

  // Fonction pour tout rafraîchir
  const refetchAll = () => {
    earningsQuery.refetch();
    orderStatsQuery.refetch();
    fundsRequestsQuery.refetch();
  };

  // Soumettre une nouvelle demande
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    createMutation.mutate(newRequest, {
      onSuccess: () => {
        setNewRequest({ amount: 0, paymentMethod: 'WAVE', phoneNumber: '' });
        setShowNewRequestDialog(false);
        refetchAll();
      }
    });
  };

  // Obtenir l'icône et la couleur pour le statut
  const getStatusIcon = (status: FundsRequest['status']) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-3 w-3" />;
      case 'APPROVED':
        return <CheckCircle className="h-3 w-3" />;
      case 'REJECTED':
        return <XCircle className="h-3 w-3" />;
      case 'PAID':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getStatusBadgeClass = (status: FundsRequest['status']) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-0';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800 border-0';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-0';
      case 'PAID':
        return 'bg-green-100 text-green-800 border-0';
      default:
        return 'bg-gray-100 text-gray-800 border-0';
    }
  };

  // Obtenir l'icône pour la méthode de paiement
  const getPaymentMethodIcon = (method: FundsRequest['paymentMethod']) => {
    switch (method) {
      case 'WAVE':
        return (
          <img
            src="https://goamobile.com/logosent/wave@221@-P-2021-06-30_00-18-27wave_logo_2.png"
            alt="Wave"
            className="h-6 w-6 object-contain"
          />
        );
      case 'ORANGE_MONEY':
        return (
          <img
            src="https://otobi.sn/wp-content/uploads/2022/03/Orange-Money-logo.png"
            alt="Orange Money"
            className="h-6 w-6 object-contain"
          />
        );
      case 'BANK_TRANSFER':
        return <CreditCard className="h-5 w-5 text-gray-600" />;
      default:
        return <CreditCard className="h-5 w-5 text-gray-600" />;
    }
  };

  // Formater la date
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
                Appel de Fonds
              </h1>
              <p className="text-gray-600 text-sm">
                Gérez vos demandes de paiement et consultez vos gains
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
              <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 text-sm gap-1.5 bg-[rgb(20,104,154)] hover:bg-[rgb(16,83,123)] active:bg-[rgb(14,72,108)] text-white"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Nouvelle Demande</span>
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Nouvelle Demande d'Appel de Fonds</DialogTitle>
                    <DialogDescription>
                      Créez une demande pour retirer vos gains disponibles
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmitRequest} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Montant (FCFA)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Montant à retirer"
                        value={newRequest.amount || ''}
                        onChange={(e) => setNewRequest(prev => ({
                          ...prev,
                          amount: parseInt(e.target.value) || 0
                        }))}
                        max={earnings?.availableAmount || 0}
                        min={1000}
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Disponible: {vendorFundsService.formatCurrency(earnings?.availableAmount || 0)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="method">Méthode de Paiement</Label>
                      <Select
                        value={newRequest.paymentMethod}
                        onValueChange={(value: FundsRequest['paymentMethod']) =>
                          setNewRequest(prev => ({ ...prev, paymentMethod: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WAVE">Wave</SelectItem>
                          <SelectItem value="ORANGE_MONEY">Orange Money</SelectItem>
                          <SelectItem value="BANK_TRANSFER">Virement bancaire</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {!isBank && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="phone">Numéro de Téléphone</Label>
                          <a
                            href="/vendeur/account"
                            className="text-xs text-[rgb(20,104,154)] hover:underline"
                          >
                            Gérer mes numéros
                          </a>
                        </div>
                        {phonesLoading ? (
                          <div className="flex items-center justify-center py-2 text-sm text-gray-500">
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            Chargement...
                          </div>
                        ) : savedPhones.length > 0 ? (
                          <Select
                            value={newRequest.phoneNumber}
                            onValueChange={(value) => setNewRequest(prev => ({
                              ...prev,
                              phoneNumber: value
                            }))}
                            required
                          >
                            <SelectTrigger id="phone">
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              {savedPhones.map((phone, index) => (
                                <SelectItem key={phone.number || index} value={phone.number}>
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-3 w-3 text-gray-500" />
                                    <span>{phone.number}</span>
                                    {phone.isPrimary && (
                                      <Badge variant="outline" className="ml-1 text-xs">
                                        Principal
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-sm text-yellow-800">
                              Aucun numéro enregistré.{' '}
                              <a
                                href="/vendeur/account"
                                className="text-[rgb(20,104,154)] hover:underline font-medium"
                              >
                                Ajouter
                              </a>
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {isBank && (
                      <div className="space-y-2">
                        <Label htmlFor="iban">IBAN</Label>
                        <Input
                          id="iban"
                          type="text"
                          placeholder="SN08 0000 0000 0000 0000 0000 0000"
                          value={(newRequest as any).iban || ''}
                          onChange={(e) => setNewRequest(prev => ({
                            ...prev,
                            iban: e.target.value
                          }) as any)}
                          required
                        />
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowNewRequestDialog(false)}
                        className="inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-200 text-gray-600 hover:bg-gray-50 bg-white px-3 py-1.5 text-sm"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 text-sm gap-1.5 bg-[rgb(20,104,154)] hover:bg-[rgb(16,83,123)] active:bg-[rgb(14,72,108)] text-white"
                      >
                        {submitting ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Envoi...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Envoyer
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </motion.div>

        <div className="px-6 pb-8 space-y-8">
          {/* Statistiques des gains - 4 KPIs modernes */}
          <div className="grid gap-4 md:grid-cols-4">
            {isLoading ? (
              <>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse mb-3"></div>
                    <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                ))}
              </>
            ) : (
              <>
                {/* 1. Gains Totaux */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-green-900">Gains Totaux</span>
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      {vendorFundsService.formatCurrency(orderStats?.totalVendorAmount || 0)}
                    </div>
                    <div className="text-xs text-green-700 mt-1">
                      Ce mois: {vendorFundsService.formatCurrency(orderStats?.monthlyRevenue || 0)}
                    </div>
                  </div>
                </motion.div>

                {/* 2. Disponible */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-[rgb(20,104,154)]/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">Disponible</span>
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {vendorFundsService.formatCurrency(earnings?.availableAmount || 0)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Prêt pour retrait
                    </div>
                  </div>
                </motion.div>

                {/* 3. En attente */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-[rgb(20,104,154)]/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">En attente</span>
                      <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-yellow-600" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {vendorFundsService.formatCurrency(earnings?.pendingAmount || 0)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      En cours de traitement
                    </div>
                  </div>
                </motion.div>

                {/* 4. Commissions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-[rgb(20,104,154)]/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">Commissions</span>
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {((earnings?.averageCommissionRate || 0) * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Taux moyen
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
            transition={{ delay: 0.5 }}
          >
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Comment fonctionne le paiement ?</h3>
                <p className="text-sm text-blue-800">
                  Délai de traitement habituel: 1-3 jours ouvrés. Contactez-nous à payments@printalma.com pour toute question.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Liste des demandes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      <History className="mr-2 h-5 w-5" />
                      Historique des Demandes
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Toutes vos demandes d'appel de fonds ({pagination.total} total)
                    </p>
                  </div>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) => setFilters(prev => ({
                      ...prev,
                      status: value === 'all' ? undefined : value as FundsRequest['status'],
                      page: 1
                    }))}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="PENDING">En attente</SelectItem>
                      <SelectItem value="APPROVED">Approuvées</SelectItem>
                      <SelectItem value="REJECTED">Rejetées</SelectItem>
                      <SelectItem value="PAID">Payées</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {fundsRequestsQuery.isLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">Chargement...</span>
                  </div>
                ) : fundsRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                    <CreditCard className="h-12 w-12 mb-2 text-gray-400" />
                    <p>Aucune demande d'appel de fonds</p>
                    <p className="text-sm">Créez votre première demande pour retirer vos gains</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date demande</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Date validation</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Méthode</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {fundsRequests.map((request) => (
                          <tr key={request.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="text-sm">
                                {vendorFundsService.formatDate(request.requestDate).split(' ').slice(0, 3).join(' ')}
                              </div>
                              <div className="text-xs text-gray-500">
                                {vendorFundsService.formatDate(request.requestDate).split(' ').slice(3).join(' ')}
                              </div>
                            </td>
                            <td className="px-6 py-4 hidden md:table-cell">
                              {request.validatedAt ? (
                                <div className="text-sm text-green-700">
                                  {formatDateShort(request.validatedAt)}
                                </div>
                              ) : (
                                <div className="text-gray-400 text-xs">En attente</div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium">
                                {vendorFundsService.formatCurrency(request.amount)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                {getPaymentMethodIcon(request.paymentMethod)}
                                <span className="text-sm">
                                  {vendorFundsService.getPaymentMethodLabel(request.paymentMethod)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={`flex items-center space-x-1 w-fit ${getStatusBadgeClass(request.status)}`}>
                                {getStatusIcon(request.status)}
                                <span>{vendorFundsService.getStatusLabel(request.status)}</span>
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowDetailsDialog(true);
                                }}
                                className="inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-200 text-gray-600 hover:bg-gray-50 bg-white px-2 py-1 text-sm"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>

              {/* Pagination */}
              {!fundsRequestsQuery.isLoading && pagination.totalPages > 1 && (
                <div className="border-t border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Page {pagination.page} sur {pagination.totalPages} ({pagination.total} demandes)
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={!pagination.hasPrevious}
                        onClick={() => setFilters(prev => ({ ...prev, page: pagination.page - 1 }))}
                        className="inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-200 text-gray-600 hover:bg-gray-50 bg-white px-3 py-1.5 text-sm"
                      >
                        Précédent
                      </button>
                      <button
                        type="button"
                        disabled={!pagination.hasNext}
                        onClick={() => setFilters(prev => ({ ...prev, page: pagination.page + 1 }))}
                        className="inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-200 text-gray-600 hover:bg-gray-50 bg-white px-3 py-1.5 text-sm"
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Modal de détails de la demande */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-gray-100">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
                <span>Détails de la demande</span>
              </div>
              <Badge variant="outline" className="ml-auto">
                #{selectedRequest?.id}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6 py-4">
              {/* En-tête de la demande */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-100 p-4 rounded-xl border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      Demande d'appel de fonds
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Soumise le {vendorFundsService.formatDate(selectedRequest.requestDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {vendorFundsService.formatCurrency(selectedRequest.amount)}
                    </div>
                    <Badge className={`mt-1 ${getStatusBadgeClass(selectedRequest.status)}`}>
                      {getStatusIcon(selectedRequest.status)}
                      <span className="ml-1">{vendorFundsService.getStatusLabel(selectedRequest.status)}</span>
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Informations de paiement */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-700">Informations de paiement</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Méthode de paiement</label>
                    <div className="flex items-center gap-2 mt-1">
                      {getPaymentMethodIcon(selectedRequest.paymentMethod)}
                      <span className="font-medium">
                        {vendorFundsService.getPaymentMethodLabel(selectedRequest.paymentMethod)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Numéro</label>
                    <p className="font-medium mt-1">{selectedRequest.phoneNumber}</p>
                  </div>
                </div>
              </div>

              {/* Statut et dates */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-700">Suivi de la demande</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Statut actuel :</span>
                    <Badge className={getStatusBadgeClass(selectedRequest.status)}>
                      {getStatusIcon(selectedRequest.status)}
                      <span className="ml-1">{vendorFundsService.getStatusLabel(selectedRequest.status)}</span>
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date de soumission :</span>
                    <span className="font-medium">{formatDate(selectedRequest.requestDate)}</span>
                  </div>
                  {selectedRequest.validatedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date de validation :</span>
                      <span className="font-medium text-green-700">{formatDate(selectedRequest.validatedAt)}</span>
                    </div>
                  )}
                  {selectedRequest.processedDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date de paiement :</span>
                      <span className="font-medium text-blue-700">{formatDate(selectedRequest.processedDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedRequest.rejectReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-900">Raison du rejet</span>
                  </div>
                  <p className="text-red-800">{selectedRequest.rejectReason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorFundsRequestPage;
