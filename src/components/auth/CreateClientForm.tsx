import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { VendeurType, VENDEUR_TYPE_METADATA, COUNTRIES_LIST, validateImageFile, formatFileSize } from '../../types/auth.types';
import { API_CONFIG } from '../../config/api';
import { InlineLoading, ButtonLoading } from '../ui/loading';
import { User, Mail, AlertCircle, CheckCircle, UserPlus, Users, Palette, Video, Sparkles, Phone, MapPin, Home, Store, Camera, Upload } from 'lucide-react';
import Button from '../ui/Button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { CommissionSlider } from '../admin/CommissionSlider';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Header succès */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-white h-8 w-8" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Vendeur Créé !</h2>
            <p className="mt-2 text-sm text-gray-600">Le nouveau vendeur a été ajouté avec succès</p>
          </div>

          {/* Card succès */}
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                  VENDEUR_TYPE_METADATA[createdUser.vendeur_type].bgColor
                } ${VENDEUR_TYPE_METADATA[createdUser.vendeur_type].color}`}>
                  <span>{VENDEUR_TYPE_METADATA[createdUser.vendeur_type].icon}</span>
                  {VENDEUR_TYPE_METADATA[createdUser.vendeur_type].label}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations du vendeur</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nom complet</span>
                    <span className="font-medium">{createdUser.firstName} {createdUser.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium">{createdUser.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Commission</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      💰 {formData.commissionRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Statut</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Actif
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 text-center">
                  📧 Un email avec les identifiants de connexion sera envoyé à {createdUser.email}
                </p>
              </div>

              <div className="text-center">
                <InlineLoading message="Fermeture automatique dans 3 secondes..." />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        {/* Header moderne */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="text-white h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Nouveau Vendeur</h2>
          <p className="mt-2 text-sm text-gray-600">Ajoutez un vendeur à la plateforme PrintAlma</p>
        </div>

        {/* Form Card */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Créer un compte vendeur</CardTitle>
            <CardDescription className="text-center">
              Remplissez les informations du nouveau vendeur
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Message d'erreur moderne */}
              {error && (
                <Alert className="border-l-4 border-red-500 bg-red-50">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <AlertDescription className="text-sm font-medium text-red-800">
                      {error}
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              {/* Photo de profil */}
              <div className="space-y-3">
                <Label>Photo de profil (optionnel)</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={photoPreview || undefined} />
                    <AvatarFallback className="bg-gray-100 text-gray-400">
                      <Camera size={24} />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('profilePhoto')?.click()}
                        className="bg-white"
                      >
                        <Upload size={16} className="mr-2" />
                        Choisir une photo
                      </Button>
                      
                      {photoPreview && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removePhoto}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Supprimer
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      JPG, PNG, GIF ou WebP. Max 5MB.
                      {formData.profilePhoto && (
                        <span className="block mt-1 text-blue-600">
                          📁 {formData.profilePhoto.name} ({formatFileSize(formData.profilePhoto.size)})
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

              {/* Prénom et Nom sur la même ligne */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`pl-10 ${formErrors.firstName ? 'border-red-500' : ''}`}
                      placeholder="Jean"
                    />
                  </div>
                  {formErrors.firstName && (
                    <p className="text-sm text-red-600">{formErrors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`pl-10 ${formErrors.lastName ? 'border-red-500' : ''}`}
                      placeholder="Dupont"
                    />
                  </div>
                  {formErrors.lastName && (
                    <p className="text-sm text-red-600">{formErrors.lastName}</p>
                  )}
                </div>
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
                <Label htmlFor="phone">Numéro de téléphone</Label>
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
                  <SelectTrigger className={`h-12 ${formErrors.country ? 'border-red-500' : ''}`}>
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
                    className={`pl-10 ${(formErrors.shopName || shopNameError) ? 'border-red-500 bg-red-50' : ''}`}
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
                  <p className="text-sm text-blue-600 mt-1">
                    Vérification de la disponibilité...
                  </p>
                )}
              </div>

              {/* Type de vendeur moderne */}
              <div className="space-y-2">
                <Label htmlFor="vendeur_type">Type de vendeur *</Label>
                <Select value={formData.vendeur_type} onValueChange={(value) => handleSelectChange(value, 'vendeur_type')}>
                  <SelectTrigger className={`h-12 ${formErrors.vendeur_type ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Choisissez le type de vendeur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={VendeurType.DESIGNER}>
                      <div className="flex items-center gap-3 py-2">
                        <Palette className="h-5 w-5 text-purple-600" />
                        <div>
                          <div className="font-medium">🎨 Designer</div>
                          <div className="text-xs text-gray-500">Création de designs personnalisés</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value={VendeurType.INFLUENCEUR}>
                      <div className="flex items-center gap-3 py-2">
                        <Video className="h-5 w-5 text-pink-600" />
                        <div>
                          <div className="font-medium">📱 Influenceur</div>
                          <div className="text-xs text-gray-500">Promotion sur réseaux sociaux</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value={VendeurType.ARTISTE}>
                      <div className="flex items-center gap-3 py-2">
                        <Sparkles className="h-5 w-5 text-amber-600" />
                        <div>
                          <div className="font-medium">🎭 Artiste</div>
                          <div className="text-xs text-gray-500">Créations artistiques originales</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.vendeur_type && (
                  <p className="text-sm text-red-600">{formErrors.vendeur_type}</p>
                )}
              </div>

              {/* Aperçu du type sélectionné - Version moderne */}
              {formData.vendeur_type && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      formData.vendeur_type === VendeurType.DESIGNER ? 'bg-purple-100' :
                      formData.vendeur_type === VendeurType.INFLUENCEUR ? 'bg-pink-100' :
                      'bg-amber-100'
                    }`}>
                      <span className="text-lg">{VENDEUR_TYPE_METADATA[formData.vendeur_type as VendeurType].icon}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {VENDEUR_TYPE_METADATA[formData.vendeur_type as VendeurType].label}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {VENDEUR_TYPE_METADATA[formData.vendeur_type as VendeurType].description}
                      </p>
                    </div>
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
              )}

              {/* Commission Slider - Affiché seulement si un type de vendeur est sélectionné */}
              {formData.vendeur_type && (
                <div className="space-y-4">
                  <CommissionSlider
                    vendeurType={formData.vendeur_type as VendeurType}
                    value={formData.commissionRate}
                    onChange={handleCommissionChange}
                    className="w-full"
                  />
                </div>
              )}

              {/* Boutons modernes */}
              <div className="flex gap-3 pt-4">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-12 bg-black hover:bg-gray-800 text-white font-medium transition-all duration-200"
                >
                  {loading ? (
                    <ButtonLoading message="Création en cours..." />
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Créer le vendeur
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            PrintAlma © 2024 - Gestion des vendeurs
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateClientForm; 