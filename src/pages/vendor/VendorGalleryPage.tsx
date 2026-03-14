import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Image as ImageIcon,
  Edit3,
  Trash2,
  Send,
  FileText,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  FileImage,
  Layers,
  Eye,
  EyeOff,
  Save,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
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
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import {
  VendorGallery,
  GalleryImage,
  GalleryStatus,
  GALLERY_CONSTRAINTS
} from '../../types/gallery';
import { galleryService } from '../../services/gallery.service';

// React Query Hooks pour les galeries vendeur
import {
  useVendorGalleries,
  useUpdateGalleryInfo,
  useDeleteGallery,
  useTogglePublishGallery
} from '../../hooks/vendor';

const VendorGalleryPage: React.FC = () => {
  const { user } = useAuth();

  // 🔄 React Query Hooks - Gestion automatique du cache et des requêtes
  const galleriesQuery = useVendorGalleries();
  const updateInfoMutation = useUpdateGalleryInfo();
  const deleteGalleryMutation = useDeleteGallery();
  const togglePublishMutation = useTogglePublishGallery();

  const [galleries, setGalleries] = useState<VendorGallery[]>([]);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // États pour les dialogues
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // États pour le formulaire
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    images: [] as GalleryImage[],
    captions: ['', '', '', '', '']
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Synchroniser les données du cache avec l'état local
  useEffect(() => {
    if (galleriesQuery.data) {
      setGalleries(galleriesQuery.data.galleries);
    }
  }, [galleriesQuery.data]);

  const isLoading = galleriesQuery.isLoading;
  const isRefetching = galleriesQuery.isRefetching;

  // Fonction pour tout rafraîchir
  const refetchAll = () => {
    galleriesQuery.refetch();
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;

    const newImages: GalleryImage[] = [];
    const errors: string[] = [];

    // Vérifier le nombre total d'images
    const totalImages = formData.images.length + files.length;
    if (totalImages > GALLERY_CONSTRAINTS.IMAGES_COUNT) {
      errors.push(`Une galerie doit contenir exactement ${GALLERY_CONSTRAINTS.IMAGES_COUNT} images`);
      setValidationErrors(errors);
      return;
    }

    Array.from(files).forEach((file, index) => {
      // Validation du format
      if (!GALLERY_CONSTRAINTS.ALLOWED_FORMATS.includes(file.type as any)) {
        errors.push(`${file.name}: Format non supporté`);
        return;
      }

      // Validation de la taille
      if (file.size > GALLERY_CONSTRAINTS.MAX_IMAGE_SIZE) {
        errors.push(`${file.name}: Taille maximale de 5MB dépassée`);
        return;
      }

      // Créer une prévisualisation
      const preview = URL.createObjectURL(file);
      newImages.push({
        file,
        url: preview,
        preview,
        order: formData.images.length + index + 1,
        caption: ''
      });
    });

    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error('Certaines images n\'ont pas pu être ajoutées');
    } else {
      setValidationErrors([]);
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = prev.images.filter((_, i) => i !== index).map((img, i) => ({
        ...img,
        order: i + 1
      }));

      // Mettre à jour aussi les captions pour garder la synchronisation
      const newCaptions = prev.captions.filter((_, i) => i !== index);

      return {
        ...prev,
        images: newImages,
        captions: newCaptions
      };
    });
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.title.trim()) {
      errors.push('Le titre est requis');
    } else if (formData.title.length < GALLERY_CONSTRAINTS.TITLE_MIN_LENGTH) {
      errors.push(`Le titre doit contenir au moins ${GALLERY_CONSTRAINTS.TITLE_MIN_LENGTH} caractères`);
    } else if (formData.title.length > GALLERY_CONSTRAINTS.TITLE_MAX_LENGTH) {
      errors.push(`Le titre ne peut pas dépasser ${GALLERY_CONSTRAINTS.TITLE_MAX_LENGTH} caractères`);
    }

    if (formData.description && formData.description.length > GALLERY_CONSTRAINTS.DESCRIPTION_MAX_LENGTH) {
      errors.push(`La description ne peut pas dépasser ${GALLERY_CONSTRAINTS.DESCRIPTION_MAX_LENGTH} caractères`);
    }

    if (formData.images.length !== GALLERY_CONSTRAINTS.IMAGES_COUNT) {
      errors.push(`Vous devez ajouter exactement ${GALLERY_CONSTRAINTS.IMAGES_COUNT} images`);
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSaveGallery = async () => {
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs du formulaire');
      return;
    }

    setIsLoading(true);
    try {
      // Extraire les fichiers des images
      const imageFiles = formData.images.map(img => img.file).filter(Boolean) as File[];

      // Optimiser les images avant upload
      const optimizedImages = await galleryService.optimizeImages(imageFiles);

      // S'assurer que les captions sont correctement formatées
      const formattedCaptions = formData.captions.slice(0, optimizedImages.length);

      await galleryService.createOrUpdateGallery({
        title: formData.title,
        description: formData.description,
        images: optimizedImages,
        captions: formattedCaptions
      });

      toast.success(galleries.length > 0 ? 'Galerie mise à jour avec succès' : 'Galerie créée avec succès');

      // Invalider le cache pour recharger les données fraîches
      await galleriesQuery.refetch();

      setIsEditDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde de la galerie');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateGalleryInfo = async () => {
    if (galleries.length === 0) return;

    const firstGallery = galleries[0];
    updateInfoMutation.mutate({
      title: formData.title,
      description: formData.description,
      status: firstGallery.status,
      isPublished: firstGallery.isPublished
    }, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        resetForm();
      }
    });
  };

  const handleDeleteGallery = () => {
    deleteGalleryMutation.mutate(undefined, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        resetForm();
      }
    });
  };

  const handleTogglePublish = async (isPublished: boolean, galleryId?: number) => {
    setStatusUpdating(true);
    try {
      // Utiliser l'ID de la galerie spécifiée ou la première galerie
      const targetGalleryId = galleryId || galleries[0]?.id;

      if (!targetGalleryId) {
        throw new Error('Aucune galerie trouvée');
      }

      await togglePublishMutation.mutateAsync({ galleryId: targetGalleryId, isPublished });

      toast.success(isPublished ? 'Galerie publiée avec succès' : 'Galerie dépubliée avec succès');
    } catch (error: any) {
      // Le toast est déjà géré par la mutation
    } finally {
      setStatusUpdating(false);
    }
  };

  const openEditDialog = () => {
    const firstGallery = galleries[0];
    if (firstGallery) {
      setFormData({
        title: firstGallery.title,
        description: firstGallery.description || '',
        images: firstGallery.images,
        captions: (firstGallery.images || []).map(img => img.caption || '')
      });
    } else {
      resetForm();
    }
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      images: [],
      captions: ['', '', '', '', '']
    });
    setValidationErrors([]);
  };

  const getStatusBadge = (status: GalleryStatus) => {
    const variants = {
      PUBLISHED: 'default',
      DRAFT: 'secondary',
      ARCHIVED: 'outline'
    } as const;

    return (
      <Badge variant={variants[status]}>
        {status === GalleryStatus.PUBLISHED ? 'Publiée' :
         status === GalleryStatus.DRAFT ? 'Brouillon' : 'Archivée'}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5 mb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-6 h-6 text-[rgb(20,104,154)]" />
              Ma Galerie
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {galleries.length > 0
                ? `Modifiez votre galerie avec exactement ${GALLERY_CONSTRAINTS.IMAGES_COUNT} images`
                : `Créez votre galerie avec exactement ${GALLERY_CONSTRAINTS.IMAGES_COUNT} images pour présenter vos créations`
              }
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={refetchAll}
              disabled={isLoading}
              className="inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[rgb(20,104,154)] text-[rgb(20,104,154)] hover:bg-[rgb(20,104,154)] hover:text-white bg-white px-3 py-1.5 text-sm gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
            {galleries.length > 0 ? (
              <button
                onClick={openEditDialog}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border-2 border-[rgb(20,104,154)] text-[rgb(20,104,154)] hover:bg-[rgb(20,104,154)] hover:text-white bg-white rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Modifier ma galerie
              </button>
            ) : (
              <button
                onClick={openEditDialog}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[rgb(20,104,154)] hover:bg-[rgb(16,83,123)] active:bg-[rgb(14,72,108)] text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Créer ma galerie
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Contenu principal */}
      <div className="px-6 pb-8">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgb(20,104,154)]"></div>
        </div>
      ) : galleries.length === 0 ? (
        <Card className="p-12 rounded-xl border border-gray-200">
          <div className="text-center">
            <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Vous n'avez pas encore de galerie
            </h3>
            <p className="text-gray-500 mb-6">
              Créez votre galerie avec exactement {GALLERY_CONSTRAINTS.IMAGES_COUNT} images pour présenter vos créations
            </p>
            <button
              onClick={openEditDialog}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-[rgb(20,104,154)] hover:bg-[rgb(16,83,123)] text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Créer ma galerie
            </button>
          </div>
        </Card>
      ) : (
        // Afficher la galerie unique
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden rounded-xl border border-gray-200 hover:shadow-lg hover:border-[rgb(20,104,154)]/30 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2 text-gray-900">{galleries[0].title}</CardTitle>
                  {getStatusBadge(galleries[0].status)}
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <FileImage className="w-4 h-4" />
                      {(galleries[0].images?.length || 0)}/{GALLERY_CONSTRAINTS.IMAGES_COUNT} images
                    </span>
                    {galleries[0].createdAt && (
                      <span>
                        Créée le {new Date(galleries[0].createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={openEditDialog}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border-2 border-[rgb(20,104,154)] text-[rgb(20,104,154)] hover:bg-[rgb(20,104,154)] hover:text-white bg-white rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Modifier
                  </button>
                  <button
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={statusUpdating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border-2 border-red-200 text-red-600 hover:bg-red-50 bg-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {galleries[0].description && (
                <p className="text-slate-600 mb-6">
                  {galleries[0].description}
                </p>
              )}

              {/* Alerte si la galerie n'a pas 5 images */}
              {(galleries[0].images?.length || 0) !== GALLERY_CONSTRAINTS.IMAGES_COUNT && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-yellow-700">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">
                      Votre galerie doit contenir exactement {GALLERY_CONSTRAINTS.IMAGES_COUNT} images pour être publiée
                    </span>
                  </div>
                  <p className="text-yellow-600 text-sm mt-1">
                    Actuellement : {galleries[0].images?.length || 0} image{(galleries[0].images?.length || 0) > 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* Grille d'images */}
              <div className="grid grid-cols-5 gap-4 mb-6">
                {(galleries[0].images || []).map((image, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-lg overflow-hidden bg-slate-100 group"
                  >
                    <img
                      src={image.imageUrl || image.url}
                      alt={image.caption || `Image ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        console.error(`Erreur de chargement d'image: ${image.imageUrl || image.url}`);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    {image.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {image.caption}
                      </div>
                    )}
                  </div>
                ))}

                {/* Emplacements vides si moins de 5 images */}
                {Array.from({ length: GALLERY_CONSTRAINTS.IMAGES_COUNT - (galleries[0].images?.length || 0) }).map((_, emptyIndex) => (
                  <div key={`empty-${emptyIndex}`} className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                      <span className="text-xs">Image {(galleries[0].images?.length || 0) + emptyIndex + 1}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {galleries[0].isPublished ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <Eye className="w-4 h-4" />
                      Galerie visible par le public
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-500">
                      <EyeOff className="w-4 h-4" />
                      Galerie privée
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleTogglePublish(!galleries[0].isPublished)}
                    disabled={statusUpdating || (galleries[0].images?.length || 0) !== GALLERY_CONSTRAINTS.IMAGES_COUNT}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border-2 border-[rgb(20,104,154)] text-[rgb(20,104,154)] hover:bg-[rgb(20,104,154)] hover:text-white bg-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {statusUpdating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    ) : galleries[0].isPublished ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    {galleries[0].isPublished ? 'Dépublier' : 'Publier'}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
      </div>{/* end px-6 pb-8 */}

      {/* Dialog de création/édition */}
      <GalleryFormDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsEditDialogOpen(false);
            resetForm();
          }
        }}
        isEdit={galleries.length > 0}
        formData={formData}
        setFormData={setFormData}
        validationErrors={validationErrors}
        onSubmit={galleries.length > 0 && galleries[0]?.images?.length === GALLERY_CONSTRAINTS.IMAGES_COUNT ? handleUpdateGalleryInfo : handleSaveGallery}
        onImageUpload={handleImageUpload}
        onRemoveImage={removeImage}
        isLoading={isLoading}
        gallery={galleries[0] || null}
      />

      {/* Dialog de suppression */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer votre galerie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Votre galerie et toutes ses images
              seront définitivement supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGallery}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Composant pour le formulaire de galerie
interface GalleryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEdit: boolean;
  formData: {
    title: string;
    description: string;
    images: GalleryImage[];
    captions: string[];
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  validationErrors: string[];
  onSubmit: () => void;
  onImageUpload: (files: FileList | null) => void;
  onRemoveImage: (index: number) => void;
  isLoading: boolean;
  gallery?: VendorGallery | null;
}

const GalleryFormDialog: React.FC<GalleryFormDialogProps> = ({
  open,
  onOpenChange,
  isEdit,
  formData,
  setFormData,
  validationErrors,
  onSubmit,
  onImageUpload,
  onRemoveImage,
  isLoading,
  gallery
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const remainingSlots = GALLERY_CONSTRAINTS.IMAGES_COUNT - formData.images.length;
  const isOnlyInfoUpdate = isEdit && (gallery?.images?.length ?? 0) === GALLERY_CONSTRAINTS.IMAGES_COUNT;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isEdit ? (isOnlyInfoUpdate ? 'Modifier les informations' : 'Mettre à jour la galerie') : 'Créer votre galerie'}
          </DialogTitle>
          <DialogDescription>
            {isOnlyInfoUpdate
              ? 'Modifiez le titre et la description de votre galerie'
              : `Une galerie doit contenir exactement ${GALLERY_CONSTRAINTS.IMAGES_COUNT} images. Formats acceptés : JPEG, PNG, WebP (max 5MB par image)`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Erreurs de validation */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 mb-2">
                    Erreurs de validation
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                    {validationErrors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Titre */}
          <div>
            <Label htmlFor="title">
              Titre de la galerie *
              <span className="text-xs text-slate-500 ml-2">
                ({formData.title.length}/{GALLERY_CONSTRAINTS.TITLE_MAX_LENGTH})
              </span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Collection Printemps 2024"
              maxLength={GALLERY_CONSTRAINTS.TITLE_MAX_LENGTH}
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">
              Description (optionnel)
              <span className="text-xs text-slate-500 ml-2">
                ({formData.description.length}/{GALLERY_CONSTRAINTS.DESCRIPTION_MAX_LENGTH})
              </span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Décrivez votre galerie..."
              maxLength={GALLERY_CONSTRAINTS.DESCRIPTION_MAX_LENGTH}
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Zone d'upload d'images (uniquement si pas en mode modification simple) */}
          {!isOnlyInfoUpdate && (
            <div>
              <Label className="mb-3 block">
                Images ({formData.images.length}/{GALLERY_CONSTRAINTS.IMAGES_COUNT}) *
              </Label>

              {/* Grille des images uploadées */}
              {formData.images.length > 0 && (
                <div className="mb-4">
                  <div className="grid grid-cols-5 gap-3">
                    {formData.images.map((image, idx) => (
                      <div key={idx} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 border-2 border-slate-200">
                          <img
                            src={image.preview || image.imageUrl || image.url}
                            alt={`Image ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                            onError={(e) => {
                              console.error(`Erreur de chargement d'image preview: ${image.imageUrl || image.url}`);
                            }}
                          />
                          <button
                            type="button"
                            className="absolute top-1 right-1 h-6 w-6 bg-white/80 hover:bg-red-50 hover:text-red-600 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                            onClick={() => onRemoveImage(idx)}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <Input
                          type="text"
                          placeholder={`Légende ${idx + 1}...`}
                          value={formData.captions[idx] || ''}
                          onChange={(e) => {
                            const newCaptions = [...formData.captions];
                            newCaptions[idx] = e.target.value;
                            setFormData((prev: any) => ({ ...prev, captions: newCaptions }));
                          }}
                          className="text-xs mt-2 h-8"
                          maxLength={200}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bouton d'upload */}
              {remainingSlots > 0 && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={GALLERY_CONSTRAINTS.ALLOWED_FORMATS.join(',')}
                    multiple
                    onChange={(e) => onImageUpload(e.target.files)}
                    className="hidden"
                  />
                  <div
                    className="relative"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = e.dataTransfer.files;
                      if (files && files.length > 0) {
                        onImageUpload(files);
                      }
                    }}
                  >
                    <button
                      type="button"
                      className="w-full border-2 border-dashed border-gray-300 hover:border-[rgb(20,104,154)] hover:bg-[rgb(20,104,154)]/5 transition-colors h-32 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={remainingSlots === 0}
                    >
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="font-medium text-gray-700">
                          {formData.images.length === 0
                            ? 'Ajouter des images'
                            : `Ajouter ${remainingSlots} image${remainingSlots > 1 ? 's' : ''}`
                          }
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Glissez-déposez les images ici ou cliquez pour parcourir
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {remainingSlots} emplacement{remainingSlots > 1 ? 's' : ''} restant{remainingSlots > 1 ? 's' : ''}
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Indicateur de progression */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-slate-600 mb-2">
                  <span>Progression</span>
                  <span className="font-medium">
                    {formData.images.length}/{GALLERY_CONSTRAINTS.IMAGES_COUNT}
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[rgb(20,104,154)]"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(formData.images.length / GALLERY_CONSTRAINTS.IMAGES_COUNT) * 100}%`
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Message d'état */}
              {formData.images.length === GALLERY_CONSTRAINTS.IMAGES_COUNT && (
                <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Galerie complète !</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border-2 border-gray-200 text-gray-600 hover:bg-gray-50 bg-white rounded-lg transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isLoading || (!isOnlyInfoUpdate && formData.images.length !== GALLERY_CONSTRAINTS.IMAGES_COUNT)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[rgb(20,104,154)] hover:bg-[rgb(16,83,123)] active:bg-[rgb(14,72,108)] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                {isEdit ? 'Mise à jour...' : 'Création...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isOnlyInfoUpdate ? 'Mettre à jour' : (isEdit ? 'Recréer la galerie' : 'Créer la galerie')}
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VendorGalleryPage;