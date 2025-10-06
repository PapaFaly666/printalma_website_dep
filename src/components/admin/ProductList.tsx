import React, { useState } from 'react';
import { useProductsAPI, UseProductsAPIReturn } from '../../hooks/useProductsAPI';
import { Product } from '../../services/productService';
import { motion } from 'framer-motion';
import { Trash2, Edit3, Eye, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onDelete: (id: number) => void;
  onEdit?: (product: Product) => void;
  onView?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onDelete, onEdit, onView }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    onDelete(product.id);
  };

  return (
    <motion.div 
      className="product-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* Images miniatures */}
      <div className="product-images">
        {product.colorVariations.map((color, index) => (
          <div key={color.id} className="color-variation" style={{ zIndex: product.colorVariations.length - index }}>
            {color.images.length > 0 && (
              <img 
                src={color.images[0].url} 
                alt={`${product.name} - ${color.name}`}
                className="product-thumbnail"
              />
            )}
            <div 
              className="color-dot" 
              style={{ backgroundColor: color.colorCode }}
              title={color.name}
            />
          </div>
        ))}
      </div>

      {/* Informations produit */}
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">
          {product.description.length > 100 
            ? product.description.substring(0, 100) + '...'
            : product.description
          }
        </p>
        
        <div className="product-details">
          <div className="price-stock">
            <span className="price">{product.price.toFixed(2)} FCFA</span>
            <span className={`stock ${product.stock === 0 ? 'out-of-stock' : ''}`}>
              Stock: {product.stock}
            </span>
          </div>
          
          <div className="categories">
            <span className="category-tag">
              {product.categoryId || 'Non catégorisé'}
            </span>
          </div>
          
          <div className="sizes">
            <span className="sizes-label">Tailles:</span>
            {product.sizes?.map(size => (
              <span key={size.id} className="size-tag">{size.sizeName}</span>
            ))}
          </div>
          
          <div className="metadata">
            <span className={`status ${product.status}`}>
              {product.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
            </span>
            <span className="created-date">
              Créé le {new Date(product.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="product-actions">
        {onView && (
          <button 
            className="action-btn view-btn"
            onClick={() => onView(product)}
            title="Voir le produit"
          >
            <Eye size={16} />
          </button>
        )}
        
        {onEdit && (
          <button 
            className="action-btn edit-btn"
            onClick={() => onEdit(product)}
            title="Modifier le produit"
          >
            <Edit3 size={16} />
          </button>
        )}
        
        <button 
          className="action-btn delete-btn"
          onClick={() => setShowDeleteConfirm(true)}
          title="Supprimer le produit"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-modal">
            <h4>Confirmer la suppression</h4>
            <p>Êtes-vous sûr de vouloir supprimer "{product.name}" ?</p>
            <div className="confirm-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Annuler
              </button>
              <button 
                className="confirm-btn"
                onClick={handleDelete}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNext: boolean;
  hasPrev: boolean;
}

const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  hasNext, 
  hasPrev 
}) => {
  return (
    <div className="pagination">
      <button 
        className="pagination-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrev}
      >
        <ChevronLeft size={20} />
        Précédent
      </button>
      
      <div className="page-info">
        <span>Page {currentPage} sur {totalPages}</span>
      </div>
      
      <button 
        className="pagination-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext}
      >
        Suivant
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

interface ProductListProps {
  onEditProduct?: (product: Product) => void;
  onViewProduct?: (product: Product) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ onEditProduct, onViewProduct }) => {
  const hookResult: UseProductsAPIReturn = useProductsAPI(1, 12);
  
  const {
    products,
    loading,
    error,
    pagination,
    page,
    goToPage,
    hasNextPage,
    hasPrevPage,
    refetch,
    deleteProduct,
    totalProducts
  } = hookResult;

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDeleteProduct = async (id: number) => {
    if (!deleteProduct) {
      console.error('❌ deleteProduct function is not available');
      return;
    }

    setDeletingId(id);
    try {
      const success = await deleteProduct(id);
      if (success) {
        console.log(`✅ Produit ${id} supprimé avec succès`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="products-loading">
        <div className="loading-spinner" />
        <p>Chargement des produits...</p>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="products-error">
        <p>❌ Erreur: {error}</p>
        <button onClick={refetch} className="retry-btn">
          <RefreshCw size={16} />
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="product-list-container">
      <div className="product-list-header">
        <div className="header-info">
          <h2>Produits</h2>
          <span className="products-count">
            {totalProducts} produit{totalProducts > 1 ? 's' : ''}
          </span>
        </div>
        
        <button onClick={refetch} className="refresh-btn" disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      {products.length === 0 ? (
        <div className="empty-state">
          <p>Aucun produit trouvé</p>
          <p>Commencez par créer votre premier produit</p>
        </div>
      ) : (
        <>
          <div className="products-grid">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onDelete={handleDeleteProduct}
                onEdit={onEditProduct}
                onView={onViewProduct}
              />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              onPageChange={goToPage}
              hasNext={hasNextPage}
              hasPrev={hasPrevPage}
            />
          )}
        </>
      )}

      {/* Loading overlay pour suppression */}
      {deletingId && (
        <div className="deleting-overlay">
          <div className="deleting-spinner" />
          <p>Suppression en cours...</p>
        </div>
      )}
    </div>
  );
}; 