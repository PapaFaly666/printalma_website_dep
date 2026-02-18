import React, { useState, useEffect } from 'react';
import { designCategoryService, DesignCategory, CreateDesignCategoryData, UpdateDesignCategoryData } from '../../services/designCategoryService';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Badge } from '../../components/ui/badge';
import { Loader2, PlusCircle, Trash2, Edit, AlertCircle, Check, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import ImageUploader from '../../components/ui/ImageUploader';
import { AdminButton } from '../../components/admin/AdminButton';
import { motion } from 'framer-motion';

const AdminDesignCategories: React.FC = () => {
  const [categories, setCategories] = useState<DesignCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DesignCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CreateDesignCategoryData>({
    name: '',
    description: '',
    coverImage: null
  });
  const [currentCoverImage, setCurrentCoverImage] = useState<string | null>(null);
  const [removeCoverImage, setRemoveCoverImage] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [previewCoverImageUrl, setPreviewCoverImageUrl] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    return () => {
      if (previewCoverImageUrl) URL.revokeObjectURL(previewCoverImageUrl);
    };
  }, [previewCoverImageUrl]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await designCategoryService.getAllCategories();
      setCategories(response.categories);
    } catch (error: any) {
      console.error('Erreur lors du chargement des catégories:', error);
      toast.error(error.message || 'Impossible de charger les catégories');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await loadCategories();
      toast.success('Données actualisées avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'actualisation');
    } finally {
      setIsRefreshing(false);
    }
  };

  const openCreateForm = () => {
    setFormData({
      name: '',
      description: '',
      coverImage: null
    });
    setCurrentCoverImage(null);
    setPreviewCoverImageUrl(null);
    setRemoveCoverImage(false);
    setFormErrors({});
    setEditingCategory(null);
    setShowForm(true);
  };

  const openEditForm = (category: DesignCategory) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      coverImage: null
    });
    setCurrentCoverImage(category.coverImageUrl || null);
    setPreviewCoverImageUrl(null);
    setRemoveCoverImage(false);
    setFormErrors({});
    setEditingCategory(category);
    setShowForm(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Le nom est requis';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Le nom doit contenir au moins 2 caractères';
    }


    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      if (editingCategory) {
        const updateData: UpdateDesignCategoryData = {
          name: formData.name,
          description: formData.description,
          coverImage: formData.coverImage,
          removeCoverImage,
          isActive: formData.isActive,
          sortOrder: formData.sortOrder
        };

        await designCategoryService.updateCategory(editingCategory.id, updateData);
        toast.success(`"${formData.name}" a été modifié avec succès`);
      } else {
        await designCategoryService.createCategory(formData);
        toast.success(`"${formData.name}" a été créé avec succès`);
      }

      setShowForm(false);
      loadCategories();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error(error.message || 'Impossible de sauvegarder la catégorie');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: DesignCategory) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le thème "${category.name}" ?\n\nCette action est irréversible.`)) {
      return;
    }

    try {
      await designCategoryService.deleteCategory(category.id);
      toast.success(`"${category.name}" a été supprimé avec succès`);
      loadCategories();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(error.message || 'Impossible de supprimer la catégorie');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Chargement des thèmes...</span>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      {/* En-tête simplifié */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 px-4 sm:px-6 py-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Gestion des thèmes
            </h1>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-600">
                <span className="font-semibold text-gray-900">{categories.length}</span> thème{categories.length > 1 ? 's' : ''}
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">
                <span className="font-semibold text-gray-900">{categories.filter(cat => cat.isActive).length}</span> actif{categories.filter(cat => cat.isActive).length > 1 ? 's' : ''}
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">
                <span className="font-semibold text-gray-900">{categories.reduce((sum, cat) => sum + cat.designCount, 0)}</span> designs
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <AdminButton
              variant="outline"
              size="sm"
              onClick={handleRefreshData}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </AdminButton>

            <AdminButton
              variant="primary"
              size="sm"
              onClick={openCreateForm}
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Nouveau thème</span>
            </AdminButton>
          </div>
        </div>
      </motion.div>

      {/* Contenu principal */}
      <div className="px-4 sm:px-6 py-8">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Liste des thèmes
              </h2>
              <Badge variant="outline" className="bg-gray-50">
                {categories.length} thème{categories.length > 1 ? 's' : ''}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              Gérez les thèmes utilisés par les vendeurs pour classer leurs designs
            </p>
          </div>

          <div className="p-6">
            {categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun thème
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  Créez votre premier thème de design pour permettre aux vendeurs de classer leurs créations.
                </p>
                <AdminButton
                  variant="primary"
                  size="sm"
                  onClick={openCreateForm}
                >
                  <PlusCircle className="h-4 w-4" />
                  Créer un thème
                </AdminButton>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(category => (
                  <Card key={category.id} className="relative hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 w-full">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                              <CardTitle className="text-lg">{category.name}</CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge variant={category.isActive ? "default" : "secondary"}>
                                  {category.isActive ? (
                                    <><Check className="h-3 w-3 mr-1" /> Actif</>
                                  ) : (
                                    <><X className="h-3 w-3 mr-1" /> Inactif</>
                                  )}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {category.designCount} designs
                                </span>
                              </div>
                            </div>
                            <div className="mb-3">
                              {category.coverImageUrl ? (
                                <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                  <img
                                    src={category.coverImageUrl}
                                    alt={category.name}
                                    className="max-h-full w-full object-contain"
                                  />
                                </div>
                              ) : (
                                <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                                  <span>Aucune image</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {category.description && (
                        <p className="text-sm text-gray-600 mb-4">
                          {category.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          Créé par {category.creator.firstName} {category.creator.lastName}
                        </div>
                        <div className="flex gap-2">
                          <AdminButton
                            variant="outline"
                            size="sm"
                            onClick={() => openEditForm(category)}
                          >
                            <Edit className="h-3 w-3" />
                            Modifier
                          </AdminButton>
                          <AdminButton
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(category)}
                          >
                            <Trash2 className="h-3 w-3" />
                            Supprimer
                          </AdminButton>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog de création/modification */}
      <Dialog open={showForm} onOpenChange={(open) => !saving && setShowForm(open)}>
        <DialogContent className="sm:max-w-3xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {editingCategory ? 'Modifier le thème' : 'Nouveau thème'}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {editingCategory ? 'Modifiez les informations du thème' : 'Créez un nouveau thème pour classer les designs'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Colonne gauche: Nom & Description */}
            <div className="space-y-4">
              {/* Nom */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nom du thème *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Logo Design"
                  className={formErrors.name ? 'border-red-500' : ''}
                  disabled={saving}
                />
                {formErrors.name && (
                  <p className="text-xs text-red-600">{formErrors.name}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description (optionnelle)
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Pour les logos et identités visuelles..."
                  rows={8}
                  className="resize-none"
                  disabled={saving}
                />
              </div>
            </div>

            {/* Colonne droite: Image de couverture + Preview */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Image de couverture</Label>
                <ImageUploader
                  onImageSelect={(file) => {
                    setFormData({ ...formData, coverImage: file });
                    if (previewCoverImageUrl) URL.revokeObjectURL(previewCoverImageUrl);
                    setPreviewCoverImageUrl(file ? URL.createObjectURL(file) : null);
                    if (file) {
                      setRemoveCoverImage(false);
                    }
                  }}
                  currentImage={currentCoverImage}
                  maxSize={2}
                />
                {currentCoverImage && !formData.coverImage && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="removeCoverImage"
                      checked={removeCoverImage}
                      onChange={(e) => setRemoveCoverImage(e.target.checked)}
                      className="rounded"
                      disabled={saving}
                    />
                    <Label htmlFor="removeCoverImage" className="text-sm">
                      Supprimer l'image actuelle
                    </Label>
                  </div>
                )}
              </div>

              {/* Aperçu image affichée entièrement */}
              <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {previewCoverImageUrl || currentCoverImage ? (
                  <img
                    src={previewCoverImageUrl || currentCoverImage || ''}
                    alt="Aperçu couverture"
                    className="max-h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-gray-500 text-sm">Aucun aperçu disponible</span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <AdminButton
              variant="outline"
              onClick={() => setShowForm(false)}
              disabled={saving}
            >
              Annuler
            </AdminButton>
            <AdminButton
              variant="primary"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCategory ? 'Modifier' : 'Créer'}
            </AdminButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDesignCategories;