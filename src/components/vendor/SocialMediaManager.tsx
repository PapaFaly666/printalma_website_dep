import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Edit3, Save, X, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface SocialMedia {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  baseUrl?: string;
  color?: string;
}

interface SocialMediaManagerProps {
  socialMedias: Record<string, string>;
  onUpdate: (socialMedias: Record<string, string>) => Promise<void>;
  isLoading?: boolean;
}

const SocialMediaManager: React.FC<SocialMediaManagerProps> = ({
  socialMedias,
  onUpdate,
  isLoading = false
}) => {
  const [editingSocial, setEditingSocial] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const socialMediaPlatforms: SocialMedia[] = [
    {
      id: 'facebook_url',
      name: 'facebook',
      label: 'Facebook',
      placeholder: 'https://facebook.com/votre-page',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/>
        </svg>
      ),
      color: 'bg-blue-600'
    },
    {
      id: 'instagram_url',
      name: 'instagram',
      label: 'Instagram',
      placeholder: 'https://instagram.com/votre-compte',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
        </svg>
      ),
      color: 'bg-gradient-to-br from-purple-600 to-pink-600'
    },
    {
      id: 'twitter_url',
      name: 'twitter',
      label: 'X (Twitter)',
      placeholder: 'https://x.com/votre-compte',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      color: 'bg-black'
    },
    {
      id: 'tiktok_url',
      name: 'tiktok',
      label: 'TikTok',
      placeholder: 'https://tiktok.com/@votre-compte',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
        </svg>
      ),
      color: 'bg-gray-900'
    },
    {
      id: 'youtube_url',
      name: 'youtube',
      label: 'YouTube',
      placeholder: 'https://youtube.com/votre-chaine',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      ),
      color: 'bg-red-600'
    },
    {
      id: 'linkedin_url',
      name: 'linkedin',
      label: 'LinkedIn',
      placeholder: 'https://linkedin.com/in/votre-profil',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      color: 'bg-blue-700'
    }
  ];

  const validateUrl = (url: string, platform: string): string => {
    if (!url) return '';

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();

      // Validation spécifique pour chaque plateforme
      const platformDomains = {
        facebook: ['facebook.com', 'fb.com'],
        instagram: ['instagram.com', 'instagr.am'],
        twitter: ['twitter.com', 'x.com'],
        tiktok: ['tiktok.com'],
        youtube: ['youtube.com', 'youtu.be'],
        linkedin: ['linkedin.com', 'linked.in']
      };

      const allowedDomains = platformDomains[platform as keyof typeof platformDomains];
      if (allowedDomains && !allowedDomains.some(d => domain.includes(d))) {
        return `URL invalide pour ${platform}. Doit contenir ${allowedDomains.join(' ou ')}`;
      }

      return '';
    } catch {
      return 'URL invalide. Format attendu: https://example.com/page';
    }
  };

  const handleEdit = (platformId: string) => {
    setEditingSocial(platformId);
    setTempValues({
      ...tempValues,
      [platformId]: socialMedias[platformId] || ''
    });
    setErrors({ ...errors, [platformId]: '' });
  };

  const handleCancel = (platformId: string) => {
    setEditingSocial(null);
    delete tempValues[platformId];
    delete errors[platformId];
    setTempValues({ ...tempValues });
    setErrors({ ...errors });
  };

  const handleSave = async (platformId: string) => {
    const value = tempValues[platformId] || '';
    const platform = socialMediaPlatforms.find(p => p.id === platformId);

    if (platform) {
      const error = validateUrl(value, platform.name);
      if (error) {
        setErrors({ ...errors, [platformId]: error });
        return;
      }
    }

    const updatedSocialMedias = {
      ...socialMedias,
      [platformId]: value || undefined
    };

    try {
      await onUpdate(updatedSocialMedias);
      setEditingSocial(null);
      delete tempValues[platformId];
      setTempValues({ ...tempValues });
      toast.success('Réseaux sociaux mis à jour avec succès');
    } catch (error) {
      console.error('Erreur mise à jour réseaux sociaux:', error);
      toast.error('Erreur lors de la mise à jour des réseaux sociaux');
    }
  };

  const handleDelete = async (platformId: string) => {
    const updatedSocialMedias = { ...socialMedias };
    delete updatedSocialMedias[platformId];

    try {
      await onUpdate(updatedSocialMedias);
      toast.success('Réseau social supprimé avec succès');
    } catch (error) {
      console.error('Erreur suppression réseau social:', error);
      toast.error('Erreur lors de la suppression du réseau social');
    }
  };

  const formatUrlForDisplay = (url: string) => {
    if (!url) return '';
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname;
    } catch {
      return url;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          Réseaux Sociaux
        </CardTitle>
        <CardDescription>
          Ajoutez vos réseaux sociaux pour que les clients puissent vous suivre
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {socialMediaPlatforms.map((platform) => {
          const currentValue = socialMedias[platform.id];
          const isEditing = editingSocial === platform.id;
          const tempValue = tempValues[platform.id];
          const error = errors[platform.id];

          return (
            <div key={platform.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <div className={`p-1.5 rounded ${platform.color} text-white`}>
                    {platform.icon}
                  </div>
                  {platform.label}
                </Label>

                {currentValue && !isEditing && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(currentValue, '_blank')}
                      className="h-8 w-8 p-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(platform.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(platform.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="flex gap-2">
                  <Input
                    value={tempValue || ''}
                    onChange={(e) => {
                      setTempValues({ ...tempValues, [platform.id]: e.target.value });
                      setErrors({ ...errors, [platform.id]: '' });
                    }}
                    placeholder={platform.placeholder}
                    className={error ? 'border-red-500' : ''}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSave(platform.id)}
                    disabled={isLoading}
                    className="h-9 px-3"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancel(platform.id)}
                    className="h-9 px-3"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  {currentValue ? (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                      <a
                        href={currentValue}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex-1 truncate"
                      >
                        {formatUrlForDisplay(currentValue)}
                      </a>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(platform.id)}
                      className="w-full h-9 text-dashed border-dashed"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter {platform.label}
                    </Button>
                  )}
                </div>
              )}

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
          );
        })}

        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500">
            Les liens vers vos réseaux sociaux seront affichés sur votre page publique profil.
            Assurez-vous que les URLs sont valides et accessibles au public.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialMediaManager;