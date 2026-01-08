import React, { useState, useEffect } from 'react';
import { designCategoryService, DesignCategory } from '../../services/designCategoryService';
import Button from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Loader2, GripVertical, Star, AlertCircle, Save, X, Plus, Eye, EyeOff, TrendingUp } from 'lucide-react';
import { useToast } from '../../components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../components/ui/dialog';
import ThemesTendances from '../ThemesTendances';

const FeaturedThemesManager: React.FC = () => {
  const [allCategories, setAllCategories] = useState<DesignCategory[]>([]);
  const [featuredCategories, setFeaturedCategories] = useState<DesignCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [categoryToReplace, setCategoryToReplace] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { toast } = useToast();
  const MIN_FEATURED = 5;
  const MAX_FEATURED = 5; // Exactement 5 thèmes requis

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allCats, featuredCats] = await Promise.all([
        designCategoryService.getAllCategories(),
        designCategoryService.getFeaturedCategories()
      ]);

      setAllCategories(allCats.categories);
      setFeaturedCategories(featuredCats);
      setHasChanges(false);
    } catch (error: any) {
      console.error('Erreur lors du chargement:', error);
      toast({
        title: 'Erreur de chargement',
        description: error.message || 'Impossible de charger les données',
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

    const newFeatured = [...featuredCategories];
    const draggedCategory = newFeatured[draggedItem];
    newFeatured.splice(draggedItem, 1);
    newFeatured.splice(index, 0, draggedCategory);

    setFeaturedCategories(newFeatured);
    setDraggedItem(index);
    setHasChanges(true);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const addToFeatured = (category: DesignCategory) => {
    if (featuredCategories.find(c => c.id === category.id)) {
      toast({
        title: 'Déjà ajouté',
        description: 'Ce thème est déjà dans les tendances',
        variant: 'destructive'
      });
      return;
    }

    if (featuredCategories.length < MAX_FEATURED) {
      // Ajout normal si pas encore à la limite
      setFeaturedCategories([...featuredCategories, category]);
      setHasChanges(true);
      setShowAddDialog(false);
    } else {
      // Ouvrir le dialogue de remplacement si déjà 5 thèmes
      toast({
        title: 'Limite atteinte',
        description: 'Sélectionnez un thème à remplacer',
        variant: 'default'
      });
      setShowAddDialog(false);
      setShowReplaceDialog(true);
      setCategoryToReplace(category.id);
    }
  };

  const removeFromFeatured = (categoryId: number) => {
    setFeaturedCategories(featuredCategories.filter(c => c.id !== categoryId));
    setHasChanges(true);
  };

  const replaceCategory = (oldCategoryId: number) => {
    if (!categoryToReplace) return;

    const newCategory = allCategories.find(c => c.id === categoryToReplace);
    if (!newCategory) return;

    const newFeatured = featuredCategories.map(cat =>
      cat.id === oldCategoryId ? newCategory : cat
    );

    setFeaturedCategories(newFeatured);
    setHasChanges(true);
    setShowReplaceDialog(false);
    setCategoryToReplace(null);

    toast({
      title: 'Thème remplacé',
      description: `"${newCategory.name}" a remplacé le thème précédent`,
    });
  };

  const handleSave = async () => {
    try {
      if (featuredCategories.length < MIN_FEATURED) {
        toast({
          title: 'Configuration incomplète',
          description: `Vous devez sélectionner au moins ${MIN_FEATURED} thèmes tendances (${featuredCategories.length}/${MIN_FEATURED})`,
          variant: 'destructive'
        });
        return;
      }

      if (featuredCategories.length > MAX_FEATURED) {
        toast({
          title: 'Limite dépassée',
          description: `Vous ne pouvez sélectionner que ${MAX_FEATURED} thèmes tendances maximum`,
          variant: 'destructive'
        });
        return;
      }

      setSaving(true);
      const categoryIds = featuredCategories.map(c => c.id);
      await designCategoryService.updateFeaturedCategories(categoryIds);

      toast({
        title: 'Configuration enregistrée',
        description: 'Les thèmes tendances ont été mis à jour avec succès'
      });

      setHasChanges(false);
      loadData(); // Recharger pour avoir les données à jour
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

  const handleReset = () => {
    loadData();
  };

  const availableCategories = allCategories.filter(
    cat => cat.isActive && !featuredCategories.find(f => f.id === cat.id)
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
              <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
              Thèmes Tendances
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Configurez les thèmes affichés sur la page d'accueil (exactement {MAX_FEATURED} thèmes requis)
            </p>
          </div>
          <div className="flex gap-2">
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
                <Button variant="outline" onClick={handleReset} disabled={saving}>
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

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${featuredCategories.length === MAX_FEATURED ? 'text-green-600' : featuredCategories.length < MIN_FEATURED ? 'text-red-600' : 'text-blue-600'}`}>
                {featuredCategories.length}/{MAX_FEATURED}
              </div>
              <p className="text-sm text-gray-600">Thèmes configurés</p>
              {featuredCategories.length < MIN_FEATURED && (
                <p className="text-xs text-red-600 mt-1">Minimum {MIN_FEATURED} requis</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {allCategories.filter(c => c.isActive).length}
              </div>
              <p className="text-sm text-gray-600">Thèmes disponibles</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">
                {allCategories.reduce((sum, cat) => sum + cat.designCount, 0)}
              </div>
              <p className="text-sm text-gray-600">Designs totaux</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Aperçu Landing - Thèmes Tendances */}
      {showPreview && (
        <Card className="mb-6 border-2 border-blue-200 bg-blue-50/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-blue-800">Aperçu Landing Page - Thèmes Tendances</CardTitle>
            </div>
            <CardDescription className="text-blue-700">
              Voici EXACTEMENT comment les thèmes apparaissent aux utilisateurs sur la page d'accueil (avec les données actuelles)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg shadow-inner overflow-hidden">
              {/* On utilise le composant exact de la landing avec les données actuelles */}
              <div className="transform scale-95 origin-top">
                <ThemesTendances themes={featuredCategories} />
              </div>
            </div>

            {/* Indicateurs de performance */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="font-medium text-blue-800">Impact visuel :</span>
                    <span className="ml-2 text-blue-600">
                      {featuredCategories.length === 5 ? 'Maximum ⭐' : `${featuredCategories.length}/5 thèmes`}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-blue-800">Visibilité :</span>
                    <span className="ml-2 text-green-600">Première page</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-blue-800">Ordre actuel :</span>
                    <span className="ml-2 text-purple-600">
                      {featuredCategories.map((cat, index) => `#${index + 1} ${cat.name}`).join(' → ')}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-blue-600">
                  <span className="bg-blue-100 px-2 py-1 rounded-full">
                    ✅ Composant identique à la landing page
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section des thèmes en vedette */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Thèmes en vedette</CardTitle>
              <CardDescription>
                Glissez-déposez pour réorganiser l'ordre d'affichage
              </CardDescription>
            </div>
            {featuredCategories.length < MAX_FEATURED ? (
              <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter un thème ({MIN_FEATURED - featuredCategories.length} requis)
              </Button>
            ) : (
              <Button onClick={() => setShowAddDialog(true)} className="gap-2" variant="outline">
                <Plus className="h-4 w-4" />
                Remplacer un thème
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {featuredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucun thème en vedette
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Ajoutez au moins {MIN_FEATURED} thèmes pour les afficher sur la page d'accueil
              </p>
              <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter des thèmes ({MIN_FEATURED} requis)
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {featuredCategories.map((category, index) => (
                <div
                  key={category.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`
                    flex items-center gap-4 p-4 rounded-lg border-2 transition-all cursor-move
                    ${draggedItem === index ? 'border-blue-500 bg-blue-50 shadow-lg scale-105' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'}
                  `}
                >
                  <GripVertical className="h-5 w-5 text-gray-400" />

                  <Badge variant="outline" className="font-mono">
                    #{index + 1}
                  </Badge>

                  {category.coverImageUrl && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={category.coverImageUrl}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{category.name}</h4>
                    {category.description && (
                      <p className="text-sm text-gray-600 line-clamp-1">{category.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {category.designCount} designs
                      </Badge>
                    </div>
                  </div>

                  {featuredCategories.length > MIN_FEATURED ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFromFeatured(category.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFromFeatured(category.id)}
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      title="Retirer (vous devrez en ajouter un autre)"
                    >
                      <Plus className="h-4 w-4 rotate-45" />
                    </Button>
                  )}
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
            <DialogTitle>Ajouter un thème tendance</DialogTitle>
            <DialogDescription>
              Sélectionnez un thème à ajouter aux tendances ({featuredCategories.length}/{MAX_FEATURED} - {MIN_FEATURED} minimum requis)
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {availableCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucun thème disponible à ajouter
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableCategories.map(category => (
                  <Card
                    key={category.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => addToFeatured(category)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {category.coverImageUrl && (
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={category.coverImageUrl}
                              alt={category.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 mb-1">{category.name}</h4>
                          {category.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {category.description}
                            </p>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {category.designCount} designs
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
            <DialogTitle>Remplacer un thème tendance</DialogTitle>
            <DialogDescription>
              Sélectionnez le thème que vous souhaitez remplacer par le nouveau thème
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Nouveau thème à ajouter :</strong> {
                  allCategories.find(c => c.id === categoryToReplace)?.name || 'Thème inconnu'
                }
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredCategories.map(category => (
                <Card
                  key={category.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-300"
                  onClick={() => replaceCategory(category.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {category.coverImageUrl && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={category.coverImageUrl}
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                          {category.name}
                          <Badge variant="destructive" className="text-xs">
                            Sera remplacé
                          </Badge>
                        </h4>
                        {category.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {category.description}
                          </p>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {category.designCount} designs
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
              setCategoryToReplace(null);
            }}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default FeaturedThemesManager;
