import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Sun, Moon, User, Save, Edit3, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

const AdminSettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'light');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    country: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: (user as any)?.phone || '',
        address: (user as any)?.address || '',
        country: (user as any)?.country || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
    try {
      window.dispatchEvent(new StorageEvent('storage', { key: 'theme', newValue: theme }));
    } catch {}
  }, [theme]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveAccount = async () => {
    setIsLoading(true);
    try {
      await new Promise(r => setTimeout(r, 300));
      toast.success('Profil mis à jour');
      setIsEditing(false);
      await refreshUser();
    } catch (e) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
        <p className="text-gray-600 dark:text-gray-400">Gérez l'apparence et votre compte</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sun className="h-5 w-5" /> Apparence</CardTitle>
              <CardDescription>Contrôlez le thème de l'interface</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Mode sombre</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Activez le thème sombre</p>
                </div>
                <Switch checked={theme === 'dark'} onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')} />
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="p-4 bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    <span>Aperçu {theme === 'dark' ? 'sombre' : 'clair'}</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="h-16 rounded-md bg-gray-100 dark:bg-gray-800" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
              <CardDescription>Statut du compte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm">Rôle</Label>
                <div className="mt-1">
                  <Badge className={getRoleBadgeColor(user?.role || '')}>{user?.role || 'N/A'}</Badge>
                </div>
              </div>
              <Separator />
              <div>
                <Label className="text-sm">Membre depuis</Label>
                <p className="text-sm text-gray-900 dark:text-white">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Mon compte</CardTitle>
                  <CardDescription>Vos informations personnelles</CardDescription>
                </div>
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                    <Edit3 className="h-4 w-4" /> Modifier
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prénom</Label>
                  <Input value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} disabled={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} disabled={!isEditing} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} disabled={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} disabled={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label>Adresse</Label>
                <Input value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} disabled={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label>Pays</Label>
                <Input value={formData.country} onChange={(e) => handleInputChange('country', e.target.value)} disabled={!isEditing} />
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSaveAccount} disabled={isLoading} className="flex items-center gap-2"><Save className="h-4 w-4" /> {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isLoading}>Annuler</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Sécurité</CardTitle>
              <CardDescription>Gérez la sécurité de votre compte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">Changer le mot de passe</Button>
              <Button variant="outline" className="w-full justify-start">Authentification à deux facteurs</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
