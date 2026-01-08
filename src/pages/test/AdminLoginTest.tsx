import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, CheckCircle, XCircle, Clock } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import AdminLoginForm from '../../components/admin/AdminLoginForm';
import { adminAuthService } from '../../services/AdminAuthService';
import { adminValidationService } from '../../services/ProductValidationService';
import { toast } from 'sonner';

interface TestResult {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'success' | 'error';
  result?: any;
  error?: string;
}

const AdminLoginTest: React.FC = () => {
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const [tests, setTests] = useState<TestResult[]>([
    {
      id: 'auth-check',
      name: 'Vérifier l\'authentification actuelle',
      status: 'idle'
    },
    {
      id: 'products-fetch',
      name: 'Récupérer les produits (avec auth)',
      status: 'idle'
    },
    {
      id: 'cookies-check',
      name: 'Vérifier les cookies',
      status: 'idle'
    }
  ]);

  const updateTestStatus = (testId: string, status: TestResult['status'], result?: any, error?: string) => {
    setTests(prev => prev.map(test =>
      test.id === testId
        ? { ...test, status, result, error }
        : test
    ));
  };

  const runTest = async (testId: string) => {
    updateTestStatus(testId, 'running');

    try {
      let result: any = {};

      switch (testId) {
        case 'auth-check':
          console.log('🔍 Test: Vérification auth...');
          const admin = await adminAuthService.checkAuthStatus();
          result = {
            authenticated: !!admin,
            admin: admin,
            timestamp: new Date().toISOString()
          };
          if (admin) {
            setCurrentAdmin(admin);
          }
          break;

        case 'products-fetch':
          console.log('📦 Test: Récupération produits...');
          const productsResponse = await adminValidationService.getProductsValidation({
            page: 1,
            limit: 5,
            status: 'PENDING'
          });
          result = {
            success: productsResponse?.success || false,
            productsCount: productsResponse?.data?.products?.length || 0,
            stats: productsResponse?.data?.stats || {},
            timestamp: new Date().toISOString()
          };
          break;

        case 'cookies-check':
          console.log('🍪 Test: Vérification cookies...');
          const cookies = document.cookie;
          result = {
            hasCookies: !!cookies,
            cookieCount: cookies.split(';').length,
            cookies: cookies || 'Aucun cookie',
            timestamp: new Date().toISOString()
          };
          break;

        default:
          throw new Error(`Test inconnu: ${testId}`);
      }

      updateTestStatus(testId, 'success', result);
      console.log(`✅ Test ${testId} réussi:`, result);

    } catch (error: any) {
      updateTestStatus(testId, 'error', null, error.message);
      console.error(`❌ Test ${testId} échoué:`, error);
    }
  };

  const runAllTests = async () => {
    for (const test of tests) {
      await runTest(test.id);
      // Petite pause entre les tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const handleLoginSuccess = (admin: any) => {
    setCurrentAdmin(admin);
    toast.success('Connexion réussie ! Vous pouvez maintenant tester l\'API.');
  };

  const handleLoginError = (error: string) => {
    console.error('Erreur de connexion:', error);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <Clock className="h-4 w-4 text-yellow-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'success':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            Test de Connexion Admin
          </h1>
          <p className="text-lg text-gray-600">
            Testez la connexion admin et l'accès aux API avec authentification par cookies HTTP
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulaire de connexion */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Connexion Admin</CardTitle>
                <CardDescription>
                  Connectez-vous pour tester l'accès aux API administrateur
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentAdmin ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">Connecté en tant qu'admin</span>
                      </div>
                      <p className="text-sm text-green-700">
                        {currentAdmin.firstName} {currentAdmin.lastName}
                      </p>
                      <p className="text-xs text-green-600">{currentAdmin.email}</p>
                      <Badge className="mt-2 bg-green-100 text-green-800 border-green-300">
                        {currentAdmin.role || 'Admin'}
                      </Badge>
                    </div>

                    <Button
                      onClick={() => {
                        setCurrentAdmin(null);
                        window.location.href = '/admin/product-validation';
                      }}
                      className="w-full"
                    >
                      Aller à la validation des produits
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Utilisez le formulaire ci-dessous ou testez avec des identifiants d'admin existants.
                    </p>
                    <AdminLoginForm
                      onLoginSuccess={handleLoginSuccess}
                      onLoginError={handleLoginError}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Tests de l'API */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Tests de l'API</CardTitle>
                <CardDescription>
                  Testez les différentes fonctionnalités de l'API admin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button onClick={runAllTests} className="w-full" variant="outline">
                    Exécuter tous les tests
                  </Button>

                  {tests.map((test) => (
                    <motion.div
                      key={test.id}
                      className="border rounded-lg p-4 space-y-2"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(test.status)}
                          <span className="font-medium">{test.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(test.status)}>
                            {test.status === 'idle' ? 'En attente' :
                             test.status === 'running' ? 'En cours...' :
                             test.status === 'success' ? 'Réussi' : 'Échec'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => runTest(test.id)}
                            disabled={test.status === 'running'}
                          >
                            Tester
                          </Button>
                        </div>
                      </div>

                      {test.result && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <pre className="whitespace-pre-wrap overflow-auto max-h-32">
                            {JSON.stringify(test.result, null, 2)}
                          </pre>
                        </div>
                      )}

                      {test.error && (
                        <div className="mt-2 p-2 bg-red-50 text-red-700 rounded text-xs">
                          ❌ {test.error}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Guide d'utilisation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Guide d'utilisation</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">1. Tester la connexion</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Utilisez les identifiants d'admin existants</li>
                    <li>• Vérifiez que les cookies sont bien créés</li>
                    <li>• Confirmez l'authentification</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">2. Tester les API</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Exécutez les tests individuellement</li>
                    <li>• Vérifiez que l'API répond correctement</li>
                    <li>• Analysez les réponses JSON</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">3. Debug</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Ouvrez la console pour voir les logs</li>
                    <li>• Vérifiez les cookies dans DevTools</li>
                    <li>• Analysez les requêtes réseau</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">4. Accéder à l'admin</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Une fois connecté, allez à /admin/product-validation</li>
                    <li>• Les produits devraient maintenant s'afficher</li>
                    <li>• Les filtres et actions doivent fonctionner</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLoginTest;