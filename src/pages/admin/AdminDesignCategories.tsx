import React, { useState, useEffect } from 'react';
import { designCategoryService, DesignCategory, CreateDesignCategoryData, UpdateDesignCategoryData } from '../../services/designCategoryService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Loader2, Plus, Trash2, Edit, AlertCircle, Check, X } from 'lucide-react';
import { useToast } from '../../components/ui/use-toast';
import ImageUploader from '../../components/ui/ImageUploader';

const AdminDesignCategories: React.FC = () => {
  const [categories, setCategories] = useState<DesignCategory[]>([]);
  const [loading, setLoading] = useState(true);
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

  const { toast } = useToast();

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
      toast({
        title: '❌ Erreur de chargement',
        description: error.message || 'Impossible de charger les catégories',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
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
        toast({
          title: '✅ Thème modifié',
          description: `"${formData.name}" a été modifiée avec succès`
        });
      } else {
        await designCategoryService.createCategory(formData);
        toast({
          title: '✅ Thème créé',
          description: `"${formData.name}" a été créée avec succès`
        });
      }

      setShowForm(false);
      loadCategories();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: '❌ Erreur de sauvegarde',
        description: error.message || 'Impossible de sauvegarder la catégorie',
        variant: 'destructive'
      });
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
      toast({
        title: '✅ Thème supprimé',
        description: `"${category.name}" a été supprimée avec succès`
      });
      loadCategories();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: '❌ Erreur de suppression',
        description: error.message || 'Impossible de supprimer la catégorie',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Chargement des catégories...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🎨 Thèmes
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gérez les thèmes utilisés par les vendeurs pour classer leurs designs
          </p>
        </div>
        <Button onClick={openCreateForm} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau Thème
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {categories.length}
            </div>
            <p className="text-sm text-gray-600">Thèmes totaux</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {categories.filter(cat => cat.isActive).length}
            </div>
            <p className="text-sm text-gray-600">Thèmes actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {categories.reduce((sum, cat) => sum + cat.designCount, 0)}
            </div>
            <p className="text-sm text-gray-600">Designs totaux</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des catégories */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun thème
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
              Créez votre premier thème de design pour permettre aux vendeurs de classer leurs créations.
            </p>
            <Button onClick={openCreateForm} className="gap-2">
              <Plus className="h-4 w-4" />
              Créer un thème
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(category => (
            <Card key={category.id} className="relative">
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
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {category.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Créé par {category.creator.firstName} {category.creator.lastName}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditForm(category)}
                      className="gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(category)}
                      className="gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de création/modification */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Modifier le thème' : 'Nouveau thème'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
            {/* Colonne gauche: Nom & Description */}
            <div className="space-y-4">
              {/* Nom */}
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Logo Design"
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && (
                  <p className="text-xs text-red-600">{formErrors.name}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Pour les logos et identités visuelles..."
                  rows={8}
                />
              </div>
            </div>

            {/* Colonne droite: Image de couverture + Preview */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Image de couverture</Label>
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
            <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingCategory ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDesignCategories;