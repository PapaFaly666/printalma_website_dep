import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import {
  RefreshCw,
  Package,
  Clock,
  CheckCircle,
  Eye,
  Trash2,
  Plus,
  Settings,
  Search,
  X,
  Save
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '../../components/ui/dialog';
import { SimpleProductPreview } from '../../components/vendor/SimpleProductPreview';

// Services et hooks
import { vendorProductService } from '../../services/vendorProductService';
import { vendorProductValidationService } from '../../services/vendorProductValidationService';
import { vendorAccountService } from '../../services/vendorAccountService';
import { API_CONFIG } from '../../config/api';

// 🆕 Interface basée sur la structure de /public/best-sellers et compatible avec SimpleProductPreview
interface VendorProductFromAPI {
  id: number;
  vendorName: string; // ✅ Nom du produit vendeur
  price: number;
  status: string;
  
  bestSeller: {
    isBestSeller: boolean;
    salesCount: number;
    totalRevenue: number;
  };
  
  adminProduct: {
    id: number;
    name: string;
    genre: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE';
    categories: Array<{
      id: number;
      name: string;
    }>;
    colorVariations: Array<{
      id: number;
      name: string;
      colorCode: string;
      images: Array<{
        id: number;
        url: string;
        viewType: string; // ✅ Compatible avec SimpleProductPreview
        delimitations: Array<{
          x: number;
          y: number;
          width: number;
          height: number;
          coordinateType: 'PERCENTAGE' | 'PIXEL';
        }>;
      }>;
    }>;
  };
  
  designApplication: {
    hasDesign: boolean;
    designUrl: string;
    positioning: string; // JSON string avec {x, y, scale, rotation}
    scale: number;
    mode: string;
    isValidated?: boolean; // 🆕 Statut de validation du design
    validationStatus?: 'validated' | 'pending' | 'rejected'; // 🆕 Statut détaillé
  };
  
  designPositions: Array<{
    designId: number;
    position: {
      x: number;
      y: number;
      scale: number;
      rotation: number;
      constraints: {
        minScale: number;
        maxScale: number;
      };
      designWidth: number;  // ✅ VRAIES DIMENSIONS
      designHeight: number; // ✅ VRAIES DIMENSIONS
    };
  }>;
  
  // ✅ AJOUTÉ : Propriété requise par SimpleProductPreview
  designTransforms: Array<{
    id: number;
    designUrl: string;
    transforms: {
      [key: string]: {
        x: number;
        y: number;
        scale: number;
        rotation?: number;
        designWidth?: number;
        designHeight?: number;
        designScale?: number;
        constraints?: any;
      };
    };
  }>;
  
  vendor: {
    id: number;
    fullName: string;
    shop_name: string;
    profile_photo_url: string;
  };
  
  images: {
    adminReferences: Array<{
      colorName: string;
      colorCode: string;
      adminImageUrl: string;
      imageType: string;
    }>;
    total: number;
    primaryImageUrl: string;
  };
  
  selectedSizes: Array<{
    id: number;
    sizeName: string;
  }>;
  
  selectedColors: Array<{
    id: number;
    name: string;
    colorCode: string;
  }>;
  
  designId: number;
  isDelete?: boolean; // Optionnel pour compatibilité

  // 🆕 Informations du design
  design?: {
    id: number;
    name: string;
    description: string;
    category: {
      id: number;
      name: string;
      description?: string;
      slug?: string;
    };
    imageUrl: string;
    tags?: string[];
    isValidated?: boolean;
    validatedAt?: string;
    createdAt: string;
  };
}

export const VendorProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAccountActive, setIsAccountActive] = useState<boolean | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const statusResp = await vendorAccountService.getAccountStatus();
        const active = typeof statusResp?.data?.isActive === 'boolean' ? statusResp.data.isActive : (typeof statusResp?.data?.status === 'boolean' ? statusResp.data.status : true);
        setIsAccountActive(!!active);
      } catch {
        setIsAccountActive(true);
      }
    })();
  }, []);
  
  // États principaux
  const [products, setProducts] = useState<VendorProductFromAPI[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<VendorProductFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationStatuses, setValidationStatuses] = useState<Record<number, {
    isValidated: boolean;
    validationStatus: 'validated' | 'pending' | 'rejected';
  }>>({});
  
  // États pour les filtres et la vue
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  
  // 🆕 Vérifier le statut de validation des designs
  const checkDesignValidationStatuses = async (productList: VendorProductFromAPI[]) => {
    try {
      console.log('🔍 Vérification des statuts de validation des designs...');

      const statusMap: Record<number, { isValidated: boolean; validationStatus: 'validated' | 'pending' | 'rejected' }> = {};
      const productsNeedingValidation: VendorProductFromAPI[] = [];

      // D'abord, utiliser les données déjà présentes dans les produits
      productList.forEach((product) => {
        if (product.designApplication.hasDesign) {
          // Si les données de validation sont déjà présentes dans les produits transformés
          if (product.designApplication.isValidated !== undefined && product.designApplication.validationStatus) {
            statusMap[product.id] = {
              isValidated: product.designApplication.isValidated,
              validationStatus: product.designApplication.validationStatus as 'validated' | 'pending' | 'rejected'
            };
            console.log(`✅ Utilisation données extraites pour produit ${product.id}:`, statusMap[product.id]);
          } else if (product.designId) {
            // Si pas de données de validation, ajouter à la liste pour appel API
            productsNeedingValidation.push(product);
          }
        }
      });

      console.log(`📊 Résumé validation: ${Object.keys(statusMap).length} avec données existantes, ${productsNeedingValidation.length} nécessitent un appel API`);

      // Faire les appels API seulement pour les produits sans données de validation
      if (productsNeedingValidation.length > 0) {
        console.log(`📡 Récupération via API pour ${productsNeedingValidation.length} produits...`);

        const validationPromises = productsNeedingValidation.map(async (product) => {
          try {
            const validationResult = await vendorProductValidationService.checkDesignValidation(product.designId!);
            return {
              productId: product.id,
              ...validationResult
            };
          } catch (error) {
            console.error(`Erreur vérification design ${product.designId}:`, error);
            return {
              productId: product.id,
              isValidated: false,
              status: 'pending' as const,
              message: 'Erreur de vérification'
            };
          }
        });

        const validationResults = await Promise.all(validationPromises);

        validationResults.forEach((result) => {
          if (result) {
            statusMap[result.productId] = {
              isValidated: result.isValidated,
              validationStatus: result.status
            };
          }
        });
      }

      setValidationStatuses(statusMap);
      console.log('✅ Statuts de validation finaux:', statusMap);
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des validations:', error);
    }
  };

  // 🆕 Helper pour extraire le statut de validation depuis les données du produit
  const extractDesignValidationStatus = (product: any) => {
    // Essayer différentes structures possibles
    const sources = [
      product.designValidation,
      product.design?.validation,
      product.design?.validationStatus,
      product.designApplication?.validation,
      product.designApplication?.validationStatus,
      product.design // Le design lui-même pourrait contenir les infos de validation
    ];

    for (const source of sources) {
      if (source && typeof source === 'object') {
        // Chercher les propriétés isValidated/validated et status
        const isValidated = source.isValidated || source.validated || source.isApproved;
        const status = source.status || source.validationStatus || source.approvalStatus;

        if (isValidated !== undefined || status !== undefined) {
          return {
            isValidated: Boolean(isValidated),
            validationStatus: status || (isValidated ? 'validated' : 'pending')
          };
        }
      }
    }

    // Si on a un design mais pas d'info de validation explicite,
    // regarder le statut du produit ou des indices dans les noms de champs
    if (product.design || product.designApplication?.hasDesign) {
      if (product.status === 'PUBLISHED') {
        // Si le produit est publié, on peut supposer que le design est validé
        return { isValidated: true, validationStatus: 'validated' };
      } else if (product.status === 'REJECTED') {
        return { isValidated: false, validationStatus: 'rejected' };
      } else {
        return { isValidated: false, validationStatus: 'pending' };
      }
    }

    return null;
  };

  // 🆕 Charger les produits selon la documentation
  const loadProducts = async () => {
    setLoading(true);
    try {
      console.log('📡 Chargement des produits vendeur avec mockups et designs...');
      
      // ✅ CORRECTION : Utiliser l'endpoint configuré avec authentification par cookies
      const response = await fetch(`${API_CONFIG.BASE_URL}/vendor/products`, {
        method: 'GET',
        credentials: 'include', // Important : inclure les cookies pour l'authentification JWT
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Réponse HTTP:', response.status, response.statusText);

      if (!response.ok) {
        console.warn(`⚠️ Erreur ${response.status} pour /vendor/products, essai avec /public/best-sellers...`);
        
        // Fallback vers l'endpoint public si l'authentification échoue
        const fallbackResponse = await fetch(`${API_CONFIG.BASE_URL}/public/best-sellers?limit=20`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!fallbackResponse.ok) {
          throw new Error(`HTTP error! status: ${fallbackResponse.status}`);
        }

        const fallbackResult = await fallbackResponse.json();
        console.log('📋 Réponse API fallback:', fallbackResult);
        
        let apiProducts = [];
        
        if (fallbackResult.success && fallbackResult.data && fallbackResult.data.bestSellers) {
          apiProducts = fallbackResult.data.bestSellers;
        } else if (fallbackResult.data && Array.isArray(fallbackResult.data)) {
          apiProducts = fallbackResult.data;
        } else if (Array.isArray(fallbackResult)) {
          apiProducts = fallbackResult;
        } else {
          console.warn('⚠️ Structure de réponse inattendue:', fallbackResult);
          apiProducts = [];
        }
        
        console.log('✅ Produits chargés (fallback):', apiProducts.length);
        
        setProducts(apiProducts);
        setFilteredProducts(apiProducts);
        return;
      }

      const result = await response.json();
      console.log('📋 Réponse API produits vendeur:', result);
      
      // ✅ CORRECTION : Adapter le parsing selon la structure de /vendor/products
      let apiProducts = [];
      
      if (result.success && result.data && Array.isArray(result.data)) {
        // Format de /vendor/products avec data.products
        apiProducts = result.data;
      } else if (result.data && result.data.products && Array.isArray(result.data.products)) {
        // Format avec data.products
        apiProducts = result.data.products;
      } else if (Array.isArray(result)) {
        // Format tableau direct
        apiProducts = result;
      } else if (result.products && Array.isArray(result.products)) {
        // Format avec products à la racine
        apiProducts = result.products;
      } else {
        console.warn('⚠️ Structure de réponse inattendue pour /vendor/products:', result);
        apiProducts = [];
      }
      
      console.log('✅ Produits vendeur chargés avec mockups:', apiProducts.length);


      // ✅ TRANSFORMATION : Adapter les données pour l'affichage avec mockups
      const transformedProducts = apiProducts.map((product: any, index: number) => {
        // 🔍 Extraire le statut de validation avec la fonction helper
        const designValidationStatus = extractDesignValidationStatus(product);

        // 🔍 DEBUG: Vérifier directement les catégories dans adminProduct
        console.log(`🔍 DEBUG - Produit ${product.id}:`);
        console.log(`🔍 DEBUG - adminProduct.categories:`, product.adminProduct?.categories);

        if (product.adminProduct?.categories && Array.isArray(product.adminProduct.categories)) {
          console.log(`🎯 CATÉGORIES TROUVÉES: ${product.adminProduct.categories.length} catégories`);
          console.log(`🎯 PREMIÈRE CATÉGORIE:`, product.adminProduct.categories[0]);
          if (product.adminProduct.categories[0]?.name) {
            console.log(`🎯 NOM PREMIÈRE CATÉGORIE: "${product.adminProduct.categories[0].name}"`);
          }
        } else {
          console.log(`❌ PAS DE CATÉGORIES - adminProduct.categories:`, product.adminProduct?.categories);
        }

        return {
          id: product.id,
          vendorName: product.vendorName || product.name || 'Produit Vendeur',
          price: product.vendorPrice || product.price || 0,
          status: product.status || 'DRAFT',
          
          bestSeller: {
            isBestSeller: product.bestSeller?.isBestSeller || false,
            salesCount: product.bestSeller?.salesCount || 0,
            totalRevenue: product.bestSeller?.totalRevenue || 0,
          },
          
          adminProduct: {
            id: product.adminProduct?.id || product.baseProductId || product.id,
            name: product.adminProduct?.name || product.name || 'Produit Admin',
            genre: product.adminProduct?.genre || 'UNISEXE',
            categories: product.adminProduct?.categories || [],
            colorVariations: product.adminProduct?.colorVariations || product.colorVariations || []
          },
          
          designApplication: {
            hasDesign: product.designApplication?.hasDesign || !!product.designApplication?.designUrl,
            designUrl: product.designApplication?.designUrl || product.designUrl || '',
            positioning: product.designApplication?.positioning || 'CENTER',
            scale: product.designApplication?.scale || 0.6,
            mode: product.designApplication?.mode || 'PRESERVED',
            // 🆕 Inclure les données de validation extraites par la fonction helper
            isValidated: designValidationStatus?.isValidated || false,
            validationStatus: designValidationStatus?.validationStatus || 'pending'
          },
          
          designPositions: product.designPositions || [{
            designId: product.designId || 0,
            position: {
              x: 0.5,
              y: 0.5,
              scale: 0.6,
              rotation: 0,
              constraints: {
                minScale: 0.1,
                maxScale: 2.0
              },
              designWidth: 200,
              designHeight: 200
            }
          }],
          
          designTransforms: product.designTransforms || [{
            id: product.designId || 0,
            designUrl: product.designApplication?.designUrl || product.designUrl || '',
            transforms: {
              'default': {
                x: 0.5,
                y: 0.5,
                scale: 0.6,
                rotation: 0,
                designWidth: 200,
                designHeight: 200
              }
            }
          }],
          
          vendor: {
            id: product.vendor?.id || 0,
            fullName: product.vendor?.fullName || 'Vendeur',
            shop_name: product.vendor?.shop_name || '',
            profile_photo_url: product.vendor?.profile_photo_url || ''
          },
          
          images: {
            adminReferences: product.images?.adminReferences || [],
            total: product.images?.total || 0,
            primaryImageUrl: product.images?.primaryImageUrl || product.adminProduct?.colorVariations?.[0]?.images?.[0]?.url || ''
          },
          
          selectedSizes: product.selectedSizes || [],
          selectedColors: product.selectedColors || [],
          designId: product.designId || 0,
          isDelete: product.isDelete || false,

          // 🆕 Inclure les informations du design
          design: product.design ? {
            id: product.design.id,
            name: product.design.name,
            description: product.design.description || '',
            category: product.design.category || {
              id: 0,
              name: 'Non définie'
            },
            imageUrl: product.design.imageUrl || '',
            tags: product.design.tags || [],
            isValidated: product.design.isValidated || false,
            validatedAt: product.design.validatedAt || '',
            createdAt: product.design.createdAt || ''
          } : undefined
        };
      });
      
      
      setProducts(transformedProducts);
      setFilteredProducts(transformedProducts);

      // 🆕 Vérifier les statuts de validation des designs
      if (transformedProducts.length > 0) {
        await checkDesignValidationStatuses(transformedProducts);
      }


    } catch (err) {
      setError('Erreur lors du chargement des produits');
      console.error('❌ Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Charger les produits au montage
  useEffect(() => {
    loadProducts();
  }, []);

  // Filtrer les produits
  useEffect(() => {
    let filtered = [...products];
    
    // Filtrer par recherche
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.adminProduct.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrer par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(product => product.status === statusFilter);
    }
    
    setFilteredProducts(filtered);
  }, [products, searchTerm, statusFilter]);

  // Filtrage des produits non supprimés depuis la liste filtrée
  const visibleProducts = filteredProducts.filter(p => !p.isDelete);

  // Calculer les statistiques
  const nonDeletedProducts = products.filter(p => !p.isDelete);

  const stats = {
    total: nonDeletedProducts.length,
    published: nonDeletedProducts.filter(p => p.status === 'PUBLISHED').length,
    pending: nonDeletedProducts.filter(p => p.status === 'PENDING').length,
    draft: nonDeletedProducts.filter(p => p.status === 'DRAFT').length,
    rejected: nonDeletedProducts.filter(p => p.status === 'REJECTED').length
  };

  // 🆕 Gérer l'aperçu avec le nouveau composant
  const handlePreview = (productId: number) => {
    setSelectedProductId(productId);
    setIsPreviewOpen(true);
  };


  const handleDeleteClick = (productId: number) => {
    setProductToDelete(productId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await vendorProductService.deleteVendorProduct(productToDelete);
      setProducts(products => products.filter(p => p.id !== productToDelete));
      toast.success('Produit supprimé !');
    } catch (err: any) {
      toast.error('Erreur : ' + (err.message || 'Suppression impossible'));
    } finally {
      setDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  // 🆕 Nouvelle fonction de publication basée sur pub.md
  const handlePublish = async (productId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir publier ce produit ?')) {
      return;
    }

    try {
      console.log('🚀 Publication du produit:', productId);

      // 🆕 Utiliser le nouveau service de validation
      const result = await vendorProductValidationService.setProductStatus(productId, false); // false = publication directe

      if (result.success) {
        if (result.status === 'PUBLISHED') {
          toast.success('✅ Produit publié avec succès !');
        } else if (result.status === 'PENDING') {
          toast.info('📝 Produit en attente - Design non validé par l\'admin');
        } else if (result.status === 'DRAFT') {
          toast.info('📄 Produit mis en brouillon - Prêt à publier');
        }

        // Afficher les détails du statut
        if (result.message) {
          setTimeout(() => {
            toast.info(result.message);
          }, 1000);
        }

        loadProducts(); // Recharger la liste
      } else {
        throw new Error(result.message || 'Erreur lors de la publication');
      }
    } catch (error) {
      console.error('Erreur lors de la publication:', error);
      toast.error('Erreur lors de la publication du produit');
    }
  };

  // 🆕 Fonction pour publier directement (remplace l'ancien publishDraft)
  const handlePublishNow = async (productId: number) => {
    try {
      console.log('🚀 Publication directe du produit:', productId);

      // Utiliser la publication directe pour les designs validés
      const result = await vendorProductValidationService.setProductStatus(productId, false); // false = publication directe

      if (result.success) {
        if (result.status === 'PUBLISHED') {
          toast.success('🎉 Produit publié immédiatement !');
        } else if (result.status === 'PENDING') {
          toast.info('📝 Produit en attente - Design non validé par l\'admin');
        }
        loadProducts(); // Recharger la liste
      } else {
        throw new Error(result.message || 'Erreur lors de la publication');
      }
    } catch (error) {
      console.error('Erreur lors de la publication directe:', error);
      toast.error('Erreur lors de la publication');
    }
  };

  // 🆕 Fonction pour mettre en brouillon
  const handleSetToDraft = async (productId: number) => {
    try {
      console.log('📝 Mise en brouillon du produit:', productId);

      const result = await vendorProductValidationService.setProductStatus(productId, true); // true = brouillon

      if (result.success) {
        toast.success('📝 Produit mis en brouillon !');
        loadProducts(); // Recharger la liste
      } else {
        throw new Error(result.message || 'Erreur lors de la mise en brouillon');
      }
    } catch (error) {
      console.error('Erreur lors de la mise en brouillon:', error);
      toast.error('Erreur lors de la mise en brouillon');
    }
  };

  // 🆕 Helper pour déterminer si un produit peut être publié directement
  const canPublishNow = (product: VendorProductFromAPI): boolean => {
    // Un produit peut être publié directement si :
    // 1. Il a un design ET
    // 2. Le design est validé
    if (!product.designApplication.hasDesign) {
      return false;
    }

    const validationStatus = validationStatuses[product.id];
    return validationStatus?.isValidated === true && validationStatus?.validationStatus === 'validated';
  };

  // 🆕 Helper pour déterminer si un produit PENDING peut être republié
  const canRepublishPendingProduct = (product: VendorProductFromAPI): boolean => {
    // Pour les produits PENDING (publiés directement mais design non validé),
    // le bouton Publier doit être désactivé jusqu'à validation admin
    if (product.status === 'PENDING' && product.designApplication.hasDesign) {
      const validationStatus = validationStatuses[product.id];
      // Seulement si le design est maintenant validé
      return validationStatus?.isValidated === true && validationStatus?.validationStatus === 'validated';
    }

    // Pour les autres cas (produits sans design), on peut publier
    return !product.designApplication.hasDesign;
  };

  // 🆕 Obtenir le message d'info pour un produit selon son statut de validation
  const getPublishMessage = (product: VendorProductFromAPI): string => {
    if (!product.designApplication.hasDesign) {
      return 'Ce produit n\'a pas de design';
    }

    const validationStatus = validationStatuses[product.id];
    if (!validationStatus) {
      return 'Vérification du design en cours...';
    }

    switch (validationStatus.validationStatus) {
      case 'validated':
        return 'Design validé - Publier maintenant';
      case 'pending':
        return 'Design en attente de validation par l\'admin';
      case 'rejected':
        return 'Design rejeté par l\'admin';
      default:
        return 'Statut de validation inconnu';
    }
  };


  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'PUBLISHED': 
        return 'bg-gray-900 text-white border-gray-900';
      case 'PENDING': 
        return 'bg-gray-100 text-gray-900 border-gray-300';
      case 'DRAFT': 
        return 'bg-white text-gray-900 border-gray-900';
      case 'REJECTED': 
        return 'bg-gray-600 text-white border-gray-600';
      default: 
        return 'bg-white text-gray-900 border-gray-900';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'Publié';
      case 'PENDING': return 'En attente';
      case 'DRAFT': return 'Brouillon';
      case 'REJECTED': return 'Rejeté';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span>Chargement des produits...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <h2 className="text-lg font-semibold text-red-800 mb-2">Erreur</h2>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadProducts} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ✅ Affichage du bandeau d'avertissement si compte désactivé (mais accès complet maintenu)
  const renderDeactivatedBanner = () => {
    if (isAccountActive === false) {
      return (
        <Card className="border-orange-300 bg-orange-50 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Package className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-orange-800">Compte désactivé</h3>
                  <p className="text-orange-700 text-sm">
                    Vos produits sont masqués aux clients mais vous gardez l'accès complet : visualisation, ajout, modification.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/vendeur/account')}
                className="bg-orange-600 hover:bg-orange-700 text-white"
                size="sm"
              >
                Réactiver mon compte
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Bandeau d'avertissement si compte désactivé */}
        {renderDeactivatedBanner()}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes Produits</h1>
            <p className="text-gray-600 mt-1">
              Gérez vos produits avec designs appliqués
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/vendeur/create-product')}
              className={isAccountActive === false ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer vos produits {isAccountActive === false && '(masqué aux clients)'}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/vendeur/sell-design')}
              className="border-gray-300"
            >
              <Package className="w-4 h-4 mr-2" />
              Ancienne méthode
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Publiés</p>
                  <p className="text-2xl font-bold text-green-600">{stats.published}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En attente</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Brouillons</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
                </div>
                <Settings className="w-5 h-5 text-gray-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejetés</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <X className="w-5 h-5 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et contrôles */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-4 items-center flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher un produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="PUBLISHED">Publié</option>
                  <option value="PENDING">En attente</option>
                  <option value="DRAFT">Brouillon</option>
                  <option value="REJECTED">Rejeté</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadProducts}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des produits */}
        {visibleProducts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun produit trouvé
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucun produit ne correspond à vos critères de recherche'
                  : 'Vous n\'avez pas encore créé de produit'
                }
              </p>
              <Button onClick={() => navigate('/vendeur/sell-design')}>
                <Plus className="w-4 h-4 mr-2" />
                Créer un produit
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleProducts.map((product) => {
              return (
                <Card key={product.id} className="group border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-0">
                  {/* Aperçu du produit avec design */}
                    <div className="relative">
                    <div className="aspect-square">
                        <SimpleProductPreview
                          product={product}
                          showColorSlider={true}
                          onColorChange={(colorId) => {
                            console.log(`🎨 Couleur changée pour produit ${product.id}: ${colorId}`);
                          }}
                        />
                      </div>
                      
                      {/* Badge de statut en haut à droite */}
                      <div className="absolute top-3 right-3 z-10">
                        <Badge 
                          variant="outline"
                          className={`font-medium text-xs ${getStatusBadgeStyle(product.status)}`}
                        >
                          {getStatusText(product.status)}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Informations du produit */}
                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1">
                          {product.vendorName}
                        </h3>
                        <div className="space-y-1 mb-3">
                          <p className="text-sm text-gray-500 font-medium">
                            Catégorie: {(() => {
                              console.log(`🔍 DEBUG - DISPLAY - Produit ${product.id}:`, {
                                hasAdminProduct: !!product.adminProduct,
                                hasCategories: !!(product.adminProduct?.categories),
                                categoriesArray: product.adminProduct?.categories,
                                firstCategory: product.adminProduct?.categories?.[0],
                                categoryName: product.adminProduct?.categories?.[0]?.name,
                                finalValue: product.adminProduct?.categories?.[0]?.name || 'Non définie'
                              });
                              return product.adminProduct?.categories?.[0]?.name || 'Non définie';
                            })()}
                          </p>
                          {(product as any).design && (
                            <p className="text-sm text-blue-600 font-medium">
                              {(() => {
                                console.log('🔍 DEBUG - Structure design:', {
                                  design: (product as any).design,
                                  designCategory: (product as any).design.category,
                                  designCategoryName: (product as any).design.category?.name
                                });
                                return `Design: ${(product as any).design.category?.name || 'Non définie'}`;
                              })()}
                            </p>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                          {product.adminProduct.name}
                        </p>
                      </div>
                      
                      {/* Prix et indicateurs */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-xl font-bold text-gray-900">
                          {product.price.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FCFA
                        </div>
                      <div className="flex items-center gap-2">
                          {/* 🆕 Badge de validation du design */}
                          {product.designApplication.hasDesign && validationStatuses[product.id] && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                validationStatuses[product.id].validationStatus === 'validated'
                                  ? 'border-green-400 text-green-700 bg-green-50'
                                  : validationStatuses[product.id].validationStatus === 'rejected'
                                  ? 'border-red-400 text-red-700 bg-red-50'
                                  : 'border-amber-400 text-amber-700 bg-amber-50'
                              }`}
                            >
                              {validationStatuses[product.id].validationStatus === 'validated' && '✅ Validé'}
                              {validationStatuses[product.id].validationStatus === 'pending' && '⏳ En attente'}
                              {validationStatuses[product.id].validationStatus === 'rejected' && '❌ Rejeté'}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Boutons d'action selon le nouveau système pub.md */}
                      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                        {/* Actions spécifiques selon le statut */}
                        {product.status === 'DRAFT' && product.designApplication.hasDesign && (
                          <div className="flex-1 flex flex-col gap-1">
                            <Button
                              size="sm"
                              onClick={() => handlePublishNow(product.id)}
                              disabled={!canPublishNow(product)}
                              className={`w-full font-medium ${
                                canPublishNow(product)
                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {canPublishNow(product) ? 'Publier maintenant' : 'En attente validation'}
                            </Button>
                            <span className={`text-xs text-center px-2 ${
                              canPublishNow(product) ? 'text-green-600' : 'text-amber-600'
                            }`}>
                              {getPublishMessage(product)}
                            </span>
                          </div>
                        )}

                        {product.status === 'PUBLISHED' && (
                          <Button
                            size="sm"
                            onClick={() => handleSetToDraft(product.id)}
                            variant="outline"
                            className="flex-1 border-gray-400 text-gray-700 hover:bg-gray-50 font-medium"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Mettre en brouillon
                          </Button>
                        )}

                        {(product.status === 'PENDING' || (!product.designApplication.hasDesign)) && (
                          <div className="flex-1 flex flex-col gap-1">
                            <Button
                              size="sm"
                              onClick={() => handlePublish(product.id)}
                              disabled={product.status === 'PENDING' && !canRepublishPendingProduct(product)}
                              className={`w-full font-medium ${
                                product.status === 'PENDING' && !canRepublishPendingProduct(product)
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-gray-900 hover:bg-gray-800 text-white'
                              }`}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {product.status === 'PENDING' && !canRepublishPendingProduct(product)
                                ? 'En attente de validation'
                                : (product.designApplication.hasDesign ? 'Publier' : 'Publier (sans design)')
                              }
                            </Button>
                            {product.status === 'PENDING' && product.designApplication.hasDesign && (
                              <span className={`text-xs text-center px-2 ${
                                canRepublishPendingProduct(product) ? 'text-green-600' : 'text-amber-600'
                              }`}>
                                {canRepublishPendingProduct(product)
                                  ? 'Design validé - Peut republier'
                                  : 'Design en attente de validation admin'
                                }
                              </span>
                            )}
                          </div>
                        )}

                        {/* Boutons standards */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreview(product.id)}
                          className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Aperçu
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteClick(product.id)}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-red-600 hover:border-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}

        {/* Modal d'aperçu */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">Aperçu du produit</DialogTitle>
            </DialogHeader>
            
            {selectedProductId && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Aperçu visuel */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <SimpleProductPreview
                    product={products.find(p => p.id === selectedProductId)!}
                    showColorSlider={true}
                    onColorChange={(colorId) => {
                      console.log(`🎨 Couleur changée dans modal pour produit ${selectedProductId}: ${colorId}`);
                    }}
                  />
                </div>
                
                {/* Détails du produit */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-xl text-gray-900 mb-3">
                      {products.find(p => p.id === selectedProductId)?.vendorName}
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {products.find(p => p.id === selectedProductId)?.adminProduct.name}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-6 text-sm">
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium text-gray-900">Prix:</span>
                          <div className="text-xl font-bold text-gray-900 mt-1">
                            {((products.find(p => p.id === selectedProductId)?.price || 0).toLocaleString('fr-FR', { 
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0
                            }))} FCFA
                          </div>
                        </div>
                      <div>
                          <span className="font-medium text-gray-900">Statut:</span>
                          <div className="mt-1">
                            <Badge 
                              variant="outline"
                              className={`font-medium ${getStatusBadgeStyle(products.find(p => p.id === selectedProductId)?.status || 'DRAFT')}`}
                            >
                              {getStatusText(products.find(p => p.id === selectedProductId)?.status || 'DRAFT')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium text-gray-900">Ventes:</span>
                          <div className="text-gray-600 mt-1">
                            {products.find(p => p.id === selectedProductId)?.bestSeller.salesCount || 0}
                          </div>
                      </div>
                      <div>
                          <span className="font-medium text-gray-900">Revenus:</span>
                          <div className="text-gray-600 mt-1">
                            {(products.find(p => p.id === selectedProductId)?.bestSeller.totalRevenue || 0).toLocaleString('fr-FR')} FCFA
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Produit de base</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                      <p><strong>Nom:</strong> {products.find(p => p.id === selectedProductId)?.adminProduct.name}</p>
                      <p><strong>Genre:</strong> {products.find(p => p.id === selectedProductId)?.adminProduct.genre}</p>
                      <p><strong>Catégorie:</strong> {products.find(p => p.id === selectedProductId)?.adminProduct.categories?.[0]?.name || 'Non définie'}</p>
                      <p><strong>Couleurs disponibles:</strong> {products.find(p => p.id === selectedProductId)?.selectedColors.length}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Design appliqué</h4>
                    <div className="text-sm text-gray-600 space-y-2">
                      <p><strong>Design présent:</strong> {products.find(p => p.id === selectedProductId)?.designApplication.hasDesign ? 'Oui' : 'Non'}</p>
                      {products.find(p => p.id === selectedProductId)?.design && (
                        <>
                          <p><strong>Nom du design:</strong> {products.find(p => p.id === selectedProductId)?.design?.name}</p>
                          <p><strong>Catégorie du design:</strong> {products.find(p => p.id === selectedProductId)?.design?.category?.name || 'Non définie'}</p>
                        </>
                      )}
                      <p><strong>Échelle:</strong> {products.find(p => p.id === selectedProductId)?.designApplication.scale.toFixed(2)}x</p>
                      {/* 🆕 Informations de validation */}
                      {selectedProductId && products.find(p => p.id === selectedProductId)?.designApplication.hasDesign && validationStatuses[selectedProductId] && (
                        <div className="mt-3 p-3 rounded-lg border bg-gray-50">
                          <p className="font-medium text-sm text-gray-900 mb-1">Statut de validation:</p>
                          <div className={`flex items-center gap-2 text-sm ${
                            validationStatuses[selectedProductId].validationStatus === 'validated'
                              ? 'text-green-700'
                              : validationStatuses[selectedProductId].validationStatus === 'rejected'
                              ? 'text-red-700'
                              : 'text-amber-700'
                          }`}>
                            {validationStatuses[selectedProductId].validationStatus === 'validated' && '✅ Design validé par l\'admin'}
                            {validationStatuses[selectedProductId].validationStatus === 'pending' && '⏳ En attente de validation admin'}
                            {validationStatuses[selectedProductId].validationStatus === 'rejected' && '❌ Design rejeté par l\'admin'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-6 border-t border-gray-200">
                    {/* Actions spécifiques selon le statut dans la modal */}
                    {selectedProductId && (() => {
                      const product = products.find(p => p.id === selectedProductId);
                      if (!product) return null;

                      return (
                        <>
                          {product.status === 'DRAFT' && product.designApplication.hasDesign && (
                            <div className="flex flex-col gap-2">
                              <Button
                                onClick={() => {
                                  handlePublishNow(selectedProductId);
                                  setIsPreviewOpen(false);
                                }}
                                disabled={!canPublishNow(product)}
                                className={`font-medium ${
                                  canPublishNow(product)
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {canPublishNow(product) ? 'Publier maintenant' : 'En attente validation'}
                              </Button>
                              <span className={`text-xs text-center px-2 ${
                                canPublishNow(product) ? 'text-green-600' : 'text-amber-600'
                              }`}>
                                {getPublishMessage(product)}
                              </span>
                            </div>
                          )}

                          {product.status === 'PUBLISHED' && (
                            <Button
                              onClick={() => {
                                handleSetToDraft(selectedProductId);
                                setIsPreviewOpen(false);
                              }}
                              variant="outline"
                              className="border-gray-400 text-gray-700 hover:bg-gray-50 font-medium"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Mettre en brouillon
                            </Button>
                          )}

                          {(product.status === 'PENDING' || (!product.designApplication.hasDesign)) && (
                            <div className="flex flex-col gap-2">
                              <Button
                                onClick={() => {
                                  handlePublish(selectedProductId);
                                  setIsPreviewOpen(false);
                                }}
                                disabled={product.status === 'PENDING' && !canRepublishPendingProduct(product)}
                                className={`font-medium ${
                                  product.status === 'PENDING' && !canRepublishPendingProduct(product)
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                                }`}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {product.status === 'PENDING' && !canRepublishPendingProduct(product)
                                  ? 'En attente de validation'
                                  : (product.designApplication.hasDesign ? 'Publier' : 'Publier (sans design)')
                                }
                              </Button>
                              {product.status === 'PENDING' && product.designApplication.hasDesign && (
                                <span className={`text-xs text-center px-2 ${
                                  canRepublishPendingProduct(product) ? 'text-green-600' : 'text-amber-600'
                                }`}>
                                  {canRepublishPendingProduct(product)
                                    ? 'Design validé - Peut republier'
                                    : 'Design en attente de validation admin'
                                  }
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      );
                    })()}

                    <Button
                      variant="outline"
                      onClick={() => {
                        handleDeleteClick(selectedProductId);
                        setIsPreviewOpen(false);
                      }}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-red-600 hover:border-red-300 font-medium"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de confirmation de suppression */}
        <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
            </DialogHeader>
            <p>Voulez-vous vraiment supprimer ce produit ? Cette action est réversible.</p>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Annuler</Button>
              </DialogClose>
              <Button variant="destructive" onClick={confirmDelete}>Supprimer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default VendorProductsPage; 