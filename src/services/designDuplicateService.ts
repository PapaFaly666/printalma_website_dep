export interface DesignPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  scale?: number;
  coordinateType?: 'PIXEL' | 'PERCENTAGE';
}

export interface DesignUsage {
  id: number;
  designId: number;
  productId: number;
  position: DesignPosition;
  vendorId: number;
  createdAt: string;
  isActive: boolean;
  colorVariation?: string;
  view?: string;
}

export interface DuplicateCheckResult {
  status: 'NEUTRAL' | 'DUPLICATE_SAME_POSITION' | 'DUPLICATE_DIFFERENT_POSITION';
  message: string;
  canPublish: boolean;
  canRepositionAndPublish: boolean;
  conflictingUsage?: DesignUsage;
  suggestedAction?: string;
}

class DesignDuplicateService {
  private baseUrl = 'http://localhost:3000/api';
  private mockMode = true; // 🆕 Mode simulation activé par défaut

  // 🆕 Stockage local des usages pour la simulation
  private getMockUsages(): DesignUsage[] {
    try {
      const stored = localStorage.getItem('designUsages');
      return stored ? JSON.parse(stored) : this.getDefaultMockUsages();
    } catch {
      return this.getDefaultMockUsages();
    }
  }

  private saveMockUsages(usages: DesignUsage[]): void {
    try {
      localStorage.setItem('designUsages', JSON.stringify(usages));
    } catch (error) {
      console.warn('Impossible de sauvegarder les usages:', error);
    }
  }

  // 🆕 Données de démonstration par défaut
  private getDefaultMockUsages(): DesignUsage[] {
    return [
      {
        id: 1,
        designId: 1,
        productId: 1,
        position: { x: 50, y: 100, width: 200, height: 150, coordinateType: 'PIXEL' },
        vendorId: 1,
        createdAt: new Date().toISOString(),
        isActive: true,
        colorVariation: 'white',
        view: 'front'
      },
      {
        id: 2,
        designId: 1,
        productId: 2,
        position: { x: 75, y: 120, width: 180, height: 140, coordinateType: 'PIXEL' },
        vendorId: 1,
        createdAt: new Date().toISOString(),
        isActive: true,
        colorVariation: 'black',
        view: 'front'
      },
      // Exemple d'usage inactif (supprimé)
      {
        id: 3,
        designId: 2,
        productId: 1,
        position: { x: 30, y: 80, width: 220, height: 160, coordinateType: 'PIXEL' },
        vendorId: 1,
        createdAt: new Date().toISOString(),
        isActive: false,
        colorVariation: 'blue',
        view: 'back'
      }
    ];
  }

  /**
   * Vérifie si un design a déjà été utilisé sur un produit
   */
  async checkDesignDuplicate(
    designId: number,
    productId: number,
    proposedPosition: DesignPosition
  ): Promise<DuplicateCheckResult> {
    try {
      if (this.mockMode) {
        // 🆕 Mode simulation
        console.log('🔍 Vérification de doublons (mode simulation):', { designId, productId, proposedPosition });
        
        // Simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const allUsages = this.getMockUsages();
        return this.mockCheckDesignDuplicate(designId, productId, proposedPosition, allUsages);
      }

      // Mode API (quand disponible)
      const response = await fetch(`${this.baseUrl}/designs/check-duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          designId,
          productId,
          proposedPosition
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la vérification des doublons');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erreur lors de la vérification des doublons:', error);
      
      if (this.mockMode) {
        // En mode simulation, utiliser la méthode mock en cas d'erreur aussi
        const allUsages = this.getMockUsages();
        return this.mockCheckDesignDuplicate(designId, productId, proposedPosition, allUsages);
      }
      
      // Retourner un statut neutre en cas d'erreur
      return {
        status: 'NEUTRAL',
        message: 'Impossible de vérifier les doublons. Vous pouvez procéder.',
        canPublish: true,
        canRepositionAndPublish: true
      };
    }
  }

  /**
   * Récupère tous les usages d'un design
   */
  async getDesignUsages(designId: number): Promise<DesignUsage[]> {
    try {
      if (this.mockMode) {
        // 🆕 Mode simulation
        console.log('📋 Récupération des usages (mode simulation) pour le design:', designId);
        
        // Simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const allUsages = this.getMockUsages();
        const designUsages = allUsages.filter(usage => 
          usage.designId === designId && usage.isActive
        );
        
        console.log('✅ Usages trouvés:', designUsages);
        return designUsages;
      }

      // Mode API (quand disponible)
      const response = await fetch(`${this.baseUrl}/designs/${designId}/usages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des usages');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des usages:', error);
      
      if (this.mockMode) {
        // En mode simulation, retourner les données mock même en cas d'erreur
        const allUsages = this.getMockUsages();
        return allUsages.filter(usage => usage.designId === designId && usage.isActive);
      }
      
      return [];
    }
  }

  /**
   * Enregistre un nouvel usage d'un design
   */
  async recordDesignUsage(
    designId: number,
    productId: number,
    position: DesignPosition,
    colorVariation?: string,
    view?: string
  ): Promise<DesignUsage> {
    try {
      if (this.mockMode) {
        // 🆕 Mode simulation
        console.log('💾 Enregistrement d\'usage (mode simulation):', { designId, productId, position });
        
        // Simuler un délai réseau
        await new Promise(resolve => setTimeout(resolve, 400));
        
        const allUsages = this.getMockUsages();
        const newUsage: DesignUsage = {
          id: Math.max(...allUsages.map(u => u.id), 0) + 1,
          designId,
          productId,
          position,
          vendorId: 1, // ID vendeur simulé
          createdAt: new Date().toISOString(),
          isActive: true,
          colorVariation,
          view
        };
        
        allUsages.push(newUsage);
        this.saveMockUsages(allUsages);
        
        console.log('✅ Usage enregistré:', newUsage);
        return newUsage;
      }

      // Mode API (quand disponible)
      const response = await fetch(`${this.baseUrl}/designs/record-usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          designId,
          productId,
          position,
          colorVariation,
          view
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'enregistrement de l\'usage');
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'usage:', error);
      
      if (this.mockMode) {
        // En mode simulation, créer un usage de secours
        const fallbackUsage: DesignUsage = {
          id: Date.now(),
          designId,
          productId,
          position,
          vendorId: 1,
          createdAt: new Date().toISOString(),
          isActive: true,
          colorVariation,
          view
        };
        return fallbackUsage;
      }
      
      throw error;
    }
  }

  /**
   * 🆕 Active ou désactive le mode simulation
   */
  setMockMode(enabled: boolean): void {
    this.mockMode = enabled;
    console.log(`🔧 Mode simulation ${enabled ? 'activé' : 'désactivé'}`);
  }

  /**
   * 🆕 Réinitialise les données de simulation
   */
  resetMockData(): void {
    localStorage.removeItem('designUsages');
    console.log('🗑️ Données de simulation réinitialisées');
  }

  /**
   * Génère un message d'aide basé sur le statut de duplication
   */
  generateHelpMessage(status: DuplicateCheckResult['status']): string {
    switch (status) {
      case 'NEUTRAL':
        return 'Ce design n\'a jamais été utilisé sur ce produit. Vous pouvez le positionner librement.';
      case 'DUPLICATE_SAME_POSITION':
        return 'Ce design a déjà été utilisé avec cette position exacte sur ce produit. Vous ne pouvez pas le republier tel quel.';
      case 'DUPLICATE_DIFFERENT_POSITION':
        return 'Ce design a été utilisé pour ce produit, mais vous pouvez le repositionner pour le republier.';
      default:
        return 'Statut inconnu';
    }
  }

  /**
   * Calcule la similitude entre deux positions
   */
  calculatePositionSimilarity(pos1: DesignPosition, pos2: DesignPosition): number {
    const threshold = 5; // Seuil de tolérance en pixels ou pourcentage
    
    const diffX = Math.abs(pos1.x - pos2.x);
    const diffY = Math.abs(pos1.y - pos2.y);
    const diffWidth = Math.abs(pos1.width - pos2.width);
    const diffHeight = Math.abs(pos1.height - pos2.height);
    
    // Considérer comme identique si les différences sont inférieures au seuil
    return Math.max(diffX, diffY, diffWidth, diffHeight) <= threshold ? 1 : 0;
  }

  /**
   * Méthode locale pour simuler la vérification si le service backend n'est pas disponible
   */
  mockCheckDesignDuplicate(
    designId: number,
    productId: number,
    proposedPosition: DesignPosition,
    existingUsages: DesignUsage[] = []
  ): DuplicateCheckResult {
    const productUsages = existingUsages.filter(usage => 
      usage.productId === productId && usage.designId === designId && usage.isActive
    );

    if (productUsages.length === 0) {
      return {
        status: 'NEUTRAL',
        message: 'Ce design n\'a jamais été utilisé sur ce produit. Vous pouvez le positionner librement.',
        canPublish: true,
        canRepositionAndPublish: true
      };
    }

    // Vérifier si une position identique existe
    const samePositionUsage = productUsages.find(usage => 
      this.calculatePositionSimilarity(usage.position, proposedPosition) === 1
    );

    if (samePositionUsage) {
      return {
        status: 'DUPLICATE_SAME_POSITION',
        message: 'Ce design a déjà été utilisé avec cette position sur ce produit. Vous ne pouvez pas le republier tel quel.',
        canPublish: false,
        canRepositionAndPublish: true,
        conflictingUsage: samePositionUsage,
        suggestedAction: 'Modifiez la position du design pour pouvoir le republier.'
      };
    }

    // Design utilisé mais position différente
    return {
      status: 'DUPLICATE_DIFFERENT_POSITION',
      message: 'Ce design a été utilisé pour ce produit, mais vous pouvez le repositionner pour le republier.',
      canPublish: true,
      canRepositionAndPublish: true,
      conflictingUsage: productUsages[0],
      suggestedAction: 'Vous pouvez utiliser une nouvelle position pour ce design.'
    };
  }
}

export default new DesignDuplicateService(); 