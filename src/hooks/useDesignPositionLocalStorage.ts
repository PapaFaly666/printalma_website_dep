import { useState, useEffect, useCallback, useRef } from 'react';
import { designPositionService, DesignPositionData } from '../services/DesignPositionService';

interface UseDesignPositionLocalStorageProps {
  vendorId: number;
  baseProductId: number;
  designId: number;
  debounceMs?: number;
}

interface Position {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface PreviewSelections {
  colors: any[];
  sizes: any[];
  price: number;
  stock: number;
}

interface UseDesignPositionLocalStorageReturn {
  position: Position;
  setPosition: (position: Position) => void;
  previewSelections: PreviewSelections;
  setPreviewSelections: (selections: PreviewSelections) => void;
  hasPosition: boolean;
  lastSaved: Date | null;
  savePosition: (position: Position, previewSelections?: PreviewSelections) => void;
  deletePosition: () => void;
  getAllDrafts: () => DesignPositionData[];
  cleanupOldDrafts: (maxAgeHours?: number) => number;
}

export const useDesignPositionLocalStorage = ({
  vendorId,
  baseProductId,
  designId,
  debounceMs = 300
}: UseDesignPositionLocalStorageProps): UseDesignPositionLocalStorageReturn => {
  const [position, setPosition] = useState<Position>({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0
  });
  
  const [previewSelections, setPreviewSelections] = useState<PreviewSelections>({
    colors: [],
    sizes: [],
    price: 25000,
    stock: 50
  });
  
  const [hasPosition, setHasPosition] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fonction de sauvegarde avec debounce
  const savePosition = useCallback((newPosition: Position, newPreviewSelections?: PreviewSelections) => {
    // Annuler le debounce précédent
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Programmer la sauvegarde après le délai
    debounceRef.current = setTimeout(() => {
      designPositionService.savePosition(
        vendorId,
        baseProductId,
        designId,
        newPosition,
        newPreviewSelections || previewSelections
      );
      
      setLastSaved(new Date());
      setHasPosition(true);
      console.log('💾 Position sauvegardée avec debounce:', newPosition);
    }, debounceMs);
  }, [vendorId, baseProductId, designId, debounceMs, previewSelections]);
  
  // Fonction de suppression
  const deletePosition = useCallback(() => {
    designPositionService.deletePosition(vendorId, baseProductId, designId);
    setHasPosition(false);
    setLastSaved(null);
    console.log('🗑️ Position supprimée');
  }, [vendorId, baseProductId, designId]);
  
  // Fonction pour récupérer tous les brouillons
  const getAllDrafts = useCallback(() => {
    return designPositionService.getAllDrafts();
  }, []);
  
  // Fonction de nettoyage
  const cleanupOldDrafts = useCallback((maxAgeHours: number = 24) => {
    return designPositionService.cleanupOldDrafts(maxAgeHours);
  }, []);
  
  // Fonction pour mettre à jour la position avec sauvegarde automatique
  const updatePosition = useCallback((newPosition: Position) => {
    setPosition(newPosition);
    savePosition(newPosition);
  }, [savePosition]);
  
  // Fonction pour mettre à jour les prévisualisations avec sauvegarde
  const updatePreviewSelections = useCallback((newPreviewSelections: PreviewSelections) => {
    setPreviewSelections(newPreviewSelections);
    savePosition(position, newPreviewSelections);
  }, [position, savePosition]);
  
  // Chargement initial depuis localStorage
  useEffect(() => {
    const savedData = designPositionService.loadPosition(vendorId, baseProductId, designId);
    
    if (savedData) {
      setPosition(savedData.position);
      setPreviewSelections(savedData.previewSelections || {
        colors: [],
        sizes: [],
        price: 25000,
        stock: 50
      });
      setHasPosition(true);
      setLastSaved(new Date(savedData.timestamp));
      console.log('📂 Position restaurée depuis localStorage:', savedData.position);
    } else {
      setHasPosition(false);
      setLastSaved(null);
      console.log('ℹ️ Aucune position sauvegardée trouvée');
    }
  }, [vendorId, baseProductId, designId]);
  
  // Nettoyage automatique des anciens brouillons au montage
  useEffect(() => {
    const cleaned = cleanupOldDrafts();
    if (cleaned > 0) {
      console.log(`🧹 ${cleaned} brouillons expirés nettoyés`);
    }
  }, [cleanupOldDrafts]);
  
  // Nettoyage du debounce au démontage
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  
  return {
    position,
    setPosition: updatePosition,
    previewSelections,
    setPreviewSelections: updatePreviewSelections,
    hasPosition,
    lastSaved,
    savePosition,
    deletePosition,
    getAllDrafts,
    cleanupOldDrafts
  };
};

export default useDesignPositionLocalStorage; 