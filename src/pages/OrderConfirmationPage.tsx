import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Mail,
  Clock,
  ExternalLink,
  ArrowLeft,
  ShoppingCart,
  Package,
  CreditCard,
  Phone,
  HelpCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { formatPrice } from '../utils/priceUtils';

interface OrderConfirmationData {
  orderId: number;
  orderNumber: string;
  totalAmount: number;
  customerEmail: string;
  paymentUrl: string;
  timestamp: number;
}

const OrderConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<OrderConfirmationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer les données de la commande depuis le localStorage
    const savedOrderData = localStorage.getItem('pendingPayment');
    if (savedOrderData) {
      try {
        const data = JSON.parse(savedOrderData);
        setOrderData(data);
      } catch (error) {
        console.error('Erreur lors de la lecture des données de commande:', error);
      }
    }
    setLoading(false);
  }, []);

  const handleOpenPayment = () => {
    if (orderData?.paymentUrl) {
      // Ouvrir le lien de paiement dans un nouvel onglet
      window.open(orderData.paymentUrl, '_blank');
    }
  };

  const handleBackToShop = () => {
    // Nettoyer le localStorage et retourner à la boutique
    localStorage.removeItem('pendingPayment');
    navigate('/');
  };

  const handleCheckStatus = () => {
    // Rediriger vers la page de statut de paiement
    if (orderData) {
      navigate('/payment-status', { state: { orderId: orderData.orderId } });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-red-200 bg-red-50">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <HelpCircle className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-red-900 mb-2">
                  Aucune commande trouvée
                </h2>
                <p className="text-red-700 mb-6">
                  Nous n'avons pas pu retrouver les informations de votre commande.
                </p>
                <Button
                  onClick={handleBackToShop}
                  className="gap-2 bg-red-600 hover:bg-red-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour à la boutique
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header avec succès */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 text-white shadow-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Commande Confirmée !</h1>
            <p className="text-emerald-100 text-lg">
              Votre commande a été enregistrée avec succès
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Carte principale de confirmation */}
          <Card className="border-2 border-emerald-200 shadow-xl overflow-hidden">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <Badge className="mb-4 bg-emerald-100 text-emerald-800 border-emerald-200 text-sm px-4 py-2">
                  Commande #{orderData.orderNumber}
                </Badge>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Merci pour votre commande !
                </h2>
                <p className="text-slate-600">
                  Un email de confirmation a été envoyé à <strong>{orderData.customerEmail}</strong>
                </p>
              </div>

              <Separator className="my-6" />

              {/* Détails de la commande */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Package className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Numéro de commande</p>
                      <p className="font-semibold text-slate-900">{orderData.orderNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Date et heure</p>
                      <p className="font-semibold text-slate-900">
                        {new Date(orderData.timestamp).toLocaleString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Montant total</p>
                      <p className="font-semibold text-slate-900 text-lg">
                        {formatPrice(orderData.totalAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Email de contact</p>
                      <p className="font-semibold text-slate-900">{orderData.customerEmail}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message important sur le paiement */}
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6 mb-8">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <Mail className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-900 mb-2">
                      Lien de paiement envoyé par email
                    </h3>
                    <p className="text-amber-800 text-sm mb-3">
                      Un lien sécurisé pour effectuer le paiement a été envoyé à votre adresse email.
                      Vous pouvez également cliquer sur le bouton ci-dessous pour accéder directement à la page de paiement.
                    </p>
                    <div className="bg-amber-100 rounded-lg p-3">
                      <p className="text-xs text-amber-700">
                        <strong>Important :</strong> Votre commande sera traitée dès que le paiement sera confirmé.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleOpenPayment}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg h-12 px-6"
                  size="lg"
                >
                  <ExternalLink className="h-5 w-5" />
                  Payer ma commande
                </Button>

                <Button
                  variant="outline"
                  onClick={handleCheckStatus}
                  className="gap-2 h-12 px-6"
                  size="lg"
                >
                  <Clock className="h-5 w-5" />
                  Vérifier le statut
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleBackToShop}
                  className="gap-2 h-12 px-6"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Continuer mes achats
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions supplémentaires */}
          <Card className="border-2 border-slate-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-slate-600" />
                Questions fréquentes
              </h3>

              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium text-slate-800 mb-1">Comment payer ma commande ?</h4>
                  <p className="text-slate-600">
                    Cliquez sur le bouton "Payer ma commande" ou utilisez le lien reçu par email pour accéder à la page de paiement sécurisée.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-slate-800 mb-1">Puis-je modifier ma commande ?</h4>
                  <p className="text-slate-600">
                    Une fois la commande confirmée, les modifications ne sont plus possibles. Contactez notre support pour toute assistance.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-slate-800 mb-1">Quand recevrai-je mes produits ?</h4>
                  <p className="text-slate-600">
                    La préparation des produits commence dès la confirmation du paiement. Le délai de livraison dépend de votre localisation.
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600 text-center">
                  Pour toute question, contactez notre support client par email à
                  <a href="mailto:support@printalma.com" className="text-emerald-600 hover:text-emerald-700 font-medium">
                    {' '}support@printalma.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;