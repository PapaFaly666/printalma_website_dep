import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  RefreshCcw,
  Loader2,
  Trash2,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { Product } from '../schemas/product.schema';
import { useDeletedProducts } from '../hooks/useDeletedProducts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Input } from "../components/ui/input";

const DeletedProducts: React.FC = () => {
  const navigate = useNavigate();
  
  // Récupérer les produits supprimés et les fonctions avec notre hook personnalisé
  const {
    deletedProducts,
    isLoading,
    error,
    operations,
    restoreProduct,
    hardDeleteProduct,
    refreshDeletedProducts,
  } = useDeletedProducts();
  
  // Journalisation pour le débogage
  useEffect(() => {
    console.log("DeletedProducts - Produits supprimés:", deletedProducts.length);
  }, [deletedProducts]);

  // Déclencher un rafraîchissement manuel au chargement initial
  useEffect(() => {
    refreshDeletedProducts();
  }, [refreshDeletedProducts]);

  // États pour la boîte de dialogue de suppression définitive
  const [isHardDeleteDialogOpen, setIsHardDeleteDialogOpen] = useState(false);
  const [productToHardDelete, setProductToHardDelete] = useState<Product | null>(null);
  const [hardDeleteConfirmationText, setHardDeleteConfirmationText] = useState('');

  // Vérifier si la confirmation de suppression est valide
  const isHardDeleteConfirmationValid = () => {
    return productToHardDelete && hardDeleteConfirmationText === productToHardDelete.name;
  };

  // Ouvrir la boîte de dialogue de confirmation pour la suppression définitive
  const confirmHardDelete = (product: Product) => {
    setProductToHardDelete(product);
    setHardDeleteConfirmationText('');
    setIsHardDeleteDialogOpen(true);
  };

  // Gérer la suppression définitive
  const handleHardDelete = async () => {
    if (!productToHardDelete || !isHardDeleteConfirmationValid()) return;
    
    try {
      // Appel API pour la suppression définitive
      const success = await hardDeleteProduct(productToHardDelete.id);
      
      if (success) {
        // Notification de succès
        toast.success('Produit supprimé définitivement');
        
        // Fermer la boîte de dialogue
        setIsHardDeleteDialogOpen(false);
        setProductToHardDelete(null);
        setHardDeleteConfirmationText('');
      }
    } catch (error: any) {
      toast.error('Erreur lors de la suppression définitive', {
        description: error.message || 'Une erreur est survenue'
      });
      console.error(error);
    }
  };

  // Annuler la suppression définitive
  const cancelHardDelete = () => {
    setIsHardDeleteDialogOpen(false);
    setProductToHardDelete(null);
    setHardDeleteConfirmationText('');
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto pt-8 pb-12 space-y-8 px-4 sm:px-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Button 
              variant="ghost" 
              className="p-0 hover:bg-transparent" 
              onClick={() => navigate('/admin/products')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            Corbeille
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gérez les produits supprimés temporairement
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline"
            className="border-gray-200 dark:border-gray-700"
            onClick={() => refreshDeletedProducts()}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg">
          <p>{error.message}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refreshDeletedProducts()} 
            className="mt-2 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            <RefreshCcw className="mr-2 h-3 w-3" />
            Réessayer
          </Button>
        </div>
      )}

      {/* Contenu principal */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Produits supprimés</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {deletedProducts.length} produit(s) supprimé(s)
            </p>
          </div>

          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-gray-400 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">Chargement des produits supprimés...</p>
            </div>
          ) : deletedProducts.length === 0 ? (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-900 mb-4">
                <Package className="h-10 w-10 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Aucun produit supprimé</h3>
              <p className="text-gray-500 dark:text-gray-400">
                La corbeille est vide. Les produits supprimés apparaîtront ici.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate('/admin/products')}
              >
                Retour à la liste des produits
              </Button>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Supprimé le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletedProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        {typeof product.category === 'object' 
                          ? product.category?.name 
                          : product.category}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'XOF',
                          maximumFractionDigits: 0
                        }).format(product.price)}
                      </TableCell>
                      <TableCell>
                        {product.deletedAt ? new Date(product.deletedAt).toLocaleString('fr-FR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </TableCell>
                      <TableCell className="text-right flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          disabled={operations.restore.loading}
                          onClick={() => product.id && restoreProduct(product.id)}
                        >
                          {operations.restore.loading ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          Restaurer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          disabled={operations.hardDelete.loading}
                          onClick={() => confirmHardDelete(product)}
                        >
                          {operations.hardDelete.loading ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1" />
                          )}
                          Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Boîte de dialogue pour la suppression définitive */}
      <AlertDialog 
        open={isHardDeleteDialogOpen} 
        onOpenChange={setIsHardDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Suppression définitive</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
              <div className="space-y-4">
                <p>
                  Attention ! Cette action est irréversible. Le produit sera définitivement supprimé 
                  du système et toutes ses données associées seront perdues.
                </p>
                
                <div>
                  <label htmlFor="hard-delete-confirm" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    Pour confirmer, saisissez le nom du produit: <span className="font-bold text-black dark:text-white">{productToHardDelete?.name}</span>
                  </label>
                  <Input
                    id="hard-delete-confirm"
                    value={hardDeleteConfirmationText}
                    onChange={(e) => setHardDeleteConfirmationText(e.target.value)}
                    placeholder="Saisissez le nom du produit"
                    className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={operations.hardDelete.loading}
              onClick={cancelHardDelete}
              className="border-gray-200 dark:border-gray-700 dark:text-gray-300"
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={operations.hardDelete.loading || !isHardDeleteConfirmationValid()}
              onClick={handleHardDelete}
              className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800"
            >
              {operations.hardDelete.loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer définitivement
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DeletedProducts; 