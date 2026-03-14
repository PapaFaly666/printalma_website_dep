import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string; submit?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errs: { email?: string; password?: string; submit?: string } = {};
    if (!formData.email.trim()) errs.email = 'Email requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Email invalide';
    if (!formData.password) errs.password = 'Mot de passe requis';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    console.log('🔐 Tentative de connexion avec:', formData.email);
    setIsLoading(true);

    try {
      // Nettoyer toute authentification précédente pour éviter les conflits
      localStorage.removeItem('auth_session');
      localStorage.removeItem('user');
      console.log('🧹 Nettoyage du localStorage effectué');

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3004'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important pour inclure les cookies
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();
      console.log('📡 Réponse API:', {
        status: response.status,
        ok: response.ok,
        user: data.user,
        message: data.message
      });

      if (response.ok) {
        // ✅ Vérifier si l'utilisateur doit changer son mot de passe (première connexion)
        // Cas 1: user existe avec must_change_password
        // Si pas d'utilisateur ou rôle inconnu : erreur générique (couvre OTP, admin, etc.)
        if (!data.user) {
          setErrors({ submit: 'Email ou mot de passe incorrect' });
          setIsLoading(false);
          return;
        }

        // Dès ici on a data.user — vérifier que c'est un vendeur avant tout
        if (data.user.role !== 'VENDEUR') {
          localStorage.removeItem('auth_session');
          localStorage.removeItem('user');
          setErrors({ submit: 'Email ou mot de passe incorrect' });
          setIsLoading(false);
          return;
        }

        // Vendeur avec changement de mot de passe obligatoire
        if (data.user.must_change_password) {
          localStorage.setItem('tempUserId', data.user.id.toString());
          localStorage.setItem('user', JSON.stringify(data.user));
          window.location.href = '/change-password';
          return;
        }

        // Stocker la session vendeur et rediriger
        localStorage.setItem('auth_session', JSON.stringify({
          timestamp: Date.now(),
          user: data.user,
          isAuthenticated: true
        }));
        localStorage.setItem('user', JSON.stringify(data.user));

        if (data.user.status === false) {
          window.location.href = '/vendeur/pending';
        } else {
          window.location.href = '/vendeur/dashboard';
        }
      } else {
        console.log('❌ Erreur de connexion:', data.message);
        setErrors({ submit: data.message || 'Email ou mot de passe incorrect' });
      }
    } catch (error) {
      console.error('💥 Erreur technique lors de la connexion:', error);
      setErrors({ submit: 'Erreur de connexion au serveur' });
    } finally {
      setIsLoading(false);
      console.log('🏁 Fin de la tentative de connexion');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Login Form */}
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="mb-10 flex justify-center">
            <img
              alt="Logo Printalma"
              className="h-16 w-auto object-contain"
              src="/printalma_logo.svg"
            />
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center italic">
            Rebonjour !
          </h2>
          <p className="text-sm text-gray-600 mb-8 text-center">
            Entrez vos identifiants pour continuer
          </p>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 text-sm placeholder-gray-400"
                placeholder="Entrer votre email"
              />
              {errors.email && (
                <p className="text-red-600 text-xs mt-1.5">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gray-50 text-sm pr-12 placeholder-gray-400"
                  placeholder="• • • • • • • •"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-xs mt-1.5">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-yellow-400 focus:ring-yellow-400 focus:ring-2 cursor-pointer"
                  defaultChecked
                />
                <span className="ml-2 text-gray-700">Se souvenir de moi</span>
              </label>
              <button
                type="button"
                className="text-gray-600 hover:text-gray-900 font-medium bg-transparent border-none cursor-pointer"
              >
                Mot de passe oublié?
              </button>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="w-full">
                <p className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">{errors.submit}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 text-black font-bold py-3.5 px-6 rounded-lg transition-all duration-200 text-sm disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          {/* Register Link */}
          <p className="text-sm text-gray-600 text-center mt-6">
            Vous n'avez pas encore de compte ?{' '}
            <button
              onClick={() => navigate('/vendeur/register')}
              className="text-blue-500 font-semibold hover:underline bg-transparent border-none cursor-pointer"
            >
              S'inscrire
            </button>
          </p>

          {/* Bottom Links */}
          <div className="w-full mt-6">
            <button
              onClick={() => navigate('/')}
              className="text-gray-500 text-sm hover:text-gray-700 bg-transparent border-none cursor-pointer w-full transition-colors"
            >
              ← Retour à l'accueil
            </button>
          </div>
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
                  Lorem ipsum dolor sit amet, consectuer
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

export default LoginForm; 