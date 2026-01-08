import React, { useState } from 'react';
import { WorkflowSelector } from '../components/vendor/WorkflowSelector';
import { ModernVendorProductCard } from '../components/vendor/ModernVendorProductCard';
import { Card } from '../components/ui/card';
import Button from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { RefreshCcw, AlertCircle, CheckCircle, Users, Package } from 'lucide-react';
import { toast } from 'sonner';

/**
 * 🎯 Page de démonstration du système de workflow moderne
 * Implémente les spécifications complètes du backend pour les deux workflows
 */
export const WorkflowDemo: React.FC = () => {
  // États pour le workflow selector
  const [workflowType, setWorkflowType] = useState<'auto-publish' | 'manual-publish'>('auto-publish');
  const [isPublishing, setIsPublishing] = useState(false);

  // Statut de validation du design
  const [designValidationStatus, setDesignValidationStatus] = useState({
    isValidated: false,
    needsValidation: true,
    message: 'Design en attente de validation admin'
  });

  // Produits de démonstration selon les spécifications
  const [mockProducts] = useState([
    {
      id: 1,
      name: 'T-shirt Logo Moderne',
      price: 15000,
      stock: 25,
      imageUrl: 'https://via.placeholder.com/300x300/22c55e/ffffff?text=T-shirt',
      category: 'Vêtements',
      status: 'DRAFT' as const,
      forcedStatus: 'DRAFT' as const,
      isValidated: true,
      designValidationStatus: 'VALIDATED' as const,
    },
    {
      id: 2,
      name: 'Mug Design Floral',
      price: 8000,
      stock: 50,
      imageUrl: 'https://via.placeholder.com/300x300/3b82f6/ffffff?text=Mug',
      category: 'Accessoires',
      status: 'PENDING' as const,
      forcedStatus: 'PENDING' as const,
      isValidated: false,
      designValidationStatus: 'PENDING' as const,
    },
    {
      id: 3,
      name: 'Poster Artistique',
      price: 12000,
      stock: 15,
      imageUrl: 'https://via.placeholder.com/300x300/8b5cf6/ffffff?text=Poster',
      category: 'Décoration',
      status: 'PUBLISHED' as const,
      forcedStatus: 'PENDING' as const,
      isValidated: true,
      designValidationStatus: 'VALIDATED' as const,
    },
    {
      id: 4,
      name: 'Casquette Personnalisée',
      price: 18000,
      stock: 8,
      imageUrl: 'https://via.placeholder.com/300x300/ef4444/ffffff?text=Cap',
      category: 'Accessoires',
      status: 'DRAFT' as const,
      forcedStatus: 'DRAFT' as const,
      isValidated: false,
      designValidationStatus: 'REJECTED' as const,
    }
  ]);

  // Simulation publication
  const handlePublish = () => {
    setIsPublishing(true);
    
    setTimeout(() => {
      const forcedStatus = workflowType === 'auto-publish' ? 'PENDING' : 'DRAFT';
      
      toast.success('Produits créés avec succès !', {
        description: workflowType === 'auto-publish'
          ? 'Vos produits sont en attente de validation et seront publiés automatiquement.'
          : 'Vos produits sont en brouillon. Vous pourrez les publier manuellement après validation.',
        duration: 6000
      });
      
      console.log('🎯 Workflow choisi:', workflowType);
      console.log('📦 ForcedStatus envoyé:', forcedStatus);
      
      setIsPublishing(false);
    }, 2000);
  };

  // Basculer le statut de validation du design
  const toggleDesignValidation = () => {
    setDesignValidationStatus(prev => ({
      isValidated: !prev.isValidated,
      needsValidation: prev.isValidated,
      message: !prev.isValidated 
        ? 'Design validé par l\'admin' 
        : 'Design en attente de validation admin'
    }));
  };

  // Statistiques des produits
  const stats = {
    total: mockProducts.length,
    published: mockProducts.filter(p => p.status === 'PUBLISHED').length,
    pending: mockProducts.filter(p => p.status === 'PENDING').length,
    draft: mockProducts.filter(p => p.status === 'DRAFT').length,
    readyToPublish: mockProducts.filter(p => 
      p.forcedStatus === 'DRAFT' && 
      p.isValidated === true && 
      p.status === 'DRAFT'
    ).length
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* En-tête */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            🚀 Démonstration Workflow ModernWorkflow
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Test complet du système de publication en deux workflows selon les spécifications backend.
            Testez les workflows AUTO-PUBLISH et MANUAL-PUBLISH avec gestion des forcedStatus.
          </p>
        </div>

        {/* Contrôles de démonstration */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Contrôles de démonstration
          </h2>
          
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={toggleDesignValidation}
              variant="outline"
              className={designValidationStatus.isValidated ? 'border-green-500' : 'border-yellow-500'}
            >
              {designValidationStatus.isValidated ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Design validé
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 mr-2 text-yellow-600" />
                  Design en attente
                </>
              )}
            </Button>
            
            <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
              Status: {designValidationStatus.message}
            </Badge>
          </div>
        </Card>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="p-4 text-center">
            <Package className="h-6 w-6 mx-auto mb-2 text-gray-600" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            <div className="text-sm text-gray-500">Publiés</div>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-500">En attente</div>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            <div className="text-sm text-gray-500">Brouillons</div>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.readyToPublish}</div>
            <div className="text-sm text-gray-500">Prêts à publier</div>
          </Card>
          
          <Card className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">2</div>
            <div className="text-sm text-gray-500">Workflows</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section gauche : Workflow Selector */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">🎯 Choix de Workflow</h2>
              <WorkflowSelector
                workflowType={workflowType}
                onWorkflowChange={setWorkflowType}
                designValidationStatus={designValidationStatus}
                isPublishing={isPublishing}
                onPublish={handlePublish}
              />
            </Card>

            {/* Bannière informative */}
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                <RefreshCcw className="h-4 w-4" />
                Workflow Simplifié (Décembre 2024)
              </h3>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <p><strong>✅ AUTO-PUBLISH:</strong> forcedStatus=PENDING → Publication automatique après validation</p>
                <p><strong>📝 MANUAL-PUBLISH:</strong> forcedStatus=DRAFT → Bouton "Publier" affiché après validation</p>
              </div>
            </Card>
          </div>

          {/* Section droite : Liste des produits */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">📦 Produits Vendeur</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockProducts.map((product) => (
                <ModernVendorProductCard
                  key={product.id}
                  product={product}
                  onEdit={(product) => {
                    toast.info(`Édition de ${product.name}`);
                  }}
                  onDelete={(id) => {
                    toast.info(`Suppression du produit ID: ${id}`);
                  }}
                  onView={(product) => {
                    toast.info(`Visualisation de ${product.name}`);
                  }}
                  onRefresh={() => {
                    toast.success('Liste rafraîchie !');
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Guide d'utilisation */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">📖 Guide d'utilisation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-medium text-green-600 mb-2">🚀 Workflow AUTO-PUBLISH</h3>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• Choix: "Publication automatique"</li>
                <li>• Backend reçoit: forcedStatus=PENDING</li>
                <li>• Validation admin → Status passe à PUBLISHED</li>
                <li>• Aucune action vendeur requise</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-purple-600 mb-2">📝 Workflow MANUAL-PUBLISH</h3>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• Choix: "Mettre en brouillon"</li>
                <li>• Backend reçoit: forcedStatus=DRAFT</li>
                <li>• Validation admin → Status reste DRAFT</li>
                <li>• Bouton "Publier maintenant" apparaît</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default WorkflowDemo; 