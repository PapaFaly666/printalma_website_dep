import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Plus,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  History,
  DollarSign,
  CreditCard
} from 'lucide-react';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { useAuth } from '../contexts/AuthContext';
import fundsService from '../services/fundsService';
import { ordersService, Order } from '../services/ordersService';
import { toast } from 'sonner';
import {
  WithdrawalRequest,
  WithdrawalRequestCreate,
  PaymentMethod,
  PAYMENT_METHODS,
  WITHDRAWAL_STATUS_LABELS,
  BankDetails,
  MobileMoneyDetails
} from '../types/funds';

// Interface pour les statistiques du backend
interface OrderStatistics {
  totalOrders: number;
  totalAmount: number;
  statusBreakdown: Record<string, number>;
  paymentStatusBreakdown: Record<string, number>;
  averageOrderValue: number;
  recentOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  paidOrders: number;
  unpaidOrders: number;
  totalRevenue: number;
  totalCommission: number;
  totalVendorAmount: number;
  annualRevenue: number;
  monthlyRevenue: number;
  paymentMethods: Record<string, number>;
}

const AppelDeFondsPage: React.FC = () => {
  // États principaux
  const [orders, setOrders] = useState<Order[]>([]);
  const [backendStatistics, setBackendStatistics] = useState<OrderStatistics | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // États pour la demande de retrait
  const [isWithdrawalDialogOpen, setIsWithdrawalDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | ''>('');
  const [amount, setAmount] = useState('');
  const [mobileDetails, setMobileDetails] = useState<MobileMoneyDetails>({
    phoneNumber: '',
    accountHolder: '',
    provider: 'WAVE'
  });
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    iban: '',
    swiftCode: ''
  });
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // États UI
  const [showBalance, setShowBalance] = useState(true);

  const { user } = useAuth();

  // Charger les commandes et statistiques du backend
  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await ordersService.getMyOrders();
      setOrders(response.orders);

      // Récupérer les statistiques complètes depuis l'API
      // L'API retourne { success: true, data: { orders: [], statistics: {...}, vendorFinances: {...} } }
      const apiResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3004'}/orders/my-orders`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });

      if (apiResponse.ok) {
        const apiData = await apiResponse.json();

        if (apiData.success && apiData.data) {
          // Stocker statistics + vendorFinances ensemble
          setBackendStatistics({
            ...apiData.data.statistics,
            vendorFinances: apiData.data.vendorFinances
          });

          console.log('✅ Données financières chargées:', {
            totalOrders: apiData.data.statistics?.totalOrders,
            fundsRequestAvailableAmount: apiData.data.vendorFinances?.fundsRequestAvailableAmount,
            deliveredOrdersCount: apiData.data.vendorFinances?.deliveredOrdersCount,
            totalEarnings: apiData.data.vendorFinances?.totalEarnings
          });
        }
      }
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des commandes:', error);
      toast.error(error.message || 'Erreur lors du chargement des commandes');
    } finally {
      setLoadingOrders(false);
    }
  };

  // Charger les demandes de retrait depuis l'API
  const loadWithdrawalRequests = async () => {
    try {
      const requests = await fundsService.getMyWithdrawalRequests();
      setWithdrawalRequests(requests);
    } catch (error: any) {
      console.error('Erreur lors du chargement des demandes de retrait:', error);
      toast.error(error.message || 'Erreur lors du chargement des demandes');
    }
  };

  // Charger les données au montage
  useEffect(() => {
    loadOrders();
    loadWithdrawalRequests();
  }, []);

  // Calculer les statistiques basées sur le backend et les retraits
  const statistics = useMemo(() => {
    // ✅ Utiliser vendorFinances depuis le backend comme source unique de vérité
    const vendorFinances = (backendStatistics as any)?.vendorFinances;

    if (vendorFinances) {
      // 🎯 fundsRequestAvailableAmount = montant RÉEL disponible pour appel de fonds
      // Ce montant inclut déjà:
      // - Les gains des commandes DELIVERED uniquement
      // - Moins les retraits effectués (COMPLETED)
      // - Moins les retraits en attente (PENDING)
      const availableBalance = vendorFinances.fundsRequestAvailableAmount || 0;

      console.log('📊 Vendor Finances reçues du backend:', {
        totalEarnings: vendorFinances.totalEarnings,
        deliveredVendorAmount: vendorFinances.deliveredVendorAmount,
        fundsRequestAvailableAmount: vendorFinances.fundsRequestAvailableAmount,
        withdrawnAmount: vendorFinances.withdrawnAmount,
        pendingWithdrawalAmount: vendorFinances.pendingWithdrawalAmount,
        deliveredOrdersCount: vendorFinances.deliveredOrdersCount
      });

      // Utiliser les données du backend directement
      return {
        totalEarnings: vendorFinances.totalEarnings || vendorFinances.totalVendorAmount || 0,
        deliveredEarnings: vendorFinances.deliveredVendorAmount || 0,
        totalRevenue: backendStatistics?.totalRevenue || 0,
        availableBalance: availableBalance, // ✅ Source unique: fundsRequestAvailableAmount
        pendingWithdrawals: vendorFinances.pendingWithdrawalAmount || 0,
        completedWithdrawals: vendorFinances.withdrawnAmount || 0,
        pendingEarnings: vendorFinances.pendingOrdersAmount || 0,
        monthlyRevenue: backendStatistics?.monthlyRevenue || 0,
        annualRevenue: backendStatistics?.annualRevenue || 0,
        deliveredOrdersCount: vendorFinances.deliveredOrdersCount || 0,
        totalProductRevenue: vendorFinances.totalProductRevenue || 0,
        totalDesignRevenue: vendorFinances.totalDesignRevenue || 0,
        totalCommissionDeducted: vendorFinances.totalCommissionDeducted || 0,
        message: vendorFinances.message || ''
      };
    }

    // Fallback : calculer manuellement si vendorFinances n'est pas disponible
    console.warn('⚠️ vendorFinances non disponible, calcul manuel des statistiques');
    const totalEarnings = backendStatistics?.totalVendorAmount || 0;
    const totalRevenue = backendStatistics?.totalRevenue || 0;

    // 🆕 Calculer les gains livrés (seulement les commandes DELIVERED)
    const deliveredEarnings = orders
      .filter(o => o.status === 'DELIVERED' && o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + (o.commission_info?.vendor_amount || 0), 0);

    const pendingWithdrawals = withdrawalRequests
      .filter(req => req.status === 'PENDING')
      .reduce((sum, req) => sum + req.amount, 0);

    const completedWithdrawals = withdrawalRequests
      .filter(req => req.status === 'COMPLETED')
      .reduce((sum, req) => sum + req.amount, 0);

    // 🆕 Le montant disponible = Gains livrés - Retraits effectués - Retraits en cours
    const availableBalance = Math.max(0, deliveredEarnings - completedWithdrawals - pendingWithdrawals);

    // 🆕 Gains en attente de livraison
    const pendingEarnings = totalEarnings - deliveredEarnings;

    return {
      totalEarnings,           // Tous les gains (commandes payées)
      deliveredEarnings,       // Gains des commandes livrées
      totalRevenue,
      availableBalance,        // Disponible pour retrait
      pendingWithdrawals,      // Retraits en cours
      completedWithdrawals,    // Retraits effectués
      pendingEarnings,         // Gains en attente de livraison
      monthlyRevenue: backendStatistics?.monthlyRevenue || 0,
      annualRevenue: backendStatistics?.annualRevenue || 0,
      deliveredOrdersCount: orders.filter(o => o.status === 'DELIVERED').length,
      totalProductRevenue: 0,
      totalDesignRevenue: 0,
      message: ''
    };
  }, [backendStatistics, withdrawalRequests, orders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    await loadWithdrawalRequests();
    setTimeout(() => setRefreshing(false), 500);
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedMethod) {
      newErrors.method = 'Veuillez sélectionner une méthode de paiement';
    }

    const amountNum = parseFloat(amount);
    if (!amount || amountNum <= 0) {
      newErrors.amount = 'Veuillez saisir un montant valide';
    } else if (statistics.availableBalance && amountNum > statistics.availableBalance) {
      newErrors.amount = 'Montant supérieur au solde disponible';
    }

    if (selectedMethod === 'WAVE' || selectedMethod === 'ORANGE_MONEY') {
      if (!mobileDetails.phoneNumber) {
        newErrors.phone = 'Numéro de téléphone requis';
      }
      if (!mobileDetails.accountHolder) {
        newErrors.accountHolder = 'Nom du titulaire requis';
      }
    }

    if (selectedMethod === 'BANK_TRANSFER') {
      const ibanClean = (bankDetails.iban || '').replace(/\s+/g, '').toUpperCase();
      const ibanRegex = /^[A-Z]{2}[0-9A-Z]{13,32}$/; // IBAN générique
      if (!ibanClean || !ibanRegex.test(ibanClean)) {
        newErrors.iban = 'IBAN invalide';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumettre la demande de retrait
  const handleSubmitWithdrawal = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const newRequest: WithdrawalRequestCreate = {
        amount: parseFloat(amount),
        method: selectedMethod as PaymentMethod,
        notes: notes.trim() || undefined
      };

      if (selectedMethod === 'WAVE' || selectedMethod === 'ORANGE_MONEY') {
        newRequest.mobileDetails = mobileDetails;
      }

      if (selectedMethod === 'BANK_TRANSFER') {
        newRequest.bankDetails = bankDetails;
      }

      const createdRequest = await fundsService.createWithdrawalRequest(newRequest);
      setWithdrawalRequests(prev => [createdRequest, ...prev]);

      setIsWithdrawalDialogOpen(false);
      resetForm();
      toast.success('Demande de retrait soumise avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la soumission:', error);
      toast.error(error.message || 'Erreur lors de la soumission de la demande');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedMethod('');
    setAmount('');
    setMobileDetails({ phoneNumber: '', accountHolder: '', provider: 'WAVE' });
    setBankDetails({ bankName: '', accountNumber: '', accountHolder: '', iban: '', swiftCode: '' });
    setNotes('');
    setErrors({});
  };

  const handleCancelRequest = async (requestId: number) => {
    try {
      await fundsService.cancelWithdrawalRequest(requestId);
      setWithdrawalRequests(prev => prev.filter(r => r.id !== requestId));
      toast.success('Demande de retrait annulée');
    } catch (error: any) {
      console.error('Erreur lors de l\'annulation:', error);
      toast.error(error.message || 'Erreur lors de l\'annulation de la demande');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      case 'PENDING': return 'bg-gray-200 text-gray-900';
      case 'REJECTED': return 'bg-gray-300 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'WAVE':
        return <img src="https://goamobile.com/logosent/wave@2x1@-P-2021-06-30_00-18-27wave_logo_2.png" alt="Wave" className="h-5 w-5 object-contain" />;
      case 'ORANGE_MONEY':
        return <img src="https://orobi.sn/wp-content/uploads/2022/03/Orange-Money-logo.png" alt="Orange Money" className="h-5 w-5 object-contain" />;
      case 'BANK_TRANSFER': return '🏦';
      default: return '💳';
    }
  };

  if (loadingOrders) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-lg">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-black">
            Appel de Fonds
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Gérez votre solde et vos demandes de retrait
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 flex-1 sm:flex-none"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
          <Button
            onClick={() => setIsWithdrawalDialogOpen(true)}
            disabled={statistics.availableBalance <= 0}
            className="flex items-center gap-2 flex-1 sm:flex-none bg-black text-white hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Demander retrait</span>
            <span className="sm:hidden">Retrait</span>
          </Button>
        </div>
      </div>

      {/* Message informatif du backend */}
      {statistics.message && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            {statistics.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Message informatif si pas de message backend */}
      {!statistics.message && statistics.pendingEarnings > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Information importante :</strong> Vous avez {fundsService.formatCFA(statistics.pendingEarnings)} de gains en attente de livraison.
            Ces montants seront disponibles pour retrait une fois les commandes livrées.
          </AlertDescription>
        </Alert>
      )}

      {/* Avertissement si solde insuffisant pour retrait (min 5 000 F) */}
      {statistics.availableBalance < 5000 && statistics.availableBalance > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-900">
            <strong>⚠️ Montant minimum de retrait : 5 000 F CFA</strong>
            <br />
            Vous avez {fundsService.formatCFA(statistics.availableBalance)} disponible.
            Il vous manque {fundsService.formatCFA(5000 - statistics.availableBalance)} pour pouvoir effectuer un retrait.
          </AlertDescription>
        </Alert>
      )}

      {/* Message si aucune commande livrée */}
      {statistics.availableBalance === 0 && statistics.deliveredOrdersCount === 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900">
            <strong>Aucune commande livrée</strong>
            <br />
            Vous devez avoir au moins une commande livrée pour demander un retrait.
            {statistics.pendingEarnings > 0 && (
              <span> Vous avez {fundsService.formatCFA(statistics.pendingEarnings)} en attente de livraison.</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Message de succès si montant suffisant */}
      {statistics.availableBalance >= 5000 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <strong>✅ Vous pouvez demander un retrait !</strong>
            <br />
            Montant disponible : {fundsService.formatCFA(statistics.availableBalance)}
            {statistics.deliveredOrdersCount > 0 && (
              <span> ({statistics.deliveredOrdersCount} commande{statistics.deliveredOrdersCount > 1 ? 's' : ''} livrée{statistics.deliveredOrdersCount > 1 ? 's' : ''})</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Cards Solde - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Solde disponible - Montant réel pour appel de fonds */}
        <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Disponible
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
                className="h-6 w-6 p-0 hover:bg-blue-200"
              >
                {showBalance ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-7 w-7 text-blue-600" />
                <div>
                  <div className="text-3xl font-bold text-blue-900">
                    {showBalance
                      ? fundsService.formatCFA(statistics.availableBalance)
                      : '••••••'
                    }
                  </div>
                  <p className="text-xs text-blue-700 mt-1 font-medium">
                    Prêt pour retrait
                  </p>
                </div>
              </div>
              {statistics.deliveredOrdersCount > 0 && showBalance && (
                <p className="text-xs text-blue-600 bg-blue-200 rounded px-2 py-1 inline-block">
                  {statistics.deliveredOrdersCount} commande{statistics.deliveredOrdersCount > 1 ? 's' : ''} livrée{statistics.deliveredOrdersCount > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gains totaux */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">
              Gains Totaux
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {showBalance
                ? fundsService.formatCFA(statistics.totalEarnings)
                : '••••••'
              }
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Toutes commandes payées
            </p>
          </CardContent>
        </Card>

        {/* En attente de livraison */}
        <Card className="border border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-900">
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-900">
                  {showBalance
                    ? fundsService.formatCFA(statistics.pendingEarnings)
                    : '••••••'
                  }
                </div>
                <p className="text-xs text-orange-700 mt-1">
                  En attente de livraison
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Retraits en cours */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Retraits en cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-gray-600" />
              <div>
                <div className="text-xl font-bold text-black">
                  {showBalance
                    ? fundsService.formatCFA(statistics.pendingWithdrawals)
                    : '••••••'
                  }
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  En attente de traitement
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🆕 Détails par source de revenus */}
      {(statistics.totalProductRevenue > 0 || statistics.totalDesignRevenue > 0) && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5" />
              Détails des Revenus Livrés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="text-gray-700 font-medium block">Produits vendus</span>
                    <span className="text-xs text-gray-500">Commandes de produits livrées</span>
                  </div>
                </div>
                <span className="font-bold text-xl text-blue-900">
                  {fundsService.formatCFA(statistics.totalProductRevenue)}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <ArrowUpRight className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="text-gray-700 font-medium block">Designs vendus</span>
                    <span className="text-xs text-gray-500">Ventes de vos designs</span>
                  </div>
                </div>
                <span className="font-bold text-xl text-purple-900">
                  {fundsService.formatCFA(statistics.totalDesignRevenue)}
                </span>
              </div>

              <hr className="my-2" />

              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border-2 border-green-300">
                <span className="text-gray-900 font-semibold text-lg">Total livré</span>
                <span className="font-bold text-2xl text-green-700">
                  {fundsService.formatCFA(statistics.deliveredEarnings)}
                </span>
              </div>

              <p className="text-xs text-gray-500 text-center">
                {statistics.deliveredOrdersCount} commande{statistics.deliveredOrdersCount > 1 ? 's' : ''} livrée{statistics.deliveredOrdersCount > 1 ? 's' : ''}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table des demandes de retrait */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            Historique des demandes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {withdrawalRequests.length === 0 ? (
            <div className="text-center py-8">
              <ArrowUpRight className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                Aucune demande de retrait pour le moment
              </p>
              <Button
                onClick={() => setIsWithdrawalDialogOpen(true)}
                className="bg-black text-white hover:bg-gray-800"
                disabled={statistics.availableBalance <= 0}
              >
                Faire votre première demande
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 text-sm font-medium text-gray-600">Date demande</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-600 hidden md:table-cell">Date validation</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-600">Méthode</th>
                    <th className="text-right py-3 text-sm font-medium text-gray-600">Montant</th>
                    <th className="text-center py-3 text-sm font-medium text-gray-600">Statut</th>
                    <th className="text-left py-3 text-sm font-medium text-gray-600 hidden lg:table-cell">Notes</th>
                    <th className="text-center py-3 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalRequests.map((request) => (
                    <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                      {/* Date de demande */}
                      <td className="py-3 text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {new Date(request.requestedAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit'
                            })}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(request.requestedAt).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Date de validation */}
                      <td className="py-3 text-sm text-gray-900 hidden md:table-cell">
                        {request.validatedAt ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-green-700">
                              {new Date(request.validatedAt).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit'
                              })}
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
                        ) : request.processedAt && request.status === 'COMPLETED' ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-blue-700">
                              {new Date(request.processedAt).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit'
                              })}
                            </span>
                            <span className="text-xs text-blue-600">
                              Paiement effectué
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(request.processedAt).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        ) : request.rejectedAt ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-red-700">
                              {new Date(request.rejectedAt).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: '2-digit'
                              })}
                            </span>
                            <span className="text-xs text-red-600">Rejetée</span>
                          </div>
                        ) : (
                          <div className="text-gray-400 text-xs">
                            <span>En attente</span>
                          </div>
                        )}
                      </td>

                      {/* Méthode */}
                      <td className="py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getPaymentIcon(request.method)}</span>
                          <span className="text-gray-900">
                            {fundsService.getPaymentMethodInfo(request.method).name}
                          </span>
                        </div>
                      </td>

                      {/* Montant */}
                      <td className="py-3 text-sm font-medium text-black text-right">
                        {fundsService.formatCFA(request.amount)}
                      </td>

                      {/* Statut */}
                      <td className="py-3 text-center">
                        <Badge className={getStatusColor(request.status)}>
                          {WITHDRAWAL_STATUS_LABELS[request.status]}
                        </Badge>
                      </td>

                      {/* Notes */}
                      <td className="py-3 text-sm text-gray-600 hidden lg:table-cell max-w-32 truncate">
                        {request.notes || '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 text-center">
                        {request.status === 'PENDING' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelRequest(request.id)}
                            className="text-xs px-2 py-1"
                          >
                            Annuler
                          </Button>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de demande de retrait */}
      <Dialog open={isWithdrawalDialogOpen} onOpenChange={setIsWithdrawalDialogOpen}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Nouvelle demande de retrait</DialogTitle>
            <DialogDescription>
              Choisissez votre méthode de paiement et entrez les détails
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Méthode de paiement */}
            <div>
              <Label>Méthode de paiement</Label>
              <Select value={selectedMethod} onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une méthode" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      <div className="flex items-center gap-2">
                        <span>{method.icon}</span>
                        <span>{method.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.method && <p className="text-red-500 text-sm mt-1">{errors.method}</p>}
            </div>

            {/* Montant */}
            <div>
              <Label>Montant à retirer</Label>
              <Input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
              <p className="text-sm text-gray-500 mt-1">
                Solde disponible: {fundsService.formatCFA(statistics.availableBalance)}
              </p>
              {statistics.pendingEarnings > 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  {fundsService.formatCFA(statistics.pendingEarnings)} en attente de livraison
                </p>
              )}
            </div>

            {/* Détails mobile money */}
            {(selectedMethod === 'WAVE' || selectedMethod === 'ORANGE_MONEY') && (
              <div className="space-y-3">
                <div>
                  <Label>Numéro de téléphone</Label>
                  <Input
                    placeholder="+221 77 123 45 67"
                    value={mobileDetails.phoneNumber}
                    onChange={(e) => setMobileDetails({...mobileDetails, phoneNumber: e.target.value})}
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <Label>Nom du titulaire</Label>
                  <Input
                    placeholder="Nom complet"
                    value={mobileDetails.accountHolder}
                    onChange={(e) => setMobileDetails({...mobileDetails, accountHolder: e.target.value})}
                  />
                  {errors.accountHolder && <p className="text-red-500 text-sm mt-1">{errors.accountHolder}</p>}
                </div>
              </div>
            )}

            {/* Détails bancaires (IBAN requis, pas de téléphone) */}
            {selectedMethod === 'BANK_TRANSFER' && (
              <div className="space-y-3">
                <div>
                  <Label>IBAN</Label>
                  <Input
                    placeholder="SN08 0000 0000 0000 0000 0000"
                    value={bankDetails.iban}
                    onChange={(e) => setBankDetails({...bankDetails, iban: e.target.value})}
                  />
                  {errors.iban && <p className="text-red-500 text-sm mt-1">{errors.iban}</p>}
                </div>
              </div>
            )}

            {errors.submit && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.submit}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsWithdrawalDialogOpen(false);
                resetForm();
              }}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmitWithdrawal}
              disabled={submitting || !selectedMethod || !amount}
              className="w-full sm:w-auto bg-black text-white hover:bg-gray-800"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {submitting ? 'Envoi...' : 'Soumettre'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppelDeFondsPage;