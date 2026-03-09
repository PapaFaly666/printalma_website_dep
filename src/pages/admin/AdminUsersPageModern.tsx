import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  Search,
  MoreVertical,
  Trash2,
  Shield,
  AlertCircle,
  Mail,
  User as UserIcon,
  RefreshCw,
  Send,
  Info,
  Key,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { AdminButton } from '../../components/admin/AdminButton';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '../../components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import userService, { User, Role } from '../../services/userService';

export const AdminUsersPageModern: React.FC = () => {
  const { user: currentUser } = useAuth();

  // États
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userForPassword, setUserForPassword] = useState<User | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roleId: 0,
    generatePassword: true,
    sendEmail: true,
  });

  // Password form state
  const [passwordFormData, setPasswordFormData] = useState({
    newPassword: '',
    generateRandom: false,
    sendEmail: false,
    forceChange: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const isSuperAdmin = currentUser?.customRole?.slug === 'superadmin';

  // Chargement
  useEffect(() => {
    loadUsers();
  }, [page, search]);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await userService.listAdmins({
        page,
        limit,
        search,
      });

      const payload = res?.data ?? res;
      setUsers(payload?.users ?? []);
      setTotal(payload?.total ?? 0);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const rolesData = await userService.getAvailableRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error(error);
    }
  };

  const handleInviteUser = async () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.roleId) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      setLoading(true);
      const result = await userService.createUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        roleId: formData.roleId,
        generatePassword: formData.generatePassword,
        sendCredentialsByEmail: formData.sendEmail,
      });

      // Gérer la réponse avec ou sans mot de passe généré
      if (result && typeof result === 'object') {
        if (result.data?.generatedPassword) {
          setGeneratedPassword(result.data.generatedPassword);
          toast.success('Utilisateur créé avec succès');
        } else if (result.message) {
          toast.success(result.message);
        } else {
          toast.success('Utilisateur créé avec succès');
        }
      } else {
        toast.success('Utilisateur créé avec succès');
      }

      setIsInviteModalOpen(false);
      setFormData({ name: '', email: '', roleId: 0, generatePassword: true, sendEmail: true });
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRoleId: number, userName: string) => {
    try {
      await userService.updateUserRole(userId, newRoleId);
      toast.success(`Rôle de ${userName} modifié`);
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la modification');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setLoading(true);
      await userService.deleteUser(userToDelete.id);
      toast.success('Utilisateur supprimé');
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const openPasswordModal = (user: User) => {
    setUserForPassword(user);
    setPasswordFormData({
      newPassword: '',
      generateRandom: true,
      sendEmail: true,
      forceChange: true,
    });
    setGeneratedPassword('');
    setShowPassword(false);
    setIsPasswordModalOpen(true);
  };

  const handleChangePassword = async () => {
    if (!userForPassword) return;

    try {
      setLoading(true);
      const result = await userService.changeUserPassword(userForPassword.id, passwordFormData);

      if (result.data?.tempPassword) {
        setGeneratedPassword(result.data.tempPassword);
      }

      toast.success(result.message || 'Mot de passe changé avec succès');

      if (!passwordFormData.sendEmail) {
        // Si on n'envoie pas par email, on affiche le mot de passe généré
        if (passwordFormData.generateRandom) {
          setGeneratedPassword(result.data?.tempPassword || 'Mot de passe généré');
        }
      }

      setIsPasswordModalOpen(false);
      setPasswordFormData({
        newPassword: '',
        generateRandom: true,
        sendEmail: true,
        forceChange: true,
      });
      setUserForPassword(null);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCredentials = async (user: User) => {
    try {
      setLoading(true);
      const result = await userService.sendUserCredentials(user.id);

      if (result.data?.tempPassword) {
        setGeneratedPassword(result.data.tempPassword);
      }

      toast.success(result.message || 'Identifiants envoyés avec succès');
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi des identifiants");
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Mot de passe copié !');
  };

  const canModifyUser = (targetUser: User) => {
    if (isSuperAdmin) return true;
    if (targetUser.role?.slug === 'superadmin') return false;
    if (targetUser.id === currentUser?.id) return false;
    return true;
  };

  const getRoleBadge = (role: Role) => {
    const colors: Record<string, string> = {
      superadmin: 'bg-purple-100 text-purple-700',
      admin: 'bg-blue-100 text-blue-700',
      moderateur: 'bg-green-100 text-green-700',
      support: 'bg-yellow-100 text-yellow-700',
      comptable: 'bg-orange-100 text-orange-700',
    };

    return (
      <Badge className={`${colors[role.slug] || 'bg-gray-100 text-gray-700'} border-0`}>
        {role.name}
      </Badge>
    );
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestion de l'équipe</h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                <span className="font-semibold text-gray-900">{total}</span> membre{total > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AdminButton variant="outline" size="sm" onClick={loadUsers} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </AdminButton>
            <AdminButton variant="primary" size="sm" onClick={() => setIsInviteModalOpen(true)}>
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Inviter un membre</span>
            </AdminButton>
          </div>
        </div>
      </motion.div>

      {/* Contenu */}
      <div className="px-4 sm:px-6 py-4 space-y-4">
        {/* Barre de recherche - Style ProductsPage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 h-10 border-gray-300 focus:border-[rgb(20,104,154)] focus:ring-[rgb(20,104,154)]/20"
            />
          </div>
        </motion.div>

        {/* Tableau des utilisateurs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-gray-50/50">
                    <tr>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Membre
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rôle
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dernière connexion
                      </th>
                      <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <AnimatePresence>
                      {users.map((user) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          {/* Membre */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={user.avatar || user.profile_photo_url} />
                                <AvatarFallback className="bg-[rgb(20,104,154)]/10 text-[rgb(20,104,154)] font-medium text-sm">
                                  {user.firstName?.[0]}
                                  {user.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-900">{user.name}</p>
                                  {user.id === currentUser?.id && (
                                    <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                                      Vous
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Rôle */}
                          <td className="py-4 px-6">
                            {canModifyUser(user) ? (
                              <Select
                                value={String(user.roleId)}
                                onValueChange={(value) => handleRoleChange(user.id, Number(value), user.name)}
                                disabled={!isSuperAdmin && user.role?.slug === 'superadmin'}
                              >
                                <SelectTrigger className="w-52 h-9 border-0 shadow-none hover:bg-gray-100 focus:ring-0">
                                  <SelectValue>{getRoleBadge(user.role)}</SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {roles.map((role) => (
                                    <SelectItem key={role.id} value={String(role.id)}>
                                      <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-gray-400" />
                                        <div>
                                          <p className="font-medium">{role.name}</p>
                                          {role.description && <p className="text-xs text-gray-500">{role.description}</p>}
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <div className="flex items-center gap-2">
                                {getRoleBadge(user.role)}
                                {user.role?.slug === 'superadmin' && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Info className="h-4 w-4 text-gray-400" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Seul un superadmin peut modifier ce rôle</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Dernière connexion */}
                          <td className="py-4 px-6">
                            <span className="text-sm text-gray-500">
                              {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fr-FR') : 'Jamais'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                    <MoreVertical className="h-4 w-4 text-gray-500" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    disabled={!canModifyUser(user)}
                                    onClick={() => openPasswordModal(user)}
                                  >
                                    <Key className="h-4 w-4 mr-2" />
                                    Changer le mot de passe
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    disabled={!canModifyUser(user)}
                                    onClick={() => handleSendCredentials(user)}
                                  >
                                    <Send className="h-4 w-4 mr-2" />
                                    Envoyer les identifiants
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    disabled={!canModifyUser(user)}
                                    onClick={() => {
                                      setUserToDelete(user);
                                      setIsDeleteModalOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>

                {users.length === 0 && !loading && (
                  <div className="text-center py-12 px-4">
                    <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-2">Aucun membre trouvé</p>
                    {search && (
                      <AdminButton variant="outline" size="sm" onClick={() => setSearch('')}>
                        Réinitialiser la recherche
                      </AdminButton>
                    )}
                  </div>
                )}

                {loading && (
                  <div className="text-center py-12">
                    <RefreshCw className="h-8 w-8 text-[rgb(20,104,154)] mx-auto mb-3 animate-spin" />
                    <p className="text-gray-500">Chargement...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4">
            <p className="text-sm text-gray-600">
              {total} membre{total > 1 ? 's' : ''} au total
            </p>
            <div className="flex gap-2">
              <AdminButton
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Précédent
              </AdminButton>
              <span className="flex items-center px-3 text-sm text-gray-600">
                Page {page} sur {totalPages}
              </span>
              <AdminButton
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Suivant
              </AdminButton>
            </div>
          </div>
        )}
      </div>

      {/* Modal d'invitation */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-[rgb(20,104,154)]" />
              Inviter un nouveau membre
            </DialogTitle>
            <DialogDescription>
              Un email d'invitation sera envoyé pour configurer le compte
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="focus:border-[rgb(20,104,154)] focus:ring-[rgb(20,104,154)]/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  className="pl-10 focus:border-[rgb(20,104,154)] focus:ring-[rgb(20,104,154)]/20"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Select
                value={formData.roleId ? String(formData.roleId) : ''}
                onValueChange={(value) => setFormData({ ...formData, roleId: Number(value) })}
              >
                <SelectTrigger className="focus:border-[rgb(20,104,154)] focus:ring-[rgb(20,104,154)]/20">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={String(role.id)}>
                      <div className="flex items-start gap-2 py-1">
                        <Shield className="h-4 w-4 mt-0.5 text-gray-400" />
                        <div>
                          <p className="font-medium">{role.name}</p>
                          {role.description && <p className="text-xs text-gray-500">{role.description}</p>}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Mot de passe</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.generatePassword}
                    onChange={(e) => setFormData({ ...formData, generatePassword: e.target.checked })}
                    className="w-4 h-4 text-[rgb(20,104,154)] border-gray-300 rounded focus:ring-[rgb(20,104,154)]"
                  />
                  <span className="text-sm text-gray-700">Générer automatiquement un mot de passe sécurisé</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.sendEmail}
                    onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                    className="w-4 h-4 text-[rgb(20,104,154)] border-gray-300 rounded focus:ring-[rgb(20,104,154)]"
                  />
                  <span className="text-sm text-gray-700">Envoyer les identifiants par email</span>
                </label>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex gap-2">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-900">
                  {formData.sendEmail
                    ? 'L\'utilisateur recevra un email avec ses identifiants de connexion.'
                    : 'Le mot de passe généré sera affiché après la création. Pensez à le transmettre à l\'utilisateur.'}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <AdminButton variant="outline" onClick={() => setIsInviteModalOpen(false)} disabled={loading}>
              Annuler
            </AdminButton>
            <AdminButton variant="primary" onClick={handleInviteUser} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Envoi...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Envoyer l'invitation</span>
                </>
              )}
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de suppression */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Supprimer {userToDelete?.name} ?
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Toutes les données seront supprimées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <AdminButton variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={loading}>
              Annuler
            </AdminButton>
            <AdminButton variant="destructive" onClick={handleDeleteUser} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </>
              )}
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de changement de mot de passe */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-[rgb(20,104,154)]" />
              Changer le mot de passe
            </DialogTitle>
            <DialogDescription>
              {userForPassword?.name} ({userForPassword?.email})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!passwordFormData.generateRandom && (
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordFormData.newPassword}
                    onChange={(e) => setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })}
                    className="focus:border-[rgb(20,104,154)] focus:ring-[rgb(20,104,154)]/20 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label>Options</Label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={passwordFormData.generateRandom}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, generateRandom: e.target.checked })}
                  className="w-4 h-4 text-[rgb(20,104,154)] border-gray-300 rounded focus:ring-[rgb(20,104,154)]"
                />
                <span className="text-sm text-gray-700">Générer un mot de passe aléatoire sécurisé</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={passwordFormData.sendEmail}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, sendEmail: e.target.checked })}
                  className="w-4 h-4 text-[rgb(20,104,154)] border-gray-300 rounded focus:ring-[rgb(20,104,154)]"
                />
                <span className="text-sm text-gray-700">Envoyer le mot de passe par email à l'utilisateur</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={passwordFormData.forceChange}
                  onChange={(e) => setPasswordFormData({ ...passwordFormData, forceChange: e.target.checked })}
                  className="w-4 h-4 text-[rgb(20,104,154)] border-gray-300 rounded focus:ring-[rgb(20,104,154)]"
                />
                <span className="text-sm text-gray-700">Forcer l'utilisateur à changer son mot de passe à la prochaine connexion</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <AdminButton variant="outline" onClick={() => setIsPasswordModalOpen(false)} disabled={loading}>
              Annuler
            </AdminButton>
            <AdminButton variant="primary" onClick={handleChangePassword} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Changement...</span>
                </>
              ) : (
                <>
                  <Key className="h-4 w-4" />
                  <span className="hidden sm:inline">Changer le mot de passe</span>
                </>
              )}
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal d'affichage du mot de passe généré */}
      {generatedPassword && (
        <Dialog open={!!generatedPassword} onOpenChange={() => setGeneratedPassword('')}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Mot de passe généré
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2">
                  Voici le mot de passe à transmettre à l'utilisateur :
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white border border-gray-300 rounded px-3 py-2 font-mono text-sm">
                    {generatedPassword}
                  </code>
                  <AdminButton
                    variant="outline"
                    size="sm"
                    onClick={copyPassword}
                    className="shrink-0"
                  >
                    {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </AdminButton>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex gap-2">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-900">
                    L'utilisateur devra changer son mot de passe lors de sa première connexion.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <AdminButton variant="primary" onClick={() => setGeneratedPassword('')}>
                Fermer
              </AdminButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminUsersPageModern;
