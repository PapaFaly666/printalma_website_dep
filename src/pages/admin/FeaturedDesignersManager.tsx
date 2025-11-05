import React, { useState, useEffect } from 'react';
import designerService from '../../services/designerService';
import { Designer } from '../../types/designer.types';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Loader2, GripVertical, Star, AlertCircle, Save, X, Plus, Eye, EyeOff, TrendingUp, User, Palette, Upload } from 'lucide-react';
import { useToast } from '../../components/ui/use-toast';
import ImageUploader from '../../components/ui/ImageUploader';
import { DESIGNER_UPLOAD_CONFIG } from '../../config/api';

const FeaturedDesignersManager: React.FC = () => {
  const [allDesigners, setAllDesigners] = useState<Designer[]>([]);
  const [featuredDesigners, setFeaturedDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [designerToReplace, setDesignerToReplace] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingDesigner, setEditingDesigner] = useState<Designer | null>(null);

  // Formulaire
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    bio: '',
    avatar: null as File | null,
    isActive: true
  });
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null);

  const { toast } = useToast();
  const MIN_FEATURED = 6; // Exactement 6 designers requis
  const MAX_FEATURED = 6; // Exactement 6 designers requis

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    return () => {
      if (previewAvatarUrl) URL.revokeObjectURL(previewAvatarUrl);
    };
  }, [previewAvatarUrl]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allDesigns, featuredDesigns] = await Promise.all([
        designerService.getAllDesigners(),
        designerService.getFeaturedDesigners()
      ]);

      setAllDesigners(allDesigns.designers);
      setFeaturedDesigners(featuredDesigns);
      setHasChanges(false);
    } catch (error: any) {
      console.error('Erreur lors du chargement:', error);
      toast({
        title: 'Erreur de chargement',
        description: error.message || 'Impossible de charger les designers',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    const newFeatured = [...featuredDesigners];
    const draggedDesigner = newFeatured[draggedItem];
    newFeatured.splice(draggedItem, 1);
    newFeatured.splice(index, 0, draggedDesigner);

    setFeaturedDesigners(newFeatured);
    setDraggedItem(index);
    setHasChanges(true);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const openCreateForm = () => {
    setFormData({
      name: '',
      displayName: '',
      bio: '',
      avatar: null,
      isActive: true
    });
    setCurrentAvatarUrl(null);
    setPreviewAvatarUrl(null);
    setEditingDesigner(null);
    setShowCreateDialog(true);
  };

  const openEditForm = (designer: Designer) => {
    setFormData({
      name: designer.name,
      displayName: designer.displayName || '',
      bio: designer.bio || '',
      avatar: null,
      isActive: designer.isActive
    });
    setCurrentAvatarUrl(designer.avatarUrl);
    setPreviewAvatarUrl(null);
    setEditingDesigner(designer);
    setShowCreateDialog(true);
  };

  const handleSaveDesigner = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Erreur de validation',
        description: 'Le nom du designer est requis',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);

      if (editingDesigner) {
        await designerService.updateDesigner(editingDesigner.id, {
          ...formData,
          avatar: formData.avatar,
          removeAvatar: !formData.avatar && !currentAvatarUrl
        });
        toast({
          title: 'Designer modifié',
          description: `"${formData.name}" a été modifié avec succès`
        });
      } else {
        await designerService.createDesigner(formData);
        toast({
          title: 'Designer créé',
          description: `"${formData.name}" a été créé avec succès`
        });
      }

      setShowCreateDialog(false);
      loadData();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: 'Erreur de sauvegarde',
        description: error.message || 'Impossible de sauvegarder le designer',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const addToFeatured = (designer: Designer) => {
    if (featuredDesigners.find(d => d.id === designer.id)) {
      toast({
        title: 'Déjà ajouté',
        description: 'Ce designer est déjà dans les vedettes',
        variant: 'destructive'
      });
      return;
    }

    if (featuredDesigners.length < MAX_FEATURED) {
      setFeaturedDesigners([...featuredDesigners, designer]);
      setHasChanges(true);
      setShowAddDialog(false);
    } else {
      // Selon la doc : exactement 6 designers requis, donc on doit remplacer
      toast({
        title: 'Limite atteinte',
        description: `Exactement ${MAX_FEATURED} designers requis. Sélectionnez un designer à remplacer.`,
        variant: 'default'
      });
      setShowAddDialog(false);
      setShowReplaceDialog(true);
      setDesignerToReplace(designer.id);
    }
  };

  const removeFromFeatured = (designerId: number) => {
    setFeaturedDesigners(featuredDesigners.filter(d => d.id !== designerId));
    setHasChanges(true);
  };

  const replaceDesigner = (oldDesignerId: number) => {
    if (!designerToReplace) return;

    const newDesigner = allDesigners.find(d => d.id === designerToReplace);
    if (!newDesigner) return;

    const newFeatured = featuredDesigners.map(designer =>
      designer.id === oldDesignerId ? newDesigner : designer
    );

    setFeaturedDesigners(newFeatured);
    setHasChanges(true);
    setShowReplaceDialog(false);
    setDesignerToReplace(null);

    toast({
      title: 'Designer remplacé',
      description: `"${newDesigner.name}" a remplacé le designer précédent`,
    });
  };

  const handleSave = async () => {
    try {
      if (featuredDesigners.length !== MAX_FEATURED) {
        toast({
          title: 'Configuration incomplète',
          description: `Vous devez sélectionner exactement ${MAX_FEATURED} designers (${featuredDesigners.length}/${MAX_FEATURED})`,
          variant: 'destructive'
        });
        return;
      }

      setSaving(true);
      const designerIds = featuredDesigners.map(d => d.id);
      await designerService.updateFeaturedDesigners(designerIds);

      toast({
        title: 'Configuration enregistrée',
        description: 'Les designers en vedette ont été mis à jour avec succès'
      });

      setHasChanges(false);
      loadData();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: 'Erreur de sauvegarde',
        description: error.message || 'Impossible de sauvegarder la configuration',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (designer: Designer) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le designer "${designer.name}" ?\n\nCette action est irréversible.`)) {
      return;
    }

    try {
      await designerService.deleteDesigner(designer.id);
      toast({
        title: 'Designer supprimé',
        description: `"${designer.name}" a été supprimé avec succès`
      });
      loadData();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur de suppression',
        description: error.message || 'Impossible de supprimer le designer',
        variant: 'destructive'
      });
    }
  };

  const availableDesigners = allDesigners.filter(
    designer => designer.isActive && !featuredDesigners.find(f => f.id === designer.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="p-6 w-full">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Palette className="h-8 w-8 text-purple-500" />
              Designers en Vedette
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Configurez les designers affichés sur la page d'accueil (exactement {MAX_FEATURED} designers requis selon la spécification)
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={openCreateForm} className="gap-2">
              <User className="h-4 w-4" />
              Nouveau Designer
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-2"
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPreview ? 'Masquer' : 'Aperçu'} Landing
            </Button>
            {hasChanges && (
              <>
                <Button variant="outline" onClick={loadData} disabled={saving}>
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Save className="h-4 w-4" />
                  Enregistrer
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${featuredDesigners.length === MAX_FEATURED ? 'text-green-600' : featuredDesigners.length < MIN_FEATURED ? 'text-red-600' : 'text-blue-600'}`}>
                {featuredDesigners.length}/{MAX_FEATURED}
              </div>
              <p className="text-sm text-gray-600">Designers configurés</p>
              {featuredDesigners.length < MIN_FEATURED && (
                <p className="text-xs text-red-600 mt-1">Exactement {MIN_FEATURED} requis</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {allDesigners.filter(d => d.isActive).length}
              </div>
              <p className="text-sm text-gray-600">Designers disponibles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">
                {allDesigners.length}
              </div>
              <p className="text-sm text-gray-600">Designers totaux</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Aperçu Landing - Designers Section */}
      {showPreview && (
        <Card className="mb-6 border-2 border-purple-200 bg-purple-50/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-purple-800">Aperçu Landing Page - Designers</CardTitle>
            </div>
            <CardDescription className="text-purple-700">
              Voici comment les designers apparaissent aux utilisateurs sur la page d'accueil (ordre actuel)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg shadow-inner overflow-hidden">
              <div className="transform scale-95 origin-top">
                <div className="w-full py-1 md:py-2 pt-6 sm:pt-8 md:pt-10 lg:pt-12">
                  <div className="flex items-center justify-between mb-1 px-4 sm:px-8">
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-black flex items-center gap-3">
                      <span className="font-bold">Designers</span>
                      <img src="/x_designer.svg" alt="Designer" className="w-6 h-6 md:w-8 md:h-8" />
                    </h2>
                    <button className="bg-white text-black px-6 py-2 rounded-md font-semibold text-sm hover:bg-gray-100 transition-colors duration-200">
                      Découvrir
                    </button>
                  </div>

                  <div className="px-4 sm:px-8">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="lg:w-1/3">
                        <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-4">
                          Nos créateurs talentueux
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Découvrez les designers qui donnent vie à vos produits personnalisés avec leur créativité et leur expertise.
                        </p>
                        <p className="text-sm text-gray-500">
                          Des motifs tendance aux illustrations artistiques, pour vos produits personnalisés.
                        </p>
                        <button className="bg-white text-black px-6 py-2 rounded-md font-semibold text-sm hover:bg-gray-100 transition-colors duration-200 mt-6">
                          Découvrir
                        </button>
                      </div>

                      <div className="lg:w-2/3 bg-yellow-400 relative">
                        <div className="grid grid-cols-3 gap-1 md:gap-2 p-3 md:p-4 h-full auto-rows-fr">
                          {featuredDesigners.length === 0 ? (
                            <div className="col-span-3 flex items-center justify-center h-32">
                              <p className="text-black font-medium text-center">
                                Aucun designer configuré. Configurez exactement {MIN_FEATURED} designers.
                              </p>
                            </div>
                          ) : (
                            <>
                              {featuredDesigners.slice(0, 6).map((designer, index) => (
                                <div key={designer.id} className={index === 0 || index === 3 || index === 4 ? "row-span-2" : ""}>
                                  <div className="bg-black rounded overflow-hidden relative group flex flex-col items-center justify-center text-white h-full">
                                    {/* Badge de position */}
                                    <div className="absolute z-10 top-1 left-1 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">
                                      #{index + 1}
                                    </div>
                                    <img
                                      src={designer.avatarUrl || '/placeholder-avatar.png'}
                                      alt={designer.name}
                                      className="w-10 h-10 md:w-12 md:h-12 mb-1 group-hover:scale-110 transition-transform duration-300"
                                    />
                                    <span className="text-xs md:text-sm font-bold">
                                      {designer.displayName || designer.name}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="font-medium text-purple-800">Impact visuel :</span>
                    <span className="ml-2 text-purple-600">
                      {featuredDesigners.length === MAX_FEATURED ? 'Parfait ⭐' : `${featuredDesigners.length}/${MIN_FEATURED} requis`}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-purple-800">Visibilité :</span>
                    <span className="ml-2 text-green-600">Première page</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-purple-800">Ordre actuel :</span>
                    <span className="ml-2 text-purple-600">
                      {featuredDesigners.map((designer, index) => `#${index + 1} ${designer.displayName || designer.name}`).join(' → ')}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-purple-600">
                  <span className="bg-purple-100 px-2 py-1 rounded-full">
                    ✅ Aperçu identique à la landing page
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section des designers en vedette */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Designers en Vedette</CardTitle>
              <CardDescription>
                Glissez-déposez pour réorganiser l'ordre d'affichage
              </CardDescription>
            </div>
            {featuredDesigners.length < MAX_FEATURED && availableDesigners.length > 0 && (
              <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter un designer
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {featuredDesigners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucun designer en vedette
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Configurez exactement {MIN_FEATURED} designers pour les afficher sur la page d'accueil
              </p>
              <Button onClick={openCreateForm} className="gap-2">
                <Plus className="h-4 w-4" />
                Créer votre premier designer
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {featuredDesigners.map((designer, index) => (
                <div
                  key={designer.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`
                    flex items-center gap-4 p-4 rounded-lg border-2 transition-all cursor-move
                    ${draggedItem === index ? 'border-purple-500 bg-purple-50 shadow-lg scale-105' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'}
                  `}
                >
                  <GripVertical className="h-5 w-5 text-gray-400" />

                  <Badge variant="outline" className="font-mono">
                    #{index + 1}
                  </Badge>

                  {designer.avatarUrl && (
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-black">
                      <img
                        src={designer.avatarUrl}
                        alt={designer.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {designer.displayName || designer.name}
                    </h4>
                    {designer.bio && (
                      <p className="text-sm text-gray-600 line-clamp-1">{designer.bio}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {designer.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFromFeatured(designer.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'ajout */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un designer en vedette</DialogTitle>
            <DialogDescription>
              Sélectionnez un designer à ajouter aux vedettes ({featuredDesigners.length}/{MAX_FEATURED} - {MIN_FEATURED} exactement requis)
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {availableDesigners.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucun designer disponible à ajouter
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableDesigners.map(designer => (
                  <Card
                    key={designer.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => addToFeatured(designer)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {designer.avatarUrl && (
                          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-black">
                            <img
                              src={designer.avatarUrl}
                              alt={designer.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {designer.displayName || designer.name}
                          </h4>
                          {designer.bio && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {designer.bio}
                            </p>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {designer.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de remplacement */}
      <Dialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Remplacer un designer en vedette</DialogTitle>
            <DialogDescription>
              Sélectionnez le designer que vous souhaitez remplacer par le nouveau designer
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Nouveau designer à ajouter :</strong> {
                  allDesigners.find(d => d.id === designerToReplace)?.displayName ||
                  allDesigners.find(d => d.id === designerToReplace)?.name || 'Designer inconnu'
                }
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredDesigners.map(designer => (
                <Card
                  key={designer.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-300"
                  onClick={() => replaceDesigner(designer.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {designer.avatarUrl && (
                        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-black">
                          <img
                            src={designer.avatarUrl}
                            alt={designer.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                          {designer.displayName || designer.name}
                          <Badge variant="destructive" className="text-xs">
                            Sera remplacé
                          </Badge>
                        </h4>
                        {designer.bio && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {designer.bio}
                          </p>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {designer.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowReplaceDialog(false);
              setDesignerToReplace(null);
            }}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de création/modification de designer */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDesigner ? 'Modifier le designer' : 'Nouveau designer'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nom *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Pap Musa"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Nom d'affichage</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="Pap Musa"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Description du designer..."
                    rows={4}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="isActive" className="text-sm">
                    Designer actif
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Avatar du designer</label>
                  <ImageUploader
                    onImageSelect={(file) => {
                      setFormData({ ...formData, avatar: file });
                      if (previewAvatarUrl) URL.revokeObjectURL(previewAvatarUrl);
                      setPreviewAvatarUrl(file ? URL.createObjectURL(file) : null);
                    }}
                    currentImage={currentAvatarUrl}
                    maxSize={DESIGNER_UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024)} // 10MB
                    acceptedTypes={DESIGNER_UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES}
                  />
                </div>

                <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {(previewAvatarUrl || currentAvatarUrl) ? (
                    <img
                      src={previewAvatarUrl || currentAvatarUrl || ''}
                      alt="Avatar du designer"
                      className="max-h-full w-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <span className="text-gray-500 text-sm">Aucun avatar</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSaveDesigner} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingDesigner ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeaturedDesignersManager;