import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  ArrowLeft, 
  Package, 
  Save, 
  Layers, 
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import VendorDesignTransformationWorkflow from '../../components/vendor/VendorDesignTransformationWorkflow';
import { designPositionService } from '../../services/DesignPositionService';

const VendorDesignPositioningPage: React.FC = () => {
  const { baseProductId, designId } = useParams<{ baseProductId: string; designId?: string }>();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalDrafts: 0,
    totalProducts: 0,
    lastActivity: null as string | null
  });
  
  const [vendorId] = useState<number>(1); // TODO: Récupérer depuis l'auth
  
  // Gestion des événements du workflow
  const handleProductCreated = (productId: number) => {
    setStats(prev => ({
      ...prev,
      totalProducts: prev.totalProducts + 1,
      lastActivity: new Date().toISOString()
    }));
    
    toast.success('Produit créé avec succès !', {
      action: {
        label: 'Voir le produit',
        onClick: () => navigate(`/vendor/products/${productId}`)
      }
    });
  };
  
  // Mise à jour des statistiques
  useEffect(() => {
    const updateStats = () => {
      const drafts = designPositionService.getAllDrafts();
      setStats(prev => ({
        ...prev,
        totalDrafts: drafts.length,
        lastActivity: drafts.length > 0 ? new Date(Math.max(...drafts.map(d => d.timestamp))).toISOString() : null
      }));
    };
    
    updateStats();
    
    // Mise à jour périodique
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);
  
  // Nettoyage automatique des brouillons obsolètes
  useEffect(() => {
    const cleaned = designPositionService.cleanupOldDrafts(48); // 48h
    if (cleaned > 0) {
      console.log(`🧹 ${cleaned} brouillons obsolètes nettoyés automatiquement`);
    }
  }, []);
  
  // Validation des paramètres
  if (!baseProductId || isNaN(parseInt(baseProductId))) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64 text-red-500">
            <AlertCircle className="h-8 w-8 mr-2" />
            <span>ID de produit invalide</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/vendor/products')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Positionnement Design
              </h1>
              <p className="text-gray-600 mt-1">
                Stockage local • Pas de pollution DB • Validation finale
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="text-sm">
              Produit #{baseProductId}
            </Badge>
            {designId && (
              <Badge variant="outline" className="text-sm">
                Design #{designId}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Brouillons en cours</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalDrafts}</p>
                  <p className="text-xs text-gray-500">Sauvegardés en localStorage</p>
                </div>
                <Save className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Produits créés</p>
                  <p className="text-2xl font-bold text-green-600">{stats.totalProducts}</p>
                  <p className="text-xs text-gray-500">Depuis cette session</p>
                </div>
                <Package className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Dernière activité</p>
                  <p className="text-sm font-medium text-gray-900">
                    {stats.lastActivity 
                      ? new Date(stats.lastActivity).toLocaleString()
                      : 'Aucune activité'
                    }
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Guide de la nouvelle approche */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              Nouvelle approche localStorage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Positionnement</h4>
                  <p className="text-sm text-gray-600">
                    Sauvegarde automatique en localStorage (debounce 300ms)
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Brouillons</h4>
                  <p className="text-sm text-gray-600">
                    Gestion locale des designs en cours
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Validation</h4>
                  <p className="text-sm text-gray-600">
                    Modal de création avec formulaire complet
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">4</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Nettoyage</h4>
                  <p className="text-sm text-gray-600">
                    Suppression automatique des brouillons expirés
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Composant principal du workflow */}
        <VendorDesignTransformationWorkflow
          baseProductId={parseInt(baseProductId)}
          designId={designId ? parseInt(designId) : undefined}
          vendorId={vendorId}
          onProductCreated={handleProductCreated}
        />
        
        {/* Avantages de la nouvelle approche */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Layers className="h-5 w-5 mr-2 text-blue-500" />
              Avantages de cette approche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">✅ Pas de pollution DB</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Aucun produit temporaire créé</li>
                  <li>• Base de données propre</li>
                  <li>• Seuls les vrais produits sont sauvegardés</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">⚡ Réactivité</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Sauvegarde instantanée localStorage</li>
                  <li>• Pas d'attente réseau</li>
                  <li>• Debounce optimisé (300ms)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">💾 Persistance</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Position conservée entre sessions</li>
                  <li>• Récupération automatique</li>
                  <li>• Nettoyage des brouillons expirés</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">🎯 Validation stricte</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Formulaire complet obligatoire</li>
                  <li>• Validation backend normale</li>
                  <li>• Pas d'erreurs "auto-générées"</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Conseils d'utilisation */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-blue-500" />
              Conseils d'utilisation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">💡 Workflow optimal</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Positionnez le design à votre convenance</li>
                  <li>• Ajustez les paramètres de prévisualisation</li>
                  <li>• Cliquez sur "Créer le produit" quand satisfait</li>
                  <li>• Remplissez le formulaire complet</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">🧹 Gestion des brouillons</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Nettoyage automatique après 48h</li>
                  <li>• Bouton "Brouillons" pour voir tous les designs</li>
                  <li>• Possibilité de continuer ou supprimer</li>
                  <li>• Indicateur de sauvegarde en temps réel</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorDesignPositioningPage; 