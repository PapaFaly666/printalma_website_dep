import { useState } from 'react';
import { orderService } from '../services/orderService';
import { PAYTECH_CONFIG, NGROK_INSTRUCTIONS } from '../config/paytechConfig';

const TestPaytechPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Test de création de commande avec PayTech
  const testOrderCreation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 [Test] Création de commande test PayTech');

      const testOrderData = {
        shippingDetails: {
          firstName: 'Test',
          lastName: 'User',
          street: '123 Test Street',
          city: 'Dakar',
          region: 'Dakar',
          postalCode: '12345',
          country: 'Sénégal'
        },
        phoneNumber: '+221771234567',
        notes: 'Test order for PayTech integration',
        orderItems: [{
          productId: 1,
          quantity: 1,
          unitPrice: 5000, // Prix en FCFA
          size: 'L',
          color: 'Blanc',
          colorId: 1
        }],
        paymentMethod: 'PAYTECH' as const,
        initiatePayment: true
      };

      console.log('📦 [Test] Données de commande:', testOrderData);

      const response = await orderService.createOrderWithPayment(testOrderData);

      console.log('✅ [Test] Commande créée avec succès:', response);
      setResult(response);

      // Rediriger vers PayTech si disponible
      if (response.success && response.data.paymentData?.redirect_url) {
        setTimeout(() => {
          window.location.href = response.data.paymentData.redirect_url;
        }, 2000);
      }

    } catch (err: any) {
      console.error('❌ [Test] Erreur lors du test:', err);
      setError(err.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  // Test de validation de configuration ngrok
  const testNgrokConfig = () => {
    const config = {
      IPN_URL: PAYTECH_CONFIG.IPN_URL,
      SUCCESS_URL: PAYTECH_CONFIG.SUCCESS_URL,
      CANCEL_URL: PAYTECH_CONFIG.CANCEL_URL,
      ENV: PAYTECH_CONFIG.ENV,
      BACKEND_URL: PAYTECH_CONFIG.BACKEND_URL
    };

    console.log('🔧 [Test] Configuration PayTech:', config);
    setResult({ type: 'config', data: config });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Test d'intégration PayTech
        </h1>

        {/* Section de test */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Tests d'intégration</h2>

          <div className="space-y-4">
            <button
              onClick={testNgrokConfig}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              📋 Vérifier la configuration
            </button>

            <button
              onClick={testOrderCreation}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors disabled:opacity-50 ml-4"
            >
              {loading ? '⏳ Test en cours...' : '🛒 Tester la création de commande'}
            </button>
          </div>
        </div>

        {/* Configuration PayTech */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Configuration PayTech actuelle</h2>
          <div className="bg-gray-100 p-4 rounded font-mono text-sm">
            <p><strong>IPN URL:</strong> {PAYTECH_CONFIG.IPN_URL}</p>
            <p><strong>Success URL:</strong> {PAYTECH_CONFIG.SUCCESS_URL}</p>
            <p><strong>Cancel URL:</strong> {PAYTECH_CONFIG.CANCEL_URL}</p>
            <p><strong>Environment:</strong> {PAYTECH_CONFIG.ENV}</p>
            <p><strong>Backend URL:</strong> {PAYTECH_CONFIG.BACKEND_URL}</p>
          </div>

          {PAYTECH_CONFIG.IPN_URL.includes('your-ngrok-url') && (
            <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
              <p className="text-yellow-800">
                ⚠️ <strong>Attention:</strong> Vous devez configurer ngrok pour les URLs HTTPS.
              </p>
            </div>
          )}
        </div>

        {/* Instructions ngrok */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Instructions ngrok</h2>
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-semibold mb-2">1. Installer ngrok:</h3>
            <pre className="bg-gray-800 text-green-400 p-3 rounded mb-4 text-sm overflow-x-auto">
              {NGROK_INSTRUCTIONS.install.trim()}
            </pre>

            <h3 className="font-semibold mb-2">2. Lancer ngrok:</h3>
            <pre className="bg-gray-800 text-green-400 p-3 rounded mb-4 text-sm overflow-x-auto">
              {NGROK_INSTRUCTIONS.run.trim()}
            </pre>

            <h3 className="font-semibold mb-2">3. Tester ngrok:</h3>
            <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
              {NGROK_INSTRUCTIONS.verify.trim()}
            </pre>
          </div>
        </div>

        {/* Résultats */}
        {result && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Résultats</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {/* Erreurs */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-red-800 mb-4">Erreur</h2>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Problèmes courants */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">🚨 Problèmes courants et solutions</h2>

          <div className="space-y-4">
            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="font-semibold">Montant à 0</h3>
              <p className="text-gray-700">
                <strong>Solution:</strong> Assurez-vous que les produits ont des prix valides
                et que le calcul du totalAmount est correct.
              </p>
            </div>

            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="font-semibold">URL IPN en HTTP</h3>
              <p className="text-gray-700">
                <strong>Solution:</strong> Configurez ngrok et mettez à jour VITE_NGROK_URL
                dans votre fichier .env.local
              </p>
            </div>

            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="font-semibold">Montant inférieur à 100 XOF</h3>
              <p className="text-gray-700">
                <strong>Solution:</strong> PayTech exige un montant minimum de 100 XOF.
                Ajoutez des frais de port si nécessaire.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPaytechPage;