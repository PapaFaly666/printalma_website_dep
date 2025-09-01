import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import passwordResetService from '../../services/passwordResetService';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState<{ email: string; name: string } | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Vérifier le token au chargement
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Token de réinitialisation manquant');
        setVerifying(false);
        return;
      }

      try {
        const result = await passwordResetService.verifyResetToken(token);
        setTokenValid(true);
        setUserInfo({ email: result.userEmail, name: result.userName });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Token invalide');
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push('Au moins 8 caractères');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Au moins une majuscule');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Au moins une minuscule');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Au moins un chiffre');
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation côté client
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    const passwordErrors = validatePassword(formData.newPassword);
    if (passwordErrors.length > 0) {
      setError(`Mot de passe invalide: ${passwordErrors.join(', ')}`);
      setLoading(false);
      return;
    }

    try {
      const result = await passwordResetService.resetPassword(
        token!,
        formData.newPassword,
        formData.confirmPassword
      );
      setSuccess(result.message);
      
      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Mot de passe réinitialisé. Vous pouvez vous connecter.' }
        });
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // État de chargement
  if (verifying) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Vérification du token...</p>
          </div>
        </div>
      </div>
    );
  }

  // Token invalide
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Token invalide
              </h1>
              <p className="text-gray-600">
                Le lien de réinitialisation est expiré ou invalide
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>

            <div className="space-y-3">
              <Link to="/forgot-password">
                <Button className="w-full bg-black hover:bg-gray-800 text-white">
                  Demander un nouveau lien
                </Button>
              </Link>
              
              <Link to="/login">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Succès
  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Mot de passe réinitialisé
              </h1>
              <p className="text-gray-600">
                Votre mot de passe a été mis à jour avec succès
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 text-sm">{success}</p>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Redirection vers la page de connexion...
              </p>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Formulaire de réinitialisation
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-gray-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Nouveau mot de passe
            </h1>
            <p className="text-gray-600">
              Définissez votre nouveau mot de passe
            </p>
          </div>

          {/* Informations utilisateur */}
          {userInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="text-sm">
                <p className="font-medium text-blue-900">Compte : {userInfo.name}</p>
                <p className="text-blue-700">{userInfo.email}</p>
              </div>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nouveau mot de passe */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  placeholder="Minimum 8 caractères"
                  disabled={loading}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors disabled:bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirmer mot de passe */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Retapez le mot de passe"
                  disabled={loading}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors disabled:bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Messages d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Bouton de soumission */}
            <Button
              type="submit"
              disabled={loading || !formData.newPassword || !formData.confirmPassword}
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Réinitialisation...
                </div>
              ) : (
                'Réinitialiser le mot de passe'
              )}
            </Button>
          </form>

          {/* Conseils de sécurité */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              💡 Conseils pour un mot de passe fort
            </h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Au moins 8 caractères</li>
              <li>• Mélangez majuscules, minuscules, chiffres et symboles</li>
              <li>• Évitez les mots du dictionnaire</li>
              <li>• N'utilisez pas d'informations personnelles</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 