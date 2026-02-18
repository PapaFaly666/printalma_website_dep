import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { VendeurType, VENDEUR_TYPE_METADATA, COUNTRIES_LIST, validateImageFile, formatFileSize } from '../../types/auth.types';
import { API_CONFIG } from '../../config/api';
import { InlineLoading, ButtonLoading } from '../ui/loading';
import { User, Mail, AlertCircle, CheckCircle, UserPlus, Palette, Video, Sparkles, Phone, MapPin, Home, Store, Camera, Upload } from 'lucide-react';
import { AdminButton } from '../admin/AdminButton';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { CommissionSlider } from '../admin/CommissionSlider';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreateClientFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CreateClientForm: React.FC<CreateClientFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    vendeur_type: '' as VendeurType | '',
    phone: '',
    country: '',
    address: '',
    shopName: '',
    profilePhoto: null as File | null,
    commissionRate: 10 // Valeur par défaut à 10%
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState<any>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // ✅ Nouveaux états pour la validation du nom de boutique
  const [isCheckingShopName, setIsCheckingShopName] = useState(false);    
  const [shopNameError, setShopNameError] = useState<string>('');
  
  const { createClient, loading, error, clearError } = useAuth();

  // ✅ Validation en temps réel du nom de boutique
  useEffect(() => {
    if (formData.shopName.length > 2) {
      setIsCheckingShopName(true);
      setShopNameError('');
      
      const timeoutId = setTimeout(async () => {
        try {
          const response = await fetch(`${API_CONFIG.BASE_URL}/auth/check-shop-name?name=${encodeURIComponent(formData.shopName)}`);
          if (response.ok) {
            const { available } = await response.json();
            
            if (!available) {
              setShopNameError('Ce nom de boutique est déjà utilisé par un autre vendeur');
            } else {
              setShopNameError('');
            }
          }
        } catch (error) {
          console.error('Erreur vérification nom boutique:', error);
        } finally {
          setIsCheckingShopName(false);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } else if (formData.shopName.length > 0) {
      setShopNameError('Le nom doit contenir au moins 3 caractères');
    } else {
      setShopNameError('');
    }
  }, [formData.shopName]);

  // ✅ Validation basique du nom de boutique
  const validateShopName = (value: string) => {
    if (value.length < 3) {
      return 'Le nom doit contenir au moins 3 caractères';
    }
    return '';
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'Le prénom est requis';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Le nom est requis';
    }

    if (!formData.email.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Format d\'email invalide';
    }

    if (!formData.vendeur_type) {
      errors.vendeur_type = 'Le type de vendeur est requis';
    }

    if (formData.phone && !/^[\+]?[0-9\s\-\(\)]{8,}$/.test(formData.phone)) {
      errors.phone = 'Format de téléphone invalide';
    }

    // ✅ Validation du nom de boutique
    const shopNameError = validateShopName(formData.shopName);
    if (shopNameError) {
      errors.shopName = shopNameError;
    } else if (shopNameError) {
      errors.shopName = shopNameError;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0 && !shopNameError;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Effacer l'erreur pour ce champ si elle existe
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // ✅ Effacer l'erreur du nom de boutique si elle existe
    if (name === 'shopName' && shopNameError) {
      setShopNameError('');
    }
    
    // Effacer l'erreur globale
    if (error) {
      clearError();
    }
  };

  const handleCommissionChange = (value: number) => {
    setFormData(prev => ({ ...prev, commissionRate: value }));
    
    // Effacer l'erreur globale
    if (error) {
      clearError();
    }
  };

  const handleSelectChange = (value: string, field: string = 'vendeur_type') => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Effacer l'erreur pour ce champ si elle existe
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Effacer l'erreur globale
    if (error) {
      clearError();
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Utiliser la fonction de validation centralisée
      const validation = validateImageFile(file);
      
      if (!validation.isValid) {
        setFormErrors(prev => ({ ...prev, profilePhoto: validation.error! }));
        return;
      }

      setFormData(prev => ({ ...prev, profilePhoto: file }));
      
      // Créer l'aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Effacer l'erreur
      if (formErrors.profilePhoto) {
        setFormErrors(prev => ({ ...prev, profilePhoto: '' }));
      }
    }
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, profilePhoto: null }));
    setPhotoPreview(null);
    // Reset input
    const fileInput = document.getElementById('profilePhoto') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ✅ Vérifier s'il y a des erreurs de nom de boutique
    if (shopNameError) {
      setFormErrors(prev => ({ ...prev, shopName: shopNameError }));
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await createClient({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        vendeur_type: formData.vendeur_type as VendeurType,
        phone: formData.phone.trim() || undefined,
        country: formData.country || undefined,
        address: formData.address.trim() || undefined,
        shopName: formData.shopName.trim(),
        profilePhoto: formData.profilePhoto,
        commissionRate: formData.commissionRate
      });
      
      if (result.success && result.user) {
        setCreatedUser(result.user);
        setSuccess(true);
        
        // Appeler onSuccess après un délai
        setTimeout(() => {
          onSuccess?.();
        }, 3000);
      }
    } catch (error: any) {
      console.error('Erreur lors de la création du client:', error);
      
      // ✅ Gestion spécifique du nom de boutique
      if (error.message && (error.message.includes('nom de boutique') || error.message.includes('shop_name'))) {
        setShopNameError('Ce nom de boutique est déjà utilisé par un autre vendeur');
        setFormErrors(prev => ({ ...prev, shopName: 'Ce nom de boutique est déjà utilisé par un autre vendeur' }));
      }
    }
  };

  // 🎨 Écran de succès moderne
  if (success && createdUser) {
    return (
      <div className="w-full min-h-screen bg-gray-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full"
        >
          {/* Header succès */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900">Vendeur créé !</h2>
              <p className="mt-1 text-sm text-gray-600">Le nouveau vendeur a été ajouté avec succès</p>
            </div>
          </div>

          {/* Contenu succès */}
          <div className="px-4 sm:px-6 py-8">
            <div className="max-w-2xl mx-auto">
              <Card className="shadow-sm border-gray-200">
                <CardContent className="p-8">
                  {/* Icône succès */}
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="text-green-600 h-8 w-8" />
                    </div>
                  </div>

                  {/* Type badge */}
                  <div className="text-center mb-6">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                      VENDEUR_TYPE_METADATA[createdUser.vendeur_type].bgColor
                    }`}>
                      <span>{VENDEUR_TYPE_METADATA[createdUser.vendeur_type].icon}</span>
                      {VENDEUR_TYPE_METADATA[createdUser.vendeur_type].label}
                    </div>
                  </div>

                  {/* Informations */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Nom complet</span>
                      <span className="text-sm font-medium text-gray-900">{createdUser.firstName} {createdUser.lastName}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Email</span>
                      <span className="text-sm font-medium text-gray-900">{createdUser.email}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Commission</span>
                      <span className="text-sm font-medium text-gray-900">{formData.commissionRate}%</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-gray-600">Statut</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Actif
                      </span>
                    </div>
                  </div>

                  {/* Info email */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800 text-center">
                      Un email avec les identifiants de connexion sera envoyé à {createdUser.email}
                    </p>
                  </div>

                  {/* Loading */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Fermeture automatique...
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <AdminButton
              variant="outline"
              size="sm"
              onClick={onCancel}
            >
              ← Retour
            </AdminButton>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Nouveau vendeur</h2>
              <p className="text-sm text-gray-600">Créez un compte vendeur sur la plateforme</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="px-4 sm:px-6 py-8">
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Colonne 1 */}
                  <div className="space-y-5">
                    {/* Photo de profil */}
                    <div className="space-y-2">
                      <Label>Photo de profil</Label>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={photoPreview || undefined} />
                          <AvatarFallback className="bg-gray-100 text-gray-400">
                            <Camera className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <AdminButton
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById('profilePhoto')?.click()}
                            >
                              <Upload className="h-4 w-4" />
                              Choisir
                            </AdminButton>
                            {photoPreview && (
                              <AdminButton
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={removePhoto}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                Supprimer
                              </AdminButton>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            JPG, PNG, GIF ou WebP. Max 5MB.
                            {formData.profilePhoto && (
                              <span className="block mt-1 text-blue-600">
                                {formData.profilePhoto.name} ({formatFileSize(formData.profilePhoto.size)})
                              </span>
                            )}
                          </p>
                        </div>
                        <input
                          id="profilePhoto"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </div>
                      {formErrors.profilePhoto && (
                        <p className="text-sm text-red-600">{formErrors.profilePhoto}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Adresse email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`pl-10 ${formErrors.email ? 'border-red-500' : ''}`}
                          placeholder="jean.dupont@exemple.com"
                        />
                      </div>
                      {formErrors.email && (
                        <p className="text-sm text-red-600">{formErrors.email}</p>
                      )}
                    </div>

                    {/* Téléphone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={`pl-10 ${formErrors.phone ? 'border-red-500' : ''}`}
                          placeholder="+33 6 12 34 56 78"
                        />
                      </div>
                      {formErrors.phone && (
                        <p className="text-sm text-red-600">{formErrors.phone}</p>
                      )}
                    </div>

                    {/* Pays */}
                    <div className="space-y-2">
                      <Label htmlFor="country">Pays</Label>
                      <Select value={formData.country} onValueChange={(value) => handleSelectChange(value, 'country')}>
                        <SelectTrigger className={`h-11 ${formErrors.country ? 'border-red-500' : ''}`}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <SelectValue placeholder="Sélectionnez votre pays" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES_LIST.map((country) => (
                            <SelectItem key={country.value} value={country.value}>
                              <div className="flex items-center gap-2">
                                <span>{country.flag}</span>
                                <span>{country.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.country && (
                        <p className="text-sm text-red-600">{formErrors.country}</p>
                      )}
                    </div>
                  </div>

                  {/* Colonne 2 */}
                  <div className="space-y-5">
                    {/* Prénom et Nom */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Prénom *</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className={formErrors.firstName ? 'border-red-500' : ''}
                          placeholder="Jean"
                        />
                        {formErrors.firstName && (
                          <p className="text-sm text-red-600">{formErrors.firstName}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Nom *</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className={formErrors.lastName ? 'border-red-500' : ''}
                          placeholder="Dupont"
                        />
                        {formErrors.lastName && (
                          <p className="text-sm text-red-600">{formErrors.lastName}</p>
                        )}
                      </div>
                    </div>

                    {/* Adresse */}
                    <div className="space-y-2">
                      <Label htmlFor="address">Adresse</Label>
                      <div className="relative">
                        <Home className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="address"
                          name="address"
                          type="text"
                          value={formData.address}
                          onChange={handleInputChange}
                          className={`pl-10 ${formErrors.address ? 'border-red-500' : ''}`}
                          placeholder="123 Rue de la Paix, 75001 Paris"
                        />
                      </div>
                      {formErrors.address && (
                        <p className="text-sm text-red-600">{formErrors.address}</p>
                      )}
                    </div>

                    {/* Nom de la boutique */}
                    <div className="space-y-2">
                      <Label htmlFor="shopName">Nom de la boutique *</Label>
                      <div className="relative">
                        <Store className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="shopName"
                          name="shopName"
                          type="text"
                          required
                          value={formData.shopName}
                          onChange={handleInputChange}
                          className={`pl-10 ${(formErrors.shopName || shopNameError) ? 'border-red-500' : ''}`}
                          placeholder="Ma Boutique Design"
                        />
                      </div>
                      {(formErrors.shopName || shopNameError) && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {formErrors.shopName || shopNameError}
                        </p>
                      )}
                      {isCheckingShopName && (
                        <p className="text-sm text-blue-600">
                          Vérification de la disponibilité...
                        </p>
                      )}
                    </div>

                    {/* Type de vendeur */}
                    <div className="space-y-2">
                      <Label htmlFor="vendeur_type">Type de vendeur *</Label>
                      <Select value={formData.vendeur_type} onValueChange={(value) => handleSelectChange(value, 'vendeur_type')}>
                        <SelectTrigger className={`h-11 ${formErrors.vendeur_type ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Choisissez le type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={VendeurType.DESIGNER}>
                            <div className="flex items-center gap-3 py-1">
                              <Palette className="h-4 w-4 text-purple-600" />
                              <div>
                                <div className="font-medium text-sm">🎨 Designer</div>
                                <div className="text-xs text-gray-500">Création de designs</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value={VendeurType.INFLUENCEUR}>
                            <div className="flex items-center gap-3 py-1">
                              <Video className="h-4 w-4 text-pink-600" />
                              <div>
                                <div className="font-medium text-sm">📱 Influenceur</div>
                                <div className="text-xs text-gray-500">Promotion réseaux sociaux</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value={VendeurType.ARTISTE}>
                            <div className="flex items-center gap-3 py-1">
                              <Sparkles className="h-4 w-4 text-amber-600" />
                              <div>
                                <div className="font-medium text-sm">🎭 Artiste</div>
                                <div className="text-xs text-gray-500">Créations artistiques</div>
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.vendeur_type && (
                        <p className="text-sm text-red-600">{formErrors.vendeur_type}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Aperçu du type sélectionné - pleine largeur */}
                {formData.vendeur_type && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mt-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        formData.vendeur_type === VendeurType.DESIGNER ? 'bg-purple-100' :
                        formData.vendeur_type === VendeurType.INFLUENCEUR ? 'bg-pink-100' :
                        'bg-amber-100'
                      }`}>
                        <span className="text-lg">{VENDEUR_TYPE_METADATA[formData.vendeur_type as VendeurType].icon}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {VENDEUR_TYPE_METADATA[formData.vendeur_type as VendeurType].label}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {VENDEUR_TYPE_METADATA[formData.vendeur_type as VendeurType].description}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {VENDEUR_TYPE_METADATA[formData.vendeur_type as VendeurType].features.map((feature, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium bg-white border border-gray-200 rounded-full text-gray-700"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Commission Slider - pleine largeur */}
                {formData.vendeur_type && (
                  <div className="border-t border-gray-200 pt-5 mt-5">
                    <CommissionSlider
                      vendeurType={formData.vendeur_type as VendeurType}
                      value={formData.commissionRate}
                      onChange={handleCommissionChange}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Boutons modernes */}
                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  {onCancel && (
                    <AdminButton
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      className="flex-1"
                    >
                      Annuler
                    </AdminButton>
                  )}
                  <AdminButton
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Créer le vendeur
                      </>
                    )}
                  </AdminButton>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateClientForm; 