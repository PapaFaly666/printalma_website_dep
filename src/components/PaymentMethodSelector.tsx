import React from 'react';
import { usePaydunya } from '../hooks/usePaydunya';
import { usePaytech } from '../hooks/usePaytech';
import Button from './ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertCircle, CheckCircle, CreditCard, Wallet, Smartphone, Info } from 'lucide-react';

interface PaymentMethodSelectorProps {
  amount: number;
  onPaymentMethodSelect: (method: 'paydunya' | 'paytech') => void;
  orderData?: any;
  disabled?: boolean;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  amount,
  onPaymentMethodSelect,
  orderData,
  disabled = false
}) => {
  const {
    isConfigured: paydunyaConfigured,
    configurationErrors: paydunyaErrors,
    getAvailableMethods: getPaydunyaMethods,
    calculateFees: calculatePaydunyaFees,
    getTotalWithFees: getPaydunyaTotalWithFees
  } = usePaydunya();

  const {
    getAvailableMethods: getPaytechMethods,
    calculateFees: calculatePaytechFees
  } = usePaytech();

  const paydunyaMethods = getPaydunyaMethods();
  const paytechMethods = getPaytechMethods();

  // Calcul des frais pour les deux providers
  const paydunyaMobileFees = calculatePaydunyaFees(amount, 'mobile_money');
  const paydunyaTotal = getPaydunyaTotalWithFees(amount, 'mobile_money');
  const paytechMobileFees = calculatePaytechFees(amount, 'mobile_money');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Choisissez votre méthode de paiement
        </h3>
        <p className="text-sm text-gray-600">
          Sélectionnez le fournisseur de paiement que vous préférez
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PayDunya Option */}
        <Card className={`relative transition-all duration-200 ${
          !paydunyaConfigured ? 'opacity-60' : 'hover:shadow-lg cursor-pointer'
        }`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">PayDunya</CardTitle>
                  <CardDescription className="text-xs">
                    Le plus populaire au Sénégal
                  </CardDescription>
                </div>
              </div>
              {paydunyaConfigured ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
          </CardHeader>

          <CardContent>
            {/* Configuration Status */}
            {!paydunyaConfigured && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">
                    Non configuré
                  </span>
                </div>
                {paydunyaErrors.length > 0 && (
                  <p className="text-xs text-red-700 mt-1">
                    {paydunyaErrors[0]}
                  </p>
                )}
              </div>
            )}

            {/* Methods Available */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Méthodes disponibles:</h4>
              <div className="grid grid-cols-2 gap-2">
                {paydunyaMethods.slice(0, 4).map((method) => (
                  <div key={method.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="text-lg">{method.icon}</span>
                    <span className="text-xs text-gray-700">{method.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                +{paydunyaMethods.length - 4} autres méthodes
              </p>
            </div>

            {/* Fees Display */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Montant:</span>
                <span className="font-medium">{amount} FCFA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Frais Mobile Money:</span>
                <span className="font-medium">{paydunyaMobileFees} FCFA</span>
              </div>
              <div className="flex justify-between text-sm font-medium border-t pt-2">
                <span>Total:</span>
                <span className="text-green-600">{paydunyaTotal} FCFA</span>
              </div>
            </div>

            {/* Select Button */}
            <Button
              onClick={() => onPaymentMethodSelect('paydunya')}
              disabled={disabled || !paydunyaConfigured}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {disabled ? (
                'En traitement...'
              ) : paydunyaConfigured ? (
                <>
                  <Smartphone className="h-4 w-4 mr-2" />
                  Payer avec PayDunya
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Non disponible
                </>
              )}
            </Button>

            {/* Features */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Orange Money, Wave, MTN Money</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Cartes bancaires internationales</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Wallet PayDunya</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PayTech Option */}
        <Card className="relative transition-all duration-200 hover:shadow-lg cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">PayTech</CardTitle>
                  <CardDescription className="text-xs">
                    Alternative fiable
                  </CardDescription>
                </div>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>

          <CardContent>
            {/* Methods Available */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Méthodes disponibles:</h4>
              <div className="grid grid-cols-2 gap-2">
                {paytechMethods.slice(0, 4).map((method) => (
                  <div key={method.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="text-lg">{method.icon}</span>
                    <span className="text-xs text-gray-700">{method.name}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                +{paytechMethods.length - 4} autres méthodes
              </p>
            </div>

            {/* Fees Display */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Montant:</span>
                <span className="font-medium">{amount} FCFA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Frais Mobile Money:</span>
                <span className="font-medium">{paytechMobileFees} FCFA</span>
              </div>
              <div className="flex justify-between text-sm font-medium border-t pt-2">
                <span>Total:</span>
                <span className="text-blue-600">{amount + paytechMobileFees} FCFA</span>
              </div>
            </div>

            {/* Select Button */}
            <Button
              onClick={() => onPaymentMethodSelect('paytech')}
              disabled={disabled}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {disabled ? (
                'En traitement...'
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payer avec PayTech
                </>
              )}
            </Button>

            {/* Features */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle className="h-3 w-3 text-blue-500" />
                <span>Wave, Orange Money, Free Money</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle className="h-3 w-3 text-blue-500" />
                <span>Cartes bancaires et PayPal</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle className="h-3 w-3 text-blue-500" />
                <span>Virement bancaire</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Info */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">
              Pourquoi deux fournisseurs de paiement ?
            </h4>
            <p className="text-sm text-blue-800">
              PayDunya offre une meilleure couverture au Sénégal et des frais plus compétitifs,
              tandis que PayTech reste une option fiable avec plus d'options internationales.
              Choisissez selon vos préférences et disponibilités.
            </p>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="text-center text-xs text-gray-500">
        <p>
          🔒 Tous les paiements sont sécurisés et cryptés.
          Vos informations bancaires ne sont jamais stockées.
        </p>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;