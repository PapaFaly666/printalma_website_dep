import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PrintalmaRegister = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+221',
    password: '',
    confirmPassword: '',
    vendeur_type: 'DESIGNER',
    acceptTerms: false
  });

  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; email?: string; phone?: string; password?: string; confirmPassword?: string; vendeur_type?: string; acceptTerms?: string; submit?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errs: { firstName?: string; lastName?: string; email?: string; phone?: string; password?: string; confirmPassword?: string; vendeur_type?: string; acceptTerms?: string; submit?: string } = {};
    if (!formData.firstName.trim()) errs.firstName = 'Prénom requis';
    if (!formData.lastName.trim()) errs.lastName = 'Nom requis';
    if (!formData.email.trim()) errs.email = 'Email requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Email invalide';
    if (!formData.password) errs.password = 'Mot de passe requis';
    else if (formData.password.length < 8) errs.password = 'Minimum 8 caractères';
    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    if (!formData.vendeur_type) errs.vendeur_type = 'Type de vendeur requis';
    if (!formData.acceptTerms) errs.acceptTerms = 'Vous devez accepter les conditions';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3004'}/auth/register-vendeur`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          vendeur_type: formData.vendeur_type
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Votre compte a été créé. Il sera activé prochainement par le SuperAdmin.');
        navigate('/vendeur/login');
      } else {
        if (Array.isArray(data.message)) {
          setErrors({ submit: data.message.join(', ') });
        } else {
          setErrors({ submit: data.message || 'Erreur lors de l\'inscription' });
        }
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
      <div className="mb-2 sm:mb-4">
        <img
          alt="Logo Printalma"
          className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-32 lg:w-32 xl:h-36 xl:w-36 2xl:h-40 2xl:w-40 object-contain transition-all duration-200"
          src="/printalma_logo.svg"
        />
      </div>

      {/* Title */}
      <h2 className="text-lg sm:text-xl font-normal text-gray-900 mb-4 sm:mb-6 italic text-center">
        Remplir le formulaire
      </h2>

      {/* Form Card */}
      <div className="w-full max-w-xs sm:max-w-sm bg-yellow-400 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg mb-4 sm:mb-6">
        <div className="space-y-3 sm:space-y-4">
          {/* Prénom */}
          <div>
            <label htmlFor="firstName" className="block text-xs font-bold text-gray-900 mb-1">
              Prénom(s)
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-2 sm:px-3 py-2 sm:py-2.5 rounded-md border-0 focus:outline-none focus:ring-1 focus:ring-yellow-600 bg-yellow-50 text-xs sm:text-sm"
            />
            {errors.firstName && (
              <p className="text-red-700 text-xs mt-1">{errors.firstName}</p>
            )}
          </div>

          {/* Nom */}
          <div>
            <label htmlFor="lastName" className="block text-xs font-bold text-gray-900 mb-1">
              Nom
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-2 sm:px-3 py-2 sm:py-2.5 rounded-md border-0 focus:outline-none focus:ring-1 focus:ring-yellow-600 bg-yellow-50 text-xs sm:text-sm"
            />
            {errors.lastName && (
              <p className="text-red-700 text-xs mt-1">{errors.lastName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-gray-900 mb-1">
              E-mail
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-2 sm:px-3 py-2 sm:py-2.5 rounded-md border-0 focus:outline-none focus:ring-1 focus:ring-yellow-600 bg-yellow-50 text-xs sm:text-sm"
            />
            {errors.email && (
              <p className="text-red-700 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Numéro de téléphone */}
          <div>
            <label htmlFor="phone" className="block text-xs font-bold text-gray-900 mb-1">
              Téléphone
            </label>
            <div className="flex gap-1 sm:gap-2">
              <select
                name="countryCode"
                value={formData.countryCode}
                onChange={handleChange}
                className="w-16 sm:w-20 px-1 sm:px-2 py-2 sm:py-2.5 rounded-md border-0 focus:outline-none focus:ring-1 focus:ring-yellow-600 bg-yellow-50 text-xs sm:text-sm font-medium"
              >
                <option value="+221">+221</option>
                <option value="+33">+33</option>
                <option value="+1">+1</option>
                <option value="+44">+44</option>
              </select>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="flex-1 px-2 sm:px-3 py-2 sm:py-2.5 rounded-md border-0 focus:outline-none focus:ring-1 focus:ring-yellow-600 bg-yellow-50 text-xs sm:text-sm"
              />
            </div>
            {errors.phone && (
              <p className="text-red-700 text-xs mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Créer un mot de passe */}
          <div>
            <label htmlFor="password" className="block text-xs font-bold text-gray-900 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-2 sm:px-3 py-2 sm:py-2.5 rounded-md border-0 focus:outline-none focus:ring-1 focus:ring-yellow-600 bg-yellow-50 text-xs sm:text-sm"
              placeholder="• • • • • • • •"
            />
            {errors.password && (
              <p className="text-red-700 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* Type de vendeur */}
          <div>
            <label htmlFor="vendeur_type" className="block text-xs font-bold text-gray-900 mb-1">
              Type de vendeur
            </label>
            <select
              id="vendeur_type"
              name="vendeur_type"
              value={formData.vendeur_type}
              onChange={handleChange}
              className="w-full px-2 sm:px-3 py-2 sm:py-2.5 rounded-md border-0 focus:outline-none focus:ring-1 focus:ring-yellow-600 bg-yellow-50 text-xs sm:text-sm"
            >
              <option value="">Choisissez un type</option>
              <option value="DESIGNER">Designer</option>
              <option value="ARTISTE">Artiste</option>
              <option value="INFLUENCEUR">Influenceur</option>
            </select>
            {errors.vendeur_type && (
              <p className="text-red-700 text-xs mt-1">{errors.vendeur_type}</p>
            )}
          </div>

          {/* Confirmer mot de passe */}
          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-bold text-gray-900 mb-1">
              Confirmer mot de passe
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-2 sm:px-3 py-2 sm:py-2.5 rounded-md border-0 focus:outline-none focus:ring-1 focus:ring-yellow-600 bg-yellow-50 text-xs sm:text-sm"
              placeholder="• • • • • • • •"
            />
            {errors.confirmPassword && (
              <p className="text-red-700 text-xs mt-1">{errors.confirmPassword}</p>
            )}
          </div>
        </div>
      </div>

      {/* Checkbox Terms - Outside card */}
      <div className="w-full max-w-xs sm:max-w-sm mb-2 sm:mb-3">
        <div className="flex items-start gap-2">
          <div className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 mt-0.5 bg-red-500 rounded flex-shrink-0">
            <input
              type="checkbox"
              id="acceptTerms"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleChange}
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 border-0 rounded-sm text-white focus:ring-0 cursor-pointer"
            />
          </div>
          <label htmlFor="acceptTerms" className="text-xs text-gray-700 leading-tight">
            J'accepte les{' '}
            <a href="#" className="text-blue-500 underline">
              Conditions
            </a>{' '}
            et la{' '}
            <a href="#" className="text-blue-500 underline">
              Politique
            </a>{' '}
            de Printalma.
          </label>
        </div>
        {errors.acceptTerms && (
          <p className="text-red-700 text-xs mt-1 ml-6 sm:ml-7">{errors.acceptTerms}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full max-w-xs sm:max-w-sm bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-bold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors duration-200 shadow-md mb-2 sm:mb-3 text-sm disabled:cursor-not-allowed"
      >
        {isLoading ? 'Inscription...' : 'Je m\'enregistre'}
      </button>

      {/* Error Message */}
      {errors.submit && (
        <div className="w-full max-w-xs sm:max-w-sm mb-3">
          <p className="text-red-700 text-xs text-center">{errors.submit}</p>
        </div>
      )}

      {/* Login Link */}
      <p className="text-xs text-gray-600 text-center">
        Vous avez déjà un compte ?{' '}
        <button
          onClick={() => navigate('/login')}
          className="text-red-500 font-semibold hover:underline bg-transparent border-none cursor-pointer text-xs"
        >
          Connectez-vous
        </button>
      </p>
    </div>
  );
};

export default PrintalmaRegister;