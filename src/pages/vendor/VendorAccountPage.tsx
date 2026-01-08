import React, { useState, useRef, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Eye, EyeOff, User, AlertCircle, Camera, X, Upload, Edit3, Save, Trash2, Shield, Settings, Mail, Phone, MapPin, Store, Key, AlertTriangle, Info, Move, RotateCw, ZoomIn, ZoomOut, Crop, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth.service';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { API_CONFIG, API_ENDPOINTS } from '../../config/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Slider } from '../../components/ui/slider';
import SocialMediaManager from '../../components/vendor/SocialMediaManager';
import vendorOnboardingService, { PhoneNumber as OnboardingPhone } from '../../services/vendorOnboardingService';

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

interface EditableField {
  value: string;
  isEditing: boolean;
  error: string;
  isChecking: boolean;
}

interface ImageEditor {
  scale: number;
  rotation: number;
  x: number;
  y: number;
  isDragging: boolean;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const VendorAccountPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Récupération du statut du compte au chargement
  useEffect(() => {
    const fetchAccountStatus = async () => {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.PROFILE}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setAccountStatus(data?.status ?? data?.user?.status ?? true);
        }
      } catch (error) {
        console.error('Erreur récupération statut compte:', error);
      }
    };

    fetchAccountStatus();
  }, []);

  // ✅ Récupération des réseaux sociaux au chargement
  useEffect(() => {
    const fetchSocialMedias = async () => {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/auth/vendor/social-media`, {
          credentials: 'include',
          headers: {
            'accept': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setSocialMedias({
            facebook_url: data.facebook_url || '',
            instagram_url: data.instagram_url || '',
            twitter_url: data.twitter_url || '',
            tiktok_url: data.tiktok_url || '',
            youtube_url: data.youtube_url || '',
            linkedin_url: data.linkedin_url || ''
          });
        }
      } catch (error) {
        console.error('Erreur récupération réseaux sociaux:', error);
      }
    };

    fetchSocialMedias();
  }, []);

  // ✅ Récupération du profil (fonction et bio) au chargement
  useEffect(() => {
    const fetchProfileBio = async () => {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/auth/vendor/profile/bio`, {
          credentials: 'include',
          headers: {
            'accept': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setEditableFields(prev => ({
            ...prev,
            function: {
              ...prev.function,
              value: data.professional_title || 'Créateur de designs personnalisés'
            },
            about: {
              ...prev.about,
              value: data.vendor_bio || ''
            }
          }));
        }
      } catch (error) {
        console.error('Erreur récupération profil vendeur:', error);
      }
    };

    fetchProfileBio();
  }, []);

  // ✅ Récupération des numéros de téléphone au chargement
  useEffect(() => {
    loadPhoneNumbers();
  }, []);

  const loadPhoneNumbers = async () => {
    setLoadingPhones(true);
    try {
      const info = await vendorOnboardingService.getOnboardingInfo();
      setPhoneNumbers(info.phones);
    } catch (error) {
      console.error('Erreur chargement numéros:', error);
    } finally {
      setLoadingPhones(false);
    }
  };

  const openPhoneDialog = () => {
    setEditingPhones(phoneNumbers.map(p => ({ number: p.number, isPrimary: p.isPrimary })));
    setShowPhoneDialog(true);
  };

  const validateSenegalPhone = (phone: string): boolean => {
    const phoneRegex = /^(\+?221|221)?[73][0-9]{8}$/;
    const cleanedPhone = phone.replace(/[\s-]/g, '');
    return phoneRegex.test(cleanedPhone);
  };

  const handleSavePhones = async () => {
    // Validation
    const validPhones = editingPhones.filter(p => p.number.trim() !== '');

    if (validPhones.length < 1 || validPhones.length > 3) {
      toast.error('Vous devez avoir entre 1 et 3 numéros de téléphone');
      return;
    }

    for (const phone of validPhones) {
      if (!validateSenegalPhone(phone.number)) {
        toast.error(`Le numéro ${phone.number} est invalide`);
        return;
      }
    }

    const primaryCount = validPhones.filter(p => p.isPrimary).length;
    if (primaryCount !== 1) {
      toast.error('Vous devez désigner exactement un numéro comme principal');
      return;
    }

    setIsLoading(true);
    try {
      await vendorOnboardingService.updatePhones(validPhones);
      toast.success('Numéros mis à jour avec succès');
      setShowPhoneDialog(false);
      await loadPhoneNumbers();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  const addPhone = () => {
    if (editingPhones.length >= 3) {
      toast.error('Maximum 3 numéros');
      return;
    }
    setEditingPhones([...editingPhones, { number: '', isPrimary: false }]);
  };

  const removePhone = (index: number) => {
    if (editingPhones.length <= 1) {
      toast.error('Minimum 1 numéro requis');
      return;
    }
    setEditingPhones(editingPhones.filter((_, i) => i !== index));
  };

  const updatePhone = (index: number, number: string) => {
    const updated = [...editingPhones];
    updated[index].number = number;
    setEditingPhones(updated);
  };

  const setPrimary = (index: number) => {
    setEditingPhones(editingPhones.map((p, i) => ({ ...p, isPrimary: i === index })));
  };

  // ✅ États pour les champs éditables individuels
  const [editableFields, setEditableFields] = useState<Record<string, EditableField>>({
    firstName: { value: user?.firstName || '', isEditing: false, error: '', isChecking: false },
    lastName: { value: user?.lastName || '', isEditing: false, error: '', isChecking: false },
    email: { value: user?.email || '', isEditing: false, error: '', isChecking: false },
    phone: { value: (user as any)?.phone || '', isEditing: false, error: '', isChecking: false },
    country: { value: (user as any)?.country || '', isEditing: false, error: '', isChecking: false },
    address: { value: (user as any)?.address || '', isEditing: false, error: '', isChecking: false },
    shop_name: { value: (user as any)?.shop_name || '', isEditing: false, error: '', isChecking: false },
    about: { value: '', isEditing: false, error: '', isChecking: false }, // Sera mis à jour par l'API
    function: { value: '', isEditing: false, error: '', isChecking: false } // Sera mis à jour par l'API
  });

  // États pour les réseaux sociaux
  const [socialMedias, setSocialMedias] = useState<Record<string, string>>({
    facebook_url: (user as any)?.facebook_url || '',
    instagram_url: (user as any)?.instagram_url || '',
    twitter_url: (user as any)?.twitter_url || '',
    tiktok_url: (user as any)?.tiktok_url || '',
    youtube_url: (user as any)?.youtube_url || '',
    linkedin_url: (user as any)?.linkedin_url || ''
  });

  // États pour la photo de profil
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // États pour l'éditeur d'image style WhatsApp
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [imageEditor, setImageEditor] = useState<ImageEditor>({
    scale: 1,
    rotation: 0,
    x: 0,
    y: 0,
    isDragging: false
  });
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 50,
    y: 50,
    width: 200,
    height: 200
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  // États react-easy-crop
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const onCropComplete = useCallback((_area: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  }, []);

  // États pour le changement de mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  // États pour la désactivation/réactivation de compte
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [deactivateConfirmation, setDeactivateConfirmation] = useState('');
  const [accountStatus, setAccountStatus] = useState<boolean>(true); // true = actif, false = désactivé

  // États pour la gestion des numéros de téléphone
  const [phoneNumbers, setPhoneNumbers] = useState<OnboardingPhone[]>([]);
  const [loadingPhones, setLoadingPhones] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [editingPhones, setEditingPhones] = useState<Array<{ number: string; isPrimary: boolean }>>([]);

  // ✅ Validation en temps réel du nom de boutique
  useEffect(() => {
    const shopName = editableFields.shop_name.value;
    if (shopName.length > 2) {
      setEditableFields(prev => ({
        ...prev,
        shop_name: { ...prev.shop_name, isChecking: true, error: '' }
      }));
      
      const timeoutId = setTimeout(async () => {
        try {
          const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.CHECK_SHOP_NAME}?name=${encodeURIComponent(shopName)}`);
          if (response.ok) {
            const { available } = await response.json();
            
            if (!available) {
              setEditableFields(prev => ({
                ...prev,
                shop_name: { 
                  ...prev.shop_name, 
                  error: 'Ce nom de boutique est déjà utilisé par un autre vendeur',
                  isChecking: false
                }
              }));
            } else {
              setEditableFields(prev => ({
                ...prev,
                shop_name: { ...prev.shop_name, error: '', isChecking: false }
              }));
            }
          }
        } catch (error) {
          console.error('Erreur vérification nom boutique:', error);
          setEditableFields(prev => ({
            ...prev,
            shop_name: { ...prev.shop_name, isChecking: false }
          }));
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } else if (shopName.length > 0) {
      setEditableFields(prev => ({
        ...prev,
        shop_name: { 
          ...prev.shop_name, 
          error: 'Le nom doit contenir au moins 3 caractères',
          isChecking: false
        }
      }));
    } else {
      setEditableFields(prev => ({
        ...prev,
        shop_name: { ...prev.shop_name, error: '', isChecking: false }
      }));
    }
  }, [editableFields.shop_name.value]);

  // ✅ Validation en temps réel de l'email
  useEffect(() => {
    const email = editableFields.email.value;
    if (email && !validateEmail(email)) {
      setEditableFields(prev => ({
        ...prev,
        email: { ...prev.email, error: 'Format d\'email invalide' }
      }));
    } else if (email && validateEmail(email)) {
      setEditableFields(prev => ({
        ...prev,
        email: { ...prev.email, error: '' }
      }));
    }
  }, [editableFields.email.value]);

  // ✅ Fonctions pour l'édition individuelle
  const startEditing = (fieldName: string) => {
    setEditableFields(prev => ({
      ...prev,
      [fieldName]: { ...prev[fieldName], isEditing: true }
    }));
  };

  const cancelEditing = (fieldName: string) => {
    // Pour function et about, conserver la valeur actuelle au lieu de restaurer depuis user
    if (fieldName === 'function' || fieldName === 'about') {
      setEditableFields(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          isEditing: false,
          error: ''
        }
      }));
    } else {
      setEditableFields(prev => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          isEditing: false,
          value: String((user as any)?.[fieldName] || ''),
          error: ''
        }
      }));
    }
  };

  const updateField = useCallback((fieldName: string, value: string) => {
    // Éviter le re-rendu si la valeur est identique (évite la perte de focus)
    setEditableFields(prev => {
      const currentValue = prev[fieldName]?.value;
      if (currentValue === value) {
        return prev; // Pas de changement, pas de re-rendu
      }
      return {
        ...prev,
        [fieldName]: { ...prev[fieldName], value }
      };
    });
  }, []);

  const saveField = async (fieldName: string) => {
    const field = editableFields[fieldName];
    if (field.error) {
      toast.error('Veuillez corriger les erreurs avant de sauvegarder');
      return;
    }

    setIsLoading(true);
    try {
      // Utiliser l'API spécifique pour la fonction et la bio
      if (fieldName === 'function' || fieldName === 'about') {
        const profileData = {
          professional_title: fieldName === 'function' ? field.value : editableFields.function.value,
          vendor_bio: fieldName === 'about' ? field.value : editableFields.about.value
        };

        const response = await fetch(`${API_CONFIG.BASE_URL}/auth/vendor/profile/bio`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json'
          },
          body: JSON.stringify(profileData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          toast.error(errorText || 'Erreur lors de la mise à jour du profil');
        } else {
          const data = await response.json();
          console.log('Profil mis à jour:', data);

          setEditableFields(prev => ({
            ...prev,
            [fieldName]: { ...prev[fieldName], isEditing: false }
          }));

          toast.success(`${fieldName === 'function' ? 'Fonction' : 'À propos'} mis à jour avec succès`);
          if (refreshUser) await refreshUser();
        }
      } else {
        // Pour les autres champs, utiliser l'API standard
        const formData = new FormData();
        formData.append(fieldName, field.value);

        const response = await fetch(
          API_CONFIG.BASE_URL + API_ENDPOINTS.AUTH.UPDATE_VENDOR_PROFILE,
          {
            method: 'PUT',
            credentials: 'include',
            body: formData
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          if (errorText.includes('nom de boutique') || errorText.includes('shop_name')) {
            setEditableFields(prev => ({
              ...prev,
              shop_name: {
                ...prev.shop_name,
                error: 'Ce nom de boutique est déjà utilisé par un autre vendeur'
              }
            }));
          }
          toast.error(errorText || 'Erreur lors de la mise à jour');
        } else {
          setEditableFields(prev => ({
            ...prev,
            [fieldName]: { ...prev[fieldName], isEditing: false }
          }));
          toast.success(`${fieldName === 'firstName' ? 'Prénom' :
                        fieldName === 'lastName' ? 'Nom' :
                        fieldName === 'email' ? 'Email' :
                        fieldName === 'phone' ? 'Téléphone' :
                        fieldName === 'country' ? 'Pays' :
                        fieldName === 'address' ? 'Adresse' :
                        'Nom de boutique'} mis à jour avec succès`);
          if (refreshUser) await refreshUser();
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour mettre à jour les réseaux sociaux
  const handleUpdateSocialMedias = async (updatedSocialMedias: Record<string, string>) => {
    if (!user) {
      toast.error('Utilisateur non trouvé');
      return;
    }

    setIsLoading(true);
    try {
      // Utiliser l'API PUT /auth/vendor/social-media
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/vendor/social-media`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          facebook_url: updatedSocialMedias.facebook_url || '',
          instagram_url: updatedSocialMedias.instagram_url || '',
          twitter_url: updatedSocialMedias.twitter_url || '',
          tiktok_url: updatedSocialMedias.tiktok_url || '',
          youtube_url: updatedSocialMedias.youtube_url || '',
          linkedin_url: updatedSocialMedias.linkedin_url || ''
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Erreur lors de la mise à jour des réseaux sociaux');
      }

      const data = await response.json();
      setSocialMedias(updatedSocialMedias);
      toast.success('Réseaux sociaux mis à jour avec succès');
      if (refreshUser) await refreshUser();
    } catch (error: any) {
      console.error('Erreur mise à jour réseaux sociaux:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour des réseaux sociaux');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Gestion du drag & drop pour la photo
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileChange({ target: { files } } as any);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (!validTypes.includes(file.type)) {
        toast.error('Format de fichier non supporté. Utilisez JPG, PNG ou WebP.');
        return;
      }
      if (file.size > maxSize) {
        toast.error('Le fichier est trop volumineux. Taille maximum : 5MB.');
        return;
      }

      // Ouvrir l'éditeur d'image style WhatsApp
      const url = URL.createObjectURL(file);
      setOriginalImageUrl(url);
      setProfilePhoto(file);
      setShowImageEditor(true);

      // Réinitialiser les paramètres d'édition
      setImageEditor({
        scale: 1,
        rotation: 0,
        x: 0,
        y: 0,
        isDragging: false
      });
    }
  };

  // Fonctions pour l'éditeur d'image
  const handleImageMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setImageEditor(prev => ({ ...prev, isDragging: true }));
  }, []);

  const handleImageMouseMove = useCallback((e: React.MouseEvent) => {
    if (!imageEditor.isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setImageEditor(prev => ({
      ...prev,
      x: x - rect.width / 2,
      y: y - rect.height / 2
    }));
  }, [imageEditor.isDragging]);

  const handleImageMouseUp = useCallback(() => {
    setImageEditor(prev => ({ ...prev, isDragging: false }));
  }, []);

  const handleScaleChange = (value: number[]) => {
    setImageEditor(prev => ({ ...prev, scale: value[0] }));
  };

  const handleRotationChange = () => {
    setImageEditor(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }));
  };

  const generateCroppedImage = useCallback(async (): Promise<Blob | null> => {
    if (!originalImageUrl || !croppedAreaPixels) return null;
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.crossOrigin = 'anonymous';
      img.src = originalImageUrl;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const { width, height, x, y } = croppedAreaPixels;
    canvas.width = width;
    canvas.height = height;

    ctx.save();
    // Dessiner la zone rognée
    ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
    ctx.restore();

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
    });
  }, [originalImageUrl, croppedAreaPixels]);

  const handleSaveEditedImage = async () => {
    try {
      const croppedBlob = await generateCroppedImage();
      if (!croppedBlob) {
        toast.error('Erreur lors du traitement de l\'image');
        return;
      }

      // Créer un nouveau fichier à partir du blob
      const croppedFile = new File([croppedBlob], profilePhoto?.name || 'profile.jpg', {
        type: 'image/jpeg'
      });

      // Créer une URL d'aperçu
      const previewURL = URL.createObjectURL(croppedBlob);
      setPreviewUrl(previewURL);
      setProfilePhoto(croppedFile);

      // Fermer l'éditeur
      setShowImageEditor(false);
      toast.success('Image ajustée avec succès');
    } catch (error) {
      console.error('Erreur lors du traitement de l\'image:', error);
      toast.error('Erreur lors du traitement de l\'image');
    }
  };

  const handleCancelImageEdit = () => {
    setShowImageEditor(false);
    setProfilePhoto(null);
    if (originalImageUrl) {
      URL.revokeObjectURL(originalImageUrl);
      setOriginalImageUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadPhoto = async () => {
    if (!profilePhoto) return;
    
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('profilePhoto', profilePhoto);
      
      const response = await fetch(
        API_CONFIG.BASE_URL + API_ENDPOINTS.AUTH.UPDATE_VENDOR_PROFILE,
        {
          method: 'PUT',
          credentials: 'include',
          body: formData
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        toast.error(errorText || 'Erreur lors de l\'upload de la photo');
      } else {
        toast.success('Photo de profil mise à jour avec succès');
        setProfilePhoto(null);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (refreshUser) await refreshUser();
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'upload de la photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Tous les champs sont requis');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await authService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });
      if (response.message) {
        toast.success('Mot de passe modifié avec succès');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordDialog(false);
      } else {
        toast.error('Erreur lors du changement de mot de passe');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (deactivateConfirmation !== 'DESACTIVER') {
      toast.error('Veuillez taper DESACTIVER pour confirmer');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        API_CONFIG.BASE_URL + API_ENDPOINTS.AUTH.VENDOR_DEACTIVATE,
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        toast.error(errorText || 'Erreur lors de la désactivation du compte');
      } else {
        const data = await response.json();
        setAccountStatus(data.data.status);
        toast.success('Compte désactivé avec succès. Vos produits sont maintenant masqués aux clients.');
        setShowDeactivateDialog(false);
        setDeactivateConfirmation('');
        if (refreshUser) await refreshUser();
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la désactivation du compte');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReactivateAccount = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        API_CONFIG.BASE_URL + API_ENDPOINTS.AUTH.VENDOR_REACTIVATE,
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        toast.error(errorText || 'Erreur lors de la réactivation du compte');
      } else {
        const data = await response.json();
        setAccountStatus(data.data.status);
        toast.success('Compte réactivé avec succès. Vos produits sont maintenant visibles aux clients.');
        if (refreshUser) await refreshUser();
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la réactivation du compte');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Composant pour un champ éditable avec design moderne
  const EditableField = React.memo(({
    fieldName,
    label,
    placeholder,
    type = 'text',
    icon: Icon,
    description
  }: {
    fieldName: string;
    label: string;
    placeholder: string;
    type?: string;
    icon?: any;
    description?: string;
    validation?: (value: string) => string;
  }) => {
    const field = editableFields[fieldName];
    
    return (
      <div className="space-y-3">
        <Label htmlFor={fieldName} className="text-base font-medium text-gray-900 leading-relaxed">
          {label}
        </Label>
        
        {field.isEditing ? (
          <div className="space-y-3">
            <div className="relative">
              {Icon && <Icon className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10" />}
              {fieldName === 'about' ? (
                <textarea
                  id={fieldName}
                  defaultValue={field.value}
                  onBlur={(e) => updateField(fieldName, e.target.value)}
                  className={`w-full min-h-[120px] text-base leading-relaxed ${Icon ? 'pl-12 pt-3 pb-3' : 'pt-3 pb-3'} ${field.error ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none outline-none`}
                  placeholder={placeholder}
                  rows={4}
                  style={{ resize: 'none' }}
                />
              ) : (
                <Input
                  id={fieldName}
                  type={type}
                  defaultValue={field.value}
                  onBlur={(e) => updateField(fieldName, e.target.value)}
                  className={`text-base leading-relaxed ${Icon ? 'pl-12' : ''} ${field.error ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  placeholder={placeholder}
                />
              )}
            </div>
            
            {field.error && (
              <p className="text-sm text-red-600 flex items-center gap-2 leading-relaxed">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {field.error}
              </p>
            )}
            
            {field.isChecking && (
              <p className="text-sm text-blue-600 flex items-center gap-2 leading-relaxed">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Vérification en cours...
              </p>
            )}
            
            {description && !field.error && (
              <p className="text-sm text-gray-500 leading-relaxed flex items-start gap-2">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                {description}
              </p>
            )}
            
            <div className="flex gap-3 pt-2">
              <Button
                size="sm"
                onClick={() => saveField(fieldName)}
                disabled={isLoading || !!field.error}
                className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-md"
              >
                <Save className="h-4 w-4 mr-2" />
                Sauvegarder
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => cancelEditing(fieldName)}
                disabled={isLoading}
                className="text-sm font-semibold text-gray-700 border-gray-300 hover:bg-gray-100 px-4 py-2 rounded-lg transition-all duration-200"
              >
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200">
            <div className="flex items-center gap-3 flex-1">
              {Icon && <Icon className="h-5 w-5 text-gray-400 flex-shrink-0" />}
              <div className="min-w-0 flex-1">
                <span className="text-base text-gray-900 leading-relaxed">
                  {field.value || <span className="text-gray-400 italic">Non renseigné</span>}
                </span>
                {description && (
                  <p className="text-sm text-gray-500 leading-relaxed mt-1">
                    {description}
                  </p>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => startEditing(fieldName)}
              className="text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 flex-shrink-0"
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Modifier
            </Button>
          </div>
        )}
      </div>
    );
  });

  EditableField.displayName = 'EditableField';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 font-sans">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header moderne avec typographie améliorée */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                Mon Profil Vendeur
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed mt-2">
                Gérez vos informations professionnelles et vos paramètres
              </p>
            </div>
            <Badge className={accountStatus ? "bg-green-100 text-green-800 font-semibold text-sm px-4 py-2" : "bg-orange-100 text-orange-800 font-semibold text-sm px-4 py-2"}>
              {accountStatus ? '✓ Compte Actif' : '⚠ Compte Désactivé'}
            </Badge>
          </div>
        </div>

        {/* Bandeau d'avertissement si compte désactivé */}
        {!accountStatus && (
          <Alert className="border-orange-200 bg-orange-50 mb-6">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <AlertDescription className="text-sm text-orange-800 leading-relaxed">
              <div className="flex items-center justify-between">
                <span>
                  <strong>Votre compte est désactivé.</strong> Vos produits sont masqués aux clients mais vous gardez un accès complet : visualisation, ajout, modification de produits et designs.
                </span>
                <Button
                  size="sm"
                  onClick={handleReactivateAccount}
                  disabled={isLoading}
                  className="ml-4 text-sm font-semibold bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Réactivation...
                    </>
                  ) : (
                    'Réactiver mon compte'
                  )}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="max-w-5xl mx-auto">
          <div className="space-y-8">

            {/* Groupe: Identité visuelle */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Identité Visuelle</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              </div>

              {/* Section Photo de profil */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                  <Camera className="h-6 w-6 text-blue-600" />
                  Photo de profil
                </CardTitle>
                <CardDescription className="text-sm text-gray-500 leading-relaxed">
                  Votre image professionnelle visible par les clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="relative group">
                    <Avatar className="h-28 w-28 border-4 border-white shadow-xl">
                      <AvatarImage
                        src={previewUrl || user?.profile_photo_url || undefined}
                        alt={user?.firstName || 'Photo de profil'}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-bold">
                        {user?.firstName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Bouton d'édition overlay */}
                    {(user?.profile_photo_url || previewUrl) && (
                      <button
                        onClick={() => {
                          const imageUrl = previewUrl || user?.profile_photo_url;
                          if (imageUrl) {
                            setOriginalImageUrl(imageUrl);
                            setShowImageEditor(true);
                            setImageEditor({
                              scale: 1,
                              rotation: 0,
                              x: 0,
                              y: 0,
                              isDragging: false
                            });
                          }
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full"
                      >
                        <Edit3 className="h-6 w-6" />
                      </button>
                    )}

                    {/* Badge de statut */}
                    {profilePhoto && (
                      <Badge className="absolute -bottom-2 -right-2 bg-green-600 text-white font-semibold">
                        Nouvelle
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                        isDragOver 
                          ? 'border-blue-400 bg-blue-50 shadow-lg' 
                          : 'border-gray-300 hover:border-gray-400 hover:shadow-md'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-base text-gray-600 mb-3 leading-relaxed">
                        Glissez-déposez votre photo ici ou
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm font-semibold border-gray-300 hover:bg-gray-100 px-6 py-2 rounded-lg transition-all duration-200"
                      >
                        Choisir un fichier
                      </Button>
                      <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                        JPG, PNG, WebP (max 5MB)
                      </p>
                    </div>
                    
                    {profilePhoto && (
                      <div className="flex gap-3">
                        <Button
                          onClick={handleUploadPhoto}
                          disabled={isUploadingPhoto}
                          className="flex-1 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-200 hover:shadow-md"
                        >
                          {isUploadingPhoto ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Upload en cours...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Uploader la photo
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleRemovePhoto}
                          className="text-sm font-semibold text-red-600 border-red-300 hover:bg-red-50 px-4 py-3 rounded-lg transition-all duration-200"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </CardContent>
            </Card>
            </div>

            {/* Groupe: Informations professionnelles */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Informations Professionnelles</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              </div>

              {/* Section Informations personnelles */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                  <User className="h-6 w-6 text-blue-600" />
                  Informations personnelles
                </CardTitle>
                <CardDescription className="text-sm text-gray-500 leading-relaxed">
                  Vos coordonnées et informations de contact
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <EditableField
                    fieldName="firstName"
                    label="Prénom"
                    placeholder="Votre prénom"
                    icon={User}
                    description="Votre prénom sera visible sur votre profil"
                  />
                  <EditableField
                    fieldName="lastName"
                    label="Nom"
                    placeholder="Votre nom"
                    icon={User}
                    description="Votre nom sera visible sur votre profil"
                  />
                </div>
                
                <EditableField
                  fieldName="email"
                  label="Adresse email"
                  placeholder="votre@email.com"
                  type="email"
                  icon={Mail}
                  description="Votre adresse email ne sera pas partagée publiquement"
                />
                
                <EditableField
                  fieldName="phone"
                  label="Téléphone"
                  placeholder="+33 6 12 34 56 78"
                  type="tel"
                  icon={Phone}
                  description="Votre numéro de téléphone pour les communications"
                />
                
                <EditableField
                  fieldName="country"
                  label="Pays"
                  placeholder="France"
                  icon={MapPin}
                  description="Votre pays de résidence"
                />
                
                <EditableField
                  fieldName="address"
                  label="Adresse"
                  placeholder="Votre adresse complète"
                  icon={MapPin}
                  description="Votre adresse de livraison"
                />
                
                <EditableField
                  fieldName="shop_name"
                  label="Nom de la boutique"
                  placeholder="Nom de votre boutique"
                  icon={Store}
                  description="Le nom unique de votre boutique en ligne"
                />

                <EditableField
                  fieldName="function"
                  label="Votre fonction"
                  placeholder="ex: Graphiste designer, Créateur de contenu..."
                  icon={User}
                  description="Votre titre professionnel qui sera affiché sur votre profil"
                />

                <EditableField
                  fieldName="about"
                  label="À propos de vous"
                  placeholder="Décrivez votre parcours, votre style, votre inspiration..."
                  icon={User}
                  description="Présentez-vous aux clients pour créer un lien de confiance"
                />
              </CardContent>
            </Card>

            {/* Section Numéros de téléphone */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                  <Phone className="h-6 w-6 text-blue-600" />
                  Numéros de téléphone
                </CardTitle>
                <CardDescription className="text-sm text-gray-500 leading-relaxed">
                  Vos numéros pour les paiements et communications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingPhones ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : phoneNumbers.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      {phoneNumbers.map((phone, index) => (
                        <div
                          key={phone.number || index}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200"
                        >
                          <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="text-base font-medium text-gray-900">{phone.number}</p>
                              {phone.isPrimary && (
                                <Badge variant="outline" className="mt-1 text-xs bg-blue-50 text-blue-700 border-blue-300">
                                  Principal
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      onClick={openPhoneDialog}
                      className="w-full text-sm font-semibold text-blue-600 border-blue-300 hover:bg-blue-50 px-4 py-3 rounded-lg transition-all duration-200"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Modifier les numéros
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Phone className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">Aucun numéro enregistré</p>
                    <Button
                      onClick={openPhoneDialog}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Ajouter des numéros
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section Réseaux Sociaux */}
            <SocialMediaManager
              socialMedias={socialMedias}
              onUpdate={handleUpdateSocialMedias}
              isLoading={isLoading}
            />

            {/* Section Profil Public */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Profil Public
                </CardTitle>
                <CardDescription className="text-sm text-gray-500 leading-relaxed">
                  Prévisualisez et gérez les informations visibles par les clients sur votre page profil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-gray-900">URL de votre profil</h4>
                      <p className="text-sm text-gray-500">Partagez ce lien pour que les clients découvrent votre boutique</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-300">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 font-mono">
                        printalma.com/{user?.vendeur_type?.toLowerCase() || 'designer'}/{editableFields.shop_name.value.toLowerCase().replace(/\s+/g, '-')}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-sm font-semibold border-blue-300 hover:bg-blue-50"
                        onClick={() => {
                          const url = `http://localhost:5174/${user?.vendeur_type?.toLowerCase() || 'designer'}/${editableFields.shop_name.value.toLowerCase().replace(/\s+/g, '-')}`;
                          navigator.clipboard.writeText(url);
                          toast.success('URL copiée dans le presse-papiers');
                        }}
                      >
                        Copier
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Aperçu de votre profil</h4>
                  <div className="space-y-4">
                    {/* Nom et fonction */}
                    <div>
                      <h5 className="text-xl font-bold text-gray-900">
                        {editableFields.shop_name.value || `${editableFields.firstName.value} ${editableFields.lastName.value}`.trim()}
                      </h5>
                      <p className="text-gray-600 mt-1">
                        {editableFields.function.value || 'Créateur de designs personnalisés'}
                      </p>
                    </div>

                    {/* À propos */}
                    {editableFields.about.value && (
                      <div>
                        <h6 className="text-sm font-semibold text-gray-900 mb-2">À propos</h6>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {editableFields.about.value}
                        </p>
                      </div>
                    )}

                    {/* Réseaux sociaux */}
                    {Object.keys(socialMedias).some(key => socialMedias[key]) && (
                      <div>
                        <h6 className="text-sm font-semibold text-gray-900 mb-2">Réseaux sociaux</h6>
                        <div className="flex gap-2">
                          {Object.entries(socialMedias).map(([key, value]) =>
                            value && value !== '#' ? (
                              <a
                                key={key}
                                href={value}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-white hover:scale-110 transition-transform"
                              >
                                {key === 'facebook_url' && (
                                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/>
                                  </svg>
                                )}
                                {key === 'instagram_url' && (
                                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z"/>
                                  </svg>
                                )}
                                {key === 'twitter_url' && (
                                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z"/>
                                  </svg>
                                )}
                                {key === 'tiktok_url' && (
                                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                                  </svg>
                                )}
                              </a>
                            ) : null
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 text-center">
                        Les informations ci-dessus sont celles que les clients verront sur votre page profil publique.
                        Les modifications sont sauvegardées automatiquement.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>

            {/* Groupe: Sécurité et Paramètres */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Sécurité et Paramètres</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              </div>

              {/* Section Sécurité */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                  <Shield className="h-6 w-6 text-green-600" />
                  Sécurité
                </CardTitle>
                <CardDescription className="text-sm text-gray-500 leading-relaxed">
                  Gérez votre mot de passe et vos paramètres de sécurité
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Key className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-gray-900">Mot de passe</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">Modifiez votre mot de passe pour sécuriser votre compte</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowPasswordDialog(true)}
                    className="text-sm font-semibold text-blue-600 border-blue-300 hover:bg-blue-50 px-4 py-2 rounded-lg transition-all duration-200"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Section Paramètres du compte */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                  <Settings className="h-6 w-6 text-purple-600" />
                  Paramètres du compte
                </CardTitle>
                <CardDescription className="text-sm text-gray-500 leading-relaxed">
                  Gérez les paramètres avancés de votre compte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {accountStatus ? (
                  // Compte actif - Bouton de désactivation
                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-orange-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-100 rounded-lg">
                        <AlertTriangle className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-gray-900">Désactiver le compte</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">Masquer vos produits aux clients. Vous gardez l'accès complet pour gérer, ajouter et modifier vos contenus</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeactivateDialog(true)}
                      className="text-sm font-semibold text-orange-600 border-orange-300 hover:bg-orange-50 px-4 py-2 rounded-lg transition-all duration-200"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Désactiver
                    </Button>
                  </div>
                ) : (
                  // Compte désactivé - Bouton de réactivation
                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Shield className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-gray-900">Réactiver le compte</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">Rendre vos produits visibles aux clients</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleReactivateAccount}
                      disabled={isLoading}
                      className="text-sm font-semibold text-green-600 border-green-300 hover:bg-green-50 px-4 py-2 rounded-lg transition-all duration-200"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                          Réactivation...
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Réactiver
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            </div>

          </div>
        </div>
      </div>

      {/* Dialog d'édition d'image style WhatsApp */}
      <Dialog open={showImageEditor} onOpenChange={setShowImageEditor}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-3">
              <Crop className="h-6 w-6 text-blue-600" />
              Ajuster votre photo de profil
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              Redimensionnez, faites pivoter et positionnez votre image comme souhaité
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Zone d'aperçu de l'image */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Canvas invisible pour le traitement */}
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />

                {/* Zone d'aperçu circulaire style WhatsApp */}
                <div className="relative w-80 h-80 bg-gray-100 rounded-full overflow-hidden border-4 border-gray-200 shadow-xl">
                  {originalImageUrl && (
                    <Cropper
                      image={originalImageUrl}
                      crop={crop}
                      zoom={zoom}
                      rotation={rotation}
                      aspect={1}
                      cropShape="round"
                      showGrid={false}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onRotationChange={setRotation}
                      onCropComplete={onCropComplete}
                    />
                  )}

                  {/* Overlay avec instructions */}
                  <div className="absolute bottom-4 left-4 right-4 text-center">
                    <div className="bg-black/70 backdrop-blur-sm text-white text-xs py-2 px-3 rounded-full">
                      <Move className="h-3 w-3 inline mr-1" />
                      Glissez pour repositionner
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contrôles d'édition */}
            <div className="space-y-6 bg-gray-50 p-6 rounded-xl">
              {/* Contrôle de zoom */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <ZoomIn className="h-4 w-4" />
                    Zoom
                  </Label>
                  <span className="text-sm text-gray-500 font-mono">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <ZoomOut className="h-4 w-4 text-gray-400" />
                  <Slider
                    value={[zoom]}
                    onValueChange={(v) => setZoom(v[0] || 1)}
                    min={0.5}
                    max={3}
                    step={0.05}
                    className="flex-1"
                  />
                  <ZoomIn className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Contrôle de rotation */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <RotateCw className="h-4 w-4" />
                  Rotation
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="text-sm font-medium"
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  Faire pivoter 90°
                </Button>
              </div>

              {/* Boutons de réinitialisation */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setZoom(1); setRotation(0); setCrop({ x: 0, y: 0 }); }}
                  className="text-sm font-medium text-gray-600"
                >
                  Réinitialiser
                </Button>
                <div className="text-xs text-gray-500">
                  <p>💡 Astuce : Glissez l'image pour la repositionner</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleCancelImageEdit}
              className="text-sm font-semibold text-gray-700 border-gray-300 hover:bg-gray-100 px-6 py-2 rounded-lg transition-all duration-200"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSaveEditedImage}
              className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-all duration-200 hover:shadow-md"
            >
              <Save className="h-4 w-4 mr-2" />
              Appliquer les modifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de changement de mot de passe */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Changer le mot de passe</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              Entrez votre mot de passe actuel et votre nouveau mot de passe pour sécuriser votre compte
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-base font-medium text-gray-900">Mot de passe actuel</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Votre mot de passe actuel"
                  className="text-base leading-relaxed border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-base font-medium text-gray-900">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nouveau mot de passe"
                  className="text-base leading-relaxed border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-base font-medium text-gray-900">Confirmer le nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmer le nouveau mot de passe"
                  className="text-base leading-relaxed border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPasswordDialog(false)}
                className="text-sm font-semibold text-gray-700 border-gray-300 hover:bg-gray-100 px-4 py-2 rounded-lg transition-all duration-200"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-all duration-200 hover:shadow-md"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Modification...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Modifier le mot de passe
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de désactivation de compte */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-orange-600">Désactiver le compte</DialogTitle>
            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              Vos produits seront masqués aux clients. Vous gardez l'accès à votre espace vendeur et pouvez vous réactiver.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-sm text-orange-800 leading-relaxed">
                Attention : Vos produits seront masqués dans le catalogue public. Vous gardez l'accès complet
                à votre espace vendeur : visualiser, ajouter, modifier vos produits et designs. Réactivation possible à tout moment.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="deactivateConfirmation" className="text-base font-medium text-gray-900">
                Tapez "DESACTIVER" pour confirmer
              </Label>
              <Input
                id="deactivateConfirmation"
                value={deactivateConfirmation}
                onChange={(e) => setDeactivateConfirmation(e.target.value)}
                placeholder="DESACTIVER"
                className="text-base leading-relaxed border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeactivateDialog(false)}
                className="text-sm font-semibold text-gray-700 border-gray-300 hover:bg-gray-100 px-4 py-2 rounded-lg transition-all duration-200"
              >
                Annuler
              </Button>
              <Button
                onClick={handleDeactivateAccount}
                disabled={isLoading || deactivateConfirmation !== 'DESACTIVER'}
                className="text-sm font-semibold bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg transition-all duration-200 hover:shadow-md"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Désactivation...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Désactiver le compte
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de gestion des numéros de téléphone */}
      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-600" />
              Gérer les numéros de téléphone
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              Vous devez avoir entre 2 et 3 numéros avec un numéro principal
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-800 leading-relaxed">
                Format accepté : +221XXXXXXXXX ou 7XXXXXXXX/3XXXXXXXX
              </AlertDescription>
            </Alert>

            {editingPhones.map((phone, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-900">
                    Numéro {index + 1}
                    {index < 2 && <span className="text-red-600 ml-1">*</span>}
                  </Label>
                  {index >= 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePhone(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="tel"
                      placeholder="+221 7XX XXX XXX"
                      value={phone.number}
                      onChange={(e) => updatePhone(index, e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {!phone.isPrimary && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPrimary(index)}
                      className="whitespace-nowrap border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      Définir principal
                    </Button>
                  )}
                  {phone.isPrimary && (
                    <Badge className="flex items-center gap-1 bg-blue-100 text-blue-700 border-blue-300 px-3">
                      <CheckCircle className="h-3 w-3" />
                      Principal
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {editingPhones.length < 3 && (
              <Button
                type="button"
                variant="outline"
                onClick={addPhone}
                className="w-full border-dashed border-2 border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Phone className="h-4 w-4 mr-2" />
                Ajouter un numéro
              </Button>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPhoneDialog(false)}
              className="text-sm font-semibold"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSavePhones}
              disabled={isLoading}
              className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorAccountPage; 