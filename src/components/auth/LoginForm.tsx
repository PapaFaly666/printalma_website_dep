import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ButtonLoading } from '../ui/loading';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Shield } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';

const LoginForm: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Récupérer la page de destination après connexion
  const from = (location.state as any)?.from?.pathname || '/';

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Format d\'email invalide';
    }

    if (!formData.password) {
      errors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Effacer l'erreur pour ce champ si elle existe
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Effacer l'erreur globale
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await login(formData);
      
      if (result.success) {
        // Connexion réussie - redirection vers la page demandée ou dashboard
        const redirectTo = from === '/login' ? '/dashboard' : from;
        navigate(redirectTo, { replace: true });
      } else if (result.mustChangePassword) {
        // Redirection vers le changement de mot de passe obligatoire
        navigate('/change-password', { replace: true });
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
    }
  };

  // 🎨 Fonction pour extraire les tentatives restantes du message
  const extractRemainingAttempts = (message: string): number | null => {
    if (!message) return null;
    const match = message.match(/Il vous reste (\d+) tentative/);
    return match ? parseInt(match[1]) : null;
  };

  // 🎨 Fonction pour détecter si c'est la dernière tentative
  const isLastAttempt = (message: string): boolean => {
    return message?.includes('Dernière tentative') || message?.includes('dernière tentative') || false;
  };

  // 🎨 Fonction pour détecter si le compte est verrouillé
  const isAccountLocked = (message: string): boolean => {
    return message?.includes('verrouillé') || message?.includes('Temps restant') || false;
  };

  // 🎯 Composant d'indicateur simple des tentatives
  const SimpleAttemptsIndicator: React.FC<{ remaining: number }> = ({ remaining }) => (
    <div className="mt-3 flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-sm text-orange-800">Tentatives restantes</span>
        <span className="text-lg font-bold text-orange-900">{remaining}/5</span>
      </div>
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < remaining ? 'bg-green-400' : 'bg-red-400'
            }`}
          />
        ))}
      </div>
    </div>
  );

  // 🎨 Déterminer le type d'alerte
  const getAlertType = (): 'warning' | 'critical' | 'locked' | 'default' => {
    if (!error) return 'default';
    
    if (isAccountLocked(error)) return 'locked';
    if (isLastAttempt(error)) return 'critical';
    if (extractRemainingAttempts(error) !== null) return 'warning';
    return 'default';
  };

  const alertType = getAlertType();
  const remainingAttempts = extractRemainingAttempts(error || '');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Header simple et moderne */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">P</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">PrintAlma</h2>
          <p className="mt-2 text-sm text-gray-600">Connectez-vous à votre compte</p>
        </div>

        {/* Form Card */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Connexion</CardTitle>
            <CardDescription className="text-center">
              Entrez vos identifiants pour continuer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* 🎨 Message d'erreur moderne et simple */}
              {error && (
                <div className="space-y-3">
                  <Alert className={`border-l-4 ${
                    alertType === 'locked' ? 'border-red-500 bg-red-50' :
                    alertType === 'critical' ? 'border-orange-500 bg-orange-50' :
                    alertType === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                    'border-gray-500 bg-gray-50'
                  }`}>
                    <div className="flex items-start gap-3">
                      {alertType === 'locked' ? (
                        <Shield className="h-5 w-5 text-red-600 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                      )}
                      <AlertDescription className={`text-sm font-medium ${
                        alertType === 'locked' ? 'text-red-800' :
                        alertType === 'critical' ? 'text-orange-800' :
                        alertType === 'warning' ? 'text-yellow-800' :
                        'text-gray-800'
                      }`}>
                        {error}
                      </AlertDescription>
                    </div>
                  </Alert>
                  
                  {/* Indicateur simple des tentatives */}
                  {remainingAttempts !== null && (
                    <SimpleAttemptsIndicator remaining={remainingAttempts} />
                  )}
                  
                  {/* Message spécial pour la dernière tentative */}
                  {isLastAttempt(error) && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800 font-medium">
                        ⚠️ Attention ! Une tentative incorrecte de plus verrouillera votre compte.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Champ Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`pl-10 ${formErrors.email ? 'border-red-500' : ''}`}
                    placeholder="votre.email@exemple.com"
                  />
                </div>
                {formErrors.email && (
                  <p className="text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>

              {/* Champ Mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`pl-10 pr-10 ${formErrors.password ? 'border-red-500' : ''}`}
                    placeholder="Votre mot de passe"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {formErrors.password && (
                  <p className="text-sm text-red-600">{formErrors.password}</p>
                )}
              </div>

              {/* Bouton de connexion moderne */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-black hover:bg-gray-800 text-white py-3 text-base font-medium transition-all duration-200"
              >
                {loading ? (
                  <ButtonLoading message="Connexion..." />
                ) : (
                  'Se connecter'
                )}
              </Button>

              {/* Lien mot de passe oublié */}
              <div className="text-center">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-gray-600 hover:text-black transition-colors underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer simple */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            PrintAlma © 2024 - Connexion sécurisée
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm; 