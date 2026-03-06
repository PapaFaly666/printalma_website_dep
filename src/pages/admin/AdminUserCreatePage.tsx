import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Shield,
  ArrowLeft,
  Check,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import Button from '../../components/ui/Button';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import rolesService, { CustomRole } from '../../services/rolesService';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../contexts/AuthContext';

const AdminUserCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [availableRoles, setAvailableRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    roleId: '',
    role: 'ADMIN' as 'ADMIN' | 'MODERATEUR' | 'SUPPORT' | 'COMPTABLE',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const roles = await rolesService.getAllRoles();
      // Filtrer pour n'afficher que les rôles admin (pas VENDEUR)
      const adminRoles = roles.filter(r =>
        r.slug !== 'vendeur' && (user?.role === 'SUPERADMIN' || r.slug !== 'superadmin')
      );
      setAvailableRoles(adminRoles);
    } catch (err: any) {
      console.error('Erreur chargement rôles:', err);
      setError('Erreur lors du chargement des rôles disponibles');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'Le prénom est requis';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Le nom est requis';
    }

    if (!formData.email.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email invalide';
    }

    if (!formData.password) {
      errors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (!formData.roleId) {
      errors.roleId = 'Veuillez sélectionner un rôle';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setCreating(true);
      setError(null);

      // Préparer les données selon le format attendu par le backend
      const userData = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        password: formData.password,
        roleId: parseInt(formData.roleId),
        status: 'ACTIVE',
      };

      // Appeler l'endpoint de création d'utilisateur
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3004'}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création de l\'utilisateur');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/admin/users');
      }, 2000);
    } catch (err: any) {
      console.error('Erreur création utilisateur:', err);
      setError(err.message || 'Erreur lors de la création de l\'utilisateur');
    } finally {
      setCreating(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRoleSelect = (roleId: string) => {
    const role = availableRoles.find(r => r.id === parseInt(roleId));
    if (role) {
      // Mapper le slug vers l'enum Role
      let roleEnum: 'ADMIN' | 'MODERATEUR' | 'SUPPORT' | 'COMPTABLE' = 'ADMIN';
      if (role.slug === 'moderateur') roleEnum = 'MODERATEUR';
      else if (role.slug === 'support') roleEnum = 'SUPPORT';
      else if (role.slug === 'comptable') roleEnum = 'COMPTABLE';

      setFormData(prev => ({
        ...prev,
        roleId,
        role: roleEnum,
      }));
    }
  };

  const getRoleBadgeColor = (slug: string) => {
    if (slug === 'superadmin') return 'bg-purple-100 text-purple-700 border-purple-200';
    if (slug === 'admin') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (slug === 'moderateur') return 'bg-green-100 text-green-700 border-green-200';
    if (slug === 'support') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (slug === 'comptable') return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Utilisateur créé avec succès !</h2>
          <p className="text-gray-600">Redirection vers la liste des utilisateurs...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/users')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <UserPlus className="h-8 w-8 text-blue-600" />
              Créer un utilisateur
            </h1>
            <p className="text-gray-600 mt-1">
              Créez un nouveau compte administrateur
            </p>
          </div>
        </div>

        {/* Messages d'erreur */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Erreur</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Formulaire */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de l'utilisateur</CardTitle>
            <CardDescription>
              Remplissez les informations pour créer un nouveau compte administrateur
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nom et Prénom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    Prénom <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="pl-10"
                      placeholder="John"
                    />
                  </div>
                  {formErrors.firstName && (
                    <p className="text-sm text-red-600">{formErrors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Nom <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="pl-10"
                      placeholder="Doe"
                    />
                  </div>
                  {formErrors.lastName && (
                    <p className="text-sm text-red-600">{formErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="john.doe@example.com"
                  />
                </div>
                {formErrors.email && (
                  <p className="text-sm text-red-600">{formErrors.email}</p>
                )}
              </div>

              {/* Mot de passe */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Mot de passe <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10 pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="text-sm text-red-600">{formErrors.password}</p>
                  )}
                  <p className="text-xs text-gray-500">Minimum 8 caractères</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirmer le mot de passe <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="pl-10"
                      placeholder="••••••••"
                    />
                  </div>
                  {formErrors.confirmPassword && (
                    <p className="text-sm text-red-600">{formErrors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Sélection du rôle */}
              <div className="space-y-2">
                <Label htmlFor="roleId">
                  Rôle <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <select
                    id="roleId"
                    name="roleId"
                    value={formData.roleId}
                    onChange={(e) => handleRoleSelect(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  >
                    <option value="">Sélectionnez un rôle</option>
                    {availableRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} {role.isSystem && '(Système)'} - {role._count?.permissions || 0} permissions
                      </option>
                    ))}
                  </select>
                </div>
                {formErrors.roleId && (
                  <p className="text-sm text-red-600">{formErrors.roleId}</p>
                )}

                {/* Affichage du rôle sélectionné */}
                {formData.roleId && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    {(() => {
                      const selectedRole = availableRoles.find(r => r.id === parseInt(formData.roleId));
                      if (!selectedRole) return null;

                      return (
                        <div className="flex items-start gap-3">
                          <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">{selectedRole.name}</h4>
                              <Badge variant="outline" className={getRoleBadgeColor(selectedRole.slug)}>
                                {selectedRole._count?.permissions || 0} permissions
                              </Badge>
                            </div>
                            {selectedRole.description && (
                              <p className="text-sm text-gray-600">{selectedRole.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Boutons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/users')}
                  disabled={creating}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Création...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Créer l'utilisateur
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUserCreatePage;
