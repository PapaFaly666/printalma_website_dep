import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLoginPage = () => {
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

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3004/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Vérifier si l'utilisateur est bien un admin
        if (data.user.role === 'ADMIN' || data.user.role === 'SUPER_ADMIN') {
          navigate('/admin/dashboard');
        } else {
          setErrors({ submit: 'Accès réservé aux administrateurs' });
        }
      } else {
        setErrors({ submit: data.message || 'Email ou mot de passe incorrect' });
      }
    } catch (error) {
      setErrors({ submit: 'Erreur de connexion au serveur' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start px-3 sm:px-4 pt-1 sm:pt-2 pb-2 sm:pb-4 overflow-hidden">
      {/* Logo */}
      <div className="mb-4 sm:mb-6">
        <img
          alt="Logo Printalma"
          className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-32 lg:w-32 xl:h-36 xl:w-36 2xl:h-40 2xl:w-40 object-contain transition-all duration-200"
          src="/printalma_logo.svg"
        />
      </div>

      {/* Title */}
      <h2 className="text-lg sm:text-xl font-normal text-gray-900 mb-6 sm:mb-8 italic text-center">
        Connexion Administrateur
      </h2>

      {/* Warning Badge */}
      <div className="w-full max-w-xs sm:max-w-sm mb-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg text-xs sm:text-sm text-center">
          <span className="font-bold">⚠️ Accès Sécurisé</span>
          <br />
          Réservé au personnel autorisé
        </div>
      </div>

      {/* Login Form Card */}
      <div className="w-full max-w-xs sm:max-w-sm bg-red-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg mb-4 sm:mb-6">
        <div className="space-y-4 sm:space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-white mb-1">
              Email Administrateur
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-2 sm:px-3 py-2 sm:py-2.5 rounded-md border-0 focus:outline-none focus:ring-1 focus:ring-red-600 bg-white text-xs sm:text-sm"
              placeholder="admin@printalma.com"
            />
            {errors.email && (
              <p className="text-white text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-xs font-bold text-white mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-2 sm:px-3 py-2 sm:py-2.5 rounded-md border-0 focus:outline-none focus:ring-1 focus:ring-red-600 bg-white text-xs sm:text-sm pr-10"
                placeholder="• • • • • • • •"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
              >
                {showPassword ? (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-white text-xs mt-1">{errors.password}</p>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full max-w-xs sm:max-w-sm bg-black hover:bg-gray-800 disabled:bg-gray-600 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors duration-200 shadow-md mb-2 sm:mb-3 text-sm disabled:cursor-not-allowed"
      >
        {isLoading ? 'Connexion...' : 'Connexion Admin'}
      </button>

      {/* Error Message */}
      {errors.submit && (
        <div className="w-full max-w-xs sm:max-w-sm mb-3">
          <p className="text-red-700 text-xs text-center bg-red-100 p-2 rounded">{errors.submit}</p>
        </div>
      )}

      {/* Security Info */}
      <div className="w-full max-w-xs sm:max-w-sm">
        <p className="text-xs text-gray-500 text-center">
          <span className="font-semibold">Sécurité :</span> Toutes les connexions sont enregistrées
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;