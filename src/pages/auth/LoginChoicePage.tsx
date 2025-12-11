import React from 'react';
import { useNavigate } from 'react-router-dom';

const LoginChoicePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start px-3 sm:px-4 pt-1 sm:pt-2 pb-2 sm:pb-4 overflow-hidden">
      {/* Logo */}
      <div className="mb-8 flex justify-center">
        <img
          alt="Logo Printalma"
          className="h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 lg:h-48 lg:w-48 xl:h-56 xl:w-56 2xl:h-64 2xl:w-64 object-contain transition-all duration-200"
          src="/printalma_logo.svg"
        />
      </div>

      {/* Title */}
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center italic">
        Connectez-vous à Printalma
      </h2>

      {/* Subtitle */}
      <p className="text-sm sm:text-base text-gray-600 mb-12 text-center">
        Choisissez votre type de compte pour continuer
      </p>

      {/* Choice Cards */}
      <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Vendeur Card */}
        <div
          onClick={() => navigate('/vendeur/login')}
          className="bg-yellow-400 rounded-2xl p-8 cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <div className="text-center">
            {/* Vendor Icon */}
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-black mb-4">
              Espace Vendeur
            </h3>

            <p className="text-black mb-6">
              Accédez à votre boutique pour gérer vos designs, vos produits et suivre vos ventes
            </p>

            <div className="space-y-2 text-left bg-white bg-opacity-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-black font-medium">Gérer vos designs</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-black font-medium">Suivre vos commandes</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-black font-medium">Personnaliser vos produits</span>
              </div>
            </div>

            <button className="mt-6 bg-black hover:bg-gray-800 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200">
              Connexion Vendeur
            </button>
          </div>
        </div>

        {/* Admin Card */}
        <div
          onClick={() => navigate('/admin/login')}
          className="bg-red-500 rounded-2xl p-8 cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <div className="text-center">
            {/* Admin Icon */}
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 11-8 0v4h8z" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-white mb-4">
              Espace Admin
            </h3>

            <p className="text-white mb-6">
              Accès sécurisé pour administrer la plateforme, valider les designs et gérer les utilisateurs
            </p>

            <div className="space-y-2 text-left bg-white bg-opacity-10 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-white font-medium">Valider les designs</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-white font-medium">Gérer les vendeurs</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-white font-medium">Superviser les ventes</span>
              </div>
            </div>

            <button className="mt-6 bg-white hover:bg-gray-100 text-red-600 font-bold py-3 px-8 rounded-lg transition-colors duration-200">
              Connexion Admin
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Links */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-600 mb-4">
          Pas encore de compte ?
        </p>
        <div className="space-y-2">
          <button
            onClick={() => navigate('/vendeur/register')}
            className="block text-red-500 font-semibold hover:underline bg-transparent border-none cursor-pointer"
          >
            Devenir vendeur
          </button>
          <button
            onClick={() => navigate('/')}
            className="block text-gray-500 hover:underline bg-transparent border-none cursor-pointer text-sm"
          >
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginChoicePage;