export interface DesignTransform {
  x: number;
  y: number;
  scale: number;
  rotation?: number;
  // 🆕 AJOUT : Propriétés pour les dimensions du design
  design_width?: number;
  design_height?: number;
  design_scale?: number;
}

export interface TransformState {
  transforms: Record<string, DesignTransform>;
  lastModified: number;
  isDirty: boolean; // Indique si des changements non sauvés existent
  isLoading: boolean;
  error?: string;
}

class DesignTransformsStorage {
  private readonly STORAGE_PREFIX = 'design_transforms';
  
  /**
   * Clé de stockage unique par vendeur/produit/design
   */
  private getStorageKey(vendorProductId: number, designUrl: string): string {
    const urlHash = btoa(designUrl).slice(0, 16); // Hash court de l'URL
    return `${this.STORAGE_PREFIX}_${vendorProductId}_${urlHash}`;
  }

  /**
   * Sauvegarde immédiate en localStorage
   */
  saveToLocal(
    vendorProductId: number, 
    designUrl: string, 
    transforms: Record<string, DesignTransform>
  ): void {
    const key = this.getStorageKey(vendorProductId, designUrl);
    const state: TransformState = {
      transforms,
      lastModified: Date.now(),
      isDirty: true,
      isLoading: false
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(state));
      console.log(`💾 LocalStorage: Transforms sauvés pour ${vendorProductId}`);
    } catch (error) {
      console.error('❌ LocalStorage: Erreur sauvegarde:', error);
    }
  }

  /**
   * Chargement depuis localStorage
   */
  loadFromLocal(vendorProductId: number, designUrl: string): TransformState | null {
    const key = this.getStorageKey(vendorProductId, designUrl);
    
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const state: TransformState = JSON.parse(stored);
        console.log(`📥 LocalStorage: Transforms chargés pour ${vendorProductId}`);
        return state;
      }
    } catch (error) {
      console.error('❌ LocalStorage: Erreur chargement:', error);
    }
    
    return null;
  }

  /**
   * Marquer comme sauvé (plus dirty)
   */
  markAsSaved(vendorProductId: number, designUrl: string): void {
    const key = this.getStorageKey(vendorProductId, designUrl);
    const stored = this.loadFromLocal(vendorProductId, designUrl);
    
    if (stored) {
      stored.isDirty = false;
      stored.isLoading = false;
      localStorage.setItem(key, JSON.stringify(stored));
    }
  }

  /**
   * Marquer comme en cours de sauvegarde
   */
  markAsLoading(vendorProductId: number, designUrl: string, loading: boolean): void {
    const key = this.getStorageKey(vendorProductId, designUrl);
    const stored = this.loadFromLocal(vendorProductId, designUrl);
    
    if (stored) {
      stored.isLoading = loading;
      localStorage.setItem(key, JSON.stringify(stored));
    }
  }

  /**
   * Obtenir tous les transforms non sauvés
   */
  getDirtyTransforms(): Array<{
    vendorProductId: number;
    designUrl: string;
    transforms: Record<string, DesignTransform>;
    lastModified: number;
  }> {
    const dirtyItems: any[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.STORAGE_PREFIX)) {
        try {
          const stored = JSON.parse(localStorage.getItem(key) || '');
          if (stored.isDirty) {
            // Extraire les IDs depuis la clé
            const parts = key.split('_');
            dirtyItems.push({
              vendorProductId: parseInt(parts[2]),
              designUrl: atob(parts[3]), // Décoder l'URL
              transforms: stored.transforms,
              lastModified: stored.lastModified
            });
          }
        } catch (error) {
          console.warn(`⚠️ Clé localStorage corrompue: ${key}`);
        }
      }
    }
    
    return dirtyItems;
  }

  /**
   * Nettoyer les anciennes entrées (plus de 7 jours)
   */
  cleanup(): void {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.STORAGE_PREFIX)) {
        try {
          const stored = JSON.parse(localStorage.getItem(key) || '');
          if (stored.lastModified < oneWeekAgo) {
            keysToRemove.push(key);
          }
        } catch (error) {
          keysToRemove.push(key); // Supprimer les entrées corrompues
        }
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ LocalStorage: Suppression ancienne entrée ${key}`);
    });
  }
}

export const designTransformsStorage = new DesignTransformsStorage(); 