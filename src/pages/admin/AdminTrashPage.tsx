import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Trash2, Undo2, Search, XCircle, CheckCircle, Trash } from 'lucide-react';
import { Button } from '../../components/ui/button';

const ELEMENT_TYPES = [
  { value: 'product', label: 'Produits' },
  // { value: 'user', label: 'Utilisateurs' },
  // { value: 'article', label: 'Articles' },
];

const PAGE_SIZE = 8;

const AdminTrashPage: React.FC = () => {
  const [deletedItems, setDeletedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoringIds, setRestoringIds] = useState<number[]>([]);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [typeFilter, setTypeFilter] = useState('product');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [toDeleteIds, setToDeleteIds] = useState<number[]>([]);
  const [colorIndexes, setColorIndexes] = useState<{ [id: number]: number }>({});

  // 1. Génère la liste des catégories à partir des produits supprimés
  const allCategories = Array.from(new Set(deletedItems.flatMap(item => (item.categories || []).map((cat: any) => cat.name))));
  const [categoryFilter, setCategoryFilter] = useState('');

  // Fetch deleted products (extendable for other types)
  useEffect(() => {
    async function fetchDeleted() {
      setLoading(true);
      setError(null);
      try {
        let url = '';
        if (typeFilter === 'product') url = 'https://printalma-back-dep.onrender.com/products/deleted';
        // else if (typeFilter === 'user') url = ...
        // else if (typeFilter === 'article') url = ...
        const res = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error('Erreur lors de la récupération des éléments supprimés');
        const data = await res.json();
        setDeletedItems(data);
      } catch (e: any) {
        setError(e.message || 'Erreur lors de la récupération des éléments supprimés');
      } finally {
        setLoading(false);
      }
    }
    fetchDeleted();
  }, [typeFilter]);

  // 2. Remplace le filtre par type par un filtre par catégorie
  const filtered = deletedItems.filter(item => {
    if (categoryFilter && (!item.categories || !item.categories.some((cat: any) => cat.name === categoryFilter))) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Sélection groupée
  const toggleSelect = (id: number) => {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  };
  const selectAll = () => setSelectedIds(paginated.map(i => i.id));
  const deselectAll = () => setSelectedIds([]);

  // Actions
  async function restoreItem(id: number) {
    setRestoringIds(ids => [...ids, id]);
    try {
      const res = await fetch(`https://printalma-back-dep.onrender.com/products/${id}/restore`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erreur lors de la restauration');
      toast.success('Élément restauré');
      setDeletedItems(items => items.filter(i => i.id !== id));
      setSelectedIds(ids => ids.filter(i => i !== id));
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la restauration');
    } finally {
      setRestoringIds(ids => ids.filter(i => i !== id));
    }
  }
  async function deleteItem(id: number) {
    setDeletingIds(ids => [...ids, id]);
    try {
      const res = await fetch(`https://printalma-back-dep.onrender.com/products/${id}/delete-forever`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Erreur lors de la suppression définitive');
      toast.success('Élément supprimé définitivement');
      setDeletedItems(items => items.filter(i => i.id !== id));
      setSelectedIds(ids => ids.filter(i => i !== id));
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la suppression définitive');
    } finally {
      setDeletingIds(ids => ids.filter(i => i !== id));
    }
  }
  // Actions groupées
  async function restoreSelected() {
    for (const id of selectedIds) await restoreItem(id);
  }
  async function deleteSelected() {
    setShowConfirmDelete(false);
    for (const id of toDeleteIds) await deleteItem(id);
    setToDeleteIds([]);
  }

  // UI
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="w-full mx-auto">
        <h1 className="text-2xl font-bold mb-6">Corbeille</h1>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setPage(1); setSelectedIds([]); }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-sm"
            >
              <option value="">Toutes les catégories</option>
              {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={restoreSelected}
              disabled={selectedIds.length === 0}
              className="flex items-center gap-2"
            >
              <Undo2 className="h-4 w-4" />
              Restaurer la sélection
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => { setShowConfirmDelete(true); setToDeleteIds(selectedIds); }}
              disabled={selectedIds.length === 0}
              className="flex items-center gap-2"
            >
              <Trash className="h-4 w-4" />
              Supprimer définitivement
            </Button>
          </div>
        </div>
        {/* Remplace la table par une table responsive avec overflow-x-auto et adapte les paddings/tailles */}
        <div className="overflow-x-auto rounded-lg shadow border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <table className="min-w-full w-full divide-y divide-gray-200 dark:divide-gray-800 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && paginated.every(i => selectedIds.includes(i.id))}
                    onChange={e => e.target.checked ? selectAll() : deselectAll()}
                  />
                </th>
                <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nom</th>
                <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date de suppression</th>
                <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Catégorie</th>
                <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prix</th>
                <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Taille</th>
                <th className="px-2 md:px-4 py-2 md:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={9} className="py-8 text-center text-gray-500">Chargement...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={9} className="py-8 text-center text-gray-400">Aucun élément supprimé.</td></tr>
              ) : paginated.map(item => {
                // Affichage image + couleurs pour les produits
                const isProduct = typeFilter === 'product';
                const colorIndex = colorIndexes[item.id] ?? 0;
                const colorVars = item.colorVariations || [];
                const color = colorVars[colorIndex];
                const image = color?.images?.[0];
                return (
                  <tr key={item.id} className={selectedIds.includes(item.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}>
                    <td className="px-2 md:px-4 py-2 md:py-3 align-top">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
                      />
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 font-medium text-gray-900 dark:text-white flex items-center gap-2 md:gap-3 min-w-[180px]">
                      {isProduct && image && (
                        <img src={image.url} alt={item.name} className="w-10 h-10 md:w-12 md:h-12 rounded-md object-cover border border-gray-200 dark:border-gray-700" />
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-1 md:gap-2">
                          {isProduct && colorVars.length > 1 && (
                            <div className="flex items-center gap-1">
                              {colorVars.map((c: any, idx: number) => (
                                <button
                                  key={c.id}
                                  onClick={() => setColorIndexes(prev => ({ ...prev, [item.id]: idx }))}
                                  className={`w-3 h-3 md:w-4 md:h-4 rounded-full border-2 transition-all ${idx === colorIndex ? 'border-gray-900 scale-110' : 'border-gray-300 hover:border-gray-600'}`}
                                  style={{ backgroundColor: c.colorCode }}
                                  title={c.name}
                                />
                              ))}
                            </div>
                          )}
                          <span className="truncate max-w-[100px] md:max-w-none">{item.name}</span>
                        </div>
                        {isProduct && color && (
                          <div className="text-xs text-gray-500 mt-1">{color.name}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-gray-600 dark:text-gray-400 text-xs md:text-sm min-w-[110px]">{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-gray-600 dark:text-gray-400 text-xs md:text-sm min-w-[120px]">{isProduct && item.categories && item.categories.length > 0 ? item.categories.map((cat: any) => cat.name).join(', ') : '-'}</td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-gray-600 dark:text-gray-400 text-xs md:text-sm max-w-[120px] truncate">{isProduct && item.description ? item.description : '-'}</td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-gray-600 dark:text-gray-400 text-xs md:text-sm">{isProduct && typeof item.price === 'number' ? item.price.toLocaleString() + ' FCFA' : '-'}</td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-gray-600 dark:text-gray-400 text-xs md:text-sm">{isProduct && item.sizes && item.sizes.length > 0 ? item.sizes.map((s: any) => s.sizeName).join(', ') : '-'}</td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-right flex gap-1 md:gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => restoreItem(item.id)}
                        disabled={restoringIds.includes(item.id)}
                        className="flex items-center gap-1"
                      >
                        {restoringIds.includes(item.id) ? '...' : <Undo2 className="h-4 w-4" />}
                        <span className="hidden md:inline">Restaurer</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => { setShowConfirmDelete(true); setToDeleteIds([item.id]); }}
                        disabled={deletingIds.includes(item.id)}
                        className="flex items-center gap-1"
                      >
                        {deletingIds.includes(item.id) ? '...' : <Trash className="h-4 w-4" />}
                        <span className="hidden md:inline">Supprimer</span>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Précédent</Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">Page {page} / {totalPages}</span>
            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Suivant</Button>
          </div>
        )}
        {/* Confirmation suppression définitive */}
        {showConfirmDelete && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700 shadow-lg">
              <h4 className="text-lg font-semibold mb-2 flex items-center gap-2 text-red-700 dark:text-red-300">
                <XCircle className="h-5 w-5" />
                Confirmer la suppression définitive
              </h4>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Êtes-vous sûr de vouloir supprimer définitivement {toDeleteIds.length > 1 ? `${toDeleteIds.length} éléments` : 'cet élément'} ? Cette action est <b>irréversible</b>.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => { setShowConfirmDelete(false); setToDeleteIds([]); }}>Annuler</Button>
                <Button variant="destructive" onClick={deleteSelected}>
                  <Trash className="h-4 w-4 mr-1" />
                  Supprimer définitivement
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTrashPage; 