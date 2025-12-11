import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { ButtonLoading } from '../ui/loading';
import { Eye, EyeOff, Lock, AlertTriangle, CheckCircle } from 'lucide-react';
import authService from '../../services/auth.service';
import { useAuth } from '../../contexts/AuthContext';

interface ChangePasswordFormProps {
  mustChangePassword?: boolean;
  userId?: number;
  onSuccess?: () => void;
}

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  mustChangePassword = false, 
  userId,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const navigate = useNavigate();
  const { checkAuth } = useAuth();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      setError('Le mot de passe actuel est requis');
      return false;
    }

    if (!formData.newPassword) {
      setError('Le nouveau mot de passe est requis');
      return false;
    }

    if (formData.newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }

    if (formData.currentPassword === formData.newPassword) {
      setError('Le nouveau mot de passe doit être différent de l\'ancien');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');

    try {
      if (mustChangePassword && userId) {
        // 🆕 Utiliser le nouvel endpoint pour changement obligatoire
        await authService.forceChangePassword(
          userId,
          formData.currentPassword,
          formData.newPassword,
          formData.confirmPassword
        );
        
        // Vérifier l'authentification après changement réussi
        await checkAuth();
        
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/dashboard');
        }
      } else {
        // ✅ Utiliser l'endpoint normal pour utilisateurs connectés
        await authService.changePassword({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword
        });
        
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            {mustChangePassword ? (
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            ) : (
              <Lock className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {mustChangePassword ? 'Changement de mot de passe obligatoire' : 'Changer le mot de passe'}
          </CardTitle>
          {mustChangePassword && (
            <p className="text-sm text-gray-600 mt-2">
              Pour des raisons de sécurité, vous devez définir un nouveau mot de passe avant de continuer.
            </p>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mot de passe actuel */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe actuel
              </label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  required
                  className="pr-10"
                  placeholder="Entrez votre mot de passe actuel"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Nouveau mot de passe */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  required
                  minLength={8}
                  className="pr-10"
                  placeholder="Au moins 8 caractères"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirmer nouveau mot de passe */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  required
                  minLength={8}
                  className="pr-10"
                  placeholder="Confirmez votre nouveau mot de passe"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Conseils de sécurité */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Conseils pour un mot de passe sécurisé :</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Au moins 8 caractères</li>
                <li>• Mélangez majuscules et minuscules</li>
                <li>• Incluez des chiffres et des symboles</li>
                <li>• Évitez les mots du dictionnaire</li>
              </ul>
            </div>

            {/* Bouton de soumission */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-black hover:bg-gray-800 text-white"
            >
              {loading ? (
                <ButtonLoading message="Changement en cours..." />
              ) : (
                'Changer le mot de passe'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangePasswordForm; 