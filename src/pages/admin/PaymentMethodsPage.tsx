import React, { useState } from 'react';
import {
  Landmark,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Smartphone,
  CreditCard,
  Banknote,
  CheckCircle,
  XCircle,
  Key,
  ToggleLeft,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { AdminButton } from '../../components/admin/AdminButton';
import { usePaydunyaConfig } from '../../hooks/usePaydunyaConfig';
import { useOrangeMoneyConfig } from '../../hooks/useOrangeMoneyConfig';
import { PaymentConfigService } from '../../services/paymentConfigService';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
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
import '../../styles/admin/orders-management.css';
import '../../styles/admin/payment-methods.css';

interface PaymentMethod {
  id: number;
  name: string;
  type: 'mobile_money' | 'card' | 'bank' | 'cash_on_delivery';
  provider: string;
  apiKey?: string;
  apiSecret?: string;
  merchantId?: string;
  isActive: boolean;
  icon: string;
  description: string;
  isSystem?: boolean; // Pour les méthodes système comme le paiement à la livraison
}

const PaymentMethodsPage: React.FC = () => {
  // Hook pour la configuration Paydunya (mode admin avec authentification par cookies)
  const { config: paydunyaConfig, loading: paydunyaLoading, refetch: refetchPaydunya } = usePaydunyaConfig(true);

  // Hook pour la configuration Orange Money (mode admin avec authentification par cookies)
  const { config: orangeMoneyConfig, loading: orangeMoneyLoading, refetch: refetchOrangeMoney } = useOrangeMoneyConfig(true);

  // États pour la gestion Paydunya
  const [switchingMode, setSwitchingMode] = useState(false);
  const [isPaydunyaModalOpen, setIsPaydunyaModalOpen] = useState(false);
  const [isCreatingPaydunya, setIsCreatingPaydunya] = useState(false);

  // États pour la gestion Orange Money
  const [switchingOrangeMode, setSwitchingOrangeMode] = useState(false);
  const [isOrangeMoneyModalOpen, setIsOrangeMoneyModalOpen] = useState(false);
  const [isCreatingOrangeMoney, setIsCreatingOrangeMoney] = useState(false);

  // État pour le paiement à la livraison
  const [codEnabled, setCodEnabled] = useState(true);
  const [codLoading, setCodLoading] = useState(true);
  const [togglingCod, setTogglingCod] = useState(false);
  const [paydunyaFormData, setPaydunyaFormData] = useState({
    mode: 'test' as 'test' | 'live',
    publicKey: '',
    privateKey: '',
    token: '',
    masterKey: ''
  });

  const [orangeMoneyFormData, setOrangeMoneyFormData] = useState({
    mode: 'test' as 'test' | 'live',
    clientId: '',
    clientSecret: '',
    merchantCode: ''
  });

  // Charger le statut COD au montage
  React.useEffect(() => {
    PaymentConfigService.getCodStatus()
      .then(data => {
        setCodEnabled(data.isEnabled);
        setPaymentMethods(prev =>
          prev.map(m => m.type === 'cash_on_delivery' ? { ...m, isActive: data.isEnabled } : m)
        );
      })
      .catch(() => setCodEnabled(true))
      .finally(() => setCodLoading(false));
  }, []);

  // Toggle du paiement à la livraison
  const handleToggleCod = async () => {
    setTogglingCod(true);
    try {
      const result = await PaymentConfigService.toggleCodStatus(!codEnabled);
      setCodEnabled(result.isEnabled);
      // Sync avec la liste des moyens de paiement
      setPaymentMethods(prev =>
        prev.map(m => m.type === 'cash_on_delivery' ? { ...m, isActive: result.isEnabled } : m)
      );
    } catch (error: any) {
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setTogglingCod(false);
    }
  };

  // État pour les moyens de paiement (Wave et Orange Money sont gérés par Paydunya)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: 1,
      name: 'Paiement à la livraison',
      type: 'cash_on_delivery',
      provider: 'Cash on Delivery',
      isActive: codEnabled,
      icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%2310b981" stroke-width="2"%3E%3Cpath d="M20 6 9 17l-5-5"/%3E%3C/svg%3E',
      description: 'Paiement en espèces à la réception',
      isSystem: true
    }
  ]);

  // États pour le modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMethod, setCurrentMethod] = useState<PaymentMethod | null>(null);
  const [showSecrets, setShowSecrets] = useState<{ [key: number]: boolean }>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState<number | null>(null);

  // États du formulaire
  const [formData, setFormData] = useState({
    name: '',
    type: 'mobile_money' as 'mobile_money' | 'card' | 'bank' | 'cash_on_delivery',
    provider: '',
    apiKey: '',
    apiSecret: '',
    merchantId: '',
    isActive: true,
    icon: '',
    description: ''
  });

  // Ouvrir le modal pour ajouter
  const handleAddNew = () => {
    setIsEditing(false);
    setCurrentMethod(null);
    setFormData({
      name: '',
      type: 'mobile_money',
      provider: '',
      apiKey: '',
      apiSecret: '',
      merchantId: '',
      isActive: true,
      icon: '',
      description: ''
    });
    setIsModalOpen(true);
  };

  // Ouvrir le modal pour éditer
  const handleEdit = (method: PaymentMethod) => {
    setIsEditing(true);
    setCurrentMethod(method);
    setFormData({
      name: method.name,
      type: method.type,
      provider: method.provider,
      apiKey: method.apiKey,
      apiSecret: method.apiSecret,
      merchantId: method.merchantId || '',
      isActive: method.isActive,
      icon: method.icon,
      description: method.description
    });
    setIsModalOpen(true);
  };

  // Sauvegarder
  const handleSave = () => {
    if (isEditing && currentMethod) {
      // Mise à jour
      setPaymentMethods(prev =>
        prev.map(method =>
          method.id === currentMethod.id
            ? { ...method, ...formData }
            : method
        )
      );
    } else {
      // Création
      const newMethod: PaymentMethod = {
        id: Date.now(),
        ...formData
      };
      setPaymentMethods(prev => [...prev, newMethod]);
    }
    setIsModalOpen(false);
  };

  // Supprimer
  const handleDelete = (id: number) => {
    const method = paymentMethods.find(m => m.id === id);
    if (method?.isSystem) {
      alert('Les méthodes de paiement système ne peuvent pas être supprimées.');
      return;
    }
    setMethodToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (methodToDelete) {
      setPaymentMethods(prev => prev.filter(method => method.id !== methodToDelete));
      setDeleteDialogOpen(false);
      setMethodToDelete(null);
    }
  };

  // Toggle activation
  const toggleActive = (id: number) => {
    const method = paymentMethods.find(m => m.id === id);
    // Le COD est géré via le backend
    if (method?.type === 'cash_on_delivery') {
      handleToggleCod();
      return;
    }
    setPaymentMethods(prev =>
      prev.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m)
    );
  };

  // Toggle show secret
  const toggleShowSecret = (id: number) => {
    setShowSecrets(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Basculer entre test et live pour Paydunya
  const handlePaydunMode = async (mode: 'test' | 'live') => {
    console.log('🔄 [PaymentMethods] Basculement vers mode:', mode);

    if (mode === 'live') {
      const confirmed = window.confirm(
        '⚠️ ATTENTION: Basculer en mode PRODUCTION ?\n\n' +
        'Toutes les transactions seront RÉELLES et FACTURÉES !\n\n' +
        'Êtes-vous sûr de vouloir continuer ?'
      );
      if (!confirmed) return;
    }

    setSwitchingMode(true);
    try {
      await PaymentConfigService.switchMode(mode);
      alert(`✅ Basculement réussi vers le mode ${mode.toUpperCase()}`);
      await refetchPaydunya();
    } catch (error: any) {
      console.error('❌ [PaymentMethods] Erreur lors du basculement:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setSwitchingMode(false);
    }
  };

  // Ouvrir le modal de création de la config Paydunya
  const handleCreatePaydunyaConfig = () => {
    setIsCreatingPaydunya(true);
    setPaydunyaFormData({
      mode: 'test',
      publicKey: '',
      privateKey: '',
      token: '',
      masterKey: ''
    });
    setIsPaydunyaModalOpen(true);
  };

  // Ouvrir le modal d'édition des clés Paydunya
  const handleEditPaydunyaKeys = (mode: 'test' | 'live') => {
    setIsCreatingPaydunya(false);
    // Les clés sont stockées directement dans la config avec des préfixes test/live
    const publicKey = mode === 'test' ? paydunyaConfig?.testPublicKey : paydunyaConfig?.livePublicKey;
    const privateKey = mode === 'test' ? paydunyaConfig?.testPrivateKey : paydunyaConfig?.livePrivateKey;
    const token = mode === 'test' ? paydunyaConfig?.testToken : paydunyaConfig?.liveToken;
    const masterKey = mode === 'test' ? paydunyaConfig?.testMasterKey : paydunyaConfig?.liveMasterKey;

    setPaydunyaFormData({
      mode,
      publicKey: publicKey || '',
      privateKey: privateKey || '',
      token: token || '',
      masterKey: masterKey || ''
    });
    setIsPaydunyaModalOpen(true);
  };

  // Sauvegarder les clés Paydunya
  const handleSavePaydunyaKeys = async () => {
    // Validation : publicKey, privateKey et token sont requis (masterKey est optionnel)
    if (!paydunyaFormData.publicKey || !paydunyaFormData.privateKey || !paydunyaFormData.token) {
      alert('⚠️ Les champs Public Key, Private Key et Token sont requis');
      return;
    }

    // Validation du préfixe des clés
    const expectedPublicPrefix = paydunyaFormData.mode === 'test' ? 'test_public_' : 'live_public_';
    const expectedPrivatePrefix = paydunyaFormData.mode === 'test' ? 'test_private_' : 'live_private_';

    if (!paydunyaFormData.publicKey.startsWith(expectedPublicPrefix)) {
      alert(`⚠️ La Public Key doit commencer par "${expectedPublicPrefix}"`);
      return;
    }

    if (!paydunyaFormData.privateKey.startsWith(expectedPrivatePrefix)) {
      alert(`⚠️ La Private Key doit commencer par "${expectedPrivatePrefix}"`);
      return;
    }

    console.log('💾 [PaymentMethods] Sauvegarde des clés', paydunyaFormData.mode);

    try {
      if (isCreatingPaydunya) {
        await PaymentConfigService.createPaydunyaConfig(paydunyaFormData);
        alert(`✅ Configuration PayDunya créée avec succès en mode ${paydunyaFormData.mode.toUpperCase()}`);
      } else {
        await PaymentConfigService.updatePaydunyaKeys(paydunyaFormData);
        alert(`✅ Clés ${paydunyaFormData.mode.toUpperCase()} mises à jour avec succès`);
      }
      setIsPaydunyaModalOpen(false);
      setIsCreatingPaydunya(false);
      await refetchPaydunya();
    } catch (error: any) {
      console.error('❌ [PaymentMethods] Erreur lors de la sauvegarde des clés:', error);
      alert(`❌ Erreur: ${error.message}`);
    }
  };

  // ========== HANDLERS ORANGE MONEY ==========

  // Basculer entre test et live pour Orange Money
  const handleOrangeMoneyMode = async (mode: 'test' | 'live') => {
    console.log('🔄 [PaymentMethods] Basculement Orange Money vers mode:', mode);

    if (mode === 'live') {
      const confirmed = window.confirm(
        '⚠️ ATTENTION: Basculer en mode PRODUCTION pour Orange Money ?\n\n' +
        'Toutes les transactions seront RÉELLES et FACTURÉES !\n\n' +
        'Êtes-vous sûr de vouloir continuer ?'
      );
      if (!confirmed) return;
    }

    setSwitchingOrangeMode(true);
    try {
      await PaymentConfigService.switchOrangeMoneyMode(mode);
      alert(`✅ Basculement réussi vers le mode ${mode.toUpperCase()} pour Orange Money`);
      await refetchOrangeMoney();
    } catch (error: any) {
      console.error('❌ [PaymentMethods] Erreur lors du basculement Orange Money:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setSwitchingOrangeMode(false);
    }
  };

  // Ouvrir le modal de création de la config Orange Money
  const handleCreateOrangeMoneyConfig = () => {
    setIsCreatingOrangeMoney(true);
    setOrangeMoneyFormData({
      mode: 'test',
      clientId: '',
      clientSecret: '',
      merchantCode: ''
    });
    setIsOrangeMoneyModalOpen(true);
  };

  // Ouvrir le modal d'édition des clés Orange Money
  const handleEditOrangeMoneyKeys = (mode: 'test' | 'live') => {
    setIsCreatingOrangeMoney(false);
    const clientId = mode === 'test' ? orangeMoneyConfig?.testPublicKey : orangeMoneyConfig?.livePublicKey;
    const clientSecret = mode === 'test' ? orangeMoneyConfig?.testPrivateKey : orangeMoneyConfig?.livePrivateKey;
    const merchantCode = mode === 'test' ? orangeMoneyConfig?.testToken : orangeMoneyConfig?.liveToken;

    setOrangeMoneyFormData({
      mode,
      clientId: clientId || '',
      clientSecret: clientSecret || '',
      merchantCode: merchantCode || ''
    });
    setIsOrangeMoneyModalOpen(true);
  };

  // Sauvegarder les clés Orange Money
  const handleSaveOrangeMoneyKeys = async () => {
    // Validation : tous les champs sont requis
    if (!orangeMoneyFormData.clientId || !orangeMoneyFormData.clientSecret || !orangeMoneyFormData.merchantCode) {
      alert('⚠️ Tous les champs (Client ID, Client Secret, Merchant Code) sont requis');
      return;
    }

    console.log('💾 [PaymentMethods] Sauvegarde des clés Orange Money', orangeMoneyFormData.mode);

    try {
      if (isCreatingOrangeMoney) {
        await PaymentConfigService.createOrangeMoneyConfig(orangeMoneyFormData);
        alert(`✅ Configuration Orange Money créée avec succès en mode ${orangeMoneyFormData.mode.toUpperCase()}`);
      } else {
        await PaymentConfigService.updateOrangeMoneyKeys(orangeMoneyFormData);
        alert(`✅ Clés ${orangeMoneyFormData.mode.toUpperCase()} Orange Money mises à jour avec succès`);
      }
      setIsOrangeMoneyModalOpen(false);
      setIsCreatingOrangeMoney(false);
      await refetchOrangeMoney();
    } catch (error: any) {
      console.error('❌ [PaymentMethods] Erreur lors de la sauvegarde des clés Orange Money:', error);
      alert(`❌ Erreur: ${error.message}`);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mobile_money':
        return <Smartphone className="w-5 h-5 text-emerald-600" />;
      case 'card':
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      case 'bank':
        return <Banknote className="w-5 h-5 text-purple-600" />;
      case 'cash_on_delivery':
        return <Banknote className="w-5 h-5 text-green-600" />;
      default:
        return <Landmark className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'mobile_money':
        return 'Mobile Money';
      case 'card':
        return 'Carte bancaire';
      case 'bank':
        return 'Virement';
      case 'cash_on_delivery':
        return 'Paiement à la livraison';
      default:
        return 'Autre';
    }
  };

  return (
    <div className="orders-management-container">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Landmark className="w-7 h-7 text-[rgb(20,104,154)]" />
              Moyens de Paiement
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              Configurez les méthodes de paiement et leurs clés API
            </p>
          </div>
          <AdminButton
            onClick={handleAddNew}
            variant="primary"
            size="lg"
            className="gap-2"
          >
            <Plus className="w-5 h-5" />
            Ajouter un moyen
          </AdminButton>
        </div>
      </div>

      {/* Section Paydunya */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 shadow-sm border-2 border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Configuration PayDunya</h2>
            <p className="text-sm text-gray-600">Gestion des clés API et basculement test/live</p>
          </div>
          {paydunyaConfig && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Activer PayDunya:</span>
              <button
                onClick={async () => {
                  try {
                    await PaymentConfigService.togglePaydunyaStatus(!paydunyaConfig.isActive);
                    await refetchPaydunya();
                  } catch (error: any) {
                    alert(`❌ Erreur: ${error.message}`);
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  paydunyaConfig.isActive ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    paydunyaConfig.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}
        </div>

        {paydunyaLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Chargement...</span>
          </div>
        ) : paydunyaConfig ? (
          <div className="space-y-4">
            {/* Mode actuel */}
            <div className={`p-4 rounded-lg border-2 ${
              paydunyaConfig.activeMode === 'test'
                ? 'bg-blue-50 border-blue-300'
                : 'bg-amber-50 border-amber-400'
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {paydunyaConfig.activeMode === 'test' ? (
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl">🧪</span>
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl">🚀</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-lg">
                      {paydunyaConfig.activeMode === 'test' ? 'Mode TEST' : 'Mode PRODUCTION'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {paydunyaConfig.activeMode === 'test'
                        ? 'Transactions de test uniquement - Aucun paiement réel'
                        : '⚠️ ATTENTION: Tous les paiements sont réels et facturés'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    className={`${
                      paydunyaConfig.isActive
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {paydunyaConfig.isActive ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Actif
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactif
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Basculement de mode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">🧪</span>
                    </div>
                    Mode TEST
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Clés API de test - Transactions fictives
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs text-gray-600">
                    <p className="font-mono bg-gray-50 px-2 py-1 rounded truncate">
                      Public Key: {paydunyaConfig.testPublicKey?.substring(0, 25) || 'Non définie'}...
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <AdminButton
                      onClick={() => handlePaydunMode('test')}
                      disabled={paydunyaConfig.activeMode === 'test' || switchingMode}
                      variant={paydunyaConfig.activeMode === 'test' ? 'primary' : 'secondary'}
                      size="sm"
                      className="flex-1"
                    >
                      {switchingMode ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Basculement...
                        </>
                      ) : (
                        <>
                          {paydunyaConfig.activeMode === 'test' ? (
                            <><CheckCircle className="w-4 h-4 mr-1" /> Actuel</>
                          ) : (
                            <><ToggleLeft className="w-4 h-4 mr-1" /> Activer</>
                          )}
                        </>
                      )}
                    </AdminButton>
                    <AdminButton
                      onClick={() => handleEditPaydunyaKeys('test')}
                      variant="outline"
                      size="sm"
                    >
                      <Key className="w-4 h-4" />
                    </AdminButton>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">🚀</span>
                    </div>
                    Mode LIVE
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Clés API de production - Paiements réels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs text-gray-600">
                    <p className="font-mono bg-gray-50 px-2 py-1 rounded truncate">
                      Public Key: {paydunyaConfig.livePublicKey?.substring(0, 25) || 'Non définie'}...
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <AdminButton
                      onClick={() => handlePaydunMode('live')}
                      disabled={paydunyaConfig.activeMode === 'live' || switchingMode}
                      variant={paydunyaConfig.activeMode === 'live' ? 'destructive' : 'secondary'}
                      size="sm"
                      className="flex-1"
                    >
                      {switchingMode ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Basculement...
                        </>
                      ) : (
                        <>
                          {paydunyaConfig.activeMode === 'live' ? (
                            <><CheckCircle className="w-4 h-4 mr-1" /> Actuel</>
                          ) : (
                            <><AlertTriangle className="w-4 h-4 mr-1" /> Activer</>
                          )}
                        </>
                      )}
                    </AdminButton>
                    <AdminButton
                      onClick={() => handleEditPaydunyaKeys('live')}
                      variant="outline"
                      size="sm"
                    >
                      <Key className="w-4 h-4" />
                    </AdminButton>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-lg font-semibold text-gray-800 mb-2">Aucune configuration PayDunya</p>
            <p className="text-sm text-gray-500 mb-6">
              Configurez vos clés API PayDunya pour activer les paiements Wave et Orange Money.
            </p>
            <AdminButton
              onClick={handleCreatePaydunyaConfig}
              variant="primary"
              size="lg"
              className="gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Initialiser la configuration PayDunya
            </AdminButton>
          </div>
        )}
      </div>

      {/* Section Orange Money */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 mb-6 shadow-sm border-2 border-orange-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Configuration Orange Money</h2>
            <p className="text-sm text-gray-600">Gestion des clés API et basculement test/live</p>
          </div>
          {orangeMoneyConfig && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Activer Orange Money:</span>
              <button
                onClick={async () => {
                  try {
                    await PaymentConfigService.toggleOrangeMoneyStatus(!orangeMoneyConfig.isActive);
                    await refetchOrangeMoney();
                  } catch (error: any) {
                    alert(`❌ Erreur: ${error.message}`);
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  orangeMoneyConfig.isActive ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    orangeMoneyConfig.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}
        </div>

        {orangeMoneyLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            <span className="ml-2 text-gray-600">Chargement...</span>
          </div>
        ) : orangeMoneyConfig ? (
          <div className="space-y-4">
            {/* Mode actuel */}
            <div className={`p-4 rounded-lg border-2 ${
              orangeMoneyConfig.activeMode === 'test'
                ? 'bg-blue-50 border-blue-300'
                : 'bg-amber-50 border-amber-400'
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {orangeMoneyConfig.activeMode === 'test' ? (
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl">🧪</span>
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xl">🚀</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-lg">
                      {orangeMoneyConfig.activeMode === 'test' ? 'Mode TEST' : 'Mode PRODUCTION'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {orangeMoneyConfig.activeMode === 'test'
                        ? 'Transactions de test uniquement - Aucun paiement réel'
                        : '⚠️ ATTENTION: Tous les paiements sont réels et facturés'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    className={`${
                      orangeMoneyConfig.isActive
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {orangeMoneyConfig.isActive ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Actif
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactif
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Basculement de mode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">🧪</span>
                    </div>
                    Mode TEST
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Clés API de test - Transactions fictives
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs text-gray-600">
                    <p className="font-mono bg-gray-50 px-2 py-1 rounded truncate">
                      Client ID: {orangeMoneyConfig.testPublicKey?.substring(0, 25) || 'Non défini'}...
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <AdminButton
                      onClick={() => handleOrangeMoneyMode('test')}
                      disabled={orangeMoneyConfig.activeMode === 'test' || switchingOrangeMode}
                      variant={orangeMoneyConfig.activeMode === 'test' ? 'primary' : 'secondary'}
                      size="sm"
                      className="flex-1"
                    >
                      {switchingOrangeMode ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Basculement...
                        </>
                      ) : (
                        <>
                          {orangeMoneyConfig.activeMode === 'test' ? (
                            <><CheckCircle className="w-4 h-4 mr-1" /> Actuel</>
                          ) : (
                            <><ToggleLeft className="w-4 h-4 mr-1" /> Activer</>
                          )}
                        </>
                      )}
                    </AdminButton>
                    <AdminButton
                      onClick={() => handleEditOrangeMoneyKeys('test')}
                      variant="outline"
                      size="sm"
                    >
                      <Key className="w-4 h-4" />
                    </AdminButton>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">🚀</span>
                    </div>
                    Mode LIVE
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Clés API de production - Paiements réels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs text-gray-600">
                    <p className="font-mono bg-gray-50 px-2 py-1 rounded truncate">
                      Client ID: {orangeMoneyConfig.livePublicKey?.substring(0, 25) || 'Non défini'}...
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <AdminButton
                      onClick={() => handleOrangeMoneyMode('live')}
                      disabled={orangeMoneyConfig.activeMode === 'live' || switchingOrangeMode}
                      variant={orangeMoneyConfig.activeMode === 'live' ? 'destructive' : 'secondary'}
                      size="sm"
                      className="flex-1"
                    >
                      {switchingOrangeMode ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Basculement...
                        </>
                      ) : (
                        <>
                          {orangeMoneyConfig.activeMode === 'live' ? (
                            <><CheckCircle className="w-4 h-4 mr-1" /> Actuel</>
                          ) : (
                            <><AlertTriangle className="w-4 h-4 mr-1" /> Activer</>
                          )}
                        </>
                      )}
                    </AdminButton>
                    <AdminButton
                      onClick={() => handleEditOrangeMoneyKeys('live')}
                      variant="outline"
                      size="sm"
                    >
                      <Key className="w-4 h-4" />
                    </AdminButton>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-lg font-semibold text-gray-800 mb-2">Aucune configuration Orange Money</p>
            <p className="text-sm text-gray-500 mb-6">
              Configurez vos clés API Orange Money pour activer les paiements mobile.
            </p>
            <AdminButton
              onClick={handleCreateOrangeMoneyConfig}
              variant="primary"
              size="lg"
              className="gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Initialiser la configuration Orange Money
            </AdminButton>
          </div>
        )}
      </div>

      {/* Liste des moyens de paiement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {paymentMethods.map((method) => (
          <Card
            key={method.id}
            className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
            style={{ animation: 'fadeInUp 0.5s ease-out' }}
          >
            <CardHeader className="pb-3">
              {/* Header de la carte */}
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center bg-white rounded-lg border border-gray-200 p-2">
                    <img
                      src={method.icon}
                      alt={method.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"%3E%3Crect width="18" height="18" x="3" y="3" rx="2"/%3E%3Cpath d="m9 9 6 6M15 9l-6 6"/%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl text-gray-900">{method.name}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-1">{method.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start">
                  {getTypeIcon(method.type)}
                  <Badge
                    className={`text-xs font-semibold uppercase ${
                      method.isActive
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {method.isActive ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Actif
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactif
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Type */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</label>
                <p className="text-sm text-gray-900 font-medium mt-1">{getTypeLabel(method.type)}</p>
              </div>

              {/* Provider */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Provider</label>
                <p className="text-sm text-gray-900 font-medium mt-1">{method.provider}</p>
              </div>

              {/* Afficher les détails seulement si ce n'est pas un système de paiement */}
              {!method.isSystem && (
                <>
                  {method.merchantId && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Merchant ID</label>
                      <p className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded mt-1">{method.merchantId}</p>
                    </div>
                  )}

                  {/* API Key */}
                  {method.apiKey && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">API Key</label>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded flex-1 truncate">
                          {showSecrets[method.id] ? method.apiKey : '•••••••••••••••'}
                        </p>
                        <button
                          onClick={() => toggleShowSecret(method.id)}
                          className="text-gray-400 hover:text-[rgb(20,104,154)] transition-colors p-1"
                        >
                          {showSecrets[method.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* API Secret */}
                  {method.apiSecret && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">API Secret</label>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded flex-1 truncate">
                          {showSecrets[method.id] ? method.apiSecret : '•••••••••••••••'}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}  

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-4 border-t border-gray-100">
                <AdminButton
                  onClick={() => toggleActive(method.id)}
                  variant={method.isActive ? 'secondary' : 'primary'}
                  size="sm"
                  className="flex-1"
                  disabled={method.type === 'cash_on_delivery' && (togglingCod || codLoading)}
                >
                  {method.type === 'cash_on_delivery' && togglingCod ? (
                    <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Mise à jour...</>
                  ) : (
                    method.isActive ? 'Désactiver' : 'Activer'
                  )}
                </AdminButton>
                {!method.isSystem && (
                  <>
                    <AdminButton
                      onClick={() => handleEdit(method)}
                      variant="outline"
                      size="sm"
                      className="gap-1.5 flex-1 sm:flex-initial"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="sm:inline">Modifier</span>
                    </AdminButton>
                    <AdminButton
                      onClick={() => handleDelete(method.id)}
                      variant="destructive"
                      size="sm"
                      className="sm:w-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </AdminButton>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal d'ajout/édition */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200"
            style={{ animation: 'scaleIn 0.3s ease-out' }}
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-[rgb(20,104,154)] to-[rgb(16,83,123)]">
              <h2 className="text-xl font-bold text-white">
                {isEditing ? 'Modifier le moyen de paiement' : 'Nouveau moyen de paiement'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Nom */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom du moyen de paiement
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(20,104,154)] focus:border-[rgb(20,104,154)] transition-all"
                  placeholder="Ex: Wave, Orange Money"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(20,104,154)] focus:border-[rgb(20,104,154)] transition-all"
                >
                  <option value="mobile_money">Mobile Money</option>
                  <option value="card">Carte bancaire</option>
                  <option value="bank">Virement bancaire</option>
                  <option value="cash_on_delivery">Paiement à la livraison</option>
                </select>
              </div>

              {/* Provider */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Provider</label>
                <input
                  type="text"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(20,104,154)] focus:border-[rgb(20,104,154)] transition-all"
                  placeholder="Ex: Wave, Orange Money, Stripe"
                />
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">URL du logo</label>
                <input
                  type="url"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(20,104,154)] focus:border-[rgb(20,104,154)] transition-all"
                  placeholder="https://example.com/logo.png"
                />
                {formData.icon && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Aperçu:</span>
                    <div className="w-12 h-12 flex items-center justify-center bg-white rounded-lg border border-gray-200 p-2">
                      <img
                        src={formData.icon}
                        alt="Preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"%3E%3Crect width="18" height="18" x="3" y="3" rx="2"/%3E%3Cpath d="m9 9 6 6M15 9l-6 6"/%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(20,104,154)] focus:border-[rgb(20,104,154)] transition-all"
                  placeholder="Description courte"
                />
              </div>

              {/* Merchant ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Merchant ID (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.merchantId}
                  onChange={(e) => setFormData({ ...formData, merchantId: e.target.value })}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(20,104,154)] focus:border-[rgb(20,104,154)] transition-all"
                  placeholder="MERCHANT_ID_123"
                />
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">API Key</label>
                <input
                  type="text"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(20,104,154)] focus:border-[rgb(20,104,154)] transition-all font-mono text-sm"
                  placeholder="sk_live_***"
                />
              </div>

              {/* API Secret */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">API Secret</label>
                <input
                  type="password"
                  value={formData.apiSecret}
                  onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[rgb(20,104,154)] focus:border-[rgb(20,104,154)] transition-all font-mono text-sm"
                  placeholder="sk_secret_***"
                />
              </div>

              {/* Active */}
              <div className="flex items-center pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-[rgb(20,104,154)] border-gray-300 rounded focus:ring-[rgb(20,104,154)]"
                />
                <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                  Activer ce moyen de paiement
                </label>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 bg-gray-50">
              <AdminButton onClick={() => setIsModalOpen(false)} variant="secondary" size="lg" className="w-full sm:w-auto">
                Annuler
              </AdminButton>
              <AdminButton onClick={handleSave} variant="primary" size="lg" className="gap-2 w-full sm:w-auto">
                <Save className="w-4 h-4" />
                {isEditing ? 'Mettre à jour' : 'Créer'}
              </AdminButton>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition des clés Paydunya */}
      {isPaydunyaModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200"
            style={{ animation: 'scaleIn 0.3s ease-out' }}
          >
            <div className={`p-6 border-b border-gray-200 flex items-center justify-between ${
              paydunyaFormData.mode === 'test'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700'
                : 'bg-gradient-to-r from-amber-600 to-amber-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Key className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {isCreatingPaydunya
                      ? 'Créer la configuration PayDunya'
                      : `Clés API PayDunya - Mode ${paydunyaFormData.mode.toUpperCase()}`}
                  </h2>
                  <p className="text-sm text-white/80">
                    {isCreatingPaydunya
                      ? 'Saisissez vos clés API pour initialiser PayDunya'
                      : paydunyaFormData.mode === 'test'
                        ? 'Configuration pour les transactions de test'
                        : '⚠️ Configuration pour les transactions RÉELLES'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPaydunyaModalOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {isCreatingPaydunya && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mode</label>
                  <select
                    value={paydunyaFormData.mode}
                    onChange={(e) => setPaydunyaFormData({ ...paydunyaFormData, mode: e.target.value as 'test' | 'live' })}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="test">TEST - Transactions fictives</option>
                    <option value="live">LIVE - Paiements réels</option>
                  </select>
                </div>
              )}
              {!isCreatingPaydunya && paydunyaFormData.mode === 'live' && (
                <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900">Mode Production</p>
                      <p className="text-sm text-amber-800 mt-1">
                        Ces clés seront utilisées pour traiter les paiements réels. Assurez-vous d'utiliser
                        les clés de production fournies par PayDunya.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Public Key */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Public Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={paydunyaFormData.publicKey}
                  onChange={(e) => setPaydunyaFormData({ ...paydunyaFormData, publicKey: e.target.value })}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
                  placeholder={paydunyaFormData.mode === 'test' ? 'test_public_...' : 'live_public_...'}
                />
              </div>

              {/* Private Key */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Private Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={paydunyaFormData.privateKey}
                  onChange={(e) => setPaydunyaFormData({ ...paydunyaFormData, privateKey: e.target.value })}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
                  placeholder={paydunyaFormData.mode === 'test' ? 'test_private_...' : 'live_private_...'}
                />
              </div>

              {/* Token */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Token <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={paydunyaFormData.token}
                  onChange={(e) => setPaydunyaFormData({ ...paydunyaFormData, token: e.target.value })}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
                  placeholder="Token"
                />
              </div>

              {/* Master Key */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Master Key <span className="text-gray-500 text-xs">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={paydunyaFormData.masterKey}
                  onChange={(e) => setPaydunyaFormData({ ...paydunyaFormData, masterKey: e.target.value })}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
                  placeholder="Master Key (optionnel)"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">i</span>
                  </div>
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">Comment obtenir ces clés ?</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-800">
                      <li>Connectez-vous à votre tableau de bord PayDunya</li>
                      <li>Accédez à la section "API & Intégration"</li>
                      <li>Copiez les clés correspondantes (Test ou Live)</li>
                      <li>Collez-les dans les champs ci-dessus</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 bg-gray-50">
              <AdminButton
                onClick={() => setIsPaydunyaModalOpen(false)}
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
              >
                Annuler
              </AdminButton>
              <AdminButton
                onClick={handleSavePaydunyaKeys}
                variant="primary"
                size="lg"
                className="gap-2 w-full sm:w-auto"
              >
                <Save className="w-4 h-4" />
                {isCreatingPaydunya ? 'Créer la configuration' : 'Sauvegarder les clés'}
              </AdminButton>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition des clés Orange Money */}
      {isOrangeMoneyModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200"
            style={{ animation: 'scaleIn 0.3s ease-out' }}
          >
            <div className={`p-6 border-b border-gray-200 flex items-center justify-between ${
              orangeMoneyFormData.mode === 'test'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700'
                : 'bg-gradient-to-r from-orange-600 to-orange-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {isCreatingOrangeMoney
                      ? 'Créer la configuration Orange Money'
                      : `Clés API Orange Money - Mode ${orangeMoneyFormData.mode.toUpperCase()}`}
                  </h2>
                  <p className="text-sm text-white/80">
                    {isCreatingOrangeMoney
                      ? 'Saisissez vos clés API pour initialiser Orange Money'
                      : orangeMoneyFormData.mode === 'test'
                        ? 'Configuration pour les transactions de test'
                        : '⚠️ Configuration pour les transactions RÉELLES'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOrangeMoneyModalOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {isCreatingOrangeMoney && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mode</label>
                  <select
                    value={orangeMoneyFormData.mode}
                    onChange={(e) => setOrangeMoneyFormData({ ...orangeMoneyFormData, mode: e.target.value as 'test' | 'live' })}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  >
                    <option value="test">TEST - Transactions fictives</option>
                    <option value="live">LIVE - Paiements réels</option>
                  </select>
                </div>
              )}
              {!isCreatingOrangeMoney && orangeMoneyFormData.mode === 'live' && (
                <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-orange-900">Mode Production</p>
                      <p className="text-sm text-orange-800 mt-1">
                        Ces clés seront utilisées pour traiter les paiements réels. Assurez-vous d'utiliser
                        les clés de production fournies par Orange Money.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Client ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Client ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={orangeMoneyFormData.clientId}
                  onChange={(e) => setOrangeMoneyFormData({ ...orangeMoneyFormData, clientId: e.target.value })}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-mono text-sm"
                  placeholder="Client ID Orange Money"
                />
              </div>

              {/* Client Secret */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Client Secret <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={orangeMoneyFormData.clientSecret}
                  onChange={(e) => setOrangeMoneyFormData({ ...orangeMoneyFormData, clientSecret: e.target.value })}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-mono text-sm"
                  placeholder="Client Secret Orange Money"
                />
              </div>

              {/* Merchant Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Merchant Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={orangeMoneyFormData.merchantCode}
                  onChange={(e) => setOrangeMoneyFormData({ ...orangeMoneyFormData, merchantCode: e.target.value })}
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-mono text-sm"
                  placeholder="Code Marchand Orange Money"
                />
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs">i</span>
                  </div>
                  <div className="text-sm text-orange-900">
                    <p className="font-semibold mb-1">Comment obtenir ces clés ?</p>
                    <ol className="list-decimal list-inside space-y-1 text-orange-800">
                      <li>Contactez Orange Money Business pour obtenir vos clés API</li>
                      <li>Vous recevrez un Client ID, un Client Secret et un Merchant Code</li>
                      <li>Obtenez des clés séparées pour le mode TEST et LIVE</li>
                      <li>Copiez les clés correspondantes dans les champs ci-dessus</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 bg-gray-50">
              <AdminButton
                onClick={() => setIsOrangeMoneyModalOpen(false)}
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
              >
                Annuler
              </AdminButton>
              <AdminButton
                onClick={handleSaveOrangeMoneyKeys}
                variant="primary"
                size="lg"
                className="gap-2 w-full sm:w-auto"
              >
                <Save className="w-4 h-4" />
                {isCreatingOrangeMoney ? 'Créer la configuration' : 'Sauvegarder les clés'}
              </AdminButton>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Êtes-vous sûr de vouloir supprimer ce moyen de paiement ? Cette action est irréversible et pourrait affecter les transactions en cours.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-50">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white border-0"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PaymentMethodsPage;
