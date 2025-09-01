import { designPositionManager, DesignPosition } from '../utils/designPositionManager';

// Proxy simple qui unifie la nouvelle API directe
// et cache la complexité du DesignPositionManager.


/**
 * Charge la position d'un design pour un VendorProduct donné.
 * Renvoie null si aucune position n'est enregistrée.
 */
export async function getDesignPosition(vendorProductId: number, designId: number): Promise<DesignPosition | null> {
  return designPositionManager.getPosition(vendorProductId, designId);
}

/**
 * Sauvegarde la position d'un design. Le DesignPositionManager gère le cache,
 * les retries et les éventuels fallbacks (legacy / auto-fix).
 */
export async function saveDesignPosition(vendorProductId: number, designId: number, position: DesignPosition): Promise<void> {
  await designPositionManager.savePosition(vendorProductId, designId, position);
} 