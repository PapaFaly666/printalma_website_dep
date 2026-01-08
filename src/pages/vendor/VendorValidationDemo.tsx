import React, { useState } from 'react';
import { VendorProduct, PostValidationAction } from '../../types/vendorProduct';
import { VendorProductCard } from '../../components/vendor/VendorProductCard';
import { ValidationActionSelector } from '../../components/vendor/ValidationActionSelector';
import { PublishValidatedProductButton } from '../../components/vendor/PublishValidatedProductButton';
import { ProductStatusBadge } from '../../components/vendor/ProductStatusBadge';
import Button from '../../components/ui/Button';
import { toast } from 'sonner';

export const VendorValidationDemo: React.FC = () => {
  const [demoProducts, setDemoProducts] = useState<VendorProduct[]>([
    {
      id: 1,
      name: 'T-shirt personnalisé - Design Chat',
      description: 'Un magnifique t-shirt avec un design de chat personnalisé',
      status: 'DRAFT',
      isValidated: false,
      postValidationAction: PostValidationAction.AUTO_PUBLISH,
      price: 25,
      stock: 50,
      imageUrl: 'https://via.placeholder.com/300x300/3B82F6/FFFFFF?text=T-shirt+Chat'
    },
    {
      id: 2,
      name: 'Mug avec logo entreprise',
      description: 'Mug personnalisé avec logo d\'entreprise',
      status: 'PENDING',
      isValidated: false,
      postValidationAction: PostValidationAction.TO_DRAFT,
      price: 15,
      stock: 100,
      imageUrl: 'https://via.placeholder.com/300x300/10B981/FFFFFF?text=Mug+Logo'
    },
    {
      id: 3,
      name: 'Casquette brodée',
      description: 'Casquette avec broderie personnalisée',
      status: 'DRAFT',
      isValidated: true,
      postValidationAction: PostValidationAction.TO_DRAFT,
      price: 30,
      stock: 25,
      validatedAt: new Date().toISOString(),
      imageUrl: 'https://via.placeholder.com/300x300/F59E0B/FFFFFF?text=Casquette'
    },
    {
      id: 4,
      name: 'Poster A3 - Paysage',
      description: 'Poster personnalisé format A3',
      status: 'PUBLISHED',
      isValidated: true,
      postValidationAction: PostValidationAction.AUTO_PUBLISH,
      price: 20,
      stock: 200,
      validatedAt: new Date(Date.now() - 86400000).toISOString(),
      imageUrl: 'https://via.placeholder.com/300x300/8B5CF6/FFFFFF?text=Poster+A3'
    },
    {
      id: 5,
      name: 'Sac tote bag - Rejeté',
      description: 'Sac tote bag avec design personnalisé',
      status: 'DRAFT',
      isValidated: false,
      postValidationAction: PostValidationAction.AUTO_PUBLISH,
      price: 18,
      stock: 75,
      rejectionReason: 'Le design ne respecte pas les droits d\'auteur',
      imageUrl: 'https://via.placeholder.com/300x300/EF4444/FFFFFF?text=Sac+Rejeté'
    }
  ]);

  const [selectedAction, setSelectedAction] = useState<PostValidationAction>(PostValidationAction.AUTO_PUBLISH);

  const handleProductUpdated = () => {
    toast.success('Produit mis à jour !');
    // Ici on pourrait refetch les données
  };

  const handleEdit = (product: VendorProduct) => {
    toast.info(`Édition du produit : ${product.name}`);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      setDemoProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Produit supprimé');
    }
  };

  const handleView = (product: VendorProduct) => {
    toast.info(`Affichage du produit : ${product.name}`);
  };

  const simulateValidation = (productId: number, approved: boolean) => {
    setDemoProducts(prev => prev.map(p => {
      if (p.id === productId) {
        if (approved) {
          // Admin valide le produit → Appliquer l'action choisie par le vendeur
          if (p.postValidationAction === PostValidationAction.AUTO_PUBLISH) {
            // Publication automatique → Le produit devient PUBLISHED
            return {
              ...p,
              status: 'PUBLISHED',
              isValidated: true,
              validatedAt: new Date().toISOString(),
              rejectionReason: undefined
            };
          } else {
            // Mise en brouillon → Le produit reste DRAFT mais devient validé
            // Le vendeur pourra le publier manuellement
            return {
              ...p,
              status: 'DRAFT',
              isValidated: true,
              validatedAt: new Date().toISOString(),
              rejectionReason: undefined
            };
          }
        } else {
          // Admin rejette le produit → Retour en brouillon non validé
          return {
            ...p,
            status: 'DRAFT',
            isValidated: false,
            validatedAt: undefined,
            rejectionReason: 'Produit rejeté par l\'admin'
          };
        }
      }
      return p;
    }));
    
    if (approved) {
      const product = demoProducts.find(p => p.id === productId);
      if (product?.postValidationAction === PostValidationAction.AUTO_PUBLISH) {
        toast.success('🎉 Produit validé et publié automatiquement !');
      } else {
        toast.success('✅ Produit validé ! Le vendeur peut maintenant le publier manuellement.');
      }
    } else {
      toast.error('❌ Produit rejeté par l\'admin');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🎯 Démo - Système de Validation Vendeur
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testez le nouveau système de choix de publication après validation admin
          </p>
        </div>

        {/* Demo Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            🎮 Contrôles de démonstration
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Validation Action Selector Demo */}
            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
                Sélecteur d'action de validation
              </h3>
              <ValidationActionSelector
                productId={999}
                currentAction={selectedAction}
                onActionChange={setSelectedAction}
              />
            </div>

            {/* Status Badges Demo */}
            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
                Badges de statut
              </h3>
              <div className="space-y-2">
                {demoProducts.map(product => (
                  <div key={product.id} className="flex items-center gap-3">
                    <ProductStatusBadge product={product} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {product.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Simulation Buttons */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
              🧪 Simulation admin
            </h3>
            <div className="flex gap-3">
              <Button
                onClick={() => simulateValidation(2, true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                ✅ Valider produit #2
              </Button>
              <Button
                onClick={() => simulateValidation(1, false)}
                variant="outline"
                className="text-red-600 hover:text-red-700"
              >
                ❌ Rejeter produit #1
              </Button>
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            📦 Produits de démonstration
          </h2>
          
          <div className="grid gap-6">
            {demoProducts.map(product => (
              <VendorProductCard
                key={product.id}
                product={product}
                onProductUpdated={handleProductUpdated}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
              />
            ))}
          </div>
        </div>

        {/* Publish Button Demo */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
            🚀 Bouton de publication manuelle
          </h3>
          <PublishValidatedProductButton
            productId={3}
            productName="Casquette brodée"
            onPublished={() => toast.success('Produit publié depuis la démo !')}
          />
        </div>

        {/* Documentation */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-medium mb-3 text-blue-900 dark:text-blue-100">
            📚 Guide d'utilisation
          </h3>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <p><strong>🚀 Publication automatique :</strong> Le produit sera publié immédiatement après validation</p>
            <p><strong>📝 Mise en brouillon :</strong> Le produit sera mis en brouillon après validation, vous pourrez le publier manuellement</p>
            <p><strong>⏳ En attente :</strong> Le produit attend la validation admin</p>
            <p><strong>✅ Validé :</strong> Le produit a été validé et est prêt selon votre choix</p>
            <p><strong>❌ Rejeté :</strong> Le produit a été rejeté par l'admin avec une raison</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 
 