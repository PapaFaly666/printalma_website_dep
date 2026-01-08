import React, { useState } from 'react';
import { useVendorProfile } from '../hooks/useVendorProfile';
import Button from './ui/Button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Save, User, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface VendorProfileFormProps {
  onSave?: () => void;
  showTitle?: boolean;
}

export const VendorProfileForm: React.FC<VendorProfileFormProps> = ({
  onSave,
  showTitle = true
}) => {
  const { profileStatus, updateProfile, updateSocialMedia, loading } = useVendorProfile();
  const [form, setForm] = useState({
    professional_title: '',
    vendor_bio: ''
  });
  const [socialMedia, setSocialMedia] = useState({
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    tiktok_url: '',
    youtube_url: '',
    linkedin_url: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Initialiser le formulaire avec les données existantes
  React.useEffect(() => {
    if (profileStatus) {
      setForm({
        professional_title: profileStatus.profile.professional_title || '',
        vendor_bio: profileStatus.profile.vendor_bio || ''
      });
    }
  }, [profileStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validation côté client
      if (form.vendor_bio && form.vendor_bio.length > 0 && form.vendor_bio.length < 10) {
        toast.error('La biographie doit contenir au moins 10 caractères');
        return;
      }

      if (form.professional_title && form.professional_title.length > 200) {
        toast.error('Le titre ne peut pas dépasser 200 caractères');
        return;
      }

      // Validation des URLs de réseaux sociaux
      const hasSocialMediaErrors = Object.values(socialMediaErrors).some(error => error !== '');
      if (hasSocialMediaErrors) {
        toast.error('Veuillez corriger les erreurs dans les URLs des réseaux sociaux');
        return;
      }

      // Mise à jour du profil
      await updateProfile({
        professional_title: form.professional_title || undefined,
        vendor_bio: form.vendor_bio || undefined
      });

      // Mise à jour des réseaux sociaux (si au moins un lien est rempli)
      const hasSocialMedia = Object.values(socialMedia).some(url => url.trim());

      if (hasSocialMedia) {
        await updateSocialMedia({
          facebook_url: socialMedia.facebook_url || '',
          instagram_url: socialMedia.instagram_url || '',
          twitter_url: socialMedia.twitter_url || '',
          tiktok_url: socialMedia.tiktok_url || '',
          youtube_url: socialMedia.youtube_url || '',
          linkedin_url: socialMedia.linkedin_url || ''
        });
      }

      toast.success('Profil mis à jour avec succès');
      onSave?.();
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setSubmitting(false);
    }
  };

  // État pour stocker les erreurs de validation
  const [socialMediaErrors, setSocialMediaErrors] = useState<Record<string, string>>({});

  // Fonction de validation pour les URLs de réseaux sociaux selon la doc de l'API
  const validateSocialUrl = (url: string, platform: string): string => {
    if (!url) return '';

    // L'API ajoute automatiquement https:// si manquant, donc on accepte aussi les URLs sans
    let testUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      testUrl = 'https://' + url;
    }

    try {
      const urlObj = new URL(testUrl);
      const domain = urlObj.hostname.toLowerCase();

      // Validation spécifique pour chaque plateforme selon la doc de l'API
      const platformDomains = {
        facebook: ['facebook.com', 'www.facebook.com', 'fb.me'],
        instagram: ['instagram.com', 'www.instagram.com', 'instagr.am'],
        twitter: ['twitter.com', 'www.twitter.com', 'x.com', 'www.x.com'],
        tiktok: ['tiktok.com', 'www.tiktok.com'],
        youtube: ['youtube.com', 'www.youtube.com', 'youtu.be'],
        linkedin: ['linkedin.com', 'www.linkedin.com']
      };

      // Mapping pour les noms de plateforme corrects dans les messages d'erreur
      const platformNames = {
        facebook: 'Facebook',
        instagram: 'Instagram',
        twitter: 'X (Twitter)',
        tiktok: 'TikTok',
        youtube: 'YouTube',
        linkedin: 'LinkedIn'
      };

      // Examples corrects pour chaque plateforme selon la doc de l'API
      const platformExamples = {
        facebook: 'facebook.com/maboutique ou fb.me/maboutique',
        instagram: 'instagram.com/@maboutique ou instagr.am/@maboutique',
        twitter: 'twitter.com/maboutique ou x.com/maboutique',
        tiktok: 'tiktok.com/@maboutique ou tiktok.com/maboutique',
        youtube: 'youtube.com/channel/maboutique ou youtube.com/@maboutique',
        linkedin: 'linkedin.com/in/maboutique ou linkedin.com/company/maboutique'
      };

      const platformName = platformNames[platform as keyof typeof platformNames] || platform;
      const example = platformExamples[platform as keyof typeof platformExamples] || 'example.com/maboutique';

      const allowedDomains = platformDomains[platform as keyof typeof platformDomains];
      if (allowedDomains && !allowedDomains.some(d => domain === d || domain.endsWith('.' + d))) {
        return `Domaine ${platformName} invalide. Utilisez: ${example}`;
      }

      // Vérification supplémentaire : s'assurer que l'URL a un chemin (pas juste le domaine)
      const pathname = urlObj.pathname;
      if (!pathname || pathname === '/') {
        return `L'URL ${platformName} doit inclure votre identifiant (ex: ${example})`;
      }

      return '';
    } catch (error) {
      const platformNames = {
        facebook: 'Facebook',
        instagram: 'Instagram',
        twitter: 'X (Twitter)',
        tiktok: 'TikTok',
        youtube: 'YouTube',
        linkedin: 'LinkedIn'
      };

      const platformExamples = {
        facebook: 'https://facebook.com/username',
        instagram: 'https://instagram.com/username',
        twitter: 'https://twitter.com/username',
        tiktok: 'https://tiktok.com/@username',
        youtube: 'https://youtube.com/@username',
        linkedin: 'https://linkedin.com/in/username'
      };

      const platformName = platformNames[platform as keyof typeof platformNames] || platform;

      // Si l'URL est invalide, on retourne une erreur plus informative
      if (url.length < 3) {
        return `L'URL ${platformName} est trop courte`;
      }

      return `Format d'URL ${platformName} invalide. Exemple: ${platformExamples[platform as keyof typeof platformExamples]}`;
    }
  };

  const updateSocialMediaField = (field: string, value: string) => {
    // Extraire le nom de la plateforme depuis le nom du champ (ex: "instagram_url" -> "instagram")
    const platform = field.replace('_url', '');

    // Valider l'URL
    const error = validateSocialUrl(value, platform);

    setSocialMedia(prev => ({
      ...prev,
      [field]: value
    }));

    setSocialMediaErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Chargement du profil...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        {showTitle && (
          <>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Mon profil vendeur
            </CardTitle>
            <CardDescription>
              Complétez votre profil pour augmenter votre visibilité et attirer plus de clients
            </CardDescription>
          </>
        )}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Titre professionnel */}
          <div className="space-y-2">
            <Label htmlFor="professional_title">Titre professionnel</Label>
            <Input
              id="professional_title"
              placeholder="Ex: Designer Graphique Senior"
              value={form.professional_title}
              onChange={(e) => setForm(prev => ({ ...prev, professional_title: e.target.value }))}
              maxLength={200}
            />
            <p className="text-xs text-gray-500">
              {form.professional_title.length}/200 caractères
            </p>
          </div>

          {/* Biographie */}
          <div className="space-y-2">
            <Label htmlFor="vendor_bio">Biographie</Label>
            <Textarea
              id="vendor_bio"
              placeholder="Parlez-nous de vous, de votre style, de votre passion..."
              value={form.vendor_bio}
              onChange={(e) => setForm(prev => ({ ...prev, vendor_bio: e.target.value }))}
              rows={4}
              maxLength={2000}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Optionnel - Si vous renseignez une biographie, elle doit contenir au moins 10 caractères</span>
              <span>{form.vendor_bio.length}/2000</span>
            </div>
            {form.vendor_bio.length > 0 && form.vendor_bio.length < 10 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertDescription className="text-yellow-800">
                  � La biographie doit contenir au moins 10 caract�res pour �tre valide
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Réseaux sociaux */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <Label>Réseaux sociaux</Label>
            </div>
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800 text-sm">
                💡 Les URLs sont flexibles : vous pouvez entrer "instagram.com/@moncompte" (https:// sera ajouté automatiquement)
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="facebook_url" className="text-sm">Facebook</Label>
                <Input
                  id="facebook_url"
                  type="url"
                  placeholder="facebook.com/votre-page ou fb.me/votre-page"
                  value={socialMedia.facebook_url}
                  onChange={(e) => updateSocialMediaField('facebook_url', e.target.value)}
                  className={socialMediaErrors.facebook_url ? 'border-red-500 focus:ring-red-500' : ''}
                />
                {socialMediaErrors.facebook_url && (
                  <p className="text-sm text-red-500">{socialMediaErrors.facebook_url}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram_url" className="text-sm">Instagram</Label>
                <Input
                  id="instagram_url"
                  type="url"
                  placeholder="instagram.com/@votre-compte ou instagr.am/@votre-compte"
                  value={socialMedia.instagram_url}
                  onChange={(e) => updateSocialMediaField('instagram_url', e.target.value)}
                  className={socialMediaErrors.instagram_url ? 'border-red-500 focus:ring-red-500' : ''}
                />
                {socialMediaErrors.instagram_url && (
                  <p className="text-sm text-red-500">{socialMediaErrors.instagram_url}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter_url" className="text-sm">Twitter / X</Label>
                <Input
                  id="twitter_url"
                  type="url"
                  placeholder="twitter.com/votre-compte ou x.com/votre-compte"
                  value={socialMedia.twitter_url}
                  onChange={(e) => updateSocialMediaField('twitter_url', e.target.value)}
                  className={socialMediaErrors.twitter_url ? 'border-red-500 focus:ring-red-500' : ''}
                />
                {socialMediaErrors.twitter_url && (
                  <p className="text-sm text-red-500">{socialMediaErrors.twitter_url}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tiktok_url" className="text-sm">TikTok</Label>
                <Input
                  id="tiktok_url"
                  type="url"
                  placeholder="tiktok.com/@votre-compte ou tiktok.com/votre-compte"
                  value={socialMedia.tiktok_url}
                  onChange={(e) => updateSocialMediaField('tiktok_url', e.target.value)}
                  className={socialMediaErrors.tiktok_url ? 'border-red-500 focus:ring-red-500' : ''}
                />
                {socialMediaErrors.tiktok_url && (
                  <p className="text-sm text-red-500">{socialMediaErrors.tiktok_url}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube_url" className="text-sm">YouTube</Label>
                <Input
                  id="youtube_url"
                  type="url"
                  placeholder="youtube.com/@votre-chaine ou youtu.be/xxxxx"
                  value={socialMedia.youtube_url}
                  onChange={(e) => updateSocialMediaField('youtube_url', e.target.value)}
                  className={socialMediaErrors.youtube_url ? 'border-red-500 focus:ring-red-500' : ''}
                />
                {socialMediaErrors.youtube_url && (
                  <p className="text-sm text-red-500">{socialMediaErrors.youtube_url}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin_url" className="text-sm">LinkedIn</Label>
                <Input
                  id="linkedin_url"
                  type="url"
                  placeholder="linkedin.com/in/votre-profil ou linkedin.com/company/votre-entreprise"
                  value={socialMedia.linkedin_url}
                  onChange={(e) => updateSocialMediaField('linkedin_url', e.target.value)}
                  className={socialMediaErrors.linkedin_url ? 'border-red-500 focus:ring-red-500' : ''}
                />
                {socialMediaErrors.linkedin_url && (
                  <p className="text-sm text-red-500">{socialMediaErrors.linkedin_url}</p>
                )}
              </div>
            </div>
          </div>

          {/* Bouton de sauvegarde */}
          <div className="flex items-center justify-between pt-4 border-t">
            {profileStatus?.isProfileComplete && (
              <span className="text-sm text-green-600 font-medium">
                ✓ Votre profil est complet !
              </span>
            )}

            <Button
              type="submit"
              disabled={submitting}
              size="lg"
              className="min-w-32"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};