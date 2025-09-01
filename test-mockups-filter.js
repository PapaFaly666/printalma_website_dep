// Script de test pour vérifier le filtrage des mockups
const testMockupsFilter = async () => {
  console.log('🔍 Test du filtrage des mockups (isReadyProduct: false)...');
  
  try {
    // Test 1: Produits avec isReadyProduct=false
    console.log('\n📡 Test 1: /api/products?isReadyProduct=false');
    const response1 = await fetch('/api/products?isReadyProduct=false');
    console.log('Status:', response1.status, response1.statusText);
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('Données reçues:', data1);
      
      if (Array.isArray(data1)) {
        const mockups = data1.filter(p => p.isReadyProduct === false);
        console.log('✅ Mockups avec isReadyProduct: false:', mockups.length);
        console.log('📋 Détails des mockups:', mockups.map(p => ({ 
          id: p.id, 
          name: p.name, 
          isReadyProduct: p.isReadyProduct 
        })));
        
        // Vérifier qu'il n'y a pas de produits avec isReadyProduct: true
        const readyProducts = data1.filter(p => p.isReadyProduct === true);
        if (readyProducts.length > 0) {
          console.warn('⚠️ ATTENTION: Produits prêts trouvés dans la réponse:', readyProducts.length);
          console.log('Produits prêts:', readyProducts.map(p => ({ 
            id: p.id, 
            name: p.name, 
            isReadyProduct: p.isReadyProduct 
          })));
        } else {
          console.log('✅ Aucun produit prêt trouvé dans la réponse (correct)');
        }
      }
    } else {
      console.error('Erreur HTTP:', response1.status, response1.statusText);
    }
    
    // Test 2: Tous les produits pour comparaison
    console.log('\n📡 Test 2: /api/products (tous les produits)');
    const response2 = await fetch('/api/products');
    console.log('Status:', response2.status, response2.statusText);
    
    if (response2.ok) {
      const data2 = await response2.json();
      console.log('Total des produits:', data2.length);
      
      if (Array.isArray(data2)) {
        const mockups = data2.filter(p => p.isReadyProduct === false);
        const readyProducts = data2.filter(p => p.isReadyProduct === true);
        
        console.log('📊 Répartition:');
        console.log('- Mockups (isReadyProduct: false):', mockups.length);
        console.log('- Produits prêts (isReadyProduct: true):', readyProducts.length);
        
        console.log('📋 Mockups disponibles:', mockups.map(p => ({ 
          id: p.id, 
          name: p.name, 
          isReadyProduct: p.isReadyProduct 
        })));
      }
    } else {
      console.error('Erreur HTTP:', response2.status, response2.statusText);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
};

// Exécuter le test
testMockupsFilter(); 
const testMockupsFilter = async () => {
  console.log('🔍 Test du filtrage des mockups (isReadyProduct: false)...');
  
  try {
    // Test 1: Produits avec isReadyProduct=false
    console.log('\n📡 Test 1: /api/products?isReadyProduct=false');
    const response1 = await fetch('/api/products?isReadyProduct=false');
    console.log('Status:', response1.status, response1.statusText);
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('Données reçues:', data1);
      
      if (Array.isArray(data1)) {
        const mockups = data1.filter(p => p.isReadyProduct === false);
        console.log('✅ Mockups avec isReadyProduct: false:', mockups.length);
        console.log('📋 Détails des mockups:', mockups.map(p => ({ 
          id: p.id, 
          name: p.name, 
          isReadyProduct: p.isReadyProduct 
        })));
        
        // Vérifier qu'il n'y a pas de produits avec isReadyProduct: true
        const readyProducts = data1.filter(p => p.isReadyProduct === true);
        if (readyProducts.length > 0) {
          console.warn('⚠️ ATTENTION: Produits prêts trouvés dans la réponse:', readyProducts.length);
          console.log('Produits prêts:', readyProducts.map(p => ({ 
            id: p.id, 
            name: p.name, 
            isReadyProduct: p.isReadyProduct 
          })));
        } else {
          console.log('✅ Aucun produit prêt trouvé dans la réponse (correct)');
        }
      }
    } else {
      console.error('Erreur HTTP:', response1.status, response1.statusText);
    }
    
    // Test 2: Tous les produits pour comparaison
    console.log('\n📡 Test 2: /api/products (tous les produits)');
    const response2 = await fetch('/api/products');
    console.log('Status:', response2.status, response2.statusText);
    
    if (response2.ok) {
      const data2 = await response2.json();
      console.log('Total des produits:', data2.length);
      
      if (Array.isArray(data2)) {
        const mockups = data2.filter(p => p.isReadyProduct === false);
        const readyProducts = data2.filter(p => p.isReadyProduct === true);
        
        console.log('📊 Répartition:');
        console.log('- Mockups (isReadyProduct: false):', mockups.length);
        console.log('- Produits prêts (isReadyProduct: true):', readyProducts.length);
        
        console.log('📋 Mockups disponibles:', mockups.map(p => ({ 
          id: p.id, 
          name: p.name, 
          isReadyProduct: p.isReadyProduct 
        })));
      }
    } else {
      console.error('Erreur HTTP:', response2.status, response2.statusText);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
};

// Exécuter le test
testMockupsFilter(); 
 
 
 
 
 