// sync-localStorage-to-api.js
// Script pour synchroniser les données localStorage avec l'API

const API_BASE_URL = 'http://localhost:3004';

// Fonction pour obtenir les headers d'authentification
function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Fonction pour convertir localStorage (pixels) vers API (ratios)
function convertLocalStorageToApi(localPosition, referenceSize = 200) {
  const x = (localPosition.x / referenceSize) + 0.5;
  const y = (localPosition.y / referenceSize) + 0.5;
  
  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
    scale: localPosition.scale,
    rotation: localPosition.rotation
  };
}

// Fonction pour convertir API (ratios) vers localStorage (pixels)
function convertApiToLocalStorage(apiPosition, referenceSize = 200) {
  const x = (apiPosition.x - 0.5) * referenceSize;
  const y = (apiPosition.y - 0.5) * referenceSize;
  
  return {
    x: Math.round(x),
    y: Math.round(y),
    scale: apiPosition.scale,
    rotation: apiPosition.rotation
  };
}

// Fonction pour analyser les données localStorage
function analyzeLocalStorage() {
  const designPositions = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('design_position_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        const parts = key.split('_');
        
        if (parts.length === 5) {
          const [, , vendorId, baseProductId, designId] = parts;
          designPositions.push({
            key,
            vendorId: parseInt(vendorId),
            baseProductId: parseInt(baseProductId),
            designId: parseInt(designId),
            data: data
          });
        }
      } catch (e) {
        console.warn(`Erreur parsing ${key}:`, e);
      }
    }
  }
  
  return designPositions;
}

// Fonction pour récupérer les produits depuis l'API
async function fetchVendorProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/vendor/products?limit=100&offset=0`, {
      credentials: 'include',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.data || !result.data.products) {
      throw new Error('Format de réponse invalide');
    }

    return result.data.products;
  } catch (error) {
    console.error('Erreur chargement produits:', error);
    return [];
  }
}

// Fonction pour synchroniser une position
async function syncPosition(vendorProductId, designId, localPosition) {
  try {
    // Convertir les pixels localStorage en ratios API
    const apiPosition = convertLocalStorageToApi(localPosition);
    
    console.log(`🔄 Synchronisation produit ${vendorProductId}, design ${designId}:`, {
      localStorage: localPosition,
      api: apiPosition
    });

    // Sauvegarder via l'API
    const response = await fetch(`${API_BASE_URL}/vendor/products/${vendorProductId}/design-position`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        designId: designId,
        position: apiPosition
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Position synchronisée pour produit ${vendorProductId}`);
      return true;
    } else {
      console.error(`❌ Erreur API pour produit ${vendorProductId}:`, result.message);
      return false;
    }
  } catch (error) {
    console.error(`❌ Erreur synchronisation produit ${vendorProductId}:`, error);
    return false;
  }
}

// Fonction principale de synchronisation
async function syncAllPositions() {
  console.log('🚀 Début de la synchronisation localStorage → API');
  
  // 1. Analyser localStorage
  const localStoragePositions = analyzeLocalStorage();
  console.log(`📋 ${localStoragePositions.length} positions trouvées dans localStorage`);
  
  if (localStoragePositions.length === 0) {
    console.log('ℹ️ Aucune position à synchroniser');
    return;
  }
  
  // 2. Récupérer les produits API
  const apiProducts = await fetchVendorProducts();
  console.log(`📋 ${apiProducts.length} produits trouvés dans l'API`);
  
  // 3. Synchroniser chaque position
  let syncCount = 0;
  let errorCount = 0;
  
  for (const localPos of localStoragePositions) {
    // Trouver le produit correspondant dans l'API
    const apiProduct = apiProducts.find(p => 
      p.adminProduct.id === localPos.baseProductId && 
      p.designId === localPos.designId
    );
    
    if (!apiProduct) {
      console.warn(`⚠️ Produit non trouvé dans l'API: baseProductId=${localPos.baseProductId}, designId=${localPos.designId}`);
      errorCount++;
      continue;
    }
    
    // Vérifier si la position existe déjà dans l'API
    const hasApiPosition = apiProduct.designPositions && apiProduct.designPositions.length > 0;
    
    if (hasApiPosition) {
      const apiPos = apiProduct.designPositions[0].position;
      const localPosConverted = convertLocalStorageToApi(localPos.data.position);
      
      // Comparer les positions (tolérance de 0.01)
      const tolerance = 0.01;
      const isSynced = 
        Math.abs(apiPos.x - localPosConverted.x) < tolerance &&
        Math.abs(apiPos.y - localPosConverted.y) < tolerance &&
        Math.abs(apiPos.scale - localPosConverted.scale) < tolerance &&
        Math.abs(apiPos.rotation - localPosConverted.rotation) < tolerance;
      
      if (isSynced) {
        console.log(`✅ Produit ${apiProduct.id} déjà synchronisé`);
        syncCount++;
        continue;
      } else {
        console.log(`🔄 Mise à jour nécessaire pour produit ${apiProduct.id}:`, {
          api: apiPos,
          localStorage: localPosConverted
        });
      }
    }
    
    // Synchroniser la position
    const success = await syncPosition(apiProduct.id, localPos.designId, localPos.data.position);
    
    if (success) {
      syncCount++;
    } else {
      errorCount++;
    }
    
    // Pause pour éviter de surcharger l'API
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`✅ Synchronisation terminée: ${syncCount} succès, ${errorCount} erreurs`);
}

// Fonction pour vérifier l'état de synchronisation
async function checkSyncStatus() {
  console.log('🔍 Vérification de l\'état de synchronisation');
  
  const localStoragePositions = analyzeLocalStorage();
  const apiProducts = await fetchVendorProducts();
  
  console.log('📊 État de synchronisation:');
  console.log(`- LocalStorage: ${localStoragePositions.length} positions`);
  console.log(`- API: ${apiProducts.filter(p => p.designPositions && p.designPositions.length > 0).length} positions`);
  
  const syncStatus = [];
  
  for (const localPos of localStoragePositions) {
    const apiProduct = apiProducts.find(p => 
      p.adminProduct.id === localPos.baseProductId && 
      p.designId === localPos.designId
    );
    
    if (!apiProduct) {
      syncStatus.push({
        key: localPos.key,
        status: 'PRODUIT_NON_TROUVE',
        localStorage: localPos.data.position,
        api: null
      });
      continue;
    }
    
    const hasApiPosition = apiProduct.designPositions && apiProduct.designPositions.length > 0;
    
    if (!hasApiPosition) {
      syncStatus.push({
        key: localPos.key,
        productId: apiProduct.id,
        status: 'LOCAL_SEULEMENT',
        localStorage: localPos.data.position,
        api: null
      });
    } else {
      const apiPos = apiProduct.designPositions[0].position;
      const localPosConverted = convertLocalStorageToApi(localPos.data.position);
      
      syncStatus.push({
        key: localPos.key,
        productId: apiProduct.id,
        status: 'SYNCHRONISE',
        localStorage: localPos.data.position,
        localStorageConverted: localPosConverted,
        api: apiPos
      });
    }
  }
  
  console.table(syncStatus);
  return syncStatus;
}

// Exporter les fonctions pour utilisation dans la console
window.syncLocalStorageToApi = {
  sync: syncAllPositions,
  check: checkSyncStatus,
  analyzeLocalStorage,
  convertLocalStorageToApi,
  convertApiToLocalStorage
};

console.log('🔧 Utilitaires de synchronisation chargés dans window.syncLocalStorageToApi');
console.log('Utilisation:');
console.log('- window.syncLocalStorageToApi.check() : Vérifier l\'état');
console.log('- window.syncLocalStorageToApi.sync() : Synchroniser tout');
console.log('- window.syncLocalStorageToApi.analyzeLocalStorage() : Analyser localStorage'); 