import { useState, useEffect, useCallback } from 'react';
import { vendorProductService, VendorProduct, VendorProductsResponse } from '../services/vendorProductService';
import { toast } from 'sonner';
import React from 'react';

interface UseVendorProductsOptions {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  autoFetch?: boolean;
}

export const useVendorProducts = (options: UseVendorProductsOptions = {}) => {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12
  });
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    pendingProducts: 0
  });

  const {
    page = 1,
    limit = 12,
    status,
    search,
    sortBy = 'createdAt',
    sortOrder = 'DESC',
    autoFetch = true
  } = options;

  // Fetch vendor products
  const fetchProducts = useCallback(async (params?: typeof options) => {
    try {
      setLoading(true);
      setError(null);

      const fetchParams = {
        limit: params?.limit ?? limit,
        offset: ((params?.page ?? page) - 1) * (params?.limit ?? limit),
        status: (params?.status ?? status) as "all" | "pending" | "published" | "draft",
        search: params?.search ?? search,
      };

      const response: VendorProductsResponse = await vendorProductService.getVendorProducts(fetchParams);

      // Validate response structure
      if (!response || typeof response !== 'object') {
        throw new Error('Réponse API invalide');
      }

      setProducts(Array.isArray(response.products) ? response.products : []);
      
      // Convert API pagination format to UI format
      const apiPagination = response.pagination;
      if (apiPagination && 'total' in apiPagination) {
        setPagination({
          currentPage: Math.floor(apiPagination.offset / apiPagination.limit) + 1,
          totalPages: Math.ceil(apiPagination.total / apiPagination.limit),
          totalItems: apiPagination.total,
          itemsPerPage: apiPagination.limit
        });
      } else {
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 12
        });
      }
      
      setStats({
        totalProducts: response.healthMetrics?.totalProducts || 0,
        activeProducts: response.healthMetrics?.healthyProducts || 0,
        inactiveProducts: response.healthMetrics?.unhealthyProducts || 0,
        pendingProducts: 0
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des produits';
      setError(errorMessage);
      console.error('❌ Error fetching vendor products:', err);
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, search, sortBy, sortOrder]);

  // Update a vendor product
  const updateProduct = useCallback(async (id: number, updates: {
    vendorName?: string;
    vendorDescription?: string;
    vendorPrice?: number;
    vendorStock?: number;
    status?: 'PUBLISHED' | 'DRAFT' | 'PENDING';
  }) => {
    try {
      const updatedProduct = await vendorProductService.updateVendorProduct(id, updates);
      
      // Update the product in the local state
      setProducts(prev => prev.map(product => 
        product.id === id ? updatedProduct : product
      ));

      toast.success('Produit mis à jour avec succès');
      
      return updatedProduct;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      console.error('❌ Error updating vendor product:', err);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Delete a vendor product
  const deleteProduct = useCallback(async (id: number) => {
    try {
      await vendorProductService.deleteVendorProduct(id);
      
      // Remove the product from local state
      setProducts(prev => prev.filter(product => product.id !== id));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalProducts: prev.totalProducts - 1
      }));

      toast.success('Produit supprimé avec succès');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      console.error('❌ Error deleting vendor product:', err);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Get a single vendor product
  const getProduct = useCallback(async (id: number): Promise<VendorProduct | null> => {
    try {
      const product = await vendorProductService.getVendorProduct(id);
      
      return product;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement du produit';
      console.error('❌ Error fetching vendor product:', err);
      toast.error(errorMessage);
      return null;
    }
  }, []);

  // Refresh products (refetch with current params)
  const refresh = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Change page
  const changePage = useCallback((newPage: number) => {
    fetchProducts({ page: newPage });
  }, [fetchProducts]);

  // Change filters
  const changeFilters = useCallback((filters: {
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) => {
    fetchProducts({ page: 1, ...filters });
  }, [fetchProducts]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [autoFetch, fetchProducts]);

  // Transform vendor products to match admin product interface for UI compatibility
  const transformedProducts = React.useMemo(() => {
    // Don't transform if still loading or no products
    if (loading || !Array.isArray(products) || products.length === 0) {
      return [];
    }

    return products.map(vendorProduct => {
      // 🆕 ARCHITECTURE V2 : Préserver la structure complète
      const transformed: any = {
        id: vendorProduct.id,
        name: vendorProduct.vendorName || vendorProduct.originalAdminName || 'Produit sans nom',
        vendorName: vendorProduct.vendorName,
        originalAdminName: vendorProduct.originalAdminName,
        description: vendorProduct.description,
        price: vendorProduct.price,
        stock: vendorProduct.stock,
        status: vendorProduct.status,
        createdAt: vendorProduct.createdAt || new Date().toISOString(),
        updatedAt: vendorProduct.updatedAt || new Date().toISOString(),
        
        // 🎯 ESSENTIEL : Préserver adminProduct pour ModernVendorProductCard
        adminProduct: vendorProduct.adminProduct || {
          id: 0,
          name: vendorProduct.originalAdminName || vendorProduct.vendorName || 'Produit admin',
          description: vendorProduct.description,
          price: vendorProduct.price,
          colorVariations: [],
          sizes: []
        },
        
        // 🎯 ESSENTIEL : Préserver designApplication pour ModernVendorProductCard  
        designApplication: vendorProduct.designApplication || {
          hasDesign: false,
          positioning: 'CENTER',
          scale: 0.6,
          mode: 'PRESERVED'
        },
        
        // 🎯 ESSENTIEL : Préserver images pour ModernVendorProductCard
        images: vendorProduct.images || {
          adminReferences: [],
          total: 0,
          primaryImageUrl: null,
          validation: {
            isHealthy: true,
            totalIssuesDetected: 0
          }
        },
        
        // 🎯 ESSENTIEL : Préserver vendor pour ModernVendorProductCard
        vendor: vendorProduct.vendor || {
          id: 0,
          fullName: 'Vendeur',
          email: 'vendor@example.com'
        },
        
        // 🎯 ESSENTIEL : Préserver selectedSizes et selectedColors
        selectedSizes: vendorProduct.selectedSizes || [],
        selectedColors: vendorProduct.selectedColors || [],
        
        // 🔄 Compatibilité legacy : colorVariations depuis adminProduct
        colorVariations: vendorProduct.adminProduct?.colorVariations || [],
        
        // 🔄 Compatibilité : Category et autres champs requis
        category: { id: 0, name: 'Non catégorisé' },
        categoryId: 0,
        featured: false,
        colors: vendorProduct.selectedColors || [],
        views: 0,
        sizes: vendorProduct.selectedSizes || [],
        
        // 🐛 Debug data pour développement
        ...(process.env.NODE_ENV === 'development' && {
          _debug: {
            rawStatus: vendorProduct.status,
            rawAdminProduct: !!vendorProduct.adminProduct,
            rawImages: !!vendorProduct.images,
            rawDesignApplication: !!vendorProduct.designApplication,
            imageCount: vendorProduct.images?.total || 0,
            primaryImageUrl: vendorProduct.images?.primaryImageUrl
          }
        })
      };

      return transformed;
    });
  }, [products, loading]);

  return {
    products: transformedProducts,
    rawProducts: products,
    loading,
    error,
    pagination,
    stats,
    
    // Actions
    fetchProducts,
    updateProduct,
    deleteProduct,
    getProduct,
    refresh,
    changePage,
    changeFilters,
    
    // Utilities
    refetch: refresh,
    total: pagination.totalItems
  };
}; 