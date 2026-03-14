import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3004', withCredentials: true });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {} as any;
    (config.headers as any)['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

type Role = { id: number; name: string; slug: string };

type AdminsListFilters = { page?: number; limit?: number; search?: string; roleId?: number; status?: string };

type AdminUser = { id: number; name: string; email: string; role: Role | null; status: string; createdAt?: string; phone?: string };

async function fetchAvailableRolesForUsers(): Promise<Role[]> {
  const { data } = await api.get('/admin/roles/available-for-users');
  return data?.data ?? data;
}

async function createUser(payload: { name: string; email: string; password: string; roleId: number; status?: 'active' | 'inactive' | 'suspended'; }) {
  try {
    const { data } = await api.post('/admin/users', payload);
    return data;
  } catch (err: any) {
    if (err?.response?.status === 403) {
      throw new Error('Seul un superadmin peut créer un compte admin/superadmin.');
    }
    if (err?.response?.status === 409) {
      throw new Error('Cet email est déjà utilisé.');
    }
    if (err?.response?.status === 404) {
      throw new Error('Rôle sélectionné introuvable.');
    }
    throw new Error('Erreur lors de la création de l’utilisateur.');
  }
}

async function listAllUsers(filters: AdminsListFilters = {}) {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));
  if (filters.search) params.append('search', filters.search);
  if (filters.roleId) params.append('roleId', String(filters.roleId));
  if (filters.status) params.append('status', filters.status);
  const qs = params.toString();
  const url = qs ? `/admin/users?${qs}` : '/admin/users';
  const { data } = await api.get(url);
  return data; // { success, data: { users, total, page, limit } }
}

async function deleteUserById(userId: number) {
  try {
    const { data } = await api.delete(`/admin/users/${userId}`);
    return data;
  } catch (err: any) {
    throw new Error("Erreur lors de la suppression de l’utilisateur.");
  }
}

async function updateUserStatus(userId: number, status: "ACTIVE" | "INACTIVE") {
  try {
    const { data } = await api.patch(`/admin/users/${userId}/status`, { status });
    return data;
  } catch (err: any) {
    throw new Error("Erreur lors de la mise à jour du statut.");
  }
}

const AdminUsersPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isCreate = useMemo(() => location.pathname.endsWith('/create'), [location.pathname]);
  const isSuperAdmin = useMemo(() => {
    const slug = (user as any)?.customRole?.slug || (user as any)?.role?.slug || (user as any)?.role;
    return String(slug).toLowerCase() === 'superadmin';
  }, [user]);

  const [loading, setLoading] = useState(false);

  // Listing state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterRoleId, setFilterRoleId] = useState<number | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [allRoles, setAllRoles] = useState<Role[]>([]);

  // Create state
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [form, setForm] = useState<{ name: string; email: string; password: string; roleId?: number; status?: 'active' | 'inactive' | 'suspended'; }>({ name: '', email: '', password: '', status: 'active' });

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);

  // Status toggle state
  const [statusLoading, setStatusLoading] = useState<number | null>(null);

  const reloadUsers = () => {
    setLoading(true);
    listAllUsers({ page, limit, search, roleId: filterRoleId, status: filterStatus || undefined }).then((res) => {
      const payload = res?.data ?? res;
      setUsers(payload?.users ?? []);
      setTotal(payload?.total ?? 0);
    }).catch((e) => {
      toast.error('Erreur de chargement des utilisateurs.');
      console.error(e);
    }).finally(() => setLoading(false));
  };

  const handleToggleStatus = async (u: AdminUser) => {
    const newStatus = u.status?.toUpperCase() === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      setStatusLoading(u.id);
      await updateUserStatus(u.id, newStatus);
      toast.success(newStatus === 'ACTIVE' ? 'Utilisateur activé.' : 'Utilisateur désactivé.');
      reloadUsers();
    } catch (e: any) {
      toast.error(e?.message || 'Erreur lors de la mise à jour du statut.');
    } finally {
      setStatusLoading(null);
    }
  };

  useEffect(() => {
    if (!isCreate) {
      reloadUsers();
    }
  }, [isCreate, page, limit, search, filterRoleId, filterStatus]);

  useEffect(() => {
    if (!isCreate) {
      fetchAvailableRolesForUsers().then((roles) => setAllRoles(roles)).catch(() => {});
    }
  }, [isCreate]);

  useEffect(() => {
    if (isCreate) {
      setLoading(true);
      fetchAvailableRolesForUsers().then((roles) => {
        // Ne garder que admin/superadmin pour cette page
        const onlyAdminRoles = roles.filter((r) => ['admin', 'superadmin'].includes(r.slug?.toLowerCase()));
        // Si pas superadmin, masquer ces options
        const filtered = isSuperAdmin ? onlyAdminRoles : [];
        setAvailableRoles(filtered);
      }).catch((e) => {
        toast.error('Erreur de chargement des rôles.');
        console.error(e);
      }).finally(() => setLoading(false));
    }
  }, [isCreate, isSuperAdmin]);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password || !form.roleId) {
      toast.error('Veuillez remplir tous les champs requis.');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    try {
      setLoading(true);
      await createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        roleId: Number(form.roleId),
        status: form.status
      });
      toast.success('Utilisateur créé avec succès.');
      navigate('/admin/users');
    } catch (e: any) {
      toast.error(e?.message || 'Erreur lors de la création de l’utilisateur.');
    } finally {
      setLoading(false);
    }
  };

  if (isCreate) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Créer un utilisateur (admin/superadmin)</h1>
          <Button variant="outline" onClick={() => navigate('/admin/users')}>Retour à la liste</Button>
        </div>

        {!isSuperAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Restriction</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-600">Seul un superadmin peut créer un compte admin/superadmin.</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6 grid gap-4 max-w-xl">
            <div>
              <Label>Nom</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom complet" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemple.com" />
            </div>
            <div>
              <Label>Mot de passe</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            </div>
            <div>
              <Label>Rôle</Label>
              <Select
                value={form.roleId ? String(form.roleId) : ''}
                onValueChange={(v) => setForm({ ...form, roleId: Number(v) })}
                disabled={!isSuperAdmin || availableRoles.length === 0 || loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isSuperAdmin ? 'Sélectionner un rôle' : 'Indisponible pour votre rôle'} />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Statut</Label>
              <Select value={form.status || 'active'} onValueChange={(v) => setForm({ ...form, status: v as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-2">
              <Button onClick={handleSubmit} disabled={loading || !isSuperAdmin}>Créer</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const statusLabel: Record<string, { label: string; className: string }> = {
    ACTIVE: { label: 'Actif', className: 'bg-green-100 text-green-700' },
    INACTIVE: { label: 'Inactif', className: 'bg-gray-100 text-gray-600' },
    SUSPENDED: { label: 'Suspendu', className: 'bg-red-100 text-red-700' },
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Utilisateurs</h1>
          <p className="text-sm text-gray-500">{total} utilisateur{total !== 1 ? 's' : ''} au total</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Rechercher (nom, email)"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-48"
          />
          <Select value={filterRoleId ? String(filterRoleId) : 'all'} onValueChange={(v) => { setFilterRoleId(v === 'all' ? undefined : Number(v)); setPage(1); }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              {allRoles.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus || 'all'} onValueChange={(v) => { setFilterStatus(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="ACTIVE">Actif</SelectItem>
              <SelectItem value="INACTIVE">Inactif</SelectItem>
              <SelectItem value="SUSPENDED">Suspendu</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
            <SelectTrigger className="w-20">
              <SelectValue placeholder="Limite" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          {isSuperAdmin && (
            <Button onClick={() => navigate('/admin/users/create')}>Nouveau</Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4 font-medium text-gray-600">Nom</th>
                  <th className="py-2 pr-4 font-medium text-gray-600">Email</th>
                  <th className="py-2 pr-4 font-medium text-gray-600">Rôle</th>
                  <th className="py-2 pr-4 font-medium text-gray-600">Statut</th>
                  <th className="py-2 pr-4 font-medium text-gray-600">Créé le</th>
                  <th className="py-2 pr-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-400">Chargement...</td>
                  </tr>
                )}
                {!loading && users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500">Aucun utilisateur trouvé</td>
                  </tr>
                )}
                {users.map((u) => {
                  const statusInfo = u.status ? statusLabel[u.status.toUpperCase()] : null;
                  return (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 pr-4 font-medium">{u.name}</td>
                      <td className="py-2 pr-4 text-gray-600">{u.email}</td>
                      <td className="py-2 pr-4">
                        {u.role ? (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {u.role.name}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-2 pr-4">
                        {statusInfo ? (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusInfo.className}`}>
                            {statusInfo.label}
                          </span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="py-2 pr-4 text-gray-500 text-xs">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={statusLoading === u.id}
                            onClick={() => handleToggleStatus(u)}
                          >
                            {statusLoading === u.id
                              ? '...'
                              : u.status?.toUpperCase() === 'ACTIVE'
                              ? 'Désactiver'
                              : 'Activer'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => { setUserToDelete(u); setDeleteDialogOpen(true); }}
                          >
                            Supprimer
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-xs text-gray-500">Page {page} / {totalPages} — {total} résultat{total !== 1 ? 's' : ''}</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Précédent</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Suivant</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer définitivement</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer définitivement l’utilisateur <strong>{userToDelete?.name}</strong> ?
              Cette action est irréversible et supprime toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!userToDelete) return;
                try {
                  setLoading(true);
                  await deleteUserById(userToDelete.id);
                  toast.success("Utilisateur supprimé définitivement.");
                  reloadUsers();
                } catch (e: any) {
                  toast.error(e?.message || "Erreur lors de la suppression.");
                } finally {
                  setLoading(false);
                  setDeleteDialogOpen(false);
                  setUserToDelete(null);
                }
              }}
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsersPage;
