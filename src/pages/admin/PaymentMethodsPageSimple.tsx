/**
 * Page de gestion des méthodes de paiement - Version Simplifiée
 *
 * Cette page permet à l'administrateur d'activer ou désactiver les méthodes de paiement disponibles:
 * - PayDunya (Wave, Orange Money via PayDunya)
 * - Orange Money (Direct)
 * - Paiement à la livraison
 *
 * Utilise les nouveaux endpoints API:
 * - GET /admin/payment-methods - Liste toutes les méthodes avec leur statut
 * - PATCH /admin/payment-methods/:provider/toggle - Active/Désactive une méthode
 */

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CreditCard,
  Banknote,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { PaymentConfigService } from '../../services/paymentConfigService';
import '../../styles/admin/payment-methods.css';

interface PaymentMethod {
  provider: string;
  isActive: boolean;
  mode?: string;
  label: string;
}

const PaymentMethodsPageSimple: React.FC = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Charger les méthodes de paiement au montage
  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await PaymentConfigService.getAllPaymentMethods();
      setMethods(data);
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des méthodes:', err);
      setError(err.message || 'Erreur lors du chargement des méthodes de paiement');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMethod = async (provider: string, currentStatus: boolean) => {
    // Vérifier qu'au moins une méthode reste active
    if (currentStatus) {
      const activeMethodsCount = methods.filter(m => m.isActive).length;
      if (activeMethodsCount <= 1) {
        alert('⚠️ Vous devez garder au moins une méthode de paiement active !');
        return;
      }
    }

    setToggling(provider);
    try {
      await PaymentConfigService.togglePaymentMethod(provider, !currentStatus);

      // Recharger les méthodes pour avoir l'état à jour
      await loadPaymentMethods();

      // Message de succès
      const message = !currentStatus
        ? `✅ ${getProviderLabel(provider)} activé avec succès`
        : `⚠️ ${getProviderLabel(provider)} désactivé`;

      console.log(message);
    } catch (err: any) {
      console.error('❌ Erreur lors du toggle:', err);
      alert(`❌ Erreur: ${err.message}`);
    } finally {
      setToggling(null);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'PAYDUNYA':
        return <CreditCard className="w-8 h-8" />;
      case 'ORANGE_MONEY':
        return <Smartphone className="w-8 h-8" />;
      case 'CASH_ON_DELIVERY':
        return <Banknote className="w-8 h-8" />;
      default:
        return <CreditCard className="w-8 h-8" />;
    }
  };

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case 'PAYDUNYA':
        return 'PayDunya';
      case 'ORANGE_MONEY':
        return 'Orange Money';
      case 'CASH_ON_DELIVERY':
        return 'Paiement à la livraison';
      default:
        return provider;
    }
  };

  const getProviderDescription = (provider: string) => {
    switch (provider) {
      case 'PAYDUNYA':
        return 'Paiement mobile via Wave, Orange Money, Free Money';
      case 'ORANGE_MONEY':
        return 'Paiement direct Orange Money';
      case 'CASH_ON_DELIVERY':
        return 'Paiement en espèces à la réception de la commande';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="payment-methods-container">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Chargement des méthodes de paiement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-methods-container">
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <CardTitle className="text-destructive">Erreur</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={loadPaymentMethods}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="payment-methods-container p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gestion des Méthodes de Paiement</h1>
          <p className="text-muted-foreground">
            Activez ou désactivez les méthodes de paiement disponibles pour vos clients
          </p>
        </div>

        {/* Actions */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={loadPaymentMethods}
            className="inline-flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        {/* Liste des méthodes */}
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
          {methods.map((method) => (
            <Card key={method.provider} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  {/* Informations de la méthode */}
                  <div className="flex items-center gap-4 flex-1">
                    {/* Icône */}
                    <div className={`p-3 rounded-full ${
                      method.isActive
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {getProviderIcon(method.provider)}
                    </div>

                    {/* Détails */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold">{method.label}</h3>
                        {method.mode && (
                          <Badge variant={method.mode === 'live' ? 'default' : 'secondary'}>
                            {method.mode === 'live' ? 'Production' : 'Test'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getProviderDescription(method.provider)}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex items-center gap-4">
                    {/* Statut */}
                    <div className="flex items-center gap-2">
                      {method.isActive ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-green-600">Activé</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-500">Désactivé</span>
                        </>
                      )}
                    </div>

                    {/* Switch */}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={method.isActive}
                        onChange={() => handleToggleMethod(method.provider, method.isActive)}
                        disabled={toggling === method.provider}
                      />
                      <div className={`
                        w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4
                        peer-focus:ring-primary/20 rounded-full peer
                        peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full
                        peer-checked:after:border-white after:content-[''] after:absolute
                        after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300
                        after:border after:rounded-full after:h-6 after:w-6 after:transition-all
                        peer-checked:bg-primary
                        ${toggling === method.provider ? 'opacity-50' : ''}
                      `}>
                        {toggling === method.provider && (
                          <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-white" />
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {methods.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Aucune méthode de paiement</h3>
              <p className="text-muted-foreground">
                Aucune méthode de paiement n'est configurée pour le moment.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Info Box */}
        <Card className="mt-8 border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">À propos des méthodes de paiement</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li><strong>Au moins une méthode doit rester active</strong></li>
                  <li>Les méthodes désactivées ne seront pas disponibles lors du checkout</li>
                  <li>Vous pouvez activer plusieurs méthodes simultanément</li>
                  <li>Les changements prennent effet immédiatement</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statut des méthodes actives */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Méthodes actives</p>
                <p className="text-2xl font-bold">
                  {methods.filter(m => m.isActive).length} / {methods.length}
                </p>
              </div>
              {methods.filter(m => m.isActive).length === 0 && (
                <Badge variant="destructive" className="text-sm">
                  Aucune méthode active !
                </Badge>
              )}
              {methods.filter(m => m.isActive).length === 1 && (
                <Badge variant="default" className="text-sm bg-orange-500">
                  Minimum requis
                </Badge>
              )}
              {methods.filter(m => m.isActive).length > 1 && (
                <Badge variant="default" className="text-sm bg-green-500">
                  Configuration OK
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentMethodsPageSimple;
