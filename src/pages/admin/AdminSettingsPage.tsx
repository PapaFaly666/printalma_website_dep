import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import Button from '../../components/ui/Button';
import { Separator } from '../../components/ui/separator';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { Sun, Moon, User, Save, Edit3, Shield, Building2, Percent, Mail, CreditCard, AlertTriangle, Globe, DollarSign, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { ChangePasswordDialog } from '../../components/admin/ChangePasswordDialog';
import { adminSettingsService, AppSettingsResponse } from '../../services/adminSettingsService';

const AdminSettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'light');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    country: ''
  });

  const [appSettings, setAppSettings] = useState<AppSettingsResponse>({
    appName: '',
    contactEmail: '',
    supportEmail: '',
    contactPhone: '',
    companyAddress: '',
    websiteUrl: '',
    vendorRegistrationEnabled: true,
    emailNotificationsEnabled: true,
    defaultVendorCommission: 15,
    minWithdrawalAmount: 5000,
    currency: 'XOF',
    maintenanceMode: false,
    maintenanceMessage: ''
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

  // Charger les paramètres de l'application
  useEffect(() => {
    loadAppSettings();
  }, []);

  const loadAppSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const settings = await adminSettingsService.getAppSettings();
      setAppSettings(settings);
    } catch (error) {
      toast.error('Erreur lors du chargement des paramètres');
      console.error('Error loading app settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

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

  const handleSettingsChange = (field: keyof AppSettingsResponse, value: string | number | boolean) => {
    setAppSettings(prev => ({ ...prev, [field]: value }));
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

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const updatedSettings = await adminSettingsService.updateAppSettings(appSettings);
      setAppSettings(updatedSettings);
      toast.success('Paramètres mis à jour avec succès');
      setIsEditingSettings(false);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde des paramètres');
      console.error('Error saving settings:', error);
    } finally {
      setIsSavingSettings(false);
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
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
        <p className="text-gray-600 dark:text-gray-400">Gérez l'apparence, votre compte et les paramètres de l'application</p>
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
                <p className="text-sm text-gray-900 dark:text-white">{user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'N/A'}</p>
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
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setIsChangePasswordOpen(true)}
              >
                Changer le mot de passe
              </Button>
              <Button variant="outline" className="w-full justify-start">Authentification à deux facteurs</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog pour changer le mot de passe */}
      <ChangePasswordDialog
        open={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
      />

      {/* === SECTION PARAMÈTRES APPLICATION === */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Paramètres de l'application
            </h2>
            <p className="text-gray-600 dark:text-gray-400">Configuration globale de la plateforme</p>
          </div>
          {!isEditingSettings && (
            <Button variant="outline" size="sm" onClick={() => setIsEditingSettings(true)} className="flex items-center gap-2">
              <Edit3 className="h-4 w-4" /> Modifier
            </Button>
          )}
        </div>

        {isLoadingSettings ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-gray-500">Chargement des paramètres...</div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations Entreprise */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informations Entreprise
                </CardTitle>
                <CardDescription>Coordonnées et informations de contact</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom de l'application</Label>
                  <Input
                    value={appSettings.appName}
                    onChange={(e) => handleSettingsChange('appName', e.target.value)}
                    disabled={!isEditingSettings}
                    placeholder="PrintAlma"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email de contact</Label>
                  <Input
                    type="email"
                    value={appSettings.contactEmail}
                    onChange={(e) => handleSettingsChange('contactEmail', e.target.value)}
                    disabled={!isEditingSettings}
                    placeholder="contact@printalma.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email support</Label>
                  <Input
                    type="email"
                    value={appSettings.supportEmail}
                    onChange={(e) => handleSettingsChange('supportEmail', e.target.value)}
                    disabled={!isEditingSettings}
                    placeholder="support@printalma.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone de contact</Label>
                  <Input
                    value={appSettings.contactPhone}
                    onChange={(e) => handleSettingsChange('contactPhone', e.target.value)}
                    disabled={!isEditingSettings}
                    placeholder="+221 XX XXX XX XX"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Adresse de l'entreprise</Label>
                  <Textarea
                    value={appSettings.companyAddress}
                    onChange={(e) => handleSettingsChange('companyAddress', e.target.value)}
                    disabled={!isEditingSettings}
                    placeholder="123 Rue Example, Dakar, Sénégal"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>URL du site web</Label>
                  <Input
                    value={appSettings.websiteUrl}
                    onChange={(e) => handleSettingsChange('websiteUrl', e.target.value)}
                    disabled={!isEditingSettings}
                    placeholder="https://printalma.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Paramètres Vendeurs & Commissions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Vendeurs & Commissions
                </CardTitle>
                <CardDescription>Configuration des vendeurs et commissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label className="text-sm">Inscription vendeurs</Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Autoriser les nouvelles inscriptions de vendeurs
                    </p>
                  </div>
                  <Switch
                    checked={appSettings.vendorRegistrationEnabled}
                    onCheckedChange={(v) => handleSettingsChange('vendorRegistrationEnabled', v)}
                    disabled={!isEditingSettings}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Commission vendeur par défaut (%)</Label>
                  <Input
                    type="number"
                    value={appSettings.defaultVendorCommission}
                    onChange={(e) => handleSettingsChange('defaultVendorCommission', Number(e.target.value))}
                    disabled={!isEditingSettings}
                    min={0}
                    max={100}
                    step={0.5}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Pourcentage de commission pour les nouveaux vendeurs
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Montant minimum de retrait</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={appSettings.minWithdrawalAmount}
                      onChange={(e) => handleSettingsChange('minWithdrawalAmount', Number(e.target.value))}
                      disabled={!isEditingSettings}
                      min={0}
                      step={1000}
                    />
                    <Input
                      value={appSettings.currency}
                      onChange={(e) => handleSettingsChange('currency', e.target.value)}
                      disabled={!isEditingSettings}
                      className="w-24"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Montant minimum pour qu'un vendeur puisse retirer ses gains
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Paramètres Email */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Notifications Email
                </CardTitle>
                <CardDescription>Configuration des emails automatiques</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label className="text-sm">Notifications activées</Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Envoyer des emails automatiques pour les événements importants
                    </p>
                  </div>
                  <Switch
                    checked={appSettings.emailNotificationsEnabled}
                    onCheckedChange={(v) => handleSettingsChange('emailNotificationsEnabled', v)}
                    disabled={!isEditingSettings}
                  />
                </div>

                <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-900">
                  <p className="text-sm font-medium mb-2">Types d'emails envoyés :</p>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Confirmation de commande</li>
                    <li>• Mise à jour du statut de commande</li>
                    <li>• Notification de validation de design</li>
                    <li>• Alertes de paiement</li>
                    <li>• Notifications aux vendeurs</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Mode Maintenance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Mode Maintenance
                </CardTitle>
                <CardDescription>Mettre le site en maintenance temporairement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label className="text-sm">Mode maintenance</Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Désactive temporairement l'accès au site public
                    </p>
                  </div>
                  <Switch
                    checked={appSettings.maintenanceMode}
                    onCheckedChange={(v) => handleSettingsChange('maintenanceMode', v)}
                    disabled={!isEditingSettings}
                  />
                </div>

                {appSettings.maintenanceMode && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label>Message de maintenance</Label>
                      <Textarea
                        value={appSettings.maintenanceMessage}
                        onChange={(e) => handleSettingsChange('maintenanceMessage', e.target.value)}
                        disabled={!isEditingSettings}
                        placeholder="Le site est actuellement en maintenance. Nous serons de retour bientôt."
                        rows={4}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Message affiché aux visiteurs pendant la maintenance
                      </p>
                    </div>
                  </>
                )}

                {appSettings.maintenanceMode && (
                  <div className="rounded-lg border border-orange-200 dark:border-orange-800 p-4 bg-orange-50 dark:bg-orange-900/20">
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      ⚠️ Le site est actuellement en mode maintenance. Seuls les administrateurs peuvent y accéder.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {isEditingSettings && !isLoadingSettings && (
          <div className="flex gap-2 mt-6">
            <Button onClick={handleSaveSettings} disabled={isSavingSettings} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {isSavingSettings ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditingSettings(false);
                loadAppSettings(); // Recharger les paramètres originaux
              }}
              disabled={isSavingSettings}
            >
              Annuler
            </Button>
          </div>
        )}

        {appSettings.updatedAt && (
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Dernière mise à jour : {new Date(appSettings.updatedAt).toLocaleString('fr-FR')}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsPage;
