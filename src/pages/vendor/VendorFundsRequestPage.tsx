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

const VendorFundsRequestPage: React.FC = () => {
  // États pour les données - Initialiser avec les données mock en mode développement
  const [earnings, setEarnings] = useState<VendorEarnings | null>(null);

  const [fundsRequests, setFundsRequests] = useState<FundsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);

  // Charger les données au montage
  useEffect(() => {
    loadData();
  }, [filters]);


  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Chargement des données d\'appel de fonds...');

      // Charger les gains et les demandes en parallèle
      const [earningsData, requestsData] = await Promise.all([
        vendorFundsService.getVendorEarnings(),
        vendorFundsService.getVendorFundsRequests(filters)
      ]);

      console.log('✅ Données récupérées:', { earningsData, requestsData });

      setEarnings(earningsData);
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
      const errorMessage = vendorFundsService.handleError(error, 'chargement données');
      console.warn('Message d\'erreur utilisateur:', errorMessage);
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
        return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">W</div>;
      case 'ORANGE_MONEY':
        return <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 text-sm font-bold">O</div>;
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

                  <div className="space-y-2">
                    <Label htmlFor="phone">Numéro de Téléphone</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-100 text-gray-500 text-sm">
                        +221
                      </span>
                      <Input
                        id="phone"
                        type="tel"
                        className="rounded-l-none"
                        placeholder="77 123 45 67"
                        value={newRequest.phoneNumber.replace('+221', '')}
                        onChange={(e) => setNewRequest(prev => ({
                          ...prev,
                          phoneNumber: '+221' + e.target.value.replace(/\D/g, '')
                        }))}
                        required
                      />
                    </div>
                  </div>


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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gains Totaux</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : vendorFundsService.formatCurrency(earnings?.totalEarnings || 0)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Ce mois: {vendorFundsService.formatCurrency(earnings?.thisMonthEarnings || 0)}
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
                    <TableHead>Date</TableHead>
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
                        <Button variant="ghost" size="sm">
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
      </div>
    </div>
  );
};

export default VendorFundsRequestPage;