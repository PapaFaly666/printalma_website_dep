/**
 * Badge affichant le nombre de produits liés à une catégorie/sous-catégorie/variation
 * Basé sur la documentation CATEGORY_PROTECTION_VISUAL.md
 */

import React, { useEffect, useState } from 'react';
import { categoryProtectionService } from '../../services/categoryProtectionService';
import { Badge } from '../ui/badge';
import { Package } from 'lucide-react';

interface ProductCountBadgeProps {
  id: number;
  type: 'category' | 'subcategory' | 'variation';
  className?: string;
}

export const ProductCountBadge: React.FC<ProductCountBadgeProps> = ({
  id,
  type,
  className = ''
}) => {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductCount();
  }, [id, type]);

  const fetchProductCount = async () => {
    setLoading(true);
    try {
      let response;

      switch (type) {
        case 'category':
          response = await categoryProtectionService.canDeleteCategory(id);
          setCount(response.data.blockers.total || 0);
          break;
        case 'subcategory':
          response = await categoryProtectionService.canDeleteSubCategory(id);
          setCount(response.data.blockers.total || 0);
          break;
        case 'variation':
          response = await categoryProtectionService.canDeleteVariation(id);
          setCount(response.data.blockers.productsCount || 0);
          break;
      }
    } catch (error) {
      console.error('Erreur lors du chargement du nombre de produits', error);
      setCount(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Badge variant="secondary" className={className}>
        <div className="flex items-center gap-1">
          <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
          <span>...</span>
        </div>
      </Badge>
    );
  }

  if (count === null) {
    return (
      <Badge variant="secondary" className={className}>
        <Package className="h-3 w-3 mr-1" />
        N/A
      </Badge>
    );
  }

  if (count === 0) {
    return (
      <Badge variant="outline" className={`${className} text-green-600 border-green-600`}>
        <Package className="h-3 w-3 mr-1" />
        Aucun produit
      </Badge>
    );
  }

  return (
    <Badge
      variant="default"
      className={`${className} bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800`}
      title={`${count} produit(s) lié(s)`}
    >
      <Package className="h-3 w-3 mr-1" />
      {count} produit{count > 1 ? 's' : ''}
    </Badge>
  );
};
