// services/DesignPositionService.ts
export interface DesignPositionData {
  designId: number;
  baseProductId: number;
  position: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
    // 🆕 Nouvelles propriétés pour les dimensions intrinsèques du design
    designWidth?: number;
    designHeight?: number;
    designScale?: number;
    // ✅ ESSENTIEL: Dimensions de la délimitation pour le backend
    delimitationWidth?: number;
    delimitationHeight?: number;
    positionUnit?: 'PIXEL' | 'PERCENTAGE';
  };
  timestamp: number;
  vendorId: number;
  // Optionnel : aperçu des sélections
  previewSelections?: {
    colors: any[];
    sizes: any[];
    price: number;
    stock: number;
  };
}

class DesignPositionService {
  private getStorageKey(vendorId: number, baseProductId: number, designId: number): string {
    return `design_position_${vendorId}_${baseProductId}_${designId}`;
  }

  /**
   * Sauvegarde la position d'un design dans localStorage
   */
  savePosition(
    vendorId: number,
    baseProductId: number,
    designId: number,
    position: { 
      x: number; 
      y: number; 
      scale: number; 
      rotation: number;
      // 🆕 Nouvelles propriétés pour les dimensions intrinsèques du design
      designWidth?: number;
      designHeight?: number;
      designScale?: number;
    },
    previewSelections?: {
      colors: any[];
      sizes: any[];
      price: number;
      stock: number;
    }
  ): void {
    const key = this.getStorageKey(vendorId, baseProductId, designId);
    const data: DesignPositionData = {
      designId,
      baseProductId,
      position,
      timestamp: Date.now(),
      vendorId,
      previewSelections
    };

    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log('💾 Position sauvegardée en localStorage:', key);
    } catch (error) {
      console.error('❌ Erreur sauvegarde localStorage:', error);
    }
  }

  /**
   * Récupère la position d'un design depuis localStorage
   */
  loadPosition(vendorId: number, baseProductId: number, designId: number): DesignPositionData | null {
    const key = this.getStorageKey(vendorId, baseProductId, designId);
    const saved = localStorage.getItem(key);
    
    if (!saved) return null;

    try {
      const data = JSON.parse(saved);
      console.log('📂 Position restaurée depuis localStorage:', key);
      return data;
    } catch (error) {
      console.error('❌ Erreur parsing localStorage:', error);
      // Nettoyer les données corrompues
      localStorage.removeItem(key);
      return null;
    }
  }

  /**
   * Supprime une position spécifique
   */
  deletePosition(vendorId: number, baseProductId: number, designId: number): void {
    const key = this.getStorageKey(vendorId, baseProductId, designId);
    localStorage.removeItem(key);
    console.log('🗑️ Position supprimée:', key);
  }

  /**
   * Récupère tous les brouillons (drafts) en cours
   */
  getAllDrafts(): DesignPositionData[] {
    const drafts: DesignPositionData[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('design_position_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          drafts.push(data);
        } catch (error) {
          console.error('❌ Erreur parsing draft:', error);
          // Nettoyer les données corrompues
          localStorage.removeItem(key);
        }
      }
    }
    
    return drafts.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Nettoyage automatique des brouillons expirés
   */
  cleanupOldDrafts(maxAgeHours: number = 24): number {
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000;
    let cleaned = 0;
    
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith('design_position_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (now - data.timestamp > maxAge) {
            localStorage.removeItem(key);
            cleaned++;
            console.log(`🗑️ Draft expiré supprimé: ${key}`);
          }
        } catch (error) {
          // Supprimer les données corrompues
          localStorage.removeItem(key);
          cleaned++;
        }
      }
    }
    
    return cleaned;
  }

  /**
   * Vérifie si une position existe pour un design donné
   */
  hasPosition(vendorId: number, baseProductId: number, designId: number): boolean {
    const key = this.getStorageKey(vendorId, baseProductId, designId);
    return localStorage.getItem(key) !== null;
  }

  /**
   * Alias rétro-compatibilité : récupère la position via divers patterns de clés.
   * Signature simplifiée utilisée par certains hooks :
   *   getPosition(designId, baseProductId?, vendorId?)
   * Si vendorId ou baseProductId manquent, la méthode tente de les déduire
   * en parcourant les clés localStorage correspondantes.
   */
  getPosition(
    designId: number,
    baseProductId?: number | null,
    vendorId?: number | null
  ): DesignPositionData | null {
    // 1️⃣ Recherche directe si tous les paramètres sont fournis
    if (vendorId && baseProductId) {
      return this.loadPosition(vendorId, baseProductId, designId);
    }

    // 2️⃣ Parcourir toutes les clés localStorage à la recherche d'une correspondance
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Clé officielle « design_position_vendor_baseProduct_designId »
      if (key.startsWith('design_position_')) {
        const parts = key.split('_');
        // Structure: ['design', 'position', vendorId, baseProductId, designId]
        if (parts.length === 5) {
          const [_, __, vIdStr, bpIdStr, dIdStr] = parts;
          const vId = Number(vIdStr);
          const bpId = Number(bpIdStr);
          const dId = Number(dIdStr);

          if (dId === designId && (!baseProductId || bpId === baseProductId) && (!vendorId || vId === vendorId)) {
            return this.loadPosition(vId, bpId, dId);
          }
        }
      }

      // 🔧 Support ancien pattern « design-position-bpId-designUrl »
      if (key.startsWith('design-position-')) {
        const saved = localStorage.getItem(key);
        if (!saved) continue;
        try {
          const data = JSON.parse(saved);
          if (typeof data === 'object' && 'positionX' in data) {
            // Adapter vers DesignPositionData minimal
            const generated: DesignPositionData = {
              designId,
              baseProductId: baseProductId || 0,
              vendorId: vendorId || 0,
              position: {
                x: data.positionX,
                y: data.positionY,
                scale: data.scale,
                rotation: data.rotation ?? 0
              },
              timestamp: Date.now()
            };
            console.log('📂 Position restaurée (pattern legacy) depuis localStorage:', key);
            return generated;
          }
        } catch (e) {
          // ignorer les erreurs et continuer
        }
      }
    }

    // Aucune correspondance trouvée
    return null;
  }

  /**
   * Utilitaire pour déboguer le localStorage
   */
  debugLocalStorage(): void {
    console.log('🔍 localStorage debug:');
    const drafts = this.getAllDrafts();
    drafts.forEach((draft, index) => {
      console.log(`${index + 1}. Design ${draft.designId} sur produit ${draft.baseProductId}`);
      console.log(`   Position: x=${draft.position.x}, y=${draft.position.y}, scale=${draft.position.scale}`);
      console.log(`   Timestamp: ${new Date(draft.timestamp).toLocaleString()}`);
    });
  }
}

export const designPositionService = new DesignPositionService();
export default designPositionService; 