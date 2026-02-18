import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Upload, Save, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { AdminButton } from '../../components/admin/AdminButton';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ContentImage } from '../../components/ui/contentImage';
import { toast } from 'sonner';
import { contentService } from '../../services/contentService';
import { SvgUtils } from '../../utils/svgUtils';
import { useImageUpload } from '../../hooks/useImageUpload';

// Types pour les sections
interface DesignItem {
  id: string;
  name: string;
  imageUrl: string;
}

interface InfluencerItem {
  id: string;
  name: string;
  imageUrl: string;
}

interface MerchandisingItem {
  id: string;
  name: string;
  imageUrl: string;
}

interface ContentData {
  designs: DesignItem[];
  influencers: InfluencerItem[];
  merchandising: MerchandisingItem[];
}

// Limites de contenu
const CONTENT_LIMITS = {
  designs: 6,
  influencers: 5,
  merchandising: 6
} as const;

export const ContentManagementPage: React.FC = () => {
  const [content, setContent] = useState<ContentData>({
    designs: [],
    influencers: [],
    merchandising: []
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'designs' | 'influencers' | 'merchandising'>('designs');
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  // Charger le contenu depuis le backend
  useEffect(() => {
    loadContent();
  }, []);

  // Nettoyer les previews locaux au démontage du composant
  useEffect(() => {
    return () => {
      // Libérer tous les object URLs pour éviter les fuites mémoire
      Object.values(previewUrls).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const data = await contentService.getAdminContent();
      setContent(data);
    } catch (error: any) {
      console.error('Erreur lors du chargement du contenu:', error);
      toast.error(error.message || 'Erreur lors du chargement du contenu');

      // Fallback avec des données par défaut
      setContent({
        designs: Array.from({ length: 6 }, (_, i) => ({
          id: String(i + 1),
          name: `Design ${i + 1}`,
          imageUrl: ''
        })),
        influencers: Array.from({ length: 5 }, (_, i) => ({
          id: String(i + 1),
          name: `Influenceur ${i + 1}`,
          imageUrl: ''
        })),
        merchandising: Array.from({ length: 6 }, (_, i) => ({
          id: String(i + 1),
          name: `Merchandising ${i + 1}`,
          imageUrl: ''
        }))
      });
    } finally {
      setLoading(false);
    }
  };

  // Créer des instances du hook pour chaque section
  const designsUpload = useImageUpload({ section: 'designs' });
  const influencersUpload = useImageUpload({ section: 'influencers' });
  const merchandisingUpload = useImageUpload({ section: 'merchandising' });

  // Sélectionner le bon hook selon la section
  const getUploadHook = (section: 'designs' | 'influencers' | 'merchandising') => {
    switch (section) {
      case 'designs': return designsUpload;
      case 'influencers': return influencersUpload;
      case 'merchandising': return merchandisingUpload;
    }
  };

  const handleImageUpload = async (file: File, section: 'designs' | 'influencers' | 'merchandising', id: string) => {
    const isSvg = SvgUtils.isSvgFile(file);
    const uploadHook = getUploadHook(section);

    // Créer un preview local immédiat
    const localPreviewUrl = URL.createObjectURL(file);
    setPreviewUrls(prev => ({ ...prev, [id]: localPreviewUrl }));

    // Marquer l'item comme en cours d'upload
    setUploadingItemId(id);

    const toastId = toast.loading(
      isSvg ? 'Upload du SVG en cours...' : 'Upload d\'image en cours...',
      { description: 'Préparation...' }
    );

    // Surveiller la progression
    const checkProgress = setInterval(() => {
      const progress = uploadHook.progress;
      setUploadProgress(progress);

      if (progress > 0) {
        toast.loading(
          isSvg ? 'Upload du SVG en cours...' : 'Upload d\'image en cours...',
          {
            id: toastId,
            description: `Progression: ${progress}%`
          }
        );
      }
    }, 100);

    try {
      const url = await uploadHook.uploadImage(file);

      clearInterval(checkProgress);

      // Libérer le preview local
      URL.revokeObjectURL(localPreviewUrl);
      setPreviewUrls(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[id];
        return newPreviews;
      });

      // Mettre à jour l'état avec la nouvelle URL Cloudinary ET sauvegarder automatiquement
      setContent(prevContent => {
        const updatedContent = {
          ...prevContent,
          [section]: prevContent[section].map(item =>
            item.id === id ? { ...item, imageUrl: url } : item
          )
        };

        // Sauvegarder automatiquement en BDD après upload (en arrière-plan)
        contentService.saveContent(updatedContent)
          .then(() => {
            console.log('✅ Contenu sauvegardé automatiquement en BDD après upload');
          })
          .catch(saveError => {
            console.error('⚠️ Erreur sauvegarde auto:', saveError);
            toast.warning('Image uploadée mais non sauvegardée', {
              description: 'Cliquez sur "Sauvegarder" pour persister les changements'
            });
          });

        return updatedContent;
      });

      toast.success(
        isSvg ? 'SVG uploadé avec succès' : 'Image uploadée avec succès',
        {
          id: toastId,
          description: `Fichier: ${file.name}`
        }
      );
    } catch (error: any) {
      clearInterval(checkProgress);

      // En cas d'erreur, garder le preview local pour permettre de réessayer
      console.error('Erreur upload image:', error);
      toast.error(error.message || 'Erreur lors de l\'upload de l\'image', {
        id: toastId,
        description: 'Le preview local est conservé'
      });
    } finally {
      clearInterval(checkProgress);
      setUploadingItemId(null);
      setUploadProgress(0);
    }
  };

  const handleUpdateItem = (section: 'designs' | 'influencers' | 'merchandising', id: string, updates: Partial<DesignItem>) => {
    setContent(prev => ({
      ...prev,
      [section]: prev[section].map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    }));
  };

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      // Validation client-side avec contentService
      const errors = contentService.validateContent(content);
      if (errors.length > 0) {
        toast.error('Validation échouée', {
          description: errors.join(', ')
        });
        return;
      }

      // Sauvegarde via le service
      const result = await contentService.saveContent(content);

      toast.success('Contenu sauvegardé avec succès', {
        description: result.message
      });
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde', {
        description: error.message || 'Une erreur est survenue'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderItemEditor = (
    item: DesignItem | InfluencerItem | MerchandisingItem,
    section: 'designs' | 'influencers' | 'merchandising',
    bgColor: string,
    index: number
  ) => {
    const isUploading = uploadingItemId === item.id;
    const uploadHook = getUploadHook(section);
    const currentProgress = isUploading ? uploadHook.progress : 0;

    // Utiliser le preview local si disponible, sinon l'URL Cloudinary
    const displayUrl = previewUrls[item.id] || item.imageUrl;

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow"
      >
        <div className="flex flex-col sm:flex-row items-start gap-3">
          {/* Image preview */}
          <div className="relative w-full sm:w-20 sm:h-20 h-32 rounded-lg border-2 border-gray-300 flex-shrink-0 group overflow-hidden bg-gray-100">
            {displayUrl && displayUrl !== '' ? (
              <img
                src={displayUrl}
                alt={item.name}
                className="w-full h-full object-cover rounded-lg"
                onLoad={() => console.log('✅ Image chargée:', displayUrl.substring(0, 60))}
                onError={(e) => {
                  console.error('❌ Erreur image:', displayUrl.substring(0, 60));
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">Cliquez pour uploader</span>
              </div>
            )}

            {/* Barre de progression pendant l'upload */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
                <Loader2 className="h-6 w-6 text-white animate-spin mb-2" />
                <div className="w-16 h-1.5 bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${currentProgress}%` }}
                  />
                </div>
                <span className="text-white text-xs mt-1">{currentProgress}%</span>
              </div>
            )}

            {/* Overlay d'upload au hover - toujours visible */}
            {!isUploading && (
              <label
                htmlFor={`upload-${item.id}`}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center rounded-lg"
              >
                <Upload className="h-5 w-5 text-white" />
              </label>
            )}

            <input
              id={`upload-${item.id}`}
              type="file"
              accept="image/*,.svg"
              className="hidden"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, section, item.id);
              }}
            />
          </div>

        {/* Form */}
        <div className="flex-1 w-full space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-gray-500">#{index + 1}</span>
            <div className="h-px flex-1 bg-gray-200"></div>
          </div>
          <div>
            <Label htmlFor={`name-${item.id}`} className="text-xs font-medium text-gray-600">
              Nom
            </Label>
            <Input
              id={`name-${item.id}`}
              value={item.name}
              onChange={(e) => handleUpdateItem(section, item.id, { name: e.target.value })}
              placeholder="Nom du vendeur/designer"
              className="mt-1 h-9"
            />
          </div>

          <div>
            <Label htmlFor={`image-${item.id}`} className="text-xs font-medium text-gray-600">
              URL de l'image
            </Label>
            <Input
              id={`image-${item.id}`}
              value={item.imageUrl}
              onChange={(e) => handleUpdateItem(section, item.id, { imageUrl: e.target.value })}
              placeholder="https://..."
              className="mt-1 h-9 text-sm"
            />
          </div>
        </div>
      </div>
    </motion.div>
    );
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestion du contenu</h1>
          <p className="text-sm text-gray-600 mt-1">Gérez les sections de la page d'accueil</p>
        </div>
        <AdminButton onClick={handleSaveAll} disabled={loading} variant="primary" className="sm:w-auto">
          <Save className="h-4 w-4" />
          <span>{loading ? 'Sauvegarde...' : 'Sauvegarder'}</span>
        </AdminButton>
      </div>

      {/* Tabs Navigation - Mobile only */}
      <div className="lg:hidden mb-6 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('designs')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === 'designs'
              ? 'bg-[rgb(241,209,45)] text-black'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Designs ({CONTENT_LIMITS.designs})
        </button>
        <button
          onClick={() => setActiveTab('influencers')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === 'influencers'
              ? 'bg-[rgb(20,104,154)] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Influenceurs ({CONTENT_LIMITS.influencers})
        </button>
        <button
          onClick={() => setActiveTab('merchandising')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === 'merchandising'
              ? 'bg-[rgb(230,29,44)] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Merchandising ({CONTENT_LIMITS.merchandising})
        </button>
      </div>

      <div className="space-y-6 max-w-7xl">
        {/* Section Designs Exclusifs */}
        <Card className={`border-gray-200 overflow-hidden ${activeTab !== 'designs' ? 'hidden lg:block' : ''}`}>
          <CardHeader className="border-b border-gray-200 p-4" style={{ backgroundColor: 'rgb(241, 209, 45)' }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-black flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 flex-shrink-0" />
                  <span>Designs Exclusifs</span>
                </CardTitle>
                <p className="text-xs text-black/70 mt-1">{CONTENT_LIMITS.designs} items (modification uniquement)</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {content.designs.map((item, index) => renderItemEditor(item, 'designs', 'rgb(241, 209, 45)', index))}
            </div>
          </CardContent>
        </Card>

        {/* Section Influenceurs Partenaires */}
        <Card className={`border-gray-200 overflow-hidden ${activeTab !== 'influencers' ? 'hidden lg:block' : ''}`}>
          <CardHeader className="border-b border-gray-200 p-4" style={{ backgroundColor: 'rgb(20, 104, 154)' }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 flex-shrink-0" />
                  <span>Influenceurs Partenaires</span>
                </CardTitle>
                <p className="text-xs text-white/70 mt-1">{CONTENT_LIMITS.influencers} items (modification uniquement)</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {content.influencers.map((item, index) => renderItemEditor(item, 'influencers', 'rgb(20, 104, 154)', index))}
            </div>
          </CardContent>
        </Card>

        {/* Section Merchandising Musical */}
        <Card className={`border-gray-200 overflow-hidden ${activeTab !== 'merchandising' ? 'hidden lg:block' : ''}`}>
          <CardHeader className="border-b border-gray-200 p-4" style={{ backgroundColor: 'rgb(230, 29, 44)' }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 flex-shrink-0" />
                  <span>Merchandising Musical</span>
                </CardTitle>
                <p className="text-xs text-white/70 mt-1">{CONTENT_LIMITS.merchandising} items (modification uniquement)</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {content.merchandising.map((item, index) => renderItemEditor(item, 'merchandising', 'rgb(230, 29, 44)', index))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
