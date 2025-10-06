import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Loader2, Store, Eye, EyeOff, Mail, Lock } from 'lucide-react';

/**
 * Page de connexion dédiée aux vendeurs.
 * Visuel différent de LoginForm pour reflet "espace vendeur".
 */
const VendorLoginPage: React.FC = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/vendeur/dashboard';

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.email) errors.email = "L'email est requis";
    if (!formData.password) errors.password = 'Mot de passe requis';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const res = await login(formData);
    if (res.success) {
      navigate(from, { replace: true });
    } else if (error && error.includes('en attente d\'activation')) {
      setPending(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10 animate-fade-in-up">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-black flex items-center justify-center shadow-lg">
          <Store className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-1">
          Espace Vendeur
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Connectez-vous pour gérer vos produits et vos ventes
        </p>
      </div>

      {/* Form Card */}
      <Card className="w-full max-w-md shadow-md animate-fade-in-up delay-150">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl text-center">Connexion vendeur</CardTitle>
          <CardDescription className="text-center">
            Entrez vos identifiants pour continuer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && !pending && (
            <div className="mb-4 text-sm text-red-600 text-center" role="alert">
              {error}
            </div>
          )}
          {pending && (
            <div className="mb-4 text-sm text-orange-600 text-center" role="alert">
              ⏳ Votre compte est en attente d'activation par le SuperAdmin.
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`pl-10 ${formErrors.email ? 'border-red-500' : ''}`}
                  placeholder="votre.email@exemple.com"
                />
              </div>
              {formErrors.email && <p className="text-xs text-red-600">{formErrors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
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
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </Button>
              </div>
              {formErrors.password && <p className="text-xs text-red-600">{formErrors.password}</p>}
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-black hover:bg-gray-800 text-white py-3 text-base font-medium">
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Se connecter'}
            </Button>
          </form>

          <div className="text-center mt-4">
            <Link to="/forgot-password" className="text-sm text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white">
              Mot de passe oublié ?
            </Link>
            <p className="text-xs text-gray-500 mt-2">
              Pas encore de compte ?{' '}
              <Link to="/vendeur/register" className="underline hover:text-black dark:hover:text-white">
                S'inscrire
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorLoginPage; 