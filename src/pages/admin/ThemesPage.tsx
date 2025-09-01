import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Image as ImageIcon,
  Package,
  Calendar,
  TrendingUp,
  Settings
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { apiGet, apiPost, apiDelete } from '../../utils/apiHelpers';
import AddThemeForm from '../../components/admin/AddThemeForm';
import themeService, { Theme, ThemeFilters } from '../../services/themeService';

const ThemesPage: React.FC = () => {
  console.log('🎨 ThemesPage - Composant chargé');
  const navigate = useNavigate();
  
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);

  // Charger les thèmes
  useEffect(() => {
    fetchThemes();
  }, []); // Seulement au montage du composant

  // Recharger les thèmes quand les filtres changent (avec debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchThemes();
    }, 300); // Attendre 300ms après le dernier changement

    return () => clearTimeout(timeoutId);
  }, [filterStatus, searchTerm]); // Dépendances pour les filtres

  const fetchThemes = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🎨 ThemesPage - Début du chargement des thèmes');
      
      // Construire les filtres selon la documentation
      const filters: ThemeFilters = {
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchTerm || undefined,
        limit: 20,
        offset: 0
      };
      
      console.log('🎨 ThemesPage - Filtres:', filters);
      const result = await themeService.getThemes(filters);
      
      console.log('🎨 ThemesPage - Résultat API:', result);
      
      // S'assurer que result.data est un tableau selon la documentation
      const themesData = Array.isArray(result.data) ? result.data : [];
      setThemes(themesData);
      
      console.log('✅ Thèmes chargés:', themesData.length);
      console.log('📋 Détails des thèmes:', themesData);
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des thèmes:', error);
      setError(error.message || 'Erreur lors du chargement des thèmes');
      // En cas d'erreur, on initialise avec un tableau vide
      setThemes([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les thèmes
  const filteredThemes = (themes || []).filter(theme => {
    // Vérifications de sécurité pour éviter les erreurs si les données sont incomplètes
    if (!theme || typeof theme !== 'object') return false;
    
    const themeName = theme.name || '';
    const themeDescription = theme.description || '';
    const themeStatus = theme.status || 'inactive';
    
    // Recherche dans le nom et la description
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      themeName.toLowerCase().includes(searchLower) ||
      themeDescription.toLowerCase().includes(searchLower);
    
    // Filtre par statut
    const matchesStatus = filterStatus === 'all' || themeStatus === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleDeleteTheme = async (themeId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce thème ?')) {
      return;
    }

    try {
      await apiDelete(`/themes/${themeId}`);
      toast.success('Thème supprimé avec succès');
      fetchThemes(); // Recharger la liste
    } catch (error) {
      console.error('Erreur lors de la suppression du thème:', error);
      toast.error('Erreur lors de la suppression du thème');
    }
  };

  const getDefaultImage = (category: string) => {
    const categoryLower = category?.toLowerCase() || '';
    if (categoryLower.includes('manga') || categoryLower.includes('anime')) {
      return '/images/manga-theme.jpg';
    } else if (categoryLower.includes('gaming') || categoryLower.includes('jeu')) {
      return '/images/gaming-theme.jpg';
    } else if (categoryLower.includes('nature') || categoryLower.includes('paysage')) {
      return '/images/nature-theme.jpg';
    } else {
      return '/images/default-theme.jpg';
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, theme: Theme) => {
    const target = e.target as HTMLImageElement;
    target.src = getDefaultImage(theme.category || '');
  };

  const handleManageProducts = (theme: Theme) => {
    navigate(`/admin/themes/${theme.id}/products`);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  if (loading) {
    console.log('🎨 ThemesPage - État: Chargement');
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Chargement des thèmes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.log('🎨 ThemesPage - État: Erreur', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Erreur:</strong> {error}
            </div>
            <button 
              onClick={() => {
                setError(null);
                fetchThemes();
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log('🎨 ThemesPage - État: Rendu normal, thèmes:', themes.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                🎨 Gestion des Thèmes
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Créez et gérez vos thèmes de produits
              </p>
            </div>
            
            <Button
              onClick={() => setShowAddModal(true)}
              className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Thème
            </Button>
          </div>
        </motion.div>

        {/* Barre de recherche et filtres */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Recherche */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Rechercher un thème..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                />
              </div>

              {/* Filtres */}
              <div className="flex items-center gap-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>

                {/* Toggle vue */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-md"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-md"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Grille des thèmes */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}
        >
          <AnimatePresence>
            {filteredThemes.map((theme) => (
              <motion.div
                key={theme.id}
                variants={itemVariants}
                layout
                className={viewMode === 'grid' ? '' : 'w-full'}
              >
                <Card className="group hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Image de couverture */}
                  <div className="relative h-48 overflow-hidden">
                    {theme.coverImage ? (
                      <img
                        src={theme.coverImage}
                        alt={theme.name || 'Thème'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => handleImageError(e, theme)}
                      />
                    ) : (
                      <img
                        src={getDefaultImage(theme.category || 'default')}
                        alt={theme.name || 'Thème'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => handleImageError(e, theme)}
                      />
                    )}
                    
                    {/* Image par défaut (visible si pas d'image ou erreur) */}
                    <div className={`w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center ${theme.coverImage ? 'hidden' : ''}`}>
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    </div>
                    
                    {/* Badge statut */}
                    <div className="absolute top-3 right-3">
                      <Badge 
                        variant={(theme.status || 'inactive') === 'active' ? 'default' : 'secondary'}
                        className="backdrop-blur-sm"
                      >
                        {(theme.status || 'inactive') === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>

                    {/* Actions hover */}
                    <div className="absolute inset-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedTheme(theme)}
                          className="bg-white/90 hover:bg-white"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {/* TODO: Edit */}}
                          className="bg-white/90 hover:bg-white"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleManageProducts(theme)}
                          className="bg-white/90 hover:bg-white"
                        >
                          <Package className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteTheme(theme.id || 0)}
                          className="bg-red-500/90 hover:bg-red-500 text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                          {theme.name || 'Thème sans nom'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {theme.description || 'Aucune description'}
                        </p>
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs mr-2">
                            {theme.category || 'Sans catégorie'}
                          </Badge>
                          {theme.featured && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600 text-xs">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Mis en avant
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>{theme.productCount || 0} produits</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {theme.createdAt 
                            ? new Date(theme.createdAt).toLocaleDateString() 
                            : 'Date inconnue'
                          }
                        </span>
                      </div>
                    </div>

                    {/* Statut du thème */}
                    <div className="mt-3">
                      <Badge 
                        variant={theme.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {theme.status === 'active' ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Message si aucun thème */}
        {filteredThemes.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
              <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Aucun thème ne correspond à vos critères'
                  : 'Aucun thème disponible'
                }
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Essayez de modifier vos filtres de recherche.'
                  : 'Commencez par créer votre premier thème pour organiser vos produits.'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un thème
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal d'ajout de thème */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              🎨 Créer un nouveau thème
            </DialogTitle>
          </DialogHeader>
          <AddThemeForm onClose={() => setShowAddModal(false)} onSuccess={() => {
            setShowAddModal(false);
            fetchThemes();
          }} />
        </DialogContent>
      </Dialog>

      {/* Modal de détail du thème */}
      <Dialog open={!!selectedTheme} onOpenChange={() => setSelectedTheme(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTheme && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  {selectedTheme.name}
                </DialogTitle>
              </DialogHeader>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Détails du thème</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {selectedTheme.description}
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Statut:</span>
                        <Badge variant={selectedTheme.status === 'active' ? 'default' : 'secondary'}>
                          {selectedTheme.status === 'active' ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Catégorie:</span>
                        <span>{selectedTheme.category || 'Sans catégorie'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Produits:</span>
                        <span>{selectedTheme.productCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Mis en avant:</span>
                        <span>{selectedTheme.featured ? 'Oui' : 'Non'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Créé le:</span>
                        <span>
                          {selectedTheme.createdAt 
                            ? new Date(selectedTheme.createdAt).toLocaleDateString() 
                            : 'Date inconnue'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Modifié le:</span>
                        <span>
                          {selectedTheme.updatedAt 
                            ? new Date(selectedTheme.updatedAt).toLocaleDateString() 
                            : 'Date inconnue'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Image de couverture</h3>
                    {selectedTheme.coverImage ? (
                      <img
                        src={selectedTheme.coverImage}
                        alt={selectedTheme.name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Liste des produits du thème */}
                {selectedTheme.products && selectedTheme.products.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg">Produits du thème</h3>
                      <Button
                        size="sm"
                        onClick={() => handleManageProducts(selectedTheme)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter des produits
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedTheme.products.map(product => (
                        <div key={product.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                            {product.name}
                          </h4>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              {(product.price / 100).toFixed(2)}€
                            </span>
                            <Badge 
                              variant={product.status === 'published' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {product.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!selectedTheme.products || selectedTheme.products.length === 0) && (
                  <div className="mt-6 text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Aucun produit dans ce thème
                    </p>
                    <Button
                      onClick={() => handleManageProducts(selectedTheme)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter des produits
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ThemesPage; 