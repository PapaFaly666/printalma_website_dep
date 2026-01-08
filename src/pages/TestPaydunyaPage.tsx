import { useState } from 'react';
import { orderService } from '../services/orderService';
import { paydunyaService } from '../services/paydunyaService';
import { usePaydunya } from '../hooks/usePaydunya';
import { PAYDUNYA_CONFIG, PAYDUNYA_INSTRUCTIONS } from '../config/paydunyaConfig';
import Button from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AlertCircle, CheckCircle, Loader2, CreditCard, Smartphone, Wallet } from 'lucide-react';

const TestPaydunyaPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [configTest, setConfigTest] = useState<any>(null);

  const {
    loading: paydunyaLoading,
    error: paydunyaError,
    isConfigured,
    configurationErrors,
    testConfiguration,
    initiatePaymentAndRedirect,
    getAvailableMethods,
    calculateFees,
    getTotalWithFees,
  } = usePaydunya();

  // Test de configuration PayDunya
  const handleTestConfiguration = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🧪 [Test] Test de configuration PayDunya');

      const configValidation = paydunyaService.validateConfiguration();
      console.log('📋 [Test] Validation configuration:', configValidation);

      if (!configValidation.isValid) {
        setError(`Configuration invalide: ${configValidation.errors.join(', ')}`);
        return;
      }

      const testResult = await testConfiguration();
      console.log('✅ [Test] Configuration testée:', testResult);

      setConfigTest(testResult);

      if (!testResult.success) {
        setError(testResult.message);
      }
    } catch (err: any) {
      console.error('❌ [Test] Erreur test configuration:', err);
      setError(err.message || 'Erreur lors du test de configuration');
    } finally {
      setLoading(false);
    }
  };

  // Test de création de commande avec PayDunya
  const testOrderCreation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 [Test] Création de commande test PayDunya');

      const testOrderData = {
        shippingDetails: {
          name: 'Test User',
          street: '123 Test Street',
          city: 'Dakar',
          region: 'Dakar',
          postalCode: '12345',
          country: 'Sénégal'
        },
        phoneNumber: '+221771234567',
        notes: 'Test order for PayDunya integration',
        orderItems: [{
          productId: 1,
          quantity: 1,
          size: 'L',
          colorId: 1
        }],
        paymentMethod: 'PAYDUNYA' as const,
        initiatePayment: true
      };

      console.log('📦 [Test] Données de commande:', testOrderData);

      const response = await orderService.createOrderWithPayment(testOrderData);

      console.log('✅ [Test] Commande créée avec succès:', response);
      setResult(response);

      // Rediriger vers PayDunya si disponible
      if (response.success && response.data?.payment?.redirect_url) {
        window.location.href = response.data.payment.redirect_url;
      }
    } catch (err: any) {
      console.error('❌ [Test] Erreur création commande:', err);
      setError(err.message || 'Erreur lors de la création de la commande');
    } finally {
      setLoading(false);
    }
  };

  // Test de paiement direct avec PayDunya
  const testDirectPayment = async () => {
    try {
      console.log('🧪 [Test] Test paiement direct PayDunya');

      const paymentData = {
        invoice: {
          total_amount: 5000, // 5000 FCFA
          description: 'Test Payment #001',
          items: [
            {
              name: 'T-Shirt Test',
              quantity: 1,
              unit_price: 5000,
              total_price: 5000
            }
          ]
        },
        store: {
          name: 'Printalma Store Test',
          website_url: 'https://printalma.com',
          description: 'Test store for PayDunya integration'
        },
        customer: {
          name: 'Test Customer',
          email: 'test@printalma.com',
          phone: '+221771234567',
          address: {
            country: 'Sénégal',
            city: 'Dakar',
            address: '123 Test Street',
            postal_code: '12345'
          }
        },
        custom_data: {
          order_number: 'TEST-001',
          test_mode: true
        }
      };

      console.log('💳 [Test] Données de paiement:', paymentData);

      await initiatePaymentAndRedirect(paymentData);
    } catch (err: any) {
      console.error('❌ [Test] Erreur paiement direct:', err);
      setError(err.message || 'Erreur lors du paiement direct');
    }
  };

  const availableMethods = getAvailableMethods();
  const testAmount = 5000;
  const fees = calculateFees(testAmount, 'mobile_money');
  const totalWithFees = getTotalWithFees(testAmount, 'mobile_money');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Wallet className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Test PayDunya Integration
            </h1>
          </div>
          <p className="text-gray-600">
            Page de test pour vérifier l'intégration de PayDunya avec PrintAlma
          </p>
        </div>

        {/* Configuration Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Configuration PayDunya
            </CardTitle>
            <CardDescription>
              Vérifiez que PayDunya est correctement configuré
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${isConfigured ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {isConfigured ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-medium ${isConfigured ? 'text-green-800' : 'text-red-800'}`}>
                    {isConfigured ? '✅ PayDunya configuré' : '❌ PayDunya non configuré'}
                  </span>
                </div>

                {!isConfigured && configurationErrors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-red-700 mb-2">Erreurs de configuration:</p>
                    <ul className="list-disc list-inside text-sm text-red-600">
                      {configurationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-3 text-sm text-gray-600">
                  <p><strong>Mode:</strong> {PAYDUNYA_CONFIG.MODE}</p>
                  <p><strong>API URL:</strong> {PAYDUNYA_CONFIG.API_BASE_URL}</p>
                  <p><strong>Callback URL:</strong> {PAYDUNYA_CONFIG.CALLBACK_URL}</p>
                </div>
              </div>

              <Button
                onClick={handleTestConfiguration}
                disabled={loading || !isConfigured}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Test en cours...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Tester la configuration
                  </>
                )}
              </Button>

              {configTest && (
                <div className={`p-4 rounded-lg ${configTest.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {configTest.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`font-medium ${configTest.success ? 'text-green-800' : 'text-red-800'}`}>
                      {configTest.success ? '✅ Configuration testée avec succès' : '❌ Échec du test'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{configTest.message}</p>
                  {configTest.data && (
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(configTest.data, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Available Methods */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Méthodes de Paiement Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableMethods.map((method) => (
                <div key={method.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-2xl">{method.icon}</div>
                    <div>
                      <h4 className="font-medium">{method.name}</h4>
                      <p className="text-sm text-gray-600">{method.description}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Pays: {method.countries.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Test Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Commande avec Paiement</CardTitle>
              <CardDescription>
                Testez la création d'une commande et l'initialisation du paiement PayDunya
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={testOrderCreation}
                disabled={loading || paydunyaLoading || !isConfigured}
                className="w-full"
              >
                {(loading || paydunyaLoading) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Test en cours...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Créer Commande Test
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Paiement Direct</CardTitle>
              <CardDescription>
                Testez l'initialisation d'un paiement PayDunya direct
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={testDirectPayment}
                disabled={loading || paydunyaLoading || !isConfigured}
                className="w-full"
              >
                {paydunyaLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Initialisation...
                  </>
                ) : (
                  <>
                    <Smartphone className="h-4 w-4 mr-2" />
                    Payer 5000 FCFA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Fees Example */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Exemple de Calcul des Frais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Montant:</p>
                  <p className="font-medium">{testAmount} FCFA</p>
                </div>
                <div>
                  <p className="text-gray-600">Frais (Mobile Money):</p>
                  <p className="font-medium">{fees} FCFA</p>
                </div>
                <div>
                  <p className="text-gray-600">Total:</p>
                  <p className="font-medium">{totalWithFees} FCFA</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {(result || error || paydunyaError) && (
          <Card>
            <CardHeader>
              <CardTitle>Résultats</CardTitle>
            </CardHeader>
            <CardContent>
              {(error || paydunyaError) && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800">Erreur</span>
                  </div>
                  <p className="text-sm text-red-700">{error || paydunyaError}</p>
                </div>
              )}

              {result && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Succès</span>
                  </div>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Instructions de Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Variables d'environnement requises:</h4>
              <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
                {PAYDUNYA_INSTRUCTIONS.environment}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestPaydunyaPage;