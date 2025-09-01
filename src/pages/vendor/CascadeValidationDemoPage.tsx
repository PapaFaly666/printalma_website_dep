import React, { useState } from 'react';
import { VendorProductsCascadePage } from './VendorProductsCascadePage';
import { PostValidationAction } from '../../types/cascadeValidation';
import { cascadeValidationService } from '../../services/cascadeValidationService';
import { 
  Play, 
  Settings,
  Zap, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Code
} from 'lucide-react';

export const CascadeValidationDemoPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'demo' | 'test' | 'docs'>('demo');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    const results = [];

    try {
      // Test 1: Vérifier la connexion API
      results.push({
        test: 'Connexion API',
        status: 'running',
        message: 'Test de connexion...'
      });

      // Test 2: Créer un produit de test
      const testProduct = {
        vendorName: 'Produit Test Cascade',
        vendorDescription: 'Test du système de cascade validation',
        vendorPrice: 2500, // 25.00€
        designCloudinaryUrl: 'https://res.cloudinary.com/test/image/upload/test.jpg',
        postValidationAction: PostValidationAction.AUTO_PUBLISH
      };

      results.push({
        test: 'Création produit test',
        status: 'success',
        message: 'Produit de test configuré',
        data: testProduct
      });

      // Test 3: Vérifier les utilitaires du service
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        vendorName: 'Test',
        vendorDescription: 'Test',
        vendorPrice: 1000,
        vendorStock: 100,
        status: 'DRAFT' as any,
        isValidated: true,
        postValidationAction: PostValidationAction.TO_DRAFT,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const canPublish = cascadeValidationService.canPublishManually(mockProduct);
      const canModify = cascadeValidationService.canModifyProduct(mockProduct);
      const displayStatus = cascadeValidationService.getDisplayStatus(mockProduct);

      results.push({
        test: 'Utilitaires service',
        status: 'success',
        message: 'Fonctions utilitaires testées',
        data: {
          canPublish,
          canModify,
          displayStatus
        }
      });

      setTestResults(results);
    } catch (error) {
      results.push({
        test: 'Erreur générale',
        status: 'error',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      setTestResults(results);
    } finally {
      setTesting(false);
    }
  };

  const TabButton = ({ 
    tab, 
    label, 
    icon: Icon 
  }: { 
    tab: 'demo' | 'test' | 'docs'; 
    label: string; 
    icon: React.ComponentType<any>;
  }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`
        inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors
        ${activeTab === tab 
          ? 'bg-blue-600 text-white' 
          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
        }
      `}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            🌊 Cascade Validation Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Démonstration complète du système de validation en cascade Design → Produits
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8">
          <TabButton tab="demo" label="Démonstration" icon={Play} />
          <TabButton tab="test" label="Tests" icon={Settings} />
          <TabButton tab="docs" label="Documentation" icon={Code} />
        </div>

        {/* Content */}
        {activeTab === 'demo' && (
          <div className="space-y-6">
            {/* Info Panel */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Info className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Système de Cascade Validation
                  </h3>
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                    <p>
                      <strong>Workflow :</strong> Vendeur crée produit → Choisit action → Admin valide design → CASCADE automatique
                    </p>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                        <span>En attente</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-400 rounded-full"></span>
                        <span>Auto-publié</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-blue-400 rounded-full"></span>
                        <span>Prêt à publier</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Demo Interface */}
            <VendorProductsCascadePage />
          </div>
        )}

        {activeTab === 'test' && (
          <div className="space-y-6">
            {/* Test Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Tests du Système
                </h3>
                <button
                  onClick={runTests}
                  disabled={testing}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors"
                >
                  {testing ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Tests en cours...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Lancer les tests
                    </>
                  )}
                </button>
              </div>

              {/* Test Results */}
              {testResults.length > 0 && (
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                    >
                      <StatusIcon status={result.status} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {result.test}
                          </h4>
                          <span className={`
                            text-xs px-2 py-1 rounded-full
                            ${result.status === 'success' ? 'bg-green-100 text-green-800' : ''}
                            ${result.status === 'error' ? 'bg-red-100 text-red-800' : ''}
                            ${result.status === 'running' ? 'bg-blue-100 text-blue-800' : ''}
                          `}>
                            {result.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {result.message}
                        </p>
                        {result.data && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                              Voir les détails
                            </summary>
                            <pre className="text-xs bg-gray-100 dark:bg-gray-600 p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="space-y-6">
            {/* Documentation */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Documentation Technique
              </h3>
              
              <div className="space-y-6">
                {/* Endpoints */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                    🔗 Endpoints Backend
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 text-sm">
                    <div className="space-y-2">
                      <div><code className="text-blue-600">PUT /vendor-product-validation/post-validation-action/:id</code></div>
                      <div><code className="text-green-600">POST /vendor-product-validation/publish/:id</code></div>
                      <div><code className="text-orange-600">PUT /designs/:id/validate</code></div>
                      <div><code className="text-purple-600">GET /vendor/products</code></div>
                    </div>
                  </div>
                </div>

                {/* Types */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                    📝 Types TypeScript
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 text-sm">
                    <pre className="text-gray-800 dark:text-gray-200">
{`enum PostValidationAction {
  AUTO_PUBLISH = 'AUTO_PUBLISH',
  TO_DRAFT = 'TO_DRAFT'
}

interface VendorProduct {
  id: number;
  vendorName: string;
  status: ProductStatus;
  isValidated: boolean;
  postValidationAction: PostValidationAction;
  // ...
}`}
                    </pre>
                  </div>
                </div>

                {/* Workflow */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                    🔄 Workflow Complet
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">1</div>
                      <span className="text-gray-700 dark:text-gray-300">Vendeur crée produit et choisit action post-validation</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-sm font-medium">2</div>
                      <span className="text-gray-700 dark:text-gray-300">Produit en statut PENDING</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-medium">3</div>
                      <span className="text-gray-700 dark:text-gray-300">Admin valide le design</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">4</div>
                      <span className="text-gray-700 dark:text-gray-300">CASCADE automatique selon l'action choisie</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 