import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VendorLoginMethodsPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleGoogleLogin = () => {
    setIsLoading('google');
    // Implémenter la connexion Google ici
    console.log('Connexion avec Google');
    // Pour l'instant, rediriger vers la page de connexion classique
    setTimeout(() => {
      navigate('/vendeur/login-classic');
    }, 1000);
  };

  const handleAppleLogin = () => {
    setIsLoading('apple');
    // Implémenter la connexion Apple ici
    console.log('Connexion avec Apple');
    // Pour l'instant, rediriger vers la page de connexion classique
    setTimeout(() => {
      navigate('/vendeur/login-classic');
    }, 1000);
  };

  const handleEmailLogin = () => {
    navigate('/vendeur/register');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Login Form */}
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <img
              alt="Logo Printalma"
              className="h-32 w-32 sm:h-40 sm:w-40 md:h-48 md:w-48 lg:h-56 lg:w-56 xl:h-64 xl:w-64 2xl:h-72 2xl:w-72 object-contain transition-all duration-200"
              src="/printalma_logo.svg"
            />
          </div>

          {/* Title */}
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 text-center">
            Créer votre boutique
          </h2>
          <p className="text-sm text-gray-600 mb-8">
            Inscrivez-vous avec des comptes existants pour que la<br />
            procédure soit plus rapide
          </p>

          {/* Login Methods */}
          <div className="space-y-3 mb-6">
            {/* Google and Apple Buttons Row */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading === 'google'}
                className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm">Google</span>
              </button>

              <button
                onClick={handleAppleLogin}
                disabled={isLoading === 'apple'}
                className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.39-1.09-.5-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.39C5.38 16.49 4.1 13 5.54 9.03c.71-1.97 2.11-3 3.57-3.02 1.27-.02 2.31.87 3.08.87.77 0 1.91-.87 3.39-.75 1.36.06 2.44.7 3.04 1.88-2.86 1.66-2.16 5.33.72 6.3-.6 1.68-1.31 2.88-2.29 3.97zM12.03 7.25c.15-1.72 1.28-2.94 2.86-3.06.13 1.77-1.42 3.13-2.86 3.06z"/>
                </svg>
                <span className="text-sm">Apple</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">ou</span>
              </div>
            </div>

            {/* Email Login Button */}
            <button
              onClick={handleEmailLogin}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-4 rounded-lg transition-all duration-200"
            >
              S'inscrire via E-mail
            </button>
          </div>

          {/* Register Link */}
          <p className="text-sm text-gray-600 text-center mt-6">
            Vous avez déjà un compte ?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-red-500 font-semibold hover:underline bg-transparent border-none cursor-pointer"
            >
              Se connecter
            </button>
          </p>
        </div>

        {/* Right Side - Illustration */}
        <div className="hidden lg:flex items-center justify-center h-full">
          <div className="bg-yellow-400 rounded-3xl p-12 w-full max-w-lg relative overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 opacity-10">
              <img src="/Asset 33.svg" alt="Background pattern" className="w-full h-full object-cover" />
            </div>

            {/* Content */}
            <div className="relative z-10">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold italic text-black mb-2">
                  Lorem ipsum dolor sit<br />amet, consectuer
                </h3>
              </div>

          {/* Isometric Icons Grid */}
            <div className="relative h-[500px] flex items-center justify-center">
              {/* Asset 26.svg - Center Main (Plus grand) */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full w-56 h-56 flex items-center justify-center z-10">
                <img src="/Asset 26.svg" alt="Asset 26" className="w-40 h-40 object-contain" />
              </div>

              {/* Asset 30.svg - Top Left */}
              <div className="absolute top-12 left-8 rounded-full w-28 h-28 flex items-center justify-center">
                <img src="/Asset 30.svg" alt="Asset 30" className="w-20 h-20 object-contain" />
              </div>

              {/* Asset 27.svg - Top Right */}
              <div className="absolute top-12 right-8 rounded-full w-32 h-32 flex items-center justify-center">
                <img src="/Asset 27.svg" alt="Asset 27" className="w-24 h-24 object-contain" />
              </div>

              {/* Asset 29.svg - Middle Left */}
              <div className="absolute top-1/2 -left-8 transform -translate-y-1/2 -translate-y-4 rounded-full w-32 h-32 flex items-center justify-center">
                <img src="/Asset 29.svg" alt="Asset 29" className="w-24 h-24 object-contain" />
              </div>

              {/* Asset 31.svg - Middle Right (petit) */}
              <div className="absolute top-1/2 -right-8 transform -translate-y-1/2 -translate-y-4 w-28 h-28 flex items-center justify-center">
                <img src="/Asset 31.svg" alt="Asset 31" className="w-20 h-20 object-contain" />
              </div>

              {/* Asset 28.svg - Bottom Center */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 rounded-full w-32 h-32 flex items-center justify-center">
                <img src="/Asset 28.svg" alt="Asset 28" className="w-24 h-24 object-contain" />
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorLoginMethodsPage;