/**
 * Service de composition d'images - Intégration design + mockup
 * Haute qualité pour éviter la pixellisation
 */

export interface Delimitation {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface CompositionOptions {
  canvasWidth?: number;
  canvasHeight?: number;
  quality?: number;
  format?: 'png' | 'jpeg' | 'webp';
  smoothing?: boolean;
}

/**
 * Compose le design avec un mockup selon les délimitations
 */
export const composeDesignWithMockup = async (
  designImageUrl: string,
  mockupImageUrl: string,
  delimitations: Delimitation[],
  options: CompositionOptions = {}
): Promise<string> => {
  const {
    canvasWidth = 1200,    // ✅ Sortie demandée 1200px
    canvasHeight = 1200,   // ✅ Sortie demandée 1200px  
    quality = 1.0,         // ✅ Qualité maximale
    format = 'png',        // ✅ Format sans perte
    smoothing = true       // ✅ Anti-aliasing
  } = options;

  return new Promise((resolve, reject) => {
    console.log('🎨 Début composition design + mockup...');
    console.log('📐 Résolution canvas:', canvasWidth, 'x', canvasHeight);
    console.log('🖼️ Délimitations:', delimitations.length);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Impossible de créer le contexte canvas'));
      return;
    }

    // Configuration haute qualité
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    // Optimisations de rendu
    ctx.imageSmoothingEnabled = smoothing;
    if (smoothing) {
      ctx.imageSmoothingQuality = 'high';
    }

    const mockupImg = new Image();
    const designImg = new Image();
    
    // Configuration CORS
    mockupImg.crossOrigin = 'anonymous';
    designImg.crossOrigin = 'anonymous';

    let imagesLoaded = 0;
    const totalImages = 2;

    const checkComplete = () => {
      imagesLoaded++;
      if (imagesLoaded === totalImages) {
        performComposition();
      }
    };

    const performComposition = () => {
      try {
        console.log('🖌️ Début composition...');
        
        // 1. Dessiner le mockup en arrière-plan (pleine résolution)
        ctx.drawImage(mockupImg, 0, 0, canvasWidth, canvasHeight);
        console.log('✅ Mockup dessiné');

        // 2. Appliquer le design selon chaque délimitation
        delimitations.forEach((delim, index) => {
          console.log(`🎯 Délimitation ${index + 1}:`, delim);
          
          // Convertir pourcentages en pixels
          const x = (delim.x / 100) * canvasWidth;
          const y = (delim.y / 100) * canvasHeight;
          const width = (delim.width / 100) * canvasWidth;
          const height = (delim.height / 100) * canvasHeight;
          
          console.log(`📍 Position: ${x}, ${y} | Taille: ${width}x${height}`);

          // Sauvegarder l'état du contexte
          ctx.save();
          
          // Appliquer rotation si nécessaire
          if (delim.rotation && delim.rotation !== 0) {
            const centerX = x + width / 2;
            const centerY = y + height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate((delim.rotation * Math.PI) / 180);
            ctx.translate(-centerX, -centerY);
          }
          
          // Dessiner le design avec haute qualité
          ctx.drawImage(designImg, x, y, width, height);
          
          // Restaurer l'état du contexte
          ctx.restore();
        });

        console.log('✅ Design intégré dans toutes les délimitations');

        // 3. Exporter en haute qualité
        const mimeType = format === 'jpeg' ? 'image/jpeg' : 
                        format === 'webp' ? 'image/webp' : 'image/png';
        
        const finalImage = canvas.toDataURL(mimeType, quality);
        
        console.log('✅ Composition terminée');
        console.log('📊 Taille finale:', finalImage.length, 'caractères');
        
        resolve(finalImage);
        
      } catch (error) {
        console.error('❌ Erreur lors de la composition:', error);
        reject(error);
      }
    };

    // Gestion des erreurs de chargement
    mockupImg.onerror = () => {
      console.error('❌ Erreur chargement mockup:', mockupImageUrl);
      reject(new Error('Erreur chargement image mockup'));
    };

    designImg.onerror = () => {
      console.error('❌ Erreur chargement design:', designImageUrl);
      reject(new Error('Erreur chargement image design'));
    };

    // Chargement des images
    mockupImg.onload = () => {
      console.log('✅ Mockup chargé:', mockupImg.width, 'x', mockupImg.height);
      checkComplete();
    };

    designImg.onload = () => {
      console.log('✅ Design chargé:', designImg.width, 'x', designImg.height);
      checkComplete();
    };

    // Démarrer le chargement
    console.log('📥 Chargement mockup...');
    mockupImg.src = mockupImageUrl;
    
    console.log('📥 Chargement design...');
    designImg.src = designImageUrl;
  });
};

/**
 * Compose le design avec plusieurs mockups (batch)
 */
export const composeDesignWithMultipleMockups = async (
  designImageUrl: string,
  mockupsData: Array<{
    mockupUrl: string;
    colorName: string;
    delimitations: Delimitation[];
  }>,
  options: CompositionOptions = {}
): Promise<Record<string, string>> => {
  console.log('🎨 Composition batch:', mockupsData.length, 'mockups');
  
  const results: Record<string, string> = {};
  
  // Traitement séquentiel pour éviter la surcharge mémoire
  for (const mockupData of mockupsData) {
    try {
      console.log(`🔄 Traitement ${mockupData.colorName}...`);
      
      const composedImage = await composeDesignWithMockup(
        designImageUrl,
        mockupData.mockupUrl,
        mockupData.delimitations,
        options
      );
      
      results[mockupData.colorName] = composedImage;
      console.log(`✅ ${mockupData.colorName} terminé`);
      
    } catch (error: unknown) {
      console.error(`❌ Erreur ${mockupData.colorName}:`, error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Erreur composition ${mockupData.colorName}: ${message}`);
    }
  }
  
  console.log('✅ Composition batch terminée');
  return results;
};

/**
 * Optimise une image pour l'upload (compression intelligente)
 */
export const optimizeImageForUpload = async (
  imageDataUrl: string,
  maxWidth: number = 1200,
  quality: number = 0.95
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Contexte canvas non disponible'));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Calculer les nouvelles dimensions
      const aspectRatio = img.height / img.width;
      const newWidth = Math.min(img.width, maxWidth);
      const newHeight = newWidth * aspectRatio;
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Configuration qualité
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Redimensionner avec haute qualité
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Exporter optimisé
      const optimizedImage = canvas.toDataURL('image/webp', quality);
      resolve(optimizedImage);
    };
    
    img.onerror = () => reject(new Error('Erreur chargement image'));
    img.src = imageDataUrl;
  });
};

/**
 * Convertit un blob URL en base64
 */
export const blobToBase64 = async (blobUrl: string): Promise<string> => {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Valide qu'une image est de bonne qualité
 */
export const validateImageQuality = (
  imageDataUrl: string,
  minWidth: number = 1000,
  minHeight: number = 1000
): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      const isGoodQuality = img.width >= minWidth && img.height >= minHeight;
      console.log(`🔍 Validation qualité: ${img.width}x${img.height} | Valide: ${isGoodQuality}`);
      resolve(isGoodQuality);
    };
    
    img.onerror = () => resolve(false);
    img.src = imageDataUrl;
  });
};

export default {
  composeDesignWithMockup,
  composeDesignWithMultipleMockups,
  optimizeImageForUpload,
  blobToBase64,
  validateImageQuality
}; 