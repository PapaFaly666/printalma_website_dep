import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { API_CONFIG } from '../config/api';
import { VendorProduct, ProductFilters, ProductStats, AdminValidationResponse, ValidationResponse } from '../types/admin-validation';

interface UseAdminValidationProps {
  filters?: ProductFilters;
}

export const useAdminValidation = ({ filters }: UseAdminValidationProps = {}) => {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [useMockData, setUseMockData] = useState(false);
  const { isAuthenticated, isAdmin } = useAuth();

  // Fonction pour charger les données mockées
  const loadMockData = async () => {
    console.log('🚧 Utilisation des données mockées');

    // Simuler un délai de réseau
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockProducts: VendorProduct[] = [
      {
        id: 138,
        vendorName: "T-shirt Personnalisé Famille",
        vendorDescription: "T-shirt blanc avec photos de famille personnalisées",
        vendorPrice: 12000,
        vendorStock: 50,
        status: "PENDING",
        isValidated: false,
        postValidationAction: "AUTO_PUBLISH",
        designCloudinaryUrl: null,
        isWizardProduct: true,
        productType: "WIZARD",
        hasDesign: false,
        adminValidated: false,
        adminProductName: "T-shirt Blanc Classique",
        baseProduct: {
          id: 34,
          name: "T-shirt Blanc Classique"
        },
        vendorImages: [
          {
            id: 45,
            imageType: "base",
            cloudinaryUrl: "https://res.cloudinary.com/demo/image/upload/family-tshirt-white.jpg",
            colorName: "Blanc",
            colorCode: "#FFFFFF"
          },
          {
            id: 46,
            imageType: "detail",
            cloudinaryUrl: "https://res.cloudinary.com/demo/image/upload/family-tshirt-detail.jpg",
            colorName: "Blanc",
            colorCode: "#FFFFFF"
          }
        ],
        vendor: {
          id: 7,
          firstName: "John",
          lastName: "Vendeur",
          email: "john@vendor.com",
          shop_name: "Ma Boutique Photo"
        },
        createdAt: "2024-09-15T10:30:00.000Z",
        updatedAt: "2024-09-15T10:30:00.000Z"
      },
      {
        id: 139,
        vendorName: "Polo Design Africain",
        vendorDescription: "Polo avec design traditionnel africain",
        vendorPrice: 15000,
        vendorStock: 30,
        status: "PENDING",
        isValidated: false,
        postValidationAction: "AUTO_PUBLISH",
        designCloudinaryUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        isWizardProduct: false,
        productType: "TRADITIONAL",
        hasDesign: true,
        adminValidated: null, // Produits traditionnels = null (pas concernés par validation admin)
        adminProductName: "Polo",
        baseProduct: {
          id: 12,
          name: "Polo"
        },
        vendor: {
          id: 8,
          firstName: "Jane",
          lastName: "Designeuse",
          email: "jane@designer.com",
          shop_name: "Afro Designs"
        },
        createdAt: "2024-09-14T14:20:00.000Z",
        updatedAt: "2024-09-14T14:20:00.000Z"
      },
      {
        id: 140,
        vendorName: "Mug Photo Souvenir",
        vendorDescription: "Mug blanc avec photo personnalisée de voyage",
        vendorPrice: 8000,
        vendorStock: 100,
        status: "PENDING",
        isValidated: false,
        postValidationAction: "TO_DRAFT",
        designCloudinaryUrl: null,
        isWizardProduct: true,
        productType: "WIZARD",
        hasDesign: false,
        adminValidated: false,
        adminProductName: "Mug Blanc Standard",
        baseProduct: {
          id: 56,
          name: "Mug Blanc Standard"
        },
        vendorImages: [
          {
            id: 47,
            imageType: "base",
            cloudinaryUrl: "https://res.cloudinary.com/demo/image/upload/mug-photo-travel.jpg",
            colorName: "Blanc",
            colorCode: "#FFFFFF"
          }
        ],
        vendor: {
          id: 9,
          firstName: "Marie",
          lastName: "Photographe",
          email: "marie@photo.com",
          shop_name: "Souvenirs Photo"
        },
        createdAt: "2024-09-16T08:15:00.000Z",
        updatedAt: "2024-09-16T08:15:00.000Z"
      }
    ];

    // Appliquer les filtres
    let filteredProducts = mockProducts;

    if (filters?.productType && filters.productType !== 'ALL') {
      filteredProducts = filteredProducts.filter(p =>
        filters.productType === 'WIZARD' ? p.isWizardProduct : !p.isWizardProduct
      );
    }

    if (filters?.vendor) {
      filteredProducts = filteredProducts.filter(p =>
        `${p.vendor.firstName} ${p.vendor.lastName}`.toLowerCase().includes(filters.vendor!.toLowerCase()) ||
        (p.vendor.shop_name && p.vendor.shop_name.toLowerCase().includes(filters.vendor!.toLowerCase()))
      );
    }

    const mockStats = {
      pending: mockProducts.length,
      validated: 15,
      rejected: 3,
      total: mockProducts.length + 15 + 3,
      wizardProducts: mockProducts.filter(p => p.isWizardProduct).length,
      traditionalProducts: mockProducts.filter(p => !p.isWizardProduct).length
    };

    return { products: filteredProducts, stats: mockStats };
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ TENTATIVE DE RÉCUPÉRATION DES VRAIES DONNÉES BACKEND
      const queryParams = new URLSearchParams();
      if (filters?.productType && filters.productType !== 'ALL') {
        queryParams.append('productType', filters.productType);
      }
      if (filters?.vendor) {
        queryParams.append('vendor', filters.vendor);
      }
      if (filters?.status) {
        queryParams.append('status', filters.status);
      }

      const url = `${API_CONFIG.BASE_URL}/admin/products/validation?${queryParams}`;
      console.log('🔄 Tentative de récupération depuis:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        // ✅ BACKEND DISPONIBLE - Utiliser les vraies données
        console.log('✅ Backend disponible - Utilisation des vraies données');
        setUseMockData(false);

        const data: AdminValidationResponse = await response.json();

        if (data.success) {
          setProducts(data.data.products || []);
          setStats(data.data.stats || null);
        } else {
          throw new Error(data.message || 'Erreur lors du chargement des produits');
        }
      } else if (response.status === 404) {
        // 🚧 ENDPOINT NON DISPONIBLE - Basculer vers les données mockées
        console.log('🚧 Endpoint non disponible - Bascule vers les données mockées');
        setUseMockData(true);

        const mockData = await loadMockData();
        setProducts(mockData.products);
        setStats(mockData.stats);
      } else {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

    } catch (err) {
      // 🚧 ERREUR RÉSEAU - Basculer vers les données mockées
      console.log('🚧 Erreur réseau - Bascule vers les données mockées:', err);
      setUseMockData(true);

      try {
        const mockData = await loadMockData();
        setProducts(mockData.products);
        setStats(mockData.stats);
        setError(null); // Pas d'erreur en mode mock
      } catch (mockErr) {
        setError('Erreur lors du chargement des données');
        console.error('Erreur même en mode mock:', mockErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const validateProduct = async (productId: number, approved: boolean, rejectionReason?: string) => {
    try {
      if (!useMockData) {
        // ✅ TENTATIVE DE VALIDATION VIA BACKEND
        const url = `${API_CONFIG.BASE_URL}/admin/products/${productId}/validate`;
        console.log(`🔄 Tentative de validation via backend - Produit ${productId}: ${approved ? 'APPROUVÉ' : 'REJETÉ'}`);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            approved,
            rejectionReason
          })
        });

        if (response.ok) {
          // ✅ VALIDATION BACKEND RÉUSSIE
          const data: ValidationResponse = await response.json();

          if (data.success) {
            // Supprimer le produit de la liste
            setProducts(prev => prev.filter(p => p.id !== productId));

            // Mettre à jour les statistiques
            if (stats) {
              const newStats = { ...stats };
              newStats.pending = Math.max(0, newStats.pending - 1);
              if (approved) {
                newStats.validated += 1;
              } else {
                newStats.rejected += 1;
              }
              setStats(newStats);
            }

            // Afficher un message de succès
            const action = approved ? 'approuvé' : 'rejeté';
            alert(`✅ Produit ${action} avec succès!`);

            return data.data;
          } else {
            throw new Error(data.message || 'Erreur lors de la validation');
          }
        } else {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
      } else {
        // 🚧 VALIDATION MOCKÉE
        console.log(`🚧 Validation mockée - Produit ${productId}: ${approved ? 'APPROUVÉ' : 'REJETÉ'}`, { rejectionReason });

        // Simuler un délai de réseau
        await new Promise(resolve => setTimeout(resolve, 500));

        // Supprimer le produit de la liste (ou le mettre à jour)
        setProducts(prev => prev.filter(p => p.id !== productId));

        // Mettre à jour les statistiques
        if (stats) {
          const newStats = { ...stats };
          newStats.pending = Math.max(0, newStats.pending - 1);
          if (approved) {
            newStats.validated += 1;
          } else {
            newStats.rejected += 1;
          }
          setStats(newStats);
        }

        // Afficher un message de succès
        const action = approved ? 'approuvé' : 'rejeté';
        alert(`✅ Produit ${action} avec succès! (Mode démonstration)`);

        return {
          productId,
          status: approved ? 'APPROVED' : 'REJECTED',
          action: approved ? 'AUTO_PUBLISH' : 'DRAFT'
        };
      }

    } catch (err) {
      console.error('Error validating product:', err);
      const mode = useMockData ? '(mode démonstration)' : '';
      alert(`❌ Erreur lors de la validation ${mode}`);
      throw err;
    }
  };

  // Fonction pour valider plusieurs produits en lot
  const validateMultipleProducts = async (productIds: number[], approved: boolean, rejectionReason?: string) => {
    try {
      const url = `${API_CONFIG.BASE_URL}/admin/validate-products-batch`;

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          productIds,
          approved,
          rejectionReason
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Supprimer les produits de la liste
        setProducts(prev => prev.filter(p => !productIds.includes(p.id)));

        // Mettre à jour les statistiques
        if (stats) {
          const newStats = { ...stats };
          newStats.pending = Math.max(0, newStats.pending - productIds.length);
          if (approved) {
            newStats.validated += productIds.length;
          } else {
            newStats.rejected += productIds.length;
          }
          setStats(newStats);
        }

        const action = approved ? 'approuvés' : 'rejetés';
        alert(`${productIds.length} produits ${action} avec succès!`);

        return data.data;
      } else {
        throw new Error(data.message || 'Erreur lors de la validation en lot');
      }
    } catch (err) {
      console.error('Error validating multiple products:', err);
      alert('Erreur lors de la validation en lot');
      throw err;
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin()) {
      fetchProducts();
    }
  }, [filters, isAuthenticated, isAdmin]);

  return {
    products,
    loading,
    error,
    stats,
    useMockData,
    validateProduct,
    validateMultipleProducts,
    refetch: fetchProducts
  };
};