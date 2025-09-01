import React, { useState } from 'react';
import AutoValidationControls from '../../components/admin/AutoValidationControls';
import AutoValidationStats from '../../components/admin/AutoValidationStats';
import { AutoValidationResult } from '../../services/autoValidationService';

const AutoValidationDashboard: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleValidationComplete = (result: AutoValidationResult) => {
    // Rafraîchir les statistiques après une auto-validation
    setRefreshTrigger(prev => prev + 1);
    
    // Afficher une notification de succès (vous pouvez utiliser votre système de notifications)
    if (result.success && result.data.updatedProducts.length > 0) {
      console.log(`✅ ${result.data.updatedProducts.length} produit(s) auto-validé(s) avec succès !`);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🤖</span>
          <h1 className="text-3xl font-bold text-gray-900">
            Tableau de Bord Auto-validation
          </h1>
        </div>
        <p className="text-gray-600">
          Gérez la validation automatique des produits vendeur basée sur l'approbation des designs.
        </p>
      </div>

      {/* Statistiques */}
      <div className="mb-8">
        <AutoValidationStats 
          refreshTrigger={refreshTrigger}
          className="w-full"
        />
      </div>

      {/* Contrôles d'auto-validation */}
      <div className="mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xl">⚡</span>
            <h2 className="text-xl font-semibold text-gray-900">
              Actions d'Auto-validation
            </h2>
          </div>
          
          <AutoValidationControls 
            onValidationComplete={handleValidationComplete}
            className="w-full"
          />
        </div>
      </div>

      {/* Guide d'utilisation */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <span className="text-xl mt-1">📚</span>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Guide d'Utilisation
            </h3>
            
            <div className="space-y-3 text-blue-800">
              <div className="flex items-start gap-2">
                <span className="font-medium min-w-0">1.</span>
                <p>
                  <strong>Validation des Designs :</strong> Lorsqu'un administrateur valide un design 
                  dans la section "Validation des Designs", le système vérifie automatiquement si 
                  tous les designs du produit vendeur sont validés.
                </p>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="font-medium min-w-0">2.</span>
                <p>
                  <strong>Auto-validation :</strong> Si tous les designs d'un produit sont validés, 
                  le produit vendeur est automatiquement marqué comme validé avec 
                  <code className="bg-blue-100 px-1 rounded">validatedBy = -1</code>.
                </p>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="font-medium min-w-0">3.</span>
                <p>
                  <strong>Validation Manuelle :</strong> Utilisez le bouton "Auto-valider tous les produits éligibles" 
                  pour déclencher manuellement la vérification de tous les produits.
                </p>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="font-medium min-w-0">4.</span>
                <p>
                  <strong>Monitoring :</strong> Les statistiques ci-dessus vous donnent un aperçu 
                  de l'efficacité du système d'auto-validation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoValidationDashboard;