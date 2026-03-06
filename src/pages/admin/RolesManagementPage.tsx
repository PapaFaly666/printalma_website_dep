import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Users,
  Key,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  AlertCircle,
  Save,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import Button from '../../components/ui/Button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import rolesService, { CustomRole, PermissionsGrouped, Permission } from '../../services/rolesService';
import { useAuth } from '../../contexts/AuthContext';
import usePermissions from '../../hooks/usePermissions';

export const RolesManagementPage: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [permissions, setPermissions] = useState<PermissionsGrouped>({});
  const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesData, permsData] = await Promise.all([
        rolesService.getAllRoles(),
        rolesService.getAllPermissions(),
      ]);
      setRoles(rolesData);
      setPermissions(permsData);
      setError(null);
    } catch (err: any) {
      console.error('Erreur chargement données:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = async (role: CustomRole) => {
    try {
      const roleDetails = await rolesService.getRoleById(role.id);
      setSelectedRole(roleDetails);
      // Extraire les IDs des permissions du rôle
      const permIds = roleDetails.permissions?.map(p => p.permission.id) || [];
      setSelectedPermissions(permIds);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du rôle');
    }
  };

  const handleEditPermissions = () => {
    if (!selectedRole) return;
    setIsEditDialogOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;

    try {
      setSaving(true);
      await rolesService.updateRolePermissions(selectedRole.id, selectedPermissions);
      setSuccess('Permissions mises à jour avec succès');
      setIsEditDialogOpen(false);
      await loadData();
      await handleSelectRole(selectedRole);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour des permissions');
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (permissionId: number) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const selectAllInModule = (module: string) => {
    const modulePerms = permissions[module] || [];
    const modulePermIds = modulePerms.map(p => p.id);

    // Si tous sont déjà sélectionnés, on désélectionne
    const allSelected = modulePermIds.every(id => selectedPermissions.includes(id));

    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(id => !modulePermIds.includes(id)));
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...modulePermIds])]);
    }
  };

  const getRoleBadgeColor = (role: CustomRole) => {
    if (role.slug === 'superadmin') return 'bg-purple-100 text-purple-700 border-purple-200';
    if (role.slug === 'admin') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (role.slug === 'moderateur') return 'bg-green-100 text-green-700 border-green-200';
    if (role.slug === 'support') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (role.slug === 'comptable') return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'products': return '📦';
      case 'validation': return '✅';
      case 'orders': return '🛒';
      case 'users': return '👥';
      case 'content': return '📝';
      case 'statistics': return '📊';
      case 'payments': return '💳';
      case 'settings': return '⚙️';
      case 'trash': return '🗑️';
      default: return '📋';
    }
  };

  const getModuleName = (module: string) => {
    const names: Record<string, string> = {
      products: 'Produits',
      validation: 'Validation',
      orders: 'Commandes',
      users: 'Utilisateurs',
      content: 'Contenu',
      statistics: 'Statistiques',
      payments: 'Paiements',
      settings: 'Paramètres',
      trash: 'Corbeille',
    };
    return names[module] || module;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Vérifier si l'utilisateur a la permission de gérer les rôles
  const canManageRoles = user?.role === 'SUPERADMIN' || hasPermission('users.admins.roles');

  return (
    <div className="min-h-screen bg-gray-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              Gestion des Rôles et Permissions
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez les rôles et leurs permissions d'accès
            </p>
          </div>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>

        {/* Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Erreur</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="h-4 w-4 text-red-600" />
            </button>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3"
          >
            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Succès</p>
              <p className="text-sm text-green-700">{success}</p>
            </div>
            <button onClick={() => setSuccess(null)} className="ml-auto">
              <X className="h-4 w-4 text-green-600" />
            </button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des rôles */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Rôles disponibles
              </CardTitle>
              <CardDescription>
                {roles.length} rôle{roles.length > 1 ? 's' : ''} configuré{roles.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {roles.map((role) => (
                  <motion.button
                    key={role.id}
                    onClick={() => handleSelectRole(role)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedRole?.id === role.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{role.name}</h3>
                          {role.isSystem && (
                            <Badge variant="outline" className="text-xs">
                              Système
                            </Badge>
                          )}
                        </div>
                        {role.description && (
                          <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {role._count?.users || 0} utilisateur{(role._count?.users || 0) > 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <Key className="h-3 w-3" />
                            {role._count?.permissions || 0} permission{(role._count?.permissions || 0) > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Détails du rôle sélectionné */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    {selectedRole ? `Permissions de ${selectedRole.name}` : 'Sélectionnez un rôle'}
                  </CardTitle>
                  <CardDescription>
                    {selectedRole
                      ? `${selectedRole.permissions?.length || 0} permission${(selectedRole.permissions?.length || 0) > 1 ? 's' : ''} assignée${(selectedRole.permissions?.length || 0) > 1 ? 's' : ''}`
                      : 'Sélectionnez un rôle pour voir ses permissions'}
                  </CardDescription>
                </div>
                {selectedRole && canManageRoles && (
                  <Button onClick={handleEditPermissions} size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedRole ? (
                <div className="space-y-4">
                  {Object.entries(permissions).map(([module, perms]) => {
                    const rolePermIds = selectedRole.permissions?.map(p => p.permission.id) || [];
                    const modulePerms = perms.filter(p => rolePermIds.includes(p.id));

                    if (modulePerms.length === 0) return null;

                    return (
                      <div key={module} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">{getModuleIcon(module)}</span>
                          <h4 className="font-semibold text-gray-900">{getModuleName(module)}</h4>
                          <Badge variant="outline" className="ml-auto">
                            {modulePerms.length}/{perms.length}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {modulePerms.map((perm) => (
                            <div
                              key={perm.id}
                              className="flex items-start gap-2 p-2 bg-gray-50 rounded"
                            >
                              <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{perm.name}</p>
                                {perm.description && (
                                  <p className="text-xs text-gray-600">{perm.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Sélectionnez un rôle pour voir ses permissions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog d'édition des permissions */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier les permissions de {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Cochez les permissions que vous souhaitez attribuer à ce rôle
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            {Object.entries(permissions).map(([module, perms]) => (
              <div key={module} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getModuleIcon(module)}</span>
                    <h4 className="font-semibold text-gray-900">{getModuleName(module)}</h4>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectAllInModule(module)}
                  >
                    {perms.every(p => selectedPermissions.includes(p.id))
                      ? 'Tout désélectionner'
                      : 'Tout sélectionner'}
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {perms.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        className="mt-1"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{perm.name}</p>
                        {perm.description && (
                          <p className="text-xs text-gray-600">{perm.description}</p>
                        )}
                        <p className="text-xs text-gray-400 font-mono mt-1">{perm.key}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSavePermissions} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RolesManagementPage;
