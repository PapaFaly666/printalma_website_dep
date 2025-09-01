class ColorManagementService {
  constructor() {
    this.cache = new Map(); // Cache des produits
    this.timestampMapping = new Map(); // Mapping timestamp → ID réel
  }

  // Récupérer et mettre en cache les données du produit
  async getProductWithCache(productId) {
    if (this.cache.has(productId)) {
      return this.cache.get(productId);
    }

    const response = await fetch(`/products/${productId}`);
    if (!response.ok) {
      throw new Error(`Produit ${productId} non trouvé`);
    }

    const product = await response.json();
    this.cache.set(productId, product);
    return product;
  }

  // Détecter automatiquement l'ID de couleur
  detectColorId(colorVariation, product) {
    console.log('🔍 Détection couleur pour:', colorVariation);

    // 1. Si c'est un objet avec un ID valide
    if (typeof colorVariation === 'object' && colorVariation.id) {
      const existingColor = product.colorVariations.find(cv => cv.id === colorVariation.id);
      if (existingColor) {
        console.log('✅ ID direct trouvé:', existingColor.id);
        return existingColor.id;
      }
    }

    // 2. Si c'est un objet avec nom/code couleur
    if (typeof colorVariation === 'object' && colorVariation.name) {
      const existingColor = product.colorVariations.find(cv => 
        cv.name.toLowerCase() === colorVariation.name.toLowerCase() ||
        cv.colorCode === colorVariation.colorCode
      );
      if (existingColor) {
        console.log('✅ Couleur trouvée par nom/code:', existingColor.id);
        return existingColor.id;
      }
    }

    // 3. Si c'est un timestamp, utiliser le mapping intelligent
    if (typeof colorVariation === 'number' && colorVariation > 1000000000000) {
      return this.mapTimestampToColorId(colorVariation, product.colorVariations);
    }

    // 4. Si c'est un ID numérique direct
    if (typeof colorVariation === 'number' && colorVariation < 1000000) {
      const existingColor = product.colorVariations.find(cv => cv.id === colorVariation);
      if (existingColor) {
        console.log('✅ ID numérique trouvé:', existingColor.id);
        return existingColor.id;
      }
    }

    // 5. Fallback : première couleur disponible
    const fallbackColor = product.colorVariations[0];
    if (fallbackColor) {
      console.log('⚠️ Utilisation couleur par défaut:', fallbackColor.id);
      return fallbackColor.id;
    }

    throw new Error('Aucune couleur disponible pour ce produit');
  }

  // Mapping intelligent timestamp → ID de couleur
  mapTimestampToColorId(timestamp, colorVariations) {
    if (!colorVariations || colorVariations.length === 0) {
      throw new Error('Aucune couleur disponible');
    }

    // Vérifier si on a déjà mappé ce timestamp
    if (this.timestampMapping.has(timestamp)) {
      const mappedId = this.timestampMapping.get(timestamp);
      console.log('🔄 Timestamp déjà mappé:', timestamp, '→', mappedId);
      return mappedId;
    }

    // Créer un mapping déterministe basé sur le timestamp
    const index = Math.abs(timestamp % colorVariations.length);
    const selectedColor = colorVariations[index];
    
    // Sauvegarder le mapping
    this.timestampMapping.set(timestamp, selectedColor.id);
    
    console.log(`🔄 Nouveau mapping: timestamp ${timestamp} → index ${index} → couleur ${selectedColor.name} (ID: ${selectedColor.id})`);
    
    return selectedColor.id;
  }

  // Upload intelligent avec détection automatique
  async uploadColorImage(productId, colorVariation, imageFile) {
    console.log('🚀 Upload intelligent pour:', colorVariation);

    try {
      // 1. Récupérer les données du produit
      const product = await this.getProductWithCache(productId);
      
      // 2. Détecter l'ID de couleur
      const colorId = this.detectColorId(colorVariation, product);
      
      console.log('🎯 ID de couleur détecté:', colorId);
      
      // 3. Upload avec l'ID correct
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await fetch(`/products/upload-color-image/${productId}/${colorId}`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      const result = await response.json();
      console.log('✅ Upload réussi:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Erreur upload intelligent:', error);
      throw error;
    }
  }

  // Nettoyer le cache
  clearCache(productId = null) {
    if (productId) {
      this.cache.delete(productId);
    } else {
      this.cache.clear();
    }
    this.timestampMapping.clear();
  }
}

// Instance singleton
export const colorManagementService = new ColorManagementService(); 