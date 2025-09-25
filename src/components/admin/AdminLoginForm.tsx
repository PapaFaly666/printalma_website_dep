import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Eye, EyeOff, User, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { adminAuthService, AdminLoginRequest } from '../../services/AdminAuthService';
import { toast } from 'sonner';

interface AdminLoginFormProps {
  onLoginSuccess?: (admin: any) => void;
  onLoginError?: (error: string) => void;
}

export const AdminLoginForm: React.FC<AdminLoginFormProps> = ({
  onLoginSuccess,
  onLoginError
}) => {
  const [formData, setFormData] = useState<AdminLoginRequest>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<'idle' | 'checking' | 'authenticated' | 'error'>('idle');
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    console.log('🚀 Tentative de connexion admin...');

    try {
      const response = await adminAuthService.login(formData);

      console.log('✅ Connexion réussie:', response);
      toast.success('Connexion réussie !');

      if (response.data?.admin) {
        setCurrentAdmin(response.data.admin);
        onLoginSuccess?.(response.data.admin);
      }

      // Nettoyer le formulaire
      setFormData({ email: '', password: '' });

    } catch (error: any) {
      console.error('❌ Erreur de connexion:', error);
      toast.error(error.message || 'Erreur de connexion');
      onLoginError?.(error.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const checkAuthStatus = async () => {
    setAuthStatus('checking');
    try {
      const admin = await adminAuthService.checkAuthStatus();
      if (admin) {
        setAuthStatus('authenticated');
        setCurrentAdmin(admin);
        toast.success('Déjà connecté en tant qu\'admin');
      } else {
        setAuthStatus('error');
        setCurrentAdmin(null);
      }
    } catch (error) {
      setAuthStatus('error');
      setCurrentAdmin(null);
      console.error('Erreur check auth:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await adminAuthService.logout();
      setCurrentAdmin(null);
      setAuthStatus('idle');
      toast.success('Déconnexion réussie');
    } catch (error: any) {
      toast.error(error.message || 'Erreur de déconnexion');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <User className="h-6 w-6 text-blue-600" />
              Connexion Admin
            </CardTitle>
            <CardDescription className="text-center">
              Connectez-vous pour accéder au panel administrateur
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Test de connexion actuelle */}
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={checkAuthStatus}
                disabled={authStatus === 'checking'}
              >
                {authStatus === 'checking' ? 'Vérification...' : 'Vérifier la connexion actuelle'}
              </Button>

              {authStatus === 'authenticated' && currentAdmin && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Connecté</span>
                  </div>
                  <p className="text-sm text-green-700">
                    {currentAdmin.firstName} {currentAdmin.lastName}
                  </p>
                  <p className="text-xs text-green-600">{currentAdmin.email}</p>
                  <Badge className="mt-2 bg-green-100 text-green-800 border-green-300">
                    {currentAdmin.role || 'Admin'}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleLogout}
                    className="mt-2 w-full"
                  >
                    Se déconnecter
                  </Button>
                </div>
              )}

              {authStatus === 'error' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Non connecté</span>
                  </div>
                  <p className="text-sm text-red-700">Aucune session admin active</p>
                </div>
              )}
            </div>

            {/* Formulaire de connexion */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email administrateur</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@printalma.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <motion.div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Connexion...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Se connecter
                  </>
                )}
              </Button>
            </form>

            {/* Informations de debug */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>🍪 Cookies: {document.cookie ? 'Présents' : 'Aucun'}</p>
              <p>🌐 Endpoint: /api/admin/login</p>
              <p>🔒 Auth: Cookies HTTP-Only</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminLoginForm;