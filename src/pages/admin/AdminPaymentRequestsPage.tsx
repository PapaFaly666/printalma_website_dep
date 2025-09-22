import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Search,
  Filter,
  Eye,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  MoreHorizontal,
  Check,
  MessageSquare,
  Calendar,
  Download
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

import {
  adminFundsService,
  AdminFundsRequestFilters,
  AdminFundsStatistics,
  ProcessFundsRequest
} from '../../services/adminFundsService';
import { FundsRequest } from '../../services/vendorFundsService';

const AdminPaymentRequestsPage: React.FC = () => {
  // États pour les données
  const [fundsRequests, setFundsRequests] = useState<FundsRequest[]>([]);
  const [statistics, setStatistics] = useState<AdminFundsStatistics>({
    totalPendingRequests: 0,
    totalPendingAmount: 0,
    totalProcessedToday: 0,
    totalProcessedAmount: 0,
    averageProcessingTime: 0,
    requestsByStatus: { pending: 0, approved: 0, rejected: 0, paid: 0 },
    requestsByPaymentMethod: { wave: 0, orangeMoney: 0, bankTransfer: 0 }
  });

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // États pour les filtres et pagination
  const [filters, setFilters] = useState<AdminFundsRequestFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // État pour l'onglet actif
  const [activeTab, setActiveTab] = useState<string>('pending');

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    hasNext: false,
    hasPrevious: false
  });

  // États pour les actions
  const [selectedRequest, setSelectedRequest] = useState<FundsRequest | null>(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [processAction, setProcessAction] = useState<ProcessFundsRequest>({
    status: 'APPROVED',
    adminNote: ''
  });

  // Charger les données au montage
  useEffect(() => {
    loadData();
  }, [filters]);

  // Debounce pour la recherche
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm !== filters.vendorId?.toString()) {
        setFilters(prev => ({
          ...prev,
          vendorId: searchTerm ? parseInt(searchTerm) || undefined : undefined,
          page: 1
        }));
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Chargement des demandes d\'appel de fonds admin...');

      // Charger les demandes et statistiques en parallèle
      const [requestsData, statisticsData] = await Promise.all([
        adminFundsService.getAllFundsRequests(filters),
        adminFundsService.getAdminFundsStatistics()
      ]);

      console.log('✅ Données admin récupérées:', { requestsData, statisticsData });

      setFundsRequests(requestsData.requests);
      setStatistics(statisticsData);
      setPagination({
        page: requestsData.page,
        totalPages: requestsData.totalPages,
        total: requestsData.total,
        hasNext: requestsData.hasNext,
        hasPrevious: requestsData.hasPrevious
      });

    } catch (error) {
      console.error('❌ Erreur lors du chargement des données admin:', error);
      const errorMessage = adminFundsService.handleError(error, 'chargement données admin');
      console.warn('Message d\'erreur utilisateur:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Traiter une demande
  const handleProcessRequest = async () => {
    if (!selectedRequest) return;

    setProcessing(true);
    try {
      console.log('🔄 Traitement de la demande...', { selectedRequest: selectedRequest.id, processAction });

      const updatedRequest = await adminFundsService.processFundsRequest(
        selectedRequest.id,
        processAction
      );

      console.log('✅ Demande traitée:', updatedRequest);

      // Mettre à jour la liste
      if (updatedRequest && updatedRequest.id) {
        setFundsRequests(prev =>
          prev.map(req => req.id === updatedRequest.id ? updatedRequest : req)
        );
      }

      // Fermer le dialog
      setShowProcessDialog(false);
      setSelectedRequest(null);
      setProcessAction({ status: 'APPROVED', adminNote: '' });
      setIsViewOnly(false);

      // Recharger les statistiques
      loadData();

    } catch (error) {
      console.error('❌ Erreur lors du traitement de la demande:', error);
      const errorMessage = adminFundsService.handleError(error, 'traitement demande');
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setProcessing(false);
    }
  };

  // Actions rapides
  const handleQuickAction = async (request: FundsRequest, action: 'approve' | 'pay') => {
    const actionMap = {
      approve: 'APPROVED' as const,
      pay: 'PAID' as const
    };

    setProcessing(true);
    try {
      const processData: ProcessFundsRequest = {
        status: actionMap[action],
        adminNote: `Action rapide: ${action === 'approve' ? 'Approuvé' : 'Marqué comme payé'}`
      };

      const updatedRequest = await adminFundsService.processFundsRequest(request.id, processData);

      if (updatedRequest && updatedRequest.id) {
        setFundsRequests(prev =>
          prev.map(req => req.id === updatedRequest.id ? updatedRequest : req)
        );
      }

      loadData(); // Recharger pour mettre à jour les statistiques

    } catch (error) {
      console.error('❌ Erreur lors de l\'action rapide:', error);
      const errorMessage = adminFundsService.handleError(error, 'action rapide');
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setProcessing(false);
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
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
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
        return <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">W</div>;
      case 'ORANGE_MONEY':
        return <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold">O</div>;
      case 'BANK_TRANSFER':
        return <CreditCard className="h-6 w-6 text-gray-600" />;
      default:
        return <CreditCard className="h-6 w-6 text-gray-600" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-col gap-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestion des Paiements</h1>
            <p className="text-gray-500 mt-1">Traitez les demandes d'appel de fonds des vendeurs</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Chargement...' : 'Actualiser'}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exporter CSV
            </Button>
          </div>
        </div>

        {/* Statistiques - Vue d'ensemble */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setActiveTab('pending'); setFilters(prev => ({ ...prev, status: 'PENDING', page: 1 })); }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-700">À traiter</CardTitle>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4 text-yellow-600" />
                {statistics.totalPendingRequests > 0 && (
                  <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900">
                {loading ? '...' : statistics.totalPendingRequests}
              </div>
              <div className="text-xs text-gray-600 mt-1 font-medium">
                {adminFundsService.formatCurrency(statistics.totalPendingAmount)}
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setActiveTab('processed'); setFilters(prev => ({ ...prev, status: undefined, page: 1 })); }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Traitées aujourd'hui</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">
                {loading ? '...' : statistics.totalProcessedToday}
              </div>
              <div className="text-xs text-gray-600 mt-1 font-medium">
                {adminFundsService.formatCurrency(statistics.totalProcessedAmount)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Temps moyen</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                {loading ? '...' : `${statistics.averageProcessingTime.toFixed(1)}h`}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Délai de traitement
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setActiveTab('all'); setFilters(prev => ({ ...prev, status: undefined, page: 1 })); }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Total</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">
                {loading ? '...' : (
                  statistics.requestsByStatus.pending +
                  statistics.requestsByStatus.approved +
                  statistics.requestsByStatus.rejected +
                  statistics.requestsByStatus.paid
                )}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Toutes demandes
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation par onglets */}
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          let newStatus: FundsRequest['status'] | undefined;
          switch(value) {
            case 'pending': newStatus = 'PENDING'; break;
            case 'approved': newStatus = 'APPROVED'; break;
            case 'rejected': newStatus = 'REJECTED'; break;
            case 'paid': newStatus = 'PAID'; break;
            default: newStatus = undefined;
          }
          setFilters(prev => ({ ...prev, status: newStatus, page: 1 }));
        }}>
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-5">
              <TabsTrigger value="pending" className="relative">
                À traiter
                {statistics.totalPendingRequests > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                    {statistics.totalPendingRequests}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approuvées</TabsTrigger>
              <TabsTrigger value="rejected">Rejetées</TabsTrigger>
              <TabsTrigger value="paid">Payées</TabsTrigger>
              <TabsTrigger value="all">Toutes</TabsTrigger>
            </TabsList>

            {/* Filtres rapides */}
            <div className="flex gap-2 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher vendeur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select
                value={filters.paymentMethod || 'all'}
                onValueChange={(value) => setFilters(prev => ({
                  ...prev,
                  paymentMethod: value === 'all' ? undefined : value as FundsRequest['paymentMethod'],
                  page: 1
                }))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Méthode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes méthodes</SelectItem>
                  <SelectItem value="WAVE">Wave</SelectItem>
                  <SelectItem value="ORANGE_MONEY">Orange Money</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Virement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value={activeTab} className="space-y-4">
            <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    {activeTab === 'pending' && <Clock className="h-5 w-5 text-yellow-600" />}
                    {activeTab === 'approved' && <CheckCircle className="h-5 w-5 text-blue-600" />}
                    {activeTab === 'rejected' && <XCircle className="h-5 w-5 text-red-600" />}
                    {activeTab === 'paid' && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {activeTab === 'all' && <CreditCard className="h-5 w-5 text-gray-600" />}
                    {
                      activeTab === 'pending' ? 'Demandes à traiter' :
                      activeTab === 'approved' ? 'Demandes approuvées' :
                      activeTab === 'rejected' ? 'Demandes rejetées' :
                      activeTab === 'paid' ? 'Demandes payées' :
                      'Toutes les demandes'
                    }
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {loading ? 'Chargement...' : (
                      pagination.total === 0 ? 'Aucune demande' :
                      pagination.total === 1 ? '1 demande' :
                      `${pagination.total} demandes`
                    )}
                    {activeTab === 'pending' && pagination.total > 0 && (
                      <span className="text-yellow-600 font-medium"> • Action requise</span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onValueChange={(value) => {
                      const [sortBy, sortOrder] = value.split('-');
                      setFilters(prev => ({
                        ...prev,
                        sortBy,
                        sortOrder: sortOrder as 'asc' | 'desc',
                        page: 1
                      }));
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt-desc">Plus récentes</SelectItem>
                      <SelectItem value="createdAt-asc">Plus anciennes</SelectItem>
                      <SelectItem value="amount-desc">Montant ↓</SelectItem>
                      <SelectItem value="amount-asc">Montant ↑</SelectItem>
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
              <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                {activeTab === 'pending' ? (
                  <>
                    <CheckCircle className="h-16 w-16 mb-4 text-green-400" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Aucune demande en attente</h3>
                    <p className="text-sm text-center max-w-md">Toutes les demandes ont été traitées. Excellent travail !</p>
                  </>
                ) : activeTab === 'approved' ? (
                  <>
                    <Clock className="h-16 w-16 mb-4 text-blue-400" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Aucune demande approuvée</h3>
                    <p className="text-sm text-center max-w-md">Les demandes approuvées apparaîtront ici en attente de paiement.</p>
                  </>
                ) : activeTab === 'rejected' ? (
                  <>
                    <XCircle className="h-16 w-16 mb-4 text-red-400" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Aucune demande rejetée</h3>
                    <p className="text-sm text-center max-w-md">Les demandes rejetées apparaîtront ici.</p>
                  </>
                ) : activeTab === 'paid' ? (
                  <>
                    <DollarSign className="h-16 w-16 mb-4 text-green-400" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun paiement effectué</h3>
                    <p className="text-sm text-center max-w-md">Les demandes payées apparaîtront ici.</p>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-16 w-16 mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">Aucune demande</h3>
                    <p className="text-sm text-center max-w-md">Les vendeurs n'ont pas encore soumis de demandes d'appel de fonds.</p>
                  </>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="font-semibold text-gray-700">Vendeur</TableHead>
                    <TableHead className="font-semibold text-gray-700">Date de demande</TableHead>
                    <TableHead className="font-semibold text-gray-700">Montant</TableHead>
                    <TableHead className="font-semibold text-gray-700">Méthode</TableHead>
                    <TableHead className="font-semibold text-gray-700">Statut</TableHead>
                    <TableHead className="font-semibold text-gray-700">Description</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fundsRequests.map((request) => (
                    <TableRow key={request.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {request.vendor?.firstName} {request.vendor?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.vendor?.shopName || request.vendor?.email}
                          </div>
                          <div className="text-xs text-gray-400">
                            ID: {request.vendorId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {adminFundsService.formatDate(request.requestDate).split(' ').slice(0, 3).join(' ')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {adminFundsService.formatDate(request.requestDate).split(' ').slice(3).join(' ')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {adminFundsService.formatCurrency(request.amount)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getPaymentMethodIcon(request.paymentMethod)}
                          <span className="text-sm">
                            {adminFundsService.getPaymentMethodLabel(request.paymentMethod)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {request.phoneNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={getStatusBadgeVariant(request.status)}
                            className="flex items-center space-x-1 w-fit"
                          >
                            {getStatusIcon(request.status)}
                            <span>{adminFundsService.getStatusLabel(request.status)}</span>
                          </Badge>
                          {request.status === 'PENDING' && (
                            <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse" title="Action requise" />
                          )}
                        </div>
                        {request.processedDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            Traité le {adminFundsService.formatDate(request.processedDate).split(' ').slice(0, 3).join(' ')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {request.description}
                        </div>
                        {request.rejectReason && (
                          <div className="text-xs text-red-600 mt-1">
                            Raison: {request.rejectReason}
                          </div>
                        )}
                        {request.adminNote && (
                          <div className="text-xs text-blue-600 mt-1">
                            Note: {request.adminNote}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {request.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleQuickAction(request, 'approve')}
                                disabled={processing}
                                title="Approuver rapidement"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                          {/* Suppression du bouton Rejeter conformément au nouveau flux */}
                              {/* Bouton 'Traiter avec note' retiré */}
                            </>
                          )}
                          {request.status === 'APPROVED' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => handleQuickAction(request, 'pay')}
                                disabled={processing}
                                title="Marquer comme payé"
                              >
                                <DollarSign className="h-4 w-4 mr-1" />
                                Payer
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedRequest(request);
                              setProcessAction({
                                status: request.status === 'PENDING' ? 'APPROVED' : request.status,
                                adminNote: request.adminNote || ''
                              });
                              setIsViewOnly(true);
                              setShowProcessDialog(true);
                            }}
                            title="Voir détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>

            {/* Pagination améliorée */}
            {!loading && pagination.totalPages > 1 && (
              <CardContent className="border-t border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between w-full">
                  <div className="text-sm text-gray-600 font-medium">
                    {pagination.total > 0 ? (
                      <>
                        <span className="text-gray-900">{((pagination.page - 1) * filters.limit) + 1}</span>
                        {' - '}
                        <span className="text-gray-900">
                          {Math.min(pagination.page * filters.limit, pagination.total)}
                        </span>
                        {' sur '}
                        <span className="text-gray-900">{pagination.total}</span>
                        {' demandes'}
                      </>
                    ) : (
                      'Aucune demande'
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasPrevious}
                      onClick={() => setFilters(prev => ({ ...prev, page: pagination.page - 1 }))}
                    >
                      ← Précédent
                    </Button>
                    <div className="text-sm text-gray-500 px-2">
                      Page {pagination.page} / {pagination.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasNext}
                      onClick={() => setFilters(prev => ({ ...prev, page: pagination.page + 1 }))}
                    >
                      Suivant →
                    </Button>
                  </div>
                </div>
              </CardContent>
            )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de traitement redesigné */}
        <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b border-gray-100">
              <DialogTitle className="flex items-center gap-3 text-xl">
                {isViewOnly ? (
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Eye className="h-5 w-5 text-blue-600" />
                    </div>
                    <span>Détails de la demande</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-full">
                      <MessageSquare className="h-5 w-5 text-green-600" />
                    </div>
                    <span>Traiter la demande</span>
                  </div>
                )}
                <Badge variant="outline" className="ml-auto">
                  #{selectedRequest?.id}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-base mt-2" />
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-6 py-4">
                {/* En-tête de la demande */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-lg">
                          {selectedRequest.vendor?.firstName?.[0]}{selectedRequest.vendor?.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          {selectedRequest.vendor?.firstName} {selectedRequest.vendor?.lastName}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {selectedRequest.vendor?.shopName || selectedRequest.vendor?.email}
                        </p>
                        <p className="text-gray-500 text-xs">ID Vendeur: {selectedRequest.vendorId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {adminFundsService.formatCurrency(selectedRequest.amount)}
                      </div>
                      {isViewOnly && selectedRequest.status && (
                        <Badge
                          variant={getStatusBadgeVariant(selectedRequest.status)}
                          className="mt-1"
                        >
                          {getStatusIcon(selectedRequest.status)}
                          <span className="ml-1">{adminFundsService.getStatusLabel(selectedRequest.status)}</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Informations de la demande */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-700">Date de demande</span>
                    </div>
                    <p className="text-gray-900">
                      {adminFundsService.formatDate(selectedRequest.requestDate)}
                    </p>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getPaymentMethodIcon(selectedRequest.paymentMethod)}
                      <span className="font-medium text-gray-700">Méthode de paiement</span>
                    </div>
                    <p className="text-gray-900">
                      {adminFundsService.getPaymentMethodLabel(selectedRequest.paymentMethod)}
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      {selectedRequest.phoneNumber}
                    </p>
                  </Card>
                </div>

                {/* Description */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Description de la demande</span>
                  </div>
                  <p className="text-gray-900 leading-relaxed">
                    {selectedRequest.description}
                  </p>
                </Card>

                {/* Dates de traitement */}
                {(selectedRequest.processedDate || selectedRequest.approvedDate) && (
                  <Card className="p-4 bg-gray-50">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-700">Historique</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      {selectedRequest.approvedDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Approuvée le :</span>
                          <span className="text-gray-900">
                            {adminFundsService.formatDate(selectedRequest.approvedDate)}
                          </span>
                        </div>
                      )}
                      {selectedRequest.processedDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Traitée le :</span>
                          <span className="text-gray-900">
                            {adminFundsService.formatDate(selectedRequest.processedDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Sélection d'action */}
                {/* Contrôles d'édition retirés: les actions se font via boutons rapides */}

                {/* Note administrative */}
                <Card className={`p-4 ${isViewOnly ? 'bg-gray-50' : 'border-green-200 bg-green-50'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className={`h-4 w-4 ${isViewOnly ? 'text-gray-500' : 'text-green-600'}`} />
                    <Label htmlFor="adminNote" className={`font-medium ${isViewOnly ? 'text-gray-700' : 'text-green-700'}`}>
                      {isViewOnly ? 'Note administrative' : 'Ajouter une note administrative'}
                    </Label>
                  </div>
                  {isViewOnly ? (
                    <div className="p-3 bg-white rounded-lg border min-h-[80px] text-gray-700">
                      {processAction.adminNote || (
                        <span className="text-gray-500 italic">Aucune note administrative</span>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-lg border min-h-[80px] text-gray-700">
                      <span className="text-gray-500 italic">Modification désactivée. Utilisez les actions rapides Approver/Payer.</span>
                    </div>
                  )}
                </Card>

                {/* Raison du rejet (lecture seule si existant, pas d'édition) */}
                {isViewOnly && selectedRequest?.rejectReason && (
                  <Card className="p-4 border-red-200 bg-red-50">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <Label className="text-red-700 font-medium">Raison du rejet</Label>
                    </div>
                    <div className="p-4 bg-white border border-red-200 rounded-lg text-red-700 min-h-[80px]">
                      {selectedRequest.rejectReason}
                    </div>
                  </Card>
                )}

                {/* Actions du modal */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    {isViewOnly ? 'Mode lecture seule' : 'Action irréversible'}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowProcessDialog(false);
                        setIsViewOnly(false);
                      }}
                      className="min-w-[100px]"
                    >
                      {isViewOnly ? 'Fermer' : 'Annuler'}
                    </Button>
                    {/* Bouton de traitement retiré: actions via boutons rapides en liste */}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPaymentRequestsPage;