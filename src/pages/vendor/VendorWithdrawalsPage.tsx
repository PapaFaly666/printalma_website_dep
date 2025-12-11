import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Filter,
  Search,
  Eye,
  FileText,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  BanknoteIcon,
  Building,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Smartphone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Separator } from '../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useToast } from '../../components/ui/use-toast';
import { FundsRequestForm } from '../../components/vendor/FundsRequestForm';

// Types pour les demandes de retrait
interface WithdrawalRequest {
  id: number;
  amount: number;
  withdrawalMethod: 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'WAVE' | 'ORANGE';
  withdrawalInfo: {
    phoneNumber?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    iban?: string;
    swift?: string;
  };
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  requestedAt: string;
  processedAt?: string;
  processedBy?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  notes?: string;
  rejectionReason?: string;
  transactionId?: string;
  fees: number;
  netAmount: number;
}

interface WithdrawalStats {
  totalRequested: number;
  totalCompleted: number;
  totalPending: number;
  totalFees: number;
  averageProcessingTime: number;
  thisMonthRequests: number;
  thisMonthAmount: number;
  lastMonthRequests: number;
  lastMonthAmount: number;
}

const VendorWithdrawalsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [stats, setStats] = useState<WithdrawalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Charger les données de retrait
  useEffect(() => {
    loadWithdrawalData();
  }, []);

  const loadWithdrawalData = async () => {
    setLoading(true);
    try {
      // Appel API pour récupérer les demandes de retrait
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3004'}/vendor/withdrawals`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setWithdrawals(data.withdrawals || []);
      setStats(data.stats || null);

    } catch (error) {
      console.error('❌ Erreur lors du chargement des retraits:', error);

      // Utiliser des données mock en cas d'erreur
      const mockWithdrawals: WithdrawalRequest[] = [
        {
          id: 1,
          amount: 50000,
          withdrawalMethod: 'MOBILE_MONEY',
          withdrawalInfo: {
            phoneNumber: '+221770000001'
          },
          status: 'COMPLETED',
          requestedAt: '2024-01-15T10:30:00Z',
          processedAt: '2024-01-15T14:20:00Z',
          processedBy: {
            id: 1,
            firstName: 'Admin',
            lastName: 'System',
            email: 'admin@printalma.com'
          },
          transactionId: 'TXN-2024-001',
          fees: 500,
          netAmount: 49500
        },
        {
          id: 2,
          amount: 75000,
          withdrawalMethod: 'BANK_TRANSFER',
          withdrawalInfo: {
            bankName: 'Ecobank Sénégal',
            accountNumber: '0145789012345678',
            accountName: 'Entreprise ABC',
            iban: 'SN01 0145 7890 1234 5678 9000'
          },
          status: 'PROCESSING',
          requestedAt: '2024-01-18T09:15:00Z',
          fees: 1500,
          netAmount: 73500
        },
        {
          id: 3,
          amount: 30000,
          withdrawalMethod: 'WAVE',
          withdrawalInfo: {
            phoneNumber: '+221770000002'
          },
          status: 'PENDING',
          requestedAt: '2024-01-20T16:45:00Z',
          fees: 300,
          netAmount: 29700
        }
      ];

      const mockStats: WithdrawalStats = {
        totalRequested: 155000,
        totalCompleted: 50000,
        totalPending: 105000,
        totalFees: 2300,
        averageProcessingTime: 3.8,
        thisMonthRequests: 3,
        thisMonthAmount: 155000,
        lastMonthRequests: 2,
        lastMonthAmount: 85000
      };

      setWithdrawals(mockWithdrawals);
      setStats(mockStats);

      toast({
        title: "Mode démonstration",
        description: "Affichage des données exemples pour les retraits.",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les retraits
  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesSearch = withdrawal.id.toString().includes(searchTerm) ||
                         withdrawal.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         withdrawal.withdrawalMethod.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || withdrawal.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Obtenir le badge de statut
  const getStatusBadge = (status: WithdrawalRequest['status']) => {
    const statusConfig = {
      PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      PROCESSING: { label: 'En traitement', color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
      COMPLETED: { label: 'Complétée', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      REJECTED: { label: 'Rejetée', color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border-0 font-medium text-sm px-3 py-1`}>
        <Icon className="w-4 h-4 mr-2" />
        {config.label}
      </Badge>
    );
  };

  // Obtenir l'icône de méthode de retrait
  const getWithdrawalMethodIcon = (method: WithdrawalRequest['withdrawalMethod']) => {
    switch (method) {
      case 'MOBILE_MONEY':
        return <Smartphone className="w-4 h-4" />;
      case 'BANK_TRANSFER':
        return <Building className="w-4 h-4" />;
      case 'WAVE':
        return <Wallet className="w-4 h-4" />;
      case 'ORANGE':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  // Formater le montant
  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString('fr-SN')} F`;
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Afficher les détails d'une demande
  const viewWithdrawalDetails = (withdrawal: WithdrawalRequest) => {
    setSelectedWithdrawal(withdrawal);
    setShowDetailsModal(true);
  };

  // Télécharger le relevé
  const downloadStatement = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3004'}/vendor/withdrawals/export`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `retraits_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Succès",
        description: "Relevé de retraits téléchargé avec succès.",
      });
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le relevé.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-600">Chargement des demandes de retrait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/vendeur/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au tableau de bord
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestion des retraits
              </h1>
              <p className="text-gray-600">
                Consultez et gérez vos demandes de retrait de fonds
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadStatement}
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger le relevé
            </Button>
            <Button
              onClick={() => setShowRequestForm(true)}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Nouvelle demande de retrait
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="space-y-6">
            {/* Information importante - commandes livrées uniquement */}
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="space-y-2">
                  <p className="font-medium">
                    💰 <strong>Solde disponible basé UNIQUEMENT sur les commandes livrées</strong>
                  </p>
                  <div className="bg-blue-100 rounded p-3 space-y-1">
                    <p className="text-sm">
                      <strong>Total des commandes livrées:</strong> {formatAmount((stats as any).deliveredOrdersTotal || stats.totalRequested)} F
                    </p>
                    <p className="text-sm">
                      <strong>Nombre de commandes livrées:</strong> {(stats as any).deliveredOrdersCount || 3}
                    </p>
                    <p className="text-sm text-blue-700">
                      ⚠️ Seuls les montants des commandes avec statut "Livrée" sont pris en compte pour le retrait.
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Statistiques principales */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Solde disponible*</p>
                      <p className="text-2xl font-bold text-green-700">{formatAmount((stats as any).deliveredOrdersTotal || stats.totalRequested)}</p>
                      <p className="text-xs text-green-600 mt-1">Commandes livrées uniquement</p>
                    </div>
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total complété</p>
                      <p className="text-2xl font-bold text-green-600">{formatAmount(stats.totalCompleted)}</p>
                    </div>
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">En attente</p>
                      <p className="text-2xl font-bold text-yellow-600">{formatAmount(stats.totalPending)}</p>
                    </div>
                    <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Frais totaux</p>
                      <p className="text-2xl font-bold text-red-600">{formatAmount(stats.totalFees)}</p>
                    </div>
                    <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Résumé des commandes */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-blue-200">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-blue-600">Total commandes livrées</p>
                    <p className="text-xl font-bold text-blue-700">{(stats as any).deliveredOrdersCount || 3}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Montant moyen par commande</p>
                    <p className="text-xl font-bold text-gray-700">
                      {formatAmount(Math.round(((stats as any).deliveredOrdersTotal || stats.totalRequested) / ((stats as any).deliveredOrdersCount || 3)))}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Filtres et recherche */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher par ID, transaction ou méthode..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  Tous
                </Button>
                <Button
                  variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('PENDING')}
                >
                  En attente
                </Button>
                <Button
                  variant={statusFilter === 'PROCESSING' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('PROCESSING')}
                >
                  En traitement
                </Button>
                <Button
                  variant={statusFilter === 'COMPLETED' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('COMPLETED')}
                >
                  Complétées
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tableau des demandes de retrait */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Historique des demandes de retrait
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredWithdrawals.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune demande de retrait</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Aucune demande ne correspond à vos critères de recherche.'
                    : 'Commencez par faire votre première demande de retrait.'}
                </p>
                <Button
                  className="mt-4"
                  onClick={() => setShowRequestForm(true)}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Faire une demande de retrait
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Montant</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Méthode</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Statut</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWithdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-medium">#{withdrawal.id}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{formatAmount(withdrawal.amount)}</p>
                            <p className="text-xs text-gray-500">Net: {formatAmount(withdrawal.netAmount)}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            {getWithdrawalMethodIcon(withdrawal.withdrawalMethod)}
                            <span className="text-sm">{withdrawal.withdrawalMethod.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(withdrawal.status)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <p>{formatDate(withdrawal.requestedAt)}</p>
                            {withdrawal.processedAt && (
                              <p className="text-xs text-gray-500">Traitée: {formatDate(withdrawal.processedAt)}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewWithdrawalDetails(withdrawal)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de détails */}
        {showDetailsModal && selectedWithdrawal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Détails de la demande #{selectedWithdrawal.id}</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Informations générales */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Montant demandé</label>
                      <p className="font-semibold">{formatAmount(selectedWithdrawal.amount)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Montant net</label>
                      <p className="font-semibold">{formatAmount(selectedWithdrawal.netAmount)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Frais</label>
                      <p className="font-semibold">{formatAmount(selectedWithdrawal.fees)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Statut</label>
                      <div>{getStatusBadge(selectedWithdrawal.status)}</div>
                    </div>
                  </div>

                  <Separator />

                  {/* Méthode de retrait */}
                  <div>
                    <label className="text-sm font-medium text-gray-600">Méthode de retrait</label>
                    <div className="flex items-center space-x-2 mt-1">
                      {getWithdrawalMethodIcon(selectedWithdrawal.withdrawalMethod)}
                      <span className="font-medium">{selectedWithdrawal.withdrawalMethod.replace('_', ' ')}</span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {selectedWithdrawal.withdrawalInfo.phoneNumber && (
                        <div>
                          <label className="text-xs text-gray-500">Numéro de téléphone</label>
                          <p className="text-sm">{selectedWithdrawal.withdrawalInfo.phoneNumber}</p>
                        </div>
                      )}
                      {selectedWithdrawal.withdrawalInfo.bankName && (
                        <div>
                          <label className="text-xs text-gray-500">Banque</label>
                          <p className="text-sm">{selectedWithdrawal.withdrawalInfo.bankName}</p>
                        </div>
                      )}
                      {selectedWithdrawal.withdrawalInfo.accountNumber && (
                        <div>
                          <label className="text-xs text-gray-500">Numéro de compte</label>
                          <p className="text-sm">{selectedWithdrawal.withdrawalInfo.accountNumber}</p>
                        </div>
                      )}
                      {selectedWithdrawal.withdrawalInfo.accountName && (
                        <div>
                          <label className="text-xs text-gray-500">Nom du compte</label>
                          <p className="text-sm">{selectedWithdrawal.withdrawalInfo.accountName}</p>
                        </div>
                      )}
                      {selectedWithdrawal.withdrawalInfo.iban && (
                        <div>
                          <label className="text-xs text-gray-500">IBAN</label>
                          <p className="text-sm">{selectedWithdrawal.withdrawalInfo.iban}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Timeline */}
                  <div>
                    <label className="text-sm font-medium text-gray-600">Historique</label>
                    <div className="mt-3 space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                        <div className="text-sm">
                          <p className="font-medium">Demande créée</p>
                          <p className="text-gray-600">{formatDate(selectedWithdrawal.requestedAt)}</p>
                        </div>
                      </div>

                      {selectedWithdrawal.processedAt && (
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                          <div className="text-sm">
                            <p className="font-medium">Demande traitée</p>
                            <p className="text-gray-600">{formatDate(selectedWithdrawal.processedAt)}</p>
                            {selectedWithdrawal.processedBy && (
                              <p className="text-gray-500">
                                Par {selectedWithdrawal.processedBy.firstName} {selectedWithdrawal.processedBy.lastName}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informations de transaction */}
                  {selectedWithdrawal.transactionId && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">ID de transaction</label>
                      <p className="text-sm font-mono bg-gray-100 p-2 rounded">{selectedWithdrawal.transactionId}</p>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedWithdrawal.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Notes</label>
                      <p className="text-sm text-gray-700">{selectedWithdrawal.notes}</p>
                    </div>
                  )}

                  {/* Motif de rejet */}
                  {selectedWithdrawal.rejectionReason && (
                    <div>
                      <label className="text-sm font-medium text-red-600">Motif de rejet</label>
                      <p className="text-sm text-red-700">{selectedWithdrawal.rejectionReason}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-6">
                  <Button onClick={() => setShowDetailsModal(false)}>
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de formulaire de demande */}
        {showRequestForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Nouvelle demande de retrait</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRequestForm(false)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>

                <FundsRequestForm
                  onSuccess={() => {
                    setShowRequestForm(false);
                    loadWithdrawalData();
                    toast({
                      title: "Succès",
                      description: "Votre demande de retrait a été soumise avec succès.",
                    });
                  }}
                  onCancel={() => setShowRequestForm(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


export default VendorWithdrawalsPage;