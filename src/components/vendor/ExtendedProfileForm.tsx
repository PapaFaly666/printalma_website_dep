import React, { useState, useEffect } from 'react';
import { authService } from '../../services/auth.service';
import { ExtendedVendorProfile, COUNTRIES_LIST, validateImageFile, formatFileSize } from '../../types/auth.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { InlineLoading, ButtonLoading } from '../ui/loading';
import { Phone, MapPin, Home, Store, Camera, Upload, User, Save, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface ExtendedProfileFormProps {
  onSuccess?: () => void;
  className?: string;
}

const ExtendedProfileForm: React.FC<ExtendedProfileFormProps> = ({ onSuccess, className = "" }) => {
  const [profile, setProfile] = useState<ExtendedVendorProfile | null>(null);
  const [formData, setFormData] = useState({
    phone: '',
    country: '',
    address: '',
    shop_name: '',
    profilePhoto: null as File | null
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.getExtendedVendorProfile();
      setProfile(response.vendor);
      
      // Remplir le formulaire avec les données existantes
      setFormData({
        phone: response.vendor.phone || '',
        country: response.vendor.country || '',
        address: response.vendor.address || '',
        shop_name: response.vendor.shop_name || '',
        profilePhoto: null
      });
      
      // Définir l'aperçu de la photo existante
      if (response.vendor.profile_photo_url) {
        setPhotoPreview(response.vendor.profile_photo_url);
      }
      
    } catch (err: any) {
      console.error('Erreur chargement profil:', err);
      setError(err?.message || 'Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (formData.phone && !/^[\+]?[0-9\s\-\(\)]{8,}$/.test(formData.phone)) {
      errors.phone = 'Format de téléphone invalide';
    }

    if (formData.shop_name && formData.shop_name.trim().length < 2) {
      errors.shop_name = 'Le nom de boutique doit contenir au moins 2 caractères';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Effacer l'erreur pour ce champ
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Effacer le message de succès et d'erreur
    setSuccess(false);
    setError(null);
  };

  const handleSelectChange = (value: string, field: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    setSuccess(false);
    setError(null);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
      
      setSuccess(false);
      setError(null);
    }
  };

  const removePhoto = () => {
    setFormData(prev => ({ ...prev, profilePhoto: null }));
    setPhotoPreview(profile?.profile_photo_url || null);
    
    // Reset input
    const fileInput = document.getElementById('profilePhoto') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    
    setSuccess(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setUpdating(true);
      setError(null);
      
      const response = await authService.updateVendorProfile({
        phone: formData.phone.trim() || undefined,
        country: formData.country || undefined,
        address: formData.address.trim() || undefined,
        shop_name: formData.shop_name.trim() || undefined,
        profilePhoto: formData.profilePhoto
      });
      
      if (response.success) {
        setProfile(response.vendor);
        setSuccess(true);
        
        // Réinitialiser la photo sélectionnée
        setFormData(prev => ({ ...prev, profilePhoto: null }));
        const fileInput = document.getElementById('profilePhoto') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        // Mettre à jour l'aperçu avec la nouvelle URL
        if (response.vendor.profile_photo_url) {
          setPhotoPreview(response.vendor.profile_photo_url);
        }
        
        onSuccess?.();
        
        // Cacher le message de succès après 3 secondes
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error('Erreur mise à jour profil:', err);
      setError(err?.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Mon Profil Étendu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InlineLoading message="Chargement du profil..." />
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Mon Profil Étendu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Impossible de charger le profil'}
            </AlertDescription>
          </Alert>
          <Button onClick={loadProfile} className="mt-4" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Mon Profil Étendu
        </CardTitle>
        <CardDescription>
          Gérez vos informations personnelles et votre boutique
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Messages de statut */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Profil mis à jour avec succès !
              </AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-600">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Informations de base (lecture seule) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Informations de base</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Nom complet:</span>
                <div className="font-medium">{profile.firstName} {profile.lastName}</div>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <div className="font-medium">{profile.email}</div>
              </div>
              <div>
                <span className="text-gray-600">Type de vendeur:</span>
                <div className="font-medium">{profile.vendeur_type}</div>
              </div>
              <div>
                <span className="text-gray-600">Membre depuis:</span>
                <div className="font-medium">
                  {new Date(profile.created_at).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>
          </div>

          {/* Photo de profil */}
          <div className="space-y-3">
            <Label>Photo de profil</Label>
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
                    {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
                  </Button>
                  
                  {(photoPreview || formData.profilePhoto) && (
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
            <Label htmlFor="shop_name">Nom de la boutique</Label>
            <div className="relative">
              <Store className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="shop_name"
                name="shop_name"
                type="text"
                value={formData.shop_name}
                onChange={handleInputChange}
                className={`pl-10 ${formErrors.shop_name ? 'border-red-500' : ''}`}
                placeholder="Ma Boutique Design"
              />
            </div>
            {formErrors.shop_name && (
              <p className="text-sm text-red-600">{formErrors.shop_name}</p>
            )}
          </div>

          {/* Bouton de sauvegarde */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={loadProfile}
              className="flex-1"
              disabled={updating}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={updating}
              className="flex-1 bg-black hover:bg-gray-800"
            >
              {updating ? (
                <ButtonLoading message="Mise à jour..." />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ExtendedProfileForm; 