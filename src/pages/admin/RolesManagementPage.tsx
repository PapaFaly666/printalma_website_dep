import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Users,
  Key,
  Edit,
  Check,
  X,
  Save,
  RefreshCw,
  Lock,
  CheckSquare,
  Square,
  Info,
  Trash2,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { AdminButton } from '../../components/admin/AdminButton';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { toast } from 'sonner';
import rolesService, { CustomRole, PermissionsGrouped } from '../../services/rolesService';
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
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<CustomRole | null>(null);
  const [deleting, setDeleting] = useState(false);

  // États pour la création de rôle
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleSlug, setNewRoleSlug] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRolePermissions, setNewRolePermissions] = useState<number[]>([]);

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
      // Exclure le rôle superadmin de l'affichage - il est géré uniquement par le système
      setRoles(rolesData.filter((r) => r.slug !== 'superadmin'));
      setPermissions(permsData);
    } catch (err: any) {
      console.error('Erreur chargement:', err);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = async (role: CustomRole) => {
    try {
      const roleDetails = await rolesService.getRoleById(role.id);
      setSelectedRole(roleDetails);
      const permIds = roleDetails.permissions?.map((p) => p.permission.id) || [];
      setSelectedPermissions(permIds);
    } catch (err: any) {
      toast.error('Erreur lors du chargement du rôle');
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;

    try {
      setSaving(true);
      await rolesService.updateRolePermissions(selectedRole.id, selectedPermissions);
      toast.success('Permissions mises à jour');
      setIsEditDialogOpen(false);
      await loadData();
      await handleSelectRole(selectedRole);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (role: CustomRole, e: React.MouseEvent) => {
    e.stopPropagation();
    if (role.isSystem) {
      toast.error('Impossible de supprimer un rôle système');
      return;
    }
    setRoleToDelete(role);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    try {
      setDeleting(true);
      await rolesService.deleteRole(roleToDelete.id);
      toast.success(`Rôle "${roleToDelete.name}" supprimé avec succès`);

      // Si c'était le rôle sélectionné, on le désélectionne
      if (selectedRole?.id === roleToDelete.id) {
        setSelectedRole(null);
        setSelectedPermissions([]);
      }

      setIsDeleteDialogOpen(false);
      setRoleToDelete(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la suppression du rôle');
    } finally {
      setDeleting(false);
    }
  };

  const openCreateDialog = () => {
    setNewRoleName('');
    setNewRoleSlug('');
    setNewRoleDescription('');
    setNewRolePermissions([]);
    setIsCreateDialogOpen(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (value: string) => {
    setNewRoleName(value);
    setNewRoleSlug(generateSlug(value));
  };

  const toggleNewRolePermission = (permissionId: number) => {
    setNewRolePermissions((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((id) => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const selectAllInModuleForNewRole = (module: string) => {
    const modulePerms = permissions[module] || [];
    const modulePermIds = modulePerms.map((p) => p.id);
    const allSelected = modulePermIds.every((id) => newRolePermissions.includes(id));

    if (allSelected) {
      setNewRolePermissions((prev) => prev.filter((id) => !modulePermIds.includes(id)));
    } else {
      setNewRolePermissions((prev) => [...new Set([...prev, ...modulePermIds])]);
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      toast.error('Le nom du rôle est requis');
      return;
    }

    if (!newRoleSlug.trim()) {
      toast.error('Le slug du rôle est requis');
      return;
    }

    // Bloquer la création d'un rôle superadmin
    if (
      newRoleSlug.toLowerCase().trim() === 'superadmin' ||
      newRoleName.toLowerCase().trim() === 'superadmin'
    ) {
      toast.error('Le rôle superadmin est réservé au système et ne peut pas être recréé');
      return;
    }

    try {
      setCreating(true);
      const newRole = await rolesService.createRole({
        name: newRoleName.trim(),
        slug: newRoleSlug.trim(),
        description: newRoleDescription.trim() || undefined,
        permissionIds: newRolePermissions,
      });

      // Assigner les permissions si sélectionnées
      if (newRolePermissions.length > 0) {
        await rolesService.assignPermissionsToRole(newRole.id, newRolePermissions);
      }

      toast.success(`Rôle "${newRole.name}" créé avec succès`);
      setIsCreateDialogOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la création du rôle');
    } finally {
      setCreating(false);
    }
  };

  const togglePermission = (permissionId: number) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((id) => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const selectAllInModule = (module: string) => {
    const modulePerms = permissions[module] || [];
    const modulePermIds = modulePerms.map((p) => p.id);
    const allSelected = modulePermIds.every((id) => selectedPermissions.includes(id));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !modulePermIds.includes(id)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...modulePermIds])]);
    }
  };

  const getModuleIcon = (module: string) => {
    const icons: Record<string, string> = {
      products: '📦',
      validation: '✅',
      orders: '🛒',
      users: '👥',
      content: '📝',
      statistics: '📊',
      payments: '💳',
      settings: '⚙️',
      trash: '🗑️',
    };
    return icons[module] || '📋';
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

  const canManageRoles = user?.role === 'SUPERADMIN' || hasPermission('users.admins.roles');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-[rgb(20,104,154)] mx-auto mb-3" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      {/* Header - Style ProductsPage */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 px-4 sm:px-6 py-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Rôles & Permissions</h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                <span className="font-semibold text-gray-900">{roles.length}</span> rôle{roles.length > 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1 text-gray-400">
                <Lock className="h-3.5 w-3.5" />
                Le rôle superadmin est géré par le système
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AdminButton variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </AdminButton>
            {canManageRoles && (
              <AdminButton variant="primary" size="sm" onClick={openCreateDialog}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Créer un rôle</span>
              </AdminButton>
            )}
          </div>
        </div>
      </motion.div>

      {/* Contenu */}
      <div className="px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Liste des rôles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-5 w-5" />
                  Rôles disponibles
                </CardTitle>
                <CardDescription>{roles.length} rôle{roles.length > 1 ? 's' : ''}</CardDescription>
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
                          ? 'border-[rgb(20,104,154)] bg-blue-50/50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{role.name}</h3>
                            {role.isSystem && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                      <Lock className="h-3 w-3 mr-1" />
                                      Système
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Rôle protégé du système</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          {role.description && <p className="text-sm text-gray-600 mt-1">{role.description}</p>}
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
                        {canManageRoles && !role.isSystem && (
                          <AdminButton
                            variant="ghost"
                            size="sm"
                            onClick={(e) => openDeleteDialog(role, e)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </AdminButton>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Détails des permissions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Key className="h-5 w-5" />
                      {selectedRole ? `Permissions de ${selectedRole.name}` : 'Sélectionnez un rôle'}
                    </CardTitle>
                    <CardDescription>
                      {selectedRole
                        ? `${selectedRole.permissions?.length || 0} permission${
                            (selectedRole.permissions?.length || 0) > 1 ? 's' : ''
                          }`
                        : 'Cliquez sur un rôle pour voir ses permissions'}
                    </CardDescription>
                  </div>
                  {selectedRole && canManageRoles && (
                    <AdminButton variant="primary" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                      <Edit className="h-4 w-4" />
                      <span className="hidden sm:inline">Modifier</span>
                    </AdminButton>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedRole ? (
                  <div className="space-y-4">
                    {Object.entries(permissions).map(([module, perms]) => {
                      const rolePermIds = selectedRole.permissions?.map((p) => p.permission.id) || [];
                      const modulePerms = perms.filter((p) => rolePermIds.includes(p.id));

                      if (modulePerms.length === 0) return null;

                      return (
                        <motion.div
                          key={module}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border rounded-lg p-4 bg-white"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl">{getModuleIcon(module)}</span>
                            <h4 className="font-semibold text-gray-900">{getModuleName(module)}</h4>
                            <Badge variant="outline" className="ml-auto">
                              {modulePerms.length}/{perms.length}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {modulePerms.map((perm) => (
                              <div key={perm.id} className="flex items-start gap-2 p-2 bg-green-50 rounded">
                                <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{perm.name}</p>
                                  {perm.description && <p className="text-xs text-gray-600">{perm.description}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}

                    {Object.entries(permissions).every(([_, perms]) => {
                      const rolePermIds = selectedRole.permissions?.map((p) => p.permission.id) || [];
                      return perms.filter((p) => rolePermIds.includes(p.id)).length === 0;
                    }) && (
                      <div className="text-center py-12 text-gray-500">
                        <Info className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>Aucune permission assignée à ce rôle</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Sélectionnez un rôle pour voir ses permissions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Dialog d'édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier les permissions - {selectedRole?.name}</DialogTitle>
            <DialogDescription>Cochez les permissions à attribuer à ce rôle</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            {Object.entries(permissions).map(([module, perms]) => (
              <div key={module} className="border rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getModuleIcon(module)}</span>
                    <h4 className="font-semibold text-gray-900">{getModuleName(module)}</h4>
                    <Badge variant="outline">
                      {perms.filter((p) => selectedPermissions.includes(p.id)).length}/{perms.length}
                    </Badge>
                  </div>
                  <AdminButton variant="outline" size="sm" onClick={() => selectAllInModule(module)}>
                    {perms.every((p) => selectedPermissions.includes(p.id)) ? (
                      <>
                        <X className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">Tout désélectionner</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">Tout sélectionner</span>
                      </>
                    )}
                  </AdminButton>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {perms.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-start gap-2 p-3 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                    >
                      <div className="flex items-center h-5">
                        {selectedPermissions.includes(perm.id) ? (
                          <CheckSquare
                            className="h-5 w-5 text-[rgb(20,104,154)] cursor-pointer"
                            onClick={() => togglePermission(perm.id)}
                          />
                        ) : (
                          <Square
                            className="h-5 w-5 text-gray-400 cursor-pointer"
                            onClick={() => togglePermission(perm.id)}
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{perm.name}</p>
                        {perm.description && <p className="text-xs text-gray-600 mt-0.5">{perm.description}</p>}
                        <p className="text-xs text-gray-400 font-mono mt-1">{perm.key}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <AdminButton variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </AdminButton>
            <AdminButton variant="primary" onClick={handleSavePermissions} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline ml-2">Enregistrement...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Enregistrer</span>
                </>
              )}
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de création de rôle */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un nouveau rôle</DialogTitle>
            <DialogDescription>Définissez le nom, la description et les permissions du nouveau rôle</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            {/* Formulaire de base */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du rôle <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Gestionnaire Stocks"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(20,104,154)] focus:border-transparent"
                  disabled={creating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (identifiant unique)
                </label>
                <input
                  type="text"
                  value={newRoleSlug}
                  onChange={(e) => setNewRoleSlug(e.target.value)}
                  placeholder="gestionnaire-stocks"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(20,104,154)] focus:border-transparent bg-gray-100"
                  disabled={creating}
                />
                <p className="text-xs text-gray-500 mt-1">Généré automatiquement à partir du nom</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Décrivez le rôle et ses responsabilités..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(20,104,154)] focus:border-transparent"
                  disabled={creating}
                />
              </div>
            </div>

            {/* Sélection des permissions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Permissions du rôle</h3>
                <Badge variant="outline">
                  {newRolePermissions.length} permission(s) sélectionnée(s)
                </Badge>
              </div>

              {Object.entries(permissions).map(([module, perms]) => (
                <div key={module} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getModuleIcon(module)}</span>
                      <h4 className="font-semibold text-gray-900">{getModuleName(module)}</h4>
                      <Badge variant="outline">
                        {perms.filter((p) => newRolePermissions.includes(p.id)).length}/{perms.length}
                      </Badge>
                    </div>
                    <AdminButton variant="outline" size="sm" onClick={() => selectAllInModuleForNewRole(module)}>
                      {perms.every((p) => newRolePermissions.includes(p.id)) ? (
                        <>
                          <X className="h-4 w-4" />
                          <span className="hidden sm:inline ml-2">Tout désélectionner</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          <span className="hidden sm:inline ml-2">Tout sélectionner</span>
                        </>
                      )}
                    </AdminButton>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {perms.map((perm) => (
                      <label
                        key={perm.id}
                        className="flex items-start gap-2 p-3 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                      >
                        <div className="flex items-center h-5">
                          {newRolePermissions.includes(perm.id) ? (
                            <CheckSquare
                              className="h-5 w-5 text-[rgb(20,104,154)] cursor-pointer"
                              onClick={() => toggleNewRolePermission(perm.id)}
                            />
                          ) : (
                            <Square
                              className="h-5 w-5 text-gray-400 cursor-pointer"
                              onClick={() => toggleNewRolePermission(perm.id)}
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{perm.name}</p>
                          {perm.description && <p className="text-xs text-gray-600 mt-0.5">{perm.description}</p>}
                          <p className="text-xs text-gray-400 font-mono mt-1">{perm.key}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <AdminButton variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={creating}>
              Annuler
            </AdminButton>
            <AdminButton variant="primary" onClick={handleCreateRole} disabled={creating}>
              {creating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline ml-2">Création...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Créer le rôle</span>
                </>
              )}
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Supprimer le rôle
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Veuillez confirmer la suppression.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                Vous êtes sur le point de supprimer le rôle :
              </p>
              <p className="text-lg font-semibold text-gray-900 mt-2">
                {roleToDelete?.name}
              </p>
              {roleToDelete?.description && (
                <p className="text-sm text-gray-600 mt-1">{roleToDelete.description}</p>
              )}
            </div>

            {roleToDelete?._count?.users && roleToDelete._count.users > 0 && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    <strong>{roleToDelete._count.users} utilisateur(s)</strong> ont ce rôle.
                    Ils devront être réassignés manuellement.
                  </span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <AdminButton variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={deleting}>
              Annuler
            </AdminButton>
            <AdminButton
              variant="destructive"
              onClick={handleDeleteRole}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline ml-2">Suppression...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Supprimer</span>
                </>
              )}
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RolesManagementPage;
