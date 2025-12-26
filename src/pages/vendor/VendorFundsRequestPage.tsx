import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  History,
  ChevronRight,
  Send,
  Download,
  ArrowRight,
  Phone,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Eye,
  Plus,
  RefreshCw
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

import {
  vendorFundsService,
  FundsRequest,
  VendorEarnings,
  CreateFundsRequest,
  FundsRequestFilters
} from '../../services/vendorFundsService';
import { vendorProductService } from '../../services/vendorProductService';
import { vendorStatsService } from '../../services/vendorStatsService';
import { formatDateShort } from '../../utils/dateUtils';
import vendorOnboardingService, { PhoneNumber } from '../../services/vendorOnboardingService';

// Interface pour les statistiques du backend
interface OrderStatistics {
  totalOrders: number;
  totalAmount: number;
  statusBreakdown: Record<string, number>;
  paymentStatusBreakdown: Record<string, number>;
  totalRevenue: number;
  totalCommission: number;
  totalVendorAmount: number;
  monthlyRevenue: number;
  annualRevenue: number;
  monthlyOrders: number;
  averageOrderValue: number;
  conversionRate: number;
}

const VendorFundsRequestPage: React.FC = () => {
  // États pour les données - Utiliser les nouvelles données de /orders/my-orders
  const [earnings, setEarnings] = useState<VendorEarnings | null>(null);
  const [backendStatistics, setBackendStatistics] = useState<OrderStatistics | null>(null);
  const [statsData, setStatsData] = useState<any>(null); // Données de /vendor/stats pour cohérence

  const [fundsRequests, setFundsRequests] = useState<FundsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // États pour les numéros de téléphone enregistrés
  const [savedPhones, setSavedPhones] = useState<PhoneNumber[]>([]);
  const [phonesLoading, setPhonesLoading] = useState(false);

  // États pour les filtres et pagination
  const [filters, setFilters] = useState<FundsRequestFilters>({
    page: 1,
    limit: 10
  });

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    hasNext: false,
    hasPrevious: false
  });

  // États pour le formulaire de nouvelle demande
  const [newRequest, setNewRequest] = useState<CreateFundsRequest>({
    amount: 0,
    paymentMethod: 'WAVE',
    phoneNumber: ''
  });
  const isBank = newRequest.paymentMethod === 'BANK_TRANSFER';

  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FundsRequest | null>(null);

  // Charger les données au montage
  useEffect(() => {
    loadData();
  }, [filters]);

  // Charger les numéros de téléphone enregistrés
  useEffect(() => {
    loadSavedPhones();
  }, []);


  // Charger les numéros de téléphone enregistrés
  const loadSavedPhones = async () => {
    setPhonesLoading(true);
    try {
      console.log('📞 Chargement des numéros de téléphone enregistrés...');
      const info = await vendorOnboardingService.getOnboardingInfo();

      setSavedPhones(info.phones);
      console.log('✅ Numéros chargés:', info.phones);

      // Pré-sélectionner le numéro principal
      const primaryPhone = info.phones.find(p => p.isPrimary);
      if (primaryPhone) {
        setNewRequest(prev => ({
          ...prev,
          phoneNumber: primaryPhone.number
        }));
        console.log('📌 Numéro principal pré-sélectionné:', primaryPhone.number);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des numéros:', error);
      // Ne pas bloquer l'interface si les numéros ne peuvent pas être chargés
    } finally {
      setPhonesLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Chargement des données d\'appel de fonds avec /orders/my-orders...');

      // Fetch statistics from /orders/my-orders endpoint
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3004';
      const token = localStorage.getItem('token');

      const apiResponse = await fetch(`${apiUrl}/orders/my-orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        console.log('📊 Statistics reçues du backend (VendorFundsRequestPage):', apiData.data.statistics);
        if (apiData.success && apiData.data.statistics) {
          setBackendStatistics(apiData.data.statistics);
          console.log('✅ totalVendorAmount (VendorFundsRequestPage):', apiData.data.statistics.totalVendorAmount);
        }
      }

      // 🎯 Utiliser /vendor/earnings pour les montants disponibles et en attente
      const [earningsData, requestsData] = await Promise.all([
        vendorFundsService.getVendorEarnings(),
        vendorFundsService.getVendorFundsRequests(filters)
      ]);

      console.log('✅ Données récupérées depuis /vendor/earnings:', { earningsData, requestsData });
      console.log('💰 Montants dynamiques depuis /vendor/earnings:', {
        availableAmount: earningsData.availableAmount,
        pendingAmount: earningsData.pendingAmount,
        totalEarnings: earningsData.totalEarnings,
        thisMonthEarnings: earningsData.thisMonthEarnings
      });

      setEarnings(earningsData);
      setStatsData(null); // Pas besoin des données /vendor/stats

      setFundsRequests(requestsData.requests);
      setPagination({
        page: requestsData.page,
        totalPages: requestsData.totalPages,
        total: requestsData.total,
        hasNext: requestsData.hasNext,
        hasPrevious: requestsData.hasPrevious
      });

    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      console.log('⚠️ Tentative de fallback vers /vendor/stats...');

      try {
        // Fallback vers /vendor/stats si /vendor/earnings échoue
        const statsData = await vendorStatsService.getVendorStats();
        if (statsData) {
          const data = statsData;
          setStatsData(data);

          // Convertir les données /vendor/stats vers le format VendorEarnings
          const compatibleEarnings: VendorEarnings = {
            totalEarnings: data.totalEarnings || 0,
            pendingAmount: data.pendingAmount || 0,
            availableAmount: data.availableBalance || 0,
            thisMonthEarnings: data.monthlyRevenue || 0,
            lastMonthEarnings: Math.floor((data.monthlyRevenue || 0) * 0.8),
            commissionPaid: data.totalEarnings - data.availableBalance - data.pendingAmount || 0,
            totalCommission: data.totalEarnings || 0,
            averageCommissionRate: data.averageCommissionRate || 0
          };

          console.log('✅ FALLBACK SUCCESS: Données récupérées depuis /vendor/stats');
          setEarnings(compatibleEarnings);
        } else {
          throw new Error('Both endpoints failed');
        }
      } catch (fallbackError) {
        console.error('❌ Fallback vers /vendor/stats également échoué:', fallbackError);
        const errorMessage = vendorFundsService.handleError(error, 'chargement données');
        console.warn('Message d\'erreur utilisateur:', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Soumettre une nouvelle demande
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      console.log('📤 Envoi de la demande d\'appel de fonds...', newRequest);

      const createdRequest = await vendorFundsService.createFundsRequest(newRequest);

      console.log('✅ Demande créée:', createdRequest);

      // Ajouter la nouvelle demande à la liste
      setFundsRequests(prev => [createdRequest, ...prev]);

      // Réinitialiser le formulaire
      setNewRequest({
        amount: 0,
        paymentMethod: 'WAVE',
        phoneNumber: ''
      });

      setShowNewRequestDialog(false);

      // Recharger les données pour avoir les statistiques à jour
      loadData();

    } catch (error) {
      console.error('❌ Erreur lors de la création de la demande:', error);
      const errorMessage = vendorFundsService.handleError(error, 'création demande');
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Obtenir l'icône et la couleur pour le statut
  const getStatusIcon = (status: FundsRequest['status']) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'PAID':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  // Obtenir la classe de couleur pour le statut
  const getStatusBadgeVariant = (status: FundsRequest['status']) => {
    switch (status) {
      case 'PENDING':
        return 'outline';
      case 'APPROVED':
        return 'secondary';
      case 'REJECTED':
        return 'destructive';
      case 'PAID':
        return 'default';
      default:
        return 'outline';
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
        return <CreditCard className="h-8 w-8 text-gray-600" />;
      default:
        return <CreditCard className="h-8 w-8 text-gray-600" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-col gap-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Appel de Fonds</h1>
            <p className="text-gray-500 mt-1">Gérez vos demandes de paiement et consultez vos gains</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle Demande
                </Button>
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
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                          title="Gérer vos numéros de téléphone"
                        >
                          Gérer mes numéros
                        </a>
                      </div>
                      {phonesLoading ? (
                        <div className="flex items-center justify-center py-2 text-sm text-gray-500">
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          Chargement des numéros...
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
                            <SelectValue placeholder="Sélectionner un numéro" />
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
                              className="text-blue-600 hover:underline font-medium"
                            >
                              Ajouter des numéros
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
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewRequestDialog(false)}
                    >
                      Annuler
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      {submitting ? 'Envoi...' : 'Envoyer'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Statistiques des gains */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-900">Gains Totaux</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  {loading ? '...' : vendorFundsService.formatCurrency(backendStatistics?.totalVendorAmount || 0)}
                </div>
                <div className="text-xs text-green-700 mt-1">
                  Ce mois: {vendorFundsService.formatCurrency(backendStatistics?.monthlyRevenue || 0)}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disponible</CardTitle>
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">
                  {/* ✅ Montant dynamique depuis /vendor/earnings (endpoint fonctionnel) */}
                  {loading ? '...' : vendorFundsService.formatCurrency(earnings?.availableAmount || 0)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Prêt pour retrait
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En attente</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-900">
                  {loading ? '...' : vendorFundsService.formatCurrency(earnings?.pendingAmount || 0)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  En cours de traitement
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commissions</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">
                  {loading ? '...' : `${((earnings?.averageCommissionRate || 0) * 100).toFixed(1)}%`}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Taux moyen: {vendorFundsService.formatCurrency(earnings?.totalCommission || 0)}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Liste des demandes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold flex items-center">
                  <History className="mr-2 h-5 w-5" />
                  Historique des Demandes
                </CardTitle>
                <CardDescription>
                  Toutes vos demandes d'appel de fonds
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => setFilters(prev => ({
                    ...prev,
                    status: value === 'all' ? undefined : value as FundsRequest['status'],
                    page: 1
                  }))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tous les statuts" />
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
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date demande</TableHead>
                    <TableHead className="hidden md:table-cell">Date validation</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fundsRequests.map((request) => (
                    <TableRow key={request.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="text-sm">
                          {vendorFundsService.formatDate(request.requestDate).split(' ').slice(0, 3).join(' ')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {vendorFundsService.formatDate(request.requestDate).split(' ').slice(3).join(' ')}
                        </div>
                      </TableCell>

                      {/* Date de validation */}
                      <TableCell className="hidden md:table-cell">
                        {request.validatedAt ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-sm text-green-700">
                              {formatDateShort(request.validatedAt)}
                            </span>
                            <span className="text-xs text-green-600">
                              Validée par admin
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(request.validatedAt).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        ) : request.processedDate && request.status === 'PAID' ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-sm text-blue-700">
                              {formatDateShort(request.processedDate)}
                            </span>
                            <span className="text-xs text-blue-600">
                              Paiement effectué
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(request.processedDate).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        ) : (
                          <div className="text-gray-400 text-xs">
                            <span>En attente</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {vendorFundsService.formatCurrency(request.amount)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getPaymentMethodIcon(request.paymentMethod)}
                          <span className="text-sm">
                            {vendorFundsService.getPaymentMethodLabel(request.paymentMethod)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusBadgeVariant(request.status)}
                          className="flex items-center space-x-1 w-fit"
                        >
                          {getStatusIcon(request.status)}
                          <span>{vendorFundsService.getStatusLabel(request.status)}</span>
                        </Badge>
                      </TableCell>
                      {request.rejectReason && (
                        <TableCell>
                          <div className="text-xs text-red-600">
                            Raison: {request.rejectReason}
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailsDialog(true);
                          }}
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <CardFooter className="border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between w-full">
                <div className="text-sm text-gray-500">
                  Page {pagination.page} sur {pagination.totalPages} ({pagination.total} demandes)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPrevious}
                    onClick={() => setFilters(prev => ({ ...prev, page: pagination.page - 1 }))}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNext}
                    onClick={() => setFilters(prev => ({ ...prev, page: pagination.page + 1 }))}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            </CardFooter>
          )}
        </Card>

        {/* Section d'aide */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center">
              <Phone className="mr-2 h-5 w-5" />
              Besoin d'aide ?
            </CardTitle>
            <CardDescription>
              Notre équipe est là pour vous aider avec vos demandes de paiement
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">
                Délai de traitement habituel: 1-3 jours ouvrés
              </p>
              <p className="mt-2 text-sm">
                <strong>Email:</strong> payments@printalma.com
              </p>
              <p className="text-sm">
                <strong>Téléphone:</strong> +221 77 123 45 67
              </p>
              <p className="text-sm">
                <strong>Horaires:</strong> Lundi-Vendredi, 9h-18h
              </p>
            </div>
            <Button variant="outline">
              Contacter le Support
            </Button>
          </CardContent>
        </Card>

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
                      <Badge
                        variant={getStatusBadgeVariant(selectedRequest.status)}
                        className="mt-1"
                      >
                        {getStatusIcon(selectedRequest.status)}
                        <span className="ml-1">{vendorFundsService.getStatusLabel(selectedRequest.status)}</span>
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Informations de paiement */}
                <Card className="p-4">
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
                      <label className="text-sm text-gray-600">Numéro de téléphone</label>
                      <p className="font-medium mt-1">{selectedRequest.phoneNumber}</p>
                    </div>
                  </div>
                </Card>

                {/* Description */}
                {selectedRequest.description && (
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-700">Description</span>
                    </div>
                    <p className="text-gray-900 leading-relaxed">
                      {selectedRequest.description}
                    </p>
                  </Card>
                )}

                {/* Statut et dates */}
                <Card className="p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Suivi de la demande</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Statut actuel :</span>
                      <Badge variant={getStatusBadgeVariant(selectedRequest.status)}>
                        {getStatusIcon(selectedRequest.status)}
                        <span className="ml-1">{vendorFundsService.getStatusLabel(selectedRequest.status)}</span>
                      </Badge>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">Date de soumission :</span>
                      <span className="text-gray-900">
                        {vendorFundsService.formatDate(selectedRequest.requestDate)}
                      </span>
                    </div>

                    {selectedRequest.validatedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date de validation :</span>
                        <span className="text-gray-900 text-green-700 font-medium">
                          {vendorFundsService.formatDate(selectedRequest.validatedAt)}
                        </span>
                      </div>
                    )}

                    {selectedRequest.approvedDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date d'approbation :</span>
                        <span className="text-gray-900">
                          {vendorFundsService.formatDate(selectedRequest.approvedDate)}
                        </span>
                      </div>
                    )}

                    {selectedRequest.processedDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date de traitement :</span>
                        <span className="text-gray-900">
                          {vendorFundsService.formatDate(selectedRequest.processedDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Note administrative si présente */}
                {selectedRequest.adminNote && (
                  <Card className="p-4 border-blue-200 bg-blue-50">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-700">Note de l'administration</span>
                    </div>
                    <p className="text-blue-900 leading-relaxed">
                      {selectedRequest.adminNote}
                    </p>
                  </Card>
                )}

                {/* Raison du rejet si rejetée */}
                {selectedRequest.status === 'REJECTED' && selectedRequest.rejectReason && (
                  <Card className="p-4 border-red-200 bg-red-50">
                    <div className="flex items-center gap-2 mb-3">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-700">Raison du rejet</span>
                    </div>
                    <p className="text-red-900 leading-relaxed">
                      {selectedRequest.rejectReason}
                    </p>
                  </Card>
                )}

                {/* Actions selon le statut */}
                {selectedRequest.status === 'PENDING' && (
                  <Card className="p-4 border-yellow-200 bg-yellow-50">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-700">Demande en cours de traitement</span>
                    </div>
                    <p className="text-yellow-800 text-sm">
                      Votre demande est en cours d'examen par notre équipe. Vous recevrez une notification une fois qu'elle sera traitée.
                    </p>
                  </Card>
                )}

                {selectedRequest.status === 'APPROVED' && (
                  <Card className="p-4 border-blue-200 bg-blue-50">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-700">Demande approuvée</span>
                    </div>
                    <p className="text-blue-800 text-sm">
                      Votre demande a été approuvée. Le paiement sera effectué sous peu sur votre compte.
                    </p>
                  </Card>
                )}

                {selectedRequest.status === 'PAID' && (
                  <Card className="p-4 border-green-200 bg-green-50">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-700">Paiement effectué</span>
                    </div>
                    <p className="text-green-800 text-sm">
                      Le paiement a été effectué avec succès sur votre compte. Vérifiez votre solde.
                    </p>
                  </Card>
                )}
              </div>
            )}

            {/* Footer du modal */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowDetailsDialog(false)}
                className="min-w-[100px]"
              >
                Fermer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default VendorFundsRequestPage;