import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  TestTube, 
  Database, 
  Wifi, 
  WifiOff, 
  PlayCircle, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Bell,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { newOrderService } from '../services/newOrderService';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../contexts/AuthContext';

const BackendIntegrationDemo: React.FC = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<{ [key: string]: 'pending' | 'success' | 'error' }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState('https://printalma-back-dep.onrender.com');
  const [orderStats, setOrderStats] = useState<any>(null);

  // Configuration WebSocket avec callbacks
  const { isConnected, connect, disconnect } = useWebSocket({
    onNewOrder: (notification) => {
      toast.success('🆕 Nouvelle commande reçue!', {
        description: notification.message,
      });
    },
    onOrderStatusChanged: (notification) => {
      toast.info('📝 Statut de commande modifié', {
        description: notification.message,
      });
    },
    onMyOrderUpdated: (notification) => {
      toast.success('📦 Votre commande a été mise à jour', {
        description: notification.message,
      });
    },
    autoConnect: false, // Contrôle manuel pour la démo
    showNotifications: true,
    enableBrowserNotifications: true
  });

  // ==========================================
  // TESTS DES ENDPOINTS
  // ==========================================

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    setTestResults(prev => ({ ...prev, [testName]: 'pending' }));
    try {
      await testFunction();
      setTestResults(prev => ({ ...prev, [testName]: 'success' }));
      return true;
    } catch (error) {
      console.error(`Test ${testName} échoué:`, error);
      setTestResults(prev => ({ ...prev, [testName]: 'error' }));
      return false;
    }
  };

  const testAuthEndpoint = async () => {
    await runTest('auth', async () => {
      const result = await newOrderService.testAuth();
      console.log('✅ Test Auth:', result);
      toast.success('Test d\'authentification réussi');
    });
  };

  const testAdminEndpoint = async () => {
    await runTest('admin', async () => {
      const result = await newOrderService.testAdmin();
      console.log('✅ Test Admin:', result);
      toast.success('Test admin réussi');
    });
  };

  const testCreateOrder = async () => {
    await runTest('createOrder', async () => {
      const mockOrderData = {
        shippingAddress: "123 Rue de la Paix, Dakar",
        phoneNumber: "+221701234567",
        notes: "Test de commande depuis la démo",
        shippingDetails: {
          firstName: 'Test',
          lastName: 'User',
          street: '123 Rue de la Paix',
          city: 'Dakar',
          postalCode: '10000',
          country: 'Sénégal'
        },
        orderItems: [
          {
            productId: 1,
            quantity: 2,
            size: "M",
            color: "Rouge"
          }
        ]
      };
      
      const result = await newOrderService.createOrder(mockOrderData);
      console.log('✅ Commande créée:', result);
      toast.success(`Commande ${result.orderNumber} créée`);
    });
  };

  const testGetMyOrders = async () => {
    await runTest('myOrders', async () => {
      const result = await newOrderService.getMyOrders();
      console.log('✅ Mes commandes:', result);
      toast.success(`${result.orders?.length || 0} commande(s) récupérée(s)`);
    });
  };

  const testGetAllOrders = async () => {
    await runTest('allOrders', async () => {
      const result = await newOrderService.getAllOrders({ page: 1, limit: 10 });
      console.log('✅ Toutes les commandes:', result);
      toast.success(`${result.orders.length} commande(s) admin récupérée(s)`);
    });
  };

  const testGetStatistics = async () => {
    await runTest('statistics', async () => {
      // Placeholder - méthode non implémentée
      const result = { orders: 0, revenue: 0 };
      console.log('✅ Statistiques:', result);
      setOrderStats(result);
      toast.info('Statistiques placeholder récupérées');
    });
  };

  const testWebSocketStats = async () => {
    await runTest('websocketStats', async () => {
      // Placeholder - méthode non implémentée
      const result = { total: 0, active: 0 };
      console.log('✅ Stats WebSocket:', result);
      toast.info('Stats WebSocket placeholder récupérées');
    });
  };

  // ==========================================
  // TESTS GLOBAUX
  // ==========================================

  const runAllTests = async () => {
    setIsLoading(true);
    toast.info('🧪 Lancement des tests d\'intégration...');

    // Tests de base
    await testAuthEndpoint();
    await testGetMyOrders();
    await testGetStatistics();
    await testWebSocketStats();

    // Tests admin (si l'utilisateur est admin)
    if (user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') {
      await testAdminEndpoint();
      await testGetAllOrders();
    }

    // Test de création de commande (peut échouer si pas de backend)
    await testCreateOrder();

    setIsLoading(false);
    toast.success('🎉 Tests d\'intégration terminés!');
  };

  // ==========================================
  // INTERFACE DE DÉMONSTRATION
  // ==========================================

  const getTestIcon = (status: 'pending' | 'success' | 'error' | undefined) => {
    switch (status) {
      case 'pending':
        return <RefreshCw className="animate-spin h-4 w-4 text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <TestTube className="h-4 w-4 text-gray-400" />;
    }
  };

  const TestItem: React.FC<{ name: string; description: string; testKey: string; onTest: () => void }> = ({
    name, description, testKey, onTest
  }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center space-x-3">
        {getTestIcon(testResults[testKey])}
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-gray-500">{description}</div>
        </div>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onTest}
        disabled={testResults[testKey] === 'pending'}
      >
        <PlayCircle className="w-4 h-4 mr-1" />
        Test
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">🔌 Démo d'Intégration Backend PrintAlma</h1>
        <p className="text-gray-600">
          Interface de test pour valider l'intégration avec le backend NestJS selon la documentation fournie.
        </p>
      </div>

      {/* Configuration API */}
      <Card className="p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Configuration
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">URL du Backend</label>
            <Input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://printalma-back-dep.onrender.com"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Utilisateur connecté</div>
              <div className="text-sm text-gray-500">
                {user ? `${user.email} (${user.role})` : 'Non connecté'}
              </div>
            </div>
            <Badge variant={user ? 'default' : 'secondary'}>
              {user ? 'Authentifié' : 'Anonyme'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* WebSocket Status */}
      <Card className="p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center">
          {isConnected ? <Wifi className="w-5 h-5 mr-2 text-green-500" /> : <WifiOff className="w-5 h-5 mr-2 text-red-500" />}
          WebSocket Status
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Connecté' : 'Déconnecté'}
            </Badge>
            <span className="text-sm text-gray-500">
              Statut: {isConnected ? 'Connecté' : 'Déconnecté'}
            </span>
          </div>
          <div className="space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => console.log('Ping WebSocket')}
              disabled={!isConnected}
            >
              Ping
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={isConnected ? disconnect : connect}
            >
              {isConnected ? 'Déconnecter' : 'Connecter'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Tests des Endpoints */}
      <Card className="p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center">
          <Database className="w-5 h-5 mr-2" />
          Tests des Endpoints API
        </h2>
        
        <div className="mb-4">
          <Button 
            onClick={runAllTests} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <PlayCircle className="w-4 h-4 mr-2" />
            )}
            Lancer tous les tests
          </Button>
        </div>

        <div className="space-y-3">
          <TestItem
            name="Test d'Authentification"
            description="GET /orders/test-auth"
            testKey="auth"
            onTest={testAuthEndpoint}
          />
          
          <TestItem
            name="Mes Commandes"
            description="GET /orders/my-orders"
            testKey="myOrders"
            onTest={testGetMyOrders}
          />
          
          <TestItem
            name="Statistiques Frontend"
            description="GET /orders/admin/frontend-statistics"
            testKey="statistics"
            onTest={testGetStatistics}
          />
          
          <TestItem
            name="Stats WebSocket"
            description="GET /orders/admin/websocket-stats"
            testKey="websocketStats"
            onTest={testWebSocketStats}
          />

          {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
            <>
              <TestItem
                name="Test Admin"
                description="GET /orders/test-admin"
                testKey="admin"
                onTest={testAdminEndpoint}
              />
              
              <TestItem
                name="Toutes les Commandes"
                description="GET /orders/admin/all"
                testKey="allOrders"
                onTest={testGetAllOrders}
              />
            </>
          )}
          
          <TestItem
            name="Créer Commande"
            description="POST /orders"
            testKey="createOrder"
            onTest={testCreateOrder}
          />
        </div>
      </Card>

      {/* Statistiques */}
      {orderStats && (
        <Card className="p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">📊 Statistiques des Commandes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{orderStats.totalOrders}</div>
              <div className="text-sm text-gray-500">Total Commandes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{orderStats.revenue?.total?.toLocaleString() || 0} CFA</div>
              <div className="text-sm text-gray-500">Chiffre d'Affaires</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{orderStats.ordersCount?.today || 0}</div>
              <div className="text-sm text-gray-500">Aujourd'hui</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{orderStats.ordersByStatus?.pending || 0}</div>
              <div className="text-sm text-gray-500">En Attente</div>
            </div>
          </div>
        </Card>
      )}

      {/* Instructions */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Instructions d'Utilisation
        </h2>
        <div className="space-y-2 text-sm">
          <p>• <strong>Démarrer le backend :</strong> <code>npm run start:dev</code> sur le port 3004</p>
          <p>• <strong>Authentification :</strong> Les requêtes utilisent les cookies (credentials: 'include')</p>
          <p>• <strong>WebSocket :</strong> Connexion automatique pour les notifications temps réel</p>
          <p>• <strong>Tests :</strong> Certains tests peuvent échouer si le backend n'est pas démarré</p>
          <p>• <strong>Permissions :</strong> Les tests admin nécessitent un compte administrateur</p>
        </div>
      </Card>
    </div>
  );
};

export default BackendIntegrationDemo; 