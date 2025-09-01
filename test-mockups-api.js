// Script de test pour l'API des mockups
const testMockupsAPI = async () => {
  console.log('🔍 Test de l\'API des mockups...');
  
  try {
    // Test 1: Produits avec isReadyProduct=false
    console.log('\n📡 Test 1: /api/products?isReadyProduct=false');
    const response1 = await fetch('/api/products?isReadyProduct=false');
    console.log('Status:', response1.status, response1.statusText);
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('Données reçues:', data1);
      console.log('Type de données:', typeof data1);
      console.log('Est un tableau:', Array.isArray(data1));
      if (data1 && typeof data1 === 'object') {
        console.log('Clés disponibles:', Object.keys(data1));
      }
    } else {
      console.error('Erreur HTTP:', response1.status, response1.statusText);
    }
    
    // Test 2: Tous les produits
    console.log('\n📡 Test 2: /api/products');
    const response2 = await fetch('/api/products');
    console.log('Status:', response2.status, response2.statusText);
    
    if (response2.ok) {
      const data2 = await response2.json();
      console.log('Données reçues:', data2);
      console.log('Type de données:', typeof data2);
      console.log('Est un tableau:', Array.isArray(data2));
      
      if (Array.isArray(data2)) {
        const mockups = data2.filter(p => p.isReadyProduct === false);
        console.log('Mockups trouvés:', mockups.length);
        console.log('Mockups:', mockups.map(p => ({ id: p.id, name: p.name, isReadyProduct: p.isReadyProduct })));
      }
    } else {
      console.error('Erreur HTTP:', response2.status, response2.statusText);
    }
    
    // Test 3: Produits avec isReadyProduct=true
    console.log('\n📡 Test 3: /api/products?isReadyProduct=true');
    const response3 = await fetch('/api/products?isReadyProduct=true');
    console.log('Status:', response3.status, response3.statusText);
    
    if (response3.ok) {
      const data3 = await response3.json();
      console.log('Données reçues:', data3);
      console.log('Type de données:', typeof data3);
      console.log('Est un tableau:', Array.isArray(data3));
    } else {
      console.error('Erreur HTTP:', response3.status, response3.statusText);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
};

// Exécuter le test
testMockupsAPI(); 
const testMockupsAPI = async () => {
  console.log('🔍 Test de l\'API des mockups...');
  
  try {
    // Test 1: Produits avec isReadyProduct=false
    console.log('\n📡 Test 1: /api/products?isReadyProduct=false');
    const response1 = await fetch('/api/products?isReadyProduct=false');
    console.log('Status:', response1.status, response1.statusText);
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('Données reçues:', data1);
      console.log('Type de données:', typeof data1);
      console.log('Est un tableau:', Array.isArray(data1));
      if (data1 && typeof data1 === 'object') {
        console.log('Clés disponibles:', Object.keys(data1));
      }
    } else {
      console.error('Erreur HTTP:', response1.status, response1.statusText);
    }
    
    // Test 2: Tous les produits
    console.log('\n📡 Test 2: /api/products');
    const response2 = await fetch('/api/products');
    console.log('Status:', response2.status, response2.statusText);
    
    if (response2.ok) {
      const data2 = await response2.json();
      console.log('Données reçues:', data2);
      console.log('Type de données:', typeof data2);
      console.log('Est un tableau:', Array.isArray(data2));
      
      if (Array.isArray(data2)) {
        const mockups = data2.filter(p => p.isReadyProduct === false);
        console.log('Mockups trouvés:', mockups.length);
        console.log('Mockups:', mockups.map(p => ({ id: p.id, name: p.name, isReadyProduct: p.isReadyProduct })));
      }
    } else {
      console.error('Erreur HTTP:', response2.status, response2.statusText);
    }
    
    // Test 3: Produits avec isReadyProduct=true
    console.log('\n📡 Test 3: /api/products?isReadyProduct=true');
    const response3 = await fetch('/api/products?isReadyProduct=true');
    console.log('Status:', response3.status, response3.statusText);
    
    if (response3.ok) {
      const data3 = await response3.json();
      console.log('Données reçues:', data3);
      console.log('Type de données:', typeof data3);
      console.log('Est un tableau:', Array.isArray(data3));
    } else {
      console.error('Erreur HTTP:', response3.status, response3.statusText);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
};

// Exécuter le test
testMockupsAPI(); 
 
 
 
 
 