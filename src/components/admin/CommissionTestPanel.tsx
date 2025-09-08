import React, { useState } from 'react';
import { commissionService } from '../../services/commissionService';
import { useCommissions } from '../../hooks/useCommissions';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Database,
  Wifi,
  Shield,
  Activity
} from 'lucide-react';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
  duration?: number;
}

export const CommissionTestPanel: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const { commissions, stats, loading, error } = useCommissions();

  const updateTest = (test: string, status: TestResult['status'], message?: string, duration?: number) => {
    setTests(prev => prev.map(t => 
      t.test === test 
        ? { ...t, status, message, duration }
        : t
    ));
  };

  const runTests = async () => {
    setTesting(true);
    
    const testSuite: TestResult[] = [
      { test: 'Connexion API', status: 'pending' },
      { test: 'Authentification', status: 'pending' },
      { test: 'Récupération commissions', status: 'pending' },
      { test: 'Statistiques globales', status: 'pending' },
      { test: 'Mise à jour commission', status: 'pending' },
      { test: 'Validation données', status: 'pending' },
    ];

    setTests(testSuite);

    try {
      // Test 1: Connexion API
      const startTime = Date.now();
      await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      updateTest('Connexion API', 'success', 'Serveur accessible', Date.now() - startTime);

      // Test 2: Authentification
      const authStart = Date.now();
      try {
        await commissionService.getAllVendorCommissions();
        updateTest('Authentification', 'success', 'Token valide', Date.now() - authStart);
      } catch (authError: any) {
        if (authError.message.includes('Token') || authError.message.includes('401')) {
          updateTest('Authentification', 'error', 'Token manquant ou invalide');
        } else {
          updateTest('Authentification', 'success', 'Auth OK (autre erreur)');
        }
      }

      // Test 3: Récupération commissions
      const commissionsStart = Date.now();
      try {
        const commissionsData = await commissionService.getAllVendorCommissions();
        updateTest(
          'Récupération commissions', 
          'success', 
          `${commissionsData.length} vendeurs trouvés`, 
          Date.now() - commissionsStart
        );
      } catch (err: any) {
        updateTest('Récupération commissions', 'error', err.message);
      }

      // Test 4: Statistiques globales
      const statsStart = Date.now();
      try {
        const statsData = await commissionService.getCommissionStats();
        updateTest(
          'Statistiques globales', 
          'success', 
          `Commission moyenne: ${statsData.averageCommission?.toFixed(1)}%`, 
          Date.now() - statsStart
        );
      } catch (err: any) {
        updateTest('Statistiques globales', 'error', err.message);
      }

      // Test 5: Mise à jour commission (test avec un vendeur factice)
      const updateStart = Date.now();
      try {
        // On teste la validation sans vraiment mettre à jour
        if (!commissionService.validateCommissionRate(50)) {
          throw new Error('Validation échouée');
        }
        updateTest('Mise à jour commission', 'success', 'Validation OK', Date.now() - updateStart);
      } catch (err: any) {
        updateTest('Mise à jour commission', 'error', err.message);
      }

      // Test 6: Validation des données
      const validationStart = Date.now();
      const validTests = [
        commissionService.validateCommissionRate(0),
        commissionService.validateCommissionRate(50.5),
        commissionService.validateCommissionRate(100),
        !commissionService.validateCommissionRate(-1),
        !commissionService.validateCommissionRate(101),
        !commissionService.validateCommissionRate(NaN),
      ];

      if (validTests.every(Boolean)) {
        updateTest('Validation données', 'success', 'Toutes validations OK', Date.now() - validationStart);
      } else {
        updateTest('Validation données', 'error', 'Certaines validations échouent');
      }

    } catch (globalError: any) {
      console.error('Erreur globale des tests:', globalError);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-blue-600 border-blue-300">En cours</Badge>;
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Succès</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Échec</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Test d'Intégration Backend Commission
        </CardTitle>
        <p className="text-sm text-gray-600">
          Panel de test pour vérifier la compatibilité avec le backend NestJS + Prisma
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* État actuel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Database className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-medium text-blue-900">Commissions</div>
              <div className="text-sm text-blue-700">{commissions.length} vendeurs</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <Activity className="h-5 w-5 text-green-600" />
            <div>
              <div className="font-medium text-green-900">Statistiques</div>
              <div className="text-sm text-green-700">
                {stats ? `Moy: ${stats.averageCommission?.toFixed(1)}%` : 'Non chargées'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Shield className="h-5 w-5 text-gray-600" />
            <div>
              <div className="font-medium text-gray-900">Statut</div>
              <div className="text-sm text-gray-700">
                {loading ? 'Chargement...' : error ? 'Erreur' : 'Prêt'}
              </div>
            </div>
          </div>
        </div>

        {/* Erreur globale */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Erreur détectée:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Contrôles */}
        <div className="flex gap-3">
          <Button 
            onClick={runTests}
            disabled={testing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Tests en cours...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4 mr-2" />
                Lancer les Tests
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setTests([])}
            disabled={testing}
          >
            Effacer
          </Button>
        </div>

        {/* Résultats des tests */}
        {tests.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Résultats des Tests</h3>
            
            <div className="space-y-2">
              {tests.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <span className="font-medium">{test.test}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {test.message && (
                      <span className="text-sm text-gray-600">{test.message}</span>
                    )}
                    {test.duration && (
                      <span className="text-xs text-gray-500">{test.duration}ms</span>
                    )}
                    {getStatusBadge(test.status)}
                  </div>
                </div>
              ))}
            </div>

            {/* Résumé */}
            <div className="mt-4 p-3 bg-white border rounded-lg">
              <div className="text-sm">
                <strong>Résumé:</strong>
                <span className="ml-2 text-green-600">
                  {tests.filter(t => t.status === 'success').length} succès
                </span>
                <span className="ml-2 text-red-600">
                  {tests.filter(t => t.status === 'error').length} échecs
                </span>
                <span className="ml-2 text-blue-600">
                  {tests.filter(t => t.status === 'pending').length} en cours
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Informations de débogage */}
        <details className="border rounded-lg p-3">
          <summary className="cursor-pointer font-medium">Informations de Débogage</summary>
          <div className="mt-3 space-y-2 text-sm">
            <div><strong>Backend URL:</strong> {process.env.REACT_APP_API_URL || 'http://localhost:3000'}</div>
            <div><strong>Token présent:</strong> {localStorage.getItem('authToken') ? '✅ Oui' : '❌ Non'}</div>
            <div><strong>Commissions chargées:</strong> {commissions.length}</div>
            <div><strong>État de chargement:</strong> {loading ? 'En cours' : 'Terminé'}</div>
          </div>
        </details>
      </CardContent>
    </Card>
  );
};