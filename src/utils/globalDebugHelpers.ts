import { designPositionManager } from './designPositionManager';
import { PositionDebugger } from './positionDebugger';
import { apiClient } from '@/lib/apiClient';

// Utilitaires globaux pour le debug
class GlobalDebugHelpers {
  private debugger = new PositionDebugger();

  /**
   * Diagnostic rapide depuis la console
   */
  async quickDiagnose(productId: number = 1, designId: number = 1) {
    console.log('🚀 === DIAGNOSTIC RAPIDE ===');
    console.log(`📍 Produit: ${productId}, Design: ${designId}`);
    
    try {
      // 1. Tester les permissions
      console.log('🔍 Test des permissions...');
      const hasPermission = await this.debugger.testPermissions(productId, designId);
      console.log(`✅ Permissions: ${hasPermission ? 'OK' : 'ÉCHEC'}`);
      
      // 2. Obtenir les IDs disponibles
      console.log('📦 IDs disponibles...');
      const availableIds = await this.debugger.getAvailableIds();
      console.log('📦 Produits:', availableIds.productIds);
      console.log('🎨 Designs:', availableIds.designIds);
      
      // 3. Diagnostic complet si problème
      if (!hasPermission) {
        console.log('🔧 Diagnostic des erreurs...');
        const recommendations = await this.debugger.diagnosePermissionError(productId, designId);
        console.log('💡 Recommandations:', recommendations);
        
        // 4. Correction automatique
        const autoFix = await this.debugger.autoFix(productId, designId);
        if (autoFix) {
          console.log('🎯 Correction automatique:', autoFix);
          
          // Tester la correction
          const fixedPermission = await this.debugger.testPermissions(
            autoFix.correctProductId, 
            autoFix.correctDesignId
          );
          console.log(`✅ Correction vérifiée: ${fixedPermission ? 'OK' : 'ÉCHEC'}`);
        }
      }
      
      console.log('🎉 === DIAGNOSTIC TERMINÉ ===');
      
      return {
        originalIds: { productId, designId },
        hasPermission,
        availableIds,
        autoFix: !hasPermission ? await this.debugger.autoFix(productId, designId) : null
      };
      
    } catch (error) {
      console.error('❌ Erreur diagnostic:', error);
      return { error: error.message };
    }
  }

  /**
   * Test rapide de sauvegarde
   */
  async testSave(productId: number = 1, designId: number = 1) {
    const testPosition = {
      x: Math.random() * 200,
      y: Math.random() * 200,
      scale: 1,
      rotation: 0,
      constraints: { adaptive: true }
    };

    console.log('💾 Test de sauvegarde...', testPosition);
    
    try {
      await designPositionManager.savePosition(productId, designId, testPosition);
      console.log('✅ Sauvegarde réussie!');
      
      // Vérifier le chargement
      const loaded = await designPositionManager.getPosition(productId, designId);
      console.log('📍 Position rechargée:', loaded);
      
      return { success: true, position: loaded };
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Nettoyage complet pour redémarrer à zéro
   */
  cleanup() {
    console.log('🧹 Nettoyage complet...');
    
    designPositionManager.clearCache();
    designPositionManager.clearMappings();
    
    // Nettoyer localStorage
    const keys = Object.keys(localStorage).filter(key => 
      key.includes('design') || key.includes('position') || key.includes('transform')
    );
    
    keys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Supprimé: ${key}`);
    });
    
    console.log('✅ Nettoyage terminé');
  }

  /**
   * Informations système
   */
  async systemInfo() {
    console.log('📊 === INFORMATIONS SYSTÈME ===');
    
    try {
      // ✅ Utilisateur connecté (nouvel endpoint)
      const user = await apiClient.get('/auth/profile');
      console.log('👤 Utilisateur:', user.data);
      
      // ✅ Produits vendeur (nouvel endpoint)
      const productsRes = await apiClient.get('/vendor/products');
      const products = productsRes.data?.data?.products || productsRes.data?.products || productsRes.data;
      console.log('📦 Produits vendeur:', products);
      
      // ✅ Designs (nouvel endpoint)
      const designsRes = await apiClient.get('/vendor/designs?status=all');
      const designs = designsRes.data?.data?.designs || designsRes.data?.designs || designsRes.data;
      console.log('🎨 Designs:', designs);
      
      // État du cache
      console.log('💾 Cache:', designPositionManager);
      
    } catch (error) {
      console.error('❌ Erreur info système:', error);
    }
    
    console.log('📊 === FIN INFORMATIONS ===');
  }
}

// Instance globale
const debugHelpers = new GlobalDebugHelpers();

// Exposer globalement pour utilisation dans la console
declare global {
  interface Window {
    debugDesignPosition: typeof debugHelpers;
    quickDiagnose: typeof debugHelpers.quickDiagnose;
    testSavePosition: typeof debugHelpers.testSave;
    cleanupDesignSystem: typeof debugHelpers.cleanup;
    designSystemInfo: typeof debugHelpers.systemInfo;
  }
}

// Attacher à window pour usage global
if (typeof window !== 'undefined') {
  window.debugDesignPosition = debugHelpers;
  window.quickDiagnose = debugHelpers.quickDiagnose.bind(debugHelpers);
  window.testSavePosition = debugHelpers.testSave.bind(debugHelpers);
  window.cleanupDesignSystem = debugHelpers.cleanup.bind(debugHelpers);
  window.designSystemInfo = debugHelpers.systemInfo.bind(debugHelpers);
}

export { debugHelpers }; 