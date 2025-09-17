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
  X,
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
    sortBy: 'requestDate',
    sortOrder: 'desc'
  });

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
      setFundsRequests(prev =>
        prev.map(req => req.id === updatedRequest.id ? updatedRequest : req)
      );

      // Fermer le dialog
      setShowProcessDialog(false);
      setSelectedRequest(null);
      setProcessAction({ status: 'APPROVED', adminNote: '' });

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
  const handleQuickAction = async (request: FundsRequest, action: 'approve' | 'reject' | 'pay') => {
    const actionMap = {
      approve: 'APPROVED' as const,
      reject: 'REJECTED' as const,
      pay: 'PAID' as const
    };

    setProcessing(true);
    try {
      const processData: ProcessFundsRequest = {
        status: actionMap[action],
        adminNote: `Action rapide: ${action === 'approve' ? 'Approuvé' : action === 'reject' ? 'Rejeté' : 'Marqué comme payé'}`
      };

      if (action === 'reject') {
        processData.rejectReason = 'Rejet via action rapide';
      }

      const updatedRequest = await adminFundsService.processFundsRequest(request.id, processData);

      setFundsRequests(prev =>
        prev.map(req => req.id === updatedRequest.id ? updatedRequest : req)
      );

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
            <h1 className="text-3xl font-bold tracking-tight">Demandes de Paiement</h1>
            <p className="text-gray-500 mt-1">Gérez les demandes d'appel de fonds des vendeurs</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En attente</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-900">
                  {loading ? '...' : statistics.totalPendingRequests}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {adminFundsService.formatCurrency(statistics.totalPendingAmount)}
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
                <CardTitle className="text-sm font-medium">Traitées aujourd'hui</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  {loading ? '...' : statistics.totalProcessedToday}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {adminFundsService.formatCurrency(statistics.totalProcessedAmount)}
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
                <CardTitle className="text-sm font-medium">Temps moyen</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">
                  {loading ? '...' : `${statistics.averageProcessingTime.toFixed(1)}h`}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Temps de traitement
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
                <CardTitle className="text-sm font-medium">Total Demandes</CardTitle>
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
                <div className="text-xs text-gray-500 mt-1">
                  Toutes les demandes
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filtres et recherche */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Filtres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="search">Recherche (ID Vendeur)</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="ID du vendeur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Statut</Label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => setFilters(prev => ({
                    ...prev,
                    status: value === 'all' ? undefined : value as FundsRequest['status'],
                    page: 1
                  }))}
                >
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label>Méthode de paiement</Label>
                <Select
                  value={filters.paymentMethod || 'all'}
                  onValueChange={(value) => setFilters(prev => ({
                    ...prev,
                    paymentMethod: value === 'all' ? undefined : value as FundsRequest['paymentMethod'],
                    page: 1
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les méthodes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les méthodes</SelectItem>
                    <SelectItem value="WAVE">Wave</SelectItem>
                    <SelectItem value="ORANGE_MONEY">Orange Money</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Virement bancaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Trier par</Label>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="requestDate-desc">Date (Plus récent)</SelectItem>
                    <SelectItem value="requestDate-asc">Date (Plus ancien)</SelectItem>
                    <SelectItem value="amount-desc">Montant (Plus élevé)</SelectItem>
                    <SelectItem value="amount-asc">Montant (Plus faible)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des demandes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">
                  Demandes d'appel de fonds
                </CardTitle>
                <CardDescription>
                  {pagination.total} demande(s) trouvée(s)
                </CardDescription>
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
                <p>Aucune demande trouvée</p>
                <p className="text-sm">Aucune demande ne correspond aux critères sélectionnés</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendeur</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fundsRequests.map((request) => (
                    <TableRow key={request.id} className="hover:bg-gray-50">
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
                        <Badge
                          variant={getStatusBadgeVariant(request.status)}
                          className="flex items-center space-x-1 w-fit"
                        >
                          {getStatusIcon(request.status)}
                          <span>{adminFundsService.getStatusLabel(request.status)}</span>
                        </Badge>
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
                        <div className="flex items-center space-x-2">
                          {request.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => handleQuickAction(request, 'approve')}
                                disabled={processing}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => handleQuickAction(request, 'reject')}
                                disabled={processing}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {request.status === 'APPROVED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 border-blue-600 hover:bg-blue-50"
                              onClick={() => handleQuickAction(request, 'pay')}
                              disabled={processing}
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setProcessAction({
                                    status: request.status === 'PENDING' ? 'APPROVED' : request.status,
                                    adminNote: request.adminNote || ''
                                  });
                                  setShowProcessDialog(true);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Voir détails
                              </DropdownMenuItem>
                              {request.status === 'PENDING' && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setProcessAction({ status: 'APPROVED', adminNote: '' });
                                    setShowProcessDialog(true);
                                  }}
                                >
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Traiter avec note
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <CardContent className="border-t border-gray-200 px-6 py-4">
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
            </CardContent>
          )}
        </Card>

        {/* Dialog de traitement */}
        <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Traiter la demande #{selectedRequest?.id}</DialogTitle>
              <DialogDescription>
                Demande de {selectedRequest?.vendor?.firstName} {selectedRequest?.vendor?.lastName} pour {adminFundsService.formatCurrency(selectedRequest?.amount || 0)}
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Montant:</strong> {adminFundsService.formatCurrency(selectedRequest.amount)}
                  </div>
                  <div>
                    <strong>Méthode:</strong> {adminFundsService.getPaymentMethodLabel(selectedRequest.paymentMethod)}
                  </div>
                  <div>
                    <strong>Téléphone:</strong> {selectedRequest.phoneNumber}
                  </div>
                  <div>
                    <strong>Date:</strong> {adminFundsService.formatDate(selectedRequest.requestDate).split(' ').slice(0, 3).join(' ')}
                  </div>
                </div>

                <div>
                  <strong className="text-sm">Description:</strong>
                  <p className="text-sm text-gray-700 mt-1">{selectedRequest.description}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Action</Label>
                  <Select
                    value={processAction.status}
                    onValueChange={(value: ProcessFundsRequest['status']) =>
                      setProcessAction(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="APPROVED">Approuver</SelectItem>
                      <SelectItem value="REJECTED">Rejeter</SelectItem>
                      <SelectItem value="PAID">Marquer comme payé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminNote">Note administrative</Label>
                  <Textarea
                    id="adminNote"
                    placeholder="Ajoutez une note pour cette action..."
                    value={processAction.adminNote}
                    onChange={(e) => setProcessAction(prev => ({
                      ...prev,
                      adminNote: e.target.value
                    }))}
                    rows={3}
                  />
                </div>

                {processAction.status === 'REJECTED' && (
                  <div className="space-y-2">
                    <Label htmlFor="rejectReason">Raison du rejet</Label>
                    <Textarea
                      id="rejectReason"
                      placeholder="Expliquez pourquoi cette demande est rejetée..."
                      value={processAction.rejectReason || ''}
                      onChange={(e) => setProcessAction(prev => ({
                        ...prev,
                        rejectReason: e.target.value
                      }))}
                      rows={2}
                      required
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowProcessDialog(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleProcessRequest}
                    disabled={processing || (processAction.status === 'REJECTED' && !processAction.rejectReason)}
                  >
                    {processing ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    {processing ? 'Traitement...' : 'Confirmer'}
                  </Button>
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