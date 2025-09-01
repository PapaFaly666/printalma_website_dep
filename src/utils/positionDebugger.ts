import { apiClient } from '@/lib/apiClient';

export interface DebugRecommendation {
  type: string;
  message: string;
  solution: any;
}

export interface AutoFixSolution {
  correctProductId: number;
  correctDesignId: number;
}

export class PositionDebugger {
  constructor(private api = apiClient) {}

  async diagnosePermissionError(productId: number, designId: number): Promise<DebugRecommendation[]> {
    console.log('🔍 Diagnostic des permissions...');
    
    try {
      // 1. ✅ Vérifier l'utilisateur connecté (ENDPOINT CORRIGÉ)
      const user = await this.api.get('/auth/profile');
      console.log('👤 Utilisateur:', user.data);
      
      // 2. ✅ Vérifier les produits du vendeur (nouvel endpoint)
      const vendorProductsRes = await this.api.get('/vendor/products');
      const vendorProducts = vendorProductsRes.data?.data?.products || vendorProductsRes.data?.products || vendorProductsRes.data;
      console.log('📦 Produits vendeur:', vendorProducts);
      
      // 3. ✅ Vérifier les designs du vendeur (nouvel endpoint)
      const designsRes = await this.api.get('/vendor/designs?status=all');
      const designs = designsRes.data?.data?.designs || designsRes.data?.designs || designsRes.data;
      console.log('🎨 Designs vendeur:', designs);
      
      // 4. Debug spécifique si l'endpoint existe
      let debugInfo = null;
      try {
        const debugResponse = await this.api.get(
          `/api/vendor-products/${productId}/designs/${designId}/position/debug`
        );
        debugInfo = debugResponse.data.debug;
        console.log('🔍 Debug spécifique:', debugInfo);
      } catch (error) {
        console.log('⚠️ Endpoint debug non disponible, diagnostic manuel');
        // Créer des infos de debug manuellement
        debugInfo = {
          productBelongsToVendor: Array.isArray(vendorProducts) && vendorProducts.some((p: any) => p.id === productId),
          designBelongsToVendor: Array.isArray(designs) && designs.some((d: any) => d.id === designId),
          product: Array.isArray(vendorProducts) ? vendorProducts.find((p: any) => p.id === productId) : null,
          design: Array.isArray(designs) ? designs.find((d: any) => d.id === designId) : null
        };
      }
      
      // 5. Générer des recommandations
      const recommendations = this.generateRecommendations(
        productId, 
        designId, 
        debugInfo,
        vendorProducts,
        designs
      );
      
      console.log('💡 Recommandations:', recommendations);
      return recommendations;
      
    } catch (error: any) {
      console.error('❌ Erreur diagnostic:', error);
      
      // Gestion spécifique des erreurs d'endpoints
      if (error.response?.status === 404) {
        return [{
          type: 'endpoint_not_found',
          message: `Endpoint non trouvé: ${error.config?.url || 'URL inconnue'}`,
          solution: [
            'Vérifiez que vous utilisez les bons endpoints',
            'Vérifiez que le serveur backend est démarré',
            'Endpoints corrects: /auth/profile, /vendor/products, /vendor/designs'
          ]
        }];
      }
      
      if (error.response?.status === 400) {
        return [{
          type: 'bad_request',
          message: error.response?.data?.message || 'Requête invalide',
          solution: [
            'Vérifiez les paramètres de la requête',
            'Vérifiez le format des données envoyées',
            'Consultez les logs du serveur'
          ]
        }];
      }
      
      return [{
        type: 'error',
        message: error.response?.data?.message || error.message,
        solution: [
          'Vérifiez votre connexion',
          'Vérifiez que vous êtes connecté en tant que vendeur',
          'Vérifiez que le serveur backend est démarré'
        ]
      }];
    }
  }

  generateRecommendations(
    productId: number, 
    designId: number, 
    debugInfo: any, 
    vendorProducts: any[], 
    designs: any[]
  ): DebugRecommendation[] {
    const recommendations: DebugRecommendation[] = [];
    
    // Problème de produit
    if (!debugInfo.productBelongsToVendor) {
      if (!debugInfo.product) {
        recommendations.push({
          type: 'product_not_found',
          message: `Produit ${productId} introuvable`,
          solution: `Utilisez un ID de produit valide parmi : ${vendorProducts.map(p => p.id).join(', ')}`
        });
      } else {
        recommendations.push({
          type: 'product_wrong_vendor',
          message: `Produit ${productId} appartient au vendeur ${debugInfo.product.vendorId}`,
          solution: `Utilisez un produit qui vous appartient`
        });
      }
    }
    
    // Problème de design
    if (!debugInfo.designBelongsToVendor) {
      if (!debugInfo.design) {
        recommendations.push({
          type: 'design_not_found',
          message: `Design ${designId} introuvable`,
          solution: `Utilisez un ID de design valide parmi : ${designs.map(d => d.id).join(', ')}`
        });
      } else {
        recommendations.push({
          type: 'design_wrong_vendor',
          message: `Design ${designId} appartient au vendeur ${debugInfo.design.vendorId}`,
          solution: `Utilisez un design qui vous appartient ou créez-en un nouveau`
        });
      }
    }
    
    // Solutions automatiques
    if (Array.isArray(vendorProducts) && vendorProducts.length > 0 && Array.isArray(designs) && designs.length > 0) {
      recommendations.push({
        type: 'auto_fix',
        message: 'Correction automatique possible',
        solution: {
          correctProductId: vendorProducts[0].id,
          correctDesignId: designs[0].id
        }
      });
    }
    
    return recommendations;
  }

  async autoFix(productId: number, designId: number): Promise<AutoFixSolution | null> {
    console.log('🔧 Tentative de correction automatique...');
    
    try {
      const diagnosis = await this.diagnosePermissionError(productId, designId);
      const autoFix = diagnosis.find(r => r.type === 'auto_fix');
      
      if (autoFix) {
        console.log('✅ Correction automatique trouvée:', autoFix.solution);
        return autoFix.solution as AutoFixSolution;
      } else {
        console.log('❌ Impossible de corriger automatiquement');
        return null;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la correction automatique:', error);
      return null;
    }
  }

  /**
   * Méthode pour obtenir les vrais IDs disponibles
   */
  async getAvailableIds(): Promise<{ productIds: number[]; designIds: number[] }> {
    try {
      const [productsRes, designsRes] = await Promise.all([
        this.api.get('/vendor/products'),
        this.api.get('/vendor/designs?status=all')
      ]);

      const productsList = productsRes.data?.data?.products || productsRes.data?.products || productsRes.data;
      const designsList = designsRes.data?.data?.designs || designsRes.data?.designs || designsRes.data;

      return {
        productIds: (productsList || []).map((p: any) => p.id),
        designIds: (designsList || []).map((d: any) => d.id)
      };
    } catch (error) {
      console.error('❌ Erreur récupération IDs:', error);
      return { productIds: [], designIds: [] };
    }
  }

  /**
   * Teste si une combinaison productId/designId fonctionne
   */
  async testPermissions(productId: number, designId: number): Promise<boolean> {
    try {
      await this.api.get(`/api/vendor-products/${productId}/designs/${designId}/position/direct`);
      return true;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // 404 = pas de position sauvegardée, mais permissions OK
        return true;
      }
      return false;
    }
  }
} 
 
 