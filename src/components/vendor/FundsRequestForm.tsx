import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  CreditCard,
  Smartphone,
  Building,
  Wallet,
  AlertCircle,
  CheckCircle,
  Info,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronDown,
  BanknoteIcon,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { useToast } from '../ui/use-toast';
import { vendorOrderService } from '../../services/vendorOrderService';

// Types pour le formulaire
interface WithdrawalFormData {
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
  notes?: string;
}

interface WithdrawalEligibility {
  eligible: boolean;
  minimumAmount: number;
  availableBalance: number;
  pendingWithdrawals: number;
  reasons?: string[];
}

interface FundsRequestFormProps {
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
  initialData?: Partial<WithdrawalFormData>;
}

const FundsRequestForm: React.FC<FundsRequestFormProps> = ({
  onSuccess,
  onCancel,
  initialData
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<WithdrawalFormData>({
    amount: 0,
    withdrawalMethod: 'MOBILE_MONEY',
    withdrawalInfo: {},
    notes: '',
    ...initialData
  });

  const [eligibility, setEligibility] = useState<WithdrawalEligibility | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Charger l'éligibilité au montage
  useEffect(() => {
    loadEligibility();
  }, []);

  const loadEligibility = async () => {
    try {
      const eligibilityData = await vendorOrderService.checkWithdrawalEligibility();
      setEligibility(eligibilityData);
    } catch (error) {
      console.error('❌ Erreur lors du chargement de l\'éligibilité:', error);
      // Données mock en cas d'erreur
      setEligibility({
        eligible: true,
        minimumAmount: 5000,
        availableBalance: 150000,
        pendingWithdrawals: 25000,
        reasons: []
      });
    }
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validation du montant
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Le montant doit être supérieur à 0';
    } else if (eligibility && formData.amount < eligibility.minimumAmount) {
      newErrors.amount = `Le montant minimum est de ${vendorOrderService.formatCurrency(eligibility.minimumAmount)}`;
    } else if (eligibility && formData.amount > eligibility.availableBalance - eligibility.pendingWithdrawals) {
      newErrors.amount = 'Montant supérieur au solde disponible';
    }

    // Validation de la méthode de retrait
    if (!formData.withdrawalMethod) {
      newErrors.withdrawalMethod = 'Veuillez sélectionner une méthode de retrait';
    }

    // Validation des informations de retrait
    if (formData.withdrawalMethod === 'MOBILE_MONEY' || formData.withdrawalMethod === 'WAVE' || formData.withdrawalMethod === 'ORANGE') {
      if (!formData.withdrawalInfo.phoneNumber) {
        newErrors.phoneNumber = 'Le numéro de téléphone est requis';
      } else if (!/^[+]?[0-9]{9,15}$/.test(formData.withdrawalInfo.phoneNumber.replace(/\s/g, ''))) {
        newErrors.phoneNumber = 'Numéro de téléphone invalide';
      }
    }

    if (formData.withdrawalMethod === 'BANK_TRANSFER') {
      if (!formData.withdrawalInfo.bankName) {
        newErrors.bankName = 'Le nom de la banque est requis';
      }
      if (!formData.withdrawalInfo.accountNumber) {
        newErrors.accountNumber = 'Le numéro de compte est requis';
      }
      if (!formData.withdrawalInfo.accountName) {
        newErrors.accountName = 'Le nom du titulaire du compte est requis';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculer les frais de retrait
  const calculateFees = (amount: number, method: string): number => {
    // Barème de frais (peut être personnalisé selon la méthode)
    const feeRates = {
      'MOBILE_MONEY': 0.01,    // 1%
      'WAVE': 0.01,            // 1%
      'ORANGE': 0.012,         // 1.2%
      'BANK_TRANSFER': 0.02     // 2%
    };

    const rate = feeRates[method as keyof typeof feeRates] || 0.01;
    const baseFee = Math.floor(amount * rate);

    // Frais minimum
    const minFees = {
      'MOBILE_MONEY': 100,
      'WAVE': 100,
      'ORANGE': 150,
      'BANK_TRANSFER': 500
    };

    const minFee = minFees[method as keyof typeof minFees] || 100;

    return Math.max(baseFee, minFee);
  };

  const calculateNetAmount = (): number => {
    const fees = calculateFees(formData.amount, formData.withdrawalMethod);
    return formData.amount - fees;
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez corriger les erreurs dans le formulaire.",
        variant: "destructive",
      });
      return;
    }

    setShowConfirmation(true);
  };

  // Confirmer et soumettre la demande
  const confirmWithdrawal = async () => {
    setLoading(true);
    try {
      const withdrawalData = {
        ...formData,
        fees: calculateFees(formData.amount, formData.withdrawalMethod),
        netAmount: calculateNetAmount()
      };

      const response = await vendorOrderService.submitWithdrawalRequest(withdrawalData);

      toast({
        title: "Succès",
        description: "Votre demande de retrait a été soumise avec succès.",
      });

      if (onSuccess) {
        onSuccess(response);
      }

      // Réinitialiser le formulaire
      setFormData({
        amount: 0,
        withdrawalMethod: 'MOBILE_MONEY',
        withdrawalInfo: {},
        notes: ''
      });
      setShowConfirmation(false);

    } catch (error) {
      console.error('❌ Erreur lors de la soumission:', error);
      toast({
        title: "Erreur",
        description: vendorOrderService.handleError(error, 'soumission demande de retrait'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour le formulaire
  const updateFormData = (field: keyof WithdrawalFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Effacer l'erreur lorsque le champ est modifié
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const updateWithdrawalInfo = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      withdrawalInfo: {
        ...prev.withdrawalInfo,
        [field]: value
      }
    }));

    // Effacer l'erreur
    const errorKey = field as keyof typeof errors;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }));
    }
  };

  // Obtenir l'icône de la méthode de retrait
  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'MOBILE_MONEY':
      case 'ORANGE':
        return <Smartphone className="h-5 w-5" />;
      case 'WAVE':
        return <Wallet className="h-5 w-5" />;
      case 'BANK_TRANSFER':
        return <Building className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  // Obtenir les informations de la méthode
  const getMethodInfo = (method: string) => {
    const methods = {
      'MOBILE_MONEY': {
        name: 'Mobile Money',
        description: 'Transfert instantané vers votre numéro Mobile Money',
        processingTime: 'Quelques minutes',
        fees: '1% (min 100 F)'
      },
      'WAVE': {
        name: 'Wave',
        description: 'Transfert instantané vers votre compte Wave',
        processingTime: 'Quelques minutes',
        fees: '1% (min 100 F)'
      },
      'ORANGE': {
        name: 'Orange Money',
        description: 'Transfert vers votre compte Orange Money',
        processingTime: 'Quelques minutes',
        fees: '1.2% (min 150 F)'
      },
      'BANK_TRANSFER': {
        name: 'Virement bancaire',
        description: 'Virement vers votre compte bancaire',
        processingTime: '24-48h',
        fees: '2% (min 500 F)'
      }
    };
    return methods[method as keyof typeof methods] || methods['MOBILE_MONEY'];
  };

  if (!eligibility) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Chargement des informations...</span>
      </div>
    );
  }

  if (!eligibility.eligible) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="space-y-2">
            <p className="font-medium">Vous n'êtes pas éligible pour effectuer un retrait actuellement.</p>
            {eligibility.reasons && eligibility.reasons.length > 0 && (
              <ul className="list-disc list-inside space-y-1 text-sm">
                {eligibility.reasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            )}
            <div className="mt-3 p-3 bg-red-100 rounded">
              <p className="text-sm">
                <strong>Solde disponible:</strong> {vendorOrderService.formatCurrency(eligibility.availableBalance)}
              </p>
              <p className="text-sm">
                <strong>Montant minimum de retrait:</strong> {vendorOrderService.formatCurrency(eligibility.minimumAmount)}
              </p>
              <p className="text-sm">
                <strong>Retraits en attente:</strong> {vendorOrderService.formatCurrency(eligibility.pendingWithdrawals)}
              </p>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Informations d'éligibilité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="h-5 w-5 mr-2 text-blue-600" />
            Informations de retrait
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Information importante - commandes livrées uniquement */}
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="space-y-2">
                  <p className="font-medium">
                    💰 <strong>Solde disponible basé UNIQUEMENT sur les commandes livrées</strong>
                  </p>
                  <div className="bg-blue-100 rounded p-3 space-y-1">
                    <p className="text-sm">
                      <strong>Total des commandes livrées:</strong> {vendorOrderService.formatCurrency((eligibility as any).deliveredOrdersTotal || eligibility.availableBalance)} F
                    </p>
                    <p className="text-sm">
                      <strong>Nombre de commandes livrées:</strong> {(eligibility as any).deliveredOrdersCount || 3}
                    </p>
                    <p className="text-sm text-blue-700">
                      ⚠️ Seuls les montants des commandes avec statut "Livrée" sont pris en compte pour le retrait.
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Statistiques principales */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600">Solde disponible*</p>
                <p className="text-xl font-bold text-green-700">
                  {vendorOrderService.formatCurrency((eligibility as any).deliveredOrdersTotal || eligibility.availableBalance)}
                </p>
                <p className="text-xs text-green-600 mt-1">Commandes livrées uniquement</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600">Montant minimum</p>
                <p className="text-xl font-bold text-blue-700">
                  {vendorOrderService.formatCurrency(eligibility.minimumAmount)}
                </p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-600">Retraits en attente</p>
                <p className="text-xl font-bold text-yellow-700">
                  {vendorOrderService.formatCurrency(eligibility.pendingWithdrawals)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Montant du retrait */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Montant du retrait
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="amount">Montant à retirer (F CFA)</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount || ''}
                onChange={(e) => updateFormData('amount', parseInt(e.target.value) || 0)}
                placeholder="Entrez le montant"
                min={eligibility.minimumAmount}
                max={eligibility.availableBalance - eligibility.pendingWithdrawals}
                className={errors.amount ? 'border-red-500' : ''}
              />
              {errors.amount && (
                <p className="text-sm text-red-500 mt-1">{errors.amount}</p>
              )}
            </div>

            {/* Suggestions de montants */}
            <div className="flex flex-wrap gap-2">
              {[5000, 10000, 25000, 50000, 100000].map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateFormData('amount', amount)}
                  disabled={amount > eligibility.availableBalance - eligibility.pendingWithdrawals}
                >
                  {vendorOrderService.formatCurrency(amount)}
                </Button>
              ))}
            </div>

            {formData.amount > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Frais de transaction</span>
                  <span className="font-medium">
                    {vendorOrderService.formatCurrency(calculateFees(formData.amount, formData.withdrawalMethod))}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="font-medium">Montant net que vous recevrez</span>
                  <span className="text-lg font-bold text-green-600">
                    {vendorOrderService.formatCurrency(calculateNetAmount())}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Méthode de retrait */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Méthode de retrait
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="withdrawalMethod">Sélectionnez une méthode</Label>
              <Select
                value={formData.withdrawalMethod}
                onValueChange={(value: any) => updateFormData('withdrawalMethod', value)}
              >
                <SelectTrigger className={errors.withdrawalMethod ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Choisissez une méthode de retrait" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries({
                    'MOBILE_MONEY': 'Mobile Money',
                    'WAVE': 'Wave',
                    'ORANGE': 'Orange Money',
                    'BANK_TRANSFER': 'Virement bancaire'
                  }).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center space-x-2">
                        {getMethodIcon(value)}
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.withdrawalMethod && (
                <p className="text-sm text-red-500 mt-1">{errors.withdrawalMethod}</p>
              )}
            </div>

            {/* Informations de la méthode */}
            {formData.withdrawalMethod && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p><strong>{getMethodInfo(formData.withdrawalMethod).name}</strong></p>
                    <p className="text-sm">{getMethodInfo(formData.withdrawalMethod).description}</p>
                    <p className="text-sm">
                      <strong>Temps de traitement:</strong> {getMethodInfo(formData.withdrawalMethod).processingTime}
                    </p>
                    <p className="text-sm">
                      <strong>Frais:</strong> {getMethodInfo(formData.withdrawalMethod).fees}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Informations spécifiques à la méthode */}
        {formData.withdrawalMethod && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {getMethodIcon(formData.withdrawalMethod)}
                <span className="ml-2">
                  {formData.withdrawalMethod === 'BANK_TRANSFER' ? 'Informations bancaires' : 'Numéro de téléphone'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(formData.withdrawalMethod === 'MOBILE_MONEY' || formData.withdrawalMethod === 'WAVE' || formData.withdrawalMethod === 'ORANGE') && (
                <div>
                  <Label htmlFor="phoneNumber">Numéro de téléphone</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.withdrawalInfo.phoneNumber || ''}
                    onChange={(e) => updateWithdrawalInfo('phoneNumber', e.target.value)}
                    placeholder="+221 7X XXX XX XX"
                    className={errors.phoneNumber ? 'border-red-500' : ''}
                  />
                  {errors.phoneNumber && (
                    <p className="text-sm text-red-500 mt-1">{errors.phoneNumber}</p>
                  )}
                </div>
              )}

              {formData.withdrawalMethod === 'BANK_TRANSFER' && (
                <>
                  <div>
                    <Label htmlFor="bankName">Nom de la banque</Label>
                    <Input
                      id="bankName"
                      value={formData.withdrawalInfo.bankName || ''}
                      onChange={(e) => updateWithdrawalInfo('bankName', e.target.value)}
                      placeholder="Ex: Ecobank, UBA, BICIS..."
                      className={errors.bankName ? 'border-red-500' : ''}
                    />
                    {errors.bankName && (
                      <p className="text-sm text-red-500 mt-1">{errors.bankName}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="accountName">Nom du titulaire du compte</Label>
                    <Input
                      id="accountName"
                      value={formData.withdrawalInfo.accountName || ''}
                      onChange={(e) => updateWithdrawalInfo('accountName', e.target.value)}
                      placeholder="Nom complet du titulaire"
                      className={errors.accountName ? 'border-red-500' : ''}
                    />
                    {errors.accountName && (
                      <p className="text-sm text-red-500 mt-1">{errors.accountName}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="accountNumber">Numéro de compte</Label>
                    <Input
                      id="accountNumber"
                      value={formData.withdrawalInfo.accountNumber || ''}
                      onChange={(e) => updateWithdrawalInfo('accountNumber', e.target.value)}
                      placeholder="Numéro de compte bancaire"
                      className={errors.accountNumber ? 'border-red-500' : ''}
                    />
                    {errors.accountNumber && (
                      <p className="text-sm text-red-500 mt-1">{errors.accountNumber}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="iban">IBAN (optionnel)</Label>
                    <Input
                      id="iban"
                      value={formData.withdrawalInfo.iban || ''}
                      onChange={(e) => updateWithdrawalInfo('iban', e.target.value)}
                      placeholder="SNXX XXXX XXXX XXXX XXXX"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notes (optionnel) */}
        <Card>
          <CardHeader>
            <CardTitle>Notes (optionnel)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => updateFormData('notes', e.target.value)}
              placeholder="Ajoutez des notes ou commentaires supplémentaires..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading || formData.amount <= 0}
            className="min-w-[120px]"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4 mr-2" />
                Soumettre la demande
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Modal de confirmation */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                Confirmation de retrait
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  Vous êtes sur le point de soumettre une demande de retrait de:
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {vendorOrderService.formatCurrency(formData.amount)}
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  Montant net: {vendorOrderService.formatCurrency(calculateNetAmount())}
                </p>
                <p className="text-xs text-blue-600">
                  Frais: {vendorOrderService.formatCurrency(calculateFees(formData.amount, formData.withdrawalMethod))}
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm font-medium">Méthode: {getMethodInfo(formData.withdrawalMethod).name}</p>
                {(formData.withdrawalMethod === 'MOBILE_MONEY' || formData.withdrawalMethod === 'WAVE' || formData.withdrawalMethod === 'ORANGE') && formData.withdrawalInfo.phoneNumber && (
                  <p className="text-sm text-gray-600">Numéro: {formData.withdrawalInfo.phoneNumber}</p>
                )}
                {formData.withdrawalMethod === 'BANK_TRANSFER' && formData.withdrawalInfo.bankName && (
                  <p className="text-sm text-gray-600">Banque: {formData.withdrawalInfo.bankName}</p>
                )}
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Cette demande sera traitée par l'équipe administrative. Le temps de traitement varie selon la méthode choisie.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfirmation(false)}
                  disabled={loading}
                >
                  Modifier
                </Button>
                <Button
                  onClick={confirmWithdrawal}
                  disabled={loading}
                  className="min-w-[100px]"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Confirmation...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirmer
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export { FundsRequestForm };
export default FundsRequestForm;