import React, { useState } from 'react';
import { apiClient, testPayDunyaEndpoint, testInterceptor, testCORS } from '../lib/api';
import { paydunyaService } from '../services/paydunyaService';

const TestPaydunyaFixPage: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addTestResult = (testName: string, success: boolean, message: string, details?: any) => {
    setTestResults(prev => [...prev, {
      testName,
      success,
      message,
      details,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    // Test 1: Vérifier la configuration de l'intercepteur
    console.log('🧪 Test 1: Intercepteur API');
    const interceptorTest = testInterceptor();
    addTestResult(
      'Intercepteur API',
      interceptorTest,
      interceptorTest ? '✅ Intercepteur configuré correctement' : '❌ Intercepteur mal configuré',
      { publicEndpoints: ['/paydunya/payment', '/paydunya/status/', '/paydunya/test-config'] }
    );

    // Test 2: Test de configuration PayDunya via le service
    console.log('🧪 Test 2: Configuration PayDunya');
    try {
      const configTest = await paydunyaService.testConfiguration();
      addTestResult(
        'Configuration PayDunya',
        configTest.success,
        configTest.success ? '✅ Configuration PayDunya valide' : `❌ ${configTest.message}`,
        configTest.data
      );
    } catch (error: any) {
      addTestResult(
        'Configuration PayDunya',
        false,
        `❌ Erreur: ${error.message}`,
        error
      );
    }

    // Test 3: Test de connexion direct au backend
    console.log('🧪 Test 3: Connexion backend PayDunya');
    try {
      const backendTest = await testPayDunyaEndpoint();
      addTestResult(
        'Connexion Backend',
        backendTest,
        backendTest ? '✅ Backend PayDunya accessible' : '❌ Backend inaccessible',
        { url: 'http://localhost:3004/paydunya/test-config' }
      );
    } catch (error: any) {
      addTestResult(
        'Connexion Backend',
        false,
        `❌ Erreur: ${error.message}`,
        error
      );
    }

    // Test 4: Test CORS
    console.log('🧪 Test 4: Configuration CORS');
    try {
      const corsTest = await testCORS();
      addTestResult(
        'Configuration CORS',
        corsTest,
        corsTest ? '✅ CORS configuré' : '❌ Erreur CORS',
        { origin: 'http://localhost:5174' }
      );
    } catch (error: any) {
      addTestResult(
        'Configuration CORS',
        false,
        `❌ Erreur CORS: ${error.message}`,
        error
      );
    }

    // Test 5: Test d'appel API direct via apiClient
    console.log('🧪 Test 5: Appel API via apiClient');
    try {
      const response = await apiClient.get('/paydunya/test-config');
      addTestResult(
        'Appel API Direct',
        true,
        '✅ Appel API réussi sans authentification',
        {
          status: response.status,
          data: response.data,
          hasAuth: !!response.config.headers?.Authorization
        }
      );
    } catch (error: any) {
      addTestResult(
        'Appel API Direct',
        false,
        `❌ Erreur API: ${error.response?.data?.message || error.message}`,
        {
          status: error.response?.status,
          data: error.response?.data
        }
      );
    }

    setIsLoading(false);
  };

  const testPaymentInitialization = async () => {
    setIsLoading(true);
    console.log('🧪 Test: Initialisation de paiement');

    try {
      const paymentRequest = {
        invoice: {
          total_amount: 1000,
          description: 'Test de paiement',
          customer: {
            name: 'Test User',
            email: 'test@example.com',
            phone: '771234567'
          }
        },
        store: {
          name: 'Printalma Test Store',
          tagline: 'Test Store'
        }
      };

      const response = await apiClient.post('/paydunya/payment', paymentRequest);

      addTestResult(
        'Initialisation Paiement',
        response.data.success,
        response.data.success ? '✅ Paiement initialisé avec succès' : `❌ ${response.data.message}`,
        response.data
      );
    } catch (error: any) {
      addTestResult(
        'Initialisation Paiement',
        false,
        `❌ Erreur: ${error.response?.data?.message || error.message}`,
        {
          status: error.response?.status,
          data: error.response?.data,
          hasAuth: !!error.config?.headers?.Authorization
        }
      );
    }

    setIsLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🧪 Test de Correction PayDunya
          </h1>
          <p className="text-gray-600 mb-4">
            Page de test pour vérifier que la correction du problème "UNAUTHORIZED" fonctionne correctement.
          </p>

          <div className="flex gap-4 mb-6">
            <button
              onClick={runAllTests}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? '⏳ Tests en cours...' : '🚀 Lancer tous les tests'}
            </button>

            <button
              onClick={testPaymentInitialization}
              disabled={isLoading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? '⏳ Test en cours...' : '💳 Tester paiement'}
            </button>

            <button
              onClick={clearResults}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              🗑️ Effacer résultats
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Instructions de test:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Cliquez sur "Lancer tous les tests" pour vérifier la configuration</li>
              <li>Tous les tests devraient être ✅ (verts)</li>
              <li>Le test "Appel API Direct" ne doit PAS contenir de header Authorization</li>
              <li>Si un test est ❌ (rouge), vérifiez la console pour plus de détails</li>
            </ol>
          </div>
        </div>

        {/* Résultats des tests */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Résultats des tests</h2>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    result.success
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-lg ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                          {result.success ? '✅' : '❌'}
                        </span>
                        <h3 className="font-semibold text-gray-900">
                          {result.testName}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {result.timestamp}
                        </span>
                      </div>
                      <p className={`text-sm ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                        {result.message}
                      </p>
                    </div>
                  </div>

                  {/* Détails techniques */}
                  {result.details && (
                    <details className="mt-3">
                      <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                        🔍 Détails techniques
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>

            {/* Résumé */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Total: {testResults.length} tests
                </span>
                <span className="text-sm font-medium">
                  ✅ {testResults.filter(r => r.success).length} réussis |
                  ❌ {testResults.filter(r => !r.success).length} échecs
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Guide de dépannage */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">🔧 Guide de dépannage</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-red-600">❌</span>
              <div>
                <strong>Erreur 401 sur endpoint public:</strong>
                <p className="text-gray-600">Vérifiez que l'intercepteur API détecte correctement les endpoints publics.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-600">❌</span>
              <div>
                <strong>Backend inaccessible:</strong>
                <p className="text-gray-600">Assurez-vous que le backend tourne sur http://localhost:3004</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-600">❌</span>
              <div>
                <strong>Erreur CORS:</strong>
                <p className="text-gray-600">Le backend doit autoriser les requêtes depuis http://localhost:5175</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✅</span>
              <div>
                <strong>Tout fonctionne:</strong>
                <p className="text-gray-600">La correction est réussie ! Les paiements PayDunya devraient maintenant fonctionner.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPaydunyaFixPage;