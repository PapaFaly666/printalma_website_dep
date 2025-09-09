import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Banknote,
  Smartphone,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  CreditCard,
  TrendingUp,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
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
  WITHDRAWAL_STATUS_COLORS,
  BankDetails,
  MobileMoneyDetails
} from '../types/funds';

const AppelDeFondsPage: React.FC = () => {
  // États principaux
  const [balance, setBalance] = useState<VendorBalance | null>(null);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [expandedRequest, setExpandedRequest] = useState<number | null>(null);
  
  const { user } = useAuth();

  // Charger les données initiales
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [balanceData, requestsData] = await Promise.all([
        fundsService.getMyBalance(),
        fundsService.getMyWithdrawalRequests()
      ]);
      setBalance(balanceData);
      setWithdrawalRequests(requestsData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
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
      } else if (!fundsService.validatePhoneNumber(mobileDetails.phoneNumber)) {
        newErrors.phone = 'Format de numéro invalide';
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
      if (bankDetails.iban && !fundsService.validateIBAN(bankDetails.iban)) {
        newErrors.iban = 'Format IBAN invalide';
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
      const withdrawalRequest: WithdrawalRequestCreate = {
        amount: parseFloat(amount),
        method: selectedMethod as PaymentMethod,
        notes: notes.trim() || undefined
      };
      
      if (selectedMethod === 'WAVE' || selectedMethod === 'ORANGE_MONEY') {
        withdrawalRequest.mobileDetails = {
          ...mobileDetails,
          provider: selectedMethod
        };
      } else if (selectedMethod === 'BANK_TRANSFER') {
        withdrawalRequest.bankDetails = bankDetails;
      }
      
      await fundsService.createWithdrawalRequest(withdrawalRequest);
      
      // Rafraîchir les données
      await loadData();
      
      // Fermer le dialog et reset le form
      setIsWithdrawalDialogOpen(false);
      resetForm();
      
    } catch (error: any) {
      setErrors({ submit: error.message || 'Erreur lors de la soumission' });
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
      await loadData();
    } catch (error: any) {
      console.error('Erreur lors de l\'annulation:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-lg">Chargement de vos données financières...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            💰 Appel de Fonds
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez votre solde et vos demandes de retrait
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            onClick={() => setIsWithdrawalDialogOpen(true)}
            disabled={!balance || balance.availableBalance <= 0}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Demander un retrait
          </Button>
        </div>
      </div>

      {/* Cards Solde */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Solde principal */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
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
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {showBalance 
                ? fundsService.formatCFA(balance?.availableBalance || 0)
                : '•••••••'
              }
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Disponible pour retrait
            </p>
          </CardContent>
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-bl-full flex items-start justify-end p-3">
            <Wallet className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
        </Card>

        {/* Gains totaux */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Gains totaux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {showBalance 
                ? fundsService.formatCFA(balance?.totalEarnings || 0)
                : '•••••••'
              }
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Depuis le début
            </p>
          </CardContent>
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-bl-full flex items-start justify-end p-3">
            <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </Card>

        {/* Retraits en cours */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Retraits en cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {showBalance 
                ? fundsService.formatCFA(balance?.pendingWithdrawals || 0)
                : '•••••••'
              }
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              En attente de traitement
            </p>
          </CardContent>
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-bl-full flex items-start justify-end p-3">
            <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
        </Card>
      </div>

      {/* Liste des demandes de retrait */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Historique des demandes de retrait
          </CardTitle>
          <CardDescription>
            Suivez l'état de vos demandes de retrait
          </CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawalRequests.length === 0 ? (
            <div className="text-center py-12">
              <ArrowUpRight className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Aucune demande de retrait pour le moment
              </p>
              <Button
                onClick={() => setIsWithdrawalDialogOpen(true)}
                className="mt-4"
                disabled={!balance || balance.availableBalance <= 0}
              >
                Faire votre première demande
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawalRequests.map((request) => (
                <motion.div
                  key={request.id}
                  layout
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {fundsService.getPaymentMethodInfo(request.method).icon}
                        </span>
                        <div>
                          <p className="font-medium">
                            {fundsService.formatCFA(request.amount)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {fundsService.getPaymentMethodInfo(request.method).name}
                          </p>
                        </div>
                      </div>
                      <Badge className={WITHDRAWAL_STATUS_COLORS[request.status]}>
                        {WITHDRAWAL_STATUS_LABELS[request.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(request.requestedAt).toLocaleDateString('fr-FR')}
                      </p>
                      {request.status === 'PENDING' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelRequest(request.id)}
                        >
                          Annuler
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {request.notes && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                      <strong>Notes:</strong> {request.notes}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de demande de retrait */}
      <Dialog open={isWithdrawalDialogOpen} onOpenChange={setIsWithdrawalDialogOpen}>
        <DialogContent className="max-w-md">
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

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsWithdrawalDialogOpen(false);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmitWithdrawal}
              disabled={submitting || !selectedMethod || !amount}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Soumettre la demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppelDeFondsPage;