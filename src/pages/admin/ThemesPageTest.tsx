import React from 'react';

const ThemesPageTest: React.FC = () => {
  console.log('🧪 ThemesPageTest - Composant de test chargé');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            🧪 Test ThemesPage
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Ceci est un composant de test pour vérifier que le routage fonctionne.
          </p>
          
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <strong>✅ Succès!</strong> Le composant se charge correctement.
          </div>
          
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            <strong>📋 Informations:</strong>
            <ul className="text-left mt-2">
              <li>• Route: /admin/themes</li>
              <li>• Composant: ThemesPageTest</li>
              <li>• État: Fonctionnel</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemesPageTest; 