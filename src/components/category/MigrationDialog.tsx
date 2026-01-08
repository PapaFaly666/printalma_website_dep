/**
 * Composant de dialogue pour la migration de produits lors de la suppression de catégories
 * Basé sur la documentation CATEGORY_PROTECTION_VISUAL.md
 */

import React, { useState, useEffect } from 'react';
import { categoryProtectionService } from '../../services/categoryProtectionService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import Button from '../ui/Button';
import { Badge } from '../ui/badge';
import { AlertCircle, ArrowRight, Package } from 'lucide-react';
import { toast } from 'sonner';

interface MigrationDialogProps {
  categoryId: number;
  categoryName: string;
  blockerInfo: {
    blockers: {
      total?: number;
      directProducts?: number;
      subCategoryProducts?: number;
      variationProducts?: number;
    };
    message: string;
  };
  onClose: () => void;
  onMigrationComplete: () => void;
}

export const MigrationDialog: React.FC<MigrationDialogProps> = ({
  categoryId,
  categoryName,
  blockerInfo,
  onClose,
  onMigrationComplete
}) => {
  const [targetCategoryId, setTargetCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await categoryProtectionService.getAllCategories();
      // Filtrer la catégorie actuelle
      setCategories(data.filter((cat: any) => cat.id !== categoryId));
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      toast.error('Erreur lors du chargement des catégories disponibles');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleMigrate = async () => {
    if (!targetCategoryId) {
      toast.error('Veuillez sélectionner une catégorie de destination');
      return;
    }

    setLoading(true);

    try {
      const result = await categoryProtectionService.migrateProducts(categoryId, targetCategoryId);

      toast.success(`Migration réussie ! ${result.count} produit(s) déplacé(s).`);

      // Attendre un peu pour que l'utilisateur voie le message
      setTimeout(() => {
        onMigrationComplete();
      }, 1000);

    } catch (error) {
      console.error('Erreur migration:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la migration');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(cat => cat.id === targetCategoryId);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            Migration des Produits Requise
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Message d'avertissement */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              {blockerInfo.message}
            </p>
            <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
              {blockerInfo.blockers.directProducts && blockerInfo.blockers.directProducts > 0 && (
                <li className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {blockerInfo.blockers.directProducts} produit(s) directement lié(s)
                </li>
              )}
              {blockerInfo.blockers.subCategoryProducts && blockerInfo.blockers.subCategoryProducts > 0 && (
                <li className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {blockerInfo.blockers.subCategoryProducts} produit(s) dans les sous-catégories
                </li>
              )}
              {blockerInfo.blockers.variationProducts && blockerInfo.blockers.variationProducts > 0 && (
                <li className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {blockerInfo.blockers.variationProducts} produit(s) dans les variations
                </li>
              )}
            </ul>
          </div>

          {/* Sélection de la catégorie de destination */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Déplacer les produits de "{categoryName}" vers :
            </label>

            {loadingCategories ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-gray-100"></div>
              </div>
            ) : (
              <select
                value={targetCategoryId || ''}
                onChange={(e) => setTargetCategoryId(Number(e.target.value) || null)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="">-- Sélectionner une catégorie --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Aperçu de la migration */}
          {targetCategoryId && selectedCategory && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <span className="font-medium">{categoryName}</span>
                    <Badge variant="secondary" className="ml-2">
                      {blockerInfo.blockers.total} produit(s)
                    </Badge>
                  </div>
                  <ArrowRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div className="text-sm font-medium">
                    {selectedCategory.name}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleMigrate}
            disabled={loading || !targetCategoryId || loadingCategories}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Migration en cours...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Migrer les Produits
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
