import React, { useState, useEffect } from 'react';
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
  History
} from 'lucide-react';
import { Button } from '../components/ui/button';
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
import { 
  VendorBalance, 
  WithdrawalRequest, 
  WithdrawalRequestCreate,
  PaymentMethod,
  PAYMENT_METHODS,
  WITHDRAWAL_STATUS_LABELS,
  BankDetails,
  MobileMoneyDetails
} from '../types/funds';

const AppelDeFondsPage: React.FC = () => {
  // États principaux
  const [balance, setBalance] = useState<VendorBalance>({
    availableBalance: 250000,
    totalEarnings: 850000,
    pendingWithdrawals: 75000,
    lastUpdated: new Date()
  });
  
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([
    {
      id: 1,
      amount: 100000,
      method: 'WAVE',
      status: 'COMPLETED',
      requestedAt: new Date('2024-01-15'),
      processedAt: new Date('2024-01-16'),
      notes: 'Retrait mensuel'
    },
    {
      id: 2,
      amount: 75000,
      method: 'ORANGE_MONEY',
      status: 'PENDING',
      requestedAt: new Date('2024-01-20'),
      notes: 'Retrait urgente'
    },
    {
      id: 3,
      amount: 200000,
      method: 'BANK_TRANSFER',
      status: 'REJECTED',
      requestedAt: new Date('2024-01-10'),
      rejectedAt: new Date('2024-01-12'),
      rejectionReason: 'Informations bancaires incorrectes'
    }
  ]);

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

  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
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
    } else if (balance && amountNum > balance.availableBalance) {
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
      if (!bankDetails.bankName) {
        newErrors.bankName = 'Nom de la banque requis';
      }
      if (!bankDetails.accountNumber) {
        newErrors.accountNumber = 'Numéro de compte requis';
      }
      if (!bankDetails.accountHolder) {
        newErrors.bankAccountHolder = 'Nom du titulaire requis';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumettre la demande de retrait
  const handleSubmitWithdrawal = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    setTimeout(() => {
      const newRequest: WithdrawalRequest = {
        id: Date.now(),
        amount: parseFloat(amount),
        method: selectedMethod as PaymentMethod,
        status: 'PENDING',
        requestedAt: new Date(),
        notes: notes.trim() || undefined
      };
      
      setWithdrawalRequests(prev => [newRequest, ...prev]);
      setBalance(prev => ({
        ...prev,
        availableBalance: prev.availableBalance - parseFloat(amount),
        pendingWithdrawals: prev.pendingWithdrawals + parseFloat(amount)
      }));
      
      setIsWithdrawalDialogOpen(false);
      resetForm();
      setSubmitting(false);
    }, 2000);
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
    const request = withdrawalRequests.find(r => r.id === requestId);
    if (request && request.status === 'PENDING') {
      setWithdrawalRequests(prev => prev.filter(r => r.id !== requestId));
      setBalance(prev => ({
        ...prev,
        availableBalance: prev.availableBalance + request.amount,
        pendingWithdrawals: prev.pendingWithdrawals - request.amount
      }));
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
      case 'WAVE': return '📱';
      case 'ORANGE_MONEY': return '🍊';
      case 'BANK_TRANSFER': return '🏦';
      default: return '💳';
    }
  };

  if (loading) {
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
            disabled={!balance || balance.availableBalance <= 0}
            className="flex items-center gap-2 flex-1 sm:flex-none bg-black text-white hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Demander retrait</span>
            <span className="sm:hidden">Retrait</span>
          </Button>
        </div>
      </div>

      {/* Cards Solde - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Solde disponible */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Solde disponible
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
                className="h-6 w-6 p-0"
              >
                {showBalance ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Wallet className="h-6 w-6 text-gray-600" />
              <div>
                <div className="text-xl font-bold text-black">
                  {showBalance 
                    ? fundsService.formatCFA(balance?.availableBalance || 0)
                    : '•••••••'
                  }
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Disponible pour retrait
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gains totaux */}
        <Card className="border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Gains totaux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <ArrowUpRight className="h-6 w-6 text-gray-600" />
              <div>
                <div className="text-xl font-bold text-black">
                  {showBalance 
                    ? fundsService.formatCFA(balance?.totalEarnings || 0)
                    : '•••••••'
                  }
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Depuis le début
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Retraits en cours */}
        <Card className="border border-gray-200 sm:col-span-2 lg:col-span-1">
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
                    ? fundsService.formatCFA(balance?.pendingWithdrawals || 0)
                    : '•••••••'
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

      {/* Table des demandes de retrait */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            Historique des demandes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-600">Méthode</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-600">Montant</th>
                  <th className="text-center py-3 text-sm font-medium text-gray-600">Statut</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-600 hidden sm:table-cell">Notes</th>
                  <th className="text-center py-3 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawalRequests.map((request) => (
                  <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 text-sm text-gray-900">
                      {new Date(request.requestedAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit'
                      })}
                    </td>
                    <td className="py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getPaymentIcon(request.method)}</span>
                        <span className="text-gray-900">
                          {fundsService.getPaymentMethodInfo(request.method).name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-sm font-medium text-black text-right">
                      {fundsService.formatCFA(request.amount)}
                    </td>
                    <td className="py-3 text-center">
                      <Badge className={getStatusColor(request.status)}>
                        {WITHDRAWAL_STATUS_LABELS[request.status]}
                      </Badge>
                    </td>
                    <td className="py-3 text-sm text-gray-600 hidden sm:table-cell max-w-32 truncate">
                      {request.notes || '-'}
                    </td>
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

          {withdrawalRequests.length === 0 && (
            <div className="text-center py-8">
              <ArrowUpRight className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                Aucune demande de retrait pour le moment
              </p>
              <Button
                onClick={() => setIsWithdrawalDialogOpen(true)}
                className="bg-black text-white hover:bg-gray-800"
                disabled={!balance || balance.availableBalance <= 0}
              >
                Faire votre première demande
              </Button>
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
              {balance && (
                <p className="text-sm text-gray-500 mt-1">
                  Solde disponible: {fundsService.formatCFA(balance.availableBalance)}
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

            {/* Détails bancaires */}
            {selectedMethod === 'BANK_TRANSFER' && (
              <div className="space-y-3">
                <div>
                  <Label>Nom de la banque</Label>
                  <Input
                    placeholder="Ex: CBAO, SGBS, etc."
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                  />
                  {errors.bankName && <p className="text-red-500 text-sm mt-1">{errors.bankName}</p>}
                </div>
                <div>
                  <Label>Numéro de compte</Label>
                  <Input
                    placeholder="Numéro de compte"
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                  />
                  {errors.accountNumber && <p className="text-red-500 text-sm mt-1">{errors.accountNumber}</p>}
                </div>
                <div>
                  <Label>Nom du titulaire</Label>
                  <Input
                    placeholder="Nom complet sur le compte"
                    value={bankDetails.accountHolder}
                    onChange={(e) => setBankDetails({...bankDetails, accountHolder: e.target.value})}
                  />
                  {errors.bankAccountHolder && <p className="text-red-500 text-sm mt-1">{errors.bankAccountHolder}</p>}
                </div>
                <div>
                  <Label>IBAN (optionnel)</Label>
                  <Input
                    placeholder="SN12 1234 1234 1234 1234 1234 123"
                    value={bankDetails.iban}
                    onChange={(e) => setBankDetails({...bankDetails, iban: e.target.value})}
                  />
                  {errors.iban && <p className="text-red-500 text-sm mt-1">{errors.iban}</p>}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label>Notes (optionnel)</Label>
              <Textarea
                placeholder="Informations supplémentaires..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

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