import { apiClient } from '@/lib/apiClient';
import { PositionDebugger } from './positionDebugger';

export interface DesignPosition {
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
  // 🆕 AJOUT : Propriétés pour les dimensions du design
  design_width?: number;
  design_height?: number;
  design_scale?: number;
  constraints?: {
    adaptive?: boolean;
    area?: string;
    [key: string]: any;
  };
}

export class DesignPositionManager {
  private cache = new Map<string, DesignPosition>();
  private debugger = new PositionDebugger();
  private idMapping = new Map<string, { productId: number; designId: number }>();
  
  // 🔧 OPTIMISATION : Prévention des requêtes multiples
  private pendingRequests = new Map<string, Promise<any>>();
  private saveTimeouts = new Map<string, NodeJS.Timeout>();
  private lastSaveTime = new Map<string, number>();

  constructor(private api = apiClient) {}

  /**
   * Sauvegarde position avec isolation garantie et diagnostic automatique
   */
  async savePosition(productId: number, designId: number, position: DesignPosition): Promise<any> {
    console.log(`💾 Sauvegarde position: Produit ${productId} ↔ Design ${designId}`, position);
    
    const requestKey = `save-${productId}-${designId}`;
    
    // 🛡️ PRÉVENTION : Éviter les requêtes multiples simultanées
    if (this.pendingRequests.has(requestKey)) {
      console.log('⏳ Sauvegarde déjà en cours, utilisation de la promesse existante');
      return this.pendingRequests.get(requestKey);
    }
    
    const savePromise = this._performSave(productId, designId, position);
    this.pendingRequests.set(requestKey, savePromise);
    
    try {
      const result = await savePromise;
      return result;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * Sauvegarde effective (privée)
   */
  private async _performSave(productId: number, designId: number, position: DesignPosition): Promise<any> {
    try {
      // 🆕 0. Si lʼID est manifestement un baseProductId (<60) ➜ créer/résoudre un vendorProductId avant toute requête
      if (productId < 60) {
        try {
          const { getOrCreateVendorProduct } = await import('./getOrCreateVendorProduct');
          console.log('🔄 Résolution auto du vendorProductId pour baseProductId', productId);
          const vpId = await getOrCreateVendorProduct(productId, designId);

          if (vpId && vpId >= 60) {
            console.log('✅ vendorProductId résolu ➜', vpId, '→ retry save');
            // Retry immédiatement avec le nouvel ID (évite la 404)
            return this._performSave(vpId, designId, position);
          }
        } catch (autoErr) {
          console.warn('⚠️ Impossible de créer / résoudre vendorProductId automatiquement:', autoErr);
        }

        console.warn('⏭️ vendorProductId non disponible encore. Skip savePosition pour baseProductId', productId);
        throw new Error('vendorProductId non disponible – attendre publication');
      }

      // Essayer d'abord avec les IDs fournis
      const response = await this.api.put(
        `/api/vendor-products/${productId}/designs/${designId}/position/direct`,
        position
      );
      
      // Mettre à jour le cache
      const cacheKey = `${productId}-${designId}`;
      this.cache.set(cacheKey, position);
      this.lastSaveTime.set(cacheKey, Date.now());
      
      console.log('✅ Position sauvegardée avec succès');
      return response.data;
      
    } catch (error: any) {
      console.error('❌ Erreur sauvegarde position:', error);
      
      // Si erreur 403, essayer le diagnostic et la correction automatique (dev uniquement)
      if (process.env.NODE_ENV === 'development' && error.response?.status === 403) {
        console.log('🔍 Erreur 403 détectée, diagnostic en cours...');
        
        try {
          const autoFix = await this.debugger.autoFix(productId, designId);
          
          if (autoFix) {
            console.log('🔧 Correction automatique appliquée:', autoFix);
            
            // Sauvegarder le mapping pour les prochaines fois
            const originalKey = `${productId}-${designId}`;
            this.idMapping.set(originalKey, {
              productId: autoFix.correctProductId,
              designId: autoFix.correctDesignId
            });
            
            // Retry avec les bons IDs
            const retryResponse = await this.api.put(
              `/api/vendor-products/${autoFix.correctProductId}/designs/${autoFix.correctDesignId}/position/direct`,
              position
            );
            
            // Mettre à jour le cache avec les vrais IDs
            const correctCacheKey = `${autoFix.correctProductId}-${autoFix.correctDesignId}`;
            this.cache.set(correctCacheKey, position);
            this.lastSaveTime.set(correctCacheKey, Date.now());
            
            console.log('✅ Position sauvegardée après correction automatique');
            return {
              ...retryResponse.data,
              correctedIds: {
                productId: autoFix.correctProductId,
                designId: autoFix.correctDesignId
              }
            };
          }
        } catch (debugError) {
          console.error('❌ Échec du diagnostic automatique:', debugError);
        }
      }
      
      if (productId < 60) {
        console.warn('⏭️ vendorProductId non disponible encore. Skip savePosition pour baseProductId', productId);
        throw new Error('vendorProductId non disponible – attendre publication');
      }
      
      // Fallback vers API legacy
        console.log('🔄 Fallback vers API legacy');
        return this.savePositionLegacy(productId, designId, position);
    }
  }

  /**
   * Fallback vers API legacy avec transforms
   */
  private async savePositionLegacy(productId: number, designId: number, position: DesignPosition): Promise<any> {
    const transformData = {
      productId,
      designId,
      transforms: {
        positioning: position // ⚠️ CRITIQUE : cette structure doit être présente
      },
      lastModified: Date.now()
    };

    return this.api.post('/vendor/design-transforms/save', transformData);
  }

  /**
   * Récupère position avec cache et correction automatique
   */
  async getPosition(productId: number, designId: number): Promise<DesignPosition | null> {
    const requestKey = `get-${productId}-${designId}`;
    
    // 🛡️ PRÉVENTION : Éviter les requêtes multiples simultanées
    if (this.pendingRequests.has(requestKey)) {
      console.log('⏳ Chargement déjà en cours, utilisation de la promesse existante');
      return this.pendingRequests.get(requestKey);
    }
    
    // Vérifier si on a un mapping corrigé
    const originalKey = `${productId}-${designId}`;
    const mapping = this.idMapping.get(originalKey);
    
    const getPromise = mapping
      ? this.getPositionWithIds(mapping.productId, mapping.designId)
      : this.getPositionWithIds(productId, designId);
    
    this.pendingRequests.set(requestKey, getPromise);
    
    try {
      const result = await getPromise;
      return result;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * Récupère position avec IDs spécifiques
   */
  private async getPositionWithIds(productId: number, designId: number): Promise<DesignPosition | null> {
    const cacheKey = `${productId}-${designId}`;
    
    // 🔧 OPTIMISATION : Cache avec expiration
    if (this.cache.has(cacheKey)) {
      const lastSave = this.lastSaveTime.get(cacheKey) || 0;
      const cacheAge = Date.now() - lastSave;
      
      // Cache valide pendant 30 secondes
      if (cacheAge < 30000) {
        console.log(`📍 Position depuis cache (${Math.round(cacheAge/1000)}s): Produit ${productId} ↔ Design ${designId}`);
        return this.cache.get(cacheKey) || null;
      } else {
        console.log(`🔄 Cache expiré (${Math.round(cacheAge/1000)}s), rechargement...`);
        this.cache.delete(cacheKey);
      }
    }
    
    try {
      // Essayer API directe d'abord
      const { data } = await this.api.get(
        `/api/vendor-products/${productId}/designs/${designId}/position/direct`
      );
      
      const position = data.data;
      
      if (position) {
        // Mettre en cache
        this.cache.set(cacheKey, position);
        this.lastSaveTime.set(cacheKey, Date.now());
        console.log(`📍 Position récupérée (directe): Produit ${productId} ↔ Design ${designId}`, position);
        return position;
      }
      
      return null;
      
    } catch (error: any) {
      // Si erreur 403, essayer le diagnostic (dev uniquement)
      if (process.env.NODE_ENV === 'development' && error.response?.status === 403) {
        console.log('🔍 Erreur 403 lors du chargement, diagnostic...');
        
        try {
          const autoFix = await this.debugger.autoFix(productId, designId);
          
          if (autoFix) {
            console.log('🔧 Mapping auto-corrigé pour le chargement:', autoFix);
            
            // Sauvegarder le mapping
            const originalKey = `${productId}-${designId}`;
            this.idMapping.set(originalKey, {
              productId: autoFix.correctProductId,
              designId: autoFix.correctDesignId
            });
            
            // Retry avec les bons IDs
            return this.getPositionWithIds(autoFix.correctProductId, autoFix.correctDesignId);
          }
        } catch (debugError) {
          console.error('❌ Échec diagnostic lors du chargement:', debugError);
        }
      }
      
      if (error.response?.status === 404) {
        // Fallback vers API legacy
        return this.getPositionLegacy(productId, designId);
      }
      
      // Pour les autres erreurs, retourner null au lieu de throw
      console.log(`ℹ️ Pas de position trouvée pour Produit ${productId} ↔ Design ${designId}`);
      return null;
    }
  }

  /**
   * Fallback vers API legacy
   */
  private async getPositionLegacy(productId: number, designId: number): Promise<DesignPosition | null> {
    try {
      const response = await this.api.get('/vendor/design-transforms/load', {
        params: {
          vendorProductId: productId,
          designId: designId
        }
      });

      const positioning = response.data?.data?.transforms?.positioning;
      
      if (positioning) {
        // Mettre en cache
        const cacheKey = `${productId}-${designId}`;
        this.cache.set(cacheKey, positioning);
        this.lastSaveTime.set(cacheKey, Date.now());
        console.log(`📍 Position récupérée (legacy): Produit ${productId} ↔ Design ${designId}`, positioning);
        return positioning;
      }
      
      return null;
    } catch (error) {
      console.log(`ℹ️ Pas de position legacy pour Produit ${productId} ↔ Design ${designId}`);
      return null;
    }
  }

  /**
   * Supprime une position sauvegardée
   */
  async deletePosition(productId: number, designId: number): Promise<void> {
    const cacheKey = `${productId}-${designId}`;
    
    try {
      await this.api.delete(`/api/vendor-products/${productId}/designs/${designId}/position/direct`);
      
      // Nettoyer le cache
      this.cache.delete(cacheKey);
      this.lastSaveTime.delete(cacheKey);
      
      console.log(`🗑️ Position supprimée: Produit ${productId} ↔ Design ${designId}`);
    } catch (error) {
      console.error('❌ Erreur suppression position:', error);
      throw error;
    }
  }

  /**
   * 🔧 OPTIMISATION : Sauvegarde avec délai et debouncing
   */
  async savePositionDelayed(productId: number, designId: number, position: DesignPosition, delay = 1000): Promise<void> {
    const timeoutKey = `${productId}-${designId}`;
    
    // Annuler le timeout précédent s'il existe
    if (this.saveTimeouts.has(timeoutKey)) {
      clearTimeout(this.saveTimeouts.get(timeoutKey));
    }
    
    // Mettre à jour le cache immédiatement (optimiste)
    const cacheKey = `${productId}-${designId}`;
    this.cache.set(cacheKey, position);
    
    // Programmer la sauvegarde
    const timeout = setTimeout(async () => {
      try {
        await this.savePosition(productId, designId, position);
        console.log(`⏰ Sauvegarde delayed terminée: Produit ${productId} ↔ Design ${designId}`);
      } catch (error) {
        console.error(`❌ Erreur sauvegarde delayed: Produit ${productId} ↔ Design ${designId}`, error);
      } finally {
        this.saveTimeouts.delete(timeoutKey);
      }
    }, delay);
    
    this.saveTimeouts.set(timeoutKey, timeout);
    console.log(`⏰ Sauvegarde programmée dans ${delay}ms: Produit ${productId} ↔ Design ${designId}`);
  }

  /**
   * Nettoie le cache
   */
  clearCache(): void {
    this.cache.clear();
    this.lastSaveTime.clear();
    
    // Annuler tous les timeouts en cours
    this.saveTimeouts.forEach(timeout => clearTimeout(timeout));
    this.saveTimeouts.clear();
    
    console.log('🧹 Cache nettoyé');
  }

  /**
   * Vérifie si une position existe
   */
  async hasPosition(productId: number, designId: number): Promise<boolean> {
    const position = await this.getPosition(productId, designId);
    return position !== null;
  }

  /**
   * Gestion d'erreur
   */
  handleError(error: any): string {
    if (error.response?.status === 403) {
      return "Produit non autorisé";
    }
    if (error.response?.status === 404) {
      return "Position non trouvée";
    }
    return error.message || "Erreur inconnue";
  }

  /**
   * 🆕 Diagnostic complet
   */
  async showDiagnosticInfo(productId: number, designId: number): Promise<void> {
    console.group(`🔍 === DIAGNOSTIC POSITION PRODUIT ${productId} ===`);
    
    const cacheKey = `${productId}-${designId}`;
    const hasCache = this.cache.has(cacheKey);
    const hasMapping = this.idMapping.has(cacheKey);
    const hasPendingRequest = this.pendingRequests.has(`get-${productId}-${designId}`);
    
    console.log('📊 État du cache:', {
      hasCache,
      hasMapping,
      hasPendingRequest,
      cacheSize: this.cache.size,
      mappingSize: this.idMapping.size,
      pendingSize: this.pendingRequests.size
    });
    
    if (hasCache) {
      const position = this.cache.get(cacheKey);
      const lastSave = this.lastSaveTime.get(cacheKey);
      console.log('💾 Position en cache:', position);
      console.log('⏰ Dernière sauvegarde:', lastSave ? new Date(lastSave) : 'Inconnue');
    }
    
    if (hasMapping) {
      console.log('🔧 Mapping corrigé:', this.idMapping.get(cacheKey));
    }
    
    console.groupEnd();
  }

  /**
   * Nettoie les mappings
   */
  clearMappings(): void {
    this.idMapping.clear();
    console.log('🧹 Mappings nettoyés');
  }
}

// Instance globale
export const designPositionManager = new DesignPositionManager(); 
 
 