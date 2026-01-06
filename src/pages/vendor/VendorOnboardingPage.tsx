import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  Camera,
  Facebook,
  Instagram,
  Twitter,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  X,
  Linkedin,
  Youtube,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useToast } from '../../components/ui/use-toast';
import vendorOnboardingService from '../../services/vendorOnboardingService';

interface PhoneNumber {
  id: string;
  number: string;
  isPrimary: boolean;
}

interface SocialMedia {
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube';
  username: string;
  url: string;
}

interface OnboardingData {
  phones: PhoneNumber[];
  socialMedia: SocialMedia[];
  profileImage: File | null;
  profileImagePreview: string | null;
}

const SOCIAL_PLATFORMS = [
  { id: 'facebook' as const, name: 'Facebook', icon: Facebook, placeholder: 'facebook.com/username', color: 'text-blue-600' },
  { id: 'instagram' as const, name: 'Instagram', icon: Instagram, placeholder: 'instagram.com/username', color: 'text-pink-600' },
  { id: 'twitter' as const, name: 'Twitter/X', icon: Twitter, placeholder: 'twitter.com/username', color: 'text-sky-500' },
  { id: 'linkedin' as const, name: 'LinkedIn', icon: Linkedin, placeholder: 'linkedin.com/in/username', color: 'text-blue-700' },
  { id: 'youtube' as const, name: 'YouTube', icon: Youtube, placeholder: 'youtube.com/@username', color: 'text-red-600' }
];

const VendorOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [data, setData] = useState<OnboardingData>({
    phones: [
      { id: '1', number: '', isPrimary: true }
    ],
    socialMedia: [],
    profileImage: null,
    profileImagePreview: null
  });

  const [errors, setErrors] = useState<{
    phones?: string[];
    socialMedia?: string;
    profileImage?: string;
  }>({});

  // Charger les informations existantes au montage du composant
  useEffect(() => {
    const loadExistingData = async () => {
      try {
        setInitialLoading(true);
        const existingData = await vendorOnboardingService.getOnboardingInfo();

        console.log('📥 Données existantes récupérées:', existingData);

        // Pré-remplir les téléphones s'ils existent
        if (existingData.phones && existingData.phones.length > 0) {
          const existingPhones = existingData.phones.map(phone => ({
            id: phone.id.toString(),
            number: phone.number,
            isPrimary: phone.isPrimary
          }));

          // S'assurer d'avoir au moins 1 emplacement
          while (existingPhones.length < 1) {
            existingPhones.push({
              id: Date.now().toString() + Math.random(),
              number: '',
              isPrimary: false
            });
          }

          setData(prev => ({
            ...prev,
            phones: existingPhones
          }));
        }

        // Pré-remplir les réseaux sociaux s'ils existent
        if (existingData.socialMedia && existingData.socialMedia.length > 0) {
          const existingSocial = existingData.socialMedia.map(sm => ({
            platform: sm.platform as SocialMedia['platform'],
            url: sm.url,
            username: sm.username
          }));

          setData(prev => ({
            ...prev,
            socialMedia: existingSocial
          }));
        }

        // Pré-afficher la photo de profil si elle existe
        if (existingData.profileImage) {
          const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3004';
          const imageUrl = existingData.profileImage.startsWith('http')
            ? existingData.profileImage
            : `${API_BASE}${existingData.profileImage}`;

          setData(prev => ({
            ...prev,
            profileImagePreview: imageUrl
          }));
        }

      } catch (error) {
        console.error('❌ Erreur lors du chargement des données existantes:', error);
        // Ne pas afficher d'erreur à l'utilisateur, continuer avec les valeurs par défaut
      } finally {
        setInitialLoading(false);
      }
    };

    loadExistingData();
  }, []);

  // Validation du numéro de téléphone (format sénégalais)
  const validatePhoneNumber = (phone: string): boolean => {
    // Accepte les formats: +221XXXXXXXXX, 221XXXXXXXXX, 7XXXXXXXX, 3XXXXXXXX
    // Les numéros sénégalais commencent par 7 (mobile) ou 3 (fixe)
    const phoneRegex = /^(\+?221|221)?[73][0-9]{8}$/;
    const cleanedPhone = phone.replace(/[\s-]/g, '');
    return phoneRegex.test(cleanedPhone);
  };

  // Validation des URLs de réseaux sociaux
  const validateSocialUrl = (platform: string, url: string): boolean => {
    if (!url.trim()) return true; // Optionnel

    const patterns: Record<string, RegExp> = {
      facebook: /^(https?:\/\/)?(www\.)?facebook\.com\/.+$/i,
      instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/.+$/i,
      twitter: /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.+$/i,
      linkedin: /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\/.+$/i,
      youtube: /^(https?:\/\/)?(www\.)?youtube\.com\/@?.+$/i
    };

    return patterns[platform]?.test(url) || false;
  };

  // Ajouter un numéro de téléphone
  const addPhoneNumber = () => {
    if (data.phones.length >= 3) {
      toast({
        title: 'Limite atteinte',
        description: 'Vous ne pouvez ajouter que 3 numéros maximum',
        variant: 'destructive'
      });
      return;
    }

    setData({
      ...data,
      phones: [
        ...data.phones,
        { id: Date.now().toString(), number: '', isPrimary: false }
      ]
    });
  };

  // Supprimer un numéro de téléphone
  const removePhoneNumber = (id: string) => {
    if (data.phones.length <= 1) {
      toast({
        title: 'Minimum requis',
        description: 'Vous devez avoir au moins 1 numéro de téléphone',
        variant: 'destructive'
      });
      return;
    }

    setData({
      ...data,
      phones: data.phones.filter(phone => phone.id !== id)
    });
  };

  // Mettre à jour un numéro de téléphone
  const updatePhoneNumber = (id: string, number: string) => {
    setData({
      ...data,
      phones: data.phones.map(phone =>
        phone.id === id ? { ...phone, number } : phone
      )
    });
  };

  // Définir un numéro comme principal
  const setPrimaryPhone = (id: string) => {
    setData({
      ...data,
      phones: data.phones.map(phone => ({
        ...phone,
        isPrimary: phone.id === id
      }))
    });
  };

  // Mettre à jour les réseaux sociaux
  const updateSocialMedia = (platform: typeof SOCIAL_PLATFORMS[0]['id'], url: string) => {
    const existing = data.socialMedia.find(sm => sm.platform === platform);

    if (existing) {
      if (url.trim() === '') {
        // Supprimer si vide
        setData({
          ...data,
          socialMedia: data.socialMedia.filter(sm => sm.platform !== platform)
        });
      } else {
        // Mettre à jour
        setData({
          ...data,
          socialMedia: data.socialMedia.map(sm =>
            sm.platform === platform
              ? { ...sm, url, username: extractUsername(platform, url) }
              : sm
          )
        });
      }
    } else if (url.trim() !== '') {
      // Ajouter nouveau
      setData({
        ...data,
        socialMedia: [
          ...data.socialMedia,
          {
            platform,
            url,
            username: extractUsername(platform, url)
          }
        ]
      });
    }
  };

  // Extraire le username de l'URL
  const extractUsername = (platform: string, url: string): string => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      const pathname = urlObj.pathname;
      return pathname.split('/').filter(Boolean).pop() || '';
    } catch {
      return url;
    }
  };

  // Gérer l'upload de la photo
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Validation du type de fichier
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Format invalide',
        description: 'Veuillez sélectionner une image (JPG, PNG, etc.)',
        variant: 'destructive'
      });
      return;
    }

    // Validation de la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Fichier trop volumineux',
        description: 'La photo ne doit pas dépasser 5 MB',
        variant: 'destructive'
      });
      return;
    }

    // Créer un aperçu
    const reader = new FileReader();
    reader.onloadend = () => {
      setData({
        ...data,
        profileImage: file,
        profileImagePreview: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  // Supprimer la photo
  const removeImage = () => {
    setData({
      ...data,
      profileImage: null,
      profileImagePreview: null
    });
  };

  // Validation de l'étape 1 (Téléphones) - Optionnel
  const validateStep1 = (): boolean => {
    const phoneErrors: string[] = [];
    const validPhones = data.phones.filter(p => p.number.trim() !== '');

    // Les numéros sont maintenant optionnels
    // Validation seulement si des numéros sont fournis
    if (validPhones.length > 0) {
      // Validation de chaque numéro
      validPhones.forEach((phone, index) => {
        if (!validatePhoneNumber(phone.number)) {
          phoneErrors.push(`Le numéro ${index + 1} est invalide (format attendu: +221XXXXXXXXX ou 7XXXXXXXX)`);
        }
      });

      // Vérifier les doublons
      const phoneNumbers = validPhones.map(p => p.number.replace(/[\s-]/g, ''));
      const duplicates = phoneNumbers.filter((num, index) => phoneNumbers.indexOf(num) !== index);
      if (duplicates.length > 0) {
        phoneErrors.push('Vous avez saisi le même numéro plusieurs fois');
      }
    }

    setErrors({ ...errors, phones: phoneErrors.length > 0 ? phoneErrors : undefined });
    return phoneErrors.length === 0;
  };

  // Validation de l'étape 2 (Réseaux sociaux) - Optionnel mais avec validation des URLs
  const validateStep2 = (): boolean => {
    const socialErrors: string[] = [];

    data.socialMedia.forEach(sm => {
      if (!validateSocialUrl(sm.platform, sm.url)) {
        socialErrors.push(`L'URL ${sm.platform} est invalide`);
      }
    });

    if (socialErrors.length > 0) {
      setErrors({ ...errors, socialMedia: socialErrors.join(', ') });
      return false;
    }

    setErrors({ ...errors, socialMedia: undefined });
    return true;
  };

  // Validation de l'étape 3 (Photo de profil) - Optionnel
  const validateStep3 = (): boolean => {
    // La photo est maintenant optionnelle
    setErrors({ ...errors, profileImage: undefined });
    return true;
  };

  // Passer à l'étape suivante
  const nextStep = () => {
    let isValid = false;

    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
    }

    if (isValid) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  // Revenir à l'étape précédente
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Ignorer l'onboarding et aller au dashboard
  const handleSkip = () => {
    // Marquer dans localStorage que l'utilisateur a ignoré l'onboarding
    localStorage.setItem('onboarding_skipped', 'true');
    localStorage.setItem('onboarding_skipped_at', Date.now().toString());

    toast({
      title: 'Profil à compléter',
      description: 'Vous pourrez compléter votre profil plus tard depuis votre compte.',
      variant: 'default'
    });

    // Rediriger vers le dashboard
    navigate('/vendeur/dashboard');
  };

  // Soumettre les données
  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Préparer les données
      const validPhones = data.phones
        .filter(p => p.number.trim() !== '')
        .map(p => ({
          number: p.number,
          isPrimary: p.isPrimary
        }));

      const validSocialMedia = data.socialMedia.map(sm => ({
        platform: sm.platform,
        url: sm.url
      }));

      // Envoyer l'image seulement si c'est un nouveau fichier (pas une URL existante)
      const imageToSend = data.profileImage instanceof File ? data.profileImage : null;

      // Indiquer au backend si on garde l'image existante
      const keepExistingImage = !imageToSend && !!data.profileImagePreview;

      console.log('📤 Envoi des données au backend:', {
        phones: validPhones,
        socialMedia: validSocialMedia,
        hasNewImage: !!imageToSend,
        hasExistingImage: !!data.profileImagePreview && !imageToSend,
        keepExistingImage
      });

      // Appel API - Envoyer même si tout est vide (backend doit accepter)
      const response = await vendorOnboardingService.completeOnboarding(
        {
          phones: validPhones.length > 0 ? validPhones : undefined,
          socialMedia: validSocialMedia.length > 0 ? validSocialMedia : undefined,
          keepExistingImage
        },
        imageToSend
      );

      console.log('✅ Réponse du backend:', response);

      // Supprimer le flag d'onboarding ignoré si on complète
      localStorage.removeItem('onboarding_skipped');
      localStorage.removeItem('onboarding_skipped_at');

      toast({
        title: 'Profil mis à jour',
        description: 'Votre profil a été mis à jour avec succès !',
        variant: 'default'
      });

      // Rediriger vers le dashboard vendeur
      navigate('/vendeur/dashboard');
    } catch (error: any) {
      console.error('❌ Erreur lors de la soumission:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue. Veuillez réessayer.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Afficher un écran de chargement pendant le chargement initial
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Chargement de vos informations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-block mb-4"
          >
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Bienvenue sur PrintAlma
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Complétez votre profil vendeur pour commencer
          </p>
        </div>

        {/* Indicateur de progression */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex items-center ${step < 3 ? 'flex-1' : ''}`}
              >
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step < currentStep
                      ? 'bg-blue-600 text-white shadow-md'
                      : step === currentStep
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-lg'
                      : 'bg-white border-2 border-gray-300 text-gray-500'
                  }`}
                >
                  {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 md:mx-4 transition-all ${
                      step < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs md:text-sm text-gray-600 px-1">
            <span className="text-center">Téléphones</span>
            <span className="text-center">Réseaux sociaux</span>
            <span className="text-center">Photo de profil</span>
          </div>
        </div>

        {/* Contenu des étapes */}
        <Card className="shadow-xl border border-gray-200 bg-white">
          <CardHeader className="bg-blue-600 text-white rounded-t-lg py-4 md:py-6">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              {currentStep === 1 && (
                <>
                  <Phone className="w-5 h-5 md:w-6 md:h-6" />
                  Numéros de téléphone
                </>
              )}
              {currentStep === 2 && (
                <>
                  <Instagram className="w-5 h-5 md:w-6 md:h-6" />
                  Réseaux sociaux
                </>
              )}
              {currentStep === 3 && (
                <>
                  <Camera className="w-5 h-5 md:w-6 md:h-6" />
                  Photo de profil
                </>
              )}
            </CardTitle>
            <CardDescription className="text-blue-50 text-sm md:text-base">
              {currentStep === 1 && 'Ajoutez 1 à 3 numéros de téléphone pour être joignable'}
              {currentStep === 2 && 'Ajoutez vos réseaux sociaux pour renforcer votre présence (optionnel)'}
              {currentStep === 3 && 'Ajoutez une photo de profil professionnelle'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {/* Étape 1: Téléphones */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 flex items-start gap-3 mb-6">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm md:text-base text-blue-900 font-medium">
                        Format accepté: +221XXXXXXXXX ou 7XXXXXXXX
                      </p>
                      <p className="text-xs md:text-sm text-blue-700 mt-1">
                        Le premier numéro sera votre numéro principal
                      </p>
                    </div>
                  </div>

                  {data.phones.map((phone, index) => (
                    <div key={phone.id} className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Label className="flex-1 min-w-0 text-sm md:text-base text-gray-900">
                          Numéro {index + 1}
                          {phone.isPrimary && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                              Principal
                            </span>
                          )}
                          {index < 1 && (
                            <span className="ml-1 text-xs text-red-600">*</span>
                          )}
                        </Label>
                        {index >= 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removePhoneNumber(phone.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            type="tel"
                            placeholder="+221 7XX XXX XXX"
                            value={phone.number}
                            onChange={(e) => updatePhoneNumber(phone.id, e.target.value)}
                            className="pl-10 w-full text-sm md:text-base"
                          />
                        </div>
                        {!phone.isPrimary && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPrimaryPhone(phone.id)}
                            className="whitespace-nowrap w-full sm:w-auto text-sm border-blue-600 text-blue-600 hover:bg-blue-50"
                          >
                            Définir comme principal
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {data.phones.length < 3 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addPhoneNumber}
                      className="w-full border-dashed border-2 border-blue-300 text-blue-600 hover:bg-blue-50 text-sm md:text-base py-5 md:py-6"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Ajouter un numéro (optionnel)
                    </Button>
                  )}

                  {errors.phones && errors.phones.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 space-y-2">
                      {errors.phones.map((error, i) => (
                        <p key={i} className="text-xs md:text-sm text-red-800 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span className="flex-1">{error}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Étape 2: Réseaux sociaux */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 flex items-start gap-3 mb-6">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm md:text-base text-blue-900 font-medium">
                        Cette étape est optionnelle
                      </p>
                      <p className="text-xs md:text-sm text-blue-700 mt-1">
                        Ajoutez vos réseaux sociaux pour renforcer votre crédibilité
                      </p>
                    </div>
                  </div>

                  {SOCIAL_PLATFORMS.map((platform) => {
                    const Icon = platform.icon;
                    const currentValue = data.socialMedia.find(sm => sm.platform === platform.id)?.url || '';

                    return (
                      <div key={platform.id} className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm md:text-base text-gray-900">
                          <Icon className="w-4 h-4 text-gray-700" />
                          {platform.name}
                        </Label>
                        <Input
                          type="url"
                          placeholder={platform.placeholder}
                          value={currentValue}
                          onChange={(e) => updateSocialMedia(platform.id, e.target.value)}
                          className="w-full text-sm md:text-base"
                        />
                      </div>
                    );
                  })}

                  {errors.socialMedia && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
                      <p className="text-xs md:text-sm text-red-800 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span className="flex-1">{errors.socialMedia}</span>
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Étape 3: Photo de profil */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col items-center justify-center">
                    {data.profileImagePreview ? (
                      <div className="relative">
                        <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-blue-600 shadow-lg">
                          <img
                            src={data.profileImagePreview}
                            alt="Aperçu"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0 bg-red-600 hover:bg-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <div className="w-40 h-40 md:w-48 md:h-48 rounded-full border-4 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-all">
                          <Upload className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mb-2" />
                          <p className="text-xs md:text-sm font-medium text-gray-600">Cliquez pour ajouter</p>
                          <p className="text-xs text-gray-500 mt-1">JPG, PNG (max 5MB)</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}

                    {data.profileImagePreview && (
                      <div className="mt-4">
                        <label className="cursor-pointer">
                          <Button type="button" variant="outline" asChild className="border-blue-600 text-blue-600 hover:bg-blue-50">
                            <span>
                              <Camera className="w-4 h-4 mr-2" />
                              Changer la photo
                            </span>
                          </Button>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {errors.profileImage && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
                      <p className="text-xs md:text-sm text-red-800 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1">{errors.profileImage}</span>
                      </p>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
                    <p className="text-sm md:text-base text-blue-900 font-medium flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                      Conseils pour une bonne photo
                    </p>
                    <ul className="text-xs md:text-sm text-blue-800 ml-6 md:ml-7 space-y-1 list-disc">
                      <li>Utilisez une photo récente et professionnelle</li>
                      <li>Assurez-vous que votre visage est bien visible</li>
                      <li>Évitez les photos de groupe</li>
                      <li>Préférez un arrière-plan neutre</li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Boutons de navigation */}
        <div className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1 || loading}
              className="gap-2 w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50 order-2 sm:order-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm md:text-base">Précédent</span>
            </Button>

            <div className="text-sm md:text-base text-gray-600 font-medium order-1 sm:order-2">
              Étape {currentStep} sur 3
            </div>

            <Button
              type="button"
              onClick={nextStep}
              disabled={loading}
              className="gap-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-md order-3"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm md:text-base">Chargement...</span>
                </>
              ) : currentStep === 3 ? (
                <>
                  <span className="text-sm md:text-base">Terminer</span>
                  <CheckCircle className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span className="text-sm md:text-base">Suivant</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

          {/* Bouton Ignorer */}
          <div className="flex justify-center">
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={loading}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 text-sm"
            >
              Ignorer et compléter plus tard
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VendorOnboardingPage;
