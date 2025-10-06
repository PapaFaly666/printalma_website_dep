import React, { useState, useEffect } from 'react';
import { ClientWithCommission } from '../../hooks/useClientsWithCommissions';
import { VendeurType, VENDEUR_TYPE_METADATA, getSellerTypeIcon, getSellerTypeLabel, formatLastLoginDate } from '../../types/auth.types';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetClose 
} from '../ui/sheet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { MiniCommissionSlider } from './MiniCommissionSlider';
import { adminVendorService } from '../../services/adminVendorService';
import { 
  User, 
  Mail, 
  Calendar,
  Clock,
  Shield,
  ShieldOff,
  Key,
  AlertTriangle,
  TrendingUp,
  Package,
  DollarSign,
  BarChart3,
  Activity,
  Settings,
  Save,
  X,
  Eye,
  EyeOff,
  Percent,
  Coins,
  PiggyBank,
  Target
} from 'lucide-react';

interface ClientDetailsSheetProps {
  client: ClientWithCommission | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateCommission?: (vendeurId: number, commission: number) => Promise<void>;
}

// Interface pour les statistiques du vendeur (à implémenter avec de vraies données)
interface VendorStats {
  totalProducts: number;
  activeProducts: number;
  totalSales: number;
  totalRevenue: number;
  avgOrderValue: number;
  conversionRate: number;
  lastSaleDate?: string;
  topSellingProduct?: string;
}

export const ClientDetailsSheet: React.FC<ClientDetailsSheetProps> = ({
  client,
  isOpen,
  onClose,
  onUpdateCommission
}) => {
  const [stats, setStats] = useState<VendorStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    conversionRate: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loadingVendorDetails, setLoadingVendorDetails] = useState(false);
  const [vendorDetails, setVendorDetails] = useState<any>(null);
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    vendeur_type: (client?.vendeur_type || 'DESIGNER') as 'DESIGNER' | 'INFLUENCEUR' | 'ARTISTE',
    phone: '',
    country: '',
    address: '',
    shop_name: '',
    status: true as boolean,
    must_change_password: false as boolean,
  });
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'firstName':
      case 'lastName':
        if (value && value.trim().length < 2) return 'Au moins 2 caractères';
        return '';
      case 'email': {
        if (!value) return '';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? '' : 'Email invalide';
      }
      case 'phone': {
        if (!value) return '';
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
        return phoneRegex.test(value) ? '' : 'Téléphone invalide';
      }
      case 'shop_name':
        if (value && value.trim().length < 2) return 'Au moins 2 caractères';
        return '';
      default:
        return '';
    }
  };

  const setEditField = (field: keyof typeof editData, value: any) => {
    setEditData(v => ({ ...v, [field]: value }));
    const err = validateField(field as string, String(value ?? ''));
    setEditErrors(prev => ({ ...prev, [field]: err }));
  };

  const loadVendorDetails = async (vendorId: number) => {
    setLoadingVendorDetails(true);
    try {
      const details = await adminVendorService.getOne(vendorId);
      setVendorDetails(details);
      return details;
    } catch (error: any) {
      console.error('Erreur lors du chargement des détails du vendeur:', error);
      setMessage(`❌ Impossible de charger les détails: ${error.message}`);
      return null;
    } finally {
      setLoadingVendorDetails(false);
    }
  };

  const startEditing = async () => {
    if (!client) return;
    
    setMessage(null);
    const details = await loadVendorDetails(client.id);
    
    if (details) {
      setEditData({
        firstName: details.firstName || client.firstName || '',
        lastName: details.lastName || client.lastName || '',
        email: details.email || client.email || '',
        vendeur_type: details.vendeur_type || client.vendeur_type,
        phone: details.phone || '',
        country: details.country || '',
        address: details.address || '',
        shop_name: details.shop_name || '',
        status: details.status !== undefined ? !!details.status : !!client.status,
        must_change_password: false,
      });
      setEditErrors({});
      setEditing(true);
    }
  };

  // Initialiser les stats quand le client change
  useEffect(() => {
    if (client) {
      setEditing(false);
      setMessage(null);
      setNewPhoto(null);
      setVendorDetails(null);
      setEditErrors({});
      
      // Charger les détails du vendeur pour l'affichage
      loadVendorDetails(client.id);
      
      // TODO: Charger les vraies statistiques du vendeur depuis l'API
      // Simulation pour l'instant
      setTimeout(() => {
        setStats({
          totalProducts: Math.floor(Math.random() * 50) + 10,
          activeProducts: Math.floor(Math.random() * 30) + 5,
          totalSales: Math.floor(Math.random() * 200) + 20,
          totalRevenue: Math.floor(Math.random() * 50000) + 10000,
          avgOrderValue: Math.floor(Math.random() * 500) + 100,
          conversionRate: Math.random() * 10 + 2,
          lastSaleDate: new Date().toISOString(),
          topSellingProduct: "T-shirt personnalisé"
        });
        setLoadingStats(false);
      }, 1000);
    }
  }, [client]);

  const handleUpdateCommissionLocal = async (vendeurId: number, commission: number) => {
    if (!onUpdateCommission) {
      throw new Error('Fonction de mise à jour des commissions non disponible');
    }

    try {
      await onUpdateCommission(vendeurId, commission);
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de la commission:', error);
      throw error;
    }
  };

  const isClientLocked = (client: ClientWithCommission): boolean => {
    return client.locked_until ? new Date(client.locked_until) > new Date() : false;
  };

  if (!client) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="min-w-[900px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="text-2xl">
              {getSellerTypeIcon(client.vendeur_type)}
            </div>
            <div>
              <SheetTitle className="text-2xl">
                {client.firstName} {client.lastName}
              </SheetTitle>
              <SheetDescription className="text-base">
                {getSellerTypeLabel(client.vendeur_type)} • ID #{client.id}
              </SheetDescription>
            </div>
          </div>
          
          {/* Status badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge 
              variant={client.status ? "default" : "secondary"}
              className={client.status ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
            >
              {client.status ? '✅ Actif' : '❌ Inactif'}
            </Badge>
            
            {client.must_change_password && (
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                🔑 Doit changer son mot de passe
              </Badge>
            )}
            
            {isClientLocked(client) && (
              <Badge variant="destructive" className="text-red-800">
                🔒 Compte verrouillé
              </Badge>
            )}
            
            {client.login_attempts > 0 && !isClientLocked(client) && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                ⚠️ {client.login_attempts} tentatives échouées
              </Badge>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            {!editing ? (
              <Button variant="outline" onClick={startEditing} disabled={loadingVendorDetails}>
                {loadingVendorDetails ? 'Chargement...' : 'Éditer le vendeur'}
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Annuler l'édition
              </Button>
            )}
            {message && (
              <span className="text-sm text-gray-600">{message}</span>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Informations personnelles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Prénom</Label>
                      <Input value={editData.firstName} onChange={e => setEditField('firstName', e.target.value)} className={editErrors.firstName ? 'border-red-500' : ''} />
                      {editErrors.firstName && (<p className="text-xs text-red-600 mt-1">{editErrors.firstName}</p>)}
                    </div>
                    <div>
                      <Label>Nom</Label>
                      <Input value={editData.lastName} onChange={e => setEditField('lastName', e.target.value)} className={editErrors.lastName ? 'border-red-500' : ''} />
                      {editErrors.lastName && (<p className="text-xs text-red-600 mt-1">{editErrors.lastName}</p>)}
                    </div>
                    <div className="col-span-2">
                      <Label>Email</Label>
                      <Input type="email" value={editData.email} onChange={e => setEditField('email', e.target.value)} className={editErrors.email ? 'border-red-500' : ''} />
                      {editErrors.email && (<p className="text-xs text-red-600 mt-1">{editErrors.email}</p>)}
                    </div>
                    <div>
                      <Label>Type de vendeur</Label>
                      <select
                        value={editData.vendeur_type}
                        onChange={e => setEditField('vendeur_type', e.target.value as any)}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="DESIGNER">Designer</option>
                        <option value="INFLUENCEUR">Influenceur</option>
                        <option value="ARTISTE">Artiste</option>
                      </select>
                    </div>
                    <div>
                      <Label>Téléphone</Label>
                      <Input value={editData.phone} onChange={e => setEditField('phone', e.target.value)} className={editErrors.phone ? 'border-red-500' : ''} />
                      {editErrors.phone && (<p className="text-xs text-red-600 mt-1">{editErrors.phone}</p>)}
                    </div>
                    <div>
                      <Label>Pays</Label>
                      <Input value={editData.country} onChange={e => setEditField('country', e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <Label>Adresse</Label>
                      <Input value={editData.address} onChange={e => setEditField('address', e.target.value)} />
                    </div>
                    <div className="col-span-2">
                      <Label>Nom de boutique</Label>
                      <Input value={editData.shop_name} onChange={e => setEditField('shop_name', e.target.value)} className={editErrors.shop_name ? 'border-red-500' : ''} />
                      {editErrors.shop_name && (<p className="text-xs text-red-600 mt-1">{editErrors.shop_name}</p>)}
                    </div>
                    <div>
                      <Label>Statut</Label>
                      <select
                        value={String(editData.status)}
                        onChange={e => setEditField('status', e.target.value === 'true')}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="true">Actif</option>
                        <option value="false">Inactif</option>
                      </select>
                    </div>
                    <div>
                      <Label>Doit changer mot de passe</Label>
                      <select
                        value={String(editData.must_change_password)}
                        onChange={e => setEditField('must_change_password', e.target.value === 'true')}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="false">Non</option>
                        <option value="true">Oui</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <Label>Photo de profil</Label>
                      {vendorDetails?.profile_photo_url && (
                        <div className="mb-2">
                          <img 
                            src={vendorDetails.profile_photo_url} 
                            alt="Photo actuelle" 
                            className="w-20 h-20 object-cover rounded-full border"
                          />
                          <p className="text-xs text-gray-500 mt-1">Photo actuelle</p>
                        </div>
                      )}
                      <Input type="file" accept="image/*" onChange={e => setNewPhoto(e.target.files?.[0] || null)} />
                      <p className="text-xs text-gray-500 mt-1">Choisir une nouvelle photo (optionnel)</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setEditing(false)}>Annuler</Button>
                    <Button disabled={saving} onClick={async () => {
                      setSaving(true);
                      setMessage(null);
                      // Bloquer la sauvegarde si erreurs
                      const hasErrors = Object.values(editErrors).some(msg => !!msg);
                      if (hasErrors) {
                        setMessage('❌ Corrigez les erreurs avant de sauvegarder');
                        setSaving(false);
                        return;
                      }
                      try {
                        await adminVendorService.update(client.id, editData, newPhoto || undefined);
                        setMessage('✅ Modifié avec succès');
                        setEditing(false);
                      } catch (err: any) {
                        setMessage(`❌ ${err.message || 'Erreur'}`);
                      } finally {
                        setSaving(false);
                      }
                    }}>
                      {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{client.email}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Type de vendeur</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg">{getSellerTypeIcon(client.vendeur_type)}</span>
                      <span className="text-sm">{getSellerTypeLabel(client.vendeur_type)}</span>
                    </div>
                  </div>

                  {vendorDetails?.phone && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Téléphone</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm">{vendorDetails.phone}</span>
                      </div>
                    </div>
                  )}

                  {vendorDetails?.country && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Pays</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm">{vendorDetails.country}</span>
                      </div>
                    </div>
                  )}

                  {vendorDetails?.address && (
                    <div className="col-span-2">
                      <Label className="text-sm font-medium text-gray-600">Adresse</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm">{vendorDetails.address}</span>
                      </div>
                    </div>
                  )}

                  {vendorDetails?.shop_name && (
                    <div className="col-span-2">
                      <Label className="text-sm font-medium text-gray-600">Nom de boutique</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm">{vendorDetails.shop_name}</span>
                      </div>
                    </div>
                  )}

                  {vendorDetails?.profile_photo_url && (
                    <div className="col-span-2">
                      <Label className="text-sm font-medium text-gray-600">Photo de profil</Label>
                      <div className="mt-2">
                        <img 
                          src={vendorDetails.profile_photo_url} 
                          alt="Photo de profil" 
                          className="w-16 h-16 object-cover rounded-full border"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Date de création</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {new Date(client.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Dernière connexion</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{formatLastLoginDate(client.last_login_at)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Commission Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Réglages de commission
              </CardTitle>
              <CardDescription>
                Configurez le taux de commission pour ce vendeur avec la jauge interactive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {onUpdateCommission ? (
                  <div className="space-y-4">
                    <MiniCommissionSlider
                      vendeurId={client.id}
                      vendeurType={client.vendeur_type}
                      initialValue={client.commissionRate || 40}
                      onSave={handleUpdateCommissionLocal}
                    />
                    {client.lastUpdated && (
                      <div className="text-xs text-gray-500">
                        Dernière mise à jour: {new Date(client.lastUpdated).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                      <Percent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {client.commissionRate || 40}%
                      </div>
                      <div className="text-sm text-gray-600">Commission actuelle (lecture seule)</div>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="my-4" />
              
              <div className="text-sm text-gray-600">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Commission prélevée :</strong> {client.commissionRate || 40}%
                  </div>
                  <div>
                    <strong>Revenus vendeur :</strong> {100 - (client.commissionRate || 40)}%
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  La commission est prélevée sur les bénéfices du vendeur (Prix de vente - Prix de revient)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard des ventes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Dashboard des ventes
              </CardTitle>
              <CardDescription>
                Statistiques et performances de ce vendeur
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Chargement des statistiques...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Statistiques principales */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">Produits</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">{stats.totalProducts}</div>
                      <div className="text-xs text-blue-600/70">{stats.activeProducts} actifs</div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">Ventes</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600">{stats.totalSales}</div>
                      <div className="text-xs text-green-600/70">commandes totales</div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-600">Revenus</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-600">
                        {stats.totalRevenue.toLocaleString()} FCFA
                      </div>
                      <div className="text-xs text-purple-600/70">revenus totaux</div>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-600">Conversion</span>
                      </div>
                      <div className="text-2xl font-bold text-orange-600">
                        {stats.conversionRate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-orange-600/70">taux de conversion</div>
                    </div>
                  </div>

                  {/* Informations détaillées */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Performance</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Panier moyen :</span>
                          <span className="font-medium">{stats.avgOrderValue.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dernière vente :</span>
                          <span className="font-medium">
                            {stats.lastSaleDate ? new Date(stats.lastSaleDate).toLocaleDateString('fr-FR') : 'Aucune'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Produit populaire :</span>
                          <span className="font-medium">{stats.topSellingProduct || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Commission</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Taux actuel :</span>
                          <span className="font-medium">{client.commissionRate || 40}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Commission totale :</span>
                          <span className="font-medium">
                            {Math.round(stats.totalRevenue * (client.commissionRate || 40) / 100).toLocaleString()} FCFA
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Revenus nets vendeur :</span>
                          <span className="font-medium text-green-600">
                            {Math.round(stats.totalRevenue * (100 - (client.commissionRate || 40)) / 100).toLocaleString()} FCFA
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sécurité et accès */}
          {(isClientLocked(client) || client.login_attempts > 0 || client.must_change_password) && (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="h-5 w-5" />
                  Problèmes de sécurité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {isClientLocked(client) && (
                    <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                      <Clock className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800 dark:text-red-200">
                        Compte verrouillé jusqu'au {new Date(client.locked_until!).toLocaleString('fr-FR')}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {client.login_attempts > 0 && (
                    <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                        {client.login_attempts} tentative(s) de connexion échouée(s)
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {client.must_change_password && (
                    <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                      <Key className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800 dark:text-blue-200">
                        Le vendeur doit changer son mot de passe à sa prochaine connexion
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};