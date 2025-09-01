import { designPositionManager, DesignPosition } from './designPositionManager';

interface LegacyPositionData {
  [key: string]: DesignPosition;
}

export class MigrationHelper {
  private static hasRunMigration = false;

  /**
   * Migration one-shot des données existantes
   */
  static async migrateExistingPositions(): Promise<void> {
    if (this.hasRunMigration) return;
    
    console.log('🔄 Migration des positions existantes...');
    
    let migrated = 0;
    let errors = 0;

    try {
      // Migration depuis localStorage principal
      const localStorageResult = await this.migrateFromLocalStorage('designPositions');
      migrated += localStorageResult.migrated;
      errors += localStorageResult.errors;
      
      // Migration depuis les transformations par produit
      const transformsResult = await this.migrateFromProductTransforms();
      migrated += transformsResult.migrated;
      errors += transformsResult.errors;
      
      console.log(`🎉 Migration terminée: ${migrated} réussies, ${errors} erreurs`);
      
      // Marquer comme migré
      this.hasRunMigration = true;
      localStorage.setItem('positionMigrationDone', 'true');
      
    } catch (error) {
      console.error('❌ Erreur générale migration:', error);
    }
  }

  /**
   * Migration depuis localStorage principal
   */
  private static async migrateFromLocalStorage(key: string): Promise<{ migrated: number; errors: number }> {
    const existingData = localStorage.getItem(key);
    if (!existingData) return { migrated: 0, errors: 0 };

    let migrated = 0;
    let errors = 0;

    try {
      const positions: LegacyPositionData = JSON.parse(existingData);
      
      for (const [positionKey, position] of Object.entries(positions)) {
        try {
          const [productId, designId] = positionKey.split('-').map(Number);
          
          if (productId && designId && position && typeof position === 'object') {
            await designPositionManager.savePosition(productId, designId, position);
            migrated++;
            console.log(`✅ Migré localStorage: ${positionKey}`);
          }
        } catch (error) {
          errors++;
          console.error(`❌ Erreur migration ${positionKey}:`, error);
        }
      }
      
      // Nettoyer après migration réussie
      if (errors === 0) {
        localStorage.removeItem(key);
        console.log(`🧹 ${key} nettoyé`);
      }
      
    } catch (parseError) {
      console.error('❌ Erreur parsing localStorage:', parseError);
      errors++;
    }

    return { migrated, errors };
  }

  /**
   * Migration depuis les transformations individuelles par produit
   */
  private static async migrateFromProductTransforms(): Promise<{ migrated: number; errors: number }> {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('design-transforms-'));
    
    let migrated = 0;
    let errors = 0;
    
    for (const key of keys) {
      try {
        const data = localStorage.getItem(key);
        if (!data) continue;
        
        const transforms = JSON.parse(data);
        const productIdMatch = key.match(/design-transforms-(\d+)/);
        
        if (productIdMatch && transforms) {
          const productId = parseInt(productIdMatch[1]);
          
          // Chercher les positions dans les transformations
          for (const [index, transform] of Object.entries(transforms)) {
            if (index === '0' && transform && typeof transform === 'object') {
              const t = transform as any;
              if (t.x !== undefined && t.y !== undefined) {
                const position: DesignPosition = {
                  x: t.x,
                  y: t.y,
                  scale: t.scale || 1,
                  rotation: t.rotation || 0,
                  constraints: { adaptive: true }
                };
                
                // Utiliser designId 1 par défaut pour les anciennes données
                await designPositionManager.savePosition(productId, 1, position);
                migrated++;
                console.log(`✅ Migré transforms: produit ${productId}`);
              }
            }
          }
        }
        
      } catch (error) {
        errors++;
        console.error(`❌ Erreur migration transforms ${key}:`, error);
      }
    }

    return { migrated, errors };
  }

  /**
   * Vérifie si la migration a déjà été effectuée
   */
  static hasMigrationRun(): boolean {
    return this.hasRunMigration || localStorage.getItem('positionMigrationDone') === 'true';
  }

  /**
   * Force une nouvelle migration (pour debug)
   */
  static resetMigration(): void {
    this.hasRunMigration = false;
    localStorage.removeItem('positionMigrationDone');
    console.log('🔄 Migration reset - prête à être relancée');
  }

  /**
   * Nettoyage de toutes les anciennes données (ATTENTION!)
   */
  static cleanupLegacyData(): void {
    const keysToClean = [
      'designPositions',
      ...Object.keys(localStorage).filter(key => key.startsWith('design-transforms-'))
    ];
    
    let cleaned = 0;
    keysToClean.forEach(key => {
      localStorage.removeItem(key);
      cleaned++;
    });
    
    console.log(`🧹 ${cleaned} anciennes clés nettoyées`);
  }
} 
 
 